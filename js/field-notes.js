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
  const nodes = [0, 1, 2].map(() => element('circle', { class: 'field-path__node', r: '4' }));
  const signal = element('rect', { class: 'field-path__signal', x: '-5', y: '-5', width: '10', height: '10', rx: '2' });
  main.appendChild(svg);
  function measure() {
    const bounds = main.getBoundingClientRect();
    const top = experience.getBoundingClientRect().top - bounds.top + 80;
    const middle = document.getElementById('skills').getBoundingClientRect().top - bounds.top + 110;
    const bottom = contact.getBoundingClientRect().top - bounds.top + contact.offsetHeight - 90;
    const width = main.clientWidth;
    const x = width < 760 ? 13 : Math.max(20, (width - 1200) / 2 + 20);
    const bend = width < 760 ? 9 : 25;
    const d = `M${x + bend} ${top} L${x} ${top + bend} V${middle - 36} L${x + bend} ${middle - 12} V${middle + 34} L${x} ${middle + 58} V${bottom - bend} L${x + bend} ${bottom}`;
    svg.setAttribute('viewBox', `0 0 ${width} ${main.offsetHeight}`);
    svg.setAttribute('height', main.offsetHeight);
    base.setAttribute('d', d); draw.setAttribute('d', d);
    length = draw.getTotalLength(); draw.style.strokeDasharray = String(length);
    [top, middle, bottom].forEach((y, i) => { nodes[i].setAttribute('cx', x + bend); nodes[i].setAttribute('cy', y); });
    start = bounds.top + window.scrollY + top;
    end = bounds.top + window.scrollY + bottom;
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
    const progress = Math.max(0, Math.min(1, (window.scrollY + window.innerHeight * .65 - start) / (end - start)));
    svg.dataset.progress = progress.toFixed(4);
    draw.style.strokeDashoffset = reduced.matches ? '0' : String(length * (1 - progress));
    if (!reduced.matches) { const p = draw.getPointAtLength(length * progress); signal.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(45)`); }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function resize() { dirty = true; schedule(); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  reduced.addEventListener('change', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(main);
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
