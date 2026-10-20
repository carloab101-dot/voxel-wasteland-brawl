# Fighter style notes (match Fight Maker "Voxel Diorama")
References (read-only): /workspace/fight-maker/cyber-forest-3d.html, /workspace/fight-maker/cf3d/kit.js (VOX builder, edgeTex),
/workspace/fight-maker/cf3d/v1.js (lights), /workspace/fight-maker/3d_v1.png, /workspace/fight-maker/3d2b_cats.png; current game.js buildChar/chibify.
- Voxel grain: 0.125 world units (cf3d uses v=.125). Every fighter box is a multiple of it.
- Faces: MeshStandard roughness .78, metalness 0, 32px edge texture (dark 1px outline + light top bevel) = the cf3d "voxel cube" look. Glow bits are MeshBasic, toneMapped:false (eyes, Pip-Boy, rad spots, visors).
- Proportions: chibi. Head ~0.875 (44%), torso ~0.625, legs ~0.5; total ~2.0. Brute x1.25, Paladin x1.1. Wide squat stance.
- Palette: warm wasteland mids; saturated identity colors (vault blue 2457c5/yellow f3c623, mutant green 6f8f3a, ghoul tan 8a7a4a + rad green 7aff3a, steel 9aa0a6 + rust 8a2a10, robot b8b8b0 + yellow c8b020 + red eye).
- Lighting: warm hemi (ffe0b0/50301a) + warm sun key with soft shadows; small emissive accents pop under tilt-shift DOF.
- Animation feel: snappy, toy-like: fast lerp to poses (~18/s), squash & stretch on jump/land, forward lean when running, head bob/sway idle, white hit flash, cartoon KO fall-over, bouncing win.
