// weapons.js — Wasteland Brawl voxel weapons, projectiles, FX and props (drop-in for game.js weapon code)
// Conventions: 1 unit = 1 voxel-character block, fighters ~2u tall, +X forward, gun origin = right-hand grip anchor.
import * as THREE from './three.module.min.js';
export const GUN_VOX=1/16, PROP_VOX=.25;
// ---------- shared voxel kit (style of fight-maker/cf3d/kit.js: lit + glow instanced meshes, edge texture) ----------
let edgeTex=null;
function getEdge(){if(edgeTex||typeof document==='undefined')return edgeTex;const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,32,32);x.strokeStyle='rgba(0,0,0,.28)';x.lineWidth=2;x.strokeRect(1,1,30,30);x.fillStyle='rgba(255,255,255,.5)';x.fillRect(3,3,26,2);
 edgeTex=new THREE.CanvasTexture(c);edgeTex.magFilter=THREE.NearestFilter;return edgeTex}
let litM,glowM;const geos={};
function mats(){if(!litM){litM=new THREE.MeshStandardMaterial({color:0xffffff,map:getEdge(),roughness:.82,metalness:0});glowM=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false})}return[litM,glowM]}
class VB{constructor(v){this.v=v;this.m=new Map()}
 set(i,j,k,c,g){this.m.set(i+','+j+','+k,[i,j,k,c,g?1:0]);return this}
 box(i0,i1,j0,j1,k0,k1,c,g){for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)for(let k=k0;k<=k1;k++)this.set(i,j,k,typeof c==='function'?c(i,j,k):c,g);return this}
 cyl(i0,i1,jc,kc,r,c,g){for(let i=i0;i<=i1;i++)for(let j=-r;j<=r;j++)for(let k=-r;k<=r;k++)if(j*j+k*k<=r*r+.5)this.set(i,jc+j,kc+k,typeof c==='function'?c(i,j,k):c,g);return this}
 build(){const g=new THREE.Group(),v=this.v,[ml,mg]=mats(),geo=geos[v]||(geos[v]=new THREE.BoxGeometry(v,v,v)),L=[],G=[],Mx=new THREE.Matrix4(),C=new THREE.Color();
  for(const e of this.m.values())(e[4]?G:L).push(e);
  for(const[arr,mat,k]of[[L,ml,1],[G,mg,1.35]]){if(!arr.length)continue;const im=new THREE.InstancedMesh(geo,mat,arr.length);
   arr.forEach((e,n)=>{Mx.makeTranslation(e[0]*v,e[1]*v,e[2]*v);im.setMatrixAt(n,Mx);im.setColorAt(n,C.setHex(e[3]).multiplyScalar(k))});
   im.castShadow=im.receiveShadow=mat===ml;g.add(im)}return g}}
const hash=(a,b,c)=>{let h=(a*374761393+b*668265263+c*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296};
const vary=(cols)=>(i,j,k)=>cols[(hash(i,j,k)*cols.length)|0];
// ---------- weapon table (same keys/shape as game.js WEAPONS, plus extra fields) ----------
export const WEAPONS={
 pistol:  {name:'10mm Pistol',      dmg:9, rate:.32,ammo:14,spd:30,w:6, ammoType:'10mm',              proj:'bullet'},
 usp:     {name:'USP .45',          dmg:14,rate:.45,ammo:10,spd:32,w:5, ammoType:'.45 Round',         proj:'bullet'},
 handmade:{name:'Handmade Rifle',   dmg:8, rate:.11,ammo:30,spd:34,w:4, ammoType:'7.62mm',            proj:'bullet'},
 pipe:    {name:'Pipe Gun',         dmg:7, rate:.28,ammo:16,spd:26,spread:.06,w:6,ammoType:'.38 Round',proj:'bullet'},
 shotgun: {name:'Combat Shotgun',   dmg:6, rate:.8, ammo:8, spd:26,pellets:6,spread:.18,range:.45,w:3,ammoType:'Shotgun Shell',proj:'pellet'},
 laserp:  {name:'Laser Pistol',     dmg:11,rate:.38,ammo:18,spd:70,laser:0xff2222,w:3,ammoType:'Fusion Cell',proj:'laser'},
 laserr:  {name:'Laser Rifle',      dmg:18,rate:.65,ammo:12,spd:80,laser:0xff2222,w:2,ammoType:'Fusion Cell',proj:'laser'},
 plasma:  {name:'Plasma Pistol',    dmg:16,rate:.5, ammo:12,spd:18,plasma:true,w:2,ammoType:'Plasma Cartridge',proj:'plasma'},
 nuke:    {name:'Fat Man',          dmg:70,rate:1.5,ammo:1, spd:16,nuke:true,w:.6,ammoType:'Mini Nuke',proj:'nuke',grav:6,blast:4.5},
};
for(const k in WEAPONS)WEAPONS[k].id=k;
export const WEAPON_IDS=Object.keys(WEAPONS);
// ---------- voxel gun models (v=1/16; origin = top of grip; barrel along +X) ----------
const STEEL=[0x3a3a3a,0x343434,0x404040],BLUED=[0x1e1e22,0x222226,0x1a1a1c],WOOD=[0x8b5a2b,0x7d4f24,0x94622f],RUST=[0x8a5634,0x6a3e22,0x94603a,0x7a4a2a];
const MODELS={
 pistol(b){b.box(-1,8,0,2,-1,1,vary(STEEL)).box(-1,7,-1,-1,-1,1,0x2c2c2c).box(-1,1,-6,-1,-1,1,vary([0x5a3a20,0x4e321c]))
  .box(2,3,-3,-2,-1,1,0x2c2c2c).set(3,-3,0,0x2c2c2c).box(0,7,3,3,0,0,0x2a2a2a).set(7,4,0,0x2a2a2a).set(9,1,0,0x111111).set(-1,4,0,0x2a2a2a)},
 usp(b){b.box(-2,8,1,3,-1,1,vary(BLUED)).box(-1,8,-1,0,-1,1,0x2e2e2e).box(-1,1,-7,-2,-1,1,vary([0x222222,0x262626]))
  .box(2,4,-3,-2,-1,1,0x262626).set(9,2,0,0x0c0c0c).box(-2,-1,4,4,0,0,0x111111).set(7,4,0,0x111111).box(3,5,3,3,1,1,0x161616)},
 handmade(b){b.box(-2,8,-1,2,-1,1,vary([0x4a4a48,0x52524e,0x444440])).cyl(9,17,1,0,0,0x2a2a2a).box(9,13,-1,0,-1,1,vary(WOOD))
  .box(-11,-3,-2,1,-1,1,vary(WOOD)).box(-11,-10,-3,1,-1,1,0x5a3a1c).box(-1,1,-6,-2,-1,1,vary(WOOD)).box(3,5,-8,-2,-1,1,(i,j)=>0x6b6b60-((j+8)%2)*0x080808)
  .box(1,6,3,3,0,0,0x333333).box(2,4,4,4,0,0,0x2a2a2a).set(17,3,0,0x2a2a2a).box(4,7,0,1,2,2,0xa0522d).set(14,2,0,0xc8a040)},
 pipe(b){b.cyl(0,14,1,0,1,vary([0x6a6a62,0x5e5e58,0x74746a])).box(5,6,0,2,-1,1,vary(RUST)).box(13,14,0,2,-1,1,0x8b3a1a)
  .box(-8,-1,-1,2,-1,1,vary([0x8a6a3a,0x7a5a30])).box(-1,1,-6,-1,-1,1,0x555550).box(2,3,-3,-2,0,0,0x444440).box(-2,3,3,3,0,0,0x6a6a62)},
 shotgun(b){b.box(-2,7,-1,2,-1,1,vary([0x2e2e2e,0x333333])).cyl(8,18,1,0,0,0x2a2a2a).box(6,15,-1,0,-1,1,vary([0x3a3a3a,0x404040]))
  .box(9,12,-1,0,-2,2,vary(WOOD)).box(-12,-3,-3,1,-1,1,vary(WOOD)).box(-12,-11,-4,1,-1,1,0x4a2e16).box(-2,0,-7,-2,-1,1,vary(WOOD))
  .box(2,4,-3,-2,-1,1,0x262626).box(0,6,3,3,0,0,0x1e1e1e).box(5,7,1,1,2,2,0xb08a40)},
 laserp(b){b.box(-2,6,0,3,-1,1,vary([0x8a8a80,0x96968c])).box(-1,1,-6,-1,-1,1,0x3e3e3e).box(7,8,0,3,-1,1,vary([0x666660,0x5e5e58]))
  .box(9,11,0,3,-2,2,(i,j,k)=>(i===10)?0xb08a40:0x9a9a90).box(11,11,1,2,0,0,0xff3322,1).box(-5,-3,3,4,-1,1,0x5a8a3a).box(-4,-4,1,2,0,0,0x444444)
  .box(1,4,4,4,0,0,0xb08a40).box(2,3,-3,-2,0,0,0x333333).box(3,5,1,2,1,1,0xc8201e,1)},
 laserr(b){b.box(-2,8,0,3,-1,1,vary([0x8a8a80,0x96968c])).box(9,16,0,3,-1,1,vary([0x666660,0x5e5e58]))
  .box(17,19,0,3,-2,2,(i)=>(i===18)?0xb08a40:0x9a9a90).box(19,19,1,2,0,0,0xff3322,1).box(-12,-3,-1,2,-1,1,vary(WOOD)).box(-12,-11,-2,2,-1,1,0x4a2e16)
  .box(-1,1,-6,-1,-1,1,0x3e3e3e).box(10,14,-1,0,-1,1,vary(WOOD)).box(0,8,4,5,-1,1,0x707068).box(1,7,6,6,0,0,0xb08a40).box(3,5,1,2,1,1,0xc8201e,1)},
 plasma(b){b.box(-2,7,-1,3,-1,1,vary([0x3a4a3a,0x42523e])).box(-1,1,-7,-2,-1,1,0x2e2e2e).box(8,10,-1,3,-1,1,vary([0x50604e,0x4a5a48]))
  .box(11,12,-1,3,-2,2,0x667a62).box(12,12,1,2,0,0,0x44ff66,1).box(1,5,4,6,-1,1,(i,j,k)=>k===0&&j<6?0x44ff66:0x667a62,0)
  .box(2,4,5,5,0,0,0x44ff66,1).box(2,3,-3,-2,0,0,0x333333).box(-3,-2,4,4,0,0,0x2a2a2a)},
 nuke(b){b.box(-6,14,-2,3,-3,3,vary([0x7a7d72,0x777a70,0x6e7066])).box(14,16,-3,4,-4,4,0x555555).box(10,13,4,4,-1,1,0x555550)
  .box(-9,-7,-3,4,-4,4,0x4a4a44).box(-2,0,-8,-3,-1,1,0x333333).box(6,8,-7,-3,-1,1,0x333333).box(0,6,4,5,-2,2,0xc8b020).box(1,5,6,6,-1,1,0xc8b020)
  .box(-5,13,-1,0,4,4,0x3a3a3a).box(2,4,-2,-1,-4,-4,0xa0201a)},
};
export function buildWeapon(id){const b=new VB(GUN_VOX);(MODELS[id]||MODELS.pistol)(b);const inner=b.build(),g=new THREE.Group();g.add(inner);g.userData.kickNode=inner;g.name='weapon:'+id;g.userData.weaponId=id;
 g.userData.muzzle=new THREE.Vector3({pistol:.6,usp:.6,handmade:1.12,pipe:.94,shotgun:1.18,laserp:.76,laserr:1.26,plasma:.82,nuke:1.06}[id]||.6,id==='nuke'?.03:.08,0);return g}
export const createWeapon=buildWeapon,buildGun=buildWeapon; // buildGun = game.js name
// recoil: kicks the gun mesh back along -X and up; relaxed in updateWeapons
const recoiling=new Set();
export function recoil(mesh,amount){if(!mesh)return;const id=mesh.userData.weaponId,a=amount??(id==='nuke'?.35:id==='shotgun'?.22:id&&WEAPONS[id].laser?.06:.12);
 const n=mesh.userData.kickNode||mesh;if(!n.userData.rest)n.userData.rest={x:n.position.x,rz:n.rotation.z};n.userData.kick=Math.min(.4,(n.userData.kick||0)+a);recoiling.add(n)}
// ---------- scene binding (game.js helpers burst/flash/explode take no scene arg) ----------
let SCENE=null;export function setScene(s){SCENE=s}
const fx=[],projectiles=[],pending=[];
export function getProjectiles(){return projectiles}
const basic={};const BM=(c,t)=>{const k=c+(t?'t':'');return basic[k]||(basic[k]=new THREE.MeshBasicMaterial({color:c,transparent:!!t,toneMapped:false}))};
const BOXG=new THREE.BoxGeometry(1,1,1);
function addFx(scene,mesh,o){(scene||SCENE).add(mesh);o.mesh=mesh;o.scene=scene||SCENE;o.max=o.max||o.t;fx.push(o);return o}
const P3=(a,b,c)=>a&&a.isVector3?a.clone():new THREE.Vector3(a,b,c||0);
// burst(x,y,c,n,sz) / flash(x,y,c,t,s) keep game.js signatures; scene-first variants for the agreed API
export function burst(x,y,c,n,sz,scene,z=0){for(let k=0;k<n;k++){const m=new THREE.Mesh(BOXG,new THREE.MeshBasicMaterial({color:c,transparent:true,toneMapped:false}));m.scale.setScalar(sz*(.4+Math.random()*.6));m.position.set(x,y,z+(Math.random()-.5)*.6);
 addFx(scene,m,{t:.5+Math.random()*.4,max:.9,vx:(Math.random()-.5)*8,vy:Math.random()*8,vz:(Math.random()-.5)*4,deb:true})}}
export function flash(x,y,c,t,s=.5,scene,z=0){const m=new THREE.Mesh(BOXG,new THREE.MeshBasicMaterial({color:c,transparent:true,toneMapped:false}));m.position.set(x,y,z);m.scale.setScalar(s);addFx(scene,m,{t,max:t,grow:6})}
export function muzzleFlash(scene,pos,weaponId,dir=new THREE.Vector3(1,0,0)){const w=WEAPONS[weaponId]||WEAPONS.pistol,c=w.laser?0xff4422:w.plasma?0x44ff66:0xffcc44,big=w.nuke?1.6:w.pellets?1.3:1;
 const g=new THREE.Group();g.position.copy(pos);g.rotation.z=Math.atan2(dir.y,dir.x);
 for(const[x,s,col]of[[.06,.22,0xffffff],[.18,.18,c],[.3,.12,c],[.12,.1,c]]){const m=new THREE.Mesh(BOXG,BM(col,1));m.position.x=x*big;m.scale.setScalar(s*big);g.add(m)}
 if(!w.laser&&!w.plasma)for(const s of[-1,1]){const m=new THREE.Mesh(BOXG,BM(c,1));m.position.set(.14*big,s*.12*big,0);m.scale.setScalar(.08*big);g.add(m)}
 addFx(scene,g,{t:.07,grow:3,group:true});if(!w.laser&&!w.plasma)burst(pos.x-dir.x*.6,pos.y,0xd8b040,1,.08,scene,pos.z)}// + ejected brass
export function impact(scene,pos,kind='bullet'){const c={bullet:0xffd080,pellet:0xffd080,laser:0xff5533,plasma:0x66ff88,nuke:0xffaa22}[kind]||0xffd080;
 flash(pos.x,pos.y,c,.1,.3,scene,pos.z);burst(pos.x,pos.y,c,kind==='pellet'?1:3,.12,scene,pos.z);burst(pos.x,pos.y,0x8a6a48,2,.1,scene,pos.z)}
// dissolve: laser -> glowing-edged ash pile, plasma -> green goo puddle. obj = a character group (or any Object3D) or a Vector3.
export function dissolve(scene,obj,kind='ash'){const goo=kind==='goo'||kind==='plasma',pos=obj&&obj.isVector3?obj:new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld);
 const cols=goo?[0x44ff66,0x2ecc4a,0x8aff9a,0x1a7a2a]:[0x3a3530,0x2a2522,0x55504a,0xff6a22];
 if(obj&&!obj.isVector3)addFx(scene,new THREE.Group(),{t:1.2,target:obj,goo});
 for(let i=0;i<36;i++){const m=new THREE.Mesh(BOXG,BM(cols[i%4],1));const s=.08+Math.random()*.1;m.scale.setScalar(s);m.position.set(pos.x+(Math.random()-.5)*.8,pos.y+Math.random()*2,pos.z+(Math.random()-.5)*.5);
  addFx(scene,m,{t:1+Math.random()*.8,vx:(Math.random()-.5)*(goo?1:2),vy:goo?-1:Math.random()*1.5,vz:0,deb:true,settle:pos.y+s/2,keep:true})}
 const pile=new VB(.125);for(let i=-4;i<=4;i++)for(let k=-2;k<=2;k++){const h=goo?0:Math.max(0,2-Math.abs(i)/2-Math.abs(k)/2|0);if(goo&&i*i/16+k*k/4>1.1)continue;for(let j=0;j<=h;j++)pile.set(i,j,k,goo?(hash(i,j,k)<.3?0x8aff9a:0x2ecc4a):(j===h&&hash(i,k,j)<.25?0xff6a22:0x3a3530),goo||j===h&&hash(i,k,j)<.25)}
 const pm=pile.build();pm.position.set(pos.x,pos.y+.06,pos.z);pm.scale.y=.01;addFx(scene,pm,{t:6,rise:1,group:true})}
// mini-nuke: fireball, shock ring, voxel mushroom cloud (stem + cap shells)
export function nukeExplosion(scene,pos,r=4.5){flash(pos.x,pos.y,0xffffff,.3,r*.5,scene,pos.z);flash(pos.x,pos.y+1,0xffaa22,.8,r*.8,scene,pos.z);
 burst(pos.x,pos.y,0xff7a22,14,.45,scene,pos.z);burst(pos.x,pos.y,0x5a4a3a,10,.4,scene,pos.z);burst(pos.x,pos.y+1,0xfff0a0,20,.6,scene,pos.z);
 const ring=new THREE.Group();for(let a=0;a<28;a++){const m=new THREE.Mesh(BOXG,BM(0xffe0a0,1));m.scale.setScalar(.35);m.position.set(Math.cos(a/28*6.283),0,Math.sin(a/28*6.283));ring.add(m)}
 ring.position.set(pos.x,pos.y+.2,pos.z);addFx(scene,ring,{t:.7,ring:r*1.4,group:true});
 const b=new VB(.4),H=Math.round(r*1.8);const C=(j,o)=>j>H-2?(o?0xfff0a0:0xffb040):j>H-4?0xff7a22:0x8a5a3a;
 for(let j=0;j<H;j++){const rr=j<2?3:1.4;for(let i=-3;i<=3;i++)for(let k=-3;k<=3;k++)if(i*i+k*k<=rr*rr&&(i*i+k*k>(rr-1.2)**2||j===0))b.set(i,j,k,j<2?0x9a6a3a:(hash(i,j,k)<.5?0xc8783a:0xa85a2a),0)}
 for(let j=H;j<H+5;j++){const rr=[4.5,5.5,5.8,5,3.5][j-H];for(let i=-6;i<=6;i++)for(let k=-6;k<=6;k++){const d=i*i+k*k;if(d<=rr*rr&&(d>(rr-1.5)**2||j===H+4||j===H))b.set(i,j,k,j===H?0x5a3a2a:C(j-H+H-1+(j>H+2?2:0),hash(i,j,k)<.4),j>H+1&&hash(i,k,j)<.5)}}
 const cloud=b.build();cloud.position.set(pos.x,pos.y,pos.z);cloud.scale.setScalar(.05);addFx(scene,cloud,{t:3.2,mush:1,group:true})}
// ---------- projectiles ----------
const PROJ_LOOK={bullet:{size:[.3,.07,.07],c:0xffee88,r:.15},pellet:{size:[.12,.08,.08],c:0xffd070,r:.12},laser:{size:[1.2,.09,.09],c:0xff2222,r:.15},plasma:{size:[.36,.36,.36],c:0x44ff66,r:.25},nuke:{size:[.6,.42,.42],c:0xc8c8c0,r:.3}};
function makeProjMesh(kind){if(kind==='nuke'){const b=new VB(GUN_VOX);b.box(-4,3,-3,3,-3,3,vary([0xc8c8c0,0xbcbcb4])).box(4,6,-2,2,-2,2,0xd0d0c8).box(-7,-5,-1,1,-1,1,0x8a8a80).box(-8,-8,-4,4,0,0,0x8a8a80).box(-8,-8,0,0,-4,4,0x8a8a80).box(-1,0,-3,3,-3,3,0xd2b020);return b.build()}
 const L=PROJ_LOOK[kind],g=new THREE.Group(),m=new THREE.Mesh(BOXG,BM(L.c,1));m.scale.set(...L.size);g.add(m);
 if(kind==='laser'){const h=new THREE.Mesh(BOXG,BM(0xff8866,1));h.material.opacity=.45;h.scale.set(L.size[0]*1.05,.2,.2);g.add(h)}
 if(kind==='plasma'){const c=new THREE.Mesh(BOXG,BM(0xccffcc,1));c.scale.setScalar(.2);g.add(c)}return g}
// spawnProjectile(scene, weaponId, origin:Vector3, dir:Vector3, owner=0) -> array of projectile objects (shotgun gives several)
// each: {pos, vel, radius, damage, owner, alive, kind, weaponId, blast?, mesh, x,y,vx,vy (game.js-compatible mirrors)}
export function spawnProjectile(scene,weaponId,origin,dir,owner=0){const w=WEAPONS[weaponId]||WEAPONS.pistol,kind=w.proj,n=w.pellets||1,out=[],base=Math.atan2(dir.y,dir.x);
 for(let k=0;k<n;k++){const a=base+(Math.random()-.5)*2*(w.spread||.015),vel=new THREE.Vector3(Math.cos(a)*w.spd,Math.sin(a)*w.spd,0);
  const p={pos:origin.clone(),vel,radius:PROJ_LOOK[kind].r,hitW:.25,damage:w.dmg,owner,alive:true,kind,weaponId,t:0,life:w.range??(w.nuke?4:2),grav:w.grav||0,
   kb:w.nuke?14:3,blast:w.blast||0,dissolve:w.laser?'ash':w.plasma?'goo':null,scene:scene||SCENE};
  p.mesh=makeProjMesh(kind);p.mesh.position.copy(p.pos);p.mesh.rotation.z=a;p.mesh.traverse(o=>{if(o.isMesh)o.castShadow=true});p.scene.add(p.mesh);syncXY(p);projectiles.push(p);out.push(p)}
 muzzleFlash(scene,origin,weaponId,dir);return out}
function syncXY(p){p.x=p.pos.x;p.y=p.pos.y;p.vx=p.vel.x;p.vy=p.vel.y}
// call when game.js detects a hit (or a wall); nukes detonate (explosion is returned by next updateWeapons)
export function hitProjectile(p,where){if(!p.alive)return;p.alive=false;const pos=where||p.pos;
 if(p.blast){nukeExplosion(p.scene,pos,p.blast);pending.push({pos:pos.clone(),radius:p.blast,damage:p.damage,owner:p.owner,kb:p.kb})}else impact(p.scene,pos,p.kind);p.scene.remove(p.mesh)}
export const explode=o=>hitProjectile(o.pos?o:{...o,pos:new THREE.Vector3(o.x,o.y,0),alive:true,blast:o.explode||o.blast,scene:SCENE,mesh:new THREE.Group()});
export function clearWeapons(){for(const p of projectiles)p.scene.remove(p.mesh);for(const f of fx)f.scene.remove(f.mesh);projectiles.length=fx.length=pending.length=0}
// updateWeapons(dt, opts) -> explosions finished this frame [{pos,radius,damage,owner,kb}]; opts.floorY (default 0), opts.bound (|x| limit, default 30)
export function updateWeapons(dt,opts={}){const floor=opts.floorY??0,bound=opts.bound??30;
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];if(p.alive){p.t+=dt;p.vel.y-=p.grav*dt;p.pos.addScaledVector(p.vel,dt);p.mesh.position.copy(p.pos);
   if(p.grav)p.mesh.rotation.z=Math.atan2(p.vel.y,p.vel.x);if(p.kind==='plasma')p.mesh.scale.setScalar(1.1+Math.sin(p.t*20)*.15);
   if(p.kind==='nuke'&&Math.random()<.5)burst(p.pos.x,p.pos.y,0xbbb0a0,1,.15,p.scene);
   syncXY(p);if(p.t>p.life||Math.abs(p.pos.x)>bound||p.pos.y<floor)hitProjectile(p)}
  if(!p.alive)projectiles.splice(i,1)}
 for(const m of recoiling){const r=m.userData.rest,k=m.userData.kick=Math.max(0,m.userData.kick-dt*1.6);m.position.x=r.x-k*.5;m.rotation.z=r.rz+k*.8;if(!k)recoiling.delete(m)}
 for(let i=fx.length-1;i>=0;i--){const f=fx[i],m=f.mesh;f.t-=dt;const k=Math.max(0,f.t/f.max);
  if(f.deb){f.vy-=20*dt;m.position.x+=f.vx*dt;m.position.y+=f.vy*dt;m.position.z+=(f.vz||0)*dt;if(f.settle!=null&&m.position.y<f.settle){m.position.y=f.settle;f.vx*=.8;f.vy=0}if(!f.keep||k<.3)m.scale.multiplyScalar(f.keep?.95:1-dt*1.5)}
  else if(f.grow&&!f.group){m.scale.addScalar(dt*f.grow);m.material.opacity=k}
  else if(f.grow){m.scale.addScalar(dt*f.grow)}
  if(f.ring){m.scale.setScalar(f.ring*(1-k)+.1);m.children.forEach(c=>c.material.opacity=k)}
  if(f.mush){const u=1-k;m.scale.setScalar(Math.min(1,.05+u*3));m.position.y+=dt*.6*(1-u)}
  if(f.rise){m.scale.y=Math.min(1,m.scale.y+dt*2);if(k<.2)m.scale.setScalar(Math.max(.01,k*5))}
  if(f.target){f.target.scale.multiplyScalar(1-dt*2.5);if(k<=0)f.target.visible=false}
  if(f.t<=0){f.scene.remove(m);fx.splice(i,1)}}
 return pending.splice(0)}
// ---------- wasteland props (v=0.25, base sits on y=0, centered on x/z) ----------
const PROPS={
 car(b){const body=vary([0x8a5634,0x94603a,0x6a3e22,0x7a8a8a,0x6a7a7a]);b.box(-8,8,1,3,-3,3,body).box(-4,4,4,5,-3,3,body).box(-3,3,4,5,-2,2,vary([0x4a6a7a,0x2a3a3a]))
  .box(-8,8,1,1,-3,3,0x5a3a20).box(8,8,2,2,-2,2,0xb8b0a0).set(8,3,-2,0xd8d0a0).set(8,3,2,0xd8d0a0);for(const x of[-5,5])for(const z of[-3,3])b.box(x-1,x+1,0,1,z,z,0x1e1e1e);
  for(const[x,y]of[[-6,3],[2,3],[6,2],[-2,5]])b.set(x,y,3,0x4a2a14);b.box(-1,1,6,6,-1,1,0xc0b8a8)},// rusty Corvega-style wreck w/ hood ornament
 barrel(b){for(let j=0;j<=4;j++)for(let i=-1;i<=1;i++)for(let k=-1;k<=1;k++)b.set(i,j,k,j===1||j===3?0x222222:hash(i,j,k)<.2?0x8a5634:0xd2b020);b.set(0,5,0,0x7aff3a,1)},// rad barrel
 nuka(b){b.box(-2,2,0,9,-1,1,vary([0xc8201e,0xb81c1a])).box(-2,2,10,10,-1,1,0xe8e0d0).box(-1,1,6,8,2,2,0xf0f0f0,1).box(-1,1,2,4,2,2,(i,j)=>j===3?0x3a1a1a:0x6a6a6a)
  .box(-2,2,0,0,-1,1,0x3a3a3a).box(-1,-1,9,9,2,2,0xffe0a0,1).box(1,1,7,7,2,2,0xc8201e)},
 sandbags(b){for(let j=0;j<3;j++)for(let i=-6;i<=6;i++){const o=j%2?1:0;b.box(i,i,j,j,-1,1,(hash(i+o,j,0)*4|0)%2?0xb8a070:0xa89060)}},
 crate(b){b.box(-2,2,0,4,-2,2,(i,j,k)=>Math.abs(i)===2||j===0||j===4||Math.abs(k)===2?0x6b4423:(i+j)%2?0x8b5a2b:0x9a6a34).box(-1,1,2,2,3,3,0x2a4a2a)},
};
export const PROP_IDS=['car','barrel','nuka','sandbags','crate'];
export function createProp(id){const b=new VB(PROP_VOX);(PROPS[id]||PROPS.crate)(b);let g=b.build();
 const bb=new THREE.Box3().setFromObject(g),root=new THREE.Group();g.position.y-=bb.min.y;root.add(g);root.name='prop:'+id;return root}
