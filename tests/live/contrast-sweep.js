/**
 * Contrast sweep for the real Gmail page (not run by tests/run.py).
 *
 * Looks at every piece of text on screen and works out the color it is drawn in and the color behind it,
 * then lists the places where the two are too close to read (e.g. dark grey text left on a dark
 * background). It also lists large light boxes inside the areas the extension darkens (white areas).
 * It only reads the page: no clicks, no changes.
 *
 * How to run: open the Gmail screen to check (a conversation, the compose window, a menu, ...), then
 * paste this whole file into DevTools' console (or run it through Claude in Chrome). Run it once per
 * screen state: a field that shows different markup when focused and when not (like the To field) needs
 * a run in each state.
 *
 * Limits: text over a background image, inside an <iframe>, or drawn by <img>/<canvas> can't be judged
 * and is skipped. Under a CSS filter: invert(...) both colors are inverted before comparing.
 *
 * Pasting the file also keeps it as window.gtrSweep(options) for the next states, so it needs pasting
 * once per page load. Options:
 *   minContrast  report text below this (default 3: hard to read; 4.5: the target for body text)
 *   scope        a selector to check only part of the page (e.g. '.gtr-thread' for email bodies)
 */
window.gtrSweep = ({ minContrast = 3, scope = null } = {}) => {
  const MIN_CONTRAST = minContrast;
  const LIGHT_BOX_MIN_AREA = 40 * 24;
  const DARK_SCOPES = '.gtr-thread, .Hd[role="dialog"], [role="menu"], .afC, .J-M';

  const parse = (color) => {
    const m = String(color).match(/[\d.]+/g);
    if (!m) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] };
  };
  const over = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1
  });
  const invert = (c, amount) => ({
    r: amount * (255 - c.r) + (1 - amount) * c.r,
    g: amount * (255 - c.g) + (1 - amount) * c.g,
    b: amount * (255 - c.b) + (1 - amount) * c.b,
    a: c.a
  });
  const luminance = (c) => {
    const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const rgb = (c) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  const describe = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      const cls = Array.from(e.classList).filter((c) => !c.startsWith('gtr-')).slice(0, 3).join('.');
      const role = e.getAttribute('role');
      parts.unshift(e.tagName.toLowerCase() + (cls ? '.' + cls : '') + (role ? `[role=${role}]` : ''));
    }
    return parts.join(' > ');
  };

  // What is drawn for an element's text and behind it. Stacks the backgrounds of the element and its
  // ancestors until one is opaque. A filter: invert(...) on an element changes that element's own
  // background and everything inside it (the text included), but not what lies behind it.
  // Returns null when a background image is in the way (can't be judged).
  const filterAmount = (cs) => { const m = cs.filter.match(/invert\(([\d.]+)\)/); return m ? +m[1] : 0; };
  const resolve = (el, ownColor) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    const styles = chain.map((e) => getComputedStyle(e));
    const filtered = (c, from) => {
      for (let i = from; i < chain.length; i++) { const amount = filterAmount(styles[i]); if (amount) c = invert(c, amount); }
      return c;
    };
    const layers = [];
    for (let i = 0; i < chain.length; i++) {
      if (styles[i].backgroundImage !== 'none') return null;
      const c = parse(styles[i].backgroundColor);
      if (c && c.a > 0) {
        layers.push({ c, i });
        if (c.a >= 1) break;
      }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let k = layers.length - 1; k >= 0; k--) bg = over(filtered(layers[k].c, layers[k].i), bg);
    const fg = ownColor ? over(filtered(ownColor, 0), bg) : null;
    return { fg, bg };
  };

  // Opacity is not checked: Gmail fades menus in, and in a background tab the fade can stay at 0 for
  // scripts while the menu is already on screen
  const visible = (el) => el.checkVisibility ? el.checkVisibility({ checkVisibilityCSS: true }) : el.offsetParent !== null;

  const lowContrast = new Map();
  const root = scope ? document.querySelector(scope) : document.body;
  if (!root) return { error: `nothing matches ${scope}` };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let checked = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent.trim()) continue;
    const el = node.parentElement;
    // Disabled controls are meant to look faint (no contrast rule for them)
    if (!el || el.closest('script, style, noscript, [aria-hidden="true"], :disabled, [aria-disabled="true"]') || !visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    // Headings for screen readers that Gmail parks far off screen
    if (rect.right <= 0 || rect.bottom <= 0) continue;
    // The original-colors card (◐) shows the email as sent: not ours to judge
    if (el.closest('.gtr-original .a3s')) continue;
    const cs = getComputedStyle(el);
    const own = parse(cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color ? cs.webkitTextFillColor : cs.color);
    if (!own || own.a === 0) continue;
    const drawn = resolve(el, own);
    if (!drawn) continue;
    checked++;
    const { fg, bg } = drawn;
    const ratio = contrast(fg, bg);
    if (ratio >= MIN_CONTRAST) continue;
    const key = describe(el) + ' | ' + rgb(fg) + ' on ' + rgb(bg);
    const entry = lowContrast.get(key) || { where: describe(el), text: rgb(fg), background: rgb(bg), contrast: +ratio.toFixed(2), count: 0, sample: node.textContent.trim().slice(0, 16) };
    entry.count++;
    lowContrast.set(key, entry);
  }

  // Text typed into input fields is not a text node: check those fields' own color, or the hint
  // (placeholder) color when the field is empty
  root.querySelectorAll('input:not([type=hidden], [type=checkbox], [type=radio], [type=button], [type=submit]), textarea').forEach((el) => {
    if ((!el.value && !el.placeholder) || el.disabled || !visible(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.right <= 0 || r.bottom <= 0) return;
    const drawn = resolve(el, parse(getComputedStyle(el, el.value ? null : '::placeholder').color));
    if (!drawn) return;
    checked++;
    const { fg, bg } = drawn;
    const ratio = contrast(fg, bg);
    if (ratio >= MIN_CONTRAST) return;
    const key = describe(el) + ' | ' + rgb(fg) + ' on ' + rgb(bg);
    const entry = lowContrast.get(key) || { where: describe(el), text: rgb(fg), background: rgb(bg), contrast: +ratio.toFixed(2), count: 0, sample: (el.value || el.placeholder).slice(0, 16) };
    entry.count++;
    lowContrast.set(key, entry);
  });

  // Large light boxes inside the areas the extension darkens
  const lightBoxes = [];
  if (document.documentElement.classList.contains('gmail-dark-active')) {
    // Gmail's own label chips next to the subject (.hN) are light on purpose
    const areas = [...(root.matches(DARK_SCOPES) ? [root] : []), ...root.querySelectorAll(DARK_SCOPES)];
    areas.forEach((area) => {
      if (!visible(area)) return;
      [area, ...area.querySelectorAll('*')].forEach((el) => {
        if (el.matches('img, svg, canvas, video, [role=separator]') || el.closest('.gtr-original .a3s, iframe, .hN')) return;
        const c = parse(getComputedStyle(el).backgroundColor);
        if (!c || c.a < 0.9 || !visible(el)) return;
        const drawn = resolve(el);
        if (!drawn) return;
        const color = drawn.bg;
        if (luminance(color) < 0.6) return;
        const r = el.getBoundingClientRect();
        if (r.width * r.height < LIGHT_BOX_MIN_AREA) return;
        lightBoxes.push({ where: describe(el), background: rgb(color), size: `${Math.round(r.width)}x${Math.round(r.height)}` });
      });
    });
  }

  const result = {
    checkedText: checked,
    lowContrast: Array.from(lowContrast.values()).sort((a, b) => a.contrast - b.contrast),
    lightBoxes
  };
  if (typeof console !== 'undefined' && console.table) { console.table(result.lowContrast); console.table(result.lightBoxes); }
  return result;
};
window.gtrSweep();
