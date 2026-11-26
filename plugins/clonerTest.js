// Background test of "add an emoji / sticker to a server". The cloner feature was removed from the menus because it did not work.
// This plugin keeps testing it quietly on every launch, ONLY inside a server you own called "test" or "test server" (create one if you have none),
// until it passes once. It adds a tiny test emoji and sticker, deletes them again, and writes everything to reports/cloner.log.
Twilight.definePlugin({
  name: 'ClonerTest',
  devOnly: true, // Off until switched on in the menu: it uploads and deletes test emoji / stickers through Discord's API on launch.
  vs: 'Nothing',
  desc: 'Tests emoji / sticker upload in the background, in a server called "test server"',
  options: [{ key: 'auto', label: 'Test on launch until it works', def: true }],
  actions: [
    { label: 'Run the cloner test now', sub: 'ClonerTest', run() { Twilight.ls.set('clonerPassedV3', false); Twilight.plugins.get('ClonerTest').test(true); } },
  ],
  lines: [],
  say(t) { this.lines.push(`${new Date().toISOString().slice(11, 19)} ${t}`); Twilight.log('ClonerTest: ' + t); },
  async flush() { await Twilight.cmd({ type: 'report', name: 'cloner.log', text: this.lines.join('\n') }, 6000); },
  async test(manual) {
    const T = Twilight; this.lines = []; if (this.busy) return; this.busy = true;
    try {
      this.say(`start (v${T.debug.version})`);
      const api = T.rest(); this.say('REST client: ' + (api ? 'found' : 'MISSING'));
      const GS = T.findStore('GuildStore'), me = T.findStore('UserStore')?.getCurrentUser?.()?.id;
      const g = GS && Object.values(GS.getGuilds()).find(x => /^test( server)?$/i.test(x.name.trim()) && x.ownerId === me);
      if (!api || !g) { this.say(g ? 'cannot continue without the REST client' : 'no server called "test" or "test server" that you own: create one and this runs on the next launch'); if (manual) T.notify('Cloner test', g ? 'REST client missing' : 'Make a server called "test" first', 6000, 'warn'); return; }
      let ok = true;
      const fail = (what, e) => { ok = false; this.say(`${what} FAILED: ${e?.status || ''} ${String(e?.body?.message || e?.message || JSON.stringify(e?.body || e)).slice(0, 200)} ${e?.body?.errors ? JSON.stringify(e.body.errors).slice(0, 200) : ''}`); };
      // 1x1 PNG
      const png1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const tag = 'twtest' + Math.random().toString(36).slice(2, 6);
      // 1.23.0: a pass needs proof. The upload must return an id, the item must really be listed on the server, and it must be gone after
      // the delete. (Up to 1.22 an answer without an id still counted as "upload OK", so the test passed without testing anything.)
      const shape = r => r == null ? String(r) : `status ${r.status ?? '?'}, body ${r.body == null ? 'none' : Array.isArray(r.body) ? 'list' : '{' + Object.keys(r.body).slice(0, 6).join(',') + '}'}`;
      const listed = async (kind, name) => { try { const r = await api.get({ url: `/guilds/${g.id}/${kind}` }); return Array.isArray(r?.body) ? r.body.find(x => x.name === name) || null : undefined; } catch (e) { fail(kind + ' list', e); return undefined; } };
      const check = async (kind, label, upload) => {
        let id = null, r;
        try { r = await upload(); id = r?.body?.id || null; this.say(`${label} upload answered: ${shape(r)}${id ? ' id=' + id : ''}`); } catch (e) { fail(label + ' upload', e); }
        const found = await listed(kind, tag);
        if (found === undefined) return;
        if (!id && found) { id = found.id; ok = false; this.say(`${label} upload FAILED the check: no id in the answer, but it was made (found by name); cleaning it up`); }
        else if (!id) { ok = false; this.say(`${label} upload FAILED: no id in the answer and nothing on the server`); return; }
        else if (!found) { ok = false; this.say(`${label} upload FAILED: id ${id} came back but it is not on the server`); }
        else this.say(`${label} is on the server: OK`);
        try { await api.del({ url: `/guilds/${g.id}/${kind}/${id}` }); } catch (e) { fail(label + ' delete', e); return; }
        const still = await listed(kind, tag);
        if (still) { ok = false; this.say(`${label} delete FAILED: still on the server`); } else if (still === null) this.say(`${label} deleted: OK`);
      };
      await check('emojis', 'emoji', () => api.post({ url: `/guilds/${g.id}/emojis`, body: { name: tag, image: png1 } }));
      // sticker: 320x320 PNG made on a canvas
      await check('stickers', 'sticker', async () => {
        const cv = Object.assign(document.createElement('canvas'), { width: 320, height: 320 }), c = cv.getContext('2d'); c.fillStyle = '#4a90d9'; c.beginPath(); c.arc(160, 160, 150, 0, 7); c.fill();
        const blob = await new Promise(r => cv.toBlob(r, 'image/png')), fd = new FormData();
        fd.append('name', tag); fd.append('tags', 'test'); fd.append('description', 'twilight test'); fd.append('file', blob, 'test.png');
        return api.post({ url: `/guilds/${g.id}/stickers`, body: fd });
      });
      this.say(ok ? 'PASSED' : 'FAILED (will try again next launch)');
      if (ok) T.ls.set('clonerPassedV3', true);
      if (manual || ok) T.notify('Cloner test', ok ? 'Passed: upload works' : 'Failed. Details are in reports/cloner.log', 5000, ok ? 'success' : 'warn');
    } catch (e) { this.say('crashed: ' + (e?.message || e)); }
    finally { this.busy = false; await this.flush(); }
  },
  start() {
    // Wait for Discord to finish loading, then test once per launch (only while it has never passed).
    this.t = setTimeout(() => { if (Twilight.opt('ClonerTest', 'auto', true) && !Twilight.ls.get('clonerPassedV3', false)) this.test(false); }, 40000);
  },
  stop() { clearTimeout(this.t); },
});
