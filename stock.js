// Loaded by the hook INSTEAD of Twilight when stock-<channel>.flag exists: this Discord runs as plain stock Discord once.
// 90 s after start-up it measures itself for 30 s (the same as Twilight's own run), saves the result for the Compare page,
// and restarts with Twilight. Nothing here touches the page: it only runs in Discord's main process.
module.exports = ch => {
  const path = require('path'), fs = require('fs'), { app } = require('electron'), m = require('./measure.js');
  const note = s => { try { fs.appendFileSync(path.join(__dirname, 'reports', 'launch.txt'), `${new Date().toISOString()} ${s}\n`); } catch {} };
  const exe = path.basename(process.execPath), t0 = Date.now();
  app.whenReady().then(() => setTimeout(async () => {
    const r = await m.run(exe.replace(/\.exe$/i, ''), m.SECS);
    try { m.save(__dirname, ch, 'stock', { ...r, firstRenderMs: await m.firstRender(), at: new Date().toISOString(), afterS: Math.round((Date.now() - t0) / 1000) - (r.secs || m.SECS), build: path.basename(path.dirname(process.execPath)) }); } catch {}
    note(`stock measured ${ch}: ${r.ramMB} MB, ${r.cpuPct}% CPU, ${r.procs} processes; restarting with Twilight`);
    const upd = path.join(path.dirname(process.execPath), '..', 'Update.exe');
    try { if (fs.existsSync(upd)) app.relaunch({ execPath: upd, args: ['--processStart', exe] }); else app.relaunch(); } catch { app.relaunch(); }
    app.exit(0);
  }, m.WAIT * 1000));
};
