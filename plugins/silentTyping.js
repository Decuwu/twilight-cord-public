// Silent typing: nobody sees "… is typing" while you write. A button in the message box (left of the GIF button) turns it on and off
// without opening the menu; it is lit while your typing is hidden.
Twilight.definePlugin({
  name: 'SilentTyping',
  vs: "Everyone sees 'typing...' while you write",
  desc: 'Hides your typing indicator; switch it on and off with the button in the message box',
  options: [
    { key: 'hide', label: 'Hide my typing indicator (also the button in the message box)', def: true },
    { key: 'button', label: 'Show the on/off button in the message box', def: true },
  ],
  ICON: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 12H4V7h16v10ZM6 9h2v2H6V9Zm3 0h2v2H9V9Zm3 0h2v2h-2V9Zm3 0h3v2h-3V9ZM6 12h2v2H6v-2Zm3 0h6v2H9v-2Zm7 0h2v2h-2v-2Z"/><path d="M3.3 2.3 21.7 20.7l-1.4 1.4L1.9 3.7z"/></svg>',
  hidden() { return Twilight.opt('SilentTyping', 'hide', true); },
  start() {
    const T = Twilight, me = this;
    // Discord tells everyone "X is typing" with one small web request (POST /channels/<id>/typing) while you write. While hiding is on, that request is
    // never sent: it is answered on the spot with "204 no content", so Discord thinks it worked and nothing leaves your PC. Switched live by the button.
    // (Older versions patched Discord's startTyping function; Discord moved it, so this works at the request itself.)
    const isTyping = u => /\/channels\/\d+\/typing(\?|$)/.test(String(u));
    me.nativeOpen = XMLHttpRequest.prototype.open; me.nativeSend = XMLHttpRequest.prototype.send; me.nativeFetch = window.fetch;
    me.xhrOpen = function (m, u, ...r) { this.__twTyping = isTyping(u); return me.nativeOpen.call(this, m, u, ...r); };
    me.xhrSend = function (...a) {
      if (this.__twTyping && me.hidden()) {
        const x = this; me.blocked = (me.blocked || 0) + 1;
        setTimeout(() => { try {
          for (const [k, v] of Object.entries({ readyState: 4, status: 204, statusText: 'No Content', response: '', responseText: '', responseURL: '' })) Object.defineProperty(x, k, { value: v, configurable: true });
          x.dispatchEvent(new Event('readystatechange')); x.dispatchEvent(new ProgressEvent('load')); x.dispatchEvent(new ProgressEvent('loadend'));
        } catch {} }, 0);
        return;
      }
      return me.nativeSend.apply(this, a);
    };
    me.fetchHook = function (u, ...r) { if (me.hidden() && isTyping(u?.url || u)) { me.blocked = (me.blocked || 0) + 1; return Promise.resolve(new Response(null, { status: 204 })); } return me.nativeFetch.call(this, u, ...r); };
    XMLHttpRequest.prototype.open = me.xhrOpen; XMLHttpRequest.prototype.send = me.xhrSend; window.fetch = me.fetchHook;
    const button = () => {
      me.undoBtn?.(); me.undoBtn = null;
      if (!T.opt('SilentTyping', 'button', true)) return;
      me.undoBtn = T.chatButton({
        id: 'silent', icon: me.ICON,
        on: () => me.hidden(),
        label: () => me.hidden() ? 'Silent typing is on: nobody sees you typing (click to show it again)' : 'Silent typing is off: others see you typing (click to hide it)',
        click: () => { const v = !me.hidden(); T.setOpt('SilentTyping', 'hide', v); T.notify('Silent typing', v ? 'On: nobody sees you typing' : 'Off: others see you typing', 1800, 'info'); },
      });
    };
    button();
    this.onOpt = e => { if (e.detail?.plugin !== 'SilentTyping') return; if (e.detail.key === 'button') button(); else T.refreshChatButtons(); };
    window.addEventListener('tw-opt', this.onOpt);
  },
  stop() {
    this.undoBtn?.(); this.undoBtn = null;
    window.removeEventListener('tw-opt', this.onOpt);
    if (XMLHttpRequest.prototype.open === this.xhrOpen) XMLHttpRequest.prototype.open = this.nativeOpen; // only if nobody wrapped ours since
    if (XMLHttpRequest.prototype.send === this.xhrSend) XMLHttpRequest.prototype.send = this.nativeSend;
    if (window.fetch === this.fetchHook) window.fetch = this.nativeFetch;
  },
});
