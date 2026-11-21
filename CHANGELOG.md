# Twilight-Cord changelog

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
