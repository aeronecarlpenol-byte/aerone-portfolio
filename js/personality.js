/* Skills settle in place; labels remain readable throughout the entrance. */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const groups = document.querySelectorAll('#skills .skills-constellation');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const animations = new Set();
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      entry.target.querySelectorAll('.tech-logo__float').forEach(function (badge, index) {
        if (typeof badge.animate !== 'function') return;
        const animation = badge.animate([
          { transform: 'translateY(10px) scale(.96)', opacity: .55 },
          { transform: 'translateY(0) scale(1)', opacity: 1 }
        ], { duration: 420, delay: Math.min(index * 35, 140), easing: 'cubic-bezier(.22,1,.36,1)' });
        animations.add(animation);
        animation.onfinish = animation.oncancel = function () { animations.delete(animation); };
      });
    });
  }, { threshold: 0, rootMargin: '0px 0px 48px 0px' });
  groups.forEach(function (group) { observer.observe(group); });
  function finish() { animations.forEach(function (animation) { animation.cancel(); }); animations.clear(); }
  reduced.addEventListener('change', function () { if (reduced.matches) { observer.disconnect(); finish(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden) finish(); });
  window.addEventListener('pagehide', function () { observer.disconnect(); finish(); });
}());
