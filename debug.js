// Debug menu: toggle with the configured key (default Ctrl+F) or the "Debug" button next to Add Friend.
(() => {
  const T = window.Twilight;
  if (!T) return;
  const h = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
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
.twd-diff{position:fixed;top:60px;left:50%;transform:translateX(-50%);width:min(560px,92vw);max-height:76vh;overflow:auto;z-index:2147483646;padding:14px 16px 12px;border-radius:12px;
background:linear-gradient(145deg,rgb(14 26 44/.86),rgb(3 6 12/.82));backdrop-filter:blur(var(--tw-blur,22px)) saturate(1.6);border:1px solid rgba(108,200,255,.28);
box-shadow:0 22px 60px rgba(0,0,0,.6);color:#d2e6f5;font:13px "Segoe UI",sans-serif}
.twd-diff h3{margin:0 0 2px;font:italic 900 15px "Arial Black",Impact,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#dff4ff}
.twd-diff .sub{margin-bottom:10px;color:#7f9bb5;font:600 11px "Segoe UI",sans-serif;letter-spacing:.06em}
.twd-diff .r{display:grid;grid-template-columns:130px 1fr 1fr;gap:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.07);align-items:start}
.twd-diff .r.h{border-top:0;font:700 10px "Segoe UI",sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#7f9bb5;padding-top:0}
.twd-diff .n{font-weight:700;color:#b9ecff;display:flex;align-items:center;gap:7px}.twd-diff .n i{width:8px;height:8px;border-radius:50%;flex:none}
.twd-diff .s{color:#8aa6bf}.twd-diff .t{color:#d2e6f5}.twd-diff .r.off{opacity:.45}
.twd-diff .live{margin:4px 0 10px;padding:8px 10px;border-radius:8px;background:rgba(108,200,255,.07);border:1px solid rgba(108,200,255,.18)}
.twd-diff .live .r{border-top:1px solid rgba(255,255,255,.05);grid-template-columns:120px 1fr 1fr}
.twd-diff .live .r:first-of-type{border-top:0}
.twd-diff .btn{display:inline-block;margin-top:6px;padding:5px 12px;border-radius:5px;cursor:pointer;background:rgba(108,200,255,.2);font:700 10px "Segoe UI",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#dff4ff}
.twd-diff .btn:hover{background:rgba(108,200,255,.35)}
.twd-diff .ft{margin-top:10px;color:#7f9bb5;font:600 11px "Segoe UI",sans-serif}
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
.twp-at{font:400 24px/1 "gg sans","Segoe UI",sans-serif;color:var(--tw-muted);margin-right:-2px}.twp-hd b{font-weight:600;color:var(--tw-head)}
.twp-tabs{display:flex;gap:2px;margin-left:10px;padding:2px;border-radius:6px;background:var(--tw-deep)}
.twp-t{padding:3px 12px;border-radius:4px;cursor:pointer;font:600 13px "gg sans","Segoe UI",sans-serif;color:var(--tw-muted)}.twp-t:hover{color:var(--tw-head)}.twp-t.on{background:var(--tw-brand);color:#fff}
.twp-b{cursor:pointer;color:var(--tw-muted);padding:4px 8px;border-radius:4px;font-size:16px;line-height:1}.twp-b:hover{background:var(--tw-hover);color:var(--tw-head)}
.twp-body{position:relative;flex:1;min-height:0}
html[data-tw-lite] #twp{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}`;

  let side, body, footer;
  const input = (placeholder, value = '') => h('input', { placeholder, value });
  const sec = t => h('div', { className: 'twd-sec', textContent: t });
  const info = (k, v) => h('div', { className: 'twd-row info' }, h('span', { textContent: k }), h('span', { textContent: String(v), style: 'color:#a9c4db' }));
  const action = (label, fn, led, sub) => h('div', { className: 'twd-row', onclick: fn },
    h('span', {}, label, ...(sub ? [h('small', { textContent: sub })] : [])), led ? h('i', { className: 'twd-led ' + led }) : h('span', { textContent: '›' }));
  const ledRow = (label, on, fn, sub, cls = '') => h('div', { className: 'twd-row ' + cls, onclick: fn },
    h('span', {}, label, ...(sub ? [h('small', { textContent: sub })] : [])),
    h('span', { className: 'twd-st ' + (on ? 'on' : 'off') }, on ? 'ON' : 'OFF', h('i', { className: 'twd-led ' + (on ? 'on' : 'off') })));

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
  const GROUP_OF = { MessageLogger: 'Messages', MessageMenu: 'Messages', Translate: 'Messages', Snippets: 'Messages', ClearURLs: 'Messages',
    FriendNotifier: 'Notifiers', VoiceLog: 'Notifiers', Assistant: 'Assistant', Generated: 'Assistant',
    GlassTheme: 'Appearance', ThemeMaker: 'Appearance', ImageZoom: 'Appearance', ViewIcons: 'Appearance',
    ClearNotifications: 'Servers', QuickServerMute: 'Servers',
    NoTrack: 'Privacy', SilentTyping: 'Privacy', Petpet: 'Media', QuestCompleter: 'Housekeeping', ClonerTest: 'Housekeeping', Probe: 'Housekeeping', Hello: 'Housekeeping' };
  const groupOf = p => p.group || GROUP_OF[p.name] || 'Housekeeping';
  const byGroup = list => GROUPS.map(g => [g, list.filter(x => groupOf(x.p || x) === g)]).filter(([, l]) => l.length);

  const views = {
    Notify() {
      const n = (title, sub, type, ms = 4000) => () => T.notify(title, sub, ms, type);
      const title = input('Title', 'Custom title'), sub = input('Subtitle', 'Custom subtitle'), ms = input('Duration ms', '4000');
      const type = h('select', {}, ...['info', 'success', 'warn', 'error'].map(t => h('option', { value: t, textContent: t })));
      return [
        sec('Test notifications'),
        action('Info', n('Info', 'This is an info notification', 'info'), 'info'),
        action('Success', n('Success', 'Something worked', 'success'), 'success'),
        action('Warning', n('Warning', 'Something looks off', 'warn'), 'warn'),
        action('Error', n('Error', 'Something broke', 'error'), 'error'),
        action('Long text', n('A much longer title here', 'This subtitle is long enough to wrap onto a second line to test the layout', 'info', 6000)),
        action('Spam x5', () => ['info', 'success', 'warn', 'error', 'info'].forEach((t, i) =>
          setTimeout(() => T.notify('Test ' + (i + 1), 'Stacked notification', 3000 + i * 300, t), i * 250))),
        sec('Settings'),
        (() => { const g = () => T.ls.get('notif', {}), s = (k, v) => { T.ls.set('notif', { ...g(), [k]: v }); T.debug.refresh(); };
          return h('div', {},
            ledRow('Do not disturb', !!g().dnd, () => s('dnd', !g().dnd), 'Only errors get through'),
            ...['info', 'success', 'warn', 'error'].map(t => ledRow('Mute ' + t, !!g().mute?.[t], () => s('mute', { ...g().mute, [t]: !g().mute?.[t] }))),
            action('Position: ' + ({ tr: 'top right', tl: 'top left', br: 'bottom right', bl: 'bottom left' })[g().pos || 'tr'], () => s('pos', ({ tr: 'br', br: 'bl', bl: 'tl', tl: 'tr' })[g().pos || 'tr']), null, 'Click to cycle'),
            slider('Size', .7, 1.4, .05, g().size || 1, v => v.toFixed(2) + 'x', v => T.ls.set('notif', { ...g(), size: v })),
            slider('Stay time', .4, 3, .1, g().dur || 1, v => v.toFixed(1) + 'x', v => T.ls.set('notif', { ...g(), dur: v })));
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
        sec('Custom'), title, sub, h('div', { className: 'twd-2' }, ms, type),
        action('Send custom', () => T.notify(title.value, sub.value, +ms.value || 4000, type.value)),
      ];
    },
    Plugins() {
      if (!T.plugins.size) return [h('div', { className: 'twd-out', textContent: 'No plugins loaded.' })];
      const nodes = [];
      for (const [g, list] of byGroup([...T.plugins.values()].filter(p => !p.actionOnly && !p.hidden))) { // action-only plugins live in the Tools page
        nodes.push(sec(g));
        for (const p of list) nodes.push(ledRow(p.name, !T.isOff(p.name), () => flipPlugin(p), p.desc), ...optionRows(p));
      }
      return nodes;
    },
    Tools() {
      const acts = [...T.plugins.values()].filter(p => p.actionOnly || !T.isOff(p.name)).flatMap(p => (p.actions || []).map(a => [p, a]));
      return [
        sec('Discord'),
        action('What is different from normal Discord', () => showDiff(), null, 'A small overlay: stock Discord vs Twilight Cord'),
        action('Reload Discord', () => location.reload(), null, 'Restarts the page, reloads Twilight-Cord'),
        action('Run diagnostics', () => runDiag(), null, 'Copies a report you can paste anywhere'),
        action('Copy console log', () => copy(T.logs.map(l => `${new Date(l.t).toLocaleTimeString([], { hour12: false })} [${l.level}] ${l.text}`).join('\n'), 'Console log'), null, 'Everything in the Console tab'),
        action('Clear console log', () => { T.logs.length = 0; T.notify('Console', 'Cleared', 1500, 'info'); }),
        sec('Menu'),
        action('Reset menu position and size', resetMenu),
        action('Reset window corner', () => { T.ls.set('fx', {}); applyFx(); T.notify('Effects', 'Back to default', 1800, 'info'); }),
        action('Reset Quick CSS', () => { store.set(''); applyCss(''); T.notify('Quick CSS', 'Cleared', 1800, 'info'); }),
        sec('Performance'),
        action(T.lite() ? 'Ultra lightweight mode: ON (click to turn off)' : 'Ultra lightweight mode: off (click to turn on)', () => { T.setLite(!T.lite()); T.notify('Lightweight mode', T.lite() ? 'On: heavy plugins paused, blur off' : 'Off', 2500, 'info'); }, null, 'Pauses heavy plugins, removes blur, stops the shader'),
        action('Hide pop-out windows from screen share', async () => { const st = await T.cmd({ type: 'status' }); const on = !(st?.hidePopouts !== false); await T.cmd({ type: 'popouts', on }); T.notify('Pop-outs', on ? 'Hidden from capture' : 'Visible in capture', 2500, 'info'); }, null, 'Toggle: pop-out windows are invisible in screen share and recordings'),
        sec('Safe mode and cost'),
        ...(T.debug.safe ? [action('Leave safe mode', () => T.cmd({ type: 'safe', on: false }), null, 'Restarts Discord with all plugins back on')]
          : [action('Restart in safe mode', () => T.cmd({ type: 'safe', on: true }), null, 'Restarts Discord with no plugins or themes, in case something breaks')]),
        action('Show plugin cost', () => { goto('Global', 'Cost'); render(); }, null, 'Which plugin uses how much time'),
        ...byGroup(acts.map(([p, a]) => ({ p, a }))).flatMap(([g, list]) => [sec(g), ...list.map(({ p, a }) =>
          action(a.label, () => { try { a.run(); } catch (e) { T.notify(p.name + ' failed', String(e.message || e).slice(0, 70), 5000, 'error'); } }, null, a.sub || p.name))]),
        ...(acts.length ? [] : [h('div', { className: 'twd-out', textContent: 'No plugin actions available.' })]),
      ];
    },
    Console() {
      const FILT = { Twilight: l => l.tw, Errors: l => l.level === 'error' || l.level === 'warn', All: () => true };
      let filt = T.ls.get('confilt', 'Twilight');
      if (!FILT[filt]) filt = 'Twilight';
      const box = h('div', { className: 'twd-con' });
      const draw = () => {
        const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
        box.replaceChildren(...T.logs.filter(FILT[filt]).slice(-120).map(l =>
          h('div', { className: 'twd-ln ' + l.level, textContent: new Date(l.t).toLocaleTimeString([], { hour12: false }) + '  ' + l.text })));
        if (stick) box.scrollTop = box.scrollHeight;
      };
      let raf;
      T.onLog = () => { raf ||= requestAnimationFrame(() => { raf = 0; draw(); }); };
      const chips = h('div', { className: 'twd-chips' });
      const drawChips = () => chips.replaceChildren(
        ...Object.keys(FILT).map(k => h('div', { className: 'twd-chip' + (k === filt ? ' on' : ''), textContent: k, onclick: () => { filt = k; T.ls.set('confilt', k); drawChips(); draw(); } })),
        h('div', { className: 'twd-chip', textContent: 'Clear', onclick: () => { T.logs.length = 0; draw(); } }));
      const hist = []; let hi = 0;
      const cmd = h('input', { placeholder: 'Run JavaScript and press Enter, e.g. Twilight.info()', spellcheck: false });
      cmd.onkeydown = e => {
        e.stopPropagation();
        if (e.key === 'Enter' && cmd.value.trim()) { const c = cmd.value; hist.push(c); hi = hist.length; cmd.value = ''; T.evalJS(c); }
        else if (e.key === 'ArrowUp' && hist.length) { hi = Math.max(0, hi - 1); cmd.value = hist[hi]; e.preventDefault(); }
        else if (e.key === 'ArrowDown' && hist.length) { hi = Math.min(hist.length, hi + 1); cmd.value = hist[hi] ?? ''; e.preventDefault(); }
      };
      drawChips();
      setTimeout(draw);
      return [chips, box, cmd];
    },
    CSS() {
      const ta = h('textarea', { value: store.get(), placeholder: '/* Quick CSS: applies live and is remembered */', spellcheck: false });
      ta.oninput = () => { store.set(ta.value); applyCss(ta.value); };
      const f = fx(), themes = T.ls.get('cssThemes', {}), themeName = input('Name this theme', '');
      return [
        sec('Window'),
        slider('Corner radius', 0, 28, 1, f.rad, v => v + 'px', v => setFx('rad', v)),
        action('Reset', () => { T.ls.set('fx', {}); applyFx(); render(); }),
        sec('Quick CSS'), ta, action('Clear', () => { ta.value = ''; ta.oninput(); }),
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
    Cost() {
      const c = T.cost, secs = Math.max(1, (Date.now() - c.at) / 1000), sizes = T.debug.sizes || {};
      const rows = Object.entries(c.by).map(([name, v]) => ({ name, ...v, kb: (sizes[name] || 0) / 1024 })).sort((x, y) => y.ms - x.ms);
      const heap = performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB used by the whole page` : 'not available';
      const nodes = [
        sec('Time each plugin has used since Discord loaded'),
        h('div', { className: 'twd-out', textContent: 'Memory per plugin cannot be measured from inside the page, so code size is shown instead. Red = a single call over 30 ms or more than 5 ms of work per second.' }),
        info('Page JS memory', heap), info('Stalls (>120 ms) in the last 30 s', c.stalls.length), info('Frame time (median, last sample)', c.frameMs ? c.frameMs + ' ms' : 'not sampled yet'), info('Start-up total', c.start.toFixed(0) + ' ms'),
        info('Safe mode', T.debug.safe ? 'ON (no plugins loaded)' : 'off'),
      ];
      if (!rows.length) nodes.push(h('div', { className: 'twd-out', textContent: 'No plugin has run yet.' }));
      for (const r of rows) {
        const bad = r.max > 30 || r.ms / secs > 5;
        nodes.push(h('div', { className: 'twd-row info', style: bad ? 'color:#ff8a94' : '' }, h('span', { textContent: r.name }),
          h('span', { style: 'color:' + (bad ? '#ff8a94' : '#a9c4db'), textContent: `${r.ms.toFixed(1)} ms · ${r.n} calls · worst ${r.max.toFixed(0)} ms · ${(r.ms / secs).toFixed(2)} ms/s · ${r.kb.toFixed(0)} KB code` })));
      }
      return nodes;
    },
    Info() {
      const i = T.info(), out = h('div', { className: 'twd-out' }), q = input('Find by props, e.g. startTyping,stopTyping');
      return [
        sec('Status'),
        info('Webpack hooked', i.ready ? 'yes' : 'no'), info('Chunk global', i.chunk), info('Modules loaded', i.modules),
        info('Source patches', i.patches), info('Plugins', T.plugins.size), info('Debug key', T.debug.key),
        info('Settings storage', T.ls.persistent() ? 'saved' : 'memory only'),
        info('Auto-save file', (f => f.ok == null ? 'waiting' : f.ok ? 'saved ' + new Date(f.at).toLocaleTimeString([], { hour12: false }) : 'NOT saving')(T.ls.file())),
        sec('Module finder'), q, action('Find module', () => {
          const m = T.findByProps(...q.value.split(',').map(s => s.trim()).filter(Boolean));
          out.textContent = m ? 'found: ' + Object.keys(m).slice(0, 12).join(', ') : 'not found';
        }), out,
        sec('Diagnostics'), action('Run diagnostics (copies a report)', () => runDiag(out)),
      ];
    },
  };

  // ---- Menu layout: three tabs ----
  // Local = things that act on what you are looking at, in submenus (Self, Look, Privacy, Channel, Discord). Global = Twilight itself (settings, plugins, tools, developer pages). Quests = the quest completer.
  const PLACE = { Tags: 'Self', 'Tag commands': 'Self', Snippets: 'Self', TypingSpeed: 'Self', 'Window buttons': 'Self',
    GlassTheme: 'Look', ThemeMaker: 'Look', ImageZoom: 'Look', ViewIcons: 'Look',
    NoTrack: 'Privacy', SilentTyping: 'Privacy',
    MessageLogger: 'Channel', Translate: 'Channel', ClearURLs: 'Channel', StaffTags: 'Channel', RoleDividers: 'Channel', PlatformIndicators: 'Channel', MessageMenu: 'Channel', Petpet: 'Channel',
    FriendNotifier: 'Discord', VoiceLog: 'Discord', QuickServerMute: 'Discord', ClearNotifications: 'Discord', EmojiStealer: 'Discord', Assistant: 'Discord', Generated: 'Discord' };
  const SUBS = { Local: ['Self', 'Look', 'Privacy', 'Channel', 'Discord'], Global: ['General', 'Plugins', 'Notify', 'CSS', 'Console', 'Cost', 'Info'] };
  const NAME = { General: 'Tools' }; // Global > General is the old Tools page
  const nav = Object.assign({ tab: 'Local', Local: 'Self', Global: 'General' }, T.ls.get('menuNav', {}));
  const goto = (t, s) => { nav.tab = t; if (s) nav[t] = s; T.ls.set('menuNav', nav); };
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
    return o.min != null ? slider(o.label, o.min, o.max, o.step || 1, on, v => String(v), v => T.setOpt(p.name, o.key, v))
      : ledRow(o.label, on, () => { T.setOpt(p.name, o.key, !on); render(); }, '', 'sub');
  });
  // One plugin: its on/off row, its options, and (while it is on) its own page.
  const pluginBlock = p => [ledRow(p.name, !T.isOff(p.name), () => flipPlugin(p), p.desc), ...optionRows(p), ...(!T.isOff(p.name) && p.tab ? p.tab.render() : [])];
  const topTabs = () => ['Local', 'Global', ...(T.plugins.has('QuestCompleter') ? ['Quests'] : [])];
  const localPage = s => {
    const list = [...T.plugins.values()].filter(p => placeOf(p) === s && !p.hidden);
    return list.length ? list.flatMap(pluginBlock) : [h('div', { className: 'twd-out', textContent: 'Nothing here.' })];
  };

  const render = () => {
    T.onLog = null; if (!body) return;
    const top = topTabs(); if (!top.includes(nav.tab)) nav.tab = 'Local';
    const keep = body.scrollTop, tab = nav.tab, subs = SUBS[tab];
    side.replaceChildren(...top.map(t => h('div', { className: 'twd-tab' + (t === tab ? ' on' : ''), textContent: t, onclick: () => { goto(t); body.scrollTop = 0; render(); } })));
    try {
      let nodes;
      if (subs) {
        const cur = subs.includes(nav[tab]) ? nav[tab] : subs[0];
        const chips = h('div', { className: 'twd-chips' }, ...subs.map(k => h('div', { className: 'twd-chip' + (k === cur ? ' on' : ''), textContent: k, onclick: () => { goto(tab, k); body.scrollTop = 0; render(); } })));
        nodes = [chips, ...(tab === 'Local' ? localPage(cur) : views[NAME[cur] || cur]())];
      } else nodes = pluginBlock(T.plugins.get('QuestCompleter'));
      body.replaceChildren(...nodes);
    } catch (e) { body.replaceChildren(h('div', { className: 'twd-out', textContent: 'Error: ' + (e.message || e) })); }
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
  const themeVars = () => { const out = {}; for (const el of [document.documentElement, document.body]) { const cs = getComputedStyle(el); for (const [k, [names]] of Object.entries(TH)) if (!out[k]) for (const n of names) { const v = cs.getPropertyValue(n).trim(); if (v) { out[k] = v; break; } } } for (const [k, [, fb]] of Object.entries(TH)) out[k] ||= fb; return out; };
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
      for (const [n, t] of Object.entries(POP.tabEls)) t.classList.toggle('on', n === view);
      popup.sync(); if (view === 'Menu') render(); else T.onLog = null; // nothing keeps drawing while the Menu is not shown
      try { POP.views[view].focus?.(); } catch {}
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
  // Keys typed in a frame never reach Discord (separate document); this also stops them bubbling further, and Ctrl+F / Esc still work inside the window.
  const isolate = doc => {
    const on = e => {
      if (e.type === 'pointerdown') return T.win.raise(POP.box, e.target);
      if (e.type === 'keydown') {
        if (matches(e, T.debug.key)) { e.preventDefault(); e.stopPropagation(); return menuToggle(); }
        if (e.key === 'Escape' && POP.view === 'Menu') { e.stopPropagation(); return menuToggle(false); }
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
.twd-side{background:var(--tw-side);padding:8px 0}
.twd-tab{margin:0 8px 2px;padding:6px 10px;border-left:0;border-radius:4px;font:600 14px "gg sans","Segoe UI",sans-serif;letter-spacing:0;text-transform:none;color:var(--tw-muted)}
.twd-tab:hover{background:var(--tw-hover);color:var(--tw-head)}
.twd-tab.on{background:color-mix(in srgb,var(--tw-text) 14%,transparent);color:var(--tw-head);border-left:0}
.twd-sec{margin:16px 0 6px;font:700 12px "gg sans","Segoe UI",sans-serif;letter-spacing:.02em;color:var(--tw-muted)}
.twd-row,.twd .twd-sl{background:var(--tw-side);border-left:0;border-radius:4px;font:500 14px "gg sans","Segoe UI",sans-serif;letter-spacing:0;text-transform:none;color:var(--tw-text)}
.twd-row:hover{background:color-mix(in srgb,var(--tw-text) 10%,var(--tw-side));border-left:0}
.twd-row.info:hover{background:var(--tw-side);border-left:0}
.twd-row small{font:400 12px "gg sans","Segoe UI",sans-serif;color:var(--tw-muted)}
.twd .twd-sl input{accent-color:var(--tw-brand)}.twd .twd-sl b{color:var(--tw-head)}
.twd-st{font:700 11px "gg sans","Segoe UI",sans-serif;letter-spacing:.04em}
.twd-st.on{color:#23a55a}.twd-st.off{color:#f23f43}
.twd-led{width:10px;height:10px;box-shadow:none!important}.twd-led.on,.twd-led.success{background:#23a55a}.twd-led.off,.twd-led.error{background:#f23f43}.twd-led.info{background:var(--tw-brand)}.twd-led.warn{background:#f0b232}
.twd input,.twd select,.twd textarea{background:var(--tw-input);color:var(--tw-text);border:0;border-radius:4px;padding:8px 10px;font:14px "gg sans","Segoe UI",sans-serif}
.twd textarea{font:13px Consolas,monospace}
.twd-out{color:var(--tw-muted)}
.twd-log{background:var(--tw-side);border-radius:4px}.twd-log b{color:var(--tw-muted)}
.twd-chip{background:var(--tw-side);border-radius:4px;color:var(--tw-text)}.twd-chip:hover{background:color-mix(in srgb,var(--tw-text) 10%,var(--tw-side))}.twd-chip.on{background:var(--tw-brand);color:#fff}
.twd-ft{background:var(--tw-side);border-top:1px solid var(--tw-line);color:var(--tw-muted)}.twd-ft b{color:var(--tw-muted)}
.twd-body::-webkit-scrollbar,.twd-side::-webkit-scrollbar{width:14px}.twd-body::-webkit-scrollbar-thumb,.twd-side::-webkit-scrollbar-thumb{background:var(--tw-thumb);border:4px solid transparent;background-clip:padding-box;border-radius:8px}.twd-body::-webkit-scrollbar-track,.twd-side::-webkit-scrollbar-track{background:transparent}`;
  const mountMenu = pane => {
    side = h('div', { className: 'twd-side' }); body = h('div', { className: 'twd-body' });
    footer = h('div', { className: 'twd-ft' }, h('span', { textContent: `${T.debug.key.replace(/\b\w/g, c => c.toUpperCase())} toggle · Esc back` }), h('b', { textContent: 'v' + (T.debug.version || '?') }));
    const root = POP.menuRoot = h('div', { id: 'twd', className: 'twd open' }, h('div', { className: 'twd-main' }, side, body), footer);
    root.style.setProperty('--twd-h', parseInt(POP.box.style.height) + 'px');
    (pane.inline ? pane.body : pane.doc.head).append(h('style', { textContent: CSS + MENU_FIX + MENU_THEME })); pane.body.append(root);
    const sync = () => { if (!pane.inline) try { pane.doc.documentElement.style.cssText = T.theme.text(); } catch {} }; sync();
    return { pane, sync, focus() { try { pane.f.contentWindow?.focus(); } catch {} }, destroy() { side = body = footer = null; POP.menuRoot = null; } };
  };
  const ensure = view => {
    if (POP.views[view]) return true;
    const pane = mkPane(); let v = null;
    try { v = view === 'Chat' ? T.plugins.get('Assistant')?.mountChat?.(pane) : mountMenu(pane); } catch (e) { T.log('Twilight window: ' + view + ' failed: ' + (e.message || e)); }
    if (!v) { pane.f.remove(); return false; }
    v.pane = pane; POP.views[view] = v; return true;
  };
  const buildPop = () => {
    const box = h('div', { id: 'twp' }), d = boxDefaults();
    box.style.cssText = `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px;${T.theme.text()}`;
    const btn = (t, title, fn) => h('span', { className: 'twp-b', textContent: t, title, onclick: fn });
    POP.tabEls = {}; const tabs = h('div', { className: 'twp-tabs' });
    for (const n of hasChat() ? ['Chat', 'Menu'] : ['Menu']) { POP.tabEls[n] = h('div', { className: 'twp-t', textContent: n, onclick: () => popup.show(n) }); tabs.append(POP.tabEls[n]); }
    POP.minBtn = btn('–', 'Minimise', () => popup.minimize());
    const hd = h('div', { className: 'twp-hd', onpointerdown: drag, ondblclick: e => { if (!e.target.closest('.twp-b,.twp-t')) popup.minimize(); } },
      h('span', { className: 'twp-at', textContent: '@' }), h('b', { textContent: 'Twilight' }), tabs, h('span', { style: 'flex:1' }),
      btn('≠', 'What is different from normal Discord', () => showDiff()), POP.minBtn, btn('✕', 'Close (the chat is forgotten)', () => popup.close()));
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
  // Ctrl+F (or Esc on the Menu): open the Menu; from the Menu go back to the chat (which keeps its memory), or close if there is no chat.
  const menuToggle = force => {
    const open = popup.isOpen() && POP.view === 'Menu' && !POP.box.dataset.min, want = force ?? !open;
    if (want) return popup.open('Menu');
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
      if (popup.isOpen() && POP.view === 'Menu' && nav.tab === 'Global' && nav.Global === 'CSS') render();
    },
  };

  const matches = (e, spec) => {
    const p = spec.toLowerCase().split('+'), k = p.pop();
    return e.key.toLowerCase() === k && e.ctrlKey === p.includes('ctrl') && e.shiftKey === p.includes('shift') && e.altKey === p.includes('alt');
  };

  // Overlay comparing stock Discord with this fork (built from the loaded plugins, so it is always current).
  let diffEl;
  const showDiff = () => {
    if (diffEl) { T.win.remove(diffEl); diffEl.remove(); diffEl = null; return; }
    const row = (name, stock, ours, on = true) => h('div', { className: 'r' + (on ? '' : ' off') },
      h('div', { className: 'n' }, h('i', { style: `background:${on ? '#3ddc84' : '#ff4d5e'}` }), name), h('div', { className: 's', textContent: stock }), h('div', { className: 't', textContent: ours }));
    const core = [
      ['Updates', 'Discord only', 'Pulls its own updates from GitHub on start'],
      ['Settings', 'None for the mod', 'Auto-saved to a file next to the mod'],
      ['Notifications', 'Plain pop-ups', 'GTA-style toast, top right'],
      ['Menu + console', 'None (DevTools only)', 'Ctrl+F menu with console, CSS, tools'],
    ];
    const plugins = [...T.plugins.values()].filter(p => p.vs);
    // Real usage: Discord Stable vs Discord PTB, measured by Windows (a short PowerShell run in the main process).
    // The channel running the mod is marked "+ Twilight"; the other column is the same app without it (if it is open).
    const live = h('div', { className: 'live' }), c = T.cost, secs = () => Math.max(1, (Date.now() - c.at) / 1000);
    const fmt = a => a ? [`${a.ramMB} MB · ${a.procs} processes`, `${a.cpuPct}% of the CPU`, `${a.gpuPct}% · ${a.gpuMB} MB`] : ['not running', 'not running', 'not running'];
    const drawLive = m => {
      const ptbSelf = !!m && m.self === 'DiscordPTB', mine = m && m.apps && m.apps[ptbSelf ? 'DiscordPTB' : 'Discord'], other = m && m.apps && m.apps[ptbSelf ? 'Discord' : 'DiscordPTB'];
      const own = (ms, n) => `${ms.toFixed(1)} ms total · ${n} calls · ${(ms / secs()).toFixed(2)} ms/s`;
      live.replaceChildren(
        h('div', { className: 'r h' }, h('div', { textContent: 'Live usage' }), h('div', { textContent: ptbSelf ? 'Discord (Stable), no mod' : 'Discord PTB, no mod' }), h('div', { textContent: ptbSelf ? 'This Discord (PTB + Twilight)' : 'This Discord (Stable + Twilight)' })),
        ...(m && m.apps ? ['RAM', 'CPU', 'GPU % · memory'].map((l, i) => row(l, fmt(other)[i], fmt(mine)[i])) : [h('div', { className: 'r' }, h('div', { className: 'n', textContent: 'Measuring...' }), h('div', { className: 's', textContent: m ? (m.error || 'no data') : 'takes about 3 seconds' }), h('div'))]),
        row('Twilight start-up', 'n/a', `${c.start.toFixed(0)} ms once per load`), row('Twilight events', 'n/a', own(c.flux.ms, c.flux.n)), row('Twilight network checks', 'n/a', own(c.net.ms, c.net.n)),
        row('Twilight code', 'n/a', `${T.debug.kb || '?'} KB loaded`),
        h('div', { className: 'btn', textContent: 'Measure again', onclick: () => measure() }));
    };
    const measure = async () => { drawLive(null); drawLive(await T.cmd({ type: 'metrics' }, 30000)); };
    drawLive(null); measure();
    diffEl = h('div', { className: 'twd-diff' },
      h('h3', { textContent: 'Normal Discord vs Twilight-Cord' }),
      h('div', { className: 'sub', textContent: `v${T.debug.version} · ${plugins.length} plugins · about ${T.debug.kb || '?'} KB of extra code · no tracking, only a GitHub update check` }),
      live,
      h('div', { className: 'r h' }, h('div', { textContent: 'Feature' }), h('div', { textContent: 'Normal Discord' }), h('div', { textContent: 'Twilight-Cord' })),
      ...core.map(c => row(c[0], c[1], c[2])),
      ...plugins.map(p => row(p.name, p.vs, p.desc, !T.isOff(p.name))),
      h('div', { className: 'ft', textContent: 'Stable and PTB are different builds (and if both run the mod, both columns include it), so part of any gap is not the mod: the "Twilight" rows show the mod\'s own cost. Green = on, red = off. Click outside or press Esc to close.' }));
    const close = e => { if (e.type === 'keydown' && e.key !== 'Escape') return; if (e.type === 'mousedown' && diffEl?.contains(e.target)) return; if (diffEl) T.win.remove(diffEl); diffEl?.remove(); diffEl = null; window.removeEventListener('keydown', close, true); document.removeEventListener('mousedown', close, true); };
    window.addEventListener('keydown', close, true);
    setTimeout(() => document.addEventListener('mousedown', close, true));
    document.documentElement.append(diffEl); T.win.add(diffEl);
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
    ul.append(mk('Twilight menu', () => toggle(true)), mk('What is different', showDiff));
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
    paintAsst: () => T.debug_paintAsst(),
    key: 'ctrl+f',
    version: '?',
    toggle,
    refresh: () => popup.isOpen() && POP.view === 'Menu' && render(),
    init(opts = {}) {
      T.debug.key = opts.debugKey || 'ctrl+f';
      T.debug.version = opts.version || '?';
      T.debug.kb = opts.kb; T.debug.safe = !!opts.safe; T.debug.sizes = opts.sizes || {}; T.debug.hasKey = !!opts.hasKey;
      document.documentElement.append(h('style', { textContent: CSS + POPCSS }));
      applyCss(store.get());
      applyFx();
      window.addEventListener('keydown', e => {
        if (matches(e, T.debug.key)) { e.preventDefault(); e.stopPropagation(); toggle(); }
        else if (e.key === 'Escape' && popup.isOpen() && POP.view === 'Menu') toggle(false);
        // Discord's own Ctrl+R can be switched off in some builds: reload the page (and Twilight) ourselves.
        else if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyR') { e.preventDefault(); e.stopPropagation(); location.reload(); }
      }, true);
      let timer;
      new MutationObserver(() => { timer ||= setTimeout(() => { timer = 0; injectSettings(); injectLists(); }, 500); })
        .observe(document.body, { childList: true, subtree: true });
      injectButton();
    },
  };
})();
