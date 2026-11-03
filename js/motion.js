/* Motion system: progressive enhancement, one-time entrances, and signal feedback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const intro = Boolean(hero && !reduced.matches && !location.hash &&
    !window.matchMedia('print').matches);
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
    const backdrop = document.createElement('div');
    backdrop.className = 'swarm-intro';
    backdrop.setAttribute('aria-hidden', 'true');
    const initial = document.createElement('span');
    initial.textContent = 'A';
    backdrop.appendChild(initial);
    if (intro) document.body.appendChild(backdrop);

    const colors = ['#9ae8df', '#b7d8ff', '#d7c2ff', '#f3c5dc', '#f0f5ff'];
    const coarse = window.matchMedia('(pointer: coarse)');
    const flock = Array.from({ length: coarse.matches ? 9 : 18 }, function (_, i) {
      return { phase: i * 2.39996, radius: 58 + (i % 5) * 11,
        x: 0, y: 0, angle: 0, size: 7 + (i % 3) * 1.7,
        color: colors[i % colors.length] };
    });
    const pointer = { x: 0, y: 0, active: false };
    let width, height, frame = 0, previous = 0, started = performance.now();
    let introDone = !intro;
    let heroVisible = true;
    const print = window.matchMedia('print');

    function finishIntro() {
      introDone = true;
      backdrop.remove();
      document.querySelectorAll('.hero .reveal').forEach(function (item) {
        item.style.setProperty('--reveal-delay', '0ms');
      });
    }
    // Independent of animation frames, so a hidden tab cannot retain the intro.
    const introTimeout = intro ? window.setTimeout(finishIntro, 2300) : 0;

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
      previous = now;
      const spread = introDone ? 1 : Math.max(0, Math.min(1, (elapsed - 1.05) / 1.1));
      const eased = spread * spread * (3 - 2 * spread);
      ctx.clearRect(0, 0, width, height);
      flock.forEach(function (bird, i) {
        const orbit = bird.phase + elapsed * .95;
        const orbitX = width / 2 + Math.cos(orbit) * bird.radius;
        const orbitY = height / 2 + Math.sin(orbit) * bird.radius * .68;
        let targetX = width * (.06 + ((i * .618034) % .88)) + Math.sin(elapsed * .32 + bird.phase) * 38;
        let targetY = height * (.12 + ((i * .381966) % .76)) + Math.cos(elapsed * .27 + bird.phase) * 30;
        if (pointer.active) {
          const dx = targetX - pointer.x, dy = targetY - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 170 && distance > 0) {
            targetX += dx / distance * (170 - distance) * .65;
            targetY += dy / distance * (170 - distance) * .65;
          }
        }
        const x = orbitX + (targetX - orbitX) * eased;
        const y = orbitY + (targetY - orbitY) * eased;
        const heading = eased < .98 ? orbit + Math.PI / 2 :
          Math.sin(elapsed * .32 + bird.phase) * .8 + bird.phase;
        if (!previous || elapsed < .08) { bird.x = x; bird.y = y; }
        bird.x += (x - bird.x) * Math.min(1, .09 * step);
        bird.y += (y - bird.y) * Math.min(1, .09 * step);
        bird.angle = heading;
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.angle);
        ctx.globalAlpha = 1 - eased * .48;
        ctx.fillStyle = bird.color;
        ctx.strokeStyle = '#edf5ff';
        ctx.lineWidth = .7;
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
      canvas.hidden = disabled || document.hidden || (!heroVisible && introDone);
      if (disabled) finishIntro();
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
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        sync();
      }).observe(hero);
    }
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
    '.hero-top', '.hero-showcase', '.hero-bottom', '.hero-foot',
    '.section__header', '.exploring__header', '.exploring__list', '.exploring__panel', '.electronics-card',
    '.research-card', '.research-gallery__item', '.research-documentation',
    '.timeline__item', '.edu-item-numbered', '.skill-group', '.github-card__heading', '.github-data', '.github-card__footer',
    '.contact-bottom', '.contact-statement', '.project-section', '.project-sidebar__card', '.section-line'
  ].join(',');
  const items = Array.from(document.querySelectorAll(revealSelectors));
  items.forEach(function (item, index) {
    item.classList.add('reveal');
    const delay = intro && item.closest('.hero') ? 1350 + (index % 4) * 120 : (index % 4) * 70;
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
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
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
