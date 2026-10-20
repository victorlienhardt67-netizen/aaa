// Miniature props for the dioramas.
import * as THREE from "three";
import { mat, felt, glow, mesh, sph, cap, cyl, cone, torus, rbox, group, rng, canvasTex, woodTex, stripeTex, brickTex } from "./util.js";

export const WOOD = () => mat("#9a6340", { map: woodTex("#9a6340", 5), roughness: 0.7, unique: true });

// ---------- room shell: floor + two back walls (cutaway diorama) ----------
export function room({ w, d, h = 3.4, floor = "#a8744f", wall = "#f1e2c8", wallB = "#e6d0ac", accent = null, base = "#f7f3ee", parent, noLeft = false, noRight = false, wainscot = "#7a4a30" }) {
  const g = group({ parent });
  const fl = mat(floor, { map: woodTex(floor, 7), roughness: 0.65, unique: true });
  rbox(w + 0.6, 0.7, d + 0.6, 0.25, mat(base, { roughness: 0.9 }), { p: [0, -0.4, 0], parent: g });
  rbox(w, 0.12, d, 0.04, fl, { p: [0, -0.02, 0], parent: g });
  const wtex = stripeTex(wall, wallB, 18, accent);
  const wm = mat(wall, { map: wtex, unique: true, roughness: 0.9 });
  const ww = mat(wainscot, { roughness: 0.7 });
  if (!noLeft) {
    rbox(0.25, h, d, 0.06, wm, { p: [-w / 2 - 0.12, h / 2, 0], parent: g });
    rbox(0.32, 1.0, d, 0.05, ww, { p: [-w / 2 - 0.1, 0.5, 0], parent: g });
    rbox(0.36, 0.12, d + 0.1, 0.05, ww, { p: [-w / 2 - 0.1, h, 0], parent: g });
  }
  if (!noRight) {
    rbox(w, h, 0.25, 0.06, wm, { p: [0, h / 2, -d / 2 - 0.12], parent: g });
    rbox(w, 1.0, 0.32, 0.05, ww, { p: [0, 0.5, -d / 2 - 0.1], parent: g });
    rbox(w + 0.1, 0.12, 0.36, 0.05, ww, { p: [0, h, -d / 2 - 0.1], parent: g });
  }
  return g;
}

export function xmasTree(o = {}) {
  const g = group(o);
  const r = rng(o.seed || 7);
  const green = felt("#2f6b45"), green2 = felt("#3b8152");
  cyl(0.12, 0.15, 0.4, WOOD(), { p: [0, 0.2, 0], parent: g });
  cyl(0.5, 0.42, 0.3, felt("#b23a3a"), { p: [0, 0.15, 0], parent: g });
  const tiers = [[1.05, 1.1, 0.95], [0.85, 1.0, 1.55], [0.62, 0.9, 2.1], [0.38, 0.75, 2.55]];
  tiers.forEach(([rad, h, y], i) => cone(rad, h, i % 2 ? green2 : green, { p: [0, y, 0], parent: g }));
  const cols = ["#d23c3c", "#e8b84a", "#3c7bd2", "#f2f2f2", "#c94fa0"];
  const lights = [];
  for (let i = 0; i < 46; i++) {
    const k = i / 46, y = 0.6 + k * 2.3, rad = 1.0 * (1 - k * 0.85) + 0.02, a = k * 26 + r() * 0.4;
    const isLight = i % 2 === 0;
    const m = isLight ? glow(["#ffd27a", "#ff8a5a", "#fff0c0"][i % 3], 3) : mat(cols[i % cols.length], { metalness: 0.5, roughness: 0.25 });
    const b = sph(isLight ? 0.045 : 0.075, m, { p: [Math.cos(a) * rad, y, Math.sin(a) * rad], parent: g, cast: !isLight }, 12, 10);
    if (isLight) lights.push(b);
  }
  // star
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.11 : 0.26; i ? star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : star.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const sg = new THREE.ExtrudeGeometry(star, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  sg.center();
  const st = mesh(sg, glow("#ffd35a", 2.5), { p: [0, 3.0, 0], parent: g });
  g.userData = { lights, star: st };
  return g;
}

export function gift(o = {}) {
  const g = group(o);
  const w = o.w || 0.5, h = o.h || 0.4, d = o.d || 0.5;
  rbox(w, h, d, 0.04, mat(o.color || "#c0392b", { roughness: 0.55 }), { p: [0, h / 2, 0], parent: g });
  const rib = mat(o.ribbon || "#f4d27a", { roughness: 0.4, metalness: 0.3 });
  rbox(w + 0.02, h + 0.02, 0.07, 0.02, rib, { p: [0, h / 2, 0], parent: g });
  rbox(0.07, h + 0.02, d + 0.02, 0.02, rib, { p: [0, h / 2, 0], parent: g });
  for (const s of [-1, 1]) torus(0.07, 0.025, rib, { p: [s * 0.06, h + 0.05, 0], r: [0, Math.PI / 2, s * 0.6], parent: g });
  return g;
}

export function sofa(o = {}) {
  const g = group(o);
  const c = felt(o.color || "#b5473f"), c2 = felt(o.color2 || "#a03e37");
  rbox(2.4, 0.45, 1.0, 0.18, c, { p: [0, 0.32, 0], parent: g });
  rbox(2.4, 0.9, 0.35, 0.16, c2, { p: [0, 0.75, -0.42], parent: g });
  for (const s of [-1, 1]) rbox(0.35, 0.65, 1.05, 0.15, c2, { p: [s * 1.15, 0.5, 0], parent: g });
  for (const s of [-0.55, 0.55]) rbox(1.0, 0.18, 0.85, 0.08, c, { p: [s, 0.6, 0.05], parent: g });
  rbox(0.45, 0.4, 0.15, 0.12, felt("#f0d9a8"), { p: [-0.8, 0.85, -0.2], r: [0.2, 0.3, 0.1], parent: g });
  rbox(0.4, 0.38, 0.14, 0.12, felt("#3d6b52"), { p: [0.82, 0.85, -0.2], r: [0.2, -0.3, -0.1], parent: g });
  for (const x of [-1.05, 1.05]) for (const z of [-0.35, 0.35]) cyl(0.05, 0.04, 0.12, WOOD(), { p: [x, 0.05, z], parent: g });
  return g;
}

export function armchair(o = {}) {
  const g = group(o);
  const c = felt(o.color || "#2f5d46"), c2 = felt(o.color2 || "#27503c");
  rbox(2.3, 0.7, 1.9, 0.25, c, { p: [0, 0.45, 0], parent: g });
  rbox(2.3, 2.6, 0.55, 0.25, c2, { p: [0, 1.55, -0.85], parent: g });
  for (const s of [-1, 1]) rbox(0.45, 1.15, 1.95, 0.2, c2, { p: [s * 1.2, 0.85, 0.02], parent: g });
  // buttons
  for (let i = 0; i < 6; i++) sph(0.05, mat("#e6c068", { metalness: 0.6, roughness: 0.3 }), { p: [-0.6 + (i % 3) * 0.6, 1.6 + Math.floor(i / 3) * 0.6, -0.56], parent: g });
  for (const x of [-1.0, 1.0]) for (const z of [-0.8, 0.8]) cyl(0.08, 0.06, 0.15, WOOD(), { p: [x, 0.05, z], parent: g });
  return g;
}

export function fireplace(o = {}) {
  const g = group(o);
  const brick = mat("#c96f52", { map: brickTex(), roughness: 0.9, unique: true });
  rbox(2.2, 1.8, 0.7, 0.08, brick, { p: [0, 0.9, 0], parent: g });
  rbox(2.5, 0.16, 0.85, 0.05, WOOD(), { p: [0, 1.85, 0.05], parent: g });
  rbox(1.2, 1.0, 0.4, 0.1, mat("#24130f"), { p: [0, 0.55, 0.18], parent: g });
  // logs + flames
  for (const s of [-1, 1]) cyl(0.08, 0.08, 0.9, WOOD(), { p: [0, 0.18, 0.3 + s * 0.05], r: [0, s * 0.3, Math.PI / 2], parent: g });
  const flames = [];
  const fcols = ["#ffb347", "#ff7a2f", "#ffd27a"];
  for (let i = 0; i < 5; i++) { const f = cone(0.13 - i * 0.012, 0.5 - i * 0.04, glow(fcols[i % 3], 3.5), { p: [-0.3 + i * 0.15, 0.45, 0.32], parent: g, cast: false }, 12); flames.push(f); }
  const glowCard = mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshBasicMaterial({ color: "#ff8a3a", transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }), { p: [0, 0.55, 0.39], parent: g, cast: false });
  g.userData = { flames, glowCard };
  return g;
}

export function stocking(o = {}) {
  const g = group(o);
  const c = felt(o.color || "#c0262c");
  cap(0.09, 0.25, c, { p: [0, -0.2, 0], parent: g });
  cap(0.08, 0.12, c, { p: [0.08, -0.38, 0], r: [0, 0, Math.PI / 2], parent: g });
  cyl(0.11, 0.11, 0.1, felt("#fbf7f0"), { p: [0, -0.02, 0], parent: g });
  return g;
}

export function windowFrame(o = {}) {
  const g = group(o);
  const night = canvasTex(256, 384, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#14204a"); gr.addColorStop(1, "#3a4f8a"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const r = rng(4); c.fillStyle = "#fff";
    for (let i = 0; i < 70; i++) { c.globalAlpha = 0.4 + r() * 0.6; c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 3, 0, 7); c.fill(); }
    c.globalAlpha = 1; c.fillStyle = "#e8eefc"; c.beginPath(); c.ellipse(w / 2, h + 40, w * 0.9, 110, 0, 0, 7); c.fill();
    c.fillStyle = "#1f3b2e"; for (const x of [50, 190]) { c.beginPath(); c.moveTo(x, h - 120); c.lineTo(x - 30, h - 40); c.lineTo(x + 30, h - 40); c.fill(); }
  });
  mesh(new THREE.PlaneGeometry(1.3, 1.7), new THREE.MeshBasicMaterial({ map: night }), { parent: g, cast: false });
  const fr = mat("#f7efe2", { roughness: 0.6 });
  rbox(1.5, 0.12, 0.14, 0.04, fr, { p: [0, 0.9, 0.04], parent: g });
  rbox(1.6, 0.14, 0.3, 0.05, fr, { p: [0, -0.9, 0.1], parent: g });
  for (const s of [-1, 1]) rbox(0.12, 1.9, 0.14, 0.04, fr, { p: [s * 0.7, 0, 0.04], parent: g });
  rbox(0.06, 1.7, 0.08, 0.02, fr, { p: [0, 0, 0.05], parent: g });
  rbox(1.3, 0.06, 0.08, 0.02, fr, { p: [0, 0.1, 0.05], parent: g });
  // snow on the sill + curtains
  rbox(1.3, 0.08, 0.2, 0.04, mat("#ffffff"), { p: [0, -0.8, 0.12], parent: g });
  for (const s of [-1, 1]) rbox(0.42, 2.1, 0.12, 0.06, felt("#c64b43"), { p: [s * 0.95, 0.05, 0.16], parent: g });
  // garland
  for (let i = 0; i < 9; i++) { const x = -0.8 + i * 0.2; sph(0.05, glow(["#ffd27a", "#ff7a5a", "#bfe3ff"][i % 3], 2.5), { p: [x, 1.0 - Math.sin((i / 8) * Math.PI) * 0.12, 0.12], parent: g, cast: false }, 10, 8); }
  return g;
}

export function lamp(o = {}) {
  const g = group(o);
  cyl(0.25, 0.3, 0.06, mat("#3a2a22"), { p: [0, 0.03, 0], parent: g });
  cyl(0.03, 0.03, 1.8, mat("#3a2a22", { metalness: 0.4 }), { p: [0, 0.9, 0], parent: g });
  cyl(0.25, 0.4, 0.45, glow("#ffd59a", 1.2, { side: THREE.DoubleSide }), { p: [0, 1.9, 0], parent: g, cast: false });
  return g;
}

export function rug(o = {}) {
  const tex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = "#b8463f"; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill();
    c.strokeStyle = "#f2d9a6"; c.lineWidth = 14; for (const rr of [200, 150, 90]) { c.beginPath(); c.arc(w / 2, h / 2, rr, 0, 7); c.stroke(); }
    c.fillStyle = "#f2d9a6"; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; c.beginPath(); c.arc(w / 2 + Math.cos(a) * 120, h / 2 + Math.sin(a) * 120, 10, 0, 7); c.fill(); }
  });
  return mesh(new THREE.CircleGeometry(o.r || 1.6, 48), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1 }), { p: o.p, r: [-Math.PI / 2, 0, 0], parent: o.parent, cast: false });
}

export function coffeeTable(o = {}) {
  const g = group(o);
  cyl(0.6, 0.6, 0.1, WOOD(), { p: [0, 0.45, 0], parent: g }, 40);
  cyl(0.08, 0.12, 0.42, WOOD(), { p: [0, 0.2, 0], parent: g });
  cyl(0.09, 0.08, 0.16, mat("#f2efe8"), { p: [0.2, 0.58, 0.1], parent: g });
  cyl(0.075, 0.075, 0.01, mat("#6b3b22"), { p: [0.2, 0.66, 0.1], parent: g });
  cyl(0.18, 0.18, 0.02, mat("#f2efe8"), { p: [-0.2, 0.51, -0.05], parent: g });
  for (let i = 0; i < 3; i++) cyl(0.06, 0.06, 0.025, mat("#c98a4a"), { p: [-0.25 + i * 0.06, 0.535 + i * 0.012, -0.05 + (i % 2) * 0.03], parent: g });
  return g;
}

export function phone(o = {}) {
  const g = group(o);
  rbox(0.34, 0.68, 0.045, 0.05, mat("#1d1f2a", { roughness: 0.3, metalness: 0.4 }), { parent: g });
  const screen = mesh(new THREE.PlaneGeometry(0.31, 0.64), new THREE.MeshBasicMaterial({ color: 0xe6e6e6 }), { p: [0, 0, 0.024], parent: g, cast: false });
  g.userData.screen = screen;
  return g;
}

// envelope with glowing wax seal; front faces +z
export function envelope(o = {}) {
  const g = group(o);
  const paper = mat("#fbf1dc", { roughness: 0.85, emissive: "#ffe6b0", emissiveIntensity: 0.15 });
  rbox(0.9, 0.6, 0.05, 0.03, paper, { parent: g });
  const flap = new THREE.Shape(); flap.moveTo(-0.44, 0.28); flap.lineTo(0.44, 0.28); flap.lineTo(0, -0.06); flap.closePath();
  mesh(new THREE.ExtrudeGeometry(flap, { depth: 0.012, bevelEnabled: false }), mat("#f3e2c0", { roughness: 0.85 }), { p: [0, 0, 0.026], parent: g });
  cyl(0.09, 0.09, 0.03, glow("#c0262c", 0.6, { roughness: 0.4 }), { p: [0, -0.04, 0.045], r: [Math.PI / 2, 0, 0], parent: g });
  sph(0.03, glow("#ffd35a", 2), { p: [0, -0.04, 0.062], s: [1, 1, 0.3], parent: g, cast: false });
  return g;
}

export function scroll(o = {}) {
  const g = group(o);
  const tex = canvasTex(256, 512, (c, w, h) => { c.fillStyle = "#f8ecd0"; c.fillRect(0, 0, w, h); c.strokeStyle = "#d9b77a"; c.lineWidth = 6; c.strokeRect(14, 14, w - 28, h - 28); c.fillStyle = "#b08850"; for (let i = 0; i < 9; i++) c.fillRect(40, 120 + i * 36, w - 80 - (i % 3) * 30, 8); });
  mesh(new THREE.PlaneGeometry(0.5, 0.8), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, emissive: "#ffd89a", emissiveIntensity: 0.25 }), { parent: g });
  for (const s of [-1, 1]) cyl(0.05, 0.05, 0.6, mat("#b8862f", { metalness: 0.6, roughness: 0.3 }), { p: [0, s * 0.42, 0], r: [0, 0, Math.PI / 2], parent: g });
  return g;
}

export function bicycle(o = {}) {
  const g = group(o);
  const red = mat("#d4302f", { roughness: 0.35, metalness: 0.3 }), blk = mat("#222", { roughness: 0.6 });
  for (const s of [-1, 1]) { torus(0.28, 0.035, blk, { p: [s * 0.42, 0.3, 0], parent: g }); for (let i = 0; i < 4; i++) cyl(0.008, 0.008, 0.54, mat("#ddd", { metalness: 0.8 }), { p: [s * 0.42, 0.3, 0], r: [0, 0, (i / 4) * Math.PI], parent: g }); }
  cyl(0.03, 0.03, 0.62, red, { p: [0, 0.48, 0], r: [0, 0, Math.PI / 2 - 0.2], parent: g });
  cyl(0.03, 0.03, 0.5, red, { p: [-0.18, 0.42, 0], r: [0, 0, 0.6], parent: g });
  cyl(0.03, 0.03, 0.5, red, { p: [0.33, 0.48, 0], r: [0, 0, -0.35], parent: g });
  rbox(0.18, 0.05, 0.1, 0.02, blk, { p: [-0.1, 0.68, 0], parent: g });
  cyl(0.02, 0.02, 0.36, mat("#ccc", { metalness: 0.8 }), { p: [0.4, 0.72, 0], r: [Math.PI / 2, 0, 0], parent: g });
  sph(0.05, glow("#fff1b0", 1.5), { p: [0.48, 0.62, 0], parent: g, cast: false });
  return g;
}

export function lantern(o = {}) {
  const g = group(o);
  cyl(0.12, 0.16, 0.06, mat("#2b2b33", { metalness: 0.6 }), { p: [0, 0, 0], parent: g });
  cyl(0.13, 0.13, 0.3, glow("#ffcf7a", 2.2, { transparent: true, opacity: 0.95 }), { p: [0, 0.18, 0], parent: g, cast: false });
  cone(0.18, 0.15, mat("#2b2b33", { metalness: 0.6 }), { p: [0, 0.4, 0], parent: g });
  return g;
}

export function candyPole(o = {}) {
  const tex = canvasTex(64, 256, (c, w, h) => { c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); c.fillStyle = "#d42a2a"; for (let y = -64; y < h + 64; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + 32); c.lineTo(w, y + 52); c.lineTo(0, y + 20); c.fill(); } }, { repeat: [1, 3] });
  const g = group(o);
  cyl(0.12, 0.12, o.h || 4, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }), { p: [0, (o.h || 4) / 2, 0], parent: g });
  sph(0.22, mat("#e8b84a", { metalness: 0.7, roughness: 0.25 }), { p: [0, (o.h || 4) + 0.1, 0], parent: g });
  return g;
}

export function shelf(o = {}) {
  const g = group(o);
  const r = rng(o.seed || 21);
  const W = o.w || 2.6;
  rbox(W, 2.4, 0.5, 0.05, WOOD(), { p: [0, 1.2, 0], parent: g });
  rbox(W - 0.15, 2.2, 0.42, 0.04, mat("#5a3420"), { p: [0, 1.2, 0.06], parent: g });
  const cols = ["#d23c3c", "#3c7bd2", "#e8b84a", "#4caf6a", "#c94fa0", "#f2f2f2"];
  for (let row = 0; row < 3; row++) {
    rbox(W - 0.1, 0.06, 0.45, 0.02, WOOD(), { p: [0, 0.45 + row * 0.7, 0.04], parent: g });
    for (let x = -W / 2 + 0.3; x < W / 2 - 0.2; x += 0.38 + r() * 0.15) {
      const c = cols[Math.floor(r() * cols.length)], kind = Math.floor(r() * 3), y = 0.48 + row * 0.7;
      if (kind === 0) rbox(0.26, 0.22, 0.22, 0.04, mat(c), { p: [x, y + 0.11, 0.08], parent: g });
      else if (kind === 1) sph(0.13, mat(c, { roughness: 0.4 }), { p: [x, y + 0.13, 0.08], parent: g }, 16, 12);
      else { cyl(0.08, 0.1, 0.3, mat(c), { p: [x, y + 0.15, 0.08], parent: g }); sph(0.07, mat("#f3c6a5"), { p: [x, y + 0.36, 0.08], parent: g }, 12, 10); }
    }
  }
  return g;
}

export function desk(o = {}) {
  const g = group(o);
  rbox(1.6, 0.1, 0.9, 0.03, WOOD(), { p: [0, 0.75, 0], parent: g });
  for (const x of [-0.7, 0.7]) for (const z of [-0.35, 0.35]) cyl(0.04, 0.04, 0.72, WOOD(), { p: [x, 0.37, z], parent: g });
  return g;
}

export function filmCamera(o = {}) {
  const g = group(o);
  const dark = mat("#2a2a30", { roughness: 0.45, metalness: 0.4 }), brass = mat("#c99a3a", { metalness: 0.8, roughness: 0.3 });
  for (const a of [0, 2.1, 4.2]) { const leg = group({ p: [0, 1.15, 0], r: [0, a, 0], parent: g }); cyl(0.03, 0.025, 1.3, WOOD(), { p: [0, -0.55, 0.28], r: [0.45, 0, 0], parent: leg }); }
  const head = group({ p: [0, 1.35, 0], parent: g });
  rbox(0.5, 0.42, 0.62, 0.06, dark, { parent: head });
  cyl(0.12, 0.14, 0.32, dark, { p: [0, 0, 0.45], r: [Math.PI / 2, 0, 0], parent: head });
  torus(0.13, 0.025, brass, { p: [0, 0, 0.6], parent: head });
  const lens = cyl(0.1, 0.1, 0.02, mat("#3a5a8a", { roughness: 0.05, metalness: 0.9, emissive: "#2a3a6a", emissiveIntensity: 0.4 }), { p: [0, 0, 0.6], r: [Math.PI / 2, 0, 0], parent: head });
  const reels = [];
  for (const z of [-0.18, 0.2]) { const rg = group({ p: [0, 0.42, z], parent: head }); cyl(0.2, 0.2, 0.06, dark, { r: [0, 0, Math.PI / 2], parent: rg }); for (let i = 0; i < 3; i++) cyl(0.03, 0.03, 0.08, brass, { p: [0, Math.cos(i * 2.1) * 0.11, Math.sin(i * 2.1) * 0.11], r: [0, 0, Math.PI / 2], parent: rg }); reels.push(rg); }
  const rec = sph(0.04, glow("#ff2b2b", 0.2), { p: [0.2, 0.15, 0.28], parent: head, cast: false });
  g.userData = { head, reels, rec, lens };
  return g;
}

export function clapper(o = {}) {
  const g = group(o);
  const tex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#1f1f22"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "bold 22px sans-serif"; c.fillText("SCÈNE 1", 12, 60); c.fillText("EMMA", 12, 100); });
  mesh(new THREE.BoxGeometry(0.4, 0.3, 0.03), new THREE.MeshStandardMaterial({ map: tex }), { parent: g });
  const top = group({ p: [-0.2, 0.17, 0], parent: g });
  const stripes = canvasTex(128, 16, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fff" : "#1f1f22"; c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16 + 16, 0); c.lineTo(i * 16 + 8, h); c.lineTo(i * 16 - 8, h); c.fill(); } });
  mesh(new THREE.BoxGeometry(0.4, 0.06, 0.03), new THREE.MeshStandardMaterial({ map: stripes }), { p: [0.2, 0.03, 0], parent: top });
  g.userData = { top };
  return g;
}

export function mailTube(o = {}) {
  const g = group(o);
  const brass = mat("#c99a3a", { metalness: 0.75, roughness: 0.3 });
  cyl(0.28, 0.28, 6, brass, { p: [0, 4.0, 0], parent: g });
  for (let y = 1.6; y < 7; y += 1.1) torus(0.3, 0.05, brass, { p: [0, y, 0], r: [Math.PI / 2, 0, 0], parent: g });
  cone(0.7, 0.7, brass, { p: [0, 1.2, 0], r: [Math.PI, 0, 0], parent: g });
  rbox(1.6, 0.9, 1.1, 0.12, mat("#7a3a2a"), { p: [0, 0.45, 0], parent: g });
  rbox(1.2, 0.1, 0.8, 0.05, brass, { p: [0, 0.95, 0], parent: g });
  const lamp1 = sph(0.08, glow("#7dffb0", 1.5), { p: [0.6, 0.7, 0.56], parent: g, cast: false });
  return g;
}

export function conveyor(o = {}) {
  const g = group(o);
  const L = o.len || 4;
  rbox(L, 0.15, 0.7, 0.05, mat("#2f2f36", { roughness: 0.8 }), { p: [0, 0.8, 0], parent: g });
  for (let x = -L / 2 + 0.2; x < L / 2; x += 0.5) cyl(0.08, 0.08, 0.75, mat("#c99a3a", { metalness: 0.7 }), { p: [x, 0.72, 0], r: [Math.PI / 2, 0, 0], parent: g });
  for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) for (const z of [-0.3, 0.3]) cyl(0.04, 0.04, 0.72, mat("#5a3420"), { p: [x, 0.36, z], parent: g });
  return g;
}

export function loom(o = {}) {
  const g = group(o);
  const brass = mat("#c99a3a", { metalness: 0.75, roughness: 0.3 });
  const arch = torus(1.0, 0.07, brass, { p: [0, 1.3, 0], parent: g }, Math.PI);
  for (const s of [-1, 1]) cyl(0.07, 0.07, 1.3, brass, { p: [s * 1.0, 0.65, 0], parent: g });
  for (let i = 0; i < 9; i++) sph(0.05, glow(["#ffd27a", "#bfe3ff", "#ff9ad0"][i % 3], 2.5), { p: [Math.cos((i / 8) * Math.PI) * 1.0, 1.3 + Math.sin((i / 8) * Math.PI) * 1.0, 0.06], parent: g, cast: false }, 10, 8);
  rbox(2.4, 0.2, 0.8, 0.06, mat("#7a3a2a"), { p: [0, 0.1, 0], parent: g });
  return g;
}

export function softbox(o = {}) {
  const g = group(o);
  for (const a of [0, 2.1, 4.2]) { const leg = group({ p: [0, 1.6, 0], r: [0, a, 0], parent: g }); cyl(0.025, 0.02, 1.8, mat("#2a2a30"), { p: [0, -0.8, 0.3], r: [0.38, 0, 0], parent: leg }); }
  cyl(0.025, 0.025, 1.2, mat("#2a2a30"), { p: [0, 2.0, 0], parent: g });
  const box = group({ p: [0, 2.6, 0], parent: g });
  rbox(0.9, 0.9, 0.35, 0.06, mat("#1d1d22"), { parent: box });
  mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ color: "#fff3dc", toneMapped: false }), { p: [0, 0, 0.18], parent: box, cast: false });
  g.userData = { box };
  return g;
}

export function bookshelf(o = {}) {
  const g = group(o);
  const r = rng(o.seed || 31);
  rbox(2.0, 2.8, 0.45, 0.05, WOOD(), { p: [0, 1.4, 0], parent: g });
  rbox(1.85, 2.6, 0.38, 0.04, mat("#4a2a1a"), { p: [0, 1.4, 0.06], parent: g });
  const cols = ["#8a2a2a", "#2a4a6a", "#3a6a4a", "#a8843a", "#5a3a6a", "#c96f52"];
  for (let row = 0; row < 4; row++) {
    rbox(1.9, 0.05, 0.42, 0.02, WOOD(), { p: [0, 0.3 + row * 0.65, 0.05], parent: g });
    let x = -0.85;
    while (x < 0.8) { const w = 0.07 + r() * 0.08, h = 0.35 + r() * 0.18; rbox(w, h, 0.28, 0.01, mat(cols[Math.floor(r() * cols.length)]), { p: [x + w / 2, 0.33 + row * 0.65 + h / 2, 0.08], r: [0, 0, r() < 0.1 ? 0.2 : 0], parent: g }); x += w + 0.01; }
  }
  return g;
}

export function pine(o = {}) {
  const g = group(o);
  cyl(0.08, 0.1, 0.4, mat("#5a3a22"), { p: [0, 0.2, 0], parent: g }, 8);
  cone(0.7, 1.1, felt("#2c5e43"), { p: [0, 0.8, 0], parent: g }, 10);
  cone(0.5, 0.9, felt("#356f4f"), { p: [0, 1.3, 0], parent: g }, 10);
  cone(0.3, 0.6, mat("#f4f7fb", { roughness: 1 }), { p: [0, 1.7, 0], parent: g }, 10);
  return g;
}
