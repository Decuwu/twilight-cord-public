// AutoCollapse: folds long walls of text in chat down to a few lines, with "Show more" to open them (and "Show less" to fold them
// again). Off until you switch it on. Light by design: it decides from the message text itself (length and line count from
// Discord's message store), never by measuring the page, so it adds no layout work; it rides on the shared message scanner and
// only looks at each message once. What you opened stays open for the rest of the session.
Twilight.definePlugin({
  name: 'AutoCollapse',
  added: '1.24.0',
  desc: 'Folds long messages in chat to a few lines with a "Show more" button',
  vs: 'Very long messages fill the whole chat',
  devOnly: true, // starts switched off; turning it on in the menu is remembered
  options: [
    { key: 'chars', label: 'Fold messages longer than', def: '900', choices: [['500', '500 characters'], ['900', '900 characters'], ['1500', '1500 characters'], ['2500', '2500 characters']], custom: { min: 100, max: 4000, unit: 'characters' } },
    { key: 'lines', label: 'Or with more lines than', def: '14', choices: [['8', '8 lines'], ['14', '14 lines'], ['25', '25 lines']] },
    { key: 'show', label: 'Lines shown while folded', def: '6', choices: [['4', '4'], ['6', '6'], ['10', '10']] },
    { key: 'own', label: 'Fold my own messages too', def: false },
  ],
  start() {
    const T = Twilight, me = this, opt = (k, d) => T.opt('AutoCollapse', k, d);
    me.open = me.open || new Set(); // message ids you opened this session
    me.css = Object.assign(document.createElement('style'), { textContent:
      '.tw-fold [id^="message-content-"]:not([id^="message-reply-context-"] *){max-height:calc(var(--tw-fold-lines,6) * 1.375rem);overflow:hidden;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}' +
      '.tw-fold-btn{display:inline-block;margin:2px 0 4px;padding:1px 8px;border-radius:4px;font:600 12px var(--font-primary,"gg sans",sans-serif);color:var(--text-link,#00a8fc);background:var(--background-modifier-hover,rgba(255,255,255,.04));cursor:pointer;user-select:none}' +
      '.tw-fold-btn:hover{text-decoration:underline}' });
    document.documentElement.append(me.css);
    const meId = () => T.findStore('UserStore')?.getCurrentUser?.()?.id;
    const tooLong = text => { if (!text) return false; if (text.length > +opt('chars', '900')) return true; let n = 1; for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10 && ++n > +opt('lines', '14')) return true; return false; };
    const paint = (li, id) => {
      // by id: in a reply, the first message-content in the row is the quoted preview at the top, not this message
      const el = li.querySelector('[id="message-content-' + id + '"]'); if (!el) return;
      let b = li.querySelector(':scope .tw-fold-btn');
      const folded = !me.open.has(id);
      li.classList.toggle('tw-fold', folded); li.style.setProperty('--tw-fold-lines', opt('show', '6'));
      if (!b) { b = document.createElement('div'); b.className = 'tw-fold-btn'; b.setAttribute('role', 'button'); b.tabIndex = 0;
        b.onclick = e => { e.stopPropagation(); me.open.has(id) ? me.open.delete(id) : me.open.add(id); paint(li, id); };
        b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } };
        el.after(b); }
      b.textContent = folded ? 'Show more' : 'Show less';
    };
    me.off = T.msgScan.add('AutoCollapse', (li, info) => {
      const m = info?.msg; if (!m?.id) return;
      if (!opt('own', false) && m.author?.id && m.author.id === meId()) return;
      if (tooLong(m.content)) paint(li, m.id);
    });
    me.onOpt = e => { if (e.detail?.plugin !== 'AutoCollapse') return; me.undo(); T.msgScan.again('AutoCollapse'); };
    me.undo = () => { document.querySelectorAll('.tw-fold-btn').forEach(n => n.remove()); document.querySelectorAll('.tw-fold').forEach(n => n.classList.remove('tw-fold')); };
    window.addEventListener('tw-opt', me.onOpt);
  },
  stop() { this.off?.(); window.removeEventListener('tw-opt', this.onOpt); this.undo?.(); this.css?.remove(); },
});
