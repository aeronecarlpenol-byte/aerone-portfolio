/* Motion system: progressive enhancement, one-time entrances, and signal feedback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    '.timeline__item', '.edu-item-numbered', '.skill-group', '.github-card',
    '.contact-bottom', '.contact-statement', '.project-section', '.project-sidebar__card', '.section-line'
  ].join(',');
  const items = Array.from(document.querySelectorAll(revealSelectors));
  items.forEach(function (item, index) {
    item.classList.add('reveal');
    item.style.setProperty('--reveal-delay', String((index % 4) * 70) + 'ms');
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
