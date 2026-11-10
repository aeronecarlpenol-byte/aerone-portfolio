'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {route,safe}=require('../js/path-routing');
test('a route through Education is rejected even when the preceding crossing was clear',()=>{
 const zones=[{x:80,right:1200,y:1500,bottom:2400}];
 const original=[{x:40,y:100},{x:550,y:1000},{x:550,y:3000}];
 assert.equal(safe(original,zones,30),false);
 const result=route(original,zones,1280,22);
 assert.equal(result.fallback,true);assert.ok(safe(result.points,zones,result.radius+8));
});
test('routes keep the aura clear at responsive gutters and after expanding content',()=>{
 for(const width of [320,375,390,768,900,901,1280,1440,1920,2560]){
  const gutter=width<1000?48:64;
  const zones=[{x:gutter,right:width-24,y:200,bottom:1000},{x:gutter,right:width-24,y:1100,bottom:3500}];
  const result=route([{x:width/2,y:80},{x:width/2,y:4000}],zones,width,width<=900?15:22);
  assert.ok(result.radius>0);assert.ok(safe(result.points,zones,result.radius+8));
  zones[0].bottom=1500;
  assert.ok(safe(result.points,zones,result.radius+8));
  result.points.forEach(p=>assert.ok(p.x-result.radius>=0&&p.x+result.radius<=width));
 }
});
test('safe original curves are retained; thin obstacles between sample points are caught',()=>{
 const p=[{x:20,y:0},{x:20,y:1000}],z=[{x:100,right:500,y:200,bottom:800}];
 assert.equal(route(p,z,600,15).fallback,false);
 assert.equal(safe([{x:300,y:0},{x:300,y:1000}],[{x:299,right:301,y:501.001,bottom:501.002}],0),false);
});
