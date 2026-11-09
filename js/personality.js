/* Skills-only distribution from the existing scroll energy core. */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const section = document.querySelector('#skills');
  if (!section) return;
  const heading = document.querySelector('#skills .section__header');
  if (heading && 'IntersectionObserver' in window && !reduced.matches) {
    const headingObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        heading.classList.add('is-arriving'); headingObserver.disconnect();
      }
    }, { threshold: .15 });
    headingObserver.observe(heading);
  }
  const stages = Array.from(document.querySelectorAll('#skills .skills-constellation'));
  if (!stages.length) return;
  const workbench = document.querySelector('#skills .skills-workbench') || stages[0];
  const records = [];
  stages.forEach(function (stage, group) {
    stage.querySelectorAll('.tech-logo').forEach(function (logo, local) {
      records.push({ logo: logo, stage: stage, group: group, local: local,
        badge: logo.querySelector('.tech-logo__float'), name: logo.querySelector('.tech-logo__name') });
      const image = logo.querySelector('img');
      if (image) { image.loading = 'eager'; if (image.decode) image.decode().catch(function () {}); }
    });
  });
  // Values verified in the reference's public Skills script (see motion audit).
  const timing = { border: 350 + (stages.length - 1) * 40, release: 32, flight: 600,
    hold: 350, group: 110, item: 20, settle: 650, squash: 70, elastic: 500,
    names: 600, nameStep: 8, nameFade: 350 };
  const gather = timing.border + (records.length - 1) * timing.release + timing.flight + timing.hold;
  const animations = new Set();
  let started = false, finished = false, frame = 0, epoch = null, observer;
  function play(element, frames, duration, elapsed, fill) {
    if (!element || typeof element.animate !== 'function') return null;
    const animation = element.animate(frames, { duration: duration, easing: 'linear', fill: fill || 'both' });
    animation.currentTime = Math.max(0, elapsed || 0);
    animations.add(animation);
    animation.onfinish = function () {
      animations.delete(animation);
      if (fill === 'none') animation.cancel();
    };
    return animation;
  }
  const out3 = function (p) { return 1 - Math.pow(1 - p, 3); };
  const inOut4 = function (p) { return p < .5 ? 8 * Math.pow(p, 4) : 1 - Math.pow(-2 * p + 2, 4) / 2; };
  function elastic(p) {
    if (p === 0 || p === 1) return p;
    return Math.pow(2, -10 * p) * Math.sin((p - .45 / 4) * 2 * Math.PI / .45) + 1;
  }
  function samples(count, sample) {
    return Array.from({ length: count + 1 }, function (_, i) {
      const p = i / count; return Object.assign({ offset: p }, sample(p));
    });
  }
  function finish() {
    finished = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    animations.forEach(function (animation) { animation.cancel(); }); animations.clear();
    stages.forEach(function (stage) { stage.classList.remove('is-awaiting'); });
    records.forEach(function (record) {
      record.logo.style.removeProperty('opacity');
      if (record.name) record.name.style.removeProperty('opacity');
    });
    if (observer) observer.disconnect();
    window.removeEventListener('scroll', schedule);
  }
  function release(record, index, elapsed) {
    record.released = true;
    const marker = document.querySelector('.field-path__position');
    if (!marker) { finish(); return; }
    // Read at the actual release frame, after delays and any intervening scroll.
    const origin = marker.getBoundingClientRect();
    const home = (record.badge || record.logo).getBoundingClientRect();
    const shell = record.logo.getBoundingClientRect();
    const area = workbench.getBoundingClientRect();
    if (!origin.width || !origin.height) { finish(); return; }
    const direction = origin.left + origin.width / 2 > window.innerWidth / 2 ? -1 : 1;
    const start = { x: origin.left + origin.width / 2 - home.left - home.width / 2,
      y: origin.top + origin.height / 2 - home.top - home.height / 2 };
    const spread = Math.min(area.width * .3, 260), height = Math.min(150, spread * .8);
    const scatter = Math.random() + Math.random() - 1;
    record.x = area.left + area.width / 2 + scatter * spread - home.left - home.width / 2;
    record.y = area.top + Math.min(area.height, 300) - 40 - (1 - Math.abs(scatter)) * height * (.3 + Math.random() * .7) - home.top - home.height / 2;
    record.rotation = Math.random() * 80 - 40;
    record.pivot = (home.left + home.width / 2 - shell.left) + 'px ' + (home.top + home.height / 2 - shell.top) + 'px';
    const crest = Math.min(start.y, record.y) - (40 + Math.random() * 50);
    const points = [start, { x: start.x + (record.x - start.x) * .35, y: crest },
      { x: start.x + (record.x - start.x) * .8, y: crest + (record.y - crest) * .3 }, { x: record.x, y: record.y }];
    function cubic(p) {
      const q = 1 - p;
      return { x: q*q*q*points[0].x + 3*q*q*p*points[1].x + 3*q*p*p*points[2].x + p*p*p*points[3].x,
        y: q*q*q*points[0].y + 3*q*q*p*points[1].y + 3*q*p*p*points[2].y + p*p*p*points[3].y };
    }
    // Arc-length lookup mirrors MotionPath's distance-based easing.
    const path = [{ point: cubic(0), distance: 0 }];
    for (let i = 1; i <= 160; i++) {
      const point = cubic(i / 160), previous = path[i - 1];
      path.push({ point: point, distance: previous.distance + Math.hypot(point.x - previous.point.x, point.y - previous.point.y) });
    }
    function along(p) {
      const distance = p * path[160].distance;
      let i = 1; while (i < 160 && path[i].distance < distance) i++;
      const a = path[i - 1], b = path[i], t = (distance - a.distance) / (b.distance - a.distance || 1);
      return { x: a.point.x + (b.point.x - a.point.x) * t, y: a.point.y + (b.point.y - a.point.y) * t };
    }
    record.logo.style.setProperty('opacity', '1');
    record.flight = play(record.logo, samples(60, function (p) {
      const point = along(p*p), growth = out3(p), angle = -direction * 120 + (record.rotation + direction * 120) * growth;
      return { transform: 'translate(' + point.x + 'px,' + point.y + 'px) scale(' + (.3 + .7 * growth) + ') rotate(' + angle + 'deg)',
        transformOrigin: record.pivot, opacity: Math.min(1, p * 6) };
    }), timing.flight, elapsed - (timing.border + index * timing.release));
  }
  function tick(now) {
    frame = 0;
    if (finished) return;
    const bounds = workbench.getBoundingClientRect();
    if (started && (bounds.bottom < 0 || bounds.top > window.innerHeight)) { finish(); return; }
    if (!started) {
      if (bounds.top > window.innerHeight * .62 || bounds.bottom < 0) return;
      const marker = document.querySelector('.field-path__position');
      if (reduced.matches || !marker || !records.every(function (r) { return typeof r.logo.animate === 'function'; })) { finish(); return; }
      started = true; epoch = now;
      stages.forEach(function (stage) { stage.classList.remove('is-awaiting'); stage.classList.add('is-in-view');
        if (stage.parentElement) stage.parentElement.classList.add('is-arriving'); });
      records.forEach(function (r) { r.logo.style.setProperty('opacity', '0'); if (r.name) r.name.style.setProperty('opacity', '0'); });
      if (observer) observer.disconnect();
    }
    const elapsed = now - epoch;
    records.forEach(function (r, i) {
      if (finished) return;
      const releaseAt = timing.border + i * timing.release;
      const settleAt = gather + r.group * timing.group + r.local * timing.item;
      if (!r.released && elapsed >= releaseAt) release(r, i, elapsed);
      if (!r.released || finished) return;
      if (!r.squashed && elapsed >= releaseAt + timing.flight) {
        r.squashed = true;
        play(r.badge, samples(60, function (p) {
          const time = p * (timing.squash + timing.elastic);
          const amount = time < timing.squash ? out3(time / timing.squash) : 1 - elastic((time - timing.squash) / timing.elastic);
          return { transform: 'scale(' + (1 + .14 * amount) + ',' + (1 - .2 * amount) + ')', transformOrigin: '50% 100%' };
        }), timing.squash + timing.elastic, elapsed - releaseAt - timing.flight, 'none');
      }
      if (!r.settling && elapsed >= settleAt) {
        r.settling = true;
        if (r.flight) { r.flight.cancel(); animations.delete(r.flight); }
        play(r.logo, samples(60, function (p) {
          const left = 1 - inOut4(p);
          return { transform: 'translate(' + r.x * left + 'px,' + r.y * left + 'px) rotate(' + r.rotation * left + 'deg)', transformOrigin: r.pivot, opacity: 1 };
        }), timing.settle, elapsed - settleAt, 'none');
      }
      const nameAt = gather + timing.names + i * timing.nameStep;
      if (!r.named && elapsed >= nameAt) {
        r.named = true;
        if (r.name) {
          r.name.style.removeProperty('opacity');
          play(r.name, samples(30, function (p) { const ease = p === 1 ? 1 : 1 - Math.pow(2, -10*p);
            return { opacity: ease, transform: 'translateY(' + (4 * (1 - ease)) + 'px)' }; }), timing.nameFade, elapsed - nameAt, 'none');
        }
      }
    });
    const last = records[records.length - 1];
    const end = Math.max(gather + last.group * timing.group + last.local * timing.item + timing.settle,
      gather + timing.names + (records.length - 1) * timing.nameStep + timing.nameFade);
    if (elapsed >= end) { finish(); return; }
    if (!finished) frame = requestAnimationFrame(tick);
  }
  function schedule() { if (!finished && !frame) frame = requestAnimationFrame(tick); }
  if (!('IntersectionObserver' in window) || reduced.matches) { finish(); return; }
  observer = new IntersectionObserver(schedule, { threshold: 0, rootMargin: '0px' });
  observer.observe(workbench);
  stages.forEach(function (stage) { stage.classList.add('is-awaiting'); stage.addEventListener('focusin', finish); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { if (started) finish(); else schedule(); });
  reduced.addEventListener('change', function () { if (reduced.matches) finish(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { finish(); } });
  schedule();
}());

