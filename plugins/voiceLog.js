// Voice activity log: who joined, left or moved in voice channels (your friends, anyone you watch, and anyone in the call you are in).
// Alerts you when a watched friend joins a voice channel. Entries are kept for this session plus the last 100 saved.
Twilight.definePlugin({
  name: 'VoiceLog',
  vs: 'No history of who joined or left a call',
  desc: 'Log of voice joins / leaves, alert when watched friends join voice',
  options: [
    { key: 'alert', label: 'Alert when a watched friend joins voice', def: true },
    { key: 'everyone', label: 'Log everyone (busy servers: more entries)', def: false },
    { key: 'ignoreBots', label: 'Ignore bots (music bots and the like)', def: true },
  ],
  tab: {
    name: 'Voice',
    render() {
      const T = Twilight, { h } = T, log = T.ls.get('voicelog', []);
      const nodes = [T.ui.action('Clear voice log', () => { T.ls.set('voicelog', []); T.debug.refresh(); }), T.ui.sec(`Voice activity (${log.length})`)];
      if (!log.length) nodes.push(h('div', { className: 'twd-out', textContent: 'Nothing yet. Friends and people in your call show up here.' }));
      for (const e of log) nodes.push(h('div', { className: 'twd-log' }, h('b', { textContent: new Date(e.at).toLocaleTimeString([], { hour12: false }) + ' · ' + e.guild }), h('div', { textContent: `${e.who} ${e.what}${e.where ? ' ' + e.where : ''}` })));
      return nodes;
    },
  },
  start() {
    const T = Twilight, me = this, where = new Map();
    const chName = id => { const c = T.findStore('ChannelStore')?.getChannel?.(id); return c ? (c.name ? '#' + c.name : 'a call') : ''; };
    const guildName = id => { const g = id && T.findStore('GuildStore')?.getGuild?.(id); return g ? g.name : 'DMs'; };
    const add = e => { T.ls.set('voicelog', [{ at: Date.now(), ...e }, ...T.ls.get('voicelog', [])].slice(0, 100)); T.debug.refresh(); };
    me.undo = T.onFlux({
      VOICE_STATE_UPDATES: a => {
        const R = T.findStore('RelationshipStore'), meId = T.findStore('UserStore')?.getCurrentUser?.()?.id, myCh = T.findStore('SelectedChannelStore')?.getVoiceChannelId?.();
        const watch = T.plugins.get('FriendNotifier')?.watched?.() || [];
        for (const s of a.voiceStates || []) {
          const id = s.userId, was = where.get(id), now = s.channelId || null;
          if (now) where.set(id, now); else where.delete(id);
          if (where.size > 6000) where.delete(where.keys().next().value);
          if (was === now || id === meId) continue;
          if (T.opt('VoiceLog', 'ignoreBots', true) && T.findStore('UserStore')?.getUser?.(id)?.bot) continue;
          const interesting = T.opt('VoiceLog', 'everyone', false) || R?.isFriend?.(id) || watch.includes(id) || now === myCh || was === myCh;
          if (!interesting) continue;
          const who = T.plugins.get('FriendNotifier')?.nameOf(id) || id, what = !was ? 'joined' : !now ? 'left' : 'moved to';
          add({ who, what, where: chName(now || was), guild: guildName(s.guildId || T.findStore('ChannelStore')?.getChannel?.(now || was)?.guild_id) });
          if (what !== 'left' && watch.includes(id) && T.opt('VoiceLog', 'alert', true)) T.notify('Joined voice', `${who} ${what} ${chName(now)}`, 6000, 'success');
        }
      },
    }, 'VoiceLog');
  },
  stop() { this.undo?.(); },
});
