'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup({reduced=false,library=true}={}){
 function events(o={}){o.handlers={};o.addEventListener=(n,f)=>(o.handlers[n]||=[]).push(f);o.emit=(n,e={})=>(o.handlers[n]||[]).forEach(f=>f(e));return o;}
 const media=events({matches:reduced}),instances=[],moves=[],historyCalls=[],native=[];
 const target={setAttribute(){},focus(o){this.focusOptions=o;}};
 const window=events({matchMedia:()=>media,scrollTo:o=>native.push(o)});
 const document=events({hidden:false,getElementById:id=>id==='about'?target:null});
 class Lenis{constructor(options){this.options=options;instances.push(this);}destroy(){this.destroyed=true;}scrollTo(t,o){moves.push({target:t,options:o});}stop(){this.stopped=true;}start(){this.stopped=false;}}
 if(library)window.Lenis=Lenis;
 const location={hash:''};
 vm.runInNewContext(fs.readFileSync('js/scroll.js','utf8'),{window,document,location,history:{pushState(...a){historyCalls.push(a);location.hash=a[2];}}});
 function click(extra={}){const e={target:{closest:()=>({getAttribute:()=> '#about'})},button:0,preventDefault(){this.prevented=true;},...extra};document.emit('click',e);return e;}
 return {media,window,document,instances,moves,historyCalls,native,target,click};
}
test('one controller handles anchors with CSS-owned offsets, focus and history',()=>{
 const app=setup(),event=app.click();assert.ok(event.prevented);assert.equal(app.instances.length,1);
 assert.equal(app.moves[0].target,app.target);assert.equal(app.moves[0].options.offset,undefined,'Lenis already reads scroll-margin');
 assert.equal(app.target.focusOptions.preventScroll,true);assert.equal(app.historyCalls.length,1);
 app.click();assert.equal(app.historyCalls.length,1,'same hash does not duplicate history');
 assert.equal(app.click({ctrlKey:true}).prevented,undefined);
 assert.equal(app.instances[0].options.syncTouch,false);
 const nested={closest:()=>({})};assert.equal(app.instances[0].options.prevent(nested),true);
});
test('reduced motion and missing library preserve native anchors',()=>{
 for(const options of [{reduced:true},{library:false}]){const app=setup(options);assert.equal(app.instances.length,0);assert.equal(app.click().prevented,undefined);}
 const app=setup();app.media.matches=true;app.media.emit('change');assert.ok(app.instances[0].destroyed);
 assert.equal(app.click().prevented,undefined);
 app.media.matches=false;app.media.emit('change');assert.equal(app.instances.length,2);
});
test('keyboard, hidden tabs and bfcache lifecycle cancel momentum and clean up',()=>{
 const app=setup(),controller=app.instances[0];
 app.document.emit('keydown',{key:'PageDown'});assert.equal(controller.stopped,false);
 app.document.hidden=true;app.document.emit('visibilitychange');assert.equal(controller.stopped,true);
 app.document.hidden=false;app.document.emit('visibilitychange');assert.equal(controller.stopped,false);
 app.window.emit('pagehide');assert.ok(controller.destroyed);
 app.window.emit('pageshow',{persisted:true});assert.equal(app.instances.length,2);
});
