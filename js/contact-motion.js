/* Progressive enhancement: contact content stays readable without observers. */
(function () {
  'use strict';
  const section = document.getElementById('contact');
  if (!section || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = section.querySelectorAll('.contact-enter, .contact-actions > a');
  items.forEach((item, index) => item.style.setProperty('--contact-delay', Math.min(index * 65, 325) + 'ms'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: .08 });
  section.classList.add('contact-motion-ready');
  items.forEach(item => observer.observe(item));
}());

