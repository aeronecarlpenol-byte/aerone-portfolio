'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup(reduced=false, supported=true) {
  const items = Array.from({length:8},()=>({style:{setProperty(k,v){this[k]=v;}},classList:{add(c){this[c]=true;}}}));
  const section={classList:{add(c){this[c]=true;}},querySelectorAll:()=>items};
  let callback;const observed=new Set();
  const window={matchMedia:()=>({matches:reduced})};if(supported) window.IntersectionObserver=true;
  vm.runInNewContext(fs.readFileSync('js/contact-motion.js','utf8'), {document:{getElementById:()=>section},window,IntersectionObserver:class {constructor(fn){callback=fn;}observe(e){observed.add(e);}unobserve(e){observed.delete(e);}}});
  return {section,items,observed,reveal:()=>callback(items.map(target=>({target,isIntersecting:true})))};
}
test('contact entrance observes once with bounded stagger and releases visible content',()=>{
  const app=setup();assert.equal(app.observed.size,8);assert.equal(app.items[7].style['--contact-delay'],'325ms');
  app.reveal();assert.equal(app.observed.size,0);assert.ok(app.items.every(e=>e.classList['is-visible']));
});
test('reduced motion and missing observers leave contact content visible by default',()=>{
  for(const args of [[true,true],[false,false]]){const app=setup(...args);assert.equal(app.section.classList['contact-motion-ready'],undefined);assert.equal(app.observed.size,0);}
});

