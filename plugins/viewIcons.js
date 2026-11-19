// Alt+click an avatar, server icon or banner to view it full size.
Twilight.definePlugin({
  name: 'ViewIcons',
  vs: "Avatars, banners and server icons only open small",
  desc: 'Alt+click an avatar, server icon or banner to view it full size',
  start() {
    const CDN = /^https:\/\/cdn\.discordapp\.com\/(avatars|icons|banners|guilds\/\d+\/users\/\d+\/avatars|splashes)\//;
    const big = src => {
      const u = new URL(src);
      u.searchParams.set('size', '4096');
      u.pathname = u.pathname.replace(/\.\w+$/, /\/a_/.test(u.pathname) ? '.gif' : '.png');
      return u.toString();
    };
    const close = () => this.box?.remove();
    this.click = e => {
      if (!e.altKey || e.shiftKey) return;
      const img = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.tagName === 'IMG' && CDN.test(x.src));
      if (!img) return;
      e.preventDefault(); e.stopPropagation();
      const url = big(img.src), h = (t, p = {}, ...k) => { const n = Object.assign(document.createElement(t), p); n.append(...k); return n; };
      const btn = (text, fn) => h('div', { textContent: text, onclick: ev => { ev.stopPropagation(); fn(); },
        style: 'padding:6px 14px;background:#6cc8ff;color:#fff;cursor:pointer;font:700 12px "Segoe UI",sans-serif;letter-spacing:.1em;text-transform:uppercase' });
      close();
      this.box = h('div', { onclick: close, style: 'position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.86);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px' },
        h('img', { src: url, style: 'max-width:88vw;max-height:80vh;box-shadow:0 0 40px #000' }),
        h('div', { style: 'display:flex;gap:8px' },
          btn('Open original', () => window.open(url)),
          btn('Copy URL', () => navigator.clipboard.writeText(url).then(() => Twilight.notify('ViewIcons', 'URL copied', 1800, 'success')))));
      document.documentElement.append(this.box);
    };
    this.key = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', this.click, true);
    window.addEventListener('keydown', this.key);
  },
  stop() {
    window.removeEventListener('click', this.click, true);
    window.removeEventListener('keydown', this.key);
    this.box?.remove();
  },
});
