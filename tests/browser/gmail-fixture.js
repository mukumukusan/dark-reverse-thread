/**
 * A small stand-in for Gmail's page: header with the gear, toolbars, a scrolling pane with one open
 * conversation (subject, three messages, the Reply footer) and a menu outside the thread. Only the
 * class names and structure the extension relies on are reproduced.
 *   buildGmail({ header: false })  -> no header (still loading)
 *   buildGmail({ composer: true }) -> an inline reply box in the newest message
 */
window.buildGmail = (options = {}) => {
  const { header = true, composer = false } = options;
  const message = (i, extra = '') => `
    <div class="msg" id="m${i}">
      <div class="inner">
        <div class="adn"><div class="a3s" id="body${i}"><p id="text${i}">Message ${i}</p></div></div>
        ${extra}
      </div>
    </div>`;
  const composerBox = composer ? '<div class="cbox" id="composer"><div role="textbox" contenteditable="true"></div></div>' : '';

  document.body.insertAdjacentHTML('afterbegin', `
    ${header ? '<header role="banner" id="header"><a class="FH" role="button" aria-expanded="false" id="gear">⚙</a></header>' : ''}
    <div gh="mtb" id="toolbar"><button id="toolbar-button">⋮</button></div>
    <div gh="tm" id="count"><span id="count-label">1-50 of 100</span></div>
    <div id="scroller" style="height: 300px; overflow-y: auto">
      <div role="main" id="main">
        <h2 class="hP" id="subject">Subject</h2>
        <div id="wrap">
          <div role="list" id="list">${message(1)}${message(2)}${message(3, composerBox)}</div>
        </div>
        <div id="footer"><div class="amn"><span class="ams">Reply</span></div></div>
        <div id="spacer" style="height: 800px"></div>
      </div>
    </div>
    <div id="elsewhere"><button id="outside">outside</button></div>
    <div class="Hd" role="dialog" id="compose-window"><button id="compose-button">Aa</button></div>
    <div class="J-M" role="menu" id="menu" style="position: absolute; top: 0; left: 400px; width: 120px">
      <div role="menuitem" id="menu-item">Item</div>
    </div>`);
};
