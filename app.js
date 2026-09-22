/* ================================================================
   Decision Spinner Wheel — app.js
   Vanilla JS · zero dependencies · 60fps canvas
   ================================================================ */

/* ---------- Config ---------- */
const PALETTE = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6',
  '#f97316', '#3b82f6', '#84cc16', '#e11d48',
];

const PRESETS = {
  'yes-no': [
    { label: 'Yes', color: '#10b981', enabled: true },
    { label: 'No',  color: '#ef4444', enabled: true },
  ],
  food: [
    { label: 'Pizza',  color: '#ef4444', enabled: true },
    { label: 'Burger', color: '#f59e0b', enabled: true },
    { label: 'Sushi',  color: '#06b6d4', enabled: true },
    { label: 'Salad',  color: '#10b981', enabled: true },
    { label: 'Tacos',  color: '#f97316', enabled: true },
    { label: 'Pasta',  color: '#ec4899', enabled: true },
  ],
  numbers: Array.from({ length: 10 }, (_, i) => ({
    label: String(i + 1),
    color: PALETTE[i % PALETTE.length],
    enabled: true,
  })),
};

/* ---------- State ---------- */
let options = [];
let rotation = 0;
let isSpinning = false;
let soundEnabled = true;
let vibrationEnabled = true;
let audioCtx = null;

/* ---------- DOM refs ---------- */
const canvas       = document.getElementById('wheel-canvas');
const ctx          = canvas.getContext('2d');
const spinBtn      = document.getElementById('spin-btn');
const optionInput  = document.getElementById('option-input');
const colorInput   = document.getElementById('color-input');
const addBtn       = document.getElementById('add-btn');
const optionList   = document.getElementById('option-list');
const optionCount  = document.getElementById('option-count');
const resetBtn     = document.getElementById('reset-btn');
const soundToggle  = document.getElementById('sound-toggle');
const vibToggle    = document.getElementById('vibration-toggle');
const victoryModal = document.getElementById('victory-modal');
const winnerText   = document.getElementById('winner-text');
const spinAgainBtn = document.getElementById('spin-again-btn');
const removeWinnerBtn = document.getElementById('remove-winner-btn');
const closeModalBtn   = document.getElementById('close-modal-btn');
const confettiCanvas  = document.getElementById('confetti-canvas');
const toast        = document.getElementById('toast');
const copyEmbedBtn = document.getElementById('copy-embed-btn');
const embedModal   = document.getElementById('embed-modal');
const embedCodeEl  = document.getElementById('embed-code');
const closeEmbedBtn = document.getElementById('close-embed-btn');
const copyEmbedConfirm = document.getElementById('copy-embed-confirm');

/* ---------- Constants ---------- */
const TAU = Math.PI * 2;

/* ---------- Utils ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function getActive() { return options.filter(o => o.enabled); }

function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1e293b' : '#ffffff';
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---------- Canvas — auto-scaling with DPR ---------- */
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const cssSize = canvas.clientWidth;
  canvas.width  = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

/* ---------- Wheel Drawing ---------- */
function drawWheel() {
  const size = canvas.clientWidth;
  if (size === 0) return;
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(10, size / 2 - 8);

  ctx.clearRect(0, 0, size, size);

  const active = getActive();

  // Outer decorative ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, TAU);
  ctx.fillStyle = cssVar('--glass-brd') || 'rgba(148,163,184,0.12)';
  ctx.fill();

  // Inner shadow ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.fillStyle = cssVar('--surface') || 'rgba(51,65,85,0.4)';
  ctx.fill();

  if (active.length === 0) {
    ctx.fillStyle = cssVar('--text-3') || '#64748b';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add options to begin', cx, cy);
    return;
  }

  const segAngle = TAU / active.length;

  // Draw segments
  active.forEach((opt, i) => {
    const a0 = rotation + i * segAngle;
    const a1 = a0 + segAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.closePath();

    // Gradient fill for depth
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    grad.addColorStop(0, opt.color);
    grad.addColorStop(1, hexToRgba(opt.color, 0.75));
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle separator
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Draw labels
  active.forEach((opt, i) => {
    const midAngle = rotation + i * segAngle + segAngle / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = contrastColor(opt.color);
    const fs = Math.max(10, Math.min(17, 80 / Math.sqrt(active.length)));
    ctx.font = `600 ${fs}px Inter, sans-serif`;
    const tr = radius * 0.70;
    const maxChars = Math.max(5, Math.floor(16 / Math.sqrt(active.length)));
    const label = opt.label.length > maxChars ? opt.label.slice(0, maxChars) + '…' : opt.label;
    ctx.fillText(label, tr, 0);
    ctx.restore();
  });

  // Hub
  const hubR = Math.max(20, size * 0.085);
  ctx.beginPath();
  ctx.arc(cx, cy, hubR + 4, 0, TAU);
  ctx.fillStyle = cssVar('--bg') || '#0f172a';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, hubR, 0, TAU);
  const hubGrad = ctx.createLinearGradient(cx - hubR, cy - hubR, cx + hubR, cy + hubR);
  hubGrad.addColorStop(0, cssVar('--p-500') || '#6366f1');
  hubGrad.addColorStop(1, cssVar('--p-600') || '#4f46e5');
  ctx.fillStyle = hubGrad;
  ctx.fill();
}

/* ---------- Spin Physics ---------- */
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function spin() {
  const active = getActive();
  if (active.length < 2) { showToast('Add at least 2 options to spin'); return; }
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  const turns = 5 + Math.random() * 3;
  const offset = Math.random() * TAU;
  const target = rotation + turns * TAU + offset;
  const start = rotation;
  const delta = target - start;
  const duration = 4200 + Math.random() * 1600;
  const t0 = performance.now();

  playSpinSound();

  function frame(now) {
    const t = Math.min((now - t0) / duration, 1);
    rotation = start + delta * easeOutQuart(t);
    drawWheel();
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      rotation = target % TAU;
      drawWheel();
      isSpinning = false;
      spinBtn.disabled = false;
      playStopSound();
      doVibrate(50);
      determineWinner();
    }
  }
  requestAnimationFrame(frame);
}

function determineWinner() {
  const active = getActive();
  const segAngle = TAU / active.length;
  const pointerAngle = -Math.PI / 2;
  const normRot = ((rotation % TAU) + TAU) % TAU;
  const ptr = ((pointerAngle % TAU) + TAU) % TAU;

  let idx = -1;
  for (let i = 0; i < active.length; i++) {
    let s = (normRot + i * segAngle) % TAU;
    let e = (s + segAngle) % TAU;
    if (s < e) {
      if (ptr >= s && ptr < e) { idx = i; break; }
    } else {
      if (ptr >= s || ptr < e) { idx = i; break; }
    }
  }
  if (idx === -1) idx = 0;
  showVictory(active[idx].label, active[idx].color);
}

/* ---------- Victory + Confetti ---------- */
function showVictory(label, color) {
  winnerText.textContent = label;
  victoryModal.classList.add('active');
  victoryModal.setAttribute('aria-hidden', 'false');
  launchConfetti(color);
}

function closeVictory() {
  victoryModal.classList.remove('active');
  victoryModal.setAttribute('aria-hidden', 'true');
  stopConfetti();
}

let confettiId = null;
let confettiParts = [];

function launchConfetti(winnerColor) {
  const cc = confettiCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  confettiCanvas.width = window.innerWidth * dpr;
  confettiCanvas.height = window.innerHeight * dpr;
  cc.setTransform(1, 0, 0, 1, 0, 0);
  cc.scale(dpr, dpr);

  const colors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899', winnerColor];
  confettiParts = [];
  for (let i = 0; i < 160; i++) {
    confettiParts.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 180,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 13,
      vy: Math.random() * -13 - 3,
      g: 0.32,
      sz: Math.random() * 7 + 4,
      c: colors[Math.floor(Math.random() * colors.length)],
      r: Math.random() * TAU,
      rs: (Math.random() - 0.5) * 0.18,
      life: 1,
      decay: 0.005 + Math.random() * 0.004,
    });
  }

  function anim() {
    cc.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = 0;
    confettiParts.forEach(p => {
      if (p.life <= 0) return;
      alive++;
      p.vy += p.g; p.x += p.vx; p.y += p.vy;
      p.vx *= 0.99; p.r += p.rs; p.life -= p.decay;
      cc.save();
      cc.globalAlpha = Math.max(p.life, 0);
      cc.translate(p.x, p.y);
      cc.rotate(p.r);
      cc.fillStyle = p.c;
      cc.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz * 0.5);
      cc.restore();
    });
    if (alive > 0) confettiId = requestAnimationFrame(anim);
    else stopConfetti();
  }
  anim();
}

function stopConfetti() {
  if (confettiId) { cancelAnimationFrame(confettiId); confettiId = null; }
  confettiParts = [];
  const cc = confettiCanvas.getContext('2d');
  cc.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

/* ---------- Sound (Web Audio API) ---------- */
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSpinSound() {
  if (!soundEnabled) return;
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(380, ac.currentTime + 1);
    osc.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 4.5);
    gain.gain.setValueAtTime(0.1, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 5);
    osc.start(); osc.stop(ac.currentTime + 5);
  } catch(e) {}
}

function playStopSound() {
  if (!soundEnabled) return;
  try {
    const ac = getAudio();
    [880, 1320].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.12, ac.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.4);
      o.start(ac.currentTime + i * 0.12);
      o.stop(ac.currentTime + i * 0.12 + 0.4);
    });
  } catch(e) {}
}

function playClick() {
  if (!soundEnabled) return;
  try {
    const ac = getAudio();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'square'; o.frequency.value = 600;
    g.gain.setValueAtTime(0.06, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
    o.start(); o.stop(ac.currentTime + 0.07);
  } catch(e) {}
}

/* ---------- Vibration ---------- */
function doVibrate(ms) {
  if (vibrationEnabled && navigator.vibrate) navigator.vibrate(ms);
}

/* ---------- Option Management ---------- */
function addOption(label, color) {
  if (!label.trim()) return;
  if (options.length >= 24) { showToast('Maximum 24 options'); return; }
  options.push({ label: label.trim(), color: color || PALETTE[options.length % PALETTE.length], enabled: true });
  renderOptions(); drawWheel(); playClick();
}

function removeOption(i) { options.splice(i, 1); renderOptions(); drawWheel(); playClick(); }
function toggleOption(i) { options[i].enabled = !options[i].enabled; renderOptions(); drawWheel(); playClick(); }
function editOption(i, v) { options[i].label = v.trim() || options[i].label; drawWheel(); }
function changeColor(i, c) { options[i].color = c; renderOptions(); drawWheel(); }

function loadPreset(key) {
  if (key === 'clear') options = [];
  else if (PRESETS[key]) options = PRESETS[key].map(o => ({ ...o }));
  renderOptions(); drawWheel(); playClick();
}

/* ---------- Render Option List ---------- */
const EYE_OPEN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_CLOSED = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
const TRASH = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

function renderOptions() {
  optionCount.textContent = String(options.length);

  if (options.length === 0) {
    optionList.innerHTML = '<li class="empty-state">No options yet.<br>Add one above or try a preset.</li>';
    return;
  }

  optionList.innerHTML = '';
  options.forEach((opt, i) => {
    const li = document.createElement('li');
    li.className = 'option-item' + (opt.enabled ? '' : ' disabled');

    // Color
    const cw = document.createElement('div');
    cw.className = 'opt-color';
    cw.style.background = opt.color;
    const ci = document.createElement('input');
    ci.type = 'color'; ci.value = opt.color;
    ci.addEventListener('input', e => changeColor(i, e.target.value));
    cw.appendChild(ci);

    // Text
    const ti = document.createElement('input');
    ti.type = 'text'; ti.className = 'opt-text';
    ti.value = opt.label; ti.maxLength = 40;
    ti.addEventListener('change', e => editOption(i, e.target.value));

    // Buttons
    const btns = document.createElement('div');
    btns.className = 'opt-btns';

    const tg = document.createElement('button');
    tg.className = 'opt-mini'; tg.title = opt.enabled ? 'Disable' : 'Enable';
    tg.innerHTML = opt.enabled ? EYE_OPEN : EYE_CLOSED;
    tg.addEventListener('click', () => toggleOption(i));

    const dl = document.createElement('button');
    dl.className = 'opt-mini danger'; dl.title = 'Delete';
    dl.innerHTML = TRASH;
    dl.addEventListener('click', () => removeOption(i));

    btns.appendChild(tg); btns.appendChild(dl);
    li.appendChild(cw); li.appendChild(ti); li.appendChild(btns);
    optionList.appendChild(li);
  });
}

/* ---------- Theme ---------- */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $$('.theme-pill').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
  // Redraw after CSS vars update
  requestAnimationFrame(() => drawWheel());
}

/* ---------- Toggle Switches ---------- */
function setupToggle(el, getter, setter) {
  el.addEventListener('click', () => {
    setter(!getter());
    el.classList.toggle('active', getter());
    el.setAttribute('aria-checked', String(getter()));
    playClick();
  });
}

/* ---------- Embed Code ---------- */
function getEmbedCode() {
  const url = window.location.href.split('?')[0];
  return `<iframe src="${url}" width="100%" height="640" style="border:none;border-radius:12px;" loading="lazy" title="Decision Spinner Wheel"></iframe>`;
}

function openEmbedModal() {
  embedCodeEl.textContent = getEmbedCode();
  embedModal.classList.add('active');
  embedModal.setAttribute('aria-hidden', 'false');
}

function closeEmbedModal() {
  embedModal.classList.remove('active');
  embedModal.setAttribute('aria-hidden', 'true');
}

async function copyEmbed() {
  const code = getEmbedCode();
  try {
    await navigator.clipboard.writeText(code);
    showToast('Embed code copied to clipboard');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = code; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Embed code copied to clipboard');
  }
}

/* ---------- Event Listeners ---------- */
spinBtn.addEventListener('click', spin);
addBtn.addEventListener('click', () => {
  addOption(optionInput.value, colorInput.value);
  optionInput.value = ''; optionInput.focus();
});
optionInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { addOption(optionInput.value, colorInput.value); optionInput.value = ''; }
});

// Sync color swatch preview
colorInput.addEventListener('input', () => {
  document.querySelector('.color-pick-swatch').style.background = colorInput.value;
});

resetBtn.addEventListener('click', () => {
  options = []; rotation = 0; renderOptions(); drawWheel(); showToast('Wheel reset');
});

$$('.preset-chip').forEach(b => b.addEventListener('click', () => loadPreset(b.dataset.preset)));
$$('.theme-pill').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.theme)));

setupToggle(soundToggle, () => soundEnabled, v => soundEnabled = v);
setupToggle(vibToggle, () => vibrationEnabled, v => vibrationEnabled = v);

// Victory modal
spinAgainBtn.addEventListener('click', () => { closeVictory(); setTimeout(spin, 300); });
removeWinnerBtn.addEventListener('click', () => {
  const idx = options.findIndex(o => o.label === winnerText.textContent);
  if (idx !== -1) removeOption(idx);
  closeVictory();
});
closeModalBtn.addEventListener('click', closeVictory);
victoryModal.addEventListener('click', e => { if (e.target === victoryModal) closeVictory(); });

// Embed modal
copyEmbedBtn.addEventListener('click', openEmbedModal);
closeEmbedBtn.addEventListener('click', closeEmbedModal);
copyEmbedConfirm.addEventListener('click', copyEmbed);
embedModal.addEventListener('click', e => { if (e.target === embedModal) closeEmbedModal(); });

// Keyboard
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'Enter') &&
      document.activeElement.tagName !== 'INPUT' &&
      document.activeElement.tagName !== 'TEXTAREA' &&
      !victoryModal.classList.contains('active') &&
      !embedModal.classList.contains('active')) {
    e.preventDefault(); spin();
  }
  if (e.code === 'Escape') {
    if (victoryModal.classList.contains('active')) closeVictory();
    if (embedModal.classList.contains('active')) closeEmbedModal();
  }
});

// Tap wheel to spin
canvas.addEventListener('click', spin);

// Responsive canvas — ResizeObserver for perfect auto-scaling
const ro = new ResizeObserver(() => { setupCanvas(); drawWheel(); });
ro.observe(canvas);

/* ---------- Init ---------- */
function init() {
  // Wait for fonts to load so canvas text renders correctly
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { setupCanvas(); drawWheel(); });
  } else {
    setupCanvas(); drawWheel();
  }
  setTheme('dark');
  loadPreset('yes-no');
}

init();
