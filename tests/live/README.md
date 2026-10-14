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
images (Gmail's arrows and buttons): it draws each through the page's CSS filters and lists those below
3 against their background (the dark Reply / Forward arrows were missed by the text check alone). Like
`gmail-check.js`, it only reads the page. It returns a promise, since the icons load first.

A screen only shows what is open, so run it once per state. The states that hid problems before:

- compose window: To field focused (chips) **and** after leaving it (the one-line summary), Cc/Bcc
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
(side panels, emoji grid) are skipped; icons as `<img>` or `<svg>` and SVG backgrounds aren't checked, so
still look at icon-only menus by eye.
Gmail's menus fade in, and in a background tab a menu can stay at opacity 0 for scripts while it is
already on screen, so opacity is not used to skip anything.
