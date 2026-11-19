// Puts the tag commands into Discord's own slash-command list as a "Twilight" app (same look as any bot's commands):
//   /tag <name>  puts a saved tag in your message box   /tag-create <name> <text>  saves one   /tag-list   /tag-delete <name>
// Nothing is sent anywhere: when you press Enter on one of these, Twilight runs it locally and shows a reply only you can see.
// If anything goes wrong this plugin switches itself off and the older /tag suggestion list (Tags plugin) takes over again.
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
    const opt = o => { const r = { type: 3, name: o.name, description: o.description, required: !!o.required, max_length: o.max_length, description_localized: o.description, name_localized: o.name }; if (o.tags && names.length) r.choices = names.map(n => ({ name: n, value: n })); return r; };
    const commands = {};
    for (const c of me.all()) {
      const raw = c.opts.map(opt);
      const root = { id: c.id, type: 1, application_id: APP, version: ver, name: c.name, description: c.desc, options: raw, dm_permission: true, contexts: [0, 1, 2], integration_types: [0, 1], description_localized: c.desc, name_localized: c.name };
      const shown = raw.map(o => ({ ...o, serverLocalizedName: o.name, displayName: o.name, displayDescription: o.description, maxLength: o.max_length, ...(o.choices ? { choices: o.choices.map(x => ({ ...x, displayName: x.name })) } : {}) }));
      commands[c.id] = { version: ver, id: c.id, untranslatedName: c.name, serverLocalizedName: c.name, applicationId: APP, type: 1, inputType: 3, untranslatedDescription: c.desc, options: shown, rootCommand: root, dmPermission: true, displayName: c.name, displayDescription: c.desc, contexts: [0, 1, 2], integration_types: [0, 1] };
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
  // Discord keeps what you typed in the message box itself: "/tag-create" + "name" + hidden marker + value + "text" + hidden marker + value ...
  read(cmd, text) {
    const parts = String(text || '').split(/[​﻿]+/).filter(x => x !== ''), out = {};
    cmd.opts.forEach((o, i) => { out[o.name] = (parts[1 + 2 * i] || '').trim(); });
    return out;
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
    me.onKey = e => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      try {
        const cid = T.findStore('SelectedChannelStore').getChannelId(), c = T.findStore('ApplicationCommandStore').getActiveCommand(cid);
        if (!c || c.applicationId !== me.APP) return;
        e.preventDefault(); e.stopImmediatePropagation(); // ours: never let Discord send it as a bot request
        const def = me.all().find(x => x.name === c.untranslatedName), tg = tags(); if (!def || (!tg && !def.run)) return;
        const box = document.querySelector('[role="textbox"][data-slate-editor="true"]'), v = me.read(def, box?.textContent);
        try { T.ls.set('tagDbg', { cmd: def.name, box: box?.textContent?.slice(0, 200), v }); } catch {}
        const need = def.opts.filter(o => o.required && !v[o.name]);
        if (def.run) { // a command from another plugin (Petpet): clear the box, then let it run
          if (need.length) return Twilight.notify('/' + def.name, 'needs: ' + need.map(o => o.name).join(', '), 3500, 'warn');
          try { box?.focus(); document.execCommand('selectAll'); document.execCommand('delete'); } catch {}
          try { T.dispatcher()?.dispatch({ type: 'APPLICATION_COMMAND_SET_ACTIVE_COMMAND', channelId: cid, command: null, section: null }); } catch {}
          setTimeout(() => { try { def.run(v); } catch (x) { T.log('/' + def.name, x); } }, 50);
          return;
        }
        if (need.length) return tg.say('**/' + def.name + '** needs: ' + need.map(o => '`' + o.name + '`').join(', ') + '. Fill in each field, then press Enter.');
        const cmd = { cmd: def.sub, name: (v.name || '').replace(/^"|"$/g, '').split(/\s+/)[0].toLowerCase(), text: v.text || '' };
        tg.run(cmd, text => { try { box?.focus(); T.cmd({ type: 'edit', op: 'set', text: text || '' }); } catch {} });
        try { T.dispatcher()?.dispatch({ type: 'APPLICATION_COMMAND_SET_ACTIVE_COMMAND', channelId: cid, command: null, section: null }); } catch {}
      } catch (x) { me.fail(x); }
    };
    window.addEventListener('keydown', me.onKey, true);
    T.slash.onChange = () => { me.section = null; me.kick(); };
  },
  fail(e) { try { Twilight.notify('Tag commands', 'Switched off: ' + String(e).slice(0, 100), 6000, 'error'); } catch {} this.stop(); },
  stop() {
    if (Twilight.slash.onChange) Twilight.slash.onChange = null;
    this.undoFlux?.(); window.removeEventListener('keydown', this.onSlash, true); window.removeEventListener('keydown', this.onKey, true);
    try { const t = Twilight.plugins.get('Tags'); if (t) t.native = false; } catch {}
    try { const st = Twilight.findStore('ApplicationCommandIndexStore'); for (const ix of Object.values(st?.indices || {})) { delete ix.result?.sections?.[this.APP]; delete ix.result?.sectionIdsByBotId?.[this.APP]; } } catch {}
  },
});
