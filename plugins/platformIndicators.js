// Small icons next to names showing whether someone is on desktop, phone or web.
Twilight.definePlugin({
  name: 'PlatformIndicators',
  heavy: true,
  vs: 'You cannot see which device someone is on',
  desc: 'Shows desktop / phone / web next to names',
  start() {
    const T = Twilight, ICON = { desktop: '🖥', mobile: '📱', web: '🌐' };
    const label = uid => {
      const c = T.findStore('PresenceStore')?.getState?.()?.clientStatuses?.[uid]; if (!c) return '';
      return Object.keys(c).filter(k => ICON[k]).map(k => ICON[k]).join('');
    };
    const put = (host, uid) => {
      const t = label(uid); let n = host.querySelector(':scope .tw-plat');
      if (!t) return n?.remove();
      if (!n) { n = Object.assign(document.createElement('span'), { className: 'tw-plat' }); n.style.cssText = 'margin-left:4px;font-size:11px;opacity:.85'; host.append(n); }
      if (n.textContent !== t) n.textContent = t;
    };
    this.off = T.msgScan.add('PlatformIndicators', (li, info) => { const id = info?.msg?.author?.id, h = li.querySelector('[class*="username"]'); if (id && h) put(h.parentElement, id); });
    this.stopT = T.every('PlatformIndicators', 4000, () => {
      for (const row of document.querySelectorAll('[data-list-item-id^="members"]')) {
        const uid = (row.dataset.listItemId.match(/(\d{15,})$/) || [])[1], name = row.querySelector('[class*="name"]');
        if (uid && name) put(name.parentElement, uid);
      }
    });
  },
  stop() { this.off?.(); this.stopT?.(); document.querySelectorAll('.tw-plat').forEach(n => n.remove()); },
});
