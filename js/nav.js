/**
 * nav.js — Navigation, mobile menu, scroll spy
 */
(function () {
  'use strict';

  const nav        = document.getElementById('main-nav');
  const toggle     = document.getElementById('nav-toggle');
  const drawer     = document.getElementById('nav-drawer');
  const drawerLinks = document.querySelectorAll('.nav__drawer-link');
  const navLinks   = document.querySelectorAll('.nav__link');

  /* ── Mobile menu ─────────────────────────────────── */
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      drawer.classList.toggle('open', !expanded);
    });

    // Close on link click
    drawerLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('open');
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('open');
        toggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (drawer.classList.contains('open') &&
          !nav.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('open');
      }
    });
  }

  /* ── Scroll spy ──────────────────────────────────── */
  const sections = Array.from(
    document.querySelectorAll('section[id], div[id]')
  ).filter(function (el) {
    return document.querySelector('[href="#' + el.id + '"]');
  });

  function setActive(id) {
    const allLinks = document.querySelectorAll('.nav__link, .nav__drawer-link');
    allLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      const isActive = href === '#' + id;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  if (sections.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0
      }
    );

    sections.forEach(function (s) { observer.observe(s); });
  }
}());
