/**
 * Default settings shared by the content script and the popup.
 * Saved values in chrome.storage.sync override these.
 */
// eslint-disable-next-line no-unused-vars
const GTR_DEFAULT_SETTINGS = Object.freeze({
  reverseOrder: true,
  smartDark: true,
  replyPosition: 'bottom', // 'top' (right above the newest email) or 'bottom' (right below it)
  showQuickBar: false // shown only when turned on in the popup
});
