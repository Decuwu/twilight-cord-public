// Puts the tag commands into Discord's own slash-command list as a "Twilight" app (same look as any bot's commands):
//   /tag <name>  puts a saved tag in your message box   /tag-create <name> <text>  saves one   /tag-list   /tag-delete <name>
// They are real local app commands, like Discord's own /shrug: each one carries an execute() function, and Discord's command runner
// calls it on your PC instead of contacting a bot (it fills in the options itself, so a picked @user arrives as their user ID, and it
// clears the box). /tag sends the tag text as your message (like /shrug does); the others reply with a message only you can see.
// Nothing reaches Discord's servers except that /tag message. If anything goes wrong this plugin switches itself off and typing
// /tag ... by hand (Tags plugin) still works.
Twilight.definePlugin({
  name: 'Tag commands',
  vs: 'Not in the command list',
  desc: 'Adds /tag, /tag-create, /tag-list and /tag-delete to Discord’s slash-command list',
  APP: '9000000000000000001',
  CMDS: [
    { name: 'tag', id: '9000000000000000011', sub: 'use', desc: 'Put a saved tag in your message box', opts: [{ name: 'name', description: 'Which tag', required: true, max_length: 32, tags: true }] },
    { name: 'tag-create', id: '9000000000000000012', sub: 'create', desc: 'Save text under a name', opts: [{ name: 'name', description: 'Name for the tag (letters, numbers, _ and -)', required: true, max_length: 32 }, { name: 'text', description: 'The text to save', required: true, max_length: 1900 }] },
    { name: 'tag-list', id: '9000000000000000013', sub: 'list', desc: 'Show all your saved tags', opts: [] },
    { name: 'tag-delete', id: '9000000000000000014', sub: 'delete', desc: 'Remove a saved tag', opts: [{ name: 'name', description: 'Which tag', required: true, max_length: 32, tags: true }] },
  ],
  all() { return [...this.CMDS, ...Twilight.slash.cmds.values()]; }, // our own four + commands other plugins registered (Petpet)
  sigNow() { return this.tagNames().join('|') + '#' + [...Twilight.slash.cmds.keys()].join('|'); },
  tagNames() { return Object.keys(Twilight.ls.get('tags', {})).sort().slice(0, 25); },
  build() {
    const me = this, APP = me.APP, ver = '9000000000000000100', names = me.tagNames();
    me.sig = me.sigNow();
    const opt = o => { const r = { type: o.type || 3, name: o.name, description: o.description, required: !!o.required, ...(o.type ? {} : { max_length: o.max_length }), description_localized: o.description, name_localized: o.name }; if (o.tags && names.length) r.choices = names.map(n => ({ name: n, value: n })); else if (o.choices?.length) r.choices = o.choices.map(x => ({ name: x.name, value: x.value, name_localized: x.name })); return r; }; // a plugin's own fixed choices (e.g. /translate auto: Start / Disable) show as a pick list
    const commands = {};
    for (const c of me.all()) {
      const raw = c.opts.map(opt);
      const root = { id: c.id, type: 1, application_id: APP, version: ver, name: c.name, description: c.desc, options: raw, dm_permission: true, contexts: [0, 1, 2], integration_types: [0, 1], description_localized: c.desc, name_localized: c.name };
      const shown = raw.map(o => ({ ...o, serverLocalizedName: o.name, displayName: o.name, displayDescription: o.description, maxLength: o.max_length, ...(o.choices ? { choices: o.choices.map(x => ({ ...x, displayName: x.name })) } : {}) }));
      // inputType 1 = BUILT_IN_TEXT (only /tag): Discord runs execute() and sends what it returns ({ content }). Every other command is inputType 0 = BUILT_IN: it runs locally and sends NOTHING (with type 1, a null result made Discord post the typed command text, e.g. "/petpet user:@name", as a message).
      commands[c.id] = { version: ver, id: c.id, untranslatedName: c.name, serverLocalizedName: c.name, applicationId: APP, type: 1, inputType: c.sub === 'use' ? 1 : 0, untranslatedDescription: c.desc, options: shown, rootCommand: root, dmPermission: true, displayName: c.name, displayDescription: c.desc, contexts: [0, 1, 2], integration_types: [0, 1],
        execute: (opts, ctx) => me.exec(c, opts, ctx) };
    }
    const bot = { id: APP, username: 'Twilight', discriminator: '0', avatar: null, bot: true, system: false, flags: 0, publicFlags: 0, globalName: null };
    const descriptor = { type: 1, id: APP, name: 'Twilight', icon: null, application: { description: 'Twilight client tools', icon: null, id: APP, name: 'Twilight', bot, flags: '0', embedded_surfaces: [] }, isUserApp: false, botId: APP };
    return { descriptor, commands };
  },
  inject() {
    const T = Twilight, me = this; let n = 0;
    const st = T.findStore('ApplicationCommandIndexStore'); if (!st) return 0;
    if (!me.section || me.sig !== me.sigNow()) me.section = me.build(); // rebuilt when your saved tags change (they are the choices for /tag)
    const section = me.section;
    try { if (!T.findStore('ApplicationStore')?.getApplication(me.APP)) { const a = section.descriptor.application; T.dispatcher()?.dispatch({ type: 'APPLICATION_FETCH_SUCCESS', application: { id: me.APP, name: 'Twilight', icon: null, description: a.description, bot: a.bot, flags: 0, type: null } }); } } catch {}
    try { if (!T.findStore('UserStore')?.getUser(me.APP)) T.dispatcher()?.dispatch({ type: 'USER_UPDATE', user: { id: me.APP, username: 'Twilight', discriminator: '0', avatar: null, bot: true, global_name: null, public_flags: 0, flags: 0 } }); } catch {}
    const put = ix => { const r = ix?.result; if (!r || !r.sections) return; if (r.sections[me.APP] !== section) { r.sections[me.APP] = section; n++; } if (r.sectionIdsByBotId && r.sectionIdsByBotId[me.APP] !== me.APP) r.sectionIdsByBotId[me.APP] = me.APP; };
    for (const ix of Object.values(st.indices || {})) put(ix);
    try { put(st.getUserState()); } catch {} // DMs and group chats read the user-level list
    try { const cid = T.findStore('SelectedChannelStore').getChannelId(), ch = T.findStore('ChannelStore').getChannel(cid); if (ch) put(st.getContextState({ type: 'channel', channel: ch })); } catch {}
    return n;
  },
  // Called by Discord's command runner with the options it already parsed: [{ name, type, value }] (a user option's value is the user ID).
  exec(def, opts, ctx) {
    const T = Twilight, v = {}, tg = T.plugins.get('Tags');
    for (const o of opts || []) v[o.name] = o.value == null ? '' : String(o.value);
    this.report(def, v);
    try {
      if (def.run) { setTimeout(() => { try { def.run(v, ctx); } catch (x) { T.log('/' + def.name, x); } }, 0); return null; } // another plugin's command (Petpet)
      if (!tg) { T.notify('/' + def.name, 'The Tags plugin is off', 3000, 'warn'); return null; }
      const name = (v.name || '').replace(/^"|"$/g, '').split(/\s+/)[0].toLowerCase();
      if (def.sub === 'use') {
        const text = T.ls.get('tags', {})[name];
        if (text != null) return { content: text };
        tg.run({ cmd: 'use', name }, () => {}); return null; // no such tag: only-you-see reply with suggestions
      }
      tg.run({ cmd: def.sub, name, text: v.text || '' }, () => {});
    } catch (x) { T.log('/' + def.name, x); }
    return null;
  },
  // reports/tagcmd.json: the last command and the length of each value (never the text itself).
  report(def, v) {
    try { Twilight.cmd({ type: 'report', name: 'tagcmd.json', text: JSON.stringify({ at: new Date().toISOString(), cmd: def.name, how: 'discord', lengths: Object.fromEntries(def.opts.map(o => [o.name, (v[o.name] || '').length])) }, null, 1) }); } catch {}
  },
  start() {
    const T = Twilight, me = this, tags = () => T.plugins.get('Tags');
    // No timer: Discord's command list is put back whenever it is rebuilt (switching channel / server, the list arriving), and right
    // when you type "/" to open the picker (which also picks up tags you just saved). Each call is one short check.
    let pend = 0;
    const kick = () => { clearTimeout(pend); pend = setTimeout(() => { try { me.inject(); } catch (e) { me.fail(e); } }, 60); };
    me.kick = () => { kick(); setTimeout(kick, 400); };
    me.undoFlux = T.onFlux({ CHANNEL_SELECT: me.kick, GUILD_SELECT: me.kick, CONNECTION_OPEN: me.kick, APPLICATION_COMMAND_INDEX_FETCH_SUCCESS: me.kick, APPLICATION_COMMAND_INDEX_FETCH_REQUEST: me.kick }, 'Tag commands');
    me.onSlash = e => { if (e.key === '/' && !e.ctrlKey && !e.metaKey) { kick(); setTimeout(kick, 150); } };
    window.addEventListener('keydown', me.onSlash, { passive: true, capture: true });
    try { me.inject(); } catch (e) { return me.fail(e); }
    if (tags()) tags().native = true;
    if (T.ls.get('tagDbg', null)) T.ls.set('tagDbg', null); // the old debug copy kept the box text in settings.json
    T.slash.onChange = () => { me.section = null; me.kick(); };
  },
  fail(e) { try { Twilight.notify('Tag commands', 'Switched off: ' + String(e).slice(0, 100), 6000, 'error'); } catch {} this.stop(); },
  stop() {
    if (Twilight.slash.onChange) Twilight.slash.onChange = null;
    this.undoFlux?.(); window.removeEventListener('keydown', this.onSlash, true);
    try { const t = Twilight.plugins.get('Tags'); if (t) t.native = false; } catch {}
    try { const st = Twilight.findStore('ApplicationCommandIndexStore'); for (const ix of Object.values(st?.indices || {})) { delete ix.result?.sections?.[this.APP]; delete ix.result?.sectionIdsByBotId?.[this.APP]; } } catch {}
  },
});
