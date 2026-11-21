/* Motion layer: word reveals, decoding labels, metric count-ups, section
   card expansion, velocity marquee, cursor follower and magnetic controls.
   Progressive enhancement only — if this file fails, the page is unchanged.
   Everything respects prefers-reduced-motion and the hero "Pause motion" button. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  if (reduced.matches) return;
  const paused = () => document.body.classList.contains('paused');
  const safe = (name, fn) => { try { fn(); } catch (error) { console.warn('[motion]', name, error); } };
  const once = (elements, callback, options = { threshold: .2 }) => {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { io.unobserve(entry.target); callback(entry.target); }
    }), options);
    elements.forEach(el => io.observe(el));
  };

  /* 1 · Headlines rise word by word from a mask. */
  safe('split', () => {
    const heads = [...document.querySelectorAll('h2.split')];
    heads.forEach(head => {
      let index = 0;
      const walk = node => [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { fragment.append(part); return; }
            const outer = document.createElement('span'), inner = document.createElement('span');
            outer.className = 'w'; inner.className = 'wi'; inner.style.setProperty('--i', index++); inner.textContent = part;
            outer.append(inner); fragment.append(outer);
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
      walk(head); head.classList.add('is-split');
    });
    once(heads, head => head.classList.add('in'), { threshold: .25 });
  });

  /* 2 · Labels decode from noise, like a model converging on its output. */
  safe('scramble', () => {
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/#_';
    const labels = [...document.querySelectorAll('.eyebrow, .credential-field')].filter(el =>
      !el.closest('.hero, dialog') && el.childNodes.length && [...el.childNodes].every(n => n.nodeType === 3) && el.textContent.trim().length > 2);
    once(labels, el => {
      if (paused()) return;
      const final = el.textContent, start = performance.now(), duration = Math.min(1100, 420 + final.length * 16);
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
      const frame = now => {
        const p = Math.min(1, (now - start) / duration);
        el.textContent = [...final].map((c, i) => (/[\s/·→&.,]/.test(c) || i / final.length < p) ? c : glyphs[(Math.random() * glyphs.length) | 0]).join('');
        if (p < 1) requestAnimationFrame(frame); else { el.textContent = final; el.style.minWidth = ''; }
      };
      requestAnimationFrame(frame);
    }, { threshold: .6 });
  });

  /* 3 · Reported metrics count up to their exact published values. */
  safe('count', () => {
    const metrics = [...document.querySelectorAll('#featured-projects .metric strong')].map(el => {
      const final = el.textContent, match = final.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
      return match && { el, final, pre: match[1], value: parseFloat(match[2]), decimals: (match[2].split('.')[1] || '').length, post: match[3] };
    }).filter(Boolean);
    metrics.forEach(m => { m.el.classList.add('is-counting'); m.el.textContent = m.pre + (0).toFixed(m.decimals) + m.post; });
    once(metrics.map(m => m.el), el => {
      const m = metrics.find(item => item.el === el), start = performance.now(), duration = 1700;
      if (paused()) { el.textContent = m.final; return; }
      const frame = now => {
        const p = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(2, -10 * p);
        el.textContent = p < 1 ? m.pre + (m.value * eased).toFixed(m.decimals) + m.post : m.final;
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, { threshold: .9 });
  });

  /* 4 · Velocity-reactive skills marquee. Scrolling speeds it up, skews it, and reverses it. */
  safe('marquee', () => {
    const band = document.querySelector('.ai-marquee'), track = band?.querySelector('.marquee-track');
    if (!track) return;
    track.append(...[...track.children].map(child => child.cloneNode(true)));
    const animation = track.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 42000, iterations: Infinity });
    let visible = false, boost = 0, lastY = scrollY, raf = 0;
    const tick = () => {
      raf = 0;
      if (!visible || paused()) return;
      const dy = scrollY - lastY; lastY = scrollY;
      boost += (Math.max(-7, Math.min(7, dy / 14)) - boost) * .12;
      animation.playbackRate = 1 + boost;
      band.style.setProperty('--skew', (-boost * 1.6).toFixed(2) + 'deg');
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (visible && !paused()) { animation.play(); lastY = scrollY; if (!raf) raf = requestAnimationFrame(tick); }
      else { animation.pause(); cancelAnimationFrame(raf); raf = 0; }
    };
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(band);
    document.addEventListener('portfolio:motion', sync);
  });

  /* 5 · Scroll choreography (GSAP ScrollTrigger, already bundled locally). */
  safe('scroll', () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    // Hero copy drifts and dims as the particle field scatters.
    gsap.to('.hero-copy', { yPercent: -12, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });
    // Colour-block sections expand from an inset card to full bleed.
    ['.statement', '.contact'].forEach(selector => {
      const el = document.querySelector(selector); if (!el) return;
      gsap.fromTo(el, { clipPath: 'inset(5% 3.5% 0% 3.5% round 36px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: .6 } });
    });
    // Project artwork opens like an aperture, art settling from a zoom.
    gsap.utils.toArray('.project-visual').forEach(card => {
      const art = card.querySelector('.art-depth > svg, .art-depth > img, :scope > svg, :scope > img');
      const timeline = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' } });
      timeline.fromTo(card, { clipPath: 'inset(16% 12% 16% 12% round 10px)' }, { clipPath: 'inset(0% 0% 0% 0% round 2px)', duration: 1.5, ease: 'expo.out', clearProps: 'clipPath' });
      if (art) timeline.fromTo(art, { scale: 1.22 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform',
        onStart: () => { art.style.transition = 'none'; }, onComplete: () => { art.style.transition = ''; } }, 0);
    });
    // Antenna stage gets the same aperture entrance.
    gsap.utils.toArray('.antenna-stage').forEach(stage => gsap.fromTo(stage, { clipPath: 'inset(10% 8% 10% 8% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 2px)', duration: 1.5, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: stage, start: 'top 85%', toggleActions: 'play none none none' } }));
    addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  });

  /* 6 · Spotlight that follows the pointer along the project list. */
  safe('spotlight', () => {
    document.querySelectorAll('.project-row').forEach(row => row.addEventListener('pointermove', event => {
      const box = row.getBoundingClientRect(); row.style.setProperty('--mx', (event.clientX - box.left) + 'px');
    }, { passive: true }));
  });

  if (!fine.matches) return;

  /* 7 · Cursor follower: grows on controls, becomes a "View" lens over project art. */
  safe('cursor', () => {
    const ring = document.createElement('div');
    ring.className = 'cursor-ring'; ring.setAttribute('aria-hidden', 'true'); ring.innerHTML = '<span>View ↗</span>';
    document.body.append(ring);
    let x = -200, y = -200, rx = -200, ry = -200, raf = 0;
    const tick = () => {
      rx += (x - rx) * .2; ry += (y - ry) * .2;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > .2 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      x = event.clientX; y = event.clientY;
      if (!ring.classList.contains('is-on')) { rx = x; ry = y; ring.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener('pointerover', event => {
      ring.classList.toggle('is-view', Boolean(event.target.closest('.project-visual')));
      ring.classList.toggle('is-link', Boolean(event.target.closest('a, button, input, summary, label, select')));
    });
    document.documentElement.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
    addEventListener('pointerdown', () => ring.classList.add('is-down'));
    addEventListener('pointerup', () => ring.classList.remove('is-down'));
  });

  /* 8 · Magnetic controls (uses the independent `translate` property so existing hover transforms still work). */
  safe('magnetic', () => {
    document.querySelectorAll('.round-link, .contact-cta, .nav-contact, .brand, .study-steps button, .dialog-close').forEach(el => {
      el.classList.add('magnetic');
      el.addEventListener('pointermove', event => {
        if (paused()) return;
        const box = el.getBoundingClientRect(), limit = 12;
        const dx = Math.max(-limit, Math.min(limit, (event.clientX - (box.left + box.width / 2)) * .35));
        const dy = Math.max(-limit, Math.min(limit, (event.clientY - (box.top + box.height / 2)) * .35));
        el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      }, { passive: true });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
    document.addEventListener('portfolio:motion', () => document.querySelectorAll('.magnetic').forEach(el => { el.style.translate = ''; }));
  });
})();
