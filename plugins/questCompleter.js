// Quest completer: finishes Discord Quests for you (video quests, "play for N minutes" quests and activity quests).
// Faking quest progress is against Discord's rules and can get an account banned, so this plugin is
// off until you switch it on. No timers while idle: it reacts to Discord's own
// "quests loaded / quest accepted" events, works 2 video quests and 1 game quest at a time (quests already started first, then the
// quickest), and stops as soon as you switch it off. Rewards are never claimed behind your back: Discord asks a captcha for claims,
// so the Quests tab has a Claim button per finished quest (and Claim all, one at a time) that opens Discord's own claim window.
// Not supported: quests that need a game's own achievements, and stream quests (they need a real Go Live and a second person in the call).
// Quest data shapes and task-key rules follow what the Orion Vencord plugin (nyxxbit, MIT) documents about Discord's quest data; the code here is our own.
Twilight.definePlugin({
  name: 'QuestCompleter',
  page: 'Quests', // its own top tab in the menu
  devOnly: true, // starts switched off; turning it on in the menu is remembered
  heavy: true,   // paused in lightweight mode
  vs: 'Quests have to be done by hand',
  desc: 'Completes accepted Discord Quests by itself (against Discord’s rules: your account can be banned)',
  options: [
    { key: 'auto', label: 'Run by itself when quests load or you accept one', def: true },
    { key: 'enroll', label: 'Also accept new quests automatically', def: true },
    { key: 'hideManual', label: 'Leave "do these yourself" quests out of the top-bar counter', def: false },
    { key: 'prefer', label: 'Prioritise', def: 'orbs', choices: [['orbs', 'Orb quests first'], ['other', 'Other rewards first (decorations, items, codes)'], ['any', 'No preference']] },
  ],
  patch: new Map(),
  state: { running: false, stop: false, log: [], cur: {}, queue: {}, done: [] }, // cur: each quest running right now; queue: waiting; done: finished this run
  say(msg) {
    const s = this.state; s.log.push(new Date().toLocaleTimeString([], { hour12: false }) + ' ' + String(msg).slice(0, 420)); if (s.log.length > 30) s.log.shift(); this.paintLog();
    clearTimeout(this._w); this._w = setTimeout(() => { try { Twilight.cmd({ type: 'report', name: this.logName(), text: s.log.join('\n') }); } catch {} }, 400); // a stuck run still shows up in reports\quests.txt
  },
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  // reports\quests.txt for Discord Stable, quests-ptb.txt / quests-canary.txt for the others (both can be open at once)
  logName() { const c = String(window.GLOBAL_ENV?.RELEASE_CHANNEL || 'stable').toLowerCase(); return c === 'stable' ? 'quests.txt' : `quests-${c.replace(/[^a-z]/g, '')}.txt`; },
  // Redraw the Quests page only when its lists change (a quest starts / ends / is claimed), at most once per 400 ms and only while it is on
  // screen. Progress and log lines are updated in place (paint / paintLog), so the list never flickers or reloads its pictures.
  refresh() { clearTimeout(this._rf); this._rf = setTimeout(() => { this.paintCounter(); if (Twilight.debug?.page?.() === 'Quests') Twilight.debug.refresh(); }, 400); },
  paintLog() {
    const box = document.querySelector('[data-twq-log]'); if (!box) return;
    const { ui } = Twilight; box.replaceChildren(...this.state.log.slice(-12).reverse().map(l => ui.info('', l)));
  },
  // Progress of one running quest: {name, type, target, done (seconds at time `at`)}. The tab moves the bar on by real time between updates.
  // percent and time left for a running quest, moved on by real time since the last update from Discord
  runInfo(c) {
    const d = Math.min(c.target, c.done + (Date.now() - c.at) / 1000), sec = Math.max(0, Math.round(c.target - d)), m = Math.floor(sec / 60), pct = Math.floor(d / (c.target || 1) * 100);
    return { pct, text: `${pct}% · ${m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}:${String(sec % 60).padStart(2, '0')}`} left` };
  },
  // once a second: change only the bar and the time, never rebuild the list (rebuilding made it flicker and reload the pictures)
  paint() {
    for (const el of document.querySelectorAll('[data-twq]')) {
      const c = this.state.cur[el.dataset.twq]; if (!c) continue;
      const i = this.runInfo(c), f = el.querySelector('.twq-fill'), t = el.querySelector('.twq-right');
      if (f) f.style.width = i.pct + '%'; if (t && t.textContent !== i.text) t.textContent = i.text;
    }
  },
  track(q, t, done) { const c = this.state.cur[q.id]; this.state.cur[q.id] = { name: this.nameOf(q), type: t.type, target: t.target, done: Math.min(t.target, done), at: Date.now(), since: c?.since || Date.now(), art: this.art(q) }; c ? this.paint() : this.refresh(); },
  limit(p, ms, what) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + ' took longer than ' + ms / 1000 + 's')), ms))]); },
  // Discord's own request function, with every reply put in one shape {status, body}. The first reply's real shape goes in the log.
  api() {
    const A = Twilight.rest(), me = this; if (!A) throw new Error('Discord request module not found');
    const norm = async p => {
      const r = await p;
      if (!me._shape) { me._shape = 1; me.say('REST reply: ' + (r && typeof r === 'object' ? `keys=${Object.keys(r).slice(0, 8).join(',')} status=${r.status}` : typeof r)); }
      return r && typeof r === 'object' && 'body' in r ? r : { status: r?.status, body: r };
    };
    // Rate limited (HTTP 429): wait as long as Discord says (plus a little) and try again, up to 3 times, instead of failing the quest.
    const retry = async (fn, o) => { for (let i = 0; ; i++) { try { return await norm(fn(o)); } catch (e) {
      if (e?.status !== 429 || i >= 3 || me.state.stop) throw e;
      const wait = Math.min(60, Number(e?.body?.retry_after) || 5) * 1000 + 1500 + Math.random() * 1500;
      me.say(`Rate limited by Discord: waiting ${Math.round(wait / 1000)} s`); await me.sleep(wait);
    } } };
    return { get: o => retry(x => A.get(x), o), post: o => retry(x => A.post(x), o) };
  },
  // Discord's own quest code (found by shape): D = quest actions (Oy accept, Oq claim), R = reward type checks, B = the claim windows.
  disc() {
    if (this._d?.D && this._d.R && this._d.B) return this._d;
    const nope = '__twq' + Math.random().toString(36).slice(2), F = f => Twilight.find(x => x[nope] === undefined && f(x));
    return this._d = {
      D: F(x => typeof x.Oy === 'function' && typeof x.Oq === 'function' && x.WM && typeof x.WM === 'object'),
      R: F(x => ['ks', 'K9', 'tU', 'HG'].every(k => typeof x[k] === 'function')),
      B: F(x => ['hJ', 'rx', 'cf', 'Df'].every(k => typeof x[k] === 'function')),
    };
  },
  // ---- reading Discord's quest data ----
  // Discord's quest store is called QuestStore (older builds: QuestsStore). We also keep the quests Discord hands over in its own
  // "quests loaded" event, so a wrong store name cannot leave us with an empty list.
  // 1.23.0: no module-walk fallback any more. Discord makes its quest store a few seconds after start, and until then a walk cannot find it
  // either (it cost ~43 ms on the first counter paint, measured); the quests from Discord's own "quests loaded" event cover that gap.
  store() { const T = Twilight; return T.findStore('QuestStore') || T.findStore('QuestsStore'); },
  list(x) { return !x ? [] : Array.isArray(x) ? x : typeof x.values === 'function' ? [...x.values()] : Object.values(x); },
  quests() {
    const m = new Map();
    // the same quest can come from several places; keep the one that is furthest along (done > accepted > not accepted), newest source on a tie
    const rank = x => (x.userStatus?.claimedAt ? 4 : 0) + (x.userStatus?.completedAt ? 2 : 0) + (x.userStatus?.enrolledAt ? 1 : 0);
    for (const src of [this.list(this.store()?.quests), this.evt || [], this.remote || []]) for (const x of src) if (x?.id && !(m.has(x.id) && rank(m.get(x.id)) > rank(x))) m.set(x.id, x);
    // what we did ourselves (accepted / finished) before Discord's list knows; only filled-in fields count, so it can never undo a claim
    for (const [id, us] of this.patch) { const q = m.get(id); if (q) m.set(id, { ...q, userStatus: { ...q.userStatus, ...Object.fromEntries(Object.entries(us || {}).filter(([, v]) => v != null)) } }); }
    return [...m.values()].sort((a, b) => (Date.parse(a.config?.expiresAt) || 9e15) - (Date.parse(b.config?.expiresAt) || 9e15)); // soonest expiry first
  },
  camel(v) { return Array.isArray(v) ? v.map(x => this.camel(x)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k.replace(/_([a-z])/g, (m, c) => c.toUpperCase()), this.camel(x)])) : v; },
  async load(force) {
    if (!force && this.remoteAt && Date.now() - this.remoteAt < 60000) return;
    const camel = v => this.camel(v);
    try {
      const r = await this.limit(this.api().get({ url: '/quests/@me' }), 12000, 'Discord quest list'), b = r?.body, list = Array.isArray(b) ? b : b?.quests || [];
      this.remote = camel(list).filter(x => x?.id && x.config); this.remoteAt = Date.now();
      this.say(`Asked Discord for quests: HTTP ${r?.status ?? '?'}, ${this.remote.length} quests${b && !Array.isArray(b) ? ' (fields: ' + Object.keys(b).slice(0, 5).join(',') + ')' : ''}`);
    } catch (e) { this.say('Could not load quests: ' + String(e?.body?.message || e?.message || e).slice(0, 80)); }
  },
  // The list can arrive after we start: ask Discord's own code for it and wait a few seconds.
  async waitList() {
    if (this.quests().length) return;
    try { Twilight.findByProps('fetchCurrentQuests')?.fetchCurrentQuests?.(); } catch {}
    for (let i = 0; i < 12 && !this.quests().length && !this.state.stop; i++) await this.sleep(500);
  },
  entries(t) { return !t ? [] : t instanceof Map ? [...t.entries()] : typeof t === 'object' ? Object.entries(t) : []; },
  // taskConfigV2 is the current one; the old taskConfig only when V2 has no tasks.
  cfg(q) { const c = q.config || {}, v2 = c.taskConfigV2, old = c.taskConfig; return this.entries(v2?.tasks).length ? v2 : this.entries(old?.tasks).length ? old : (v2 || old || {}); },
  // Which task of the quest we drive: exact keys first, never console-only ones; achievements and streams cannot be done from here.
  taskOf(q) {
    const ents = this.entries(this.cfg(q).tasks), keys = ents.map(e => e[0]), has = k => keys.includes(k);
    const key = has('PLAY_ACTIVITY') ? 'PLAY_ACTIVITY' : has('WATCH_VIDEO') ? 'WATCH_VIDEO' : keys.find(k => k.includes('VIDEO'))
      || (has('PLAY_ON_DESKTOP') ? 'PLAY_ON_DESKTOP' : keys.find(k => k.startsWith('PLAY') && k !== 'PLAY_ON_XBOX' && k !== 'PLAY_ON_PLAYSTATION' && k !== 'PLAY_ACTIVITY'));
    if (!key) return null;
    const t = ents.find(e => e[0] === key)[1] || {};
    return { type: key, target: Number(t.target) || 0, appId: t.applications?.[0]?.id || q.config?.application?.id };
  },
  // Picture of a quest (Discord keeps them at cdn.discordapp.com/quests/<quest id>/<file>).
  art(q) {
    const a = q.config?.assets || {}, f = a.gameTile || a.gameTileLight || a.questBarHero || a.hero || a.logotype || a.heroVideo;
    return !f || /\.(mp4|webm)$/i.test(f) ? null : /^https?:/.test(f) ? f : f.startsWith('quests/') ? 'https://cdn.discordapp.com/' + f : `https://cdn.discordapp.com/quests/${q.id}/${f}`;
  },
  nameOf(q) { return q.config?.messages?.questName || q.config?.application?.name || String(q.id); },
  // Rewards. Orbs are claimed for you; codes, in-game items and anything else only notify you (you pick those up in Discord's Quests page).
  // Discord ships a sealed attribution value with every quest; the real client hands it back unchanged when accepting or claiming.
  sealed(q) { return q.trafficMetadataSealed ?? q.traffic_metadata_sealed ?? null; },
  rewards(q) { const r = q.config?.rewardsConfig; return this.list(r?.rewards || r?.rewardsConfig?.rewards); },
  rewardName(r) { return r?.messages?.name || r?.messages?.nameWithArticle || r?.skuName || (r?.orbQuantity ? r.orbQuantity + ' Orbs' : 'a reward'); },
  isOrbs(r) { return r?.type === 4 || r?.orbQuantity > 0 || /\borbs?\b/i.test(this.rewardName(r)); },
  unclaimed(q) { return this.done(q) && !q.userStatus?.claimedAt && !this.expired(q); },
  // Finished quests with a reward still to pick up: tell you once per quest (Twilight never claims by itself; Discord wants a captcha).
  notifyRewards() {
    const T = Twilight; let seen; try { seen = new Set(T.ls.get('questNotified') || []); } catch { seen = new Set(); }
    const fresh = this.quests().filter(q => this.unclaimed(q) && !seen.has(q.id));
    if (!fresh.length) return;
    for (const q of fresh) { seen.add(q.id); this.say('Reward waiting: ' + this.rewardText(q) + ' (' + this.nameOf(q) + ')'); }
    try { T.ls.set('questNotified', [...seen].slice(-200)); } catch {}
    T.notify(fresh.length === 1 ? 'Reward ready to claim' : fresh.length + ' rewards ready to claim', fresh.length === 1 ? this.rewardText(fresh[0]) + ' from ' + this.nameOf(fresh[0]) + ': Twilight menu > Quests' : 'Twilight menu > Quests > Claim all', 10000, 'info');
  },
  rewardText(q) { return this.rewards(q).map(r => this.rewardName(r)).join(', ') || 'reward'; },
  // Opens Discord's own claim window for one quest, picked the same way Discord's Claim button picks it. Discord then asks its captcha.
  openClaim(id) {
    const { R, B } = this.disc(), q = this.store()?.getQuest?.(id), me = Twilight.findStore('UserStore')?.getCurrentUser?.();
    if (!q) throw new Error('Discord has not loaded this quest');
    if (!R || !B) throw new Error('Discord claim window not found');
    if (!me?.hasVerifiedEmailOrPhone?.() || (R.ks(q.config) && !me.verified)) throw new Error('verify your email in Discord first');
    const LOC = 11; // Discord's "quest home (desktop)"
    if (R.K9(q.config)) throw new Error('Nitro-trial rewards: claim this one in Discord');
    if (R.tU(q.config)) B.hJ(q, LOC, LOC);            // avatar decorations and other collectibles
    else if (R.HG(q.config)) B.cf(q, LOC, LOC);       // in-game items
    else if (R.ks(q.config)) B.Df(q, LOC, LOC);       // Orbs
    else B.rx({ quest: q, sourceQuestContent: LOC }); // codes and the rest
  },
  // One claim from start to end: open Discord's window, then wait until Discord says claimed, says it failed, or you close the window.
  async claim(id) {
    const s = this.state, q0 = this.quests().find(x => x.id === id); if (!q0 || s.claiming) return 'busy';
    s.claiming = id; this.refresh();
    let failed = null; const off = Twilight.onFlux({ QUESTS_CLAIM_REWARD_FAILURE: d => { if (d?.questId === id) failed = d.error; } }, 'QuestCompleter');
    const dialog = () => !!document.querySelector('[role="dialog"], [class*="captcha" i] iframe, iframe[src*="hcaptcha"]');
    let res = 'closed';
    try {
      try { Twilight.debug?.toggle?.(false); } catch {} // the Twilight menu sits above everything: get it out of the way of Discord's window
      this.openClaim(id); this.say('Claim window opened: ' + this.nameOf(q0));
      for (let i = 0, gone = 0; i < 600 && !s.stopClaim; i++) {       // up to 10 minutes for the captcha
        await this.sleep(1000);
        if (this.store()?.getQuest?.(id)?.userStatus?.claimedAt) { res = 'claimed'; break; }
        if (failed) { res = 'failed'; break; }
        gone = i > 2 && !dialog() ? gone + 1 : 0; if (gone >= 4) break; // window closed without a claim
      }
    } catch (e) { res = 'failed'; failed = e; } finally { off?.(); s.claiming = null; }
    if (res === 'claimed') { this.patch.set(id, { ...(this.patch.get(id) || {}), claimedAt: this.store()?.getQuest?.(id)?.userStatus?.claimedAt || new Date().toISOString() }); this.say('Claimed: ' + this.rewardText(q0) + ' (' + this.nameOf(q0) + ')'); Twilight.notify('Reward claimed', this.rewardText(q0), 5000, 'success'); }
    else if (res === 'failed') this.say('Claim failed: ' + this.nameOf(q0) + ': ' + String(failed?.message || failed?.body?.message || JSON.stringify(failed) || '').slice(0, 120));
    else this.say('Claim window closed without claiming: ' + this.nameOf(q0));
    this.refresh();
    return res;
  },
  // Claim all: one window at a time; the next opens only after the last one is claimed (or failed). Closing a window stops the rest.
  async claimAll() {
    const s = this.state; if (s.claimAllRun) return; s.claimAllRun = true; s.stopClaim = false;
    try {
      const ids = this.quests().filter(q => this.unclaimed(q)).map(q => q.id); let n = 0;
      for (const id of ids) {
        if (s.stopClaim) break;
        const r = await this.claim(id); if (r === 'claimed') n++;
        if (r === 'closed') { this.say('Claim all stopped: a claim window was closed'); break; }
        await this.sleep(1500);
      }
      this.say(`Claim all finished: ${n} of ${ids.length} claimed`);
    } finally { s.claimAllRun = false; this.refresh(); }
  },
  done(q) { return !!q.userStatus?.completedAt; },
  expired(q) { const e = Date.parse(q.config?.expiresAt || ''); return e && e < Date.now(); },
  progress(q, type) { const p = q.userStatus?.progress, e = p instanceof Map ? p.get(type) : p?.[type]; return Number(e?.value || 0); },
  // Order of work: quests with progress already made come first; then the reward kind you prefer (Prioritise option); then the least time left.
  left(q) { const t = this.taskOf(q); return Math.max(0, t.target - this.progress(q, t.type)); },
  hasOrbs(q) { return this.rewards(q).some(r => this.isOrbs(r)); },
  prefRank(q) { const p = Twilight.opt('QuestCompleter', 'prefer', 'orbs'); return p === 'any' ? 0 : (p === 'orbs') === this.hasOrbs(q) ? 0 : 1; },
  byOrder(a, b) { const stage = q => this.progress(q, this.taskOf(q).type) > 0 ? 0 : 1; return stage(a) - stage(b) || this.prefRank(a) - this.prefRank(b) || this.left(a) - this.left(b); },
  todo() { return this.quests().filter(q => q.userStatus?.enrolledAt && !this.done(q) && !this.expired(q) && this.taskOf(q)).sort((a, b) => this.byOrder(a, b)); },
  fresh() { return this.quests().filter(q => !q.userStatus?.enrolledAt && !this.expired(q) && this.taskOf(q)).sort((a, b) => this.byOrder(a, b)); },
  // ---- the work ----
  async enroll(q) {
    const { D } = this.disc(); let us = null;
    if (D) { // Discord's own accept (sends the same fields the Accept button does, and updates Discord's list)
      const r = await D.Oy(q.id, { questContent: 11, questContentCTA: 'ACCEPT_QUEST', sourceQuestContent: 11 });
      if (r?.type !== D.WM?.SUCCESS && r?.type !== 'success') throw new Error('Discord did not accept it (' + (r?.type ?? '?') + ')');
      us = this.store()?.getQuest?.(q.id)?.userStatus;
    } else {
      const r = await this.api().post({ url: `/quests/${q.id}/enroll`, body: { location: 11, is_targeted: false, metadata_sealed: null, traffic_metadata_sealed: this.sealed(q) } }), b = r?.body;
      us = this.camel(b?.userStatus || b?.user_status || b);
    }
    this.patch.set(q.id, us?.enrolledAt ? us : { enrolledAt: new Date().toISOString(), progress: {} });
    this.say('Accepted: ' + this.nameOf(q)); this.refresh();
    const t = this.taskOf(q); if (this.state.running && t) this.state.queue[q.id] = { name: this.nameOf(q), type: t.type, target: t.target, art: this.art(q) };
  },
  // Video quests: report progress the way Discord's player does, every 7-9.5 s, and never further than the real time spent on this quest
  // (Discord answers 400 to progress that runs ahead). Tested live: Discord confirms every step and marks the quest completed.
  async video(q, t) {
    let base = this.progress(q, t.type), cur = base; const start = Date.now();
    this.track(q, t, cur);
    while (cur < t.target && !this.state.stop) {
      await this.sleep(7000 + Math.random() * 2500); if (this.state.stop) break;
      cur = Math.min(t.target, base + (Date.now() - start) / 1000);
      const r = await this.api().post({ url: `/quests/${q.id}/video-progress`, body: { timestamp: Number(cur.toFixed(6)) } }), sv = r?.body?.progress?.[t.type]?.value;
      if (typeof sv === 'number' && sv > cur) { base += sv - cur; cur = Math.min(t.target, sv); } // Discord already had more
      this.track(q, t, cur);
      if (r?.body?.completed_at) return true;
    }
    if (this.state.stop) return false;
    const r = await this.api().post({ url: `/quests/${q.id}/video-progress`, body: { timestamp: t.target } }), sv = r?.body?.progress?.[t.type]?.value;
    if (r?.body?.completed_at || (typeof sv === 'number' && sv >= t.target)) return true;
    this.say(`Discord did not mark ${this.nameOf(q)} as finished: ${JSON.stringify(r?.body ?? null).slice(0, 160)}`);
    return false;
  },
  // Pretends a game is running. Several can run at once: one patch of Discord's running-games store serves all of them and is put back when the last one ends.
  addGame(ps, disp, game) {
    const g = this.games ||= [];
    if (!g.length) { this.realGames = { get: ps.getRunningGames, pid: ps.getGameForPID, was: ps.getRunningGames.call(ps) }; ps.getRunningGames = () => g; ps.getGameForPID = p => g.find(x => x.pid === p); }
    g.push(game);
    disp.dispatch({ type: 'RUNNING_GAMES_CHANGE', removed: g.length === 1 ? this.realGames.was : [], added: [game], games: [...g] });
    return () => {
      const i = g.indexOf(game); if (i >= 0) g.splice(i, 1);
      if (!g.length) { ps.getRunningGames = this.realGames.get; ps.getGameForPID = this.realGames.pid; }
      disp.dispatch({ type: 'RUNNING_GAMES_CHANGE', removed: [game], added: [], games: [...g] });
    };
  },
  // Quests that wait for Discord's own heartbeat (play a game): fake the game, then just wait for progress to reach the target.
  async heartbeatQuest(q, t) {
    const T = Twilight, appId = t.appId;
    const ps = T.findStore('RunningGameStore'), as = T.findStore('ApplicationStreamingStore'), disp = T.dispatcher();
    if (!disp) throw new Error('Discord dispatcher not found');
    const pid = Math.floor(Math.random() * 30000) + 1000; let undo = () => {};
    if (t.type === 'PLAY_ON_DESKTOP') {
      if (typeof DiscordNative === 'undefined') throw new Error('needs the desktop app');
      if (!ps) throw new Error('RunningGameStore not found');
      const r = await this.api().get({ url: `/applications/public?application_ids=${appId}` }), app = r?.body?.[0];
      const exe = app?.executables?.find(x => x.os === 'win32')?.name?.replace('>', '') || (app?.name || 'game') + '.exe';
      const game = { cmdLine: `C:\\Program Files\\${app?.name}\\${exe}`, exeName: exe, exePath: `c:/program files/${String(app?.name).toLowerCase()}/${exe}`, hidden: false, isLauncher: false, id: appId, name: app?.name, pid, pidPath: [pid], processName: app?.name, start: Date.now() };
      undo = this.addGame(ps, disp, game);
    }
    let done = () => {};
    try {
      await new Promise((res, rej) => {
        let off, to;
        const finish = (ok, err) => { clearTimeout(to); off?.(); this.state.stop || ok ? res() : rej(err); };
        off = T.onFlux({ QUESTS_SEND_HEARTBEAT_SUCCESS: d => {
          if (!d || (d.questId && d.questId !== q.id)) return;
          const u = d.userStatus || d, v = this.progress({ userStatus: u }, t.type);
          this.track(q, t, v);
          if (v >= t.target || u.completedAt) finish(true);
        } }, 'QuestCompleter');
        to = setTimeout(() => finish(false, new Error('timed out')), (t.target * 1.5 + 300) * 1000); // generous: the game heartbeat runs about once a minute
        const abort = () => finish(true); (this.aborts ||= new Set()).add(abort); done = () => this.aborts.delete(abort);
      });
    } finally { done(); undo(); }
    return !this.state.stop;
  },
  // Activity quests send heartbeats for a call: the stream key is call:<first DM>:<your user id> (or a voice channel of a server).
  streamKey() {
    const T = Twilight, me = T.findStore('UserStore')?.getCurrentUser?.()?.id; if (!me) return null;
    const dm = T.findStore('ChannelStore')?.getSortedPrivateChannels?.()?.[0]?.id;
    if (dm) return `call:${dm}:${me}`;
    const g = T.findStore('GuildChannelStore')?.getAllGuilds?.() || {};
    for (const x of Object.values(g)) { const c = x?.VOCAL?.[0]?.channel; if (c?.id) return `guild:${c.guild_id || x.id}:${c.id}:${me}`; }
    return null;
  },
  async activity(q, t) {
    const key = this.streamKey(); if (!key) throw new Error('no channel for the activity heartbeat (open any DM once)');
    const beat = { stream_key: key, application_id: String(t.appId || ''), terminal: false };
    let v = this.progress(q, t.type), stalled = 0;
    while (v < t.target && !this.state.stop) {
      const r = await this.api().post({ url: `/quests/${q.id}/heartbeat`, body: beat }), got = r?.body?.progress?.[t.type]?.value;
      if (typeof got === 'number') { v = got; stalled = 0; } else if (++stalled >= 3) throw new Error('Discord credited no progress');
      this.track(q, t, v);
      if (v >= t.target) break;
      await this.sleep(20000);
    }
    if (!this.state.stop) await this.api().post({ url: `/quests/${q.id}/heartbeat`, body: { ...beat, terminal: true } });
    return !this.state.stop;
  },
  async one(q) {
    const t = this.taskOf(q); delete this.state.queue[q.id]; this.track(q, t, this.progress(q, t.type)); this.say(`Starting: ${this.nameOf(q)} (${t.type}, ${Math.round(t.target / 60)} min)`);
    const ok = t.type.includes('VIDEO') ? await this.video(q, t) : t.type === 'PLAY_ACTIVITY' ? await this.activity(q, t) : await this.heartbeatQuest(q, t);
    delete this.state.cur[q.id]; this.refresh();
    if (ok) { this.patch.set(q.id, { ...(this.quests().find(x => x.id === q.id)?.userStatus || {}), completedAt: new Date().toISOString() }); this.state.done.unshift(this.nameOf(q)); this.state.done.length = Math.min(this.state.done.length, 8); this.say('Done: ' + this.nameOf(q)); this.notifyRewards(); }
  },
  async run() {
    const s = this.state; if (s.running) return;
    // Only one open Discord runs quests (Stable and PTB are the same account): take the shared lock, renew it every 30 s while running.
    const take = () => Twilight.cmd({ type: 'questLock', op: 'take' }).catch(() => ({ ok: true }));
    let lock = await take();
    if (lock?.ok !== false) { await this.sleep(1000 + Math.random() * 1500); lock = await take(); } // both Discords starting together: the later write wins, the other backs off
    if (lock && lock.ok === false) {
      if (this.otherHolder !== lock.holder) this.say(`Quests are being run in Discord ${String(lock.holder).toUpperCase()}: this Discord leaves them alone (it only shows rewards to claim)`);
      this.otherHolder = lock.holder; this.refresh(); return;
    }
    this.otherHolder = null;
    clearInterval(this.lockT); this.lockT = setInterval(() => Twilight.cmd({ type: 'questLock', op: 'take' }).catch(() => {}), 30000);
    s.running = true; s.stop = false; s.cur = {}; s.queue = {}; s.done = []; let errors = 0;
    // one tick per second, only while a run is active and the Quests page is open: keeps the bars and times moving
    clearInterval(this.tick); this.tick = setInterval(() => { if (Twilight.debug?.page?.() === 'Quests') this.paint(); }, 1000);
    try {
      await this.waitList(); await this.load();
      const all = this.quests(), st = this.store(), keys = [...new Set(all.flatMap(q => this.entries(this.cfg(q).tasks).map(e => e[0])))];
      this.say(`Quests: store ${st ? (st.getName?.() || 'found') : 'NOT FOUND'} ${this.list(st?.quests).length}, event ${(this.evt || []).length}, Discord list ${(this.remote || []).length}; ${all.length} total, ${all.filter(q => q.userStatus?.enrolledAt).length} accepted, ${all.filter(q => this.taskOf(q)).length} doable; task types: ${keys.join(',') || 'none'}`);
      { const d = all.find(q => this.taskOf(q) && q.config?.assets); if (d) this.say('Art fields: ' + Object.entries(d.config.assets).map(([k, v]) => k + '=' + String(v).slice(0, 90)).join(' ').slice(0, 420)); }
      this.notifyRewards();
      if (all.length && !all.some(q => this.taskOf(q))) this.say('Quest fields seen: ' + Object.keys(all[0].config || {}).slice(0, 8).join(','));
      // How many run at once: 2 video quests and 1 game quest (activities count as games).
      // Quests are accepted one at a time, only when a free slot needs one, so we never pile up a long list of accepted quests.
      const enroll = Twilight.opt('QuestCompleter', 'enroll', true), isVid = q => this.taskOf(q).type.includes('VIDEO'), tried = new Set(), kindOf = q => isVid(q) ? 'v' : 'g';
      const nv = 2, ng = 1; // fixed: 2 video quests and 1 game quest at a time
      for (const q of this.todo()) s.queue[q.id] = { name: this.nameOf(q), type: this.taskOf(q).type, target: this.taskOf(q).target, art: this.art(q) };
      this.say(`Running up to ${nv} video and ${ng} game quests at once`);
      const take = q => { if (q) { tried.add(q.id); delete s.queue[q.id]; } return q; };
      let chain = Promise.resolve();
      // Next quest for a lane: accepted and new quests ranked together (in progress first, then Prioritise, then quickest); a new one is
      // accepted only when it is the one picked. One pick at a time (chain), so two video workers never take the same quest.
      const pick = kind => chain = chain.then(async () => {
        for (;;) {
          if (s.stop) return null;
          const q = [...this.todo(), ...(enroll ? this.fresh() : [])].filter(x => !tried.has(x.id) && !s.cur[x.id] && kindOf(x) === kind).sort((x, y) => this.byOrder(x, y))[0];
          if (!q) return null;
          if (q.userStatus?.enrolledAt) return take(q);
          try { await this.enroll(q); await this.sleep(1500 + Math.random() * 1500); } catch (e) { tried.add(q.id); this.say('Could not accept ' + this.nameOf(q) + ': ' + String(e?.body?.message || e?.message || e).slice(0, 80)); continue; }
          const r = this.todo().find(x => x.id === q.id); if (r) return take(r); tried.add(q.id);
        }
      }).catch(e => { this.say('Picking the next quest failed: ' + String(e?.message || e).slice(0, 80)); return null; });
      const worker = async kind => {
        for (;;) {
          if (s.stop) return;
          const q = await pick(kind); if (!q) return;
          try { await this.one(q); } catch (e) { errors++; delete s.cur[q.id]; this.refresh(); this.say(`Failed: ${this.nameOf(q)}: ${e?.status ? 'HTTP ' + e.status + ' ' : ''}${String(e?.body?.message || e?.message || e).slice(0, 100)}${e?.body?.code ? ' (code ' + e.body.code + ')' : ''}`); if (errors >= 3) { this.say('Stopping after 3 failures'); s.stop = true; } }
          await this.sleep(2000);
        }
      };
      await Promise.all([...Array(nv).fill('v'), ...Array(ng).fill('g')].map(k => worker(k)));
      if (!tried.size && !errors) this.say('Nothing to do right now'); else if (!errors && !s.stop) this.say('All quests that can be done are finished');
    } finally { clearInterval(this.tick); clearInterval(this.lockT); Twilight.cmd({ type: 'questLock', op: 'release' }).catch(() => {}); s.running = false; s.cur = {}; s.queue = {}; try { Twilight.cmd({ type: 'report', name: this.logName(), text: s.log.join('\n') }); } catch {} Twilight.debug?.refresh?.();
      if (this.again && !s.stop) { this.again = false; this.remoteAt = 0; this.say('New quests arrived while running: checking again'); setTimeout(() => this.kick?.(), 1500); } else this.again = false; }
  },
  stopNow() { this.state.stop = true; for (const a of [...(this.aborts || [])]) a(); this.say('Stopping'); },
  // What runs next, in the order the workers will take it (accepted and new quests together: in progress first, then Prioritise, then
  // quickest; new ones only when "accept automatically" is on). Start times are estimates: 2 video slots and 1 game slot, freed by what runs now.
  plan() {
    const s = this.state, kindOf = q => this.taskOf(q).type.includes('VIDEO') ? 'v' : 'g', enroll = Twilight.opt('QuestCompleter', 'enroll', true);
    const slots = { v: [0, 0], g: [0] }, now = Date.now();
    let i = 0;
    for (const c of Object.values(s.cur)) { const k = c.type.includes('VIDEO') ? 'v' : 'g', left = Math.max(0, c.target - (c.done + (now - c.at) / 1000)); if (i < 3 && slots[k]) { const j = slots[k].indexOf(Math.min(...slots[k])); slots[k][j] = left; } i++; }
    const list = [...this.todo(), ...(enroll ? this.fresh() : [])].filter(q => !s.cur[q.id]).sort((a, b) => this.byOrder(a, b));
    return list.map(q => {
      const k = kindOf(q), sl = slots[k], j = sl.indexOf(Math.min(...sl)), startIn = sl[j], len = this.left(q);
      sl[j] += len + 3;
      return { q, k, startIn, len, accepted: !!q.userStatus?.enrolledAt };
    });
  },
  // Quests Discord offers that Twilight cannot do by itself, with the reason.
  manualOnes() {
    return this.quests().filter(q => !this.done(q) && !this.expired(q) && !this.taskOf(q)).map(q => {
      const keys = this.entries(this.cfg(q).tasks).map(e => e[0]);
      const why = keys.some(k => k.includes('ACHIEVEMENT')) ? 'needs in-game achievements' : keys.some(k => /XBOX|PLAYSTATION/.test(k)) ? 'console only' : keys.some(k => k.includes('STREAM')) ? 'needs a real Go Live' : 'not supported';
      return { q, why };
    });
  },
  tab: {
    name: 'Quests',
    render() {
      const T = Twilight, { ui, h } = T, p = T.plugins.get('QuestCompleter'), s = p.state;
      const fmt = sec => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), r = sec % 60; return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}:${String(r).padStart(2, '0')}`; };
      const kind = ty => ty.includes('VIDEO') ? 'video' : ty === 'PLAY_ACTIVITY' ? 'activity' : 'game';
      // One line like a download list: name, percent and time left, with a bar under it.
      const item = (name, ty, pct, right, color, art, id) => { const row = h('div', { className: 'twd-row info', style: 'display:flex;gap:10px;align-items:center;cursor:default' },
        art ? h('img', { src: art, referrerPolicy: 'no-referrer', loading: 'lazy', style: 'width:44px;height:44px;border-radius:8px;object-fit:cover;flex:none;background:rgba(255,255,255,.06)', onerror: e => { e.target.style.display = 'none'; } }) : null,
        h('div', { style: 'flex:1;min-width:0' },
          h('div', { style: 'display:flex;justify-content:space-between;gap:10px' }, h('span', { textContent: `${name} · ${kind(ty)}`, style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }), h('span', { className: 'twq-right', textContent: right, style: 'color:#a9c4db;white-space:nowrap' })),
          h('div', { style: 'height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:5px;overflow:hidden' }, h('div', { className: 'twq-fill', style: `height:100%;width:${pct}%;background:${color};transition:width .9s linear` })))); if (id) row.dataset.twq = id; return row; };
      const running = Object.values(s.cur), plan = p.plan(), manual = p.manualOnes();
      let cleared; try { cleared = new Set(T.ls.get('questCleared') || []); } catch { cleared = new Set(); }
      const finished = p.quests().filter(q => p.done(q) && q.userStatus?.claimedAt && !cleared.has(q.id));
      const soon = sec => sec < 5 ? 'next' : `in ~${fmt(sec)}`;
      const unclaimed = p.quests().filter(q => p.unclaimed(q));
      // A finished quest with a reward: a row with a Claim button that opens Discord's own claim window (Discord asks its captcha there).
      const claimRow = q => h('div', { className: 'twd-row info', style: 'display:flex;gap:10px;align-items:center' },
        h('span', { style: 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: `${p.nameOf(q)} · ${p.rewardText(q)}` }),
        h('button', { textContent: s.claiming === q.id ? 'Waiting for Discord…' : 'Claim', disabled: !!s.claiming, style: 'flex:none;padding:4px 12px;border:0;border-radius:4px;background:var(--brand-500,#5865f2);color:#fff;cursor:pointer;font:inherit' + (s.claiming ? ';opacity:.6;cursor:default' : ''),
          onclick: e => { e.stopPropagation(); p.claim(q.id); } }));
      return [
        h('div', { className: 'twd-out', style: 'color:#ffd37a', textContent: '⚠ Faking quest progress is against Discord’s rules and can get your account banned. It runs 2 video quests and 1 game quest at a time, the safest setting.' }),
        ui.sec('Quest completer'), ui.info('Status', s.running ? `running ${running.length}, ${plan.length} in the queue` : p.otherHolder ? `running in Discord ${String(p.otherHolder).toUpperCase()} (only one Discord runs quests)` : 'idle'),
        ui.action(s.running ? 'Stop' : 'Run now', () => { s.running ? p.stopNow() : p.run(); T.debug.refresh(); }),
        ...(unclaimed.length ? [ui.sec(`Rewards to claim (${unclaimed.length})`),
          s.claimAllRun ? ui.info('Claim all', 'running (close a claim window to stop)')
            : ui.action(`Claim all (${unclaimed.length})`, () => { p.claimAll(); T.debug.refresh(); }, null, 'One at a time: the next claim window opens after the last one is done. Closing a window stops it'),
          ...unclaimed.map(claimRow)] : []),
        ui.sec(`Doing now (${running.length})`),
        ...(running.length ? Object.entries(s.cur).map(([id, c]) => { const i = p.runInfo(c); return item(c.name, c.type, i.pct, i.text, 'var(--tw-accent,#6cc8ff)', c.art, id); }) : [ui.info('', s.running ? 'starting…' : 'nothing running')]),
        // The queue: what starts next, when (estimate) and how long it takes. Games take long, so their lane matters most.
        ui.sec(`Up next (${plan.length})`),
        ...(plan.length ? plan.map(({ q, startIn, len, accepted }) => { const t = p.taskOf(q), pct = Math.min(100, Math.round(p.progress(q, t.type) / (t.target || 1) * 100));
          return item(p.nameOf(q) + (accepted ? '' : ' (not accepted yet)'), t.type, pct, `${soon(startIn)} · ${fmt(len)} long`, '#6b7a89', p.art(q)); })
          : [ui.info('', p.quests().length ? 'nothing left that Twilight can do' : 'open the Quests page in Discord once, then press Run now')]),
        ...(manual.length ? [ui.sec(`Available, do these yourself (${manual.length})`), ...manual.map(({ q, why }) => ui.info(p.nameOf(q), why))] : []),
        ...(finished.length ? [ui.sec(`Done and claimed (${finished.length})`),
          ui.action('Clear list', () => { try { T.ls.set('questCleared', [...cleared, ...finished.map(q => q.id)].slice(-400)); } catch {} T.debug.refresh(); }, null, 'Hides these; newly claimed quests show up here again'),
          ...finished.map(q => ui.info(p.nameOf(q), p.rewardText(q)))] : []),
        ui.sec('Log'), h('div', { 'data-twq-log': '1' }, ...(s.log.length ? s.log.slice(-12).reverse().map(l => ui.info('', l)) : [ui.info('', 'nothing yet')]))];
    },
  },
  start() {
    const me = this; let t = 0;
    const kick = () => { if (!Twilight.opt('QuestCompleter', 'auto', true)) return; clearTimeout(t); t = setTimeout(() => { if (me.state.running) { me.again = true; return; } if (me.todo().length || Twilight.opt('QuestCompleter', 'enroll', true)) me.run(); }, 6000); };
    me.kick = kick;
    // Discord's own "quests loaded" event carries the quest list; keep it so we never depend on finding the store.
    me.undoFlux = Twilight.onFlux({ QUESTS_FETCH_CURRENT_QUESTS_SUCCESS: d => { const a = me.list(d?.quests); if (a.length) me.evt = a; me.refresh(); kick(); }, QUESTS_ENROLL_SUCCESS: kick, CONNECTION_OPEN: kick, QUESTS_CLAIM_REWARD_SUCCESS: () => me.refresh() }, 'QuestCompleter');
    me.t0 = setTimeout(kick, 25000); // once after start-up
    me.cs = Object.assign(document.createElement('style'), { textContent: `
      .twq-count { display: flex; align-items: center; gap: 8px; height: 20px; padding: 0 9px; margin-left: 8px; border-radius: 7px; white-space: nowrap; cursor: pointer;
        font: 600 11px/1 "gg sans","Segoe UI",sans-serif; color: var(--text-muted,#80848e); user-select: none;
        background: rgba(0,0,0,.45); box-shadow: inset 0 1px 3px rgba(0,0,0,.85), inset 0 -1px 0 rgba(255,255,255,.07); -webkit-app-region: no-drag; }
      .twq-count b { color: var(--text-normal,#dbdee1); font-weight: 700; }
      .twq-q { display: inline-flex; align-items: center; gap: 4px; }
      .twq-q svg { flex: none; color: var(--text-normal,#dbdee1); }
      .twq-count:hover { color: var(--text-normal,#dbdee1); }
` });
    document.head.append(me.cs);
    // No timer: the counter is redrawn when our lists change, on Discord's quest events, and when Discord redraws its top bar.
    me.stopCDom = Twilight.onDom('QuestCompleter counter', () => me.paintCounter(), 1000);
    me.onOpt = e => { if (e.detail?.plugin === 'QuestCompleter') { me.paintCounter(); me.refresh(); } }; // an option changed in the menu
    window.addEventListener('tw-opt', me.onOpt);
    me.say('Quest completer started (1.16.1). Waiting for Discord to load quests.');
  },
  // ---- top-bar counter (left side, right of the back / forward arrows): "N to claim" and "running/available" with Discord's Quests icon ----
  // Discord's QuestsIcon is a small component that returns one <svg><path>; we take its path so the counter needs no React.
  questIcon() {
    // 1.23.0: finding the icon walks all of Discord's modules (~40 ms, measured), so the path is kept between starts and only looked up again if missing
    const ok = d => typeof d === 'string' && d.length < 6000 && /^[MmLlHhVvCcSsQqTtAaZz0-9 .,eE-]+$/.test(d);
    if (this._icon === undefined) {
      try { const kept = Twilight.ls.local.get('questIconD', null); if (ok(kept)) this._icon = kept; } catch {}
    }
    if (this._icon === undefined) {
      this._icon = null;
      try {
        const nope = '__twq' + Math.random().toString(36).slice(2), I = Twilight.find(x => x[nope] === undefined && typeof x.QuestsIcon === 'function');
        const find = e => !e || typeof e !== 'object' ? null : e.type === 'path' ? e.props?.d : Array.isArray(e) ? e.map(find).find(Boolean) : typeof e.type === 'function' ? find(e.type(e.props)) : find(e.props?.children);
        const d = I && find(I.QuestsIcon({ size: 'xs', color: 'currentColor' }));
        if (d) { this._icon = d; try { if (ok(d)) Twilight.ls.local.set('questIconD', d); } catch {} }
      } catch {}
    }
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '13'); svg.setAttribute('height', '13'); svg.setAttribute('aria-hidden', 'true');
    if (this._icon) { const p = document.createElementNS(NS, 'path'); p.setAttribute('fill', 'currentColor'); p.setAttribute('d', this._icon); svg.append(p); }
    else { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '7'); c.setAttribute('fill', 'currentColor'); svg.append(c); }
    return svg;
  },
  // Discord's own "go to the Quests page" (the same call its sidebar entry makes); a plain route change if that is not found.
  openQuestHome() {
    try { const { B } = this.disc(); if (typeof B?.mA === 'function') return B.mA({ fromContent: 11 }); } catch {}
    Twilight.go('/quest-home');
  },
  // Every quest Discord offers you that is not finished and not expired; quests Twilight cannot do itself (achievement, console) only
  // when the "Leave do these yourself out" option is off.
  available() { const hide = Twilight.opt('QuestCompleter', 'hideManual', false); return this.quests().filter(q => !this.done(q) && !this.expired(q) && (!hide || this.taskOf(q))).length; },
  paintCounter() {
    const tr = document.querySelector('[class*="bar_"] [class*="leading_"]');
    let el = document.querySelector('.twq-count');
    if (!tr) return el?.remove();
    const s = this.state, toClaim = this.quests().filter(q => this.unclaimed(q)).length, running = Object.keys(s.cur).length, avail = this.available();
    if (!toClaim && !running && !avail && !this.otherHolder) return el?.remove();
    if (!el) {
      el = document.createElement('div'); el.className = 'twq-count';
      el.onclick = () => this.openQuestHome();
    }
    const key = [toClaim, running, avail, this.otherHolder || ''].join('|');
    if (el.dataset.k !== key) {
      el.dataset.k = key; el.replaceChildren();
      const part = (b, t) => { const x = document.createElement('span'); x.innerHTML = `<b>${b}</b> ${t}`; el.append(x); };
      if (toClaim) part(toClaim, 'to claim');
      const q = document.createElement('span'); q.className = 'twq-q';
      if (this.otherHolder) { q.append(this.questIcon(), ' running in '); const b = document.createElement('b'); b.textContent = this.otherHolder === 'ptb' ? 'PTB' : this.otherHolder[0].toUpperCase() + this.otherHolder.slice(1); q.append(b); }
      else { const b = document.createElement('b'); b.textContent = `${running}/${avail}`; q.append(b, this.questIcon()); }
      el.append(q);
      el.title = this.otherHolder ? `Quests are being done in your other Discord (${this.otherHolder}); only one runs them at a time`
        : `${running} quest${running === 1 ? '' : 's'} running · ${avail} available (not finished yet)`;
      el.title += ' · click to open Quests';
    }
    if (tr.lastElementChild !== el) tr.append(el); // after Discord's back / forward arrows
  },
  stop() { clearTimeout(this.t0); window.removeEventListener('tw-opt', this.onOpt); clearInterval(this.lockT); Twilight.cmd({ type: 'questLock', op: 'release' }).catch(() => {}); this.stopCDom?.(); this.cs?.remove(); document.querySelectorAll('.twq-count').forEach(e => e.remove()); this.state.stop = true; this.state.stopClaim = true; this.state.abort?.(); this.undoFlux?.(); },
});
