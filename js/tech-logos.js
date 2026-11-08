/* Independent logo introduction; never adds assemble classes to page content. */
(function () {
  'use strict';
  const clusters = Array.from(document.querySelectorAll('.tech-constellation'));
  if (!clusters.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dragging = null;
  const positions = [];
  function place(state, x, y) {
    const pad = 18;
    const left = state.logo.offsetLeft, top = state.logo.offsetTop;
    state.x = Math.max(pad - left, Math.min(x,
      Math.max(pad - left, state.cluster.clientWidth - pad - left - state.logo.offsetWidth)));
    state.y = Math.max(pad - top, Math.min(y,
      Math.max(pad - top, state.cluster.clientHeight - pad - top - state.logo.offsetHeight)));
    state.moved = true;
    state.logo.style.setProperty('--drag-x', state.x + 'px');
    state.logo.style.setProperty('--drag-y', state.y + 'px');
  }
  function finishDrag() {
    if (!dragging) return;
    const { state, id } = dragging;
    dragging = null;
    state.logo.classList.remove('is-dragging');
    if (state.logo.hasPointerCapture && state.logo.hasPointerCapture(id)) state.logo.releasePointerCapture(id);
  }
  clusters.forEach(function (cluster) {
    cluster.querySelectorAll('.tech-logo').forEach(function (logo) {
      const state = { logo: logo, cluster: cluster, x: 0, y: 0, moved: false };
      positions.push(state);
      logo.tabIndex = 0;
      const image = logo.querySelector('img');
      if (image) image.draggable = false;
      logo.setAttribute('aria-label', (image ? image.alt : 'Technology') + ' logo. Drag to move, or use arrow keys. Home resets position.');
      logo.addEventListener('dragstart', function (event) { event.preventDefault(); });
      logo.addEventListener('pointerdown', function (event) {
        if (dragging || event.button !== 0 || event.isPrimary === false) return;
        event.preventDefault();
        logo.focus({ preventScroll: true });
        dragging = { state: state, id: event.pointerId, x: event.clientX, y: event.clientY,
          startX: state.x, startY: state.y };
        logo.classList.add('is-dragging');
        logo.setPointerCapture(event.pointerId);
      });
      logo.addEventListener('pointermove', function (event) {
        if (!dragging || dragging.state !== state || dragging.id !== event.pointerId) return;
        place(state, dragging.startX + event.clientX - dragging.x, dragging.startY + event.clientY - dragging.y);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) {
        logo.addEventListener(name, function (event) {
          if (dragging && dragging.state === state && dragging.id === event.pointerId) finishDrag();
        });
      });
      logo.addEventListener('keydown', function (event) {
        const step = event.shiftKey ? 20 : 8;
        const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (event.key === 'Home') {
          event.preventDefault(); finishDrag();
          state.x = state.y = 0; state.moved = false;
          logo.style.setProperty('--drag-x', '0px'); logo.style.setProperty('--drag-y', '0px');
        } else if (moves[event.key]) {
          event.preventDefault(); finishDrag();
          place(state, state.x + moves[event.key][0], state.y + moves[event.key][1]);
        }
      });
    });
  });
  window.addEventListener('blur', finishDrag);
  window.addEventListener('resize', function () {
    finishDrag();
    positions.forEach(function (state) { if (state.moved) place(state, state.x, state.y); });
  });
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
