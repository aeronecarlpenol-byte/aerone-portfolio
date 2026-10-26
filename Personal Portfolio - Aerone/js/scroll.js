/**
 * scroll.js — Back-to-top button, smooth scroll enhancement
 */
(function () {
  'use strict';

  /* ── Back to top ─────────────────────────────────── */
  const btn = document.getElementById('back-to-top');

  if (btn) {
    function onScroll() {
      btn.classList.toggle('visible', window.scrollY > 400);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* Native anchor navigation preserves URLs and browser back/forward history.
     CSS supplies smooth scrolling and section offsets. */
}());
