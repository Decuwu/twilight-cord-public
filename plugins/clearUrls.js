// Strips tracking parameters from links in messages you send or edit.
Twilight.definePlugin({
  name: 'ClearURLs',
  vs: "Links you send keep their tracking junk (utm_, fbclid...)",
  desc: 'Removes tracking junk from links you send',
  start() {
    const P = /^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|igshid|mc_cid|mc_eid|_hsenc|_hsmi|yclid|twclid|ttclid|ref_src|ref_url)$/;
    const clean = raw => {
      const tail = raw.match(/[).,!?]+$/)?.[0] || '', link = raw.slice(0, raw.length - tail.length);
      try {
        const u = new URL(link), yt = /(^|\.)(youtu\.be|youtube\.com|spotify\.com)$/.test(u.hostname);
        let hit = false;
        for (const k of [...u.searchParams.keys()])
          if (P.test(k) || (yt && k === 'si') || (/youtube/.test(u.hostname) && k === 'feature')) { u.searchParams.delete(k); hit = true; }
        return hit ? u.toString() + tail : raw;
      } catch { return raw; }
    };
    const cleanText = s => s.replace(/https?:\/\/[^\s<>]+/g, clean);
    const fix = msg => {
      if (!msg || typeof msg.content !== 'string') return;
      const before = msg.content;
      msg.content = cleanText(before);
      if (msg.content !== before) Twilight.log('ClearURLs: cleaned a link');
    };

    // 1) Network hook (installed early by core). Catches the message request itself.
    this.hook = req => {
      if (req.method?.toUpperCase() !== 'POST' && req.method?.toUpperCase() !== 'PATCH') return;
      if (typeof req.body !== 'string' || !/\/api\/v\d+\/channels\/\d+\/messages(\/\d+)?$/.test(req.url.split('?')[0])) return;
      const body = JSON.parse(req.body);
      if (typeof body.content !== 'string') return;
      const out = cleanText(body.content);
      if (out !== body.content) { req.body = JSON.stringify({ ...body, content: out }); Twilight.log('ClearURLs: cleaned a link (network)'); }
    };
    Twilight.net.add(this.hook);

    // 2) Hook Discord's own sendMessage/editMessage (what the chat box calls), in case requests are built another way.
    this.cancel = Twilight.waitFor(m => typeof m.sendMessage === 'function' && typeof m.editMessage === 'function', m => {
      try {
        const send = m.sendMessage, edit = m.editMessage;
        m.sendMessage = function (ch, msg, ...r) { fix(msg); return send.call(this, ch, msg, ...r); };
        m.editMessage = function (ch, id, msg, ...r) { fix(msg); return edit.call(this, ch, id, msg, ...r); };
        this.mod = m; this.orig = { send, edit };
        Twilight.log('ClearURLs: hooked sendMessage and editMessage');
      } catch (e) { Twilight.log('ClearURLs: could not hook sendMessage, using network hook only:', e.message); }
    }, 60000, () => Twilight.log('ClearURLs: sendMessage not found, using network hook only'));
  },
  stop() {
    Twilight.net.remove(this.hook);
    this.cancel?.();
    if (this.mod && this.orig) { this.mod.sendMessage = this.orig.send; this.mod.editMessage = this.orig.edit; }
    this.mod = this.orig = null;
  },
});
