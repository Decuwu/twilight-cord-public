(() => {
  if (window.Twilight) return;

  // ---- console capture (shown in the debug menu's Console tab) ----
  const logs = [];
  const fmt = a => {
    try {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === 'function') return 'ƒ ' + (a.name || '');
      let n = 0; // stop walking huge objects: the log keeps 800 characters anyway
      return JSON.stringify(a, (k, v) => ++n > 3000 ? undefined : typeof v === 'bigint' ? v + 'n' : v) ?? String(a);
    } catch { return String(a); }
  };
  const addLog = (level, args, eager) => {
    // Discord is noisy: objects are only fully formatted for our own, warn and error messages.
    const tw = !!eager || (typeof args[0] === 'string' && args[0].startsWith('[twilight]'));
    const full = tw || level === 'warn' || level === 'error';
    if (typeof args[0] === 'string' && /does not have a value in the requested locale/.test(args[0])) return; // Discord's own translation-lookup noise
    const text = args.map(a => full || a === null || typeof a !== 'object' ? fmt(a) : '[object]').join(' ').slice(0, 800);
    logs.push({ t: Date.now(), level, text, tw });
    if (logs.length > 400) logs.shift();
    window.Twilight?.onLog?.();
  };
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    const orig = console[level];
    console[level] = function (...a) { try { addLog(level, a); } catch {} return orig.apply(this, a); };
  }
  window.addEventListener('error', e => addLog('error', [`${e.message} (${String(e.filename || '').split('/').pop()}:${e.lineno})`]));
  window.addEventListener('unhandledrejection', e => addLog('error', ['Unhandled rejection:', e.reason]));
  // Runs code typed into the Console tab (expression first, then as statements).
  const evalJS = async code => {
    addLog('input', ['> ' + code], true);
    try {
      let fn;
      try { fn = (0, eval)(`(async()=>(${code}\n))`); } catch { fn = (0, eval)(`(async()=>{${code}\n})`); }
      addLog('result', [await fn()], true);
    } catch (e) { addLog('error', [e], true); }
  };
  const CHUNK = 'webpackChunkdiscord_app'; // change if Discord renames it
  const patches = [], plugins = new Map();
  let wreq;

  // Rewrite a module's source before it runs.
  const patch = (id, f) => {
    const src = Function.prototype.toString.call(f);
    let out = src;
    for (const p of patches) {
      if (!out.includes(p.find)) continue;
      for (const [match, rep] of p.replacements)
        out = out.replace(match, typeof rep === 'string'
          ? rep.replace(/\$self/g, `Twilight.plugins.get(${JSON.stringify(p.plugin)})`) : rep);
    }
    if (out === src) return f;
    try { return (0, eval)(`(${out})\n//# sourceURL=twilight/${id}.js`); }
    catch (e) { console.error('[twilight] patch failed for module', id, e); return f; }
  };

  // Intercept webpack's chunk array so we see every module factory and the webpack require.
  const hook = arr => {
    const native = arr.push;
    let cb = native, depth = 0;
    Object.defineProperty(arr, 'push', {
      configurable: true,
      get: () => function (...a) {
        if (depth) return native.apply(arr, a); // webpack's own re-entrant call
        depth++;
        try {
          for (const c of a) {
            if (patches.length) for (const id in c[1] || {}) c[1][id] = patch(id, c[1][id]);
            if (typeof c[2] === 'function' && !wreq) {
              const rt = c[2];
              c[2] = function (r) { wreq ||= r; return rt.apply(this, arguments); };
            }
          }
          return cb.apply(arr, a);
        } finally { depth--; }
      },
      set: v => { cb = v; },
    });
  };

  let chunk = window[CHUNK];
  if (chunk) hook(chunk);
  else Object.defineProperty(window, CHUNK, { configurable: true, get: () => chunk, set: v => hook(chunk = v) });

  // If we missed webpack's start-up, ask for its require function directly (this works at any time).
  const grab = () => {
    if (wreq) return;
    try { window[CHUNK]?.push([[Symbol()], {}, r => { wreq ||= r; }]); } catch {}
  };

  const find = f => {
    grab();
    if (!wreq) return;
    for (const id in wreq.c) {
      const e = wreq.c[id]?.exports;
      if (!e) continue;
      let vals = [];
      try { vals = Object.values(e); } catch {}
      for (const x of [e, ...vals]) { try { if (x && f(x)) return x; } catch {} }
    }
  };

  // Every module that matches (up to `limit`): used by the "find upload functions" tool.
  const findAll = (f, limit = 12) => {
    grab(); const out = [];
    if (!wreq) return out;
    for (const id in wreq.c) {
      const e = wreq.c[id]?.exports; if (!e) continue;
      let vals = []; try { vals = Object.values(e); } catch {}
      for (const x of [e, ...vals]) { try { if (x && f(x)) { out.push({ id, x }); break; } } catch {} }
      if (out.length >= limit) break;
    }
    return out;
  };

  // ---- GTA-style notifications (top right) ----
  const STYLE = `#twc{position:fixed;top:18px;right:18px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none}
.twc-t{position:relative;min-width:270px;max-width:340px;box-sizing:border-box;padding:11px 18px 14px 16px;overflow:hidden;
background:linear-gradient(90deg,rgba(12,24,40,.74),rgba(3,6,12,.62));backdrop-filter:blur(calc(var(--tw-blur,22px)*.64)) saturate(var(--tw-sat,1.6));border-left:4px solid #6cc8ff;
box-shadow:0 6px 24px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.05);
transform:translateX(130%);opacity:0;transition:transform .45s cubic-bezier(.2,.9,.25,1),opacity .3s}
.twc-t.in{transform:none;opacity:1}
.twc-h{font:italic 900 15px "Arial Black",Impact,sans-serif;letter-spacing:.14em;text-transform:uppercase;
background:linear-gradient(90deg,#fff,#dff4ff 60%,#eaf9ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.twc-s{margin-top:3px;font:600 11px "Segoe UI",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a9c4db}
.twc-p{position:absolute;left:0;bottom:0;height:2px;width:100%;transform-origin:left;
background:linear-gradient(90deg,#b9ecff,#1e5aa8);animation:twc-p linear forwards}
@keyframes twc-p{to{transform:scaleX(0)}}
html[data-tw-lite][data-tw-main] *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.twc-t[data-t=success]{border-left-color:#4ade80}.twc-t[data-t=success] .twc-p{background:#4ade80}
.twc-t[data-t=warn]{border-left-color:#fbbf24}.twc-t[data-t=warn] .twc-p{background:#fbbf24}
.twc-t[data-t=error]{border-left-color:#f87171}.twc-t[data-t=error] .twc-p{background:#f87171}`;

  // Our CSS is limited to the main window (Discord copies page styles into pop-out windows, which must stay as they are).
  const scoped = css => /\S/.test(css) ? `@scope (html[data-tw-main]) {\n${String(css).replace(/:root/g, ':scope')}\n}` : css;
  const el = (cls, text) => Object.assign(document.createElement('div'), { className: cls, textContent: text ?? '' });

  // type: info (default) | success | warn | error
  // Notification settings (menu > Notify): position, size, length, mute per type, do-not-disturb.
  const nset = () => ls.get('notif', {});
  const notify = (title, sub, ms = 4500, type = 'info') => {
    const ns = nset();
    if (ns.dnd && type !== 'error') return;
    if (ns.mute?.[type]) return;
    if (ns.dur) ms = Math.round(ms * ns.dur);
    if (!document.getElementById('twc-style'))
      document.documentElement.append(Object.assign(document.createElement('style'), { id: 'twc-style', textContent: STYLE }));
    let root = document.getElementById('twc');
    if (!root) document.documentElement.append(root = Object.assign(document.createElement('div'), { id: 'twc' }));
    const pos = ns.pos || 'tr', st = root.style;
    st.top = pos[0] === 't' ? '18px' : 'auto'; st.bottom = pos[0] === 'b' ? '18px' : 'auto';
    st.right = pos[1] === 'r' ? '18px' : 'auto'; st.left = pos[1] === 'l' ? '18px' : 'auto';
    st.alignItems = pos[1] === 'r' ? 'flex-end' : 'flex-start'; st.flexDirection = pos[0] === 'b' ? 'column-reverse' : 'column';
    st.zoom = ns.size || 1;
    const t = el('twc-t'), bar = el('twc-p');
    t.dataset.t = type;
    bar.style.animationDuration = ms + 'ms';
    t.append(el('twc-h', title), el('twc-s', sub), bar);
    root.append(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 600); }, ms);
  };

  // ---- small shared helpers ----
  // Settings storage. Discord removes window.localStorage after startup, so grab it now (we run before Discord does),
  // fall back to an iframe's copy, and always keep a memory copy so switches work even if nothing can be saved.
  let storage = null, triedIframe = false;
  try { storage = window.localStorage; } catch {}
  const mem = new Map();
  // Auto-save: every setting is also written to settings.json next to Twilight-Cord (through the main process), and read back on start.
  const seed = window.__twSeed || {}; try { delete window.__twSeed; } catch {}
  for (const k of Object.keys(seed)) mem.set(k, seed[k]);
  let saveT, savedAt = 0, saveOk = null;
  const saveSoon = () => {
    clearTimeout(saveT);
    saveT = setTimeout(async () => {
      const r = await window.Twilight?.cmd?.({ type: 'save', data: Object.fromEntries(mem) });
      saveOk = !!r?.ok; if (saveOk) savedAt = Date.now();
      window.Twilight?.debug?.refresh?.();
    }, 700);
  };
  const getStorage = () => {
    if (!storage && !triedIframe && document.body) {
      triedIframe = true;
      try { const f = document.createElement('iframe'); f.style.display = 'none'; document.body.append(f); storage = f.contentWindow.localStorage; } catch {}
    }
    return storage;
  };
  const ls = {
    get: (k, d) => {
      if (mem.has(k)) return mem.get(k);
      try { const v = getStorage()?.getItem('twilight-' + k); return v == null ? d : JSON.parse(v); } catch { return d; }
    },
    set: (k, v) => { mem.set(k, v); try { getStorage()?.setItem('twilight-' + k, JSON.stringify(v)); } catch {} saveSoon(); },
    persistent: () => !!getStorage(),
    file: () => ({ ok: saveOk, at: savedAt }),
  };
  // First run after the update: bring settings that only exist in Discord's storage into the file too.
  try {
    const st = getStorage(); let moved = 0;
    for (let i = 0; st && i < st.length; i++) {
      const k = st.key(i);
      if (k?.startsWith('twilight-') && !mem.has(k.slice(9))) { try { mem.set(k.slice(9), JSON.parse(st.getItem(k))); moved++; } catch {} }
    }
    if (moved || !Object.keys(seed).length) setTimeout(saveSoon, 3000);
  } catch {}
  // Plugins marked `devOnly` (test and developer tools) start switched off; turning one on in the menu is remembered in 'on'.
  const isOff = n => ls.get('off', []).includes(n) || (!!plugins.get(n)?.devOnly && !ls.get('on', []).includes(n));
  const setOff = (n, off) => {
    ls.set('off', ls.get('off', []).filter(x => x !== n).concat(off ? [n] : []));
    ls.set('on', ls.get('on', []).filter(x => x !== n).concat(!off && plugins.get(n)?.devOnly ? [n] : []));
  };

  // Flux stores expose getName(); cached after the first hit. A miss walks every webpack module (thousands), so misses are
  // remembered for 10 s: a store Discord renamed would otherwise cost a full walk on every call from every timer.
  const stores = new Map(), storeMiss = new Map();
  const findStore = n => {
    if (stores.has(n)) return stores.get(n);
    if (Date.now() - (storeMiss.get(n) || 0) < 10000) return;
    const s = find(m => (typeof m === 'object' || typeof m === 'function') && 'getName' in m && m.getName?.() === n);
    if (s) { stores.set(n, s); storeMiss.delete(n); } else storeMiss.set(n, Date.now());
    return s;
  };

  // One shared fetch/XHR wrapper. A hook receives {url, method, body}; it may edit req.body or return 'block'.
  const netHooks = new Set(), netW = new Map();
  let netOn = false;
  const cost = { start: 0, flux: { ms: 0, n: 0 }, net: { ms: 0, n: 0 }, at: Date.now(), by: {}, stalls: [] };
  // ---- cost meter: every plugin's CPU time is counted by name (events, timers, observers, network checks) ----
  let cur = null; // the plugin whose code is running right now
  const slot = n => cost.by[n] ||= { ms: 0, n: 0, max: 0, start: 0 };
  const lagAt = {}, LAG_MS = 30; // one plugin call longer than this is worth a warning
  const lag = (name, ms) => {
    // Recorded in the Cost tab only (no pop-ups): the worst single call per plugin is shown there.
    lagAt[name] = Date.now();
  };
  const timed = (name, f) => function (...a) {
    const prev = cur, t0 = performance.now(); cur = name;
    try { return f.apply(this, a); }
    finally {
      const dt = performance.now() - t0; cur = prev;
      const s = slot(name); s.ms += dt; s.n++; if (dt > s.max) s.max = dt;
      if (dt > LAG_MS) lag(name, dt);
    }
  };
  // Code a plugin schedules while it is running keeps the plugin's name (timers, observers).
  const _si = window.setInterval, _st = window.setTimeout, _MO = window.MutationObserver;
  window.setInterval = function (f, ...r) { return _si.call(this, cur && typeof f === 'function' ? timed(cur, f) : f, ...r); };
  window.setTimeout = function (f, ...r) { return _st.call(this, cur && typeof f === 'function' ? timed(cur, f) : f, ...r); };
  window.MutationObserver = class extends _MO { constructor(cb) { super(cur && typeof cb === 'function' ? timed(cur, cb) : cb); } };
  // Stalls (long tasks) of the whole page: if Discord stutters a lot, suggest lightweight mode once in a while (never switched on by itself).
  try {
    let hits = [], warned = 0;
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) if (e.duration > 120) hits.push(Date.now());
      hits = hits.filter(t => Date.now() - t < 30000); cost.stalls = hits;
      if (hits.length >= 8 && Date.now() - warned > 600000 && !window.Twilight?.lite?.()) {
        warned = Date.now(); window.Twilight?.suggestLite?.(`${hits.length} long stalls in 30 s`);
      }
    }).observe({ type: 'longtask' });
  } catch {}
  const runHooks = req => {
    const t0 = performance.now();
    try { for (const h of netHooks) { try { if (h(req) === 'block') return 'block'; } catch {} } }
    finally { cost.net.ms += performance.now() - t0; cost.net.n++; }
  };
  const initNet = () => {
    if (netOn) return; netOn = true;
    const f = window.fetch, open = XMLHttpRequest.prototype.open, send = XMLHttpRequest.prototype.send;
    window.fetch = function (u, init, ...r) {
      const req = { url: String(typeof u === 'string' ? u : u?.url || ''), method: init?.method || u?.method || 'GET', body: init?.body };
      if (runHooks(req) === 'block') return Promise.resolve(new Response(null, { status: 204 }));
      if (init && req.body !== init.body) init = { ...init, body: req.body };
      return f.call(this, u, init, ...r);
    };
    XMLHttpRequest.prototype.open = function (m, u, ...r) { this._tw = { method: m, url: String(u) }; return open.call(this, m, u, ...r); };
    XMLHttpRequest.prototype.send = function (body) {
      const req = { ...this._tw, body };
      if (this._tw && runHooks(req) === 'block') return this.abort();
      return send.call(this, req.body);
    };
  };

  initNet(); // install the fetch/XHR wrappers right away, before Discord can keep its own references

  // Discord's Flux dispatcher (not ComponentDispatch, which lacks these extras).
  const isDispatcher = m => typeof m?.dispatch === 'function' && typeof m.subscribe === 'function' && typeof m.unsubscribe === 'function'
    && typeof m.dispatchToLastSubscribed !== 'function' && '_subscriptions' in m && '_interceptors' in m;

  // A short report about what this Discord build exposes (Info tab > Run diagnostics).
  const diagnose = () => {
    grab();
    const out = { chunk: CHUNK, webpack: !!wreq, modules: wreq ? Object.keys(wreq.c).length : 0, localStorage: typeof window.localStorage,
      settings: ls.persistent() ? 'saved' : 'memory only', dispatchers: [], sendMessage: [], storeNames: 0 };
    if (!wreq) return out;
    const want = ['ReadStateStore', 'GuildStore', 'GuildChannelStore', 'ChannelStore', 'UserStore', 'SelectedGuildStore', 'PermissionStore', 'ActiveJoinedThreadsStore'];
    const seen = new Set();
    for (const id in wreq.c) {
      const e = wreq.c[id]?.exports;
      if (!e) continue;
      let vals = [];
      try { vals = Object.values(e); } catch {}
      for (const x of [e, ...vals]) {
        try {
          if (typeof x?.dispatch === 'function' && typeof x.subscribe === 'function')
            out.dispatchers.push({ id, unsub: typeof x.unsubscribe, componentDispatch: typeof x.dispatchToLastSubscribed, isDispatching: typeof x.isDispatching, own: Object.keys(x).slice(0, 5) });
          if ((typeof x === 'object' || typeof x === 'function') && 'getName' in x && typeof x.getName === 'function') { const n = x.getName(); out.storeNames++; if (want.includes(n)) seen.add(n); }
          if (typeof x?.sendMessage === 'function') out.sendMessage.push({ id, keys: Object.keys(x).slice(0, 6) });
        } catch {}
      }
    }
    out.missingStores = want.filter(n => !seen.has(n));
    out.dispatchers = out.dispatchers.slice(0, 6);
    out.sendMessage = out.sendMessage.slice(0, 4);
    return out;
  };
  let disp, sendMod; const waiters = new Set(); let waitT = 0;
  const dispatcher = () => disp ||= find(isDispatcher);

  // Discord's own web client (the one every request goes through), so calls are signed in as you.
  let restMod;
  const rest = () => restMod ||= find(m => typeof m?.post === 'function' && typeof m.get === 'function' && typeof m.getAPIBaseURL === 'function')
    || find(m => typeof m?.post === 'function' && typeof m.get === 'function' && typeof m.patch === 'function' && typeof m.del === 'function');

  // ---- message scanner: one shared, throttled look at the chat for every plugin that decorates messages ----
  const scanners = new Map(), seenBy = new WeakMap(); let scanMO, scanT;
  const msgInfo = li => { const m = /^chat-messages-(\d+)-(\d+)$/.exec(li?.id || ''); return m ? { channelId: m[1], id: m[2], msg: findStore('MessageStore')?.getMessage?.(m[1], m[2]) } : null; };
  const scan = () => {
    scanT = 0;
    for (const li of document.querySelectorAll('li[id^="chat-messages-"]')) {
      let seen = seenBy.get(li); if (!seen) seenBy.set(li, seen = new Set());
      for (const [k, f] of scanners) if (!seen.has(k)) { seen.add(k); try { f(li, msgInfo(li)); } catch (e) { console.warn('[twilight] scanner', k, e); } }
    }
  };
  const msgScan = {
    add(name, fn) {
      scanners.set(name, timed(name, fn));
      if (!scanMO) { scanMO = new _MO(() => { scanT ||= _st(scan, 350); }); scanMO.observe(document.body, { childList: true, subtree: true }); }
      scanT ||= _st(scan, 100);
      return () => { scanners.delete(name); };
    },
    again(name) { for (const li of document.querySelectorAll('li[id^="chat-messages-"]')) seenBy.get(li)?.delete(name); scanT ||= _st(scan, 50); },
    info: msgInfo,
  };

  // ---- right-click menu helper: plugins add entries to Discord's own menus (or our own small menu if Discord shows none) ----
  const ctxFns = new Map(); let ctxLast = null, ctxMO, ownMenu;
  const closeOwn = () => { ownMenu?.remove(); ownMenu = null; };
  const itemsFor = t => { const out = []; for (const [k, f] of ctxFns) { try { const r = f(t); if (r?.length) out.push(...r); } catch (e) { console.warn('[twilight] menu', k, e); } } return out; };
  const injectItems = (menu, items) => {
    if (menu.querySelector('[data-tw-ctx]')) return;
    const first = menu.querySelector('[role="menuitem"]'), lab = first?.querySelector('[class*="label"]');
    const sep = menu.querySelector('[role="separator"]');
    const wrap = el('div'); wrap.dataset.twCtx = '1'; wrap.setAttribute('role', 'group');
    if (sep) wrap.append(sep.cloneNode(true));
    const hd = el('div', 'Twilight'); hd.style.cssText = 'padding:6px 8px 2px;font:700 11px "gg sans","Segoe UI",sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--channels-default,#949ba4);user-select:none'; wrap.append(hd);
    for (const it of items) {
      const row = document.createElement('div'); row.setAttribute('role', 'menuitem'); row.tabIndex = -1;
      row.className = (first?.className || '') + ' tw-ctx-item';
      const span = document.createElement('div'); span.className = lab?.className || ''; span.textContent = '✦ ' + it.label;
      if (!first) row.style.cssText = 'padding:6px 10px;cursor:pointer;color:#cfe3f3;font:500 14px "gg sans","Segoe UI",sans-serif';
      row.append(span);
      row.addEventListener('click', e => { e.stopPropagation(); try { it.run(); } catch (err) { console.warn('[twilight] menu item', err); } document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); closeOwn(); });
      wrap.append(row);
    }
    // Under Discord's own buttons: add to the list that holds the native items (a side-by-side column would appear if added to the outer menu).
    const host = first?.closest('[role="group"]')?.parentElement || first?.parentElement || menu;
    host.append(wrap);
  };
  const showOwn = (items, x, y) => {
    closeOwn();
    ownMenu = el('div'); ownMenu.id = 'tw-ownmenu';
    ownMenu.style.cssText = `position:fixed;z-index:2147483645;min-width:200px;padding:6px;border-radius:8px;background:rgba(6,12,22,.94);backdrop-filter:blur(14px);border:1px solid rgba(108,200,255,.28);box-shadow:0 12px 36px rgba(0,0,0,.6);font:600 13px "gg sans","Segoe UI",sans-serif;color:#d2e6f5`;
    for (const it of items) { const r = el('div', it.label); r.style.cssText = 'padding:7px 10px;border-radius:5px;cursor:pointer'; r.onmouseenter = () => r.style.background = 'rgba(108,200,255,.18)'; r.onmouseleave = () => r.style.background = ''; r.onclick = () => { closeOwn(); try { it.run(); } catch {} }; ownMenu.append(r); }
    document.body.append(ownMenu);
    const b = ownMenu.getBoundingClientRect(); ownMenu.style.left = Math.max(4, Math.min(x, innerWidth - b.width - 4)) + 'px'; ownMenu.style.top = Math.max(4, Math.min(y, innerHeight - b.height - 4)) + 'px';
  };
  const ctx = {
    add(name, fn) {
      ctxFns.set(name, timed(name, fn));
      if (!ctxMO) {
        window.addEventListener('contextmenu', e => {
          if (!ctxFns.size) return;
          const items = itemsFor(e.target); ctxLast = { items, at: Date.now(), x: e.clientX, y: e.clientY, used: false };
          if (items.length) _st(() => { if (ctxLast && !ctxLast.used && Date.now() - ctxLast.at < 700) { ctxLast.used = true; showOwn(items, ctxLast.x, ctxLast.y); } }, 260);
        }, true);
        window.addEventListener('mousedown', e => { if (ownMenu && !ownMenu.contains(e.target)) closeOwn(); }, true);
        ctxMO = new _MO(ms => {
          if (!ctxLast?.items.length || ctxLast.used || Date.now() - ctxLast.at > 700) return;
          for (const m of ms) for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            const menu = n.matches?.('[role="menu"]') ? n : n.querySelector?.('[role="menu"]');
            if (menu && menu.querySelector('[role="menuitem"]') && !menu.closest('[class*="stream"],[class*="video"]')) { ctxLast.used = true; injectItems(menu, ctxLast.items); return; }
            if (menu) { ctxLast.used = true; return; } // stream / video menus are left alone
          }
        });
        ctxMO.observe(document.body, { childList: true, subtree: true });
      }
      return () => ctxFns.delete(name);
    },
  };

  window.Twilight = {
    plugins, rest, msgScan, ctx, commands: new Map(),
    // Native slash commands: a plugin adds { name, id, desc, opts:[{name,description,required,max_length}], run(values) }; the Tag commands plugin shows them in Discord's command list.
    slash: { cmds: new Map(), add(d) { this.cmds.set(d.name, d); this.onChange?.(); }, remove(n) { this.cmds.delete(n); this.onChange?.(); } }, // chat commands: name -> { help, run(args, channelId) }
    find, findAll,
    notify,
    ls, isOff, setOff, findStore,
    logs, evalJS, isDispatcher, dispatcher, diagnose,
    log: (...a) => console.log('[twilight]', ...a),
    // Per-plugin option stored in localStorage (toggled from the debug menu).
    opt: (plugin, key, def) => ls.get(`opt:${plugin}:${key}`, def),
    // Plugins that react to an option listen for the 'tw-opt' window event instead of polling it.
    setOpt: (plugin, key, v) => { ls.set(`opt:${plugin}:${key}`, v); window.dispatchEvent(new CustomEvent('tw-opt', { detail: { plugin, key } })); },
    net: { add: (h, name = cur) => { initNet(); const w = name ? timed(name, h) : h; netW.set(h, w); netHooks.add(w); }, remove: h => { netHooks.delete(netW.get(h) || h); netW.delete(h); } },
    findByProps: (...p) => find(m => (typeof m === 'object' || typeof m === 'function') && p.every(k => k in m)),
    // Really sends a message (bridge, agent). Pressing Enter with fake key events does NOT send; Discord's own sendMessage does.
    // Shows a small local note in the chat afterwards (only you see it) unless opts.quiet.
    async send(channelId, text, opts = {}) {
      channelId = String(channelId || ''); text = String(text ?? '');
      if (!/^\d{5,25}$/.test(channelId) || !text.trim() || text.length > 2000) return { error: 'bad channel or text' };
      const has = (...k) => find(x => (typeof x === 'object' || typeof x === 'function') && k.every(y => y in x)), m = sendMod ||= has('sendMessage', 'receiveMessage') || has('sendMessage');
      if (!m) return { error: 'no sendMessage module' };
      try { await m.sendMessage(channelId, { content: text, tts: false, invalidEmojis: [], validNonShortcutEmojis: [] }, undefined, {}); }
      catch (e) { return { error: String(e?.message || e).slice(0, 100) }; }
      if (!opts.quiet) try { plugins.get('Assistant')?.say?.(channelId, '*Sent:* ' + text.slice(0, 200)); } catch {}
      return { ok: true };
    },
    // Calls cb(module) once a matching module exists. Returns a cancel function.
    // Gives up after `timeout` ms (calling onFail, if given).
    waitFor(f, cb, timeout = 60000, onFail) {
      // One shared 1 s timer for every plugin that is waiting for a Discord module (each check walks all modules, so they must not each run their own).
      if (cur) { cb = timed(cur, cb); if (onFail) onFail = timed(cur, onFail); }
      const w = { f, cb, onFail, t0: Date.now() };
      waiters.add(w);
      if (!waitT) waitT = _si.call(window, () => {
        for (const x of [...waiters]) {
          let m; try { m = x.f === isDispatcher ? dispatcher() : find(x.f); } catch {}
          if (m) { waiters.delete(x); try { x.cb(m); } catch (e) { console.warn('[twilight] waitFor', e); } }
          else if (Date.now() - x.t0 > timeout) { waiters.delete(x); try { x.onFail?.(); } catch {} }
        }
        if (!waiters.size) { clearInterval(waitT); waitT = 0; }
      }, 1000);
      return () => waiters.delete(w);
    },
    // Twilight's own status in the DM / friends lists: active, or idle while Claude is out of usage (set from the replies, no polling).
    limited: () => { const l = ls.get('asstLimit', null); return !!(l && l.until > Date.now()); },
    asstUsage(r) {
      if (!r || typeof r.limited !== 'boolean') return;
      const was = this.limited(); ls.set('asstLimit', r.limited ? { until: r.until || Date.now() + 1800000 } : null);
      if (was !== this.limited()) this.debug?.paintAsst?.();
    },
    // Ask the main process for something (window glass mode, relaunch). Resolves with its answer, or null if nothing answers.
    cmd(cmd, ms = 4000) {
      return new Promise(res => {
        const id = Math.random().toString(36).slice(2);
        const on = e => { try { const d = JSON.parse(e.detail); if (d.id === id) { window.removeEventListener('twilight-reply', on); if (cmd?.type === 'ask' || cmd?.type === 'agent') window.Twilight.asstUsage(d.r); res(d.r); } } catch {} };
        window.addEventListener('twilight-reply', on);
        setTimeout(() => { window.removeEventListener('twilight-reply', on); res(null); }, ms);
        window.dispatchEvent(new CustomEvent('twilight-cmd', { detail: JSON.stringify({ id, cmd }) }));
      });
    },
    // Subscribe to Discord events: onFlux({TYPING_START: fn, ...}) -> returns an undo function.
    onFlux(handlers, name = 'plugin') {
      let d;
      const who = name !== 'plugin' ? name : cur || 'plugin', wrapped = {}; // wrapped so the cost meter sees every handler
      for (const [t, f] of Object.entries(handlers)) { const w = timed(who, f); wrapped[t] = a => { const t0 = performance.now(); try { return w(a); } finally { cost.flux.ms += performance.now() - t0; cost.flux.n++; } }; }
      const cancel = this.waitFor(isDispatcher, x => { d = x; for (const [t, f] of Object.entries(wrapped)) d.subscribe(t, f); },
        60000, () => this.log(`${name}: Discord dispatcher not found`));
      return () => { cancel(); if (d) for (const [t, f] of Object.entries(wrapped)) d.unsubscribe(t, f); d = null; };
    },
    // Ultra lightweight mode: plugins marked `heavy` are switched off, blur effects stop, timers slow down. Reversible at any time.
    lite: () => !!ls.get('lite', false),
    setLite(on) {
      ls.set('lite', !!on); document.documentElement.toggleAttribute('data-tw-lite', !!on);
      for (const p of plugins.values()) if (p.heavy && !isOff(p.name)) { try { cur = p.name; on ? p.stop?.() : p.start?.(); } catch (e) { console.warn('[twilight] lite', p.name, e); } finally { cur = null; } }
      plugins.get('GlassTheme')?.apply?.(); window.Twilight.debug?.refresh?.();
    },
    suggestLite(why) { console.warn(`[twilight] ${why}`); try { this.notify('Discord is stuttering', 'Try Tools > Housekeeping > Ultra lightweight mode (' + why + ')', 8000, 'warn'); } catch {} },
    scoped, cost, timed, every: (name, ms, f) => { const id = _si.call(window, timed(name, f), ms); return () => clearInterval(id); },
    definePlugin(p) {
      plugins.set(p.name, p);
      for (const x of p.patches || [])
        patches.push({ plugin: p.name, find: x.find, replacements: [].concat(x.replacement).map(r => [r.match, r.replace]) });
      return p;
    },
    info: () => (grab(), { chunk: CHUNK, ready: !!wreq, modules: wreq ? Object.keys(wreq.c).length : 0, patches: patches.length }),
    // The little "loaded" popup. Title, text, time, colour and on/off are editable in the menu (Notify tab).
    startupDefaults: { on: true, title: 'Twilight-Cord', msg: 'Loaded · v{version} · {plugins} plugins', ms: 4000, type: 'success' },
    startupPopup(version, force) {
      const c = { ...this.startupDefaults, ...ls.get('startup', {}) };
      if (!c.on && !force) return;
      const n = [...plugins.keys()].filter(k => !isOff(k)).length, fill = t => String(t).replace(/\{version\}/g, version || '').replace(/\{plugins\}/g, n).replace(/\{time\}/g, new Date().toLocaleTimeString([], { hour12: false }));
      notify(fill(c.title), fill(c.msg), +c.ms || 4000, c.type);
    },
    start(css, opts = {}) {
      const go = () => {
        if (css) document.documentElement.append(Object.assign(document.createElement('style'), { textContent: scoped(css) }));
        const t0 = performance.now();
        document.documentElement.setAttribute('data-tw-main', '1'); // lets our CSS apply to this window only (Discord copies styles into pop-out windows)
        // 1.12.0: lightweight mode used to switch itself on and stay on. Start everyone from "off" once; it is only ever turned on by hand now.
        if (!ls.get('liteReset', false)) { ls.set('liteReset', true); ls.set('lite', false); ls.set('liteAuto', null); }
        document.documentElement.toggleAttribute('data-tw-lite', !!ls.get('lite', false));
        plugins.forEach(p => { if (!isOff(p.name) && !(ls.get('lite', false) && p.heavy)) { const t1 = performance.now(); try { cur = p.name; p.start?.(); } catch (e) { console.error('[twilight]', p.name, e); } finally { cur = null; slot(p.name).start = performance.now() - t1; } } });
        cost.start = performance.now() - t0;
        try { window.Twilight.debug?.init(opts); } catch (e) { console.error('[twilight] debug', e); }
        console.log(`[twilight] started v${opts.version}: ${[...plugins.keys()].filter(n => !isOff(n)).join(', ')} | settings storage: ${ls.persistent() ? 'saved' : 'memory only'}`);
        setTimeout(() => { grab(); console.log(`[twilight] webpack ready: ${!!wreq}, modules: ${wreq ? Object.keys(wreq.c).length : 0}`); }, 8000);
        if (opts.safe) notify('Safe mode', 'No plugins or themes loaded. Open the menu to leave it', 8000, 'warn');
        else window.Twilight.startupPopup(opts.version);
      };
      document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go();
    },
  };
})();
