'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ reduced = false, supported = true } = {}) {
  const classes = new Set();
  const handlers = {}, logoClasses = new Set();
  const image = { alt: 'Claude' };
  const logo = { offsetLeft: 28, offsetTop: 24, offsetWidth: 38, offsetHeight: 38,
    getBoundingClientRect() { return { left: 128, top: 224 }; },
    values: {}, attrs: {}, handlers: {},
    classList: { add: name => logoClasses.add(name), remove: name => logoClasses.delete(name) },
    style: { setProperty(name, value) { logo.values[name] = value; } },
    setAttribute(name, value) { this.attrs[name] = value; },
    querySelector: () => image, focus() {},
    setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; },
    releasePointerCapture() { this.capture = null; },
    addEventListener(name, fn) { this.handlers[name] = fn; }
  };
  const cluster = { classList: {
    add: name => classes.add(name),
    remove: name => classes.delete(name),
    toggle(name, value) { if (value) classes.add(name); else classes.delete(name); }
  }, clientWidth: 352, clientHeight: 156, querySelectorAll: () => [logo],
    appendChild(child) { child.parentNode = this; } };
  logo.parentNode = cluster;
  const preference = { matches: reduced, addEventListener(name, fn) { this.change = fn; } };
  let intersect;
  class Observer {
    constructor(callback) { intersect = callback; }
    observe(target) { assert.equal(target, cluster); }
  }
  const window = { innerWidth: 1280, innerHeight: 800, matchMedia: () => preference, addEventListener(name, fn) { handlers[name] = fn; } };
  if (supported) window.IntersectionObserver = Observer;
  vm.runInNewContext(fs.readFileSync('js/tech-logos.js', 'utf8'), {
    document: { querySelectorAll: () => [cluster], body: { appendChild() {} },
      createElement: () => ({ setAttribute() {}, appendChild(child) { child.parentNode = this; } }) }, window, IntersectionObserver: Observer
  });
  return { classes, preference, logo, logoClasses, cluster, handlers, window,
    send(name, values = {}) { let prevented = false; logo.handlers[name]({ button: 0, isPrimary: true,
      pointerId: 1, clientX: 30, clientY: 30, preventDefault() { prevented = true; }, ...values }); return prevented; },
    enter(value) { intersect([{ target: cluster, isIntersecting: value }]); } };
}

test('logos introduce on entry, pause offscreen, and remain revealed on later visits', () => {
  const app = setup();
  assert.ok(app.classes.has('is-enhanced'));
  assert.equal(app.classes.has('is-in-view'), false);
  app.enter(true);
  assert.ok(app.classes.has('is-in-view'));
  assert.ok(app.classes.has('is-on-screen'));
  app.enter(false);
  assert.ok(app.classes.has('is-in-view'));
  assert.equal(app.classes.has('is-on-screen'), false);
  app.enter(true);
  assert.ok(app.classes.has('is-on-screen'));
  assert.equal(app.classes.has('reveal'), false, 'independent of the assemble animation');
});

test('unsupported observers leave logos visible without enhancement', () => {
  const app = setup({ supported: false });
  assert.equal(app.classes.has('is-enhanced'), false);
});

test('reduced motion reveals logos immediately, including preference changes', () => {
  assert.ok(setup({ reduced: true }).classes.has('is-in-view'));
  const app = setup();
  app.preference.matches = true;
  app.preference.change();
  assert.ok(app.classes.has('is-in-view'));
});

test('pointer dragging leaves the constellation, stays in the viewport, and releases capture', () => {
  const app = setup();
  app.send('pointerdown');
  assert.ok(app.logoClasses.has('is-dragging'));
  assert.equal(app.logo.capture, 1);
  assert.equal(app.logo.parentNode.className, 'tech-logo-layer');
  assert.ok(app.classes.has('has-dragged'));
  app.send('pointermove', { clientX: 10000, clientY: 10000 });
  const left = parseFloat(app.logo.values['--page-x']), top = parseFloat(app.logo.values['--page-y']);
  assert.equal(left + parseFloat(app.logo.values['--drag-x']) + app.logo.offsetWidth, app.window.innerWidth - 24);
  assert.equal(top + parseFloat(app.logo.values['--drag-y']) + app.logo.offsetHeight, app.window.innerHeight - 24);
  assert.ok(left + parseFloat(app.logo.values['--drag-x']) > app.cluster.clientWidth);
  app.send('pointermove', { clientX: -10000, clientY: -10000 });
  assert.equal(left + parseFloat(app.logo.values['--drag-x']), 24);
  assert.equal(top + parseFloat(app.logo.values['--drag-y']), 24);
  app.send('pointerup');
  assert.equal(app.logoClasses.has('is-dragging'), false);
  assert.equal(app.logo.capture, null);
});

test('drag cancellation, blur and resizing cannot leave a stuck logo', () => {
  const app = setup();
  for (const end of ['pointercancel', 'lostpointercapture']) {
    app.send('pointerdown'); app.send(end);
    assert.equal(app.logoClasses.has('is-dragging'), false);
  }
  app.send('pointerdown'); app.send('pointermove', { clientX: 500 });
  app.window.innerWidth = 180; app.handlers.resize();
  assert.ok(parseFloat(app.logo.values['--page-x']) + parseFloat(app.logo.values['--drag-x']) + app.logo.offsetWidth <= 156);
  assert.equal(app.logoClasses.has('is-dragging'), false);
  app.send('pointerdown'); app.handlers.blur();
  assert.equal(app.logoClasses.has('is-dragging'), false);
});

test('keyboard movement and reset work with reduced motion and without observers', () => {
  const app = setup({ reduced: true, supported: false });
  assert.equal(app.logo.tabIndex, 0);
  assert.ok(app.send('keydown', { key: 'ArrowRight' }));
  assert.equal(app.logo.values['--drag-x'], '8px');
  app.send('keydown', { key: 'Home' });
  assert.equal(app.logo.values['--drag-x'], '0px');
  assert.equal(app.logo.values['--drag-y'], '0px');
  assert.equal(app.logo.parentNode, app.cluster);
  assert.equal(app.classes.has('has-dragged'), false);
  app.send('pointerdown', { button: 2 });
  assert.equal(app.logoClasses.has('is-dragging'), false);
});
