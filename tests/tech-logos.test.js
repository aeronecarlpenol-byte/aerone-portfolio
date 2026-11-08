'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ reduced = false, supported = true } = {}) {
  const classes = new Set();
  const cluster = { classList: {
    add: name => classes.add(name),
    toggle(name, value) { if (value) classes.add(name); else classes.delete(name); }
  } };
  const preference = { matches: reduced, addEventListener(name, fn) { this.change = fn; } };
  let intersect;
  class Observer {
    constructor(callback) { intersect = callback; }
    observe(target) { assert.equal(target, cluster); }
  }
  const window = { matchMedia: () => preference };
  if (supported) window.IntersectionObserver = Observer;
  vm.runInNewContext(fs.readFileSync('js/tech-logos.js', 'utf8'), {
    document: { querySelectorAll: () => [cluster] }, window, IntersectionObserver: Observer
  });
  return { classes, preference, enter(value) { intersect([{ target: cluster, isIntersecting: value }]); } };
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
