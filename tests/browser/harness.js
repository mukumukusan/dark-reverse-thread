/**
 * Tiny test harness for the browser suites. Tests run one after another; results are written into
 * <pre id="gtr-results"> between BEGIN and END, which tests/run.py reads from Chrome's --dump-dom.
 */
(() => {
  const tests = [];
  const results = [];

  window.test = (name, fn) => tests.push({ name, fn });

  window.assert = (condition, message) => {
    if (!condition) throw new Error(message || 'assertion failed');
  };

  window.assertEqual = (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(`${message ? message + ': ' : ''}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  };

  window.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  window.nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

  /** Polls until condition() is truthy or the time is up; returns the last result. */
  window.waitFor = async (condition, timeout = 3000, step = 20) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (condition()) return true;
      await sleep(step);
    }
    return !!condition();
  };

  window.hasClass = (el, name) => el.classList.contains(name);
  window.html = document.documentElement;


  // Results are written as they happen, so a suite that hangs still shows how far it got
  let pre = null;
  const report = (line) => {
    results.push(line);
    if (!pre) {
      pre = document.createElement('pre');
      pre.id = 'gtr-results';
      pre.textContent = 'BEGIN';
      document.body.appendChild(pre);
    }
    pre.textContent += `\n${line}`;
  };

  // A broken test script or extension error shows up as a failure instead of a silent hang
  window.addEventListener('error', (event) => report(`FAIL uncaught error :: ${event.message}`));
  window.addEventListener('unhandledrejection', (event) => report(`FAIL unhandled rejection :: ${event.reason}`));

  window.runTests = async () => {
    for (const { name, fn } of tests) {
      report(`RUN ${name}`);
      try {
        await fn();
        report(`PASS ${name}`);
      } catch (error) {
        report(`FAIL ${name} :: ${error && error.message}`);
      }
    }
    report('END');
  };
})();
