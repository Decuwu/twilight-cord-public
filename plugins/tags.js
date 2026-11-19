// Saved text snippets you send with a command:  /tag create "name" "text"  ·  /tag name  ·  /tag list  ·  /tag delete name
// The tag's text is pasted into your message box (you press Enter to send it).
Twilight.definePlugin({
  name: 'Tags',
  vs: 'No saved text tags',
  desc: 'Preset tags and /tag commands that paste saved text',
  tab: {
    name: 'Tags',
    render() {
      const T = Twilight, { h } = T, tags = T.ls.get('tags', {});
      return [h('div', { className: 'twd-sec', textContent: `Tags (${Object.keys(tags).length})` }),
        h('div', { className: 'twd-out', textContent: 'In any chat type:  /tag create "name" "text"  then  /tag name' }),
        ...Object.entries(tags).map(([n, t]) => h('div', { className: 'twd-row' },
          h('span', { onclick: () => Twilight.copyText(t) }, n, h('small', { textContent: t.slice(0, 80) })),
          h('span', { textContent: '✕', onclick: () => { const x = T.ls.get('tags', {}); delete x[n]; T.ls.set('tags', x); T.debug.refresh(); } })))];
    },
  },
  start() {
    const T = Twilight;
    if (!T.ls.get('tags', null)) T.ls.set('tags', { shrug: '¯\\_(ツ)_/¯', lenny: '( ͡° ͜ʖ ͡°)', tableflip: '(╯°□°)╯︵ ┻━┻', unflip: '┬─┬ ノ( ゜-゜ノ)', gg: 'gg, well played!', brb: 'brb, back in a few minutes' });
    const box = () => document.querySelector('[role="textbox"][contenteditable="true"]');
    const fill = text => { const b = box(); if (!b) return; b.focus(); document.execCommand('selectAll'); document.execCommand('delete'); if (text) document.execCommand('insertText', false, text); };
    const say = msg => T.notify('Tags', msg, 2800, 'info');
    this.on = e => {
      if (e.key !== 'Enter' || e.shiftKey || !e.target?.closest?.('[role="textbox"]')) return;
      const txt = (e.target.closest('[role="textbox"]').innerText || '').trim();
      if (!/^\/tag(\s|$)/i.test(txt)) return;
      e.preventDefault(); e.stopPropagation();
      const tags = T.ls.get('tags', {}), rest = txt.slice(4).trim();
      const q = [...rest.matchAll(/"([^"]*)"|(\S+)/g)].map(m => m[1] ?? m[2]);
      const cmd = (q[0] || 'list').toLowerCase();
      if (cmd === 'create' && q[1] && q[2] != null) { tags[q[1].toLowerCase()] = q.slice(2).join(' '); T.ls.set('tags', tags); fill(''); say(`Saved "${q[1]}"`); }
      else if (cmd === 'delete' && q[1]) { delete tags[q[1].toLowerCase()]; T.ls.set('tags', tags); fill(''); say(`Deleted "${q[1]}"`); }
      else if (cmd === 'list') { fill(''); say(Object.keys(tags).join(', ') || 'No tags yet'); }
      else if (tags[cmd]) fill(tags[cmd]);
      else { fill(''); say(`No tag "${cmd}". Use: /tag create "name" "text"`); }
    };
    window.addEventListener('keydown', this.on, true);
  },
  stop() { window.removeEventListener('keydown', this.on, true); },
});
