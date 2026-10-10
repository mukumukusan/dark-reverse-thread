#!/usr/bin/env python3
"""
Test runner for Dark Reverse Thread. No dependencies beyond Python 3 and Google Chrome.

  python3 tests/run.py            # static checks + every browser suite
  python3 tests/run.py thread     # only suites whose name contains "thread" (static checks always run)

Static checks read the extension files directly. Browser suites (tests/browser/suite-*.html) load the
real content.js / styles.css / popup.html into headless Chrome with a fake chrome.* API; virtual time
fast-forwards timers, so the 10-second waits take a moment. Results come back through --dump-dom.
"""
import json
import os
import re
import select
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BROWSER_DIR = os.path.join(ROOT, 'tests', 'browser')
CHROME_CANDIDATES = [
    os.environ.get('CHROME', ''),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
]
VIRTUAL_TIME_BUDGET_MS = 30000
SUITE_TIMEOUT_S = 90

results = []  # (group, name, ok, detail)


def check(group, name, ok, detail=''):
    results.append((group, name, bool(ok), detail))


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


# --------------------------------------------------------------------------------------------------
# Static checks
# --------------------------------------------------------------------------------------------------

def static_checks():
    g = 'static'
    manifest = json.loads(read('manifest.json'))
    locales_dir = os.path.join(ROOT, '_locales')
    locales = sorted(os.listdir(locales_dir))
    messages = {}
    for lang in locales:
        try:
            messages[lang] = json.loads(read(f'_locales/{lang}/messages.json'))
            check(g, f'{lang}: messages.json is valid JSON', True)
        except ValueError as e:
            check(g, f'{lang}: messages.json is valid JSON', False, str(e))
    en = messages.get('en', {})

    # Manifest
    check(g, 'manifest: version is x.y.z', re.fullmatch(r'\d+\.\d+\.\d+', manifest.get('version', '')), manifest.get('version'))
    check(g, 'manifest: default_locale exists', manifest.get('default_locale') in locales)
    check(g, 'manifest: only the storage permission', manifest.get('permissions') == ['storage'], manifest.get('permissions'))
    check(g, 'manifest: no host_permissions', 'host_permissions' not in manifest)
    scripts = manifest['content_scripts'][0]
    check(g, 'manifest: content script runs only on Gmail', scripts['matches'] == ['https://mail.google.com/*'], scripts['matches'])
    check(g, 'manifest: settings.js loads before content.js', scripts['js'] == ['settings.js', 'content.js'], scripts['js'])
    for path in scripts['js'] + scripts['css'] + list(manifest['icons'].values()) + ['popup.html', 'popup.js', 'popup.css']:
        check(g, f'manifest: {path} exists', os.path.exists(os.path.join(ROOT, path)))
    readme_version = re.search(r'\(v([\d.]+)\)', read('README.md').splitlines()[0])
    check(g, 'README title version matches the manifest', readme_version and readme_version.group(1) == manifest['version'],
          readme_version and readme_version.group(1))

    # Locales
    for lang, msgs in messages.items():
        missing = sorted(set(en) - set(msgs))
        extra = sorted(set(msgs) - set(en))
        check(g, f'{lang}: same keys as en', not missing and not extra, f'missing={missing} extra={extra}')
        empty = [k for k, v in msgs.items() if not v.get('message', '').strip()]
        check(g, f'{lang}: no empty messages', not empty, empty)
        if 'extName' in msgs:
            n = len(msgs['extName']['message'])
            check(g, f'{lang}: extName within 75 characters', n <= 75, n)
        if 'extDescription' in msgs:
            n = len(msgs['extDescription']['message'])
            check(g, f'{lang}: extDescription within 132 characters', n <= 132, n)
        if 'extShortName' in msgs:
            n = len(msgs['extShortName']['message'])
            check(g, f'{lang}: extShortName within 12-45 characters', n <= 45, n)

    # Every message key used by the code exists
    used = set(re.findall(r'data-i18n="([A-Za-z]+)"', read('popup.html')))
    for source in ('content.js', 'popup.js'):
        # Every quoted key inside getMessage(...) / t(...) calls, including both sides of a ternary
        for args in re.findall(r"(?:getMessage|\bt)\(([^()]*(?:\([^()]*\)[^()]*)*)\)", read(source)):
            used |= set(re.findall(r"(?<!=== )'([A-Za-z]+)'", args))  # not the 'top' in replyPosition === 'top'
    used |= set(re.findall(r'__MSG_([A-Za-z]+)__', read('manifest.json')))
    used = {k for k in used if k[0].islower()}
    unknown = sorted(k for k in used if k not in en)
    check(g, 'every message key used in the code exists in en', not unknown, unknown)

    # CSS
    css = read('styles.css')
    no_comments = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    check(g, 'styles.css: braces are balanced', no_comments.count('{') == no_comments.count('}'),
          f"{no_comments.count('{')} vs {no_comments.count('}')}")
    bad_pseudo = re.findall(r':(?:is|where|not)\([^)]*::[a-z-]+', no_comments)
    check(g, 'styles.css: no pseudo-elements inside :is() / :where() / :not() (the rule would be ignored)', not bad_pseudo, bad_pseudo[:3])
    defined = set(re.findall(r'(--gtr-dark-[a-z-]+)\s*:', no_comments))
    used_vars = set(re.findall(r'var\((--gtr-dark-[a-z-]+)\)', no_comments))
    check(g, 'styles.css: every --gtr-dark-* color used is defined', used_vars <= defined, sorted(used_vars - defined))
    check(g, 'styles.css: every --gtr-dark-* color defined is used', defined <= used_vars, sorted(defined - used_vars))
    print_block = no_comments[no_comments.index('@media print'):]
    check(g, 'styles.css: printing restores the original colors', 'var(--gtr-fg0)' in print_block and 'var(--gtr-bg0)' in print_block)

    # Code hygiene
    for source in ('content.js', 'popup.js'):
        code = read(source)
        check(g, f'{source}: no innerHTML / outerHTML / insertAdjacentHTML / eval', not re.search(r'\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML|\beval\(|new Function\(', code))
        check(g, f'{source}: no network requests', not re.search(r'\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon', code))
        check(g, f'{source}: no console.log left', 'console.log' not in code)

    # Package contents
    attrs = read('.gitattributes')
    check(g, '.gitattributes: tests/ are left out of the ZIP', re.search(r'^tests/\s+export-ignore', attrs, re.M))
    check(g, '.gitattributes: store/ is left out of the ZIP', re.search(r'^store/\s+export-ignore', attrs, re.M))


# --------------------------------------------------------------------------------------------------
# Browser suites
# --------------------------------------------------------------------------------------------------

def find_chrome():
    for path in CHROME_CANDIDATES:
        if path and os.path.exists(path):
            return path
    return None


def run_suite(chrome, path):
    name = os.path.basename(path)[len('suite-'):-len('.html')]
    with tempfile.TemporaryDirectory() as profile:
        cmd = [chrome, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
               '--allow-file-access-from-files', f'--user-data-dir={profile}',
               f'--virtual-time-budget={VIRTUAL_TIME_BUDGET_MS}', '--window-size=1280,900',
               '--dump-dom', 'file://' + path]
        # Headless Chrome prints the DOM but does not always exit afterwards, so stop it once the
        # results are complete (or the suite takes too long).
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        output = b''
        deadline = time.time() + SUITE_TIMEOUT_S
        try:
            while time.time() < deadline:
                ready, _, _ = select.select([proc.stdout], [], [], 0.2)
                if ready:
                    chunk = os.read(proc.stdout.fileno(), 65536)
                    if not chunk:
                        break  # Chrome exited
                    output += chunk
                    if b'\nEND' in output:
                        break
                elif proc.poll() is not None:
                    break
        finally:
            proc.kill()
            proc.wait()
        dom = output.decode('utf-8', errors='replace')
    match = re.search(r'BEGIN\n(.*?)\nEND', dom, re.S)
    if not match:
        check(name, 'suite finished', False, 'no results (the page did not finish or crashed)')
        return
    for line in match.group(1).splitlines():
        line = line.replace('&gt;', '>').replace('&lt;', '<').replace('&quot;', '"').replace('&amp;', '&')
        if line.startswith('PASS '):
            check(name, line[5:], True)
        elif line.startswith('FAIL '):
            title, _, detail = line[5:].partition(' :: ')
            check(name, title, False, detail)


def main():
    filters = sys.argv[1:]
    static_checks()
    chrome = find_chrome()
    if not chrome:
        check('browser', 'Google Chrome found', False, 'set CHROME=/path/to/chrome')
    else:
        suites = sorted(f for f in os.listdir(BROWSER_DIR) if f.startswith('suite-') and f.endswith('.html'))
        for suite in suites:
            if filters and not any(f in suite for f in filters):
                continue
            run_suite(chrome, os.path.join(BROWSER_DIR, suite))

    failed = [r for r in results if not r[2]]
    group = None
    for g, name, ok, detail in results:
        if g != group:
            group = g
            print(f'\n[{g}]')
        if ok:
            print(f'  ok    {name}')
        else:
            print(f'  FAIL  {name}' + (f'\n        {detail}' if detail not in ('', None) else ''))
    print(f'\n{len(results) - len(failed)} passed, {len(failed)} failed')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
