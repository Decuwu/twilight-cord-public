// "Mark everything as read": run it from the debug menu (Tools tab).
Twilight.definePlugin({
  name: 'ClearNotifications',
  vs: "Only one-by-one 'mark as read' per server or channel",
  desc: 'Mark every server and DM as read (Discord › Servers)',
  actionOnly: true,
  actions: [
    { label: 'Mark everything as read', run() { Twilight.plugins.get('ClearNotifications').ack(null); } },
    { label: 'Mark this server as read', sub: 'ReadAllInServer', run() { Twilight.plugins.get('ClearNotifications').ack('current'); } },
  ],
  // which: null = every server and DM, 'current' = the server you are looking at
  ack(which) {
    const S = Twilight.findStore;
    const RS = S('ReadStateStore'), GS = S('GuildStore'), GCS = S('GuildChannelStore'), CS = S('ChannelStore'), TS = S('ActiveJoinedThreadsStore');
    const d = Twilight.dispatcher();
    const missing = Object.entries({ ReadStateStore: RS, GuildStore: GS, GuildChannelStore: GCS, ChannelStore: CS, dispatcher: d }).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      Twilight.log('ClearNotifications: missing ' + missing.join(', '));
      return Twilight.notify('Clear notifications', 'Not found: ' + missing.join(', '), 6000, 'error');
    }
    let guilds = Object.values(GS.getGuilds());
    if (which === 'current') {
      const gid = S('SelectedGuildStore')?.getGuildId?.();
      if (!gid) return Twilight.notify('Clear notifications', 'Open a server first', 2500, 'warn');
      guilds = guilds.filter(g => g.id === gid);
    }
    const ids = new Set();
    for (const g of guilds) {
      const c = GCS.getChannels(g.id) || {};
      for (const x of [...(c.SELECTABLE || []), ...(c.VOCAL || [])]) ids.add(x.channel.id);
      try {
        for (const byParent of Object.values(TS?.getActiveJoinedThreadsForGuild?.(g.id) || {}))
          for (const t of Object.values(byParent)) ids.add(t.channel?.id ?? t.id);
      } catch {}
    }
    if (!which) try { for (const c of CS.getSortedPrivateChannels?.() ?? Object.values(CS.getMutablePrivateChannels?.() ?? {})) ids.add(c.id); } catch {}
    const unread = [...ids].filter(id => id && RS.hasUnread(id));
    Twilight.log(`ClearNotifications: ${ids.size} channels checked, ${unread.length} unread`);
    if (!unread.length) return Twilight.notify('Clear notifications', 'Nothing unread', 2500, 'info');
    d.dispatch({ type: 'BULK_ACK', context: 'APP', channels: unread.map(channelId => ({ channelId, messageId: RS.lastMessageId(channelId), readStateType: 0 })) });
    Twilight.notify('Clear notifications', `Marked ${unread.length} channel${unread.length === 1 ? '' : 's'} as read`, 3000, 'success');
  },
});
