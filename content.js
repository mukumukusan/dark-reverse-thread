/**
 * Dark Reverse Thread (dark mode & newest-first threads for Gmail) - Content Script (Manifest V3)
 * - Marks the open conversation view (.gtr-thread); all dark styling in styles.css is scoped to it,
 *   so the inbox list, sidebar and header are never touched.
 * - Reverses the message list and places the reply area via flex order.
 * - Adapts email body colors (hue kept, lightness remapped) through CSS variables, so turning
 *   dark mode off restores the original colors.
 * - Gmail elements are found by class names and structure only, never by on-screen text.
 * - Incremental: only nodes added inside conversation views are processed; typing is ignored.
 */

(function () {
  'use strict';

  const EXTENSION_VERSION = 'v' + chrome.runtime.getManifest().version;
  const QUICK_BAR_ID = 'gmail-reverser-quick-toggle';

  const config = { ...GTR_DEFAULT_SETTINGS };

  let lastQuickBarState = null;

  /**
   * When the extension is reloaded or updated, this script keeps running in tabs that were already
   * open, but every chrome.* call then throws "Extension context invalidated". The page keeps its
   * current look; the quick bar asks for a page reload instead of failing on click.
   */
  const isContextValid = () => {
    try {
      // runtime.id alone can survive the invalidation; getManifest() throws once the context is gone
      return !!chrome.runtime?.id && !!chrome.runtime.getManifest();
    } catch {
      return false;
    }
  };
  const RELOAD_HINT = chrome.i18n.getMessage('quickReloadNeeded'); // read now: not available once invalidated

  /**
   * Mark each conversation view (the main pane that holds a subject h2.hP) with .gtr-thread
   * so that every dark-mode rule stays inside the thread and never touches the inbox list,
   * sidebar or header.
   */
  const THREAD_ANCHORS = 'h2.hP, .adn, .a3s';

  function findThreadRoot(anchor) {
    const main = anchor.closest('div[role="main"]');
    if (main) return main;
    // Fallback when the conversation is not inside role="main": the container of the message list
    const list = anchor.closest('div[role="list"]');
    if (list && list.parentElement) return list.parentElement;
    let el = anchor.parentElement;
    while (el && el !== document.body && !el.querySelector('div[role="list"]')) el = el.parentElement;
    return el && el !== document.body ? el : null;
  }

  /**
   * Leaving a conversation hides its view before the batched pass runs; the scroller tag (below)
   * must go in that same frame, or the inbox rows with transparent backgrounds show its dark color
   * for a moment. A ResizeObserver reports the hidden (zero-size) view after layout, before paint.
   */
  const threadViewSize = new ResizeObserver(() => markThreadScrollers());

  /** Returns the roots that were newly marked, so their whole contents can be processed. */
  function markThreadViews() {
    const newRoots = new Set();
    document.querySelectorAll(THREAD_ANCHORS).forEach((anchor) => {
      const root = findThreadRoot(anchor);
      if (root && !root.classList.contains('gtr-thread')) {
        root.classList.add('gtr-thread');
        threadViewSize.observe(root);
        newRoots.add(root);
      }
    });

    document.querySelectorAll('.gtr-thread').forEach((root) => {
      if (!root.querySelector(THREAD_ANCHORS)) {
        root.classList.remove('gtr-thread');
        threadViewSize.unobserve(root);
      }
    });
    markThreadScrollers();
    return newRoots;
  }

  /**
   * The pane that scrolls the open conversation is transparent. While scrolling fast, Chrome shows
   * not-yet-drawn areas in the scroller's background color, which is white when it has none, so the
   * scroller of a visible conversation is tagged and given the thread's dark color in styles.css.
   * It also scrolls the inbox list, so the tag is removed as soon as the conversation is hidden.
   */
  function markThreadScrollers() {
    const scrollers = new Set();
    document.querySelectorAll('.gtr-thread').forEach((root) => {
      if (root.offsetParent === null) return;
      const scroller = findScrollContainer(root);
      if (scroller && scroller !== document.scrollingElement) scrollers.add(scroller);
    });
    syncClass('gtr-thread-scroller', scrollers);
  }

  /**
   * Hue-preserving dark adaptation of email bodies: each element's original text / background
   * color keeps its hue and saturation, and only its HSL lightness is remapped (dark text -> light,
   * light backgrounds -> dark). Results go into CSS variables that styles.css applies only while
   * dark mode is on, so turning it off restores the original colors untouched.
   */
  const SKIP_TAGS = new Set(['IMG', 'VIDEO', 'IFRAME', 'SVG', 'CANVAS', 'PICTURE']);

  function parseRGB(value) {
    const m = value.match(/^rgba?\(([^)]+)\)$/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r, g, b, a };
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h / 6, s, l };
  }

  function hslToRgb({ h, s, l }) {
    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = (t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return {
      r: Math.round(channel(h + 1 / 3) * 255),
      g: Math.round(channel(h) * 255),
      b: Math.round(channel(h - 1 / 3) * 255)
    };
  }

  function remapLightness(rgb, mapL) {
    const hsl = rgbToHsl(rgb);
    hsl.l = mapL(hsl.l);
    const { r, g, b } = hslToRgb(hsl);
    return `rgba(${r}, ${g}, ${b}, ${rgb.a})`;
  }

  // Text: dark colors are mirrored to light (black -> #e3e3e3-ish), never dimmer than 0.65.
  // Both mappings are idempotent, so re-reading an already adapted color leaves it unchanged.
  const toDarkText = (l) => (l < 0.5 ? Math.min(Math.max(1 - l, 0.65), 0.89) : Math.max(l, 0.65));
  // Background: light colors fold into 0.12-0.22 (white -> #1f1f1f), dark ones stay dark.
  const toDarkBackground = (l) => (l > 0.5 ? 0.12 + (1 - l) * 0.2 : Math.min(l, 0.22));

  function emailBodiesIn(scope) {
    const enclosing = scope.closest('.a3s');
    return enclosing ? [enclosing] : scope.querySelectorAll('.a3s');
  }

  /**
   * Transparent images (e.g. dark logos drawn for a white page) get back the backdrop they were
   * designed on: the nearest original opaque background above them, or white. A white backdrop is
   * softened to light grey so it doesn't glare on the dark page, and logo-sized images get rounded
   * corners and a small frame (styles.css) so they read as a card; large images are left square,
   * because emails often tile one picture from several slices. Tiny images (spacers, tracking
   * pixels) are left alone so they don't turn into visible bars.
   */
  const MIN_IMAGE_SIZE = 16;
  const SOFT_WHITE_BACKDROP = 'rgb(232, 234, 237)';
  const MAX_CARD_WIDTH = 320;
  const MAX_CARD_HEIGHT = 160;

  function softenWhite(color) {
    const rgb = parseRGB(color);
    return rgb && rgb.a >= 1 && rgb.r >= 240 && rgb.g >= 240 && rgb.b >= 240 ? SOFT_WHITE_BACKDROP : color;
  }

  function findOriginalBackdrop(img, body) {
    for (let el = img.parentElement; el && el !== body; el = el.parentElement) {
      if (!el.hasAttribute('data-gtr-bg')) continue;
      const original = el.style.getPropertyValue('--gtr-bg0').trim();
      const bg = parseRGB(original);
      if (bg && bg.a >= 1) return original;
    }
    return 'rgb(255, 255, 255)';
  }

  function restoreImageBackdrop(img, body) {
    const apply = () => {
      if (img.naturalWidth <= 2 || img.naturalHeight <= 2) return;
      const shown = img.offsetWidth > 0 && img.offsetHeight > 0;
      const width = shown ? img.offsetWidth : img.naturalWidth;
      const height = shown ? img.offsetHeight : img.naturalHeight;
      if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) return;
      img.style.setProperty('--gtr-img-bg', softenWhite(findOriginalBackdrop(img, body)));
      img.setAttribute('data-gtr-img', '');
      if (width <= MAX_CARD_WIDTH && height <= MAX_CARD_HEIGHT) img.setAttribute('data-gtr-img-card', '');
    };
    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
  }

  function darkenEmailBodies(bodies) {
    bodies.forEach((body) => {
      const nodes = Array.from(body.querySelectorAll('*:not([data-gtr-c])'));
      if (nodes.length === 0) return;

      // Disable the CSS fallback to read original colors, then write; no paint happens in between
      body.classList.add('gtr-reading');
      const colors = nodes.map((node) => {
        if (SKIP_TAGS.has(node.tagName.toUpperCase()) || node.closest('svg, .ajR')) return null;
        const style = getComputedStyle(node);
        return { fg: parseRGB(style.color), bg: parseRGB(style.backgroundColor) };
      });

      nodes.forEach((node, i) => {
        node.setAttribute('data-gtr-c', '');
        if (node.tagName === 'IMG') restoreImageBackdrop(node, body); // ancestors are written first (document order)
        const c = colors[i];
        if (!c) return;
        if (c.fg) {
          node.style.setProperty('--gtr-fg0', `rgba(${c.fg.r}, ${c.fg.g}, ${c.fg.b}, ${c.fg.a})`);
          node.style.setProperty('--gtr-fg', remapLightness(c.fg, toDarkText));
          node.setAttribute('data-gtr-fg', '');
        }
        if (c.bg && c.bg.a > 0) {
          node.style.setProperty('--gtr-bg0', `rgba(${c.bg.r}, ${c.bg.g}, ${c.bg.b}, ${c.bg.a})`);
          node.style.setProperty('--gtr-bg', remapLightness(c.bg, toDarkBackground));
          node.setAttribute('data-gtr-bg', '');
        }
      });
      body.classList.remove('gtr-reading');
    });
  }

  /**
   * Label chips next to the subject get dark text (#202124) for Gmail's light chip colors; chips the
   * user colored dark are tagged so styles.css gives them light text instead. The chip's background
   * may be painted by the chip itself or by an inner element.
   */
  const LABEL_CHIP_SELECTOR = '.gtr-thread :is(.ha, .hN) :is(.ar, [data-label-name])';

  function markDarkLabelChips() {
    document.querySelectorAll(LABEL_CHIP_SELECTOR).forEach((chip) => {
      const painted = [chip, ...chip.querySelectorAll('*')]
        .map((el) => parseRGB(getComputedStyle(el).backgroundColor))
        .find((bg) => bg && bg.a >= 0.5);
      const dark = !!painted && rgbToHsl(painted).l < 0.5;
      if (chip.hasAttribute('data-gtr-dark-chip') !== dark) chip.toggleAttribute('data-gtr-dark-chip', dark);
    });
  }

  function applyDarkMode(scopes) {
    document.documentElement.classList.toggle('gmail-dark-active', !!config.smartDark);
    if (!config.smartDark) return;

    markDarkLabelChips();
    const bodies = new Set();
    scopes.forEach((scope) => emailBodiesIn(scope).forEach((body) => bodies.add(body)));
    darkenEmailBodies(bodies);
  }

  // Settings come from chrome.storage.sync; changes from the popup or the quick bar arrive here
  chrome.storage.sync.get(GTR_DEFAULT_SETTINGS, (items) => {
    Object.assign(config, items);
    applyAll();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    Object.entries(changes).forEach(([key, { newValue }]) => {
      config[key] = newValue === undefined ? GTR_DEFAULT_SETTINGS[key] : newValue; // undefined = key removed
    });
    applyAll();
  });

  /**
   * The conversation's message list is the nearest role="list" around its messages (.adn).
   * Other lists in the pane (e.g. the Gemini summary chips) must keep Gmail's own layout.
   */
  function findMessageLists() {
    const lists = new Set();
    document.querySelectorAll('.gtr-thread .adn').forEach((message) => {
      const list = message.closest('div[role="list"]');
      if (list) lists.add(list);
    });
    return lists;
  }

  function resetList(list) {
    list.classList.remove('gmail-thread-reversed');
    Array.from(list.children).forEach((child) => {
      if (child.style.order) child.style.order = '';
    });
  }

  function applyThreadReversal() {
    const lists = findMessageLists();

    // Undo reversal on lists that are no longer message lists
    document.querySelectorAll('.gmail-thread-reversed').forEach((list) => {
      if (!lists.has(list)) resetList(list);
    });

    lists.forEach((list) => {
      if (!config.reverseOrder) {
        resetList(list);
        return;
      }

      // Every child of the message list is a message (expanded .h7 or collapsed .kv);
      // the reply composer lives inside the newest message, not as a separate child.
      // Orders are even (newest = 2) so the reply footer can sit at 3, right below the newest message.
      const children = Array.from(list.children);
      list.classList.add('gmail-thread-reversed');
      children.forEach((child, index) => {
        const order = (2 * (children.length - index)).toString();
        if (child.style.order !== order) child.style.order = order;
      });
    });

    applyReplyPosition(lists);
  }

  /**
   * Reply area placement in newest-first order ("top": above the newest email, "bottom": below it).
   * - Inline composer (textbox): Gmail puts it inside the newest message, below its content, which is
   *   already "below the newest email". For "top" the composer block (the ancestor that branches off
   *   from the message content) is shown first in that message.
   * - Reply / Forward / reaction footer (.amn with .ams links): outside the message list, below it
   *   (= below the oldest email once reversed). Both use flex order on the shared parent
   *   (.gmail-reply-host):
   *   - "top": the footer is moved to just above the message list.
   *   - "bottom": the boxes between that parent and the message list are flattened (display:
   *     contents), so the messages and the footer share one flex column and the footer can take the
   *     slot right after the newest message. Only plain boxes (no padding / border / margin) are
   *     flattened; otherwise Gmail's own place is kept.
   */
  function findComposerBlock(textbox, item) {
    for (let el = textbox; el.parentElement && el.parentElement !== item; el = el.parentElement) {
      if (el.parentElement.querySelector('.gs, .a3s')) return el;
    }
    return null;
  }

  function findFooterBlock(footer, lists) {
    for (let el = footer; el.parentElement; el = el.parentElement) {
      const host = el.parentElement;
      if (lists.some((list) => host.contains(list) && !el.contains(list))) return el;
      if (host.classList.contains('gtr-thread')) return null;
    }
    return null;
  }

  // Flex layout is only safe on a plain block container, never on table parts
  const isFlexSafe = (block) => block && block.parentElement.tagName === 'DIV';

  // A box can be flattened without changing the look only if it draws nothing around its content
  function isPlainBox(el) {
    if (el.tagName !== 'DIV') return false;
    const style = getComputedStyle(el);
    return ['padding', 'margin', 'borderWidth'].every((prop) => style[prop].split(' ').every((v) => parseFloat(v) === 0));
  }

  function syncClass(className, wanted) {
    document.querySelectorAll('.' + className).forEach((el) => {
      if (!wanted.has(el)) el.classList.remove(className);
    });
    wanted.forEach((el) => el.classList.add(className));
  }

  /**
   * The Reply / Forward footer blocks: the ancestor of each footer that sits next to the box holding
   * the message list. Empty placeholders inside messages and unsafe (table) parents are skipped.
   */
  function findFooterBlocks(lists) {
    const blocks = [];
    document.querySelectorAll('.gtr-thread .amn').forEach((footer) => {
      if (lists.some((list) => list.contains(footer))) return; // empty placeholder inside a message
      const block = findFooterBlock(footer, lists);
      if (isFlexSafe(block)) blocks.push(block);
    });
    return blocks;
  }

  // Element sets that get a class each; a plan fills only the sets its mode uses
  const REPLY_CLASSES = {
    composers: 'gmail-reply-above',
    footers: 'gmail-reply-footer',
    afterFooter: 'gmail-reply-after',
    footersBelow: 'gmail-reply-below',
    flattened: 'gmail-reply-flat',
    leading: 'gmail-reply-lead',
    trailing: 'gmail-reply-tail'
  };

  const emptyReplyPlan = () =>
    Object.fromEntries(Object.keys(REPLY_CLASSES).map((key) => [key, new Set()]));

  /** "top": composer first in the newest message, footer just above the message list. */
  function planReplyTop(lists) {
    const plan = emptyReplyPlan();
    lists.forEach((list) => {
      list.querySelectorAll('[role="textbox"]').forEach((textbox) => {
        const item = Array.from(list.children).find((child) => child.contains(textbox));
        const block = item && findComposerBlock(textbox, item);
        if (isFlexSafe(block)) plan.composers.add(block);
      });
    });

    findFooterBlocks(lists).forEach((block) => {
      plan.footers.add(block);
      // Siblings from the message list onward follow the footer; earlier ones (subject etc.) stay first
      const siblings = Array.from(block.parentElement.children);
      const listIndex = siblings.findIndex((s) => s !== block && lists.some((list) => s.contains(list)));
      siblings.forEach((s, i) => {
        if (s !== block && listIndex !== -1 && i >= listIndex) plan.afterFooter.add(s);
      });
    });
    return plan;
  }

  /** "bottom": the boxes around the message list are flattened so the footer follows the newest message. */
  function planReplyBelow(lists) {
    const plan = emptyReplyPlan();
    findFooterBlocks(lists).forEach((block) => {
      const host = block.parentElement;
      const list = lists.find((l) => host.contains(l));
      const chain = [];
      for (let el = list; el !== host; el = el.parentElement) chain.push(el);
      if (!chain.every(isPlainBox)) return;

      plan.footersBelow.add(block);
      chain.forEach((el) => {
        plan.flattened.add(el);
        // Neighbours of the flattened boxes join the same column: those before the messages
        // (subject, summary button) stay first, those after them go last
        Array.from(el.parentElement.children).forEach((sibling) => {
          if (sibling === el || sibling === block) return;
          const before = sibling.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;
          (before ? plan.leading : plan.trailing).add(sibling);
        });
      });
    });
    return plan;
  }

  function applyReplyPosition(listSet) {
    const lists = Array.from(listSet);
    let plan = emptyReplyPlan();
    if (config.reverseOrder) plan = config.replyPosition === 'top' ? planReplyTop(lists) : planReplyBelow(lists);

    // Gmail scrolls to where it inserted a new composer (the bottom of the message); bring it into view at the top
    const newComposers = Array.from(plan.composers).filter((block) => !block.classList.contains(REPLY_CLASSES.composers));
    Object.entries(REPLY_CLASSES).forEach(([key, className]) => syncClass(className, plan[key]));

    const hosts = new Set();
    [plan.composers, plan.footers, plan.footersBelow].forEach((set) => set.forEach((block) => hosts.add(block.parentElement)));
    syncClass('gmail-reply-host', hosts);

    newComposers.forEach((block) => block.scrollIntoView({ block: 'nearest' }));
  }

  /**
   * When a conversation is opened in reversed order, scroll its pane to the top so the newest
   * message is in view. Gmail scrolls toward the (originally last) newest message itself after
   * rendering, so the top is reasserted a few times until the user scrolls, clicks or types.
   */
  const SCROLL_RETRY_DELAYS = [0, 300, 800, 1500];
  const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  let lastScrolledThread = null;
  let cancelPendingScroll = null;

  function findScrollContainer(el) {
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      const overflowY = getComputedStyle(node).overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node;
      }
    }
    return document.scrollingElement;
  }

  function scrollToNewestOnOpen() {
    const threadKey = location.hash;
    if (!config.reverseOrder || threadKey === lastScrolledThread) return;

    // The list itself has no box when flattened (display: contents), so check its first message
    const list = Array.from(document.querySelectorAll('.gtr-thread .gmail-thread-reversed'))
      .find((el) => el.firstElementChild && el.firstElementChild.offsetParent !== null);
    if (!list) return;
    lastScrolledThread = threadKey;

    if (cancelPendingScroll) cancelPendingScroll();

    const timers = SCROLL_RETRY_DELAYS.map((delay) => setTimeout(() => {
      if (!list.isConnected) return;
      const scroller = findScrollContainer(list);
      if (scroller) scroller.scrollTop = 0;
    }, delay));

    const stop = () => {
      timers.forEach(clearTimeout);
      USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stop, true));
      cancelPendingScroll = null;
    };
    USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stop, true));
    setTimeout(stop, SCROLL_RETRY_DELAYS[SCROLL_RETRY_DELAYS.length - 1] + 100);
    cancelPendingScroll = stop;
  }

  function renderQuickBar() {
    if (!document.body || !isContextValid()) return;

    if (!config.showQuickBar) {
      const existing = document.getElementById(QUICK_BAR_ID);
      if (existing) existing.remove();
      lastQuickBarState = null;
      return;
    }

    const currentState = `${config.reverseOrder}-${config.smartDark}-${config.replyPosition}`;
    const existingBar = document.getElementById(QUICK_BAR_ID);

    if (existingBar && lastQuickBarState === currentState) {
      return; // State unchanged and DOM already present; skip re-rendering
    }
    lastQuickBarState = currentState;

    let bar = existingBar;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = QUICK_BAR_ID;
      document.body.appendChild(bar);
    }

    const t = (key) => chrome.i18n.getMessage(key);
    const onOff = (value) => (value ? 'ON' : 'OFF');

    const title = document.createElement('span');
    title.className = 'gtr-title';
    title.textContent = 'Dark Reverse Thread';

    const version = document.createElement('span');
    version.className = 'gtr-version';
    version.textContent = EXTENSION_VERSION;

    const makeButton = (label, tooltip, active, onClick, disabled = false) => {
      const button = document.createElement('button');
      button.className = active ? 'gtr-btn active' : 'gtr-btn';
      button.title = tooltip;
      button.textContent = label;
      button.disabled = disabled;
      button.onclick = onClick;
      return button;
    };

    bar.replaceChildren(
      title,
      version,
      makeButton(`⇅ ${t('quickNewest')}: ${onOff(config.reverseOrder)}`, t('quickNewestTitle'), config.reverseOrder,
        () => save({ reverseOrder: !config.reverseOrder })),
      makeButton(`🌙 ${t('quickDark')}: ${onOff(config.smartDark)}`, t('quickDarkTitle'), config.smartDark,
        () => save({ smartDark: !config.smartDark })),
      makeButton(
        `↩ ${t('quickReply')}: ${t(config.replyPosition === 'top' ? 'quickReplyTop' : 'quickReplyBottom')}`,
        t(config.reverseOrder ? 'quickReplyTitle' : 'replyNeedsReverse'),
        false,
        () => save({ replyPosition: config.replyPosition === 'top' ? 'bottom' : 'top' }),
        !config.reverseOrder // the reply position only applies to newest-first threads
      )
    );
  }

  function showReloadHint() {
    const bar = document.getElementById(QUICK_BAR_ID);
    if (!bar) return;
    const hint = document.createElement('span');
    hint.className = 'gtr-title';
    hint.textContent = RELOAD_HINT;
    bar.replaceChildren(hint);
  }

  // storage.onChanged applies the new value and re-renders the quick bar
  const save = (updated) => {
    if (!isContextValid()) {
      showReloadHint();
      return;
    }
    try {
      chrome.storage.sync.set(updated).catch(showReloadHint);
    } catch {
      showReloadHint(); // invalidated between the check and the call
    }
  };

  /**
   * While a compose window (docked or full screen) is open, the quick bar is hidden (styles.css) so it
   * doesn't cover the minimized compose bar or the send row. Checked on every DOM change; cheap.
   */
  const COMPOSE_DIALOG = '.Hd[role="dialog"]';

  function syncComposeOpen() {
    const open = document.querySelector(COMPOSE_DIALOG) !== null;
    const root = document.documentElement;
    if (root.classList.contains('gtr-compose-open') !== open) root.classList.toggle('gtr-compose-open', open);
  }

  /**
   * Menus opened from a button in the conversation (e.g. a message's "⋮" menu) or in the main toolbar
   * above it (the checkbox "▾", "⋮") are built outside the thread from shared menu components that
   * other parts of Gmail reuse. Gmail opens them on mouse/pointer down, so the source of the press is
   * noted on <html> before Gmail handles it; styles.css darkens menus only while that note is set, and
   * they are never painted white first.
   */
  const MENU_SOURCE_CLASS = 'gtr-menu-source';

  document.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Element)) return;
    // A press on a menu item keeps the note: the menu stays open (dark) until the button is released
    if (event.target.closest('[role="menu"], .J-M, .tB5Jxf-M-X')) return;
    // thread, toolbar (left / right part), advanced search panel
    const fromDarkArea = event.target.closest('.gtr-thread, [gh="mtb"], [gh="tm"], .SK.ZF-zT') !== null;
    document.documentElement.classList.toggle(MENU_SOURCE_CLASS, fromDarkArea);
  }, true);

  /**
   * Whether Gmail itself uses a light theme, judged from the page background. Only this yes/no flag is
   * kept, on this device (storage.local), so the popup can suggest Gmail's own dark theme. On Gmail's
   * dark theme <html> also gets a class, so parts of Gmail's frame (search) are darkened only there.
   */
  const GMAIL_DARK_THEME_CLASS = 'gtr-gmail-dark-theme';
  let lastGmailLightTheme = null;

  function noteGmailTheme() {
    const bg = document.body && parseRGB(getComputedStyle(document.body).backgroundColor);
    if (!bg || bg.a < 0.5 || !isContextValid()) return; // a picture theme or no context: unknown
    const light = rgbToHsl(bg).l > 0.5;
    document.documentElement.classList.toggle(GMAIL_DARK_THEME_CLASS, !light);
    if (light === lastGmailLightTheme) return;
    lastGmailLightTheme = light;
    try {
      chrome.storage.local.set({ gmailLightTheme: light }).catch(() => {});
    } catch {
      // extension reloaded while this tab stayed open
    }
  }

  /**
   * The popup's "Choose a theme" button opens Gmail's theme dialog: the gear opens the quick settings
   * panel, its theme "View all" button opens the dialog, and the Dark theme tile is scrolled into view
   * and outlined. The user picks and saves the theme; the extension never changes Gmail's settings.
   * Each step is optional: if a later control is missing, the panel or dialog simply stays open.
   */
  const OPEN_THEME_KEY = 'gtrOpenThemeAt'; // set by the popup just before it opens a new Gmail tab
  const GEAR_SELECTOR = 'header[role="banner"] a.FH[role="button"]';
  const THEME_VIEW_ALL_SELECTOR = 'button[jsname="JFZqac"]';
  const DARK_THEME_SELECTOR = '[role="dialog"] [role="option"][bgid="basicblack"]';

  /** Polls for a visible element and calls back with it, or with null after about 3 seconds. */
  function whenVisible(selector, callback) {
    let tries = 0;
    const timer = setInterval(() => {
      const el = Array.from(document.querySelectorAll(selector)).find((e) => e.offsetParent !== null);
      if (el || ++tries > 30) {
        clearInterval(timer);
        callback(el || null);
      }
    }, 100);
  }

  let themeDialogPending = false; // one "View all" click per request, even if the gear is pressed again

  function openThemeSettings() {
    const gear = document.querySelector(GEAR_SELECTOR);
    if (!gear) return false;
    if (gear.getAttribute('aria-expanded') !== 'true') gear.click();
    if (themeDialogPending) return true;
    themeDialogPending = true;
    whenVisible(THEME_VIEW_ALL_SELECTOR, (viewAll) => {
      if (!viewAll) {
        themeDialogPending = false;
        return;
      }
      viewAll.click();
      whenVisible(DARK_THEME_SELECTOR, (tile) => {
        themeDialogPending = false;
        if (!tile) return;
        tile.scrollIntoView({ block: 'center' });
        tile.setAttribute('data-gtr-suggest', '');
      });
    });
    return true;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'gtr-open-theme-settings') sendResponse({ opened: openThemeSettings() });
  });

  // A Gmail tab opened from that button: open the panel once Gmail's header is ready
  chrome.storage.local.get({ [OPEN_THEME_KEY]: 0 }, (items) => {
    if (Date.now() - items[OPEN_THEME_KEY] > 60000) return;
    chrome.storage.local.remove(OPEN_THEME_KEY);
    let tries = 0;
    // Gmail may ignore the gear until it has fully started, so press it until the panel opens
    const timer = setInterval(() => {
      const gear = document.querySelector(GEAR_SELECTOR);
      if ((gear && gear.getAttribute('aria-expanded') === 'true') || ++tries > 40) {
        clearInterval(timer);
        return;
      }
      openThemeSettings();
    }, 500);
  });

  /** Full pass over every conversation view: initial load, setting changes and thread navigation. */
  function applyAll() {
    noteGmailTheme();
    syncComposeOpen();
    markThreadViews();
    applyDarkMode(Array.from(document.querySelectorAll('.gtr-thread')));
    applyThreadReversal();
    scrollToNewestOnOpen();
    renderQuickBar();
  }

  /**
   * Incremental pass: only the nodes Gmail added inside conversation views since the last flush
   * are scanned for email bodies. Inbox / sidebar updates never reach here.
   */
  const pendingNodes = new Set();
  let needFullPass = false;
  let flushTimeout = null;
  let flushDeadline = 0;
  const FLUSH_DELAY = 150;
  const FLUSH_MAX_WAIT = 300; // Gmail keeps updating the DOM for a while; don't let that postpone the work

  function hasThreadAnchor(node) {
    return node.matches(THREAD_ANCHORS) || node.querySelector(THREAD_ANCHORS) !== null;
  }

  function flushPending() {
    flushTimeout = null;
    flushDeadline = 0;
    noteGmailTheme(); // cheap; Gmail may apply its theme after the first pass
    if (needFullPass) {
      needFullPass = false;
      pendingNodes.clear();
      applyAll();
      return;
    }

    const nodes = Array.from(pendingNodes).filter((node) => node.isConnected);
    pendingNodes.clear();

    // Nodes added before their conversation got marked would be missed, so a new root is processed whole
    const scopes = nodes.some(hasThreadAnchor) ? markThreadViews() : new Set();
    nodes.forEach((node) => {
      if (node.closest('.gtr-thread')) scopes.add(node);
      else node.querySelectorAll('.gtr-thread').forEach((root) => scopes.add(root));
    });

    if (scopes.size > 0) {
      applyDarkMode(Array.from(scopes));
      applyThreadReversal();
      scrollToNewestOnOpen();
    }
    renderQuickBar();
  }

  function scheduleFlush() {
    const now = Date.now();
    if (!flushDeadline) flushDeadline = now + FLUSH_MAX_WAIT;
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flushPending, Math.max(0, Math.min(FLUSH_DELAY, flushDeadline - now)));
  }

  function isThreadNode(node) {
    return node.closest('.gtr-thread') !== null || hasThreadAnchor(node);
  }

  const observer = new MutationObserver((mutations) => {
    // Typing performance optimization:
    // If user is actively typing in a contenteditable compose box or input, ignore mutations strictly inside that field.
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.isContentEditable || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
      const isTypingOnly = mutations.every((m) => activeEl.contains(m.target));
      if (isTypingOnly) {
        return; // Skip execution while user is actively typing
      }
    }

    syncComposeOpen();

    let relevant = false;
    let threadAdded = false;
    for (const m of mutations) {
      if (m.target.closest && m.target.closest('#' + QUICK_BAR_ID)) continue; // our own quick bar

      for (const node of m.addedNodes) {
        // Text inserted into an existing element is handled via its parent
        const el = node.nodeType === Node.ELEMENT_NODE ? node : m.target;
        if (el.nodeType === Node.ELEMENT_NODE && isThreadNode(el)) {
          pendingNodes.add(el);
          relevant = true;
          if (!threadAdded && !el.closest('.gtr-thread')) threadAdded = true;
        }
      }

      for (const node of m.removedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.id === QUICK_BAR_ID) {
          relevant = true;
        } else if (hasThreadAnchor(node)) {
          needFullPass = true; // a conversation (or message) went away: re-evaluate thread roots
          relevant = true;
        }
      }
    }

    // Mark a newly shown conversation right away (before it is painted) so its dark styles apply
    // without a white flash; the rest of the work stays batched. New roots are processed whole.
    if (threadAdded) markThreadViews().forEach((root) => pendingNodes.add(root));

    if (relevant) scheduleFlush();
  });

  // Opening / leaving a conversation changes the hash (#inbox/<thread id>)
  window.addEventListener('hashchange', () => {
    needFullPass = true;
    scheduleFlush();
  });

  // Gmail can show a plain white page before its theme is applied, so check the theme again later
  setTimeout(noteGmailTheme, 5000);

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    applyAll();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
      applyAll();
    });
  }
})();
