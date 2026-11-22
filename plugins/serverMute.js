// Tools tab: mute or unmute the server you are looking at.
Twilight.definePlugin({
  name: 'QuickServerMute',
  vs: "Muting a server takes several clicks through menus",
  desc: 'Mute or unmute the server you are in, also for 1 or 8 hours (Discord › Servers)',
  actionOnly: true,
  actions: (() => {
    const guild = () => {
      const T = Twilight, gid = T.findStore('SelectedGuildStore')?.getGuildId?.();
      return gid ? { gid, name: T.findStore('GuildStore')?.getGuild?.(gid)?.name || 'this server', muted: !!T.findStore('UserGuildSettingsStore')?.isMuted?.(gid) } : null;
    };
    const apply = (muted, hours) => {
      const T = Twilight, g = guild();
      if (!g) return T.notify('Server mute', 'Open a server first', 2500, 'warn');
      const m = T.findByProps('updateGuildNotificationSettings');
      if (!m) { T.log('QuickServerMute: updateGuildNotificationSettings not found'); return T.notify('Server mute', 'Discord module not found', 4000, 'error'); }
      const end = hours ? new Date(Date.now() + hours * 36e5).toISOString() : null;
      m.updateGuildNotificationSettings(g.gid, { muted, mute_config: muted ? { selected_time_window: hours ? hours * 3600 : -1, end_time: end } : null });
      T.notify(g.name, muted ? (hours ? `Muted for ${hours}h` : 'Muted') : 'Unmuted', 2500, muted ? 'warn' : 'success');
    };
    return [
      { label: 'Mute / unmute this server', sub: 'QuickServerMute', run() { apply(!guild()?.muted); } },
      { label: 'Mute this server for 1 hour', sub: 'QuickServerMute', run() { apply(true, 1); } },
      { label: 'Mute this server for 8 hours', sub: 'QuickServerMute', run() { apply(true, 8); } },
    ];
  })(),
});
