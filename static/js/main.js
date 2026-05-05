document.addEventListener('DOMContentLoaded', () => {
    // File tracking for layout save/restore
    window._loadedEmotionFile = '';
    window._loadedTranscriptFile = '';
    // UI Elements

    // Progress Log System — defined in sidebar.js (with server sync)
    // Do NOT redefine window.addProgressLog here.

    // Loading Animation Helper
    let analyzingInterval = null;
    function startAnalyzingAnimation(btnElement) {
        const steps = ["동영상 싱킹 중...", "표정 분석 중...", "스크립트 작성 중...", "데이터 종합 중..."];
        let stepIdx = 0;
        btnElement.textContent = steps[stepIdx];
        
        analyzingInterval = setInterval(() => {
            stepIdx = (stepIdx + 1) % steps.length;
            btnElement.textContent = steps[stepIdx];
        }, 2500);
    }
    
    function stopAnalyzingAnimation(btnElement, originalText) {
        if (analyzingInterval) {
            clearInterval(analyzingInterval);
            analyzingInterval = null;
        }
        btnElement.textContent = originalText;
    }

    // Handle form upload (legacy) removed to ensure standalone operation

    // 3 Splitted Emotion Charts
    const emotionConfig = [
        { id: 'chartHappy', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
        { id: 'chartNeutral', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
        { id: 'chartStress', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' }
    ];
    
    const chartInstances = {};
    
    emotionConfig.forEach(config => {
        const ctx = document.getElementById(config.id);
        if (ctx) {
            chartInstances[config.id] = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    datasets: [{
                        data: [],
                        borderColor: config.color,
                        backgroundColor: config.bgColor,
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 0,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { type: 'linear', display: false },
                        y: { display: false, min: 0, max: 100 }
                    },
                    layout: { padding: 0 }
                }
            });
        }
    });

    // ---------- Eye-Tracking Overlay Logic ----------
    let eyeCanvas = null;
    let eyeCtx = null;
    let faceCanvas = null;
    let faceCtx = null;
    let eyeTrails = [];

    function initEyeTrackingCanvas() {
        const screenVideo = document.getElementById('mainVideo');
        eyeCanvas = document.getElementById('eyeTrackingCanvas');
        if (screenVideo && eyeCanvas) {
            eyeCanvas.width = screenVideo.videoWidth || 640;
            eyeCanvas.height = screenVideo.videoHeight || 360;
            eyeCtx = eyeCanvas.getContext('2d');
        }

        const faceVideo = document.getElementById('faceVideo');
        faceCanvas = document.getElementById('faceTrackingCanvas');
        if (faceVideo && faceCanvas) {
            faceCanvas.width = faceVideo.videoWidth || 640;
            faceCanvas.height = faceVideo.videoHeight || 360;
            faceCtx = faceCanvas.getContext('2d');
        }
    }

    // Continuously animate the eye trails on Screen View
    function animateEyeTrails() {
        if (!eyeCtx || !eyeCanvas) return requestAnimationFrame(animateEyeTrails);
        
        eyeCtx.clearRect(0, 0, eyeCanvas.width, eyeCanvas.height);
        
        for (let i = eyeTrails.length - 1; i >= 0; i--) {
            let trail = eyeTrails[i];
            trail.age += 1;
            
            // Fading and expanding effect
            const maxAge = 30; // approx 0.5 sec at 60fps
            if (trail.age > maxAge) {
                eyeTrails.splice(i, 1);
                continue;
            }
            
            const progress = trail.age / maxAge;
            const alpha = 1 - progress;
            const radius = 15 + (progress * 15); // Starts at 15, expands to 30
            
            eyeCtx.beginPath();
            eyeCtx.arc(trail.x, trail.y, radius, 0, Math.PI * 2);
            eyeCtx.lineWidth = 4;
            // Glowing mint cyan
            eyeCtx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            eyeCtx.shadowBlur = 10;
            eyeCtx.shadowColor = `rgba(0, 255, 255, ${alpha})`;
            eyeCtx.stroke();
            eyeCtx.shadowBlur = 0; // reset
        }
        
        requestAnimationFrame(animateEyeTrails);
    }
    
    // Start animation loop
    requestAnimationFrame(animateEyeTrails);

    // Draw solid pupil markers on Face View
    function drawFacePupils(px, py, width, height, gazeX, gazeY) {
        if (!faceCtx || !faceCanvas) return;
        faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
        
        // Draw dot on the eyes
        faceCtx.beginPath();
        faceCtx.arc(px, py, 4, 0, Math.PI * 2);
        faceCtx.fillStyle = '#00ffff';
        faceCtx.shadowBlur = 8;
        faceCtx.shadowColor = '#00ffff';
        faceCtx.fill();
        faceCtx.shadowBlur = 0;
        
        // Draw an overt arrow indicating the screen gaze direction
        if (gazeX !== undefined && gazeY !== undefined) {
             const vecX = (gazeX - 0.5) * 80;
             const vecY = (gazeY - 0.5) * 80;
             faceCtx.beginPath();
             faceCtx.moveTo(px, py);
             faceCtx.lineTo(px + vecX, py + vecY);
             faceCtx.strokeStyle = '#f59e0b'; // Visually distinct arrow
             faceCtx.lineWidth = 3;
             faceCtx.stroke();
             
             // Draw Arrow head
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

    window.startPupilDetection = async function() {
        const faceVideo = document.getElementById('faceVideo');
        if (!faceVideo) return;

        // Load MediaPipe dynamically
        if (!window.FaceMesh) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
            document.head.appendChild(script);
            await new Promise((r, reject) => {
                script.onload = r;
                script.onerror = () => reject(new Error("Failed to load FaceMesh script"));
            });
        }

        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.1,
            minTrackingConfidence: 0.1
        });

        let mpTotalFrames = 0;
        let mpDetectedFrames = 0;
        let lastTrailTime = 0;

        faceMesh.onResults((results) => {
            const eyeCheckbox = document.getElementById('eyeTrackingCheckbox');
            if (!eyeCheckbox || !eyeCheckbox.checked) {
                if (faceCtx) faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
                return;
            }
            
            mpTotalFrames++;
            const diag = document.getElementById('trackingDiagnostics');

            if (!results.multiFaceLandmarks || !results.multiFaceLandmarks[0]) {
                if (diag) diag.innerText = `Eye Tracking: No face detected. (${mpDetectedFrames}/${mpTotalFrames})`;
                return;
            }
            
            mpDetectedFrames++;
            const detectRate = ((mpDetectedFrames / mpTotalFrames) * 100).toFixed(1);
            if (diag) diag.innerText = `Eye Tracking: Active | Rate: ${detectRate}% (${mpDetectedFrames}/${mpTotalFrames})`;
            
            const pupilLeft = results.multiFaceLandmarks[0][468]; // Left Eye center
            
            const wFace = faceVideo.videoWidth || 640;
            const hFace = faceVideo.videoHeight || 360;
            
            // Dynamically sync canvas dimensions to video intrinsic dimensions
            if (faceCanvas && faceCanvas.width !== wFace) {
                faceCanvas.width = wFace;
                faceCanvas.height = hFace;
            }
            
            const pxFace = pupilLeft.x * wFace;
            const pyFace = pupilLeft.y * hFace;
            
            drawFacePupils(pxFace, pyFace, wFace, hFace);

            // Calculate Screen Gaze by measuring physical pupil offset inside the actual eye socket
            // This decouples the gaze tracking from the video resolution entirely!
            const LM = results.multiFaceLandmarks[0];
            const eyeInner = LM[133];
            const eyeOuter = LM[33];
            const eyeTop = LM[159];
            const eyeBottom = LM[145];
            
            const eyeCenterX = (eyeInner.x + eyeOuter.x) / 2;
            const eyeCenterY = (eyeTop.y + eyeBottom.y) / 2;
            const eyeWidth = Math.abs(eyeInner.x - eyeOuter.x);
            const eyeHeight = Math.abs(eyeTop.y - eyeBottom.y);
            
            // Offset of pupil from the center of the eye socket, normalized by eye dimensions
            // Add a robust baseline Offset Y because the iris normally rests higher than the strict geometric center!
            // Lowering it pushes the mapped gaze DOWN to prevent top-clustering.
            const baselineOffsetY = 0.20; 
            const dx = eyeWidth > 0 ? (pupilLeft.x - eyeCenterX) / eyeWidth : 0;
            const dy = eyeHeight > 0 ? (pupilLeft.y - eyeCenterY) / eyeHeight + baselineOffsetY : 0;
            
            // Map to screen [0, 1] using a sensitivity multiplier
            const sensitivityX = 2.5;
            const sensitivityY = 4.0; // Y requires more sensitivity due to narrower eye slit
            
            // Note: Camera is mirrored. If user looks right (their right), pupil goes to camera's left
            let gazeX = 0.5 - (dx * sensitivityX);
            let gazeY = 0.5 + (dy * sensitivityY);
            
            gazeX = Math.max(0, Math.min(1, gazeX));
            gazeY = Math.max(0, Math.min(1, gazeY));
            
            drawFacePupils(pxFace, pyFace, wFace, hFace, gazeX, gazeY);

            // Screen space mapping to Screen View
            if (eyeCanvas) {
                const screenVideo = document.getElementById('mainVideo');
                const wScreen = screenVideo && screenVideo.videoWidth > 0 ? screenVideo.videoWidth : eyeCanvas.width;
                const hScreen = screenVideo && screenVideo.videoHeight > 0 ? screenVideo.videoHeight : eyeCanvas.height;
                
                if (eyeCanvas.width !== wScreen) {
                    eyeCanvas.width = wScreen;
                    eyeCanvas.height = hScreen;
                }
                
                // Add to trail array using throttled coordinates to reduce clutter (e.g. 5 times/second)
                const now = Date.now();
                if (now - lastTrailTime > 200) {
                    eyeTrails.push({
                        x: gazeX * wScreen,
                        y: gazeY * hScreen,
                        age: 0
                    });
                    lastTrailTime = now;
                }
            }
        });

        // Loop to feed actual playing video frames to MediaPipe without hijacking src with webcam
        async function processFrame() {
            if (faceVideo && !faceVideo.paused && !faceVideo.ended && faceVideo.readyState >= 2) {
                try {
                    await faceMesh.send({image: faceVideo});
                } catch (e) {
                    // Ignore transient errors but don't crash loop
                    // console.error("Eye Tracking Error:", e);
                }
            }
            requestAnimationFrame(processFrame);
        }
        
        // Start processing frame requests immediately
        processFrame();
    };

    window.globalEmotionData = [];
    // Flag: when true, show all data (JSON loaded standalone). When false, use sliding window (synced to video).
    let emotionShowAll = false;

    window.renderEmotionFrame = function(currentTime) {
        if (!window.globalEmotionData || window.globalEmotionData.length === 0) return;
        
        let filtered, minTime, maxTime;

        if (emotionShowAll) {
            // Show ALL data (when loaded from JSON without video sync)
            filtered = window.globalEmotionData;
            minTime = filtered[0].time;
            maxTime = filtered[filtered.length - 1].time;
        } else {
            // Sliding 60s window (synced to video playback)
            const windowSize = 60.0;
            minTime = currentTime - windowSize;
            maxTime = currentTime;
            let startTime = Math.max(0, minTime);
            filtered = window.globalEmotionData.filter(e => e.time >= startTime && e.time <= maxTime);
        }
        
        const dataMaps = {
            'chartHappy': filtered.map(e => ({ x: e.time, y: e.happy })),
            'chartNeutral': filtered.map(e => ({ x: e.time, y: e.neutral })),
            'chartStress': filtered.map(e => ({ x: e.time, y: e.stress }))
        };

        emotionConfig.forEach(config => {
            const chart = chartInstances[config.id];
            if (chart) {
                chart.options.scales.x.min = minTime;
                chart.options.scales.x.max = maxTime;
                chart.data.datasets[0].data = dataMaps[config.id];
                chart.update('none');
            }
        });
    };

    // Store real emotion data and render initial state with threshold filtering
    function updateEmotionChart(emotionsArray) {
        const CHANGE_THRESHOLD = 0.1;
        let filteredEmotions = [];
        let lastStored = null;
        
        emotionsArray.forEach(frame => {
            if (!lastStored) {
                filteredEmotions.push(frame);
                lastStored = frame;
            } else {
                const diff = Math.max(
                    Math.abs(frame.happy - lastStored.happy),
                    Math.abs(frame.neutral - lastStored.neutral),
                    Math.abs(frame.stress - lastStored.stress)
                );
                
                if (diff > CHANGE_THRESHOLD) {
                    filteredEmotions.push(frame);
                    lastStored = frame;
                } else {
                    const smoothedFrame = { ...lastStored, time: frame.time };
                    filteredEmotions.push(smoothedFrame);
                }
            }
        });

        if (emotionsArray.length > 0 && lastStored !== emotionsArray[emotionsArray.length - 1]) {
            filteredEmotions.push(emotionsArray[emotionsArray.length - 1]);
        }

        window.globalEmotionData = filteredEmotions;

        // Check if any video is playing — if not, show all data at once
        const faceVideo = document.getElementById('faceVideo');
        const mainVideo = document.getElementById('mainVideo');
        const hasActiveVideo = (faceVideo && faceVideo.src && faceVideo.duration > 0) || 
                              (mainVideo && mainVideo.src && mainVideo.duration > 0);
        
        emotionShowAll = !hasActiveVideo;
        window.renderEmotionFrame(0);

        // When a video starts playing later, switch to sliding window
        if (faceVideo) {
            faceVideo.addEventListener('playing', () => { emotionShowAll = false; }, { once: true });
        }
        if (mainVideo) {
            mainVideo.addEventListener('playing', () => { emotionShowAll = false; }, { once: true });
        }

        console.log(`Emotion chart loaded: ${emotionsArray.length} → ${filteredEmotions.length} data points. ShowAll: ${emotionShowAll}`);
    }

    const bioCanvas = document.getElementById('biometricChart');
    if (bioCanvas) {
        const ctxBio = bioCanvas.getContext('2d');
        new Chart(ctxBio, {
            type: 'line',
            data: {
                labels: ['0s', '5s', '10s', '15s', '20s', '25s', '30s'],
                datasets: [{
                    label: 'Heart Rate (bpm)',
                    data: [72, 74, 75, 85, 95, 92, 88],
                    borderColor: '#10b981',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#4b5563' } } },
                scales: {
                    x: { ticks: { color: '#6b7280' }, grid: { color: '#e5e7eb' } },
                    y: { ticks: { color: '#6b7280' }, grid: { color: '#e5e7eb' } }
                }
            }
        });
    }

    // Screen Height Adjustment Logic
    const heightSlider = document.getElementById('cardHeightSlider');
    if (heightSlider) {
        heightSlider.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--card-height', `${e.target.value}px`);
        });
    }

    // --- Dynamic Widget System ---
    
    // 1. Delete Widget using Event Delegation
    const dragContainer = document.getElementById('dragContainer');
    dragContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-widget')) {
            const card = e.target.closest('.draggable-card');
            if (card) {
                card.remove();
            }
        }
    });

    // 2. Add Widget Modal Logic
    const addWidgetTrigger = document.getElementById('addWidgetTrigger');
    const addWidgetModal = document.getElementById('addWidgetModal');
    const closeAddWidgetModal = document.getElementById('closeAddWidgetModal');
    const confirmAddWidgetBtn = document.getElementById('confirmAddWidgetBtn');
    const widgetTypeSelect = document.getElementById('widgetTypeSelect');

    if (addWidgetTrigger) {
        addWidgetTrigger.addEventListener('click', () => {
            addWidgetModal.classList.remove('hidden');
        });
    }

    if (closeAddWidgetModal) {
        closeAddWidgetModal.addEventListener('click', () => {
            addWidgetModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === addWidgetModal) {
            addWidgetModal.classList.add('hidden');
        }
    });

    if (confirmAddWidgetBtn) {
        confirmAddWidgetBtn.addEventListener('click', () => {
            const type = widgetTypeSelect.value;
            const template = document.getElementById(`tpl-${type}`);
            
            if (template) {
                const clone = template.content.cloneNode(true);
                const newCard = clone.querySelector('.draggable-card');
                
                newCard.id = `widget_${Date.now()}_${Math.floor(Math.random()*1000)}`;
                
                dragContainer.insertBefore(newCard, addWidgetTrigger);
                
                if (window.makeDraggable) {
                    window.makeDraggable(newCard);
                }

                // Initialize chart if chart widget
                const canvas = newCard.querySelector('canvas.widget-chart');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['0s', '5s', '10s'],
                            datasets: [{
                                label: 'Mock Data',
                                data: [Math.random()*100, Math.random()*100, Math.random()*100],
                                borderColor: '#8b5cf6',
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true, maintainAspectRatio: false
                        }
                    });
                }

                // Initialize annotation mic if annotation widget
                if (type === 'annotation') {
                    initAnnotationMic(newCard);
                }
            }
            
            addWidgetModal.classList.add('hidden');
        });
    }

    // ==================== Annotation Speech Recognition ====================
    function initAnnotationMic(card) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const micBtn = card.querySelector('.annotation-mic-btn');
        const transcriptDiv = card.querySelector('.annotation-transcript');
        const interimDiv = card.querySelector('.annotation-interim');
        if (!micBtn || !transcriptDiv) return;

        let recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ko-KR';
        recognition.maxAlternatives = 1;
        let isListening = false;

        function getTimestamp() {
            if (window.UXRPlayer && window.UXRPlayer.getPrimaryVideo) {
                const v = window.UXRPlayer.getPrimaryVideo();
                if (v && v.currentTime > 0) {
                    return window.UXRPlayer.formatTime(v.currentTime);
                }
            }
            const d = new Date();
            return d.toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        }

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript.trim();
                if (!text) continue;

                if (result.isFinal) {
                    const ts = getTimestamp();
                    const entry = document.createElement('div');
                    entry.style.cssText = 'padding:2px 0; border-bottom:1px solid #f3f4f6;';
                    entry.innerHTML = `<strong style="color:#6366f1;">[${ts}]</strong> <span contenteditable="true">${text}</span>`;
                    transcriptDiv.appendChild(entry);
                    transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
                    if (interimDiv) interimDiv.textContent = '';
                }
            }

            const lastResult = event.results[event.results.length - 1];
            if (!lastResult.isFinal && interimDiv) {
                interimDiv.textContent = lastResult[0].transcript.trim();
            }
        };

        recognition.onerror = (event) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.warn('Annotation speech error:', event.error);
            }
        };

        recognition.onend = () => {
            if (isListening) {
                try { recognition.start(); } catch(e) {}
            }
        };

        micBtn.addEventListener('click', () => {
            if (isListening) {
                isListening = false;
                recognition.stop();
                micBtn.textContent = '🎤';
                micBtn.style.background = '';
                if (window.addProgressLog) addProgressLog('음성 입력이 중지되었습니다.');
            } else {
                isListening = true;
                try { recognition.start(); } catch(e) {}
                micBtn.textContent = '🔴';
                micBtn.style.background = 'rgba(239,68,68,0.15)';
                micBtn.style.borderRadius = '4px';
                if (window.addProgressLog) addProgressLog('🎤 음성 입력이 시작되었습니다. (Annotation)');
            }
        });

        // Store reference for cleanup
        card._annotationRecognition = recognition;
    }

    // 3. Individual Video Upload & Smart Sync Flow
    const pendingUploads = {};
    const smartSyncModal = document.getElementById('smartSyncModal');
    const closeSmartSyncModal = document.getElementById('closeSmartSyncModal');
    const btnAcceptSync = document.getElementById('btnAcceptSync');
    const btnDeclineSync = document.getElementById('btnDeclineSync');

    let pendingVideoElement = null;
    let pendingFileUrl = null;

    dragContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('widget-video-upload')) {
            const file = e.target.files[0];
            if (!file) return;

            const videoElement = e.target.closest('.video-container').querySelector('.widget-video');
            pendingVideoElement = videoElement;
            pendingFileUrl = URL.createObjectURL(file);

            // Store file by video element id for later backend upload
            if (videoElement.id === 'mainVideo') {
                pendingUploads['main_video'] = file;
            } else if (videoElement.id === 'faceVideo') {
                pendingUploads['face_video'] = file;
            }

            // Load the video immediately locally so user feels response is instant
            videoElement.style.visibility = 'visible';
            videoElement.src = pendingFileUrl;
            videoElement.setAttribute('data-filename', file.name);

            // Check if there are other videos already loaded in the dashboard
            const allVideos = document.querySelectorAll('.widget-video');
            let otherActiveVideosCount = 0;
            allVideos.forEach(v => {
                // If it has a source and it's not the current one
                if (v !== videoElement && v.src && v.src !== "" && !v.src.endsWith(window.location.pathname)) {
                    otherActiveVideosCount++;
                }
            });

            if (otherActiveVideosCount > 0) {
                // Show Smart Sync Dialog
                if (smartSyncModal) smartSyncModal.classList.remove('hidden');
            }
        }
    });

    if (smartSyncModal) {
        const closeModal = () => {
            smartSyncModal.classList.add('hidden');
            pendingVideoElement = null;
            pendingFileUrl = null;
        };

        closeSmartSyncModal.addEventListener('click', closeModal);
        
        btnDeclineSync.addEventListener('click', () => {
            // "아니오 (독립 재생)" - Just close modal and leave it as independent video
            closeModal();
            console.log("User chose standalone playback.");
        });

        btnConfirmSync.addEventListener('click', async () => {
            closeModal();
            console.log("Standalone mode: auto-sync is disabled. Loading independently.");

            // Just initialize player with whatever we have
            const mainVideo = document.getElementById('mainVideo');
            const faceVideo = document.getElementById('faceVideo');
            
            if (mainVideo && faceVideo && mainVideo.src && faceVideo.src) {
                window.UXRPlayer.init(mainVideo.src, faceVideo.src);
            }
            
            if (window.addProgressLog) {
                addProgressLog('Standalone 버전에서는 자동 싱크가 지원되지 않습니다. 비디오가 로드되었습니다.');
            }
            
            pendingUploads['main_video'] = null;
            pendingUploads['face_video'] = null;
        });
    }

    // ==================== 4. Save Layout (Local Download) ====================
    const btnSaveLayout = document.getElementById('btnSaveLayout');
    if (btnSaveLayout) {
        btnSaveLayout.addEventListener('click', async () => {
            // Build layout data
            const widgets = [];
            document.querySelectorAll('#dragContainer .draggable-card').forEach(card => {
                widgets.push({
                    id: card.id,
                    title: card.querySelector('h3')?.textContent || '',
                    type: card.id.startsWith('card-') ? card.id.replace('card-', '') : 'custom'
                });
            });
            
            const layoutData = {
                project: 'Standalone_Project',
                session: 'Standalone_Session',
                widgets,
                cardHeight: document.documentElement.style.getPropertyValue('--card-height') || '350px',
                savedAt: new Date().toISOString(),
                annotations: window._uxrAnnotations || [],
                files: {
                    faceVideo: document.getElementById('faceVideo')?.getAttribute('data-filename') || '',
                    screenVideo: document.getElementById('mainVideo')?.getAttribute('data-filename') || '',
                    emotionData: window._loadedEmotionFile || '',
                    transcript: window._loadedTranscriptFile || ''
                }
            };
            
            const jsonStr = JSON.stringify(layoutData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const d = new Date();
            const pad = n => n.toString().padStart(2, '0');
            const ts = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `CAPTURE_layout_${ts}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (window.addProgressLog) addProgressLog(`레이아웃 로컬 다운로드 완료`);
            
            // Visual feedback
            btnSaveLayout.textContent = '✅ 저장됨';
            setTimeout(() => { btnSaveLayout.textContent = '💾 저장'; }, 1500);
        });
    }

    // ==================== 4b. Open Layout (from JSON file) ====================
    const btnOpenLayout = document.getElementById('btnOpenLayout');
    if (btnOpenLayout) {
        btnOpenLayout.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const layout = JSON.parse(text);
                if (window.addProgressLog) addProgressLog('레이아웃 파일 로드 중...');

                // Restore card height
                if (layout.cardHeight) {
                    document.documentElement.style.setProperty('--card-height', layout.cardHeight);
                    const slider = document.getElementById('cardHeightSlider');
                    if (slider) slider.value = parseInt(layout.cardHeight);
                }

                if (window.addProgressLog) addProgressLog('레이아웃 설정 복원 완료! 독립형 환경에서는 보안상 로컬 동영상을 자동으로 다시 불러올 수 없으므로 비디오 파일을 다시 선택해주세요.');

            } catch (err) {
                console.error('Layout open failed:', err);
                if (window.addProgressLog) addProgressLog('레이아웃 파일 파싱 실패', true);
            }
            // Reset input so same file can be re-selected
            e.target.value = '';
        });
    }

    // ==================== 5. Export Video (MediaRecorder) ====================
    const btnExportVideo = document.getElementById('btnExportVideo');
    if (btnExportVideo) {
        let mediaRecorder = null;
        let recordedChunks = [];

        btnExportVideo.addEventListener('click', async () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                btnExportVideo.textContent = '🎬 영상 추출';
                btnExportVideo.style.backgroundColor = '';
                btnExportVideo.style.color = '';
                return;
            }

            try {
                // Use screen capture to record the dashboard
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" },
                    audio: true,
                    preferCurrentTab: true
                });

                recordedChunks = [];
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
                
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) recordedChunks.push(e.data);
                };
                
                mediaRecorder.onstop = () => {
                    // Stop all tracks
                    stream.getTracks().forEach(t => t.stop());
                    const blob = new Blob(recordedChunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const d = new Date();
                    const pad = n => n.toString().padStart(2, '0');
                    const ts = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
                    a.download = `uxr_multiview_${ts}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                };

                // Handle user stopping via browser UI
                stream.getVideoTracks()[0].onended = () => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                    btnExportVideo.textContent = '🎬 영상 추출';
                    btnExportVideo.style.backgroundColor = '';
                    btnExportVideo.style.color = '';
                };

                mediaRecorder.start();
                btnExportVideo.textContent = '⏹ 녹화 중지';
                btnExportVideo.style.backgroundColor = '#ef4444';
                btnExportVideo.style.color = '#fff';

                // Also start playing videos if paused
                const playBtn = document.getElementById('playPauseBtn');
                if (playBtn && playBtn.textContent === 'Play') {
                    playBtn.click();
                }
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    console.error('Export error:', err);
                }
            }
        });
    }

    // ==================== 6. Annotation Timestamp Sync ====================
    // When an annotation widget is added, intercept Enter key to auto-insert timestamp
    window._uxrAnnotations = [];

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const target = e.target;
            // Check if we're inside an annotation widget textarea
            const card = target.closest('.draggable-card');
            if (!card || !target.matches('textarea')) return;
            
            const cardTitle = card.querySelector('h3')?.textContent || '';
            if (!cardTitle.includes('Annotation') && !cardTitle.includes('Markers')) return;

            e.preventDefault();

            // Get current video time
            const mainVideo = document.getElementById('mainVideo');
            let currentTime = 0;
            if (mainVideo && mainVideo.currentTime) {
                currentTime = mainVideo.currentTime;
            }

            const minutes = Math.floor(currentTime / 60).toString().padStart(2, '0');
            const seconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
            const timeStr = `${minutes}:${seconds}`;

            // Get current text and cursor position
            const text = target.value;
            const cursorPos = target.selectionStart;
            
            // Find the start of the current line
            const beforeCursor = text.substring(0, cursorPos);
            const lastNewline = beforeCursor.lastIndexOf('\n');
            const currentLineStart = lastNewline + 1;
            const currentLine = text.substring(currentLineStart, cursorPos).trim();

            if (currentLine.length > 0) {
                // Insert timestamp prefix to the current line content and add newline
                const timestampedLine = `[${timeStr}] ${currentLine}`;
                const newText = text.substring(0, currentLineStart) + timestampedLine + '\n' + text.substring(cursorPos);
                target.value = newText;
                
                // Move cursor to end of new line
                const newPos = currentLineStart + timestampedLine.length + 1;
                target.selectionStart = target.selectionEnd = newPos;

                // Store annotation
                window._uxrAnnotations.push({ time: timeStr, text: currentLine, seconds: currentTime });
            } else {
                // Just add a newline if empty
                target.value = text.substring(0, cursorPos) + '\n' + text.substring(cursorPos);
                target.selectionStart = target.selectionEnd = cursorPos + 1;
            }
        }
    });

    // Standalone mode: Server auto-load logic removed.

});
