'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('stationary logos expose names to keyboard users without installing movement handlers', () => {
  const parent = {};
  const logos = ['Claude', 'AutoCAD', 'Java'].map(name => ({
    parentNode: parent, attrs: {}, handlers: [], querySelector: () => ({ alt: name }),
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(name) { this.handlers.push(name); }
  }));
  vm.runInNewContext(fs.readFileSync('js/tech-logos.js', 'utf8'), { document: { querySelectorAll: () => logos } });
  logos.forEach((logo, i) => {
    assert.equal(logo.tabIndex, 0);
    assert.equal(logo.attrs['aria-label'], ['Claude', 'AutoCAD', 'Java'][i]);
    assert.deepEqual(logo.handlers, []);
    assert.equal(logo.parentNode, parent);
  });
});
test('skills assets and active interaction code contain no dragging or reset interface', () => {
  const html = fs.readFileSync('index.html', 'utf8').match(/<section id="skills"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(html, /drag me|tech-drag-hint|reset.position|shuffle/i);
  assert.ok([...html.matchAll(/<img\b[^>]+>/g)].every(([image]) => image.includes('draggable="false"')));
  const code = ['js/tech-logos.js', 'css/tech-logos.css', 'js/personality.js', 'css/personality.css'].map(path => fs.readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(code, /setPointerCapture|tech-logo-layer|--drag-|cursor:\s*grabb?ing|cursor:\s*grab\b|dragstart|pointerdown|pointercancel|Home resets/);
});
