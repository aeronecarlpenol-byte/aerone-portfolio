'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(reduced = false, width = 1280, clientWidth = width) {
  const frames = [], handlers = {};
  let now = 1000;
  const media = { matches: reduced, addEventListener: (_, fn) => { media.change = fn; } };
  const node = () => ({ attrs: {}, styles: {}, dataset: {}, textContent: '', children: [],
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    style: { setProperty(k, v) { this[k] = v; } },
    classList: { toggle() {} }, appendChild(c) { this.children.push(c); c.parent = this; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); },
    getTotalLength() { return 2000; }, getPointAtLength(n) { return { x: 20, y: n }; },
    animate(keyframes, options) { this.animations = (this.animations || 0) + 1; this.keyframes = keyframes; this.animationOptions = options; return this.animation = { cancelled: false, cancel() { this.cancelled = true; } }; },
    addEventListener(k, fn) { this[k] = fn; }
  });
  const window = { innerWidth: width, innerHeight: 800, scrollY: 0, matchMedia: () => media,
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
  main.clientWidth = clientWidth;
  const contact = { offsetHeight: 700, getBoundingClientRect: rect(3000) };
  const schematic = node(), spark = node(); spark.attrs['aria-pressed'] = 'false'; spark.closest = () => schematic;
  const geometry = (x, y, w, h) => Object.assign(node(), { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h, offsetParent: main });
  Object.assign(experience, geometry(0, 400, width, 1300));
  Object.assign(contact, geometry(0, 3000, width, 700));
  entries.forEach((entry, i) => Object.assign(entry, { offsetLeft: width * .43, offsetTop: 500 + i * 600, offsetWidth: width * .5, offsetHeight: 500, offsetParent: main }));
  const landmarks = {
    '#hero': geometry(0, 0, width, 300), '.hero-portrait__image': geometry(width * .55, 50, width * .3, 120),
    '#about': geometry(0, 300, width, 100), '#exploring': geometry(0, 400, width, 40),
    '#research': geometry(0, 440, width, 30), '.research-collage': geometry(60, 442, 200, 20),
    '#skills': geometry(0, 1800, width, 800), '.field-timeline': geometry(width * .43, 500, width * .5, 1100),
    '.field-schematic svg': geometry(width - 300, 3200, 250, 250)
  };
  main.querySelector = s => landmarks[s];
  const document = {
    addEventListener() {},
    getElementById: id => ({ experience, contact, 'main-content': main, skills: { getBoundingClientRect: rect(1800) } })[id],
    createElementNS: node, querySelectorAll: () => [], querySelector: () => spark
  };
  vm.runInNewContext(fs.readFileSync('js/field-notes.js', 'utf8'), {
    window, document, Date: { now: () => now }, requestAnimationFrame: fn => { frames.push(fn); return frames.length; }
  });
  function flush() { frames.splice(0).forEach(fn => fn()); }
  flush();
  return { window, media, main, digits, org, active, spark, flush, entries,
    tick(ms) { now += ms; }, resize() { handlers.resize(); flush(); },
    scroll(y) { window.scrollY = y; handlers.scroll(); flush(); },
    svg: main.children[0] };
}
test('trail follows travel direction, stops emitting at rest, and cleans completed particles', () => {
  const app = setup();
  const trail = app.svg.children.find(n => n.attrs.class === 'field-path__trail');
  app.scroll(20);
  assert.equal(trail.children.length, 1);
  const forward = trail.children[0];
  assert.ok(forward.keyframes[0].transform.includes('522px'), 'forward particle starts behind the emblem at y=540');
  app.tick(150); app.scroll(10);
  assert.equal(trail.children.length, 2);
  const reverseY = Number(trail.children[1].keyframes[0].transform.match(/, ([\d.]+)px/)[1]);
  assert.ok(Math.abs(reverseY - 548) < .01, 'reverse particle starts below the emblem at y=530');
  app.tick(1000); app.scroll(10);
  assert.equal(trail.children.length, 2, 'no emission without movement');
  forward.animation.onfinish();
  assert.equal(trail.children.length, 1);
  app.scroll(2000);
  assert.equal(trail.children.length, 0, 'navigation jump clears old particles');
});

test('trail caps desktop and mobile density and resets on resize or reduced motion', () => {
  for (const [width, cap, size] of [[1280, 8, 35], [390, 4, 24]]) {
    const app = setup(false, width);
    const trail = app.svg.children.find(n => n.attrs.class === 'field-path__trail');
    for (let y = 5; y <= 100; y += 5) { app.tick(180); app.scroll(y); }
    assert.equal(trail.children.length, cap);
    const emblem = app.svg.children.find(n => n.attrs.class === 'field-path__position').children[0].children[0].children[0];
    assert.equal(emblem.attrs.width, size);
    app.resize(); assert.equal(trail.children.length, 0);
    app.media.matches = true; app.media.change(); app.flush();
    app.tick(180); app.scroll(110);
    assert.equal(trail.children.length, 0);
  }
});

test('rolling rotation is distance-based, reversible, stable at rest, and disabled for reduced motion', () => {
  const app = setup();
  const position = app.svg.children.find(n => n.attrs.class === 'field-path__position');
  const roll = position.children[0].children[0];
  const initial = roll.attrs.transform;
  app.scroll(200); const forward = roll.attrs.transform;
  assert.notEqual(forward, initial);
  app.tick(1000); app.scroll(200); assert.equal(roll.attrs.transform, forward);
  app.scroll(0); assert.equal(roll.attrs.transform, initial);
  app.resize(); assert.equal(roll.attrs.transform, initial);
  app.media.matches = true; app.media.change(); app.flush();
  app.scroll(700); assert.equal(roll.attrs.transform, 'rotate(0)');
});

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
test('only changing year digits roll with brief blur and interrupted rolls are cancelled', () => {
  const app = setup();
  assert.ok(app.digits.every(digit => !digit.animations), 'initial year is immediately sharp');
  app.scroll(1000);
  assert.ok(app.digits.slice(0, 3).every(digit => !digit.animations));
  const last = app.digits[3], first = last.animation;
  assert.equal(last.animationOptions.duration, 460);
  assert.equal(last.keyframes[1].filter, 'blur(3px)');
  assert.equal(last.keyframes.at(-1).filter, 'blur(0px)');
  assert.equal(last.keyframes.at(-1).transform, 'translateY(-4em)');
  assert.equal(last.animationOptions.fill, undefined, 'final CSS year remains authoritative');
  app.scroll(0);
  assert.equal(first.cancelled, true);
  assert.equal(last.keyframes.at(-1).transform, 'translateY(-5em)');
  const reverse = last.animation;
  app.media.matches = true; app.media.change(); app.flush();
  assert.equal(reverse.cancelled, true);
  const count = last.animations;
  app.scroll(1000);
  assert.equal(last.animations, count, 'reduced motion changes the year without a roll or blur');
  assert.equal(last.style['--digit'], '4');
});
test('same-year role changes never blur the digits', () => {
  const app = setup();
  app.entries[1].dataset.year = '2025';
  app.scroll(1000);
  assert.equal(app.org.textContent, 'org1');
  assert.ok(app.digits.every(digit => !digit.animations));
});
test('reduced motion keeps trace complete and role readable without animation', () => {
  const app = setup(true); app.scroll(1000);
  assert.equal(app.org.textContent, 'org1');
  assert.equal(app.active.animations, undefined);
  assert.equal(app.svg.children[1].style.strokeDashoffset, '0');
  app.media.matches = false; app.media.change(); app.flush();
  app.scroll(0); assert.equal(app.active.animations, undefined, 'role changes do not fade in late');
});
test('schematic button exposes its toggled state', () => {
  const app = setup();
  app.spark.click(); assert.equal(app.spark.attrs['aria-pressed'], 'true');
  app.spark.click(); assert.equal(app.spark.attrs['aria-pressed'], 'false');
});

test('Experience signal follows the scroll position without distance-weighting lag', () => {
  const app = setup();
  const signal = app.svg.children.find(n => n.attrs.class === 'field-path__position');
  function signalY() { return Number(signal.attrs.transform.match(/translate\([^ ]+ ([^)]+)\)/)[1]); }
  app.scroll(600);
  assert.ok(Math.abs(signalY() - 1120) < 1, 'signal locks to the 65% reading line');
  app.scroll(350);
  assert.ok(Math.abs(signalY() - 870) < 1, 'reverse scrolling follows the same mapping');
});

test('role and year switch exactly as the signal crosses a marker, including repeated years', () => {
  const app = setup();
  app.entries[1].dataset.year = '2025';
  app.scroll(615); // Signal y=1135, just before marker y=1135.3.
  assert.equal(app.org.textContent, 'org0');
  app.scroll(616);
  assert.equal(app.org.textContent, 'org1', 'same-year role must change on the marker crossing');
  assert.equal(app.digits[3].style['--digit'], '5');
  assert.equal(app.active.animations, undefined);
  app.scroll(615);
  assert.equal(app.org.textContent, 'org0', 'reverse crossing changes back immediately');
});
test('desktop route crosses gutters and follows timeline nodes; mobile simplifies it', () => {
  const app = setup();
  const path = app.svg.children[1].attrs.d;
  assert.ok(path.includes('Q'), 'bends are rounded');
  assert.ok(!path.includes(' C'), 'desktop has no decorative loops');
  assert.equal(app.svg.dataset.route, 'desktop');
  assert.ok(!/NaN|undefined/.test(path));
  const circles = app.svg.children.filter(n => n.attrs.class === 'field-path__node');
  assert.equal(circles.length, 1, 'only the hero has an SVG marker; timeline dots are not duplicated');
  assert.ok(path.includes('L550.9 '), 'desktop signal joins the actual timeline rail');
  const mobile = setup(false, 390);
  assert.equal(mobile.svg.dataset.route, 'mobile');
  assert.ok(!mobile.svg.children[1].attrs.d.includes(' C'));
  assert.equal(mobile.svg.children.filter(n => n.attrs.class === 'field-path__node').length, 1);
  assert.ok(!mobile.svg.children[1].attrs.d.includes('L168.2 '), 'mobile keeps one straight gutter rail without a tiny sideways detour');
  const old = mobile.svg.children[1].attrs.d;
  mobile.main.clientWidth = 320;
  mobile.main.load(); mobile.flush();
  assert.notEqual(mobile.svg.children[1].attrs.d, old, 'image loads remeasure geometry');
});

test('timeline route uses the same 900px viewport boundary as its CSS markers', () => {
  assert.equal(setup(false, 900).svg.dataset.route, 'mobile');
  assert.equal(setup(false, 901).svg.dataset.route, 'desktop');
  assert.equal(setup(false, 901, 886).svg.dataset.route, 'desktop', 'a desktop scrollbar must not select the mobile rail');
});
