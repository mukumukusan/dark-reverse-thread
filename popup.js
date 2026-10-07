document.addEventListener('DOMContentLoaded', () => {
  // Fill UI text from _locales/<lang>/messages.json
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
  });
  document.getElementById('version').textContent = 'v' + chrome.runtime.getManifest().version;

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

  // Suggest Gmail's own dark theme when Gmail is on a light theme (flag noted by the content script)
  chrome.storage.local.get({ gmailLightTheme: false }, ({ gmailLightTheme }) => {
    document.getElementById('themeTip').hidden = !gmailLightTheme;
  });

  // Open Gmail's quick settings (theme list) in the current Gmail tab, or in a new Gmail tab
  document.getElementById('openTheme').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'gtr-open-theme-settings' });
      if (response && response.opened) window.close();
      return; // a Gmail tab without the gear button: leave the tip as it is
    } catch {
      // not a Gmail tab (no content script there)
    }
    await chrome.storage.local.set({ gtrOpenThemeAt: Date.now() });
    chrome.tabs.create({ url: 'https://mail.google.com/mail/' });
    window.close();
  });

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
