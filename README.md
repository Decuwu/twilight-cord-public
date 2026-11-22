# twilight-cord

A tiny Discord client mod for Discord Stable and Discord PTB: webpack patching, plugins, themes, a GTA-style "loaded" notification and a GitHub auto-updater. No dependencies, no build step for the mod itself.

## Files
- `twilight.js` – main-process loader + renderer preload + auto-updater
- `core.js` – webpack hook, module patching, finders, plugin API, notifications
- `manifest.json` – version and list of files the updater syncs
- `debug.js` – debug menu (Ctrl+T or the Debug button next to Add Friend): test notifications, plugin start/stop, Quick CSS, webpack info
- `config.json` – your settings (never overwritten by updates): repo, token, `debugKey`, `disabled` plugins, enabled `themes`
- `plugins/*.js`, `themes/*.css`
- `installer.js` – Windows installer for Discord Stable and/or PTB (packaged to an exe with `npm run build`)

## Install
Run `twilight-cord-installer.exe` with Discord fully closed (check the tray) and pick Stable, PTB or both. Re-run it after Discord updates itself.
Command line: `twilight-cord-installer.exe install stable` (or `ptb`, `all`; `uninstall` works the same way).
Both channels share one mod folder (`%APPDATA%\twilight-cord`), so settings, plugins and updates are identical.

## Install / repair
Run `twilight-cord-launcher.exe` (built from `installer.js` with `npm run build`). It installs the current build into every Discord found (Stable, PTB, Canary) and needs no answers. The mod re-installs its own hook after Discord updates; run the launcher again only if a Discord stops loading it.

## Auto-update
The updater fetches `manifest.json` from the repo on each launch; if its version is newer it downloads the listed files.
This repo is public, so no token is needed. (If you fork it, point `repo` in `config.json` at your own fork; for a private fork use a fine-grained token with **Contents: Read-only** limited to that repo.)
To ship an update: change files, bump `version` in `manifest.json`, push. Next launch shows an "Updated" notification; press Ctrl+R to apply (restart Discord if `twilight.js` changed).
Every file in `plugins/` loads automatically; list a plugin's file name (without `.js`) under `disabled` in `config.json` to turn it off. Themes still need to be listed under `themes`.
The menu key is Ctrl+T on new installs (installs from before 1.16.0 keep Ctrl+F, which also opens Discord's search). Change it in the menu under Tools > Menu key (click, then press the keys you want), or set `debugKey` in `config.json`.

## Included plugins
Switch any of them on/off (red/green LED) from the debug menu's Plugins tab; the choice is remembered.
- **QuestCompleter** – finishes accepted Discord Quests (off until you switch it on; against Discord's rules, your account can be banned)
- **NoTrack** – blocks analytics and error-report requests
- **SilentTyping** – hides your typing indicator
- **ClearURLs** – strips tracking parameters from links you send
- **ClearNotifications** – Tools tab: mark every server and DM as read
- **ViewIcons** – Alt+click an avatar, server icon or banner for a full-size view
- **ImageZoom** – hold Shift over an image to magnify it; Shift+scroll changes zoom
- **MessageLogger** – deleted messages stay in chat (red, "deleted"), old versions of edited messages stay above the new text (yellow, "edited"); Log tab lists both (last 100, stored locally)
- **Hello** – example plugin

## Plugin API
```js
Twilight.definePlugin({
  name: 'Example',
  patches: [{ find: 'unique string in module', replacement: { match: /old/, replace: '$self.fn(old)' } }],
  start() {}, stop() {},
});
Twilight.findByProps('startTyping'); Twilight.find(m => ...); Twilight.waitFor(filter, cb);
// plugin fields: name, desc, start(), stop(), options:[{key,label,def}], actions:[{label,run}], tab:{name,render()}
Twilight.net.add(req => {/* edit req.body or return 'block' */});
Twilight.findStore('UserStore'); Twilight.opt('Plugin','key',default);
Twilight.notify('Title', 'Subtitle', 4500, 'info'); // info | success | warn | error
```

## Caveats
- Client mods break Discord's Terms of Service; use at your own risk.
- The updater runs code from this repo inside Discord, so only point `repo` at a repository you control and trust.
- Discord may rename its webpack chunk; update `CHUNK` in `core.js` if nothing loads.
