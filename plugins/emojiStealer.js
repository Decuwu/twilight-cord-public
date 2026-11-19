// Right-click an emoji or a sticker: save it, copy its link or ID. (Cloning to a server was removed: see the ClonerTest plugin.)
Twilight.definePlugin({
  name: 'EmojiStealer',
  vs: 'Right-click an emoji only offers copy / open link, no saving',
  desc: 'Right-click an emoji or sticker: save it, copy link / ID',
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
    this.off = T.ctx.add('EmojiStealer', t => {
      const img = t.closest?.('img'), e = img && parse(img);
      return e ? [{ label: 'Save image', run: () => save(e) }, { label: 'Copy link', run: () => copy(e.url, 'Link') }, { label: 'Copy ID', run: () => copy(e.id, 'ID') }] : null;
    });
  },
  stop() { this.off?.(); },
});
