Twilight.definePlugin({
  name: 'SilentTyping',
  vs: "Everyone sees 'typing...' while you write",
  desc: 'Hides your typing indicator',
  start() {
    this.cancel = Twilight.waitFor(m => m.startTyping && m.stopTyping, m => {
      this.mod = m; this.orig = m.startTyping;
      try { m.startTyping = () => {}; } catch (e) { console.warn('[twilight] SilentTyping failed', e); }
    });
  },
  stop() {
    this.cancel?.();
    if (this.mod) this.mod.startTyping = this.orig;
  },
});
