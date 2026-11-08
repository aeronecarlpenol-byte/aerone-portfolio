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
  const active = experience.querySelector('.field-active');
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
  const terminal = element('g', { class: 'field-path__terminal' });
  const pad = document.createElementNS(ns, 'circle');
  pad.setAttribute('r', '7'); terminal.appendChild(pad);
  const pins = document.createElementNS(ns, 'path');
  pins.setAttribute('d', 'M-14 0h7m14 0h7M0-14v7m0 14v7'); terminal.appendChild(pins);
  const signal = element('rect', { class: 'field-path__signal', x: '-5', y: '-5', width: '10', height: '10', rx: '2' });
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
    const schematic = find('.field-schematic svg');
    const contactBox = box(contact);
    const mobile = width < 900;
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
    const nodePoints = [];
    if (timeline && entries.length) {
      const rail = left;
      entries.forEach(entry => {
        const b = box(entry);
        const dot = window.getComputedStyle(entry, '::before');
        const p = { x: rail, y: b.y + parseFloat(dot.top || '28.8') + parseFloat(dot.height || '13') / 2 };
        add(p.x, p.y); nodePoints.push(p);
      });
      const last = box(entries[entries.length - 1]);
      add(rail, last.bottom + 12);
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
    while (nodes.length < nodePoints.length + 1) nodes.push(element('circle', { class: 'field-path__node', r: '4' }));
    [first, ...nodePoints].forEach((p, i) => { nodes[i].setAttribute('cx', p.x); nodes[i].setAttribute('cy', p.y); });
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
      samples.push({ y, distance });
    }
    start = bounds.top + window.scrollY + first.y;
    end = bounds.top + window.scrollY + finish.y;
    svg.dataset.route = mobile ? 'mobile' : 'desktop';
    dirty = false;
  }
  function setActive(index) {
    if (index === current || !entries[index]) return;
    current = index;
    const item = entries[index];
    entries.forEach((entry, i) => entry.classList.toggle('is-current', i === index));
    digits.forEach((digit, i) => digit.style.setProperty('--digit', item.dataset.year[i]));
    org.textContent = item.dataset.org; role.textContent = item.dataset.role;
    if (!reduced.matches && active.animate) active.animate([{ opacity: .3, transform: 'translateY(7px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
  }
  function update() {
    frame = 0;
    if (dirty) measure();
    let index = 0;
    entries.forEach((entry, i) => { if (entry.getBoundingClientRect().top <= window.innerHeight * .45) index = i; });
    setActive(index);
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
    if (!reduced.matches) { const p = draw.getPointAtLength(length * progress); signal.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(45)`); }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function resize() { dirty = true; schedule(); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', resize);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(main);
    main.querySelectorAll('section, .container').forEach(el => observer.observe(el));
  }
  // Load doesn't bubble; capture catches lazy images anywhere in the journey.
  main.addEventListener('load', resize, true);
  window.addEventListener('pageshow', resize);
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

