/**
 * Live check for the real Gmail page (not run by tests/run.py).
 *
 * The automated suites use a Gmail-like fixture, so they cannot notice when Gmail itself changes its
 * markup. This script runs on the real page and reports whether the parts the extension relies on are
 * still there, and whether the extension's work is visible. It only reads the page: no clicks, no
 * changes.
 *
 * How to run: open Gmail with the extension loaded, open a conversation that has at least two
 * messages, then paste this whole file into DevTools' console (or run it through Claude in Chrome).
 * The result is returned as an object and also printed as a table.
 *
 * Each check: { area, what, ok, detail }. "required" checks failing means Gmail probably changed;
 * "state" checks failing means the extension did not apply (it may need a page reload).
 */
(() => {
  const checks = [];
  const add = (level, area, what, ok, detail = '') => checks.push({ level, area, what, ok: !!ok, detail: String(detail) });
  const visible = (el) => !!el && el.offsetParent !== null;
  const first = (selector) => Array.from(document.querySelectorAll(selector)).find(visible) || null;
  const bg = (el) => (el ? getComputedStyle(el).backgroundColor : 'none');
  const lightness = (color) => {
    const m = String(color).match(/[\d.]+/g);
    if (!m || (m[3] !== undefined && +m[3] < 0.5)) return null; // transparent
    const [r, g, b] = m.slice(0, 3).map((v) => +v / 255);
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  };

  const html = document.documentElement;
  const darkOn = html.classList.contains('gmail-dark-active');
  const thread = first('.gtr-thread') || first('div[role="main"]');
  const inThread = !!first('h2.hP');

  // ---- Gmail frame (always on the page) -----------------------------------------------------------
  add('required', 'frame', 'header[role="banner"] (theme check waits for it)', first('header[role="banner"]'));
  add('required', 'frame', 'gear: header a.FH[role="button"] (theme picker button)', first('header[role="banner"] a.FH[role="button"]'));
  add('required', 'frame', 'main toolbar [gh="mtb"] (dark menus)', first('[gh="mtb"]'));
  add('required', 'frame', 'right toolbar [gh="tm"] (count / input tools menus)', first('[gh="tm"]'));
  add('required', 'frame', 'Compose button [gh="cm"].T-I-KE', first('[gh="cm"].T-I-KE'));
  add('required', 'frame', 'search form[role="search"]', first('form[role="search"]'));
  const bodyLight = lightness(bg(document.body));
  add('info', 'frame', 'Gmail body background (theme check input)', bodyLight !== null,
    `${bg(document.body)} -> ${bodyLight === null ? 'picture/transparent theme: not judged' : bodyLight > 0.5 ? 'light theme' : 'dark theme'}`);

  // ---- Conversation view (open a thread first) --------------------------------------------------
  add('required', 'thread', 'a conversation is open (h2.hP subject)', inThread, inThread ? '' : 'open a conversation, then run again');
  if (inThread) {
    const subject = first('h2.hP');
    const main = subject.closest('div[role="main"]');
    add('required', 'thread', 'subject is inside div[role="main"] (thread root)', main);
    const messages = Array.from(document.querySelectorAll('.adn')).filter(visible);
    add('required', 'thread', 'expanded messages .adn', messages.length > 0, `${messages.length} visible`);
    add('required', 'thread', 'email bodies .a3s', first('.a3s'));
    const list = messages[0] && messages[0].closest('div[role="list"]');
    add('required', 'thread', 'messages sit in div[role="list"]', list, list ? `${list.children.length} items` : '');
    add('required', 'thread', 'every list item holds a message (.adn or collapsed row)', list && Array.from(list.children).every((c) => c.querySelector('.adn, .kv, .kQ') || c.matches('.kv, .kQ')),
      list ? Array.from(list.children).map((c) => c.className.split(' ')[0] || c.tagName).join(', ') : '');
    add('required', 'thread', 'Reply / Forward footer .amn with .ams buttons', first('.amn .ams'));
    add('required', 'thread', 'footer wrapper .nr.wR (white flash fix)', first('.nr.wR'));
    add('info', 'thread', 'message header .gs (inline composer placement)', first('.gs'));

    // ---- What the extension did --------------------------------------------------------------
    add('state', 'extension', 'html.gmail-dark-active (dark mode on)', darkOn, darkOn ? '' : 'dark mode is off in the popup, or the extension is not running');
    add('state', 'extension', 'thread root marked .gtr-thread', main && main.classList.contains('gtr-thread'));
    if (darkOn && main) {
      add('state', 'extension', 'thread background is dark', lightness(bg(main)) !== null && lightness(bg(main)) < 0.3, bg(main));
      const adapted = document.querySelectorAll('.gtr-thread .a3s [data-gtr-c]').length;
      add('state', 'extension', 'email body elements adapted (data-gtr-c)', adapted > 0, `${adapted} elements`);
      const body = first('.gtr-thread .a3s');
      const text = body && Array.from(body.querySelectorAll('*')).find((el) => visible(el) && el.textContent.trim() && !el.children.length);
      if (text) {
        const l = lightness(getComputedStyle(text).color);
        add('state', 'extension', 'body text is light on the dark page', l !== null && l > 0.5, getComputedStyle(text).color);
      }
      const scroller = document.querySelector('.gtr-thread-scroller');
      add('state', 'extension', 'scroller tagged .gtr-thread-scroller (fast-scroll flash fix)', scroller, scroller ? bg(scroller) : 'not found');
      const amsButton = first('.gtr-thread .amn .ams');
      add('state', 'extension', 'Reply buttons are dark', amsButton && lightness(bg(amsButton)) !== null && lightness(bg(amsButton)) < 0.3, bg(amsButton));
    }
    const reversed = document.querySelector('.gtr-thread .gmail-thread-reversed');
    add('state', 'extension', 'message list reversed (.gmail-thread-reversed)', reversed, reversed ? '' : 'newest-first is off in the popup, or the list was not found');
    if (reversed) {
      const items = Array.from(reversed.children).filter((c) => c.style.order);
      add('state', 'extension', 'newest message shown first', items.length > 1 && items[items.length - 1].getBoundingClientRect().top < items[0].getBoundingClientRect().top);
      const below = document.querySelector('.gtr-thread .gmail-reply-below');
      const footer = document.querySelector('.gtr-thread .gmail-reply-footer');
      add('state', 'extension', 'reply footer placed (below or above the newest)', below || footer, below ? 'below' : footer ? 'above' : 'not placed: Gmail may have changed the boxes around the list');
    }
  }

  // ---- Settings pages (open #settings to check) ----------------------------------------------------
  if (location.hash.startsWith('#settings')) {
    const settings = first('.nH.r4');
    const tabs = first('.nH.fY[role="tablist"]');
    add('required', 'settings', 'settings content .nH.r4', settings);
    add('required', 'settings', 'settings tab strip .nH.fY[role="tablist"]', tabs);
    if (html.classList.contains('gtr-gmail-dark-theme') && settings) {
      add('state', 'extension', 'settings page inverted to dark', getComputedStyle(settings).filter.includes('invert'), getComputedStyle(settings).filter);
    }
  }

  // ---- Theme class -------------------------------------------------------------------------------
  if (bodyLight !== null) {
    add('state', 'extension', 'Gmail theme class matches the background', html.classList.contains('gtr-gmail-dark-theme') === (bodyLight <= 0.5),
      `gtr-gmail-dark-theme=${html.classList.contains('gtr-gmail-dark-theme')}`);
  }

  const failed = checks.filter((c) => !c.ok && c.level !== 'info');
  const summary = {
    page: location.hash.startsWith('#settings') ? 'settings' : inThread ? 'conversation' : 'list',
    darkMode: darkOn,
    passed: checks.filter((c) => c.ok).length,
    failed: failed.length,
    gmailChanged: failed.filter((c) => c.level === 'required').map((c) => `${c.area}: ${c.what}`),
    extensionNotApplied: failed.filter((c) => c.level === 'state').map((c) => `${c.what} (${c.detail})`)
  };
  if (typeof console !== 'undefined' && console.table) console.table(checks);
  return { summary, checks };
})();
