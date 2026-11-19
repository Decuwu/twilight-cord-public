// Makes the role headings in the member list stand out as clear dividers.
Twilight.definePlugin({
  name: 'RoleDividers',
  vs: 'Role headings in the member list are small grey text',
  desc: 'Clear dividers for major roles in the member list',
  start() {
    this.s = Object.assign(document.createElement('style'), { textContent:
`html[data-tw-main] [class*="membersGroup"]{margin-top:10px;padding-top:12px;border-top:1px solid rgba(108,200,255,.22);color:#b9ecff!important;font-weight:800!important;letter-spacing:.08em}` });
    document.documentElement.append(this.s);
  },
  stop() { this.s?.remove(); },
});
