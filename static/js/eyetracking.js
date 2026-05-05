document.addEventListener('DOMContentLoaded', () => {

    // 1. UI Elements Bindings
    const optFineTune = document.getElementById('optFineTune');
    const optOptimize = document.getElementById('optOptimize');
    const fineTuneControls = document.getElementById('fineTuneControls');
    
    // Parameters (existing)
    const paramSensitivity = document.getElementById('paramSensitivity');
    const paramBaselineY = document.getElementById('paramBaselineY');
    const paramScaleX = document.getElementById('paramScaleX');
    const paramTrailFreq = document.getElementById('paramTrailFreq');
    const paramShowArrow = document.getElementById('paramShowArrow');
    const paramShowDonut = document.getElementById('paramShowDonut');
    const paramPreserveAudio = document.getElementById('paramPreserveAudio');
    // Parameters (new - advanced)
    const paramAutoScale = document.getElementById('paramAutoScale');
    const paramHeadPose = document.getElementById('paramHeadPose');
    const paramBlinkEAR = document.getElementById('paramBlinkEAR');
    const paramSmoothing = document.getElementById('paramSmoothing');
    const paramFixationThreshold = document.getElementById('paramFixationThreshold');
    const paramShowFixation = document.getElementById('paramShowFixation');
    const paramCamOffsetX = document.getElementById('paramCamOffsetX');
    const paramCamOffsetY = document.getElementById('paramCamOffsetY');
    
    // Labels
    const valSensitivity = document.getElementById('valSensitivity');
    const valBaseline = document.getElementById('valBaseline');
    const valScaleX = document.getElementById('valScaleX');
    const valTrailFreq = document.getElementById('valTrailFreq');
    const valBlinkEAR = document.getElementById('valBlinkEAR');
    const valSmoothing = document.getElementById('valSmoothing');
    const valFixation = document.getElementById('valFixation');
    const valCamOffsetX = document.getElementById('valCamOffsetX');
    const valCamOffsetY = document.getElementById('valCamOffsetY');

    // ── Processing Pipeline State ──
    let gazeHistory = [];          // smoothing buffer: [{x, y}, ...]
    let lastValidGaze = null;      // for interpolation on failed frames
    let prevGazeScreen = null;     // for fixation velocity calc
    let referenceFaceW = null;     // baseline face width for distance normalization
    let currentFixation = true;    // true = fixation, false = saccade
    let autoMinX = 0.5, autoMaxX = 0.5; // for dynamic auto-scaling
    let autoMinY = 0.5, autoMaxY = 0.5;
    let globalIsFixation = true;
    let currentGazeScreen = { x: 0, y: 0 };

    optFineTune.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (optOptimize) optOptimize.checked = false;
            fineTuneControls.style.opacity = '1';
            fineTuneControls.style.pointerEvents = 'auto';
        } else {
            if (optOptimize) optOptimize.checked = true;
            fineTuneControls.style.opacity = '0.5';
            fineTuneControls.style.pointerEvents = 'none';
        }
    });

    if (optOptimize) {
        optOptimize.addEventListener('change', (e) => {
            if (e.target.checked) {
                optFineTune.checked = false;
                optFineTune.dispatchEvent(new Event('change'));
            } else {
                optFineTune.checked = true;
                optFineTune.dispatchEvent(new Event('change'));
            }
        });
    }

    paramSensitivity.addEventListener('input', (e) => { valSensitivity.innerText = e.target.value; updateFaceMeshConfig(); });
    paramBaselineY.addEventListener('input', (e) => valBaseline.innerText = e.target.value);
    paramScaleX.addEventListener('input', (e) => valScaleX.innerText = e.target.value);
    if (paramTrailFreq) paramTrailFreq.addEventListener('input', (e) => valTrailFreq.innerText = e.target.value);
    paramBlinkEAR.addEventListener('input', (e) => valBlinkEAR.innerText = e.target.value);
    paramSmoothing.addEventListener('input', (e) => valSmoothing.innerText = e.target.value);
    paramFixationThreshold.addEventListener('input', (e) => valFixation.innerText = e.target.value);
    paramCamOffsetX.addEventListener('input', (e) => valCamOffsetX.innerText = e.target.value);
    paramCamOffsetY.addEventListener('input', (e) => valCamOffsetY.innerText = e.target.value);


    // 2. Video Upload Handlers
    const faceUpload = document.getElementById('faceUpload');
    const screenUpload = document.getElementById('screenUpload');
    const faceVideo = document.getElementById('faceVideo');
    const screenVideo = document.getElementById('mainVideo');
    const faceCanvas = document.getElementById('faceTrackingCanvas');
    const eyeCanvas = document.getElementById('eyeTrackingCanvas');
    const faceCtx = faceCanvas.getContext('2d', { willReadFrequently: true });
    const eyeCtx = eyeCanvas.getContext('2d', { willReadFrequently: true });

    function checkBothVideosReady() {
        const btnRecord = document.getElementById('btnRecord');
        const faceReady = faceVideo.src && faceVideo.src !== window.location.href;
        const screenReady = screenVideo.src && screenVideo.src !== window.location.href;
        
        if (faceReady && screenReady) {
            btnRecord.classList.add('btn-ready');
        } else {
            btnRecord.classList.remove('btn-ready');
        }
    }

    faceVideo.addEventListener('loadeddata', checkBothVideosReady);
    screenVideo.addEventListener('loadeddata', checkBothVideosReady);

    faceUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            faceVideo.src = URL.createObjectURL(file);
            faceVideo.style.visibility = 'visible';
            faceVideo.load();
            const overlay = document.getElementById('faceOverlay');
            if (overlay) overlay.style.display = 'none';
            startPupilDetection(); // Start tracking immediately when face video is available!
            checkBothVideosReady();
        }
    });

    screenUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            screenVideo.src = URL.createObjectURL(file);
            screenVideo.style.visibility = 'visible';
            screenVideo.load();
            const overlay = document.getElementById('screenOverlay');
            if (overlay) overlay.style.display = 'none';
            checkBothVideosReady();
        }
    });

    // Handle Global Play/Pause
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', () => {
        if (faceVideo.paused && screenVideo.paused) {
            faceVideo.play();
            screenVideo.play();
            playPauseBtn.innerText = 'Pause';
        } else {
            faceVideo.pause();
            screenVideo.pause();
            playPauseBtn.innerText = 'Play';
        }
    });

    // 3. Eye Tracking Engine
    let faceMesh = null;
    let eyeTrails = [];
    let lastTrailTime = 0;
    let mpTotalFrames = 0;
    let mpDetectedFrames = 0;

    async function initFaceMesh() {
        if (!window.FaceMesh) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
            document.head.appendChild(script);
            await new Promise((resolve) => { script.onload = resolve; });
        }
        
        faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        
        updateFaceMeshConfig();

        faceMesh.onResults((results) => {
            mpTotalFrames++;
            const diag = document.getElementById('trackingDiagnostics');

            if (!results.multiFaceLandmarks || !results.multiFaceLandmarks[0]) {
                // No face detected – use last valid gaze for continuity
                if (lastValidGaze) {
                    const { gazeX, gazeY } = lastValidGaze;
                    // Use interpolation for diagnostics display
                    if (diag) diag.innerText = `Eye Tracking: No face (${mpDetectedFrames}/${mpTotalFrames}) – using last gaze (${gazeX.toFixed(2)}, ${gazeY.toFixed(2)})`;
                    // Draw last known gaze on overlay (optional)
                } else {
                    if (diag) diag.innerText = `Eye Tracking: No face detected. (${mpDetectedFrames}/${mpTotalFrames})`;
                }
                faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
                return;
            }
            
            mpDetectedFrames++;
            const detectRate = ((mpDetectedFrames / mpTotalFrames) * 100).toFixed(1);

            const LM = results.multiFaceLandmarks[0];
            const wFace = faceVideo.videoWidth || 640;
            const hFace = faceVideo.videoHeight || 360;
            
            // Reference face width (distance between outer eye corners) for distance normalization
            const refWidth = Math.hypot(LM[33].x - LM[263].x, LM[33].y - LM[263].y);
            if (!referenceFaceW) referenceFaceW = refWidth;
            const distanceScale = referenceFaceW ? (refWidth / referenceFaceW) : 1;

            if (faceCanvas.width !== wFace) {
                faceCanvas.width = wFace;
                faceCanvas.height = hFace;
            }

            // ── Helper: compute iris ratio within the eye opening ──
            // Returns { ratioX, ratioY } where 0=leftmost/top, 1=rightmost/bottom
            // Helper: compute iris ratio within the eye opening
            function irisRatio(irisIdx, outerIdx, innerIdx, topIdx, bottomIdx) {
                const iris  = LM[irisIdx];
                const outer = LM[outerIdx];   // lateral canthus
                const inner = LM[innerIdx];   // medial canthus
                const top   = LM[topIdx];
                const bot   = LM[bottomIdx];
                const eyeW = inner.x - outer.x;
                const rx = eyeW !== 0 ? (iris.x - outer.x) / eyeW : 0.5;
                const eyeH = bot.y - top.y;
                const ry = eyeH !== 0 ? (iris.y - top.y) / eyeH : 0.5;
                return { rx, ry, iris };
            }

            // Helper: Eye Aspect Ratio (EAR) for blink detection – using 6 landmarks per eye
            function computeEAR(eyeIndices) {
                // eyeIndices: [p1, p2, p3, p4, p5, p6] (clockwise starting at outer corner)
                const p = eyeIndices.map(i => LM[i]);
                const a = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y);
                const b = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y);
                const c = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y);
                return (a + b) / (2 * c);
            }


            // Left eye  (person's left = camera right)
            //   Iris center: 468 | Outer corner: 33 | Inner corner: 133 | Top: 159 | Bottom: 145
            const left  = irisRatio(468, 33, 133, 159, 145);
            const right = irisRatio(473, 263, 362, 386, 374);

            // Blink detection – compute EAR for both eyes (using typical landmark indices)
            const leftEAR  = computeEAR([33, 160, 158, 133, 153, 144]); // approximate indices for left eye
            const rightEAR = computeEAR([263, 387, 385, 362, 380, 373]); // approximate indices for right eye
            const avgEAR = (leftEAR + rightEAR) / 2;
            const blinkThreshold = parseFloat(paramBlinkEAR.value) || 0.20;
            const isBlink = avgEAR < blinkThreshold;



            // Average both eyes for stability
            // If blink detected, skip this frame's gaze update (interpolate later)
            if (isBlink) {
                // Use last valid gaze for continuity
                if (lastValidGaze) {
                    const { gazeX, gazeY } = lastValidGaze;
                    // continue to drawing using lastValidGaze (optional)
                    // Skip other calculations
                }
                // Still draw face landmarks for visual feedback
                faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
                // (optional) draw a small red indicator for blink
                faceCtx.fillStyle = 'rgba(255,0,0,0.6)';
                faceCtx.fillRect(10, 10, 20, 20);
                // Exit early
                return;
            }

            const avgRX = (left.rx + right.rx) / 2;
            const avgRY = (left.ry + right.ry) / 2;

            // ── Apply Manual Tuning Options ──
            const baselineOffsetY = parseFloat(paramBaselineY.value) || 0;
            const scaleX = (parseFloat(paramScaleX.value) || 2.5) * distanceScale;
            const scaleY = 2.5;
            const showArrow = paramShowArrow.checked;

            // Apply camera offset (normalized to [0,1])
            const camOffsetX = parseFloat(paramCamOffsetX.value) || 0;
            const camOffsetY = parseFloat(paramCamOffsetY.value) || 0;

            // Optional: Head Pose Compensation (simple approx using nose and ear landmarks)
            let poseOffsetX = 0;
            let poseOffsetY = 0;
            if (paramHeadPose && paramHeadPose.checked) {
                // Nose tip (1), left tragus (234), right tragus (454)
                const nose = LM[1];
                const leftEar = LM[234];
                const rightEar = LM[454];
                const midEarX = (leftEar.x + rightEar.x) / 2;
                const midEarY = (leftEar.y + rightEar.y) / 2;
                
                // Yaw approximation: nose X vs mid ear X
                poseOffsetX = (nose.x - midEarX) * 1.5; // coefficient to tune
                // Pitch approximation: nose Y vs mid ear Y
                poseOffsetY = (nose.y - midEarY) * 1.5;
            }

            // Map iris ratio → screen gaze coordinate
            let gazeX, gazeY;
            // Auto Min/Max Tracking
            if (paramAutoScale && paramAutoScale.checked) {
                if (avgRX < autoMinX) autoMinX = avgRX;
                if (avgRX > autoMaxX) autoMaxX = avgRX;
                if (avgRY < autoMinY) autoMinY = avgRY;
                if (avgRY > autoMaxY) autoMaxY = avgRY;
                
                let rangeX = autoMaxX - autoMinX;
                let rangeY = autoMaxY - autoMinY;
                
                // Prevent division by zero if not enough movement yet
                if (rangeX < 0.02) rangeX = 0.02;
                if (rangeY < 0.02) rangeY = 0.02;
                
                let normX = (avgRX - autoMinX) / rangeX;
                let normY = (avgRY - autoMinY) / rangeY;
                
                // When auto scaling, base gaze is purely normalized
                gazeX = normX + camOffsetX - poseOffsetX;
                gazeY = normY + baselineOffsetY + camOffsetY - poseOffsetY;
                
                // Apply manual scaling on top of auto-scale (if user wants to stretch it more)
                gazeX = 0.5 + (gazeX - 0.5) * scaleX;
                gazeY = 0.5 + (gazeY - 0.5) * scaleY;
            } else {
                // Map iris ratio → screen gaze coordinate (Manual mode)
                gazeX = 0.5 + (avgRX - 0.5) * scaleX + camOffsetX - poseOffsetX;
                gazeY = (avgRY + baselineOffsetY - 0.5) * scaleY + 0.5 + camOffsetY - poseOffsetY;
            }

            gazeX = Math.max(0, Math.min(1, gazeX));
            gazeY = Math.max(0, Math.min(1, gazeY));

            // Store as last valid gaze for interpolation
            lastValidGaze = { gazeX, gazeY };

            // ── Smoothing (moving average) ──
            gazeHistory.push({ x: gazeX, y: gazeY });
            const smoothWindow = parseInt(paramSmoothing.value) || 5;
            if (gazeHistory.length > smoothWindow) gazeHistory.shift();
            const smooth = gazeHistory.reduce((acc, cur) => ({ x: acc.x + cur.x, y: acc.y + cur.y }), { x: 0, y: 0 });
            const smoothCount = gazeHistory.length;
            gazeX = smooth.x / smoothCount;
            gazeY = smooth.y / smoothCount;

            
            // Fixation / Saccade classification (velocity based, using normalized gaze)
            let isFixation = true;
            if (prevGazeScreen) {
                const dx = (gazeX - prevGazeScreen.x); // normalized delta
                const dy = (gazeY - prevGazeScreen.y);
                const dist = Math.hypot(dx, dy) * 1000; // scale to comparable range
                const velThresh = parseInt(paramFixationThreshold.value) || 30;
                isFixation = dist <= velThresh;
            }
            prevGazeScreen = { x: gazeX, y: gazeY };

            if (diag) diag.innerText = `Eye Tracking: Active | Rate: ${detectRate}% | Gaze: (${gazeX.toFixed(2)}, ${gazeY.toFixed(2)}) | ${isFixation ? 'Fixation' : 'Saccade'}`;
            // Optionally visualize fixation state
            if (paramShowFixation && paramShowFixation.checked) {
                faceCtx.fillStyle = isFixation ? 'rgba(0,255,0,0.6)' : 'rgba(255,0,0,0.6)';
                faceCtx.fillRect(5, 5, 15, 15);
            }

            // ── Draw Face Video Overlay (both eyes) ──
            faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

            // Draw iris dots on both eyes
            const eyes = [left, right];
            for (const eye of eyes) {
                const px = eye.iris.x * wFace;
                const py = eye.iris.y * hFace;

                faceCtx.beginPath();
                faceCtx.arc(px, py, 4, 0, Math.PI * 2);
                faceCtx.fillStyle = '#00ffff';
                faceCtx.fill();

                if (showArrow) {
                    const vecX = (gazeX - 0.5) * 80;
                    const vecY = (gazeY - 0.5) * 80;
                    faceCtx.beginPath();
                    faceCtx.moveTo(px, py);
                    faceCtx.lineTo(px + vecX, py + vecY);
                    faceCtx.strokeStyle = '#f59e0b';
                    faceCtx.lineWidth = 3;
                    faceCtx.stroke();

                    const angle = Math.atan2(vecY, vecX);
                    faceCtx.beginPath();
                    faceCtx.moveTo(px + vecX, py + vecY);
                    faceCtx.lineTo(px + vecX - 12 * Math.cos(angle - Math.PI / 6), py + vecY - 12 * Math.sin(angle - Math.PI / 6));
                    faceCtx.lineTo(px + vecX - 12 * Math.cos(angle + Math.PI / 6), py + vecY - 12 * Math.sin(angle + Math.PI / 6));
                    faceCtx.closePath();
                    faceCtx.fillStyle = '#f59e0b';
                    faceCtx.fill();
                }
            }

            // ── Sync with Screen Video Map ──
            const wScreen = screenVideo.videoWidth > 0 ? screenVideo.videoWidth : eyeCanvas.width;
            const hScreen = screenVideo.videoHeight > 0 ? screenVideo.videoHeight : eyeCanvas.height;
            if (eyeCanvas.width !== wScreen) {
                eyeCanvas.width = wScreen;
                eyeCanvas.height = hScreen;
            }
            
            currentGazeScreen = { x: gazeX * wScreen, y: gazeY * hScreen };
            globalIsFixation = isFixation;

            const now = Date.now();
            const trailFreq = parseInt(paramTrailFreq ? paramTrailFreq.value : 400) || 400;
            
            if (!isFixation) {
                if (prevGazeScreen) {
                    const prevX = prevGazeScreen.x * wScreen;
                    const prevY = prevGazeScreen.y * hScreen;
                    if (Math.hypot(currentGazeScreen.x - prevX, currentGazeScreen.y - prevY) < wScreen * 0.5) {
                        eyeTrails.push({ type: 'line', x1: prevX, y1: prevY, x2: currentGazeScreen.x, y2: currentGazeScreen.y, age: 0 });
                    }
                }
                
                if (now - lastTrailTime > trailFreq) {
                    eyeTrails.push({ type: 'dot', x: currentGazeScreen.x, y: currentGazeScreen.y, age: 0 });
                    lastTrailTime = now;
                }
            }
        });
    }

    function updateFaceMeshConfig() {
        if (!faceMesh) return;
        const confidence = parseFloat(paramSensitivity.value) || 0.1;
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: confidence,
            minTrackingConfidence: confidence
        });
    }

    async function startPupilDetection() {
        if (!faceMesh) await initFaceMesh();
        
        async function processFrame() {
            if (faceVideo && !faceVideo.paused && faceVideo.readyState >= 2) {
                try { await faceMesh.send({image: faceVideo}); } 
                catch (e) { console.error(e); }
            }
            requestAnimationFrame(processFrame);
        }
        processFrame();
    }

    // Render Trails Loop
    function animateEyeTrails() {
        if (eyeCtx && eyeCanvas) {
            eyeCtx.clearRect(0, 0, eyeCanvas.width, eyeCanvas.height);
            
            if (paramShowDonut.checked) {
                // 1. Draw Saccade Trails (Red tail)
                for (let i = eyeTrails.length - 1; i >= 0; i--) {
                    let trail = eyeTrails[i];
                    trail.age += 1;
                    const maxAge = 25; 
                    if (trail.age > maxAge) { eyeTrails.splice(i, 1); continue; }
                    
                    const progress = trail.age / maxAge;
                    const alpha = 1 - progress;
                    
                    if (trail.type === 'line') {
                        eyeCtx.beginPath();
                        eyeCtx.moveTo(trail.x1, trail.y1);
                        eyeCtx.lineTo(trail.x2, trail.y2);
                        eyeCtx.lineWidth = 3;
                        eyeCtx.strokeStyle = `rgba(255, 50, 50, ${alpha})`; // Red line for fast movement
                        eyeCtx.stroke();
                    } else {
                        const radius = 15 + (progress * 10);
                        eyeCtx.beginPath();
                        eyeCtx.arc(trail.x, trail.y, radius, 0, Math.PI * 2);
                        eyeCtx.lineWidth = 4;
                        eyeCtx.strokeStyle = `rgba(0, 255, 255, ${alpha})`; // Cyan donuts
                        eyeCtx.shadowBlur = 10;
                        eyeCtx.shadowColor = `rgba(0, 255, 255, ${alpha})`;
                        eyeCtx.stroke();
                        eyeCtx.shadowBlur = 0;
                    }
                }

                // 2. Draw current Fixation point (Solid Orange)
                if (globalIsFixation && currentGazeScreen.x !== 0) {
                    eyeCtx.beginPath();
                    eyeCtx.arc(currentGazeScreen.x, currentGazeScreen.y, 20, 0, Math.PI * 2);
                    eyeCtx.lineWidth = 5;
                    eyeCtx.strokeStyle = `rgba(255, 165, 0, 0.9)`; // Fixation: Orange
                    eyeCtx.shadowBlur = 15;
                    eyeCtx.shadowColor = `rgba(255, 165, 0, 0.9)`;
                    eyeCtx.stroke();
                    eyeCtx.shadowBlur = 0;
                }
            }
        }
        requestAnimationFrame(animateEyeTrails);
    }
    requestAnimationFrame(animateEyeTrails);

    // 4. Fast Offline Export System
    const btnRecord = document.getElementById('btnRecord');
    const btnSample = document.getElementById('btnSample');
    const btnStopTrack = document.getElementById('btnStopTrack');
    const recordStatus = document.getElementById('recordStatus');
    let isExporting = false;

    let currentRecorder = null;
    let currentFaceEncoder = null;
    let currentScreenEncoder = null;
    function resetExportState() {
        isExporting = false;
        btnRecord.disabled = false;
        btnRecord.innerText = window.t("btn_start_tracking");
        if (btnStopTrack) btnStopTrack.disabled = true;
        if (btnSample) btnSample.disabled = false;
        if (currentRecorder && currentRecorder.state !== 'inactive') currentRecorder.stop();
        try { if (currentFaceEncoder && currentFaceEncoder.state !== 'closed') currentFaceEncoder.close(); } catch(e) {}
        try { if (currentScreenEncoder && currentScreenEncoder.state !== 'closed') currentScreenEncoder.close(); } catch(e) {}
        currentRecorder = null;
        currentFaceEncoder = null;
        currentScreenEncoder = null;
    }
    if (faceUpload) faceUpload.addEventListener('change', resetExportState);
    if (screenUpload) screenUpload.addEventListener('change', resetExportState);

    // ── Promise-based FaceMesh processing for frame-by-frame export ──
    let exportResolve = null;
    let exportGazeResult = null;

    // Seek a video to a specific time and wait for the frame to be ready
    function seekTo(video, time) {
        return new Promise((resolve) => {
            if (Math.abs(video.currentTime - time) < 0.001 && video.readyState >= 2) {
                resolve();
                return;
            }
            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                resolve();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
        });
    }

    // Process one frame through FaceMesh and return gaze data
    function processFaceMeshFrame() {
        return new Promise(async (resolve) => {
            exportResolve = resolve;
            try {
                await faceMesh.send({ image: faceVideo });
            } catch (e) {
                console.error('FaceMesh error:', e);
                resolve(null);
            }
        });
    }

    // Draw tracking overlay on a context (used during export)
    function drawTrackingOverlay(ctx, w, h, gazeData, trails, showArrow) {
        ctx.clearRect(0, 0, w, h);
        if (!gazeData) return;

        // Draw iris dots + arrows on face canvas
        if (gazeData.eyes) {
            for (const eye of gazeData.eyes) {
                const px = eye.x * w;
                const py = eye.y * h;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#00ffff';
                ctx.fill();

                if (showArrow) {
                    const vecX = (gazeData.gazeX - 0.5) * 80;
                    const vecY = (gazeData.gazeY - 0.5) * 80;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + vecX, py + vecY);
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    const angle = Math.atan2(vecY, vecX);
                    ctx.beginPath();
                    ctx.moveTo(px + vecX, py + vecY);
                    ctx.lineTo(px + vecX - 12 * Math.cos(angle - Math.PI / 6), py + vecY - 12 * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(px + vecX - 12 * Math.cos(angle + Math.PI / 6), py + vecY - 12 * Math.sin(angle + Math.PI / 6));
                    ctx.closePath();
                    ctx.fillStyle = '#f59e0b';
                    ctx.fill();
                }
            }
        }
    }

    function drawDonutTrails(ctx, w, h, trails) {
        ctx.clearRect(0, 0, w, h);
        for (let i = trails.length - 1; i >= 0; i--) {
            const trail = trails[i];
            trail.age += 1;
            const maxAge = 6;  // shorter for export (each frame = 1 step)
            if (trail.age > maxAge) { trails.splice(i, 1); continue; }
            const progress = trail.age / maxAge;
            const alpha = 1 - progress;
            const radius = 15 + (progress * 15);
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, radius, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgba(0, 255, 255, ${alpha})`;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // ── Shared export function (sampleRatio: 1.0 = full, 0.1 = 10% sample) ──
    async function startExport(sampleRatio) {
        if (!faceVideo.src || !screenVideo.src) {
            alert("두 개의 비디오 파일(Face View, Screen View)을 모두 업로드해주세요.");
            return;
        }
        
        // Session checking has been removed for standalone client-side app        // If already exporting, stop it
        if (isExporting) {
            isExporting = false;
            recordStatus.innerText = window.t("status_stop_render");
            return;
        }
        isExporting = true;
        const isSample = sampleRatio < 1.0;
        btnRecord.disabled = true;
        btnRecord.innerText = window.t("btn_tracking");
        if (btnStopTrack) btnStopTrack.disabled = false;
        if (isSample) {
            btnSample.disabled = true;
            recordStatus.innerText = window.t("status_sample_prep").replace("{ratio}", Math.round(sampleRatio * 100));
        } else {
            btnSample.disabled = true;
            recordStatus.innerText = window.t("status_export_prep");
        }
        let useMediaRecorder = false; // flag to prevent finally from killing async MediaRecorder
        try {

        // Ensure FaceMesh is ready
        if (!faceMesh) await initFaceMesh();

        // Pause live playback
        faceVideo.pause();
        screenVideo.pause();

        const fps = 15;  // export at 15 FPS for speed (good enough for eye tracking)
        const frameInterval = 1 / fps;
        const duration = faceVideo.duration;
        const exportDuration = duration * sampleRatio;
        const totalFrames = Math.ceil(exportDuration * fps);
        const fname = document.getElementById('optFilename').value || 'eyetracking';
        // Generate timestamp for file naming
        const _d = new Date();
        const _pad = n => n.toString().padStart(2, '0');
        const fileTs = `${_d.getFullYear()}${_pad(_d.getMonth()+1)}${_pad(_d.getDate())}_${_pad(_d.getHours())}${_pad(_d.getMinutes())}${_pad(_d.getSeconds())}`;
        
        async function uploadEyetracking(faceBlob, screenBlob, isSampleUpload) {
            recordStatus.innerText = isSampleUpload ? window.t("status_sample_dl") : window.t("status_local_dl");
            
            // Helper function to trigger download
            function downloadBlob(blob, filename) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            const prefix = isSampleUpload ? 'sample_' : '';
            const suffix = isSampleUpload ? '_10pct' : '';
            
            // Download Face tracking output
            downloadBlob(faceBlob, `${prefix}${fname}_face_tracked${suffix}_${fileTs}.webm`);
            
            // Download Screen tracking output
            setTimeout(() => {
                downloadBlob(screenBlob, `${prefix}${fname}_screen_tracked${suffix}_${fileTs}.webm`);
            }, 500); // Slight delay for multiple downloads

            const label = isSampleUpload ? '아이트래킹 샘플링(10%)' : '아이트래킹';
            recordStatus.innerText = window.t("status_dl_complete").replace("{label}", label);
        }

        // Setup composite canvases
        const fW = faceVideo.videoWidth, fH = faceVideo.videoHeight;
        const sW = screenVideo.videoWidth, sH = screenVideo.videoHeight;

        const faceOut = document.createElement('canvas');
        faceOut.width = fW; faceOut.height = fH;
        const faceOutCtx = faceOut.getContext('2d');

        const screenOut = document.createElement('canvas');
        screenOut.width = sW; screenOut.height = sH;
        const screenOutCtx = screenOut.getContext('2d');

        // Temporary overlay canvases for export
        const faceTmpCanvas = document.createElement('canvas');
        faceTmpCanvas.width = fW; faceTmpCanvas.height = fH;
        const faceTmpCtx = faceTmpCanvas.getContext('2d');

        const screenTmpCanvas = document.createElement('canvas');
        screenTmpCanvas.width = sW; screenTmpCanvas.height = sH;
        const screenTmpCtx = screenTmpCanvas.getContext('2d');

        // ── Setup WebCodecs VideoEncoder + webm-muxer ──
        let WebMMuxer;
        try {
            // Dynamically import webm-muxer
            const module = await import('https://cdn.jsdelivr.net/npm/webm-muxer@5/build/webm-muxer.mjs');
            WebMMuxer = module;
        } catch (e) {
            console.error('Failed to load webm-muxer:', e);
            recordStatus.innerText = window.t("status_fail_webm");
            btnRecord.disabled = false;
            isExporting = false;
            return;
        }

        // Check WebCodecs support
        if (typeof VideoEncoder === 'undefined') {
            recordStatus.innerText = window.t("status_fail_codec");
            btnRecord.disabled = false;
            isExporting = false;
            return;
        }

        // Create muxers
        const faceTarget = new WebMMuxer.ArrayBufferTarget();
        const faceMuxer = new WebMMuxer.Muxer({
            target: faceTarget,
            video: { codec: 'V_VP8', width: fW, height: fH, frameRate: fps },
        });

        const screenTarget = new WebMMuxer.ArrayBufferTarget();
        const screenMuxer = new WebMMuxer.Muxer({
            target: screenTarget,
            video: { codec: 'V_VP8', width: sW, height: sH, frameRate: fps },
        });

        // Create encoders
        const faceEncoder = new VideoEncoder({
            output: (chunk, meta) => faceMuxer.addVideoChunk(chunk, meta),
            error: (e) => console.error('Face encoder error:', e),
        });
        currentFaceEncoder = faceEncoder;
        
        faceEncoder.configure({
            codec: 'vp8',
            width: fW, height: fH,
            bitrate: 4_000_000,
            framerate: fps,
        });

        const screenEncoder = new VideoEncoder({
            output: (chunk, meta) => screenMuxer.addVideoChunk(chunk, meta),
            error: (e) => console.error('Screen encoder error:', e),
        });
        currentScreenEncoder = screenEncoder;
        screenEncoder.configure({
            codec: 'vp8',
            width: sW, height: sH,
            bitrate: 6_000_000,
            framerate: fps,
        });

        // ── Intercept FaceMesh onResults for export ──
        // We temporarily replace the callback behavior during export
        const origOnResults = faceMesh.onResults;

        let exportLastGaze = null;
        let exportGazeHistory = [];

        faceMesh.onResults((results) => {
            if (!exportResolve) return;

            if (!results.multiFaceLandmarks || !results.multiFaceLandmarks[0]) {
                if (exportLastGaze) {
                    exportResolve(exportLastGaze);
                } else {
                    exportResolve(null);
                }
                exportResolve = null;
                return;
            }

            const LM = results.multiFaceLandmarks[0];

            // Distance scaling
            const refWidth = Math.hypot(LM[33].x - LM[263].x, LM[33].y - LM[263].y);
            if (!referenceFaceW) referenceFaceW = refWidth;
            const distanceScale = referenceFaceW ? (refWidth / referenceFaceW) : 1;

            function irisRatio(irisIdx, outerIdx, innerIdx, topIdx, bottomIdx) {
                const iris = LM[irisIdx], outer = LM[outerIdx], inner = LM[innerIdx];
                const top = LM[topIdx], bot = LM[bottomIdx];
                const eyeW = inner.x - outer.x;
                const rx = eyeW !== 0 ? (iris.x - outer.x) / eyeW : 0.5;
                const eyeH = bot.y - top.y;
                const ry = eyeH !== 0 ? (iris.y - top.y) / eyeH : 0.5;
                return { rx, ry, iris };
            }

            function computeEAR(eyeIndices) {
                const p = eyeIndices.map(i => LM[i]);
                const a = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y);
                const b = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y);
                const c = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y);
                return (a + b) / (2 * c);
            }

            const left = irisRatio(468, 33, 133, 159, 145);
            const right = irisRatio(473, 263, 362, 386, 374);
            
            const leftEAR  = computeEAR([33, 160, 158, 133, 153, 144]);
            const rightEAR = computeEAR([263, 387, 385, 362, 380, 373]);
            const avgEAR = (leftEAR + rightEAR) / 2;
            const blinkThreshold = parseFloat(paramBlinkEAR.value) || 0.20;
            const isBlink = avgEAR < blinkThreshold;

            if (isBlink) {
                if (exportLastGaze) exportResolve(exportLastGaze);
                else exportResolve(null);
                exportResolve = null;
                return;
            }

            const avgRX = (left.rx + right.rx) / 2;
            const avgRY = (left.ry + right.ry) / 2;

            const baselineOffsetY = parseFloat(paramBaselineY.value) || 0;
            const scaleX = (parseFloat(paramScaleX.value) || 2.5) * distanceScale;
            const scaleY = 2.5;

            const camOffsetX = parseFloat(paramCamOffsetX.value) || 0;
            const camOffsetY = parseFloat(paramCamOffsetY.value) || 0;

            let poseOffsetX = 0;
            let poseOffsetY = 0;
            if (paramHeadPose && paramHeadPose.checked) {
                const nose = LM[1], leftEar = LM[234], rightEar = LM[454];
                const midEarX = (leftEar.x + rightEar.x) / 2;
                const midEarY = (leftEar.y + rightEar.y) / 2;
                poseOffsetX = (nose.x - midEarX) * 1.5;
                poseOffsetY = (nose.y - midEarY) * 1.5;
            }

            let gazeX, gazeY;
            // Auto Min/Max Tracking (uses same global bounds updated during export)
            if (paramAutoScale && paramAutoScale.checked) {
                if (avgRX < autoMinX) autoMinX = avgRX;
                if (avgRX > autoMaxX) autoMaxX = avgRX;
                if (avgRY < autoMinY) autoMinY = avgRY;
                if (avgRY > autoMaxY) autoMaxY = avgRY;
                
                let rangeX = autoMaxX - autoMinX;
                let rangeY = autoMaxY - autoMinY;
                
                if (rangeX < 0.02) rangeX = 0.02;
                if (rangeY < 0.02) rangeY = 0.02;
                
                let normX = (avgRX - autoMinX) / rangeX;
                let normY = (avgRY - autoMinY) / rangeY;
                
                gazeX = normX + camOffsetX - poseOffsetX;
                gazeY = normY + baselineOffsetY + camOffsetY - poseOffsetY;
                
                gazeX = 0.5 + (gazeX - 0.5) * scaleX;
                gazeY = 0.5 + (gazeY - 0.5) * scaleY;
            } else {
                gazeX = 0.5 + (avgRX - 0.5) * scaleX + camOffsetX - poseOffsetX;
                gazeY = (avgRY + baselineOffsetY - 0.5) * scaleY + 0.5 + camOffsetY - poseOffsetY;
            }

            gazeX = Math.max(0, Math.min(1, gazeX));
            gazeY = Math.max(0, Math.min(1, gazeY));

            exportGazeHistory.push({ x: gazeX, y: gazeY });
            const smoothWindow = parseInt(paramSmoothing.value) || 5;
            if (exportGazeHistory.length > smoothWindow) exportGazeHistory.shift();
            const smooth = exportGazeHistory.reduce((acc, cur) => ({ x: acc.x + cur.x, y: acc.y + cur.y }), { x: 0, y: 0 });
            gazeX = smooth.x / exportGazeHistory.length;
            gazeY = smooth.y / exportGazeHistory.length;

            const finalData = {
                gazeX, gazeY,
                eyes: [ { x: left.iris.x, y: left.iris.y }, { x: right.iris.x, y: right.iris.y } ]
            };
            exportLastGaze = finalData;

            exportResolve(finalData);
            exportResolve = null;
        });

        // ── Frame-by-frame rendering loop ──
        const exportTrails = [];
        const showArrow = paramShowArrow.checked;
        const showDonut = paramShowDonut.checked;
        const startTime = performance.now();

        const sampleLabel = isSample ? `샘플링(${Math.round(sampleRatio*100)}%) ` : '';

        for (let i = 0; i < totalFrames; i++) {
            const t = i * frameInterval;
            const pct = ((i / totalFrames) * 100).toFixed(1);
            const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
            recordStatus.innerText = window.t("status_render_prog").replace("{sampleLabel}", sampleLabel).replace("{pct}", pct).replace("{i}", i).replace("{totalFrames}", totalFrames).replace("{elapsed}", elapsed);

            // Seek both videos
            await seekTo(faceVideo, Math.min(t, exportDuration));
            await seekTo(screenVideo, Math.min(t, screenVideo.duration * sampleRatio));

            // Process face through FaceMesh
            const gazeData = await processFaceMeshFrame();

            // Draw face composite: video + overlay
            faceTmpCtx.clearRect(0, 0, fW, fH);
            drawTrackingOverlay(faceTmpCtx, fW, fH, gazeData, null, showArrow);

            faceOutCtx.drawImage(faceVideo, 0, 0, fW, fH);
            faceOutCtx.drawImage(faceTmpCanvas, 0, 0, fW, fH);

            // Draw screen composite: video + donut trails
            if (gazeData && showDonut) {
                exportTrails.push({ x: gazeData.gazeX * sW, y: gazeData.gazeY * sH, age: 0 });
            }
            drawDonutTrails(screenTmpCtx, sW, sH, exportTrails);

            screenOutCtx.drawImage(screenVideo, 0, 0, sW, sH);
            screenOutCtx.drawImage(screenTmpCanvas, 0, 0, sW, sH);

            // Encode frames
            const tsUs = i * (1_000_000 / fps);  // timestamp in microseconds
            const isKey = i % (fps * 2) === 0;    // keyframe every 2 seconds

            const faceFrame = new VideoFrame(faceOut, { timestamp: tsUs });
            faceEncoder.encode(faceFrame, { keyFrame: isKey });
            faceFrame.close();

            const screenFrame = new VideoFrame(screenOut, { timestamp: tsUs });
            screenEncoder.encode(screenFrame, { keyFrame: isKey });
            screenFrame.close();

            // Yield to UI to keep progress updates responsive
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // ── Finalize ──
        recordStatus.innerText = window.t("status_render_done");

        await faceEncoder.flush();
        await screenEncoder.flush();
        faceEncoder.close();
        screenEncoder.close();
        currentFaceEncoder = null;
        currentScreenEncoder = null;
        faceMuxer.finalize();
        screenMuxer.finalize();

        const faceBlob = new Blob([faceTarget.buffer], { type: 'video/webm' });
        const screenBlob = new Blob([screenTarget.buffer], { type: 'video/webm' });

        if (isSample) {
            // Sample mode: save to session folder AND open preview in new tab
            const previewUrl = URL.createObjectURL(screenBlob);
            window.open(previewUrl, '_blank');
            await uploadEyetracking(faceBlob, screenBlob, true);
            const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
            recordStatus.innerText = window.t("status_sample_done").replace("{totalFrames}", totalFrames).replace("{totalTime}", totalTime);
        } else {
            await uploadEyetracking(faceBlob, screenBlob, false);
            const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
            recordStatus.innerText = window.t("status_done").replace("{totalFrames}", totalFrames).replace("{totalTime}", totalTime);
        }
        btnRecord.disabled = false;
        btnRecord.innerText = window.t("btn_start_tracking");
        if (btnStopTrack) btnStopTrack.disabled = true;
        btnSample.disabled = false;
        isExporting = false;

        // Restore normal FaceMesh onResults for live preview
        // (re-init will be needed if user goes back to live mode)
        } catch (error) {
            console.error('Export Failed:', error);
            alert('Export 중 오류가 발생했습니다.');
        } finally {
            // Only reset if NOT using MediaRecorder path
            // (MediaRecorder handles its own cleanup in recorder.onstop)
            if (!useMediaRecorder) {
                resetExportState();
            }
            btnSample.disabled = false;
        }
    }

    // Wire up buttons
    btnRecord.addEventListener('click', () => startExport(1.0));
    btnSample.addEventListener('click', () => startExport(0.1));
    if (btnStopTrack) {
        btnStopTrack.addEventListener('click', () => {
            if (isExporting) {
                isExporting = false;
                recordStatus.innerText = window.t("status_stop_track");
                if (btnStopTrack) btnStopTrack.disabled = true;
            }
        });
    }
});
