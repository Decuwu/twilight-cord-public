// Right-click an emoji or a sticker: add it to one of your servers, save it, copy its link or ID. 1.25.0: "Add to server" is back,
// after the ClonerTest plugin proved that uploading really works (the upload returns an id, the item is on the server, and deleting works).
Twilight.definePlugin({
  name: 'EmojiStealer',
  featured: 'Add to server is back',
  vs: 'Right-click an emoji only offers copy / open link, no saving',
  desc: 'Right-click an emoji or sticker: add it to your server, save it, copy link / ID',
  start() {
    const T = Twilight;
    const parse = img => {
      const src = img.currentSrc || img.src || '';
      let m = src.match(/\/emojis\/(\d+)\.(\w+)/);
      if (m) { const anim = /animated=true/.test(src) || m[2] === 'gif', ext = anim ? 'gif' : 'png'; return { id: m[1], name: (img.alt || img.getAttribute('aria-label') || '').replace(/:/g, '') || 'emoji_' + m[1], url: `https://cdn.discordapp.com/emojis/${m[1]}.${ext}?size=256&quality=lossless`, ext }; }
      m = src.match(/\/stickers\/(\d+)\.(\w+)/);
      if (m) { const ext = m[2] === 'gif' ? 'gif' : 'png'; return { id: m[1], name: img.alt || 'sticker_' + m[1], url: `https://media.discordapp.net/stickers/${m[1]}.${ext}?size=512`, ext }; }
    };
    const copy = (text, what) => navigator.clipboard.writeText(text).then(() => T.notify('Copied', what, 1800, 'success'), () => T.notify('Copy failed', what, 3000, 'error'));
    const save = async e => {
      try {
        const b = await (await fetch(e.url)).blob(), a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: `${e.name}.${e.ext}` });
        document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        T.notify('Saved', `${e.name}.${e.ext}`, 2200, 'success');
      } catch (err) { T.notify('Save failed', String(err.message || err).slice(0, 60), 4000, 'error'); }
    };
    // ---- Add to server: servers where you may add emojis / stickers (owner, or the Manage / Create Expressions permission) ----
    const sticker = e => /\/stickers\//.test(e.url);
    const servers = () => {
      const GS = T.findStore('GuildStore'), PS = T.findStore('PermissionStore'), me = T.findStore('UserStore')?.getCurrentUser?.()?.id;
      const can = g => { if (g.ownerId === me) return true; for (const bit of [1n << 30n, 1n << 43n]) { try { if (PS?.can?.(bit, g)) return true; } catch {} } return false; };
      return Object.values(GS?.getGuilds?.() || {}).filter(can).sort((a, b) => a.name.localeCompare(b.name));
    };
    const toData = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
    const add = async (e, g) => {
      const api = T.rest(), name = (e.name.replace(/[^\w]/g, '_').replace(/^_+|_+$/g, '') || 'emoji').slice(0, sticker(e) ? 30 : 32).padEnd(2, '_');
      try {
        const blob = await (await fetch(e.url)).blob(); let r;
        if (sticker(e)) { const fd = new FormData(); fd.append('name', name); fd.append('tags', name.slice(0, 20)); fd.append('description', ''); fd.append('file', blob, `${name}.${e.ext}`); r = await api.post({ url: `/guilds/${g.id}/stickers`, body: fd }); }
        else r = await api.post({ url: `/guilds/${g.id}/emojis`, body: { name, image: await toData(blob) } });
        if (!r?.body?.id) throw new Error('Discord did not confirm the upload');
        T.notify('Added to ' + g.name, sticker(e) ? `Sticker "${name}"` : `:${name}:`, 3500, 'success');
      } catch (err) {
        const code = err?.body?.code, msg = code === 30008 ? 'that server has no free emoji slots' : code === 30039 ? 'that server has no free sticker slots' : code === 50013 ? 'you are not allowed to add them there' : String(err?.body?.message || err?.message || err).slice(0, 80);
        T.notify('Could not add', msg, 5000, 'error');
      }
    };
    const pick = (e, x, y) => {
      document.getElementById('tw-clone')?.remove();
      const list = servers(), box = T.h('div', { id: 'tw-clone' });
      box.style.cssText = `position:fixed;z-index:2147483645;left:${Math.min(x, innerWidth - 270)}px;top:${Math.min(y, innerHeight - 320)}px;width:250px;max-height:300px;overflow:auto;padding:6px;border-radius:8px;background:var(--background-surface-higher,#232428);border:1px solid var(--border-subtle,rgba(255,255,255,.08));box-shadow:0 8px 24px rgba(0,0,0,.45);font:500 14px var(--font-primary,"gg sans",sans-serif);color:var(--text-default,#dbdee1)`;
      box.append(T.h('div', { textContent: `Add ${sticker(e) ? 'sticker' : 'emoji'} to…`, style: 'padding:4px 8px 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-muted,#949ba4)' }));
      if (!list.length) box.append(T.h('div', { textContent: 'You cannot add emojis to any of your servers.', style: 'padding:6px 8px;color:var(--text-muted,#949ba4)' }));
      for (const g of list) {
        const icon = g.icon ? T.h('img', { src: `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=32`, style: 'width:22px;height:22px;border-radius:50%' }) : T.h('span', { textContent: g.name.slice(0, 1), style: 'width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#5865f2;color:#fff;font-size:11px' });
        const row = T.h('div', { style: 'display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer' }, icon, T.h('span', { textContent: g.name, style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }));
        row.onmouseenter = () => row.style.background = 'var(--background-mod-normal,rgba(255,255,255,.06))'; row.onmouseleave = () => row.style.background = '';
        row.onclick = () => { box.remove(); add(e, g); };
        box.append(row);
      }
      document.body.append(box);
      const away = ev => { if (!box.contains(ev.target)) { box.remove(); window.removeEventListener('mousedown', away, true); } };
      setTimeout(() => window.addEventListener('mousedown', away, true), 0);
    };
    this.addTo = add; this.servers = servers; // also used by the self-test
    let at = { x: 0, y: 0 };
    this.offPos = (() => { const f = ev => { at = { x: ev.clientX, y: ev.clientY }; }; window.addEventListener('contextmenu', f, true); return () => window.removeEventListener('contextmenu', f, true); })();
    this.off = T.ctx.add('EmojiStealer', t => {
      const img = t.closest?.('img'), e = img && parse(img);
      return e ? [{ label: 'Add to Server…', icon: 'add', run: () => pick(e, at.x, at.y) }, { label: 'Save Image', icon: 'download', run: () => save(e) }, { label: 'Copy Image Link', icon: 'link', run: () => copy(e.url, 'Link') }, { label: 'Copy Emoji ID', icon: 'id', run: () => copy(e.id, 'ID') }] : null;
    });
  },
  stop() { this.off?.(); this.offPos?.(); document.getElementById('tw-clone')?.remove(); },
});
