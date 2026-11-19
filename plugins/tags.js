// /tag: save text under a name and call it back later. The Tag commands plugin puts /tag, /tag-create, /tag-list and /tag-delete in
// Discord's own slash-command list and runs them through run() below. If that plugin is off, typing the old form still works:
//   /tag create <name> <text>   saves it      /tag <name>   (or /tag use <name>)  puts the text in your message box, ready to send
//   /tag list                   shows them    /tag delete <name>                  removes one
// Replies come back as Discord's own "only you can see this" message from Twilight (or a pop-up). Nothing is ever sent for you.
Twilight.definePlugin({
  name: 'Tags',
  vs: 'No saved text tags',
  desc: 'Save text under a name and call it back with /tag',
  tab: {
    name: 'Tags',
    render() {
      const T = Twilight, { h } = T, tags = T.ls.get('tags', {});
      return [h('div', { className: 'twd-sec', textContent: `Tags (${Object.keys(tags).length})` }),
        h('div', { className: 'twd-out', textContent: 'In any chat type /tag and pick a command. Click a tag here to copy its text.' }),
        ...Object.entries(tags).map(([n, t]) => h('div', { className: 'twd-row' },
          h('span', { onclick: () => T.copyText(t).then(() => T.notify('Tags', `Copied "${n}"`, 1800, 'success'), () => {}) }, n, h('small', { textContent: t.slice(0, 80) })),
          h('span', { textContent: '✕', onclick: () => { const x = { ...T.ls.get('tags', {}) }; delete x[n]; T.ls.set('tags', x); T.debug.refresh(); } })))];
    },
  },
  NAME: /^[\w-]{1,32}$/,
  RESERVED: ['create', 'use', 'list', 'delete', 'remove', 'help'],
  native: false, // true while Tag commands handles /tag (then the typed-text fallback below stays out of the way)
  // What was typed -> { cmd, name, text } (or null when it is not a /tag command).
  parse(t) {
    const m = /^\/tag(?:\s+([\s\S]*))?$/i.exec(String(t).replace(/ /g, ' ').trim()); if (!m) return null;
    const rest = (m[1] || '').trim(), w = /^(\S+)\s*([\s\S]*)$/.exec(rest); if (!w) return { cmd: 'list' };
    const first = w[1].toLowerCase(), arg = w[2].trim(), word = s => s.replace(/^"|"$/g, '').split(/\s+/)[0].toLowerCase();
    if (first === 'list' || first === 'help') return { cmd: first };
    if (first === 'delete' || first === 'remove') return { cmd: 'delete', name: word(arg) };
    if (first === 'use') return { cmd: 'use', name: word(arg) };
    if (first === 'create') {
      const c = /^(?:"([^"]+)"|(\S+))(?:\s+([\s\S]+))?$/.exec(arg); if (!c) return { cmd: 'create' };
      let text = (c[3] || '').trim(); if (/^"[\s\S]*"$/.test(text) && text.indexOf('"', 1) === text.length - 1) text = text.slice(1, -1);
      return { cmd: 'create', name: (c[1] || c[2]).toLowerCase(), text };
    }
    return { cmd: 'use', name: word(first) };
  },
  // A reply only you see, shown by Discord itself (the Assistant plugin makes these; without it, a pop-up).
  say(md) {
    const T = Twilight, a = T.plugins.get('Assistant');
    if (a?.say && !T.isOff('Assistant')) return a.say(null, md);
    T.notify('Tags', md.replace(/[*`>]/g, '').replace(/\n+/g, ' · ').slice(0, 140), 4500, 'info');
  },
  // Puts text in the message box (empty text clears it).
  fill(text) {
    const b = document.querySelector('[role="textbox"][contenteditable="true"]'); if (!b) return;
    b.focus();
    try { document.execCommand('selectAll'); if (text) document.execCommand('insertText', false, text); else document.execCommand('delete'); } catch {}
  },
  run(cmd, fill = t => this.fill(t)) {
    const T = Twilight, me = this, tags = { ...T.ls.get('tags', {}) }, quote = s => '> ' + String(s).replace(/\s+/g, ' ').slice(0, 140) + (String(s).length > 140 ? '…' : '');
    if (cmd.cmd === 'help') { fill(''); return me.say('**/tag**\n`/tag-create <name> <text>` saves a tag\n`/tag <name>` puts its text in your message box\n`/tag-list` shows your tags\n`/tag-delete <name>` removes one'); }
    if (cmd.cmd === 'list') { fill(''); const n = Object.keys(tags); return me.say(n.length ? `**Your tags** (${n.length})\n` + n.map(x => '`' + x + '`').join('  ') + '\nUse one with `/tag <name>`' : '**No tags yet**\nSave one with `/tag-create <name> <text>`'); }
    if (cmd.cmd === 'create') {
      if (!cmd.name || !cmd.text) return me.say('**/tag-create** needs a name and the text.');
      if (!me.NAME.test(cmd.name)) return me.say('Tag names can use letters, numbers, `_` and `-` (up to 32 characters).');
      if (me.RESERVED.includes(cmd.name)) return me.say('`' + cmd.name + '` is a /tag command word, so it cannot be a tag name.');
      if (cmd.text.length > 1900) return me.say('That text is too long for a tag (limit 1900 characters).');
      const had = cmd.name in tags; tags[cmd.name] = cmd.text; T.ls.set('tags', tags); fill('');
      return me.say(`**Tag ${had ? 'updated' : 'saved'}** · \`${cmd.name}\`\n${quote(cmd.text)}\nUse it with \`/tag ${cmd.name}\``);
    }
    if (cmd.cmd === 'delete') {
      if (!cmd.name) return me.say('Which tag? `/tag-delete <name>`');
      fill(''); if (!(cmd.name in tags)) return me.say('No tag named `' + cmd.name + '`.');
      delete tags[cmd.name]; T.ls.set('tags', tags); return me.say('**Tag deleted** · `' + cmd.name + '`');
    }
    const key = String(cmd.name || '').toLowerCase(); // use
    if (key in tags) return fill(tags[key]);
    fill(''); const near = Object.keys(tags).filter(k => k.startsWith(key.slice(0, 2))).slice(0, 5);
    return me.say('No tag named `' + key + '`.' + (near.length ? '\nDid you mean ' + near.map(x => '`' + x + '`').join(', ') + '?' : '\nSee `/tag-list`.'));
  },
  start() {
    const T = Twilight, me = this;
    if (!T.ls.get('tags', null)) T.ls.set('tags', { shrug: '¯\\_(ツ)_/¯', lenny: '( ͡° ͜ʖ ͡°)', tableflip: '(╯°□°)╯︵ ┻━┻', unflip: '┬─┬ ノ( ゜-゜ノ)', gg: 'gg, well played!', brb: 'brb, back in a few minutes' });
    // Fallback only (Tag commands off): Enter on a typed "/tag ..." runs it here. One cheap check per Enter key, nothing else.
    me.onKey = e => {
      if (me.native || e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      const box = e.target?.closest?.('[role="textbox"][contenteditable="true"]'); if (!box) return;
      const cmd = me.parse(box.innerText || ''); if (!cmd) return;
      e.preventDefault(); e.stopImmediatePropagation(); me.run(cmd);
    };
    window.addEventListener('keydown', me.onKey, true);
  },
  stop() { window.removeEventListener('keydown', this.onKey, true); },
});
