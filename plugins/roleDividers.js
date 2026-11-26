// Makes the role headings in the member list stand out as clear dividers: "OWNER — 1 ─────────" on one line.
// 1.25.0: only the heading itself is styled. The old rule matched every part whose class contains "membersGroup" (the heading, its
// inner row AND the role name), so each got its own border and spacing and the heading broke into three stacked lines.
Twilight.definePlugin({
  name: 'RoleDividers',
  vs: 'Role headings in the member list are small grey text',
  desc: 'Clear one-line dividers for the role headings in the member list',
  featured: 'Fixed: each heading is one line again',
  start() {
    this.s = Object.assign(document.createElement('style'), { textContent:
`html[data-tw-main] h3[class*="membersGroup_"]{margin-top:10px!important;padding-top:6px!important;color:#b9ecff!important}
html[data-tw-main] h3[class*="membersGroup_"] [class*="membersGroupHeader_"]{display:flex!important;align-items:center;white-space:nowrap;overflow:hidden;font-weight:800!important;letter-spacing:.06em;text-transform:uppercase;font-size:12px}
html[data-tw-main] h3[class*="membersGroup_"] [class*="membersGroupName_"]{overflow:hidden;text-overflow:ellipsis}
html[data-tw-main] h3[class*="membersGroup_"] [class*="membersGroupHeader_"]::after{content:"";flex:1 1 auto;min-width:12px;height:1px;margin-left:8px;background:rgba(108,200,255,.28)}` });
    document.documentElement.append(this.s);
  },
  stop() { this.s?.remove(); },
});
