// Debug menu: toggle with the configured key (default Ctrl+T; change it in Tools > Menu key) or the "Debug" button next to Add Friend.
(() => {
  const T = window.Twilight;
  if (!T) return;
  const h = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids.filter(k => k != null && k !== false)); return e; };
  T.h = h;
  // Uses Twilight.ls (Discord removes window.localStorage, so core grabs it early and keeps a memory copy).
  const store = { get: () => T.ls.get('qcss', ''), set: v => T.ls.set('qcss', v) };

  const CSS = `#twd{position:fixed;top:24px;left:24px;width:min(580px,92vw);height:min(480px,82vh);z-index:2147483646;display:none;flex-direction:column;
background:linear-gradient(145deg,rgb(14 26 44/calc(.6*var(--tw-tint,1))),rgb(3 6 12/calc(.5*var(--tw-tint,1))));
backdrop-filter:blur(var(--tw-blur,22px)) saturate(var(--tw-sat,1.6));-webkit-backdrop-filter:blur(var(--tw-blur,22px)) saturate(var(--tw-sat,1.6));
opacity:var(--tw-op,1);border:1px solid rgba(255,255,255,.16);border-radius:var(--tw-rad,12px);overflow:hidden;box-shadow:0 22px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.2);
color:#ecf6ff;font:13px "Segoe UI",sans-serif}
#twd.open{display:flex;animation:twd-in .18s ease-out}
@keyframes twd-in{from{opacity:0;transform:translateX(-14px)}}
.twd-hd{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;user-select:none;background:linear-gradient(90deg,rgba(30,90,168,.82),rgba(108,200,255,.78) 55%,rgba(185,236,255,.78))}
.twd-hd b{font:italic 900 16px "Arial Black",Impact,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.35)}
.twd-hd small{margin-left:10px;font:700 10px "Segoe UI",sans-serif;letter-spacing:.2em;color:rgba(255,255,255,.8)}
.twd-x{cursor:pointer;color:#fff;opacity:.8;padding:0 4px;margin-left:6px}.twd-x:hover{opacity:1}
.twd-btns{display:flex;align-items:center}
.twd-rz{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;z-index:2;
background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 58%,transparent 58%,transparent 70%,rgba(255,255,255,.55) 70%,rgba(255,255,255,.55) 78%,transparent 78%)}
.twd .twd-sl{display:grid;grid-template-columns:128px 1fr 56px;gap:10px;align-items:center;padding:7px 12px;margin-bottom:4px;background:rgba(255,255,255,.045);
font:600 11px "Segoe UI",sans-serif;letter-spacing:.06em;text-transform:uppercase}
.twd .twd-sl input{padding:0;margin:0;border:0;background:none;accent-color:#6cc8ff;width:100%}
.twd .twd-sl b{text-align:right;color:#dff4ff;font:700 11px Consolas,monospace}
.twd-main{flex:1;display:flex;min-height:0}
.twd-side{width:132px;background:rgba(255,255,255,.035);padding:8px 0;overflow:auto}
.twd-tab{padding:10px 14px;cursor:pointer;font:700 11px "Segoe UI",sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8aa6bf;border-left:3px solid transparent}
.twd-tab:hover{background:rgba(108,200,255,.12);color:#fff}
.twd-tab.on{background:rgba(108,200,255,.22);color:#fff;border-left-color:#b9ecff}
.twd-body{flex:1;padding:10px 12px;overflow:auto}
.twd-sec{margin:12px 0 5px;font:700 10px "Segoe UI",sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#7f9bb5}
.twd-sec:first-child{margin-top:0}
.twd-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 12px;margin-bottom:4px;background:rgba(255,255,255,.045);
border-left:3px solid transparent;cursor:pointer;font:600 12px "Segoe UI",sans-serif;letter-spacing:.06em;text-transform:uppercase}
.twd-row:hover{background:rgba(108,200,255,.2);border-left-color:#6cc8ff}
.twd-row small{display:block;margin-top:2px;font:500 11px "Segoe UI",sans-serif;letter-spacing:.02em;text-transform:none;color:#93afc8}
.twd-row.info{cursor:default}.twd-row.info:hover{background:rgba(255,255,255,.045);border-left-color:transparent}
.twd-row.sub{margin-left:18px;padding:6px 12px;opacity:.9}
.twd-st{display:flex;align-items:center;gap:8px;font:800 10px "Segoe UI",sans-serif;letter-spacing:.12em}
.twd-led{width:11px;height:11px;border-radius:50%;display:inline-block}
.twd-led.on{background:#3ddc84;box-shadow:0 0 9px 2px rgba(61,220,132,.75)}
.twd-led.off{background:#ff4d5e;box-shadow:0 0 7px 1px rgba(255,77,94,.55)}
.twd-st.on{color:#3ddc84}.twd-st.off{color:#ff4d5e}
.twd-led.info{background:#6cc8ff;box-shadow:0 0 8px 1px rgba(108,200,255,.7)}
.twd-led.success{background:#3ddc84;box-shadow:0 0 8px 1px rgba(61,220,132,.7)}
.twd-led.warn{background:#fbbf24;box-shadow:0 0 8px 1px rgba(251,191,36,.7)}
.twd-led.error{background:#ff4d5e;box-shadow:0 0 8px 1px rgba(255,77,94,.7)}
.twd input,.twd select,.twd textarea{background:rgba(0,0,0,.4);color:#fff;border:1px solid rgba(255,255,255,.12);padding:7px 9px;margin-bottom:4px;
font:12px Consolas,monospace;width:100%;box-sizing:border-box}
.twd textarea{height:170px;resize:vertical}
.twd-2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.twd-out{font:12px Consolas,monospace;color:#a9c4db;word-break:break-all;white-space:pre-wrap;margin:4px 0 8px;user-select:text}
.twd-log{padding:8px 10px;margin-bottom:5px;background:rgba(255,255,255,.04);border-left:3px solid #fbbf24;font-size:12px;word-break:break-word}
.twd-log.delete{border-left-color:#ff4d5e}.twd-log b{display:block;font:700 10px "Segoe UI",sans-serif;letter-spacing:.1em;color:#a9c4db;margin-bottom:3px}
.twd-log .new{color:#3ddc84;margin-top:3px}
.twd-ft{display:flex;justify-content:space-between;align-items:center;padding:7px 16px;background:rgba(0,0,0,.22);border-top:1px solid rgba(255,255,255,.1);
font:700 10px "Segoe UI",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7f9bb5;padding-right:30px}
.twd-ft b{color:#b9ecff}
.twd-con{height:max(150px,calc(var(--twd-h,480px) - 250px));overflow:auto;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08);padding:6px 8px;margin-bottom:6px;
font:11px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word}
.twd-ln{margin-bottom:2px;color:#d2e6f5}.twd-ln.error{color:#ff6b7a}.twd-ln.warn{color:#fbbf24}.twd-ln.input{color:#7f9bb5}.twd-ln.result{color:#3ddc84}
.twd-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.twd-chip{padding:5px 11px;background:rgba(255,255,255,.06);cursor:pointer;font:700 10px "Segoe UI",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a9c4db}
.twd-chip:hover{background:rgba(108,200,255,.3)}.twd-chip.on{background:#6cc8ff;color:#fff}
.twd-set{margin:2px 8px;padding:6px 10px;border-radius:4px;cursor:pointer;font:500 16px "gg sans","Segoe UI",sans-serif;color:#b9ecff;display:flex;align-items:center;gap:8px}
.twd-set:hover{background:rgba(108,200,255,.16);color:#fff}
.twd-set i{width:8px;height:8px;border-radius:50%;background:#6cc8ff;box-shadow:0 0 8px 2px rgba(108,200,255,.7)}
.twd-seth{margin:14px 18px 4px;font:700 12px "gg sans","Segoe UI",sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#7f9bb5}
.twd-add{margin-left:10px;padding:0 14px 0 12px;height:24px;border-radius:6px;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;cursor:pointer;user-select:none;
color:#fff;font:600 13px/24px "gg sans","Segoe UI",sans-serif;letter-spacing:.02em;background:linear-gradient(135deg,#1e5aa8,#6cc8ff 55%,#b9ecff);
box-shadow:0 0 0 1px rgba(255,255,255,.22) inset,0 2px 12px rgba(108,200,255,.45);transition:transform .15s,box-shadow .15s,filter .15s}
.twd-add:hover{transform:translateY(-1px);filter:brightness(1.12);box-shadow:0 0 0 1px rgba(255,255,255,.35) inset,0 4px 18px rgba(185,236,255,.55)}
.twd-add:active{transform:none}
.twd-add i{width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(255,255,255,.8)}`;

  const POPCSS = `#twp{position:fixed;display:flex;flex-direction:column;min-width:380px;border-radius:var(--tw-rad,8px);overflow:hidden;font:16px "gg sans","Segoe UI",sans-serif;user-select:none;color:var(--tw-text);background:var(--tw-bg);box-shadow:0 0 0 1px var(--tw-line),var(--elevation-high,0 8px 16px rgba(0,0,0,.24))}
#twp[data-min]{height:48px!important;min-width:0}#twp[data-min] .twp-body,#twp[data-min] .twd-rz{display:none}
.twp-hd{display:flex;align-items:center;gap:8px;height:48px;padding:0 8px 0 16px;flex:none;position:relative;z-index:1;cursor:grab;touch-action:none;background:var(--tw-bg);border-bottom:1px solid var(--tw-line);box-shadow:0 1px 0 rgba(4,4,5,.1)}
#twp[data-min] .twp-hd{border-bottom:0}
.twp-hd{container-type:inline-size}.twp-hd>b{flex:0 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.twp-at,.twp-b{flex:none}
/* a narrow window: the tabs shrink (C… M… Q…) instead of being cut off, and the title steps aside first */
@container (max-width:620px){.twp-hd>b{display:none}.twp-tabs{margin-left:4px}.twp-t{padding:3px 8px}}
@container (max-width:440px){.twp-t{padding:3px 6px}}
@container (max-width:300px){.twp-t{padding:3px 4px}.twp-at{display:none}}
.twp-at{font:400 24px/1 "gg sans","Segoe UI",sans-serif;color:var(--tw-muted);margin-right:-2px}.twp-hd b{font-weight:600;color:var(--tw-head)}
.twp-tabs{display:flex;gap:2px;margin-left:10px;padding:2px;border-radius:6px;background:var(--tw-deep);flex:0 1 auto;min-width:0;overflow:hidden}
.twp-t{padding:3px 12px;border-radius:4px;cursor:pointer;font:600 13px "gg sans","Segoe UI",sans-serif;color:var(--tw-muted);flex:0 1 auto;min-width:2.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}.twp-t:hover{color:var(--tw-head)}.twp-t.on{background:var(--tw-brand);color:#fff}
.twp-b{cursor:pointer;color:var(--tw-muted);padding:4px 8px;border-radius:4px;font-size:16px;line-height:1}.twp-b:hover{background:var(--tw-hover);color:var(--tw-head)}
.twp-body{position:relative;flex:1;min-height:0}
html[data-tw-lite] #twp{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}`;

  let side, body, content, searchIn, footer;
  const input = (placeholder, value = '') => h('input', { placeholder, value });
  const sec = t => h('div', { className: 'twd-sec', textContent: t });
  const info = (k, v) => h('div', { className: 'twd-row info' }, h('span', { textContent: k }), h('span', { textContent: String(v), style: 'color:#a9c4db' }));
  const action = (label, fn, led, sub) => h('div', { className: 'twd-row', onclick: fn },
    h('span', {}, label, ...(sub ? [h('small', { textContent: sub })] : [])), led ? h('i', { className: 'twd-led ' + led }) : h('span', { textContent: '›' }));
  const ledRow = (label, on, fn, sub, cls = '') => h('div', { className: 'twd-row ' + cls, onclick: fn },
    h('span', {}, label, ...(sub ? [h('small', { textContent: sub })] : [])),
    h('span', { className: 'twd-sw ' + (on ? 'on' : 'off'), role: 'switch', title: on ? 'On' : 'Off' }));

  const slider = (label, min, max, step, val, fmt, onInput) => {
    const out = h('b', { textContent: fmt(val) }), r = h('input', { type: 'range', min, max, step, value: val });
    r.oninput = () => { out.textContent = fmt(+r.value); onInput(+r.value); };
    return h('div', { className: 'twd-sl' }, h('span', { textContent: label }), r, out);
  };
  T.ui = { slider, sec, action, ledRow, info, input };

  // Menu look (blur, tint, opacity...) lives in CSS variables on the page root, so notifications follow it too.
  const FX = { blur: 22, tint: 1, op: 1, sat: 1.6, rad: 12 };
  const fx = () => ({ ...FX, ...T.ls.get('fx', {}) });
  const applyFx = () => {
    const f = fx(), s = document.documentElement.style;
    s.setProperty('--tw-blur', f.blur + 'px'); s.setProperty('--tw-tint', f.tint); s.setProperty('--tw-op', f.op);
    s.setProperty('--tw-sat', f.sat); s.setProperty('--tw-rad', f.rad + 'px');
  };
  const setFx = (k, v) => { T.ls.set('fx', { ...fx(), [k]: v }); applyFx(); };
  const copy = (text, ok) => T.copyText(text).then(() => T.notify(ok, 'Copied to clipboard', 2500, 'success'), () => T.notify(ok, 'Could not copy', 3500, 'warn'));
  const runDiag = out => {
    const r = JSON.stringify(T.diagnose(), null, 1);
    if (out) out.textContent = r;
    T.log('diagnostics ' + r);
    copy(r, 'Diagnostics report');
  };
  const resetMenu = () => { T.ls.set('quickBox', null); T.ls.set('pos', null); T.ls.set('size', null); POP.box && applyBox(boxDefaults()); T.notify('Twilight', 'Position and size reset', 2000, 'info'); };

  // Parent categories: tools and plugins are listed under these headings.
  const GROUPS = ['Messages', 'Notifiers', 'Assistant', 'Appearance', 'Servers', 'Privacy', 'Media', 'Housekeeping'];
  const GROUP_OF = { MessageLogger: 'Messages', MessageMenu: 'Messages', Translate: 'Messages', ClearURLs: 'Messages',
    FriendNotifier: 'Notifiers', Assistant: 'Assistant', Generated: 'Assistant',
    ThemeMaker: 'Appearance', ImageZoom: 'Appearance', ViewIcons: 'Appearance',
    ClearNotifications: 'Servers', QuickServerMute: 'Servers',
    NoTrack: 'Privacy', SilentTyping: 'Privacy', Petpet: 'Media' };
  const DEV_PLUGINS = new Set([
  ]);
  const isDevPlugin = p => DEV_PLUGINS.has(p.name);
  const groupOf = p => p.group || GROUP_OF[p.name] || 'Housekeeping';
  const byGroup = list => GROUPS.map(g => [g, list.filter(x => groupOf(x.p || x) === g)]).filter(([, l]) => l.length);

  const views = {
    Notify() {
      return [
        sec('Settings'),
        (() => { const g = () => T.ls.get('notif', {}), s = (k, v) => { T.ls.set('notif', { ...g(), [k]: v }); T.debug.refresh(); };
          return h('div', {},
            ledRow('Do not disturb', !!g().dnd, () => s('dnd', !g().dnd), 'Only errors get through'),
            ...['info', 'success', 'warn', 'error'].map(t => ledRow('Mute ' + t, !!g().mute?.[t], () => s('mute', { ...g().mute, [t]: !g().mute?.[t] }))),
            action('Position: ' + ({ tr: 'top right', tl: 'top left', br: 'bottom right', bl: 'bottom left' })[g().pos || 'tr'], () => s('pos', ({ tr: 'br', br: 'bl', bl: 'tl', tl: 'tr' })[g().pos || 'tr']), null, 'Click to cycle'),
            slider('Size', .7, 1.4, .05, g().size || 1, v => v.toFixed(2) + 'x', v => T.ls.set('notif', { ...g(), size: v })),
            slider('Stay time', .4, 3, .1, g().dur || 1, v => v.toFixed(1) + 'x', v => T.ls.set('notif', { ...g(), dur: v })));
        })(),
      ];
    },
    Plugins() {
      if (!T.plugins.size) return [h('div', { className: 'twd-out', textContent: 'No plugins loaded.' })];
      const nodes = [];
      for (const [g, list] of byGroup([...T.plugins.values()].filter(p => !p.actionOnly && !p.hidden && !isDevPlugin(p)))) { // action-only plugins live in the Tools page
        nodes.push(sec(g));
        for (const p of list) nodes.push(ledRow(p.name, !T.isOff(p.name), () => flipPlugin(p), p.desc), ...optionRows(p));
      }
      return nodes;
    },
    Home() {
      const acts = pluginActs().filter(([p]) => groupOf(p) !== 'Servers' && !PLACE_OWN_PAGE.has(p.name)), on = [...T.plugins.values()].filter(p => !T.isOff(p.name) && !isDevPlugin(p) && !p.hidden).length;
      const recent = T.ls.get('menuRecent', []).filter(([t, k]) => SUBS[t]?.includes(k) && !(t === 'Home')).slice(0, 6);
      return [
        h('div', { className: 'twd-hero' }, h('b', { textContent: 'Twilight' }), h('span', { textContent: `v${T.debug.version || '?'} · ${on} plugins on${T.lite() ? ' · lightweight mode' : ''}${T.debug.safe ? ' · SAFE MODE' : ''}` })),
        action("What's new", () => showWhatsNew(null, false), null, 'The changes in the last few Twilight updates'),
        ...comingNodes(),
        ...(recent.length ? [sec('Jump back in'), h('div', { className: 'twd-chips' }, ...recent.map(([t, k]) => h('div', { className: 'twd-chip', textContent: k, onclick: () => { goto(t, k); body.scrollTop = 0; render(); } })))] : []),
        sec('Quick actions'),
        ...(T.plugins.get('ClearNotifications') && !T.isOff('ClearNotifications') ? [action('Mark everything as read', () => T.plugins.get('ClearNotifications').ack(null), null, 'Every server and DM')] : []),
        action(T.lite() ? 'Lightweight mode: on' : 'Lightweight mode: off', () => { T.setLite(!T.lite()); T.notify('Lightweight mode', T.lite() ? 'On: heavy plugins paused' : 'Off', 2500, 'info'); render(); }, null, 'Pauses heavy plugins when Discord feels slow'),
        ...byGroup(acts.map(([p, a]) => ({ p, a }))).flatMap(([g, list]) => [sec(g), ...list.map(({ p, a }) =>
          action(a.label, () => { try { a.run(); } catch (e) { T.notify(p.name + ' failed', String(e.message || e).slice(0, 70), 5000, 'error'); } }, null, a.sub || p.name))]),
        sec('Safe mode'),
        ...(T.debug.safe ? [action('Leave safe mode', () => T.cmd({ type: 'safe', on: false }), null, 'Restarts Discord with all plugins back on')]
          : [action('Restart in safe mode', () => T.cmd({ type: 'safe', on: true }), null, 'Restarts Discord with no plugins or themes, in case something breaks')]),
      ];
    },
    Menu() {
      return [
        sec('Menu key'),
        action(capturing ? 'Press the new key combination… (Esc cancels)' : 'Menu key: ' + keyName(T.debug.key), () => { capturing = true; render(); }, null, capturing ? '' : 'Click, then press the keys you want (F-keys work best: letters without Ctrl / Alt only work while you are not typing)'),
        ...(T.ls.get('menuKey') ? [action('Reset menu key', () => { T.ls.set('menuKey', null); T.debug.key = T.debug.cfgKey; render(); }, null, 'Back to ' + keyName(T.debug.cfgKey))] : []),
        sec('Window'),
        action('Reset menu position and size', resetMenu),
        slider('Corner radius', 0, 28, 1, fx().rad, v => v + 'px', v => setFx('rad', v)),
        sec('Sidebar order'),
        h('small', { className: 'twd-out', textContent: 'Drag a page in the sidebar to move it inside its group. Drag a group heading (or Home) to move the whole group.' }),
        action('Show the welcome tip again', () => { T.welcome?.show?.(); toggle(false); }, null, 'The "click me" arrow at the Twilight label and the menu key'),
        action('Reset sidebar order', () => { T.ls.set('menuOrder', {}); render(); T.notify('Twilight', 'Sidebar back to the default order', 2000, 'info'); }),
        sec('Look'),
        action('Change the colours: Settings › CSS › Menu style', () => { goto('Settings', 'CSS'); body.scrollTop = 0; render(); }, null, 'Menu styles and your own menu CSS'),
      ];
    },
    Servers() {
      const acts = pluginActs().filter(([p]) => groupOf(p) === 'Servers'), run = (p, a) => () => { try { a.run(); render(); } catch (e) { T.notify(p.name + ' failed', String(e.message || e).slice(0, 70), 5000, 'error'); } };
      const one = acts.filter(([, a]) => /this server/i.test(a.label)), all = acts.filter(([, a]) => !/this server/i.test(a.label));
      return [
        ...(one.length ? [sec('This server'), ...one.map(([p, a]) => action(a.label, run(p, a), null, a.sub || p.name))] : []),
        ...(all.length ? [sec('All servers'), ...all.map(([p, a]) => action(a.label, run(p, a), null, a.sub || p.name))] : []),
        ...(acts.length ? [] : [h('div', { className: 'twd-out', textContent: 'Turn on ClearNotifications or QuickServerMute (Settings › Plugins) for server actions.' })]),
        sec('Plugins'), ...[...T.plugins.values()].filter(p => groupOf(p) === 'Servers' && !p.hidden).map(p => ledRow(p.name, !T.isOff(p.name), () => flipPlugin(p), p.desc)),
      ];
    },
    Performance() {
      return [
        action(T.lite() ? 'Ultra lightweight mode: ON (click to turn off)' : 'Ultra lightweight mode: off (click to turn on)', () => { T.setLite(!T.lite()); T.notify('Lightweight mode', T.lite() ? 'On: heavy plugins paused, blur off' : 'Off', 2500, 'info'); }, null, 'Pauses heavy plugins, removes blur, stops the shader'),
        sec('Slim Discord (applies after a restart)'),
        ...(() => {
          const st = T.debug.slim;
          if (!st) { T.cmd({ type: 'slim' }).then(r => { if (r) { T.debug.slim = r; T.debug.refresh(); } }); return [h('div', { className: 'twd-out', textContent: 'Loading…' })]; }
          const flip = async k => { const r = await T.cmd({ type: 'slim', key: k, on: !st.saved[k] }); if (r?.saved) { T.debug.slim = r; T.notify('Slim Discord', 'Saved: restart Discord to apply', 2500, 'info'); } else T.notify('Slim Discord', r?.error || 'Could not save', 4000, 'error'); T.debug.refresh(); };
          const row = (k, label, desc) => ledRow(label + (!!st.saved[k] !== !!st.running[k] ? ' (after restart)' : ''), !!st.saved[k], () => flip(k), desc);
          return [
            row('games', 'No in-game overlay or game extras', 'Overlay, cloud game saves and the old game store stay unloaded'),
            row('krisp', 'No Krisp noise suppression', 'Saves the biggest module; standard noise suppression still works'),
            row('disk', 'Clean disk junk', 'Old Discord builds, old installers and unused language packs, a minute after start-up'),
            ledRow('Trim memory in the background', !!T.ls.get('slimTrim', false), () => { T.ls.set('slimTrim', !T.ls.get('slimTrim', false)); T.debug.refresh(); render(); },
              'A minute after Discord is minimised or covered, it gives back the memory it can (about 20 MB). Works straight away' + (T.cost.trims ? ` · trimmed ${T.cost.trims}× so far` : '')),
          ];
        })(),
      ];
    },
    'Start-up'() {
      return [
        sec('Start-up screen (the small "Starting…" window)'),
        ...(() => {
          const sp = T.debug.splash;
          if (!sp) { T.cmd({ type: 'splash' }).then(r => { if (r) { T.debug.splash = r; T.debug.refresh(); } }); return [h('div', { className: 'twd-out', textContent: 'Loading…' })]; }
          const save = async (set, image) => { const r = await T.cmd({ type: 'splash', set, image }, 15000); if (r && r.ok !== false) { T.debug.splash = r; T.notify('Start-up screen', 'Saved: you will see it the next time Discord starts', 2500, 'info'); } else T.notify('Start-up screen', r?.error || 'Could not save', 4000, 'error'); T.debug.refresh(); };
          const LOGO = { moon: 'Twilight moon', discord: "Discord's own animation", custom: 'Your picture' }, order = ['moon', 'discord', ...(sp.hasImage ? ['custom'] : [])];
          const pick = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/gif,image/webp', style: 'display:none' });
          pick.onchange = () => { const f = pick.files?.[0]; if (!f) return; if (f.size > 8 * 1048576) return T.notify('Start-up screen', 'Pictures up to 8 MB', 3500, 'warn'); const rd = new FileReader(); rd.onload = () => save(null, rd.result); rd.readAsDataURL(f); };
          const text = input('Your own status text (empty = Discord\'s "Starting…")', sp.text || ''); text.maxLength = 60;
          return [
            ledRow('Twilight start-up screen', sp.on, () => save({ on: !sp.on }), 'Midnight colours, stars and a Twilight label instead of Discord\'s grey window'),
            ...(sp.on ? [
              ledRow('Show what is loading', sp.log !== false, () => save({ log: sp.log === false }), 'A small console line under the status text: modules, the window, plugins'),
              action('Logo: ' + LOGO[sp.logo === 'custom' && !sp.hasImage ? 'moon' : sp.logo], () => save({ logo: order[(order.indexOf(sp.logo) + 1) % order.length] }), null, 'Click to change'),
              action(sp.hasImage ? 'Choose a different picture…' : 'Use your own picture…', () => pick.click(), null, 'PNG, JPG, GIF or WebP, up to 8 MB. GIFs move'), pick,
              text, action('Save status text', () => save({ text: text.value }), null, sp.text ? 'Now: ' + sp.text : 'Now: Discord\'s own text'),
            ] : []),
            action('Restart Discord to see it', () => T.cmd({ type: 'relaunch' }), null, 'Closes and reopens Discord'),
          ];
        })(),
        sec('Start-up popup'),
        (() => { const g = () => ({ ...T.startupDefaults, ...T.ls.get('startup', {}) }), s = (k, v) => T.ls.set('startup', { ...T.ls.get('startup', {}), [k]: v });
          const t = input('Title', g().title), m = input('Message', g().msg);
          t.oninput = () => s('title', t.value); m.oninput = () => s('msg', m.value);
          return h('div', {},
            ledRow('Show it when Discord starts', g().on, () => { s('on', !g().on); T.debug.refresh(); }),
            t, m, h('small', { className: 'twd-out', textContent: 'Fills in: {version} {plugins} {time}' }),
            slider('Stays for', 1, 10, .5, g().ms / 1000, v => v + 's', v => s('ms', v * 1000)),
            action('Colour: ' + g().type, () => { const o = ['info', 'success', 'warn', 'error']; s('type', o[(o.indexOf(g().type) + 1) % 4]); T.debug.refresh(); }, g().type),
            action('Preview', () => T.startupPopup(T.debug.version, true)),
            action('Reset to default', () => { T.ls.set('startup', {}); T.debug.refresh(); }));
        })(),
      ];
    },
    CSS() {
      const ta = h('textarea', { value: store.get(), placeholder: '/* Quick CSS: applies live and is remembered */', spellcheck: false });
      ta.oninput = () => { store.set(ta.value); applyCss(ta.value); };
      const themes = T.ls.get('cssThemes', {}), themeName = input('Name this theme', '');
      const mta = h('textarea', { value: T.ls.get('menuCss', ''), placeholder: '/* Menu CSS: restyle this Twilight window, e.g. .twd-tab.on { color: hotpink } */', spellcheck: false });
      mta.oninput = () => { T.ls.set('menuCss', mta.value); applyMenuCss(); };
      return [
        sec('Menu style'),
        ...Object.keys(MENU_STYLES).map(n => { const cur = T.ls.get('menuStyle', 'Discord') === n, c = MENU_STYLES[n] || { bg: '#313338', side: '#2b2d31', brand: '#5865f2' };
          return h('div', { className: 'twd-row', title: 'Click to use this style', onclick: () => { T.ls.set('menuStyle', n); applyMenuStyle(); popup.sync(); render(); } },
            h('span', {}, n, h('small', { textContent: cur ? 'In use' : STYLE_NOTE[n] })),
            h('span', { style: 'display:flex;gap:3px;flex:none' }, ...[c.bg, c.side, c.brand].map(x => h('i', { style: `width:14px;height:14px;border-radius:50%;background:${x};box-shadow:0 0 0 1px var(--tw-line)` })))); }),
        ledRow('Also colour Discord itself', T.ls.get('menuStyleDiscord', true), () => { T.ls.set('menuStyleDiscord', !T.ls.get('menuStyleDiscord', true)); applyMenuStyle(); render(); }, '', 'sub'),
        ledRow('Clean mic, headphone and settings buttons', T.ls.get('cleanPanelButtons', true), () => { T.ls.set('cleanPanelButtons', !T.ls.get('cleanPanelButtons', true)); applyPanelButtons(); render(); }, 'Plain icons with a round glow, red when muted', 'sub'),
        sec('Menu CSS'), mta,
        h('small', { className: 'twd-out', textContent: 'Styles this Twilight window only. Handy names: --tw-brand --tw-bg --tw-side --tw-head --tw-text --tw-muted (colours), .twd-side (sidebar), .twd-tab (sidebar item), .twd-row (a row), .twd-sec (section heading), .twd-hero (Home banner), .twp-hd (window header), .twp-t (header tab).' }),
        h('div', { className: 'twd-2' }, action('Clear', () => { mta.value = ''; mta.oninput(); }), action('Example', () => { mta.value = '/* rounder, roomier menu with a glow on the open page */\n.twd-row { border-radius: 8px; margin: 2px 0; }\n.twd-tab.on { box-shadow: inset 3px 0 0 var(--tw-brand); }\n.twp-hd { background: color-mix(in srgb, var(--tw-brand) 25%, var(--tw-side)); }'; mta.oninput(); })),
        sec('Quick CSS (styles Discord)'), ta, action('Clear', () => { ta.value = ''; ta.oninput(); }),
        sec('Saved themes'),
        ...(Object.keys(themes).length ? Object.keys(themes).map(n => h('div', { className: 'twd-row', title: 'Click to use this theme (replaces the Quick CSS above)',
          onclick: () => { store.set(themes[n]); applyCss(themes[n]); T.notify('Theme', `Applied ${n}`, 1800, 'success'); render(); } },
          h('span', {}, n, h('small', { textContent: themes[n] === ta.value ? 'In use' : Math.max(1, themes[n].split('\n').length) + ' lines' })),
          h('span', { className: 'twd-x', textContent: '✕', title: 'Delete this theme', onclick: ev => { ev.stopPropagation(); const t = { ...T.ls.get('cssThemes', {}) }; delete t[n]; T.ls.set('cssThemes', t); render(); } })))
          : [h('div', { className: 'twd-out', textContent: 'None yet. Type a name below to save the Quick CSS above as a theme.' })]),
        themeName,
        action('Save Quick CSS as a theme', () => {
          const n = themeName.value.trim(); if (!n) return T.notify('Theme', 'Give it a name first', 2500, 'warn');
          if (!ta.value.trim()) return T.notify('Theme', 'Quick CSS is empty, nothing to save', 2500, 'warn');
          T.ls.set('cssThemes', { ...T.ls.get('cssThemes', {}), [n]: ta.value }); T.notify('Theme', `Saved ${n}`, 1800, 'success'); render();
        }, null, 'Same name overwrites that theme'),
      ];
    },
  };

  // ---- Menu layout: three tabs ----
  // Home = landing page. Local = acts on what you are looking at (Self, Privacy, Channel, Tools). Discord = the app itself (Servers, Performance, Start-up). Settings = Twilight itself (CSS, Menu, Notifications, Plugins). Quests and Friends are header tabs.
  const PLACE = { Tags: 'Self', 'Tag commands': 'Self', TypingSpeed: 'Self', 'Build badge': 'Self', Assistant: 'Assistant', Generated: 'Assistant',
    ThemeMaker: 'Tools', ImageZoom: 'Tools', ViewIcons: 'Tools',
    NoTrack: 'Privacy', SilentTyping: 'Privacy', ClearURLs: 'Privacy',
    MessageLogger: 'Message log', Translate: 'Translate', StaffTags: 'Channel', RoleDividers: 'Channel', PlatformIndicators: 'Channel', MessageMenu: 'Channel', Petpet: 'Channel',
    FriendNotifier: 'Friends', QuickServerMute: 'Servers', ClearNotifications: 'Servers', EmojiStealer: 'Tools' };
  // Order inside a page (others follow in load order). Tags goes last on Self so its list can grow without pushing anything down.
  const RANK = ['Build badge', 'Tag commands', 'TypingSpeed', 'Tags', 'NoTrack', 'SilentTyping', 'ClearURLs', 'Assistant', 'Generated'];
  const rank = p => { const i = RANK.indexOf(p.name); return i < 0 ? 99 : i; };
  const PLACE_OWN_PAGE = new Set(['MessageLogger']); // their actions live on their own page, not on Home
  const LOCAL = new Set(['Self', 'Privacy', 'Channel', 'Message log', 'Tools', 'Translate', 'Friends', 'Assistant']); // pages drawn from the plugins placed there
  // Sidebar groups, top to bottom. Home is the landing page. Quests and Friends are header tabs (next to Menu), not sidebar pages.
  const SUBS = {
    Home: ['Home'],
    Local: ['Self', 'Privacy', 'Channel', 'Message log'],
    Discord: ['Servers', 'Translate', 'Performance', 'Start-up', 'Tools'],
    Settings: ['CSS', 'Menu', 'Notifications',
      'Plugins'] };
  const NAME = { Notifications: 'Notify' };
  // Pages that open from the header instead of the sidebar: [header tab, how to draw it]. Only shown when the plugin is there.
  const PINS = { Quests: () => pagePlugins().find(p => p.page === 'Quests'), Friends: () => [...T.plugins.values()].some(p => placeOf(p) === 'Friends' && !p.hidden) };
  let paintIssues = () => {}; // the red counter on the Issues header tab (private build); does nothing in the public build
  const pinTabs = () => Object.keys(PINS).filter(k => PINS[k]());
  const pluginActs = () => [...T.plugins.values()].filter(p => !isDevPlugin(p) && (p.actionOnly || !T.isOff(p.name))).flatMap(p => (p.actions || []).map(a => [p, a]));
  // Your own sidebar order: drag a page to move it inside its group, drag a group heading (or Home) to move the whole group.
  // Saved as menuOrder; pages and groups added in later versions slot in at the end. Reset: Settings > Menu.
  const ordered = (saved, all) => [...(saved || []).filter(x => all.includes(x)), ...all.filter(x => !(saved || []).includes(x))];
  const groupOrder = () => ordered(T.ls.get('menuOrder', {}).groups, Object.keys(SUBS));
  const pageOrder = t => ordered(T.ls.get('menuOrder', {}).pages?.[t], SUBS[t]);
  const saveOrder = (kind, t, list) => { const o = { ...T.ls.get('menuOrder', {}) }; if (kind === 'g') o.groups = list; else o.pages = { ...(o.pages || {}), [t]: list }; T.ls.set('menuOrder', o); };
  let sbDrag = null; // { kind: 'g' (a group) | 'p' (a page), group, key }
  const sortable = (el, kind, group, key) => {
    el.draggable = true; const target = () => sbDrag && (sbDrag.kind === 'g' ? (group !== sbDrag.key ? group : null) : (kind === 'p' && group === sbDrag.group && key !== sbDrag.key ? key : null));
    const clear = () => side?.querySelectorAll('.drop-a,.drop-b,.dragging').forEach(x => x.classList.remove('drop-a', 'drop-b', 'dragging'));
    el.ondragstart = e => { sbDrag = { kind, group, key }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', key); } catch {} el.classList.add('dragging'); };
    el.ondragend = () => { sbDrag = null; clear(); };
    el.ondragover = e => { if (!target()) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2; el.classList.toggle('drop-a', after); el.classList.toggle('drop-b', !after); };
    el.ondragleave = () => el.classList.remove('drop-a', 'drop-b');
    el.ondrop = e => {
      const to = target(); if (!to) return; e.preventDefault(); const after = el.classList.contains('drop-a'), d = sbDrag;
      const list = (d.kind === 'g' ? groupOrder() : pageOrder(d.group)).filter(x => x !== d.key); list.splice(list.indexOf(to) + (after ? 1 : 0), 0, d.key);
      saveOrder(d.kind, d.group, list); sbDrag = null; clear(); render();
    };
    return el;
  };
  let pin = null; // the header tab being shown in the Menu pane (Quests / Friends), or null
  const nav = Object.assign({ tab: 'Home', Local: 'Self' }, T.ls.get('menuNav', {}));
  if (!SUBS[nav.tab]) nav.tab = 'Home'; // 1.20: Global became Discord / Settings, General became Home
  for (const t of Object.keys(SUBS)) if (nav[t] && !SUBS[t].includes(nav[t])) delete nav[t];
  const goto = (t, s) => {
    if (wn.show) { if (wn.show.fromUpdate) T.ls.set('clSeen', T.debug.version); wn.show = null; }
    pin = null; fb.open = false; nav.tab = t; if (s) nav[t] = s; T.ls.set('menuNav', nav);
    const k = s || nav[t]; if (t !== 'Home' && k) T.ls.set('menuRecent', [[t, k], ...T.ls.get('menuRecent', []).filter(([a, b]) => a !== t || b !== k)].slice(0, 8)); // Home > Jump back in
  };
  const placeOf = p => p.place || PLACE[p.name];
  const flipPlugin = p => {
    const turnOn = T.isOff(p.name);
    try {
      turnOn ? p.start?.() : p.stop?.();
      T.setOff(p.name, !turnOn);
      T.log(`${p.name} ${turnOn ? 'enabled' : 'disabled'}`);
      T.notify(p.name, turnOn ? 'Enabled' : (p.stop ? 'Disabled' : 'Off after restart'), 1800, turnOn ? 'success' : 'warn');
    } catch (e) { T.notify(p.name + ' failed', String(e.message || e).slice(0, 70), 5000, 'error'); }
    render();
  };
  const optionRows = p => (p.options || []).map(o => {
    const on = T.opt(p.name, o.key, o.def);
    if (o.choices) { // a few named choices: click cycles through them
      const i = Math.max(0, o.choices.findIndex(c => c[0] === on));
      return action(o.label + ': ' + o.choices[i][1], () => { T.setOpt(p.name, o.key, o.choices[(i + 1) % o.choices.length][0]); render(); }, null, 'Click to change');
    }
    return o.min != null ? slider(o.label, o.min, o.max, o.step || 1, on, v => String(v), v => T.setOpt(p.name, o.key, v))
      : ledRow(o.label, on, () => { T.setOpt(p.name, o.key, !on); render(); }, '', 'sub');
  });
  // One plugin: its on/off row, its options, and (while it is on) its own page.
  const pluginBlock = p => [ledRow(p.name, !T.isOff(p.name), () => flipPlugin(p), p.desc), ...optionRows(p), ...(!T.isOff(p.name) && p.tab ? p.tab.render() : [])];
  const pagePlugins = () => [...T.plugins.values()].filter(p => p.page);
  const topTabs = () => [...Object.keys(SUBS), ...pagePlugins().map(p => p.page).filter(p => !PINS[p])];
  const popoutsRow = () => action('Hide pop-out windows from screen share', async () => { const st = await T.cmd({ type: 'status' }); const on = !(st?.hidePopouts !== false); await T.cmd({ type: 'popouts', on }); T.notify('Pop-outs', on ? 'Hidden from capture' : 'Visible in capture', 2500, 'info'); }, null, 'Toggle: pop-out windows are invisible in screen share and recordings');
  const localPage = s => {
    const list = [...T.plugins.values()].filter(p => placeOf(p) === s && !p.hidden).sort((a, b) => rank(a) - rank(b));
    const extra = s === 'Privacy' ? [sec('Screen sharing'), popoutsRow()] : [];
    return list.length || extra.length ? [...list.flatMap(pluginBlock), ...extra] : [h('div', { className: 'twd-out', textContent: 'Nothing here.' })];
  };

  // Search: matches plugin names, descriptions, option labels and the rows of Tools / Notify / plugin pages. Page names show as jump chips.
  let query = '', searchMode = false; // Search is the third header tab (Chat | Menu | Search); it reuses the Menu pane
  const setSearch = on => { searchMode = on; if (!on) { query = ''; if (searchIn) searchIn.value = ''; } if (searchIn) searchIn.style.display = on ? '' : 'none'; markHeader(); };
  // Which header tab is lit: Chat, Menu, a pinned page (Quests / Friends) or Search.
  const markHeader = () => { const cur = POP.view === 'Menu' ? (searchMode ? 'Search' : pin || 'Menu') : POP.view; for (const [n, t] of Object.entries(POP.tabEls)) t.classList.toggle('on', n === cur); };
  const hit = (n, q) => (n.textContent || '').toLowerCase().includes(q);
  const searchNodes = q => {
    const out = [], jumps = [], add = (label, nodes) => { if (nodes.length) out.push(sec(label), ...nodes); };
    const pages = [...Object.entries(SUBS).flatMap(([t, ks]) => ks.map(k => [t, k])), ...pagePlugins().map(p => [p.page, null])];
    for (const [t, k] of pages) if ((k || t).toLowerCase().includes(q)) jumps.push(h('div', { className: 'twd-chip', textContent: k && k !== t ? `${t} › ${k}` : t, onclick: () => { setSearch(false); goto(t, k); render(); } }));
    for (const k of [...SUBS.Local, 'Tools', 'Translate', 'Friends', 'Servers']) {
      const nodes = [];
      for (const p of [...T.plugins.values()].filter(p => placeOf(p) === k && !p.hidden)) {
        const whole = `${p.name} ${p.desc || ''}`.toLowerCase().includes(q), block = pluginBlock(p);
        nodes.push(...(whole ? block : block.filter(n => hit(n, q))));
      }
      add(k === 'Friends' ? 'Friends' : k === 'Servers' || k === 'Tools' || k === 'Translate' ? 'Discord › ' + k : 'Local › ' + k, nodes);
    }
    for (const [t, k] of [['Home', 'Home'], ['Discord', 'Servers'], ['Discord', 'Performance'], ['Discord', 'Start-up'], ['Settings', 'Menu'], ['Settings', 'Notifications']]) { try { add(t === k ? t : `${t} › ${k}`, views[NAME[k] || k]().filter(n => n.className !== 'twd-sec' && n.className !== 'twd-hero' && hit(n, q))); } catch {} }
    for (const pp of pagePlugins()) { const whole = `${pp.page} ${pp.name}`.toLowerCase().includes(q), block = pluginBlock(pp); add(pp.page, whole ? block : block.filter(n => hit(n, q))); }
    return [...(jumps.length ? [h('div', { className: 'twd-chips' }, ...jumps)] : []), ...(out.length || jumps.length ? out : [h('div', { className: 'twd-out', textContent: 'No match for “' + query.trim() + '”.' })])];
  };

  // ---- What's new: after Twilight updates itself, the next time the menu opens it shows the changelog since the version you last saw.
  // A fresh install starts quietly (nothing to catch up on). Also reachable any time: General > Discord > What's new.
  const vnum = v => String(v || '0').split('.').map(n => parseInt(n, 10) || 0), vnewer = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
  const wn = { checked: false, show: null }; // show: { entries, fromUpdate, from }
  const inline = text => { // **bold** and `code` only; everything else stays plain text (no HTML from the file)
    const out = []; let rest = String(text);
    for (let m; (m = /(\*\*([^*]+)\*\*|`([^`]+)`)/.exec(rest));) { if (m.index) out.push(rest.slice(0, m.index)); out.push(m[2] != null ? h('b', { textContent: m[2] }) : h('code', { textContent: m[3] })); rest = rest.slice(m.index + m[0].length); }
    if (rest) out.push(rest); return out;
  };
  const clCard = (e, title) => {
    const card = h('div', { className: 'twd-cl' }, h('h4', {}, title || 'v' + e.version, ...(e.version === String(T.debug.version).replace(/\.d\d*$/i, '') ? [h('span', { textContent: /\.d\d*$/i.test(T.debug.version) ? 'installed · dev build' : 'installed' })] : [])));
    let ul = null;
    for (const raw of e.body.split(/\r?\n/)) {
      const line = raw.trim(); if (!line) { ul = null; continue; }
      const head = /^\*\*([^*]+)\*\*(.*)$/.exec(line), bullet = /^[-*] +(.*)$/.exec(line);
      if (bullet) { if (!ul) card.append(ul = h('ul')); ul.append(h('li', {}, ...inline(bullet[1]))); }
      else if (head && !head[2].trim().replace(/^[(:].*$/, '')) { ul = null; card.append(h('h5', {}, head[1], ...(head[2].trim() ? [h('span', { style: 'text-transform:none;letter-spacing:0;font-weight:500;color:var(--tw-muted)', textContent: ' ' + head[2].trim() })] : []))); }
      else { ul = null; card.append(h('p', {}, ...inline(line))); }
    }
    return card;
  };
  const showWhatsNew = async (from, fromUpdate) => {
    const r = await T.cmd(from ? { type: 'changelog', from, to: T.debug.version } : { type: 'changelog', count: 3 }, 4000);
    if (!r?.entries?.length) { if (!fromUpdate) T.notify("What's new", 'No changelog found next to the mod', 3000, 'warn'); return; }
    wn.show = { entries: r.entries, fromUpdate, from }; if (body) body.scrollTop = 0; render();
  };
  // Coming soon (Home, under What's new): what the next update brings, read from COMING_SOON.md on GitHub (see twilight.js).
  // Fetched once per Discord session when Home is first drawn; folded away by default so Home stays short.
  const coming = { r: null, asked: false };
  const comingNodes = () => {
    if (!coming.asked) { coming.asked = true; T.cmd({ type: 'coming' }, 12000).then(r => { coming.r = r || { text: null }; if (nav.tab === 'Home' && !pin && !searchMode) T.debug.refresh(); }).catch(() => {}); }
    const text = coming.r?.text?.replace(/^# .*\n+/, '').trim(); if (!text) return [];
    const open = T.ls.get('comingOpen', false), first = /^## +(.*)$/m.exec(text), body = first ? text.slice(first.index + first[0].length).trim() : text;
    return [action('Coming soon…', () => { T.ls.set('comingOpen', !open); render(); }, null, open ? 'Click to fold away' : 'What the next update brings: click to see'),
      ...(open ? [clCard({ version: '', body }, first?.[1] || 'Next update')] : [])];
  };
  // ---- Feedback (footer link): goes straight to the Twilight feedback channel on Discord (webhook, see twilight.js). No sign-in.
  const fb = { open: false, type: 'Bug', title: '', text: '', info: true, who: null, id: true, busy: false };
  const FB_COLOR = { Bug: 0xed4245, Idea: 0x5865f2, Other: 0x99aab5 };
  const fbMe = () => { const u = T.findStore?.('UserStore')?.getCurrentUser?.(); return u ? { name: u.globalName || u.username, tag: u.username, id: u.id } : null; };
  const fbInfo = () => {
    const ch = /^ptb\./.test(location.hostname) ? 'PTB' : /^canary\./.test(location.hostname) ? 'Canary' : 'Stable', on = [...T.plugins.values()].filter(p => !T.isOff(p.name) && !p.hidden).length;
    const os = (/Windows NT ([\d.]+)/.exec(navigator.userAgent) || [])[1];
    return `Twilight v${T.debug.version || '?'} · Discord ${ch} · ${on} plugins on${T.lite() ? ' · lightweight mode' : ''}${T.debug.safe ? ' · safe mode' : ''} · menu style ${T.ls.get('menuStyle', 'Discord')}${os ? ' · Windows NT ' + os : ''}`;
  };
  const feedbackNodes = () => {
    const me = fbMe(); if (fb.who == null) fb.who = me ? (me.name !== me.tag ? `${me.name} (@${me.tag})` : '@' + me.tag) : '';
    const who = input('Your name or Discord name, e.g. decø (@.art.deco.)', fb.who); who.oninput = () => { fb.who = who.value; };
    const title = input('Short title, e.g. "GIF button still shows"', fb.title); title.oninput = () => { fb.title = title.value; };
    const text = h('textarea', { value: fb.text, placeholder: fb.type === 'Bug' ? 'What happened, and what did you expect? Steps to make it happen again help a lot.' : fb.type === 'Idea' ? 'What would you like Twilight to do?' : 'Tell us anything', spellcheck: true, style: 'height:140px' });
    text.oninput = () => { fb.text = text.value; };
    const send = async () => {
      if (fb.busy) return;
      if (!fb.who.trim()) return T.notify('Feedback', 'Add your name or Discord name so we can get back to you', 3000, 'warn');
      if (!fb.title.trim() && !fb.text.trim()) return T.notify('Feedback', 'Write a title or a few words first', 2500, 'warn');
      // Spam guard: one report a minute, five an hour.
      const sent = T.ls.get('fbSent', []).filter(t => Date.now() - t < 3600000), last = sent[sent.length - 1] || 0;
      if (Date.now() - last < 60000) return T.notify('Feedback', `Thanks! You can send another in ${Math.ceil((60000 - (Date.now() - last)) / 1000)}s`, 3000, 'warn');
      if (sent.length >= 5) return T.notify('Feedback', 'That is 5 reports this hour. Try again later', 3500, 'warn');
      fb.busy = true; render();
      const fields = [{ name: 'From', value: fb.who.trim() + (fb.id && me ? ` · Discord ID ${me.id}` : '') }];
      if (fb.info) fields.push({ name: 'Build', value: fbInfo() });
      const r = await T.cmd({ type: 'feedback', op: 'send', payload: { embeds: [{ title: `[${fb.type}] ${fb.title.trim() || fb.text.trim().slice(0, 60)}`, description: fb.text.trim() || '(no details)', color: FB_COLOR[fb.type], fields }] } }, 20000).catch(e => ({ ok: false, error: String(e?.message || e) }));
      fb.busy = false;
      if (!r?.ok) { T.notify('Feedback', r?.error || 'Could not send', 4500, 'error'); return render(); }
      T.ls.set('fbSent', [...sent, Date.now()]); T.notify('Feedback', 'Sent. Thank you!', 3000, 'success');
      Object.assign(fb, { open: false, title: '', text: '' }); render(); // name and ticks stay for next time this session
    };
    return [sec('Send feedback'),
      h('div', { className: 'twd-chips' }, ...['Bug', 'Idea', 'Other'].map(k => h('div', { className: 'twd-chip' + (fb.type === k ? ' on' : ''), textContent: k, onclick: () => { fb.type = k; render(); } }))),
      sec('Who is sending this'), who,
      ...(me ? [ledRow('Include my Discord ID', fb.id, () => { fb.id = !fb.id; render(); }, `${me.id} · lets us find you on Discord to reply`, 'sub')] : []),
      sec('Your feedback'), title, text,
      ledRow('Include version and build info', fb.info, () => { fb.info = !fb.info; render(); }, fbInfo(), 'sub'),
      action(fb.busy ? 'Sending…' : 'Send feedback', send, null, 'Goes straight to the Twilight team on Discord. No account or sign-in needed'),
      action('Back', () => { fb.open = false; render(); })];
  };
  const seenWhatsNew = () => { T.ls.set('clSeen', T.debug.version); wn.show = null; render(); };
  const checkWhatsNew = () => {
    if (wn.checked || !T.debug.version || T.debug.version === '?') return; wn.checked = true;
    const seen = T.ls.get('clSeen', null);
    if (!seen) return T.ls.set('clSeen', T.debug.version); // first run: nothing to catch up on
    if (vnewer(T.debug.version, seen)) showWhatsNew(seen, true);
  };
  const whatsNewNodes = () => {
    const s = wn.show, n = s.entries.length;
    return [
      ...(s.fromUpdate ? [h('div', { className: 'twd-new' }, `Twilight updated to v${T.debug.version}`, h('small', { textContent: `Here is what changed since v${s.from}${n > 1 ? ` (${n} updates)` : ''}.` }))] : [sec("What's new")]),
      ...s.entries.map(e => clCard(e)),
      action(s.fromUpdate ? 'Got it' : 'Back to the menu', seenWhatsNew, null, 'The full changelog is on GitHub (click the version at the top of Discord)'),
    ];
  };
  const render = () => {
    T.onLog = null; if (!body || !content) return;
    const top = topTabs(); if (!top.includes(nav.tab)) nav.tab = 'Home';
    if (pin && !pinTabs().includes(pin)) pin = null;
    POP.menuRoot?.classList.toggle('pinned', !!pin && !searchMode && !wn.show && !fb.open);
    const keep = body.scrollTop, tab = nav.tab, subs = SUBS[tab], q = query.trim().toLowerCase();
    searchIn.style.display = searchMode ? '' : 'none';
    // Sidebar: each top tab is a small heading with its pages listed under it; plugin pages sit together under "More".
    const nodesSide = [], pageTabs = top.filter(t => !SUBS[t]);
    for (const t of groupOrder()) {
      const pages = pageOrder(t), cur = pages.includes(nav[t]) ? nav[t] : pages[0], solo = pages.length === 1 && pages[0] === t; // Home: one page, no heading
      nodesSide.push(...(solo ? [] : [sortable(h('div', { className: 'twd-sbh', textContent: t, title: 'Drag to move this group' }), 'g', t, t)]),
        ...pages.map(k => sortable(h('div', { className: 'twd-tab' + (t === tab && k === cur && !searchMode ? ' on' : ''), textContent: k, title: 'Drag to reorder', onclick: () => { setSearch(false); goto(t, k); body.scrollTop = 0; render(); } }), solo ? 'g' : 'p', t, k)));
    }
    if (pageTabs.length) nodesSide.push(h('div', { className: 'twd-sbh', textContent: 'More' }),
      ...pageTabs.map(t => h('div', { className: 'twd-tab' + (t === tab && !searchMode ? ' on' : ''), textContent: t, onclick: () => { setSearch(false); goto(t); body.scrollTop = 0; render(); } })));
    side.replaceChildren(...nodesSide);
    checkWhatsNew();
    try {
      let nodes;
      if (fb.open) nodes = feedbackNodes();
      else if (wn.show) nodes = whatsNewNodes();
      else if (searchMode) nodes = q ? searchNodes(q) : [h('div', { className: 'twd-out', textContent: 'Type to search plugins, options and settings.' })];
      else if (pin === 'Quests') nodes = pluginBlock(PINS.Quests());
      else if (pin === 'Friends') nodes = localPage('Friends');
      else if (subs) {
        const cur = subs.includes(nav[tab]) ? nav[tab] : pageOrder(tab)[0];
        nodes = LOCAL.has(cur) ? localPage(cur) : views[NAME[cur] || cur]();
      } else nodes = pluginBlock(pagePlugins().find(p => p.page === tab));
      content.replaceChildren(...nodes);
    } catch (e) { content.replaceChildren(h('div', { className: 'twd-out', textContent: 'Error: ' + (e.message || e) })); }
    body.scrollTop = keep;
  };

  // ---- One Twilight window: Chat and Menu are tabs of the same pop-out ----
  // Shared window manager: the window that was clicked last is on top and gets the keyboard. One pointerdown listener per window.
  const WIN = new Set(), prune = () => { for (const w of WIN) if (!w.isConnected) WIN.delete(w); }; let wz = 2147483000; // stays below Discord's own dialogs (2147483646)
  T.win = {
    active: null, count() { prune(); return WIN.size; },
    add(el, focus) { prune(); WIN.add(el); el._twFocus = focus; el.addEventListener('pointerdown', e => T.win.raise(el, e.target), true); T.win.raise(el); },
    remove(el) { WIN.delete(el); if (T.win.active === el) T.win.active = null; },
    raise(el, target) {
      prune(); if (wz >= 2147483600) { wz = 2147483000; [...WIN].sort((a, b) => (+a.style.zIndex || 0) - (+b.style.zIndex || 0)).forEach(w => { w.style.zIndex = ++wz; }); }
      el.style.zIndex = ++wz; T.win.active = el; try { el._twFocus?.(target); } catch {}
    },
  };
  // Colours from Discord's own theme variables (new and old names), shared by the chat and the window frame.
  const TH = { bg: [['--chat-background-default', '--background-primary'], '#313338'], side: [['--background-base-lower', '--background-secondary'], '#2b2d31'], deep: [['--background-base-lowest', '--background-tertiary'], '#1e1f22'],
    input: [['--channel-text-area-background', '--channeltextarea-background'], '#383a40'], text: [['--text-default', '--text-normal'], '#dbdee1'], head: [['--header-primary'], '#f2f3f5'], muted: [['--text-muted', '--text-low'], '#949ba4'],
    hover: [['--background-message-hover', '--background-modifier-hover'], 'rgba(2,2,2,.06)'], line: [['--border-subtle', '--background-modifier-accent'], 'rgba(255,255,255,.06)'], brand: [['--brand-500', '--brand-experiment'], '#5865f2'], link: [['--text-link'], '#00a8fc'], thumb: [['--scrollbar-thin-thumb'], '#1a1b1e'] };
  // Menu styles: colour sets for the whole Twilight window. Discord follows Discord's own theme; the others are fixed palettes.
  const MENU_STYLES = {
    Discord: null,
    Dusk: { bg: '#181629', side: '#12111f', deep: '#0c0b16', input: '#1f1c35', text: '#e6e3f5', head: '#ffffff', muted: '#9a95b8', hover: 'rgba(168,148,255,.07)', line: '#26223f', brand: '#7c6cf0', link: '#a894ff', thumb: '#29254a',
      extra: '[class*="sidebar_"] [class*="modeSelected_"] [class*="link_"]{box-shadow:inset 2px 0 0 #a894ff!important;background:rgba(168,148,255,.16)!important}[class*="mentioned_"]{background:rgba(168,148,255,.08)!important;box-shadow:inset 2px 0 0 #a894ff!important}[class*="channelTextArea_"] [class*="scrollableContainer_"]{border:1px solid rgba(168,148,255,.12)!important;border-radius:10px!important}[class*="channelTextArea_"]:focus-within [class*="scrollableContainer_"]{border-color:rgba(168,148,255,.35)!important}[class*="menu_"],[class*="popout_"]{border:1px solid rgba(168,148,255,.12)!important;box-shadow:0 8px 28px rgba(0,0,0,.5)!important}::selection{background:rgba(168,148,255,.35)}' },
    Midnight: { bg: '#000000', side: '#0a0a0b', deep: '#000000', input: '#141416', text: '#e6e6e6', head: '#ffffff', muted: '#808080', hover: 'rgba(255,255,255,.06)', line: '#1c1c1e', brand: '#7aa2ff', link: '#8fb0ff', thumb: '#26262a' },
    Paper: { bg: '#ffffff', side: '#f2f3f5', deep: '#e3e5e8', input: '#ebedef', text: '#2e3338', head: '#060607', muted: '#5c5e66', hover: 'rgba(0,0,0,.05)', line: '#e3e5e8', brand: '#5865f2', link: '#006ce7', thumb: '#c4c9ce' },
    Ember: { bg: '#1f1a17', side: '#17130f', deep: '#110e0b', input: '#2a231e', text: '#efe6dc', head: '#fff6ea', muted: '#9a8c7d', hover: 'rgba(255,255,255,.05)', line: '#332b25', brand: '#e8a33d', link: '#f0b95c', thumb: '#3a312a' },
    Rose: { bg: '#1f1720', side: '#171018', deep: '#110b12', input: '#2a1f2c', text: '#f1e6f0', head: '#fff2fb', muted: '#a08ba0', hover: 'rgba(255,255,255,.05)', line: '#33263a', brand: '#ff7aa8', link: '#ff9cc0', thumb: '#3b2c42' },
  };
  const STYLE_NOTE = { Discord: 'Follows your Discord theme', Dusk: 'Deep indigo, violet glow', Midnight: 'Pure black', Paper: 'Light and calm', Ember: 'Warm dark, amber accent', Rose: 'Dark plum, soft pink' };
  const themeVars = () => { const out = {}; for (const el of [document.documentElement, document.body]) { const cs = getComputedStyle(el); for (const [k, [names]] of Object.entries(TH)) if (!out[k]) for (const n of names) { const v = cs.getPropertyValue(n).trim(); if (v) { out[k] = v; break; } } } for (const [k, [, fb]] of Object.entries(TH)) out[k] ||= fb; const st = MENU_STYLES[T.ls.get('menuStyle', 'Discord')]; if (st) { const { extra, ...cols } = st; Object.assign(out, cols); } return out; };
  // The chosen menu style written over Discord's own colour variables too, so the whole app follows it (switch in Settings > CSS > Menu style).
  const discordStyleCss = (c, light) => {
    const lift = p => `color-mix(in srgb, ${c.bg}, ${c.text} ${p}%)`, tint = p => `color-mix(in srgb, ${c.text} ${p}%, transparent)`;
    const v = {
      'background-base-lowest': c.deep, 'background-base-lower': c.side, 'background-base-low': c.bg, 'chat-background-default': c.bg,
      'background-primary': c.bg, 'background-secondary': c.side, 'background-secondary-alt': c.side, 'background-tertiary': c.deep,
      'background-surface-high': lift(5), 'background-surface-higher': lift(9), 'background-surface-highest': lift(13), 'bg-surface-raised': lift(5), 'background-floating': lift(7),
      'background-modifier-hover': c.hover, 'background-message-hover': c.hover, 'background-modifier-active': tint(10), 'background-modifier-selected': tint(14),
      'background-mod-subtle': tint(4), 'background-mod-normal': tint(8), 'background-mod-strong': tint(12), 'background-mod-muted': tint(5),
      'channel-text-area-background': c.input, 'channeltextarea-background': c.input,
      'text-default': c.text, 'text-normal': c.text, 'header-primary': c.head, 'header-secondary': c.muted, 'text-muted': c.muted, 'text-low': c.muted, 'text-link': c.link,
      'interactive-normal': c.muted, 'interactive-hover': c.text, 'interactive-active': c.head, 'interactive-muted': `color-mix(in srgb, ${c.muted}, ${c.bg} 50%)`,
      'border-subtle': c.line, 'border-normal': c.line, 'border-muted': c.line, 'border-strong': lift(18), 'background-modifier-accent': c.line,
      'brand-experiment': c.brand, 'brand-500': c.brand, 'background-brand': c.brand,
      'scrollbar-thin-thumb': c.thumb, 'scrollbar-auto-thumb': c.thumb, 'scrollbar-thin-track': 'transparent', 'scrollbar-auto-track': 'transparent',
    };
    for (const [n, p] of Object.entries({ 100: 88, 130: 78, 160: 68, 200: 56, 230: 46, 260: 36, 300: 28, 330: 20, 345: 15, 360: 10, 400: 12, 430: 8, 460: 4 })) v['brand-' + n] = `color-mix(in srgb, ${c.brand}, #fff ${p}%)`;
    for (const [n, p] of Object.entries({ 530: 8, 560: 16, 600: 28, 630: 38, 660: 48, 700: 58, 730: 68, 760: 76, 800: 84, 830: 90, 860: 94, 900: 97 })) v['brand-' + n] = `color-mix(in srgb, ${c.brand}, #000 ${p}%)`;
    return `html[class*="theme-"]:not(#tw),html[class*="theme-"]:not(#tw) [class*="theme-"]{color-scheme:${light ? 'light' : 'dark'}!important;${Object.entries(v).map(([k, x]) => `--${k}:${x}!important`).join(';')}}${c.extra || ''}`;
  };
  // Clean user-panel buttons (mic, headphones, settings, bottom left): plain icons, a round glow on hover, small dropdown arrows,
  // muted / deafened shown as a red icon. Works with every menu style, Discord's own included. Switch: Settings > CSS > Menu style.
  const PANEL_BTN_CSS = `
[class*="panels_"] [class*="buttons_"]{gap:2px!important}
[class*="panels_"] [class*="buttons_"] [class*="audioButtonParent_"]{background:transparent!important;box-shadow:none!important;border-radius:16px!important}
[class*="panels_"] [class*="buttons_"] button{background:transparent!important;box-shadow:none!important;border:0!important;color:var(--interactive-normal,#b5bac1)!important;transition:background-color .15s,color .15s,opacity .15s!important}
[class*="panels_"] [class*="buttons_"] button:not([class*="buttonChevron_"]){border-radius:50%!important}
[class*="panels_"] [class*="buttons_"] button:hover{background:var(--background-modifier-hover,rgba(255,255,255,.08))!important;color:var(--interactive-hover,#fff)!important}
[class*="panels_"] [class*="buttons_"] button:active{background:var(--background-modifier-active,rgba(255,255,255,.12))!important}
[class*="panels_"] [class*="buttonChevron_"]{width:12px!important;min-width:12px!important;margin-left:-2px!important;border-radius:6px!important;opacity:.45}
[class*="panels_"] [class*="audioButtonParent_"]:hover [class*="buttonChevron_"],[class*="panels_"] [class*="buttonChevron_"]:hover{opacity:1}
[class*="panels_"] [class*="buttons_"] button[role="switch"][aria-checked="true"]{color:#f23f43!important}
[class*="panels_"] [class*="buttons_"] button[role="switch"][aria-checked="true"]:hover{background:rgba(242,63,67,.14)!important;color:#ff5a5d!important}
[class*="panels_"] [class*="buttons_"] [class*="lottieIconColors_"]{color:inherit!important}`;
  const applyPanelButtons = () => {
    let el = document.getElementById('tw-panelbtns');
    if (!T.ls.get('cleanPanelButtons', true)) return el?.remove();
    if (!el) { el = document.createElement('style'); el.id = 'tw-panelbtns'; document.head.append(el); }
    if (el.textContent !== PANEL_BTN_CSS) el.textContent = PANEL_BTN_CSS;
  };
  const applyMenuStyle = () => {
    const n = T.ls.get('menuStyle', 'Discord'), c = MENU_STYLES[n]; let el = document.getElementById('tw-menustyle');
    if (!c || !T.ls.get('menuStyleDiscord', true)) return el?.remove();
    if (!el) { el = document.createElement('style'); el.id = 'tw-menustyle'; document.head.append(el); }
    const css = discordStyleCss(c, n === 'Paper'); if (el.textContent !== css) el.textContent = css;
  };
  T.theme = { vars: themeVars, text: () => Object.entries(themeVars()).map(([k, v]) => `--tw-${k}:${v}`).join(';') };
  // Copy that also works while the keyboard focus is inside one of the window's frames (the page's own clipboard call is refused then).
  T.copyText = text => new Promise((res, rej) => {
    const docs = []; for (const v of Object.values(POP.views)) if (v.pane?.doc && v.pane.f?.style.display !== 'none') docs.push(v.pane.doc); docs.push(document);
    for (const d of docs) { try { const t = d.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0;pointer-events:none'; d.body.append(t); t.select(); const ok = d.execCommand('copy'); t.remove(); if (ok) return res(); } catch {} }
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error('no clipboard'))).then(res, rej);
  });

  const POP = { box: null, view: null, views: {}, host: null, prev: null, tabEls: {}, minBtn: null, menuRoot: null };
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
  const hasChat = () => !!T.plugins.get('Assistant')?.mountChat && !T.isOff('Assistant');
  const boxDefaults = () => { const sv = T.ls.get('quickBox', null) || {}, W = innerWidth, H = innerHeight, w = clamp(sv.w || 600, 380, W - 16), hh = clamp(sv.h || 540, 300, H - 16);
    return { w, h: hh, x: clamp(sv.x ?? W - w - 24, 0, W - w), y: clamp(sv.y ?? H - hh - 24, 0, H - hh) }; };
  const applyBox = d => { const b = POP.box; if (!b) return; b.style.left = d.x + 'px'; b.style.top = d.y + 'px'; b.style.width = d.w + 'px'; b.style.height = d.h + 'px'; POP.menuRoot?.style.setProperty('--twd-h', d.h + 'px'); };
  const saveBox = () => { const b = POP.box; if (b) T.ls.set('quickBox', { x: parseInt(b.style.left), y: parseInt(b.style.top), w: parseInt(b.style.width), h: parseInt(b.style.height) }); };
  const popup = T.popup = {
    isOpen: () => !!POP.box?.isConnected,
    view: () => POP.view,
    open(view) {
      if (!popup.isOpen()) { POP.prev = document.activeElement; buildPop(); }
      if (POP.box.dataset.min) popup.minimize(false);
      popup.show(view && (view !== 'Chat' || hasChat()) ? view : (POP.view || T.ls.get('popView', 'Menu')));
      T.win.raise(POP.box);
    },
    show(view) {
      if (view === 'Chat' && !hasChat()) view = 'Menu';
      if (!ensure(view)) return T.notify('Twilight', view + ' could not start', 3000, 'warn');
      POP.view = view; POP.box.dataset.view = view;
      for (const [n, v] of Object.entries(POP.views)) v.pane.f.style.display = n === view ? 'block' : 'none';
      if (view !== 'Menu') searchMode = false;
      if (view !== 'Menu') pin = null; markHeader();
      popup.sync(); if (view === 'Menu') render(); else T.onLog = null; // nothing keeps drawing while the Menu is not shown
      try { POP.views[view].focus?.(); } catch {}
      if (view === 'Menu' && searchMode) setTimeout(() => { try { searchIn?.focus(); } catch {} }, 30);
      T.ls.set('popView', view);
    },
    sync() { const b = POP.box; if (!b) return; for (const [k, v] of Object.entries(themeVars())) b.style.setProperty('--tw-' + k, v); for (const v of Object.values(POP.views)) v.sync?.(); },
    minimize(on) {
      const b = POP.box; if (!b) return; on = on ?? !b.dataset.min;
      if (on) { b.dataset.min = '1'; POP.minBtn.textContent = '▢'; POP.minBtn.title = 'Restore'; releaseFocus(); T.onLog = null; }
      else { delete b.dataset.min; POP.minBtn.textContent = '–'; POP.minBtn.title = 'Minimise'; if (POP.view === 'Menu') render(); try { POP.views[POP.view]?.focus?.(); } catch {} }
    },
    close() {
      const b = POP.box; if (!b) return;
      for (const v of Object.values(POP.views)) { try { v.destroy?.(); } catch {} }
      T.win.remove(b); T.onLog = null; side = body = footer = null; releaseFocus(); b.remove();
      searchMode = false; query = '';
      Object.assign(POP, { box: null, view: null, views: {}, host: null, prev: null, tabEls: {}, minBtn: null, menuRoot: null });
    },
  };
  // After minimising / closing, typing goes back to Discord: leave the frames and refocus the box you were typing in.
  const releaseFocus = () => {
    try { for (const v of Object.values(POP.views)) v.pane?.f?.contentWindow?.blur?.(); } catch {}
    try { document.activeElement?.blur?.(); } catch {}
    const p = POP.prev, editable = p && p.isConnected && (p.isContentEditable || /^(INPUT|TEXTAREA)$/.test(p.tagName));
    try { (editable ? p : document.querySelector('[role="textbox"][contenteditable="true"]'))?.focus({ preventScroll: true }); } catch {}
  };
  // Keys typed in a frame never reach Discord (separate document); this also stops them bubbling further, and the menu key / Esc still work inside the window.
  const isolate = doc => {
    const on = e => {
      if (e.type === 'pointerdown') return T.win.raise(POP.box, e.target);
      if (e.type === 'keydown') {
        if (captureKey(e)) return;
        if (matches(e, T.debug.key)) { e.preventDefault(); e.stopPropagation(); return menuToggle(); }
        if (e.key === 'Escape' && POP.view === 'Menu') { e.stopPropagation(); if (query) { query = ''; if (searchIn) searchIn.value = ''; return render(); } return menuToggle(false); }
      }
      e.stopPropagation();
    };
    doc.addEventListener('pointerdown', on, true);
    for (const t of ['keydown', 'keypress', 'keyup', 'input']) doc.addEventListener(t, on);
  };
  const mkPane = () => {
    const f = h('iframe', { style: 'position:absolute;inset:0;width:100%;height:100%;border:0;display:none;background:transparent', tabIndex: -1 });
    POP.host.append(f);
    try { const doc = f.contentDocument; doc.open(); doc.write('<!doctype html><meta charset="utf-8"><body></body>'); doc.close(); isolate(doc); return { f, doc, body: doc.body }; }
    catch { const d = h('div', { style: 'position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;user-select:text' }); f.replaceWith(d); return { f: d, doc: document, body: d, inline: true }; } // frame blocked: fall back to the page
  };
  const MENU_FIX = 'html,body{margin:0;height:100%;overflow:hidden;background:transparent}#twd,#twd.open{position:static!important;display:flex!important;width:100%!important;height:100%!important;max-width:none!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;opacity:1!important;border:0!important;border-radius:0!important;box-shadow:none!important;animation:none!important;z-index:auto!important}';
  // The menu looks like the chat: Discord's own colours (the --tw-* variables) instead of glass.
  const MENU_THEME = `html,body{background:var(--tw-bg)!important}
.twd{color:var(--tw-text);font:14px "gg sans","Segoe UI",sans-serif;background:var(--tw-bg)!important}
.twd-side{background:var(--tw-side);padding:10px 8px;width:148px;box-sizing:border-box}
.twd-sbh{margin:12px 8px 4px;font:700 11px "gg sans","Segoe UI",sans-serif;letter-spacing:.02em;text-transform:none;color:var(--tw-muted)}.twd-sbh:first-child{margin-top:2px}
.twd-tab{position:relative;margin:0 0 1px;padding:6px 10px;border-left:0;border-radius:4px;font:500 14px "gg sans","Segoe UI",sans-serif;letter-spacing:0;text-transform:none;color:var(--tw-muted);transition:background .12s,color .12s}
.twd-tab:hover{background:var(--tw-hover);color:var(--tw-head)}
.twd-tab.on{background:color-mix(in srgb,var(--tw-brand) 18%,transparent);color:var(--tw-head);border-left:0}
.twd-sec{margin:18px 0 4px;font:700 12px "gg sans","Segoe UI",sans-serif;letter-spacing:.02em;text-transform:none;color:var(--tw-muted)}
.twd-row,.twd .twd-sl{background:transparent;border-left:0;border-radius:0;border-bottom:1px solid var(--tw-line);margin:0;padding:10px 2px;font:500 14px "gg sans","Segoe UI",sans-serif;letter-spacing:0;text-transform:none;color:var(--tw-text);transition:background .12s}
.twd-row:hover{background:color-mix(in srgb,var(--tw-text) 5%,transparent);border-left:0}
.twd-row.info:hover{background:transparent;border-left:0}
.twd-row.sub{padding-left:16px}
.twd-sw{flex:none;width:30px;height:18px;border-radius:9px;background:color-mix(in srgb,var(--tw-text) 22%,transparent);position:relative;transition:background .12s}
.twd-sw:after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .12s}
.twd-sw.on{background:var(--tw-brand)}.twd-sw.on:after{left:14px}
.twd-row small{font:400 12px "gg sans","Segoe UI",sans-serif;color:var(--tw-muted)}
.twd .twd-sl input{accent-color:var(--tw-brand)}.twd .twd-sl b{color:var(--tw-head)}
.twd-st{font:700 11px "gg sans","Segoe UI",sans-serif;letter-spacing:.04em}
.twd-st.on{color:#23a55a}.twd-st.off{color:#f23f43}
.twd-led{width:10px;height:10px;box-shadow:none!important}.twd-led.on,.twd-led.success{background:#23a55a}.twd-led.off,.twd-led.error{background:#f23f43}.twd-led.info{background:var(--tw-brand)}.twd-led.warn{background:#f0b232}
.twd input,.twd select,.twd textarea{background:var(--tw-input);color:var(--tw-text);border:0;border-radius:4px;padding:8px 10px;font:14px "gg sans","Segoe UI",sans-serif}
.twd textarea{font:13px Consolas,monospace}
.twd-out{color:var(--tw-muted)}
.twd-cl{background:var(--tw-side);border-radius:6px;padding:10px 14px 8px;margin-bottom:8px;font:400 13.5px/1.45 "gg sans","Segoe UI",sans-serif;color:var(--tw-text);user-select:text}
.twd-cl h4{margin:0 0 6px;font:700 16px "gg sans","Segoe UI",sans-serif;color:var(--tw-head)}.twd-cl h4 span{margin-left:8px;font:600 11px "gg sans","Segoe UI",sans-serif;color:var(--tw-muted)}
.twd-cl h5{margin:10px 0 4px;font:700 12px "gg sans","Segoe UI",sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--tw-brand)}
.twd-cl ul{margin:0;padding-left:18px}.twd-cl li{margin:3px 0}.twd-cl p{margin:4px 0}.twd-cl b{color:var(--tw-head)}
.twd-cl code{font:12px Consolas,monospace;background:var(--tw-input);padding:1px 4px;border-radius:3px}
.twd-body{overflow-x:hidden}.twd-row>span{min-width:0;overflow-wrap:anywhere}
.twd-side [draggable=true]{user-select:none}.twd-sbh[draggable=true]{cursor:grab}.twd-side .dragging{opacity:.4}
.twd-side .drop-b{box-shadow:inset 0 2px 0 var(--tw-brand)}.twd-side .drop-a{box-shadow:inset 0 -2px 0 var(--tw-brand)}
.twp-badge{display:inline-block;min-width:16px;height:16px;margin-left:5px;padding:0 4px;box-sizing:border-box;border-radius:8px;background:#f23f43;color:#fff;font:700 11px/16px "gg sans","Segoe UI",sans-serif;text-align:center;vertical-align:1px}
.twd-issue{position:relative;margin:8px 0;padding:10px 12px 8px 14px;border-radius:6px;background:var(--tw-side);box-shadow:inset 3px 0 0 var(--c)}.twd-issue.solved{opacity:.55}
.twd-issue.new::after{content:'NEW';position:absolute;top:10px;right:10px;padding:0 5px;border-radius:3px;background:#f23f43;color:#fff;font:700 10px/15px "gg sans","Segoe UI",sans-serif}
.twd-issue-hd{display:flex;gap:8px;align-items:baseline;padding-right:36px}.twd-issue-hd b{flex:1;min-width:0;overflow-wrap:anywhere;color:var(--tw-head);font:600 14px "gg sans","Segoe UI",sans-serif}.twd-issue-hd small{flex:none;color:var(--tw-muted)}
.twd-issue-tx{margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--tw-text);font:400 13px/1.4 "gg sans","Segoe UI",sans-serif;user-select:text}
.twd-issue-meta{display:block;white-space:pre-wrap;color:var(--tw-muted);font-size:11px;user-select:text}
.twd-issue-act{display:flex;gap:14px;margin-top:6px}.twd-issue-act span{cursor:pointer;color:var(--tw-muted);font:600 12px "gg sans","Segoe UI",sans-serif}.twd-issue-act span:hover{color:var(--tw-head)}
.twd.pinned .twd-side{display:none}.twd.pinned .twd-body{padding-left:22px;padding-right:22px}
.twd-hero{display:flex;flex-direction:column;gap:2px;margin:2px 0 6px;padding:14px 16px;border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--tw-brand) 30%,var(--tw-side)),var(--tw-side));font:400 12px "gg sans","Segoe UI",sans-serif;color:var(--tw-muted)}
.twd-hero b{font:700 18px "gg sans","Segoe UI",sans-serif;color:var(--tw-head)}
.twd-new{background:var(--tw-brand);color:#fff;border-radius:6px;padding:10px 14px;margin:4px 0 10px;font:600 14px "gg sans","Segoe UI",sans-serif}.twd-new small{display:block;font:400 12px "gg sans","Segoe UI",sans-serif;opacity:.85}
.twd-log{background:var(--tw-side);border-radius:4px}.twd-log b{color:var(--tw-muted)}
.twd-chip{background:var(--tw-side);border-radius:12px;padding:3px 10px;color:var(--tw-text)}.twd-chip:hover{background:color-mix(in srgb,var(--tw-text) 10%,var(--tw-side))}.twd-chip.on{background:var(--tw-brand);color:#fff}
.twd-ft{background:var(--tw-side);border-top:1px solid var(--tw-line);color:var(--tw-muted)}.twd-ft b{color:var(--tw-muted)}
.twd-fb{cursor:pointer;margin-left:auto;margin-right:14px;padding:2px 8px;border-radius:4px;color:var(--tw-link,var(--tw-brand))}.twd-fb:hover{background:var(--tw-hover);text-decoration:underline}
.twd-body::-webkit-scrollbar,.twd-side::-webkit-scrollbar{width:14px}.twd-body::-webkit-scrollbar-thumb,.twd-side::-webkit-scrollbar-thumb{background:var(--tw-thumb);border:4px solid transparent;background-clip:padding-box;border-radius:8px}.twd-body::-webkit-scrollbar-track,.twd-side::-webkit-scrollbar-track{background:transparent}`;
  const mountMenu = pane => {
    side = h('div', { className: 'twd-side' }); body = h('div', { className: 'twd-body' }); content = h('div');
    searchIn = h('input', { placeholder: 'Search the menu…', value: query, style: 'margin-bottom:8px;display:none', oninput: () => { query = searchIn.value; body.scrollTop = 0; render(); },
      onkeydown: e => { if (e.key === 'Escape' && searchIn.value) { e.stopPropagation(); e.preventDefault(); query = ''; searchIn.value = ''; render(); } } });
    searchIn.style.display = searchMode ? '' : 'none';
    body.append(searchIn, content);
    footer = h('div', { className: 'twd-ft' }, h('span', { textContent: `${keyName(T.debug.key)} toggle · Esc back` }),
      h('span', { className: 'twd-fb', textContent: 'Feedback', title: 'Report a bug or share an idea', onclick: () => { fb.open = true; setSearch(false); if (body) body.scrollTop = 0; render(); } }), h('b', { textContent: 'v' + (T.debug.version || '?') }));
    const root = POP.menuRoot = h('div', { id: 'twd', className: 'twd open' }, h('div', { className: 'twd-main' }, side, body), footer);
    root.style.setProperty('--twd-h', parseInt(POP.box.style.height) + 'px');
    (pane.inline ? pane.body : pane.doc.head).append(h('style', { textContent: CSS + MENU_FIX + MENU_THEME })); pane.body.append(root); applyMenuCss();
    const sync = () => { if (!pane.inline) try { pane.doc.documentElement.style.cssText = T.theme.text(); } catch {} }; sync();
    return { pane, sync, focus() { try { pane.f.contentWindow?.focus(); } catch {} }, destroy() { side = body = content = searchIn = footer = null; POP.menuRoot = null; } };
  };
  // Menu CSS (Settings > CSS > Menu CSS): your own CSS for the Twilight window. Goes into the menu and chat frames and, scoped to the
  // window, into Discord's page for the window frame and header. Kept apart from Quick CSS, which styles Discord.
  const applyMenuCss = () => {
    const css = TWI_CLEAN(T.ls.get('menuCss', ''));
    for (const v of Object.values(POP.views)) { const d = v.pane?.inline ? null : v.pane?.doc; if (!d?.head) continue; let st = d.getElementById('tw-menucss'); if (!st) { st = d.createElement('style'); st.id = 'tw-menucss'; d.head.append(st); } st.textContent = css; }
    let m = document.getElementById('tw-menucss'); if (!m) { m = document.createElement('style'); m.id = 'tw-menucss'; document.documentElement.append(m); } m.textContent = css.trim() ? `@scope (#twp) {\n${css}\n}` : '';
  };
  const TWI_CLEAN = css => String(css).replace(/@import[^;]*;?/gi, '').replace(/url\s*\((?!\s*['"]?data:image)[^)]*\)/gi, '').replace(/expression\s*\(|javascript:|behavior:/gi, '').slice(0, 20000);
  const ensure = view => {
    if (POP.views[view]) return true;
    const pane = mkPane(); let v = null;
    try { v = view === 'Chat' ? T.plugins.get('Assistant')?.mountChat?.(pane) : mountMenu(pane); } catch (e) { T.log('Twilight window: ' + view + ' failed: ' + (e.message || e)); }
    if (!v) { pane.f.remove(); return false; }
    v.pane = pane; POP.views[view] = v; applyMenuCss(); return true;
  };
  const buildPop = () => {
    const box = h('div', { id: 'twp' }), d = boxDefaults();
    box.style.cssText = `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px;${T.theme.text()}`;
    const btn = (t, title, fn) => h('span', { className: 'twp-b', textContent: t, title, onclick: fn });
    POP.tabEls = {}; const tabs = h('div', { className: 'twp-tabs' });
    for (const n of [...(hasChat() ? ['Chat'] : []), 'Menu', ...pinTabs(), 'Search']) {
      const pinned = !!PINS[n];
      POP.tabEls[n] = h('div', { className: 'twp-t', textContent: n, title: n, onclick: () => {
        fb.open = false;
        if (n === 'Search') { pin = null; searchMode = true; } else { searchMode = false; if (n === 'Menu' || pinned) { if (wn.show && !wn.show.fromUpdate) wn.show = null; pin = pinned ? n : null; } }
        if (body) body.scrollTop = 0; popup.show(n === 'Search' || pinned ? 'Menu' : n);
      } }); tabs.append(POP.tabEls[n]);
    }
    paintIssues();
    POP.minBtn = btn('–', 'Minimise', () => popup.minimize());
    const hd = h('div', { className: 'twp-hd', onpointerdown: drag, ondblclick: e => { if (!e.target.closest('.twp-b,.twp-t')) popup.minimize(); } },
      h('span', { className: 'twp-at', textContent: '@' }), h('b', { textContent: 'Twilight' }), tabs, h('span', { style: 'flex:1' }),
      POP.minBtn, btn('✕', 'Close (the chat is forgotten)', () => popup.close()));
    POP.host = h('div', { className: 'twp-body' });
    box.append(hd, POP.host, h('div', { className: 'twd-rz', title: 'Drag to resize', onpointerdown: resize }));
    for (const t of ['keydown', 'keypress', 'keyup', 'input']) box.addEventListener(t, e => e.stopPropagation());
    POP.box = box; document.documentElement.append(box);
    T.win.add(box, target => POP.views[POP.view]?.focus?.(target));
  };
  // Drag by the header (it sticks to the screen edges, hold Alt to move freely); resize from the corner. Position and size are remembered.
  const drag = e => {
    if (e.button || e.target.closest('.twp-b,.twp-t')) return;
    const b = POP.box, r = b.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, hd = e.currentTarget;
    try { hd.setPointerCapture(e.pointerId); } catch {} hd.style.cursor = 'grabbing'; e.preventDefault();
    hd.onpointermove = ev => {
      let L = clamp(ev.clientX - dx, 0, innerWidth - 80), Tp = clamp(ev.clientY - dy, 0, innerHeight - 40); const w = b.offsetWidth, hh = b.offsetHeight, S = ev.altKey ? 0 : 16;
      if (L < S) L = 0; else if (Math.abs(innerWidth - (L + w)) < S) L = innerWidth - w; if (Tp < S) Tp = 0; else if (Math.abs(innerHeight - (Tp + hh)) < S) Tp = innerHeight - hh;
      b.style.left = L + 'px'; b.style.top = Tp + 'px';
    };
    hd.onpointerup = hd.onpointercancel = () => { hd.onpointermove = hd.onpointerup = hd.onpointercancel = null; hd.style.cursor = ''; saveBox(); };
  };
  const resize = e => {
    if (e.button) return; const b = POP.box, r = b.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, g = e.currentTarget;
    try { g.setPointerCapture(e.pointerId); } catch {} e.preventDefault(); e.stopPropagation();
    g.onpointermove = ev => applyBox({ x: r.left, y: r.top, w: clamp(r.width + ev.clientX - x0, 380, innerWidth - r.left), h: clamp(r.height + ev.clientY - y0, 300, innerHeight - r.top) });
    g.onpointerup = g.onpointercancel = () => { g.onpointermove = g.onpointerup = g.onpointercancel = null; saveBox(); };
  };
  // The menu key (or Esc on the Menu): open the Menu; from the Menu go back to the chat (which keeps its memory), or close if there is no chat.
  const menuToggle = force => {
    const open = popup.isOpen() && POP.view === 'Menu' && !POP.box.dataset.min, want = force ?? !open;
    if (want) { T.welcome?.done?.(); return popup.open('Menu'); } // opening the menu ends the first-run tip
    if (popup.isOpen() && POP.views.Chat) return popup.show('Chat');
    popup.close();
  };
  const toggle = menuToggle;

  let qcss;
  const applyCss = v => {
    qcss ||= h('style', { id: 'twd-qcss' });
    document.documentElement.append(qcss);
    qcss.textContent = T.scoped(v);
  };
  // Lets other plugins put CSS into the same box as the CSS tab. The tab redraws if it is open.
  T.quickCss = {
    get: () => store.get(),
    add(css, label) {
      const cur = store.get(), block = (label ? '/* Twilight: ' + String(label).replace(/\*\//g, '').replace(/\s+/g, ' ').slice(0, 80) + ' */\n' : '') + String(css).trim();
      const next = (cur.trim() ? cur.replace(/\s+$/, '') + '\n\n' : '') + block + '\n';
      store.set(next); applyCss(next);
      if (popup.isOpen() && POP.view === 'Menu' && nav.tab === 'Settings' && nav.Settings === 'CSS') render();
    },
    // A whole theme replaces what is in the box instead of piling on top of it.
    set(css, label) {
      const next = (label ? '/* Twilight theme: ' + String(label).replace(/\*\//g, '').replace(/\s+/g, ' ').slice(0, 80) + ' */\n' : '') + String(css).trim() + '\n';
      store.set(next); applyCss(next);
      if (popup.isOpen() && POP.view === 'Menu' && nav.tab === 'Settings' && nav.Settings === 'CSS') render();
    },
  };

  const matches = (e, spec) => {
    const p = spec.toLowerCase().split('+'), k = p.pop();
    if (e.key.toLowerCase() !== k || e.ctrlKey !== p.includes('ctrl') || e.shiftKey !== p.includes('shift') || e.altKey !== p.includes('alt') || e.metaKey) return false;
    // A typing key (a letter, digit, symbol or space) without Ctrl / Alt is also just typing: then it only opens the menu while you are not in a
    // text box. Keys like F5 always work.
    const t = e.composedPath?.()[0] || e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    return !(typing && (k.length === 1 || k === 'space') && !p.includes('ctrl') && !p.includes('alt'));
  };
  const keyName = spec => String(spec).split('+').map(x => x.length === 1 || /^f\d+$/.test(x) ? x.toUpperCase() : x[0].toUpperCase() + x.slice(1)).join('+');
  // "Change menu key": the next key combination pressed becomes the menu key (saved in Twilight's own storage). Esc cancels.
  let capturing = false;
  const captureKey = e => {
    if (!capturing || e.type !== 'keydown') return false;
    e.preventDefault(); e.stopPropagation();
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return true; // wait for the real key
    capturing = false;
    if (e.key === 'Escape') { T.notify('Menu key', 'Unchanged: ' + keyName(T.debug.key), 2500, 'info'); render(); return true; }
    const k = e.key === ' ' ? 'space' : e.key.toLowerCase(), spec = [e.ctrlKey && 'ctrl', e.shiftKey && 'shift', e.altKey && 'alt', k].filter(Boolean).join('+');
    T.debug.key = spec; T.ls.set('menuKey', spec); render();
    T.notify('Menu key', 'Now ' + keyName(spec) + (!e.ctrlKey && !e.altKey && (k.length === 1 || k === 'space') ? ' (ignored while you type in a text box)' : ''), 4000, 'success');
    return true;
  };

  // Generated profile picture for Twilight (shown in the friends list, DM list and quick chat).
  T.pfp = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e5aa8"/><stop offset="1" stop-color="#0a1428"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><path d="M42 12a21 21 0 1 0 10 33A17 17 0 0 1 42 12z" fill="#dff4ff"/><circle cx="46" cy="40" r="2" fill="#b9ecff"/><circle cx="50" cy="26" r="1.4" fill="#b9ecff"/></svg>');

  // Twilight's entries copy Discord's own rows (class names read from the live client): a section at the bottom of User Settings,
  // a pinned row at the top of the DM list, and a row at the top of the friends list.
  const MOON = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z';
  const asst = () => T.plugins.get('Assistant');
  const injectSettings = () => {
    const list = document.querySelector('ul[class*="sublist"][role="list"]'); if (!list || list.querySelector('[data-tw-set]')) return;
    const secs = [...list.children].filter(k => /section_/.test(k.className)); const base = secs[secs.length - 1]; if (!base) return;
    const sec = base.cloneNode(true); sec.dataset.twSet = '1';
    const h3 = sec.querySelector('h3'); if (h3) { h3.textContent = 'Twilight'; h3.removeAttribute('id'); } sec.removeAttribute('aria-labelledby');
    const ul = sec.querySelector('ul'), tpl = ul.querySelector('li'); ul.replaceChildren();
    const mk = (label, fn) => {
      const li = tpl.cloneNode(true); li.removeAttribute('data-settings-sidebar-item');
      const it = li.querySelector('[role="link"]'); it.className = it.className.replace(/\b\w*(destructive|active)_\w+/g, '').trim(); it.removeAttribute('aria-current'); it.dataset.listItemId = 'twilight-' + label.toLowerCase().replace(/\W+/g, '-');
      li.querySelector('svg path')?.setAttribute('d', MOON); li.querySelector('svg path')?.setAttribute('fill', 'currentColor');
      const t = li.querySelector('[class*="body-md"]'); if (t) { t.textContent = label; t.style.color = 'currentcolor'; }
      li.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); setTimeout(fn, 250); }, true);
      return li;
    };
    ul.append(mk('Twilight menu', () => toggle(true)));
    base.after(sec);
  };

  const blank = (n, label) => { n.removeAttribute('data-list-item-id'); n.removeAttribute('aria-posinset'); n.removeAttribute('id'); n.querySelectorAll('[data-list-item-id]').forEach(x => x.removeAttribute('data-list-item-id')); n.querySelectorAll('[aria-label]').forEach(x => x.setAttribute('aria-label', label)); n.querySelectorAll('[id]').forEach(x => x.removeAttribute('id')); };
  // Twilight's own presence: active (green) or idle (moon) while Claude is out of usage. Nothing is copied from the row we cloned.
  // What Twilight is working on (status.json, read from the main process at most once a minute while the rows are being painted; no timer).
  let proj = null, projAt = 0;
  const projText = () => proj ? 'Working on ' + proj : '';
  const projRefresh = () => { if (Date.now() - projAt < 60000) return; projAt = Date.now(); T.cmd({ type: 'project' }, 3000).then(r => { const p = r?.project || null; if (p !== proj) { proj = p; T.debug_paintAsst?.(); } }).catch(() => {}); };
  const asstText = () => { if (!T.limited()) return projText() || 'Active'; const u = T.ls.get('asstLimit', null)?.until; return 'Out of usage' + (u ? ' · back about ' + new Date(u).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''); };
  const paint = (n, sub) => {
    const idle = T.limited(), sig = idle ? 'idle' : 'on'; n.dataset.twState = sig;
    n.querySelectorAll('img').forEach(i => { i.src = T.pfp; i.removeAttribute('srcset'); i.style.borderRadius = '50%'; i.style.objectFit = 'cover'; }); // round like every other avatar
    n.querySelectorAll('svg rect[mask*="status"]').forEach(r => { r.setAttribute('fill', idle ? '#f0b232' : '#23a55a'); r.setAttribute('mask', idle ? 'url(#svg-mask-status-idle)' : 'url(#svg-mask-status-online)'); });
    const st = n.querySelector('[class*="subText"],[class*="subtext"]'); // the cloned row's game / activity line is replaced
    if (st) { const d = h('div', { className: 'body-xs/medium_RAOoio', textContent: sub || asstText() }); st.replaceChildren(d); }
  };
  const unselect = n => { for (const e of [n, ...n.querySelectorAll('*')]) for (const c of [...e.classList]) if (/selected/i.test(c)) e.classList.remove(c); };
  T.debug_paintAsst = () => { for (const n of document.querySelectorAll('[data-tw-dm]')) paint(n); for (const n of document.querySelectorAll('[data-tw-fr]')) paint(n, T.limited() ? asstText() : projText() || 'Your assistant'); };
  let keepObs;
  const injectLists = () => {
    if (T.isOff('Assistant') || !asst()) return; // no Assistant plugin (public build) = no Twilight rows
    projRefresh();
    const first = () => [...document.querySelectorAll('nav[class*="privateChannels"] a[data-list-item-id^="private-channels"][href^="/channels/@me/"]')].map(a => a.closest('li')).find(l => l && !l.dataset.twDm);
    const dm = first();
    let n = document.querySelector('[data-tw-dm]');
    if (dm && !n) {
      n = dm.cloneNode(true); n.dataset.twDm = '1'; blank(n, 'Twilight, pinned assistant'); unselect(n); paint(n);
      const a = n.querySelector('a'); if (a) { a.removeAttribute('href'); a.setAttribute('role', 'button'); }
      const box = n.querySelector('[class*="overflowTooltip"]') || n.querySelector('[class*="name_"]');
      if (box) box.replaceChildren(h('span', { textContent: 'Twilight' }), h('span', { textContent: 'PINNED', style: 'margin-left:6px;padding:1px 4px;border-radius:3px;background:#5865f2;color:#fff;font:800 9px sans-serif;letter-spacing:.06em;vertical-align:middle' }));
      n.querySelectorAll('[class*="iconsContainer"]').forEach(x => x.remove());
      n.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); asst()?.quick(); }, true);
      dm.before(n);
    }
    if (n && n.isConnected) {
      if (n.dataset.twState !== (T.limited() ? 'idle' : 'on')) paint(n);
      // Stays the first DM: put it back right away if Discord's list shuffles (one watcher on the list only, no timer).
      const ul = n.parentElement;
      if (ul && keepObs?.ul !== ul) {
        keepObs?.o.disconnect();
        const fix = () => { const f = first(); if (n.isConnected && f && n.nextElementSibling !== f && n.parentElement === ul) f.before(n); };
        const o = new MutationObserver(fix); o.observe(ul, { childList: true }); keepObs = { o, ul };
      }
      const f = first(); if (f && n.nextElementSibling !== f) f.before(n);
    }
    const row = document.querySelector('[class*="peopleList"] [class*="peopleListItem"]');
    if (row && !document.querySelector('[data-tw-fr]')) {
      const f = row.cloneNode(true); f.dataset.twFr = '1'; blank(f, 'Twilight'); unselect(f); f.style.opacity = '1';
      f.querySelector('[class*="username"]')?.replaceChildren('Twilight'); f.querySelectorAll('[class*="chipletContainer"]').forEach(x => x.remove());
      const d = f.querySelector('[class*="discriminator"]'); if (d) d.textContent = 'twilight';
      f.querySelectorAll('[class*="actions"],[class*="actionButtons"]').forEach(x => x.remove());
      paint(f, T.limited() ? asstText() : projText() || 'Your assistant');
      f.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); asst()?.quick(); }, true);
      row.before(f);
    } else { const f = document.querySelector('[data-tw-fr]'); if (f && f.dataset.twState !== (T.limited() ? 'idle' : 'on')) paint(f, T.limited() ? asstText() : projText() || 'Your assistant'); }
  };
  const injectButton = () => {};

  T.debug = {
    applyMenuStyle,
    keyName: spec => keyName(spec),
    paintAsst: () => T.debug_paintAsst(),
    key: 'ctrl+t',
    version: '?',
    toggle,
    refresh: () => popup.isOpen() && POP.view === 'Menu' && render(),
    page: () => (searchMode ? 'Search' : pin || nav.tab),
    // Open the menu on a page: a header tab ('Quests', 'Friends') or a sidebar group and page ('Discord', 'Servers').
    go(where, sub) { setSearch(false); if (PINS[where]) { popup.open('Menu'); pin = where; } else { goto(where, sub); popup.open('Menu'); } popup.show('Menu'); }, // which menu page is showing (a plugin can skip redraws while it is not on screen)
    init(opts = {}) {
      // Default menu key: Ctrl+T for new installs; installs from before 1.16.0 keep the Ctrl+F they had. Decided once and remembered.
      let def = T.ls.get('menuKeyDefault'); if (!def) { def = T.ls.fresh() ? 'ctrl+t' : 'ctrl+f'; T.ls.set('menuKeyDefault', def); }
      T.debug.cfgKey = opts.debugKey || def; T.debug.key = T.ls.get('menuKey') || T.debug.cfgKey; // set in the menu (Tools > Menu key), else config.json debugKey, else the default
      T.debug.version = opts.version || '?';
      T.debug.kb = opts.kb; T.debug.safe = !!opts.safe; T.debug.sizes = opts.sizes || {}; T.debug.hasKey = !!opts.hasKey;
      document.documentElement.append(h('style', { textContent: CSS + POPCSS }));
      applyMenuStyle(); applyPanelButtons();
      applyCss(store.get());
      applyFx();
      window.addEventListener('keydown', e => {
        if (captureKey(e)) return;
        if (matches(e, T.debug.key)) { e.preventDefault(); e.stopPropagation(); toggle(); }
        else if (e.key === 'Escape' && popup.isOpen() && POP.view === 'Menu') { if (query) { query = ''; if (searchIn) searchIn.value = ''; render(); e.preventDefault(); } else toggle(false); }
        // Discord's own Ctrl+R can be switched off in some builds: reload the page (and Twilight) ourselves.
        else if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyR') { e.preventDefault(); e.stopPropagation(); location.reload(); }
      }, true);
      // Twilight's rows (settings sidebar, DM list, friends list) are put back after Discord redraws: through core's one shared page watcher.
      T._domWatch(() => { injectSettings(); injectLists(); }, 500);
      injectButton();
    },
  };
})();
