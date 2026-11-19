// Tools > "Capture Discord map": copies a report of what this Discord build looks like (class names, stores, event names, colour variables)
// so Twilight-Cord can be built against the real thing instead of guesses. It contains NO message text, names or IDs.
Twilight.definePlugin({
  name: 'Probe',
  devOnly: true, // Off until switched on in the menu: it walks every Discord module 45 s after launch and every 30 min.
  vs: 'Nothing: Discord gives you no map of its own internals',
  desc: 'Tools: capture a map of Discord\'s internals (no chat content) to build against',
  actionOnly: true,
  actions: [{
    label: 'Write reports now (probe.json + log.txt)', sub: 'Probe',
    run() { const p = Twilight.plugins.get('Probe'); p.report(true).then(r => Twilight.notify('Reports', r ? 'Written to the twilight-cord/reports folder' : 'Could not write', 4000, r ? 'success' : 'error')); },
  }, {
    label: 'Capture Discord map (copies a report)', sub: 'Probe',
    run() {
      const T = Twilight, p = T.plugins.get('Probe');
      const r = p.capture(), text = JSON.stringify(r);
      T.log(`Probe: map captured (${Math.round(text.length / 1024)} KB)`);
      Twilight.copyText(text).then(() => T.notify('Discord map', `Copied ${Math.round(text.length / 1024)} KB. Paste it where you need it`, 4500, 'success'), () => T.notify('Discord map', 'Could not copy', 4000, 'error'));
    },
  }],
  // Console tab: Twilight.plugins.get('Probe').grep('GUILD_STICKERS') lists functions whose code mentions a word (names + a short snippet).
  grep(word) {
    const out = [], w = String(word).toLowerCase();
    Twilight.findAll(m => {
      if (typeof m !== 'object' && typeof m !== 'function') return false;
      for (const k of Object.keys(m)) { try { if (typeof m[k] === 'function' && String(m[k]).toLowerCase().includes(w)) { out.push(`${k}: ${String(m[k]).slice(0, 160).replace(/\s+/g, ' ')}`); } } catch {} }
      return false;
    }, 99999);
    return out.slice(0, 40);
  },
  // Writes reports/probe.json (map + self-test) and reports/log.txt (warnings, errors, Twilight lines; no chat text) beside the mod.
  async report(full) {
    const T = Twilight; let ok = true;
    try {
      const probe = this.capture(); probe.selfTest = await this.selfTest(); probe.cost = T.cost || null;
      probe.settingsFile = T.ls?.file?.() || null;
      const r = await T.cmd({ type: 'report', name: 'probe.json', text: JSON.stringify(probe, null, 1) }, 8000); ok = ok && !!r?.ok;
    } catch (e) { ok = false; T.log('Probe: report failed ' + (e?.message || e)); }
    try {
      const lines = T.logs.filter(l => l.tw || l.level === 'warn' || l.level === 'error').slice(-300).map(l => `${new Date(l.t).toISOString().slice(11, 19)} ${l.level} ${l.text}`);
      const r = await T.cmd({ type: 'report', name: 'log.txt', text: lines.join('\n') }, 8000); ok = ok && !!r?.ok;
    } catch { ok = false; }
    return ok;
  },
  async selfTest() {
    const T = Twilight, out = {}, t = async (k, f) => { try { const v = await f(); out[k] = v === false ? 'FAIL' : v === undefined ? 'ok' : v; } catch (e) { out[k] = 'ERROR ' + (e?.message || e); } };
    await t('dispatcher', () => !!T.dispatcher());
    for (const n of ['UserStore', 'ChannelStore', 'GuildStore', 'SelectedGuildStore', 'SelectedChannelStore', 'PermissionStore', 'RelationshipStore', 'UserGuildSettingsStore', 'ReadStateStore', 'StickersStore', 'EmojiStore', 'MessageStore']) await t('store:' + n, () => !!T.findStore(n));
    await t('rest', () => !!T.find(m => typeof m?.post === 'function' && typeof m.get === 'function' && typeof m.getAPIBaseURL === 'function'));
    await t('ignoredIds', () => { const r = T.findStore('RelationshipStore'); return r ? ['getIgnoredIDs', 'getFriendIDs', 'getRelationships', 'isIgnored'].filter(k => typeof r[k] === 'function').join(',') || 'FAIL' : 'FAIL'; });
    for (const [k, s] of Object.entries({ textbox: '[role="textbox"][contenteditable="true"]', guilds: '[class*="guilds_"]', channelList: '[data-list-id="channels"]', userSettings: '[role="tablist"]' })) await t('dom:' + k, () => !!document.querySelector(s));
    await t('plugins', () => [...T.plugins.keys()].length);
    await t('fn:unignoreUser', () => !!T.findByProps('unignoreUser'));
    await t('fn:removeRelationship', () => !!T.findByProps('removeRelationship'));
    await t('fn:openUserProfileModal', () => !!T.findByProps('openUserProfileModal'));
    await t('fn:transitionTo', () => !!T.findByProps('transitionTo'));
    await t('store:PresenceStore', () => !!T.findStore('PresenceStore'));
    await t('store:VoiceStateStore', () => !!T.findStore('VoiceStateStore'));
    await t('messageStore.getMessages', () => typeof T.findStore('MessageStore')?.getMessages === 'function');
    await t('dom:messageLi', () => !!document.querySelector('li[id^="chat-messages-"]'));
    await t('dom:video', () => document.querySelectorAll('video').length);
    await t('sandbox', async () => await T.plugins.get('Generated')?.sandboxTest?.() ?? 'plugin off');
    await t('translate', async () => { const r = await T.cmd({ type: 'translate', text: 'hola mundo', to: 'en' }, 12000); return r && !r.error ? r : 'FAIL ' + JSON.stringify(r); });
    await t('lite', () => Twilight.lite() ? 'ON' : 'off');
    await t('popouts', async () => JSON.stringify(await Twilight.cmd({ type: 'status' })));
    await t('clonerTest', () => T.ls.get('clonerPassedV2', false) ? 'passed earlier' : 'not passed yet (see reports/cloner.log)');
    await t('cost', () => Object.fromEntries(Object.entries(T.cost.by).map(([k, v]) => [k, `${v.ms.toFixed(1)}ms/${v.n} worst ${v.max.toFixed(0)}`])));
    await t('spitGif', async () => T.plugins.get('Spit')?.selfTest ? await T.plugins.get('Spit').selfTest() : 'no selfTest');
    await t('metrics', async () => { const m = await T.cmd({ type: 'metrics' }, 30000); return m && !m.error ? { keys: Object.keys(m).slice(0, 8), sample: JSON.stringify(m).slice(0, 300) } : 'FAIL ' + JSON.stringify(m).slice(0, 200); });
    await t('blurSupport', () => CSS.supports('backdrop-filter', 'blur(2px)'));
    return out;
  },
  capture() {
    const T = Twilight, cap = (sel, depth = 3) => {
      const e = document.querySelector(sel); if (!e) return null;
      const d = n => ({ tag: n.tagName.toLowerCase(), role: n.getAttribute('role') || undefined, cls: String(n.className || '').slice(0, 120) || undefined, list: n.getAttribute('data-list-id') || undefined });
      const chain = []; for (let n = e, i = 0; n && i < depth; n = n.parentElement, i++) chain.push(d(n));
      return { found: d(e), parents: chain.slice(1), kids: [...e.children].slice(0, 6).map(d) };
    };
    const SEL = { sidebar: '[class*="sidebar_"]', channelList: '[data-list-id="channels"]', chat: '[class*="chat_"]', messagesList: '[data-list-id="chat-messages"]', message: 'li[id^="chat-messages-"]',
      textbox: '[role="textbox"][contenteditable="true"]', members: '[class*="membersWrap"]', userPanel: '[class*="panels"]', guilds: '[class*="guilds_"]', titlebar: '[class*="titleBar"], [class*="bar_"]',
      settingsTabs: '[role="tablist"]', emoji: 'img[class*="emoji"]', mention: '[class*="mention"]', avatar: 'img[class*="avatar"]', typing: '[class*="typing"]' };
    const dom = {}; for (const [k, s] of Object.entries(SEL)) { try { dom[k] = cap(s); } catch { dom[k] = 'error'; } }
    const stores = [], seen = new Set();
    T.findAll(m => { try { const n = m?.getName?.(); if (typeof n === 'string' && !seen.has(n)) { seen.add(n); stores.push(n); } } catch {} return false; }, 99999);
    const KEY = ['UserStore', 'ChannelStore', 'GuildStore', 'SelectedGuildStore', 'SelectedChannelStore', 'PermissionStore', 'RelationshipStore', 'UserGuildSettingsStore', 'ReadStateStore', 'StickersStore', 'EmojiStore', 'MessageStore'];
    const storeApi = {}; for (const n of KEY) { const s = T.findStore(n); if (s) storeApi[n] = Object.getOwnPropertyNames(Object.getPrototypeOf(s)).filter(k => typeof s[k] === 'function').slice(0, 60); }
    const finders = {
      dispatcher: !!T.dispatcher(),
      rest: T.findAll(m => typeof m?.post === 'function' && typeof m.get === 'function' && typeof m.getAPIBaseURL === 'function', 3).map(h => Object.keys(h.x).slice(0, 12)),
      uploadLike: T.findAll(m => Object.keys(m).some(k => /(emoji|sticker)/i.test(k) && /(upload|create|add)/i.test(k)), 6).map(h => Object.keys(h.x).filter(k => /(emoji|sticker|upload|create)/i.test(k)).slice(0, 8)),
    };
    const vars = new Set();
    for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch { continue; } for (const r of rs || []) { const st = r.style; if (!st) continue; for (let i = 0; i < st.length; i++) if (/^--(background|bg|chat|text|interactive|header|channel|border)/.test(st[i])) vars.add(st[i]); } }
    return { at: new Date().toISOString(), version: T.debug.version, ua: navigator.userAgent.replace(/.*Electron\//, 'Electron/'), modules: T.info().modules,
      note: 'class names, store/function names and event names only; no message text, usernames or IDs',
      dom, stores: stores.sort(), storeApi, finders, actionTypes: [...(T.actionLog?.entries() || [])].sort((a, b) => b[1] - a[1]).slice(0, 250).map(([t, n]) => `${t} x${n}`), cssVars: [...vars].sort().slice(0, 400) };
  },
  start() {
    // Counts the names of events Discord fires (a few hundred names at most). Nothing else is recorded.
    Twilight.actionLog = new Map();
    this.cancel = Twilight.waitFor(Twilight.isDispatcher, d => {
      this.d = d;
      this.icpt = a => { const t = a?.type; if (t) Twilight.actionLog.set(t, (Twilight.actionLog.get(t) || 0) + 1); return false; };
      try { d.addInterceptor?.(this.icpt); } catch {}
    }, 60000);
    // Report automatically ~45 s after load and then every 30 min (not in lightweight mode) (cheap: one small file write).
    this.t1 = setTimeout(() => { if (!Twilight.lite()) this.report(); }, 45000);
    this.t2 = setInterval(() => { if (!document.hidden && !Twilight.lite()) this.report(); }, 1800000);
  },
  stop() {
    this.cancel?.(); clearTimeout(this.t1); clearInterval(this.t2);
    try { const i = this.d?._interceptors, k = i?.indexOf(this.icpt); if (k >= 0) i.splice(k, 1); } catch {}
  },
});
