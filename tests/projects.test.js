'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(count = 1, reduced = false, supported = true) {
  const el = () => ({ attrs: {}, handlers: {}, hidden: false, children: [], isConnected: true,
    classList: { add() {}, remove() {} }, style: { setProperty() {} },
    setAttribute(k,v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); },
    addEventListener(k,v) { this.handlers[k] = v; }, focus() { focused = this; }
  });
  let focused, timer;
  const close = el(), content = el(), dialog = el(), trigger = el(), countEl = el(), arrows = el(), thumbnails = el(), prev = el(), next = el();
  const slides = Array.from({length:count}, (_,i) => {
    const slide = el(), image = { cloneNode: () => ({}) }, caption = { textContent: 'Image ' + (i+1) };
    slide.querySelector = s => s === 'img' ? image : caption; return slide;
  });
  content.replaceChildren = () => { thumbnails.children = []; };
  content.querySelectorAll = () => slides;
  content.querySelector = s => ({ '.work-gallery__thumbnails':thumbnails, '.work-gallery__arrows':arrows, '.work-gallery__count':countEl, '[data-gallery-prev]':prev, '[data-gallery-next]':next })[s];
  dialog.querySelector = s => s === '.work-story__content' ? content : close;
  dialog.showModal = supported ? () => { dialog.open = true; } : undefined;
  dialog.close = () => { dialog.open = false; dialog.handlers.close(); };
  trigger.dataset = {projectStory:'test-story'};
  const template = { content: { cloneNode: () => ({}) } };
  const document = { body:el(), getElementById:id => id === 'work-story' ? dialog : template, querySelectorAll:() => [trigger], createElement:el };
  const window = { matchMedia:() => ({ matches:reduced }), setTimeout:fn => { timer=fn; return 1; }, clearTimeout() {} };
  vm.runInNewContext(fs.readFileSync('js/projects.js','utf8'), { document,window });
  const click = () => trigger.handlers.click({ preventDefault() {}, ctrlKey:false });
  return { dialog,trigger,slides,thumbnails,arrows,countEl,next,prev,close,click, finish:() => timer(), focused:() => focused,
    key:key => { let prevented=false; dialog.handlers.keydown({key,preventDefault(){prevented=true;}}); return prevented; } };
}
test('single-image project opens with one honest thumbnail and no fake gallery arrows', () => {
  const app=setup(); app.click();
  assert.equal(app.dialog.open,true); assert.equal(app.arrows.hidden,true);
  assert.equal(app.thumbnails.children.length,1); assert.match(app.countEl.textContent,/1 of 1/);
  assert.equal(app.key('ArrowRight'),false);
  app.close.handlers.click(); app.finish();
  assert.equal(app.dialog.open,false); assert.equal(app.focused(),app.trigger);
});
test('multiple real slides support arrows, thumbnails, Home/End, and wrapping', () => {
  const app=setup(3);app.click(); assert.equal(app.arrows.hidden,false);
  app.next.handlers.click();assert.equal(app.slides[1].hidden,false);
  app.prev.handlers.click();assert.equal(app.slides[0].hidden,false);
  app.key('ArrowLeft');assert.equal(app.slides[2].hidden,false);
  app.key('Home');assert.equal(app.slides[0].hidden,false);
  app.key('End');assert.equal(app.slides[2].hidden,false);
  app.thumbnails.children[1].handlers.click();assert.equal(app.slides[1].hidden,false);
  assert.equal(app.thumbnails.children[1].attrs['aria-pressed'],'true');
});
test('Escape uses the closing transition and returns focus; reduced motion closes immediately', () => {
  for(const reduced of [false,true]) {
    const app=setup(1,reduced);app.click();let prevented=false;
    app.dialog.handlers.cancel({preventDefault(){prevented=true;}});assert.equal(prevented,true);
    if(!reduced) { assert.equal(app.dialog.open,true);app.finish(); }
    assert.equal(app.dialog.open,false);assert.equal(app.focused(),app.trigger);
  }
});
test('unsupported dialog leaves direct image and project-page links untouched', () => {
  const app=setup(1,false,false);assert.equal(app.trigger.handlers.click,undefined);
});
