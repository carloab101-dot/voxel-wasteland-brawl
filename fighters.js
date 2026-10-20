// fighters.js — voxel chibi fighters for Wasteland Brawl (Fight Maker "Voxel Diorama" style)
// createFighter(id, opts) -> { group, parts, hitbox, setAnim(name), update(dt), flash(), land(), dispose() }
// Units: ~2 world units tall (brute 2.5), feet at y=0, faces +X (flip with group.scale.x=-1).
import * as THREE from './three.module.min.js';

const V = 0.125; // voxel grain: every box is a multiple of this
const BOX = new THREE.BoxGeometry(1, 1, 1);
const MATS = {};
let EDGE = null;
function edgeTex() { // faint bevel/outline per face like cf3d VOX edgeTex
  if (EDGE !== null || typeof document === 'undefined') return EDGE;
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 32, 32); x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 2; x.strokeRect(1, 1, 30, 30);
  x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(3, 3, 26, 2);
  EDGE = new THREE.CanvasTexture(c); EDGE.magFilter = THREE.NearestFilter; EDGE.colorSpace = THREE.SRGBColorSpace; return EDGE;
}
function mat(c, glow) {
  const k = c + '_' + (glow ? 1 : 0);
  if (!MATS[k]) MATS[k] = glow ? new THREE.MeshBasicMaterial({ color: c, toneMapped: false })
    : new THREE.MeshStandardMaterial({ color: c, map: edgeTex(), roughness: .78, metalness: 0 });
  return MATS[k];
}
// box in voxel units: (parent, x,y,z centre, w,h,d size) all ×V; c=color, g=glow
function vx(p, x, y, z, w, h, d, c, g) {
  const m = new THREE.Mesh(BOX, mat(c, g)); m.position.set(x * V, y * V, z * V); m.scale.set(w * V, h * V, d * V);
  m.castShadow = !g; m.receiveShadow = true; m.userData.baseColor = c; p.add(m); return m;
}
const J = (p, x, y, z, name) => { const g = new THREE.Group(); g.name = name; g.position.set(x * V, y * V, z * V); p.add(g); return g; };

export const FIGHTER_IDS = ['dweller', 'brute', 'ghoul', 'paladin', 'bot'];
export const ALIASES = { vault_kid: 'dweller', mutant_brute: 'brute', glow_ghoul: 'ghoul', iron_paladin: 'paladin', assault_bot: 'bot', vaultkid: 'dweller', 'vault-kid': 'dweller', mutant: 'brute', 'glow-ghoul': 'ghoul', 'iron-paladin': 'paladin', robot: 'bot', 'assault-bot': 'bot' };
// collision boxes (world units, before any extra scale the game applies). Visuals stay inside.
export const HITBOXES = {
  dweller: { w: 0.9, h: 2.0 }, ghoul: { w: 0.85, h: 2.0 }, bot: { w: 0.9, h: 2.0 },
  paladin: { w: 1.0, h: 2.2 }, brute: { w: 1.25, h: 2.5 },
};
const SCALE = { dweller: 1, ghoul: 1, bot: 1, paladin: 1.1, brute: 1.25 };

// ---- generic chibi rig (built facing +Z inside `rig`, rig turned so front = +X) ----
// heights in voxels (V=.125): legs 4 (0.5), torso 5 (0.625), head 7 (0.875)  => ~16 vox = 2.0
function rigBase(S) {
  const group = new THREE.Group(); group.name = 'fighter';
  const rig = J(group, 0, 0, 0, 'rig'); rig.rotation.y = Math.PI / 2;
  const hips = J(rig, 0, S.legH, 0, 'hips');
  const torso = J(hips, 0, 0, 0, 'torso');
  const head = J(torso, 0, S.torH, 0, 'head');
  const sh = S.torH - 1;
  const aL = J(torso, -S.shX, sh, 0, 'arm_L'), aR = J(torso, S.shX, sh, 0, 'arm_R');
  const fL = J(aL, 0, -S.uaH, 0, 'fore_L'), fR = J(aR, 0, -S.uaH, 0, 'fore_R');
  const lL = J(hips, -S.hipX, 0, 0, 'leg_L'), lR = J(hips, S.hipX, 0, 0, 'leg_R');
  const kL = J(lL, 0, -S.legH / 2, 0, 'knee_L'), kR = J(lR, 0, -S.legH / 2, 0, 'knee_R');
  const handR = J(fR, 0, -S.faH, 0.3, 'hand_R'), handL = J(fL, 0, -S.faH, 0.3, 'hand_L');
  return { group, rig, hips, torso, head, aL, aR, fL, fR, lL, lR, kL, kR, handR, handL };
}
// limbs: upper/lower segments, colors [upper, lower, end]
function limbs(P, S, arm, leg) {
  const { uaH, faH, legH, aw = 2, lw = 2 } = S;
  for (const [a, f] of [[P.aL, P.fL], [P.aR, P.fR]]) {
    vx(a, 0, -uaH / 2, 0, aw, uaH, aw, arm[0]); vx(f, 0, -faH / 2 + .5, 0, aw, faH - 1, aw, arm[1]); vx(f, 0, -faH + .5, 0, aw + .4, 1.4, aw + .4, arm[2]);
  }
  const h = legH / 2;
  for (const [l, k] of [[P.lL, P.kL], [P.lR, P.kR]]) {
    vx(l, 0, -h / 2, 0, lw, h, lw, leg[0]); vx(k, 0, -h / 2 + .5, 0, lw, h - 1, lw, leg[1]); vx(k, 0, -h + .5, .4, lw + .2, 1, lw + 1, leg[2]);
  }
}

const BUILD = {
  dweller(P, S) { // blue jumpsuit, yellow trim, Pip-Boy, 33 on back
    const B = 0x2457c5, Y = 0xf3c623, SK = 0xf1c27d, HR = 0x6b3a1a;
    vx(P.torso, 0, 2.5, 0, 5, 5, 3, B); vx(P.torso, 0, 2.5, 1.55, 1, 5, .1, Y); vx(P.torso, 0, .5, 0, 5.2, 1, 3.2, Y);
    vx(P.torso, 0, 3, -1.55, 2, 2, .1, Y); vx(P.torso, 0, 4.6, 0, 3, .8, 2.6, Y);
    const h = P.head; vx(h, 0, 3.5, 0, 6, 6, 6, SK); vx(h, 0, 6.6, -.3, 6.4, 1.4, 6.4, HR); vx(h, 0, 4.5, -3, 6.4, 4, .8, HR); vx(h, 2.6, 5.2, 2.8, 2, 1.2, 1, HR);
    vx(h, -1.3, 3.6, 3.05, 1, 1.4, .1, 0x111111); vx(h, 1.3, 3.6, 3.05, 1, 1.4, .1, 0x111111); vx(h, -1.1, 3.9, 3.1, .4, .4, .1, 0xffffff); vx(h, 1.5, 3.9, 3.1, .4, .4, .1, 0xffffff);
    vx(h, 0, 1.9, 3.05, 1.6, .4, .1, 0x8a2a10); vx(h, -2.2, 2.6, 3.05, .8, .5, .1, 0xff9a8a); vx(h, 2.2, 2.6, 3.05, .8, .5, .1, 0xff9a8a);
    limbs(P, S, [B, B, SK], [B, B, 0x3a2a1a]);
    vx(P.fL, 0, -2, 0, 2.6, 1.8, 2.6, 0x4a4a40); vx(P.fL, -1.35, -2, 0, .2, 1.1, 1.6, 0x66ff55, 1); // Pip-Boy screen
  },
  brute(P, S) {
    const G = 0x6f8f3a, DG = 0x506a28, L = 0x5a3a20;
    vx(P.torso, 0, 2.5, .3, 8, 5.4, 5, G); vx(P.torso, 0, 1, .3, 8.2, 2, 5.2, L); vx(P.torso, 0, 3.5, 2.85, 5, 2.4, .2, DG);
    vx(P.torso, 0, 1.2, 2.95, 1.5, 1, .2, 0xb0a070); // belt buckle
    const h = P.head; h.position.z = 1.2 * V; h.position.y -= .6 * V;
    vx(h, 0, 2.8, 0, 6, 5.4, 5.4, G); vx(h, 0, 4.4, 1.2, 6.2, 1, 3.4, DG); vx(h, -1.4, 3.4, 2.75, 1.2, .7, .1, 0xffee00, 1); vx(h, 1.4, 3.4, 2.75, 1.2, .7, .1, 0xffee00, 1);
    vx(h, 0, 1.4, 2.8, 4, 1.2, .3, 0x2a1a10); vx(h, -1.2, 2, 2.95, .6, .8, .1, 0xeeeecc); vx(h, 1.2, 2, 2.95, .6, .8, .1, 0xeeeecc); vx(h, 1.8, 5.6, -1, 1.4, 1.4, 1.4, DG);
    limbs(P, S, [G, G, DG], [L, L, 0x3a2a18]);
    vx(P.aL, 0, -.6, 0, 3.6, 2, 3.4, DG); vx(P.aR, 0, -.6, 0, 3.6, 2, 3.4, DG); // shoulder lumps
  },
  ghoul(P, S) {
    const SK = 0x8a7a4a, R = 0x5b4a3a, GL = 0x7aff3a;
    vx(P.torso, 0, 2.5, 0, 4.4, 5, 2.8, R); vx(P.torso, -.8, 3, 1.45, 1.4, 2.4, .1, SK); vx(P.torso, 1.2, 1.6, 1.45, 1, 1, .1, GL, 1);
    vx(P.torso, .8, 3.6, 1.45, .6, .6, .1, GL, 1); vx(P.torso, 0, .4, 0, 4.6, .8, 3, 0x3a2a1a);
    const h = P.head; vx(h, 0, 3.4, 0, 5.6, 5.8, 5.6, SK); vx(h, 1.8, 6.4, 0, 1.6, .8, 3, 0x6a5a3a); vx(h, -2, 6.4, -1, 1, .6, 2, 0x6a5a3a);
    vx(h, -1.3, 3.9, 2.85, 1.3, 1.3, .1, GL, 1); vx(h, 1.3, 3.9, 2.85, 1.3, 1.3, .1, GL, 1); vx(h, 0, 1.8, 2.85, 2.8, .7, .1, 0x2a1a10);
    for (const x of [-.9, 0, .9]) vx(h, x, 2.1, 2.9, .4, .4, .1, 0xddddaa);
    vx(h, 2.85, 2.6, 1, .1, 1.4, 1.4, 0xa04040); vx(h, -2.85, 4.6, -.5, .1, 1, 1, GL, 1);
    limbs(P, S, [SK, R, SK], [0x3d3428, 0x3d3428, 0x2a2018]);
    const light = new THREE.PointLight(0x66ff33, 1.5, 4, 2); light.position.y = 3 * V; P.torso.add(light); P.glow = light;
  },
  paladin(P, S) {
    const A = 0x9aa0a6, DA = 0x6a7076, RU = 0x8a2a10, Y = 0xffcc33;
    vx(P.torso, 0, 2.5, 0, 7, 5.4, 4.6, A); vx(P.torso, 0, 2.8, 2.35, 3.6, 3, .2, RU); vx(P.torso, 0, .6, 0, 7.2, 1.2, 4.8, DA);
    vx(P.torso, 0, 3, -3, 4.4, 4, 1.6, DA); vx(P.torso, -1.2, 4.2, -3.9, .8, 1.2, .8, 0x333333); vx(P.torso, 1.2, 4.2, -3.9, .8, 1.2, .8, 0x333333); // fusion core pack
    vx(P.torso, -3.4, 5.6, -1.8, 2, 2, 3, 0x444444); vx(P.torso, -3.4, 5.6, -.2, 1.4, 1.4, .2, 0xff5522, 1); // shoulder missile pod
    const h = P.head; vx(h, 0, 3.2, 0, 5.8, 5.6, 5.8, DA); vx(h, 0, 3.8, 2.95, 4.4, 1, .1, Y, 1); vx(h, 0, 1.6, 3.1, 2.4, 1.6, .6, 0x333333);
    vx(h, -1, 1.3, 3.45, .5, .5, .2, 0x222222); vx(h, 1, 1.3, 3.45, .5, .5, .2, 0x222222); vx(h, 0, 6.2, 0, 1, .8, 4, A);
    S.aw = 2.6; S.lw = 2.6; limbs(P, S, [A, A, DA], [A, A, DA]);
    vx(P.aL, 0, -.4, 0, 3.6, 2, 3.6, DA); vx(P.aR, 0, -.4, 0, 3.6, 2, 3.6, DA); vx(P.kL, 0, -.6, .4, 2.8, 1.2, 3, DA); vx(P.kR, 0, -.6, .4, 2.8, 1.2, 3, DA);
  },
  bot(P, S) { // Mister-Gutsy-ish biped assault robot
    const M = 0xb8b8b0, DM = 0x777770, Y = 0xc8b020, R = 0xff3322;
    vx(P.torso, 0, 2.6, 0, 5, 4.8, 3.4, M); vx(P.torso, 0, 2.8, 1.75, 3, 2.4, .1, DM); vx(P.torso, 0, 2.8, 1.85, 1, 1, .1, 0x33ccff, 1);
    vx(P.torso, 0, .4, 0, 2.6, 1.4, 2.6, 0x555555); vx(P.torso, -1.6, 4.9, 0, 1.6, .8, 3.6, Y); vx(P.torso, 1.6, 4.9, 0, 1.6, .8, 3.6, Y);
    vx(P.torso, 1.6, 4.8, -2.3, .4, 4, .4, 0x333333); // antenna
    const h = P.head; vx(h, 0, 2.8, 0, 5.4, 4.2, 4.6, 0x9a9a92); vx(h, 0, 3, 2.35, 4.4, 1.6, .1, 0x222222); vx(h, 0, 3, 2.42, 2.6, .8, .1, R, 1);
    vx(h, 0, 5.2, 0, 3, .6, 3, DM); vx(h, -2.9, 3, 0, .4, 2, 2, Y); vx(h, 2.9, 3, 0, .4, 2, 2, Y); vx(h, 0, 1, 2.35, 3, .4, .1, 0x444444);
    limbs(P, S, [0x999999, 0x888888, 0x555555], [0x777777, 0x666666, 0x444444]);
    vx(P.fL, 0, -S.faH - .2, .2, .6, 1.4, .6, 0xdddddd); vx(P.fR, 0, -S.faH - .2, .2, .6, 1.4, .6, 0xdddddd); // claws
  },
};
const SPEC = {
  dweller: { legH: 4, torH: 5, shX: 3.2, hipX: 1.2, uaH: 2.2, faH: 2.4 },
  brute:   { legH: 4, torH: 5.4, shX: 5.2, hipX: 2, uaH: 2.6, faH: 2.8, aw: 3, lw: 2.8 },
  ghoul:   { legH: 4, torH: 5, shX: 2.9, hipX: 1.1, uaH: 2.4, faH: 2.6 },
  paladin: { legH: 4, torH: 5.4, shX: 4.6, hipX: 1.8, uaH: 2.4, faH: 2.6 },
  bot:     { legH: 4.4, torH: 5, shX: 3.4, hipX: 1.2, uaH: 2.4, faH: 2.6 },
};
export const ANIMS = ['idle', 'walk', 'jump', 'punch', 'kick', 'block', 'hit', 'ko', 'win'];
const ONESHOT = { punch: .32, kick: .42, hit: .3 }; // seconds, then back to `base`

export function createFighter(rawId, opts = {}) {
  const id = ALIASES[rawId] || rawId; if (!BUILD[id]) throw new Error('unknown fighter ' + rawId);
  const S = { ...SPEC[id] }; const P = rigBase(S); BUILD[id](P, S);
  const sc = (opts.scale ?? 1) * SCALE[id]; P.rig.scale.setScalar(sc);
  const group = P.group, hitbox = { ...HITBOXES[id] };
  group.userData = { fighterId: id, hitbox, handR: P.handR, parts: P, scale: sc };
  const meshes = []; group.traverse(o => { if (o.isMesh) meshes.push(o); });
  const rest = {}; for (const k of ['hips', 'torso', 'head', 'aL', 'aR', 'fL', 'fR', 'lL', 'lR', 'kL', 'kR', 'rig']) rest[k] = { p: P[k].position.clone(), r: P[k].rotation.clone() };
  let anim = 'idle', base = 'idle', t = 0, at = 0, flashT = 0, squash = 0, speed = 1, seed = Math.random() * 10;
  const st = { lean: 0 };
  function setAnim(name, o = {}) {
    if (!ANIMS.includes(name)) return;
    if (ONESHOT[name]) { if (anim !== name || o.restart) at = 0; anim = name; return; }
    if (name === 'jump' && base !== 'jump') squash = -.25; // stretch on takeoff
    base = name; if (!ONESHOT[anim] || name === 'ko') { if (anim !== name) at = 0; anim = name; }
  }
  const lerp = (o, k, v, a) => { o[k] += (v - o[k]) * a; };
  function update(dt) {
    t += dt * speed; at += dt;
    if (ONESHOT[anim] && at > ONESHOT[anim]) { anim = base; at = 0; }
    const a = Math.min(1, dt * 18), r = {}; // target rotations (x = forward swing about rig-local X)
    const set = (k, x = 0, z = 0, y = 0) => r[k] = [x, y, z];
    for (const k of ['hips', 'torso', 'head', 'aL', 'aR', 'fL', 'fR', 'lL', 'lR', 'kL', 'kR']) set(k);
    let hipY = 0, hipZ = 0, rigX = 0, rot = 0; const s = Math.sin(t * 9);
    switch (anim) {
      case 'idle': { const b = Math.sin(t * 3 + seed); hipY = b * .02 - .02; set('aL', b * .05, -.15); set('aR', -b * .05, .15); set('fL', -.5); set('fR', -.5); set('torso', .05 + b * .02); set('head', -.03, 0, Math.sin(t * .7 + seed) * .1); set('kL', .1); set('kR', .1); set('lL', -.05); set('lR', -.05); break; }
      case 'walk': set('lL', s * .8); set('lR', -s * .8); set('kL', Math.max(0, -s) * .9); set('kR', Math.max(0, s) * .9); set('aL', -s * .7, -.1); set('aR', s * .7, .1); set('fL', -.4); set('fR', -.4); set('torso', .18); hipY = Math.abs(Math.cos(t * 9)) * .06; set('head', -.12, 0, 0); break;
      case 'jump': set('lL', -.9); set('kL', 1.4); set('lR', .3); set('kR', .4); set('aL', -2.4, -.3); set('aR', -2.4, .3); set('torso', -.1); break;
      case 'punch': { const k = at / ONESHOT.punch, e = k < .35 ? k / .35 : 1 - (k - .35) / .65; set('aR', -1.57 * e - (1 - e) * .3, .1); set('fR', -.2 * e - (1 - e) * 1.2); set('aL', -.6, -.2); set('fL', -1.6); set('torso', .2 * e, 0, -.35 * e); hipZ = .1 * e; set('lL', .4); set('lR', -.3); set('kR', .3); break; }
      case 'kick': { const k = at / ONESHOT.kick, e = Math.sin(Math.min(1, k * 1.4) * Math.PI); set('lR', -1.5 * e); set('kR', (1 - e) * 1.2); set('lL', .15); set('kL', .2); set('torso', -.25 * e); set('aL', .4 * e, -.6); set('aR', -.6, .5 * e); set('fR', -.8); break; }
      case 'block': set('aL', -1.3, .45); set('aR', -1.3, -.45); set('fL', -1.7); set('fR', -1.7); set('torso', .3); set('head', .1); set('lL', .4); set('lR', -.4); set('kL', .3); set('kR', .5); hipY = -.06; break;
      case 'hit': { const e = Math.max(0, 1 - at / ONESHOT.hit); set('torso', -.5 * e); set('head', -.4 * e, .2 * e); set('aL', -.8 * e, -.7 * e); set('aR', -.8 * e, .7 * e); hipZ = -.12 * e; break; }
      case 'ko': { const e = Math.min(1, at / .5); rigX = 0; rot = -1.45 * e; hipY = -.0; set('aL', -2.6 * e, -.4); set('aR', -2.6 * e, .4); set('head', -.3 * e); set('kL', .3); break; }
      case 'win': { const b = Math.abs(Math.sin(at * 6)); hipY = b * .18; set('aR', -2.9, .2); set('fR', -.2 + Math.sin(at * 12) * .2); set('aL', -.3, -.6); set('fL', -1.8); set('head', -.2, 0, Math.sin(at * 3) * .2); set('torso', -.1); break; }
    }
    for (const k in r) { const o = P[k].rotation, b = rest[k].r; lerp(o, 'x', b.x + r[k][0], a); lerp(o, 'y', b.y + r[k][1], a); lerp(o, 'z', b.z + r[k][2], a); }
    lerp(P.hips.position, 'y', rest.hips.p.y + hipY, a); lerp(P.hips.position, 'z', hipZ, a);
    // KO: fall backward (rig-local X axis is perpendicular to facing); pivot near feet
    lerp(P.rig.rotation, 'x', rot, Math.min(1, dt * 8)); P.rig.position.y = rot !== 0 ? Math.abs(Math.sin(P.rig.rotation.x)) * .25 : 0;
    // squash & stretch (land()/jump), relaxes to 1
    squash += (0 - squash) * Math.min(1, dt * 10); const sy = 1 - squash, sxz = 1 + squash * .5;
    P.rig.scale.set(sc * sxz, sc * sy, sc * sxz);
    // hit flash: tint all lit meshes white-ish
    if (flashT > 0) { flashT -= dt; }
    const f = flashT > 0 ? 1 : 0; for (const m of meshes) if (m.material.emissive) { if (m.userData.flash !== f) { m.userData.flash = f; m.material = f ? flashMat(m.userData.baseColor) : mat(m.userData.baseColor); } }
    if (P.glow) P.glow.intensity = 1.2 + Math.sin(t * 5) * .5;
  }
  return {
    id, group, hitbox, handR: P.handR, setAnim, update,
    get anim() { return anim; }, get base() { return base; },
    parts: { root: group, rig: P.rig, hips: P.hips, torso: P.torso, head: P.head, armL: P.aL, armR: P.aR, foreL: P.fL, foreR: P.fR, legL: P.lL, legR: P.lR, kneeL: P.kL, kneeR: P.kR, hand_R: P.handR, hand_L: P.handL, glow: P.glow || null },
    flash(sec = .12) { flashT = sec; if (anim !== 'ko') setAnim('hit', { restart: true }); },
    land(amount = .3) { squash = amount; },
    setSpeed(v) { speed = v; },
    dispose() { group.removeFromParent(); },
  };
}
// ---- stateless spec API ----
export function buildFighter(id, opts) { const f = createFighter(id, opts); f.group.userData.fighter = f; return f.group; }
const REST = new WeakMap();
const SPECIAL = { // per-fighter flourish, e in 0..1
  dweller: (R, e) => { R.aR = [-2.6 * e, 0, .3]; R.fR = [-.3, 0, 0]; R.torso = [-.2 * e, 0, 0]; },            // grenade overhand
  brute:   (R, e) => { R.aL = [-2.8 * e, 0, -.2]; R.aR = [-2.8 * e, 0, .2]; R.torso = [-.35 * e, 0, 0]; },   // boulder lift
  ghoul:   (R, e) => { R.aL = [-1.5, 0, -.5 * e]; R.aR = [-1.5, 0, .5 * e]; R.fL = [0, 0, 0]; R.fR = [0, 0, 0]; R.head = [-.3 * e, 0, 0]; }, // rad push
  paladin: (R, e) => { R.torso = [.25 * e, 0, -.3 * e]; R.aL = [-.6, 0, -.6 * e]; R.lL = [.4, 0, 0]; R.lR = [-.4, 0, 0]; }, // brace for shoulder missile
  bot:     (R, e) => { R.head = [-.15, 0, 0]; R.torso = [.1, 0, 0]; R.aL = [.3 * e, 0, -.8 * e]; R.aR = [.3 * e, 0, .8 * e]; R.lL = [.5, 0, 0]; R.lR = [-.5, 0, 0]; }, // head-laser stance
};
// animate(group, state, t): t = seconds since the state started (one-shots) / global time (loops). Pure pose, no history.
export function animate(group, state, t = 0) {
  const u = group.userData, P = u.parts; if (!P) return;
  let rest = REST.get(group); if (!rest) { rest = {}; for (const k of ['hips', 'torso', 'head', 'aL', 'aR', 'fL', 'fR', 'lL', 'lR', 'kL', 'kR']) rest[k] = { p: P[k].position.clone(), r: P[k].rotation.clone() }; REST.set(group, rest); }
  const R = {}; for (const k in rest) R[k] = [0, 0, 0];
  let hipY = 0, hipZ = 0, fall = 0, sq = 0; const S = Math.sin(t * 9), cl = x => Math.max(0, Math.min(1, x));
  const st = { run: 'walk', walk: 'walk', melee: 'punch', punch: 'punch' }[state] || state;
  switch (st) {
    case 'idle': { const b = Math.sin(t * 3); hipY = b * .02 - .02; R.aL = [b * .05, 0, -.15]; R.aR = [-b * .05, 0, .15]; R.fL = R.fR = [-.5, 0, 0]; R.torso = [.05, 0, 0]; R.head = [-.03, Math.sin(t * .7) * .1, 0]; R.kL = R.kR = [.1, 0, 0]; break; }
    case 'walk': R.lL = [S * .8, 0, 0]; R.lR = [-S * .8, 0, 0]; R.kL = [Math.max(0, -S) * .9, 0, 0]; R.kR = [Math.max(0, S) * .9, 0, 0]; R.aL = [-S * .7, 0, -.1]; R.aR = [S * .7, 0, .1]; R.fL = R.fR = [-.4, 0, 0]; R.torso = [.18, 0, 0]; R.head = [-.12, 0, 0]; hipY = Math.abs(Math.cos(t * 9)) * .06; break;
    case 'jump': { const e = cl(t * 5); sq = -.2 * (1 - e); R.lL = [-.9, 0, 0]; R.kL = [1.4, 0, 0]; R.lR = [.3, 0, 0]; R.kR = [.4, 0, 0]; R.aL = [-2.4 * e, 0, -.3]; R.aR = [-2.4 * e, 0, .3]; R.torso = [-.1, 0, 0]; break; }
    case 'climb': { const c = Math.sin(t * 8) * .6; R.aL = [-2.6 + c, 0, 0]; R.aR = [-2.6 - c, 0, 0]; R.fL = R.fR = [-.4, 0, 0]; R.lL = [-.6 - c, 0, 0]; R.lR = [-.6 + c, 0, 0]; R.kL = R.kR = [1, 0, 0]; R.head = [-.3, 0, 0]; break; }
    case 'punch': { const k = cl(t / .32), e = k < .35 ? k / .35 : 1 - (k - .35) / .65; R.aR = [-1.57 * e - (1 - e) * .3, 0, .1]; R.fR = [-.2 * e - (1 - e) * 1.2, 0, 0]; R.aL = [-.6, 0, -.2]; R.fL = [-1.6, 0, 0]; R.torso = [.2 * e, -.35 * e, 0]; hipZ = .1 * e; R.lL = [.4, 0, 0]; R.lR = [-.3, 0, 0]; R.kR = [.3, 0, 0]; break; }
    case 'kick': { const e = Math.sin(cl(t / .42 * 1.4) * Math.PI); R.lR = [-1.5 * e, 0, 0]; R.kR = [(1 - e) * 1.2, 0, 0]; R.kL = [.2, 0, 0]; R.torso = [-.25 * e, 0, 0]; R.aL = [.4 * e, 0, -.6]; R.aR = [-.6, 0, .5 * e]; break; }
    case 'shoot': { const k = (t % .15) / .15, rc = k < .3 ? (1 - k / .3) * .25 : 0; R.aR = [-1.57 + rc, 0, 0]; R.fR = [0, 0, 0]; R.aL = [-1.2, 0, .5]; R.fL = [-.6, 0, 0]; R.torso = [.05 - rc * .3, -.2, 0]; R.lL = [.3, 0, 0]; R.lR = [-.25, 0, 0]; break; }
    case 'special': { const e = Math.sin(cl(t / .5) * Math.PI); SPECIAL[u.fighterId](R, e); break; }
    case 'block': R.aL = [-1.3, 0, .45]; R.aR = [-1.3, 0, -.45]; R.fL = R.fR = [-1.7, 0, 0]; R.torso = [.3, 0, 0]; hipY = -.06; break;
    case 'hit': { const e = Math.max(0, 1 - t / .3); R.torso = [-.5 * e, 0, 0]; R.head = [-.4 * e, .2 * e, 0]; R.aL = [-.8 * e, 0, -.7 * e]; R.aR = [-.8 * e, 0, .7 * e]; hipZ = -.12 * e; break; }
    case 'ko': { const e = cl(t / .5); fall = -1.45 * e * e; R.aL = [-2.6 * e, 0, -.4]; R.aR = [-2.6 * e, 0, .4]; R.head = [-.3 * e, 0, 0]; R.kL = [.3, 0, 0]; break; }
    case 'win': { hipY = Math.abs(Math.sin(t * 6)) * .18; R.aR = [-2.9, 0, .2]; R.fR = [-.2 + Math.sin(t * 12) * .2, 0, 0]; R.aL = [-.3, 0, -.6]; R.fL = [-1.8, 0, 0]; R.head = [-.2, Math.sin(t * 3) * .2, 0]; break; }
  }
  for (const k in rest) { const b = rest[k].r, r = R[k]; P[k].rotation.set(b.x + r[0], b.y + r[1], b.z + r[2]); }
  P.hips.position.set(0, rest.hips.p.y + hipY, hipZ);
  P.rig.rotation.x = fall; P.rig.position.y = Math.abs(Math.sin(fall)) * .25;
  const sc = u.scale; P.rig.scale.set(sc * (1 + sq * .5), sc * (1 - sq), sc * (1 + sq * .5));
  if (P.glow) P.glow.intensity = 1.2 + Math.sin(t * 5) * .5;
}
export const STATES = ['idle', 'run', 'jump', 'climb', 'melee', 'shoot', 'special', 'hit', 'ko', 'kick', 'block', 'win'];
const FMATS = {};
function flashMat(c) { return FMATS[c] || (FMATS[c] = new THREE.MeshStandardMaterial({ color: c, emissive: 0xffffff, emissiveIntensity: .8, map: edgeTex(), roughness: .78 })); }
export default createFighter;
