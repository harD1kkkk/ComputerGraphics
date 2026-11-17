(function(root) {
  'use strict';
  const identity = n => Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>Number(r===c)));
  const multiply = (a,b) => a.map(row=>b[0].map((_,c)=>row.reduce((sum,value,k)=>sum+value*b[k][c],0)));
  const vector = (m,p) => m.map(row=>row.reduce((sum,value,k)=>sum+value*p[k],0));
  const apply = (m,points) => points.map(p=>{
    const result=vector(m,[...p,1]),w=result.at(-1);
    if(!Number.isFinite(w)||Math.abs(w)<1e-12)throw new RangeError('Некоректна однорідна координата.');
    return result.slice(0,-1).map(value=>value/w);
  });
  const translate2 = (dx,dy) => [[1,0,dx],[0,1,dy],[0,0,1]];
  const scale2 = (sx,sy) => [[sx,0,0],[0,sy,0],[0,0,1]];
  const rotate2 = angle => {const t=angle*Math.PI/180,c=Math.cos(t),s=Math.sin(t);return [[c,-s,0],[s,c,0],[0,0,1]];};
  const reflect2 = axis => {
    if(axis==='x')return [[1,0,0],[0,-1,0],[0,0,1]];
    if(axis==='y')return [[-1,0,0],[0,1,0],[0,0,1]];
    if(axis==='diagonal')return [[0,1,0],[1,0,0],[0,0,1]];
    throw new RangeError('Невідома вісь віддзеркалення.');
  };
  const shear2 = (kx,ky) => [[1,kx,0],[ky,1,0],[0,0,1]];
  const around2 = (m,x,y) => multiply(translate2(x,y),multiply(m,translate2(-x,-y)));
  const centroid = points => points[0].map((_,i)=>points.reduce((sum,p)=>sum+p[i],0)/points.length);
  const translate3 = (dx,dy,dz) => [[1,0,0,dx],[0,1,0,dy],[0,0,1,dz],[0,0,0,1]];
  const scale3 = (sx,sy,sz) => [[sx,0,0,0],[0,sy,0,0],[0,0,sz,0],[0,0,0,1]];
  const rotate3 = (axis,angle) => {
    const t=angle*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
    if(axis==='x')return [[1,0,0,0],[0,c,-s,0],[0,s,c,0],[0,0,0,1]];
    if(axis==='y')return [[c,0,s,0],[0,1,0,0],[-s,0,c,0],[0,0,0,1]];
    if(axis==='z')return [[c,-s,0,0],[s,c,0,0],[0,0,1,0],[0,0,0,1]];
    throw new RangeError('Невідома вісь обертання.');
  };
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalize=a=>{const length=Math.hypot(...a);if(length<1e-12)throw new RangeError('Нульовий вектор.');return a.map(v=>v/length);};
  const api={identity,multiply,vector,apply,translate2,scale2,rotate2,reflect2,shear2,around2,centroid,translate3,scale3,rotate3,dot,subtract,cross,normalize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Matrix=api;
})(typeof window!=='undefined'?window:globalThis);
