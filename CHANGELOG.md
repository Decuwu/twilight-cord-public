# Twilight-Cord changelog

## 1.22.0
**New: Quest completer is now in the public build**
- Twilight menu > **Quests** tab. It finishes accepted Discord Quests for you: video quests, "play for N minutes" quests and activity quests. It starts switched **off**; turn it on in the menu to use it.
- **Against Discord's rules**: faking quest progress can get your account banned. Use it at your own risk.
- It runs 2 video quests and 1 game quest at a time, accepts new quests if you leave that option on, and shows what is running and what is next. Rewards are never claimed behind your back: each finished quest gets a Claim button that opens Discord's own claim window.
- Only one open Discord (Stable or PTB) runs it at a time, because both use the same account.
- Not supported: quests that need a game's own achievements, and stream quests.

## 1.21.0
**New: auto-translate new messages**
- `/translate auto: Start` (or the switch in Twilight menu > Discord > Translate) translates each new message that arrives in the chat you are looking at, shown in small text under it. Messages that are already in your language are left alone. `/translate auto: Disable` stops it. On / Off and True / False work as well as Start / Disable.
- It only touches messages that arrive after you switch it on, in the chat you have open (never your own, never history). The text is sent to the translator you picked (Google, or DeepL with your key).
- If the translator rate-limits, Twilight shows a notice and switches auto-translate off by itself (the same after 5 failed tries in a row).

**Changed: /petpet uses the full square picture**
- The avatar is no longer cropped to a circle in the pet-pet GIF.

**Fixed: silent typing works again**
- After a Discord update the typing indicator was getting through even with Silent typing on. It now stops the "is typing" request itself, so nothing is sent while it is on (button in the message box, or Tools).

**New: first-run tip**
- On a fresh install, a small "click me" arrow points at the **Twilight** label at the top of Discord, with a card showing your menu key (Ctrl+T by default) and an **Open menu** button.
- It disappears as soon as you open the menu (label, key or button), or after 3 launches. Nobody who already uses Twilight gets it unasked.
- Show it again any time: Twilight menu > Settings > Menu > **Show the welcome tip again**.

## 1.20.0

**New: menu styles**
- Twilight menu > Settings > CSS > **Menu style**: pick how Twilight looks. Discord (the default, follows your Discord theme), Dusk, Midnight, Paper, Ember or Rose. One click, remembered.
- **Dusk** is deep indigo with a soft violet glow on the selected channel, your mentions, the text box and menus.
- The style colours Discord itself too, not only the Twilight window. Switch **Also colour Discord itself** off to keep Discord as it is.

**New: clean user panel buttons**
- The mic, headphones and settings buttons (bottom left) are now plain icons with a soft round glow on hover, small dropdown arrows, and a red icon when muted or deafened. Works with every menu style. Switch: Twilight menu > Settings > CSS > Menu style > **Clean mic, headphone and settings buttons**.

**Improved: platform indicators**
- Drawn icons (monitor, phone, globe) replace the emoji, coloured by status: green online, yellow idle, red do not disturb. Hover for the exact status.
- Now shown above every message (before it only appeared on replies), in the member list and next to people in your direct messages.
- Options for where it shows, and to turn the colours off.

**Changed: an easier menu**
- Opens on a new **Home** page: version and plugin count, **What's new**, **Coming soon…** (what the next update brings, kept up to date on GitHub), **Jump back in** buttons for the pages you used last, and quick actions (mark everything as read, lightweight mode, safe mode).
- **Friends** is now a tab at the top of the Twilight window, next to Menu and Search.
- The side bar is grouped: **Local** (Self, Privacy, Channel, Message log), **Discord** (Servers, Performance, Start-up, Tools) and **Settings** (CSS, Menu, Notifications, Plugins). Global and General are gone; their pages moved into these groups.
- **Privacy** now also holds ClearURLs and **Hide pop-out windows from screen share**.
- **Message log** has its own page: search by name, server, channel or text, filter deleted / edited and by server, and click any entry to jump to that spot in the chat. The clean-up buttons sit at the bottom.
- On **Self**, Tags is last so its list can grow without pushing the other switches down.
- New **Discord › Servers** page: mark this server or everything as read, and mute this server (on/off, 1 hour, 8 hours).
- Drag pages in the side bar to reorder them inside their group, or drag a group heading (or Home) to move the whole group. Your order is remembered; **Settings › Menu › Reset sidebar order** puts it back.
- **Feedback** in the menu's footer: report a bug or share an idea with your name (and Discord ID if you like). It goes straight to the Twilight team on Discord; no account or sign-in needed.
- **Settings › CSS › Menu CSS**: restyle the Twilight window itself with your own CSS (with an example to start from).
- Rows are flat lines instead of boxes, and on/off now shows as a small switch instead of ON/OFF with a coloured light.
- Removed the Snippets plugin (Tags does the same job), the Hello example plugin and the "What is different" shortcuts.

**New: pick your translator**
- Translate has its own page, **Discord › Translate**. **Translator**: Google (default) or **DeepL** (best quality; paste your own free key, it stays on your PC and shows how much of your monthly allowance is used). If DeepL fails, Google steps in.

**New: translate what you send**
- Discord › Translate › **Messages I send**: pick a language, and when you press **Enter** your message is translated right in the message box so you can check it; press **Enter** again to send. Mentions, emojis, links and `code` are kept as they are; commands and code blocks are never translated.
- A **文A button** in the message box (left of GIF) turns it on and off and shows the language (ES, FR…); right-click it for the language list.
- **/translate** *language* changes the language from any chat (or **Off**).

**New: Silent typing button**
- A button in the message box turns Silent typing on and off; it is lit while nobody can see you typing.

**Fixed: Translate**
- The Translate button sits right next to the grey add-reaction smiley in the hover bar again, and no longer shows up on reactions under a message.
- The result says which language it came from: *translated from French · hello*.

**Fixed: ThemeMaker**
- **Hide things** now really hides the gift, sticker and GIF buttons in the message box (Discord changed them, and "GIF" used to match "gift" too).
- The Colours section is gone: colours come from **Settings › CSS › Menu style** now.

## 1.19.0
**New: start-up log on the start-up screen**
- A small console under the status text shows what is loading right now, three lines at a time with a blinking cursor: Twilight loading, the main window opening, discord.com loading, Twilight being injected (and its size), how many plugins started and how long they took, Discord's native modules (and the ones Slim Discord skips), and the moment Discord's connection is up.
- Switch: Twilight menu > Global > General > Start-up screen > **Show what is loading** (on by default).

**New: What's new after every update**
- When Twilight has updated itself, the next time you open the menu it shows what changed since the version you had, every update in between, before the usual menu. **Got it** (or any tab) takes you back.
- Any time: Twilight menu > Global > General > **What's new** shows the last few updates.
- The changelog now comes down with each update.

**Fixed**
- The updater skipped `measure.js`, `stock.js` and the changelog, so after updating to 1.17.0 or 1.18.0 the stock comparison could not run. Twilight now fetches any listed file that is missing.

## 1.18.0
**New: Twilight start-up screen** (Twilight menu > Global > General > Start-up screen)
- Discord's small grey "Starting…" window gets a midnight sky with twinkling stars, a floating Twilight moon, a blue progress bar and a **Twilight-PTB · v1.18.0** label (Stable / Canary say so).
- Logo choice: the Twilight moon, Discord's own animation, or **your own picture** (PNG, JPG, GIF or WebP up to 8 MB; GIFs move). It is saved as `splash\custom.<ext>` next to the mod.
- Optional status text of your own instead of "Starting…" / "Checking for updates…" (the progress line under it stays Discord's).
- Discord opens this window before any mod can run, so Twilight restyles it as soon as it loads (about half a second in): the very first frame can still be Discord's. Only colours, pictures and that one line of text change, so Discord's own updates keep working in it. Switch it off in the same menu section.

## 1.17.0
**New: Slim Discord** (Twilight menu > Tools > Slim Discord; each part has its own switch, all off for new installs, applies after a restart)
- **No in-game overlay or game extras**: Discord's in-game overlay, cloud game saves and the old game store never load. Their files stay where Discord put them, so Discord's updater has nothing to put back; Twilight just hides them when Discord goes to load them. Go Live game capture is kept.
- **No Krisp noise suppression**: Krisp (the biggest module, 41 MB) never loads. Discord's standard noise suppression still works.
- **Clean disk junk**: a minute after start-up, older Discord builds, older installer packages and 53 unused language packs (English and your own language are kept) are deleted. Done again after Discord updates. First run on PTB freed 149 MB.
- Every module kept from loading is noted in `reports\launch.txt`.
- **Trim memory in the background**: a minute after Discord is minimised or covered, it gives back the memory it can through Discord's own purge (measured: about 20 MB). Works straight away, no restart.

**New: Compare page** (Twilight menu > Global > Compare; also "What is different from normal Discord")
- Replaces the old "Normal Discord vs Twilight" overlay, which compared against the other Discord even when that one ran Twilight too. It now looks like the rest of the Twilight menu.
- **Test against stock Discord**: Discord restarts once as plain stock Discord (Twilight not loaded), measures itself with Windows 90 s after start-up for 30 s, and comes back with Twilight, which measures itself the same way. The page shows memory, private memory, idle CPU, start-up time and process count, stock vs Twilight. First result on PTB: stock 1003 MB, Twilight 997 MB, idle CPU 0.04% vs 0.03%.
- Live numbers for both Discords, Twilight's own work, and every plugin with what normal Discord does instead (each with its on/off switch).

Earlier history (before 1.17.0) is not included in the public build.
