// Minimise / maximise / close in the top right, restyled as macOS-style round buttons (red close, yellow minimise, green maximise).
// Twilight does the work itself through the main process (one click = one small request; nothing runs in between).
Twilight.definePlugin({
  name: 'Window buttons',
  vs: 'Plain Windows buttons',
  desc: 'macOS-style round window buttons (close, minimise, maximise)',
  start() {
    const T = Twilight, me = this;
    const B = '[class*="winButtons"] > [class*="winButton"]', MM = '[class*="winButtons"] > [class*="winButtonMinMax"]';
    // Selected by position (first min/max button = minimise, second = maximise) so it survives Discord redrawing the bar.
    me.s = Object.assign(document.createElement('style'), { textContent: `
      [class*="winButtons"] { align-items: center; gap: 8px; padding: 0 14px 0 8px; }
      ${B} { width: 13px !important; height: 13px !important; min-width: 13px; border-radius: 50% !important; position: relative; background: #5c5c61 !important; transition: filter .12s, background .12s; overflow: hidden; flex: 0 0 13px; box-shadow: inset 0 0 0 .5px rgba(0,0,0,.35); }
      ${B} svg, ${B} * { display: none !important; }
      ${B} { font-size: 0 !important; color: transparent !important; }
      ${MM}:not(${MM} ~ [class*="winButtonMinMax"]) { order: 1; background: #febc2e !important; }
      ${MM} ~ [class*="winButtonMinMax"] { order: 2; background: #28c840 !important; }
      [class*="winButtons"] > [class*="winButtonClose"] { order: 3; background: #ff5f57 !important; }
      ${B}:hover { filter: brightness(1.12); }
      ${B}:active { filter: brightness(.8); }
      html[data-tw-focus="0"] ${B} { background: #5c5c61 !important; }
    ` });
    document.head.append(me.s);
    const foc = () => { document.documentElement.dataset.twFocus = document.hasFocus() ? '1' : '0'; };
    me.foc = foc; foc(); window.addEventListener('focus', foc); window.addEventListener('blur', foc);
    const which = b => /Close/.test(b.className) ? 'close' : [...b.parentElement.children].filter(x => /MinMax/.test(x.className)).indexOf(b) === 0 ? 'minimize' : 'maximize';
    me.onClick = e => {
      const b = e.target.closest?.(B); if (!b) return;
      e.preventDefault(); e.stopImmediatePropagation(); T.cmd({ type: 'win', op: which(b) });
    };
    me.swallow = e => { if (e.target.closest?.(B)) e.stopImmediatePropagation(); };
    window.addEventListener('click', me.onClick, true); window.addEventListener('mousedown', me.swallow, true); window.addEventListener('mouseup', me.swallow, true);
  },
  stop() { this.s?.remove(); window.removeEventListener('focus', this.foc); window.removeEventListener('blur', this.foc); window.removeEventListener('click', this.onClick, true); window.removeEventListener('mousedown', this.swallow, true); window.removeEventListener('mouseup', this.swallow, true); delete document.documentElement.dataset.twFocus; },
});
