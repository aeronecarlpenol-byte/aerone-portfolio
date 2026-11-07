'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(reduced = false) {
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
  const contact = { offsetHeight: 700, getBoundingClientRect: rect(3000) };
  const schematic = node(), spark = node(); spark.attrs['aria-pressed'] = 'false'; spark.closest = () => schematic;
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
