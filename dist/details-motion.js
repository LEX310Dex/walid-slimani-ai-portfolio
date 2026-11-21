/* Small, interruptible motion on the original published composition. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const enabled = () => !reduced.matches && !document.body.classList.contains('paused');
  const animations = new Set();
  const cards = [];
  function animate(node, frames, options) {
    const animation = node.animate(frames, options);
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    return animation;
  }
  document.querySelectorAll('.project-visual').forEach(card => {
    const art = card.querySelector(':scope > svg, :scope > img');
    if (!art) return;
    const layer = document.createElement('div');
    layer.className = 'art-depth';
    art.before(layer); layer.append(art);
    const state = { layer, frame: 0, x: 0, y: 0, traced: 0, traces: [] };
    cards.push(state);
    function reset() {
      cancelAnimationFrame(state.frame); state.frame = 0;
      layer.style.transform = '';
    }
    card.addEventListener('pointermove', event => {
      if (!enabled() || !fine.matches) return;
      const rect = card.getBoundingClientRect();
      state.x = (event.clientX - rect.left) / rect.width - .5;
      state.y = (event.clientY - rect.top) / rect.height - .5;
      if (state.frame) return;
      state.frame = requestAnimationFrame(() => {
        state.frame = 0;
        if (enabled()) layer.style.transform = `perspective(1000px) rotateX(${-state.y * 2}deg) rotateY(${state.x * 2}deg) translate(${state.x * 5}px,${state.y * 5}px)`;
      });
    }, { passive: true });
    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset);
    function trace() {
      if (!enabled() || performance.now() - state.traced < 2200) return;
      state.traced = performance.now();
      const paths = [...art.querySelectorAll('path')].filter(path => {
        const style = getComputedStyle(path);
        return style.fill === 'none' && style.stroke !== 'none' && path.getTotalLength() > 90 && !path.closest('[opacity=".1"]');
      }).slice(0, 3);
      paths.forEach((path, index) => {
        const line = path.cloneNode(false);
        line.removeAttribute('class'); line.removeAttribute('id');
        const length = path.getTotalLength();
        const style = getComputedStyle(path);
        line.setAttribute('aria-hidden', 'true');
        line.setAttribute('class', 'art-trace');
        line.style.cssText = `fill:none;stroke:${style.stroke};stroke-width:1.8;stroke-dasharray:${length};stroke-dashoffset:${length};pointer-events:none`;
        path.after(line); state.traces.push(line);
        const animation = animate(line, [
          { strokeDashoffset: length, opacity: 0 },
          { strokeDashoffset: length * .8, opacity: .9, offset: .18 },
          { strokeDashoffset: 0, opacity: .8, offset: .78 },
          { strokeDashoffset: 0, opacity: 0 }
        ], { duration: 1650, delay: index * 120, easing: 'cubic-bezier(.22,.61,.36,1)' });
        animation.finished.catch(() => {}).finally(() => { line.remove(); state.traces = state.traces.filter(n => n !== line); });
      });
    }
    card.addEventListener('pointerenter', () => { if (fine.matches) trace(); });
    card.addEventListener('focus', trace);
  });
  const mark = document.querySelector('.about-mark');
  const orbits = mark ? [...mark.querySelectorAll('.orbit')] : [];
  let frame = 0, visible = false;
  const bases = [-35, 35, 65];
  function render() {
    frame = 0;
    if (!enabled() || !visible) return;
    const rect = mark.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height))) - .5;
    orbits.forEach((orbit, index) => { orbit.style.transform = `rotate(${bases[index] + progress * (index % 2 ? -28 : 28)}deg)`; });
  }
  function schedule() { if (!frame && visible && enabled()) frame = requestAnimationFrame(render); }
  if (mark) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(mark);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  function sync() {
    if (enabled()) { schedule(); return; }
    animations.forEach(animation => animation.cancel());
    cards.forEach(state => { cancelAnimationFrame(state.frame); state.frame = 0; state.layer.style.transform = ''; state.traces.forEach(line => line.remove()); });
    cancelAnimationFrame(frame); frame = 0;
    orbits.forEach(orbit => { orbit.style.transform = ''; });
  }
  reduced.addEventListener('change', sync);
  document.addEventListener('portfolio:motion', sync);
  document.addEventListener('visibilitychange', () => { if (document.hidden) animations.forEach(animation => animation.cancel()); });
})();
