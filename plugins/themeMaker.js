// CSS for dummies: pick a font, sizes and switches, the CSS is written for you (and shown so you can learn from it).
// Save what you make as a named theme and switch between your themes.
Twilight.definePlugin({
  name: 'ThemeMaker',
  vs: 'Writing a theme means writing CSS by hand',
  desc: 'Font, text size, avatar shape, compact chat and hiding chat-bar buttons; save your own setups',
  DEFAULT: { font: '', fontSize: 16, avatarRound: 50, hideGift: false, hideSticker: false, hideGif: false, compact: false, hideNitro: false, smoothScroll: true },
  state() { return { ...this.DEFAULT, ...Twilight.ls.get('maker', {}) }; },
  tab: {
    name: 'Maker',
    render() {
      const T = Twilight, { h } = T, U = T.ui, p = T.plugins.get('ThemeMaker'), s = p.state();
      const set = (k, v) => { Twilight.ls.set('maker', { ...p.state(), [k]: v }); p.apply(); };
      const tog = (label, k, sub) => U.ledRow(label, !!s[k], () => { set(k, !s[k]); T.debug.refresh(); }, sub);
      const fonts = ['', 'Segoe UI', 'Consolas', 'Georgia', 'Trebuchet MS', 'Verdana', 'Comic Sans MS', 'Courier New'];
      const font = h('select', { onchange: e => set('font', e.target.value) }, ...fonts.map(f => h('option', { value: f, textContent: f || 'Discord default', selected: f === s.font })));
      const name = U.input('Name this theme', '');
      const themes = T.ls.get('makerThemes', {});
      const css = h('textarea', { value: p.css(s), readOnly: true, spellcheck: false, style: 'height:150px' });
      return [
        U.sec('Text and shapes'),
        h('div', { className: 'twd-sl' }, h('span', { textContent: 'Font' }), font, h('b')),
        U.slider('Chat text size', 12, 22, 1, s.fontSize, v => v + 'px', v => set('fontSize', v)),
        U.slider('Avatar roundness', 0, 50, 1, s.avatarRound, v => v + '%', v => set('avatarRound', v)),
        U.sec('Hide things'),
        tog('Gift button', 'hideGift'), tog('Sticker button', 'hideSticker'), tog('GIF button', 'hideGif'), tog('Nitro / Shop tabs', 'hideNitro'),
        tog('Compact chat', 'compact', 'Tighter message spacing'),
        U.sec('Your themes'),
        ...Object.keys(themes).map(n => h('div', { className: 'twd-row' }, h('span', { textContent: n, onclick: () => { T.ls.set('maker', themes[n]); p.apply(); T.debug.refresh(); T.notify('Theme', `Applied ${n}`, 1800, 'success'); } }),
          h('span', { className: 'twd-x', textContent: '✕', title: 'Delete', onclick: () => { const t = { ...T.ls.get('makerThemes', {}) }; delete t[n]; T.ls.set('makerThemes', t); T.debug.refresh(); } }))),
        name, U.action('Save current as a theme', () => { const n = name.value.trim(); if (!n) return T.notify('Theme', 'Give it a name first', 2500, 'warn'); T.ls.set('makerThemes', { ...T.ls.get('makerThemes', {}), [n]: p.state() }); T.debug.refresh(); }),
        U.action('Reset to default', () => { T.ls.set('maker', {}); p.apply(); T.debug.refresh(); }),
        U.sec('The CSS this makes (copy it into Quick CSS if you like)'), css,
        U.action('Copy CSS', () => Twilight.copyText(p.css(p.state())).then(() => T.notify('Theme', 'CSS copied', 1800, 'success'))),
      ];
    },
  },
  css(s) {
    const D = this.DEFAULT, out = [];
    if (s.font) out.push(`body,button,input,textarea{font-family:"${s.font}",sans-serif!important}`);
    if (s.fontSize !== D.fontSize) out.push(`[class*="markup"]{font-size:${s.fontSize}px!important;line-height:${Math.round(s.fontSize * 1.375)}px!important}`);
    if (s.avatarRound !== D.avatarRound) out.push(`img[class*="avatar"],[class*="avatar"] img{border-radius:${s.avatarRound}%!important}`);
    const hide = sel => out.push(`${sel}{display:none!important}`);
    const bar = l => `[class*="channelTextArea"] [class*="buttons_"] > :has(${l}),[class*="channelTextArea"] [class*="buttons_"] > ${l}`;
    if (s.hideGift) hide(bar('[aria-label*="gift" i]'));
    if (s.hideSticker) hide(bar('[aria-label*="sticker" i]'));
    if (s.hideGif) hide(bar('[aria-label="Open GIF picker" i]') + ',' + bar('[aria-label*="GIF picker" i]'));
    if (s.hideNitro) hide('a[href="/store"],a[href="/shop"],[data-list-item-id*="nitro" i],[data-list-item-id*="shop" i]');
    if (s.compact) out.push('[class*="message_"]{padding-top:0!important;padding-bottom:0!important;margin-top:0!important}');
    return out.join('\n') || '/* nothing changed yet */';
  },
  apply() {
    this.style ||= Object.assign(document.createElement('style'), { id: 'tw-maker' });
    const c = this.css(this.state()); this.style.textContent = Twilight.scoped(c);
    if (!this.style.isConnected) document.documentElement.append(this.style);
  },
  start() { this.apply(); },
  stop() { this.style?.remove(); },
});
