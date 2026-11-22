// Messages you send can be translated too (Messages I send / the 文A button in the message box / /translate <language>).
// Translate on click: hover a message and press the Translate button (just left of the grey add-reaction smiley). The translation shows in small subtext
// under that one message; press the button again to hide it. Nothing is translated in the background, and no message is scanned.
// PRIVACY: only the text of a message you click is sent to the translator you picked (Google, or DeepL with your own key),
// through Discord's main process. Your DeepL key stays in Twilight's settings on this PC.
// Auto-translate (/translate auto:Start, or the switch in the Translate tab): the text of each NEW message that arrives in the chat you are looking at is
// sent to the translator you picked, and shown in small subtext when it is not already in your language. Off by default; it turns itself off when the
// translator rate-limits (or stops answering). Messages from before you switched it on, other chats and your own messages are never sent.
// Text already in the language you translate into is left alone (default: English). Pick another language in the Translate tab and
// everything you click is translated into that one instead.
Twilight.definePlugin({
  name: 'Translate',
  vs: 'Discord has no built-in translation',
  desc: 'Translate messages you read (button in the hover bar) and, if you like, the ones you send (文A button or /translate)',
  LANG: { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', it: 'Italian', nl: 'Dutch', pl: 'Polish', ru: 'Russian', tr: 'Turkish', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', ko: 'Korean', 'zh-CN': 'Chinese' },
  // Your own messages: { on, to } (off until you switch it on; the language is remembered).
  out() { return { on: false, to: '', ...Twilight.ls.get('trOut', {}) }; },
  setOut(v) { Twilight.ls.set('trOut', { ...this.out(), ...v }); Twilight.refreshChatButtons?.(); Twilight.debug?.refresh?.(); },
  tab: {
    name: 'Translate',
    render() {
      const T = Twilight, { h } = T, to = T.opt('Translate', 'to', 'en');
      const p = T.plugins.get('Translate'), LANG = p.LANG, out = p.out();
      const eng = T.opt('Translate', 'engine', 'google') === 'deepl' ? 'deepl' : 'google', key = T.ls.get('deeplKey', '');
      const ENG = { google: ['Google', 'Free, no setup'], deepl: ['DeepL', 'Best quality; needs your own free key'] };
      const keyIn = h('input', { type: 'password', placeholder: key ? 'Key saved (paste a new one to replace it)' : 'Paste your DeepL key (ends in :fx)', spellcheck: false, autocomplete: 'off' });
      const usage = h('div', { className: 'twd-out', textContent: '' });
      if (eng === 'deepl' && key) { if (p.usage) usage.textContent = p.usage; T.cmd({ type: 'translate', op: 'usage', key }, 10000).then(r => { p.usage = r?.error ? 'DeepL: ' + r.error : `DeepL this month: ${Number(r.used).toLocaleString()} of ${Number(r.limit).toLocaleString()} characters`; usage.textContent = p.usage; }).catch(() => {}); }
      return [
        h('div', { className: 'twd-out', textContent: `Hover a message and press the Translate button next to the smiley. Only the message you press is sent to ${ENG[eng][0]}${eng === 'google' ? '' : ' (Google if it fails)'}. Text that is already in the chosen language is skipped.` }),
        T.ui.sec('Translator'),
        ...Object.entries(ENG).map(([k, [n, sub]]) => h('div', { className: 'twd-row', onclick: () => { T.setOpt('Translate', 'engine', k); p.usage = null; T.debug.refresh(); } },
          h('span', {}, n, h('small', { textContent: k === eng ? 'In use' + (k === 'deepl' && !key ? ' · add your key below' : '') : sub })))),
        ...(eng === 'deepl' ? [keyIn,
          h('div', { className: 'twd-2' },
            T.ui.action('Save key', () => { const v = keyIn.value.trim(); if (!/^[0-9a-f-]{20,}(:fx)?$/i.test(v)) return T.notify('Translate', 'That does not look like a DeepL key', 3000, 'warn'); T.ls.set('deeplKey', v); p.usage = null; T.notify('Translate', 'DeepL key saved on this PC', 2500, 'success'); T.debug.refresh(); }),
            T.ui.action(key ? 'Remove key' : 'Get a free key', () => { if (key) { T.ls.set('deeplKey', ''); p.usage = null; T.debug.refresh(); } else window.open('https://www.deepl.com/en/pro-api', '_blank'); })),
          usage] : []),
        T.ui.sec('Messages I read: translate into'),
        h('div', { className: 'twd-chips' }, ...Object.entries(LANG).map(([k, n]) => h('div', { className: 'twd-chip' + (k === to ? ' on' : ''), textContent: n, onclick: () => { T.setOpt('Translate', 'to', k); T.debug.refresh(); } }))),
        T.ui.sec('New messages'),
        T.ui.ledRow('Translate new messages automatically', !!T.ls.get('trAuto', false), () => p.setAuto(!T.ls.get('trAuto', false), true), 'The text of each new message in the chat you are looking at is sent to the translator and shown under it if it is not already in your language. Turns itself off if the translator rate-limits. Also: /translate auto: Start / Disable (On / Off and True / False work too)'),
        T.ui.sec('Messages I send'),
        T.ui.ledRow('Translate what I send', out.on && !!out.to, () => { if (!out.to) return T.notify('Translate', 'Pick a language below first', 2500, 'warn'); p.setOut({ on: !out.on }); }, out.to ? `Into ${LANG[out.to] || out.to}. Also the 文A button in the message box, or /translate <language>` : 'Pick a language below, then switch this on'),
        h('div', { className: 'twd-chips' }, ...Object.entries(LANG).map(([k, n]) => h('div', { className: 'twd-chip' + (k === out.to ? ' on' : ''), textContent: n, onclick: () => p.setOut({ to: k, on: true }) }))),
        T.ui.ledRow('Show the button in the message box', T.opt('Translate', 'outButton', true), () => { T.setOpt('Translate', 'outButton', !T.opt('Translate', 'outButton', true)); p.outButton(); T.debug.refresh(); }, '', 'sub'),
        h('div', { className: 'twd-out', textContent: 'Press Enter and your message is translated right in the message box, so you can check it; press Enter again to send it. Mentions, emojis, links and `code` stay as they are; commands (/...) and code blocks are never translated.' }),
        T.ui.info('Translated this session', `${p.done || 0} read (${p.auto || 0} automatic) · ${p.sent || 0} sent`),
      ];
    },
  },
  start() {
    const T = Twilight, me = this; me.sent = 0;
    // ---- Messages you send: translated in the message box when you press Enter (see below), then Enter again sends what you see.
    const KEEP = /(```[\s\S]*?```|`[^`\n]+`|<a?:\w+:\d+>|<[@#][!&]?\d+>|<\/[^:>]+:\d+>|<t:\d+(?::[tTdDfFR])?>|https?:\/\/\S+|:[\w+-]{2,}:|@everyone|@here)/g;
    me.translateOut = async (text, to) => {
      if (!text || text.length > 1500 || /^\s*[\/!]/.test(text) || /```/.test(text)) return null; // commands, bot prefixes and code blocks go out untouched
      const keep = []; const plain = text.replace(KEEP, m => `[[${keep.push(m) - 1}]]`);
      if (!/\p{L}{2,}/u.test(plain.replace(/\[\[\d+\]\]/g, ''))) return null; // only emojis / links / mentions: nothing to translate
      const engine = T.opt('Translate', 'engine', 'google') === 'deepl' ? 'deepl' : 'google';
      const r = await T.cmd({ type: 'translate', text: plain, to, engine, key: engine === 'deepl' ? T.ls.get('deeplKey', '') : undefined }, 8000).catch(() => null);
      if (!r?.text) throw new Error(r?.error || 'no answer');
      if (r.from === to) return null; // already in that language
      let outText = r.text.replace(/\[\s*\[\s*(\d+)\s*\]\s*\]/g, (m, i) => keep[+i] ?? m);
      if (keep.some(k => !outText.includes(k))) throw new Error('a mention, emoji or link got lost');
      return outText;
    };
    // Enter in the message box: the text is translated IN the box first, so you see exactly what will be sent; Enter again sends it.
    // Commands, code blocks and emoji/link-only messages are not touched, and nothing happens while a picker (mentions, emojis, commands) is open.
    const needs = text => !!text && text.length <= 1500 && !/^\s*[\/!]/.test(text) && !/```/.test(text) && /\p{L}{2,}/u.test(text.replace(KEEP, ''));
    const boxText = () => { try { const cid = T.findStore('SelectedChannelStore')?.getChannelId?.(); return cid ? String(T.findStore('DraftStore')?.getDraft?.(cid, 0) ?? '') : ''; } catch { return ''; } };
    // Discord's box is a Slate editor: write through it so the draft (what gets sent) changes, not just the screen
    const editorOf = box => { try { let f = box[Object.keys(box).find(k => k.startsWith('__reactFiber'))]; for (let i = 0; i < 60 && f; i++, f = f.return) { const ed = f.memoizedProps?.editor; if (ed?.children && typeof ed.insertText === 'function') return ed; } } catch {} return null; };
    const setBox = (box, text) => {
      const ed = editorOf(box); box.focus();
      if (!ed) { try { document.execCommand('selectAll'); document.execCommand('insertText', false, text); } catch {} return; }
      const n = ed.children.length - 1, last = ed.children[n], li = last.children.length - 1;
      ed.apply({ type: 'set_selection', properties: ed.selection, newProperties: { anchor: { path: [0, 0], offset: 0 }, focus: { path: [n, li], offset: (last.children[li].text || '').length } } });
      ed.deleteFragment(); ed.insertText(text);
    };
    me.ready = null; // the text we last put in the box (or let through): Enter sends that as it is
    me.onKey = e => {
      if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.isComposing || me.busyOut) return;
      const st = me.out(); if (!st.on || !st.to) return;
      const box = e.target?.closest?.('[role="textbox"][contenteditable="true"]');
      if (!box || !box.closest('[class*="channelTextArea_"]') || box.closest('li[id^="chat-messages-"]')) return; // only the main message box, not editing an old message
      if (document.querySelector('[class*="channelTextArea_"] [class*="autocomplete_"]')) return; // a mention / emoji / command picker is open: Enter picks
      const text = boxText().trim();
      if (!needs(text) || text === (me.ready || '').trim()) return; // already translated (or nothing to translate): let Discord send it
      e.preventDefault(); e.stopImmediatePropagation(); me.busyOut = true;
      me.translateOut(text, st.to).then(t => {
        if (t && t.trim() !== text) { setBox(box, t); me.ready = t; me.sent++; }
        else { me.ready = text; T.notify('Translate', `Already in ${me.LANG[st.to] || st.to}: press Enter to send`, 2500, 'info'); }
      }).catch(err => { me.ready = text; T.notify('Translate', `Could not translate (${String(err?.message || err).slice(0, 50)}): press Enter to send as it is`, 4000, 'warn'); })
        .finally(() => { me.busyOut = false; });
    };
    window.addEventListener('keydown', me.onKey, true);
    // ---- The 文A button in the message box: lit while your messages are translated; right-click opens the language list in the menu.
    me.outButton = () => {
      me.undoBtn?.(); me.undoBtn = null;
      if (!T.opt('Translate', 'outButton', true)) return;
      me.undoBtn = T.chatButton({
        id: 'trout', icon: ICON,
        on: () => { const o = me.out(); return o.on && !!o.to; },
        tag: () => (me.out().to || '').split('-')[0].toUpperCase(),
        label: () => { const o = me.out(); return !o.to ? 'Translate my messages: pick a language (click)' : o.on ? `Your messages are translated into ${me.LANG[o.to] || o.to} (click to stop, right-click for languages)` : `Translate my messages into ${me.LANG[o.to] || o.to} (click to start, right-click for languages)`; },
        click: () => { const o = me.out(); if (!o.to) return T.debug?.go?.('Discord', 'Translate'); me.setOut({ on: !o.on }); T.notify('Translate', !o.on ? `Your messages go out in ${me.LANG[o.to] || o.to}` : 'Your messages go out as you write them', 2000, 'info'); },
        menu: () => T.debug?.go?.('Discord', 'Translate'),
      });
    };
    // /translate <language>: pick the language for what you send (or Off), from Discord's own command list.
    T.slash?.add?.({ name: 'translate', id: '9000000000000000016', desc: 'Translate what you send into a language, or translate new messages as they arrive',
      opts: [
        { name: 'language', type: 3, description: 'Language your messages go out in', required: false, choices: [{ name: 'Off', value: 'off' }, ...Object.entries(me.LANG).map(([value, name]) => ({ name, value }))] },
        { name: 'auto', type: 3, description: 'Translate each new message that arrives in this chat (turns itself off if the translator rate-limits)', required: false, choices: [{ name: 'Start', value: 'start' }, { name: 'Disable', value: 'disable' }] },
      ],
      run: v => {
        if (v.auto) { // Start / On / True turn it on; Disable / Off / False (or anything else you type) turn it off
          const w = String(v.auto).trim().toLowerCase(); me.setAuto(/^(start|on|true|yes|enable|enabled|1)$/.test(w), true);
        }
        const l = v.language;
        if (l === 'off') { me.setOut({ on: false }); T.notify('Translate', 'Your messages go out as you write them', 2500, 'info'); }
        else if (l) { me.setOut({ to: l, on: true }); T.notify('Translate', `Your messages now go out in ${me.LANG[l] || l}`, 2500, 'success'); }
        else if (!v.auto) T.notify('Translate', 'Pick a language for what you send, or auto: Start / Disable for new messages', 4000, 'info');
      } });
    me.warned = false; me.cache = new Map(); me.done = 0; me.placed = null; me.tried = 0; me.busy = new Set();
    me.css = Object.assign(document.createElement('style'), { textContent: '.tw-tr{margin-top:2px;font:400 12px/1.3 "gg sans","Segoe UI",sans-serif;color:var(--text-muted,#8aa6bf);opacity:.9;white-space:pre-wrap}.tw-tr b{font-weight:600;opacity:.7}.tw-trwrap{display:contents}.tw-trbtn{cursor:pointer;display:flex;align-items:center;justify-content:center}.tw-trbtn svg{width:20px;height:20px;fill:currentColor}.tw-trbtn.on{color:var(--brand-500,#5b9dff)}' });
    document.documentElement.append(me.css);
    const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
    me.outButton();
    const meId = () => T.findStore('UserStore')?.getCurrentUser?.()?.id;
    let names; try { names = new Intl.DisplayNames(['en'], { type: 'language' }); } catch {}
    const langName = c => { try { return c && names?.of(c) || c || ''; } catch { return c || ''; } };
    // Small subtext under the message: "translated from French · hello" (errors and "already in…" notes have no label).
    const note = (li, text, err, from) => {
      const el = li.querySelector('[id^="message-content-"]'); if (!el) return;
      li.querySelector('.tw-tr')?.remove();
      const d = document.createElement('div'); d.className = 'tw-tr';
      if (!err) { const b = document.createElement('b'); b.textContent = from ? `translated from ${langName(from)} · ` : 'translated · '; d.append(b); }
      d.append(text); if (err) d.style.opacity = '.6'; el.after(d);
    };
    // Translate the message in this row, or hide its translation when it is already showing.
    const run = T.timed('Translate', async (li, btn) => {
      const info = T.msgScan.info(li), el = li.querySelector('[id^="message-content-"]');
      if (li.querySelector('.tw-tr')) { li.querySelector('.tw-tr').remove(); btn?.classList.remove('on'); return; }
      const text = (el?.innerText || '').trim();
      if (!el || text.length < 2) return;
      const to = T.opt('Translate', 'to', 'en'), key = (info?.id || li.id) + ':' + to + ':' + T.opt('Translate', 'engine', 'google');
      if (me.busy.has(key)) return; me.busy.add(key);
      try {
        if (!me.cache.has(key)) {
          const engine = T.opt('Translate', 'engine', 'google') === 'deepl' ? 'deepl' : 'google', r = await T.cmd({ type: 'translate', text: text.slice(0, 1500), to, engine, key: engine === 'deepl' ? T.ls.get('deeplKey', '') : undefined }, 15000);
          if (r?.fellBack && !me.warned) { me.warned = true; T.notify('Translate', `DeepL did not answer (${r.fellBack}), used Google`, 4500, 'warn'); }
          if (!r || r.error) { note(li, 'Could not translate: ' + String(r?.error || 'no answer').slice(0, 80), true); return; }
          me.cache.set(key, { text: r.from === to || !r.text || r.text.trim() === text ? '' : r.text, from: r.from });
          if (me.cache.size > 40) me.cache.delete(me.cache.keys().next().value);
        }
        const { text: t, from } = me.cache.get(key);
        note(li, t || 'Already in the language you translate into', !t, from); btn?.classList.add('on'); if (t) me.done++;
      } catch (e) { note(li, 'Could not translate', true); } finally { me.busy.delete(key); }
    });
    // The hover bar is made by Discord when you point at a message: add our button to it (left of the add-reaction smiley).
    // Only the hover bar counts (never the reaction pills under a message). Each button there sits in its own wrapper, so ours gets one too,
    // placed right before the Add Reaction smiley (after the quick-reaction emojis).
    const attach = T.timed('Translate', li => {
      if (!li.isConnected) return;
      li.querySelectorAll('.tw-trbtn').forEach(x => { if (!x.closest('[class*="buttonsInner"]')) (x.closest('.tw-trwrap') || x).remove(); }); // tidy older misplaced ones
      const bar = li.querySelector('[class*="buttonsInner"]'); me.tried++;
      if (!bar) return diag(li);
      if (bar.querySelector('.tw-trbtn')) return;
      const btns = [...bar.querySelectorAll('[role="button"][aria-label]')];
      const react = btns.find(b => /^add reaction$/i.test(b.getAttribute('aria-label') || '')) || btns.find(b => /^(edit|reply|forward|more)$/i.test(b.getAttribute('aria-label') || ''));
      if (!react) { placeLog(false); return diag(li); }
      const slot = [...bar.children].find(c => c.contains(react)) || react; // the wrapper Discord put Add Reaction in
      const b = document.createElement('div');
      b.className = react.className + ' tw-trbtn'; b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Translate'); b.title = 'Translate'; b.tabIndex = 0; b.innerHTML = ICON;
      b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); run(li, b); }, true);
      const wrap = document.createElement('span'); wrap.className = 'tw-trwrap'; wrap.append(b);
      bar.insertBefore(wrap, slot); placeLog(true);
      if (li.querySelector('.tw-tr')) b.classList.add('on');
    });
    // Placement is only logged when it changes (works -> broken after a Discord update, or fixed again), never shown in the menu.
    const placeLog = ok => { if (me.placed === ok) return; if (me.placed !== null || !ok) T.log(ok ? 'Translate: button placement works again' : 'Translate: could not find where to put the button in the hover bar (Discord may have changed it); see reports/translate.json'); me.placed = ok; };
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
      const li = e.target?.closest?.('li[id^="chat-messages-"]'); if (!li || li.querySelector('[class*="buttonsInner"] .tw-trbtn')) return;
      const now = Date.now(); if (now - last < 120) return; last = now;
      clearTimeout(pend); pend = setTimeout(() => { attach(li); if (!li.querySelector('[class*="buttonsInner"] .tw-trbtn')) setTimeout(() => attach(li), 300); }, 80);
    };
    document.addEventListener('mouseover', me.over, { passive: true, capture: true });

    // ---- Auto-translate: each NEW message in the chat you are looking at (not history, not your own) goes through the same translator.
    // One at a time with a short gap, at most 8 waiting. A rate limit (HTTP 429, DeepL 456) switches it off with a notice; so do 5 failures in a row.
    me.autoOn = () => !!T.ls.get('trAuto', false);
    me.auto = me.auto || 0; me.q = []; me.qBusy = false; me.fails = 0;
    me.setAuto = (on, say) => {
      on = !!on; if (on === me.autoOn() && !say) return;
      T.ls.set('trAuto', on); me.fails = 0; me.q.length = 0; me.applyAuto(); T.debug?.refresh?.();
      if (say) T.notify('Translate', on ? `Auto-translate on: new messages that are not in ${me.LANG[T.opt('Translate', 'to', 'en')] || T.opt('Translate', 'to', 'en')} get a translation under them. It turns itself off if the translator rate-limits` : 'Auto-translate off', on ? 5000 : 2500, on ? 'success' : 'info');
    };
    const stopLimited = why => {
      if (!me.autoOn()) return;
      T.ls.set('trAuto', false); me.q.length = 0; me.applyAuto(); T.debug?.refresh?.();
      T.notify('Translate', `Auto-translate turned off: ${why}. Turn it back on with /translate auto: Start`, 9000, 'warn');
    };
    const autoOne = async li => {
      const el = li.querySelector('[id^="message-content-"]'), text = (el?.innerText || '').trim();
      if (!el || text.length < 2 || !/\p{L}{2,}/u.test(text) || li.querySelector('.tw-tr')) return;
      const to = T.opt('Translate', 'to', 'en'), engine = T.opt('Translate', 'engine', 'google') === 'deepl' ? 'deepl' : 'google';
      const r = await T.cmd({ type: 'translate', text: text.slice(0, 1500), to, engine, key: engine === 'deepl' ? T.ls.get('deeplKey', '') : undefined }, 15000).catch(() => null);
      if (r && r.text && !r.error) { // show what we got even when this was the last one before a limit
        me.fails = 0;
        if (r.from !== to && r.text.trim() !== text && li.isConnected && !li.querySelector('.tw-tr')) { note(li, r.text, false, r.from); me.done++; me.auto++; }
      } else if (!r?.limited && ++me.fails >= 5) return stopLimited('the translator is not answering');
      if (r?.limited) stopLimited(`${engine === 'deepl' ? 'DeepL' : 'Google'} is rate limiting${r.fellBack ? ' (' + String(r.fellBack).slice(0, 40) + ')' : ''}`);
    };
    const pump = async () => {
      if (me.qBusy) return; me.qBusy = true;
      try { while (me.q.length && me.autoOn()) { const li = me.q.shift(); await autoOne(li); await new Promise(res => setTimeout(res, 350)); } } finally { me.qBusy = false; }
    };
    me.onMsg = ev => {
      try {
        const m = ev?.message; if (!m || ev.optimistic || !m.id || !m.channel_id || !(m.type === 0 || m.type === 19)) return;
        if (m.author?.id === meId() || (m.content || '').trim().length < 2) return;
        if (m.channel_id !== T.findStore('SelectedChannelStore')?.getChannelId?.()) return; // only the chat you are looking at
        let tries = 0; const find = () => { // wait for Discord to draw the row
          const li = document.getElementById(`chat-messages-${m.channel_id}-${m.id}`);
          if (li) { if (me.q.length < 8) { me.q.push(li); pump(); } } else if (++tries < 12 && me.autoOn()) setTimeout(find, 250);
        };
        setTimeout(find, 150);
      } catch {}
    };
    me.applyAuto = () => { me.undoAuto?.(); me.undoAuto = null; if (me.autoOn()) me.undoAuto = T.onFlux({ MESSAGE_CREATE: me.onMsg }, 'Translate auto'); };
    me.applyAuto();
  },
  stop() {
    this.undoAuto?.(); this.undoAuto = null; this.q = [];
    this.undoBtn?.(); this.undoBtn = null; Twilight.slash?.remove?.('translate');
    window.removeEventListener('keydown', this.onKey, true);
    document.removeEventListener('mouseover', this.over, true); this.css?.remove();
    document.querySelectorAll('.tw-tr, .tw-trwrap, .tw-trbtn').forEach(n => n.remove());
  },
});
