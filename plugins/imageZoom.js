// Hold Shift over an image to magnify it under the cursor; scroll (with Shift held) to change the zoom.
Twilight.definePlugin({
  name: 'ImageZoom',
  vs: "Clicking opens a viewer; no hover magnifier",
  desc: 'Hold Shift over an image to magnify it (Shift+scroll changes zoom)',
  start() {
    let zoom = 2.5, shift = false, pt = null, raf = 0, hideT = 0, shown = false;
    const R = 90, lens = document.createElement('div');
    lens.style.cssText = `position:fixed;z-index:2147483644;pointer-events:none;display:none;width:${R * 2}px;height:${R * 2}px;border-radius:50%;` +
      'border:2px solid #6cc8ff;box-shadow:0 0 18px rgba(0,0,0,.7);background-repeat:no-repeat;background-color:#000';
    document.documentElement.append(lens);
    this.lens = lens;

    const hide = why => {
      clearTimeout(hideT); hideT = 0;
      if (!shown) return;
      shown = false; lens.style.display = 'none';
      Twilight.log('ImageZoom: lens hidden (' + why + ')');
    };
    const draw = () => {
      raf = 0;
      if (!shift || !pt) return hide('shift released');
      const img = document.elementsFromPoint(pt.x, pt.y).find(x => x.tagName === 'IMG' && x.naturalWidth >= 48 && x.getBoundingClientRect().width >= 48);
      if (!img) { hideT ||= setTimeout(() => hide('no image under cursor'), 160); return; } // short grace so image re-renders don't flicker it away
      clearTimeout(hideT); hideT = 0;
      const r = img.getBoundingClientRect();
      lens.style.left = pt.x - R + 'px';
      lens.style.top = pt.y - R + 'px';
      const src = `url("${img.currentSrc || img.src}")`;
      if (lens.style.backgroundImage !== src) lens.style.backgroundImage = src;
      lens.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`;
      lens.style.backgroundPosition = `${R - (pt.x - r.left) * zoom}px ${R - (pt.y - r.top) * zoom}px`;
      if (!shown) { shown = true; lens.style.display = 'block'; }
    };
    const kick = () => { raf ||= requestAnimationFrame(draw); };
    // Shift state comes from key events (and is corrected by every mouse move), so a stray event can't switch it off by itself.
    this.move = e => { pt = { x: e.clientX, y: e.clientY }; shift = e.shiftKey; if (shift || shown) kick(); }; // no frame work for ordinary mouse moves
    this.down = e => { if (e.key === 'Shift') { shift = true; kick(); } };
    this.up = e => { if (e.key === 'Shift') { shift = false; kick(); } };
    this.blur = () => { shift = false; kick(); };
    this.wheel = e => {
      if (!e.shiftKey || !shown) return;
      e.preventDefault();
      zoom = Math.min(10, Math.max(1.5, zoom * ((e.deltaY || e.deltaX) < 0 ? 1.15 : 0.87)));
      kick();
    };
    window.addEventListener('mousemove', this.move, { passive: true, capture: true });
    window.addEventListener('keydown', this.down, true);
    window.addEventListener('keyup', this.up, true);
    window.addEventListener('blur', this.blur);
    window.addEventListener('wheel', this.wheel, { passive: false, capture: true });
  },
  stop() {
    window.removeEventListener('mousemove', this.move, true);
    window.removeEventListener('keydown', this.down, true);
    window.removeEventListener('keyup', this.up, true);
    window.removeEventListener('blur', this.blur);
    window.removeEventListener('wheel', this.wheel, true);
    this.lens?.remove();
  },
});
