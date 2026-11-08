'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(researchPage=false){
  const frames=[], handlers={};
  function node(href){const classes=new Set();return {attrs:href?{href}:{},events:{},style:{},offsetWidth:70,offsetHeight:44,offsetLeft:0,offsetTop:0,
    classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);},contains:k=>classes.has(k),remove:k=>classes.delete(k)},
    setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]??null;},removeAttribute(k){delete this.attrs[k];},
    addEventListener(k,fn){this.events[k]=fn;},focus(){this.focused=true;}};}
  const win={scrollY:0,innerHeight:800,innerWidth:1440,addEventListener(k,fn){handlers[k]=fn;}};
  const ids=['hero','about','exploring','research','experience','skills','github','contact'];
  const sections=Object.fromEntries(ids.map((id,i)=>[id,{id,offsetTop:i*1000+96,getBoundingClientRect:()=>({top:i*1000+96-win.scrollY}),setAttribute(){},focus(){this.focused=true;}}]));
  const links=ids.map((id,i)=>{const href=id==='research'?'/research':(researchPage?'/':'')+'#'+id;const link=node(href);link.offsetLeft=i*70;if(researchPage&&id==='research'){link.classList.toggle('active',true);link.setAttribute('aria-current','page');}return link;});
  let indicator;
  const track={prepend(el){indicator=el;},querySelector(s){return s==='.nav-indicator'?indicator:links.find(l=>l.classList.contains('active'));}};
  const nav={getBoundingClientRect:()=>({bottom:76}),contains:()=>true,addEventListener(){}};
  const doc={body:{},documentElement:{scrollHeight:8000},getElementById(id){return id==='main-nav'?nav:researchPage?null:sections[id];},
    querySelectorAll(s){return s.includes('.nav__drawer-link')?links:[track];},createElement:()=>node(),addEventListener(){}};
  vm.runInNewContext(fs.readFileSync('js/nav.js','utf8'),{document:doc,window:win,getComputedStyle:()=>({getPropertyValue:()=> '96px'}),requestAnimationFrame:fn=>{frames.push(fn);return frames.length;}});
  const flush=()=>frames.splice(0).forEach(fn=>fn());flush();
  return {links,sections,indicator,win,scroll(y){win.scrollY=y;handlers.scroll();flush();},active(){return links.find(l=>l.classList.contains('active'));}};
}
test('scroll spy tracks current sections in both directions, including Research preview',()=>{
  const app=setup();assert.equal(app.active().attrs.href,'#hero');
  app.scroll(2100);assert.equal(app.active().attrs.href,'#exploring');
  app.scroll(3100);assert.equal(app.active().attrs.href,'/research');
  assert.equal(app.active().attrs['aria-current'],'location');
  assert.equal(app.indicator.style.transform,'translate(210px, 0px)');
  app.scroll(1100);assert.equal(app.active().attrs.href,'#about');
});
test('page bottom always selects Contact even before its heading crosses the header',()=>{
  const app=setup();app.scroll(7200);assert.equal(app.active().attrs.href,'#contact');
  assert.equal(app.indicator.hidden,false);
});
test('anchor click moves focus without a second scroll and keeps native destination',()=>{
  const app=setup(),link=app.links[2];link.events.click();
  assert.equal(link.attrs.href,'#exploring');assert.equal(app.sections.exploring.focused,true);
  assert.equal(app.active(),link);
});
test('Research route retains its page indicator and existing homepage links',()=>{
  const app=setup(true);assert.equal(app.active().attrs.href,'/research');
  assert.equal(app.active().attrs['aria-current'],'page');
  assert.equal(app.links[0].attrs.href,'/#hero');
});
