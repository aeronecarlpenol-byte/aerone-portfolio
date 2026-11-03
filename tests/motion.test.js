'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the actual animation clock and DOM lifecycle without a browser dependency.
function setup({ reduced = false, hash = '', canvasAvailable = true, coarse = false } = {}) {
  let now = 0, next = 1;
  const frames = new Map(), timers = new Map(), observers = [], calls = [];
  const media = new Map();
  function events(target) {
    target.handlers = {};
    target.addEventListener = (name, fn) => (target.handlers[name] ||= []).push(fn);
    target.emit = (name, event = {}) => (target.handlers[name] || []).forEach(fn => fn(event));
    return target;
  }
  const ctx = new Proxy({}, { get(target, name) {
    if (!(name in target)) target[name] = (...args) => calls.push({ name, args });
    return target[name];
  } });
  function element(tag = 'div', inHero = false) {
    const values = {}, classes = new Set();
    return events({ tag, children: [], hidden: false, removed: false,
      classList: { add: v => classes.add(v), remove: v => classes.delete(v), contains: v => classes.has(v) },
      style: { setProperty: (k, v) => { values[k] = v; }, getPropertyValue: k => values[k] || '' },
      appendChild(child) { this.children.push(child); },
      setAttribute() {}, remove() { this.removed = true; },
      closest: () => inHero ? hero : null,
      getContext: () => canvasAvailable ? ctx : null,
      getBoundingClientRect: () => ({ left: 60, top: 100, width: 320, height: 200, bottom: 300 }),
      matches: () => tag === 'portrait'
    });
  }
  const hero = element('section');
  const items = [element('h1', true), element('portrait', true), element('section')];
  const body = element('body');
  const document = events({ body, hidden: false, documentElement: element('html'),
    createElement: tag => element(tag), querySelector: () => hero,
    querySelectorAll: selector => selector === '.hero .reveal' ? items.slice(0, 2) :
      selector.includes('.hero-top') ? items : []
  });
  function matchMedia(query) {
    if (!media.has(query)) media.set(query, events({ matches:
      query.includes('reduced-motion') ? reduced : query.includes('coarse') ? coarse : false }));
    return media.get(query);
  }
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {} unobserve() {}
  }
  const window = events({ innerWidth: 1280, innerHeight: 800, devicePixelRatio: 3,
    matchMedia, IntersectionObserver: Observer,
    setTimeout(fn, delay) { const id = next++; timers.set(id, { fn, due: now + delay }); return id; }
  });
  const context = { document, window, location: { hash }, performance: { now: () => now },
    IntersectionObserver: Observer,
    requestAnimationFrame(fn) { const id = next++; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); }, clearTimeout(id) { timers.delete(id); }
  };
  vm.runInNewContext(fs.readFileSync('js/motion.js', 'utf8'), context);
  function tick(time) {
    now = time;
    for (const [id, timer] of timers) if (timer.due <= now) { timers.delete(id); timer.fn(); }
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(fn => fn(now));
  }
  function preference(query, value) { const m = matchMedia(query); m.matches = value; m.emit('change'); }
  return { body, items, frames, timers, calls, document, window, tick, preference,
    reveal: (targets = items) => observers.forEach(o => o.callback(targets.map(target => ({ target, isIntersecting: true })))),
    canvas: () => body.children.find(e => e.className === 'cursor-swarm'),
    intro: () => body.children.find(e => e.className === 'swarm-intro')
  };
}

test('intro orbits, scatters, assembles real element bounds, then removes its backdrop', () => {
  const app = setup();
  assert.ok(app.intro());
  assert.equal(app.canvas().width, 2560, 'pixel ratio is capped at two');
  app.reveal(app.items.slice(0, 2)); app.tick(16); app.tick(700);
  assert.equal(app.calls.filter(c => c.name === 'strokeRect').length, 0);
  app.tick(1500);
  assert.ok(app.calls.some(c => c.name === 'strokeRect'));
  app.tick(2200); app.tick(3300);
  assert.equal(app.intro().removed, true);
  assert.equal(app.frames.size, 1, 'only one rendering loop remains');
  for (const call of app.calls) {
    for (const n of call.args.flat()) if (typeof n === 'number') assert.ok(Number.isFinite(n));
  }
});

test('direct section links skip the intro and still animate section assembly', () => {
  const app = setup({ hash: '#research' });
  assert.equal(app.intro(), undefined);
  app.reveal(); app.tick(100);
  assert.ok(app.calls.some(c => c.name === 'strokeRect'));
  assert.ok(Number.parseInt(app.items[0].style.getPropertyValue('--reveal-delay'), 10) < 500);
});

test('reduced motion disables frames and reveals all content immediately', () => {
  const app = setup({ reduced: true });
  assert.equal(app.frames.size, 0);
  assert.equal(app.canvas().hidden, true);
  assert.equal(app.intro(), undefined);
  assert.ok(app.items.every(e => e.classList.contains('is-visible')));
});

test('changing motion preferences or print state cancels rendering and the intro', () => {
  const app = setup();
  app.preference('(prefers-reduced-motion: reduce)', true);
  assert.equal(app.frames.size, 0);
  assert.equal(app.intro().removed, true);
  app.preference('(prefers-reduced-motion: reduce)', false);
  assert.equal(app.frames.size, 1);
  app.preference('print', true);
  assert.equal(app.frames.size, 0);
  assert.equal(app.canvas().hidden, true);
});

test('hidden tabs pause, and returning repeatedly never creates duplicate loops', () => {
  const app = setup();
  app.document.hidden = true; app.document.emit('visibilitychange');
  assert.equal(app.frames.size, 0);
  app.tick(4000);
  assert.equal(app.intro().removed, true, 'timeout cleans up even without rendering');
  app.document.hidden = false; app.document.emit('visibilitychange');
  app.window.emit('pageshow'); app.window.emit('pageshow');
  assert.equal(app.frames.size, 1);
  app.window.emit('pagehide');
  assert.equal(app.frames.size, 0);
  assert.equal(app.timers.size, 0);
});

test('keyboard users can skip the intro, and unavailable canvas does not delay content', () => {
  const app = setup();
  app.document.emit('keydown', { key: 'Escape' });
  assert.equal(app.intro().removed, true);
  assert.equal(app.items[0].style.getPropertyValue('--reveal-delay'), '0ms');
  const fallback = setup({ canvasAvailable: false });
  assert.equal(fallback.canvas(), undefined);
  assert.ok(Number.parseInt(fallback.items[0].style.getPropertyValue('--reveal-delay'), 10) < 500);
});

test('unobserved text stays readable and heading clipping only begins after detection', () => {
  const css = fs.readFileSync('css/motion.css', 'utf8');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const pendingRules = rules.filter(([, selector]) => selector.includes('.reveal') &&
    !selector.includes('.is-visible'));
  assert.ok(pendingRules.length > 0);
  for (const [, selector, declarations] of pendingRules) {
    assert.doesNotMatch(declarations, /opacity\s*:\s*0(?:\s|;|$)/, selector);
    assert.doesNotMatch(declarations, /clip-path\s*:\s*inset\([^)]*100%/, selector);
    assert.doesNotMatch(declarations, /visibility\s*:\s*hidden/, selector);
  }
  const app = setup();
  assert.ok(app.items.every(e => !e.classList.contains('is-visible')));
  app.reveal();
  assert.ok(app.items.every(e => e.classList.contains('is-visible')));
  app.tick(5000);
  assert.equal(app.intro().removed, true);
});
