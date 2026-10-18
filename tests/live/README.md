# Live Gmail check

`tests/run.py` uses a Gmail-like fixture, so it cannot notice when Gmail changes its own markup.
`gmail-check.js` runs on the real Gmail page and reports, without clicking or changing anything:

- **required**: the Gmail parts the extension relies on (header and gear, toolbars, Compose button,
  search form, subject, message list, email bodies, Reply footer). A failure here means Gmail
  probably changed and the extension needs an update.
- **state**: whether the extension applied (dark thread, adapted body colors, scroller tag, newest
  first, reply footer placement, Gmail theme class). A failure here usually means the page needs a
  reload, or a setting is off.
- **info**: context only (theme background, message header).

Run it once in a conversation and once on a settings page (`#settings/general`): the settings
checks only run there. If you use Gmail's reading pane (split view), also run it with a
conversation open in the pane: the **split** checks (the pane is the thread root, the mail list
keeps Gmail's own look) only run there. The automated `suite-split` covers the same on a fixture.

## How to run

1. Load the extension and open Gmail.
2. Open a conversation with at least two messages (the check reads the open thread).
3. Paste `gmail-check.js` into DevTools' console. The result is returned as `{ summary, checks }`
   and printed as a table; `summary.gmailChanged` lists the missing Gmail parts.

When Claude runs the tests, it runs `python3 tests/run.py` and this check in a real Gmail thread
through Claude in Chrome. Menus, the compose window and the theme picker need clicks, so they are
checked by hand: open the message "⋮" menu and the toolbar "⋮" menu (both should be dark), open a
compose window (dark), and the gear's quick settings should still have the theme "View all" button
(`button[jsname="JFZqac"]`). Close everything without saving; never open a reply box, which creates
a draft.

# Contrast sweep

`contrast-sweep.js` catches text that can't be read: for every piece of text on screen (and text or
hints in input fields) it works out the color drawn and the color behind it, including the
extension's `filter: invert(...)` flips, and lists the places with contrast below 3. It also lists
large light boxes inside the areas the extension darkens. It also checks icons drawn as background
images (Gmail's arrows and buttons) and as `<svg>`: it draws each through the page's CSS filters and lists
those below 3 against their background (the dark Reply / Forward arrows were missed by the text check alone). Like
`gmail-check.js`, it only reads the page. It returns a promise, since the icons load first.

A screen only shows what is open, so run it once per state. The states that hid problems before:

- compose window (formatting clicks in an empty window can save a draft; let the user delete it): To field focused (chips) **and** after leaving it (the one-line summary), Cc/Bcc
  open, the formatting bar and each of its menus (font, size, text color palette, alignment, more),
  the "⋮" and send "▾" menus, the link and emoji popups
- reply box (ask the user to open one: opening it saves a draft): the box itself, the "↩▾" menu, the
  recipients expanded and left, the "⋮" menu, the formatting bar and its menus, link, emoji, and the
  quoted text opened with "…" (links in it were dark blue)
- conversation: a few threads, the message "⋮" menu, the toolbar menus, the recipient details popup
- the conversation both in the reading pane (split view) and full width
- "open in new window" (the /popout page): Gmail ignores the theme there. Claude can't reach a new
  window, so patch `window.open` once to drop the window size (`orig.call(window, url, name)`) and
  click the button: the page then opens as a tab in the same group. Opening the /popout address
  directly shows a blank page (it needs the window that opened it). The tab is not quite the real
  window: only the real one gives the scroller Gmail's light scrollbar (`.Qqr4Bd`). To check that,
  keep the window `window.open` returns and read its `document` from the opener tab (same origin)
- settings pages (each tab), the search options panel, the gear's quick settings

Close a menu by clicking an empty part of the message body, not its button again: the font menu opens
over its own button, so a second click there picks a font.

Pasting the file runs it once and keeps it as `gtrSweep(options)` for the next states (paste again
after a page reload). `gtrSweep({ minContrast: 4.5, scope: '.gtr-thread' })` checks only the open
conversation against 4.5, the contrast the extension aims for in email text (the default 3 lists only
text that is hard to read).

Email bodies vary the most, so also open a batch of designed emails (newsletters, shops, banks) and run
`gtrSweep({ minContrast: 4.5, scope: '.gtr-thread' })` in each. Search `category:promotions is:read` and
open only read emails, so nothing is marked as read. Keep the tab in front: in a background tab Chrome
slows timers down to one run every few tens of seconds.

Faint disabled buttons, images, text over background images and anything inside an `<iframe>`
(side panels, emoji grid) are skipped; icons as `<img>` and SVG backgrounds aren't checked, so
still look at icon-only menus by eye.
Gmail's menus fade in, and in a background tab a menu can stay at opacity 0 for scripts while it is
already on screen, so opacity is not used to skip anything.

# Hands-on run through Claude in Chrome

The full manual pass, as run on 2026-10-18. Everything is read-only except the steps marked
**draft**: they type into one compose window, which Gmail saves as a draft that the user deletes.

## Before starting

1. **Check that the latest extension is loaded.** Chrome keeps running the old content script until
   the extension is reloaded at `chrome://extensions` and the Gmail tabs are reloaded, and Claude
   can't do either. Read something only the latest version does (for example the compose editor's
   plain text color, `getComputedStyle(editor).color`) and ask the user to reload if it is old.
2. Work in a new tab of Claude's own tab group. Open only already-read mail
   (`#search/has:attachment is:read` gives threads with attachments to look at), so nothing is
   marked as read.

## Checklist

| State | How | Expect |
|---|---|---|
| Conversation | open a read thread with 2+ messages, run `gmail-check.js` | every check passes |
| Conversation | `gtrSweep()` | no low-contrast text, no light boxes, no dark icons (📎 by the date, ⓘ in "N attachments", the hover buttons on an attachment card) |
| Message "⋮" menu | click it, `gtrSweep({ scope })` on the open `[role="menu"]`, Escape | dark, nothing listed |
| Toolbar "⋮" menu | same | dark, nothing listed |
| Compose window | open it (empty: no draft yet) | dark; ◐ "show colors as sent" sits before the trash can, lined up with the other icons |
| "Help me write" | press the pen button in the compose toolbar (nothing is generated) | a dark pill, no white band or black box |
| **draft** Colors while writing | subject `gtr test - 削除してください`, then text in black, dark navy, red, white, yellow (see below) | black shown light gray, navy light blue, red as chosen, white and yellow underlined with yellow dots, ◐ shows a yellow dot |
| **draft** Picking white | color a plain word white | the email gets `<font color="#ffffff">` (the editor's plain text is #e3e3e3, never a palette color) |
| **draft** ◐ toggle | press ◐, then again | a white page with the colors as sent (plain text #222, no highlights, the caret stays), then back to dark |
| **draft** Compose sweep | `gtrSweep({ scope })` on the open `.Hd[role="dialog"]` | nothing listed |

Reuse the `gtr test` draft for later runs (open it from `#drafts`) instead of making new ones, and
remind the user to delete it at the end. Never open a reply box.

## How to drive Gmail from Claude in Chrome

- **Pasting the scripts:** run `gmail-check.js` and `contrast-sweep.js` through the
  `javascript_tool` (Gmail's CSP blocks loading them from elsewhere). `gtrSweep` stays defined until
  the page reloads. Use top-level `await` for its result: wrapped in an async function the tool
  returns `{}`.
- **Finding things:** the `find` tool runs into rate limits; locate elements with
  `querySelector` and `getBoundingClientRect()` and click the coordinates instead (for example the
  `gtr test` row is the `tr.zA` whose text contains it).
- **Colored text:** Gmail enforces Trusted Types, so `execCommand('insertHTML')` fails. Insert plain
  text with `execCommand('insertText')`, select each word with a `Range`, then
  `execCommand('foreColor', false, '#000000')`: Gmail's own color menu produces the same
  `<font color>`.
- **Display colors:** dark colors picked in the editor are shown lighter through `::highlight()`;
  read them from `CSS.highlights` and the `#gtr-editor-colors` style element (the sweep does this).
- **Menus:** close them with Escape. A compose window closes with its `[aria-label="保存して閉じる"]`
  button (the draft stays).
- Close the tabs Claude opened at the end.
