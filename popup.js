document.addEventListener('DOMContentLoaded', () => {
  // Fill UI text from _locales/<lang>/messages.json
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
  });
  document.getElementById('version').textContent = 'v' + chrome.runtime.getManifest().version;

  // On Microsoft Edge, ratings belong on the Edge Add-ons listing, not the Chrome Web Store. Until
  // that listing's address is known (EDGE_STORE_URL is empty), the rate link is hidden on Edge.
  const EDGE_STORE_URL = '';
  if (/\bEdg\//.test(navigator.userAgent)) {
    const rateLink = document.getElementById('rateLink');
    if (EDGE_STORE_URL) {
      rateLink.href = EDGE_STORE_URL;
    } else {
      rateLink.hidden = true;
      document.getElementById('rateSeparator').hidden = true;
    }
  }

  const reverseOrder = document.getElementById('reverseOrder');
  const smartDark = document.getElementById('smartDark');
  const replyPosition = document.getElementById('replyPosition');
  const showQuickBar = document.getElementById('showQuickBar');
  const status = document.getElementById('status');

  // The reply position only applies to newest-first threads
  const replySetting = document.getElementById('replySetting');
  const replyDesc = document.getElementById('replyDesc');
  function updateReplyAvailability() {
    replyPosition.disabled = !reverseOrder.checked;
    replySetting.classList.toggle('disabled', !reverseOrder.checked);
    replyDesc.textContent = chrome.i18n.getMessage(reverseOrder.checked ? 'settingReplyDesc' : 'replyNeedsReverse');
  }

  // Suggest Gmail's own dark theme when Gmail is on a light theme. A Gmail tab answers for itself (its
  // account's theme may differ from the flag the content script last noted); elsewhere the flag is used.
  // Otherwise a small link to Gmail's theme picker is shown instead, e.g. for picture themes the
  // brightness check cannot judge.
  let tabAnswered = false;
  function showThemeTip(light) {
    document.getElementById('themeTip').hidden = !light;
    document.getElementById('themeLink').hidden = !!light;
  }
  chrome.storage.local.get({ gmailLightTheme: false }, ({ gmailLightTheme }) => {
    if (!tabAnswered) showThemeTip(gmailLightTheme);
  });

  // In a Gmail tab, ask whether Dark Reader is darkening it too (the two can clash; as on the page, its
  // tip then comes alone) and which theme it is on; other tabs don't answer
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const status = await chrome.tabs.sendMessage(tab.id, { type: 'gtr-status' });
      document.getElementById('darkReaderTip').hidden = !(status && status.darkReader);
      if (status && (status.darkReader || status.lightTheme !== undefined)) {
        tabAnswered = true;
        showThemeTip(!status.darkReader && status.lightTheme);
      }
    } catch {
      // not a Gmail tab (no content script there)
    }
  })();

  // Open Gmail's theme picker in the current Gmail tab, or in a new Gmail tab
  async function openThemePicker() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'gtr-open-theme-settings' });
      if (response && response.opened) window.close();
      return; // a Gmail tab without the gear button: leave the popup as it is
    } catch {
      // not a Gmail tab (no content script there)
    }
    await chrome.storage.local.set({ gtrOpenThemeAt: Date.now() });
    chrome.tabs.create({ url: 'https://mail.google.com/mail/' });
    window.close();
  }

  document.getElementById('openTheme').addEventListener('click', openThemePicker);
  document.getElementById('openThemeLink').addEventListener('click', openThemePicker);

  chrome.storage.sync.get(GTR_DEFAULT_SETTINGS, (items) => {
    reverseOrder.checked = items.reverseOrder;
    smartDark.checked = items.smartDark;
    replyPosition.value = items.replyPosition;
    showQuickBar.checked = items.showQuickBar;
    updateReplyAvailability();
  });

  function save() {
    const updated = {
      reverseOrder: reverseOrder.checked,
      smartDark: smartDark.checked,
      replyPosition: replyPosition.value,
      showQuickBar: showQuickBar.checked
    };

    chrome.storage.sync.set(updated, () => {
      status.classList.add('show');
      setTimeout(() => {
        status.classList.remove('show');
      }, 1200);
    });
  }

  reverseOrder.addEventListener('change', () => {
    updateReplyAvailability();
    save();
  });
  smartDark.addEventListener('change', save);
  replyPosition.addEventListener('change', save);
  showQuickBar.addEventListener('change', save);
});
