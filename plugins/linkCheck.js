// LinkCheck: catches masked links that lie about where they go. Discord already refuses link text that starts with https://, but
// text like "discord.com/nitro" or "www.steamcommunity.com" can still point anywhere. When a link's text looks like a web address
// and the link really goes to a different site, the message folds away like an ignored message ("1 suspicious link — Show message").
// Opening it shows the real address in orange under the message. Plain words as link text ("click here") are left alone.
// Light: it rides on the shared message scanner and only reads the links already drawn in each message, once.
Twilight.definePlugin({
  name: 'LinkCheck',
  added: '1.25.0',
  place: 'Channel',
  desc: 'Folds messages whose link text shows one website but goes to another',
  vs: 'A link can show "discord.com" and open any other site',
  options: [{ key: 'fold', label: 'Fold the message like an ignored message', def: true }],
  // "discord.com/nitro", "www.site.co.uk", "https://x.y/z" -> host; anything that is not shaped like an address -> null
  hostOf(text) {
    const m = /^(?:[a-z][\w+.-]*:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,63})(?::\d+)?(?:[\/?#]\S*)?$/i.exec(String(text).trim().replace(/[)\].,!?]+$/, ''));
    return m ? m[1].toLowerCase().replace(/^www\./, '') : null;
  },
  liar(a) {
    let real; try { const u = new URL(a.href); if (!/^https?:$/.test(u.protocol)) return null; real = u.hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; }
    const shown = this.hostOf(a.textContent); if (!shown || shown === real) return null;
    if (real.endsWith('.' + shown) || shown.endsWith('.' + real)) return null; // same site, other subdomain (cdn.discordapp.com vs discordapp.com)
    return { shown, real, href: a.href };
  },
  start() {
    const T = Twilight, me = this;
    const ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2 2 20h20L12 2Zm0 5.5 6.6 11.5H5.4L12 7.5Zm-1 3.5v4h2v-4h-2Zm0 5v2h2v-2h-2Z"/></svg>';
    me.css = Object.assign(document.createElement('style'), { textContent:
      'li.tw-sus:not(.tw-sus-open)>:not(.tw-susbar){display:none!important}' +
      '.tw-susbar{display:flex;align-items:center;gap:8px;min-height:22px;margin:4px 0;padding:2px 16px 2px 72px;position:relative;font:500 14px/1.375rem var(--font-primary,"gg sans",sans-serif);color:var(--text-muted,#949ba4);user-select:none}' +
      '.tw-susbar svg{position:absolute;left:44px;color:#f0a03c}' +
      '.tw-susbar .tw-sus-dash{opacity:.7}.tw-susbar .tw-sus-open{color:var(--text-link,#00a8fc);cursor:pointer}.tw-susbar .tw-sus-open:hover{text-decoration:underline}' +
      '.tw-susnote{margin:2px 0 2px;font:500 12px/1.3 var(--font-primary,"gg sans",sans-serif);color:#f0a03c;word-break:break-all}' +
      '.tw-susnote b{font-weight:700}' });
    document.documentElement.append(me.css);
    me.off = T.msgScan.add('LinkCheck', li => {
      const links = [...li.querySelectorAll('[id^="message-content-"] a[href], [id^="message-accessories-"] a[href]')];
      const bad = links.map(a => me.liar(a)).filter(Boolean); if (!bad.length) return;
      const content = li.querySelector('[id^="message-content-"]');
      if (content && !li.querySelector('.tw-susnote')) {
        const note = document.createElement('div'); note.className = 'tw-susnote';
        note.append(...bad.flatMap((b, i) => { const s = document.createElement('div'); s.innerHTML = '⚠ Shows <b></b> but really goes to <b></b>'; s.children[0].textContent = b.shown; s.children[1].textContent = b.href; return [s]; }));
        content.after(note);
      }
      if (!T.opt('LinkCheck', 'fold', true) || li.querySelector('.tw-susbar')) return;
      const bar = document.createElement('div'); bar.className = 'tw-susbar';
      bar.innerHTML = ICON + `<span>${bad.length} suspicious link${bad.length > 1 ? 's' : ''}</span><span class="tw-sus-dash">—</span><span class="tw-sus-open" role="button" tabindex="0">Show message</span>`;
      const btn = bar.querySelector('.tw-sus-open');
      btn.onclick = e => { e.stopPropagation(); const open = li.classList.toggle('tw-sus-open'); btn.textContent = open ? 'Hide message' : 'Show message'; };
      btn.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } };
      li.classList.add('tw-sus'); li.prepend(bar);
    });
    me.onOpt = e => { if (e.detail?.plugin !== 'LinkCheck') return; me.undo(); T.msgScan.again('LinkCheck'); };
    window.addEventListener('tw-opt', me.onOpt);
    me.undo = () => { document.querySelectorAll('.tw-susbar,.tw-susnote').forEach(n => n.remove()); document.querySelectorAll('li.tw-sus').forEach(n => n.classList.remove('tw-sus', 'tw-sus-open')); };
  },
  stop() { this.off?.(); window.removeEventListener('tw-opt', this.onOpt); this.undo?.(); this.css?.remove(); },
});
