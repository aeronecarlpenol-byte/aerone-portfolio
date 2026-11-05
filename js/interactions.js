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

  /* ── High school research gallery lightbox ──────── */
  const lightbox = document.getElementById('research-lightbox');
  if (lightbox) {
    const lightboxImage = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('figcaption');
    const closeButton = lightbox.querySelector('.research-lightbox__close');
    let lastTrigger = null;

    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImage.src = '';
      document.body.classList.remove('lightbox-open');
      if (lastTrigger) lastTrigger.focus();
    }

    document.querySelectorAll('.research-gallery__trigger').forEach(function (trigger) {
      trigger.setAttribute('aria-controls', 'research-lightbox');
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', function () {
        lastTrigger = trigger;
        lightboxImage.src = trigger.dataset.lightboxSrc;
        lightboxImage.alt = trigger.dataset.lightboxAlt;
        lightboxCaption.textContent = trigger.dataset.lightboxCaption;
        lightbox.hidden = false;
        document.body.classList.add('lightbox-open');
        closeButton.focus();
      });
    });

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  /* ── Electronics card details ───────────────────── */
  document.querySelectorAll('.electronics-card__details-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      const card = toggle.closest('.electronics-card');
      if (!card) return;
      const isFlipped = card.classList.toggle('is-flipped');
      const front = card.querySelector('.electronics-card__face--front');
      const back = card.querySelector('.electronics-card__face--back');
      front.inert = isFlipped;
      back.inert = !isFlipped;
      front.setAttribute('aria-hidden', String(isFlipped));
      back.setAttribute('aria-hidden', String(!isFlipped));
      card.querySelectorAll('.electronics-card__details-toggle').forEach(function (button) {
        button.setAttribute('aria-expanded', String(isFlipped));
      });
      (isFlipped ? back : front).querySelector('.electronics-card__details-toggle').focus();
    });
  });

  /* ── Currently exploring selection ──────────────── */
  const exploringDescription = document.getElementById('exploring-description');
  const exploringItems = document.querySelectorAll('.exploring__item');
  if (exploringDescription && exploringItems.length) {
    exploringItems.forEach(function (item) {
      item.addEventListener('click', function () {
        exploringItems.forEach(function (otherItem) {
          const selected = otherItem === item;
          otherItem.classList.toggle('is-selected', selected);
          otherItem.setAttribute('aria-pressed', String(selected));
        });
        exploringDescription.textContent = item.dataset.description;
        document.querySelectorAll('.exploring__panel').forEach(function (panel) {
          panel.hidden = panel.id !== item.dataset.panel;
        });
      });
    });
  }
}());
