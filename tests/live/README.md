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
large light boxes inside the areas the extension darkens. Like `gmail-check.js`, it only reads the
page.

A screen only shows what is open, so run it once per state. The states that hid problems before:

- compose window: To field focused (chips) **and** after leaving it (the one-line summary), Cc/Bcc
  open, the formatting bar and each of its menus (font, size, text color palette, alignment, more),
  the "⋮" and send "▾" menus, the link and emoji popups
- conversation: a few threads, the message "⋮" menu, the toolbar menus, the recipient details popup
- settings pages (each tab), the search options panel, the gear's quick settings

Faint disabled buttons, images, text over background images and anything inside an `<iframe>`
(side panels, emoji grid) are skipped; check icon-only menus by eye, since icons are images.
Gmail's menus fade in, and in a background tab a menu can stay at opacity 0 for scripts while it is
already on screen, so opacity is not used to skip anything.
