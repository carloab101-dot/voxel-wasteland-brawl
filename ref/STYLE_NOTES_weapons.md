# Weapons style notes: Voxel Diorama reference

References (read-only):
- /workspace/fight-maker/cyber-forest-3d.html (the Voxel Diorama build)
- /workspace/fight-maker/cf3d/v1.js: "VERSION 1: VOXEL DIORAMA". Everything is small cubes, with an orthographic iso camera and a tilt-shift DOF pass.
- /workspace/fight-maker/cf3d/kit.js: the VOX builder (sparse grid split into two InstancedMeshes, lit and glow), edgeTex, mats
- /workspace/fight-maker/3d_v1.png (screenshot)
- /workspace/voxel-wasteland-brawl/game.js: the current restyle (floating island, dusk palette, tilt-shift)

## Voxel size
- Diorama characters use v≈0.036 for the body and 0.028 for the head. Props are coarser.
- Wasteland: the island uses 0.5 voxels, details 0.25, and character parts are built from cubes about 0.1 to 0.3.
- Weapons use **v = 1/16 = 0.0625** (so a pistol is about 8×4 voxels and a rifle about 18×4). Props use **0.25** and match the ladders and barrels in game.js.

## Palette
- Dusk: sky 0xf29e52 → 0x6b332e, sun 0xffc880, hemisphere 0xffe0b0/0x50301a.
- Gun metals stay muted: 0x2e2e2e, 0x4a4a48, 0x6a6a62. Wood: 0x8b5a2b and 0x6b4423. Rust: 0x8a5634 and 0x94603a. Brass: 0xb08a40.
- Saturation is reserved for energy: lasers 0xff3322, plasma 0x44ff66, Nuka red 0xc8201e, rad yellow 0xd2b020.

## Shading and lighting
- MeshStandardMaterial with roughness about 0.78 to 0.9 and metalness 0. Colors are set per instance through InstancedMesh.setColorAt.
- Every lit voxel casts and receives shadows. Light comes from one warm directional sun plus a hemisphere fill.
- Glow voxels use MeshBasicMaterial (toneMapped:false) with color×1.35 and cast no shadow. This is the kit.js "lit + glow" split.

## Outlines
- There are no geometric outlines. kit.js edgeTex is a 32px white tile with an rgba(0,0,0,.28) border stroke and a small top highlight. Multiplied over the voxel color, it gives every cube a dark bevel line.
- weapons.js recreates the same texture with a canvas.

## Effect style
- Effects are made of cubes. Particles are unlit (MeshBasic) boxes that fly out, fall, and shrink. Flashes are cubes that grow and fade.
- Beams are long thin boxes. A mushroom cloud is stacked voxel shells.

## Scale relative to characters
- 1 world unit = one voxel-character block. Fighters are about 2 units tall (game.js then applies its own ×1.25 chibi scale).
- A pistol is about 0.55 units long and a rifle about 1.1. The Fat Man is about 1.3.
- The grip origin sits at the right-hand anchor and the barrel points along +X.
