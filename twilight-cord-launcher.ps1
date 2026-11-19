# Twilight-Cord launcher: puts the current build into every Discord found (Stable, PTB, Canary). No install needed: double-click
# twilight-cord-launcher.cmd. Run it again any time to repair. After that the mod updates itself from GitHub and puts its own
# hook back after Discord updates.   Usage: twilight-cord-launcher.cmd [install|repair|uninstall] [stable|ptb|canary|all]
param([string]$Action = 'install', [string]$Which = 'all')
$ErrorActionPreference = 'Stop'
$dest = Join-Path $env:APPDATA 'twilight-cord'
$channels = [ordered]@{ stable = 'Discord'; ptb = 'DiscordPTB'; canary = 'DiscordCanary' }
$noBom = New-Object System.Text.UTF8Encoding $false
if ($Action -eq 'repair') { $Action = 'install' }
if ($channels.Contains($Action)) { $Which = $Action; $Action = 'install' }

# The hook: a few lines inside Discord's own discord_desktop_core module (app.asar stays untouched).
$hook = @(
  "// Twilight hook (in a module, so Discord's own updates can still patch app.asar)",
  "const __fs = require('fs'), __LOG = $((Join-Path $dest 'reports\launch.txt') | ConvertTo-Json);",
  "const __note = s => { try { __fs.appendFileSync(__LOG, new Date().toISOString() + ' ' + s + '\n'); } catch (e) {} };",
  "__note('core hook ran');",
  "try { require($((Join-Path $dest 'twilight.js') | ConvertTo-Json)); __note('twilight.js loaded'); } catch (e) { __note('twilight.js FAILED: ' + (e && e.stack || e)); }",
  "module.exports = require('./core.asar');", '') -join "`n"
$stock = "module.exports = require('./core.asar');`n"

function Get-Newest($base) {
  Get-ChildItem $base -Directory -Filter 'app-*' | Where-Object { $_.Name -match '^app-\d' } |
    Sort-Object { [version]($_.Name -replace '^app-', '') } | Select-Object -Last 1
}
function Get-CoreDir($app) {
  $core = Get-ChildItem (Join-Path $app.FullName 'modules') -Directory -Filter 'discord_desktop_core*' -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -Last 1
  if (-not $core) { throw "discord_desktop_core module not found in $($app.FullName) (start Discord once, let it finish updating, close it, try again)" }
  Join-Path $core.FullName 'discord_desktop_core'
}
# Older installers renamed app.asar: put that back so the hook is the only thing in place.
function Undo-Legacy($app) {
  $r = Join-Path $app.FullName 'resources'; $bak = Join-Path $r '_app.asar'
  if (Test-Path $bak) {
    Remove-Item (Join-Path $r 'app') -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path (Join-Path $r 'app.asar'))) { Rename-Item $bak 'app.asar' }
  }
}

# Mod files: if the mod folder is missing, fetch it from the private GitHub repo (needs a read-only token).
function Ensure-Mod {
  if (Test-Path (Join-Path $dest 'twilight.js')) { Write-Host "Mod folder: $dest"; return }
  $repo = 'Decuwu/twilight-cord-public'
  $token = ''
  $mk = { $h = @{ 'User-Agent' = 'twilight-cord'; Accept = 'application/vnd.github.raw+json' }; if ($token) { $h['Authorization'] = "Bearer $token" }; $h }
  $get = { param($f) (Invoke-WebRequest -UseBasicParsing -Headers (& $mk) -Uri "https://api.github.com/repos/$repo/contents/$f`?ref=main").Content }
  try { $null = & $get 'manifest.json' }   # public repo: no token needed
  catch {
    $sec = Read-Host 'This repo needs a GitHub token (read-only, Contents)' -AsSecureString
    $token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
  }
  $man = & $get 'manifest.json'; if ($man -is [byte[]]) { $man = [Text.Encoding]::UTF8.GetString($man) }
  $m = $man | ConvertFrom-Json
  New-Item -ItemType Directory -Force $dest | Out-Null
  foreach ($f in @($m.files) + 'manifest.json') {
    $out = Join-Path $dest $f; New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
    $c = & $get $f; if ($c -is [byte[]]) { [IO.File]::WriteAllBytes($out, $c) } else { [IO.File]::WriteAllText($out, $c, $noBom) }
  }
  $cfg = @{ repo = $repo; branch = 'main'; token = $token; debugKey = 'ctrl+f'; disabled = @(); themes = @('midnight') } | ConvertTo-Json
  [IO.File]::WriteAllText((Join-Path $dest 'config.json'), $cfg, $noBom)
  Write-Host "Mod folder created: $dest"
}

try {
  $have = @($channels.Keys | Where-Object { Test-Path (Join-Path $env:LOCALAPPDATA $channels[$_]) })
  if (-not $have) { throw "No Discord found in $env:LOCALAPPDATA" }
  $targets = if ($channels.Contains($Which)) { @($Which) } else { $have }
  Write-Host ('Found: ' + ($have -join ', '))
  if ($Action -eq 'install') { Ensure-Mod }
  $ok = 0
  foreach ($c in $targets) {
    try {
      $base = Join-Path $env:LOCALAPPDATA $channels[$c]
      $app = Get-Newest $base; if (-not $app) { throw "No app-* folder in $base" }
      $dir = Get-CoreDir $app; $f = Join-Path $dir 'index.js'
      if (-not (Test-Path (Join-Path $dir 'core.asar'))) { throw "core.asar missing in $dir" }
      Undo-Legacy $app
      if ($Action -eq 'uninstall') { [IO.File]::WriteAllText($f, $stock, $noBom); Write-Host "$($channels[$c]): removed from $($app.Name)" }
      else {
        # Only Discord's usual one-liner or our own hook gets replaced; anything else is saved next to it first.
        $cur = if (Test-Path $f) { [IO.File]::ReadAllText($f) } else { '' }
        if ($cur -and $cur -notmatch 'Twilight hook' -and $cur -notmatch "^\s*module\.exports\s*=\s*require\(\s*['""]\./core\.asar['""]\s*\)\s*;?\s*$") {
          Copy-Item $f ($f + '.twilight-backup') -Force; Write-Host "  (unusual index.js saved as index.js.twilight-backup)"
        }
        [IO.File]::WriteAllText($f, $hook, $noBom); Write-Host "$($channels[$c]): $($app.Name) ready"
      }
      $ok++
    } catch { Write-Host "$($channels[$c]): $($_.Exception.Message)" -ForegroundColor Red }
  }
  if ($ok) { Write-Host "`nFully quit Discord (check the tray), then start it again." }
} catch { Write-Host "Error: $($_.Exception.Message)`n(Make sure Discord is fully closed.)" -ForegroundColor Red }
Read-Host "`nPress Enter to close"
