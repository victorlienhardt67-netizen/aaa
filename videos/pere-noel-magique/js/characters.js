// Stylised figurine characters: family, elves and Santa (with a lip-sync rig).
import * as THREE from "three";
import { mat, felt, glow, mesh, sph, cap, cyl, cone, torus, rbox, group, bentCone } from "./util.js";

const SKIN = "#f3c6a5";
const EYE = mat("#2a1a14", { roughness: 0.25 });
const SPARK = glow("#ffffff", 1.4);

function eye(parent, x, y, z, r) {
  const g = group({ p: [x, y, z], parent });
  sph(r, EYE, { parent: g, cast: false }, 20, 14);
  sph(r * 0.32, SPARK, { p: [r * 0.35, r * 0.4, r * 0.75], parent: g, cast: false }, 10, 8);
  return g;
}

// A bendy arm: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand.
function arm(parent, side, o) {
  const sh = group({ p: [side * o.shX, o.shY, 0], parent });
  cap(o.r, o.upper, o.sleeve, { p: [0, -o.upper / 2 - o.r * 0.3, 0], parent: sh });
  const el = group({ p: [0, -o.upper - o.r * 0.6, 0], parent: sh });
  cap(o.r * 0.92, o.fore, o.sleeve, { p: [0, -o.fore / 2, 0], parent: el });
  if (o.cuff) torus(o.r * 0.95, o.r * 0.35, o.cuff, { p: [0, -o.fore - o.r * 0.2, 0], r: [Math.PI / 2, 0, 0], parent: el });
  const hand = sph(o.hand, o.handMat, { p: [0, -o.fore - o.r * 0.9, 0], parent: el });
  return { sh, el, hand };
}

export function makeHuman(o = {}) {
  const k = o.child ? 0.74 : 1;
  const root = group();
  const body = group({ s: k, parent: root });
  const top = felt(o.top || "#4a7c59");
  const bottom = felt(o.bottom || "#3b4a6b");
  const skin = mat(o.skin || SKIN, { roughness: 0.6 });
  const hair = felt(o.hair || "#6b3f24");
  const seated = !!o.seated;
  const hipY = seated ? 0 : 0.62;
  const hips = group({ p: [0, hipY, 0], parent: body });

  // legs
  const legs = [];
  for (const s of [-1, 1]) {
    const L = group({ p: [s * 0.1, 0, 0], parent: hips });
    if (seated) {
      cap(0.085, 0.28, bottom, { p: [0, 0.02, 0.16], r: [Math.PI / 2, 0, 0], parent: L });
      cap(0.075, 0.26, bottom, { p: [0, -0.2, 0.33], parent: L });
      rbox(0.14, 0.09, 0.22, 0.04, felt(o.shoes || "#3a2a22"), { p: [0, -0.4, 0.38], parent: L });
    } else {
      cap(0.085, 0.42, bottom, { p: [0, -0.28, 0], parent: L });
      rbox(0.14, 0.09, 0.22, 0.04, felt(o.shoes || "#3a2a22"), { p: [0, -0.6, 0.04], parent: L });
    }
    legs.push(L);
  }
  // torso
  const torso = group({ parent: hips });
  cap(0.2, 0.3, top, { p: [0, 0.3, 0], s: [1, 1, 0.82], parent: torso });
  if (o.elf) {
    // pointed felt collar
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      cone(0.06, 0.14, felt("#c8322f"), { p: [Math.sin(a) * 0.17, 0.52, Math.cos(a) * 0.15], r: [Math.cos(a) * 1.9, 0, -Math.sin(a) * 1.9], parent: torso });
    }
    cyl(0.215, 0.215, 0.06, felt("#3a2a22"), { p: [0, 0.22, 0], s: [1, 1, 0.82], parent: torso });
    rbox(0.08, 0.07, 0.03, 0.01, glow("#ffcf5a", 0.4), { p: [0, 0.22, 0.17], parent: torso });
  }
  if (o.collar) torus(0.13, 0.04, felt(o.collar), { p: [0, 0.55, 0], r: [Math.PI / 2, 0, 0], parent: torso });

  const armO = { shX: 0.24, shY: 0.47, r: 0.065, upper: 0.17, fore: 0.15, sleeve: top, hand: 0.065, handMat: o.elf ? felt("#c8322f") : skin };
  const armL = arm(torso, -1, armO), armR = arm(torso, 1, armO);
  armL.sh.rotation.z = -0.15; armR.sh.rotation.z = 0.15;

  // head
  const neck = group({ p: [0, 0.6, 0], parent: torso });
  const hr = o.child ? 0.34 : 0.3;
  const head = group({ p: [0, hr * 0.85, 0], parent: neck });
  sph(hr, skin, { parent: head }, 32, 24);
  const eyes = [eye(head, -hr * 0.34, hr * 0.12, hr * 0.86, hr * 0.15), eye(head, hr * 0.34, hr * 0.12, hr * 0.86, hr * 0.15)];
  const brows = [-1, 1].map((s) => cap(0.012, hr * 0.18, hair, { p: [s * hr * 0.34, hr * 0.42, hr * 0.84], r: [0, 0, Math.PI / 2 + s * 0.12], parent: head, cast: false }));
  sph(hr * 0.12, mat("#eaa98a", { roughness: 0.6 }), { p: [0, -hr * 0.05, hr * 0.98], parent: head });
  for (const s of [-1, 1]) sph(hr * 0.16, mat("#f29a8c", { roughness: 0.7, transparent: true, opacity: 0.75 }), { p: [s * hr * 0.55, -hr * 0.18, hr * 0.74], s: [1, 0.6, 0.4], parent: head, cast: false });
  const smile = torus(hr * 0.2, hr * 0.035, mat("#8a3a32"), { p: [0, -hr * 0.28, hr * 0.92], r: [0.25, 0, Math.PI], parent: head, cast: false }, Math.PI);
  const mouthO = sph(hr * 0.13, mat("#5a1f22"), { p: [0, -hr * 0.36, hr * 0.92], s: [1, 1.1, 0.4], parent: head, cast: false });
  mouthO.visible = false;
  // ears
  if (o.elf) {
    for (const s of [-1, 1]) cone(hr * 0.16, hr * 0.62, skin, { p: [s * hr * 1.05, hr * 0.12, 0], r: [0, 0, -s * 1.15], s: [1, 1, 0.5], parent: head });
  } else {
    for (const s of [-1, 1]) sph(hr * 0.13, skin, { p: [s * hr * 0.98, 0, 0], s: [0.6, 1, 1], parent: head });
  }
  // hair / hats
  const hs = o.hairStyle || "short";
  if (o.elf) {
    const hat = group({ p: [0, hr * 0.55, -hr * 0.05], parent: head });
    torus(hr * 0.86, hr * 0.13, felt("#c8322f"), { r: [Math.PI / 2, 0, 0], parent: hat });
    const c1 = cone(hr * 0.86, hr * 1.1, felt(o.hat || "#2f7d4a"), { p: [0, hr * 0.5, -hr * 0.05], r: [-0.25, 0, 0], parent: hat });
    const tip = group({ p: [0, hr * 0.95, -hr * 0.32], r: [-0.9, 0, 0], parent: hat });
    cone(hr * 0.42, hr * 0.8, felt(o.hat || "#2f7d4a"), { p: [0, hr * 0.3, 0], parent: tip });
    sph(hr * 0.17, felt("#fff7ea"), { p: [0, hr * 0.72, 0], parent: tip });
    c1.castShadow = true;
  } else {
    sph(hr * 1.05, hair, { p: [0, hr * 0.13, -hr * 0.13], parent: head }, 32, 24);
    if (hs === "bun") sph(hr * 0.42, hair, { p: [0, hr * 0.85, -hr * 0.55], parent: head });
    if (hs === "pigtails") {
      for (const s of [-1, 1]) { sph(hr * 0.36, hair, { p: [s * hr * 1.08, -hr * 0.05, -hr * 0.25], s: [0.8, 1.15, 0.9], parent: head }); sph(hr * 0.1, felt("#d23c3c"), { p: [s * hr * 0.98, hr * 0.28, -hr * 0.2], parent: head }); }
      sph(hr * 0.5, hair, { p: [0, hr * 0.62, hr * 0.42], s: [1.3, 0.5, 0.7], parent: head });
    }
    if (hs === "short") sph(hr * 0.55, hair, { p: [0, hr * 0.7, hr * 0.28], s: [1.4, 0.45, 0.8], parent: head });
    if (o.beard) {
      const b = sph(hr * 0.85, hair, { p: [0, -hr * 0.35, hr * 0.18], s: [1.05, 0.7, 0.9], parent: head });
      b.renderOrder = 1; smile.position.z += hr * 0.05; smile.position.y -= hr * 0.02; mouthO.position.z += hr * 0.06;
    }
    if (o.glasses) for (const s of [-1, 1]) torus(hr * 0.2, hr * 0.025, mat("#3a2a22"), { p: [s * hr * 0.34, hr * 0.12, hr * 0.95], parent: head });
  }
  return { root, body, hips, torso, head, neck, eyes, brows, smile, mouthO, armL, armR, legs, hr };
}

export function makeElf(o = {}) {
  return makeHuman({ elf: true, top: o.top || "#2f7d4a", bottom: o.bottom || "#7a2a26", hat: o.hat || o.top || "#2f7d4a", hair: "#a0522d", skin: o.skin || "#f6cdb0", shoes: "#5a3a22", seated: o.seated, child: true, ...o });
}

// ---------------------------------------------------------------- Santa
export function makeSanta() {
  const R = felt("#c0262c"), RD = felt("#9c1d23");
  const W = mat("#fbf7f0", { roughness: 1 });
  const FUR = mat("#fffaf2", { roughness: 1 });
  const skin = mat("#f4c3a3", { roughness: 0.55 });
  const root = group();
  // seated body
  const body = group({ parent: root });
  sph(0.95, R, { p: [0, 1.25, 0], s: [1.05, 1.0, 0.86], parent: body }, 40, 30);
  cyl(0.97, 0.97, 0.2, felt("#2a1a16"), { p: [0, 1.0, 0], s: [1.05, 1, 0.87], parent: body }, 40);
  rbox(0.34, 0.26, 0.08, 0.04, mat("#e9b949", { metalness: 0.8, roughness: 0.25 }), { p: [0, 1.0, 0.84], parent: body });
  rbox(0.2, 0.14, 0.09, 0.03, mat("#2a1a16"), { p: [0, 1.0, 0.86], parent: body });
  rbox(0.26, 0.75, 0.1, 0.05, FUR, { p: [0, 1.22, 0.83], r: [-0.12, 0, 0], parent: body });
  // legs
  for (const s of [-1, 1]) {
    cap(0.24, 0.55, R, { p: [s * 0.42, 0.62, 0.55], r: [Math.PI / 2 - 0.15, 0, 0], parent: body });
    cap(0.21, 0.4, R, { p: [s * 0.45, 0.18, 0.95], r: [0.1, 0, 0], parent: body });
    torus(0.22, 0.07, FUR, { p: [s * 0.45, -0.05, 0.97], r: [Math.PI / 2, 0, 0], parent: body });
    rbox(0.34, 0.24, 0.55, 0.1, mat("#1d1412", { roughness: 0.35 }), { p: [s * 0.45, -0.2, 1.08], parent: body });
  }
  // arms
  const armO = { shX: 0.85, shY: 1.8, r: 0.2, upper: 0.42, fore: 0.36, sleeve: R, cuff: FUR, hand: 0.17, handMat: W };
  const torso = group({ parent: body });
  const armL = arm(torso, -1, armO), armR = arm(torso, 1, armO);
  for (const a of [armL, armR]) sph(0.07, W, { p: [0.12, 0.05, 0.05], parent: a.hand });

  // head rig
  const neck = group({ p: [0, 2.05, 0.08], parent: torso });
  const head = group({ p: [0, 0.42, 0], parent: neck });
  sph(0.5, skin, { parent: head }, 48, 36);
  for (const s of [-1, 1]) sph(0.11, skin, { p: [s * 0.49, 0.02, 0], s: [0.55, 1, 1], parent: head });
  sph(0.115, mat("#e98f86", { roughness: 0.45 }), { p: [0, -0.02, 0.5], parent: head }, 28, 20);
  const cheeks = [-1, 1].map((s) => sph(0.15, mat("#ec9a92", { roughness: 0.6 }), { p: [s * 0.26, -0.06, 0.39], s: [1, 0.75, 0.6], parent: head }));
  const eyes = [eye(head, -0.17, 0.12, 0.44, 0.068), eye(head, 0.17, 0.12, 0.44, 0.068)];
  // eyelids (skin caps that close over the eyes for blinks)
  const lids = [-1, 1].map((s) => { const g = group({ p: [s * 0.17, 0.12, 0.43], parent: head }); const m = sph(0.085, skin, { s: [1, 1, 0.7], parent: g, cast: false }, 20, 12); m.geometry = new THREE.SphereGeometry(0.085, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5); g.rotation.x = -1.35; return g; });
  const brows = [-1, 1].map((s) => { const g = group({ p: [s * 0.18, 0.27, 0.43], r: [0, 0, s * -0.12], parent: head }); for (let i = 0; i < 4; i++) sph(0.052 - i * 0.004, FUR, { p: [s * (i * 0.045 - 0.06), -i * 0.004, 0.0], parent: g }, 14, 10); return g; });
  // glasses
  const glassM = mat("#d6a640", { metalness: 0.9, roughness: 0.25 });
  for (const s of [-1, 1]) torus(0.095, 0.011, glassM, { p: [s * 0.17, 0.1, 0.52], parent: head });
  cyl(0.009, 0.009, 0.12, glassM, { p: [0, 0.12, 0.54], r: [0, 0, Math.PI / 2], parent: head });
  // mouth
  const mouth = group({ p: [0, -0.24, 0.47], parent: head });
  const inner = sph(0.1, mat("#4b1519", { roughness: 0.6 }), { s: [1, 0.25, 0.45], parent: mouth, cast: false });
  const teeth = rbox(0.12, 0.03, 0.04, 0.012, mat("#fffdf6", { roughness: 0.3 }), { p: [0, 0.018, 0.02], parent: mouth, cast: false });
  const tongue = sph(0.06, mat("#c8545a"), { p: [0, -0.02, 0.0], s: [1, 0.35, 0.6], parent: mouth, cast: false });
  const lowerLip = cap(0.022, 0.12, mat("#d27a76", { roughness: 0.5 }), { p: [0, -0.03, 0.035], r: [0, 0, Math.PI / 2], parent: mouth, cast: false });
  // beard: fluffy clusters around the mouth, chin part on a jaw pivot
  const beard = group({ parent: head });
  const jaw = group({ p: [0, -0.2, 0.1], parent: head });
  const puff = (p, r, parent) => sph(r, FUR, { p, parent }, 18, 14);
  const pts = [[-0.44, -0.05, 0.2, 0.17], [0.44, -0.05, 0.2, 0.17], [-0.42, -0.25, 0.25, 0.19], [0.42, -0.25, 0.25, 0.19], [-0.33, -0.42, 0.3, 0.2], [0.33, -0.42, 0.3, 0.2], [0, -0.05, -0.1, 0.48]];
  for (const [x, y, z, r] of pts) puff([x, y, z], r, beard);
  const jawPts = [[-0.2, -0.33, 0.32, 0.19], [0.2, -0.33, 0.32, 0.19], [0, -0.42, 0.33, 0.21], [0, -0.62, 0.22, 0.24], [-0.22, -0.58, 0.18, 0.2], [0.22, -0.58, 0.18, 0.2], [0, -0.78, 0.08, 0.2]];
  for (const [x, y, z, r] of jawPts) puff([x, y + 0.2, z - 0.1], r, jaw);
  // moustache
  const stache = group({ p: [0, -0.15, 0.5], parent: head });
  const mL = group({ p: [-0.13, 0, 0], r: [0, 0.25, 0.22], parent: stache });
  const mR = group({ p: [0.13, 0, 0], r: [0, -0.25, -0.22], parent: stache });
  puff([0, 0, 0], 0.1, mL).scale.set(1.5, 0.75, 0.75); puff([-0.12, -0.03, -0.04], 0.07, mL).scale.set(1.3, 0.8, 0.8);
  puff([0, 0, 0], 0.1, mR).scale.set(1.5, 0.75, 0.75); puff([0.12, -0.03, -0.04], 0.07, mR).scale.set(1.3, 0.8, 0.8);
  // hair at the sides
  for (const s of [-1, 1]) puff([s * 0.42, 0.18, -0.12], 0.17, head);
  // floppy hat drooping to the side
  const hat = group({ p: [0, 0.3, -0.04], r: [-0.12, 0, 0], parent: head });
  torus(0.47, 0.11, FUR, { r: [Math.PI / 2, 0, 0], parent: hat });
  const hatTip = group({ parent: hat });
  bentCone(0.46, 0.03, 1.05, 2.3, R, { p: [0, 0.02, 0], parent: hatTip });
  sph(0.13, FUR, { p: [0.62, 0.42, 0], parent: hatTip });
  const hatLinks = [];

  return { root, body, torso, neck, head, eyes, lids, brows, cheeks, mouth, inner, teeth, tongue, lowerLip, jaw, stache, armL, armR, hatTip, hatLinks };
}

// Mouth shapes for Santa driven by viseme curves (open/round/wide in 0..1).
export function santaMouth(s, open, round, wide, smile = 0.4) {
  const sx = 1.0 + wide * 0.35 - round * 0.45 + smile * 0.15;
  const sy = 0.12 + open * 1.05 + round * 0.15;
  s.inner.scale.set(sx, 0.25 * Math.max(0.12, sy) * 1.6, 0.45);
  s.teeth.visible = open > 0.12;
  s.teeth.scale.set(Math.max(0.6, sx * 0.9), 1, 1);
  const half = 0.1 * s.inner.scale.y;
  s.tongue.position.y = -half * 0.45;
  s.teeth.position.y = half * 0.55;
  s.lowerLip.position.y = -half - 0.006;
  s.lowerLip.scale.set(1, Math.max(0.5, sx * 0.85), 1);
  s.jaw.position.y = -0.2 - open * 0.06;
  s.jaw.rotation.x = open * 0.08;
  s.stache.position.y = -0.15 + open * 0.012;
  s.stache.scale.set(1 + wide * 0.06 + smile * 0.05, 1, 1);
  for (const c of s.cheeks) c.position.y = -0.06 + smile * 0.03;
}
