/**
 * UXR Dual Video Player Controller
 * Handles synchronization between Game/Screen video and Face Video.
 */
window.UXRPlayer = (function() {
    let mainVideo, faceVideo;
    let playBtn, timeline, timeDisplay;
    let isPlaying = false;
    let isSeeking = false;
    let isInitialized = false;
    
    let syncOffsetMs = 0; 
    let transcriptEntries = [];

    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function getPrimaryVideo() {
        if (mainVideo && mainVideo.src && mainVideo.duration) return mainVideo;
        if (faceVideo && faceVideo.src && faceVideo.duration) return faceVideo;
        if (mainVideo && mainVideo.src) return mainVideo;
        if (faceVideo && faceVideo.src) return faceVideo;
        return null;
    }

    function getLoadedVideos() {
        const videos = [];
        if (mainVideo && mainVideo.src && !mainVideo.src.endsWith('/')) videos.push(mainVideo);
        if (faceVideo && faceVideo.src && !faceVideo.src.endsWith('/')) videos.push(faceVideo);
        return videos;
    }

    function updateTimeDisplay() {
        const primary = getPrimaryVideo();
        if (primary && primary.duration) {
            timeDisplay.textContent = `${formatTime(primary.currentTime)} / ${formatTime(primary.duration)}`;
        }
    }

    function updatePlayReadyState() {
        const loaded = getLoadedVideos();
        if (loaded.length > 0) {
            playBtn.style.backgroundColor = '#10b981';
            playBtn.style.color = '#fff';
            playBtn.style.borderColor = '#10b981';
            playBtn.title = `${loaded.length}개 영상 씽킹 및 준비됨`;
        } else {
            playBtn.style.backgroundColor = '';
            playBtn.style.color = '';
            playBtn.style.borderColor = '';
            playBtn.title = '';
        }
    }

    function togglePlayPause() {
        const loaded = getLoadedVideos();
        if (loaded.length === 0) {
            alert('먼저 영상 파일을 업로드해 주세요.');
            return;
        }

        if (isPlaying) {
            loaded.forEach(v => v.pause());
            playBtn.innerHTML = '▶ Play';
            playBtn.style.backgroundColor = '#10b981';
            playBtn.style.color = '#fff';
            playBtn.style.borderColor = '#10b981';
        } else {
            loaded.forEach(v => v.play().catch(() => {}));
            playBtn.innerHTML = '⏸ Pause';
            playBtn.style.backgroundColor = '#ef4444';
            playBtn.style.color = '#fff';
            playBtn.style.borderColor = '#ef4444';
        }
        isPlaying = !isPlaying;
    }

    function handleTimelineChange() {
        const primary = getPrimaryVideo();
        if (!primary || !primary.duration) return;
        const targetTime = (timeline.value / 100) * primary.duration;
        
        const loaded = getLoadedVideos();
        loaded.forEach(v => {
            if (v === mainVideo) {
                v.currentTime = targetTime;
            } else if (v === faceVideo) {
                v.currentTime = targetTime + (syncOffsetMs / 1000);
            }
        });
    }

    let lastActiveIndex = -1;
    function updateTranscriptHighlight(currentTime) {
        if (!transcriptEntries || transcriptEntries.length === 0) return;
        
        let activeIndex = -1;
        for (let i = 0; i < transcriptEntries.length; i++) {
            if (transcriptEntries[i].time <= currentTime + 0.5) { // Add 0.5s tolerance
                activeIndex = i;
            } else {
                break;
            }
        }
        
        if (activeIndex !== -1 && activeIndex !== lastActiveIndex) {
            if (lastActiveIndex !== -1) {
                const prevEl = document.getElementById(`ts-line-${lastActiveIndex}`);
                if (prevEl) {
                    prevEl.style.fontWeight = 'normal';
                    prevEl.style.color = '';
                    prevEl.style.backgroundColor = '';
                    prevEl.style.padding = '0';
                }
            }
            
            const currEl = document.getElementById(`ts-line-${activeIndex}`);
            if (currEl) {
                currEl.style.fontWeight = 'bold';
                currEl.style.color = 'var(--primary-color, #10b981)';
                currEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                currEl.style.padding = '4px 8px';
                currEl.style.borderRadius = '4px';
                currEl.style.transition = 'all 0.3s ease';
                
                const box = document.getElementById('transcriptBox');
                if (box) {
                    // Calculate scroll position to center the item
                    const boxRect = box.getBoundingClientRect();
                    const elRect = currEl.getBoundingClientRect();
                    const scrollTop = currEl.offsetTop - (boxRect.height / 2) + (elRect.height / 2);
                    box.scrollTo({ top: scrollTop, behavior: 'smooth' });
                }
            }
            lastActiveIndex = activeIndex;
        }
    }

    function renderTranscript() {
        const box = document.getElementById('transcriptBox');
        if (!box) return;
        if (transcriptEntries.length === 0) {
            box.innerHTML = `<p class="placeholder-text" style="padding: 10px; margin-top:35px;">프로세싱 > STT 에서 생성한 전사 파일(.txt)을 로드하세요.</p>`;
            return;
        }
        let html = '';
        transcriptEntries.forEach((entry, i) => {
            html += `<p id="ts-line-${i}" style="margin-bottom:0.5rem;"><strong>${formatTime(entry.time)}</strong>: ${entry.text}</p>`;
        });
        box.innerHTML = html;
        lastActiveIndex = -1;
        // Scroll to top initially
        box.scrollTop = 0;
    }

    function setupControls() {
        mainVideo = document.getElementById('mainVideo');
        faceVideo = document.getElementById('faceVideo');
        playBtn = document.getElementById('playPauseBtn');
        timeline = document.getElementById('masterTimeline');
        timeDisplay = document.getElementById('timeDisplay');

        if (!playBtn || !timeline || !timeDisplay) return;

        playBtn.addEventListener('click', togglePlayPause);

        const resetBtn = document.getElementById('resetViewerBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const loaded = getLoadedVideos();
                loaded.forEach(v => {
                    v.pause();
                    v.src = '';
                    v.style.visibility = 'hidden';
                    v.removeAttribute('src');
                    v.load();
                });
                
                document.querySelectorAll('.open-video-badge').forEach(badge => {
                    badge.style.display = 'flex';
                });
                
                document.querySelectorAll('.widget-video-upload').forEach(input => {
                    input.value = '';
                });

                isPlaying = false;
                playBtn.innerHTML = '▶ Play';
                playBtn.style.backgroundColor = '';
                playBtn.style.color = '';
                playBtn.style.borderColor = '';
                playBtn.title = '';

                timeline.value = 0;
                timeDisplay.textContent = '00:00 / 00:00';
                
                transcriptEntries = [];
                renderTranscript();
                
                // Clear charts
                if (window.Chart) {
                    ['chartHappy', 'chartNeutral', 'chartStress'].forEach(id => {
                        const chart = Chart.getChart(id);
                        if (chart && chart.data) {
                            chart.data.datasets.forEach(ds => ds.data = []);
                            chart.update();
                        }
                    });
                }
                
                if (window.addProgressLog) addProgressLog('뷰어의 모든 영상과 상태가 초기화되었습니다.');
            });
        }

        timeline.addEventListener('mousedown', () => isSeeking = true);
        timeline.addEventListener('input', () => {
            const primary = getPrimaryVideo();
            if (primary && primary.duration) {
                const targetTime = (timeline.value / 100) * primary.duration;
                timeDisplay.textContent = `${formatTime(targetTime)} / ${formatTime(primary.duration)}`;
            }
        });
        timeline.addEventListener('change', () => {
            handleTimelineChange();
            isSeeking = false;
        });

        function watchVideo(videoEl, label) {
            if (!videoEl) return;
            const observer = new MutationObserver(() => {
                if (videoEl.src && !videoEl.src.endsWith('/')) {
                    updatePlayReadyState();
                    if (window.addProgressLog) addProgressLog(`${label} 파일이 로드되었습니다.`);
                }
            });
            observer.observe(videoEl, { attributes: true, attributeFilter: ['src'] });

            videoEl.addEventListener('loadedmetadata', () => {
                updatePlayReadyState();
                updateTimeDisplay();
            });

            videoEl.addEventListener('timeupdate', () => {
                if (!isSeeking && videoEl === getPrimaryVideo() && videoEl.duration) {
                    const progress = (videoEl.currentTime / videoEl.duration) * 100;
                    timeline.value = progress;
                    updateTimeDisplay();
                    updateTranscriptHighlight(videoEl.currentTime);
                }
                if (videoEl === faceVideo && window.renderEmotionFrame) {
                    window.renderEmotionFrame(faceVideo.currentTime);
                }
            });

            videoEl.addEventListener('ended', () => {
                isPlaying = false;
                playBtn.innerHTML = '▶ Play';
                playBtn.style.backgroundColor = '#10b981';
                playBtn.style.color = '#fff';
                playBtn.style.borderColor = '#10b981';
            });
        }

        watchVideo(mainVideo, '🖥️ Screen View');
        watchVideo(faceVideo, '👤 Face View');

        setInterval(() => {
            if (isPlaying && mainVideo && faceVideo && mainVideo.src && faceVideo.src) {
                const expectedFaceTime = mainVideo.currentTime + (syncOffsetMs / 1000);
                if (Math.abs(faceVideo.currentTime - expectedFaceTime) > 0.3) {
                    faceVideo.currentTime = expectedFaceTime;
                }
            }
        }, 2000);

        isInitialized = true;
        console.log("UXR Player Controls Ready");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupControls);
    } else {
        setupControls();
    }

    return {
        setSyncOffset: function(offsetMs) {
            syncOffsetMs = offsetMs;
            console.log("Sync offset updated to:", offsetMs, "ms");
        },
        setTranscriptData: function(data) {
            transcriptEntries = data;
            renderTranscript();
        },
        renderTranscript: renderTranscript,
        getPrimaryVideo: getPrimaryVideo,
        formatTime: formatTime,
        init: function(mainSrc, faceSrc) {
            if (!isInitialized) setupControls();
            if (mainSrc && mainVideo) mainVideo.src = mainSrc;
            if (faceSrc && faceVideo) faceVideo.src = faceSrc;
            updatePlayReadyState();
            console.log("UXR Dual Player Initialized");
        }
    };
})();
