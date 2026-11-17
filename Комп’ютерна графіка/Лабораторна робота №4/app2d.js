'use strict';
const basePoints=[[0,0],[40,0],[20,30]];
const defaults={sx:1.2,sy:1.2,angle:30,dx:30,dy:15,kx:0.3,ky:0};
const palette=['#4d9dff','#46d78a','#ffce54','#ff7777','#c29cff','#56d8df','#ffab73','#d8df7b','#eaa8d6'];
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
const form=document.getElementById('settings'),status=document.getElementById('status');
const visible=document.getElementById('visible');
let history=[];
const number=id=>Number(document.getElementById(id).value);
const format=(value,digits=3)=>(Math.abs(value)<1e-9?0:value).toFixed(digits).replace('.',',');
const getPivot=()=>document.getElementById('pivot').value==='centroid'?Matrix.centroid(history.at(-1).points):[0,0];
function start(){history=[{name:'Початкова',symbol:'I',matrix:Matrix.identity(3),points:basePoints.map(p=>p.slice())}];}
function addState(matrix,name,symbol){
  if(history.length>=9){status.textContent='Досягнуто 9 станів. Почніть нову послідовність.';return false;}
  const combined=Matrix.multiply(matrix,history.at(-1).matrix),points=Matrix.apply(combined,basePoints);
  if(points.flat().some(v=>!Number.isFinite(v)||Math.abs(v)>10000)){status.textContent='Координати перевищують допустимий діапазон. Зменште параметри.';return false;}
  history.push({name,symbol,matrix:combined,points});return true;
}
function operation(type){
  const [cx,cy]=getPivot();
  if(type==='scale')return addState(Matrix.around2(Matrix.scale2(number('sx'),number('sy')),cx,cy),'Масштабування','S');
  if(type==='rotate')return addState(Matrix.around2(Matrix.rotate2(number('angle')),cx,cy),'Обертання','R');
  if(type==='translate')return addState(Matrix.translate2(number('dx'),number('dy')),'Перенесення','T');
  if(type==='reflect')return addState(Matrix.reflect2(document.getElementById('axis').value),'Віддзеркалення','F');
  if(type==='shear')return addState(Matrix.shear2(number('kx'),number('ky')),'Зсув','H');
  return false;
}
function sequence(){start();for(const type of ['scale','rotate','translate'])operation(type);update();}
function restore(){for(const [id,value] of Object.entries(defaults))document.getElementById(id).value=value;document.getElementById('pivot').value='origin';document.getElementById('axis').value='x';sequence();}
function text(value,x,y,color='#dce5f1',size=15,align='left'){
  ctx.fillStyle=color;ctx.font=`${size}px Arial, sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);
}
function draw(){
  const all=history.flatMap(s=>s.points),maxX=Math.max(70,...all.map(p=>Math.abs(p[0]))),maxY=Math.max(55,...all.map(p=>Math.abs(p[1])));
  const scale=Math.min(4.5,780/(2*maxX+20),540/(2*maxY+20)),ox=440,oy=330;
  const screen=([x,y])=>[ox+x*scale,oy-y*scale];
  const toStep=50/scale,unit=10**Math.floor(Math.log10(toStep)),step=(toStep/unit<2?1:toStep/unit<5?2:5)*unit;
  ctx.fillStyle='#101820';ctx.fillRect(0,0,880,720);
  text('Матричні перетворення трикутника',24,25,'#f4f7fb',19);
  text('X → праворуч · Y → вгору',856,25,'#a6b5c8',13,'right');
  ctx.save();ctx.beginPath();ctx.rect(38,54,804,556);ctx.clip();
  for(let x=-Math.ceil(400/scale/step)*step;x<=400/scale;x+=step){const [px]=screen([x,0]);ctx.fillStyle=x===0?'#7e91a8':'#253443';ctx.fillRect(Math.round(px),55,x===0?2:1,550);if(x!==0&&px>60&&px<820)text(String(x),px,oy+17,'#9daec3',12,'center');}
  for(let y=-Math.ceil(270/scale/step)*step;y<=270/scale;y+=step){const [,py]=screen([0,y]);ctx.fillStyle=y===0?'#7e91a8':'#253443';ctx.fillRect(40,Math.round(py),800,y===0?2:1);if(y!==0&&py>70&&py<590)text(String(y),ox-10,py,'#9daec3',12,'right');}
  const selected=visible.value==='all'?history.map((_,i)=>i):[0,Number(visible.value)];
  for(const index of [...new Set(selected)]){
    const state=history[index];if(!state)continue;
    ctx.beginPath();state.points.map(screen).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle=palette[index]+'12';ctx.fill();ctx.strokeStyle=palette[index];ctx.lineWidth=index===history.length-1?3:2;ctx.stroke();
    for(const point of state.points){const [x,y]=screen(point);ctx.fillStyle=palette[index];ctx.fillRect(x-3,y-3,6,6);}
  }
  if(document.getElementById('labels').checked){
    const final=history[visible.value==='all'?history.length-1:Number(visible.value)];
    final.points.forEach((p,i)=>{const [x,y]=screen(p);text(['A','B','C'][i],x+9,y-12,'#fff',16);});
  }
  ctx.restore();text('0',ox-8,oy+17,'#dce5f1',13,'right');text('X',832,oy-12);text('Y',ox+13,62);
  history.forEach((state,index)=>{const x=28+(index%3)*285,y=642+Math.floor(index/3)*27;ctx.fillStyle=palette[index];ctx.fillRect(x,y-6,12,12);text(`${index}. ${state.name}`,x+21,y,'#dce5f1',14);});
}
function update(){
  visible.replaceChildren(new Option('Усі стани','all'));
  history.forEach((s,i)=>visible.add(new Option(`${i}. ${s.name}`,String(i))));visible.value='all';
  const tbody=document.getElementById('coordinates');tbody.replaceChildren();
  history.forEach((s,i)=>{const tr=document.createElement('tr');for(const value of [`${i}. ${s.name}`,...s.points.map(p=>`(${format(p[0])}; ${format(p[1])})`)]){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);}tbody.appendChild(tr);});
  const matrix=document.getElementById('matrix');matrix.replaceChildren();
  for(const row of history.at(-1).matrix){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=format(value,6);tr.appendChild(td);}matrix.appendChild(tr);}
  const symbols=history.slice(1).map(s=>s.symbol).reverse();
  document.getElementById('chain').textContent=`P′ = ${symbols.length?symbols.join(' · ')+' · ':''}P. Вершини подано стовпцями однорідних координат.`;
  status.textContent=`Кількість станів: ${history.length}. Координати обчислюються множенням матриць 3 × 3.`;
  draw();
}
function save(){
  const button=document.getElementById('save');button.disabled=true;
  canvas.toBlob(blob=>{button.disabled=false;if(!blob){status.textContent='Не вдалося створити PNG.';return;}const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=document.body.dataset.lab==='4'?'Lab4_Variant1_2D.png':'Lab3_Variant1.png';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');
}
if(!ctx){status.textContent='Не вдалося створити графічний контекст.';}else{
  form.addEventListener('submit',event=>{event.preventDefault();sequence();});
  document.getElementById('restore').addEventListener('click',restore);
  document.getElementById('reset').addEventListener('click',()=>{start();update();});
  for(const button of document.querySelectorAll('[data-op]'))button.addEventListener('click',()=>{if(form.reportValidity()&&operation(button.dataset.op))update();});
  visible.addEventListener('change',draw);document.getElementById('labels').addEventListener('change',draw);
  document.getElementById('save').disabled=false;document.getElementById('save').addEventListener('click',save);
  restore();
}
