// Shows your typing speed (words per minute) next to the message box while you type.
Twilight.definePlugin({
  name: 'TypingSpeed',
  vs: 'No typing speed counter',
  desc: 'Words-per-minute counter as you type',
  start() {
    const T = Twilight; let keys = [], hide = 0;
    this.pill = Object.assign(document.createElement('div'), { id: 'tw-wpm' });
    this.pill.style.cssText = 'position:fixed;right:24px;bottom:68px;z-index:200;padding:3px 10px;border-radius:12px;background:rgba(6,12,22,.8);color:#b9ecff;font:700 11px "gg sans","Segoe UI",sans-serif;pointer-events:none;display:none';
    document.documentElement.append(this.pill);
    this.on = e => {
      if (e.ctrlKey || e.metaKey || e.key.length !== 1 && e.key !== 'Backspace' || !e.target?.closest?.('[role="textbox"]')) return;
      if (e.key !== 'Backspace') keys.push(Date.now()); hide = Date.now() + 4000;
    };
    window.addEventListener('keydown', this.on, true);
    this.stopT = T.every('TypingSpeed', 500, () => {
      const now = Date.now(); keys = keys.filter(t => now - t < 10000);
      if (now > hide || keys.length < 3) { this.pill.style.display = 'none'; return; }
      const span = Math.max(2000, now - keys[0]), wpm = Math.round((keys.length / 5) / (span / 60000));
      this.pill.textContent = `${wpm} WPM`; this.pill.style.display = '';
    });
  },
  stop() { window.removeEventListener('keydown', this.on, true); this.stopT?.(); this.pill?.remove(); },
});
