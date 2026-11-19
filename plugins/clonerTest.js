// Background test of "add an emoji / sticker to a server". The cloner feature was removed from the menus because it did not work.
// This plugin keeps testing it quietly on every launch, ONLY inside a server you own called "test server" (create one if you have none),
// until it passes once. It adds a tiny test emoji and sticker, deletes them again, and writes everything to reports/cloner.log.
Twilight.definePlugin({
  name: 'ClonerTest',
  devOnly: true, // Off until switched on in the menu: it uploads and deletes test emoji / stickers through Discord's API on launch.
  vs: 'Nothing',
  desc: 'Tests emoji / sticker upload in the background, in a server called "test server"',
  options: [{ key: 'auto', label: 'Test on launch until it works', def: true }],
  actions: [
    { label: 'Run the cloner test now', sub: 'ClonerTest', run() { Twilight.ls.set('clonerPassedV2', false); Twilight.plugins.get('ClonerTest').test(true); } },
  ],
  lines: [],
  say(t) { this.lines.push(`${new Date().toISOString().slice(11, 19)} ${t}`); Twilight.log('ClonerTest: ' + t); },
  async flush() { await Twilight.cmd({ type: 'report', name: 'cloner.log', text: this.lines.join('\n') }, 6000); },
  async test(manual) {
    const T = Twilight; this.lines = []; if (this.busy) return; this.busy = true;
    try {
      this.say(`start (v${T.debug.version})`);
      const api = T.rest(); this.say('REST client: ' + (api ? 'found' : 'MISSING'));
      const GS = T.findStore('GuildStore'), PS = T.findStore('PermissionStore'), me = T.findStore('UserStore')?.getCurrentUser?.()?.id;
      const g = GS && Object.values(GS.getGuilds()).find(x => /^test server$/i.test(x.name.trim()) && x.ownerId === me);
      if (!api || !g) { this.say(g ? 'cannot continue without the REST client' : 'no server called "test server" that you own: create one and this runs on the next launch'); if (manual) T.notify('Cloner test', g ? 'REST client missing' : 'Make a server called "test server" first', 6000, 'warn'); return; }
      let ok = true;
      const fail = (what, e) => { ok = false; this.say(`${what} FAILED: ${e?.status || ''} ${String(e?.body?.message || e?.message || JSON.stringify(e?.body || e)).slice(0, 200)} ${e?.body?.errors ? JSON.stringify(e.body.errors).slice(0, 200) : ''}`); };
      // 1x1 PNG
      const png1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const tag = 'twtest' + Math.random().toString(36).slice(2, 6);
      let emojiId;
      try { const r = await api.post({ url: `/guilds/${g.id}/emojis`, body: { name: tag, image: png1 } }); emojiId = r.body?.id; this.say('emoji upload OK id=' + emojiId); } catch (e) { fail('emoji upload', e); }
      if (emojiId) try { await api.del({ url: `/guilds/${g.id}/emojis/${emojiId}` }); this.say('emoji delete OK'); } catch (e) { fail('emoji delete', e); }
      // sticker: 320x320 PNG made on a canvas
      let stickerId;
      try {
        const cv = Object.assign(document.createElement('canvas'), { width: 320, height: 320 }), c = cv.getContext('2d'); c.fillStyle = '#4a90d9'; c.beginPath(); c.arc(160, 160, 150, 0, 7); c.fill();
        const blob = await new Promise(r => cv.toBlob(r, 'image/png')), fd = new FormData();
        fd.append('name', tag); fd.append('tags', 'test'); fd.append('description', 'twilight test'); fd.append('file', blob, 'test.png');
        const r = await api.post({ url: `/guilds/${g.id}/stickers`, body: fd }); stickerId = r.body?.id; this.say('sticker upload OK id=' + stickerId);
      } catch (e) { fail('sticker upload', e); }
      if (stickerId) try { await api.del({ url: `/guilds/${g.id}/stickers/${stickerId}` }); this.say('sticker delete OK'); } catch (e) { fail('sticker delete', e); }
      this.say(ok ? 'PASSED' : 'FAILED (will try again next launch)');
      if (ok) T.ls.set('clonerPassedV2', true);
      if (manual || ok) T.notify('Cloner test', ok ? 'Passed: upload works' : 'Failed. Details are in reports/cloner.log', 5000, ok ? 'success' : 'warn');
    } catch (e) { this.say('crashed: ' + (e?.message || e)); }
    finally { this.busy = false; await this.flush(); }
  },
  start() {
    // Wait for Discord to finish loading, then test once per launch (only while it has never passed).
    this.t = setTimeout(() => { if (Twilight.opt('ClonerTest', 'auto', true) && !Twilight.ls.get('clonerPassedV2', false)) this.test(false); }, 40000);
  },
  stop() { clearTimeout(this.t); },
});
