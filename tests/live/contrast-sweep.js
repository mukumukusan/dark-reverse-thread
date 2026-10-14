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
 * It also checks icons drawn as background images (on an element or its ::before/::after, like the
 * Reply / Forward arrows): it loads the image, draws it through the same CSS filters the page applies,
 * and compares its average color with the background (WCAG asks 3 for icons). The text check alone
 * missed the dark arrows on the Reply buttons.
 *
 * <svg> icons are checked by the color of their first painted shape.
 *
 * Limits: text over a background image, inside an <iframe>, or drawn by <img>/<canvas> can't be judged
 * and is skipped. Under a CSS filter: invert(...) both colors are inverted before comparing. Icons as
 * <img>, SVG backgrounds, and images that don't allow reading their pixels, are not checked. A sprite sheet is
 * judged by its average color.
 *
 * Pasting the file also keeps it as window.gtrSweep(options) for the next states, so it needs pasting
 * once per page load. It returns a promise (the icon images load first). Options:
 *   minContrast  report text below this (default 3: hard to read; 4.5: the target for body text)
 *   scope        a selector to check only part of the page (e.g. '.gtr-thread' for email bodies)
 */
window.gtrSweep = async ({ minContrast = 3, scope = null } = {}) => {
  const MIN_CONTRAST = minContrast;
  const MIN_ICON_CONTRAST = 3;
  const MAX_ICON_SIZE = 48;
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
  // Returns null when a background image is in the way (can't be judged); ownImage lets an icon's own
  // background image through, since that image is what is being judged.
  const filterAmount = (cs) => { const m = cs.filter.match(/invert\(([\d.]+)\)/); return m ? +m[1] : 0; };
  const resolve = (el, ownColor, ownImage = false) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    const styles = chain.map((e) => getComputedStyle(e));
    const filtered = (c, from) => {
      for (let i = from; i < chain.length; i++) { const amount = filterAmount(styles[i]); if (amount) c = invert(c, amount); }
      return c;
    };
    const layers = [];
    for (let i = 0; i < chain.length; i++) {
      if (styles[i].backgroundImage !== 'none' && !(ownImage && i === 0)) return null;
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

  // Icons drawn as background images. The image goes through the filters in the order the browser
  // applies them (the pseudo-element's own, then the element's, then each ancestor's), on a canvas
  // fetch + createImageBitmap, not new Image(): in a background tab an <img> never finishes loading.
  // Some images (the side panel's app icons) never answer, so each gets 3 seconds
  const images = new Map();
  const loadImage = (url) => {
    if (!images.has(url)) {
      const load = fetch(url, { mode: 'cors', credentials: 'omit' }).then((r) => r.blob()).then(createImageBitmap).catch(() => null);
      images.set(url, Promise.race([load, new Promise((done) => setTimeout(() => done(null), 3000))]));
    }
    return images.get(url);
  };
  const iconColor = async (url, filters) => {
    const img = await loadImage(url);
    if (!img || !img.width) return null;
    let source = img;
    let canvas;
    for (const filter of filters.length ? filters : ['none']) {
      canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = filter;
      ctx.drawImage(source, 0, 0);
      source = canvas;
    }
    let data;
    try { data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; } catch (e) { return null; }
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // edges and the empty parts of the icon
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    return n ? { r: r / n, g: g / n, b: b / n, a: 1 } : null;
  };
  const lowIcons = new Map();
  let checkedIcons = 0;
  let unreadableIcons = 0;
  const iconJobs = [];
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    // Email bodies are the sender's pictures; faint disabled buttons are meant to look faint
    if (el.closest('.a3s, .gtr-original, iframe, :disabled, [aria-disabled="true"]')) return;
    for (const pseudo of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      const url = (cs.backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1];
      if (!url || (pseudo && (cs.content === 'none' || cs.content === 'normal'))) continue;
      const width = parseFloat(cs.width), height = parseFloat(cs.height);
      if (!(width > 0 && height > 0) || width > MAX_ICON_SIZE || height > MAX_ICON_SIZE) continue;
      if (!visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.right <= 0 || r.bottom <= 0) return;
      const filters = [];
      if (pseudo && cs.filter !== 'none') filters.push(cs.filter);
      for (let e = el; e; e = e.parentElement) {
        const filter = getComputedStyle(e).filter;
        if (filter !== 'none') filters.push(filter);
      }
      const drawn = resolve(el, null, !pseudo);
      if (!drawn) continue;
      iconJobs.push(iconColor(url, filters).then((color) => {
        if (!color) { unreadableIcons++; return; }
        checkedIcons++;
        const ratio = contrast(color, drawn.bg);
        if (ratio >= MIN_ICON_CONTRAST) return;
        const where = describe(el) + (pseudo || '');
        const key = where + ' | ' + url;
        const entry = lowIcons.get(key) || { where, icon: url.split('/').pop(), color: rgb(color), background: rgb(drawn.bg), contrast: +ratio.toFixed(2), count: 0 };
        entry.count++;
        lowIcons.set(key, entry);
      }));
    }
  });
  await Promise.all(iconJobs);

  // Icons drawn as <svg>: the color of their shapes (fill, or stroke for outline icons), run through the
  // same filters on a 1x1 canvas
  const filterColor = (color, filters) => {
    let source = null;
    let canvas;
    for (const filter of filters.length ? filters : ['none']) {
      canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.filter = filter;
      if (source) ctx.drawImage(source, 0, 0);
      else { ctx.fillStyle = rgb(color); ctx.fillRect(0, 0, 1, 1); }
      source = canvas;
    }
    const [r, g, b] = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: 1 };
  };
  root.querySelectorAll('svg').forEach((svg) => {
    if (svg.closest('.a3s, .gtr-original, :disabled, [aria-disabled="true"]') || !visible(svg)) return;
    const r = svg.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.width > MAX_ICON_SIZE || r.height > MAX_ICON_SIZE || r.right <= 0 || r.bottom <= 0) return;
    const shapes = Array.from(svg.querySelectorAll('path, circle, rect, polygon, ellipse, line, polyline, use'));
    let paint = null;
    for (const shape of shapes) {
      const cs = getComputedStyle(shape);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const c = parse(cs.fill !== 'none' ? cs.fill : cs.stroke);
      if (c && c.a > 0.2 && +(cs.fill !== 'none' ? cs.fillOpacity : cs.strokeOpacity) > 0.2) { paint = c; break; }
    }
    if (!paint) return;
    const holder = svg.parentElement;
    const drawn = resolve(holder);
    if (!drawn) return;
    const filters = [];
    for (let e = svg; e; e = e.parentElement) {
      const filter = getComputedStyle(e).filter;
      if (filter !== 'none') filters.push(filter);
    }
    const color = over({ ...filterColor(paint, filters), a: paint.a }, drawn.bg);
    checkedIcons++;
    const ratio = contrast(color, drawn.bg);
    if (ratio >= MIN_ICON_CONTRAST) return;
    const where = describe(svg);
    const key = where + ' | ' + rgb(color);
    const entry = lowIcons.get(key) || { where, icon: 'svg', color: rgb(color), background: rgb(drawn.bg), contrast: +ratio.toFixed(2), count: 0 };
    entry.count++;
    lowIcons.set(key, entry);
  });

  const result = {
    checkedText: checked,
    lowContrast: Array.from(lowContrast.values()).sort((a, b) => a.contrast - b.contrast),
    lightBoxes,
    checkedIcons,
    unreadableIcons,
    lowContrastIcons: Array.from(lowIcons.values()).sort((a, b) => a.contrast - b.contrast)
  };
  if (typeof console !== 'undefined' && console.table) { console.table(result.lowContrast); console.table(result.lightBoxes); console.table(result.lowContrastIcons); }
  return result;
};
window.gtrSweep();
