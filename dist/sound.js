(() => {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-sound-toggle]')];
  const previews = [...document.querySelectorAll('[data-sound-preview]')];
  const levels = [...document.querySelectorAll('[data-sound-volume]')];
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const files = { sweep: 'soft-sweep.wav', back: 'soft-return.wav', key: 'soft-key.wav' };
  const buffers = {}, voices = new Set();
  let enabled = false, loading = false, context, master, loadPromise;
  let volume = .55, lastPlayed = -Infinity, lastSectionCue = -Infinity;
  let userScrollAt = -Infinity, suppressScrollUntil = 0;
  function update() {
    previews.forEach(b => { b.hidden = !enabled; b.disabled = loading; });
    levels.forEach(input => { input.closest('label').hidden = !enabled; });
    buttons.forEach(b => {
      b.setAttribute('aria-pressed', String(enabled));
      b.setAttribute('aria-label', enabled ? 'Mute interface sounds' : 'Enable soft transition sounds');
      b.querySelector('.sound-label').textContent = loading && enabled ? 'Loading sounds…' : enabled ? 'Sound on' : 'Sound off';
    });
  }
  function hush() {
    if (!context) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, .012);
    voices.forEach(v => { try { v.stop(now + .05); } catch {} });
  }
  async function prepare() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
    }
    // Resume in the trusted user gesture before fetching and decoding samples.
    if (context.state !== 'running') await context.resume();
    if (!loadPromise) loadPromise = Promise.all(Object.entries(files).map(async ([key, file]) => {
      const response = await fetch(`assets/audio/${file}`);
      if (!response.ok) throw new Error('Audio unavailable');
      buffers[key] = await context.decodeAudioData(await response.arrayBuffer());
    })).catch(error => { loadPromise = undefined; throw error; });
    await loadPromise;
  }
  function sample(name, strength, rate = 1, delay = 0) {
    if (!buffers[name]) return;
    const source = context.createBufferSource(), envelope = context.createGain();
    source.buffer = buffers[name]; source.playbackRate.value = rate;
    const start = context.currentTime + .008 + delay, length = source.buffer.duration / rate;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(strength, start + .012);
    envelope.gain.setValueAtTime(strength, start + Math.max(.015, length - .075));
    envelope.gain.linearRampToValueAtTime(0, start + length);
    source.connect(envelope).connect(master); voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); envelope.disconnect(); };
    source.start(start); source.stop(start + length + .01);
  }
  function play(kind) {
    if (!enabled || loading || document.hidden || context?.state !== 'running') return;
    const now = performance.now();
    if (now - lastPlayed < 180) return;
    lastPlayed = now;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(.45 * volume, context.currentTime, .015);
    if (kind === 'preview') {
      hush(); master.gain.setTargetAtTime(.45 * volume, context.currentTime + .06, .015);
      sample('sweep', .85, 1, .07); sample('key', .8, .95, .65); sample('back', .65, 1.1, 1.05);
    } else if (kind === 'close') sample('back', .70, 1.3);
    else if (kind === 'step') { sample('sweep', .45, 1.45); sample('key', .55, .95, .09); }
    else if (kind === 'key') sample('key', .8, .94);
    else if (kind === 'section') sample('sweep', .40, .9);
    else sample('sweep', .85, kind === 'navigate' ? .85 : 1);
  }
  buttons.forEach(button => button.addEventListener('click', async () => {
    enabled = !enabled;
    if (!enabled) { hush(); update(); return; }
    loading = true; update();
    try { await prepare(); loading = false; update(); if (enabled) play('preview'); }
    catch {
      enabled = false; loading = false; hush(); update();
      buttons.forEach(b => { b.querySelector('.sound-label').textContent = 'Retry sound'; });
    }
  }));
  previews.forEach(button => button.addEventListener('click', () => play('preview')));
  levels.forEach(input => {
    input.addEventListener('input', () => {
      volume = Number(input.value) / 100;
      if (enabled && master) master.gain.setTargetAtTime(.45 * volume, context.currentTime, .03);
    });
    input.addEventListener('change', () => play('section'));
  });
  if (!AudioContext) buttons.forEach(b => { b.hidden = true; });
  update();
  document.addEventListener('portfolio:transition', event => play(event.detail.kind));
  document.addEventListener('click', event => {
    if (event.target.closest('.language-credential summary, #field-toggle')) play('key');
    else if (event.target.closest('a[href^="#"]')) {
      suppressScrollUntil = performance.now() + 1600;
      play('navigate');
    }
  });
  // One quiet sweep as a new section enters the reading area, never per pixel.
  function scrollIntent() { userScrollAt = performance.now(); }
  window.addEventListener('wheel', scrollIntent, { passive: true });
  window.addEventListener('touchmove', scrollIntent, { passive: true });
  window.addEventListener('keydown', e => {
    if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', ' ', 'Home', 'End'].includes(e.key)) scrollIntent();
  });
  let section;
  let observer, resizeTimer;
  function observeSections() {
  observer?.disconnect();
  observer = new IntersectionObserver(entries => {
    const current = entries.find(e => e.isIntersecting);
    if (!current || current.target === section) return;
    section = current.target;
    const now = performance.now();
    if (reduced.matches || document.querySelector('dialog[open]') || now < suppressScrollUntil || now - userScrollAt > 1600 || now - lastSectionCue < 1800) return;
    if (enabled && !loading) { lastSectionCue = now; play('section'); }
  }, { rootMargin: `-${Math.round(innerHeight * .42)}px 0px -${Math.round(innerHeight * .48)}px 0px`, threshold: 0 });
  document.querySelectorAll('main > section').forEach(el => observer.observe(el));
  }
  observeSections();
  window.addEventListener('resize', () => {
    suppressScrollUntil = performance.now() + 600;
    clearTimeout(resizeTimer); resizeTimer = setTimeout(observeSections, 150);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hush(); });
  window.addEventListener('pagehide', hush);
})();
