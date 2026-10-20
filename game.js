import * as THREE from './three.module.min.js';
// ---------- renderer ----------
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc79a5c);scene.fog=new THREE.Fog(0xc79a5c,40,110);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,300);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;document.body.prepend(renderer.domElement);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
scene.add(new THREE.HemisphereLight(0xffe2b0,0x4a2e14,.95));
const sun=new THREE.DirectionalLight(0xffcf8a,1.3);sun.position.set(15,40,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-35,right:35,top:30,bottom:-10});scene.add(sun);
const BOX=new THREE.BoxGeometry(1,1,1),mats={};
const M=(c,e)=>{const k=c+'_'+(e||0);return mats[k]||(mats[k]=new THREE.MeshLambertMaterial({color:c,emissive:e||0}))};
function cube(p,x,y,z,sx,sy,sz,c,e){const m=new THREE.Mesh(BOX,M(c,e));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;p.add(m);return m}
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
// ---------- map ----------
const W=30;// arena x in [-W,W]
const plats=[];// {x0,x1,y,solid}
function plat(x0,x1,y,solidFloor){plats.push({x0,x1,y,solid:solidFloor});
 const rust=[0x8b3a1a,0xa0522d,0x7a3010];for(let x=x0;x<x1;x++)cube(scene,x+.5,y-.25,0,1,.5,2,solidFloor?(rnd()<.5?0x8a6438:0x7a5a34):rust[(rnd()*3)|0]);
 if(!solidFloor)for(let x=x0;x<x1;x+=2)cube(scene,x+.5,y-.6,0,.25,.3,1.6,0x4a1a08)}
for(let x=-W;x<W;x++)for(let d=1;d<4;d++)cube(scene,x+.5,-d+.5,0,1,1,2.2,0x6e4d2c);
plat(-W,W,0,true);
plat(-24,-10,4);plat(-4,4,4);plat(10,24,4);
plat(-18,-4,8);plat(4,18,8);
plat(-8,8,12);plat(-28,-21,10);plat(21,28,10);
const ladders=[{x:-12,y0:0,y1:4},{x:12,y0:0,y1:4},{x:-6,y0:4,y1:8},{x:6,y0:4,y1:8},{x:-2,y0:8,y1:12},{x:2,y0:8,y1:12},{x:-22,y0:4,y1:10},{x:22,y0:4,y1:10}];
for(const l of ladders){for(let y=l.y0;y<l.y1;y+=.5)cube(scene,l.x,y+.25,.6,.9,.08,.12,0x5a3a20);cube(scene,l.x-.45,(l.y0+l.y1)/2,.6,.1,l.y1-l.y0,.12,0x3c2a18);cube(scene,l.x+.45,(l.y0+l.y1)/2,.6,.1,l.y1-l.y0,.12,0x3c2a18)}
// walls / ruins scenery
for(let y=0;y<14;y++){cube(scene,-W-.5,y+.5,0,1,1,2.2,0x777066);cube(scene,W+.5,y+.5,0,1,1,2.2,0x777066)}
for(const[x,h]of[[-16,3],[-25,9],[0,3],[16,7],[26,9],[-8,6],[8,10]])for(let y=0;y<h;y++)for(let i=0;i<3;i++)if(!(y===h-1&&rnd()<.4))cube(scene,x+i-1,y+.5,-2.5,1,1,1,rnd()<.5?0x777066:0x8a8378);
for(let i=0;i<60;i++){const h=3+rnd()*16;cube(scene,rnd()*120-60,h/2-1,-18-rnd()*30,3+rnd()*5,h,3+rnd()*5,rnd()<.5?0x6d5a44:0x5c4a38)}
// rad barrels
for(const x of[-27,-14,15,27]){cube(scene,x,.6,-.6,.8,1.2,.8,0xc8b020);cube(scene,x,.6,-.6,.82,.15,.82,0x222222)}
// ---------- characters ----------
const CHARS=[
 {id:'dweller',name:'VAULT KID',desc:'Balanced. Special: Frag Grenade (arcing, explodes).',hp:100,spd:7.5,jmp:12.5,sp:'grenade',cd:4},
 {id:'brute',name:'MUTANT BRUTE',desc:'Huge & tough, slow. Special: Thrown Boulder (heavy arc).',hp:135,spd:6,jmp:11.5,sp:'boulder',cd:5,scale:1.25,melee:16},
 {id:'ghoul',name:'GLOW GHOUL',desc:'Fast & frail. Special: Radiation Blast (piercing orb).',hp:85,spd:8.6,jmp:13.2,sp:'rad',cd:4},
 {id:'paladin',name:'IRON PALADIN',desc:'Armored power suit. Special: Shoulder Missile (explodes).',hp:120,spd:6.4,jmp:11.5,sp:'missile',cd:5,scale:1.12},
 {id:'bot',name:'ASSAULT-BOT',desc:'Agile robot. Special: Head Laser Beam (instant).',hp:95,spd:8,jmp:13,sp:'beam',cd:4.5},
];
function buildChar(id){const g=new THREE.Group(),b=new THREE.Group();g.add(b);const P={};
 const L=(x,c)=>{const p=new THREE.Group();p.position.set(x,.75,0);cube(p,0,-.37,0,.26,.75,.3,c);b.add(p);return p};
 const A=(x,c,h)=>{const p=new THREE.Group();p.position.set(x,1.5,0);cube(p,0,-.3,0,.2,.65,.22,c);cube(p,0,-.68,0,.2,.15,.22,h);b.add(p);return p};
 if(id==='dweller'){cube(b,0,1.15,0,.62,.8,.4,0x2457c5);cube(b,0,1.15,.21,.12,.8,.02,0xf3c623);cube(b,0,.8,0,.64,.1,.42,0xf3c623);
  cube(b,0,1.82,0,.5,.5,.5,0xf1c27d);cube(b,0,2.12,0,.54,.16,.54,0xd9a02b);cube(b,.1,1.86,.26,.08,.08,.02,0x111111);cube(b,-.1,1.86,.26,.08,.08,.02,0x111111);cube(b,0,1.68,.26,.22,.05,.02,0x8a2a10);
  P.lL=L(-.16,0x2457c5);P.lR=L(.16,0x2457c5);P.aL=A(-.42,0x2457c5,0xf1c27d);P.aR=A(.42,0x2457c5,0xf1c27d);cube(P.aL,0,-.45,0,.22,.18,.24,0x333333)}
 if(id==='brute'){cube(b,0,1.2,0,.9,.9,.55,0x6f8f3a);cube(b,0,1.0,.05,.92,.3,.58,0x5a3a20);cube(b,0,1.88,.05,.5,.46,.5,0x6f8f3a);cube(b,0,1.75,.3,.36,.12,.04,0xeeeecc);
  cube(b,.12,1.95,.3,.08,.06,.02,0xffee00);cube(b,-.12,1.95,.3,.08,.06,.02,0xffee00);P.lL=L(-.22,0x4a3a28);P.lR=L(.22,0x4a3a28);P.aL=A(-.6,0x6f8f3a,0x6f8f3a);P.aR=A(.6,0x6f8f3a,0x6f8f3a);P.aL.scale.set(1.5,1.2,1.4);P.aR.scale.set(1.5,1.2,1.4)}
 if(id==='ghoul'){cube(b,0,1.15,0,.5,.8,.34,0x5b4a3a);cube(b,0,1.82,0,.44,.48,.44,0x8a7a4a);cube(b,0,1.75,.23,.3,.08,.02,0x2a1a10);
  cube(b,.1,1.9,.23,.09,.09,.02,0x88ff44,0x44aa00);cube(b,-.1,1.9,.23,.09,.09,.02,0x88ff44,0x44aa00);cube(b,.15,2.05,.1,.15,.1,.2,0x6a5a3a);
  P.lL=L(-.14,0x3d3428);P.lR=L(.14,0x3d3428);P.aL=A(-.36,0x8a7a4a,0x8a7a4a);P.aR=A(.36,0x8a7a4a,0x8a7a4a);P.glow=new THREE.PointLight(0x66ff33,1.5,4);P.glow.position.y=1.4;b.add(P.glow)}
 if(id==='paladin'){cube(b,0,1.18,0,.8,.85,.55,0x6b6e72);cube(b,0,1.2,.29,.4,.4,.04,0x8a2a10);cube(b,0,1.9,0,.55,.52,.55,0x5d6064);cube(b,0,1.9,.29,.42,.12,.02,0xffcc33,0x664400);
  cube(b,0,1.62,.3,.2,.14,.08,0x333333);cube(b,-.33,1.85,-.3,.3,.3,.5,0x444444);P.lL=L(-.2,0x5d6064);P.lR=L(.2,0x5d6064);P.aL=A(-.55,0x6b6e72,0x444444);P.aR=A(.55,0x6b6e72,0x444444);P.aL.scale.set(1.35,1,1.3);P.aR.scale.set(1.35,1,1.3)}
 if(id==='bot'){cube(b,0,1.2,0,.55,.7,.38,0xb8b8b0);cube(b,0,.82,0,.3,.2,.3,0x555555);cube(b,0,1.88,0,.5,.34,.4,0x9a9a92);cube(b,0,1.88,.21,.2,.2,.02,0xff3322,0xaa0000);
  cube(b,-.2,1.5,0,.2,.1,.4,0xc8b020);P.lL=L(-.15,0x777777);P.lR=L(.15,0x777777);P.aL=A(-.38,0x999999,0x555555);P.aR=A(.38,0x999999,0x555555);cube(P.aL,0,-.8,.08,.06,.25,.06,0xdddddd);cube(P.aR,0,-.8,.08,.06,.25,.06,0xdddddd)}
 const s=CHARS.find(c=>c.id===id).scale||1;g.scale.setScalar(s);return{g,b,...P}}
// ---------- weapons ----------
const WEAPONS={
 pistol:{name:'10mm Pistol',dmg:9,rate:.32,ammo:14,spd:30,w:6},
 usp:{name:'USP .45',dmg:14,rate:.45,ammo:10,spd:32,w:5},
 handmade:{name:'Handmade Rifle',dmg:8,rate:.11,ammo:30,spd:34,w:4},
 pipe:{name:'Pipe Gun',dmg:7,rate:.28,ammo:16,spd:26,spread:.06,w:6},
 shotgun:{name:'Combat Shotgun',dmg:6,rate:.8,ammo:8,spd:26,pellets:6,spread:.18,range:.45,w:3},
 laserp:{name:'Laser Pistol',dmg:11,rate:.38,ammo:18,spd:70,laser:0xff2222,w:3},
 laserr:{name:'Laser Rifle',dmg:18,rate:.65,ammo:12,spd:80,laser:0xff2222,w:2},
 plasma:{name:'Plasma Pistol',dmg:16,rate:.5,ammo:12,spd:18,plasma:true,w:2},
 nuke:{name:'Mini-Nuke Launcher',dmg:70,rate:1.5,ammo:1,spd:16,nuke:true,w:.6},
};
function buildGun(t){const g=new THREE.Group();const c=(x,y,z,sx,sy,sz,col,e)=>cube(g,x,y,z,sx,sy,sz,col,e);
 if(t==='pistol'){c(.2,0,0,.5,.12,.1,0x3a3a3a);c(0,-.15,0,.12,.25,.1,0x5a3a20)}
 if(t==='usp'){c(.22,.02,0,.55,.13,.1,0x1a1a1a);c(.22,-.06,0,.5,.05,.1,0x2e2e2e);c(0,-.17,0,.13,.28,.1,0x222222);c(.08,-.08,0,.1,.06,.02,0x111111)}
 if(t==='handmade'){c(.25,0,0,.7,.14,.12,0x4a4a48);c(.75,.02,0,.45,.06,.06,0x2a2a2a);c(-.3,-.03,0,.45,.16,.1,0x8b5a2b);c(.42,-.08,0,.3,.08,.1,0x8b5a2b);c(.18,-.2,0,.12,.28,.1,0x6b6b60);c(.1,.12,0,.2,.06,.06,0x333333);c(.48,.0,.07,.05,.1,.02,0xa0522d)}
 if(t==='pipe'){c(.3,0,0,.7,.08,.08,0x6a6a62);c(-.1,-.04,0,.3,.12,.08,0x8a6a3a);c(.05,-.15,0,.08,.2,.06,0x555550);c(.3,0,0,.1,.12,.12,0x8b3a1a)}
 if(t==='shotgun'){c(.3,0,0,.8,.14,.12,0x2e2e2e);c(.35,-.1,0,.6,.08,.1,0x3a3a3a);c(-.3,-.04,0,.45,.18,.1,0x6b4423);c(.05,-.2,0,.12,.25,.1,0x2e2e2e)}
 if(t==='laserp'){c(.2,0,0,.45,.15,.1,0x8a8a80);c(.48,0,0,.12,.1,.1,0xff3322,0xaa1100);c(0,-.16,0,.13,.26,.1,0x444444);c(.15,.1,0,.2,.05,.06,0xb08a40)}
 if(t==='laserr'){c(.3,0,0,.8,.15,.12,0x8a8a80);c(.75,0,0,.15,.1,.1,0xff3322,0xaa1100);c(-.3,-.03,0,.4,.16,.1,0x6b4423);c(.1,-.17,0,.12,.25,.1,0x444444);c(.3,.12,0,.35,.08,.08,0xb08a40)}
 if(t==='plasma'){c(.2,0,0,.45,.18,.12,0x3a4a3a);c(.25,.13,0,.2,.12,.12,0x44ff66,0x22aa33);c(.48,0,0,.1,.12,.12,0x22aa33,0x116611);c(0,-.17,0,.13,.26,.1,0x333333)}
 if(t==='nuke'){c(.2,0,0,.9,.28,.28,0x777a70);c(.7,0,0,.15,.4,.4,0x555555);c(-.2,-.2,0,.12,.3,.1,0x333333);c(.25,-.2,0,.12,.25,.1,0x333333);c(.2,.2,0,.3,.1,.1,0xc8b020)}
 return g}
// ---------- input ----------
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code.startsWith('Arrow')||e.code==='Space'||['Slash','Quote','Semicolon'].includes(e.code))e.preventDefault();onKey(e.code)});addEventListener('keyup',e=>keys[e.code]=false);
const CTRL=[{l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],pick:['KeyZ'],melee:['KeyE'],sp:['KeyQ'],fire:['KeyF']},
 {l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],pick:['Semicolon','Numpad3'],melee:['Period','Numpad1'],sp:['Comma','Numpad2'],fire:['Slash','Numpad0']}];
const down=(i,a)=>CTRL[i][a].some(k=>keys[k]);
const pressed=[{},{}];function onKey(code){for(let i=0;i<2;i++)for(const a in CTRL[i])if(CTRL[i][a].includes(code))pressed[i][a]=true;
 if(state==='select'){if(code==='KeyA')pick(0,-1);if(code==='KeyD')pick(0,1);if(code==='ArrowLeft')pick(1,-1);if(code==='ArrowRight')pick(1,1);if(code==='Enter')startMatch()}
 else if(state==='over'&&(code==='Enter'||code==='KeyR'))showSelect()}
// ---------- game state ----------
let state='select',choice=[0,1],players=[],projs=[],pickups=[],fx=[],wins=[0,0],round=1,roundT=0,spawnT=0,shake=0;
const $=id=>document.getElementById(id);
function renderSelect(){for(let i=0;i<2;i++){$('c'+(i+1)).innerHTML=CHARS.map((c,j)=>`<button class="${j===choice[i]?'on':''}" data-p="${i}" data-c="${j}">${c.name}</button>`).join('<br>');$('d'+(i+1)).textContent=CHARS[choice[i]].desc}
 document.querySelectorAll('#ov button[data-p]').forEach(b=>b.onclick=()=>{choice[+b.dataset.p]=+b.dataset.c;renderSelect();preview()})}
function pick(i,d){choice[i]=(choice[i]+d+CHARS.length)%CHARS.length;renderSelect();preview()}
$('go').onclick=()=>startMatch();
function preview(){for(const p of players)scene.remove(p.m.g);players=[0,1].map(i=>makePlayer(i,choice[i]))}
function makePlayer(i,ci){const ch=CHARS[ci],m=buildChar(ch.id);scene.add(m.g);
 return{i,ch,m,x:i?6:-6,y:12,vx:0,vy:0,face:i?-1:1,hp:ch.hp,ground:false,climb:false,gun:null,gunMesh:null,ammo:0,fireCD:0,meleeCD:0,meleeT:0,spCD:1,hurtT:0,dead:false,anim:0}}
function showSelect(){state='select';$('ov').style.display='flex';$('ov').querySelector('.box').innerHTML=selectHTML;renderSelect();$('go').onclick=()=>startMatch();preview()}
const selectHTML=$('ov').querySelector('.box').innerHTML;
function clearWorld(){for(const p of projs)scene.remove(p.mesh);for(const k of pickups)scene.remove(k.mesh);for(const f of fx)scene.remove(f.mesh);projs=[];pickups=[];fx=[]}
function startMatch(){if(state!=='select')return;wins=[0,0];round=1;$('ov').style.display='none';startRound()}
function startRound(){clearWorld();preview();players[0].x=-20;players[1].x=20;players[0].y=players[1].y=0;state='fight';roundT=0;spawnT=1;toast('ROUND '+round+' — FIGHT!');
 for(let k=0;k<2;k++)spawnPickup()}
let toastTO;function toast(s,ms=1400){$('toast').textContent=s;clearTimeout(toastTO);toastTO=setTimeout(()=>$('toast').textContent='',ms)}
// ---------- pickups ----------
const SPAWNS=[[-17,4],[17,4],[0,4],[-11,8],[11,8],[0,12],[-25,10],[25,10],[-5,0],[5,0]];
function spawnPickup(){if(pickups.length>=4)return;const free=SPAWNS.filter(s=>!pickups.some(p=>p.x===s[0]&&p.y===s[1]));if(!free.length)return;
 const s=free[(Math.random()*free.length)|0];const tot=Object.values(WEAPONS).reduce((a,w)=>a+w.w,0);let r=Math.random()*tot,t;
 for(const k in WEAPONS){r-=WEAPONS[k].w;if(r<=0){t=k;break}}t=t||'pistol';
 const mesh=new THREE.Group();const gm=buildGun(t);gm.scale.setScalar(1.5);mesh.add(gm);const crate=cube(mesh,0,-.55,0,.6,.1,.6,0x3f6633,0x114411);
 mesh.position.set(s[0],s[1]+1,0);scene.add(mesh);pickups.push({x:s[0],y:s[1],t,mesh,gm})}
// ---------- physics ----------
const PW=.6,PH=2.1;
function onLadder(p){return ladders.find(l=>Math.abs(p.x-l.x)<.6&&p.y>=l.y0-.05&&p.y<=l.y1+.05)}
function update(p,dt){const i=p.i,ch=p.ch;if(p.dead){p.vy-=30*dt;p.y+=p.vy*dt;if(p.y<0){p.y=0;p.vy=0}return}
 const ix=(down(i,'r')?1:0)-(down(i,'l')?1:0);if(ix&&p.meleeT<=0)p.face=ix;
 const lad=onLadder(p);
 if(lad&&(down(i,'u')&&p.y<lad.y1-.01||down(i,'d')&&p.y>lad.y0+.01))p.climb=true;
 if(p.climb){if(!lad){p.climb=false}else{p.vy=(down(i,'u')?5:0)-(down(i,'d')?5:0);p.x+=(lad.x-p.x)*.2;p.vx=ix*3;
   if(p.y>=lad.y1&&down(i,'u')){p.y=lad.y1;p.climb=false;p.vy=0}if(p.y<=lad.y0&&down(i,'d')){p.climb=false}}}
 if(!p.climb){p.vx+=(ix*ch.spd-p.vx)*Math.min(1,dt*(p.ground?16:6));p.vy-=30*dt;if(p.vy<-24)p.vy=-24;
  if(pressed[i].u&&p.ground&&!lad){p.vy=ch.jmp;p.ground=false}
  if(pressed[i].u&&p.ground&&lad&&p.y>=lad.y1-.05){p.vy=ch.jmp;p.ground=false}}
 const oy=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=Math.max(-W+.5,Math.min(W-.5,p.x));p.ground=false;
 if(!p.climb&&p.vy<=0)for(const pl of plats){if(p.x>pl.x0-.2&&p.x<pl.x1+.2&&oy>=pl.y-.01&&p.y<=pl.y){
   if(!pl.solid&&down(i,'d')&&!lad)continue;p.y=pl.y;p.vy=0;p.ground=true;break}}
 if(p.y<0){p.y=0;p.vy=0;p.ground=true}
 // actions
 p.fireCD-=dt;p.meleeCD-=dt;p.spCD-=dt;p.meleeT-=dt;p.hurtT-=dt;
 if(pressed[i].pick){const k=pickups.find(k=>Math.abs(k.x-p.x)<1.4&&Math.abs(k.y-p.y)<1.5);if(k){equip(p,k.t);scene.remove(k.mesh);pickups.splice(pickups.indexOf(k),1);toast('P'+(i+1)+': '+WEAPONS[k.t].name,900)}}
 if(pressed[i].melee&&p.meleeCD<=0){p.meleeCD=.45;p.meleeT=.2;const o=players[1-i];
  if(!o.dead&&Math.abs(o.y-p.y)<1.6&&(o.x-p.x)*p.face>-.2&&Math.abs(o.x-p.x)<1.6*(ch.scale||1))damage(o,ch.melee||11,p.face*9,6)}
 if(down(i,'fire')&&p.gun&&p.fireCD<=0&&!p.climb)fire(p);
 if(pressed[i].sp&&p.spCD<=0&&!p.climb){p.spCD=ch.cd;special(p)}}
function equip(p,t){if(p.gunMesh)p.m.aR.remove(p.gunMesh);p.gun=t;p.ammo=WEAPONS[t].ammo;p.gunMesh=buildGun(t);p.gunMesh.rotation.z=Math.PI/2;p.gunMesh.rotation.y=-Math.PI/2;p.gunMesh.position.set(0,-.72,.15);p.m.aR.add(p.gunMesh)}
function drop(p){if(p.gunMesh)p.m.aR.remove(p.gunMesh);p.gun=null;p.gunMesh=null}
const bulletMat=new THREE.MeshBasicMaterial({color:0xffee88});
function proj(o){const mesh=new THREE.Mesh(BOX,o.mat||bulletMat);mesh.scale.set(...(o.size||[.3,.08,.08]));scene.add(mesh);o.mesh=mesh;o.t=0;projs.push(o)}
function fire(p){const w=WEAPONS[p.gun];p.fireCD=w.rate;p.recoil=.12;const s=p.ch.scale||1,hx=p.x+p.face*.9*s,hy=p.y+1.35*s;
 const n=w.pellets||1;for(let k=0;k<n;k++){const a=(Math.random()-.5)*2*(w.spread||.015);
  const o={owner:p.i,x:hx,y:hy,vx:Math.cos(a)*w.spd*p.face,vy:Math.sin(a)*w.spd,dmg:w.dmg,kb:w.nuke?14:3,life:w.range||2};
  if(w.laser){o.mat=new THREE.MeshBasicMaterial({color:w.laser});o.size=[1.2,.08,.08]}
  if(w.plasma){o.mat=new THREE.MeshBasicMaterial({color:0x44ff66});o.size=[.35,.35,.35];o.life=3}
  if(w.nuke){o.mat=M(0xc8c8c0);o.size=[.6,.45,.45];o.grav=6;o.explode=4.5;o.life=4}
  proj(o)}
 flash(hx+p.face*.3,hy,w.laser?0xff4422:w.plasma?0x44ff66:0xffcc44,.4);
 if(--p.ammo<=0){drop(p);toast('P'+(p.i+1)+' OUT OF AMMO',700)}}
function special(p){const s=p.ch.scale||1,hx=p.x+p.face*.9*s,hy=p.y+1.6*s,f=p.face;p.meleeT=.3;
 switch(p.ch.sp){
  case 'grenade':proj({owner:p.i,x:hx,y:hy,vx:12*f,vy:9,grav:22,dmg:26,kb:10,explode:3,life:3,fuse:1.2,bounce:true,mat:M(0x3a5a2a),size:[.3,.35,.3]});break;
  case 'boulder':proj({owner:p.i,x:hx,y:hy+.5,vx:15*f,vy:7,grav:18,dmg:30,kb:13,life:3,mat:M(0x7a6a5a),size:[.9,.9,.9],spin:true,explode:1.6});break;
  case 'rad':proj({owner:p.i,x:hx,y:hy,vx:11*f,vy:0,dmg:22,kb:6,life:3,pierce:true,mat:new THREE.MeshBasicMaterial({color:0x66ff22,transparent:true,opacity:.75}),size:[1.1,1.1,1.1],pulse:true});break;
  case 'missile':proj({owner:p.i,x:hx,y:hy+.4,vx:22*f,vy:0,dmg:28,kb:12,life:2.5,explode:2.8,mat:M(0x888888),size:[.8,.22,.22],trail:true});break;
  case 'beam':{const o=players[1-p.i],y=p.y+1.85*s;let end=f>0?W:-W;
   if(!o.dead&&(o.x-p.x)*f>0&&y>o.y&&y<o.y+PH*(o.ch.scale||1)){end=o.x;damage(o,24,f*10,4)}
   const len=Math.abs(end-hx),m=cube(scene,(hx+end)/2,y,0,len,.18,.18,0xff3322,0xff2200);m.castShadow=false;fx.push({mesh:m,t:.25,beam:true});shake=.2}}}
function flash(x,y,c,t){const m=new THREE.Mesh(BOX,new THREE.MeshBasicMaterial({color:c,transparent:true}));m.position.set(x,y,0);m.scale.setScalar(.5);scene.add(m);fx.push({mesh:m,t,grow:3})}
function explode(o){flash(o.x,o.y,0xffaa22,.5);const r=o.explode;if(r>4){flash(o.x,o.y+2,0xffffaa,.9);shake=.7}else shake=Math.max(shake,.3);
 for(const q of players){const d=Math.hypot(q.x-o.x,q.y+1-o.y);if(!q.dead&&d<r)damage(q,o.dmg*(1-d/r*.5)*(q.i===o.owner?.5:1),Math.sign(q.x-o.x||1)*o.kb,o.kb*.7)}}
function damage(q,d,kx,ky){q.hp-=d;q.vx+=kx;q.vy=Math.max(q.vy,ky);q.climb=false;q.hurtT=.15;
 if(q.hp<=0&&!q.dead){q.hp=0;q.dead=true;drop(q);const w=1-q.i;wins[w]++;state='ko';roundT=0;
  toast(wins[w]>=3?'P'+(w+1)+' WINS THE MATCH!':'K.O.! P'+(w+1)+' TAKES ROUND '+round,2200)}}
function stepProjs(dt){for(const o of [...projs]){o.t+=dt;o.vy-=(o.grav||0)*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;let gone=o.t>o.life||Math.abs(o.x)>W;
  if(o.bounce&&o.vy<0)for(const pl of plats)if(o.x>pl.x0&&o.x<pl.x1&&o.y<pl.y+.15&&o.y-o.vy*dt>=pl.y){o.y=pl.y+.15;o.vy*=-.4;o.vx*=.6}
  if(o.fuse&&o.t>o.fuse)gone=true;
  if(!o.bounce&&o.grav&&o.y<.2)gone=true;
  const q=players[1-o.owner];if(!gone&&!q.dead&&Math.abs(o.x-q.x)<.45*(q.ch.scale||1)+.2&&o.y>q.y&&o.y<q.y+PH*(q.ch.scale||1)){
   if(o.explode){gone=true}else{damage(q,o.dmg,Math.sign(o.vx)*o.kb,2);if(!o.pierce)gone=true;else o.dmg=0}}
  if(gone){if(o.explode)explode(o);scene.remove(o.mesh);projs.splice(projs.indexOf(o),1);continue}
  o.mesh.position.set(o.x,o.y,0);if(o.vx<0&&!o.spin)o.mesh.rotation.y=Math.PI;if(o.spin)o.mesh.rotation.z-=dt*8;if(o.pulse)o.mesh.scale.setScalar(1+Math.sin(o.t*20)*.15);
  if(o.trail&&Math.random()<.6)flash(o.x-Math.sign(o.vx)*.5,o.y,0x999999,.3)}}
// ---------- HUD ----------
function hud(){players.forEach((p,i)=>{const w=p.gun?`${WEAPONS[p.gun].name} [${p.ammo}]`:'Fists';const sp=p.spCD<=0?'READY':p.spCD.toFixed(1)+'s';
 $('p'+(i+1)+'b').innerHTML=`P${i+1} · ${p.ch.name} · ${'★'.repeat(wins[i])}${'☆'.repeat(3-wins[i])}<div class="hp"><div style="width:${p.hp/p.ch.hp*100}%"></div></div>${Math.ceil(p.hp)}/${p.ch.hp} HP · ${w} · SPECIAL ${sp}`});
 $('mid').textContent=state==='select'?'':'ROUND '+round}
// ---------- loop ----------
let last=performance.now(),acc=0;const T=1/120;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(state==='fight'||state==='ko'){acc+=dt;while(acc>T){for(const p of players)update(p,T);stepProjs(T);for(const k of[0,1])pressed[k]={};acc-=T}
  spawnT-=dt;if(spawnT<=0&&state==='fight'){spawnPickup();spawnT=5+Math.random()*3}
  if(state==='ko'){roundT+=dt;if(roundT>2.5){if(Math.max(...wins)>=3){state='over';$('ov').style.display='flex';const w=wins[0]>=3?0:1;
    $('ov').querySelector('.box').innerHTML=`<div style="font-size:32px">PLAYER ${w+1} WINS!</div><br>${players[w].ch.name} dominates the wasteland ${wins[0]}–${wins[1]}.<br><br><button id="rs">[ REMATCH / CHARACTER SELECT ] (Enter / R)</button>`;$('rs').onclick=showSelect}
   else{round++;startRound()}}}}
 else{pressed[0]={};pressed[1]={};for(const p of players){p.vy-=30*dt;p.y=Math.max(0,p.y+p.vy*dt)}}
 for(const p of players){const m=p.m,s=Math.sin(now/90)*Math.min(1,Math.abs(p.vx)/5)*.8;m.g.position.set(p.x,p.y,0);
  m.g.rotation.y+=((p.face>0?1.2:-1.2)-m.g.rotation.y)*.25;
  if(p.climb){const c=Math.sin(p.y*3)*.6;m.lL.rotation.x=c;m.lR.rotation.x=-c;m.aL.rotation.x=-2.6+c;m.aR.rotation.x=-2.6-c;m.g.rotation.y=Math.PI}
  else{const air=p.ground?0:.5;m.lL.rotation.x=s+air;m.lR.rotation.x=-s-air;m.aL.rotation.x=-s;
   m.aR.rotation.x=p.meleeT>0?-1.6:p.gun?-1.5+(p.recoil>0?.35:0):s}
  p.recoil=(p.recoil||0)-dt;m.b.rotation.z=p.dead?(p.face>0?1.5:-1.5):0;m.b.position.y=p.dead?.35:0;
  m.b.visible=!(p.hurtT>0&&Math.floor(now/40)%2)}
 for(const k of pickups){k.gm.rotation.y+=dt*2;k.mesh.position.y=k.y+1+Math.sin(now/300)*.15}
 for(const f of [...fx]){f.t-=dt;if(f.grow){f.mesh.scale.multiplyScalar(1+dt*f.grow);f.mesh.material.opacity=Math.max(0,f.t*2)}if(f.t<=0){scene.remove(f.mesh);fx.splice(fx.indexOf(f),1)}}
 // camera frames both players
 const a=players[0],b=players[1],cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,span=Math.max(Math.abs(a.x-b.x),(Math.abs(a.y-b.y))*1.8);
 const tz=Math.max(20,Math.min(46,span*1.1+10));shake=Math.max(0,shake-dt);
 camera.position.x+=(cx*.8-camera.position.x)*.06+(Math.random()-.5)*shake;camera.position.y+=(cy+5-camera.position.y)*.06+(Math.random()-.5)*shake;camera.position.z+=(tz-camera.position.z)*.06;
 camera.lookAt(camera.position.x,camera.position.y-2.5,0);
 hud();renderer.render(scene,camera)}
renderSelect();preview();requestAnimationFrame(loop);
window.__game={get state(){return state},get players(){return players},get pickups(){return pickups},equip:(i,t)=>equip(players[i],t)};
