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
  let mainOrigin = 0, renderedDistance = null, renderTime = 0, rollAngle = 0, rollDistance = null, gliding = false;
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
  // A procedural electromagnetic reactor; the outer position/roll groups keep
  // their original route coordinates and distance-based rotation.
  const signal = document.createElementNS(ns, 'svg');
  Object.entries({ class: 'field-path__emblem energy-core', viewBox: '-24 -24 48 48',
    x: '-22', y: '-22', width: '44', height: '44', overflow: 'visible', 'aria-hidden': 'true' })
    .forEach(([key, value]) => signal.setAttribute(key, value));
  rollGroup.appendChild(signal);
  function corePart(parent, tag, attrs) {
    const part = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => part.setAttribute(key, value));
    parent.appendChild(part); return part;
  }
  const coreDefs = corePart(signal, 'defs', {});
  const coreGradient = corePart(coreDefs, 'radialGradient', { id: 'scroll-reactor-light' });
  [['0%', '#ffffff', '1'], ['28%', '#e9fcff', '1'], ['60%', '#b18aff', '.95'], ['100%', '#6055ef', '.15']]
    .forEach(([offset, color, opacity]) => corePart(coreGradient, 'stop', { offset: offset, 'stop-color': color, 'stop-opacity': opacity }));
  const auraGradient = corePart(coreDefs, 'radialGradient', { id: 'scroll-reactor-aura' });
  [['0%', '#b5f5ff', '.45'], ['35%', '#9770ff', '.26'], ['100%', '#466cf5', '0']]
    .forEach(([offset, color, opacity]) => corePart(auraGradient, 'stop', { offset: offset, 'stop-color': color, 'stop-opacity': opacity }));
  corePart(signal, 'circle', { class: 'energy-core__aura', r: '24', fill: 'url(#scroll-reactor-aura)' });
  corePart(signal, 'circle', { class: 'energy-core__wave energy-core__wave--one', r: '13' });
  corePart(signal, 'circle', { class: 'energy-core__wave energy-core__wave--two', r: '13' });
  const orbitAnimations = [];
  const orbits = [
    { angle: -24, rx: 20, ry: 7.5, color: '#8aeaff', duration: 6800, direction: 1 },
    { angle: 48, rx: 18.5, ry: 8, color: '#d0f5ff', duration: 9100, direction: -1 },
    { angle: 108, rx: 20, ry: 9, color: '#b18aff', duration: 11300, direction: 1 }
  ];
  orbits.forEach(function (orbit, i) {
    const spin = corePart(signal, 'g', { class: 'energy-core__orbit' });
    const plane = corePart(spin, 'g', { transform: 'rotate(' + orbit.angle + ')' });
    corePart(plane, 'ellipse', { rx: orbit.rx, ry: orbit.ry, fill: 'none', stroke: orbit.color, 'stroke-width': i === 1 ? '.6' : '.8', 'stroke-dasharray': i === 2 ? '30 3 2 3' : 'none' });
    corePart(plane, 'circle', { class: 'energy-core__electron', cx: orbit.rx, cy: '0', r: i === 1 ? '1' : '1.35', fill: orbit.color });
    corePart(plane, 'circle', { cx: -orbit.rx, cy: '0', r: '.65', fill: '#efffff', opacity: '.75' });
    orbitAnimations.push({ node: spin, orbit: orbit, animation: null });
  });
  corePart(signal, 'path', { class: 'energy-core__circuit', d: 'M-11-5v-4h4m14 0h4v4M11 5v4H7M-7 9h-4V5M-14 0h3m22 0h3M0-14v3m0 22v3' });
  corePart(signal, 'circle', { class: 'energy-core__containment', r: '9.5' });
  const coreHeart = corePart(signal, 'g', { class: 'energy-core__heart' });
  corePart(coreHeart, 'circle', { r: '7.4', fill: 'url(#scroll-reactor-light)' });
  corePart(coreHeart, 'circle', { r: '3.2', fill: '#f3feff' });
  ['M-16-2l4 1 2-4 2 2', 'M6-10l2-3 3 2 1-4', 'M8 8l4 1-1 4 4 1'].forEach(function (d, i) {
    corePart(signal, 'path', { class: 'energy-core__arc energy-core__arc--' + i, d: d });
  });
  let energyFrame = 0, energy = 0, velocityTarget = 0, energyTick = 0;
  let coreDistance = null, coreScroll = null, coreTime = 0, lastCoreMovement = 0;
  function coreIdle() {
    orbitAnimations.forEach(function (item) {
      if (!item.animation && !reduced.matches && !document.hidden && typeof item.node.animate === 'function') {
        item.animation = item.node.animate([{ transform: 'rotate(0deg)' },
          { transform: 'rotate(' + (360 * item.orbit.direction) + 'deg)' }],
        { duration: item.orbit.duration, iterations: Infinity, easing: 'linear' });
      }
      if (!item.animation) return;
      const paused = reduced.matches || document.hidden;
      if (paused && item.animation.playState !== 'paused' && typeof item.animation.pause === 'function') item.animation.pause();
      if (!paused && item.animation.playState !== 'running' && typeof item.animation.play === 'function') item.animation.play();
      const rate = paused ? 1 : 1 + energy * 3;
      if (Math.abs((item.animation.playbackRate || 1) - rate) > .005) typeof item.animation.updatePlaybackRate === 'function' ? item.animation.updatePlaybackRate(rate) : item.animation.playbackRate = rate;
    });
    signal.classList.toggle('is-energy-paused', Boolean(document.hidden));
  }
  function resetCore() {
    if (energyFrame) cancelAnimationFrame(energyFrame);
    energyFrame = 0; energy = velocityTarget = energyTick = 0;
    coreDistance = coreScroll = null;
    signal.style.setProperty('--core-energy', '0');
    coreIdle();
  }
  function animateEnergy() {
    energyFrame = 0;
    if (reduced.matches || document.hidden) { resetCore(); return; }
    const now = Date.now(), dt = Math.min(64, Math.max(1, now - (energyTick || now - 16)));
    energyTick = now;
    if (now - lastCoreMovement > 75) velocityTarget *= Math.exp(-dt / 240);
    energy += (velocityTarget - energy) * (1 - Math.exp(-dt / 100));
    signal.style.setProperty('--core-energy', energy.toFixed(3));
    coreIdle();
    if (energy > .002 || velocityTarget > .002) energyFrame = requestAnimationFrame(animateEnergy);
    else { energy = 0; signal.style.setProperty('--core-energy', '0'); coreIdle(); }
  }
  function energizeCore(distance) {
    const now = Date.now();
    if (coreDistance !== null && !reduced.matches && !document.hidden) {
      const delta = Math.abs(distance - coreDistance), scrollDelta = Math.abs(window.scrollY - coreScroll);
      if (delta > 180 || scrollDelta > window.innerHeight * .7) { resetCore(); }
      else if (delta > .01) {
        const dt = Math.max(16, now - coreTime);
        velocityTarget = Math.min(1, delta / dt / 2);
        lastCoreMovement = now;
        if (!energyFrame) { energyTick = now; energyFrame = requestAnimationFrame(animateEnergy); }
      }
    }
    coreDistance = distance; coreScroll = window.scrollY; coreTime = now;
  }
  coreIdle();

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
    if (!delta || travelSinceEmission + .001 < (mobile ? 14 : 10) || now - lastEmission < (mobile ? 90 : 65) ||
        particles.size >= (mobile ? 4 : 8) || distance <= 0 || distance >= length) return;
    const behind = draw.getPointAtLength(Math.max(0, Math.min(length, distance - Math.sign(delta) * (mobile ? 20 : 28))));
    const tip = draw.getPointAtLength(distance);
    const screenY = behind.y + mainOrigin - window.scrollY;
    if (screenY < 24 || screenY > window.innerHeight - 24) return;
    lastEmission = now; travelSinceEmission = 0;
    const shapes = ['M-2-4 1-4-1-1H2L-2 4 0 0h-2Z', 'M-3 2V-2H2V-4M-4 2h2', 'M-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M-6 0h3l2-2h3', 'M-3 0h6M0-3v6'];
    const particle = document.createElementNS(ns, 'path');
    particle.setAttribute('d', shapes[particleIndex % shapes.length]);
    particle.setAttribute('class', 'field-path__particle field-path__particle--' + particleIndex % shapes.length);
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
    const skills = find('#skills');
    const timeline = find('.field-timeline');
    markerY = entries.map(entry => {
      const b = box(entry), dot = window.getComputedStyle(entry, '::before');
      return b.y + parseFloat(dot.top || '28.8') + parseFloat(dot.height || '13') / 2;
    });
    const schematic = find('.field-schematic svg');
    const contactBox = box(contact);
    const mobile = window.innerWidth <= 900;
    let radius = (mobile ? 30 : 44) / 2;
    // Follow the actual reading margins, including the 1440px editorial grid.
    // A fixed canvas width would put the wire inside cards on wider displays.
    const contentBounds = ['#about', '#exploring', '#research', '#experience', '#skills', '#github', '#contact']
      .map(selector => insetContainer(selector + ' > .container')).filter(Boolean);
    const contentLeft = contentBounds.length ? Math.min(...contentBounds.map(b => b.x)) : radius * 2 + 12;
    const contentRight = contentBounds.length ? Math.max(...contentBounds.map(b => b.right)) : width - radius * 2 - 12;
    const left = mobile ? radius + 1 : Math.max(radius + 1, contentLeft - radius - 12);
    // Some tablet layouts have a narrower right inset. Use the left lane when
    // that gutter cannot contain the whole reactor plus its breathing room.
    const right = mobile || width - contentRight < radius * 2 + 12 ? left :
      Math.min(width - radius - 1, contentRight + radius + 12);
    let first = { x: right, y: portrait ? portrait.bottom - radius : hero ? hero.bottom - 100 : radius };
    let points = [first];
    let side = right;
    function add(x, y) {
      const previous = points[points.length - 1];
      if (y > previous.y + .01) points.push({ x: x, y: y });
    }
    function insetContainer(selector) {
      const el = main.querySelector(selector), b = box(el);
      if (!b) return null;
      const style = window.getComputedStyle(el);
      return { x: b.x + (parseFloat(style.paddingLeft) || 0),
        right: b.right - (parseFloat(style.paddingRight) || 0), y: b.y, bottom: b.bottom };
    }
    function crossing(fromSelector, toSelector, fromFallback, toFallback, nextSide) {
      const from = insetContainer(fromSelector), to = insetContainer(toSelector);
      const lower = from ? from.bottom : fromFallback, upper = to ? to.y : toFallback;
      const currentPoint = points[points.length - 1];
      if (upper - lower < radius * 2 + 4 || lower < currentPoint.y || nextSide === side) return false;
      // Try the widest curve first, then trim it only if the full reactor would
      // clip either content block. All trials stay within measured whitespace.
      for (let margin = radius * .25; margin <= radius + 10; margin += 2) {
        const y0 = lower + margin, y1 = upper - margin;
        if (y1 - y0 < radius) continue;
        let safe = true;
        for (let i = 0; i <= 200; i++) {
          const t = i / 200, x = side + (nextSide - side) * t*t*(3-2*t);
          const y = y0 + (y1 - y0) * (1.5*t - 1.5*t*t + t*t*t);
          const intersects = b => b && x + radius + 8 > b.x && x - radius - 8 < b.right && y + radius + 8 > b.y && y - radius - 8 < b.bottom;
          if (intersects(from) || intersects(to)) { safe = false; break; }
        }
        if (!safe) continue;
        add(side, y0); add(nextSide, y1); side = nextSide; return true;
      }
      return false;
    }
    if (about && projects) crossing('#about > .container', '#exploring > .container', about.bottom, projects.y, left);
    // Share the timeline's actual node axis, including the compact mobile gutter.
    if (timeline && entries.length) {
      const firstEntry = box(entries[0]), last = box(entries[entries.length - 1]);
      const dot = window.getComputedStyle(entries[0], '::before');
      const nodeLeft = parseFloat(dot.left);
      const rail = Number.isFinite(nodeLeft) ? firstEntry.x + nodeLeft + parseFloat(dot.width || dot.height) / 2 : side;
      const group = find('.field-experience');
      if (group && rail !== side) crossing('#research > .container', '.field-experience', group.y - 96, group.y, rail);
      if (side === rail && group) {
        add(rail, group.bottom);
        // Experience uses a wider container than the other sections on large
        // screens. Keep the full reactor outside that container, not on its edge.
        const education = insetContainer('#experience > .container');
        const educationLane = education ? Math.max(radius + 1, Math.min(left, education.x - radius - 8)) : left;
        crossing('.field-experience', '.learning-project-note', group.bottom, group.bottom + 96, educationLane);
      }
      experienceRange = { start: firstEntry.y, end: last.bottom - 32 };
    }
    const github = find('#github');
    if (skills && github) crossing('#skills > .container', '#github > .container', skills.bottom, github.y, right);
    let finish = { x: side, y: schematic ? schematic.y + schematic.height * .53 : contactBox.bottom - radius * 3 };
    add(finish.x, finish.y);
    // Validate the complete route, not just the two blocks at each crossing.
    // Container interiors protect all descendants, including Education below
    // the timeline. Hero content has no shared container, so include it explicitly.
    const avoidance = ['#about', '#exploring', '#research', '#skills', '#github', '#contact']
      .map(selector => insetContainer(selector + ' > .container')).filter(Boolean).concat([
      find('.hero-copy'), find('.hero-visual'),
      find('.field-experience > .section__header'),
      find('.learning-project-note'), find('.learning-background-title'), find('.education-grid')
    ]).filter(Boolean);
    // Experience has an intentional whitespace corridor between the sticky
    // year and timeline content. Protect those actual blocks, not their parent
    // container, which would incorrectly classify the corridor as content.
    entries.forEach(function (entry) {
      ['.learning-timeline__body', '.learning-timeline__label'].forEach(function (selector) {
        const zone = box(entry.querySelector(selector));
        if (zone) avoidance.push(zone);
      });
    });
    const stickyZone = find('.field-sticky'), experienceGroup = find('.field-experience');
    if (stickyZone && experienceGroup) {
      // The sticky panel can occupy any vertical position in its parent.
      avoidance.push({ x: stickyZone.x, right: stickyZone.right,
        y: experienceGroup.y, bottom: experienceGroup.bottom });
    }
    if (window.PortfolioPathRouting) {
      const routed = window.PortfolioPathRouting.route(points, avoidance, width, radius);
      points = routed.points; radius = routed.radius;
      if (routed.fallback && timeline && entries.length && experienceGroup) {
        const entryBox = box(entries[0]), dot = window.getComputedStyle(entries[0], '::before');
        const dotLeft = parseFloat(dot.left);
        const rail = Number.isFinite(dotLeft) ? entryBox.x + dotLeft + parseFloat(dot.width || dot.height) / 2 : null;
        const note = find('.learning-project-note');
        const outerRadius = radius;
        if (rail !== null) avoidance.forEach(function (zone) {
          if (zone.bottom <= experienceGroup.y || zone.y >= experienceGroup.bottom) return;
          const distance = rail <= zone.x ? zone.x - rail : rail >= zone.right ? rail - zone.right : 0;
          radius = Math.min(radius, Math.max(0, distance - 9));
        });
        const clearance = radius + 8;
        const enter = experienceGroup.y - clearance - 2;
        const leave = experienceGroup.bottom + clearance + 2;
        const exit = note ? note.y - clearance - 2 : leave + 40;
        const lane = points[0].x;
        const researchZone = insetContainer('#research > .container');
        const approach = Math.max(enter - 48, researchZone ? researchZone.bottom + clearance + 2 : enter - 48);
        const candidate = points.filter(p => p.y < approach).concat([
          { x: lane, y: approach }, { x: rail, y: enter },
          { x: rail, y: leave }, { x: lane, y: exit }
        ], points.filter(p => p.y > exit));
        if (rail !== null && radius >= 6 && approach < enter && exit > leave &&
            window.PortfolioPathRouting.safe(candidate, avoidance, clearance)) {
          points = candidate; svg.dataset.timelineConnected = 'true';
        } else { radius = outerRadius; svg.dataset.timelineConnected = 'false'; }
      } else svg.dataset.timelineConnected = 'true';
      first = points[0]; finish = points[points.length - 1];
      svg.dataset.routing = routed.fallback ? 'exterior' : 'interior';
      svg.dataset.clearance = String(radius + 8);
    }
    // Every segment has vertical endpoint tangents. Joining straight runs and
    // lateral S-curves therefore has no angle discontinuity or horizontal plateau.
    let d = `M${first.x} ${first.y}`;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], half = (b.y - a.y) / 2;
      d += ` C${a.x} ${a.y + half} ${b.x} ${b.y - half} ${b.x} ${b.y}`;
    }

    svg.setAttribute('viewBox', `0 0 ${width} ${main.offsetHeight}`);
    svg.setAttribute('height', main.offsetHeight);
    base.setAttribute('d', d); draw.setAttribute('d', d);
    length = draw.getTotalLength(); draw.style.strokeDasharray = String(length);
    // Timeline dots remain semantic CSS markers inside the existing content.
    // The continuous journey shares their measured axis through Experience.
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
      // Keep the core vertically locked to the reader during Experience. The global
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
    mainOrigin = bounds.top + window.scrollY;
    renderedDistance = null; rollDistance = null;
    signal.setAttribute('x', -radius); signal.setAttribute('y', -radius);
    signal.setAttribute('width', radius * 2); signal.setAttribute('height', radius * 2);
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
    if (dirty) { clearTrail(); resetCore(); measure(); }
    const targetY = window.scrollY + window.innerHeight * .65 - mainOrigin;
    let low = 0, high = samples.length - 1;
    while (low < high) { const mid = (low + high) >> 1; if (samples[mid].y < targetY) low = mid + 1; else high = mid; }
    const a = samples[Math.max(0, low - 1)], b = samples[low];
    const blend = b.y > a.y ? Math.max(0, Math.min(1, (targetY - a.y) / (b.y - a.y))) : 0;
    let progress = length ? (a.distance + (b.distance - a.distance) * blend) / length : 0;
    if (window.scrollY + window.innerHeight * .65 <= start) progress = 0;
    if (window.scrollY + window.innerHeight * .65 >= end) progress = 1;
    const targetDistance = length * progress, now = Date.now();
    const dt = Math.min(64, Math.max(1, now - (renderTime || now - 16)));
    renderTime = now;
    if (renderedDistance === null || reduced.matches) renderedDistance = targetDistance;
    else renderedDistance += (targetDistance - renderedDistance) * (1 - Math.exp(-dt / 45));
    const pending = !reduced.matches && Math.abs(targetDistance - renderedDistance) > .02;
    if (!pending) renderedDistance = targetDistance;
    svg.dataset.targetProgress = progress.toFixed(4);
    svg.dataset.progress = (length ? renderedDistance / length : 0).toFixed(4);
    draw.style.strokeDashoffset = reduced.matches ? '0' : String(length - renderedDistance);
    const p = draw.getPointAtLength(renderedDistance);
    let index = 0;
    markerY.forEach((y, i) => { if (p.y >= y) index = i; });
    setActive(index);
    entries.forEach((entry, i) => entry.classList.toggle('is-reached', p.y >= markerY[i]));
    const resting = reduced.matches ? draw.getPointAtLength(0) : p;
    const ahead = draw.getPointAtLength(Math.min(length, renderedDistance + 8));
    const tilt = reduced.matches || progress === 0 || progress === 1 ? 0 : Math.max(-9, Math.min(9, (ahead.x - p.x) * 1.2));
    emitTrail(renderedDistance);
    energizeCore(renderedDistance);
    position.setAttribute('transform', `translate(${resting.x} ${resting.y})`);
    tiltGroup.setAttribute('transform', `rotate(${tilt})`);
    if (rollDistance !== null) rollAngle += (renderedDistance - rollDistance) / 250 * 360;
    rollDistance = renderedDistance;
    rollGroup.setAttribute('transform', `rotate(${reduced.matches ? 0 : Number(rollAngle.toFixed(5))})`);
    gliding = pending;
    if (pending && !document.hidden) schedule();
  }
  function schedule() { if (!frame) { if (!gliding) renderTime = Date.now() - 16; frame = requestAnimationFrame(update); } }
  function resize() { dirty = true; schedule(); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', function () { if (reduced.matches) cancelYearMotion(); resetCore(); resize(); });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(main);
    main.querySelectorAll('section, .container').forEach(el => observer.observe(el));
  }
  // Load doesn't bubble; capture catches lazy images anywhere in the journey.
  main.addEventListener('load', resize, true);
  window.addEventListener('pageshow', resize);
  main.addEventListener('toggle', resize, true);
  main.addEventListener('transitionend', function (event) {
    if (['height', 'max-height', 'width', 'padding'].includes(event.propertyName)) resize();
  }, true);
  if ('MutationObserver' in window) new MutationObserver(function (records) {
    if (records.some(function (record) {
      const el = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return el && !el.closest('.field-path, .field-active, .field-year');
    })) resize();
  }).observe(main, { childList: true, subtree: true, characterData: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { clearTrail(); cancelYearMotion(); resetCore(); if (frame) cancelAnimationFrame(frame); frame = 0; renderedDistance = rollDistance = null; renderTime = 0; gliding = false; } else { coreIdle(); schedule(); } });
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



