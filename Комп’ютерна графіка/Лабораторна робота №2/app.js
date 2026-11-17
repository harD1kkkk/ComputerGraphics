"use strict";

const variant = { line: [10,10,120,40], circle: [60,60,25], ellipse: [60,60,40,20] };
const colors = { dda: '#4d9dff', bres: '#ff7272', common: '#bf99ff', circle: '#46d78a', ellipse: '#ffce54', crossing: '#f4f6f9' };
const scene = document.getElementById('scene');
const comparisonCanvas = document.getElementById('comparison');
const display = scene.getContext('2d');
const compareContext = comparisonCanvas.getContext('2d');
const buffer = document.createElement('canvas');
buffer.width = scene.width; buffer.height = scene.height;
const context = buffer.getContext('2d');
const raster = document.createElement('canvas');
raster.width = 151; raster.height = 101;
const rasterContext = raster.getContext('2d');
const fields = ['x1','y1','x2','y2'].map(id => document.getElementById(id));
const mode = document.getElementById('mode');
const grid = document.getElementById('grid');
const status = document.getElementById('status');
let endpoints = variant.line.slice();
let results;

function calculate() {
  const dda = Raster.lineDDA(...endpoints), bres = Raster.lineBresenham(...endpoints);
  const circle = Raster.circleBresenham(...variant.circle);
  const ellipse = Raster.ellipseBresenham(...variant.ellipse);
  results = { dda, bres, circle, ellipse, match: Raster.comparePixels(dda.pixels, bres.pixels) };
}

function fillText(ctx, text, x, y, color = '#e9eef5', size = 16, align = 'left') {
  ctx.fillStyle = color; ctx.font = `${size}px Arial, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}

function rgb(hex) { return [1,3,5].map(index => parseInt(hex.slice(index,index+2),16)); }

function drawScene() {
  const originX = 60, originY = 70, scale = 5;
  const active = mode.value;
  context.fillStyle = '#101820'; context.fillRect(0,0,buffer.width,buffer.height);
  const isVariant = endpoints.every((value,index) => value === variant.line[index]);
  fillText(context, `Растрове полотно · ${isVariant ? 'Варіант 1' : 'Змінений відрізок'}`, 26, 25, '#f4f6f9', 19);
  fillText(context, '1 піксель = 5 × 5', 851, 25, '#a8b7c9', 14, 'right');

  if (grid.checked) {
    context.fillStyle = '#243241';
    for (let x=0; x<=150; x+=10) context.fillRect(originX+x*scale+2,originY,1,505);
    for (let y=0; y<=100; y+=10) context.fillRect(originX,originY+y*scale+2,755,1);
  }
  for (let x=0; x<=150; x+=10) fillText(context,String(x),originX+x*scale+2,52,'#9dacbf',13,'center');
  for (let y=0; y<=100; y+=10) fillText(context,String(y),43,originY+y*scale+2,'#9dacbf',13,'right');
  fillText(context,'X',841,52,'#c5d0dd',14);
  fillText(context,'Y',24,592,'#c5d0dd',14);

  const mask = new Uint8Array(raster.width * raster.height);
  const addPixels = (pixels, bit) => {
    for (const [x,y] of pixels) if (x>=0 && x<151 && y>=0 && y<101) mask[y*151+x] |= bit;
  };
  if (active==='all' || active==='dda') addPixels(results.dda.pixels,1);
  if (active==='all' || active==='bres') addPixels(results.bres.pixels,2);
  if (active==='all' || active==='circle') addPixels(results.circle.pixels,4);
  if (active==='all' || active==='ellipse') addPixels(results.ellipse.pixels,8);
  const palette = {1:rgb(colors.dda),2:rgb(colors.bres),3:rgb(colors.common),4:rgb(colors.circle),8:rgb(colors.ellipse)};
  const crossing = rgb(colors.crossing);
  const frame = rasterContext.createImageData(151,101);
  for (let i=0; i<mask.length; i++) {
    if (!mask[i]) continue;
    const color = palette[mask[i]] || crossing;
    frame.data.set([...color,255],i*4);
  }

  rasterContext.putImageData(frame,0,0);
  context.imageSmoothingEnabled = false;
  context.drawImage(raster,originX,originY,755,505);

  const legend = [
    ['DDA',colors.dda,60,612], ['Брезенхем',colors.bres,215,612],
    ['Спільні пікселі ліній',colors.common,420,612],
    ['Коло',colors.circle,60,644], ['Еліпс',colors.ellipse,215,644],
    ['Перетин фігур',colors.crossing,420,644]
  ];
  for (const [label,color,x,y] of legend) {
    context.fillStyle=color; context.fillRect(x,y-6,13,13);
    fillText(context,label,x+23,y,'#d5deea',16);
  }
  fillText(context, `Відрізок (${endpoints[0]}; ${endpoints[1]}) → (${endpoints[2]}; ${endpoints[3]})`,60,679,'#9dacbf',14);
  display.clearRect(0,0,scene.width,scene.height);
  display.drawImage(buffer,0,0);
}

function drawComparison() {
  const ctx = compareContext;
  ctx.fillStyle='#101820'; ctx.fillRect(0,0,880,500);
  const minX=Math.min(endpoints[0],endpoints[2]), maxX=Math.max(endpoints[0],endpoints[2]);
  const minY=Math.min(endpoints[1],endpoints[3]), maxY=Math.max(endpoints[1],endpoints[3]);
  const width=maxX-minX+1, height=maxY-minY+1;
  const scale=Math.max(1,Math.min(6,Math.floor(780/width),Math.floor(170/height)));
  for (const [index,name,key] of [[0,'DDA','dda'],[1,'Брезенхем','bres']]) {
    const top=24+index*235;
    fillText(ctx,name,30,top,colors[key],19);
    fillText(ctx,`${results[key].pixels.length} пікселів · масштаб ${scale}:1`,850,top,'#a8b7c9',14,'right');
    const left= Math.floor((880-width*scale)/2), yTop=top+35+Math.floor((170-height*scale)/2);
    ctx.fillStyle=colors[key];
    for (const [x,y] of results[key].pixels) ctx.fillRect(left+(x-minX)*scale,yTop+(y-minY)*scale,scale,scale);
    fillText(ctx,`(${endpoints[0]}; ${endpoints[1]}) → (${endpoints[2]}; ${endpoints[3]})`,30,top+203,'#a8b7c9',14);
  }
}

function showMetrics() {
  const a=results.dda, b=results.bres;
  const errorA=Raster.lineError(a.pixels,...endpoints), errorB=Raster.lineError(b.pixels,...endpoints);
  const format=value=>value.toFixed(6).replace('.',',');
  const rows = [
    ['Кількість пікселів',a.pixels.length,b.pixels.length],
    ['Кроки між пікселями',a.stats.steps,b.stats.steps],
    ['Ділення для приростів',a.stats.divisions,b.stats.divisions],
    ['Виклики округлення',a.stats.roundings,b.stats.roundings],
    ['Додавання до координат',a.stats.coordinateAdds,b.stats.coordinateAdds],
    ['Оновлення параметра похибки',a.stats.errorUpdates,b.stats.errorUpdates],
    ['Подвоєння параметра похибки',a.stats.doublings,b.stats.doublings],
    ['Перевірки напрямку кроку',a.stats.directionTests,b.stats.directionTests],
    ['Максимальна похибка, px',format(errorA),format(errorB)]
  ];
  const body=document.getElementById('metrics'); body.replaceChildren();
  for (const values of rows) {
    const row=document.createElement('tr');
    for (const value of values) {const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);}
    body.appendChild(row);
  }
  const m=results.match;
  document.getElementById('match-text').textContent=m.difference===0
    ? `Усі ${m.common} пікселів збігаються. На спільному полотні вони позначені фіолетовим; нижче кожен метод показано окремо.`
    : `Спільних пікселів: ${m.common}. Лише DDA: ${m.onlyDDA}; лише Брезенхем: ${m.onlyBresenham}.`;
  status.textContent=`Побудовано: DDA — ${a.pixels.length}, Брезенхем — ${b.pixels.length}, коло — ${results.circle.pixels.length}, еліпс — ${results.ellipse.pixels.length} унікальних пікселів.`;
}

function update() { calculate(); drawScene(); drawComparison(); showMetrics(); }

function preset(line) {
  endpoints=line.slice(); fields.forEach((field,index)=>{field.value=endpoints[index];});
  mode.value='all'; update();
}

function savePNG(canvas, filename, button) {
  button.disabled=true;
  canvas.toBlob(blob=>{
    button.disabled=false;
    if (!blob) {status.textContent='Не вдалося створити PNG. Спробуйте ще раз.';return;}
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url; link.download=filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    status.textContent=`Файл ${filename} передано браузеру для збереження.`;
  },'image/png');
}

if (!display || !compareContext || !context || !rasterContext) {
  status.textContent='Не вдалося створити графічний контекст. Відкрийте index.html в іншому браузері.';
} else {
  document.getElementById('line-form').addEventListener('submit',event=>{
    event.preventDefault();
    const values=fields.map(field=>Number(field.value));
    if (!values.every((value,index)=>Number.isInteger(value) && value>=0 && value<=(index%2?100:150))) {
      status.textContent='Координати повинні бути цілими: X від 0 до 150, Y від 0 до 100.'; return;
    }
    endpoints=values; update();
  });
  document.getElementById('restore').addEventListener('click',()=>preset(variant.line));
  document.getElementById('hundred').addEventListener('click',()=>preset([10,10,110,10]));
  mode.addEventListener('change',drawScene); grid.addEventListener('change',drawScene);
  for (const [id,canvas,filename] of [['save-scene',scene,'Lab2_Variant1_Scene.png'],['save-comparison',comparisonCanvas,'Lab2_Variant1_Comparison.png']]) {
    const button=document.getElementById(id); button.disabled=false;
    button.addEventListener('click',()=>savePNG(canvas,filename,button));
  }
  scene.addEventListener('pointermove',event=>{
    const rect=scene.getBoundingClientRect();
    const x=Math.floor(((event.clientX-rect.left)*scene.width/rect.width-60)/5);
    const y=Math.floor(((event.clientY-rect.top)*scene.height/rect.height-70)/5);
    document.getElementById('coordinates').textContent=x>=0&&x<=150&&y>=0&&y<=100?`Піксель (${x}; ${y})`:'X → праворуч · Y → вниз';
  });
  scene.addEventListener('pointerleave',()=>document.getElementById('coordinates').textContent='X → праворуч · Y → вниз');
  requestAnimationFrame(update);
}
