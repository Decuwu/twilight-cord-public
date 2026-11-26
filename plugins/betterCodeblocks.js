// BetterCodeblocks: a small header bar on top of each code block with its language (like Replugged's) and how many lines it has.
// Reads the language Discord already put on the block; looks at each message once through the shared message scanner.
Twilight.definePlugin({
  name: 'BetterCodeblocks',
  added: '1.25.0',
  place: 'Channel',
  desc: 'Adds a header with the language (and line count) to code blocks',
  vs: 'Code blocks do not say what language they are',
  options: [{ key: 'lines', label: 'Also show how many lines', def: true }],
  NAMES: { js: 'JavaScript', javascript: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX', py: 'Python', python: 'Python', rb: 'Ruby', ruby: 'Ruby',
    cs: 'C#', csharp: 'C#', cpp: 'C++', 'c++': 'C++', c: 'C', h: 'C', java: 'Java', kt: 'Kotlin', kotlin: 'Kotlin', go: 'Go', rs: 'Rust', rust: 'Rust', php: 'PHP', lua: 'Lua', swift: 'Swift',
    sh: 'Shell', bash: 'Bash', zsh: 'Shell', shell: 'Shell', ps1: 'PowerShell', powershell: 'PowerShell', bat: 'Batch', cmd: 'Batch', json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML', ini: 'INI',
    xml: 'XML', html: 'HTML', css: 'CSS', scss: 'SCSS', less: 'Less', sql: 'SQL', md: 'Markdown', markdown: 'Markdown', diff: 'Diff', dockerfile: 'Dockerfile', ansi: 'ANSI', glsl: 'GLSL', hlsl: 'HLSL', vb: 'Visual Basic' },
  start() {
    const T = Twilight, me = this;
    me.css = Object.assign(document.createElement('style'), { textContent:
      // The header sits inside the block's own frame, above the code, with a hairline under it (Discord's copy button stays where it is).
      'pre>.tw-cblang{display:flex;gap:8px;align-items:baseline;margin:0;padding:5px 10px 4px;border-bottom:1px solid var(--border-subtle,rgba(255,255,255,.08));background:var(--background-mod-subtle,rgba(255,255,255,.03));border-radius:4px 4px 0 0;font:700 11px/14px var(--font-primary,"gg sans",sans-serif);letter-spacing:.02em;color:var(--text-muted,#949ba4);user-select:none;white-space:normal}' +
      'pre>.tw-cblang small{font:500 10px/14px var(--font-primary,"gg sans",sans-serif);opacity:.75}' });
    document.documentElement.append(me.css);
    // The language comes from the message text itself (```py ...): Discord only adds its language class once its highlighter has run,
    // which can be after this looks. The blocks in the text and on the page are in the same order.
    const fences = text => [...String(text || '').matchAll(/```(?:([^\s`]*)[ \t]*\n)?[\s\S]*?```/g)].map(m => (m[1] || '').trim());
    me.off = T.msgScan.add('BetterCodeblocks', (li, info) => {
      const langs = fences(info?.msg?.content);
      [...li.querySelectorAll('[id^="message-content-"] pre')].forEach((pre, i) => {
        if (pre.querySelector(':scope > .tw-cblang')) return;
        const code = pre.querySelector('code'); if (!code) return;
        const lang = langs[i] ?? [...code.classList].find(c => c.startsWith('language-'))?.slice(9) ?? '';
        const n = (code.textContent.replace(/\n$/, '').match(/\n/g)?.length || 0) + 1;
        const label = document.createElement('div'); label.className = 'tw-cblang';
        label.textContent = lang ? (me.NAMES[lang.toLowerCase()] || lang) : 'Plain text';
        if (T.opt('BetterCodeblocks', 'lines', true)) label.append(Object.assign(document.createElement('small'), { textContent: `${n} line${n === 1 ? '' : 's'}` }));
        pre.prepend(label);
      });
    });
    me.onOpt = e => { if (e.detail?.plugin !== 'BetterCodeblocks') return; document.querySelectorAll('.tw-cblang').forEach(n => n.remove()); T.msgScan.again('BetterCodeblocks'); };
    window.addEventListener('tw-opt', me.onOpt);
  },
  stop() { this.off?.(); window.removeEventListener('tw-opt', this.onOpt); document.querySelectorAll('.tw-cblang').forEach(n => n.remove()); this.css?.remove(); },
});
