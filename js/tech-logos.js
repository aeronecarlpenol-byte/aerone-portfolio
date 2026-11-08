/* Independent logo introduction; never adds assemble classes to page content. */
(function () {
  'use strict';
  const clusters = Array.from(document.querySelectorAll('.tech-constellation'));
  if (!clusters.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return; // Visible without enhancement.
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-on-screen', entry.isIntersecting);
      if (entry.isIntersecting) entry.target.classList.add('is-in-view');
    });
  }, { threshold: 0, rootMargin: '0px 0px 24px 0px' });
  clusters.forEach(function (cluster) {
    observer.observe(cluster);
    cluster.classList.add('is-enhanced');
    if (reduced.matches) cluster.classList.add('is-in-view');
  });
  reduced.addEventListener('change', function () {
    if (reduced.matches) clusters.forEach(function (cluster) { cluster.classList.add('is-in-view'); });
  });
}());
