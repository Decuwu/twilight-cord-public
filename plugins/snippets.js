// Text snippets: type ;shrug and a space in the message box and it becomes the saved text.
Twilight.definePlugin({
  name: 'Snippets',
  vs: 'No text expansion',
  desc: 'Type ;name then space in the message box to expand a saved snippet',
  tab: {
    name: 'Snippets',
    render() {
      const T = Twilight, { h } = T, all = T.ls.get('snippets', {});
      const trig = T.ui.input('name (letters/numbers), used as ;name'), text = T.ui.input('text it expands to');
      const nodes = [T.ui.sec('Add a snippet'), trig, text, T.ui.action('Save snippet', () => {
        const k = trig.value.trim().replace(/^;/, '').replace(/\W/g, '').slice(0, 20); if (!k || !text.value) return T.notify('Snippets', 'Needs a name and text', 2500, 'warn');
        T.ls.set('snippets', { ...T.ls.get('snippets', {}), [k]: text.value.slice(0, 1500) }); T.debug.refresh();
      }), T.ui.sec(`Saved (${Object.keys(all).length})`)];
      if (!Object.keys(all).length) nodes.push(h('div', { className: 'twd-out', textContent: 'None yet. Example: name "shrug", text "¯\\_(ツ)_/¯", then type ;shrug and a space.' }));
      for (const [k, v] of Object.entries(all)) nodes.push(h('div', { className: 'twd-row' }, h('span', {}, ';' + k, h('small', { textContent: v.slice(0, 80) })),
        h('span', { textContent: '✕', onclick: e => { e.stopPropagation(); const n = { ...T.ls.get('snippets', {}) }; delete n[k]; T.ls.set('snippets', n); T.debug.refresh(); } })));
      return nodes;
    },
  },
  start() {
    const T = Twilight;
    this.fn = T.timed('Snippets', e => {
      const box = e.target?.closest?.('[role="textbox"][contenteditable="true"]'); if (!box || e.inputType !== 'insertText' || e.data !== ' ') return;
      const all = T.ls.get('snippets', {}); if (!Object.keys(all).length) return;
      const text = box.textContent.replace(/ /g, ' ');
      const m = /(?:^|\s);(\w{1,20}) $/.exec(text); if (!m || !(m[1] in all)) return;
      const sel = getSelection(); if (!sel?.modify) return;
      for (let i = 0; i < m[1].length + 2; i++) sel.modify('extend', 'backward', 'character'); // select ";name "
      try { document.execCommand('insertText', false, all[m[1]]); } catch {}
    });
    document.addEventListener('input', this.fn, true);
  },
  stop() { document.removeEventListener('input', this.fn, true); },
});
