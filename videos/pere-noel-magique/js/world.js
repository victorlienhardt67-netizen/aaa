// The two floating low-poly islands (Emma's village and the North Pole), sky, snow and magic FX.
import * as THREE from "three";
import { mat, felt, glow, mesh, sph, cap, cyl, cone, rbox, group, rng, canvasTex, brickTex, dotTex, starTex } from "./util.js";
import * as P from "./props.js";
import { makeHuman, makeElf, makeSanta } from "./characters.js";

const lerpN = (a, b, k) => a + (b - a) * k;
export const VIL = new THREE.Vector3(0, 0, 0);
export const POLE = new THREE.Vector3(-52, 0, -52);
export const WS = POLE.clone().add(new THREE.Vector3(-4.6, 0, 0)); // workshop room centre
export const ST = POLE.clone().add(new THREE.Vector3(4.6, 0, 0)); // studio room centre

const SNOW = () => mat("#e6e8f6", { roughness: 0.95 });
const SLAB = () => mat("#1c2244", { roughness: 0.9 });

export function plankTex(base = "#9b3f2c", seed = 9) {
  const r = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const pw = 40;
    for (let x = 0; x < w; x += pw) {
      const v = (r() - 0.5) * 0.18;
      g.fillStyle = v > 0 ? `rgba(255,220,190,${v})` : `rgba(40,10,0,${-v})`; g.fillRect(x, 0, pw, h);
      g.fillStyle = "rgba(30,8,0,0.45)"; g.fillRect(x, 0, 3, h);
    }
  });
}

// floating island slab with snow top and icicles hanging from the edges
export function island({ w, d, parent, p, seed = 1, top = "#e6e8f6" }) {
  const g = group({ p, parent });
  const r = rng(seed);
  rbox(w, 1.4, d, 0.2, SLAB(), { p: [0, -0.75, 0], parent: g });
  rbox(w + 0.15, 0.32, d + 0.15, 0.14, mat(top, { roughness: 0.95 }), { p: [0, -0.12, 0], parent: g });
  const ice = mat("#d6e4ff", { roughness: 0.25, metalness: 0.1, emissive: "#6c86c8", emissiveIntensity: 0.15 });
  const edge = (x0, z0, x1, z1) => { const n = Math.floor(Math.hypot(x1 - x0, z1 - z0) / 0.75); for (let i = 0; i <= n; i++) { const k = i / n, len = 0.35 + r() * 0.7; cone(0.12 + r() * 0.06, len, ice, { p: [x0 + (x1 - x0) * k, -1.45 - len / 2, z0 + (z1 - z0) * k], r: [Math.PI, 0, 0], parent: g, cast: false }, 5); } };
  edge(-w / 2, d / 2, w / 2, d / 2); edge(w / 2, -d / 2, w / 2, d / 2); edge(-w / 2, -d / 2, -w / 2, d / 2); edge(-w / 2, -d / 2, w / 2, -d / 2);
  return g;
}

export function pine(o = {}) {
  const g = group(o);
  const s = o.s || 1;
  const greens = ["#1f5a3c", "#24684a", "#2c7552"];
  cyl(0.1, 0.12, 0.4, mat("#4a2e1e"), { p: [0, 0.2, 0], parent: g }, 6);
  [[1.0, 1.1, 0.85], [0.78, 1.0, 1.45], [0.55, 0.85, 2.0], [0.32, 0.65, 2.45]].forEach(([rr, h, y], i) => {
    cone(rr, h, mat(greens[i % 3], { roughness: 0.9 }), { p: [0, y, 0], parent: g }, 7);
    cone(rr * 0.62, h * 0.32, SNOW(), { p: [0, y + h * 0.36, 0], parent: g, cast: false }, 7);
  });
  return g;
}

function roofGeo(w, d, h) {
  const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.25, 0); s.lineTo(w / 2 + 0.25, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: d + 0.4, bevelEnabled: false }); geo.translate(0, 0, -(d + 0.4) / 2); return geo;
}

const stringCols = ["#ffd35a", "#ff5a5a", "#5affa0", "#5ab8ff", "#ff9ad0"];
export function house(o = {}) {
  const g = group(o);
  const w = o.w || 3, d = o.d || 3, h = o.h || 2.2;
  const wall = mat(o.color || "#8f3a2a", { map: plankTex(o.color || "#8f3a2a", o.seed || 3), unique: true });
  rbox(w, h, d, 0.04, wall, { p: [0, h / 2, 0], parent: g });
  const roof = mesh(roofGeo(w, d, h * 0.62), SNOW(), { p: [0, h, 0], parent: g });
  rbox(0.45, 0.9, 0.45, 0.04, mat("#5a2a20"), { p: [w * 0.25, h + h * 0.45, -d * 0.15], parent: g });
  rbox(0.55, 0.12, 0.55, 0.04, SNOW(), { p: [w * 0.25, h + h * 0.45 + 0.48, -d * 0.15], parent: g, cast: false });
  const win = glow("#ffc56a", 1.8);
  const frame = mat("#3a1a12");
  for (const zx of [[-w * 0.25, d / 2 + 0.02], [w * 0.25, d / 2 + 0.02]]) { rbox(0.62, 0.62, 0.06, 0.02, frame, { p: [zx[0], h * 0.5, zx[1]], parent: g, cast: false }); rbox(0.5, 0.5, 0.06, 0.02, win, { p: [zx[0], h * 0.5, zx[1] + 0.02], parent: g, cast: false }); }
  rbox(0.06, 0.62, 0.62, 0.02, frame, { p: [w / 2 + 0.02, h * 0.5, 0], parent: g, cast: false });
  rbox(0.06, 0.5, 0.5, 0.02, win, { p: [w / 2 + 0.04, h * 0.5, 0], parent: g, cast: false });
  if (o.lights) {
    const n = Math.round(w / 0.32);
    for (let i = 0; i <= n; i++) { const k = i / n; const x = -w / 2 - 0.2 + k * (w + 0.4); sph(0.06, glow(stringCols[i % 5], 3), { p: [x, h - 0.05 - Math.sin(k * Math.PI * 4) * 0.04, d / 2 + 0.22], parent: g, cast: false }, 6, 4); }
  }
  // snow patch at the door
  cyl(w * 0.45, w * 0.5, 0.05, SNOW(), { p: [0, 0.02, d / 2 + 0.6], s: [1, 1, 0.45], parent: g, cast: false }, 8);
  return g;
}

export function streetLamp(o = {}) {
  const g = group(o);
  cyl(0.06, 0.08, 2.2, mat("#262a3a"), { p: [0, 1.1, 0], parent: g }, 6);
  cyl(0.22, 0.12, 0.25, mat("#262a3a"), { p: [0, 2.3, 0], parent: g }, 6);
  sph(0.13, glow("#ffd890", 3), { p: [0, 2.15, 0], parent: g, cast: false }, 8, 6);
  return g;
}

export function fence(o = {}) {
  const g = group(o); const L = o.len || 3; const m = mat("#3a2a24");
  for (let x = 0; x <= L; x += 0.5) rbox(0.08, 0.55, 0.08, 0.02, m, { p: [x, 0.28, 0], parent: g });
  for (const y of [0.2, 0.42]) rbox(L, 0.06, 0.05, 0.02, m, { p: [L / 2, y, 0], parent: g });
  return g;
}

// ---------------------------------------------------------------- the whole world
export function buildWorld(scene) {
  const refs = {};
  const r = rng(42);

  // ---------- Emma's village island ----------
  const vil = group({ parent: scene });
  island({ w: 30, d: 30, p: [-5, 0, -5], parent: vil, seed: 3 });
  // roads
  const road = mat("#b9bfd6", { roughness: 0.9 });
  rbox(30, 0.06, 2.2, 0.02, road, { p: [-5, 0.06, 5.6], parent: vil, cast: false });
  rbox(2.2, 0.06, 30, 0.02, road, { p: [-8.6, 0.06, -5], parent: vil, cast: false });
  // neighbours
  const hs = [[-13, -1, "#8f3a2a", 1], [-13, -8, "#2f5a3e", 0], [-13, -15, "#6a4a2a", 1], [-4, -11, "#7a2a2a", 1], [3, -11, "#3a4a6a", 0], [-4, -17, "#8a5a2a", 0], [3, -17, "#8f3a2a", 1], [-17.5, 2, "#3a5a4a", 0], [6, 10, "#6a4a2a", 1], [-2, 10, "#8f3a2a", 0], [-13, 10, "#2f5a3e", 1]];
  hs.forEach(([x, z, c, l], i) => house({ p: [x, 0, z], r: [0, (i % 3) * Math.PI / 2 * (x > -9 && z > 6 ? 0 : 0), 0], color: c, lights: !!l, seed: i + 5, w: 3 + (i % 2) * 0.6, d: 3, h: 2.1 + (i % 3) * 0.25, parent: vil }));
  for (let i = 0; i < 26; i++) { const x = -19 + r() * 28, z = -19 + r() * 28; if (Math.abs(x) < 5.5 && Math.abs(z) < 5.5) continue; if (Math.abs(z - 5.6) < 2 || Math.abs(x + 8.6) < 2) continue; if (hs.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 3)) continue; pine({ p: [x, 0, z], s: 0.7 + r() * 0.5, parent: vil }).scale.setScalar(0.7 + r() * 0.5); }
  for (const [x, z] of [[-6.8, 7.2], [-1, 7.2], [5, 7.2], [-10.4, 1], [-10.4, -9], [-10.4, -16]]) streetLamp({ p: [x, 0, z], parent: vil });
  fence({ p: [4.0, 0, 3.6], r: [0, -Math.PI / 2, 0], len: 3.5, parent: vil });

  // Emma's house: cutaway room
  const home = group({ parent: vil });
  const hw = 6.4, hd = 6.4, hh = 3.2;
  rbox(hw + 0.4, 0.2, hd + 0.4, 0.05, mat("#3a4170"), { p: [0, 0.02, 0], parent: home });
  rbox(hw, 0.14, hd, 0.04, mat("#a8744f", { map: P.WOOD().map, unique: true }), { p: [0, 0.1, 0], parent: home });
  const wallM = mat("#9b3f2c", { map: plankTex("#9b3f2c", 2), unique: true });
  rbox(0.22, hh, hd, 0.04, wallM, { p: [-hw / 2 - 0.11, hh / 2, 0], parent: home });
  rbox(hw, hh, 0.22, 0.04, wallM, { p: [0, hh / 2, -hd / 2 - 0.11], parent: home });
  for (const [x, z, sx, sz] of [[-hw / 2 - 0.11, 0, 0.3, hd + 0.2], [0, -hd / 2 - 0.11, hw + 0.2, 0.3]]) rbox(sx, 0.12, sz, 0.03, mat("#6a2418"), { p: [x, hh, z], parent: home });
  // chimney stack + fireplace on the back wall
  const brick = mat("#b9573c", { map: brickTex(), unique: true });
  rbox(1.6, 6.4, 1.0, 0.04, brick, { p: [-1.2, 3.2, -hd / 2 - 0.45], parent: home });
  rbox(1.8, 0.2, 1.2, 0.04, mat("#3a1a12"), { p: [-1.2, 6.45, -hd / 2 - 0.45], parent: home });
  const fp = P.fireplace({ p: [-1.2, 0.15, -hd / 2 + 0.25], s: 0.95, parent: home });
  refs.fire = fp;
  refs.chimneyTop = new THREE.Vector3(-1.2, 6.9, -hd / 2 - 0.45);
  refs.fireMouth = new THREE.Vector3(-1.2, 0.8, -hd / 2 + 0.7);
  for (let i = 0; i < 3; i++) P.stocking({ p: [-1.8 + i * 0.6, 1.75, -hd / 2 + 0.72], color: ["#c0262c", "#2f6b45", "#c0262c"][i], parent: home });
  // window on the left wall
  P.windowFrame({ p: [-hw / 2 + 0.02, 1.7, 0.6], r: [0, Math.PI / 2, 0], parent: home });
  // garland along the walls
  for (let i = 0; i < 26; i++) { const k = i / 25; sph(0.07, glow(stringCols[i % 5], 3), { p: [-hw / 2 + 0.05, hh - 0.25 - Math.sin(k * Math.PI * 6) * 0.08, -hd / 2 + k * hd], parent: home, cast: false }, 6, 4); }
  for (let i = 0; i < 24; i++) { const k = i / 23; sph(0.07, glow(stringCols[(i + 2) % 5], 3), { p: [-hw / 2 + k * hw, hh - 0.25 - Math.sin(k * Math.PI * 6) * 0.08, -hd / 2 + 0.05], parent: home, cast: false }, 6, 4); }
  const tree = P.xmasTree({ p: [1.9, 0.15, -2.0], s: 0.85, parent: home, seed: 5 });
  refs.tree = tree;
  P.gift({ p: [1.4, 0.15, -1.0], color: "#c0392b", parent: home }); P.gift({ p: [2.4, 0.15, -1.1], color: "#2f6b9a", w: 0.4, h: 0.5, d: 0.4, parent: home }); P.gift({ p: [1.0, 0.15, -1.9], color: "#e0b84a", ribbon: "#c0262c", w: 0.35, h: 0.3, d: 0.35, parent: home });
  P.rug({ p: [0.1, 0.18, 0.7], r: 1.7, parent: home });
  const sofa = P.sofa({ p: [-1.5, 0.15, 0.6], r: [0, Math.PI / 2 - 0.25, 0], color: "#3a5f8a", color2: "#2f4f75", parent: home });
  refs.sofa = sofa;
  P.lamp({ p: [-2.6, 0.15, 2.4], parent: home });
  P.coffeeTable({ p: [0.5, 0.15, 1.2], s: 0.9, parent: home });
  // family
  const mom = makeHuman({ seated: true, top: "#5b8c6a", bottom: "#3b4a6b", hairStyle: "bun", hair: "#7a4a2a" });
  const dad = makeHuman({ seated: true, top: "#c9a35a", bottom: "#2f3a55", hair: "#4a3020", beard: true, glasses: true });
  const emma = makeHuman({ child: true, top: "#d9484a", bottom: "#f2e6d8", hairStyle: "pigtails", hair: "#8a5030", seated: true });
  sofa.add(mom.root, dad.root, emma.root);
  refs.family = { mom, dad, emma };
  // phone + toy reindeer for Emma
  refs.phone = P.phone({ parent: scene });
  const toy = group({ p: [1.0, 0.18, 1.9], parent: home });
  rbox(0.4, 0.22, 0.18, 0.06, felt("#9a6340"), { p: [0, 0.3, 0], parent: toy }); for (const x of [-0.13, 0.13]) for (const z of [-0.05, 0.05]) cyl(0.03, 0.03, 0.22, felt("#6a4028"), { p: [x, 0.11, z], parent: toy }, 5);
  sph(0.1, felt("#9a6340"), { p: [0.24, 0.46, 0], parent: toy }); sph(0.035, glow("#ff3030", 2), { p: [0.34, 0.45, 0], parent: toy, cast: false }, 6, 4);
  refs.toy = toy;
  refs.home = home;

  // ---------- North Pole island ----------
  const pole = group({ parent: scene });
  island({ w: 34, d: 22, p: [POLE.x, 0, POLE.z + 1], parent: pole, seed: 9 });
  for (let i = 0; i < 22; i++) { const x = POLE.x - 16 + r() * 32, z = POLE.z - 9 + r() * 20; if (Math.abs(x - POLE.x) < 10.5 && Math.abs(z - POLE.z) < 5) continue; pine({ p: [x, 0, z], parent: pole }).scale.setScalar(0.8 + r() * 0.6); }
  P.candyPole({ p: [POLE.x - 1, 0, POLE.z + 5.5], h: 4.5, parent: pole });
  P.candyPole({ p: [POLE.x + 11.5, 0, POLE.z + 4.8], h: 3, parent: pole });
  P.candyPole({ p: [POLE.x - 11, 0, POLE.z + 4.8], h: 3, parent: pole });
  for (const [x, z] of [[-9, 6], [-3, 6.5], [3, 6.5], [9, 6]]) P.lantern({ p: [POLE.x + x, 0.1, POLE.z + z], s: 1.6, parent: pole });
  house({ p: [POLE.x - 13.5, 0, POLE.z - 6], color: "#7a2a2a", lights: true, parent: pole, w: 3.4, h: 2.4 });
  house({ p: [POLE.x + 13.5, 0, POLE.z - 6], color: "#2f5a3e", lights: true, parent: pole, w: 3.4, h: 2.4 });

  // workshop
  const ws = group({ p: [WS.x, 0, WS.z], parent: pole });
  const ww = 9, wd = 7, wh = 3.0;
  rbox(ww + 0.3, 0.2, wd + 0.3, 0.05, mat("#3a4170"), { p: [0, 0.02, 0], parent: ws });
  rbox(ww, 0.14, wd, 0.04, mat("#b07a4a", { map: P.WOOD().map, unique: true }), { p: [0, 0.1, 0], parent: ws });
  const wsWall = mat("#7a2e22", { map: plankTex("#7a2e22", 4), unique: true });
  rbox(0.22, wh, wd, 0.04, wsWall, { p: [-ww / 2 - 0.11, wh / 2, 0], parent: ws });
  rbox(ww, wh, 0.22, 0.04, wsWall, { p: [0, wh / 2, -wd / 2 - 0.11], parent: ws });
  P.shelf({ p: [-1.5, 0.15, -wd / 2 + 0.3], w: 3.2, parent: ws, seed: 4 });
  P.shelf({ p: [-ww / 2 + 0.3, 0.15, 1.6], r: [0, Math.PI / 2, 0], w: 2.6, parent: ws, seed: 8 });
  for (let i = 0; i < 18; i++) { const k = i / 17; sph(0.07, glow(stringCols[i % 5], 3), { p: [-ww / 2 + k * ww, wh - 0.2 - Math.sin(k * Math.PI * 5) * 0.08, -wd / 2 + 0.05], parent: ws, cast: false }, 6, 4); }
  const tube = P.mailTube({ p: [-3.0, 0.15, -1.5], parent: ws });
  refs.tubeTop = new THREE.Vector3(WS.x - 3.0, 7.3, WS.z - 1.5);
  refs.tubeOut = new THREE.Vector3(WS.x - 3.0, 1.35, WS.z - 1.5);
  P.desk({ p: [-2.6, 0.15, 0.9], parent: ws });
  P.bicycle({ p: [0.2, 1.0, -0.6], s: 1.0, parent: ws });
  const bench = group({ p: [0.2, 0.15, -0.6], parent: ws });
  rbox(1.8, 0.85, 1.0, 0.06, mat("#7a3a2a"), { p: [0, 0.42, 0], parent: bench });
  refs.bike = ws.children[ws.children.length - 2];
  const turn = cyl(0.7, 0.75, 0.08, mat("#c99a3a", { metalness: 0.7, roughness: 0.3 }), { p: [0.2, 1.0, -0.6], parent: ws }, 16);
  refs.turntable = turn;
  P.loom({ p: [2.9, 0.15, 0.2], parent: ws });
  // conveyor to the studio door
  const conv = P.conveyor({ p: [WS.x + 4.4, 0.15, WS.z + 1.2], len: 6.2, parent: pole });
  for (const s of [-1, 1]) rbox(6.2, 0.06, 0.06, 0.02, glow("#f7d417", 0.8), { p: [WS.x + 4.4, 1.02, WS.z + 1.2 + s * 0.36], parent: pole, cast: false });
  refs.convY = 1.05; refs.convZ = WS.z + 1.2;
  // gifts riding a second belt along the back (life in the background)
  const giftBelt = P.conveyor({ p: [WS.x + 1.6, 0.15, WS.z - 2.6], len: 5.4, parent: pole });
  refs.beltGifts = [];
  for (let i = 0; i < 6; i++) refs.beltGifts.push(P.gift({ color: ["#c0392b", "#2f6b9a", "#2f8a52", "#e0b84a"][i % 4], w: 0.42, h: 0.36, d: 0.42, parent: pole }));
  refs.beltZ = WS.z - 2.6;

  // elves
  const elfA = makeElf({ top: "#2f7d4a" }); elfA.root.position.set(WS.x - 2.6, 0.15, WS.z + 1.6); elfA.root.rotation.y = Math.PI; pole.add(elfA.root);
  const elfB = makeElf({ top: "#b8322f", hat: "#b8322f", bottom: "#2f5a3e" }); elfB.root.position.set(WS.x + 0.2, 0.15, WS.z + 0.35); elfB.root.rotation.y = Math.PI; pole.add(elfB.root);
  const elfC = makeElf({ top: "#2f6b9a", hat: "#2f6b9a" }); elfC.root.position.set(WS.x + 2.9, 0.15, WS.z + 1.25); elfC.root.rotation.y = Math.PI; pole.add(elfC.root);
  const elfD = makeElf({ top: "#2f7d4a" }); pole.add(elfD.root);
  const elfE = makeElf({ top: "#c99a3a", hat: "#b8322f" }); pole.add(elfE.root);
  refs.elves = { A: elfA, B: elfB, C: elfC, D: elfD, E: elfE };

  // studio
  const st = group({ p: [ST.x, 0, ST.z], parent: pole });
  const sw = 8, sd = 7, sh = 3.4;
  rbox(sw + 0.3, 0.2, sd + 0.3, 0.05, mat("#3a4170"), { p: [0, 0.02, 0], parent: st });
  rbox(sw, 0.14, sd, 0.04, mat("#6a3a2a", { map: P.WOOD().map, unique: true }), { p: [0, 0.1, 0], parent: st });
  const stWall = mat("#5a1f2a", { map: plankTex("#5a1f2a", 6), unique: true });
  // partition wall with a door gap facing the conveyor
  const doorZ = refs.convZ - ST.z;
  const segA = (sd / 2 + doorZ - 0.9), segB = (sd / 2 - doorZ - 0.9);
  rbox(0.22, sh, segA, 0.04, stWall, { p: [-sw / 2 - 0.11, sh / 2, -sd / 2 + segA / 2], parent: st });
  rbox(0.22, sh, segB, 0.04, stWall, { p: [-sw / 2 - 0.11, sh / 2, sd / 2 - segB / 2], parent: st });
  rbox(0.22, sh - 2.3, 1.8, 0.04, stWall, { p: [-sw / 2 - 0.11, 2.3 + (sh - 2.3) / 2, doorZ], parent: st });
  rbox(sw, sh, 0.22, 0.04, stWall, { p: [0, sh / 2, -sd / 2 - 0.11], parent: st });
  const sfp = P.fireplace({ p: [-1.6, 0.15, -sd / 2 + 0.25], parent: st });
  refs.studioFire = sfp;
  P.bookshelf({ p: [2.4, 0.15, -sd / 2 + 0.3], parent: st });
  for (let i = 0; i < 16; i++) { const k = i / 15; sph(0.07, glow(stringCols[i % 5], 3), { p: [-sw / 2 + k * sw, sh - 0.25 - Math.sin(k * Math.PI * 5) * 0.08, -sd / 2 + 0.05], parent: st, cast: false }, 6, 4); }
  P.xmasTree({ p: [-3.1, 0.15, -2.6], s: 0.7, parent: st, seed: 9 });
  // Santa in his armchair, facing the iso camera
  const santaSpot = group({ p: [0.2, 0.15, -1.1], r: [0, Math.PI / 4, 0], parent: st });
  P.armchair({ p: [0, 0, -0.1], parent: santaSpot, color: "#2f5d46", color2: "#27503c" });
  const santa = makeSanta(); santa.root.position.set(0, 0.55, 0.05); santa.root.scale.setScalar(0.62); santaSpot.add(santa.root);
  refs.santa = santa; refs.santaSpot = santaSpot;
  const side = P.coffeeTable({ p: [1.7, 0, 0.3], s: 0.75, parent: santaSpot });
  // the film camera in front of Santa
  const camRig = P.filmCamera({ p: [0, 0, 3.2], r: [0, Math.PI, 0], s: 1.05, parent: santaSpot });
  refs.filmCam = camRig;
  P.softbox({ p: [-1.9, 0, 2.2], r: [0, Math.PI + 0.7, 0], parent: santaSpot });
  P.softbox({ p: [2.4, 0, 1.6], r: [0, Math.PI - 0.9, 0], parent: santaSpot });
  const clap = P.clapper({ parent: scene }); refs.clapper = clap;
  refs.scroll = P.scroll({ parent: scene });

  // ---------- clouds + tiny islands along the flight path ----------
  const cloudM = mat("#c9cfee", { roughness: 1, emissive: "#3a4680", emissiveIntensity: 0.25 });
  for (let i = 0; i < 46; i++) {
    const k = r(), x = lerpN(6, POLE.x - 6, k) + (r() - 0.5) * 40, z = lerpN(6, POLE.z - 6, k) + (r() - 0.5) * 40, y = -7 - r() * 6;
    const cl = group({ p: [x, y, z], parent: scene });
    for (let j = 0; j < 5; j++) sph(1.2 + r() * 1.6, cloudM, { p: [(r() - 0.5) * 4, r() * 0.8, (r() - 0.5) * 3], s: [1, 0.55, 1], parent: cl, cast: false }, 7, 5);
  }
  for (const [x, z, s] of [[-16, -24, 7], [-28, -12, 6], [-24, -34, 5], [-38, -22, 6]]) {
    island({ w: s, d: s, p: [x, -2.5 + (x % 3), z], parent: scene, seed: Math.abs(x) });
    for (let j = 0; j < 3; j++) pine({ p: [x + (r() - 0.5) * s * 0.6, -2.5 + (x % 3), z + (r() - 0.5) * s * 0.6], parent: scene }).scale.setScalar(0.7 + r() * 0.5);
  }

  // ---------- magic props ----------
  refs.envelope = P.envelope({ parent: scene });
  return refs;
}

// ---------------------------------------------------------------- sky + snow + FX
export function buildSky(scene) {
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#070b22") }, mid: { value: new THREE.Color("#1a2558") }, bot: { value: new THREE.Color("#3b3f7a") }, dusk: { value: 0 } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform vec3 top, mid, bot; uniform float dusk; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.6, h)) : mix(mid, bot, smoothstep(0.0, -0.5, h));
        vec3 dTop = vec3(0.17,0.12,0.28), dMid = vec3(0.62,0.33,0.36), dBot = vec3(0.86,0.55,0.38);
        vec3 d = h > 0.0 ? mix(dMid, dTop, smoothstep(-0.1, 0.55, h)) : mix(dMid, dBot, smoothstep(0.0, -0.45, h));
        gl_FragColor = vec4(mix(c, d, dusk), 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat);
  sky.frustumCulled = false; scene.add(sky);
  // stars
  const r = rng(77); const n = 1400; const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, y = 0.05 + r() * 0.95; const s = Math.sqrt(1 - y * y); pos.set([Math.cos(a) * s * 380, y * 380, Math.sin(a) * s * 380], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, map: dotTex("#ffffff"), transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
  scene.add(stars);
  // moon
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex("#fff8e8", false), color: "#fff6e0", fog: false, depthWrite: false }));
  moon.position.set(-150, 160, 120); moon.scale.setScalar(26); scene.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex("#c8d4ff"), color: "#9fb0ff", fog: false, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.copy(moon.position); halo.scale.setScalar(90); scene.add(halo);
  // aurora curtains behind the North Pole
  const auroraMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { t: { value: 0 }, k: { value: 1 } },
    vertexShader: "varying vec2 vUv; uniform float t; void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x*0.03 + t*0.4)*14.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }",
    fragmentShader: `varying vec2 vUv; uniform float t, k;
      void main(){ float x = vUv.x; float band = sin(x*18.0 + t*0.7 + sin(x*7.0 - t*0.5)*2.0)*0.5+0.5;
        float rays = pow(sin(x*120.0 + sin(x*13.0+t)*3.0)*0.5+0.5, 3.0)*0.5+0.5;
        float v = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
        vec3 c = mix(vec3(0.15,1.0,0.6), vec3(0.45,0.35,1.0), smoothstep(0.3, 0.9, vUv.y));
        gl_FragColor = vec4(c * v * band * rays * 0.55 * k, 1.0); }`,
  });
  const aurora = new THREE.Mesh(new THREE.PlaneGeometry(420, 90, 120, 1), auroraMat);
  aurora.position.set(-190, 55, -190); aurora.lookAt(0, 40, 0); scene.add(aurora);
  return { skyMat, stars, moon, halo, aurora, auroraMat };
}

export function buildSnow(scene, n = 2600) {
  const r = rng(5); const base = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) base.set([r(), r(), r(), 0.5 + r()], i * 4);
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3);
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.075, map: dotTex("#ffffff"), transparent: true, depthWrite: false, opacity: 0.95, color: "#f4f6ff" }));
  pts.frustumCulled = false; scene.add(pts);
  const box = 22;
  function update(t, center) {
    for (let i = 0; i < n; i++) {
      const bx = base[i * 4], by = base[i * 4 + 1], bz = base[i * 4 + 2], sp = base[i * 4 + 3];
      const y = (((by * box - t * 1.1 * sp) % box) + box) % box;
      const wx = bx * box + Math.sin(t * 0.7 * sp + i) * 0.4, wz = bz * box + Math.cos(t * 0.5 * sp + i * 1.3) * 0.4;
      pos[i * 3] = center.x + ((((wx - center.x) % box) + box) % box) - box / 2;
      pos[i * 3 + 1] = center.y + y - box / 2;
      pos[i * 3 + 2] = center.z + ((((wz - center.z) % box) + box) % box) - box / 2;
    }
    g.attributes.position.needsUpdate = true;
  }
  return { pts, update };
}

// Sparkle particles: bursts + trails, all recomputed from time.
export function buildSparkles(scene, cap = 1600) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(cap * 3), col = new Float32Array(cap * 3), size = new Float32Array(cap);
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("psize", new THREE.BufferAttribute(size, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { map: { value: starTex() }, scale: { value: 900 } },
    vertexShader: "attribute float psize; varying vec3 vC; uniform float scale; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * scale / -mv.z; gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform sampler2D map; varying vec3 vC; void main(){ vec4 tx = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * tx.rgb * tx.a * 1.6, 1.0); }",
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  let count = 0; const c = new THREE.Color();
  function begin() { count = 0; }
  function add(p, s, color, a = 1) { if (count >= cap) return; pos.set([p.x, p.y, p.z], count * 3); c.set(color).multiplyScalar(a); col.set([c.r, c.g, c.b], count * 3); size[count] = s; count++; }
  function end() { for (let i = count; i < cap; i++) size[i] = 0; g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; g.attributes.psize.needsUpdate = true; }
  // a radial burst at origin o starting at t0
  const rb = rng(99); const dirs = []; for (let i = 0; i < 400; i++) { const u = rb() * 2 - 1, a = rb() * Math.PI * 2, s = Math.sqrt(1 - u * u); dirs.push([Math.cos(a) * s, u, Math.sin(a) * s, 0.4 + rb() * 0.6, rb()]); }
  const tmp = new THREE.Vector3();
  function burst(t, t0, o, { n = 60, speed = 2.5, life = 1.2, size: sz = 0.25, color = "#ffd98a", seed = 0, gravity = -0.6 } = {}) {
    const age = t - t0; if (age < 0 || age > life) return;
    const k = age / life;
    for (let i = 0; i < n; i++) {
      const d = dirs[(i * 7 + seed * 31) % dirs.length];
      const sp = speed * d[3] * (1 - Math.pow(1 - Math.min(1, age * 1.6), 2));
      tmp.set(o.x + d[0] * sp, o.y + d[1] * sp + gravity * age * age, o.z + d[2] * sp);
      const tw = 0.6 + 0.4 * Math.sin(age * 20 + d[4] * 30);
      add(tmp, sz * (1 - k * 0.7) * (0.5 + d[4]), d[4] > 0.7 ? "#ffffff" : color, (1 - k) * tw);
    }
  }
  // a comet trail behind a moving point: path(t) gives the position at time t
  function trail(t, path, { from = -1e9, n = 70, life = 0.9, spread = 0.35, size: sz = 0.22, color = "#ffd98a", seed = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const d = dirs[(i * 13 + seed * 17) % dirs.length];
      const birth = t - (i / n) * life - d[4] * 0.05; if (birth < from) continue;
      const age = t - birth, k = age / life;
      const p = path(birth);
      tmp.set(p.x + d[0] * spread * k, p.y + d[1] * spread * k - age * 0.4, p.z + d[2] * spread * k);
      add(tmp, sz * (1 - k) * (0.6 + d[3] * 0.6), d[4] > 0.75 ? "#ffffff" : color, (1 - k) * (0.6 + 0.4 * Math.sin(age * 25 + i)));
    }
  }
  return { begin, add, end, burst, trail };
}

// Golden ribbon drawn along a curve between uTail..uHead
export function ribbon(scene, curve, radius = 0.06, segs = 700) {
  const geo = new THREE.TubeGeometry(curve, segs, radius, 8, false);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { head: { value: 0 }, len: { value: 0.25 }, alpha: { value: 1 }, color: { value: new THREE.Color("#ffcf5a") } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "varying vec2 vUv; uniform float head, len, alpha; uniform vec3 color; void main(){ float d = head - vUv.x; if (d < 0.0 || d > len) discard; float k = 1.0 - d / len; float edge = 1.0 - abs(vUv.y*2.0-1.0)*0.0; gl_FragColor = vec4(color * (0.6 + 2.4*pow(k,3.0)) * k * alpha * edge, 1.0); }",
  });
  const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; scene.add(mesh);
  return { mesh, m };
}

// Camera-facing sprite with a canvas-drawn glyph (icons / words for the holograms)
export function glyphSprite(draw, w = 256, h = 256, scale = 1) {
  const tex = canvasTex(w, h, draw);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  s.scale.set(scale * w / h, scale, 1);
  return s;
}
