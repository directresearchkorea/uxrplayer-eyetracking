const translations = {
    "EYE TRACKING": { "ko": "EYE TRACKING", "en": "EYE TRACKING" },
    "UXR PLAYER": { "ko": "UXR PLAYER", "en": "UXR PLAYER" },
    "🗂️ 다중 뷰어": { "ko": "🗂️ 다중 뷰어", "en": "🗂️ Multi Viewer" },
    "🎥 캠/화면 녹화": { "ko": "🎥 캠/화면 녹화", "en": "🎥 Cam/Screen Record" },
    "👓 아이트래킹": { "ko": "👓 아이트래킹", "en": "👓 Eye Tracking" },
    
    // Landing
    "landing_desc": { 
        "ko": "브라우저에서 바로 사용하는 UXR 아이트래킹 도구.<br>설치 없이 녹화하고, 분석하고, 리포팅하세요.", 
        "en": "UXR Eye Tracking directly in your browser.<br>Record, analyze, and report without installation." 
    },
    "리포팅": { "ko": "리포팅", "en": "Reporting" },
    "다중 뷰어": { "ko": "다중 뷰어", "en": "Multi Viewer" },
    "viewer_desc": { "ko": "Face View, Screen View, 감정 차트, 전사 텍스트를 동기화하여 통합 분석합니다.", "en": "Synchronize and analyze Face View, Screen View, Emotion Chart, and Transcripts together." },
    "녹화": { "ko": "녹화", "en": "Recording" },
    "캠/화면 녹화": { "ko": "캠/화면 녹화", "en": "Cam/Screen Record" },
    "record_desc": { "ko": "웹캠과 화면을 동시에 녹화하고 바탕화면에 바로 저장합니다.", "en": "Record webcam and screen simultaneously and save directly to your desktop." },
    "프로세싱": { "ko": "프로세싱", "en": "Processing" },
    "아이트래킹": { "ko": "아이트래킹", "en": "Eye Tracking" },
    "process_desc": { "ko": "MediaPipe 기반으로 영상에서 시선을 추적하고 결과 영상을 추출합니다.", "en": "Track gaze from video using MediaPipe and extract the result." },
    "footer_note": { "ko": "💻 PC 크롬 브라우저에 최적화되어 있습니다.", "en": "💻 Optimized for PC Chrome browsers." },

    // Record
    "👤 캠/마이크 (Face View)": { "ko": "👤 캠/마이크 (Face View)", "en": "👤 Cam/Mic (Face View)" },
    "대기 중": { "ko": "대기 중", "en": "Waiting" },
    "연결됨": { "ko": "연결됨", "en": "Connected" },
    "연결 해제됨": { "ko": "연결 해제됨", "en": "Disconnected" },
    "● 녹화 중": { "ko": "● 녹화 중", "en": "● Recording" },
    "연결 중지": { "ko": "연결 중지", "en": "Stop Conn." },
    "다시 연결": { "ko": "다시 연결", "en": "Reconnect" },
    "record_face_desc": { "ko": "웹캠 화면과 테스트 참가자의 목소리(마이크)를 녹화합니다. 표정 분석과 전사에 사용됩니다.", "en": "Records webcam view and participant's voice (microphone). Used for emotion analysis and transcripts." },
    "🖥️ 화면/시스템 (Screen View)": { "ko": "🖥️ 화면/시스템 (Screen View)", "en": "🖥️ Screen/System (Screen View)" },
    "record_screen_desc": { "ko": "PC 모니터 화면 또는 모바일 미러링 창과 해당 기기의 소리(시스템 오디오)를 녹화합니다.", "en": "Records PC monitor screen or mobile mirroring window and the device's sound (system audio)." },
    "audio_warning": { "ko": "⚠️ 시스템 오디오가 꺼져 있습니다. 화면 공유 시 '시스템 오디오 공유'를 활성화해주세요.", "en": "⚠️ System audio is muted. Please enable 'Share system audio' when sharing screen." },
    "● 녹화 시작": { "ko": "● 녹화 시작", "en": "● Start Record" },
    "■ 녹화 중지": { "ko": "■ 녹화 중지", "en": "■ Stop Record" },
    "📋 진행 로그": { "ko": "📋 진행 로그", "en": "📋 Progress Log" },

    // Eye Tracking
    "Play": { "ko": "Play", "en": "Play" },
    "👤 Face View": { "ko": "👤 Face View", "en": "👤 Face View" },
    "Face View 영상을 선택하세요": { "ko": "Face View 영상을 선택하세요", "en": "Select Face View Video" },
    "MP4, WebM 지원": { "ko": "MP4, WebM 지원", "en": "Supports MP4, WebM" },
    "💻 Screen / Game View": { "ko": "💻 Screen / Game View", "en": "💻 Screen / Game View" },
    "Screen / Game View 영상을 선택하세요": { "ko": "Screen / Game View 영상을 선택하세요", "en": "Select Screen/Game View Video" },
    "초고속 렌더링 활성화": { "ko": "초고속 렌더링 활성화", "en": "Ultra-fast Rendering Enabled" },
    "render_desc": { "ko": "브라우저 내에서 WebCodecs 기반으로 영상을 렌더링합니다. 결과는 로컬에 다운로드됩니다.", "en": "Renders video based on WebCodecs within the browser. Results are downloaded locally." },
    "🔍 샘플링 (10%)": { "ko": "🔍 샘플링 (10%)", "en": "🔍 Sampling (10%)" },
    "👓 분석 시작": { "ko": "👓 분석 시작", "en": "👓 Start Analysis" },
    "🛑 분석 중지": { "ko": "🛑 분석 중지", "en": "🛑 Stop Analysis" },
    "옵션 및 다운로드": { "ko": "옵션 및 다운로드", "en": "Options & Download" },
    "생성될 파일 이름": { "ko": "생성될 파일 이름", "en": "Output Filename" },
    "최적화 진행 (기본 파라미터 적용)": { "ko": "최적화 진행 (기본 파라미터 적용)", "en": "Optimize (Apply Default Parameters)" },
    "미세조정 진행 (수동 조절)": { "ko": "미세조정 진행 (수동 조절)", "en": "Fine-Tune (Manual Adjustment)" },
    
    // Eye Tracking - Fine Tuning
    "검출 옵션 (민감도)": { "ko": "검출 옵션 (민감도)", "en": "Detection Option (Sensitivity)" },
    "낮을수록 과격한 환경에서도 억지로 검출합니다.": { "ko": "낮을수록 과격한 환경에서도 억지로 검출합니다.", "en": "Lower values force detection even in extreme environments." },
    "Y 축 홍채 상하 영점 조절": { "ko": "Y 축 홍채 상하 영점 조절", "en": "Y-axis Iris Vertical Baseline" },
    "값이 클수록 화면(스크린)의 아래쪽을 보게 맵핑됩니다.": { "ko": "값이 클수록 화면(스크린)의 아래쪽을 보게 맵핑됩니다.", "en": "Higher values map gaze to the bottom of the screen." },
    "X축 배율 폭": { "ko": "X축 배율 폭", "en": "X-axis Scale Width" },
    "값이 클수록 좌우 시선 이동 폭이 넓어집니다.": { "ko": "값이 클수록 좌우 시선 이동 폭이 넓어집니다.", "en": "Higher values widen horizontal gaze movement." },
    "잔상 표시 빈도 (ms)": { "ko": "잔상 표시 빈도 (ms)", "en": "Trail Display Frequency (ms)" },
    "값이 작을수록 도넛이 촘촘하게 그려집니다.": { "ko": "값이 작을수록 도넛이 촘촘하게 그려집니다.", "en": "Smaller values draw tighter donuts." },
    "동공 방향 화살 표시": { "ko": "동공 방향 화살 표시", "en": "Show Pupil Direction Arrow" },
    "시선 추적 잔상(도넛) 표시": { "ko": "시선 추적 잔상(도넛) 표시", "en": "Show Gaze Tracking Trail (Donut)" },
    "고급 보정 옵션": { "ko": "고급 보정 옵션", "en": "Advanced Calibration Options" },
    "X축(좌우) 영점 조절": { "ko": "X축(좌우) 영점 조절", "en": "X-axis (Horizontal) Baseline" },
    "시선이 치우칠 경우 좌(-) 우(+)로 조정하세요.": { "ko": "시선이 치우칠 경우 좌(-) 우(+)로 조정하세요.", "en": "Adjust left(-) or right(+) if gaze is skewed." },
    "Y축(상하) 영점 조절": { "ko": "Y축(상하) 영점 조절", "en": "Y-axis (Vertical) Baseline" },
    "시선이 위로 치우치면 슬라이더를 오른쪽(+)으로, 아래로 치우치면 왼쪽(-)으로 조절하세요.": { "ko": "시선이 위로 치우치면 슬라이더를 오른쪽(+)으로, 아래로 치우치면 왼쪽(-)으로 조절하세요.", "en": "Adjust right(+) if skewed up, left(-) if skewed down." },
    "자동 영점 보정 (Auto Min/Max Scaling)": { "ko": "자동 영점 보정 (Auto Min/Max Scaling)", "en": "Auto Min/Max Scaling" },
    "머리 자세 보정 (Head Pose)": { "ko": "머리 자세 보정 (Head Pose)", "en": "Head Pose Calibration" },
    "블링크 감지 임계값 (EAR)": { "ko": "블링크 감지 임계값 (EAR)", "en": "Blink Detection Threshold (EAR)" },
    "값이 낮으면 감은 눈만, 높으면 살짝 감아도 블링크로 처리합니다.": { "ko": "값이 낮으면 감은 눈만, 높으면 살짝 감아도 블링크로 처리합니다.", "en": "Lower values only detect fully closed eyes; higher values detect slight blinks." },
    "시선 안정화 (스무딩 프레임 수)": { "ko": "시선 안정화 (스무딩 프레임 수)", "en": "Gaze Stabilization (Smoothing Frames)" },
    "값이 클수록 시선이 부드럽지만 반응이 느려집니다.": { "ko": "값이 클수록 시선이 부드럽지만 반응이 느려집니다.", "en": "Higher values make gaze smoother but slower to react." },
    "Fixation 속도 임계값 (px/frame)": { "ko": "Fixation 속도 임계값 (px/frame)", "en": "Fixation Speed Threshold (px/frame)" },
    "시선 이동 속도가 이 값 이하이면 Fixation(응시)으로 판정합니다.": { "ko": "시선 이동 속도가 이 값 이하이면 Fixation(응시)으로 판정합니다.", "en": "Gaze is considered Fixation if movement speed is below this value." },
    "Fixation/Saccade 시각화": { "ko": "Fixation/Saccade 시각화", "en": "Visualize Fixation/Saccade" },

    // Viewer
    "▶ Play": { "ko": "▶ Play", "en": "▶ Play" },
    "🔄 초기화": { "ko": "🔄 초기화", "en": "🔄 Reset" },
    "🔄 레이아웃 전환": { "ko": "🔄 레이아웃 전환", "en": "🔄 Toggle Layout" },
    "Screen Height": { "ko": "Screen Height", "en": "Screen Height" },

    // Dynamic Logs (Record)
    "log_record_loaded": { "ko": "캠/화면 녹화 페이지가 로드되었습니다. 연결 버튼을 눌러 시작하세요.", "en": "Cam/Screen Record page loaded. Click Connect to start." },
    "log_face_connected": { "ko": "웹캠이 연결되었습니다.", "en": "Webcam connected." },
    "log_face_connected_mic": { "ko": "웹캠이 연결되었습니다. (마이크 활성)", "en": "Webcam connected. (Mic active)" },
    "log_face_failed": { "ko": "웹캠 연결에 실패했습니다: ", "en": "Failed to connect webcam: " },
    "log_screen_connected": { "ko": "화면 공유가 연결되었습니다. (시스템 오디오 활성)", "en": "Screen share connected. (System audio active)" },
    "log_audio_warning_sys": { "ko": "⚠️ 시스템 오디오가 꺼져 있습니다.", "en": "⚠️ System audio is muted." },
    "log_face_stopped": { "ko": "웹캠 연결이 중지되었습니다.", "en": "Webcam connection stopped." },
    "log_screen_stopped": { "ko": "화면 공유가 중지되었습니다.", "en": "Screen share stopped." },
    "log_no_audio_start": { "ko": "⚠️ 시스템 오디오 없이 녹화를 시작합니다.", "en": "⚠️ Starting record without system audio." },
    "log_record_start": { "ko": "🔴 녹화가 시작되었습니다.", "en": "🔴 Recording started." },
    "log_record_stop": { "ko": "⏹ 녹화를 중지합니다. 파일을 다운로드합니다...", "en": "⏹ Stopping record. Downloading files..." },
    "log_download_face": { "ko": "✅ Face View 녹화 파일 다운로드: ", "en": "✅ Download Face View record: " },
    "log_download_screen": { "ko": "✅ Screen View 녹화 파일 다운로드: ", "en": "✅ Download Screen View record: " },
    "log_saved": { "ko": "녹화 파일이 바탕화면(다운로드 폴더)에 저장되었습니다.", "en": "Record files saved to your Downloads folder." },

    // Dynamic Logs (Eye Tracking)
    "btn_start_tracking": { "ko": "👓 분석 시작", "en": "👓 Start Analysis" },
    "btn_tracking": { "ko": "⏳ 트래킹 중...", "en": "⏳ Tracking..." },
    "status_stop_render": { "ko": "⏹ 렌더링을 중지하고 있습니다...", "en": "⏹ Stopping rendering..." },
    "status_export_prep": { "ko": "⏳ Export 준비 중...", "en": "⏳ Preparing Export..." },
    "status_sample_dl": { "ko": "⏳ 샘플링 영상 로컬 다운로드 중...", "en": "⏳ Downloading sampling video locally..." },
    "status_local_dl": { "ko": "⏳ 로컬 파일 다운로드 준비 중...", "en": "⏳ Preparing local file download..." },
    "status_fail_webm": { "ko": "❌ webm-muxer 라이브러리 로드 실패. 브라우저를 확인하세요.", "en": "❌ Failed to load webm-muxer library. Check browser." },
    "status_fail_codec": { "ko": "❌ 이 브라우저는 WebCodecs를 지원하지 않습니다. Chrome 94+ 이상을 사용하세요.", "en": "❌ Browser does not support WebCodecs. Use Chrome 94+." },
    "status_render_done": { "ko": "✅ 렌더링 완료! 파일 생성 중...", "en": "✅ Rendering complete! Generating file..." },
    "status_stop_track": { "ko": "⏹ 트래킹을 중지하고 있습니다...", "en": "⏹ Stopping tracking..." }
};

// State
let currentLang = localStorage.getItem('lang') || 'ko';

// Function to translate dynamically generated text
window.t = function(key) {
    if (translations[key] && translations[key][currentLang]) {
        return translations[key][currentLang];
    }
    return key;
};

// Function to apply translation to DOM
function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key] && translations[key][currentLang]) {
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translations[key][currentLang];
            } else if (key === 'landing_desc') {
                el.innerHTML = translations[key][currentLang];
            } else {
                // If it contains child elements, only replace text nodes?
                // Simplest is just replacing textContent, but if there's spans inside, it breaks.
                // We'll replace textContent for most, innerHTML for specific ones like landing_desc.
                el.textContent = translations[key][currentLang];
            }
        }
    });

    // Update toggle button text
    const toggleBtn = document.getElementById('langToggle');
    if (toggleBtn) {
        toggleBtn.textContent = currentLang === 'ko' ? 'ENG' : 'KOR';
    }
}

// Function to set language
window.setLanguage = function(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();

    const toggleBtn = document.getElementById('langToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ko' ? 'en' : 'ko';
            setLanguage(newLang);
        });
    }
});
