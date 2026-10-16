'use strict';
// Pixel-grid illustrations derived from the HANDS Supreme and VTX references.
// Cached surfaces retain sharp one-pixel material details without per-frame rebuilding.
window.HandsArt=(()=>{
 const cache=new Map();
 const R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 function P(c,pts,col){c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
 function E(c,x,y,rx,ry,col,grid=1){for(let yy=-ry;yy<=ry;yy+=grid){const dx=Math.floor(Math.sqrt(Math.max(0,1-yy*yy/(ry*ry)))*rx/grid)*grid;R(c,x-dx,y+yy,dx*2+grid,grid,col);}}
 function sprite(key,w,h,paint){if(!cache.has(key)){const a=document.createElement('canvas');a.width=w;a.height=h;const c=a.getContext('2d');c.imageSmoothingEnabled=false;paint(c);cache.set(key,a);}return cache.get(key);}
 const glyph={H:['101','101','111','101','101'],A:['010','101','111','101','101'],N:['1001','1101','1011','1001','1001'],D:['110','101','101','101','110'],S:['111','100','111','001','111']};
 function badge(c,x,y,dark=false){P(c,[[x,y+2],[x+9,y+2],[x+13,y],[x+18,y+2],[x+31,y+2],[x+33,y+4],[x+33,y+11],[x+31,y+13],[x+18,y+13],[x+13,y+15],[x+9,y+13],[x,y+13],[x-2,y+10],[x-2,y+5]],dark?'#ebca86':'#3d2a22');R(c,x,y+3,31,1,dark?'#fff0b6':'#b58a4e');let xx=x+5;for(const letter of 'HANDS'){glyph[letter].forEach((row,yy)=>[...row].forEach((v,col)=>{if(v==='1')R(c,xx+col,y+6+yy,1,1,dark?'#523820':'#e8c783');}));xx+=glyph[letter][0].length+1;}R(c,x,y+7,2,2,'#ddd7ba');R(c,x+29,y+7,2,2,'#ddd7ba');}
 function deck(c,x,y,w,h){P(c,[[x+5,y],[x+w-5,y],[x+w,y+h],[x,y+h]],'#384044');R(c,x+5,y,w-10,1,'#788382');R(c,x+2,y+h-1,w-4,2,'#111b21');for(let row=0;row<2;row++){const yy=y+3+row*4;for(let xx=x+10;xx<x+w-7;xx+=10){R(c,xx-2,yy-1,4,1,'#080e14');R(c,xx-3,yy,6,1,'#080e14');R(c,xx-2,yy+1,4,1,'#080e14');R(c,xx-1,yy+2,3,1,'#677171');R(c,xx+5,yy,1,1,'#080f13');}}for(const xx of [x+5,x+w-6]){R(c,xx,y+2,2,2,'#adb5a6');R(c,xx,y+h-3,2,2,'#a2a79a');}}
 function board(c,x,y,w=96,h=28,variant='teak'){
  const img=sprite('board:'+w+':'+h+':'+variant,w+8,h+14,b=>{b.translate(4,0);const vtx=variant==='vtx',dark=variant==='dark',face=vtx?h-4:12;
   if(vtx){
    // Elevated perforated deck, black riser brackets, open clearance, lower tray.
    deck(b,1,h-10,w-2,10);R(b,2,h,w-4,6,'#141e24');R(b,9,11,5,h-14,'#141e23');R(b,w-18,11,5,h-14,'#141e23');P(b,[[11,12],[17,12],[11,h-8]],'#455052');R(b,w-17,13,1,h-23,'#6b7876');
    for(const xx of [0,w-5]){R(b,xx,7,5,h-1,'#b98445');R(b,xx,7,2,h-1,'#f1d499');R(b,xx+3,9,1,h-6,'#815831');R(b,xx+1,h-10,3,2,'#c99a59');}
    deck(b,4,0,w-8,10);R(b,4,10,w-8,3,'#101a20');R(b,6,10,w-12,1,'#4c5657');
    R(b,6,h,29,6,'#e0bd77');R(b,7,h+1,27,1,'#fff0b7');let xx=10;for(const l of 'HANDS'){glyph[l].forEach((r,yy)=>[...r].forEach((v,k)=>{if(v==='1')R(b,xx+k,h+1+yy,1,1,'#62441f');}));xx+=glyph[l][0].length+1;}
   }else{
    R(b,0,10,w,h-6,dark?'#493333':'#bd8c4e');R(b,1,11,w-2,h-9,dark?'#59413d':'#deb778');
    // Broad flowing wood grain, not random noise: light teak and dark Supreme.
    for(let row=0;row<5;row++)for(let xx=1;xx<w-1;xx+=2){const yy=13+row*3+Math.sin(xx*.055+row)*2; if(yy<h+2)R(b,xx,yy,2,1,dark?(row%2?'#765146':'#3e2c2c'):(row%2?'#a8753c':'#f4d69a'));}
    E(b,w*.29,h*.64,8,3,dark?'#3e2928':'#b78144');E(b,w*.29,h*.64,5,2,dark?'#684638':'#d0a267');R(b,w*.29-2,h*.64,4,1,dark?'#32252a':'#966535');
    R(b,1,h+2,w-2,2,dark?'#34272b':'#9f703d');R(b,1,10,w-2,2,dark?'#ac7d61':'#ffe1a3');R(b,0,11,2,h-6,dark?'#966750':'#ebc78b');R(b,w-2,11,2,h-6,dark?'#33252b':'#936133');
    deck(b,3,0,w-6,10);P(b,[[0,10],[4,0],[7,0],[3,10]],dark?'#936f59':'#edd39a');P(b,[[w-3,10],[w-7,0],[w-4,0],[w,10]],dark?'#6f4b3d':'#cfa366');R(b,4,0,w-8,1,dark?'#936f59':'#edd39a');badge(b,3,h-11,dark);
   }
   for(const xx of [6,w-13]){R(b,xx,h+6,8,4,'#101b23');R(b,xx+1,h+6,6,1,'#768075');}
  });c.drawImage(img,Math.round(x)-4,Math.round(y));
 }
 function tree(c,x,y,scale=1,kind='forest'){
  const img=sprite('tree:'+kind,192,220,b=>{
   if(kind==='beach'){P(b,[[89,219],[108,219],[119,80],[108,73]],'#705c41');P(b,[[93,219],[100,219],[117,78],[110,78]],'#cca777');for(let i=0;i<10;i++)R(b,96+i,204-i*13,10,3,'#836342');for(let side of [-1,1])for(let j=0;j<3;j++){P(b,[[113,78],[113+side*(35+j*7),35+j*8],[113+side*(73+j*2),54+j*17],[113+side*(42+j*3),52+j*12]],j%2?'#3b785b':'#69a66b');}return;}
   P(b,[[75,217],[88,203],[91,123],[81,103],[94,108],[105,99],[105,150],[112,197],[127,218],[105,214],[96,207],[87,218]],'#493f39');P(b,[[88,210],[95,195],[97,118],[103,120],[103,198],[112,214],[101,209],[96,203]],'#a07a52');for(let j=0;j<8;j++)R(b,95+j%2*5,138+j*9,2,6,'#d2a66d');
   if(kind==='mushroom'){P(b,[[35,117],[42,90],[64,58],[94,42],[123,51],[153,84],[167,116]],'#654664');P(b,[[39,107],[51,84],[80,51],[104,48],[136,70],[159,105]],'#b37aab');P(b,[[48,91],[70,63],[95,50],[115,57],[131,73],[89,65]],'#d79bc1');R(b,38,112,126,7,'#f2c8d0');for(let j=0;j<6;j++)E(b,58+j*17,86+Math.sin(j*3)*18,5,3,'#ffe0c4',2);for(let xx=50;xx<160;xx+=10)R(b,xx,120,2,9,'#a97894');return;}
   if(kind==='snow'){for(let i=0;i<4;i++){P(b,[[23+i*12,177-i*30],[97,28+i*7],[171-i*12,177-i*30]],'#376b76');P(b,[[27+i*12,165-i*30],[97,28+i*7],[164-i*12,165-i*30],[132,151-i*26],[108,157-i*24],[83,147-i*24],[61,161-i*28]],'#c0d9dc');P(b,[[43+i*10,144-i*25],[97,28+i*7],[101,120-i*20]],'#f0f2de');}return;}
   const pal=kind==='sky'?['#344f61','#466c6b','#729b7b','#a5c08a','#d1d9a2']:['#214a42','#32634b','#52875a','#87ad6c','#bed38b'];
   const groups=[[48,129,33,26],[145,127,31,28],[68,90,40,33],[122,82,39,35],[96,51,33,28],[96,129,48,34]];
   for(const [xx,yy,rx,ry] of groups)E(b,xx,yy,rx+3,ry+3,pal[0],2);
   for(const [xx,yy,rx,ry] of groups){E(b,xx,yy-3,rx,ry,pal[1],2);E(b,xx-4,yy-10,rx-5,ry-8,pal[2],2);E(b,xx-9,yy-17,rx-12,ry-15,pal[3],2);for(let k=0;k<6;k++){const px=xx-rx+9+k*7,py=yy-ry+10+Math.sin(k*2.4)*6;R(b,px,py,6,2,pal[4]);R(b,px+2,py+2,3,2,pal[3]);}for(let k=0;k<4;k++)R(b,xx-rx+12+k*12,yy+ry-8-(k%2)*6,7,3,pal[0]);}
   E(b,60,210,22,7,pal[0],2);E(b,132,213,27,7,pal[1],2);
  });c.drawImage(img,Math.round(x-96*scale),Math.round(y-220*scale),Math.round(192*scale),Math.round(220*scale));
 }
 function mountain(c,x,y,w,h,col,snow){
  P(c,[[x,y],[x+w*.1,y-h*.19],[x+w*.17,y-h*.36],[x+w*.24,y-h*.39],[x+w*.33,y-h*.67],[x+w*.42,y-h*.72],[x+w*.52,y-h],[x+w*.59,y-h*.83],[x+w*.68,y-h*.62],[x+w*.76,y-h*.57],[x+w*.9,y-h*.22],[x+w,y]],col);
  P(c,[[x+w*.52,y-h],[x+w*.59,y-h*.83],[x+w*.68,y-h*.62],[x+w*.76,y-h*.57],[x+w*.9,y-h*.22],[x+w,y],[x+w*.57,y],[x+w*.49,y-h*.42]],'#17334635');
  P(c,[[x+w*.52,y-h],[x+w*.47,y-h*.64],[x+w*.37,y-h*.44],[x+w*.32,y-h*.12],[x+w*.42,y-h*.52]],'#e3e8ca26');
  for(let i=0;i<5;i++){const yy=y-h*.48+i*h*.088;P(c,[[x+w*(.23-i*.018),yy],[x+w*.44,yy-h*.08],[x+w*.39,yy-h*.025],[x+w*(.24-i*.018),yy+3]],'#132d3b18');}
  if(snow)P(c,[[x+w*.42,y-h*.72],[x+w*.52,y-h],[x+w*.63,y-h*.74],[x+w*.57,y-h*.8],[x+w*.55,y-h*.72],[x+w*.51,y-h*.82],[x+w*.47,y-h*.75]],'#edf3df');
 }
 function guitar(c,x,y,w,h,col=0){c.save();c.translate(Math.round(x),Math.round(y));c.scale(w/44,h/68);const tone=['#ca8254','#dec28b','#81b4af'][col%3];R(c,17,0,10,40,'#4b3530');R(c,19,2,7,40,'#bb945b');P(c,[[15,0],[17,-3],[28,-3],[28,10],[15,10]],'#e2c38c');for(let j=0;j<3;j++){R(c,12,j*3,4,2,'#b9c9c7');R(c,28,j*3,4,2,'#b9c9c7');}for(let j=0;j<7;j++)R(c,19,12+j*4,7,1,'#eee1b8');P(c,[[12,30],[17,34],[18,42],[27,42],[28,34],[34,30],[38,39],[36,44],[42,52],[40,61],[33,67],[10,67],[3,60],[3,50],[10,43],[8,36]],'#24343b');P(c,[[12,33],[16,39],[16,46],[29,46],[30,38],[34,34],[35,44],[39,51],[37,60],[31,64],[12,64],[6,58],[6,50],[13,43]],tone);P(c,[[28,43],[32,48],[30,58],[19,59],[16,51],[20,44]],'#ede1b9');R(c,19,43,8,4,'#26343d');R(c,19,52,8,4,'#26343d');R(c,16,60,14,3,'#7c827e');for(let j=0;j<3;j++)R(c,20+j*2,7,1,54,'#eee4bb88');R(c,33,55,3,3,'#f8e6ac');R(c,31,60,2,2,'#f8e6ac');R(c,8,48,2,10,'#f2c894');c.restore();}
 function hero(c,p,t,carrying){c.save();c.translate(Math.round(p.x+13),Math.round(p.y));c.scale(p.face,1);const walk=p.grounded&&Math.abs(p.vx)>20?Math.round(Math.sin(t*19)*4):0;
  P(c,[[-11,5],[-6,0],[8,0],[12,6],[11,21],[6,24],[-11,26],[-13,15]],'#262733');R(c,-8,3,17,5,'#624333');R(c,-7,2,12,2,'#987352');R(c,-7,8,17,11,'#d59b6d');R(c,-4,7,13,9,'#efc392');R(c,7,11,5,4,'#f0c694');R(c,4,9,3,2,'#1c313a');R(c,5,9,1,1,'#f5f2df');R(c,2,18,7,2,'#684138');R(c,-11,8,5,17,'#403138');R(c,-10,10,2,11,'#78513b');R(c,-8,20,19,17,'#202e3b');P(c,[[-7,21],[-2,23],[-4,35],[-9,36]],'#4d6970');P(c,[[7,21],[10,25],[10,36],[3,35]],'#3a5661');R(c,-2,24,5,9,'#a9b6a2');R(c,-1,26,3,5,'#263a41');R(c,-11,25,4,11,'#d8a67b');R(c,-11,25,4,3,'#8eaea4');R(c,9,24,4,10,'#eac08e');R(c,-7,37,7,9+walk,'#24384a');R(c,4,37,7,9-walk,'#33485a');R(c,-6,39,2,5,'#68828b');R(c,5,39,2,4,'#6e8c96');R(c,-9,44+walk,9,4,'#b3b7a5');R(c,4,44-walk,11,4,'#c7cbb4');R(c,-9,47+walk,9,1,'#26333a');R(c,4,47-walk,11,1,'#26333a');P(c,[[-5,21],[-2,21],[10,37],[7,39]],'#bd8d55');R(c,-4,31,18,9,'#724c38');P(c,[[-3,32],[1,29],[8,30],[10,34],[15,34],[13,41],[3,43],[-3,40]],'#d9a460');R(c,1,32,6,7,'#f0d19a');R(c,4,34,6,4,'#30414a');R(c,8,31,18,3,'#b68854');R(c,24,28,7,5,'#e7c38a');R(c,3,34,26,1,'#f6e0ac');R(c,0,40,7,1,'#f3c47b');R(c,9,28,4,5,'#efc38e');if(carrying)board(c,-25,-24,53,16,'teak');c.restore();
 }
 return{board,tree,mountain,guitar,hero};
})();


