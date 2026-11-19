// Puts a small Owner / Admin / Mod tag next to the names of staff in a server, worked out from their roles.
Twilight.definePlugin({
  name: 'StaffTags',
  heavy: true,
  vs: 'No tag shows who is staff',
  desc: 'Owner / Admin / Mod tags next to names',
  start() {
    const T = Twilight, ADMIN = 8n, MOD = 2n | 4n | 8192n | 1n << 40n; // kick, ban, manage messages, timeout
    const cache = new Map();
    const kind = (gid, uid) => {
      const k = gid + ':' + uid, hit = cache.get(k); if (hit && Date.now() - hit.at < 300000) return hit.v;
      let v = null;
      try {
        const g = T.findStore('GuildStore')?.getGuild?.(gid), mem = T.findStore('GuildMemberStore')?.getMember?.(gid, uid);
        if (g?.ownerId === uid) v = 'Owner';
        else if (mem) {
          const roles = T.findStore('GuildStore').getRoles?.(gid) || g.roles || {};
          let bits = 0n; for (const r of mem.roles || []) { const p = roles[r]?.permissions; if (p != null) bits |= BigInt(p); }
          v = bits & ADMIN ? 'Admin' : bits & MOD ? 'Mod' : null;
        }
      } catch {}
      cache.set(k, { v, at: Date.now() }); if (cache.size > 800) cache.delete(cache.keys().next().value); return v;
    };
    this.s = Object.assign(document.createElement('style'), { textContent: '.tw-staff{margin-left:5px;padding:0 5px;border-radius:3px;font:800 9px "gg sans","Segoe UI",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff;vertical-align:middle}.tw-staff[data-k=Owner]{background:#f0b232}.tw-staff[data-k=Admin]{background:#ed4245}.tw-staff[data-k=Mod]{background:#3ba55d}' });
    document.documentElement.append(this.s);
    this.off = T.msgScan.add('StaffTags', (li, info) => {
      const m = info?.msg, gid = T.findStore('ChannelStore')?.getChannel?.(info?.channelId)?.guild_id;
      if (!m?.author || !gid || m.author.bot || li.querySelector('.tw-staff')) return;
      const k = kind(gid, m.author.id), name = li.querySelector('[class*="username"]');
      if (k && name) name.after(Object.assign(document.createElement('span'), { className: 'tw-staff', textContent: k, dataset: { k } }));
    });
  },
  stop() { this.off?.(); this.s?.remove(); document.querySelectorAll('.tw-staff').forEach(n => n.remove()); },
});
