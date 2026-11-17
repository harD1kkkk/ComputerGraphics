(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./matrix.js'):root.Matrix;
  const vertices=[[0,0,0],[40,0,0],[20,30,0],[20,10,30]];
  const faces=[[0,2,1],[0,1,3],[1,2,3],[2,0,3]];
  const edges=[[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]];
  const light=M.normalize([-0.7,-0.8,1]);
  function stages(){
    const ops=[M.scale3(1.2,1.2,1.2),M.rotate3('z',30),M.translate3(30,15,0)];
    const names=['Початкова','Масштабування','Обертання','Перенесення'];
    let matrix=M.identity(4);const result=[{name:names[0],matrix,points:vertices.map(p=>p.slice())}];
    ops.forEach((op,i)=>{matrix=M.multiply(op,matrix);result.push({name:names[i+1],matrix,points:M.apply(matrix,vertices)});});
    return result;
  }
  function camera(yaw=25,elevation=28,distance=180,target=[35,25,12]){
    const a=yaw*Math.PI/180,e=elevation*Math.PI/180;
    const eye=target.map((v,i)=>v+distance*[Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),Math.sin(e)][i]);
    const forward=M.normalize(M.subtract(target,eye)),right=M.normalize(M.cross(forward,[0,0,1])),up=M.cross(right,forward);
    return {eye,forward,right,up,distance,target};
  }
  function view(point,cam){const d=M.subtract(point,cam.eye);return [M.dot(d,cam.right),M.dot(d,cam.up),M.dot(d,cam.forward)];}
  function project(point,cam,projection,width,height,scale){
    const [x,y,z]=view(point,cam);if(z<=1)return null;
    const factor=projection==='perspective'?scale*cam.distance/z:scale;
    return [width/2+factor*x,height*0.48-factor*y,z];
  }
  function normal(points){return M.normalize(M.cross(M.subtract(points[1],points[0]),M.subtract(points[2],points[0])));}
  function intensity(n,enabled=true){return enabled?0.25+0.75*Math.max(0,M.dot(n,light)):1;}
  function shadow(point){return [point[0]-point[2]*light[0]/light[2],point[1]-point[2]*light[1]/light[2],0];}
  function hull(points){
    const sorted=[...new Map(points.map(p=>[p.slice(0,2).join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const turn=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lower=[],upper=[];
    for(const p of sorted){while(lower.length>=2&&turn(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
    for(const p of sorted.slice().reverse()){while(upper.length>=2&&turn(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
    return lower.slice(0,-1).concat(upper.slice(0,-1));
  }
  const api={vertices,faces,edges,light,stages,camera,view,project,normal,intensity,shadow,hull};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Scene3D=api;
})(typeof window!=='undefined'?window:globalThis);
