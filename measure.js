// Measures one Discord's processes (RAM and CPU) with Windows itself, over a window of `secs` seconds.
// Used by the Compare page: once for plain stock Discord (from stock.js) and once with Twilight loaded (from twilight.js).
const PS = (name, secs) => [
  "$ErrorActionPreference='SilentlyContinue'",
  `function snap { @(Get-Process -Name '${name}' | ForEach-Object { [pscustomobject]@{id=$_.Id;ws=[double]$_.WorkingSet64;pws=[double]$_.PrivateMemorySize64;cpu=[double]$_.CPU} }) }`,
  "$a=snap; $t0=Get-Date", `Start-Sleep -Seconds ${secs}`, "$b=snap; $dt=((Get-Date)-$t0).TotalSeconds",
  "$c0=0; $c1=0; $old=@($a | ForEach-Object id); foreach($p in $a){ $c0+=$p.cpu }; foreach($p in $b){ if($old -contains $p.id){ $c1+=$p.cpu } }",
  "$ws=(($a | Measure-Object ws -Sum).Sum + ($b | Measure-Object ws -Sum).Sum)/2; $pv=(($b | Measure-Object pws -Sum).Sum)",
  "@{procs=$b.Count; ramMB=[math]::Round($ws/1MB); privateMB=[math]::Round($pv/1MB); cpuSec=[math]::Round($c1-$c0,2); secs=[math]::Round($dt,1); cpuPct=[math]::Round(($c1-$c0)/$dt/[Environment]::ProcessorCount*100,2)} | ConvertTo-Json -Compress",
].join('\n');
exports.run = (name, secs = 30) => new Promise(resolve => {
  if (process.platform !== 'win32') return resolve({ error: 'Windows only' });
  if (!/^[\w.-]{1,40}$/.test(name)) return resolve({ error: 'bad name' });
  require('child_process').execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(PS(name, Math.max(5, Math.min(120, secs | 0))), 'utf16le').toString('base64')],
    { windowsHide: true, timeout: (secs + 40) * 1000 }, (err, out) => { try { resolve(JSON.parse(out)); } catch { resolve({ error: err ? String(err.message).slice(0, 80) : 'no data' }); } });
});
// When Discord drew the app after logging in, in ms from the page starting (Discord's own performance mark). Only that number is read.
exports.firstRender = async () => {
  try {
    const { webContents } = require('electron');
    for (const wc of webContents.getAllWebContents()) {
      if (wc.isDestroyed() || !/^https:\/\/([a-z]+\.)?discord\.com\//.test(wc.getURL())) continue;
      const v = await wc.executeJavaScript("(performance.getEntriesByName('app_first_render_after_ready_payload')[0] || {}).startTime || 0", true);
      if (v > 0) return Math.round(v);
    }
  } catch {}
  return null;
};
// Results live in reports/compare-<channel>.json as { stock: {...}, twilight: {...} }.
exports.save = (dir, ch, key, data) => {
  const fs = require('fs'), path = require('path'), f = path.join(dir, 'reports', `compare-${ch}.json`);
  let cur = {}; try { cur = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch {}
  cur[key] = data; if (key === 'stock') delete cur.twilight; // a new stock run asks for a fresh Twilight run to match it
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(cur, null, 1));
};
exports.WAIT = 90; // seconds after start-up before measuring, the same for both runs
exports.SECS = 30;
