'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ reducedMotion = false, finePointer = true, supported = true, markerPresent = true, grouped = false } = {}) {
  const frames = new Map(); let next = 0;
  function element(rect) {
    const classes = new Set(), handlers = {}, values = {}, listeners = {};
    return { classes, handlers, values, rect, classList: { add: v => classes.add(v), remove: v => classes.delete(v) },
      style: { setProperty: (k, v) => { values[k] = v; } },
      addEventListener(k, fn) { (listeners[k] ||= []).push(fn); handlers[k] = event => [...listeners[k]].forEach(fn => fn(event)); },
      removeEventListener(k, fn) { listeners[k] = (listeners[k] || []).filter(listener => listener !== fn); if (!listeners[k].length) delete handlers[k]; },
      getBoundingClientRect() { return this.rect; },
      animate(keyframes, options) { this.keyframes = keyframes; this.options = options;
        this.animation = { cancelled: false, cancel() { this.cancelled = true; } }; return this.animation; }
    };
  }
  const hero = element({ left: 0, top: 0, width: 1200, height: 900 });
  const stickers = [element(), element(), element()];
  const stage = element({ top: 900, bottom: 1188 });
  const section = element({ top: 600, bottom: 1900 });
  const marker = element({ left: 20, top: 500, width: 24, height: 24 });
  const logos = Array.from({ length: 9 }, (_, i) => element({ left: 100 + i * 70, top: 400, width: 38, height: 38 }));
  stage.querySelectorAll = () => logos;
  const laterStage = element({ top: 1600, bottom: 1800 });
  const laterLogo = element({ left: 200, top: 500, width: 38, height: 38 });
  laterStage.querySelectorAll = () => [laterLogo];
  const stages = grouped ? [stage, laterStage] : [stage];
  const reduced = { matches: reducedMotion, addEventListener(name, fn) { this.change = fn; } };
  const fine = { matches: finePointer, addEventListener(name, fn) { this.change = fn; } };
  const document = element(); document.hidden = false;
  document.querySelector = selector => ({ '#hero': hero, '#skills': section, '#skills .skills-constellation': stage,
    '.field-path__position': markerPresent ? marker : null })[selector];
  document.querySelectorAll = selector => selector.includes('skills-constellation') ? stages : stickers;
  const window = element(); window.innerHeight = 800;
  window.matchMedia = query => query.includes('reduced') ? reduced : fine;
  class Observer { observe() {} disconnect() { this.disconnected = true; } }
  if (supported) window.IntersectionObserver = Observer;
  vm.runInNewContext(fs.readFileSync('js/personality.js', 'utf8'), { document, window, IntersectionObserver: Observer,
    requestAnimationFrame(fn) { frames.set(++next, fn); return next; }, cancelAnimationFrame(id) { frames.delete(id); } });
  function flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); }
  function arrive() { stage.rect = { top: 300, bottom: 588 }; section.rect = { top: 0, bottom: 1400 }; if (window.handlers.scroll) window.handlers.scroll(); flush(); }
  return { laterStage, laterLogo, hero, stickers, stage, logos, marker, document, window, reduced, fine, frames, flush, arrive };
}

test('each category launches once from the real emblem only when it reaches Skills', () => {
  const app = setup(); app.flush();
  assert.ok(app.stage.classes.has('is-awaiting'));
  assert.ok(app.logos.every(logo => !logo.animation));
  app.arrive();
  assert.equal(app.stage.classes.has('is-awaiting'), false);
  assert.ok(app.logos.every(logo => logo.animation));
  assert.match(app.logos[0].keyframes[0].transform, /translate\(-87px, 93px\)/);
  assert.equal(app.logos[8].options.delay, 806);
  assert.equal(app.window.handlers.scroll, undefined, 'emission stops listening after one launch');
});

test('reduced motion and missing observation support leave every tool visible without flight', () => {
  for (const options of [{ reducedMotion: true }, { supported: false }]) {
    const app = setup(options); app.flush();
    assert.equal(app.stage.classes.has('is-awaiting'), false);
    assert.ok(app.logos.every(logo => !logo.animation));
  }
  const app = setup({ markerPresent: false }); app.arrive();
  assert.equal(app.stage.classes.has('is-awaiting'), false);
  assert.ok(app.logos.every(logo => !logo.animation));
});

test('focusing, resizing and reduced-motion changes cancel flights without hiding tools', () => {
  const app = setup(); app.arrive();
  app.stage.handlers.focusin();
  assert.equal(app.logos[0].animation.cancelled, true);
  app.window.handlers.resize();
  assert.ok(app.logos.every(logo => logo.animation.cancelled));
  assert.equal(app.stage.classes.has('is-awaiting'), false);
  const other = setup(); other.arrive(); other.reduced.matches = true; other.reduced.change();
  assert.ok(other.logos.every(logo => logo.animation.cancelled));
});

test('hero parallax is bounded, resets, and never runs for touch or reduced motion', () => {
  const app = setup(); app.flush();
  app.hero.handlers.pointermove({ clientX: 10000, clientY: 10000, pointerType: 'mouse' }); app.flush();
  assert.ok(app.stickers.every(sticker => Math.abs(parseFloat(sticker.values['--sticker-x'])) <= 4));
  app.hero.handlers.pointerleave();
  assert.ok(app.stickers.every(sticker => sticker.values['--sticker-x'] === '0px'));
  for (const options of [{ finePointer: false }, { reducedMotion: true }]) {
    const other = setup(options); other.flush();
    other.hero.handlers.pointermove({ clientX: 400, clientY: 400, pointerType: 'touch' });
    assert.equal(other.frames.size, 0);
  }
});


test('category groups emit independently as they enter view, with a bounce before settling', () => {
  const app = setup({ grouped: true }); app.arrive();
  assert.ok(app.logos[0].animation);
  assert.equal(app.laterLogo.animation, undefined);
  assert.ok(app.laterStage.classes.has('is-awaiting'));
  assert.equal(app.logos[0].keyframes[4].transform, 'scale(1.08) rotate(2deg)');
  assert.equal(app.logos[0].options.delay, 550);
  assert.equal(app.logos[1].options.delay - app.logos[0].options.delay, 32);
  assert.equal(app.logos[0].options.duration, 1600);
  assert.equal(app.logos[0].keyframes[2].transform, app.logos[0].keyframes[3].transform, 'airborne pause retains position without a layout mutation');
  app.laterStage.rect = { top: 300, bottom: 500 };
  app.window.handlers.scroll(); app.flush();
  assert.ok(app.laterLogo.animation);
  assert.equal(app.laterLogo.options.delay, 660, 'later category has a 110ms beat');
  assert.equal(app.laterStage.classes.has('is-awaiting'), false);
  assert.equal(app.window.handlers.scroll, undefined);
});

