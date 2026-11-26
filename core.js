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
  const plugins = new Map();
  let wreq;

  // Intercept webpack's chunk array to catch webpack's require as early as possible. (Source patching was removed in 1.23.0:
  // no plugin used it, and it meant reading the source of every one of Discord's ~9000 modules when patches existed.)
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

  let navFn; // Discord's router function, found once (see go)
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
  const mem = new Map(), localMem = new Map();
  // Auto-save: every setting is also written to settings.json next to Twilight-Cord (through the main process), and read back on start.
  const seed = window.__twSeed || {}; try { delete window.__twSeed; } catch {}
  for (const k of Object.keys(seed)) mem.set(k, seed[k]);
  // A brand-new install: no settings.json yet and nothing saved in the browser storage either (used for defaults that differ for new users).
  let fresh = !Object.keys(seed).length;
  if (fresh) try { const st = window.localStorage; for (let i = 0; i < st.length; i++) if (st.key(i)?.startsWith('twilight-')) { fresh = false; break; } } catch {}
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
    fresh: () => fresh,
    file: () => ({ ok: saveOk, at: savedAt }),
    // Bigger data that should survive a restart but is not worth rewriting settings.json for on every change (MessageLogger's saved
    // copies). Lives in the storage grabbed above (plugins cannot use localStorage themselves: Discord deletes it after start-up).
    local: {
      get: (k, d) => { // parsed once, then served from memory
        if (localMem.has(k)) return localMem.get(k);
        let v; try { const t = getStorage()?.getItem('twilight-local-' + k); v = t == null ? undefined : JSON.parse(t); } catch {}
        if (v === undefined) return d;
        localMem.set(k, v); return v;
      },
      set: (k, v) => { localMem.set(k, v); try { getStorage()?.setItem('twilight-local-' + k, JSON.stringify(v)); } catch {} },
    },
  };
  // First run after the update: bring settings that only exist in Discord's storage into the file too.
  try {
    const st = getStorage(); let moved = 0;
    for (let i = 0; st && i < st.length; i++) {
      const k = st.key(i);
      if (k?.startsWith('twilight-') && !k.startsWith('twilight-local-') && !mem.has(k.slice(9))) { try { mem.set(k.slice(9), JSON.parse(st.getItem(k))); moved++; } catch {} }
    }
    if (moved || !Object.keys(seed).length) setTimeout(saveSoon, 3000);
  } catch {}
  // Settings that no code reads any more (removed features): dropped once, so they stop being loaded and re-saved with every change.
  // voicelog: VoiceLog (removed 1.15.0) · ignorelog: IgnoreWatch · glass: window glass · tabUse: old menu usage counter · fw, size2, clonerPassed: older names
  for (const k of ['voicelog', 'ignorelog', 'glass', 'tabUse', 'fw', 'size2', 'clonerPassed', 'clonerPassedV2', 'liteAuto']) if (mem.has(k)) { mem.delete(k); try { storage?.removeItem('twilight-' + k); } catch {} setTimeout(saveSoon, 3000); }
  // Plugins marked `devOnly` (test and developer tools) start switched off; turning one on in the menu is remembered in 'on'.
  const isOff = n => ls.get('off', []).includes(n) || (!!plugins.get(n)?.devOnly && !ls.get('on', []).includes(n));
  const setOff = (n, off) => {
    ls.set('off', ls.get('off', []).filter(x => x !== n).concat(off ? [n] : []));
    ls.set('on', ls.get('on', []).filter(x => x !== n).concat(!off && plugins.get(n)?.devOnly ? [n] : []));
  };

  // Flux stores expose getName(). 1.23.0: looked up in Flux's own list of every store (Store.getAll(), about 560 stores in under 1 ms)
  // instead of walking all ~9000 webpack modules for each new name (about 18 ms per name, measured, and ~20 names are used).
  // The walk stays as the fallback. Misses are remembered for 10 s so a renamed store never costs a walk on every call.
  const stores = new Map(), storeMiss = new Map(); let fluxAll = null, fluxN = -1;
  const isStore = m => (typeof m === 'object' || typeof m === 'function') && m !== null && typeof m.getName === 'function';
  const regOf = s => { let C = s?.constructor; for (let i = 0; C && i < 4; i++, C = Object.getPrototypeOf(C)) if (typeof C.getAll === 'function') return C; return null; };
  const fromRegistry = n => {
    // unlock: any one store leads to the list. The walk stops at the first store it meets (~2 ms, measured), not at a named one (5-40 ms).
    if (!fluxAll) { for (const s of stores.values()) if ((fluxAll = regOf(s))) break; if (!fluxAll && wreq) { const any = find(m => isStore(m) && !!regOf(m)); if (any) fluxAll = regOf(any); } }
    if (!fluxAll) return;
    let all; try { all = fluxAll.getAll(); } catch { return; }
    if (all.length !== fluxN) { fluxN = all.length; for (const s of all) { try { const k = s.getName(); if (typeof k === 'string' && !stores.has(k)) stores.set(k, s); } catch {} } }
    return stores.get(n);
  };
  const findStore = n => {
    if (stores.has(n)) return stores.get(n);
    if (Date.now() - (storeMiss.get(n) || 0) < 10000) return;
    let s = fromRegistry(n);
    // Once Flux's list is known, a store missing from it has not been created yet (stores add themselves when made), so walking every
    // module cannot find it either: skip the walk (1.23.0.d3; Discord creates some stores, like QuestStore, a few seconds after start).
    if (!s && !fluxAll) { s = find(m => isStore(m) && m.getName() === n); if (s) { stores.set(n, s); fromRegistry(n); } } // the first hit also unlocks the registry
    if (s) storeMiss.delete(n); else storeMiss.set(n, Date.now());
    return s;
  };

  // One shared fetch/XHR wrapper. A hook receives {url, method, body}; it may edit req.body or return 'block'.
  const netHooks = new Set(), netW = new Map();
  let netOn = false;
  const cost = { start: 0, flux: { ms: 0, n: 0 }, net: { ms: 0, n: 0 }, at: Date.now(), by: {}, stalls: [] };
  // ---- cost meter: every plugin's CPU time is counted by name (events, timers, observers, network checks) ----
  let cur = null; // the plugin whose code is running right now
  const slot = n => cost.by[n] ||= { ms: 0, n: 0, max: 0, start: 0 };
  const timed = (name, f) => function (...a) {
    const prev = cur, t0 = performance.now(); cur = name;
    try { return f.apply(this, a); }
    finally {
      const dt = performance.now() - t0; cur = prev;
      const s = slot(name); s.ms += dt; s.n++; if (dt > s.max) s.max = dt; // the worst single call shows in the Cost tab
    }
  };
  // Code a plugin schedules while it is running keeps the plugin's name (timers, observers).
  const _si = window.setInterval, _st = window.setTimeout, _MO = window.MutationObserver;
  window.setInterval = function (f, ...r) { return _si.call(this, cur && typeof f === 'function' ? timed(cur, f) : f, ...r); };
  window.setTimeout = function (f, ...r) { return _st.call(this, cur && typeof f === 'function' ? timed(cur, f) : f, ...r); };
  window.MutationObserver = class extends _MO { constructor(cb) { super(cur && typeof cb === 'function' ? timed(cur, cb) : cb); } };
  // Stalls (long tasks) of the whole page: if Discord stutters a lot AND Twilight's plugins are part of it, suggest lightweight mode once
  // in a while (never switched on by itself). Not in the first 2 minutes (Discord's own start-up always stalls) and not while Discord is
  // hidden; and only when plugins used real time in those 30 s, since lite mode cannot help with stalls that are Discord's own.
  try {
    let hits = [], warned = 0; const pluginMs = () => Object.values(cost.by).reduce((a, x) => a + x.ms, 0) + cost.flux.ms + cost.net.ms;
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) if (e.duration > 120 && performance.now() > 120000 && document.visibilityState === 'visible') hits.push([Date.now(), pluginMs()]);
      hits = hits.filter(h => Date.now() - h[0] < 30000); cost.stalls = hits.map(h => h[0]);
      if (hits.length >= 8 && Date.now() - warned > 600000 && !window.Twilight?.lite?.()) {
        const ours = pluginMs() - hits[0][1]; // plugin time since the first of these stalls (no timer needed)
        if (ours < 300) { warned = Date.now(); console.warn(`[twilight] ${hits.length} long stalls in 30 s, but plugins used only ${Math.round(ours)} ms: Discord's own, not suggesting lite mode`); return; }
        warned = Date.now(); window.Twilight?.suggestLite?.(`${hits.length} long stalls in 30 s, plugins used ${Math.round(ours)} ms`);
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
  // Discord's request module (get/post/put/patch/del). Discord also ships translation objects that answer ANY property name with a
  // function (so they pass a plain "has .post" test and reply {locale, ast}); a made-up property name catches those.
  const NOPE = '__twNope' + Math.random().toString(36).slice(2);
  const rest = () => restMod ||= find(m => m[NOPE] === undefined && !m._dispatcher && !('Request' in m)
    && ['get', 'post', 'put', 'patch', 'del'].every(k => typeof m[k] === 'function'));

  // ---- one shared page watcher: Discord redraws all the time, and every MutationObserver on the whole page makes the browser record
  // every change once more. So there is exactly one, and each user (message scanner, menu rows, plugins via Twilight.onDom) gets a
  // throttled call: at most one per `ms`, and nothing at all while Discord's page is not changing. ----
  const domFns = new Set(); let domMO = null;
  const domWatch = (fn, ms = 300) => {
    const w = { fn, ms, t: 0 }; domFns.add(w);
    const fire = () => { w.t = 0; try { w.fn(); } catch (e) { console.warn('[twilight] page watcher', e); } };
    w.kick = () => { w.t ||= _st(fire, w.ms); };
    if (!domMO && document.body) { domMO = new _MO(() => { for (const x of domFns) x.kick(); }); domMO.observe(document.body, { childList: true, subtree: true }); }
    return () => { clearTimeout(w.t); domFns.delete(w); if (!domFns.size && domMO) { domMO.disconnect(); domMO = null; } };
  };
  // ---- chat-bar buttons: small toggles in the message box, left of Discord's GIF button (SilentTyping, Translate my messages...) ----
  // A plugin calls chatButton({ id, label, icon (svg), on: () => bool, tag: () => short text, click }) and gets back a remove function.
  // The shared page watcher puts them back whenever Discord redraws the box; each pass only checks what is there.
  const chatBtns = new Map(); let chatStop = null;
  const paintChat = () => {
    if (!chatBtns.size) return;
    for (const bar of document.querySelectorAll('[class*="channelTextArea_"] [class*="buttons_"]')) {
      const model = [...bar.children].find(c => !c.dataset.twCb && c.querySelector('[role="button"]')); if (!model) continue;
      let first = [...bar.children].find(c => !c.dataset.twCb) || null;
      for (const d of chatBtns.values()) {
        let w = bar.querySelector(`:scope > [data-tw-cb="${d.id}"]`);
        if (!w) {
          w = document.createElement('div'); w.className = model.className; w.dataset.twCb = d.id;
          const b = document.createElement('div'), inner = model.querySelector('[role="button"]');
          b.className = (inner?.className || '') + ' tw-cb'; b.setAttribute('role', 'button'); b.tabIndex = 0; b.innerHTML = d.icon + '<span class="tw-cb-tag"></span>';
          b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); try { d.click(e); } catch (x) { console.warn('[twilight] chat button', d.id, x); } paintChat(); }, true);
          b.addEventListener('contextmenu', e => { if (!d.menu) return; e.preventDefault(); e.stopPropagation(); try { d.menu(e); } catch {} }, true);
          w.append(b); bar.insertBefore(w, first);
        }
        const b = w.firstChild, on = !!d.on?.(), tag = d.tag?.() || '', label = typeof d.label === 'function' ? d.label() : d.label;
        b.classList.toggle('on', on); b.setAttribute('aria-label', label); b.setAttribute('aria-pressed', String(on)); if (b.title !== label) b.title = label;
        const t = b.querySelector('.tw-cb-tag'); if (t.textContent !== tag) t.textContent = tag;
      }
    }
  };
  const chatCss = () => { if (document.getElementById('tw-cbcss')) return; const st = document.createElement('style'); st.id = 'tw-cbcss';
    st.textContent = '.tw-cb{position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--interactive-normal)}.tw-cb:hover{color:var(--interactive-hover)}.tw-cb svg{width:20px;height:20px;fill:currentColor}.tw-cb.on{color:var(--brand-500,#5865f2)}.tw-cb:not(.on) svg{opacity:.75}.tw-cb-tag{position:absolute;right:-3px;bottom:-1px;padding:0 3px;border-radius:4px;background:var(--brand-500,#5865f2);color:#fff;font:700 9px/12px "gg sans","Segoe UI",sans-serif;pointer-events:none}.tw-cb-tag:empty{display:none}.tw-cb:not(.on) .tw-cb-tag{background:var(--background-mod-strong,#4e5058)}';
    document.documentElement.append(st); };
  const chatButton = d => {
    chatCss(); chatBtns.set(d.id, d); chatStop ||= domWatch(paintChat, 400); paintChat();
    return () => { chatBtns.delete(d.id); document.querySelectorAll(`[data-tw-cb="${d.id}"]`).forEach(x => x.remove()); if (!chatBtns.size && chatStop) { chatStop(); chatStop = null; } };
  };
  // ---- message scanner: one shared, throttled look at the chat for every plugin that decorates messages ----
  const scanners = new Map(), seenBy = new WeakMap(); let scanStop, scanT;
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
      scanStop ||= domWatch(scan, 350);
      scanT ||= _st(scan, 100);
      return () => { scanners.delete(name); if (!scanners.size) { scanStop?.(); scanStop = null; } };
    },
    again(name) { for (const li of document.querySelectorAll('li[id^="chat-messages-"]')) seenBy.get(li)?.delete(name); scanT ||= _st(scan, 50); },
    info: msgInfo,
  };

  // ---- right-click menu helper: plugins add entries to Discord's own menus (or our own small menu if Discord shows none) ----
  const assetP = {};
  const ctxFns = new Map(); let ctxLast = null, ctxMO, ownMenu;
  const closeOwn = () => { ownMenu?.remove(); ownMenu = null; };
  const itemsFor = t => { const out = []; for (const [k, f] of ctxFns) { try { const r = f(t); if (r?.length) for (const it of r) out.push({ ...it, grp: k }); } catch (e) { console.warn('[twilight] menu', k, e); } } return out; };
  // Icons in the same 24px box as Discord's own. Drawn as lines (fill kept off inline, so Discord's hover rule that recolours
  // icon fills cannot flood them); they take the row's colour like the native ones.
  const ICONS = {
    copy: ['M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z', 'M4 15a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2'],
    markdown: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', 'M6 15V9l2.5 3L11 9v6', 'M16 9v6', 'M14 13l2 2 2-2'],
    link: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'],
    bell: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a2 2 0 0 0 3.4 0'],
    translate: ['M3 5h11', 'M8.5 3v2', 'M12 5c-1 5-4.5 8.5-8 10', 'M5.5 9c1.2 2.4 3.3 4.6 6 6', 'M13 21l4.5-10 4.5 10', 'M14.5 18h6'],
    note: ['M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', 'M14 2v6h6', 'M8 13h8', 'M8 17h5'],
    unnote: ['M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', 'M14 2v6h6', 'M8 15h8'],
    history: ['M3 12a9 9 0 1 0 2.6-6.4L3 8', 'M3 3v5h5', 'M12 7v5l3.5 2'],
    trash: ['M3 6h18', 'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6'],
    eye: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
    add: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 8v8', 'M8 12h8'],
    download: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 21h16'],
    id: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', 'M8 9v6', 'M12 9v6h1.5a3 3 0 0 0 0-6H12Z'],
    spark: ['M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z'],
  };
  const svgIcon = (name, cls) => {
    const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg');
    for (const [k, v] of Object.entries({ class: cls || '', 'aria-hidden': 'true', role: 'img', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none' })) s.setAttribute(k, v);
    for (const d of ICONS[name] || ICONS.spark) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('style', 'fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round'); s.append(p); }
    return s;
  };
  // While the pointer is on one of our rows, Discord's last-hovered native row keeps its highlight (it only moves it between its
  // own rows), so that highlight is muted until the pointer is back on a native row.
  let ctxCss;
  const ctxStyle = () => ctxCss ||= document.head.appendChild(Object.assign(document.createElement('style'), { id: 'tw-ctx-css', textContent:
    '[role="menu"]:has(.tw-ctx-item:hover) [role="menuitem"][class*="focused_"]:not(.tw-ctx-item){background-color:transparent!important;color:var(--interactive-text-default)!important}' +
    '[role="menu"]:has(.tw-ctx-item:hover) [role="menuitem"][class*="focused_"]:not(.tw-ctx-item) path{fill:currentColor!important}' }));
  const injectItems = (menu, items) => {
    if (menu.querySelector('[data-tw-ctx]')) return;
    ctxStyle();
    const rows = [...menu.querySelectorAll('[role="menuitem"]')].filter(e => e.querySelector('[class*="label_"]'));
    // A plain native row to copy: icon on the left (Discord's current menus), not red, not a submenu. Older-style menus (icon on
    // the right or none) are copied as they are, so our rows always match the menu they sit in.
    const plain = e => !/colorDanger_|focused_/.test(e.className) && !e.hasAttribute('aria-haspopup') && !e.querySelector('input,[class*="checkbox"]');
    const tpl = rows.find(e => plain(e) && e.querySelector('[class*="iconContainerLeft"] svg')) || rows.find(plain) || rows[0];
    const sfx = tpl?.className.match(/\bitem_(\w+)/)?.[1], focusC = sfx && 'focused_' + sfx, dangerC = sfx && 'colorDanger_' + sfx;
    const svgCls = tpl?.querySelector('svg')?.getAttribute('class') || '';
    const sepT = menu.querySelector('[role="separator"]');
    const sep = () => { if (sepT) return sepT.cloneNode(true); const s = document.createElement('div'); s.setAttribute('role', 'separator'); s.style.cssText = 'height:1px;margin:4px 8px;background:var(--background-mod-normal,rgba(255,255,255,.08))'; return s; };
    const close = () => { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); closeOwn(); };
    const mkRow = it => {
      let row;
      if (tpl) {
        row = tpl.cloneNode(true);
        for (const a of ['id', 'aria-expanded', 'aria-haspopup', 'aria-describedby', 'aria-checked', 'data-menu-item', 'data-marquee-active']) row.removeAttribute(a);
        row.className = row.className.split(/\s+/).filter(c => !/^(focused_|colorDanger_|disabled_)/.test(c)).join(' ');
        const txt = row.querySelector('[class*="label_"] [class*="text_"]') || row.querySelector('[class*="label_"]');
        txt.textContent = it.label;
        row.querySelector('[class*="subtext_"]')?.remove();
        const left = row.querySelector('[class*="iconContainerLeft"]');
        // Right-hand slot: a submenu caret or a native icon. Our rows have no submenus, so in left-icon menus it goes; in
        // right-icon menus our icon goes there instead.
        const right = [...row.querySelectorAll('[class*="iconContainer"]')].find(e => e !== left);
        if (left) { left.replaceChildren(svgIcon(it.icon, svgCls)); right?.remove(); }
        else if (right) right.replaceChildren(svgIcon(it.icon, svgCls));
        if (it.danger && dangerC) row.classList.add(dangerC);
      } else {
        row = el('', it.label); row.setAttribute('role', 'menuitem');
        row.style.cssText = 'padding:6px 8px;cursor:pointer;color:var(--interactive-text-default);font:500 14px "gg sans","Segoe UI",sans-serif';
      }
      row.classList.add('tw-ctx-item'); row.tabIndex = -1;
      if (focusC) { row.addEventListener('mouseenter', () => row.classList.add(focusC)); row.addEventListener('mouseleave', () => row.classList.remove(focusC)); }
      row.addEventListener('click', e => { e.stopPropagation(); try { it.run(); } catch (err) { console.warn('[twilight] menu item', err); } close(); });
      return row;
    };
    // One native-style group per plugin, each behind a separator, like Discord's own sections. No header, no badges.
    const wrap = document.createElement('div'); wrap.dataset.twCtx = '1';
    let grp = null, box = null;
    for (const it of items) {
      if (it.grp !== grp) { grp = it.grp; wrap.append(sep()); box = document.createElement('div'); box.setAttribute('role', 'group'); wrap.append(box); }
      box.append(mkRow(it));
    }
    // Under Discord's own buttons, inside the list that holds them (adding to the outer menu would make a side-by-side column).
    const host = tpl?.closest('[role="group"]')?.parentElement || menu.querySelector('[class*="scroller"]') || menu;
    host.append(wrap);
  };
  // Our own menu (only when Discord opens none): drawn in Discord's menu colours so it looks like one.
  const showOwn = (items, x, y) => {
    closeOwn(); ctxStyle();
    ownMenu = el(''); ownMenu.id = 'tw-ownmenu'; ownMenu.setAttribute('role', 'menu');
    ownMenu.style.cssText = 'position:fixed;z-index:2147483645;min-width:188px;padding:6px 8px;border-radius:8px;background:var(--background-surface-highest,var(--background-floating,#111214));border:1px solid var(--border-subtle,rgba(255,255,255,.06));box-shadow:var(--shadow-high,0 8px 16px rgba(0,0,0,.24));font:500 14px/18px "gg sans","Segoe UI",sans-serif;color:var(--interactive-text-default,#b5bac1)';
    let grp = null;
    for (const it of items) {
      if (grp !== null && it.grp !== grp) ownMenu.append(Object.assign(el(''), { style: 'height:1px;margin:4px 0;background:var(--background-mod-normal,rgba(255,255,255,.08))' }));
      grp = it.grp;
      const r = el(''), lab = el('', it.label), ic = svgIcon(it.icon, ''); ic.style.cssText = 'width:18px;height:18px;flex:none';
      r.style.cssText = `display:flex;align-items:center;gap:8px;padding:8px;border-radius:4px;cursor:pointer;${it.danger ? 'color:var(--text-feedback-critical,#f23f43)' : ''}`;
      lab.style.color = it.danger ? 'inherit' : 'var(--text-strong,#f2f3f5)';
      r.append(ic, lab);
      r.onmouseenter = () => r.style.background = it.danger ? 'var(--background-feedback-mod-critical,rgba(242,63,67,.1))' : 'var(--interactive-background-hover,rgba(255,255,255,.06))'; r.onmouseleave = () => r.style.background = '';
      r.onclick = () => { closeOwn(); try { it.run(); } catch {} };
      ownMenu.append(r);
    }
    document.body.append(ownMenu);
    const b = ownMenu.getBoundingClientRect(); ownMenu.style.left = Math.max(4, Math.min(x, innerWidth - b.width - 4)) + 'px'; ownMenu.style.top = Math.max(4, Math.min(y, innerHeight - b.height - 4)) + 'px';
  };
  const ctx = {
    add(name, fn) {
      ctxFns.set(name, timed(name, fn));
      if (!ctxMO) {
        // The page is only watched for the 700 ms after a right-click (while Discord opens its menu), never the rest of the time.
        let ctxOff = 0;
        const unwatch = () => { clearTimeout(ctxOff); ctxMO.disconnect(); };
        ctxMO = new _MO(ms => {
          if (!ctxLast?.items.length || ctxLast.used || Date.now() - ctxLast.at > 700) return unwatch();
          for (const m of ms) for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            const menu = n.matches?.('[role="menu"]') ? n : n.querySelector?.('[role="menu"]');
            if (menu && menu.querySelector('[role="menuitem"]') && !menu.closest('[class*="stream"],[class*="video"]')) { ctxLast.used = true; unwatch(); injectItems(menu, ctxLast.items); return; }
            if (menu) { ctxLast.used = true; return unwatch(); } // stream / video menus are left alone
          }
        });
        window.addEventListener('contextmenu', e => {
          if (!ctxFns.size) return;
          const items = itemsFor(e.target); ctxLast = { items, at: Date.now(), x: e.clientX, y: e.clientY, used: false };
          if (!items.length) return;
          unwatch(); ctxMO.observe(document.body, { childList: true, subtree: true }); ctxOff = _st(unwatch, 700);
          _st(() => { if (ctxLast && !ctxLast.used && Date.now() - ctxLast.at < 700) { ctxLast.used = true; showOwn(items, ctxLast.x, ctxLast.y); } }, 260);
        }, true);
        window.addEventListener('mousedown', e => { if (ownMenu && !ownMenu.contains(e.target)) closeOwn(); }, true);
      }
      return () => ctxFns.delete(name);
    },
  };

  window.Twilight = {
    plugins, rest, msgScan, ctx, commands: new Map(),
    // Run fn (throttled to one call per `ms`) whenever Discord changes the page; shares the one page watcher. Returns an undo function.
    onDom: (name, fn, ms = 500) => domWatch(timed(name, fn), Math.max(100, ms)),
    _domWatch: domWatch, // for the menu (not counted as a plugin in the Cost tab)
    // Native slash commands: a plugin adds { name, id, desc, opts:[{name,description,required,max_length}], run(values) }; the Tag commands plugin shows them in Discord's command list.
    slash: { cmds: new Map(), add(d) { this.cmds.set(d.name, d); this.onChange?.(); }, remove(n) { this.cmds.delete(n); this.onChange?.(); } }, // chat commands: name -> { help, run(args, channelId) }
    find, findAll,
    chatButton, refreshChatButtons: () => paintChat(),
    wreq: () => (grab(), wreq), // Discord's main webpack require (module sources in .m), for finding patch targets
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
    // Open a Discord page, e.g. go('/channels/<server>/<channel>/<message>'). Uses Discord's own router (found by what it logs, since
    // its export name changes between builds); falls back to a plain history change Discord also listens to.
    go(path) {
      try {
        navFn ||= find(x => typeof x === 'function' && /Transitioning to/.test(Function.prototype.toString.call(x))) || find(m => typeof m?.transitionTo === 'function')?.transitionTo;
        if (navFn) return navFn(path);
      } catch (e) { console.warn('[twilight] go', e); }
      history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate'));
    },
    // Really sends a message (bridge, agent). Pressing Enter with fake key events does NOT send; Discord's own sendMessage does.
    // Shows a small local note in the chat afterwards (only you see it) unless opts.quiet.
    async send(channelId, text, opts = {}) {
      channelId = String(channelId || ''); text = String(text ?? '');
      if (!/^\d{5,25}$/.test(channelId) || !text.trim() || text.length > 2000) return { error: 'bad channel or text' };
      const has = (...k) => find(x => (typeof x === 'object' || typeof x === 'function') && k.every(y => y in x)), m = sendMod ||= has('sendMessage', 'receiveMessage') || has('sendMessage');
      if (!m) return { error: 'no sendMessage module' };
      // 1.25.0: Discord's sendMessage can wait forever for a chat that was never opened, so give up after 15 s instead of hanging the caller.
      try { window.Twilight._ownSend = true; await Promise.race([m.sendMessage(channelId, { content: text, tts: false, invalidEmojis: [], validNonShortcutEmojis: [] }, undefined, {}), new Promise((_, no) => _st(() => no(new Error('timed out: open that chat once, then try again')), 15000))]); }
      catch (e) { return { error: String(e?.message || e).slice(0, 100) }; } finally { window.Twilight._ownSend = false; }
      if (!opts.quiet) try { plugins.get('Assistant')?.say?.(channelId, '*Sent:* ' + text.slice(0, 200)); } catch {}
      return { ok: true };
    },
    // Calls cb(module) once a matching module exists. Returns a cancel function.
    // Gives up after `timeout` ms (calling onFail, if given).
    waitFor(f, cb, timeout = 60000, onFail) {
      // One shared 1 s timer for every plugin that is waiting for a Discord module (each check walks all modules, so they must not each run their own).
      if (cur) { cb = timed(cur, cb); if (onFail) onFail = timed(cur, onFail); }
      const w = { f, cb, onFail, t0: Date.now(), timeout };
      waiters.add(w);
      if (!waitT) waitT = _si.call(window, () => {
        for (const x of [...waiters]) {
          let m; try { m = x.f === isDispatcher ? dispatcher() : find(x.f); } catch {}
          if (m) { waiters.delete(x); try { x.cb(m); } catch (e) { console.warn('[twilight] waitFor', e); } }
          else if (Date.now() - x.t0 > x.timeout) { waiters.delete(x); try { x.onFail?.(); } catch {} }
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
      window.Twilight.debug?.refresh?.();
    },
    suggestLite(why) { console.warn(`[twilight] ${why}`); try { this.notify('Discord is stuttering', 'Try Tools > Housekeeping > Ultra lightweight mode (' + why + ')', 8000, 'warn'); } catch {} },
    scoped, cost, timed, every: (name, ms, f) => { const id = _si.call(window, timed(name, f), ms); return () => clearInterval(id); },
    definePlugin(p) {
      const was = plugins.get(p.name); if (was?.lazy) p.wasLazy = true; // a switched-off plugin's real code arriving (see loadPlugin)
      plugins.set(p.name, p);
      return p;
    },
    // Plugins that are switched off are not part of the start-up bundle (1.23.0): twilight.js sends a small stand-in with the name and
    // description, and the real code is fetched from the mod folder the moment you switch it on. Resolves with the real plugin.
    async loadPlugin(name) {
      const p = plugins.get(name); if (!p?.lazy) return p;
      const r = await this.cmd({ type: 'pluginSrc', file: p.lazy }, 8000);
      if (!r?.code) throw new Error('could not read ' + p.lazy + '.js');
      try { (0, eval)(`try{\n${r.code}\n}catch(e){console.error("[twilight] plugin ${p.lazy}",e)}\n//# sourceURL=twilight/${p.lazy}.js`); } catch (e) { throw new Error('plugin code failed: ' + (e.message || e)); }
      const real = plugins.get(name); if (!real || real.lazy) throw new Error(p.lazy + '.js did not define ' + name);
      try { this.debug.sizes[name] = r.code.length; } catch {}
      return real;
    },
    // Bigger, rarely used parts of a plugin (assets/<name>.js, one JavaScript expression), loaded on first use and kept.
    asset(name) {
      return (assetP[name] ||= this.cmd({ type: 'asset', name }, 10000).then(r => {
        if (!r?.code) throw new Error('asset ' + name + ' missing');
        return (0, eval)(`(${r.code}\n)\n//# sourceURL=twilight/assets/${name}.js`);
      }).catch(e => { delete assetP[name]; throw e; }));
    },
    // "Make it your own" (menu): your own name, logo and accent for everything Twilight shows. Falls back to Twilight's own.
    brand() { const b = ls.get('brand', null) || {}; return { name: String(b.name || '').trim().slice(0, 24) || 'Twilight', logo: typeof b.logo === 'string' && b.logo.startsWith('data:image/') ? b.logo : null, accent: /^#[0-9a-f]{6}$/i.test(b.accent || '') ? b.accent : null, channel: b.channel !== false }; },
    info: () => (grab(), { chunk: CHUNK, ready: !!wreq, modules: wreq ? Object.keys(wreq.c).length : 0, stores: stores.size }),
    // The little "loaded" popup. Title, text, time, colour and on/off are editable in the menu (Notify tab).
    startupDefaults: { on: true, title: '{name}-Cord', msg: 'Loaded · v{version} · {plugins} plugins', ms: 4000, type: 'success' },
    startupPopup(version, force) {
      const c = { ...this.startupDefaults, ...ls.get('startup', {}) };
      if (!c.on && !force) return;
      const n = [...plugins.keys()].filter(k => !isOff(k)).length, fill = t => String(t).replace(/\{version\}/g, version || '').replace(/\{plugins\}/g, n).replace(/\{name\}/g, this.brand().name).replace(/\{time\}/g, new Date().toLocaleTimeString([], { hour12: false }));
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
        window.Twilight.version = opts.version; // set before plugins start so they can show it
        plugins.forEach(p => { if (!isOff(p.name) && !(ls.get('lite', false) && p.heavy)) { const t1 = performance.now(); try { cur = p.name; p.start?.(); } catch (e) { console.error('[twilight]', p.name, e); } finally { cur = null; slot(p.name).start = performance.now() - t1; } } });
        cost.start = performance.now() - t0;
        // Start-up screen log: how many plugins started, then the moment Discord's connection is up.
        try {
          const n = [...plugins.keys()].filter(k => !isOff(k)).length;
          window.Twilight.cmd({ type: 'boot', step: `${n} plugins started (${cost.start.toFixed(0)} ms)` }, 1500);
          const undo = window.Twilight.onFlux({ CONNECTION_OPEN: () => { window.Twilight.cmd({ type: 'boot', step: 'connected, drawing discord' }, 1500); try { undo(); } catch {} } }, 'core');
        } catch {}
        // Slim Discord: trim memory once Discord has been in the background (minimised, covered or in the tray) for a minute.
        // Uses Discord's own purgeMemory. No timer while Discord is on screen. Measured: about 20 MB back each time.
        let trimT = 0;
        document.addEventListener('visibilitychange', () => {
          clearTimeout(trimT);
          if (document.hidden && ls.get('slimTrim', false)) trimT = setTimeout(() => { try { window.DiscordNative?.processUtils?.purgeMemory?.(); cost.trims = (cost.trims || 0) + 1; } catch {} }, 60000);
        });
        // "Trim now" (menu > Discord > Performance): the same trim straight away, measured. RAM of all of Discord's processes before and
        // a few seconds after, so the menu can say how much came back.
        window.Twilight.trimNow = async () => {
          const ram = async () => { const m = await window.Twilight.cmd({ type: 'metrics' }, 30000); return m?.apps?.[m.self]?.ramMB ?? null; };
          const before = await ram(); try { window.DiscordNative?.processUtils?.purgeMemory?.(); cost.trims = (cost.trims || 0) + 1; } catch {}
          await new Promise(r => _st(r, 5000)); const after = await ram();
          const freed = before != null && after != null ? Math.max(0, Math.round(before - after)) : null; cost.trimFreed = (cost.trimFreed || 0) + (freed || 0);
          return { before, after, freed };
        };
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
