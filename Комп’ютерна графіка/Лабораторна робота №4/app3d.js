'use strict';
const states=Scene3D.stages(),palette=['#4d9dff','#46d78a','#ffce54','#ff7777'];
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const comparison=document.getElementById('comparison'),compareContext=comparison.getContext('2d',{willReadFrequently:true});
const status=document.getElementById('status');
const element=id=>document.getElementById(id);
const format=n=>(Math.abs(n)<1e-9?0:n).toFixed(4).replace('.',',');
function label(c,text,x,y,color='#dbe5f1',size=15,align='left'){c.fillStyle=color;c.font=`${size}px Arial, sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(text,x,y);}
function paint(c,width,height,projection,selected,mini=false){
  const yaw=Number(element('yaw').value),elevation=Number(element('elevation').value);
  const cam=Scene3D.camera(yaw,elevation,180,mini?[46,36,12]:[35,25,12]);
  const scale=4.5*width/880;
  const project=p=>Scene3D.project(p,cam,projection,width,height,scale);
  const lastIndex=selected==='all'?3:Number(selected),points=states[lastIndex].points;
  c.fillStyle='#101820';c.fillRect(0,0,width,height);
  const path=polygon=>{
    const projected=polygon.map(project);if(projected.some(p=>!p))return false;
    c.beginPath();projected.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();return true;
  };
  const segment=(a,b,color,lineWidth=1)=>{
    const p=project(a),q=project(b);if(!p||!q)return;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.strokeStyle=color;c.lineWidth=lineWidth;c.stroke();
  };
  c.save();c.beginPath();c.rect(12,45,width-24,height-(mini?85:140));c.clip();
  if(path([[-30,-25,0],[115,-25,0],[115,110,0],[-30,110,0]])){c.fillStyle='#1a2937';c.fill();}
  for(let x=-20;x<=100;x+=20)segment([x,-20,0],[x,100,0],'#2b3e51');
  for(let y=-20;y<=100;y+=20)segment([-20,y,0],[100,y,0],'#2b3e51');
  if(element('shadow').checked&&path(Scene3D.hull(points.map(Scene3D.shadow)))){c.fillStyle='rgba(0,0,0,0.6)';c.fill();}
  const axes=[[[0,0,0],[95,0,0],'#ed8484','X'],[[0,0,0],[0,90,0],'#61d39b','Y'],[[0,0,0],[0,0,55],'#78b3ff','Z']];
  for(const [a,b,color,name] of axes){segment(a,b,color,1.5);const p=project(b);if(p)label(c,name,p[0]+6,p[1]-6,color,mini?12:15);}
  if(selected==='all'){
    states.slice(0,3).forEach((state,index)=>{for(const [a,b] of Scene3D.edges)segment(state.points[a],state.points[b],palette[index],mini?1:1.7);});
  }
  let visibleVertices=new Set();
  if(element('wireframe').checked){
    for(const [a,b] of Scene3D.edges)segment(points[a],points[b],palette[lastIndex],2);
    visibleVertices=new Set([0,1,2,3]);
  }else{
    const surfaces=Scene3D.faces.map(indices=>{
      const polygon=indices.map(i=>points[i]),normal=Scene3D.normal(polygon),center=Matrix.centroid(polygon);
      const towardsEye=projection==='perspective'?Matrix.subtract(cam.eye,center):cam.forward.map(v=>-v);
      return {indices,polygon,normal,front:Matrix.dot(normal,towardsEye)>0,depth:Scene3D.view(center,cam)[2]};
    }).filter(face=>face.front).sort((a,b)=>b.depth-a.depth);
    const source=[1,3,5].map(i=>parseInt(palette[lastIndex].slice(i,i+2),16));
    for(const face of surfaces){
      if(!path(face.polygon))continue;
      const power=Scene3D.intensity(face.normal,element('lighting').checked);
      c.fillStyle=`rgb(${source.map(v=>Math.round(v*power)).join(',')})`;c.fill();c.strokeStyle=palette[lastIndex];c.lineWidth=mini?1.2:2;c.stroke();
      face.indices.forEach(i=>visibleVertices.add(i));
    }
  }
  if(element('labels').checked&&!mini){
    for(const i of visibleVertices){const p=project(points[i]);if(p){c.fillStyle='#fff';c.fillRect(p[0]-2,p[1]-2,4,4);label(c,['A','B','C','D'][i],p[0]+8,p[1]-11,'#fff',16);}}
  }
  c.restore();
  label(c,projection==='perspective'?'Перспективна проєкція':'Ортографічна проєкція',20,24,'#f4f7fb',mini?18:20);
  if(mini){label(c,'Фінальний стан',20,height-24,'#a9b8cb',14);}
  else{
    label(c,'S → Rz → T',width-24,24,'#a9b8cb',15,'right');
    states.forEach((state,i)=>{const x=28+(i%2)*415,y=603+Math.floor(i/2)*30;c.fillStyle=palette[i];c.fillRect(x,y-6,13,13);label(c,`${i}. ${state.name}`,x+23,y,'#dbe5f1',16);});
    label(c,'Освітлення граней · напрямлене світло · тінь на Z = 0',28,662,'#a9b8cb',14);
  }
}
function update(){
  const yaw=element('yaw').value,elevation=element('elevation').value;
  element('yaw-value').textContent=yaw+'°';element('elevation-value').textContent=elevation+'°';
  paint(ctx,880,680,element('projection').value,element('stage').value);
  compareContext.clearRect(0,0,880,440);
  compareContext.save();paint(compareContext,440,440,'orthographic','3',true);compareContext.restore();
  compareContext.save();compareContext.translate(440,0);paint(compareContext,440,440,'perspective','3',true);compareContext.restore();
  compareContext.fillStyle='#354a60';compareContext.fillRect(439,12,2,416);
  status.textContent='Піраміда: 4 вершини, 6 ребер, 4 грані. Перетворення виконано матрицями 4 × 4.';
}
function save(source,filename,button){button.disabled=true;source.toBlob(blob=>{button.disabled=false;if(!blob){status.textContent='Не вдалося створити PNG.';return;}const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');}
function fillTables(){
  const tbody=element('coordinates');
  states.forEach((s,i)=>s.points.forEach((p,j)=>{const tr=document.createElement('tr');for(const value of [`${i}. ${s.name}`,['A','B','C','D'][j],...p.map(format)]){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);}tbody.appendChild(tr);}));
  for(const row of states.at(-1).matrix){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=format(value);tr.appendChild(td);}element('matrix').appendChild(tr);}
}
if(!ctx||!compareContext){status.textContent='Не вдалося створити графічний контекст.';}else{
  for(const id of ['projection','stage','lighting','shadow','wireframe','labels'])element(id).addEventListener('change',update);
  for(const id of ['yaw','elevation'])element(id).addEventListener('input',update);
  element('restore').addEventListener('click',()=>{element('yaw').value=25;element('elevation').value=28;element('projection').value='perspective';element('stage').value='all';element('lighting').checked=true;element('shadow').checked=true;element('wireframe').checked=false;element('labels').checked=true;update();});
  let drag=null;canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:Number(element('yaw').value),elevation:Number(element('elevation').value)};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;element('yaw').value=Math.max(-180,Math.min(180,drag.yaw+(e.clientX-drag.x)*0.4));element('elevation').value=Math.max(8,Math.min(75,drag.elevation-(e.clientY-drag.y)*0.3));update();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null;});
  for(const [id,source,name] of [['save',canvas,'Lab4_Variant1_3D.png'],['save-comparison',comparison,'Lab4_Projections.png']]){element(id).disabled=false;element(id).addEventListener('click',()=>save(source,name,element(id)));}
  fillTables();update();
}
