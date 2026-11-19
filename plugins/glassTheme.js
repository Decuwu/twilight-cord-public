// Makes Discord itself glassy: see-through surfaces over a wallpaper, with blur. Settings live in the Theme tab.
Twilight.definePlugin({
  name: 'GlassTheme',
  vs: "Solid, opaque panels and a fixed window",
  desc: 'Theme tab: glass-look Discord (see-through panels, blur, wallpaper)',
  tab: {
    name: 'Theme',
    render() {
      const T = Twilight, { h } = T, U = T.ui, p = T.plugins.get('GlassTheme'), s = p.state();
      const set = (k, v) => { p.save({ [k]: v }); };
      const chip = (k, label) => h('div', { className: 'twd-chip' + (s.bg === k ? ' on' : ''), textContent: label, onclick: () => { set('bg', k); T.debug.refresh(); } });
      const url = U.input('Wallpaper image URL (https://...)', s.url);
      return [
        U.sec('Discord glass'),
        U.ledRow('Glass Discord', s.on, () => { set('on', !s.on); T.debug.refresh(); }, 'Experimental: turns Discord\'s panels see-through'),
        U.sec('Look'),
        U.slider('Panel opacity (see-through)', 5, 100, 1, s.a, v => v + '%', v => set('a', v)),
        U.slider('Panel blur', 0, 30, 1, s.blur, v => v + 'px', v => set('blur', v)),
        U.slider('Darken wallpaper', 0, 90, 1, s.dim, v => v + '%', v => set('dim', v)),
        U.sec('Wallpaper'),
        h('div', { className: 'twd-chips' }, chip('twilight', 'Black ice'), chip('twili', 'Frost'), chip('dusk', 'Deep blue'), chip('plain', 'Plain'), chip('desktop', 'Desktop'), chip('custom', 'Custom')),
        url,
        U.action('Use this image', () => { set('url', url.value.trim()); set('bg', 'custom'); T.debug.refresh(); }),
        U.sec('Tools'),
        U.action('Re-scan Discord colours', () => { p.save({}, true); T.notify('Glass Discord', `${p.count} colour variables adjusted`, 2500, 'info'); }, null, 'Run after switching Discord\'s own theme'),
        U.action('Reset theme', () => { p.save({ a: 55, blur: 16, dim: 35, bg: 'twilight', url: '', on: false }); T.debug.refresh(); }),
        U.info('Colours adjusted', p.count || 0),
      ];
    },
  },
  state() { return { on: false, a: 55, blur: 16, dim: 35, bg: 'twilight', url: '', ...Twilight.ls.get('glass', {}) }; },
  save(patch, rescan) {
    Twilight.ls.set('glass', { ...this.state(), ...patch });
    this.apply(rescan);
  },
  count: 0,
  // Names of Discord's background colour variables, found by reading its style sheets (shared with ThemeMaker).
  bgNames(rescan) {
    if (!rescan && this.names) return this.names;
    const names = new Set();
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules || []) {
        const st = r.style; if (!st) continue;
        for (let i = 0; i < st.length; i++) {
          const n = st[i];
          if (/^--(background-|bg-|chat-background|channeltextarea-background|input-background|home-background)/.test(n) &&
              !/hover|active|selected|pressed|accent|brand|danger|positive|warning|mention|modifier|scrim/.test(n.replace('app-frame', '')) && !/overlay/.test(n.replace('app-frame', ''))) names.add(n);
        }
      }
    }
    return [...names];
  },
  start() {
    this.style = Object.assign(document.createElement('style'), { id: 'tw-glass' });
    this.apply();
    // Discord paints its theme late; look again once it has settled.
    this.t = setTimeout(() => this.apply(true), 4000);
  },
  stop() { clearTimeout(this.t); this.style?.remove(); },
  apply(rescan) {
    if (!this.style) return;
    const s = this.state();
    this.style.remove();
    if (!s.on) { this.count = 0; return; }
    // 1) Find Discord's background colour variables by reading its style sheets, then re-declare them see-through.
    this.names = this.bgNames(rescan);
    const cs = getComputedStyle(document.documentElement), decl = [];
    for (const n of this.names) {
      const v = cs.getPropertyValue(n).trim();
      if (v && CSS.supports('color', v)) decl.push(`${n}:color-mix(in srgb,${v} ${s.a}%,transparent)!important`);
    }
    this.count = decl.length;
    // 2) Wallpaper behind everything.
    const G = {
      // Black ice: near-black with icy blue light
      twilight: 'radial-gradient(1300px 650px at 50% -5%,#1f6fb5,transparent 62%),radial-gradient(900px 700px at 8% 105%,#0b2a52,transparent 60%),radial-gradient(700px 520px at 96% 88%,rgba(185,236,255,.25),transparent 60%),#03060c',
      twili: 'radial-gradient(800px 600px at 80% 15%,rgba(108,200,255,.3),transparent 60%),radial-gradient(900px 700px at 10% 90%,rgba(30,90,168,.3),transparent 60%),#02040a',
      dusk: 'linear-gradient(160deg,#2a7fc4 0%,#123a6b 40%,#08182f 72%,#02050b 100%)',
      plain: '#04070d',
      desktop: 'transparent',
    };
    const img = s.bg === 'custom' && /^https?:\/\//.test(s.url) ? `url("${s.url.replace(/"/g, '%22')}") center/cover no-repeat` : G[s.bg] || G.twilight;
    const dim = `linear-gradient(rgba(0,0,0,${s.dim / 100}),rgba(0,0,0,${s.dim / 100}))`;
    const M = 'html[data-tw-main]'; // everything is scoped to the main window: Discord copies page styles into pop-out windows
    // The class matches are substrings, so they also hit elements nested inside each other. Every nested backdrop-filter is
    // one more full blur pass, so only the outermost match of each area gets the blur.
    const parts = ['sidebar_', 'chat_', 'membersWrap', 'privateChannels', 'guilds_'].map(c => `[class*="${c}"]`).join(',');
    const blurSel = `${M} :is(${parts}):not(:is(${parts}) *)`;
    // Lightweight mode drops the backdrop blur.
    const lite = Twilight.lite();
    this.style.textContent =
`${M},${M} body,${M} #app-mount,${M} [class*="theme-"]{${decl.join(';')}}
${M},${M} body{background:${s.bg === 'desktop' ? 'transparent' : `${dim},${img}`} !important;background-attachment:fixed !important}
${M} #app-mount,${M} [class*="appMount"]{background:transparent !important}
${s.blur && !lite ? `${blurSel}{backdrop-filter:blur(${s.blur}px) saturate(1.4) !important}` : ''}`;
    document.documentElement.append(this.style);
    Twilight.log(`GlassTheme: ${decl.length} colour variables made see-through`);
  },
});
