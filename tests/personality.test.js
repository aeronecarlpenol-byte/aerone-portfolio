'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup({reduced=false,supported=true}={}) {
  const animations=[],observers=[];
  function events(o={}) {o.handlers={};o.addEventListener=(n,fn)=>{o.handlers[n]=fn;};return o;}
  const badges=Array.from({length:8},()=>({animate(frames,options){const a={frames,options,cancelled:false,cancel(){this.cancelled=true;if(this.oncancel)this.oncancel();}};animations.push(a);return a;}}));
  const group={querySelectorAll:()=>badges};
  const media=events({matches:reduced});
  const window=events({matchMedia:()=>media});
  const document=events({hidden:false,querySelectorAll:()=>[group]});
  class Observer {constructor(fn){this.fn=fn;this.targets=new Set();observers.push(this);} observe(t){this.targets.add(t);} unobserve(t){this.targets.delete(t);} disconnect(){this.targets.clear();}}
  if(supported)window.IntersectionObserver=Observer;
  vm.runInNewContext(fs.readFileSync('js/personality.js','utf8'),{document,window,IntersectionObserver:Observer,Set,Math});
  return {animations,media,document,window,arrive(){observers.forEach(o=>{if(o.targets.has(group))o.fn([{target:group,isIntersecting:true}]);});}};
}
test('skills enter once with short bounded staggers and no delayed labels',()=>{
  const app=setup();app.arrive();assert.equal(app.animations.length,8);
  assert.ok(app.animations.every(a=>a.options.duration===420&&a.options.delay<=140));
  app.arrive();assert.equal(app.animations.length,8,'returning cannot replay badges');
  const source=fs.readFileSync('js/personality.js','utf8');
  assert.doesNotMatch(source,/setProperty\('opacity',\s*'0'\)|is-awaiting/);
});
test('reduced motion and unavailable observers skip motion completely',()=>{
  for(const options of [{reduced:true},{supported:false}]) {const app=setup(options);app.arrive();assert.equal(app.animations.length,0);}
});
test('hidden tabs, reduced motion and page exit cancel active skill animations',()=>{
  for(const kind of ['hidden','reduced','exit']) {
    const app=setup();app.arrive();
    if(kind==='hidden'){app.document.hidden=true;app.document.handlers.visibilitychange();}
    if(kind==='reduced'){app.media.matches=true;app.media.handlers.change();}
    if(kind==='exit')app.window.handlers.pagehide();
    assert.ok(app.animations.every(a=>a.cancelled));
  }
});
