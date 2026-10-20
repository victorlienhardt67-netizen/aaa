// The order screen drawn into the phone's screen texture, as a pure function of time.
import { clamp, seg, easeOutBack, easeOutCubic, smooth } from "./util.js";

export const UI = { typeA: 2.35, typeB: 3.15, chip: 3.75, chip2: 4.25, press: 4.95, sent: 5.2 };

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

function bikeIcon(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineWidth = 3.2; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.arc(-11, 5, 7, 0, 7); c.stroke(); c.beginPath(); c.arc(11, 5, 7, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(-11, 5); c.lineTo(-3, -6); c.lineTo(7, -6); c.lineTo(11, 5); c.moveTo(-3, -6); c.lineTo(1, 5); c.lineTo(7, -6); c.moveTo(-6, -10); c.lineTo(0, -10); c.moveTo(7, -6); c.lineTo(5, -12); c.lineTo(9, -12); c.stroke(); c.restore();
}
function bookIcon(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineWidth = 3.2; c.lineJoin = "round";
  c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(-8, -12, -15, -9); c.lineTo(-15, 9); c.quadraticCurveTo(-8, 6, 0, 10); c.quadraticCurveTo(8, 6, 15, 9); c.lineTo(15, -9); c.quadraticCurveTo(8, -12, 0, -8); c.lineTo(0, 10); c.stroke(); c.restore();
}
function starIcon(c, x, y, s, col, fill = false) {
  c.save(); c.translate(x, y); c.scale(s, s); c.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 5.5 : 13; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  c.closePath(); if (fill) { c.fillStyle = col; c.fill(); } else { c.strokeStyle = col; c.lineWidth = 3; c.lineJoin = "round"; c.stroke(); } c.restore();
}
function hatIcon(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#c0262c"; c.beginPath(); c.moveTo(-16, 6); c.quadraticCurveTo(-6, -22, 14, -14); c.quadraticCurveTo(6, -6, 16, 6); c.fill();
  c.fillStyle = "#fff"; rr(c, -19, 3, 38, 9, 5); c.fill(); c.beginPath(); c.arc(15, -14, 5, 0, 7); c.fill(); c.restore();
}

export function drawPhoneUI(c, W, H, t) {
  c.clearRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#fff8ee"); g.addColorStop(1, "#f6e7d3");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // soft snow dots
  c.fillStyle = "rgba(192,38,44,0.06)";
  for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = ((i * 211) % H + t * 18 * (1 + (i % 3))) % H; c.beginPath(); c.arc(x, y, 3 + (i % 4), 0, 7); c.fill(); }
  // status bar
  c.fillStyle = "#3a2a2a"; c.font = "600 24px Montserrat"; c.fillText("20:24", 36, 46);
  rr(c, W - 86, 26, 46, 22, 6); c.lineWidth = 2.5; c.strokeStyle = "#3a2a2a"; c.stroke(); rr(c, W - 82, 30, 32, 14, 3); c.fill();
  // header
  hatIcon(c, W / 2, 128, 2.2);
  c.textAlign = "center"; c.fillStyle = "#8f1d22"; c.font = "600 50px Fraunces"; c.fillText("Un message", W / 2, 218); c.fillText("du Père Noël", W / 2, 274);
  c.fillStyle = "#7a6458"; c.font = "600 22px Montserrat"; c.fillText("rien que pour votre enfant", W / 2, 314);
  c.textAlign = "left";
  // name card
  const appear = (k) => easeOutCubic(seg(t, 1.6 + k * 0.12, 2.1 + k * 0.12));
  const card = (y, h, k) => { const a = appear(k); c.globalAlpha = a; c.save(); c.translate(0, (1 - a) * 40); c.fillStyle = "#ffffff"; c.shadowColor = "rgba(120,60,30,0.15)"; c.shadowBlur = 24; c.shadowOffsetY = 8; rr(c, 34, y, W - 68, h, 28); c.fill(); c.restore(); };
  card(356, 190, 0);
  c.save(); c.translate(0, (1 - appear(0)) * 40);
  c.fillStyle = "#9a7d6c"; c.font = "600 22px Montserrat"; c.fillText("PRÉNOM", 66, 400);
  const name = "Emma"; const n = Math.floor(clamp((t - UI.typeA) / (UI.typeB - UI.typeA)) * name.length + 0.001);
  const typed = name.slice(0, n);
  const focus = t > UI.typeA - 0.3 && t < UI.chip;
  c.lineWidth = 3; c.strokeStyle = focus ? "#c0262c" : "#ead8c8"; rr(c, 60, 420, W - 120, 92, 20); c.stroke();
  c.fillStyle = "#2d1b1b"; c.font = "800 50px Montserrat"; c.fillText(typed, 86, 484);
  if (focus && Math.floor(t * 2.4) % 2 === 0) { const w = c.measureText(typed).width; c.fillStyle = "#c0262c"; c.fillRect(90 + w, 440, 4, 54); }
  c.restore(); c.globalAlpha = 1;
  // achievements card
  card(574, 362, 1);
  c.save(); c.translate(0, (1 - appear(1)) * 40); c.globalAlpha = appear(1);
  c.fillStyle = "#9a7d6c"; c.font = "600 22px Montserrat"; c.fillText("CETTE ANNÉE, " + (n >= 4 ? "EMMA" : "IL/ELLE") + " A…", 66, 618);
  const chips = [["appris le vélo", bikeIcon, UI.chip], ["lu son 1er livre", bookIcon, 99], ["été très sage", starIcon, UI.chip2]];
  chips.forEach(([label, icon, at], i) => {
    const y = 642 + i * 94, on = t >= at;
    const pop = on ? easeOutBack(seg(t, at, at + 0.35), 3) : 0;
    c.save(); const cx = W / 2, cy = y + 36; c.translate(cx, cy); const sc = 1 + (on ? (1 - pop) * -0.08 + Math.max(0, Math.sin(seg(t, at, at + 0.35) * Math.PI)) * 0.06 : 0); c.scale(sc, sc); c.translate(-cx, -cy);
    c.fillStyle = on ? "#c0262c" : "#fbf3ea"; rr(c, 60, y, W - 120, 74, 37); c.fill();
    if (!on) { c.strokeStyle = "#ead8c8"; c.lineWidth = 2.5; c.stroke(); }
    icon(c, 112, y + 38, 1.25, on ? "#fff" : "#b07a5a");
    c.fillStyle = on ? "#fff" : "#5a4036"; c.font = "600 30px Montserrat"; c.fillText(label, 156, y + 48);
    if (on) { c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.moveTo(W - 116, y + 38); c.lineTo(W - 104, y + 50); c.lineTo(W - 84, y + 26); c.stroke(); }
    c.restore();
  });
  c.restore(); c.globalAlpha = 1;
  // send button
  const ba = easeOutCubic(seg(t, 2.0, 2.5));
  const press = Math.sin(seg(t, UI.press, UI.press + 0.25) * Math.PI);
  c.save(); c.globalAlpha = ba; const by = 990, bh = 112; c.translate(W / 2, by + bh / 2); c.scale(1 - press * 0.06, 1 - press * 0.06); c.translate(-W / 2, -(by + bh / 2));
  const bg = c.createLinearGradient(0, by, 0, by + bh); bg.addColorStop(0, "#e0453f"); bg.addColorStop(1, "#a51d24");
  c.shadowColor = "rgba(160,30,36,0.45)"; c.shadowBlur = 30; c.shadowOffsetY = 10; c.fillStyle = bg; rr(c, 50, by, W - 100, bh, 56); c.fill(); c.shadowColor = "transparent";
  c.fillStyle = "#fff"; c.font = "800 34px Montserrat"; c.textAlign = "center"; c.fillText("Envoyer au Père Noël", W / 2 - 18, by + 69);
  starIcon(c, W / 2 + 196, by + 57, 1.1, "#ffd35a", true); c.textAlign = "left";
  // shimmer sweep on the button
  const sw = seg(t, 4.2, 4.9); if (sw > 0 && sw < 1) { c.save(); rr(c, 50, by, W - 100, bh, 56); c.clip(); const x = 50 + sw * (W + 100) - 100; const sg = c.createLinearGradient(x - 80, 0, x + 80, 0); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.45)"); sg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = sg; c.fillRect(0, by, W, bh); c.restore(); }
  c.restore();
  // tap ripples
  const tap = (at, x, y) => { const k = seg(t, at - 0.05, at + 0.5); if (k <= 0 || k >= 1) return; c.fillStyle = `rgba(255,255,255,${0.55 * (1 - k)})`; c.strokeStyle = `rgba(192,38,44,${0.5 * (1 - k)})`; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 26 + k * 70, 0, 7); c.fill(); c.stroke(); };
  tap(UI.typeA - 0.25, W - 140, 466); tap(UI.chip, W - 160, 678); tap(UI.chip2, W - 180, 866); tap(UI.press, W / 2 + 40, 1046);
  // sent flash
  const f = smooth(seg(t, UI.sent, UI.sent + 0.35));
  if (f > 0) { c.fillStyle = `rgba(255,236,190,${f})`; c.fillRect(0, 0, W, H); }
}
