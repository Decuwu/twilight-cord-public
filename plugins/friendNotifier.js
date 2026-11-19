// Friend notifier: tells you when someone removes you as a friend, and about the friends you choose to watch:
// they come online, change name / avatar / status. The Friends tab has test buttons so you can see every alert without waiting.
Twilight.definePlugin({
  name: 'FriendNotifier',
  vs: 'Nothing: Discord never says when someone removes you, and has no per-friend alerts',
  desc: 'Alerts: removed as a friend, and for watched friends: came online, name / avatar / status change',
  options: [
    { key: 'removed', label: 'Alert when someone removes me as a friend', def: true },
    { key: 'online', label: 'Watched friends: alert when they come online', def: true },
    { key: 'profile', label: 'Watched friends: alert on name / avatar change', def: true },
    { key: 'status', label: 'Watched friends: alert on status change (idle, dnd...)', def: false },
  ],
  watched() { return Twilight.ls.get('friendwatch', []); },
  nameOf(id) { const u = Twilight.findStore('UserStore')?.getUser?.(id); return u ? (u.globalName || u.username) : 'user ' + id; },
  tab: {
    name: 'Friends',
    render() {
      const T = Twilight, { h } = T, p = T.plugins.get('FriendNotifier'), w = p.watched();
      const q = T.ui.input('Search friends to watch'), list = h('div'), R = T.findStore('RelationshipStore');
      const draw = () => {
        const f = q.value.toLowerCase(), ids = (R?.getFriendIDs?.() || []).filter(id => p.nameOf(id).toLowerCase().includes(f)).sort((a, b) => w.includes(b) - w.includes(a)).slice(0, f ? 30 : 12);
        list.replaceChildren(...ids.map(id => T.ui.ledRow(p.nameOf(id), w.includes(id), () => { const n = p.watched(); T.ls.set('friendwatch', n.includes(id) ? n.filter(x => x !== id) : [...n, id]); T.debug.refresh(); }, 'watch', '')));
        if (!ids.length) list.append(h('div', { className: 'twd-out', textContent: R ? 'No friends match.' : 'Friend list not available yet.' }));
      };
      q.oninput = draw; setTimeout(draw);
      const id = w[0] || R?.getFriendIDs?.()[0] || '0', t = (kind, label) => T.ui.action('Test: ' + label, () => p.fire(kind, id, true), null, 'Shows the real alert with a [TEST] tag');
      return [T.ui.sec(`Watched friends (${w.length})`), q, list, T.ui.sec('Test flags'),
        t('removed', 'someone removed me'), t('online', 'friend came online'), t('name', 'friend changed name'), t('avatar', 'friend changed avatar'), t('status', 'friend changed status'), t('voice', 'friend joined voice'),
        T.ui.info('Events seen', p.seen || 0)];
    },
  },
  // One place for every alert, used by the real events and by the test buttons.
  fire(kind, id, test) {
    const T = Twilight, n = this.nameOf(id), tag = test ? '[TEST] ' : '';
    const M = { removed: [tag + 'Friend removed', `${n} is no longer your friend (they removed or blocked you)`, 'error'], online: [tag + 'Came online', `${n} is online`, 'success'], name: [tag + 'Name changed', `${n} changed their name`, 'info'],
      avatar: [tag + 'Avatar changed', `${n} changed their avatar`, 'info'], status: [tag + 'Status changed', `${n} changed their status`, 'info'], voice: [tag + 'Joined voice', `${n} joined a voice channel`, 'success'] };
    const m = M[kind]; if (!m) return; T.notify(m[0], m[1], 6000, m[2]); T.log(`FriendNotifier: ${m[0]} ${m[1]}`);
  },
  start() {
    const T = Twilight, me = this, opt = (k, d) => T.opt('FriendNotifier', k, d); me.seen = 0;
    const mine = new Map(); // watched friends: last known name / avatar / status
    const snap = id => { const u = T.findStore('UserStore')?.getUser?.(id); if (u) mine.set(id, { ...(mine.get(id) || {}), name: u.globalName || u.username, avatar: u.avatar, status: T.findStore('PresenceStore')?.getStatus?.(id) }); };
    const selfRemoved = new Map(); // ids you removed yourself (so only other people's removals alert)
    me.hook = r => { const m = /\/users\/@me\/relationships\/(\d+)/.exec(r.url || ''); if (m && /DELETE/i.test(r.method || '')) selfRemoved.set(m[1], Date.now()); };
    T.net.add(me.hook, 'FriendNotifier');
    me.t0 = setTimeout(() => me.watched().forEach(snap), 15000);
    me.t1 = setInterval(() => me.watched().forEach(id => { if (!mine.has(id)) snap(id); }), 30000); // newly watched friends get a baseline too
    me.undo = T.onFlux({
      RELATIONSHIP_REMOVE: a => {
        me.seen++; const rel = a.relationship || a, id = rel.id || a.id;
        if (!opt('removed', true) || rel.type !== 1 || Date.now() - (selfRemoved.get(id) || 0) < 15000) return;
        me.fire('removed', id);
      },
      USER_UPDATE: a => {
        const u = a.user; if (!u?.id || !me.watched().includes(u.id)) return; me.seen++;
        const old = mine.get(u.id) || {}, name = u.global_name ?? u.globalName ?? u.username;
        if (opt('profile', true)) { if (old.name && name && name !== old.name) me.fire('name', u.id); if (old.avatar !== undefined && u.avatar !== old.avatar) me.fire('avatar', u.id); }
        mine.set(u.id, { ...old, name: name || old.name, avatar: u.avatar });
      },
      PRESENCE_UPDATES: a => {
        const w = me.watched(); if (!w.length) return;
        for (const up of a.updates || []) {
          const id = up.user?.id; if (!id || !w.includes(id)) continue; me.seen++;
          const old = mine.get(id)?.status, st = up.status; mine.set(id, { ...(mine.get(id) || {}), status: st });
          if (old === st) continue;
          if (st === 'online' && (old === 'offline' || old === undefined) && opt('online', true) && old !== undefined) me.fire('online', id);
          else if (opt('status', false) && old !== undefined) me.fire('status', id);
        }
      },
    }, 'FriendNotifier');
  },
  stop() { this.undo?.(); clearTimeout(this.t0); clearInterval(this.t1); Twilight.net.remove(this.hook); },
});
