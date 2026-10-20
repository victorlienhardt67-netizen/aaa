// The whole ad as one deterministic Three.js scene: render(t) is a pure function of time.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { clamp, lerp, smooth, smoother, easeInOut, easeOutCubic, easeInCubic, easeOutBack, seg, bump, wob, canvasTex, dotTex } from "./util.js";
import { buildWorld, buildSky, buildSnow, buildSparkles, ribbon, glyphSprite, VIL, WS, ST } from "./world.js";
import { drawPhoneUI } from "./phoneui.js";
import { santaMouth } from "./characters.js";
import { VISEMES } from "./visemes.js";
import { T } from "./timeline.js";

const W = 1080, H = 1920;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ renderer
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2("#1d2754", 0.006);
const camera = new THREE.PerspectiveCamera(26, W / H, 0.1, 1000);

// ------------------------------------------------------------------ lights
const hemi = new THREE.HemisphereLight("#9fb2ff", "#3a3050", 1.25);
scene.add(hemi);
const moon = new THREE.DirectionalLight("#c3cfff", 1.5);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 80 });
moon.shadow.bias = -0.0005;
moon.shadow.normalBias = 0.03;
scene.add(moon, moon.target);
const pl = (pos, color, intensity, dist) => { const l = new THREE.PointLight(color, intensity, dist, 2); l.position.copy(pos); scene.add(l); return l; };

// ------------------------------------------------------------------ world
const R = buildWorld(scene);
const sky = buildSky(scene);
const snow = buildSnow(scene);
const fx = buildSparkles(scene);
const { mom, dad, emma } = R.family;
const santa = R.santa;
const E = R.elves;

const L = {
  houseLamp: pl(V3(-2.6, 2.2, 2.4), "#ffb36a", 7, 9),
  houseFire: pl(V3(-1.2, 0.9, -2.4), "#ff7a2a", 9, 7),
  houseTree: pl(V3(1.9, 2.0, -1.4), "#ffcf7a", 5, 6),
  ws1: pl(WS.clone().add(V3(-2.6, 2.4, 0.6)), "#ffc27a", 7, 8),
  ws2: pl(WS.clone().add(V3(0.4, 2.6, -0.2)), "#ffd49a", 6, 8),
  ws3: pl(WS.clone().add(V3(3.0, 2.4, 0.8)), "#ffc27a", 7, 8),
  stFire: pl(ST.clone().add(V3(-1.6, 0.9, -2.8)), "#ff7a2a", 9, 7),
  stKey: pl(V3(0, 0, 0), "#fff0d8", 9, 10),
  stFill: pl(ST.clone().add(V3(2.8, 2.4, 1.2)), "#ffd2a0", 5, 9),
};
scene.updateMatrixWorld(true);
L.stKey.position.copy(R.santaSpot.localToWorld(V3(-1.6, 2.7, 2.6)));

// ------------------------------------------------------------------ fonts + textures
const fonts = [
  ["Montserrat", "assets/fonts/montserrat-600.ttf", { weight: "600" }],
  ["Montserrat", "assets/fonts/montserrat-800.ttf", { weight: "800" }],
  ["Fraunces", "assets/fonts/fraunces-600.ttf", { weight: "600" }],
  ["FrauncesItalic", "assets/fonts/fraunces-500i.ttf", { weight: "500", style: "italic" }],
  ["Bricolage", "assets/fonts/bricolage-800.ttf", { weight: "800" }],
];
const fontsReady = Promise.all(fonts.map(([fam, url, d]) => new FontFace(fam, `url(${url})`, d).load().then((f) => document.fonts.add(f))));

const uiCanvas = document.createElement("canvas"); uiCanvas.width = 620; uiCanvas.height = 1280;
const uiCtx = uiCanvas.getContext("2d");
const uiTex = new THREE.CanvasTexture(uiCanvas); uiTex.colorSpace = THREE.SRGBColorSpace; uiTex.anisotropy = 8;
const ugcTex = new THREE.TextureLoader().load("assets/ugc/santa_atlas.jpg");
ugcTex.colorSpace = THREE.SRGBColorSpace; ugcTex.repeat.set(1 / 15, 1 / 7);
const screen = R.phone.userData.screen;
screen.material.map = uiTex;
R.phone.scale.setScalar(1.0);

// holograms
const holoEmma = glyphSprite((c, w, h) => { c.font = "italic 500 150px FrauncesItalic"; c.textAlign = "center"; c.shadowColor = "#ffb84a"; c.shadowBlur = 30; c.fillStyle = "#ffe7a8"; c.fillText("Emma", w / 2, h * 0.68); }, 512, 256, 0.75);
const holoBike = glyphSprite((c, w, h) => { c.translate(w / 2, h / 2); c.scale(4.2, 4.2); c.strokeStyle = "#ffe7a8"; c.shadowColor = "#ffb84a"; c.shadowBlur = 8; c.lineWidth = 3.4; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.arc(-11, 5, 7, 0, 7); c.stroke(); c.beginPath(); c.arc(11, 5, 7, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-11, 5); c.lineTo(-3, -6); c.lineTo(7, -6); c.lineTo(11, 5); c.moveTo(-3, -6); c.lineTo(1, 5); c.lineTo(7, -6); c.moveTo(-6, -10); c.lineTo(0, -10); c.moveTo(7, -6); c.lineTo(5, -12); c.lineTo(9, -12); c.stroke(); }, 256, 256, 0.55);
const holoStar = glyphSprite((c, w, h) => { c.translate(w / 2, h / 2); c.fillStyle = "#ffe7a8"; c.shadowColor = "#ffb84a"; c.shadowBlur = 24; c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 34 : 80; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); }, 256, 256, 0.45);
const letters = "EMMA".split("").map((ch) => glyphSprite((c, w, h) => { c.font = "800 190px Bricolage"; c.textAlign = "center"; c.shadowColor = "#ffb84a"; c.shadowBlur = 26; c.fillStyle = "#fff1c8"; c.fillText(ch, w / 2, h * 0.75); }, 256, 256, 0.55));
for (const s of [holoEmma, holoBike, holoStar, ...letters]) { s.visible = false; scene.add(s); }
const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex("#fff3c8"), color: "#ffe2a0", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
orb.scale.setScalar(1.1); orb.visible = false; scene.add(orb);
const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex("#ffffff"), color: "#fff1d0", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
flash.visible = false; scene.add(flash);

// ------------------------------------------------------------------ camera language
const tmp = V3(0, 0, 0), tmp2 = V3(0, 0, 0);
const AZ = Math.PI / 4;
function iso(target, width, { fov = 26, el = 0.62, az = AZ } = {}) {
  const tanh = Math.tan((fov * Math.PI) / 360) * (W / H);
  const D = width / 2 / tanh;
  const dir = V3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  return { pos: target.clone().addScaledVector(dir, D), look: target.clone(), fov };
}
const mix = (a, b, k) => ({ pos: a.pos.clone().lerp(b.pos, k), look: a.look.clone().lerp(b.look, k), fov: lerp(a.fov, b.fov, k) });

// family seating (sofa-local)
const SEAT = { left: V3(-0.78, 0.74, 0.1), mid: V3(0.02, 0.7, 0.12), right: V3(0.8, 0.74, 0.1) };
const homeTarget = V3(-0.6, 1.1, 0.4);
const sofaTarget = V3(-1.3, 1.25, 0.6);

// ------------------------------------------------------------------ the letter's journey
let letterCurve, letterKeys, orbCurve, orbKeys, letterRibbon, orbRibbon;
function arcU(curve, p) { let best = 0, bd = 1e9; for (let i = 0; i <= 2000; i++) { const u = i / 2000; const d = curve.getPointAt(u).distanceToSquared(p); if (d < bd) { bd = d; best = u; } } return best; }
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, u0] = keys[i - 1], [t1, u1] = keys[i]; return lerp(u0, u1, (t - t0) / (t1 - t0)); } return keys[keys.length - 1][1]; }
const letterPos = (t) => letterCurve.getPointAt(clamp(keyed(letterKeys, t)));
const orbPos = (t) => orbCurve.getPointAt(clamp(keyed(orbKeys, t)));

// ------------------------------------------------------------------ character posing
function seat(h, key) { h.root.position.copy(SEAT[key]); h.root.rotation.set(0, 0, 0); }
function blink(h, t, times, base = 1) { let k = 1; for (const b of times) k = Math.min(k, 1 - bump(t, b, b + 0.16, 0.06)); for (const e of h.eyes) e.scale.y = base * Math.max(0.08, k); }
function resetArms(h) { for (const a of [h.armL, h.armR]) { a.sh.rotation.set(0, 0, 0); a.el.rotation.set(0, 0, 0); } h.armL.sh.rotation.z = -0.15; h.armR.sh.rotation.z = 0.15; }

function poseFamily(t) {
  resetArms(mom); resetArms(dad); resetArms(emma);
  for (const h of [mom, dad, emma]) { h.head.rotation.set(0, 0, 0); h.smile.visible = true; h.mouthO.visible = false; h.smile.scale.setScalar(1); for (const e of h.eyes) e.scale.setScalar(1); h.body.position.y = 0; }
  const late = t >= T.orbHome - 0.4; // after the delivery Emma sits between her parents
  seat(mom, "left"); seat(dad, "right");
  // mom holds her phone in both hands
  mom.armL.sh.rotation.set(-1.05, 0, 0.25); mom.armL.el.rotation.set(-1.0, 0, 0);
  mom.armR.sh.rotation.set(-1.05, 0, -0.25); mom.armR.el.rotation.set(-1.0, 0, 0);
  mom.head.rotation.x = 0.25;
  dad.armL.sh.rotation.set(-0.5, 0, -0.5); // arm on the backrest
  dad.head.rotation.y = -0.35 + wob(t, 0.3, 1) * 0.05;
  if (!late) {
    // Emma plays on the rug with her toy reindeer
    emma.root.position.copy(R.sofa.worldToLocal(V3(0.55, 0.47, 1.75)));
    emma.root.rotation.y = 0.9;
    emma.armR.sh.rotation.set(-1.2 + Math.sin(t * 2.2) * 0.25, 0, 0.1);
    emma.armL.sh.rotation.set(-0.9, 0, -0.1);
    emma.head.rotation.set(0.35, 0, Math.sin(t * 1.1) * 0.1);
    mom.head.rotation.y = -0.15;
    blink(emma, t, [1.2, 4.6, 6.9]);
    blink(mom, t, [2.1, 5.3]);
  } else {
    seat(emma, "mid");
    // mom turns the phone towards Emma
    mom.armR.sh.rotation.set(-1.25, 0, -0.65); mom.armR.el.rotation.set(-0.5, 0, 0);
    mom.armL.sh.rotation.set(-1.0, 0, 0.2);
    mom.head.rotation.set(0.15, -0.5, 0);
    dad.head.rotation.set(0.1, -0.45, 0);
    const r = T.react;
    const wow = easeOutBack(seg(t, r, r + 0.35), 2.5);
    for (const e of emma.eyes) e.scale.setScalar(1 + 0.32 * wow);
    const gasp = bump(t, r + 0.05, r + 1.2, 0.15);
    emma.mouthO.visible = gasp > 0.3; emma.smile.visible = gasp <= 0.3;
    emma.smile.scale.setScalar(1 + 0.6 * smooth(seg(t, r + 1.1, r + 1.5)));
    const hands = easeOutBack(seg(t, r + 0.2, r + 0.7), 1.6) * (1 - smooth(seg(t, r + 3.2, r + 3.8)));
    emma.armL.sh.rotation.set(lerp(-0.2, -2.7, hands), 0, lerp(-0.15, -0.75, hands)); emma.armL.el.rotation.set(lerp(0, -0.35, hands), 0, Math.sin(t * 9) * 0.25 * hands);
    emma.armR.sh.rotation.set(lerp(-0.2, -2.7, hands), 0, lerp(0.15, 0.75, hands)); emma.armR.el.rotation.set(lerp(0, -0.35, hands), 0, -Math.sin(t * 9) * 0.25 * hands);
    emma.head.rotation.set(0.05 - 0.08 * hands, -0.35, Math.sin(t * 3) * 0.06 * hands);
    emma.body.position.y = Math.abs(Math.sin((t - r) * 7)) * 0.05 * bump(t, r + 1.3, r + 3.4, 0.3);
    blink(emma, t, [r - 0.6, r + 2.6, r + 4.2], 1 + 0.32 * wow);
    // parents share a look
    const look = smooth(seg(t, T.parentsLook, T.parentsLook + 0.5));
    mom.head.rotation.y = lerp(-0.5, 0.55, look); dad.head.rotation.y = lerp(-0.45, -0.6, look);
    mom.smile.scale.setScalar(1 + 0.4 * look); dad.smile.scale.setScalar(1 + 0.4 * look);
  }
}

function poseElf(h, t, seed, work = 0) {
  resetArms(h);
  h.head.rotation.set(Math.sin(t * 2 + seed) * 0.06, Math.sin(t * 0.9 + seed) * 0.15, 0);
  h.body.position.y = Math.abs(Math.sin(t * 3 + seed)) * 0.02;
  h.armR.sh.rotation.set(-1.1 + Math.sin(t * 9 + seed) * 0.35 * work, 0, 0.2);
  h.armL.sh.rotation.set(-0.9 + Math.sin(t * 7 + seed * 2) * 0.2 * work, 0, -0.2);
  blink(h, t, [seed % 3 + 19.9, seed % 2 + 22.5, 25.4 + seed * 0.3]);
}

function poseSanta(t) {
  const s = santa;
  resetArms(s);
  const v = t - T.voice, speaking = v >= 0 && v < (T.voiceEnd - T.voice);
  // resting arms on the armrests
  s.armL.sh.rotation.set(-0.45, 0, -0.12); s.armL.el.rotation.set(-1.05, 0, 0.25);
  s.armR.sh.rotation.set(-0.45, 0, 0.12); s.armR.el.rotation.set(-1.05, 0, -0.25);
  s.neck.rotation.set(0, 0, 0); s.body.position.y = 0; s.body.scale.setScalar(1);
  // breathing
  s.torso.position.y = Math.sin(t * 1.6) * 0.012;
  let open = 0, round = 0, wide = 0, smileK = 0.45;
  // reading the scroll in the wide shot
  const read = bump(t, T.santaTake + 0.2, T.rec - 0.1, 0.4);
  if (read > 0) {
    s.armL.sh.rotation.set(lerp(-0.55, -1.25, read), 0, lerp(-0.35, 0.1, read)); s.armL.el.rotation.set(lerp(-0.6, -0.9, read), 0, 0);
    s.armR.sh.rotation.set(lerp(-0.55, -1.25, read), 0, lerp(0.35, -0.1, read)); s.armR.el.rotation.set(lerp(-0.6, -0.9, read), 0, 0);
    s.neck.rotation.x = 0.28 * read * (1 - smooth(seg(t, 28.8, 29.2)));
  }
  if (speaking) {
    const f = Math.min(VISEMES.open.length - 1, Math.max(0, Math.round(v * VISEMES.fps)));
    open = VISEMES.open[f]; round = VISEMES.round[f]; wide = VISEMES.wide[f];
    // head life: nods on emphasis, gentle sway
    s.neck.rotation.x = -0.04 + open * 0.05 + wob(t, 1.3, 2) * 0.03;
    s.neck.rotation.y = wob(t, 0.7, 5) * 0.06;
    s.neck.rotation.z = wob(t, 0.5, 9) * 0.04;
    // "Bonjour Emma !" — a big wave
    const wave = bump(v, 0.0, 1.5, 0.3);
    s.armR.sh.rotation.set(lerp(-0.55, -0.4, wave), 0, lerp(0.35, 2.35, wave));
    s.armR.el.rotation.set(0, 0, lerp(0, Math.sin(v * 14) * 0.45, wave));
    // chuckle after the name
    s.body.position.y = Math.abs(Math.sin(v * 16)) * 0.02 * bump(v, 1.1, 1.75, 0.1);
    // "mes petits lutins…" — hand gestures to the side, leaning in
    const tell = bump(v, 1.9, 4.9, 0.5);
    s.armL.sh.rotation.set(lerp(-0.55, -1.0, tell), 0, lerp(-0.35, -0.75, tell)); s.armL.el.rotation.set(lerp(-0.6, -0.9, tell), 0, lerp(0, Math.sin(v * 4) * 0.2, tell));
    s.neck.rotation.y += -0.12 * bump(v, 2.0, 3.2, 0.3);
    s.neck.rotation.x += 0.06 * tell;
    // "Je suis très fier de toi !" — hand on the heart, head tilt
    const heart = smooth(seg(v, 6.3, 6.9)) * (1 - smooth(seg(v, 9.3, 9.9)));
    s.armR.sh.rotation.x = lerp(s.armR.sh.rotation.x, -1.15, heart); s.armR.sh.rotation.z = lerp(s.armR.sh.rotation.z, -0.35, heart); s.armR.el.rotation.x = lerp(s.armR.el.rotation.x, -1.55, heart);
    s.neck.rotation.z += 0.12 * heart;
    smileK = 0.45 + 0.4 * bump(v, 0, 1.5, 0.2) + 0.5 * smooth(seg(v, 7.4, 8.2));
  }
  // wink + warm smile after the message
  const after = smooth(seg(t, T.voiceEnd, T.voiceEnd + 0.4)) * (1 - smooth(seg(t, T.pullOut + 0.4, T.pullOut + 0.8)));
  if (after > 0) { smileK = Math.max(smileK, 0.95); s.neck.rotation.z = 0.12 * after; }
  santaMouth(s, open, round, wide, smileK);
  // eyes: blinks, warm squint, wink
  const blinks = [31.8, 33.9, 36.1, 38.0, 40.6, 27.5, 28.9];
  let lidL = -1.4, lidR = -1.4;
  for (const b of blinks) { const k = bump(t, b, b + 0.18, 0.07); lidL = lerp(lidL, 1.45, k); lidR = lerp(lidR, 1.45, k); }
  const squint = smooth(seg(t, T.voice + 7.3, T.voice + 7.9)) * (1 - smooth(seg(t, T.pullOut, T.pullOut + 0.5)));
  lidL = Math.max(lidL, lerp(-1.4, -0.35, squint)); lidR = Math.max(lidR, lerp(-1.4, -0.35, squint));
  const wink = bump(t, T.wink, T.wink + 0.45, 0.12);
  lidR = lerp(lidR, 1.45, wink);
  s.lids[0].rotation.x = lidL; s.lids[1].rotation.x = lidR;
  // brows lift on "Emma" and "vélo"
  const brow = 0.035 * (bump(t, T.voice, T.voice + 1.3, 0.2) + bump(t, T.voice + 4.2, T.voice + 5.4, 0.2));
  for (const b of s.brows) b.position.y = 0.27 + brow;
  // hat pompom swing
  s.hatTip.rotation.z = Math.sin(t * 2.1) * 0.04;
}

// ------------------------------------------------------------------ post-processing
const composer = new EffectComposer(renderer);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.75, 0.55, 0.82);
composer.addPass(bloom);
const blurShader = (dir) => ({
  uniforms: { tDiffuse: { value: null }, dir: { value: dir }, focus: { value: 0.5 }, band: { value: 0.16 }, amount: { value: 1 }, motion: { value: new THREE.Vector2() } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; uniform float focus, band, amount; uniform vec2 motion; varying vec2 vUv;
    void main(){
      float d = max(0.0, abs(vUv.y - focus) - band);
      float r = clamp(d * 3.2, 0.0, 1.0) * amount;
      vec2 step = dir * r * 2.6 + motion;
      vec4 c = vec4(0.0); float wsum = 0.0;
      for (int i = -6; i <= 6; i++) { float w = exp(-float(i*i) / 18.0); c += texture2D(tDiffuse, vUv + step * float(i)) * w; wsum += w; }
      gl_FragColor = c / wsum;
    }`,
});
const tiltH = new ShaderPass(blurShader(new THREE.Vector2(1 / W, 0)));
const tiltV = new ShaderPass(blurShader(new THREE.Vector2(0, 1 / H)));
composer.addPass(tiltH); composer.addPass(tiltV);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vig: { value: 0.35 }, warm: { value: 0 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vig, warm; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time*17.0) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = vUv - 0.5; q.x *= 0.62; float v = smoothstep(0.85, 0.2, length(q));
      c.rgb *= mix(1.0 - vig, 1.0, v);
      c.rgb = mix(c.rgb, c.rgb * vec3(1.06, 0.98, 0.9), warm);
      c.rgb += (hash(vUv * 1000.0) - 0.5) * 0.035;
      gl_FragColor = c; }`,
});
composer.addPass(grade);

// ------------------------------------------------------------------ build-time precompute
function camAt(t) {
  // 0 – 3 : hook, dive from the village to Emma's lit window
  const hookA = iso(V3(-2.5, 0, -2.5), 30, { el: 0.82, az: AZ - 0.45 });
  const room = iso(homeTarget, 10.4, { el: 0.6 });
  if (t < T.hookEnd + 0.2) return mix(hookA, room, easeInOut(seg(t, 0.15, T.hookEnd + 0.2)));
  // 3 – 6.4 : the living room, slow push
  const roomPush = iso(homeTarget.clone().lerp(sofaTarget, 0.4), lerp(10.4, 8.8, smooth(seg(t, 3, 7))), { el: 0.6 });
  if (t < T.phoneUp) return mix(room, roomPush, smooth(seg(t, T.hookEnd + 0.2, T.phoneUp)));
  // 6.4 – 12.7 : phone in front of the camera (handled in placePhone)
  const tight = iso(sofaTarget, lerp(8.0, 7.4, smooth(seg(t, 6.4, 12.7))), { el: 0.58 });
  if (t < T.letterGo) return mix(roomPush, tight, smooth(seg(t, T.phoneUp, T.phoneUp + 1.2)));
  // 12.7 – 15.2 : follow the letter through the room and up the chimney
  if (t < 15.2) {
    const lp = letterPos(t);
    const follow = iso(homeTarget.clone().lerp(lp, 0.55).setY(lerp(1.2, lp.y * 0.85, smooth(seg(t, 13.8, 15.2)))), lerp(10, 13, smooth(seg(t, 13.6, 15.2))), { el: lerp(0.58, 0.45, smooth(seg(t, 13.8, 15.2))) });
    return mix(tight, follow, smooth(seg(t, T.letterGo, T.letterGo + 0.6)));
  }
  // 15.2 – 19.6 : chase flight to the North Pole, then settle on the workshop
  const wsA = iso(WS.clone().add(V3(-2.4, 1.6, 0.0)), 9.4);
  if (t < 19.7) {
    const follow = iso(letterPos(Math.max(15.0, t - 0.12)), 16, { el: 0.74, az: AZ + 0.15 });
    const prev = iso(V3(-1.2, 7, -3.6), 13, { el: 0.45 });
    let c = mix(prev, follow, easeInOut(seg(t, 15.0, 15.9)));
    return mix(c, wsA, easeInOut(seg(t, 18.5, 19.7)));
  }
  // 19.6 – 27.2 : workshop stations
  const wsB = iso(WS.clone().add(V3(0.3, 1.4, -0.3)), 7.6);
  const wsC = iso(WS.clone().add(V3(2.9, 1.5, 0.5)), 7.6);
  if (t < T.loomShot) return mix(wsA, wsB, easeInOut(seg(t, T.bikeShot - 0.1, T.bikeShot + 0.6)));
  if (t < T.convStart) return mix(wsB, wsC, easeInOut(seg(t, T.loomShot - 0.1, T.loomShot + 0.6)));
  const stWide = iso(R.santaSpot.localToWorld(V3(0, 1.4, 1.2)), 7.6);
  if (t < T.santaTake + 0.4) {
    const sp = scrollPos(t);
    const ride = iso(sp.clone().add(V3(0, 0.5, 0)), 8.2);
    return mix(mix(wsC, ride, smooth(seg(t, T.convStart, T.convStart + 0.5))), stWide, smooth(seg(t, T.convEnd - 0.3, T.santaTake + 0.4)));
  }
  // 27.6 – 31 : studio, then push in to Santa
  const close = santaClose(t);
  if (t < T.voice) return mix(stWide, close, easeInOut(seg(t, T.pushIn, T.voice - 0.05)));
  if (t < T.pullOut) return close;
  // 39.9 – 43.5 : pull out, the video flies home
  const up = iso(ST.clone().add(V3(1, 2, 0)), 13, { el: 0.7 });
  const track = iso(orbPos(Math.max(T.orbGo, t - 0.1)), 18, { el: 0.74, az: AZ - 0.1 });
  const famShot = iso(sofaTarget.clone().add(V3(0.2, 0.05, 0.05)), 6.0, { el: 0.5 });
  if (t < T.orbHome) {
    const a = mix(close, up, easeInOut(seg(t, T.pullOut, T.orbGo + 0.4)));
    const b = mix(a, track, smooth(seg(t, T.orbGo + 0.3, T.orbGo + 1.1)));
    return mix(b, famShot, easeInOut(seg(t, T.orbHome - 0.9, T.orbHome)));
  }
  // 43.5 – 49.8 : the reaction
  const emmaW = R.sofa.localToWorld(SEAT.mid.clone().add(V3(0, 0.7, 0)));
  const emmaShot = iso(sofaTarget.clone().lerp(emmaW, 0.8).add(V3(0, 0.1, 0)), 3.3, { el: 0.42 });
  const reaction = mix(famShot, emmaShot, easeInOut(seg(t, T.react - 0.4, T.react + 1.6)));
  if (t < T.cta) return reaction;
  // 49.8 – 56 : pull out to the village at dusk
  const end = iso(V3(-4.5, -0.5, -4.5), 50, { el: 0.72, az: AZ + 0.25 });
  return mix(reaction, end, easeInOut(seg(t, T.cta, T.cta + 3.4)));
}

function santaFace() { santa.head.updateWorldMatrix(true, false); return santa.head.getWorldPosition(V3(0, 0, 0)); }
const SANTA_FWD = V3(Math.sin(AZ), 0, Math.cos(AZ));
function santaClose(t) {
  const face = santaFace();
  const k = smooth(seg(t, T.voice, T.voiceEnd + 0.5));
  const D = lerp(6.4, 5.4, k);
  const sideV = V3(-SANTA_FWD.z, 0, SANTA_FWD.x);
  const pos = face.clone().addScaledVector(SANTA_FWD, D).add(V3(0, 0.25, 0)).addScaledVector(sideV, 0.25 + wob(t, 0.35, 3) * 0.06);
  return { pos, look: face.clone().add(V3(0, -0.75, 0)), fov: 24 };
}

// scroll path: loom -> conveyor -> Santa's hands
const LOOM = WS.clone().add(V3(2.9, 1.55, 0.35));
function scrollPos(t) {
  if (t < T.convStart) return LOOM.clone();
  const a = V3(WS.x + 2.6, R.convY + 0.15, R.convZ), b = V3(ST.x - 1.3, R.convY + 0.15, R.convZ);
  if (t < T.convEnd) { const k = seg(t, T.convStart, T.convEnd); return a.clone().lerp(b, k); }
  const hands = R.santaSpot.localToWorld(V3(0, 1.65, 0.9));
  const k = easeInOut(seg(t, T.convEnd, T.santaTake + 0.4));
  return b.clone().lerp(hands, k).add(V3(0, Math.sin(k * Math.PI) * 1.0, 0));
}

function placePhone(t) {
  const ph = R.phone;
  // resting pose in mom's hands
  mom.torso.updateWorldMatrix(true, true);
  const restPos = mom.torso.localToWorld(V3(0, 0.5, 0.4));
  const restQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.95, R.sofa.rotation.y, 0, "YXZ"));
  const hero = camera.position.clone().add(camera.getWorldDirection(V3(0, 0, 0)).multiplyScalar(2.15)).add(V3(0, -0.02, 0));
  const k = easeInOut(seg(t, T.phoneUp, T.phoneUp + 0.9)) * (1 - easeInOut(seg(t, T.sent + 0.3, T.sent + 1.2)));
  ph.position.copy(restPos).lerp(hero, k);
  ph.quaternion.copy(restQ).slerp(camera.quaternion, k);
  ph.scale.setScalar(1);
  screen.material.map = uiTex;
  if (t >= T.orbHome - 0.4) {
    // after delivery: held out towards Emma, screen angled to the camera
    mom.armR.hand.updateWorldMatrix(true, false);
    const hp = mom.armR.hand.getWorldPosition(V3(0, 0, 0));
    ph.position.copy(hp).add(V3(0.05, 0.25, 0.05));
    ph.lookAt(camera.position.clone().lerp(R.sofa.localToWorld(SEAT.mid.clone().add(V3(0, 0.9, 0.3))), 0.45));
    ph.scale.setScalar(1.15);
    if (t >= T.ugc) {
      const fr = clamp(Math.floor((t - T.ugc) * 15), 0, 104);
      ugcTex.offset.set((fr % 15) / 15, 1 - (Math.floor(fr / 15) + 1) / 7);
      screen.material.map = ugcTex;
    }
  }
  screen.material.needsUpdate = true;
}

function buildCurves() {
  // letter: leaves the phone at T.letterGo
  const c0 = camAt(T.letterGo - 0.001); camera.position.copy(c0.pos); camera.lookAt(c0.look); camera.fov = c0.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const E0 = camera.position.clone().add(camera.getWorldDirection(V3(0, 0, 0)).multiplyScalar(2.0));
  const pts = [E0, V3(-0.2, 2.8, 1.4), V3(-0.8, 1.7, -1.3), R.fireMouth.clone(), V3(-1.2, 1.4, -3.62), V3(-1.2, 4.6, -3.62), R.chimneyTop.clone(), V3(-3.6, 10.5, -7.5), V3(-15, 13, -17), V3(-31, 13.5, -32), V3(-46, 12.5, -46), R.tubeTop.clone().add(V3(1.6, 3.0, 1.6)), R.tubeTop.clone(), R.tubeOut.clone()];
  letterCurve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const tk = [T.letterGo, 13.15, 13.6, 13.9, 14.15, 14.55, 15.0, 15.6, 16.5, 17.5, 18.4, 18.9, 19.15, T.letterEnd];
  letterKeys = pts.map((p, i) => [tk[i], i === 0 ? 0 : i === pts.length - 1 ? 1 : arcU(letterCurve, p)]);
  letterRibbon = ribbon(scene, letterCurve, 0.05, 900);
  // orb: from the film camera's lens back to the phone at home
  scene.updateMatrixWorld(true);
  const lens = R.filmCam.userData.lens.getWorldPosition(V3(0, 0, 0));
  poseFamily(T.ugc); mom.root.updateWorldMatrix(true, true);
  const home = mom.armR.hand.getWorldPosition(V3(0, 0, 0)).add(V3(0.05, 0.25, 0.05));
  const opts = [lens, lens.clone().add(V3(0.6, 2.6, 0.6)), ST.clone().add(V3(3, 9, 3)), V3(-36, 13.5, -24), V3(-17, 12, -9), V3(-6, 8.5, -1), V3(-1.8, 4.2, 1.6), home];
  orbCurve = new THREE.CatmullRomCurve3(opts, false, "centripetal");
  const ok = [T.orbGo, 40.75, 41.2, 41.9, 42.5, 42.95, 43.3, T.orbHome];
  orbKeys = opts.map((p, i) => [ok[i], i === 0 ? 0 : i === opts.length - 1 ? 1 : arcU(orbCurve, p)]);
  orbRibbon = ribbon(scene, orbCurve, 0.06, 700);
}

// ------------------------------------------------------------------ per-frame update
const prevLook = V3(0, 0, 0);
function frame(t) {
  // characters first (camera shots read their positions)
  poseFamily(t);
  poseSanta(t);
  poseElf(E.A, t, 1, bump(t, T.elfRead, T.bikeShot, 0.3));
  poseElf(E.B, t, 2, 1);
  poseElf(E.C, t, 3, bump(t, T.weave - 0.3, T.convStart + 0.5, 0.3));
  // camera operator + clapper elf in the studio
  E.D.root.position.copy(R.santaSpot.localToWorld(V3(0.55, 0.15, 3.9))); E.D.root.rotation.y = Math.PI + AZ + 0.3;
  poseElf(E.D, t, 4, 0); E.D.armR.sh.rotation.set(-1.4, 0, 0.3);
  const clapIn = smooth(seg(t, T.rec - 0.4, T.rec)) * (1 - smooth(seg(t, T.clap + 0.15, T.clap + 0.6)));
  E.E.root.position.copy(R.santaSpot.localToWorld(V3(lerp(2.6, 0.2, clapIn), 0.15, 2.3)));
  E.E.root.rotation.y = AZ + Math.PI; poseElf(E.E, t, 5, 0);
  E.E.armR.sh.rotation.set(-1.6, 0, 0.2); E.E.armL.sh.rotation.set(-1.6, 0, -0.2);
  const hideStudioCrew = t > T.voice - 0.6 && t < T.pullOut + 0.3;
  E.D.root.visible = E.E.root.visible = R.filmCam.visible = !hideStudioCrew;
  scene.updateMatrixWorld(true);
  // clapper in the elf's hands
  E.E.armR.hand.updateWorldMatrix(true, false);
  R.clapper.visible = clapIn > 0.01;
  R.clapper.position.copy(E.E.armR.hand.getWorldPosition(V3(0, 0, 0))).add(V3(-0.15, 0.25, 0.1));
  R.clapper.rotation.set(0, AZ + Math.PI, 0);
  R.clapper.userData.top.rotation.z = -0.5 * (1 - smooth(seg(t, T.clap - 0.05, T.clap)));

  // camera
  const c = camAt(t);
  camera.position.copy(c.pos); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  placePhone(t);

  // phone UI
  if (t > T.phoneUp - 0.5 && t < T.letterGo + 1) { drawPhoneUI(uiCtx, 620, 1280, t); uiTex.needsUpdate = true; }

  // fire flicker
  for (const fp of [R.fire, R.studioFire]) fp.userData.flames.forEach((f, i) => { f.scale.y = 0.8 + 0.3 * Math.abs(Math.sin(t * (7 + i) + i * 2)); f.scale.x = 0.9 + 0.15 * Math.sin(t * 9 + i); });
  L.houseFire.intensity = 8 + Math.sin(t * 13) * 1.2 + Math.sin(t * 7.3) * 1.0;
  L.stFire.intensity = 8 + Math.sin(t * 12) * 1.2 + Math.sin(t * 6.1) * 1.0;
  R.tree.userData.lights.forEach((b, i) => { b.material = b.material; b.scale.setScalar(0.8 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7))); });
  R.tree.userData.star.rotation.y = t * 0.8;

  // letter
  const env = R.envelope;
  const born = easeOutBack(seg(t, T.sent + 0.1, T.letterGo), 2);
  env.visible = t > T.sent + 0.1 && t < T.letterEnd;
  if (env.visible) {
    const p = t < T.letterGo ? camera.position.clone().add(camera.getWorldDirection(V3(0, 0, 0)).multiplyScalar(2.0)) : letterPos(t);
    env.position.copy(p);
    const ahead = t < T.letterGo ? letterPos(T.letterGo + 0.05) : letterPos(t + 0.06);
    if (t < T.letterGo) env.quaternion.copy(camera.quaternion); else { env.lookAt(ahead); env.rotateY(-Math.PI / 2); env.rotateX(Math.sin(t * 6) * 0.25); }
    env.scale.setScalar(0.55 * born * (t > T.letterEnd - 0.4 ? 1 - seg(t, T.letterEnd - 0.4, T.letterEnd) : 1));
  }
  letterRibbon.mesh.visible = t > T.letterGo && t < 20.5;
  letterRibbon.m.uniforms.head.value = keyed(letterKeys, t);
  letterRibbon.m.uniforms.len.value = 0.11;
  letterRibbon.m.uniforms.alpha.value = 1 - smooth(seg(t, 19.3, 20.4));

  // workshop: the letter reaches elf A's desk, holograms rise
  const desk = WS.clone().add(V3(-2.6, 1.05, 0.9));
  const holoUp = easeOutCubic(seg(t, T.holo, T.holo + 0.9));
  holoEmma.visible = t > T.holo && t < T.weave + 0.2;
  holoBike.visible = t > T.holo && t < T.bikeHit;
  holoStar.visible = t > T.holo + 0.15 && t < T.scrollIn + 0.4;
  const bob = (o) => Math.sin(t * 2.2 + o) * 0.06;
  const bikePos = WS.clone().add(V3(0.2, 1.4, -0.6));
  if (holoBike.visible) holoBike.position.copy(desk.clone().add(V3(0.5, 0.6 + 0.9 * holoUp + bob(1), 0)).lerp(bikePos, easeInOut(seg(t, T.bikeShot + 0.3, T.bikeHit))));
  if (holoEmma.visible) holoEmma.position.copy(desk.clone().add(V3(-0.1, 0.8 + 1.1 * holoUp + bob(0), 0)).lerp(LOOM.clone().add(V3(0, 0.6, 0)), easeInOut(seg(t, T.loomShot, T.weave))));
  if (holoStar.visible) holoStar.position.copy(desk.clone().add(V3(-0.6, 0.5 + 0.8 * holoUp + bob(2), 0.1)).lerp(LOOM.clone().add(V3(0.6, 0.2, 0)), easeInOut(seg(t, T.loomShot + 0.2, T.scrollIn))));
  for (const s of [holoEmma, holoBike, holoStar]) s.material.opacity = smooth(seg(t, T.holo, T.holo + 0.4));
  // EMMA letters woven on the loom, then sucked into the scroll
  letters.forEach((s, i) => {
    s.visible = t > T.weave && t < T.scrollRoll;
    const a = Math.PI * (0.8 - i * 0.2);
    const home = LOOM.clone().add(V3(Math.cos(a) * 0.75, 0.55 + Math.sin(a) * 0.45, 0.1));
    const pop = easeOutBack(seg(t, T.weave + i * 0.12, T.weave + 0.35 + i * 0.12), 2.2);
    const suck = easeInCubic(seg(t, T.scrollIn + 0.05 + i * 0.05, T.scrollRoll));
    s.position.copy(home.lerp(LOOM, suck));
    s.scale.setScalar(0.55 * pop * (1 - suck * 0.8));
  });
  R.turntable.rotation.y = t * 1.2;
  R.bike.rotation.y = t * 1.2;
  // gift belt in the background
  R.beltGifts.forEach((g, i) => { const k = ((t * 0.5 + i / 6) % 1); g.position.set(WS.x + 1.6 - 2.6 + k * 5.2, 1.05, R.beltZ); g.rotation.y = i; });
  // scroll
  const sc = R.scroll;
  sc.visible = t > T.scrollIn && t < 29.3;
  if (sc.visible) {
    sc.position.copy(scrollPos(t));
    const unroll = t < T.convStart ? 1 - smooth(seg(t, T.scrollRoll, T.convStart)) : smooth(seg(t, T.santaTake, T.santaTake + 0.5));
    sc.scale.set(0.9, 0.25 + 0.75 * unroll, 0.9);
    sc.scale.multiplyScalar(easeOutBack(seg(t, T.scrollIn, T.scrollIn + 0.4)) * (1 - smooth(seg(t, 28.9, 29.3))));
    if (t < T.convStart) sc.lookAt(camera.position);
    else if (t < T.convEnd) sc.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    else { sc.lookAt(santaFace()); }
  }
  // film camera reels + REC lamp
  R.filmCam.userData.reels.forEach((r, i) => (r.rotation.x = t * (i ? 3 : -3) * smooth(seg(t, T.rec, T.rec + 0.3))));
  R.filmCam.userData.rec.material.emissiveIntensity = t > T.rec ? (Math.floor(t * 2) % 2 ? 3 : 1.2) : 0.2;
  // orb
  orb.visible = t > T.orbGo - 0.2 && t < T.orbHome + 0.1;
  if (orb.visible) { orb.position.copy(orbPos(t)); orb.scale.setScalar(0.9 + 0.2 * Math.sin(t * 20)); }
  orbRibbon.mesh.visible = t > T.orbGo && t < T.orbHome + 0.8;
  orbRibbon.m.uniforms.head.value = keyed(orbKeys, t);
  orbRibbon.m.uniforms.len.value = 0.14;
  orbRibbon.m.uniforms.alpha.value = 1 - smooth(seg(t, T.orbHome, T.orbHome + 0.7));
  // flash on send / arrival
  const fk = Math.max(bump(t, T.sent, T.sent + 0.6, 0.15), bump(t, T.orbHome - 0.05, T.orbHome + 0.5, 0.1));
  flash.visible = fk > 0.01;
  if (flash.visible) { flash.position.copy(R.phone.position); flash.scale.setScalar(0.5 + 2.5 * fk); flash.material.opacity = fk; }

  // sparkles
  fx.begin();
  fx.burst(t, T.sent + 0.05, R.phone.position, { n: 70, speed: 1.4, life: 1.1, size: 0.12, seed: 1, gravity: -0.3 });
  if (t > T.letterGo && t < T.letterEnd + 0.8) fx.trail(t, letterPos, { from: T.letterGo, n: 110, life: 1.0, spread: 0.6, size: 0.2, seed: 2 });
  fx.burst(t, 14.95, R.chimneyTop, { n: 60, speed: 2.2, life: 1.2, size: 0.25, seed: 3 });
  fx.burst(t, T.letterEnd - 0.05, R.tubeOut, { n: 50, speed: 1.2, life: 1.0, size: 0.18, seed: 4 });
  fx.burst(t, T.holo, desk.clone().add(V3(0, 0.3, 0)), { n: 60, speed: 1.0, life: 1.2, size: 0.15, seed: 5, gravity: 0.2 });
  fx.burst(t, T.bikeHit, bikePos, { n: 80, speed: 1.6, life: 1.2, size: 0.2, seed: 6 });
  fx.burst(t, T.scrollRoll, LOOM, { n: 60, speed: 1.2, life: 1.0, size: 0.16, seed: 7 });
  fx.burst(t, T.clap, R.clapper.position, { n: 30, speed: 1.0, life: 0.6, size: 0.12, seed: 8, color: "#ffffff" });
  if (t > T.orbGo && t < T.orbHome + 0.6) fx.trail(t, orbPos, { from: T.orbGo, n: 130, life: 1.1, spread: 0.8, size: 0.28, seed: 9 });
  fx.burst(t, T.orbHome, R.phone.position, { n: 90, speed: 1.3, life: 1.4, size: 0.12, seed: 10 });
  const emmaHead = emma.head.getWorldPosition(V3(0, 0, 0));
  fx.burst(t, T.react + 0.15, emmaHead, { n: 70, speed: 0.9, life: 1.6, size: 0.1, seed: 11, gravity: 0.15 });
  fx.burst(t, T.react + 1.3, emmaHead, { n: 40, speed: 0.7, life: 1.5, size: 0.09, seed: 12, color: "#ff9ad0", gravity: 0.2 });
  // santa twinkle on the wink
  fx.burst(t, T.wink + 0.1, santa.lids[1].getWorldPosition(V3(0, 0, 0)).add(V3(0.05, 0.05, 0.08)), { n: 14, speed: 0.25, life: 0.6, size: 0.08, seed: 13, color: "#ffffff" });
  fx.end();

  // sky: dusk at the end, aurora always alive
  const dusk = smooth(seg(t, T.cta + 0.5, T.cta + 3.5));
  sky.skyMat.uniforms.dusk.value = dusk;
  sky.auroraMat.uniforms.t.value = t;
  sky.auroraMat.uniforms.k.value = 1 - dusk;
  sky.stars.material.opacity = 0.9 * (1 - dusk * 0.8);
  scene.fog.color.set("#1d2754").lerp(new THREE.Color("#7a4a5e"), dusk);
  scene.fog.density = lerp(0.006, 0.0035, dusk);
  hemi.color.set("#9fb2ff").lerp(new THREE.Color("#ffd2b8"), dusk);
  moon.color.set("#c3cfff").lerp(new THREE.Color("#ffc8a0"), dusk);

  // shadows + snow follow the action
  const focus = c.look;
  moon.target.position.copy(focus); moon.position.copy(focus).add(V3(-8, 18, 10));
  snow.update(t, camera.position.clone().lerp(focus, 0.7));
  snow.pts.visible = !(t > T.phoneUp + 0.6 && t < T.sent);

  // post: tilt-shift strength, motion blur from the look-point velocity
  const closeUp = t > T.voice - 0.4 && t < T.pullOut + 0.2;
  const phoneHero = t > T.phoneUp + 0.7 && t < T.sent + 0.4;
  const amt = closeUp ? 0.35 : phoneHero ? 0.0 : 1.0;
  const band = phoneHero ? 0.2 : closeUp ? 0.3 : 0.16;
  const pc = camAt(t - 1 / 30);
  tmp.copy(c.look).project(camera); tmp2.copy(pc.look);
  const cam2 = camera.clone(); cam2.position.copy(pc.pos); cam2.lookAt(pc.look); cam2.fov = pc.fov; cam2.updateProjectionMatrix(); cam2.updateMatrixWorld();
  const pp = c.look.clone().project(cam2);
  const mv = V3(tmp.x - pp.x, tmp.y - pp.y, 0);
  const moving = Math.min(1, mv.length() * 6);
  const mlen = Math.min(0.0035, mv.length() * 0.05), mdir = mv.length() > 1e-6 ? mv.clone().normalize() : V3(0, 0, 0);
  for (const p of [tiltH, tiltV]) { p.uniforms.amount.value = amt; p.uniforms.band.value = band; p.uniforms.motion.value.set(-mdir.x * mlen * 0.5625, -mdir.y * mlen); }
  tiltV.uniforms.motion.value.multiplyScalar(0.5);
  bloom.strength = closeUp ? 0.3 : phoneHero ? 0.2 : 0.8;
  grade.uniforms.time.value = Math.floor(t * 30);
  grade.uniforms.warm.value = dusk * 0.6 + (closeUp ? 0.2 : 0);
  composer.render();
}

// ------------------------------------------------------------------ wiring
let ready = false;
const build = fontsReady.then(() => {
  // warm the UI canvas once so text metrics are ready, then precompute the paths
  drawPhoneUI(uiCtx, 620, 1280, 0);
  buildCurves();
  ready = true;
  frame(sceneTime(window.__hfThreeTime || 0));
});
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["pere-noel-scene"] = build;
// The scene was blocked out on its own clock; the final cut retimes it around the voice-over.
const WARP = [[0, 0], [5.3, 3.6], [8.5, 6.4], [13.6, 12.7], [32.7, 31.0], [40.9, 39.2], [51.3, 49.8], [58, 56.5]];
export function sceneTime(t) { return keyed(WARP, t); }
window.addEventListener("hf-seek", (e) => { if (ready) frame(sceneTime(e.detail.time)); });
