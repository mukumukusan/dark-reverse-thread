"""
Builds the store image of the settings popup (store/screenshots/{ja,en}/5-popup-settings.png).

Renders the real popup.html with a fake chrome.* API (light Gmail theme, so the theme tip shows) on top
of a blurred conversation screenshot, in headless Chrome at 2x, then scales it down to 1280x800.
The version shown comes from manifest.json, so run it after bumping the version.

    python3 store/tools/popup-shot.py            # writes both store images
    python3 store/tools/popup-shot.py --popup    # only the bare popup (work dir), to check its look

Work files go to a temporary folder (printed at the end).
"""
import json, os, shutil, subprocess, sys, tempfile

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
version = json.load(open(f'{REPO}/manifest.json'))['version']
popup = open(f'{REPO}/popup.html').read()

TEXT = {
  'ja': dict(font="'Hiragino Maru Gothic ProN','Hiragino Sans',sans-serif",
             title='設定は、<br>アイコンからワンクリック',
             points=['ダーク・新しい順・返信欄の位置を<br>すぐに切り替え',
                     'Gmail が明るいテーマなら<br>ダークテーマ選びも案内',
                     'データの収集・送信は一切なし'],
             callout='Gmail のテーマもここから'),
  'en': dict(font="'Arial Rounded MT Bold','Hiragino Maru Gothic ProN',sans-serif",
             title='Settings, one click away',
             points=['Switch dark mode, newest-first order and the reply position instantly',
                     "On a light Gmail theme, it helps you pick Gmail's Dark theme",
                     'No data is collected or sent anywhere'],
             callout="Pick Gmail's theme here"),
}

work = tempfile.mkdtemp(prefix='popup-shot-')
for name in ('popup.css', 'popup.js', 'settings.js'):
    shutil.copy(f'{REPO}/{name}', work)
shutil.copytree(f'{REPO}/icons', f'{work}/icons')


def render(html, png, width, height):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--user-data-dir={work}/profile-{os.path.basename(png)}',
                    f'--window-size={width},{height}', '--force-device-scale-factor=2', '--virtual-time-budget=4000',
                    '--allow-file-access-from-files', f'--screenshot={png}', f'file://{html}'],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, timeout=60)


for lang, t in TEXT.items():
    msgs = {k: v['message'] for k, v in json.load(open(f'{REPO}/_locales/{lang}/messages.json')).items()}
    mock = f'''<script>
    const __MSG = {json.dumps(msgs, ensure_ascii=False)};
    window.chrome = {{
      i18n: {{ getUILanguage: () => '{lang}', getMessage: (k) => __MSG[k] || '' }},
      runtime: {{ getManifest: () => ({{ version: '{version}' }}) }},
      storage: {{
        sync: {{ get: (d, cb) => cb(Object.assign({{}}, d)), set: (v, cb) => cb && cb() }},
        local: {{ get: (d, cb) => cb(Object.assign({{}}, d, {{ gmailLightTheme: true }})), set: async () => {{}} }}
      }},
      tabs: {{ query: async () => [{{ id: 1 }}], sendMessage: async () => ({{}}), create: () => {{}} }}
    }};
    </script>'''
    page = popup.replace('<script src="settings.js"></script>', mock + '\n  <script src="settings.js"></script>')
    open(f'{work}/popup-{lang}.html', 'w').write(page)
    if '--popup' in sys.argv:
        render(f'{work}/popup-{lang}.html', f'{work}/popup-{lang}.png', 320, 640)
        continue

    shutil.copy(f'{REPO}/store/screenshots/{lang}/3-reply-below-newest.png', f'{work}/bg-{lang}.png')
    points = ''.join(f'<li>{p}</li>' for p in t['points'])
    comp = f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><style>
    html,body{{margin:0;width:1280px;height:800px;overflow:hidden;background:#1b1c2e}}
    .bg{{position:absolute;inset:-20px;background:url(bg-{lang}.png) center/cover;filter:blur(4px) brightness(.45)}}
    .shade{{position:absolute;inset:0;background:linear-gradient(90deg,rgba(27,28,46,.92) 0%,rgba(27,28,46,.75) 45%,rgba(27,28,46,.2) 100%)}}
    .copy{{position:absolute;left:80px;top:170px;width:560px;color:#fff;font-family:{t['font']}}}
    .copy h1{{font-size:{44 if lang == 'ja' else 46}px;line-height:1.3;margin:0 0 36px;font-weight:700}}
    .copy ul{{list-style:none;margin:0;padding:0}}
    .copy li{{position:relative;padding-left:40px;margin:0 0 22px;font-size:{24 if lang == 'ja' else 23}px;line-height:1.45;color:#e3e3e3;font-weight:700}}
    .copy li::before{{content:"";position:absolute;left:0;top:8px;width:22px;height:22px;border-radius:50%;background:#8ab4f8}}
    .copy li::after{{content:"";position:absolute;left:6px;top:13px;width:9px;height:5px;border-left:3px solid #1b1c2e;border-bottom:3px solid #1b1c2e;transform:rotate(-45deg)}}
    .icon{{position:absolute;right:146px;top:26px;width:36px;height:36px;border-radius:8px;box-shadow:0 0 0 3px #8ab4f8}}
    .frame{{position:absolute;right:70px;top:76px;width:320px;transform:scale(1.42);transform-origin:top right;border-radius:10px;overflow:hidden;
      box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08)}}
    .frame iframe{{display:block;width:320px;border:0}}
    .ring{{position:absolute;border-radius:999px;box-shadow:0 0 0 4px #ffd54a,0 0 18px 4px rgba(255,213,74,.6)}}
    .callout{{position:absolute;background:#ffd54a;color:#2a2410;font-family:{t['font']};font-weight:700;font-size:22px;padding:10px 20px;border-radius:999px;white-space:nowrap}}
    </style></head><body>
    <div class="bg"></div><div class="shade"></div>
    <img class="icon" src="icons/icon128.png">
    <div class="copy"><h1>{t['title']}</h1><ul>{points}</ul></div>
    <div class="frame"><iframe id="pf" src="popup-{lang}.html" scrolling="no"></iframe></div>
    <script>
    const f=document.getElementById('pf');
    f.onload=()=>{{
      const d=f.contentDocument; f.style.height=d.documentElement.scrollHeight+'px';
      const b=d.getElementById('openTheme').getBoundingClientRect();
      const fr=document.querySelector('.frame').getBoundingClientRect(); const s=fr.width/320;
      const x=fr.left+b.left*s, y=fr.top+b.top*s, w=b.width*s, h=b.height*s;
      const r=document.createElement('div'); r.className='ring';
      Object.assign(r.style,{{left:(x-6)+'px',top:(y-6)+'px',width:(w+12)+'px',height:(h+12)+'px'}}); document.body.appendChild(r);
      const c=document.createElement('div'); c.className='callout'; c.textContent={json.dumps(t['callout'])}; document.body.appendChild(c);
      const cw=c.getBoundingClientRect().width;
      Object.assign(c.style,{{left:(x-cw-40)+'px',top:(y+h/2-24)+'px'}});
    }};
    </script></body></html>'''
    open(f'{work}/shot-{lang}.html', 'w').write(comp)
    render(f'{work}/shot-{lang}.html', f'{work}/raw-{lang}.png', 1280, 800)
    out = f'{REPO}/store/screenshots/{lang}/5-popup-settings.png'
    subprocess.run(['sips', '-s', 'format', 'png', '-z', '800', '1280', f'{work}/raw-{lang}.png', '--out', out],
                   stdout=subprocess.DEVNULL, check=True)

print('version', version, '| work files in', work)
