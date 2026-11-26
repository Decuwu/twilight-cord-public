// UpdateCheck: when Discord updates itself, Twilight checks that it still fits. About a minute after the first start on a new Discord
// version it runs the self-test once (Discord's stores, functions and page parts that plugins rely on) and looks for plugins that failed
// to start. You get one popup: either "all good" or what broke. The result is kept on this page and in reports/after-update.json.
// Costs nothing the rest of the time: it compares one version number at start-up.
Twilight.definePlugin({
  name: 'UpdateCheck',
  added: '1.25.0',
  place: 'Tools',
  desc: 'After a Discord update, checks Twilight still works and tells you if a plugin broke',
  vs: 'A Discord update can quietly break a plugin and you only notice later',
  host() { try { return window.DiscordNative?.app?.getVersion?.() || null; } catch { return null; } },
  // Plugins that threw while starting (core logs "[twilight] <name> <error>").
  startErrors() {
    const T = Twilight, names = [...T.plugins.keys()];
    return [...new Set(T.logs.filter(l => l.level === 'error' && l.text.startsWith('[twilight] ')).map(l => names.find(n => l.text.startsWith('[twilight] ' + n + ' '))).filter(Boolean))];
  },
  async run(why) {
    const T = Twilight, me = this; if (me.busy) return; me.busy = true;
    try {
      const P = T.plugins.get('Probe'), res = P?.selfTest ? await P.selfTest() : {}, ch = P?.compare ? P.compare(res) : { broke: [] };
      const failed = Object.entries(res).filter(([, v]) => P?.bad?.(v)).map(([k]) => k), plug = me.startErrors();
      const r = { at: Date.now(), why, discord: me.host(), before: T.ls.get('hostPrev', null), twilight: T.debug.version, checks: Object.keys(res).length, failed, newlyBroken: ch.broke, fixed: ch.fixed || [], pluginsFailed: plug };
      T.ls.set('updateCheck', r);
      T.cmd({ type: 'report', name: 'after-update.json', text: JSON.stringify({ ...r, selfTest: res }, null, 1) }, 6000);
      const bad = [...new Set([...plug.map(p => p + ' (did not start)'), ...(ch.broke.length ? ch.broke : failed)])];
      const head = why === 'update' ? `Discord updated${r.before ? ` (${r.before} → ${r.discord})` : ''}` : 'Twilight check';
      if (!bad.length) T.notify(head, `All ${r.checks || ''} checks passed: ${T.brand().name} works with this version`, 7000, 'success');
      else T.notify(head, `${bad.length} problem${bad.length > 1 ? 's' : ''}: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}. See Tools > UpdateCheck`, 12000, 'warn');
      T.debug.refresh(); return r;
    } catch (e) { T.log('UpdateCheck failed ' + (e?.message || e)); }
    finally { me.busy = false; }
  },
  actions: [{ label: 'Check Twilight against this Discord now', sub: 'UpdateCheck', run() { Twilight.plugins.get('UpdateCheck').run('manual'); } }],
  tab: {
    name: 'UpdateCheck',
    render() {
      const T = Twilight, { h } = T, r = T.ls.get('updateCheck', null), p = T.plugins.get('UpdateCheck');
      const out = [T.ui.info('Discord version now', p.host() || '?')];
      if (!r) return [...out, h('div', { className: 'twd-out', textContent: 'No check yet. One runs by itself after the next Discord update, or use the button above.' })];
      const bad = [...r.pluginsFailed.map(x => x + ' did not start'), ...(r.newlyBroken?.length ? r.newlyBroken : r.failed)];
      return [...out, T.ui.info('Last check', `${new Date(r.at).toLocaleString([], { hour12: false })} (${r.why === 'update' ? 'after an update' : 'by hand'})`),
        T.ui.info('Result', bad.length ? `${bad.length} problem${bad.length > 1 ? 's' : ''}` : `all ${r.checks} checks passed`),
        ...bad.map(b => h('div', { className: 'twd-row info' }, h('span', { textContent: '⚠ ' + b, style: 'color:#f0b232' })))];
    },
  },
  start() {
    const T = Twilight, me = this, now = me.host(); if (!now) return;
    const seen = T.ls.get('hostSeen', null);
    if (seen === now) return;
    T.ls.set('hostPrev', seen); T.ls.set('hostSeen', now);
    if (!seen) return; // first run: nothing to compare with yet
    me.t = setTimeout(() => me.run('update'), 60000);
  },
  stop() { clearTimeout(this.t); },
});
