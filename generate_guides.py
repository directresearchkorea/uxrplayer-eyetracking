import os

TOPBAR = '''<nav class="topbar-nav">
<a href="index.html" class="topbar-logo"><div>
<div class="logo-text">EYE TRACKING</div><div class="logo-sub">UXR PLAYER</div>
</div></a>
<div class="topbar-menu">
<a href="record.html">{nav_rec}</a>
<a href="eyetracking.html">{nav_eye}</a>
<a href="viewer.html">{nav_view}</a>
</div>
<div class="topbar-right"><span class="currentTimeDisplay"></span></div>
</nav>'''

def gen(lang):
    ko = lang == 'ko'
    nav_rec = '🎥 캠/화면 녹화' if ko else '🎥 Cam/Screen Record'
    nav_eye = '👓 아이트래킹' if ko else '👓 Eye Tracking'
    nav_view = '🗂️ 다중 뷰어' if ko else '🗂️ Multi Viewer'
    topbar = TOPBAR.format(nav_rec=nav_rec, nav_eye=nav_eye, nav_view=nav_view)

    title = 'User Guide - UXR Eye Tracking 사용 가이드' if ko else 'User Guide - UXR Eye Tracking'
    meta_desc = '브라우저 기반 UXR 아이트래킹 도구의 상세 사용 가이드입니다.' if ko else 'Detailed user guide for the browser-based UXR Eye Tracking tool.'

    # --- Content ---
    hero_title = '📖 User Guide' 
    hero_sub = '브라우저에서 바로 사용하는 UXR 아이트래킹 도구 사용 가이드' if ko else 'Complete guide for the browser-based UXR Eye Tracking tool'

    prereq_title = '사전 준비 사항' if ko else 'Prerequisites'
    prereq_items = [
        ('💻', 'PC Chrome 브라우저 (최신 버전 권장)' if ko else 'PC Chrome Browser (latest version recommended)'),
        ('📷', '웹캠 (내장 또는 외장)' if ko else 'Webcam (built-in or external)'),
        ('🎤', '마이크 (음성 녹음용)' if ko else 'Microphone (for voice recording)'),
    ]

    toc_title = '목차' if ko else 'Table of Contents'
    
    # Step 1
    s1_title = 'Step 1: 캠/화면 녹화' if ko else 'Step 1: Cam/Screen Recording'
    s1_icon = '🎥'
    s1_desc = '웹캠과 화면을 동시에 녹화하여 UX 리서치 데이터를 수집합니다.' if ko else 'Record webcam and screen simultaneously to collect UX research data.'
    s1_steps = [
        ('1-1', 
         '웹캠(Face View) 연결' if ko else 'Connect Webcam (Face View)',
         [
            '"다시 연결" 버튼을 클릭합니다.' if ko else 'Click the "Reconnect" button.',
            '브라우저에서 카메라/마이크 접근 권한을 허용합니다.' if ko else 'Allow camera/microphone access in the browser.',
            '연결 성공 시 상태 배지가 초록색 "연결됨"으로 변경됩니다.' if ko else 'On success, the status badge turns green "Connected".',
            '오디오 레벨 미터(🎤)가 활성화되어 마이크 입력을 확인할 수 있습니다.' if ko else 'The audio level meter (🎤) activates to show mic input.',
         ]),
        ('1-2',
         '화면(Screen View) 연결' if ko else 'Connect Screen (Screen View)',
         [
            '"다시 연결" 버튼을 클릭합니다.' if ko else 'Click the "Reconnect" button.',
            '공유할 화면을 선택합니다 (전체 화면 / 창 / 탭).' if ko else 'Select the screen to share (Entire Screen / Window / Tab).',
            '⚠️ <strong>"시스템 오디오 공유"를 반드시 체크하세요!</strong> 체크하지 않으면 기기 소리가 녹음되지 않습니다.' if ko else '⚠️ <strong>Make sure to check "Share system audio"!</strong> Without it, device sound will not be recorded.',
            '연결 성공 시 상태 배지가 초록색 "연결됨"으로 변경됩니다.' if ko else 'On success, the status badge turns green "Connected".',
         ]),
        ('1-3',
         '녹화 시작 및 중지' if ko else 'Start and Stop Recording',
         [
            '<strong>"● 녹화 시작"</strong> 버튼을 클릭하면 녹화가 시작되고 타이머가 동작합니다.' if ko else '<strong>"● Start Record"</strong> button starts recording and the timer begins.',
            '녹화 중에는 상태 배지가 빨간색 "● 녹화 중"으로 변경됩니다.' if ko else 'During recording, the status badge changes to red "● Recording".',
            '<strong>"■ 녹화 중지"</strong> 버튼을 클릭하면 녹화가 종료됩니다.' if ko else '<strong>"■ Stop Record"</strong> button stops the recording.',
            '녹화 파일이 자동으로 다운로드됩니다: <code>record_face_날짜_시간.webm</code>, <code>record_screen_날짜_시간.webm</code>' if ko else 'Recording files are automatically downloaded: <code>record_face_DATE_TIME.webm</code>, <code>record_screen_DATE_TIME.webm</code>',
         ]),
        ('1-4',
         '진행 로그 확인' if ko else 'Check Progress Log',
         [
            '하단의 "📋 진행 로그" 패널에서 모든 동작 이력을 실시간으로 확인할 수 있습니다.' if ko else 'Check the "📋 Progress Log" panel at the bottom for real-time action history.',
         ]),
    ]

    # Step 2
    s2_title = 'Step 2: 아이트래킹 분석' if ko else 'Step 2: Eye Tracking Analysis'
    s2_icon = '👓'
    s2_desc = 'MediaPipe 기반으로 녹화 영상에서 시선을 추적하고 결과 영상을 생성합니다.' if ko else 'Track gaze from recorded videos using MediaPipe and generate result videos.'
    s2_steps = [
        ('2-1',
         '영상 불러오기' if ko else 'Load Videos',
         [
            '<strong>Face View</strong> 영역(📂)을 클릭하여 Face 녹화 파일을 선택합니다.' if ko else 'Click the <strong>Face View</strong> area (📂) to select the Face recording file.',
            '<strong>Screen / Game View</strong> 영역(📂)을 클릭하여 Screen 녹화 파일을 선택합니다.' if ko else 'Click the <strong>Screen / Game View</strong> area (📂) to select the Screen recording file.',
            '지원 포맷: MP4, WebM' if ko else 'Supported formats: MP4, WebM',
         ]),
        ('2-2',
         '분석 옵션 설정' if ko else 'Configure Analysis Options',
         [
            '<strong>파일 이름</strong>: 생성될 결과 파일의 이름을 지정합니다.' if ko else '<strong>Filename</strong>: Set the output filename.',
            '<strong>최적화 진행</strong> (기본): 기본 파라미터가 자동으로 적용됩니다. 대부분의 경우 이 모드로 충분합니다.' if ko else '<strong>Optimize</strong> (default): Default parameters are applied automatically. Sufficient for most cases.',
            '<strong>미세조정 진행</strong>: 수동으로 파라미터를 조절할 수 있습니다 (민감도, Y축 영점, X축 배율 등).' if ko else '<strong>Fine-Tune</strong>: Manually adjust parameters (sensitivity, Y-axis baseline, X-axis scale, etc.).',
         ]),
        ('2-3',
         '샘플링 및 분석 실행' if ko else 'Sampling and Analysis',
         [
            '<strong>"🔍 샘플링 (10%)"</strong>: 전체 영상의 10%만 빠르게 분석하여 결과를 미리 확인합니다.' if ko else '<strong>"🔍 Sampling (10%)"</strong>: Quickly analyze 10% of the video for preview.',
            '<strong>"👓 분석 시작"</strong>: 전체 영상에 대해 시선 추적 분석을 시작합니다.' if ko else '<strong>"👓 Start Analysis"</strong>: Start full gaze tracking analysis.',
            '<strong>"🛑 분석 중지"</strong>: 진행 중인 분석을 중단할 수 있습니다.' if ko else '<strong>"🛑 Stop Analysis"</strong>: Stop the ongoing analysis.',
            '분석 완료 시 결과 영상이 자동으로 다운로드됩니다.' if ko else 'When analysis is complete, the result video is automatically downloaded.',
         ]),
    ]

    # Step 3
    s3_title = 'Step 3: 다중 뷰어' if ko else 'Step 3: Multi Viewer'
    s3_icon = '🗂️'
    s3_desc = 'Face View와 Screen View를 동기화하여 통합 분석합니다.' if ko else 'Synchronize Face View and Screen View for integrated analysis.'
    s3_steps = [
        ('3-1',
         '영상 불러오기' if ko else 'Load Videos',
         [
            '각 카드의 <strong>"📁 Open"</strong> 버튼을 클릭하여 영상 파일을 선택합니다.' if ko else 'Click <strong>"📁 Open"</strong> on each card to select video files.',
            'Face View, Screen View 각각 별도로 영상을 불러올 수 있습니다.' if ko else 'Load videos separately for Face View and Screen View.',
         ]),
        ('3-2',
         '동기화 재생' if ko else 'Synchronized Playback',
         [
            '<strong>"▶ Play"</strong> 버튼으로 모든 영상을 동시에 재생/일시정지합니다.' if ko else '<strong>"▶ Play"</strong> button plays/pauses all videos simultaneously.',
            '마스터 타임라인 슬라이더로 모든 영상의 재생 위치를 동기화합니다.' if ko else 'Master timeline slider synchronizes playback position across all videos.',
            '<strong>"🔄 초기화"</strong> 버튼으로 모든 영상을 초기 상태로 리셋합니다.' if ko else '<strong>"🔄 Reset"</strong> button resets all videos to initial state.',
         ]),
        ('3-3',
         '레이아웃 및 위젯 관리' if ko else 'Layout and Widget Management',
         [
            '<strong>"🔄 레이아웃 전환"</strong>: 세로/가로 레이아웃을 토글합니다.' if ko else '<strong>"🔄 Toggle Layout"</strong>: Switch between vertical/horizontal layout.',
            '<strong>Screen Height</strong> 슬라이더로 카드 높이를 조절합니다.' if ko else '<strong>Screen Height</strong> slider adjusts card height.',
            '카드 헤더의 <strong>⋮⋮</strong> 핸들을 드래그하여 순서를 변경할 수 있습니다.' if ko else 'Drag the <strong>⋮⋮</strong> handle on card headers to reorder.',
            '<strong>🗑️</strong> 아이콘으로 불필요한 위젯을 제거할 수 있습니다.' if ko else '<strong>🗑️</strong> icon removes unnecessary widgets.',
         ]),
    ]

    # Tips
    tips_title = '💡 Tips & FAQ' if ko else '💡 Tips & FAQ'
    tips = [
        ('권장 브라우저' if ko else 'Recommended Browser', 'PC Chrome 최신 버전에서 최적의 성능을 제공합니다. WebCodecs API를 지원하는 Chrome 94 이상을 권장합니다.' if ko else 'Best performance on latest PC Chrome. Chrome 94+ with WebCodecs API support is recommended.'),
        ('녹화 파일 포맷' if ko else 'Recording Format', 'WebM 포맷(VP9 코덱)으로 저장됩니다. 필요 시 별도 변환 도구로 MP4로 변환할 수 있습니다.' if ko else 'Saved in WebM format (VP9 codec). Convert to MP4 using external tools if needed.'),
        ('시스템 오디오 문제' if ko else 'System Audio Issue', '화면 공유 시 "시스템 오디오 공유" 옵션이 보이지 않으면 "전체 화면" 또는 "크롬 탭"을 선택하세요.' if ko else 'If "Share system audio" option is not visible, select "Entire Screen" or "Chrome Tab".'),
        ('미세조정 추천값' if ko else 'Fine-Tune Recommended Values', '대부분의 경우 기본 최적화 모드로 충분합니다. 결과가 부정확할 때만 미세조정을 사용하세요.' if ko else 'Default optimization mode is sufficient for most cases. Use fine-tuning only when results are inaccurate.'),
    ]

    back_text = '← 메인으로 돌아가기' if ko else '← Back to Main'

    # --- BUILD HTML ---
    steps_html = ''
    for sect_id, sect_title, sect_icon, sect_desc, sect_img, sect_steps in [
        ('step1', s1_title, s1_icon, s1_desc, 'record_page.png', s1_steps),
        ('step2', s2_title, s2_icon, s2_desc, 'eyetracking_page.png', s2_steps),
        ('step3', s3_title, s3_icon, s3_desc, 'viewer_page.png', s3_steps),
    ]:
        sub_html = ''
        for num, stitle, sitems in sect_steps:
            items = ''.join(f'<li>{x}</li>' for x in sitems)
            sub_html += f'<div class="sub-step"><h3>{num}. {stitle}</h3><ul>{items}</ul></div>'

        extra_img = ''
        if sect_id == 'step2':
            cap2 = '아이트래킹 설정 패널' if ko else 'Eye Tracking Settings Panel'
            extra_img = f'<figure class="guide-screenshot"><img src="static/img/guide/eyetracking_settings.png" alt="{cap2}"><figcaption>{cap2}</figcaption></figure>'

        cap = sect_title
        steps_html += f'''
<section class="guide-section" id="{sect_id}">
<div class="section-header"><span class="section-icon">{sect_icon}</span><div><h2>{sect_title}</h2><p>{sect_desc}</p></div></div>
<figure class="guide-screenshot"><img src="static/img/guide/{sect_img}" alt="{cap}"><figcaption>{cap}</figcaption></figure>
{extra_img}
{sub_html}
</section>'''

    prereq_html = ''.join(f'<div class="prereq-item"><span class="prereq-icon">{ic}</span><span>{tx}</span></div>' for ic, tx in prereq_items)

    tips_html = ''.join(f'<div class="tip-card"><h4>{t}</h4><p>{d}</p></div>' for t, d in tips)

    toc_s1 = s1_title; toc_s2 = s2_title; toc_s3 = s3_title

    workflow_labels = ('녹화','분석','리포팅') if ko else ('Record','Analyze','Report')

    html = f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{meta_desc}">
<link rel="stylesheet" href="static/css/style.css">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
body {{ overflow-y: auto; }}
.guide-wrapper {{ max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }}
.guide-hero {{ text-align: center; margin-bottom: 2.5rem; padding: 2.5rem 1.5rem; background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border-radius: 16px; border: 1px solid #e0e7ff; }}
.guide-hero h1 {{ font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-primary); }}
.guide-hero p {{ color: var(--text-secondary); font-size: 1rem; }}
.workflow-diagram {{ display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 1.5rem 0 0; }}
.wf-step {{ background: #fff; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.6rem 1.2rem; font-weight: 600; font-size: 0.85rem; box-shadow: var(--shadow-sm); }}
.wf-step:nth-child(1) {{ color: #ef4444; border-color: #fecaca; }}
.wf-step:nth-child(3) {{ color: #7c3aed; border-color: #ddd6fe; }}
.wf-step:nth-child(5) {{ color: #3b82f6; border-color: #bfdbfe; }}
.wf-arrow {{ font-size: 1.2rem; color: var(--text-light); }}
.prereq-box {{ background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem; }}
.prereq-box h3 {{ margin-bottom: 0.75rem; }}
.prereq-item {{ display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0; font-size: 0.9rem; }}
.prereq-icon {{ font-size: 1.2rem; }}
.toc-box {{ background: #fff; border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 2.5rem; }}
.toc-box h3 {{ margin-bottom: 0.75rem; font-size: 0.95rem; }}
.toc-box a {{ display: block; padding: 0.35rem 0; color: var(--accent-blue); text-decoration: none; font-size: 0.9rem; font-weight: 500; }}
.toc-box a:hover {{ text-decoration: underline; }}
.guide-section {{ margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color); }}
.section-header {{ display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }}
.section-icon {{ font-size: 2rem; flex-shrink: 0; margin-top: 2px; }}
.section-header h2 {{ font-size: 1.4rem; font-weight: 700; margin-bottom: 0.25rem; }}
.section-header p {{ color: var(--text-secondary); font-size: 0.9rem; margin: 0; }}
.guide-screenshot {{ margin: 1.5rem 0; text-align: center; }}
.guide-screenshot img {{ max-width: 100%; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.08); transition: transform 0.3s; }}
.guide-screenshot img:hover {{ transform: scale(1.02); }}
.guide-screenshot figcaption {{ margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-light); }}
.sub-step {{ margin: 1.25rem 0; padding: 1rem 1.25rem; background: #f9fafb; border-radius: 10px; border-left: 3px solid var(--accent-blue); }}
.sub-step h3 {{ font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary); }}
.sub-step ul {{ list-style: none; padding: 0; }}
.sub-step li {{ padding: 0.3rem 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; padding-left: 1.2rem; position: relative; }}
.sub-step li::before {{ content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: 700; }}
.tips-section {{ margin-bottom: 2rem; }}
.tips-section h2 {{ font-size: 1.4rem; font-weight: 700; margin-bottom: 1rem; }}
.tip-card {{ background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); border: 1px solid #bfdbfe; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; }}
.tip-card h4 {{ font-size: 0.9rem; font-weight: 600; margin-bottom: 0.3rem; color: var(--accent-blue); }}
.tip-card p {{ font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }}
.back-link {{ display: inline-block; margin-top: 1rem; color: var(--accent-blue); text-decoration: none; font-weight: 600; font-size: 0.9rem; }}
.back-link:hover {{ text-decoration: underline; }}
#scrollTopBtn {{ position: fixed; bottom: 2rem; right: 2rem; width: 44px; height: 44px; border-radius: 50%; background: var(--action-dark); color: #fff; border: none; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transition: opacity 0.3s; z-index: 99; }}
#scrollTopBtn.visible {{ opacity: 1; }}
</style>
</head>
<body>
{topbar}
<div class="layout-wrapper">
<main class="main-content" style="overflow-y:auto;">
<div class="guide-wrapper">

<div class="guide-hero">
<h1>{hero_title}</h1>
<p>{hero_sub}</p>
<div class="workflow-diagram">
<div class="wf-step">{s1_icon} {workflow_labels[0]}</div>
<span class="wf-arrow">→</span>
<div class="wf-step">{s2_icon} {workflow_labels[1]}</div>
<span class="wf-arrow">→</span>
<div class="wf-step">{s3_icon} {workflow_labels[2]}</div>
</div>
</div>

<div class="prereq-box">
<h3>{prereq_title}</h3>
{prereq_html}
</div>

<div class="toc-box">
<h3>{toc_title}</h3>
<a href="#step1">{toc_s1}</a>
<a href="#step2">{toc_s2}</a>
<a href="#step3">{toc_s3}</a>
<a href="#tips">{tips_title}</a>
</div>

{steps_html}

<section class="tips-section" id="tips">
<h2>{tips_title}</h2>
{tips_html}
</section>

<a href="index.html" class="back-link">{back_text}</a>
</div>
</main>
</div>

<button id="scrollTopBtn" onclick="document.querySelector('.main-content').scrollTo({{top:0,behavior:'smooth'}})">↑</button>
<script>
const mc = document.querySelector('.main-content');
const btn = document.getElementById('scrollTopBtn');
if(mc && btn) mc.addEventListener('scroll', () => {{
  btn.classList.toggle('visible', mc.scrollTop > 300);
}});
</script>
</body>
</html>'''
    return html

# Generate both files
base = r'c:\Users\ggamy\Desktop\uxr_eyetracking'
for lang in ['ko', 'en']:
    path = os.path.join(base, f'guide_{lang}.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(gen(lang))
    print(f'Created: {path}')
print('Done!')
