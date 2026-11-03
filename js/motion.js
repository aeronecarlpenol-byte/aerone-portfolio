/* Motion system: progressive enhancement, one-time entrances, and signal feedback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const intro = Boolean(hero && !reduced.matches && !location.hash &&
    !window.matchMedia('print').matches);
  const scene = hero ? initCursorSwarm() : null;

  /* The reference's orbiting cursor flock becomes a quiet, interactive field.
     It is decorative: it never captures input or delays navigation. */
  function initCursorSwarm() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.className = 'cursor-swarm';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const backdrop = document.createElement('div');
    backdrop.className = 'swarm-intro';
    backdrop.setAttribute('aria-hidden', 'true');
    const initial = document.createElement('span');
    initial.textContent = 'A';
    backdrop.appendChild(initial);
    if (intro) document.body.appendChild(backdrop);

    const colors = ['#9ae8df', '#b7d8ff', '#d7c2ff', '#f3c5dc', '#f0f5ff'];
    const coarse = window.matchMedia('(pointer: coarse)');
    const cursorCount = coarse.matches ? 3 : 6;
    const clusterSize = Math.ceil(cursorCount / 2);
    const flock = Array.from({ length: cursorCount }, function (_, i) {
      return { phase: (i % clusterSize) * .12 + Math.floor(i / clusterSize) * Math.PI,
        radius: 72 + (i % 3) * 15,
        x: 0, y: 0, angle: 0, size: 3.5 + (i % 3) * .6,
        color: colors[i % colors.length] };
    });
    const pointer = { x: 0, y: 0, active: false };
    let width, height, frame = 0, previous = 0;
    const started = performance.now();
    let introDone = !intro;
    let assemblies = [];
    const print = window.matchMedia('print');

    function finishIntro() {
      introDone = true;
      backdrop.remove();
      document.querySelectorAll('.hero .reveal').forEach(function (item) {
        item.style.setProperty('--reveal-delay', '0ms');
      });
    }
    // Independent of animation frames, so a hidden tab cannot retain the intro.
    const introTimeout = intro ? window.setTimeout(finishIntro, 3200) : 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw(now) {
      frame = 0;
      const elapsed = (now - started) / 1000;
      const step = previous ? Math.min((now - previous) / 16.667, 3) : 1;
      const firstFrame = !previous;
      previous = now;
      const spread = introDone ? 1 : Math.max(0, Math.min(1, (elapsed - 1.1) / .65));
      const eased = spread * spread * (3 - 2 * spread);
      ctx.clearRect(0, 0, width, height);
      flock.forEach(function (bird, i) {
        const orbit = bird.phase + elapsed * 2.4;
        const orbitX = width / 2 + Math.cos(orbit) * bird.radius;
        const orbitY = height / 2 + Math.sin(orbit) * bird.radius * .68;
        let targetX = width * (.06 + ((i * .618034) % .88)) + Math.sin(elapsed * .42 + i) * 55;
        let targetY = height * (.1 + ((i * .381966) % .8)) + Math.cos(elapsed * .36 + i) * 45;
        if (pointer.active) {
          const dx = targetX - pointer.x, dy = targetY - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 170 && distance > 0) {
            targetX -= dx / distance * (170 - distance) * .35;
            targetY -= dy / distance * (170 - distance) * .35;
          }
        }
        const x = orbitX + (targetX - orbitX) * eased;
        const y = orbitY + (targetY - orbitY) * eased;
        if (firstFrame) { bird.x = x; bird.y = y; }
        const dx = x - bird.x, dy = y - bird.y;
        const heading = eased < .05 ? orbit + Math.PI / 2 : Math.atan2(dy, dx);
        bird.x += dx * Math.min(1, .16 * step);
        bird.y += dy * Math.min(1, .16 * step);
        // Take the shortest turn so a cursor never snaps across the ±π seam.
        const turn = Math.atan2(Math.sin(heading - bird.angle), Math.cos(heading - bird.angle));
        bird.angle += turn * Math.min(1, .2 * step);
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.angle);
        ctx.globalAlpha = .8 - eased * .52;
        ctx.fillStyle = bird.color;
        ctx.strokeStyle = '#edf5ff';
        ctx.lineWidth = .45;
        ctx.beginPath();
        ctx.moveTo(bird.size, 0);
        ctx.lineTo(-bird.size * .7, -bird.size * .58);
        ctx.lineTo(-bird.size * .28, 0);
        ctx.lineTo(-bird.size * .7, bird.size * .58);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
      drawAssemblies(now);
      frame = requestAnimationFrame(draw);
    }

    function assemble(element, delay) {
      if (reduced.matches || print.matches || !element.getBoundingClientRect) return;
      // Keep the animation attached to the real element while the page scrolls.
      assemblies.push({ element: element, start: performance.now() + delay });
      if (assemblies.length > 18) assemblies.shift();
    }

    function drawAssemblies(now) {
      assemblies = assemblies.filter(function (item) { return now - item.start < 920; });
      assemblies.forEach(function (item) {
        const age = now - item.start;
        if (age < 0) return;
        const rect = item.element.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > height || rect.width < 8 || rect.height < 8) return;
        const progress = age / 920;
        const opacity = Math.min(1, age / 100) * Math.min(1, (920 - age) / 310);
        const x = rect.left, y = rect.top, w = rect.width, h = rect.height;
        ctx.save();
        ctx.globalAlpha = opacity * .85;
        ctx.strokeStyle = '#9fc9ff';
        ctx.lineWidth = .75;
        // A solid slate placeholder resolves into the real photograph/card.
        if (item.element.matches('.hero-portrait, .electronics-card, .research-gallery__item')) {
          ctx.fillStyle = '#344c68';
          ctx.globalAlpha = opacity * Math.max(0, 1 - progress * 1.8) * .85;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = opacity * .85;
        }
        ctx.setLineDash([w + h, w + h]);
        ctx.lineDashOffset = (w + h) * (1 - Math.min(1, progress * 3));
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
        ctx.globalAlpha = opacity * .22;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(width, y);
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
        ctx.stroke();
        ctx.globalAlpha = opacity;
        [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(function (point) {
          ctx.fillStyle = '#e9f3ff';
          ctx.fillRect(point[0] - 2, point[1] - 2, 4, 4);
        });
        // The short blue selection strip is part of the reference's assembly.
        ctx.fillStyle = '#58a6ff';
        ctx.fillRect(x, y - 4, Math.min(w * .28, 72), 3);
        ctx.restore();
      });
    }

    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      const disabled = reduced.matches || print.matches;
      canvas.hidden = disabled || document.hidden;
      if (disabled) { finishIntro(); assemblies = []; }
      if (!canvas.hidden) frame = requestAnimationFrame(draw);
    }
    resize();
    flock.forEach(function (bird) { bird.x = width / 2; bird.y = height / 2; });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX; pointer.y = event.clientY;
      pointer.active = event.pointerType !== 'touch';
    }, { passive: true });
    document.addEventListener('pointerleave', function () { pointer.active = false; });
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') finishIntro();
    });
    document.addEventListener('focusin', finishIntro, { once: true });
    reduced.addEventListener('change', sync);
    print.addEventListener('change', sync);
    window.addEventListener('pagehide', function () {
      clearTimeout(introTimeout); finishIntro();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    });
    window.addEventListener('pageshow', sync);
    sync();
    return { assemble: assemble };
  }
  const signal = document.createElement('div');
  signal.className = 'signal-transition';
  signal.setAttribute('aria-hidden', 'true');
  document.body.appendChild(signal);

  function pulseSignal() {
    if (reduced.matches) return;
    signal.classList.remove('is-active');
    void signal.offsetWidth;
    signal.classList.add('is-active');
  }

  const revealSelectors = [
    '.hero-top', '.hero-showcase h1', '.hero-portrait', '.hero-bottom', '.hero-foot',
    '.section__header', '.exploring__header', '.exploring__list', '.exploring__panel', '.electronics-card',
    '.research-card', '.research-gallery__item', '.research-documentation',
    '.timeline__item', '.edu-item-numbered', '.skill-group', '.github-card__heading', '.github-data', '.github-card__footer',
    '.contact-bottom', '.contact-statement', '.project-section', '.project-sidebar__card', '.section-line'
  ].join(',');
  const items = Array.from(document.querySelectorAll(revealSelectors));
  items.forEach(function (item, index) {
    item.classList.add('reveal');
    const delay = intro && scene && item.closest('.hero') ? 1750 + index * 100 : 220 + (index % 3) * 90;
    item.style.setProperty('--reveal-delay', String(delay) + 'ms');
  });

  if (reduced.matches || !('IntersectionObserver' in window)) {
    items.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (scene) {
          const delay = parseInt(entry.target.style.getPropertyValue('--reveal-delay'), 10) || 0;
          scene.assemble(entry.target, Math.max(0, delay - 420));
        }
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 48px 0px' });
    items.forEach(function (item) { observer.observe(item); });
  }

  /* Touchscreens reveal image color on entry; there is no hover gesture. */
  const touchScreen = window.matchMedia('(hover: none), (pointer: coarse)');
  if (touchScreen.matches) {
    const images = document.querySelectorAll('main img:not(.github-card__chart)');
    if (!('IntersectionObserver' in window)) {
      images.forEach(function (img) { img.classList.add('is-color-visible'); });
    } else {
      const imageObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-color-visible');
          imageObserver.unobserve(entry.target);
        });
      }, { threshold: .3 });
      images.forEach(function (img) { imageObserver.observe(img); });
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () { pulseSignal(); });
  });
  window.addEventListener('pageshow', function () { document.body.classList.remove('is-page-leaving'); });
}());
