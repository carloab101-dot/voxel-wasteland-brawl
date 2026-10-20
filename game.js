import * as THREE from './three.module.min.js';
// ===== Wasteland Brawl — voxel diorama style (orthographic 3/4 camera, tilt-shift DOF, card HUD) =====
const scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(renderer.domElement);
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,600);
// sky gradient dome
{const g=new THREE.SphereGeometry(300,24,12),m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 p;void main(){float h=normalize(p).y;vec3 a=vec3(.95,.62,.32),b=vec3(.42,.2,.18),c=vec3(.13,.07,.09);gl_FragColor=vec4(h>0.?mix(a,b,smoothstep(0.,.6,h)):mix(a,c,smoothstep(0.,-.4,h)),1.);}'});
 scene.add(new THREE.Mesh(g,m))}
scene.add(new THREE.HemisphereLight(0xffe0b0,0x50301a,1.0));
const sun=new THREE.DirectionalLight(0xffc880,2.0);sun.position.set(-25,45,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0005;
Object.assign(sun.shadow.camera,{left:-40,right:40,top:30,bottom:-25,far:200});scene.add(sun);
const BOX=new THREE.BoxGeometry(1,1,1),mats={};
const M=(c,e)=>{const k=c+'_'+(e||0);return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:c,emissive:e||0,roughness:.85,metalness:.05}))};
function cube(p,x,y,z,sx,sy,sz,c,e){const m=new THREE.Mesh(BOX,M(c,e));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;p.add(m);return m}
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const hash=(a,b,c)=>{let h=(a*374761393+b*668265263+c*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296};
// ---------- instanced voxel builder (like the diorama's sparse grid) ----------
const VX=[];function vox(x,y,z,c,s=.5){VX.push([x,y,z,c,s])}
function flushVox(){const by={};for(const v of VX)(by[v[4]]||(by[v[4]]=[])).push(v);const mtx=new THREE.Matrix4(),col=new THREE.Color();
 for(const s in by){const L=by[s],im=new THREE.InstancedMesh(new THREE.BoxGeometry(+s,+s,+s),new THREE.MeshStandardMaterial({roughness:.9}),L.length);
  L.forEach((v,i)=>{mtx.makeTranslation(v[0],v[1],v[2]);im.setMatrixAt(i,mtx);im.setColorAt(i,col.setHex(v[3]))});im.castShadow=im.receiveShadow=true;scene.add(im)}VX.length=0}
// ---------- map: floating wasteland island diorama ----------
const W=30;const plats=[];
function plat(x0,x1,y,solidFloor){plats.push({x0,x1,y,solid:solidFloor});if(solidFloor)return;
 const rust=[0x7a4a2a,0x8a5634,0x6a3e22,0x94603a];for(let x=x0;x<x1;x+=.5)for(let z=-1;z<=1;z+=.5)vox(x+.25,y-.25,z,rust[(hash(x*2,y,z*2)*4)|0]);
 for(let x=x0;x<x1;x+=2){vox(x+.25,y-.75,-1,0x4a1a08);vox(x+.25,y-.75,1,0x4a1a08)}}
// island top (sand/dirt) + tapering rocky underside
for(let x=-W-2;x<W+2;x+=.5)for(let z=-5;z<=4;z+=.5){const top=hash(x*2|0,0,z*2|0);const edge=Math.max(Math.abs(x)/(W+2),Math.abs(z+.5)/4.6);if(edge>1)continue;
 vox(x+.25,-.25,z,top<.12?0xb08a58:top<.5?0xc49a62:0xb98f5a);
 const depth=Math.floor((1-edge*edge)*14*(.7+hash(x*2|0,9,z*2|0)*.5));for(let d=1;d<=depth;d++)if(Math.abs(z)>3.5||Math.abs(x)>W||d===depth||d<3)vox(x+.25,-.25-d*.5,z,d<2?0x8a6438:d<6?0x6e4d2c:0x4e3420)}
plat(-W,W,0,true);plat(-24,-10,4);plat(-4,4,4);plat(10,24,4);plat(-18,-4,8);plat(4,18,8);plat(-8,8,12);plat(-28,-21,10);plat(21,28,10);
const ladders=[{x:-12,y0:0,y1:4},{x:12,y0:0,y1:4},{x:-6,y0:4,y1:8},{x:6,y0:4,y1:8},{x:-2,y0:8,y1:12},{x:2,y0:8,y1:12},{x:-22,y0:4,y1:10},{x:22,y0:4,y1:10}];
for(const l of ladders){for(let y=l.y0;y<l.y1;y+=.5)for(let i=-.375;i<=.375;i+=.25)vox(l.x+i,y+.25,1.2,0x6a4426,.25);for(let y=l.y0;y<l.y1;y+=.25){vox(l.x-.5,y+.125,1.2,0x3c2a18,.25);vox(l.x+.5,y+.125,1.2,0x3c2a18,.25)}}
// support pillars under girders
for(const p of plats)if(!p.solid)for(const x of[p.x0+.5,p.x1-.5])for(let y=.25;y<p.y-.5;y+=.5)vox(x,y,-1.2,hash(x|0,y*2|0,1)<.5?0x6d6a62:0x5a5850);
// ruins, rad barrels, wrecked car, scrub
for(const[x,h]of[[-16,3],[-25,8],[0,3],[16,6],[26,8],[-8,5],[8,9]])for(let y=0;y<h;y+=.5)for(let i=-1.5;i<1.5;i+=.5)if(hash(x,y*2,i*2)>(y>h-1.5?.5:.06))vox(x+i+.25,y+.25,-3.2,hash(x,y,i)<.5?0x7a756a:0x8f897c);
for(const x of[-27,-14,15,27])for(let y=0;y<1.25;y+=.25)for(let a=-.25;a<=.25;a+=.25)for(let b=-.25;b<=.25;b+=.25)vox(x+a,y+.125,-1.8+b,y>.4&&y<.6?0x222222:0xd2b020,.25);
for(let x=-4;x<0;x+=.5)for(let y=0;y<1.5;y+=.5)if(!(y>.9&&(x<-3.4||x>-1)))vox(x+18.25,y+.25,-3.6,y<.5?0x2a2a2a:hash(x*2|0,y*2|0,7)<.5?0x6a8a9a:0x5a7a8a);
for(let i=0;i<40;i++){const x=rnd()*60-30,z=rnd()<.5?-4:3;vox(x,.25,z,0x7a8a3a,.25);vox(x+.25,.5,z,0x6a7a30,.25)}
// glowing rad puddles (decor) + floating dust
const glowM=new THREE.MeshBasicMaterial({color:0x7aff3a});for(const x of[-9,20])for(let i=-1;i<1;i+=.5)for(let z=2;z<3.5;z+=.5){const m=new THREE.Mesh(BOX,glowM);m.scale.set(.5,.05,.5);m.position.set(x+i,.03,z);scene.add(m)}
flushVox();
const DUST=60,dust=new THREE.InstancedMesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshBasicMaterial({color:0xffe0a0}),DUST);const dd=[];for(let i=0;i<DUST;i++)dd.push([rnd()*70-35,rnd()*16,rnd()*8-4,rnd()*9]);scene.add(dust);
// distant mesas
for(let i=0;i<26;i++){const h=4+rnd()*14,x=rnd()*200-100;cube(scene,x,h/2-12,-60-rnd()*40,6+rnd()*10,h+10,6+rnd()*6,rnd()<.5?0x8a5a3a:0x7a4a30)}
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
const SPN={grenade:'FRAG GRENADE',boulder:'BOULDER TOSS',rad:'RAD BLAST',missile:'SHOULDER MISSILE',beam:'HEAD LASER'};
const SUIT=['\u2660','\u2665'],CARD=['1','A'];
// chibi diorama proportions: big head, squat body (Fight Maker voxel style)
function chibify(m){const b=m.b,head=new THREE.Group();head.position.y=1.5;
 for(const c of [...b.children])if(c.isMesh&&c.position.y>=1.5||c.isPointLight){b.remove(c);c.position.y-=1.5;head.add(c)}
 head.scale.setScalar(1.55);b.add(head);b.scale.set(1.08,.84,1.08);m.head=head;return m}
// ---------- post: tilt-shift DOF + ACES grade + vignette (two separable passes) ----------
const rtOpt={type:THREE.HalfFloatType};let A=new THREE.WebGLRenderTarget(1,1,{...rtOpt,samples:4}),B=new THREE.WebGLRenderTarget(1,1,rtOpt);
const R_EXPR='(smoothstep(.12,.48,abs(uv.y-.5))+smoothstep(.5,.9,length((uv-.5)*vec2(1.5,1.)))*.5)*7.';
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const blurFS=(final)=>`uniform sampler2D tex;uniform vec2 px,dir;varying vec2 vUv;float R(vec2 uv){return ${R_EXPR};}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec2 st=dir*px*R(vUv)/4.;vec4 c=texture2D(tex,vUv)*.227;c+=(texture2D(tex,vUv+st)+texture2D(tex,vUv-st))*.1945;c+=(texture2D(tex,vUv+st*2.)+texture2D(tex,vUv-st*2.))*.1216;
c+=(texture2D(tex,vUv+st*3.)+texture2D(tex,vUv-st*3.))*.054;c+=(texture2D(tex,vUv+st*4.)+texture2D(tex,vUv-st*4.))*.0162;
${final?'vec3 col=aces(c.rgb*1.1);float l=dot(col,vec3(.299,.587,.114));col=mix(vec3(l),col,1.05);col*=1.-.3*smoothstep(.55,1.05,length((vUv-.5)*vec2(1.3,1.)));gl_FragColor=vec4(pow(col,vec3(1./2.2)),1.);':'gl_FragColor=c;'}}`;
function quad(fs){const m=new THREE.ShaderMaterial({uniforms:{tex:{value:null},px:{value:new THREE.Vector2()},dir:{value:new THREE.Vector2()}},vertexShader:VS,fragmentShader:fs,depthTest:false});
 const s=new THREE.Scene(),q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),m);q.frustumCulled=false;s.add(q);return{m,s}}
const QH=quad(blurFS(false)),QV=quad(blurFS(true));const QC=new THREE.Camera();
function resize(){renderer.setSize(innerWidth,innerHeight);const pr=renderer.getPixelRatio();A.setSize(innerWidth*pr,innerHeight*pr);B.setSize(innerWidth*pr,innerHeight*pr)}
addEventListener('resize',resize);resize();
function render(){const w=A.width,h=A.height;renderer.setRenderTarget(A);renderer.render(scene,camera);
 QH.m.uniforms.tex.value=A.texture;QH.m.uniforms.px.value.set(1/w,1/h);QH.m.uniforms.dir.value.set(1,0);renderer.setRenderTarget(B);renderer.render(QH.s,QC);
 QV.m.uniforms.tex.value=B.texture;QV.m.uniforms.px.value.set(1/w,1/h);QV.m.uniforms.dir.value.set(0,1);renderer.setRenderTarget(null);renderer.render(QV.s,QC)}
// ---------- camera: orthographic isometric 3/4, gentle sway, drag-orbit + wheel/pinch zoom ----------
const CAM={th:.55,ph:.5,tx:0,ty:5,half:12,user:{th:0,ph:0,zoom:1},shake:0};
{let drag=null;const el=renderer.domElement;el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,th:CAM.user.th,ph:CAM.user.ph}});
 addEventListener('pointerup',()=>drag=null);addEventListener('pointermove',e=>{if(!drag)return;CAM.user.th=Math.max(-.9,Math.min(.9,drag.th-(e.clientX-drag.x)*.005));CAM.user.ph=Math.max(-.35,Math.min(.5,drag.ph+(e.clientY-drag.y)*.004))});
 el.addEventListener('wheel',e=>{e.preventDefault();CAM.user.zoom=Math.max(.6,Math.min(1.7,CAM.user.zoom*Math.exp(e.deltaY*.0012)))},{passive:false})}
function camUpdate(dt,t){const[a,b]=players;if(!a)return;const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2+1,span=Math.max(Math.abs(a.x-b.x)*.55,Math.abs(a.y-b.y)*1.1);
 const k=Math.min(1,dt*3);CAM.tx+=(cx*.85-CAM.tx)*k;CAM.ty+=(cy-CAM.ty)*k;CAM.half+=(Math.max(7,Math.min(17,span*.62+5))*CAM.user.zoom-CAM.half)*k;
 const th=CAM.th+Math.sin(t*.05)*.06+CAM.user.th,ph=CAM.ph+CAM.user.ph,as=innerWidth/innerHeight,sh=CAM.shake*.4;CAM.shake=Math.max(0,CAM.shake-dt*1.6);
 const hh=as<1?CAM.half*1.4:CAM.half;camera.left=-hh*as;camera.right=hh*as;camera.top=hh;camera.bottom=-hh;camera.updateProjectionMatrix();
 camera.position.set(CAM.tx+Math.sin(th)*Math.cos(ph)*120+(Math.random()-.5)*sh,CAM.ty+Math.sin(ph)*120+(Math.random()-.5)*sh,Math.cos(th)*Math.cos(ph)*120);camera.lookAt(CAM.tx,CAM.ty,0);
 sun.position.set(CAM.tx-25,45,35);sun.target.position.set(CAM.tx,0,0);sun.target.updateMatrixWorld()}
// ---------- input ----------
const keys={};addEventListener('keydown',e=>{if(e.repeat){keys[e.code]=true;return}keys[e.code]=true;if(e.code.startsWith('Arrow')||e.code==='Space'||['Slash','Quote'].includes(e.code))e.preventDefault();onKey(e.code)});addEventListener('keyup',e=>keys[e.code]=false);
const CTRL=[{l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],pick:['KeyZ'],melee:['KeyE'],sp:['KeyQ'],fire:['KeyF']},
 {l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],pick:['Semicolon','Numpad3'],melee:['Period','Numpad1'],sp:['Comma','Numpad2'],fire:['Slash','Numpad0']}];
const down=(i,a)=>CTRL[i][a].some(k=>keys[k]);
const pressed=[{},{}];function onKey(code){for(let i=0;i<2;i++)for(const a in CTRL[i])if(CTRL[i][a].includes(code))pressed[i][a]=true;
 if(state==='select'){if(code==='KeyA')pick(0,-1);if(code==='KeyD')pick(0,1);if(code==='ArrowLeft')pick(1,-1);if(code==='ArrowRight')pick(1,1);if(code==='Enter')startMatch()}
 else if(code==='KeyR'||(state==='over'&&code==='Enter'))showSelect()}
// ---------- state ----------
let state='select',choice=[0,1],players=[],projs=[],pickups=[],fx=[],texts=[],wins=[0,0],round=1,roundT=0,introT=0,spawnT=0,hitstop=0,callout=null,winner=-1;
const $=id=>document.getElementById(id);
function renderSelect(){for(let i=0;i<2;i++){$('c'+(i+1)).innerHTML=CHARS.map((c,j)=>`<button class="ch ${j===choice[i]?'on':''}" data-p="${i}" data-c="${j}">${j===choice[i]?'▶ ':'  '}${c.name}</button>`).join('');$('d'+(i+1)).textContent=CHARS[choice[i]].desc+' HP '+CHARS[choice[i]].hp}
 document.querySelectorAll('#ov .ch').forEach(b=>b.onclick=()=>{choice[+b.dataset.p]=+b.dataset.c;renderSelect();preview()})}
function pick(i,d){choice[i]=(choice[i]+d+CHARS.length)%CHARS.length;renderSelect();preview()}
$('go').onclick=()=>startMatch();$('restart').onclick=e=>{e.currentTarget.blur();showSelect()};
function preview(){for(const p of players)scene.remove(p.m.g);players=[0,1].map(i=>makePlayer(i,choice[i]));players[0].x=-3;players[1].x=3;players[0].y=players[1].y=4}
function makePlayer(i,ci){const ch=CHARS[ci],m=chibify(buildChar(ch.id));scene.add(m.g);
 return{i,ch,m,x:i?6:-6,y:12,vx:0,vy:0,face:i?-1:1,hp:ch.hp,disp:ch.hp,ground:false,climb:false,gun:null,gunMesh:null,ammo:0,fireCD:0,meleeCD:0,meleeT:0,spCD:1,hurtT:0,dead:false,squash:0}}
function showSelect(){state='select';winner=-1;clearWorld();$('ov').style.display='flex';renderSelect();preview();buildHUD()}
function clearWorld(){for(const p of projs)scene.remove(p.mesh);for(const k of pickups)scene.remove(k.mesh);for(const f of fx)scene.remove(f.mesh);projs=[];pickups=[];fx=[];texts.forEach(t=>t.el.remove());texts=[]}
function startMatch(){if(state!=='select')return;wins=[0,0];round=1;$('ov').style.display='none';startRound()}
function startRound(){clearWorld();preview();players[0].x=-20;players[1].x=20;players[0].y=players[1].y=0;state='fight';roundT=0;introT=1.4;winner=-1;spawnT=1.5;callout=null;
 for(let k=0;k<2;k++)spawnPickup()}
// ---------- pickups ----------
const SPAWNS=[[-17,4],[17,4],[0,4],[-11,8],[11,8],[0,12],[-25,10],[25,10],[-5,0],[5,0]];
function spawnPickup(){if(pickups.length>=4)return;const free=SPAWNS.filter(s=>!pickups.some(p=>p.x===s[0]&&p.y===s[1]));if(!free.length)return;
 const s=free[(Math.random()*free.length)|0];const tot=Object.values(WEAPONS).reduce((a,w)=>a+w.w,0);let r=Math.random()*tot,t;
 for(const k in WEAPONS){r-=WEAPONS[k].w;if(r<=0){t=k;break}}t=t||'pistol';
 const mesh=new THREE.Group();const gm=buildGun(t);gm.scale.setScalar(1.6);mesh.add(gm);cube(mesh,0,-.6,0,.8,.15,.8,0x3f6633,0x225522);
 const ring=new THREE.Mesh(BOX,new THREE.MeshBasicMaterial({color:t==='nuke'?0xffe040:0x7aff5a,transparent:true,opacity:.35}));ring.scale.set(.9,.05,.9);ring.position.y=-.95;mesh.add(ring);
 mesh.position.set(s[0],s[1]+1.1,0);scene.add(mesh);pickups.push({x:s[0],y:s[1],t,mesh,gm,born:0});burst(s[0],s[1]+.6,0x7aff5a,8,.6)}
// ---------- physics / combat ----------
const PW=.6,PH=2.5;const active=()=>state==='fight'&&introT<=0;
function onLadder(p){return ladders.find(l=>Math.abs(p.x-l.x)<.6&&p.y>=l.y0-.05&&p.y<=l.y1+.05)}
function update(p,dt){const i=p.i,ch=p.ch;p.disp+=(p.hp-p.disp)*Math.min(1,dt*(p.disp>p.hp?2.2:8));
 if(p.dead){p.vy-=30*dt;p.x+=p.vx*dt;p.vx*=.98;p.y+=p.vy*dt;if(p.y<0){p.y=0;p.vy=0;p.vx*=.5}p.x=Math.max(-W+.5,Math.min(W-.5,p.x));return}
 const can=active();const ix=can?(down(i,'r')?1:0)-(down(i,'l')?1:0):0;if(ix&&p.meleeT<=0)p.face=ix;
 const lad=onLadder(p),U=can&&down(i,'u'),D=can&&down(i,'d');
 if(lad&&(U&&p.y<lad.y1-.01||D&&p.y>lad.y0+.01))p.climb=true;
 if(p.climb){if(!lad){p.climb=false}else{p.vy=(U?5:0)-(D?5:0);p.x+=(lad.x-p.x)*.2;p.vx=ix*3;
   if(p.y>=lad.y1&&U){p.y=lad.y1;p.climb=false;p.vy=0}if(p.y<=lad.y0&&D){p.climb=false}}}
 const wasG=p.ground;
 if(!p.climb){p.vx+=(ix*ch.spd-p.vx)*Math.min(1,dt*(p.ground?16:6));p.vy-=30*dt;if(p.vy<-24)p.vy=-24;
  if(can&&pressed[i].u&&p.ground&&(!lad||p.y>=lad.y1-.05)){p.vy=ch.jmp;p.ground=false;p.squash=-.25;burst(p.x,p.y+.1,0xc49a62,5,.3)}}
 const oy=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=Math.max(-W+.5,Math.min(W-.5,p.x));p.ground=false;
 if(!p.climb&&p.vy<=0)for(const pl of plats){if(p.x>pl.x0-.2&&p.x<pl.x1+.2&&oy>=pl.y-.01&&p.y<=pl.y){if(!pl.solid&&D&&!lad)continue;p.y=pl.y;p.vy=0;p.ground=true;break}}
 if(p.y<0){p.y=0;p.vy=0;p.ground=true}
 if(p.ground&&!wasG&&oy-p.y>=0){p.squash=.3;burst(p.x,p.y+.1,0xc49a62,4,.25)}
 p.fireCD-=dt;p.meleeCD-=dt;p.spCD-=dt;p.meleeT-=dt;p.hurtT-=dt;p.squash*=Math.pow(.0005,dt);
 if(!can)return;
 if(pressed[i].pick){const k=pickups.find(k=>Math.abs(k.x-p.x)<1.4&&Math.abs(k.y-p.y)<1.5);if(k){equip(p,k.t);scene.remove(k.mesh);pickups.splice(pickups.indexOf(k),1);say(i,WEAPONS[k.t].name.toUpperCase(),k.t==='nuke');burst(p.x,p.y+1,0xffffff,6,.4)}}
 if(pressed[i].melee&&p.meleeCD<=0){p.meleeCD=.45;p.meleeT=.2;const o=players[1-i];
  if(!o.dead&&Math.abs(o.y-p.y)<1.6&&(o.x-p.x)*p.face>-.2&&Math.abs(o.x-p.x)<1.7*(ch.scale||1))damage(o,ch.melee||11,p.face*9,6,i)}
 if(down(i,'fire')&&p.gun&&p.fireCD<=0&&!p.climb)fire(p);
 if(pressed[i].sp&&p.spCD<=0&&!p.climb){p.spCD=ch.cd;say(i,SPN[ch.sp],true);special(p)}}
function equip(p,t){if(p.gunMesh)p.m.aR.remove(p.gunMesh);p.gun=t;p.ammo=WEAPONS[t].ammo;p.gunMesh=buildGun(t);p.gunMesh.rotation.z=Math.PI/2;p.gunMesh.rotation.y=-Math.PI/2;p.gunMesh.position.set(0,-.72,.15);p.m.aR.add(p.gunMesh)}
function drop(p){if(p.gunMesh)p.m.aR.remove(p.gunMesh);p.gun=null;p.gunMesh=null}
const bulletMat=new THREE.MeshBasicMaterial({color:0xffee88});
function proj(o){const mesh=new THREE.Mesh(BOX,o.mat||bulletMat);mesh.scale.set(...(o.size||[.35,.1,.1]));mesh.castShadow=true;scene.add(mesh);o.mesh=mesh;o.t=0;projs.push(o)}
function fire(p){const w=WEAPONS[p.gun];p.fireCD=w.rate;p.recoil=.12;const s=p.ch.scale||1,hx=p.x+p.face*.95*s,hy=p.y+1.15*s;
 const n=w.pellets||1;for(let k=0;k<n;k++){const a=(Math.random()-.5)*2*(w.spread||.015);
  const o={owner:p.i,x:hx,y:hy,vx:Math.cos(a)*w.spd*p.face,vy:Math.sin(a)*w.spd,dmg:w.dmg,kb:w.nuke?14:3,life:w.range||2};
  if(w.laser){o.mat=new THREE.MeshBasicMaterial({color:w.laser});o.size=[1.2,.1,.1]}
  if(w.plasma){o.mat=new THREE.MeshBasicMaterial({color:0x44ff66});o.size=[.4,.4,.4]}
  if(w.nuke){o.mat=M(0xc8c8c0);o.size=[.6,.45,.45];o.grav=6;o.explode=4.5;o.life=4;o.trail=true}
  proj(o)}
 flash(hx+p.face*.3,hy,w.laser?0xff4422:w.plasma?0x44ff66:0xffcc44,.12,.5);burst(p.x-p.face*.2,hy,0xd8b040,1,.15);CAM.shake=Math.max(CAM.shake,w.nuke?.6:.08);
 if(--p.ammo<=0){drop(p);say(p.i,'OUT OF AMMO')}}
function special(p){const s=p.ch.scale||1,hx=p.x+p.face*.9*s,hy=p.y+1.5*s,f=p.face;p.meleeT=.3;
 switch(p.ch.sp){
  case 'grenade':proj({owner:p.i,x:hx,y:hy,vx:12*f,vy:9,grav:22,dmg:26,kb:10,explode:3,life:3,fuse:1.2,bounce:true,mat:M(0x3a5a2a),size:[.3,.35,.3]});break;
  case 'boulder':proj({owner:p.i,x:hx,y:hy+.5,vx:15*f,vy:7,grav:18,dmg:30,kb:13,life:3,mat:M(0x7a6a5a),size:[.9,.9,.9],spin:true,explode:1.6});break;
  case 'rad':proj({owner:p.i,x:hx,y:hy,vx:11*f,vy:0,dmg:22,kb:6,life:3,pierce:true,mat:new THREE.MeshBasicMaterial({color:0x66ff22,transparent:true,opacity:.75}),size:[1.1,1.1,1.1],pulse:true});break;
  case 'missile':proj({owner:p.i,x:hx,y:hy+.4,vx:22*f,vy:0,dmg:28,kb:12,life:2.5,explode:2.8,mat:M(0x888888),size:[.8,.22,.22],trail:true});break;
  case 'beam':{const o=players[1-p.i],y=p.y+1.75*s;let end=f>0?W:-W;
   if(!o.dead&&(o.x-p.x)*f>0&&y>o.y&&y<o.y+PH*(o.ch.scale||1)){end=o.x;damage(o,24,f*10,4,p.i)}
   const len=Math.abs(end-hx),m=new THREE.Mesh(BOX,new THREE.MeshBasicMaterial({color:0xff3322,transparent:true}));m.position.set((hx+end)/2,y,0);m.scale.set(len,.22,.22);scene.add(m);fx.push({mesh:m,t:.25,max:.25,beam:true});CAM.shake=.3}}}
// voxel debris bursts + flashes
const fxGeo=new THREE.BoxGeometry(1,1,1);
function burst(x,y,c,n,sz){const mat=new THREE.MeshBasicMaterial({color:c});for(let k=0;k<n;k++){const m=new THREE.Mesh(fxGeo,mat);const s=sz*(.4+Math.random()*.6);m.scale.setScalar(s);m.position.set(x,y,(Math.random()-.5)*.6);scene.add(m);
 fx.push({mesh:m,t:.5+Math.random()*.4,max:.9,vx:(Math.random()-.5)*8,vy:Math.random()*8,vz:(Math.random()-.5)*4,deb:true})}}
function flash(x,y,c,t,s=.5){const m=new THREE.Mesh(BOX,new THREE.MeshBasicMaterial({color:c,transparent:true}));m.position.set(x,y,0);m.scale.setScalar(s);scene.add(m);fx.push({mesh:m,t,max:t,grow:6})}
function explode(o){const r=o.explode;flash(o.x,o.y,0xffaa22,.45,r*.6);burst(o.x,o.y,0xff7a22,10,.45);burst(o.x,o.y,0x5a4a3a,8,.4);
 if(r>4){flash(o.x,o.y+2,0xffffaa,.9,3);burst(o.x,o.y+1,0xfff0a0,20,.6);CAM.shake=1.2;hitstop=.15}else CAM.shake=Math.max(CAM.shake,.45);
 for(const q of players){const d=Math.hypot(q.x-o.x,q.y+1-o.y);if(!q.dead&&d<r)damage(q,o.dmg*(1-d/r*.5)*(q.i===o.owner?.5:1),Math.sign(q.x-o.x||1)*o.kb,o.kb*.7,o.owner)}}
function damage(q,d,kx,ky,by){if(state!=='fight'||q.dead)return;d=Math.max(1,Math.round(d));q.hp=Math.max(0,q.hp-d);q.vx+=kx;q.vy=Math.max(q.vy,ky);q.climb=false;q.hurtT=.18;
 hitstop=Math.max(hitstop,d>=15?.1:.05);burst(q.x,q.y+1.2,q.ch.id==='bot'||q.ch.id==='paladin'?0xffd060:0xc02020,d>=15?8:4,.2);
 const big=d>=15,stack=texts.filter(t=>t.q===q&&t.life>.6).length;const el=document.createElement('div');el.className='dm'+(big?' c':'');el.textContent='-'+d;$('hud').appendChild(el);
 texts.push({el,q,x:q.x,y:q.y+(q.ch.scale||1)*2.4+stack*.5,life:1.1,max:1.1});
 if(q.hp<=0){q.dead=true;drop(q);winner=1-q.i;wins[winner]++;state='ko';roundT=0;callout=null;CAM.shake=1;hitstop=.35;burst(q.x,q.y+1,0xffffff,14,.35)}}
function stepProjs(dt){for(const o of [...projs]){o.t+=dt;o.vy-=(o.grav||0)*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;let gone=o.t>o.life||Math.abs(o.x)>W;
  if(o.bounce&&o.vy<0)for(const pl of plats)if(o.x>pl.x0&&o.x<pl.x1&&o.y<pl.y+.15&&o.y-o.vy*dt>=pl.y){o.y=pl.y+.15;o.vy*=-.4;o.vx*=.6}
  if(o.fuse&&o.t>o.fuse)gone=true;if(!o.bounce&&o.grav&&o.y<.2)gone=true;
  const q=players[1-o.owner];if(!gone&&!q.dead&&Math.abs(o.x-q.x)<.45*(q.ch.scale||1)+.25&&o.y>q.y&&o.y<q.y+PH*(q.ch.scale||1)){
   if(o.explode)gone=true;else{if(o.dmg)damage(q,o.dmg,Math.sign(o.vx)*o.kb,2,o.owner);if(!o.pierce)gone=true;else o.dmg=0}}
  if(gone){if(o.explode)explode(o);else burst(o.x,o.y,0xffd080,2,.15);scene.remove(o.mesh);projs.splice(projs.indexOf(o),1);continue}
  o.mesh.position.set(o.x,o.y,0);if(o.vx<0&&!o.spin)o.mesh.rotation.y=Math.PI;if(o.spin)o.mesh.rotation.z-=dt*8;if(o.pulse)o.mesh.scale.setScalar(1.1+Math.sin(o.t*20)*.15);
  if(o.trail&&Math.random()<.5)burst(o.x-Math.sign(o.vx)*.5,o.y,0xaaaaaa,1,.25)}}
// ---------- HUD (playing-card fighter cards, callouts, floating damage, ROUND/FIGHT/K.O. banners) ----------
let H=null;function buildHUD(){const r=$('hud');texts.forEach(t=>t.el.remove());texts=[];
 r.innerHTML='<div class="t3">WASTELAND BRAWL<small class="rd"></small></div>'+[0,1].map(i=>`<div class="cd ${i?'r':'l'}"><div class="ix">${CARD[i]}<small>${SUIT[i]}</small></div><div class="ix2">${CARD[i]}<small>${SUIT[i]}</small></div>
 <div class="nm"></div><div class="st"></div><div class="bar"><i class="g"></i><i class="f"></i></div><div class="hp"></div></div><div class="co ${i?'r':'l'}"></div>`).join('')+
 '<div class="big"></div><div class="sub"></div><div class="ft"><b>P1</b> A/D move · W jump/climb · S down/drop · Z pick up · E melee · Q special · F fire<br><b>P2</b> ←/→ move · ↑ jump/climb · ↓ down/drop · ; pick up · . melee · , special · / fire (Numpad 3/1/2/0)<br>drag to orbit · scroll to zoom · R restarts</div>';
 const q=s=>r.querySelector(s);H={rd:q('.rd'),cards:[...r.querySelectorAll('.cd')],co:[...r.querySelectorAll('.co')],big:q('.big'),sub:q('.sub')}}
function say(i,text,special){callout={i,text,life:1.6,max:1.6,special}}
const setT=(el,s)=>{if(el._t!==s){el._t=s;el.innerHTML=s}};const V=new THREE.Vector3();
function hud(dt){if(!H)return;setT(H.rd,state==='select'?'choose your fighters':`round ${round} · first to 3 · wasteland diorama`);
 players.forEach((p,i)=>{const c=H.cards[i];setT(c.querySelector('.nm'),`P${i+1} · ${p.ch.name}`);
  setT(c.querySelector('.st'),winner===i?'★ WINNER':p.dead?'✖ K.O.':p.spCD<=0&&state!=='select'?'▶ SPECIAL READY':'');
  c.querySelector('.g').style.width=p.disp/p.ch.hp*100+'%';const f=c.querySelector('.f');f.style.width=p.hp/p.ch.hp*100+'%';f.classList.toggle('low',p.hp/p.ch.hp<=.3);
  setT(c.querySelector('.hp'),`${Math.ceil(p.hp)} / ${p.ch.hp} HP <span class="stars">${'★'.repeat(wins[i])}${'☆'.repeat(3-wins[i])}</span><br>${p.gun?WEAPONS[p.gun].name+' ['+p.ammo+']':'Fists'} · ${SPN[p.ch.sp]} ${p.spCD>0?p.spCD.toFixed(1)+'s':'✓'}`);
  c.classList.toggle('hit',p.hurtT>0);c.classList.toggle('ko',p.dead)});
 H.co.forEach((el,i)=>{if(callout&&callout.i===i){setT(el,callout.text+(callout.special?' ★':''));const k=callout.life/callout.max;el.style.opacity=Math.min(1,k*4);el.style.transform=`translateY(${(1-k)*-10}px) scale(${callout.special?1.12:1})`}else el.style.opacity=0});
 if(callout&&(callout.life-=dt)<=0)callout=null;
 for(const t of [...texts]){t.life-=dt;if(t.life<=0){t.el.remove();texts.splice(texts.indexOf(t),1);continue}const k=1-t.life/t.max;V.set(t.x,t.y+k*1.2,0).project(camera);
  t.el.style.left=(V.x*.5+.5)*innerWidth+'px';t.el.style.top=(-V.y*.5+.5)*innerHeight+'px';t.el.style.opacity=Math.min(1,t.life/t.max*3);t.el.style.transform=`translate(-50%,-50%) scale(${1+Math.max(0,.25-k)*2})`}
 if(state==='fight'&&introT>0){H.big.style.display='block';setT(H.big,introT>.6?'ROUND '+round:'FIGHT!');H.sub.style.display='none'}
 else if((state==='ko'&&roundT>.35)||state==='over'){H.big.style.display='block';const match=wins[winner]>=3;setT(H.big,match?'VICTORY':'K.O.');H.big.style.opacity=state==='over'?1:Math.min(1,(roundT-.35)*3);H.sub.style.display='block';
  setT(H.sub,`P${winner+1} ${players[winner].ch.name} ${match?'WINS THE MATCH':'WINS ROUND '+round}<small>${match?'ENTER or RESTART for a rematch':'next round in a moment · RESTART to pick fighters'} · ${wins[0]} – ${wins[1]}</small>`)}
 else{H.big.style.display='none';H.sub.style.display='none'}}
// ---------- loop ----------
let last=performance.now(),acc=0,fps=60,fpsN=0,fpsT=0;const T=1/120;
function loop(now){requestAnimationFrame(loop);let dt=Math.min(.05,(now-last)/1000);last=now;const t=now/1000;fpsN++;fpsT+=dt;if(fpsT>.5){fps=fpsN/fpsT;fpsN=0;fpsT=0}
 let sdt=dt;if(hitstop>0){hitstop-=dt;sdt*=.08}
 if(state==='fight'||state==='ko'){if(introT>0)introT-=dt;acc+=sdt;while(acc>T){for(const p of players)update(p,T);stepProjs(T);for(const k of[0,1])pressed[k]={};acc-=T}
  spawnT-=dt;if(spawnT<=0&&state==='fight'){spawnPickup();spawnT=5+Math.random()*3}
  if(state==='ko'){roundT+=dt;if(roundT>3.2){if(wins[winner]>=3){state='over'}else{round++;startRound()}}}}
 else{pressed[0]={};pressed[1]={};for(const p of players){p.vy-=30*dt;p.y+=p.vy*dt;if(p.y<4){p.y=4;p.vy=0}p.face=p.i?-1:1;p.disp=p.hp}}
 for(const p of players){const m=p.m,run=Math.min(1,Math.abs(p.vx)/5),s=Math.sin(now/85)*run*.9;m.g.position.set(p.x,p.y,0);
  const ty=p.climb?Math.PI:(p.face>0?.9:-.9);m.g.rotation.y+=(ty-m.g.rotation.y)*Math.min(1,dt*14);
  const sq=p.squash||0,CS=(p.ch.scale||1)*1.25;m.g.scale.set(CS*(1+sq*.5),CS*(1-sq+(state==="select"?Math.sin(t*3+p.i)*.03:0)),CS*(1+sq*.5));
  if(p.climb){const c=Math.sin(p.y*3)*.6;m.lL.rotation.x=c;m.lR.rotation.x=-c;m.aL.rotation.x=-2.6+c;m.aR.rotation.x=-2.6-c}
  else{const air=p.ground?0:.6;m.lL.rotation.x=s+air;m.lR.rotation.x=-s-air*.4;m.aL.rotation.x=-s+(p.ground?0:-.8);
   m.aR.rotation.x=p.meleeT>0?-1.7+(.2-p.meleeT)*3:p.gun?-1.5+(p.recoil>0?.35:0):s+(p.ground?0:-.8)}
  m.head.rotation.z=p.hurtT>0?.25:Math.sin(t*2+p.i)*.03;m.b.rotation.x=p.ground&&!p.dead?run*.12:0;
  p.recoil=(p.recoil||0)-dt;m.b.rotation.z=p.dead?(p.face>0?1.45:-1.45):0;m.b.position.y=p.dead?.4:0;
  m.b.visible=!(p.hurtT>0&&Math.floor(now/40)%2)}
 for(const k of pickups){k.gm.rotation.y+=dt*2;k.born=Math.min(1,k.born+dt*3);k.mesh.scale.setScalar(k.born);k.mesh.position.y=k.y+1.1+Math.sin(now/300)*.15}
 for(const f of [...fx]){f.t-=dt;if(f.deb){f.vy-=20*dt;f.mesh.position.x+=f.vx*dt;f.mesh.position.y=Math.max(.05,f.mesh.position.y+f.vy*dt);f.mesh.position.z+=f.vz*dt;f.mesh.rotation.x+=dt*6}
  if(f.grow){f.mesh.scale.multiplyScalar(1+dt*f.grow);f.mesh.material.opacity=Math.max(0,f.t/f.max)}if(f.beam)f.mesh.material.opacity=f.t/f.max;
  if(f.t<=0){scene.remove(f.mesh);fx.splice(fx.indexOf(f),1)}}
 const Mx=new THREE.Matrix4();for(let i=0;i<DUST;i++){const d=dd[i];Mx.makeTranslation(d[0]+Math.sin(t*.3+d[3])*2,d[1]+Math.sin(t*.7+d[3]*2)*.5,d[2]);dust.setMatrixAt(i,Mx)}dust.instanceMatrix.needsUpdate=true;
 camUpdate(dt,t);hud(dt);render()}
buildHUD();renderSelect();preview();requestAnimationFrame(loop);
window.__game={get state(){return state},get players(){return players},get pickups(){return pickups},get fps(){return fps},equip:(i,t)=>equip(players[i],t)};
