/* One scroll owner, using native document coordinates for sticky UI/history. */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let controller = null;
  function configure() {
    if (controller) controller.destroy();
    controller = null;
    if (!reduced.matches && window.Lenis) {
      controller = new window.Lenis({
        autoRaf: true, lerp: .14, smoothWheel: true, syncTouch: false,
        wheelMultiplier: 1, anchors: false,
        prevent: node => Boolean(node.closest && node.closest('.work-story, .research-lightbox, .nav__drawer, [data-lenis-prevent]'))
      });
    }
  }
  configure();
  reduced.addEventListener('change', configure);
  function move(target) {
    if (controller) controller.scrollTo(target, { duration: .85 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
  }
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return; }
    if (!target || !controller) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
    move(target);
  });
  function interrupt() { if (controller) { controller.stop(); controller.start(); } }
  window.addEventListener('popstate', interrupt);
  document.addEventListener('keydown', function (event) {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab', 'Escape'].includes(event.key)) interrupt();
  });
  document.addEventListener('visibilitychange', function () {
    if (!controller) return;
    if (document.hidden) controller.stop(); else controller.start();
  });
  window.addEventListener('pagehide', function () { if (controller) controller.destroy(); controller = null; });
  window.addEventListener('pageshow', function (event) { if (event.persisted) configure(); });

  /* ── Back to top ─────────────────────────────────── */
  const btn = document.getElementById('back-to-top');

  if (btn) {
    function onScroll() {
      btn.classList.toggle('visible', window.scrollY > 400);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', function () {
      move(0);
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        move(0);
      }
    });
  }

  // Lenis reads CSS scroll-margin-top directly; do not subtract the offset twice.
}());
