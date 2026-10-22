/**
 * interactions.js — Reduced motion detection, misc UX enhancements
 */
(function () {
  'use strict';

  /* ── Reduced motion ──────────────────────────────── */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyMotionPreference() {
    document.documentElement.dataset.reducedMotion = mq.matches ? 'true' : 'false';
  }

  applyMotionPreference();
  mq.addEventListener('change', applyMotionPreference);

  /* ── Year in footer ──────────────────────────────── */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ── External links: safe attributes ─────────────── */
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (!a.getAttribute('rel')) {
      a.setAttribute('rel', 'noopener noreferrer');
    }
    if (!a.getAttribute('target')) {
      a.setAttribute('target', '_blank');
    }
  });

  /* ── Lazy load images ────────────────────────────── */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback: simple IntersectionObserver polyfill path
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      img.src = img.dataset.src;
    });
  }
}());
