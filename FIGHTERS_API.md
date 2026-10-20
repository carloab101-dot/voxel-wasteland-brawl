# fighters.js API
```js
import { createFighter, HITBOXES, FIGHTER_IDS, ANIMS } from './fighters.js';
const f = createFighter('dweller');   // ids: dweller brute ghoul paladin bot (aliases: vault-kid, mutant, robot, ...)
scene.add(f.group);
f.group.position.set(x, y, 0);        // y = feet; ~2.0 tall (brute 2.5, paladin 2.2), faces +X
f.group.scale.x = face;               // face = 1 / -1 (no other scaling needed — do NOT apply chibify or CS*1.25)
f.setAnim('walk');                    // idle walk jump punch kick block hit ko win
f.update(dt);                         // every render frame
f.handR.add(gunMesh);                 // anchor Object3D named 'hand_R' (also f.parts.hand_R, group.userData.handR)
f.flash();                            // white hit flash + 'hit' one-shot
f.land(0.3);                          // squash on landing (jump auto-stretches)
f.hitbox / HITBOXES[id] / group.userData.hitbox -> {w,h}; visuals stay within w on X.
```
- Looping anims: idle, walk, jump, block, ko, win. One-shots (punch .32s, kick .42s, hit .3s) play over the current loop then return to it; re-trigger with `setAnim('punch',{restart:true})`.
- `f.parts`: root, rig, hips, torso, head, armL/armR, foreL/foreR, legL/legR, kneeL/kneeR, hand_R/hand_L, glow (ghoul PointLight). Rotate `.x` on limbs = forward swing if you want to override.
- Ghoul includes a PointLight (as before).

## game.js integration (replace buildChar/chibify)
1. `makePlayer`: `const F=createFighter(ch.id); p.F=F; p.m={g:F.group,b:F.parts.torso,head:F.parts.head,aR:F.parts.foreR}; scene.add(F.group)`.
2. Loop: drop the manual limb rotations / g.rotation.y / CS scale; set `F.group.scale.x=p.face`, pick anim: dead→ko, winner→win, meleeT>0→punch, hurt→flash() once, !ground→jump, |vx|>.5→walk, else idle; call `F.update(dt)`. On landing call `F.land()`.
3. Guns: `equip()` should add the gun to `F.handR` (rotation now relative to the forearm, pointing down: try `gun.rotation.z=-Math.PI/2`, aim arm with `setAnim('punch')`-like pose or set `F.parts.armR.rotation.x=-1.5` after update).
4. Hit/projectile code using `PH*(ch.scale)`/`.45*scale` can switch to `HITBOXES[id]`.
5. Built-in sizes already include brute/paladin scale; CHARS[].scale should not be applied again to visuals.
Preview: ref/preview.html (served from this folder) → fighters_preview.png, ref/preview_actions.png.

## Spec API (stateless) — preferred for game.js
```js
import { buildFighter, animate, HITBOXES, STATES } from './fighters.js';
const g = buildFighter('vault_kid'); // vault_kid mutant_brute glow_ghoul iron_paladin assault_bot (or dweller/brute/ghoul/paladin/bot)
g.userData.hitbox   // {w,h}
g.getObjectByName('hand_R')   // gun anchor; pivots named: rig hips torso head arm_L arm_R fore_L fore_R leg_L leg_R knee_L knee_R hand_L hand_R
animate(g, state, t) // every frame. Pure pose from (state,t): nothing carried between calls.
```
States: idle, run (=walk), jump, climb, melee (=punch), shoot (right arm held forward, recoil every 0.15s), special, hit, ko, plus kick, block, win.
`t` = seconds since the state began for one-shots (melee 0.32s, kick 0.42s, special 0.5s, hit 0.3s, ko settles by 0.5s, jump stretch eases over 0.2s). Loops (idle/run/climb/shoot/win) work with either local or global time.
Special flourish per fighter: Vault Kid overhand grenade throw, Brute two-arm boulder lift, Ghoul both-hands rad push, Paladin braced shoulder-missile stance, Bot wide stance for the head laser.
Game-side effects stay in game.js: hit flash (or call `g.userData.fighter.flash()` + `.update(dt)` instead of animate), landing squash (scale `g` briefly), and run lean comes from the `run` pose.
Previews: previews/fighters.png (all 5), previews/states.png (rows = fighters, cols = idle run jump climb melee shoot special hit ko), made by ref/sheet.html.
