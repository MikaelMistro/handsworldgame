'use strict';
(() => {
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=true;
const W=960,H=540,G=450,STEP=1/120;
const THEMES=[
 {name:'Jardim do Timbre',sub:'Onde toda boa turnê começa.',sky:'#79c4ca',horizon:'#d6e4af',far:'#608e87',near:'#3b7662',grass:'#90c854',dirt:'#947452',accent:'#daf58a',kind:'forest',notes:[0,4,7,11]},
 {name:'Dunas do Overdrive',sub:'Um som quente no coração do deserto.',sky:'#ebaa79',horizon:'#f9d79b',far:'#c97f65',near:'#ac6555',grass:'#edc476',dirt:'#ad704c',accent:'#ffe798',kind:'desert',notes:[0,3,7,10]},
 {name:'Cidade do Neon',sub:'As luzes acendem. O volume sobe.',sky:'#242646',horizon:'#79547c',far:'#3c375e',near:'#292e4b',grass:'#5fd6c0',dirt:'#454461',accent:'#fc90bc',kind:'city',notes:[0,4,7,9]},
 {name:'Picos do Chorus',sub:'Cada nota encontra seu eco.',sky:'#87b6d4',horizon:'#d8eef0',far:'#a7c6d8',near:'#6b9eb8',grass:'#edf8e6',dirt:'#7495b2',accent:'#b3ffe3',kind:'snow',notes:[0,4,9,11]},
 {name:'Floresta do Fuzz',sub:'Siga o som entre os cogumelos gigantes.',sky:'#32345b',horizon:'#9272a1',far:'#55547a',near:'#3a405d',grass:'#c18ad9',dirt:'#665273',accent:'#e5aaff',kind:'mushroom',notes:[0,3,5,10]},
 {name:'Costa do Reverb',sub:'Deixe as ondas levarem o timbre.',sky:'#6cc9cb',horizon:'#ffe5b3',far:'#5ba9b3',near:'#398c9d',grass:'#e2d49b',dirt:'#a18b67',accent:'#fcdf8a',kind:'beach',notes:[0,4,7,12]},
 {name:'Fábrica do Delay',sub:'Engrenagens, repetições e cabos soltos.',sky:'#664d67',horizon:'#d69a7e',far:'#745d70',near:'#4c475e',grass:'#e8b06c',dirt:'#575264',accent:'#ffe28c',kind:'factory',notes:[0,3,7,12]},
 {name:'Cavernas do Wah',sub:'Cristais que vibram com cada acorde.',sky:'#181f3e',horizon:'#3b4870',far:'#303655',near:'#202d4a',grass:'#76d3c6',dirt:'#444561',accent:'#78faeb',kind:'cave',notes:[0,5,7,10]},
 {name:'Ilhas do Vibrato',sub:'A última travessia antes do grande palco.',sky:'#9b9ac8',horizon:'#f6cfc0',far:'#8c89ae',near:'#6b709b',grass:'#afd28b',dirt:'#7d6c80',accent:'#f5d9ae',kind:'sky',notes:[0,4,7,9]},
 {name:'Palco Supreme',sub:'O seu som merece este palco.',sky:'#151c36',horizon:'#584a73',far:'#363451',near:'#292940',grass:'#ddc27e',dirt:'#454052',accent:'#e9ff9b',kind:'stage',notes:[0,4,7,12]}
];
let save={unlocked:0,completed:[],best:0};try{save={...save,...JSON.parse(localStorage.getItem('hands-world-v1')||'{}')};save.unlocked=Math.max(0,Math.min(9,Number(save.unlocked)||0));if(!Array.isArray(save.completed))save.completed=[];}catch(e){}
let state='title',levelIndex=0,level,player,cam=0,time=0,coins=0,health=3,checkpoint=80,hasBoard=false,particles=[],waves=[],keys={},jumpBuffer=0,coyote=0,attackCooldown=0,invuln=0,toastTime=0,runTime=0,levelCoins=0,deathCount=0,previousState='title';
let power=null,powerTime=0,poseTime=0,pose='',confused=0,shake=0,deathDelay=0,enemyShots=[],effects=[];
let padInput={};
function effect(x,y,kind='dust',color='#ffedc7',count=8){for(let i=0;i<count;i++)effects.push({x,y,kind,color,vx:(Math.random()-.5)*100,vy:-Math.random()*70,life:kind==='ring'?.4:.6,max:kind==='ring'?.4:.6,size:3+Math.random()*4,spin:Math.random()*6});}
function defeat(e){if(!e.alive)return;e.alive=false;e.deathLife=.7;effect(e.x+e.w/2,e.y+e.h/2,'star','#ffd36d',7);audio.fx('hit');}
function acquire(kind){power=kind;powerTime=18;audio.fx('board');effect(player.x+13,player.y+20,'star',kind==='shield'?'#8eeaff':'#ffcf79',18);toast({overdrive:'OVERDRIVE · use X/J, ♫ ACORDE ou botão esquerdo do controle',shield:'SHIELD · proteção contra um impacto',echo:'ECHO · use X/J, ♫ ACORDE ou botão esquerdo do controle'}[kind]);}
function deathPanel(){state='dead';panel('SÓ MAIS UM TAKE','O show continua','Retome do último checkpoint e encontre seu próximo timbre.',[{text:'TENTAR DE NOVO',fn:()=>{health=3;resetPlayer(checkpoint);updateHud();resume();}},{text:'MAPA DA TURNÊ',fn:()=>showMap('dead')}]);}

let devMode=false,devSequence='';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function rand(seed){return()=>{seed=(Math.imul(1664525,seed)+1013904223)|0;return(seed>>>0)/4294967296;};}
function persist(){try{localStorage.setItem('hands-world-v1',JSON.stringify(save));}catch(e){}}
function makeLevel(n){
 const r=rand(329+n*7919),width=8000+n*480,terrain=[],platforms=[],pickups=[],enemies=[],checkpoints=[],gaps=[],traps=[];
 let end=0,section=0;
 while(end<width){const length=section===0?1100:600+Math.floor(r()*330),right=Math.min(width,end+length);terrain.push({x:end,y:G,w:right-end,h:130,type:'ground'});end=right;if(end<width-850){const wide=section%3===1;const gap=wide?360+n*12:106+Math.floor(r()*35)+Math.min(n*2,18);gaps.push({x:end,w:gap,wide});end+=gap;}section++;}
 if(terrain.at(-1).x+terrain.at(-1).w<width)terrain.push({x:width-500,y:G,w:500,h:130,type:'ground'});
 // A broad final landing ensures the collectible and portal always have solid ground.
 terrain.push({x:width-620,y:G,w:620,h:130,type:'ground'});
 const onGround=(x,margin=0)=>terrain.some(t=>x>=t.x+margin&&x<=t.x+t.w-margin);
 for(let x=370;x<width-680;x+=240+Math.floor(r()*105)){
  if(!onGround(x,n>=5?260:210))continue;
  const type=(Math.floor(x/320)+n)%4,py=G-(type===2?166:106+Math.floor(r()*20));
  if(type===2){platforms.push({x:x-85,y:G-102,w:74,h:22,type:'pedalboard',color:0});}
  platforms.push({x,y:py,w:90+(n%3)*12,h:26,type:'pedalboard',color:(section+++n)%5,moving:false,baseX:x,phase:r()*6});
  for(let j=0;j<3;j++)pickups.push({x:x+15+j*27,y:py-35,w:21,h:25,taken:false});
  if(type!==2&&onGround(x+130,160))platforms.push({x:x+115,y:G-68,w:44,h:68,type:'guitar',color:(section+n)%3});
 }
 for(const gap of gaps.filter(g=>g.wide)){
  const pw=116-n*2, minX=gap.x+12,maxX=gap.x+gap.w-pw-12;
  platforms.push({x:minX,y:G-28,w:pw,h:24,type:'pedalboard',color:(n+Math.floor(gap.x/1000))%3,moving:true,minX,maxX,baseX:(minX+maxX)/2,amplitude:(maxX-minX)/2,phase:-Math.PI/2,rate:.72+n*.035,gap});
  for(let k=0;k<5;k++)pickups.push({x:gap.x+34+k*(gap.w-60)/4,y:G-88,w:21,h:25,taken:false});
 }
 for(const t of terrain){
  if(t.x>0){for(let k=0;k<3;k++)pickups.push({x:t.x-65+k*30,y:G-105-Math.sin(k/2*Math.PI)*23,w:21,h:25,taken:false});}
  for(let x=Math.max(t.x+210,790);x<t.x+t.w-210&&x<width-620;x+=105+Math.floor(r()*35)-n*2){
   if(platforms.some(p=>p.type==='guitar'&&Math.abs(p.x-x)<80))continue;
   enemies.push({x,y:G-30,w:34,h:30,lo:Math.max(t.x+180,x-100),hi:Math.min(t.x+t.w-210,x+120),dir:r()>.5?1:-1,speed:48+n*6,type:n>=2&&(enemies.length+n)%5===0?'flyer':(enemies.length+n)%3===0?'noise':'cable',alive:true,phase:r()*6});
  }
  for(let x=t.x+150;x<t.x+t.w-60;x+=170){if(!platforms.some(p=>Math.abs(p.x-x)<80))pickups.push({x,y:G-48,w:21,h:25,taken:false});}
 }
 for(const t of terrain){
  if(t.x+t.w<950||t.x>width-1000)continue;
  const candidates=[t.x+t.w*.54];if(n>=5)candidates.push(t.x+t.w*.75);
  for(const x of candidates){if(x<900||x>width-700||x+64>t.x+t.w-165)continue;
   traps.push({x:Math.round(x),y:G-22,w:48+n*2,h:22,type:(traps.length+n)%2?'electric':'spikes',phase:r()*3,period:3.5-n*.08,active:false,warning:false});
  }
 }
 for(let x=1800;x<width-1000;x+=1800){const t=terrain.find(t=>t.x+t.w>x+130);if(t){const cx=Math.max(x,t.x+65);checkpoints.push({x:cx,y:G-74,w:20,h:74,active:false});enemies.forEach(e=>{if(Math.abs(e.x-cx)<160)e.alive=false;});}}
 for(const t of traps){for(let j=platforms.length-1;j>=0;j--){const p=platforms[j];if(!p.moving&&p.x+p.w>t.x-100&&p.x<t.x+t.w+100)platforms.splice(j,1);}for(const c of pickups)if(c.x>t.x-80&&c.x<t.x+t.w+80)c.y=G-105;}
 for(const cp of checkpoints){for(const t of traps)if(Math.abs(t.x-cp.x)<180)t.disabled=true;}
 // Patrols stay in their arena, away from the waiting area at moving crossings.
 for(const e of enemies){if(e.type==='flyer'){e.baseY=G-102;e.y=e.baseY;e.w=36;e.h=26;}}
 const powerups=[];
 for(let k=0;k<3;k++){const target=650+k*2300,t=terrain.find(t=>t.x+t.w>target+120);if(!t)continue;let px=Math.max(target,t.x+80);const obstacle=platforms.find(p=>p.type==='guitar'&&Math.abs(p.x-px)<85);if(obstacle)px=obstacle.x+obstacle.w+60;powerups.push({x:px,y:G-45,w:28,h:38,kind:['overdrive','shield','echo'][(k+n)%3],taken:false});for(const e of enemies)if(Math.abs(e.x-px)<100)e.alive=false;}
 enemies.forEach((e,i)=>{if(e.type==='cable'&&i%5===1)e.type='plug';else if(e.type==='cable'&&i%5===3&&n>=1)e.type='amp';e.cooldown=2+(i%3);e.charge=0;});
 return{width,terrain,platforms,pickups,enemies,checkpoints,gaps,powerups,traps:traps.filter(t=>!t.disabled),board:{x:width-360,y:G-53,w:92,h:45},door:{x:width-145,y:G-105,w:70,h:105},theme:THEMES[n]};
}
function resetPlayer(x=80){player={x,y:G-76,w:32,h:76,stride:0,vx:0,vy:0,face:1,grounded:false};coyote=0;keys={};jumpBuffer=0;attackCooldown=0;waves=[];enemyShots=[];power=null;powerTime=0;confused=0;poseTime=0;invuln=2;}
function loadLevel(n){levelIndex=n;level=makeLevel(n);health=3;checkpoint=80;hasBoard=false;levelCoins=0;deathCount=0;runTime=0;cam=0;particles=[];effects=[];shake=0;deathDelay=0;resetPlayer();$('worldNumber').textContent=String(n+1).padStart(2,'0')+' / 10';$('worldName').textContent=THEMES[n].name.toUpperCase();$('belowTitle').textContent=String(n+1).padStart(2,'0')+' — '+THEMES[n].name;updateHud();}
function start(n=0){if(window.HandsModern&&(!window.HandsModern.frames.hero||!window.HandsModern.frames.enemies)){toast('Preparando os instrumentos…');window.HandsModern.ready.then(()=>{if(window.HandsModern.frames.hero&&window.HandsModern.frames.enemies)start(n);else toast('Não foi possível carregar a arte. Atualize a página.');});return;}loadLevel(n);state='playing';$('overlay').classList.add('hidden');$('hud').classList.remove('hidden');canvas.focus();toast(THEMES[n].sub);audio.init();}
function updateHud(){$('coinCount').textContent=String(coins).padStart(3,'0');$('hearts').textContent='♥ '.repeat(health)+'♡ '.repeat(3-health);$('hearts').setAttribute('aria-label',health+' vidas');}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');toastTime=3;}
function burst(x,y,color,count=12){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*180,life:.4+Math.random()*.5,color,size:2+Math.floor(Math.random()*3)});}
function hit(fall=false){
 if(state!=='playing'||(invuln>0&&!fall))return;
 if(power==='shield'&&!fall){power=null;powerTime=0;invuln=1;effect(player.x+13,player.y+24,'star','#8ce8ff',14);audio.fx('coin');toast('SHIELD · impacto absorvido');return;}
 health--;updateHud();deathCount++;audio.fx('hurt');pose='hurt';poseTime=.48;shake=.25;effect(player.x+13,player.y+30,'star','#ffd181',9);
 if(health<=0){if(fall)player.y=H-90;state='dying';deathDelay=.7;poseTime=.7;return;}
 if(fall){resetPlayer(checkpoint);effect(player.x+13,player.y+player.h,'ring','#ffe6bc',1);toast('De volta ao checkpoint. Você consegue!');}
 else{invuln=1.8;player.vy=-340;player.vx=-player.face*190;}updateHud();
}
function finish(){
 state='complete';audio.fx('win');const first=!save.completed.includes(levelIndex);if(first)save.completed.push(levelIndex);save.unlocked=Math.max(save.unlocked,Math.min(9,levelIndex+1));save.best=Math.max(save.best,coins);persist();
 if(levelIndex===9){victory();return;}
 panel(levelIndex===9?'TURNÊ COMPLETA · 10 / 10':'PEDALBOARD RESGATADO',levelIndex===9?'O mundo é seu palco.':'Esse timbre é seu.',`${THEMES[levelIndex].name} concluído. ${levelCoins} logos coletados em ${Math.floor(runTime/60)}min ${Math.floor(runTime%60)}s.`,[{text:levelIndex===9?'VER A TURNÊ':'PRÓXIMO MUNDO  →',fn:()=>levelIndex===9?showMap('complete'):start(levelIndex+1)},{text:'JOGAR NOVAMENTE',fn:()=>start(levelIndex)}],'<div class="reward-board"><canvas id="rewardCanvas" width="240" height="85"></canvas></div>');
 const rc=$('rewardCanvas').getContext('2d');drawBoard(rc,65,8,1.3);
}
function victory(){
 state='complete';
 panel('HANDS CUSTOM WORLD · TURNÊ COMPLETA','CONGRATULATIONS!','Você venceu os dez mundos, dominou o ruído e conquistou o seu lugar no palco. Este encore é seu.',[{text:'COPIAR CUPOM',fn:async()=>{try{await navigator.clipboard.writeText('HANDSWORLD');$('couponStatus').textContent='Cupom copiado!';}catch(e){$('couponStatus').textContent='Selecione o código HANDSWORLD e copie para usar na loja.';}}},{text:'MAPA DA TURNÊ',fn:()=>showMap('complete'),secondary:true}],'<div class="victory-art"><span>★</span><canvas id="victoryBoard" width="190" height="85"></canvas><span>★</span></div><div class="coupon"><small>SEU CUPOM DE DESCONTO</small><strong>HANDSWORLD</strong><span>Para usar na loja HANDS · condições definidas pela loja.</span></div><div id="couponStatus" role="status" class="coupon-status">O som não termina aqui.</div>');
 drawBoard($('victoryBoard').getContext('2d'),30,9,1.35);for(let i=0;i<6;i++)burst(cam+150+i*130,80,['#dafa74','#ffd08d','#f3a6ca'][i%3],30);
}
function panel(tag,title,desc,actions,content=''){toastTime=0;$('toast').classList.remove('show');$('titleScreen').classList.add('hidden');$('panel').classList.remove('hidden');$('overlay').classList.remove('hidden');$('panelTag').textContent=tag;$('panelTitle').textContent=title;$('panelText').textContent=desc;$('panel').dataset.kind=content.includes('victoryBoard')?'victory':content.includes('rewardCanvas')?'reward':'standard';$('panelContent').innerHTML=content;$('panelActions').replaceChildren();for(const a of actions){const b=document.createElement('button');b.className=a.secondary?'secondary':'primary';b.textContent=a.text;b.onclick=a.fn;$('panelActions').appendChild(b);}keys={};$('panelActions').querySelector('button')?.focus();}
function resume(){state='playing';$('overlay').classList.add('hidden');canvas.focus();keys={};}
function pause(){if(state==='playing'){state='paused';panel('PAUSA PARA AFINAR','O palco espera por você.','Seu progresso nesta fase está aqui. Respire e volte ao som.',[{text:'CONTINUAR  ▶',fn:resume},{text:'MUNDOS',fn:()=>showMap('paused'),secondary:true},{text:'REINICIAR FASE',fn:()=>start(levelIndex),secondary:true}]);}else if(state==='paused')resume();}
function backTo(s){if(s==='playing'||s==='paused')resume();else if(s==='dead'){state='dead';panel('MAIS UM TAKE','Pronto para voltar?','Retome a aventura no último checkpoint.',[{text:'TENTAR DE NOVO',fn:()=>{health=3;resetPlayer(checkpoint);updateHud();resume();}}]);}else{state='title';$('overlay').classList.remove('hidden');$('titleScreen').classList.remove('hidden');$('panel').classList.add('hidden');$('hud').classList.add('hidden');$('continueBtn').classList.toggle('hidden',save.unlocked===0);}}
function showMap(from=state){
 if(from==='map')from=previousState;
 previousState=from;state='map';
 const locked=i=>!devMode&&i>save.unlocked;
 const actions=[{text:'VOLTAR',fn:()=>backTo(from),secondary:true},...(save.completed.length===10?[{text:'VER RECOMPENSA',fn:victory}]:[])];
 if(devMode)actions.push({text:'SAIR DO MODO DEV',secondary:true,fn:()=>{devMode=false;devSequence='';showMap(from);}});
 panel(devMode?'MODO DESENVOLVEDOR':'O MUNDO É A SUA TURNÊ',devMode?'Escolha qualquer fase.':'Dez paradas. Um só som.',devMode?'Todas as fases estão disponíveis nesta sessão. Selecione o mundo que deseja jogar.':'Complete cada fase para liberar a próxima. Seu avanço é salvo neste navegador.',actions,'<div class="world-grid">'+THEMES.map((t,i)=>
 '<button class="world-tile" data-world="'+i+'" style="--world-x:'+(i%2*100)+'%;--world-y:'+(Math.floor(i/2)*25)+'%" '+(locked(i)?'disabled':'')+'><strong>'+(locked(i)?'♙':String(i+1).padStart(2,'0'))+'</strong><small>'+t.name+'</small><small>'+(save.completed.includes(i)?'✓ CONCLUÍDO':locked(i)?'BLOQUEADO':'EXPLORAR →')+'</small></button>').join('')+'</div>');
 document.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>start(+b.dataset.world));
}
function detectDeveloperCode(e){
 if(e.repeat)return false;
 const target=e.target;
 if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target?.tagName)){devSequence='';return false;}
 if(!/^Digit[0-9]$/.test(e.code)){devSequence='';return false;}
 devSequence=(devSequence+e.code.slice(5)).slice(-4);
 if(devSequence!=='4359')return false;
 devSequence='';devMode=true;showMap();e.preventDefault();return true;
}
function help(){const old=state;previousState=old;state='help';panel('MANUAL DA TURNÊ','Encontre seu ritmo.','Pegue o pedalboard HANDS no final de cada fase e entre na porta para viajar ao próximo mundo.',[{text:'ENTENDI  ▶',fn:()=>backTo(old)}],'<div class="help-grid"><div><b>← → ou A / D · Mover</b>Segure Shift para correr. No celular, use os botões da tela e segure » para correr.</div><div><b>Espaço, ↑ ou W · Pular</b>Segure para saltar mais alto. Nos grandes abismos, espere o pedalboard móvel se aproximar.</div><div><b>X ou J · Acorde</b>PC: X ou J. Celular: ♫ ACORDE. Controle: botão de face esquerdo (X no padrão Xbox). Segure para repetir.</div><div><b>Controle USB / Bluetooth</b>Direcional ou analógico move. Botão inferior pula, esquerdo toca acorde, direito corre e Start pausa. Use Configurar controle para modelos retrô.</div><div><b>Pedais especiais · 18 segundos</b>Vermelho: Overdrive, acordes maiores. Azul: Shield, absorve um impacto. Roxo: Echo, repete cada acorde. Pegue o pedal para ativar; use o mesmo botão de acorde para disparar. O escudo azul funciona automaticamente.</div><div><b>⚡ · Armadilhas</b>Pule os espinhos. Nas descargas, amarelo avisa e vermelho causa dano. 25 logos recuperam uma vida.</div></div>');}
const audio={ctx:null,enabled:false,next:0,beat:0,init(){if(!this.ctx){try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});},tone(freq,dur,type='square',volume=.025,delay=0){if(!this.enabled||!this.ctx)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur);},fx(name){const notes={coin:[880,1320],jump:[220,440],hit:[140,80],hurt:[160,100,65],board:[330,440,550,660],win:[330,440,550,660,880],chord:[196,247,294]}[name]||[440];notes.forEach((f,i)=>this.tone(f,.15,name==='chord'?'sawtooth':'square',.025,name==='chord'?0:i*.055));},tick(){if(!this.ctx||!this.enabled||state!=='playing')return;if(this.ctx.currentTime<this.next)return;this.next=this.ctx.currentTime+.22;const notes=THEMES[levelIndex].notes,degree=notes[[0,2,1,2,3,2,1,2][this.beat%8]],root=levelIndex%3===0?164.81:146.83;this.tone(root*2**(degree/12),.18,'triangle',.032);if(this.beat%4===0)this.tone(root/2,.36,'triangle',.05);if(this.beat%2===0)this.tone(70,.05,'sine',.04);this.beat++;}};
function attack(){if(attackCooldown>0)return;attackCooldown=power==='overdrive'?.38:.82;pose='attack';poseTime=.28;audio.fx('chord');const drive=power==='overdrive';const life=drive?.72:.48;waves.push({x:player.x+13,y:player.y+player.h-(drive?64:40),w:drive?52:32,h:drive?64:40,dir:player.face,life,maxLife:life,speed:drive?560:430});if(power==='echo')waves.push({x:player.x+13,y:player.y+player.h-40,w:32,h:40,dir:player.face,life:.62,maxLife:.62,speed:430,delay:.14});effect(player.x+13,player.y+22,'star','#ffda84',3);}
function update(dt){
 time+=dt;if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}particles=particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;return p.life>0;});
 effects=effects.filter(e=>{e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=90*dt;return e.life>0;});for(const e of level.enemies)if(e.deathLife)e.deathLife=Math.max(0,e.deathLife-dt);
 poseTime=Math.max(0,poseTime-dt);shake=Math.max(0,shake-dt);
 if(state==='dying'){deathDelay-=dt;if(deathDelay<=0)deathPanel();return;}
 if(state!=='playing')return;runTime+=dt;powerTime=Math.max(0,powerTime-dt);if(!powerTime)power=null;confused=Math.max(0,confused-dt);
 if($('powerStatus')){$('powerStatus').textContent=power?({overdrive:'ϟ OVERDRIVE',shield:'◈ SHIELD',echo:'♫ ECHO'}[power]+' · '+Math.ceil(powerTime)+'s'):'SEM PEDAL ESPECIAL';$('powerStatus').dataset.power=power||'';}
 invuln=Math.max(0,invuln-dt);attackCooldown=Math.max(0,attackCooldown-dt);jumpBuffer=Math.max(0,jumpBuffer-dt);audio.tick();
 const direction=(keys.ArrowRight||keys.KeyD||padInput.right?1:0)-(keys.ArrowLeft||keys.KeyA||padInput.left?1:0),speed=(keys.ShiftLeft||keys.ShiftRight||padInput.run?330:260)*(confused>0?.65:1);
 player.vx+=(direction*speed-player.vx)*Math.min(1,dt*(player.grounded?15:9));if(direction)player.face=direction;
 if(player.grounded)coyote=.11;else coyote=Math.max(0,coyote-dt);
 if(jumpBuffer>0&&coyote>0){player.vy=-665;player.grounded=false;coyote=0;jumpBuffer=0;audio.fx('jump');effect(player.x+13,player.y+player.h,'dust','#f4dfb7',6);}
 if(keys.KeyX||keys.KeyJ||padInput.attack)attack();
 const solids=[...level.terrain,...level.platforms];
 for(const p of level.platforms){if(p.moving){const old=p.x;p.x=p.baseX+Math.sin(runTime*p.rate+p.phase)*p.amplitude;p.dx=p.x-old;if(player.grounded&&Math.abs(player.y+player.h-p.y)<2&&player.x+player.w>old&&player.x<old+p.w)player.x+=p.dx;}}
 const strideX=player.x;player.x+=player.vx*dt;for(const s of solids)if(overlap(player,s)){if(player.vx>0)player.x=s.x-player.w;else if(player.vx<0)player.x=s.x+s.w;player.vx=0;}
 player.x=clamp(player.x,0,level.width-player.w);if(player.grounded)player.stride+=Math.abs(player.x-strideX)/80;const oldY=player.y,wasGrounded=player.grounded,fallSpeed=player.vy;player.vy+=1650*dt;player.y+=player.vy*dt;player.grounded=false;
 for(const s of solids)if(overlap(player,s)){if(player.vy>=0&&oldY+player.h<=s.y+3){player.y=s.y-player.h;player.vy=0;player.grounded=true;}else if(player.vy<0&&oldY>=s.y+s.h-3){player.y=s.y+s.h;player.vy=0;}}
 if(player.grounded&&!wasGrounded&&fallSpeed>180){pose='land';poseTime=.13;effect(player.x+13,player.y+player.h,'ring','#fff0cf',1);effect(player.x+13,player.y+player.h,'dust','#efd6b5',7);}
 if(player.y>H+100){hit(true);return;}
 for(const c of level.pickups)if(!c.taken&&overlap(player,c)){c.taken=true;coins++;levelCoins++;burst(c.x+10,c.y+10,'#f5f4b7',7);audio.fx('coin');if(coins%25===0&&health<3){health++;toast('25 logos · energia recuperada!');}updateHud();}
 for(const p of level.powerups)if(!p.taken&&overlap(player,p)){p.taken=true;acquire(p.kind);}
 for(const t of level.traps){const phase=(runTime+t.phase)%t.period;t.active=t.type==='spikes'||phase>t.period*.57;t.warning=t.type==='electric'&&!t.active&&phase>t.period*.42;if(t.active&&overlap(player,{x:t.x+4,y:t.y+4,w:t.w-8,h:t.h-4}))hit();}
 if(state!=='playing')return;
 for(const e of level.enemies){if(!e.alive)continue;
  e.cooldown-=dt;e.charging=false;
  if(e.type==='flyer'){const swoop=(runTime+e.phase)%4;e.y=e.baseY+Math.sin(runTime*2.5+e.phase)*22+(swoop>2.8?Math.sin((swoop-2.8)/1.2*Math.PI)*50:0);}
  let speed=e.speed;
  if(e.type==='amp'){speed=12;e.charging=e.cooldown<.65;if(e.cooldown<=0){e.cooldown=3.6;if(Math.abs(e.x-player.x)<550)enemyShots.push({x:e.x+16,y:e.y+3,w:28,h:26,dir:player.x<e.x?-1:1,life:2.2,maxLife:2.2,hostile:true});}}
  if(e.type==='plug'){e.charging=e.cooldown<.5&&e.cooldown>0;if(e.cooldown<=0){e.charge=.7;e.cooldown=3.2;e.dir=player.x<e.x?-1:1;}if(e.charge>0){e.charge-=dt;speed=205;}else if(e.charging)speed=0;}
  e.x+=e.dir*speed*dt;if(e.x<e.lo||e.x>e.hi){e.x=clamp(e.x,e.lo,e.hi);e.dir*=-1;e.charge=0;}
  if(overlap(player,e)){if(player.vy>0&&oldY+player.h<=e.y+12){defeat(e);player.vy=-440;}else{const canHurt=invuln<=0&&power!=='shield';hit();if(e.type==='noise'&&canHurt){confused=1.5;toast('INTERFERÊNCIA · ritmo reduzido por um instante');}}}
  if(state!=='playing')return;
 }
 waves=waves.filter(w=>{if(w.delay>0){w.delay-=dt;return true;}w.x+=w.dir*(w.speed||430)*dt;w.life-=dt;for(const e of level.enemies)if(e.alive&&overlap(w,e))defeat(e);return w.life>0;});
 enemyShots=enemyShots.filter(w=>{w.x+=w.dir*185*dt;w.life-=dt;if(overlap(w,player)){hit();return false;}return w.life>0&&!level.platforms.some(p=>p.type==='guitar'&&overlap(w,p));});
 for(const c of level.checkpoints)if(!c.active&&player.x>c.x){c.active=true;checkpoint=c.x;toast('CHECKPOINT · seu som está salvo aqui');audio.fx('coin');burst(c.x,c.y,'#dafa74',20);}
 if(!hasBoard&&overlap(player,level.board)){hasBoard=true;audio.fx('board');burst(level.board.x+45,level.board.y,'#ffdf84',35);toast('PEDALBOARD HANDS RESGATADO · entre na porta!');}
 if(hasBoard&&overlap(player,{...level.door,x:level.door.x+15,w:40})){finish();return;}
 cam+=(clamp(player.x-W*.36,0,level.width-W)-cam)*Math.min(1,dt*6);$('progress').style.width=(player.x/(level.width-160)*100)+'%';
}
// Every visual is drawn on a pixel grid; no stock character sprites or borrowed game assets.
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(Math.round(p[0]),Math.round(p[1])):c.moveTo(Math.round(p[0]),Math.round(p[1])));c.closePath();c.fill();}
function cloud(c,x,y,s=1,color='#eef1d0'){c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);rect(c,0,16,112,16,color);rect(c,14,5,80,25,color);rect(c,30,-5,36,31,color);rect(c,74,2,22,25,color);rect(c,8,32,99,6,'#ffffff28');rect(c,18,28,86,5,'#d0d9c155');rect(c,35,0,26,4,'#fffbe5aa');rect(c,15,10,16,4,'#fffbe580');c.restore();}
function mountain(c,x,y,w,h,col,snow=false){window.HandsArt.mountain(c,x,y,w,h,col,snow);}
function tree(c,x,y,s=1,kind='forest'){window.HandsArt.tree(c,x,y,s,kind);}
function building(c,x,y,w,h,t){rect(c,x,y-h,w,h,t.near);rect(c,x+6,y-h-7,w-12,7,t.far);rect(c,x+8,y-h+8,3,h-8,'#ffffff0a');for(let row=0;row<h-20;row+=22)for(let col=12;col<w-10;col+=19){if((row+col)%4)rect(c,x+col,y-h+15+row,7,11,(row+col)%3?'#dbbd8860':'#8ad6c3');}if(t.kind==='city'){rect(c,x+13,y-h+30,w-26,25,'#ed8fb8');rect(c,x+17,y-h+34,w-34,17,'#743c68');c.fillStyle='#ffcbd5';c.font='bold 9px monospace';c.fillText('LIVE',x+22,y-h+46);}}
function background(){if(window.HandsModern){window.HandsModern.background(ctx,levelIndex,cam,time);return;}
 const t=level.theme,c=ctx;const grd=c.createLinearGradient(0,0,0,H);grd.addColorStop(0,t.sky);grd.addColorStop(1,t.horizon);c.fillStyle=grd;c.fillRect(0,0,W,H);
 const night=['city','cave','stage','mushroom'].includes(t.kind);
 if(night){for(let i=0;i<45;i++){let x=(i*113+43-cam*.03)%W;if(x<0)x+=W;rect(c,x,25+(i*73)%215,2,2,i%4===0?t.accent:'#d5ddca80');}}
 if(t.kind!=='cave'){rect(c,742-cam*.012,65,48,48,night?'#f7e5bd':'#f5edbf');rect(c,732-cam*.012,77,68,25,night?'#f7e5bd':'#f5edbf');if(night)rect(c,727-cam*.012,58,45,37,t.sky);}
 for(let layer=0;layer<2;layer++){let shift=cam*(layer===0?.12:.25),step=layer===0?420:380;for(let i=-2;i<5;i++){const x=i*step-(shift%step),y=layer===0?375:422,h=layer===0?185:155;if(t.kind==='city'||t.kind==='factory'||t.kind==='stage'){building(c,x+30,y,110+(i+2)%3*35,h+(i+3)%3*38,t);if(t.kind==='factory'){rect(c,x+165,y-240,25,240,t.far);cloud(c,x+150,y-275,.6,'#c3a3a135');}}else mountain(c,x,y,step+100,h+(i+2)%3*30,layer===0?t.far:t.near,t.kind==='snow');}}
 if(t.kind==='cave'){for(let i=0;i<12;i++){const x=i*100-(cam*.2%100);poly(c,[[x,0],[x+90,0],[x+65,60+(i%3)*30]],'#17283e');}}
 if(!night||t.kind==='mushroom')for(let i=-1;i<5;i++)cloud(c,i*310-((cam*.08+time*3)%310),64+(i+2)%3*34,.65+(i+2)%2*.2,night?'#c7a7c130':'#f0edceaa');
 if(t.kind==='beach'){rect(c,0,337,W,95,'#60b8ba');for(let i=0;i<18;i++)rect(c,(i*83+time*13)%1050-50,347+(i*13)%70,40+i%3*20,3,'#c5e4c960');}
 for(let i=-1;i<7;i++){const x=i*210-(cam*.5%210),kind=t.kind;if(['forest','mushroom','snow','beach','sky'].includes(kind))tree(c,x,443,.7+(i+1)%3*.15,kind);else if(kind==='desert'){rect(c,x+50,340,15,105,'#6d8b68');rect(c,x+28,371,33,14,'#6d8b68');rect(c,x+28,351,10,29,'#6d8b68');rect(c,x+61,357,25,12,'#6d8b68');rect(c,x+76,335,10,28,'#6d8b68');}else if(kind==='cave'){poly(c,[[x+40,442],[x+20,390],[x+35,353],[x+54,381],[x+66,433]],'#618caf');poly(c,[[x+42,439],[x+35,353],[x+54,381],[x+66,433]],'#91d4d2');}else if(kind==='stage'){poly(c,[[x,440],[x+55,100],[x+95,440]],i%2?'#c8efa311':'#ed94d622');}}
 // A distant viaduct gives depth and recognizable architecture to the landscape.
 if(['forest','desert','sky','beach'].includes(t.kind)){
  const xx=630-(cam*.18%1250),yy=331;rect(c,xx,yy,270,7,'#b8b39a55');for(let j=0;j<6;j++){rect(c,xx+j*48,yy+7,12,62,'#a6ac9766');rect(c,xx+j*48+2,yy+7,3,62,'#e1d6b555');}rect(c,xx,yy-6,270,3,'#d5c9a355');
 }
 // Distant birds and flowers give the landscape life without competing with play.
 if(!night){for(let i=0;i<4;i++){const x=(i*247+time*9-cam*.06)%1100;rect(c,x,155+i%2*18,6,2,t.far);rect(c,x+8,153+i%2*18,6,2,t.far);}}
}
function drawGround(s){if(window.HandsModern){window.HandsModern.ground(ctx,s,cam,level.theme);return;}const c=ctx,t=level.theme,x=s.x;rect(c,x,s.y,s.w,s.h,t.dirt);rect(c,x,s.y,s.w,10,t.grass);rect(c,x,s.y+10,s.w,5,'#26382c60');for(let p=Math.max(s.x,Math.floor(cam/32)*32);p<s.x+s.w&&p<cam+W+32;p+=32){const i=Math.floor(p/32);rect(c,p+3,G+22+(i%3)*13,12,5,'#e5bd7a35');rect(c,p+16,G+55+(i%2)*19,8,5,'#342f3d45');rect(c,p+5,G-3,4,4,t.grass);if(i%5===0&&['forest','beach','sky','mushroom'].includes(t.kind)){rect(c,p+8,G-14,2,14,'#477d55');rect(c,p+4,G-16,10,5,i%2?'#f6ddb5':'#edb3af');rect(c,p+7,G-18,4,9,'#f4df9b');}}}

function drawPedalboard(p){
 const variant=p.color%3===2?'vtx':p.color%3===1?'dark':'teak';
 window.HandsArt.board(ctx,p.x,p.y,p.w,p.h,variant);
 if(p.moving){for(let j=0;j<3;j++)rect(ctx,p.x+20+j*(p.w-40)/2,p.y+p.h+13+Math.sin(time*5+j)*2,8,2,'#b9ffe499');}
}
function drawGuitar(c,x,y,w,h,col=0){window.HandsArt.guitar(c,x,y,w,h,col);}
function drawHand(c,x,y,size=25,color='#fff6c4'){if(window.HandsModern){window.HandsModern.hand(c,x,y,size);return;}c.save();c.translate(Math.round(x),Math.round(y));c.scale(size/32,size/32);for(let yy=0;yy<32;yy+=2)for(let xx=0;xx<32;xx+=2){const d=Math.hypot(xx+1-16,yy+1-16);if(d>12&&d<16)rect(c,xx,yy,2,2,color);}rect(c,11,14,12,12,color);rect(c,10,8,3,13,color);rect(c,14,5,3,15,color);rect(c,18,7,3,14,color);rect(c,22,10,3,12,color);rect(c,7,17,5,6,color);rect(c,5,15,3,5,color);rect(c,12,25,9,2,color);c.restore();}
function drawBoard(c,x,y,s=1){c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);window.HandsArt.board(c,0,0,96,28,'teak');c.restore();}
function drawPlayer(){if(window.HandsModern){ctx.save();if(invuln>0&&state==='playing')ctx.globalAlpha=.7+Math.sin(time*24)*.3;window.HandsModern.hero(ctx,player,time,state==='complete'?'win':poseTime>0?pose:'',power);ctx.restore();return;}if(invuln>0&&Math.floor(time*14)%2===0&&state==='playing')return;window.HandsArt.hero(ctx,player,time,hasBoard);}
function drawEnemy(e){if(window.HandsModern){window.HandsModern.enemy(ctx,e,time,!e.alive);return;}const c=ctx,x=Math.round(e.x),y=Math.round(e.y);if(e.type==='cable'){const step=Math.floor(time*8+e.phase)%2;rect(c,x+2,y+11,28,13,'#34424a');rect(c,x+6,y+7,20,20,'#464652');rect(c,x+9,y+12,14,9,'#1b3039');rect(c,x+12,y+14,8,5,'#7e7792');rect(c,x+1,y+24,10,4,'#c3a580');rect(c,x+25,y+23,10,4,'#c3a580');rect(c,x-2,y+21,5,5,'#a1b9ad');rect(c,x+31,y+19,5,6,'#a1b9ad');rect(c,x+7,y+27,7,3+step*2,'#293d43');rect(c,x+23,y+27,7,5-step*2,'#293d43');rect(c,x+8,y+7,6,3,'#ffad87');rect(c,x+21,y+7,6,3,'#ffad87');}else{const shake=Math.floor(time*12)%2*2;poly(c,[[x,y+10],[x+8,y+10],[x+5,y+2],[x+14,y+5],[x+19,y],[x+23,y+7],[x+32,y+4],[x+29,y+15],[x+35,y+22],[x+25,y+24],[x+23,y+30],[x+15,y+25],[x+5,y+29],[x+8,y+21],[x,y+22]],'#78547b');rect(c,x+5,y+10,24,12,'#b784a0');rect(c,x+9,y+13+shake,6,4,'#f9e3b1');rect(c,x+22,y+13-shake,5,4,'#f9e3b1');rect(c,x+15,y+22,8,3,'#443850');}}
function drawPortal(){if(window.HandsModern){window.HandsModern.portal(ctx,level.door,level.board,hasBoard,time);return;}const c=ctx,d=level.door;rect(c,d.x-8,d.y-12,d.w+16,d.h+12,'#283e3c');rect(c,d.x-4,d.y-8,d.w+8,d.h+8,'#cead73');rect(c,d.x+3,d.y,d.w-6,d.h,'#294b48');rect(c,d.x+10,d.y+9,d.w-20,d.h-9,hasBoard?'#bddc8a':'#152f37');if(hasBoard){for(let i=0;i<7;i++)rect(c,d.x+13+i*6,d.y+11,4,d.h-13,i%2?'#f5efb080':'#96c59480');}else{rect(c,d.x+15,d.y+15,d.w-30,22,'#375752');rect(c,d.x+15,d.y+45,d.w-30,48,'#375752');}rect(c,d.x+51,d.y+54,5,5,'#f1d28c');rect(c,d.x-12,d.y-32,d.w+24,17,'#344a43');c.fillStyle='#f5e9ba';c.font='bold 9px monospace';c.textAlign='center';c.fillText(hasBoard?'PRÓXIMO →':'BACKSTAGE',d.x+d.w/2,d.y-20);c.textAlign='left';if(!hasBoard){const b=level.board;rect(c,b.x-8,G-5,110,5,'#736444');drawBoard(c,b.x,b.y+Math.sin(time*3)*4);drawHand(c,b.x+36,b.y-31,19,'#f5efb0');}}
function draw(){
 ctx.clearRect(0,0,W,H);background();drawAtmosphere();ctx.save();ctx.translate(-Math.floor(cam)+(shake>0?Math.sin(time*75)*3:0),shake>0?Math.cos(time*60)*2:0);
 for(const s of level.terrain)if(s.x+s.w>cam&&s.x<cam+W){drawGround(s);drawTerrainDetails(s);}
 for(const p of level.platforms)if(p.x+p.w>cam-50&&p.x<cam+W+50)p.type==='pedalboard'?drawPedalboard(p):drawGuitar(ctx,p.x,p.y,p.w,p.h,p.color);
 for(const trap of level.traps)if(trap.x>cam-80&&trap.x<cam+W+80)drawTrap(trap);
 for(const c of level.pickups)if(!c.taken&&c.x>cam-30&&c.x<cam+W+30){const bob=Math.sin(time*3+c.x*.02)*3;drawHand(ctx,c.x,c.y+bob,24,level.theme.accent);rect(ctx,c.x+9,c.y+29,7,2,'#243f3f30');}
 for(const c of level.checkpoints)if(c.x>cam-40&&c.x<cam+W+30){rect(ctx,c.x,c.y,4,c.h,'#e8dec1');rect(ctx,c.x-6,G-5,16,5,'#3d5144');rect(ctx,c.x+4,c.y+2,34,23,c.active?'#dafa74':'#83a39b');drawHand(ctx,c.x+12,c.y+5,16,c.active?'#42674b':'#d5e1bc');}
 for(const e of level.enemies)if((e.alive||e.deathLife>0)&&e.x>cam-80&&e.x<cam+W+80){ctx.save();if(!e.alive)ctx.globalAlpha=e.deathLife/.7;drawEnemy(e);ctx.restore();}
 if(window.HandsModern){for(const p of level.powerups)if(!p.taken&&p.x>cam-50&&p.x<cam+W+50)window.HandsModern.pedal(ctx,p,time);for(const w of enemyShots)window.HandsModern.wave(ctx,w);for(const e of effects)window.HandsModern.effect(ctx,e);}
 if(level.door.x<cam+W+100)drawPortal();
 if(state!=='title'){if(player.grounded)rect(ctx,player.x-5,player.y+player.h-2,36,4,'#102b3c55');drawPlayer();}
 for(const w of waves){if(w.delay>0)continue;if(window.HandsModern){window.HandsModern.wave(ctx,w);continue;}ctx.globalAlpha=w.life/.48;for(let j=0;j<3;j++){rect(ctx,w.x+j*8*w.dir,w.y-j*5,3,30+j*10,'#e8ffa0');}ctx.globalAlpha=1;}
 for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);if(window.HandsModern)window.HandsModern.star(ctx,p.x,p.y,p.size,p.color,time);else rect(ctx,p.x,p.y,p.size,p.size,p.color);}ctx.globalAlpha=1;
 if(state==='title'&&!window.HandsModern){rect(ctx,85,G-65,4,65,'#bc9c64');rect(ctx,55,G-79,77,23,'#e3cc8d');ctx.fillStyle='#3b5547';ctx.font='bold 9px monospace';ctx.fillText('LET’S PLAY →',60,G-64);}
 ctx.restore();
 if(state==='title'&&window.HandsModern){window.HandsModern.sprite(ctx,'hero',0,735,512,340,false,-.04);}
 if(level.theme.kind==='snow'){for(let i=0;i<55;i++)rect(ctx,(i*73+time*15)%W,(i*53+time*28)%H,2,2,'#eff9e8b0');}
 if(level.theme.kind==='stage'){for(let i=0;i<24;i++)rect(ctx,(i*97+time*8)%W,(i*29+time*20)%H,3,5,['#dafa74','#ffadac','#9cd5e4'][i%3]);}
 // Fine scanlines tie the scene together while retaining a crisp pixel grid.
 if(confused>0){ctx.fillStyle='#b170ea15';ctx.fillRect(0,0,W,H);}
}

function drawAtmosphere(){if(window.HandsModern)return;
 const c=ctx,t=level.theme;
 // Hazy layered silhouettes, drifting pollen, and stage architecture.
 for(let i=0;i<26;i++){const x=((i*137-cam*.32+Math.sin(time*.3+i)*12)%1000+1000)%1000,y=175+(i*61)%245;rect(c,x,y,2+(i%2),2,t.kind==='forest'?'#f4edbb66':t.accent+'55');}
 for(let i=-1;i<4;i++){const x=i*400-(cam*.42%400);if(['city','stage','factory'].includes(t.kind)){rect(c,x+30,344,56,100,'#213641');rect(c,x+34,348,48,92,'#35444c');for(let k=0;k<2;k++){c.strokeStyle='#748277';c.lineWidth=3;c.strokeRect(x+42,355+k*41,31,31);rect(c,x+51,365+k*41,13,13,'#182e35');}rect(c,x+38,339,40,7,t.accent);}
 else if(['forest','mushroom','sky'].includes(t.kind)){for(let k=0;k<4;k++){rect(c,x+k*22,420-(k%2)*9,20,25,'#3e7451');rect(c,x+k*22+3,417-(k%2)*9,13,6,'#82ad6b');}}
 }
 c.fillStyle='#fbe3aa0a';c.fillRect(0,120,W,140);
}
function drawTerrainDetails(s){if(window.HandsModern)return;
 const c=ctx,t=level.theme;
 const left=Math.max(s.x,Math.floor(cam/24)*24),right=Math.min(s.x+s.w,cam+W+24);
 for(let x=left;x<right;x+=24){const k=Math.floor(x/24);rect(c,x,G+6,Math.min(22,s.x+s.w-x),2,'#e4efab66');rect(c,x+4,G+16,8,8,'#503b3c44');rect(c,x+12,G+29,10,3,'#e2bd8b44');rect(c,x,G+45+(k%3)*8,19,2,'#372f4240');rect(c,x+3,G+78,14,3,'#f2c98733');if(k%7===0){poly(c,[[x+2,G],[x-2,G-12],[x+4,G-7],[x+6,G-19],[x+9,G-8],[x+16,G-15],[x+12,G]],t.grass);rect(c,x+6,G-13,1,13,'#d4e7a388');}if(k%3===0){rect(c,x+5,G-8,2,8,t.grass);rect(c,x+10,G-12,2,12,t.grass);rect(c,x+14,G-6,2,6,t.grass);}}
 for(const edge of [s.x,s.x+s.w-7]){rect(c,edge,G+12,7,118,'#22363b50');for(let y=G+20;y<H;y+=16)rect(c,edge,y,4,7,'#ddba7c55');}
}
function drawTrap(t){
 const c=ctx;rect(c,t.x-3,G-7,t.w+6,7,'#26333e');
 for(let x=t.x;x<t.x+t.w;x+=12){rect(c,x,G-5,6,3,'#efb955');if(t.type==='spikes'){poly(c,[[x,G-7],[x+6,t.y],[x+12,G-7]],'#bdc9cd');poly(c,[[x+6,t.y],[x+12,G-7],[x+7,G-7]],'#718c9a');rect(c,x+5,t.y+5,2,7,'#f3f6dc');}}
 if(t.type==='electric'){
  rect(c,t.x,t.y+7,7,15,'#98a9af');rect(c,t.x+t.w-7,t.y+7,7,15,'#98a9af');
  rect(c,t.x+3,G-4,t.w-6,2,t.active?'#ff867d':t.warning?'#ffe392':'#7bc8b4');
  if(t.active){for(let x=t.x+6;x<t.x+t.w-6;x+=8)poly(c,[[x,t.y+15],[x+5,t.y-3+(Math.floor(time*16)%2)*5],[x+3,t.y+11],[x+10,t.y+6],[x+5,G-7]],'#fff0ae');}else if(t.warning){c.fillStyle='#ffe392';c.font='bold 13px monospace';c.fillText('!',t.x+t.w/2-3,t.y-9);}
 }
}

const jumpKeys=['Space','ArrowUp','KeyW'];
function press(code){if(jumpKeys.includes(code)&&!keys[code])jumpBuffer=.15;keys[code]=true;}
function release(code){keys[code]=false;if(jumpKeys.includes(code)&&player.vy<-250)player.vy=-250;}
window.addEventListener('keydown',e=>{if(detectDeveloperCode(e))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)&&state==='playing')e.preventDefault();if(e.repeat)return;if(e.code==='KeyP'||e.code==='Escape'){if(state==='playing'||state==='paused')pause();else if(state==='map'||state==='help')backTo(previousState);return;}if(state==='playing')press(e.code);});
window.addEventListener('keyup',e=>release(e.code));window.addEventListener('blur',()=>{keys={};devSequence='';if(state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(state==='playing')press(b.dataset.key);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,e=>{e.preventDefault();release(b.dataset.key);});});
$('startBtn').onclick=()=>{coins=0;start(0);};$('continueBtn').onclick=()=>start(save.unlocked);$('continueBtn').classList.toggle('hidden',save.unlocked===0);$('pauseBtn').onclick=pause;$('mapBtn').onclick=()=>showMap();$('helpBtn').onclick=help;
$('soundBtn').onclick=()=>{audio.init();audio.enabled=!audio.enabled;$('soundBtn').innerHTML='♫ <span>Som '+(audio.enabled?'on':'off')+'</span>';$('soundBtn').setAttribute('aria-pressed',String(audio.enabled));$('soundBtn').setAttribute('aria-label',audio.enabled?'Desativar som':'Ativar som');if(audio.enabled)audio.fx('coin');};
$('fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('arcade').requestFullscreen)await $('arcade').requestFullscreen();else {$('arcade').classList.toggle('mobile-expanded');document.body.classList.toggle('game-expanded');}}catch(e){toast('Tela cheia indisponível neste navegador.');}};
$('arcade').addEventListener('dblclick',()=>{if($('arcade').classList.contains('mobile-expanded')){$('arcade').classList.remove('mobile-expanded');document.body.classList.remove('game-expanded');}});
loadLevel(0);player.x=190;invuln=0;
if(window.HandsPad)window.HandsPad.init({input:v=>{padInput=v;},playing:()=>state==='playing',jump:()=>{jumpBuffer=.15;},cutJump:()=>{if(player.vy<-250)player.vy=-250;},pause:()=>{if(state==='playing')pause();},togglePause:()=>{if(state==='playing'||state==='paused')pause();else if(state==='map'||state==='help')backTo(previousState);},notice:toast});
let last=0,acc=0;function frame(t){if(document.hidden){last=t;acc=0;requestAnimationFrame(frame);return;}if(window.HandsPad)window.HandsPad.poll(t);if(!last)last=t;acc+=Math.min((t-last)/1000,.05);last=t;while(acc>=STEP){update(STEP);acc-=STEP;}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
// A test harness can capture the engine without adding cheat controls to the shipped interface.
if(typeof window.__captureHandsEngine==='function')window.__captureHandsEngine({makeLevel,THEMES,start,update,press,release,hit,finish,attack,draw,loadLevel,resume,victory,acquire,get:()=>({state,level,player,coins,health,checkpoint,hasBoard,cam,save,devMode,power,powerTime,enemyShots,effects,waves}),setPlayer:(v)=>Object.assign(player,v)});
})();






