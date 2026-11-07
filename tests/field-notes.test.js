'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(reduced = false, width = 1280) {
  const frames = [], handlers = {};
  const media = { matches: reduced, addEventListener: (_, fn) => { media.change = fn; } };
  const node = () => ({ attrs: {}, styles: {}, dataset: {}, textContent: '', children: [],
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    style: { setProperty(k, v) { this[k] = v; } },
    classList: { toggle() {} }, appendChild(c) { this.children.push(c); },
    getTotalLength() { return 2000; }, getPointAtLength(n) { return { x: 20, y: n }; },
    animate() { this.animations = (this.animations || 0) + 1; },
    addEventListener(k, fn) { this[k] = fn; }
  });
  const window = { innerHeight: 800, scrollY: 0, matchMedia: () => media,
    getComputedStyle: () => ({ top: '28.8px', height: '13px' }),
    addEventListener(k, fn) { handlers[k] = fn; } };
  const rect = top => () => ({ top: top - window.scrollY });
  const entries = [2025, 2024].map((year, i) => Object.assign(node(), {
    dataset: { year: String(year), org: 'org' + i, role: 'role' + i }, getBoundingClientRect: rect(500 + i * 600)
  }));
  const digits = Array.from({ length: 4 }, node), active = node(), org = node(), role = node();
  const experience = { getBoundingClientRect: rect(400),
    querySelectorAll: s => s.includes('[data-year]') ? entries : digits,
    querySelector: s => ({ '.field-active': active, '.field-active__org': org, '.field-active__role': role })[s] };
  const main = Object.assign(node(), { clientWidth: 1280, offsetHeight: 4000, getBoundingClientRect: rect(0) });
  main.clientWidth = width;
  const contact = { offsetHeight: 700, getBoundingClientRect: rect(3000) };
  const schematic = node(), spark = node(); spark.attrs['aria-pressed'] = 'false'; spark.closest = () => schematic;
  const geometry = (x, y, w, h) => Object.assign(node(), { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h, offsetParent: main });
  Object.assign(experience, geometry(0, 400, width, 1300));
  Object.assign(contact, geometry(0, 3000, width, 700));
  entries.forEach((entry, i) => Object.assign(entry, { offsetLeft: width * .43, offsetTop: 500 + i * 600, offsetWidth: width * .5, offsetHeight: 500, offsetParent: main }));
  const landmarks = {
    '#hero': geometry(0, 0, width, 300), '.hero-portrait__image': geometry(width * .55, 50, width * .3, 120),
    '#about': geometry(0, 300, width, 100), '#exploring': geometry(0, 400, width, 100),
    '#research': geometry(0, 500, width, 100), '.research-collage': geometry(60, 510, 200, 60),
    '#skills': geometry(0, 1800, width, 800), '.field-timeline': geometry(width * .43, 500, width * .5, 1100),
    '.field-schematic svg': geometry(width - 300, 3200, 250, 250)
  };
  main.querySelector = s => landmarks[s];
  const document = {
    getElementById: id => ({ experience, contact, 'main-content': main, skills: { getBoundingClientRect: rect(1800) } })[id],
    createElementNS: node, querySelectorAll: () => [], querySelector: () => spark
  };
  vm.runInNewContext(fs.readFileSync('js/field-notes.js', 'utf8'), {
    window, document, requestAnimationFrame: fn => { frames.push(fn); return frames.length; }
  });
  function flush() { frames.splice(0).forEach(fn => fn()); }
  flush();
  return { window, media, main, digits, org, active, spark, flush,
    scroll(y) { window.scrollY = y; handlers.scroll(); flush(); },
    svg: main.children[0] };
}
test('year, active role, and trace track scrolling in both directions', () => {
  const app = setup();
  assert.equal(app.org.textContent, 'org0');
  const first = Number(app.svg.dataset.progress);
  app.scroll(1000);
  assert.equal(app.org.textContent, 'org1');
  assert.equal(app.digits[3].style['--digit'], '4');
  assert.ok(Number(app.svg.dataset.progress) > first);
  app.scroll(0);
  assert.equal(app.org.textContent, 'org0');
  assert.equal(app.digits[3].style['--digit'], '5');
  assert.equal(Number(app.svg.dataset.progress), first);
  app.scroll(9999); assert.equal(Number(app.svg.dataset.progress), 1);
  app.scroll(-9999); assert.equal(Number(app.svg.dataset.progress), 0);
});
test('reduced motion keeps trace complete and role readable without animation', () => {
  const app = setup(true); app.scroll(1000);
  assert.equal(app.org.textContent, 'org1');
  assert.equal(app.active.animations, undefined);
  assert.equal(app.svg.children[1].style.strokeDashoffset, '0');
  app.media.matches = false; app.media.change(); app.flush();
  app.scroll(0); assert.equal(app.active.animations, 1);
});
test('schematic button exposes its toggled state', () => {
  const app = setup();
  app.spark.click(); assert.equal(app.spark.attrs['aria-pressed'], 'true');
  app.spark.click(); assert.equal(app.spark.attrs['aria-pressed'], 'false');
});
test('desktop route crosses gutters and follows timeline nodes; mobile simplifies it', () => {
  const app = setup();
  const path = app.svg.children[1].attrs.d;
  assert.ok(path.includes('Q'), 'bends are rounded');
  assert.ok(path.includes(' C'), 'desktop has a whitespace loop');
  assert.equal(app.svg.dataset.route, 'desktop');
  assert.ok(!/NaN|undefined/.test(path));
  const circles = app.svg.children.filter(n => n.attrs.class === 'field-path__node');
  assert.equal(circles.length, 3);
  assert.equal(circles[1].attrs.cx, 1280 * .43);
  const mobile = setup(false, 390);
  assert.equal(mobile.svg.dataset.route, 'mobile');
  assert.ok(!mobile.svg.children[1].attrs.d.includes(' C'));
  assert.equal(mobile.svg.children.filter(n => n.attrs.class === 'field-path__node')[1].attrs.cx, 12);
  const old = mobile.svg.children[1].attrs.d;
  mobile.main.clientWidth = 320;
  mobile.main.load(); mobile.flush();
  assert.notEqual(mobile.svg.children[1].attrs.d, old, 'image loads remeasure geometry');
});
