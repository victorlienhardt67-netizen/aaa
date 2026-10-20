// Shared helpers: easing, seeded randomness, primitive builders, procedural textures.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
export const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInCubic = (x) => Math.pow(clamp(x), 3);
export const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOutBack = (x, s = 1.70158) => { x = clamp(x); const c3 = s + 1; return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
export const easeOutElastic = (x) => { x = clamp(x); if (x === 0 || x === 1) return x; return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
// normalised progress of t inside [a,b]
export const seg = (t, a, b) => clamp((t - a) / (b - a));
// 0 -> 1 -> 0 bump inside [a,b] with soft edges of width w
export const bump = (t, a, b, w = 0.2) => smooth(seg(t, a, a + w)) * (1 - smooth(seg(t, b - w, b)));

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
// smooth deterministic wobble from a sum of sines
export const wob = (t, f = 1, seed = 0) => Math.sin(t * f * 1.0 + seed) * 0.6 + Math.sin(t * f * 2.31 + seed * 1.7) * 0.3 + Math.sin(t * f * 4.07 + seed * 2.9) * 0.1;

// ---------- materials ----------
const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (matCache.has(key) && !o.unique) return matCache.get(key);
  const { unique, ...rest } = o;
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, flatShading: true, ...rest });
  if (!unique) matCache.set(key, m);
  return m;
}
export function felt(color, o = {}) { return mat(color, { roughness: 0.95, ...o }); }
export function glow(color, intensity = 2, o = {}) { return mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.5, ...o }); }

// ---------- primitives ----------
function place(m, o = {}) {
  if (o.p) m.position.set(...o.p);
  if (o.r) m.rotation.set(...o.r);
  if (o.s !== undefined) Array.isArray(o.s) ? m.scale.set(...o.s) : m.scale.setScalar(o.s);
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  if (o.parent) o.parent.add(m);
  return m;
}
export const mesh = (geo, m, o) => place(new THREE.Mesh(geo, m), o);
export const rbox = (w, h, d, r, m, o) => mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), m, o);
export const sph = (r, m, o, ws = 14, hs = 10) => mesh(new THREE.SphereGeometry(r, ws, hs), m, o);
export const cap = (r, len, m, o) => mesh(new THREE.CapsuleGeometry(r, len, 3, 10), m, o);
export const cyl = (rt, rb, h, m, o, seg = 12) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, o);
export const cone = (r, h, m, o, seg = 8) => mesh(new THREE.ConeGeometry(r, h, seg), m, o);
export const torus = (r, tube, m, o, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(r, tube, 6, 20, arc), m, o);
export function group(o = {}) { const g = new THREE.Group(); if (o.p) g.position.set(...o.p); if (o.r) g.rotation.set(...o.r); if (o.s !== undefined) Array.isArray(o.s) ? g.scale.set(...o.s) : g.scale.setScalar(o.s); if (o.parent) o.parent.add(g); return g; }

// ---------- canvas textures ----------
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...o.repeat); }
  return t;
}
export function woodTex(base = "#a8744f", seed = 3) {
  const r = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const plank = 64;
    for (let y = 0; y < h; y += plank) {
      const shade = (r() - 0.5) * 30;
      g.fillStyle = `rgba(${shade > 0 ? 255 : 0},${shade > 0 ? 220 : 0},${shade > 0 ? 180 : 0},${Math.abs(shade) / 255})`;
      g.fillRect(0, y, w, plank);
      for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(60,30,10,${0.05 + r() * 0.08})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const yy = y + r() * plank; g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + (r() - 0.5) * 8, w * 0.6, yy + (r() - 0.5) * 8, w, yy + (r() - 0.5) * 6); g.stroke(); }
      g.fillStyle = "rgba(50,25,10,0.45)"; g.fillRect(0, y, w, 3);
      const off = r() * w; g.fillRect(off, y, 3, plank);
    }
  }, { repeat: [2, 2] });
}
export function stripeTex(a, b, n = 16, accent = null) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    const sw = w / n;
    for (let i = 0; i < n; i += 2) { g.fillStyle = b; g.fillRect(i * sw, 0, sw, h); }
    if (accent) { g.fillStyle = accent; for (let i = 0; i < n; i += 2) for (let y = 16; y < h; y += 64) { g.beginPath(); g.arc(i * sw + sw * 1.5, y, 4, 0, 7); g.fill(); } }
  });
}
export function brickTex() {
  const r = rng(11);
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#e8d6c4"; g.fillRect(0, 0, w, h);
    const bh = 48, bw = 110;
    for (let row = 0; row * bh < h; row++) for (let x = -bw; x < w + bw; x += bw) {
      const xx = x + (row % 2) * bw / 2; const v = 150 + r() * 40;
      g.fillStyle = `rgb(${v + 40},${v * 0.48},${v * 0.36})`;
      g.beginPath(); g.roundRect(xx + 4, row * bh + 4, bw - 8, bh - 8, 6); g.fill();
    }
  });
}
export function dotTex(color = "#fff", soft = true) {
  return canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, color); gr.addColorStop(soft ? 0.35 : 0.8, color); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  });
}
export function starTex() {
  return canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,250,220,1)"); gr.addColorStop(0.15, "rgba(255,220,140,0.8)"); gr.addColorStop(1, "rgba(255,200,100,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "rgba(255,245,210,0.9)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(64, 4); g.lineTo(64, 124); g.moveTo(4, 64); g.lineTo(124, 64); g.stroke();
  });
}

// A cone that bends along an arc (floppy hats). Base at y=0, bends towards +x.
export function bentCone(rBottom, rTop, len, bend, m, o) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, len, 32, 32, false);
  geo.translate(0, len / 2, 0);
  const p = geo.attributes.position, v = new THREE.Vector3();
  const R = len / bend;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const h = v.y / len, a = bend * h * h;
    // spine follows a curve whose curvature grows towards the tip
    const sx = R * (1 - Math.cos(a)) * 0.9, sy = len * h * (1 - 0.35 * h * h * bend / 2.5);
    const ca = Math.cos(a), sa = Math.sin(a);
    p.setXYZ(i, sx + v.x * ca, sy - v.x * sa, v.z);
  }
  geo.computeVertexNormals();
  return mesh(geo, m, o);
}
