/* Floating navigation; native anchors retain history and reduced-motion behavior. */
(function () {
  'use strict';
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const toggle = document.getElementById('nav-toggle'), drawer = document.getElementById('nav-drawer');
  const links = Array.from(document.querySelectorAll('.nav__link, .nav__drawer-link, .nav__dock-link'));
  // The Research item opens its own page, while tracking the homepage preview.
  function sectionId(link) {
    const href = link.getAttribute('href');
    return href.startsWith('#') ? href.slice(1) : href === '/research' ? 'research' : null;
  }
  const sections = links.map(link => {
    const id = sectionId(link);
    return id ? document.getElementById(id) : null;
  }).filter((section, i, all) => section && all.indexOf(section) === i).sort((a,b) => a.offsetTop-b.offsetTop);
  const tracks = Array.from(document.querySelectorAll('.nav__links, .section-dock'));
  tracks.forEach(track => {
    const indicator = document.createElement('span');
    indicator.className = 'nav-indicator'; indicator.setAttribute('aria-hidden','true'); track.prepend(indicator);
  });
  function closeMenu(restore) {
    if (!drawer || !toggle) return;
    drawer.classList.remove('open'); toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open navigation menu');
    if (restore) toggle.focus();
  }
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open ? 'Close navigation menu' : 'Open navigation menu');
      drawer.classList.toggle('open',open);
    });
    document.addEventListener('keydown',event => {
      if (event.key === 'Escape' && drawer.classList.contains('open')) closeMenu(true);
    });
    document.addEventListener('click',event => { if (!nav.contains(event.target)) closeMenu(false); });
    nav.addEventListener('focusout',() => requestAnimationFrame(() => {
      if (!nav.contains(document.activeElement)) closeMenu(false);
    }));
  }
  function indicators() {
    tracks.forEach(track => {
      const active = track.querySelector('a.active'), indicator = track.querySelector('.nav-indicator');
      indicator.hidden = !active;
      if (!active) return;
      indicator.style.width = active.offsetWidth+'px'; indicator.style.height = active.offsetHeight+'px';
      indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    });
  }
  function setActive(id) {
    links.forEach(link => {
      const active = sectionId(link) === id;
      link.classList.toggle('active',active);
      if (active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    });
    indicators();
  }
  let frame = 0;
  function update() {
    frame = 0;
    if (!sections.length) { indicators(); return; }
    const line = Math.max(nav.getBoundingClientRect().bottom+32, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))+24);
    let current = sections[0];
    sections.forEach(section => { if (section.getBoundingClientRect().top <= line) current = section; });
    if (window.scrollY+window.innerHeight >= document.documentElement.scrollHeight-3) current = sections[sections.length-1];
    setActive(current.id);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  links.forEach(link => link.addEventListener('click',() => {
    closeMenu(false);
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      setActive(href.slice(1));
      const target = document.getElementById(href.slice(1));
      if (target) { target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); }
    }
  }));
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',() => { if (window.innerWidth > 1100) closeMenu(false); schedule(); },{passive:true});
  window.addEventListener('pageshow',schedule); window.addEventListener('hashchange',schedule);
  document.addEventListener('load',schedule,true);
  if (document.fonts) document.fonts.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  schedule();
}());
