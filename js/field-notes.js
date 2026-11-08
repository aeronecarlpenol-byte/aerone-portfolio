/* Scroll-linked circuit notes: source content always remains readable. */
(function () {
  'use strict';
  const experience = document.getElementById('experience');
  const contact = document.getElementById('contact');
  const main = document.getElementById('main-content');
  if (!experience || !contact || !main) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entries = Array.from(experience.querySelectorAll('.field-timeline [data-year]'));
  const digits = Array.from(experience.querySelectorAll('.year-digit__strip'));
  const yearMotion = new WeakMap();
  function cancelYearMotion() {
    digits.forEach(function (digit) {
      const animation = yearMotion.get(digit);
      if (animation && typeof animation.cancel === 'function') animation.cancel();
      yearMotion.delete(digit);
    });
  }
  const org = experience.querySelector('.field-active__org');
  const role = experience.querySelector('.field-active__role');
  let current = -1, frame = 0, dirty = true, length = 0, start = 0, end = 1;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'field-path');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  function element(tag, attrs) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el); return el;
  }
  const base = element('path', { class: 'field-path__base' });
  const draw = element('path', { class: 'field-path__draw' });
  const nodes = [];
  let samples = [];
  let experienceRange = null;
  let markerY = [];
  const terminal = element('g', { class: 'field-path__terminal' });
  const pad = document.createElementNS(ns, 'circle');
  pad.setAttribute('r', '7'); terminal.appendChild(pad);
  const pins = document.createElementNS(ns, 'path');
  pins.setAttribute('d', 'M-14 0h7m14 0h7M0-14v7m0 14v7'); terminal.appendChild(pins);
  const trail = element('g', { class: 'field-path__trail', 'aria-hidden': 'true' });
  const position = element('g', { class: 'field-path__position' });
  const tiltGroup = document.createElementNS(ns, 'g');
  tiltGroup.setAttribute('class', 'field-path__tilt'); position.appendChild(tiltGroup);
  const rollGroup = document.createElementNS(ns, 'g'); tiltGroup.appendChild(rollGroup);
  const signal = document.createElementNS(ns, 'image');
  Object.entries({ class: 'field-path__emblem', href: '/assets/brand/electronics-emblem.png', x: '-17.5', y: '-17.5', width: '35', height: '35', preserveAspectRatio: 'xMidYMid meet' }).forEach(([key,value]) => signal.setAttribute(key,value));
  rollGroup.appendChild(signal);
  const particles = new Set();
  let previousDistance = null, previousScroll = null, lastEmission = 0, particleIndex = 0, travelSinceEmission = 0, lastDirection = 0;
  function clearTrail() {
    particles.forEach(particle => particle.remove());
    particles.clear();
    previousDistance = null;
    previousScroll = null;
    travelSinceEmission = 0; lastDirection = 0;
  }
  function emitTrail(distance) {
    const now = Date.now(), mobile = window.innerWidth <= 900;
    const delta = previousDistance === null ? 0 : distance - previousDistance;
    const scrollDelta = previousScroll === null ? 0 : window.scrollY - previousScroll;
    previousDistance = distance;
    previousScroll = window.scrollY;
    // Never backfill skipped frames or leave a burst across a navigation jump.
    if (reduced.matches || Math.abs(scrollDelta) > window.innerHeight * .7 || Math.abs(delta) > 180) {
      clearTrail(); return;
    }
    const direction = Math.sign(delta);
    if (direction && direction !== lastDirection) travelSinceEmission = 0;
    if (direction) lastDirection = direction;
    travelSinceEmission += Math.abs(delta);
    if (!scrollDelta || travelSinceEmission + .001 < (mobile ? 14 : 10) || now - lastEmission < (mobile ? 90 : 65) ||
        particles.size >= (mobile ? 4 : 8) || distance <= 0 || distance >= length) return;
    const behind = draw.getPointAtLength(Math.max(0, Math.min(length, distance - Math.sign(delta) * 18)));
    const tip = draw.getPointAtLength(distance);
    const screenY = behind.y + main.getBoundingClientRect().top;
    if (screenY < 24 || screenY > window.innerHeight - 24) return;
    lastEmission = now; travelSinceEmission = 0;
    const shapes = ['M-2-4 1-4-1-1H2L-2 4 0 0h-2Z', 'M-3 2V-2H2V-4M-4 2h2', 'M-2-2h4v4h-4Z'];
    const particle = document.createElementNS(ns, 'path');
    particle.setAttribute('d', shapes[particleIndex % 3]);
    particle.setAttribute('class', 'field-path__particle field-path__particle--' + particleIndex % 3);
    const x = Math.max(8, Math.min(main.clientWidth - 8, behind.x));
    const y = behind.y, side = particleIndex++ % 2 ? 1 : -1;
    const dx = Math.max(-5, Math.min(5, (behind.x - tip.x) * .2 + side * 3));
    const dy = Math.max(-6, Math.min(6, (behind.y - tip.y) * .25));
    trail.appendChild(particle); particles.add(particle);
    const animation = particle.animate([
      { transform: `translate(${x}px, ${y}px) rotate(0deg) scale(1.25)`, opacity: .92 },
      { transform: `translate(${x + dx}px, ${y + dy}px) rotate(${side * 24}deg) scale(.2)`, opacity: 0 }
    ], { duration: mobile ? 650 : 780, easing: 'ease-out', fill: 'forwards' });
    const remove = () => { particle.remove(); particles.delete(particle); };
    animation.onfinish = remove; animation.oncancel = remove;
  }
  main.appendChild(svg);
  function measure() {
    const bounds = main.getBoundingClientRect();
    const width = main.clientWidth;
    // Layout coordinates come from untransformed offset boxes. Entrance/hover
    // transforms must never bend the route into a photo or a heading.
    function box(el) {
      if (!el) return null;
      if (el.tagName && el.tagName.toLowerCase() === 'svg') {
        const r = el.getBoundingClientRect();
        return { x: r.left - bounds.left, y: r.top - bounds.top, width: r.width, height: r.height, right: r.right - bounds.left, bottom: r.bottom - bounds.top };
      }
      let x = 0, y = 0, node = el;
      while (node && node !== main) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
      return { x, y, width: el.offsetWidth, height: el.offsetHeight, right: x + el.offsetWidth, bottom: y + el.offsetHeight };
    }
    const find = selector => box(main.querySelector(selector));
    const hero = find('#hero');
    const portrait = find('.hero-portrait__image');
    const about = find('#about');
    const projects = find('#exploring');
    const research = find('#research');
    const collage = find('.research-collage');
    const skills = find('#skills');
    const timeline = find('.field-timeline');
    markerY = entries.map(entry => {
      const b = box(entry), dot = window.getComputedStyle(entry, '::before');
      return b.y + parseFloat(dot.top || '28.8') + parseFloat(dot.height || '13') / 2;
    });
    const schematic = find('.field-schematic svg');
    const contactBox = box(contact);
    // Match the CSS viewport breakpoint, not clientWidth (which excludes the
    // scrollbar and can otherwise switch the route up to 15px too early).
    const mobile = window.innerWidth <= 900;
    const left = mobile ? 12 : Math.max(20, (width - 1200) / 2 + 20);
    const right = width - left;
    const first = { x: right, y: portrait ? portrait.bottom - 24 : hero ? hero.bottom - 100 : 160 };
    // Terminate in the reserved outer gutter, clear of the schematic and buttons.
    const finish = { x: right, y: schematic ? schematic.y + schematic.height * .53 : contactBox.bottom - 90 };
    const points = [first];
    const add = (x, y) => {
      const previous = points[points.length - 1];
      // Never reverse vertically, even if a section collapses while loading.
      y = Math.max(previous.y, y);
      if (x !== previous.x && y !== previous.y) points.push({ x: previous.x, y });
      if (x !== previous.x || y !== previous.y) points.push({ x, y });
    };
    // Cross at section boundaries, inside reserved bottom padding. All crossings
    // are level; the mobile route makes only two changes of side.
    if (about) { add(right, about.bottom - 28); add(left, about.bottom - 28); }
    if (!mobile && projects) { add(left, projects.bottom - 28); add(right, projects.bottom - 28); }
    if (!mobile && research) { add(right, research.bottom - 28); add(left, research.bottom - 28); }
    if (timeline && entries.length) {
      // Join the real timeline rail through the gap above the grid. Do not
      // create a second set of year markers beside the sticky year panel.
      const rail = mobile ? left : timeline.x + .5;
      const firstEntry = box(entries[0]);
      const last = box(entries[entries.length - 1]);
      experienceRange = { start: firstEntry.y, end: last.bottom - 32 };
      add(left, firstEntry.y - 32);
      add(rail, firstEntry.y - 32);
      add(rail, last.bottom + 16);
      add(left, last.bottom + 16);
    }
    if (skills) { add(left, skills.bottom - 28); add(right, skills.bottom - 28); }
    add(finish.x, finish.y);
    // Remove duplicate/collinear vertices before rounding. Each corner consumes
    // at most half of either adjacent segment: no overlap, overshoot or curls.
    for (let i = points.length - 2; i > 0; i--) {
      const a = points[i - 1], b = points[i], c = points[i + 1];
      if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) points.splice(i, 1);
    }
    let d = `M${first.x} ${first.y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i - 1], b = points[i], c = points[i + 1];
      const before = Math.hypot(b.x - a.x, b.y - a.y), after = Math.hypot(c.x - b.x, c.y - b.y);
      const r = Math.min(mobile ? 10 : 24, before / 2, after / 2);
      const p = { x: b.x + (a.x - b.x) * r / (before || 1), y: b.y + (a.y - b.y) * r / (before || 1) };
      const q = { x: b.x + (c.x - b.x) * r / (after || 1), y: b.y + (c.y - b.y) * r / (after || 1) };
      d += ` L${p.x} ${p.y} Q${b.x} ${b.y} ${q.x} ${q.y}`;
    }
    d += ` L${finish.x} ${finish.y}`;
    svg.setAttribute('viewBox', `0 0 ${width} ${main.offsetHeight}`);
    svg.setAttribute('height', main.offsetHeight);
    base.setAttribute('d', d); draw.setAttribute('d', d);
    length = draw.getTotalLength(); draw.style.strokeDasharray = String(length);
    // Timeline dots are the existing CSS markers, on the same rail as the
    // signal. Only the hero terminal needs a separate SVG node.
    if (!nodes.length) nodes.push(element('circle', { class: 'field-path__node', r: '4' }));
    nodes[0].setAttribute('cx', first.x); nodes[0].setAttribute('cy', first.y);
    terminal.setAttribute('transform', `translate(${finish.x} ${finish.y}) scale(${mobile ? .65 : 1})`);
    // Map vertical scroll to distance along the actual curve, including its
    // horizontal crossings. The signal stays near the reader in both directions.
    samples = [];
    const count = Math.min(1600, Math.max(2, Math.ceil(length / 10)));
    for (let i = 0; i <= count; i++) {
      const distance = length * i / count, p = draw.getPointAtLength(distance);
      // A small distance contribution makes horizontal runs strictly monotonic
      // in scroll space, so the signal cannot jump across a level connector.
      const y = .9 * p.y + .1 * (first.y + (finish.y - first.y) * i / count);
      samples.push({ y, actualY: p.y, distance });
    }
    if (experienceRange && experienceRange.end > experienceRange.start) {
      // Keep the vertical Experience rail locked to the reader. The global
      // distance weighting needed by horizontal connectors otherwise makes
      // the signal drift behind scrolling through this long section.
      function mappedY(y) {
        const i = samples.findIndex(sample => sample.actualY >= y);
        const b = samples[Math.max(1, i)], a = samples[Math.max(0, i - 1)];
        const t = (y - a.actualY) / (b.actualY - a.actualY || 1);
        return a.y + (b.y - a.y) * t;
      }
      const from = mappedY(experienceRange.start), to = mappedY(experienceRange.end);
      const firstY = samples[0].y, lastY = samples[samples.length - 1].y;
      samples.forEach(sample => {
        const y = sample.y;
        if (y < from) sample.y = firstY + (y - firstY) * (experienceRange.start - firstY) / (from - firstY);
        else if (y <= to) sample.y = experienceRange.start + (y - from) * (experienceRange.end - experienceRange.start) / (to - from);
        else sample.y = experienceRange.end + (y - to) * (lastY - experienceRange.end) / (lastY - to);
      });
    }
    start = bounds.top + window.scrollY + first.y;
    end = bounds.top + window.scrollY + finish.y;
    svg.dataset.route = mobile ? 'mobile' : 'desktop';
    dirty = false;
  }
  function setActive(index) {
    if (index === current || !entries[index]) return;
    const previousYear = entries[current] ? entries[current].dataset.year : null;
    current = index;
    const item = entries[index];
    entries.forEach((entry, i) => entry.classList.toggle('is-current', i === index));
    digits.forEach(function (digit, i) {
      const value = item.dataset.year[i];
      const changed = previousYear && previousYear[i] !== value;
      const from = changed ? window.getComputedStyle(digit).transform || `translateY(-${previousYear[i]}em)` : '';
      const previous = yearMotion.get(digit);
      if (changed && previous && typeof previous.cancel === 'function') previous.cancel();
      digit.style.setProperty('--digit', value);
      if (!changed || reduced.matches || typeof digit.animate !== 'function') return;
      const animation = digit.animate([
        { transform: from, filter: 'blur(0px)', offset: 0 },
        { filter: 'blur(3px)', offset: .4 },
        { transform: `translateY(-${value}em)`, filter: 'blur(0px)', offset: 1 }
      ], { duration: 460, easing: 'cubic-bezier(.2,.75,.2,1)' });
      yearMotion.set(digit, animation);
      animation.onfinish = function () { if (yearMotion.get(digit) === animation) yearMotion.delete(digit); };
    });
    org.textContent = item.dataset.org; role.textContent = item.dataset.role;
  }
  function update() {
    frame = 0;
    if (dirty) { clearTrail(); measure(); }
    const targetY = window.scrollY + window.innerHeight * .65 - (main.getBoundingClientRect().top + window.scrollY);
    let low = 0, high = samples.length - 1;
    while (low < high) { const mid = (low + high) >> 1; if (samples[mid].y < targetY) low = mid + 1; else high = mid; }
    const a = samples[Math.max(0, low - 1)], b = samples[low];
    const blend = b.y > a.y ? Math.max(0, Math.min(1, (targetY - a.y) / (b.y - a.y))) : 0;
    let progress = length ? (a.distance + (b.distance - a.distance) * blend) / length : 0;
    if (window.scrollY + window.innerHeight * .65 <= start) progress = 0;
    if (window.scrollY + window.innerHeight * .65 >= end) progress = 1;
    svg.dataset.progress = progress.toFixed(4);
    draw.style.strokeDashoffset = reduced.matches ? '0' : String(length * (1 - progress));
    const p = draw.getPointAtLength(length * progress);
    let index = 0;
    markerY.forEach((y, i) => { if (p.y >= y) index = i; });
    setActive(index);
    const resting = reduced.matches ? draw.getPointAtLength(0) : p;
    const ahead = draw.getPointAtLength(Math.min(length, length * progress + 8));
    const tilt = reduced.matches || progress === 0 || progress === 1 ? 0 : Math.max(-9, Math.min(9, (ahead.x - p.x) * 1.2));
    const size = window.innerWidth <= 900 ? 24 : 35;
    emitTrail(length * progress);
    signal.setAttribute('x', -size / 2); signal.setAttribute('y', -size / 2);
    signal.setAttribute('width', size); signal.setAttribute('height', size);
    position.setAttribute('transform', `translate(${resting.x} ${resting.y})`);
    tiltGroup.setAttribute('transform', `rotate(${tilt})`);
    rollGroup.setAttribute('transform', `rotate(${reduced.matches ? 0 : length * progress / 250 * 360})`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function resize() { dirty = true; schedule(); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', function () { if (reduced.matches) cancelYearMotion(); resize(); });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(main);
    main.querySelectorAll('section, .container').forEach(el => observer.observe(el));
  }
  // Load doesn't bubble; capture catches lazy images anywhere in the journey.
  main.addEventListener('load', resize, true);
  window.addEventListener('pageshow', resize);
  document.addEventListener('visibilitychange', function () { if (document.hidden) { clearTrail(); cancelYearMotion(); } });
  if (document.fonts) document.fonts.ready.then(resize);
  document.querySelectorAll('.field-section .learning-panel').forEach((panel, i) => panel.style.setProperty('--field-delay', `${(i % 3) * 85}ms`));
  const spark = document.querySelector('.field-spark');
  if (spark) spark.addEventListener('click', function () {
    const powered = spark.getAttribute('aria-pressed') !== 'true';
    spark.setAttribute('aria-pressed', String(powered));
    spark.closest('.field-schematic').classList.toggle('is-powered', powered);
  });
  schedule();
}());


