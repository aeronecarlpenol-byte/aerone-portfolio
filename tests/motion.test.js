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
      closest: selector => inHero && selector === '.hero' ? hero : null,
      getContext: () => canvasAvailable ? ctx : null,
      rect: { left: 60, top: 100, width: 320, height: 200, bottom: 300 },
      getBoundingClientRect() { return this.rect; },
      matches: () => tag === 'portrait'
    });
  }
  const hero = element('section');
  const items = [element('h1', true), element('portrait', true), element('section')];
  const body = element('body');
  const document = events({ body, hidden: false, documentElement: element('html'),
    createElement: tag => element(tag), querySelector: () => hero,
    querySelectorAll: selector => selector === '.hero .reveal' ? items.slice(0, 2) :
      selector.includes('.hero-top') ? items.slice(0, 2) : []
  });
  function matchMedia(query) {
    if (!media.has(query)) media.set(query, events({ matches:
      query.includes('reduced-motion') ? reduced : query.includes('coarse') ? coarse : false }));
    return media.get(query);
  }
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); } unobserve(target) { this.targets.delete(target); }
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
    reveal: (targets = items) => observers.forEach(o => o.callback(targets.filter(target => o.targets.has(target)).map(target => ({ target, isIntersecting: true })))),
    leave: (targets = items) => observers.forEach(o => o.callback(targets.filter(target => o.targets.has(target)).map(target => ({ target,
      isIntersecting: false, boundingClientRect: target.getBoundingClientRect() })))),
    canvas: () => body.children.find(e => e.className === 'cursor-swarm'),
    intro: () => body.children.find(e => e.className === 'swarm-intro')
  };
}


test('hero is immediately available without a blocking intro or assembly overlay', () => {
  const app = setup();
  assert.equal(app.intro(), undefined);
  assert.equal(app.timers.size, 0);
  assert.ok(app.items.every(e => !e.classList.contains('is-visible')));
  app.reveal(); app.tick(16); app.tick(700);
  assert.ok(app.items.slice(0, 2).every(e => e.classList.contains('is-visible')));
  assert.equal(app.calls.filter(c => c.name === 'strokeRect').length, 0);
  assert.ok(app.items.slice(0, 2).every(e => parseInt(e.style.getPropertyValue('--reveal-delay')) <= 180));
});
test('hero entrances never reset when scrolling away and returning', () => {
  const app = setup(), target = app.items[0];
  app.reveal([target]);
  for (const [top,bottom] of [[-400,-200],[950,1150]]) {
    target.rect = {...target.rect,top,bottom}; app.leave([target]); app.window.emit('scroll'); app.tick(100);
    assert.equal(target.classList.contains('is-visible'), true);
  }
});
test('reduced motion and canvas fallback leave content accessible', () => {
  const app = setup({ reduced: true });
  assert.equal(app.frames.size, 0); assert.equal(app.canvas().hidden, true);
  assert.ok(app.items.slice(0, 2).every(e => e.classList.contains('is-visible')));
  const fallback = setup({canvasAvailable:false});
  assert.equal(fallback.canvas(), undefined); fallback.reveal();
  assert.ok(fallback.items.slice(0,2).every(e=>e.classList.contains('is-visible')));
});
test('motion preference, print and hidden tab suspend rendering without duplicate loops', () => {
  const app=setup();
  app.preference('(prefers-reduced-motion: reduce)',true); assert.equal(app.frames.size,0);
  app.preference('(prefers-reduced-motion: reduce)',false); assert.equal(app.frames.size,1);
  app.preference('print',true); assert.equal(app.frames.size,0);
  app.preference('print',false); app.document.hidden=true; app.document.emit('visibilitychange');
  assert.equal(app.frames.size,0); app.document.hidden=false; app.document.emit('visibilitychange');
  app.window.emit('pageshow'); app.window.emit('pageshow'); assert.equal(app.frames.size,1);
  app.window.emit('pagehide'); assert.equal(app.frames.size,0);
});
test('pending content is readable and entrance movement stays small', () => {
  const css=fs.readFileSync('css/motion.css','utf8');
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for(const [,selector,declarations] of rules.filter(([,s])=>s.includes('.reveal')&&!s.includes('.is-visible'))) {
    assert.doesNotMatch(declarations,/opacity\s*:\s*0(?:\s|;|$)|visibility\s*:\s*hidden/);
  }
  assert.doesNotMatch(css,/translateY\((?:48|65)px\)/);
});
