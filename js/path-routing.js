/* Conservative cubic collision checks and a guaranteed exterior-gutter fallback. */
(function (root, factory) {
  const routing = factory();
  if (typeof module === 'object' && module.exports) module.exports = routing;
  else root.PortfolioPathRouting = routing;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function segments(points) {
    return points.slice(1).map((b, i) => {
      const a = points[i], half = (b.y - a.y) / 2;
      return [a, {x:a.x,y:a.y+half}, {x:b.x,y:b.y-half}, b];
    });
  }
  function intersects(curve, zone, depth) {
    const xs=curve.map(p=>p.x), ys=curve.map(p=>p.y);
    if (Math.max(...xs)<=zone.x || Math.min(...xs)>=zone.right ||
        Math.max(...ys)<=zone.y || Math.min(...ys)>=zone.bottom) return false;
    // Subdivide the convex hull, rather than sampling which can miss thin text.
    if (depth===0) return true;
    const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    const a=mid(curve[0],curve[1]), b=mid(curve[1],curve[2]), c=mid(curve[2],curve[3]);
    const d=mid(a,b),e=mid(b,c),f=mid(d,e);
    return intersects([curve[0],a,d,f],zone,depth-1)||intersects([f,e,c,curve[3]],zone,depth-1);
  }
  function safe(points,zones,clearance) {
    return !segments(points).some(curve=>zones.some(z=>intersects(curve,
      {x:z.x-clearance,right:z.right+clearance,y:z.y-clearance,bottom:z.bottom+clearance},10)));
  }
  function route(points,zones,width,radius) {
    zones=zones.filter(z=>z && [z.x,z.right,z.y,z.bottom].every(Number.isFinite));
    const gap=8,edge=4;
    if(safe(points,zones,radius+gap))return {points,radius,fallback:false};
    const left=Math.max(0,Math.min(width,...zones.map(z=>z.x)));
    const right=Math.max(0,width-Math.max(0,...zones.map(z=>z.right)));
    const useLeft=left>=right, gutter=useLeft?left:right;
    // Fit the whole aura, plus clearance, rather than putting a full-size orb
    // on a lane that is only wide enough for its center.
    const fitted=Math.max(0,Math.min(radius,(gutter-gap-edge-2)/2));
    const low=edge+fitted, high=gutter-gap-fitted;
    const amplitude=Math.max(0,Math.min(6,(high-low)/2));
    const center=(low+high)/2;
    const start=points[0].y,end=points[points.length-1].y;
    const count=Math.max(2,Math.ceil((end-start)/600));
    const exterior=Array.from({length:count+1},(_,i)=>{
      const lane=center+Math.sin(i*Math.PI/2)*amplitude;
      return {x:useLeft?lane:width-lane,y:start+(end-start)*i/count};
    });
    return {points:exterior,radius:fitted,fallback:true};
  }
  return {route,safe,segments};
}));
