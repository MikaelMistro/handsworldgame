'use strict';
window.HandsModern = (() => {
 const images={},frames={},surfaces=new Map();
 let loaded=0;
 const specs={run:['assets/guitarist-run.png',4,2],hero:['assets/guitarist.png',4,2],enemies:['assets/enemies.png',5,3],worlds:['assets/worlds.png',2,5],logo:['hand.svg',1,1]};
 const ready=Promise.all(Object.entries(specs).map(([key,[src,cols,rows]])=>new Promise(resolve=>{
  const im=new Image();im.onload=()=>{images[key]=im;if(key==='hero'||key==='enemies'||key==='run')slice(key,im,cols,rows);loaded++;resolve();};im.onerror=()=>{loaded++;resolve();};im.src=window.HandsSprites?.[key]||src;
 })));
 // Chroma-key is performed once at load, never during animation. Original artwork is retained.
 function slice(key,im,cols,rows){
  const all=document.createElement('canvas');all.width=im.width;all.height=im.height;const a=all.getContext('2d',{willReadFrequently:true});a.drawImage(im,0,0);
  const pixels=a.getImageData(0,0,all.width,all.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(r>130&&b>110&&g<Math.min(r,b)*.65){d[i+3]=0;}}
  a.putImageData(pixels,0,0);frames[key]=[];
  const cw=im.width/cols,ch=im.height/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const edges=key==='enemies'?[0,309/1536,578/1536,897/1536,1256/1536,1]:[0,.25,.5,.75,1];const sx=Math.round(edges[col]*im.width),ex=Math.round(edges[col+1]*im.width);const sy=key==='hero'?(row?Math.round(im.height*500/1024):0):Math.round(row*ch),ey=key==='hero'?(row?im.height:Math.round(im.height*500/1024)):Math.round((row+1)*ch);
   let l=ex,r=sx,t=ey,b=sy;
   for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++){if(d[(y*im.width+x)*4+3]>80){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}
   if(r<l){l=sx;r=ex-1;t=sy;b=ey-1;}
   frames[key].push({image:all,x:l,y:t,w:r-l+1,h:b-t+1});
  }
 }
 function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
 function oval(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=col;c.fill();}
 function gradient(c,y,h,colors){const g=c.createLinearGradient(0,y,0,y+h);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
 function sprite(c,key,index,x,feet,height,flip=false,angle=0,squash=1){
  const f=frames[key]?.[index];if(!f)return;const w=f.w/f.h*height;
  c.save();c.translate(x,feet);c.rotate(angle);c.scale(flip?-1:1,squash);c.drawImage(f.image,f.x,f.y,f.w,f.h,-w/2,-height,w,height);c.restore();
 }
 function star(c,x,y,r,col,rot=0){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.43:r;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}c.closePath();c.fillStyle=col;c.fill();c.restore();}
 function board(c,x,y,w=96,h=28,variant='teak'){
  const key=`board:${w}:${h}:${variant}`;
  if(!surfaces.has(key)){
   const cv=document.createElement('canvas');cv.width=(w+8)*3;cv.height=(h+14)*3;const b=cv.getContext('2d');b.scale(3,3);b.translate(4,0);b.lineWidth=.8;
   const dark=variant==='dark',vtx=variant==='vtx';
   for(const xx of [5,w-13])rr(b,xx,h+5,9,5,2,'#121318','#535055');
   rr(b,0,5,w,h,3,gradient(b,5,h,dark?['#8e5636','#4b291f','#77432c']:['#ffe2a1','#b7793f','#e7af65']),'#33221d');
   b.save();b.beginPath();b.rect(2,13,w-4,h-9);b.clip();for(let j=0;j<14;j++){b.beginPath();for(let xx=0;xx<=w;xx+=3){const yy=12+j*1.8+Math.sin(xx*.08+j)*1.5;xx?b.lineTo(xx,yy):b.moveTo(xx,yy);}b.strokeStyle=j%2?'#ffffff17':'#2b100c30';b.lineWidth=j%3?.5:1;b.stroke();}b.restore();
   const top=(yy)=>{rr(b,3,yy,w-6,11,2,gradient(b,yy,11,['#92928a','#3c4244','#22272d']),'#1e2024');for(let row=0;row<3;row++)for(let xx=10;xx<w-6;xx+=9){oval(b,xx,yy+3+row*2.5,2.6,1.05,'#101318');b.fillStyle='#b2b5a855';b.fillRect(xx-1,yy+4+row*2.5,2,.4);}for(const xx of [5,w-6]){oval(b,xx,yy+2,1,1,'#eee9d7');}};
   top(0);
   if(vtx){rr(b,5,10,w-10,h-7,1,'#12171d');b.fillStyle='#8c6540';b.fillRect(0,5,4,h);b.fillRect(w-4,5,4,h);top(h-7);b.fillStyle='#3e464b';b.fillRect(9,10,3,h-13);b.fillRect(w-13,10,3,h-13);}
   const bx=5,by=vtx?h-2:h-7;rr(b,bx,by,31,9,3,dark?'#eac381':'#38251d',dark?'#fff0be':'#e8bc73');b.fillStyle=dark?'#44271c':'#f4d29a';b.font='900 6px Arial';b.textAlign='center';b.fillText('HANDS',bx+16,by+6.4);oval(b,bx+2,by+4.5,.8,.8,'#d9cead');oval(b,bx+29,by+4.5,.8,.8,'#d9cead');
   surfaces.set(key,cv);
  }
  c.drawImage(surfaces.get(key),x-4,y,w+8,h);
 }
 function guitar(c,x,y,w,h,col=0){
  const color=[['#fa6656','#a91727','#ffb493'],['#6c677b','#171923','#bab9b6'],['#ffd85e','#b9710d','#fff0ac']][col%3];
  c.save();c.lineWidth=1.5;rr(c,x+5,y+9,w-10,h-9,4,gradient(c,y,h,color),'#2b1520');rr(c,x,y,w,15,4,gradient(c,y,15,[color[2],color[0],color[1]]),'#271722');
  c.strokeStyle='#f7d9a4';c.lineWidth=.7;for(let i=0;i<6;i++){const xx=x+10+i*(w-20)/5;c.beginPath();c.moveTo(xx,y+16);c.lineTo(xx,y+h);c.stroke();}
  for(let yy=y+24;yy<y+h;yy+=13){c.fillStyle='#e5d2b7';c.fillRect(x+6,yy,w-12,1.5);oval(c,x+w/2,yy+6,1.6,1.6,'#fff1d5');}
  for(let yy=y+22;yy<y+h-8;yy+=22){rr(c,x+1,yy,5,7,2,'#b7b0a0','#302d34');rr(c,x+w-6,yy,5,7,2,'#b7b0a0','#302d34');}c.restore();
 }
 function hand(c,x,y,size=25){
  c.save();const cx=x+size/2,cy=y+size/2;c.shadowColor='#ffc963';c.shadowBlur=8;
  oval(c,cx,cy,size/2,size/2,gradient(c,y,size,['#fff1ad','#f8b736','#a9550f']));c.shadowBlur=0;
  c.strokeStyle='#fff0ad';c.lineWidth=1.2;c.beginPath();c.arc(cx,cy,size*.43,0,Math.PI*2);c.stroke();
  if(images.logo)c.drawImage(images.logo,x+size*.1,y+size*.1,size*.8,size*.8);c.restore();
 }
 function background(c,index,cam,time){
  const im=images.worlds;if(!im){c.fillStyle='#273a55';c.fillRect(0,0,960,540);return;}
  const sw=im.width/2,sh=im.height/5,sx=index%2*sw,sy=Math.floor(index/2)*sh;
  // Overscan allows subtle parallax without visible atlas seams.
  const drift=Math.sin(cam/2400)*24;c.drawImage(im,sx+2,sy+2,sw-4,sh-4,-30-drift,-15,1020,574);
  c.fillStyle=gradient(c,320,220,['#09132600','#09132670']);c.fillRect(0,320,960,220);
  for(let i=0;i<20;i++){const xx=((i*137-cam*.18+time*(i%2?5:-3))%1000+1000)%1000;oval(c,xx,80+(i*67)%320,1+(i%3)*.4,1+(i%3)*.4,index%2?'#ffd59855':'#ffffff66');}
  if([2,6,9].includes(index)){c.save();c.globalCompositeOperation='screen';for(let i=0;i<3;i++){const x=i*340+Math.sin(time*.22+i)*80;c.beginPath();c.moveTo(x+100,450);c.lineTo(x-80,0);c.lineTo(x+60,0);c.fillStyle=index===9?'#ffd58212':'#bb8cff14';c.fill();}c.restore();}
 }
 function ground(c,s,cam,theme){
  const x=Math.max(s.x,cam-8),end=Math.min(s.x+s.w,cam+970);c.save();c.beginPath();c.rect(s.x,s.y,s.w,s.h);c.clip();
  c.fillStyle=gradient(c,s.y,100,[theme.dirt,'#292332','#121722']);c.fillRect(x,s.y,end-x,s.h);
  for(let xx=Math.floor(x/52)*52;xx<end;xx+=52){const k=Math.floor(xx/52);c.lineWidth=1;rr(c,xx+2,s.y+15+(k%3)*7,47,43,5,'#ffffff07','#100e172e');rr(c,xx+15,s.y+63,44,34,4,'#ffffff06','#100e172e');c.strokeStyle='#efc49520';c.beginPath();c.moveTo(xx+8,s.y+23);c.lineTo(xx+29,s.y+21);c.stroke();}
  c.fillStyle=gradient(c,s.y,15,[theme.grass,'#4c604b']);c.fillRect(x,s.y,end-x,12);c.fillStyle='#f8f4cb77';c.fillRect(x,s.y,end-x,2);
  c.restore();for(let xx=Math.ceil(x/19)*19;xx<end-3;xx+=19){const h=4+(Math.floor(xx/19)%3)*2;c.strokeStyle=theme.grass;c.lineWidth=2;c.beginPath();c.moveTo(xx,s.y+2);c.quadraticCurveTo(xx-3,s.y-h,xx-7,s.y-h);c.moveTo(xx,s.y);c.quadraticCurveTo(xx+3,s.y-h-2,xx+6,s.y-h-1);c.stroke();}
 }
 function hero(c,p,time,mode,power){
  const frame=mode==='hurt'?6:mode==='win'?7:mode==='attack'?4:mode==='land'?5:!p.grounded?3:Math.abs(p.vx)>25?1+Math.floor(time*11)%2:0;
  c.save();if(power){c.shadowBlur=14;c.shadowColor=power==='shield'?'#7ce7ff':power==='overdrive'?'#ffb44a':'#d59bff';}
  const running=p.grounded&&Math.abs(p.vx)>25&&!['hurt','win','attack','land'].includes(mode)&&frames.run;
  if(running){
   // Distance-driven gait: slow steps when walking, faster strides while sprinting.
   const cycle=(p.stride||0)%1,index=Math.floor(cycle*8)%8;
   sprite(c,'run',index,p.x+p.w/2,p.y+p.h,p.h,p.face<0);
  }else sprite(c,'hero',frame,p.x+p.w/2,p.y+p.h,frame===6?61:p.h,p.face<0,0,p.grounded&&mode==='land'?.88:1);
  c.restore();
  if(power==='shield'){c.strokeStyle='#9deeffaa';c.lineWidth=2;c.beginPath();c.ellipse(p.x+p.w/2,p.y+p.h/2,40,43,0,0,Math.PI*2);c.stroke();}
 }
 function enemy(c,e,time,dead=false){
  const col={cable:0,noise:1,flyer:2,plug:3,amp:4}[e.type]??0,row=dead?2:e.charging?1:Math.floor(time*(e.type==='flyer'?9:6)+e.phase)%2;
  const height=e.type==='flyer'?57:e.type==='amp'?51:e.type==='plug'?38:47;
  c.save();if(e.type==='amp'&&e.charging){c.shadowColor='#ff455a';c.shadowBlur=12;}
  sprite(c,'enemies',row*5+col,e.x+e.w/2,e.y+e.h+2,height,e.type==='plug'?e.dir<0:false,dead?Math.sin(time*15)*.08:0);c.restore();
  if(e.type==='noise'&&!dead){c.fillStyle='#ff496eaa';for(let j=0;j<4;j++){const shift=Math.sin(time*17+j*5)*8;c.fillRect(e.x-5+shift,e.y+j*8,6+j,1.3);}}
  if(e.charging&&!dead){c.fillStyle='#ffe8b0';c.font='bold 16px Arial';c.textAlign='center';c.fillText('!',e.x+e.w/2,e.y-17);c.textAlign='left';}
 }
 function portal(c,d,boardItem,open,time){
  c.save();c.lineWidth=2;rr(c,d.x-7,d.y-12,d.w+14,d.h+15,9,gradient(c,d.y,d.h,['#f1c88b','#805239']),'#35232b');
  rr(c,d.x,d.y-5,d.w,d.h+7,6,'#111526','#ffe3ac88');
  rr(c,d.x+7,d.y+3,d.w-14,d.h-3,4,open?gradient(c,d.y,d.h,['#fff4c4','#ffd18c','#f38c60']):gradient(c,d.y,d.h,['#3a3545','#141b2d']),'#8e655a');
  if(open){c.shadowColor='#ffcf7c';c.shadowBlur=20;for(let j=0;j<8;j++)star(c,d.x+12+(j*13)%(d.w-20),d.y+10+((j*23-time*30)%85+85)%85,2,'#fff7df',time);c.shadowBlur=0;}else{rr(c,d.x+16,d.y+15,d.w-32,24,3,'#151a26','#695165');rr(c,d.x+16,d.y+49,d.w-32,40,3,'#151a26','#695165');}
  oval(c,d.x+d.w-14,d.y+56,3,3,'#ffe0a3');rr(c,d.x-18,d.y-35,d.w+36,21,5,'#201d2d','#c29462');c.textAlign='center';c.fillStyle='#ffdc9f';c.font='bold 8px Arial';c.fillText(open?'PRÓXIMO PALCO →':'B A C K S T A G E',d.x+d.w/2,d.y-21);
  if(!open){const b=boardItem;c.shadowColor='#ffd788';c.shadowBlur=15;board(c,b.x,b.y+Math.sin(time*3)*4,96,28,'teak');c.shadowBlur=0;hand(c,b.x+35,b.y-33,24);}
  c.restore();
 }
 const powers={overdrive:{color:'#ff654f',label:'DRIVE',symbol:'ϟ'},shield:{color:'#58baf7',label:'SHIELD',symbol:'◈'},echo:{color:'#ae79ff',label:'ECHO',symbol:'♫'}};
 function pedal(c,p,time){const a=powers[p.kind];c.save();c.translate(p.x+p.w/2,p.y+p.h/2+Math.sin(time*3+p.x)*4);c.shadowColor=a.color;c.shadowBlur=18;rr(c,-14,-19,28,38,4,gradient(c,-19,38,[a.color,'#242036']),'#ffe1b4');c.shadowBlur=0;for(const xx of [-7,7])oval(c,xx,-10,4,4,'#121725');oval(c,0,9,5,5,'#ddd9d1');oval(c,0,9,3,3,'#9298a4');c.fillStyle='#fff5d8';c.font='900 5px Arial';c.textAlign='center';c.fillText(a.label,0,0);c.restore();}
 function wave(c,w){c.save();c.globalAlpha=Math.max(0,Math.min(1,w.life/(w.maxLife||.48)));c.translate(w.x+w.w/2,w.y+w.h/2);c.scale(w.dir,1);c.shadowColor=w.hostile?'#ff344e':'#ffcd67';c.shadowBlur=10;for(let i=0;i<3;i++){c.beginPath();c.arc(-12-i*8,0,15+i*6,-1,1);c.strokeStyle=w.hostile?'#ff4c61':i%2?'#fff5cf':'#ffba47';c.lineWidth=3-i*.6;c.stroke();}c.restore();}
 function effect(c,e){const k=Math.max(0,e.life/e.max);c.save();c.globalAlpha=k;if(e.kind==='ring'){c.strokeStyle=e.color;c.lineWidth=2*k;c.beginPath();c.ellipse(e.x,e.y,(1-k)*37+5,(1-k)*12+3,0,0,Math.PI*2);c.stroke();}else if(e.kind==='star')star(c,e.x,e.y,4+k*3,e.color,e.spin||0);else oval(c,e.x,e.y,e.size||4,(e.size||4)*.6,e.color);c.restore();}
 window.HandsArt.board=board;window.HandsArt.guitar=guitar;
 return{ready,images,frames,powers,sprite,board,guitar,hand,background,ground,hero,enemy,pedal,wave,effect,star,portal,get loaded(){return loaded;}};
})();
