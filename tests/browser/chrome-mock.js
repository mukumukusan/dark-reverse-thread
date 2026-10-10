/**
 * A fake of the chrome.* APIs the extension uses. Configure it before this file loads with
 * window.__GTR_MOCK__ = { sync, local, messages, lang, version, sendMessageThrows, sendMessageResponse }.
 * Like the real API, storage callbacks and change events arrive asynchronously.
 */
(() => {
  const config = window.__GTR_MOCK__ || {};
  const stores = { sync: { ...(config.sync || {}) }, local: { ...(config.local || {}) } };
  const changeListeners = [];
  const messageListeners = [];
  const log = [];

  const read = (area, defaults) => {
    const result = {};
    Object.entries(defaults || {}).forEach(([key, fallback]) => {
      result[key] = key in stores[area] ? stores[area][key] : fallback;
    });
    return result;
  };

  const makeArea = (area) => ({
    get(defaults, callback) {
      const result = read(area, defaults);
      if (callback) setTimeout(() => callback(result), 0);
      return Promise.resolve(result);
    },
    set(items, callback) {
      const changes = {};
      Object.entries(items).forEach(([key, value]) => {
        changes[key] = { oldValue: stores[area][key], newValue: value };
        stores[area][key] = value;
      });
      log.push({ area, op: 'set', items: { ...items } });
      setTimeout(() => {
        changeListeners.forEach((listener) => listener(changes, area));
        if (callback) callback();
      }, 0);
      return Promise.resolve();
    },
    remove(keys, callback) {
      [].concat(keys).forEach((key) => delete stores[area][key]);
      log.push({ area, op: 'remove', keys });
      if (callback) setTimeout(callback, 0);
      return Promise.resolve();
    }
  });

  window.chrome = {
    runtime: {
      id: 'gtr-test',
      getManifest: () => ({ version: config.version || '0.0.0' }),
      onMessage: { addListener: (listener) => messageListeners.push(listener) }
    },
    i18n: {
      getMessage: (key) => (config.messages && key in config.messages ? config.messages[key] : key),
      getUILanguage: () => config.lang || 'en'
    },
    storage: {
      sync: makeArea('sync'),
      local: makeArea('local'),
      onChanged: { addListener: (listener) => changeListeners.push(listener) }
    },
    tabs: {
      query: async () => [{ id: 1 }],
      sendMessage: async (tabId, message) => {
        window.__gtrSent = message;
        if (config.sendMessageThrows) throw new Error('Could not establish connection');
        return config.sendMessageResponse || {};
      },
      create: (options) => { window.__gtrCreated = options; }
    }
  };

  /** Test helpers */
  window.gtrStores = stores;
  window.gtrStorageLog = log;
  /** Delivers a runtime message to the content script and resolves with its response. */
  window.gtrSendMessage = (message) => new Promise((resolve) => {
    messageListeners.forEach((listener) => listener(message, {}, resolve));
  });
})();
