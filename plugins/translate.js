// Translate on click: hover a message and press the Translate button (left of the add-reaction smiley). The translation shows in small subtext
// under that one message; press the button again to hide it. Nothing is translated in the background, and no message is scanned.
// PRIVACY: only the text of a message you click is sent to Google Translate (through Discord's main process).
// Text already in the language you translate into is left alone (default: English). Pick another language in the Translate tab and
// everything you click is translated into that one instead.
Twilight.definePlugin({
  name: 'Translate',
  vs: 'Discord has no built-in translation',
  desc: 'Translate button in the message hover bar; the result shows under the message in small subtext',
  tab: {
    name: 'Translate',
    render() {
      const T = Twilight, { h } = T, to = T.opt('Translate', 'to', 'en');
      const LANG = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', it: 'Italian', nl: 'Dutch', pl: 'Polish', ru: 'Russian', tr: 'Turkish', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', ko: 'Korean', 'zh-CN': 'Chinese' };
      const p = T.plugins.get('Translate');
      return [
        h('div', { className: 'twd-out', textContent: 'Hover a message and press the Translate button next to the smiley. Only the message you press is sent to Google Translate. Text that is already in the chosen language is skipped.' }),
        T.ui.sec('Translate into'),
        h('div', { className: 'twd-chips' }, ...Object.entries(LANG).map(([k, n]) => h('div', { className: 'twd-chip' + (k === to ? ' on' : ''), textContent: n, onclick: () => { T.setOpt('Translate', 'to', k); T.debug.refresh(); } }))),
        T.ui.info('Translated this session', p.done || 0),
        T.ui.info('Button placement', p.placed ? 'ok' : (p.tried ? 'not found yet (see reports/translate.json)' : 'waiting for a hover')),
      ];
    },
  },
  start() {
    const T = Twilight, me = this; me.cache = new Map(); me.done = 0; me.placed = false; me.tried = 0; me.busy = new Set();
    me.css = Object.assign(document.createElement('style'), { textContent: '.tw-tr{margin-top:2px;font:400 12px/1.3 "gg sans","Segoe UI",sans-serif;color:var(--text-muted,#8aa6bf);opacity:.9;white-space:pre-wrap}.tw-tr:before{content:"translated · ";font-weight:600;opacity:.7}.tw-trbtn{cursor:pointer;display:flex;align-items:center;justify-content:center}.tw-trbtn svg{width:20px;height:20px;fill:currentColor}.tw-trbtn.on{color:var(--brand-500,#5b9dff)}' });
    document.documentElement.append(me.css);
    const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
    const meId = () => T.findStore('UserStore')?.getCurrentUser?.()?.id;
    const note = (li, text, err) => {
      const el = li.querySelector('[id^="message-content-"]'); if (!el) return;
      li.querySelector('.tw-tr')?.remove();
      const d = document.createElement('div'); d.className = 'tw-tr'; d.textContent = text; if (err) d.style.opacity = '.6'; el.after(d);
    };
    // Translate the message in this row, or hide its translation when it is already showing.
    const run = T.timed('Translate', async (li, btn) => {
      const info = T.msgScan.info(li), el = li.querySelector('[id^="message-content-"]');
      if (li.querySelector('.tw-tr')) { li.querySelector('.tw-tr').remove(); btn?.classList.remove('on'); return; }
      const text = (el?.innerText || '').trim();
      if (!el || text.length < 2) return;
      const to = T.opt('Translate', 'to', 'en'), key = (info?.id || li.id) + ':' + to;
      if (me.busy.has(key)) return; me.busy.add(key);
      try {
        if (!me.cache.has(key)) {
          const r = await T.cmd({ type: 'translate', text: text.slice(0, 1500), to }, 15000);
          if (!r || r.error) { note(li, 'Could not translate: ' + String(r?.error || 'no answer').slice(0, 80), true); return; }
          me.cache.set(key, r.from === to || !r.text || r.text.trim() === text ? '' : r.text);
          if (me.cache.size > 40) me.cache.delete(me.cache.keys().next().value);
        }
        const t = me.cache.get(key);
        note(li, t || 'Already in the language you translate into', !t); btn?.classList.add('on'); if (t) me.done++;
      } catch (e) { note(li, 'Could not translate', true); } finally { me.busy.delete(key); }
    });
    // The hover bar is made by Discord when you point at a message: add our button to it (left of the add-reaction smiley).
    const attach = T.timed('Translate', li => {
      if (!li.isConnected || li.querySelector('.tw-trbtn')) return;
      const btns = [...li.querySelectorAll('[role="button"][aria-label], [class*="hoverButton"], [class*="button"][role="button"]')].filter(b => !b.closest('[class*="messageContent"]') && !b.closest('[class*="embed"]'));
      const react = btns.find(b => /add reaction|reaction/i.test(b.getAttribute('aria-label') || ''));
      const model = react || btns.find(b => /reply|more|forward/i.test(b.getAttribute('aria-label') || '')) || btns[0];
      const bar = model?.parentElement; me.tried++;
      if (!model || !bar) { diag(li); return; }
      const b = document.createElement('div');
      b.className = model.className + ' tw-trbtn'; b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Translate'); b.title = 'Translate'; b.tabIndex = 0; b.innerHTML = ICON;
      b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); run(li, b); }, true);
      bar.insertBefore(b, react && react.parentElement === bar ? react : model); me.placed = true;
      if (li.querySelector('.tw-tr')) b.classList.add('on');
    });
    // If the bar cannot be found, write what the row looks like (class names and button labels only, never message text).
    let wrote = 0;
    const diag = li => {
      if (wrote++ > 2) return;
      try {
        const els = [...li.querySelectorAll('[role="button"], [class*="buttonContainer"], [class*="hoverBar"], [class*="buttons"]')].slice(0, 40)
          .map(e => ({ tag: e.tagName.toLowerCase(), role: e.getAttribute('role') || undefined, label: (e.getAttribute('aria-label') || '').slice(0, 40) || undefined, cls: String(e.className || '').slice(0, 100) }));
        T.cmd({ type: 'report', name: 'translate.json', text: JSON.stringify({ at: new Date().toISOString(), note: 'hover bar not found; class names and button labels only', els }, null, 1) });
      } catch {}
    };
    let last = 0, pend = 0;
    me.over = e => {
      const li = e.target?.closest?.('li[id^="chat-messages-"]'); if (!li || li.querySelector('.tw-trbtn')) return;
      const now = Date.now(); if (now - last < 120) return; last = now;
      clearTimeout(pend); pend = setTimeout(() => { attach(li); if (!li.querySelector('.tw-trbtn')) setTimeout(() => attach(li), 300); }, 80);
    };
    document.addEventListener('mouseover', me.over, { passive: true, capture: true });
  },
  stop() {
    document.removeEventListener('mouseover', this.over, true); this.css?.remove();
    document.querySelectorAll('.tw-tr, .tw-trbtn').forEach(n => n.remove());
  },
});
