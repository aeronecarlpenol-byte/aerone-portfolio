'use strict';
const { test }=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function setup({reducedMotion=false,supported=true,markerPresent=true}={}) {
  const frames=new Map();let next=0;let now=0;
  function element(rect={left:0,top:0,width:38,height:38,bottom:38}) {
    const classes=new Set(),handlers={},values={},listeners={};
    return {rect,classes,handlers,values,animations:[],classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},
      style:{setProperty:(k,v)=>values[k]=v,removeProperty:k=>delete values[k]},
      addEventListener(k,fn){(listeners[k]||=[]).push(fn);handlers[k]=e=>[...listeners[k]].forEach(fn=>fn(e));},
      removeEventListener(k,fn){listeners[k]=(listeners[k]||[]).filter(f=>f!==fn);if(!listeners[k].length)delete handlers[k];},
      getBoundingClientRect(){return this.rect;},querySelector(){return null;},
      animate(keyframes,options){const a={keyframes,options,cancelled:false,cancel(){this.cancelled=true;}};this.animations.push(a);return a;}};
  }
  const hero=element({left:0,top:0,width:1200,height:900}),stickers=[element(),element(),element()];
  const section=element({top:600,bottom:2400}),workbench=element({left:100,top:900,bottom:2200,width:1000,height:1300});
  const marker=element({left:20,top:500,width:24,height:24});
  const logos=[],badges=[],names=[],images=[];
  const stages=[3,2,2,4,3,2].map((count,g)=>{
    const stage=element();stage.parentElement=element();const group=[];
    for(let i=0;i<count;i++){
      const index=logos.length,rect={left:100+index*45,top:400+g*200,width:38,height:38};
      const logo=element(rect),badge=element(rect),name=element(),image={loading:'lazy',decode:()=>Promise.resolve()};
      logo.querySelector=s=>({'.tech-logo__float':badge,'.tech-logo__name':name,img:image})[s];
      logos.push(logo);badges.push(badge);names.push(name);images.push(image);group.push(logo);
    }
    stage.querySelectorAll=()=>group;return stage;
  });
  const reduced={matches:reducedMotion,addEventListener(k,fn){this.change=fn;}},fine={matches:true,addEventListener(){}};
  const document=element();document.hidden=false;
  document.querySelector=s=>({'#hero':hero,'#skills':section,'#skills .skills-workbench':workbench,'.field-path__position':markerPresent?marker:null})[s];
  document.querySelectorAll=s=>s.includes('skills-constellation')?stages:stickers;
  const window=element();window.innerHeight=800;window.innerWidth=1280;window.matchMedia=s=>s.includes('reduced')?reduced:fine;
  class Observer{observe(){}disconnect(){this.disconnected=true;}}
  if(supported)window.IntersectionObserver=Observer;
  vm.runInNewContext(fs.readFileSync('js/personality.js','utf8'),{document,window,IntersectionObserver:Observer,Math,
    requestAnimationFrame(fn){frames.set(++next,fn);return next;},cancelAnimationFrame(id){frames.delete(id);}});
  function step(time){now=time;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}
  function arrive(){workbench.rect={...workbench.rect,top:300,bottom:1600};if(window.handlers.scroll)window.handlers.scroll();step(0);}
  return {logos,badges,names,images,stages,marker,workbench,hero,stickers,reduced,window,document,frames,step,arrive};
}
test('reference choreography waits 550ms and releases all 16 logos globally at 32ms intervals',()=>{
  const app=setup();app.arrive();app.step(549);assert.equal(app.logos[0].animations.length,0);
  app.step(550);assert.equal(app.logos[0].animations.length,1);assert.equal(app.logos[1].animations.length,0);
  assert.equal(app.logos[0].animations[0].options.duration,600);assert.equal(app.logos[0].animations[0].options.easing,'linear');
  app.step(581);assert.equal(app.logos[1].animations.length,0);app.step(582);assert.equal(app.logos[1].animations.length,1);
  app.step(1030);assert.ok(app.logos.every(l=>l.animations.length===1));assert.ok(app.images.every(i=>i.loading==='eager'));
});
test('every delayed release samples the current emblem position rather than a stale origin',()=>{
  const app=setup();app.arrive();app.marker.rect.left=120;app.step(550);
  assert.match(app.logos[0].animations[0].keyframes[0].transform,/translate\(13px,93px\)/);
  app.marker.rect.left=220;app.marker.rect.top=600;app.step(582);
  assert.match(app.logos[1].animations[0].keyframes[0].transform,/translate\(68px,193px\)/);
});
test('reference hold, group and item return beats are exact, with a 650ms quartic settle',()=>{
  const app=setup();app.arrive();app.step(1030);app.step(1979);assert.equal(app.logos[0].animations.length,1);
  app.step(1980);assert.equal(app.logos[0].animations.length,2);assert.equal(app.logos[1].animations.length,1);
  const landing=app.logos[0].animations[1];assert.equal(landing.options.duration,650);
  assert.match(landing.keyframes.at(-1).transform,/translate\(0px,0px\) rotate\(0deg\)/);
  app.step(2000);assert.equal(app.logos[1].animations.length,2);
  app.step(2089);assert.equal(app.logos[3].animations.length,1);app.step(2090);assert.equal(app.logos[3].animations.length,2);
  app.step(3250);assert.ok(app.logos.every(l=>l.values.opacity===undefined));assert.equal(app.frames.size,0);
});
test('settling uses the reference 70ms squash, 500ms elastic recovery and delayed label fade',()=>{
  const app=setup();app.arrive();app.step(550);app.step(1150);
  const bounce=app.badges[0].animations[0];assert.equal(bounce.options.duration,570);
  assert.ok(bounce.keyframes.some(k=>/scale\(1\.1/.test(k.transform)));
  assert.equal(bounce.keyframes.at(-1).transform,'scale(1,1)');
  app.step(2579);assert.equal(app.names[0].animations.length,0);app.step(2580);
  assert.equal(app.names[0].animations[0].options.duration,350);app.step(2588);assert.equal(app.names[1].animations.length,1);
});
test('reduced motion, missing observers or marker reveal everything without movement',()=>{
  for(const options of [{reducedMotion:true},{supported:false},{markerPresent:false}]){
    const app=setup(options);app.arrive();app.step(1000);assert.ok(app.logos.every(l=>!l.animations.length&&l.values.opacity===undefined));
    assert.ok(app.stages.every(s=>!s.classes.has('is-awaiting')));
  }
});
test('scroll-away, resize, keyboard focus, hidden tabs and motion changes clean up all phases',()=>{
  for(const kind of ['scroll','resize','focus','hidden','reduced']){
    const app=setup();app.arrive();app.step(550);
    if(kind==='scroll'){app.workbench.rect.bottom=-1;app.window.handlers.scroll();app.step(600);}
    if(kind==='resize')app.window.handlers.resize();
    if(kind==='focus')app.stages[0].handlers.focusin();
    if(kind==='hidden'){app.document.hidden=true;app.document.handlers.visibilitychange();}
    if(kind==='reduced'){app.reduced.matches=true;app.reduced.change();}
    assert.ok(app.logos[0].animations[0].cancelled,kind);assert.ok(app.logos.every(l=>l.values.opacity===undefined),kind);
    assert.equal(app.frames.size,0,kind);
  }
});
test('hero parallax is still bounded and resets on pointer leave',()=>{
  const app=setup();app.step(0);app.hero.handlers.pointermove({clientX:10000,clientY:10000,pointerType:'mouse'});app.step(16);
  assert.ok(app.stickers.every(s=>Math.abs(parseFloat(s.values['--sticker-x']))<=4));app.hero.handlers.pointerleave();
  assert.ok(app.stickers.every(s=>s.values['--sticker-x']==='0px'));
});

