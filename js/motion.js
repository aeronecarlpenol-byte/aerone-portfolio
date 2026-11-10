/* One-shot content entrances, quiet particles, and navigation signal feedback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  if (hero) initCursorSwarm();

  /* The reference's orbiting cursor flock becomes a quiet, interactive field.
     It is decorative: it never captures input or delays navigation. */
  function initCursorSwarm() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.className = 'cursor-swarm';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
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
    const print = window.matchMedia('print');

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
      const eased = 1;
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
      frame = requestAnimationFrame(draw);
    }

    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      const disabled = reduced.matches || print.matches;
      canvas.hidden = disabled || document.hidden;
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
    reduced.addEventListener('change', sync);
    print.addEventListener('change', sync);
    window.addEventListener('pagehide', function () {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    });
    window.addEventListener('pageshow', sync);
    sync();
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
    '.hero-top', '.hero-showcase h1', '.hero-portrait', '.hero-bottom', '.hero-foot'
  ].map(function (selector) { return '.hero ' + selector; }).join(',');
  const items = Array.from(document.querySelectorAll(revealSelectors));
  items.forEach(function (item, index) {
    item.classList.add('reveal');
    const replayDelay = Math.min(index * 55, 180);
    const delay = replayDelay;
    item.style.setProperty('--reveal-delay', String(delay) + 'ms');
  });

  if (reduced.matches || !('IntersectionObserver' in window)) {
    items.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 64px 0px' });
    items.forEach(function (item) { observer.observe(item); });
  }

  const sections = document.querySelectorAll('main > section:not(.hero) .section__header, .work-header, .about__grid, .work-card, .research-preview__grid, .learning-timeline__entry, .education-main, .education-side, .skill-family, .github-card');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Already on screen remains readable even during rapid navigation.
        entry.target.classList.add('section-entered');
        sectionObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 64px 0px' });
    sections.forEach(function (item, index) {
      item.style.setProperty('--entry-delay', (index % 2) * 45 + 'ms');
      sectionObserver.observe(item);
    });
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
