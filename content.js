/**
 * Gmail Thread Reverser & Official Material Dark Mode - Content Script
 * Manifest V3 compatible
 * - Dark styling lives entirely in styles.css and is scoped to the open
 *   conversation view (.gtr-thread); this script only toggles classes.
 * - Print optimization (@media print)
 * - Typing & Keystroke performance optimization
 * - Incremental processing: only nodes added inside conversation views are scanned
 */

(function () {
  'use strict';

  const EXTENSION_VERSION = 'v' + chrome.runtime.getManifest().version;
  const QUICK_BAR_ID = 'gmail-reverser-quick-toggle';

  let config = {
    reverseOrder: true,
    smartDark: true,
    replyPosition: 'bottom', // 'top' or 'bottom'
    showQuickBar: true
  };

  let lastQuickBarState = null;

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

  /** Returns the roots that were newly marked, so their whole contents can be processed. */
  function markThreadViews() {
    const newRoots = new Set();
    document.querySelectorAll(THREAD_ANCHORS).forEach((anchor) => {
      const root = findThreadRoot(anchor);
      if (root && !root.classList.contains('gtr-thread')) {
        root.classList.add('gtr-thread');
        newRoots.add(root);
      }
    });

    document.querySelectorAll('.gtr-thread').forEach((root) => {
      if (!root.querySelector(THREAD_ANCHORS)) root.classList.remove('gtr-thread');
    });
    return newRoots;
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

  function applyDarkMode(scopes) {
    document.documentElement.classList.toggle('gmail-dark-active', !!config.smartDark);
    if (!config.smartDark) return;

    const bodies = new Set();
    scopes.forEach((scope) => emailBodiesIn(scope).forEach((body) => bodies.add(body)));
    darkenEmailBodies(bodies);
  }

  // Load saved settings from Chrome Storage
  chrome.storage.sync.get(config, (items) => {
    if (items) {
      config = Object.assign(config, items);
      applyAll();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      for (let key in changes) {
        config[key] = changes[key].newValue;
      }
      lastQuickBarState = null; // force re-render on setting change
      applyAll();
    }
  });

  function applyThreadReversal() {
    const lists = document.querySelectorAll('.gtr-thread div[role="list"]');
    lists.forEach((list) => {
      const children = Array.from(list.children);
      if (children.length < 2) return;

      const messageItems = [];
      const replyBoxes = [];

      children.forEach((child) => {
        const isReply = child.classList.contains('g6') ||
                        child.classList.contains('adB') ||
                        child.classList.contains('aaq') ||
                        child.querySelector('.g6, .adB');

        if (isReply) {
          replyBoxes.push(child);
        } else {
          messageItems.push(child);
        }
      });

      if (config.reverseOrder) {
        list.classList.add('gmail-thread-reversed');

        const total = messageItems.length;
        messageItems.forEach((item, index) => {
          const order = (total - index).toString();
          if (item.style.order !== order) item.style.order = order;
        });

        replyBoxes.forEach((rb) => {
          if (config.replyPosition === 'top') {
            rb.classList.add('gmail-reply-top');
            rb.classList.remove('gmail-reply-bottom');
          } else {
            rb.classList.add('gmail-reply-bottom');
            rb.classList.remove('gmail-reply-top');
          }
        });
      } else {
        list.classList.remove('gmail-thread-reversed');
        children.forEach((child) => {
          if (child.style.order) child.style.order = '';
          child.classList.remove('gmail-reply-top', 'gmail-reply-bottom');
        });
      }
    });
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

    const list = Array.from(document.querySelectorAll('.gtr-thread .gmail-thread-reversed'))
      .find((el) => el.offsetParent !== null);
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
    if (!document.body) return;

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
    title.textContent = 'Gmail Reverser';

    const version = document.createElement('span');
    version.className = 'gtr-version';
    version.textContent = EXTENSION_VERSION;

    const makeButton = (label, tooltip, active, onClick) => {
      const button = document.createElement('button');
      button.className = active ? 'gtr-btn active' : 'gtr-btn';
      button.title = tooltip;
      button.textContent = label;
      button.onclick = onClick;
      return button;
    };

    bar.replaceChildren(
      title,
      version,
      makeButton(`⇅ ${t('quickNewest')}: ${onOff(config.reverseOrder)}`, t('quickNewestTitle'), config.reverseOrder, () => {
        config.reverseOrder = !config.reverseOrder;
        lastQuickBarState = null;
        saveConfig({ reverseOrder: config.reverseOrder });
      }),
      makeButton(`🌙 ${t('quickDark')}: ${onOff(config.smartDark)}`, t('quickDarkTitle'), config.smartDark, () => {
        config.smartDark = !config.smartDark;
        lastQuickBarState = null;
        saveConfig({ smartDark: config.smartDark });
      }),
      makeButton(
        `↩ ${t('quickReply')}: ${t(config.replyPosition === 'top' ? 'quickReplyTop' : 'quickReplyBottom')}`,
        t('quickReplyTitle'),
        false,
        () => {
          config.replyPosition = config.replyPosition === 'top' ? 'bottom' : 'top';
          lastQuickBarState = null;
          saveConfig({ replyPosition: config.replyPosition });
        }
      )
    );
  }

  function saveConfig(updated) {
    chrome.storage.sync.set(updated, () => {
      applyAll();
    });
  }

  /** Full pass over every conversation view: initial load, setting changes and thread navigation. */
  function applyAll() {
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

  function hasThreadAnchor(node) {
    return node.matches(THREAD_ANCHORS) || node.querySelector(THREAD_ANCHORS) !== null;
  }

  function flushPending() {
    flushTimeout = null;
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
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flushPending, 150);
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

    let relevant = false;
    for (const m of mutations) {
      if (m.target.closest && m.target.closest('#' + QUICK_BAR_ID)) continue; // our own quick bar

      for (const node of m.addedNodes) {
        // Text inserted into an existing element is handled via its parent
        const el = node.nodeType === Node.ELEMENT_NODE ? node : m.target;
        if (el.nodeType === Node.ELEMENT_NODE && isThreadNode(el)) {
          pendingNodes.add(el);
          relevant = true;
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

    if (relevant) scheduleFlush();
  });

  // Opening / leaving a conversation changes the hash (#inbox/<thread id>)
  window.addEventListener('hashchange', () => {
    needFullPass = true;
    scheduleFlush();
  });

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
