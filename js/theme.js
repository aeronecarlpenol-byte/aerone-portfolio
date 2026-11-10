/* Persisted color preference and measured clearance for the floating header. */
(function () {
  'use strict';
  const root = document.documentElement;
  let selected = 'dark';
  try { if (localStorage.getItem('portfolio-theme') === 'light') selected = 'light'; } catch (_) {}
  root.dataset.theme = selected;
  function attach() {
    const button = document.querySelector('.theme-toggle');
    function apply() {
      root.dataset.theme = selected;
      if (button) {
        button.setAttribute('aria-pressed', String(selected === 'light'));
        button.setAttribute('aria-label', selected === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      }
    }
    if (button) button.addEventListener('click', function () {
      selected = selected === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('portfolio-theme', selected); } catch (_) {}
      apply();
    });
    apply();
    const nav = document.getElementById('main-nav');
    function measure() { if (nav) root.style.setProperty('--nav-height', Math.ceil(nav.getBoundingClientRect().bottom + 24) + 'px'); }
    measure();
    window.addEventListener('resize', measure, { passive: true });
    if ('ResizeObserver' in window && nav) new ResizeObserver(measure).observe(nav);
    if (document.fonts) document.fonts.ready.then(measure);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true }); else attach();
}());
