/* Engineering keepsakes and a Skills-only launch from the existing scroll emblem. */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('#hero');
  const stickers = Array.from(document.querySelectorAll('.hero-sticker'));
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let parallaxFrame = 0;
  function resetParallax() {
    if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
    parallaxFrame = 0;
    stickers.forEach(function (sticker) { sticker.style.setProperty('--sticker-x', '0px'); sticker.style.setProperty('--sticker-y', '0px'); });
  }
  if (hero && stickers.length) {
    hero.addEventListener('pointermove', function (event) {
      if (reduced.matches || !fine.matches || event.pointerType === 'touch') return;
      if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
      const x = event.clientX, y = event.clientY;
      parallaxFrame = requestAnimationFrame(function () {
        parallaxFrame = 0;
        const box = hero.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (x - box.left) / box.width * 2 - 1));
        const dy = Math.max(-1, Math.min(1, (y - box.top) / box.height * 2 - 1));
        stickers.forEach(function (sticker, i) {
          const depth = (i % 2 ? -1 : 1) * (2 + i % 3);
          sticker.style.setProperty('--sticker-x', dx * depth + 'px');
          sticker.style.setProperty('--sticker-y', dy * depth + 'px');
        });
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', resetParallax);
    fine.addEventListener('change', resetParallax);
  }

  const section = document.querySelector('#skills');
  if (!section) return;
  document.querySelectorAll('#skills .skills-constellation').forEach(function (stage) {
  const logos = Array.from(stage.querySelectorAll('.tech-logo'));
  let emitted = false, checkFrame = 0, observer, markerObserver;
  const flights = new Map();
  function settle() {
    flights.forEach(function (animation) { animation.cancel(); });
    flights.clear();
    stage.classList.remove('is-awaiting');
  }
  function disconnect() {
    if (observer) observer.disconnect();
    if (markerObserver) markerObserver.disconnect();
    window.removeEventListener('scroll', schedule);
  }
  function launch(origin) {
    if (emitted) return;
    emitted = true;
    stage.classList.add('is-in-view');
    stage.classList.remove('is-awaiting');
    disconnect();
    if (reduced.matches || !origin) return;
    logos.forEach(function (logo, i) {
      if (typeof logo.animate !== 'function') return;
      const box = logo.getBoundingClientRect();
      const dx = origin.x - box.left - box.width / 2;
      const dy = origin.y - box.top - box.height / 2;
      const animation = logo.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(.18) rotate(${i % 2 ? 18 : -18}deg)`, opacity: 0, filter: 'blur(2px)' },
        { opacity: 1, offset: .35 },
        { transform: 'scale(1.12) rotate(3deg)', opacity: 1, filter: 'blur(0px)', offset: .76 },
        { transform: 'scale(.97) rotate(-1deg)', offset: .9 },
        { transform: 'none', opacity: 1, filter: 'blur(0px)' }
      ], { duration: 900, delay: i * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      flights.set(logo, animation);
      animation.onfinish = function () { if (flights.get(logo) === animation) flights.delete(logo); };
    });
  }
  function check() {
    checkFrame = 0;
    if (emitted) return;
    if (reduced.matches) { launch(null); return; }
    const box = stage.getBoundingClientRect();
    if (box.top > window.innerHeight * .72 || box.bottom < 0) return;
    const marker = document.querySelector('.field-path__position');
    if (!marker) { launch(null); return; }
    const point = marker.getBoundingClientRect();
    if (!point.width || !point.height) { launch(null); return; }
    const sectionBox = section.getBoundingClientRect();
    const y = point.top + point.height / 2;
    if (y < sectionBox.top || y > sectionBox.bottom) { launch(null); return; }
    launch({ x: point.left + point.width / 2, y: y });
  }
  function schedule() { if (!emitted && !checkFrame) checkFrame = requestAnimationFrame(check); }
  // The origin is the real marker's screen position, not a second emblem or an
  // approximation. Its path, rotation speed and trail code stay untouched.
  if ('IntersectionObserver' in window && !reduced.matches) {
    observer = new IntersectionObserver(schedule, { rootMargin: '0px 0px 80px 0px', threshold: 0 });
    observer.observe(stage);
    const marker = document.querySelector('.field-path__position');
    if (marker && 'MutationObserver' in window) {
      markerObserver = new MutationObserver(schedule);
      markerObserver.observe(marker, { attributes: true, attributeFilter: ['transform'] });
    }
    stage.classList.add('is-awaiting');
    window.addEventListener('scroll', schedule, { passive: true });
  } else { launch(null); }
  window.addEventListener('resize', function () { if (emitted) settle(); else schedule(); });
  stage.addEventListener('pointerdown', function (event) {
    const logo = event.target.closest('.tech-logo');
    const animation = flights.get(logo);
    if (animation) { animation.cancel(); flights.delete(logo); }
  }, true);
  stage.addEventListener('keydown', function () { settle(); }, true);
  reduced.addEventListener('change', function () {
    resetParallax();
    if (reduced.matches) { if (!emitted) launch(null); settle(); }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { resetParallax(); settle(); } });
  schedule();
  });
}());
