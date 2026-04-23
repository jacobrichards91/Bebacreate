// ══════════════════════════════════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════════════════════════════════
const state = {
  levelIdx:    0,
  starsEarned: 0,
  snapped:     new Set(),
  drag:        null,       // { partId, el, offsetX, offsetY }
  completing:  false,
  spinAnim:    null,       // Web Animations API ref for snap-layer spin
  fadeRafId:   null,       // rAF id for canvas fade — cancelled on level reset
  playMode:    false,      // tap-to-drive mode active after completion
  playRafId:   null,       // rAF id for play-mode animation loop
};

// Play-mode robot position (module-level, not part of reset-able state)
let _playX = 0, _playY = 0, _playTX = 0, _playTY = 0;

const SNAP_DIST   = 55;
const ENCOURAGE   = ['Oops! Try again! 😅', 'Almost! 💪', 'Keep trying! 🌟', 'So close! 🎯', "You've got this! 🤖"];

// ══════════════════════════════════════════════════════════════════════════════
// DOM refs
// ══════════════════════════════════════════════════════════════════════════════
const puzzleArea    = document.getElementById('puzzle-area');
const snapHintsEl   = document.getElementById('snap-hints');
const snapLayer     = document.getElementById('snap-layer');
const partsTray     = document.getElementById('parts-tray');
const starsRow      = document.getElementById('stars-row');
const levelDotsEl   = document.getElementById('level-dots');
const levelNameEl   = document.getElementById('level-name');
const levelNumEl    = document.getElementById('level-num');
const partsCounter  = document.getElementById('parts-counter');
const toastEl       = document.getElementById('toast');
const cleanOverlay  = document.getElementById('clean-overlay');
const cleanText     = document.getElementById('clean-text');
const nextBtn       = document.getElementById('next-btn');
const canvas        = document.getElementById('trail-canvas');
const ctx2d         = canvas.getContext('2d');

// ══════════════════════════════════════════════════════════════════════════════
// Utilities
// ══════════════════════════════════════════════════════════════════════════════
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function getPuzzleRect() { return puzzleArea.getBoundingClientRect(); }

function snapPxCenter(partId) {
  const def = PART_DEFS[partId];
  const r   = getPuzzleRect();
  return {
    x: r.left + r.width  / 2 + (def.bx || 0),
    y: r.top  + r.height / 2 + (def.by || 0),
  };
}

// For wheels: either wheel can snap to either slot (nearest unoccupied one).
// Returns the slot id to snap into, or null if no slot within SNAP_DIST.
function getSnapSlot(partId, elCx, elCy) {
  const level = LEVELS[state.levelIdx];
  if (partId === 'wheelL' || partId === 'wheelR') {
    const available = ['wheelL', 'wheelR']
      .filter(id => level.parts.includes(id) && !state.snapped.has(id));
    let bestSlot = null, bestDist = SNAP_DIST;
    for (const slotId of available) {
      const sp = snapPxCenter(slotId);
      const d2 = dist(elCx, elCy, sp.x, sp.y);
      if (d2 < bestDist) { bestDist = d2; bestSlot = slotId; }
    }
    return bestSlot;
  }
  const sp = snapPxCenter(partId);
  return dist(elCx, elCy, sp.x, sp.y) < SNAP_DIST ? partId : null;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════════════════════════════
// Top-bar UI
// ══════════════════════════════════════════════════════════════════════════════
function renderStars() {
  starsRow.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('span');
    s.className = 'star-icon' + (i < state.starsEarned ? ' filled' : '');
    s.textContent = i < state.starsEarned ? '⭐' : '☆';
    starsRow.appendChild(s);
  }
}

function renderLevelDots() {
  levelDotsEl.innerHTML = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const d = document.createElement('span');
    d.className = 'level-dot' +
      (i < state.levelIdx        ? ' done'    : '') +
      (i === state.levelIdx      ? ' current' : '');
    levelDotsEl.appendChild(d);
  }
}

function updatePartsCounter() {
  const total = LEVELS[state.levelIdx].parts.length;
  const left  = total - state.snapped.size;
  if (left === 0) {
    partsCounter.style.opacity = '0';
  } else {
    partsCounter.textContent  = `${left} part${left !== 1 ? 's' : ''} left`;
    partsCounter.style.opacity = '1';
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Snap hints
// ══════════════════════════════════════════════════════════════════════════════
function renderSnapHints() {
  snapHintsEl.innerHTML = '';
  const r     = getPuzzleRect();
  const level = LEVELS[state.levelIdx];

  level.parts.forEach(partId => {
    const def  = PART_DEFS[partId];
    const hint = document.createElement('div');
    hint.className = 'snap-hint' + (def.round ? ' round' : '');
    hint.id        = `hint-${partId}`;
    hint.style.width  = def.w + 'px';
    hint.style.height = def.h + 'px';
    hint.style.left   = (r.width  / 2 + (def.bx || 0)) + 'px';
    hint.style.top    = (r.height / 2 + (def.by || 0)) + 'px';
    snapHintsEl.appendChild(hint);
  });
}

function clearSnapHint(partId) {
  const hint = snapHintsEl.querySelector(`#hint-${partId}`);
  if (!hint) return;
  hint.classList.add('filled');
  setTimeout(() => hint.remove(), 400);
}

function repositionSnapHints() {
  const r     = getPuzzleRect();
  const level = LEVELS[state.levelIdx];
  level.parts.forEach(partId => {
    const def  = PART_DEFS[partId];
    const hint = snapHintsEl.querySelector(`#hint-${partId}`);
    if (!hint) return;
    hint.style.left = (r.width  / 2 + (def.bx || 0)) + 'px';
    hint.style.top  = (r.height / 2 + (def.by || 0)) + 'px';
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Canvas
// ══════════════════════════════════════════════════════════════════════════════
function resizeCanvas() {
  const r        = getPuzzleRect();
  canvas.width   = r.width;
  canvas.height  = r.height;
  canvas.style.left = '0';
  canvas.style.top  = '0';
}

window.addEventListener('resize', () => {
  resizeCanvas();
  repositionSnapHints();
  // reposition already-snapped parts
  state.snapped.forEach(partId => {
    const el  = snapLayer.querySelector(`[data-part-id="${partId}"]`);
    if (!el) return;
    const def = PART_DEFS[partId];
    const r   = getPuzzleRect();
    el.style.left = (r.width  / 2 + (def.bx || 0) - def.w / 2) + 'px';
    el.style.top  = (r.height / 2 + (def.by || 0) - def.h / 2) + 'px';
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Level initialisation
// ══════════════════════════════════════════════════════════════════════════════
function initLevel() {
  const level = LEVELS[state.levelIdx];

  // cancel any leftover animations from previous level
  stopPlayMode();
  if (state.spinAnim) { try { state.spinAnim.cancel(); } catch(e){} state.spinAnim = null; }
  if (state.fadeRafId) { cancelAnimationFrame(state.fadeRafId); state.fadeRafId = null; }
  snapLayer.style.transform = '';

  state.snapped.clear();
  state.completing = false;
  state.drag       = null;

  // top bar
  levelNameEl.textContent = level.name;
  levelNumEl.textContent  = `Level ${level.id}`;
  renderStars();
  renderLevelDots();

  // clear areas
  snapLayer.innerHTML = '';
  partsTray.innerHTML = '';
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  // hide completion overlay, reset text style for next level
  cleanOverlay.classList.add('hidden');
  cleanOverlay.classList.remove('fading');
  cleanText.style.fontSize = '';
  nextBtn.classList.remove('visible');
  nextBtn.style.pointerEvents = 'none';
  nextBtn.innerHTML = '';

  // snap hints
  resizeCanvas();
  renderSnapHints();

  // parts counter
  updatePartsCounter();

  // create tray parts (shuffled order each level)
  const trayWrap = document.getElementById('tray-wrap');
  const shuffled = shuffle(level.parts);
  shuffled.forEach((partId, i) => {
    const def  = PART_DEFS[partId];
    const wrap = document.createElement('div');
    wrap.className         = 'part-wrap floating';
    wrap.dataset.partId    = partId;
    wrap.style.animationDelay    = `${(i * 0.42) % 2.5}s`;
    wrap.style.animationDuration = `${2.6 + (i * 0.3) % 1.4}s`;
    wrap.setAttribute('aria-label', def.label);
    wrap.innerHTML = def.svg(LEVEL_COLORS[state.levelIdx]) + `<div class="part-label">${def.label}</div>`;
    partsTray.appendChild(wrap);
    attachDrag(wrap, partId);
  });

  // show fade-edge hint if tray content overflows horizontally
  requestAnimationFrame(() => {
    trayWrap.classList.toggle('overflows', partsTray.scrollWidth > partsTray.clientWidth + 4);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Drag & Drop
// ══════════════════════════════════════════════════════════════════════════════
function attachDrag(wrap, partId) {

  wrap.addEventListener('pointerdown', e => {
    if (wrap.classList.contains('snapped') || state.completing) return;
    e.preventDefault();
    getAudioCtx(); // unlock AudioContext on first touch

    const rect   = wrap.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // detach from tray into body layer
    document.body.appendChild(wrap);
    wrap.style.position = 'fixed';
    wrap.style.left     = (e.clientX - offsetX) + 'px';
    wrap.style.top      = (e.clientY - offsetY)  + 'px';
    wrap.style.zIndex   = '3000';
    wrap.style.margin   = '0';
    wrap.classList.remove('floating', 'bounce-back');
    wrap.classList.add('dragging');

    wrap.setPointerCapture(e.pointerId);
    state.drag = { partId, el: wrap, offsetX, offsetY };
  });

  wrap.addEventListener('pointermove', e => {
    if (!state.drag || state.drag.partId !== partId) return;
    e.preventDefault();
    const d = state.drag;
    d.el.style.left = (e.clientX - d.offsetX) + 'px';
    d.el.style.top  = (e.clientY - d.offsetY)  + 'px';
  });

  wrap.addEventListener('pointerup', e => {
    if (!state.drag || state.drag.partId !== partId) return;
    e.preventDefault();
    const d    = state.drag;
    state.drag = null;

    const elRect   = d.el.getBoundingClientRect();
    const elCx     = elRect.left + elRect.width  / 2;
    const elCy     = elRect.top  + elRect.height / 2;
    const snapSlot = getSnapSlot(partId, elCx, elCy);

    if (snapSlot) {
      doSnap(snapSlot, d.el);
    } else {
      returnToTray(partId, d.el);
    }
  });

  // cancelled pointer (e.g. incoming call on tablet)
  wrap.addEventListener('pointercancel', e => {
    if (!state.drag || state.drag.partId !== partId) return;
    const d = state.drag;
    state.drag = null;
    returnToTray(partId, d.el);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Snap a part into place
// snapSlotId is the target slot (may differ from dragged partId for wheels)
// ══════════════════════════════════════════════════════════════════════════════
function doSnap(snapSlotId, el) {
  const def = PART_DEFS[snapSlotId];
  const r   = getPuzzleRect();
  const left = r.width  / 2 + (def.bx || 0) - def.w / 2;
  const top  = r.height / 2 + (def.by || 0) - def.h / 2;

  // record which slot this element is filling (needed for resize & completion)
  el.dataset.partId = snapSlotId;

  el.classList.remove('dragging', 'floating', 'bounce-back');
  el.classList.add('snapped');
  el.style.position = 'absolute';
  el.style.left     = left + 'px';
  el.style.top      = top  + 'px';
  el.style.zIndex   = String(def.z * 10);
  el.style.margin   = '0';
  el.style.width    = '';
  el.style.height   = '';

  const label = el.querySelector('.part-label');
  if (label) label.remove();

  snapLayer.appendChild(el);
  clearSnapHint(snapSlotId);

  playSnap();
  state.snapped.add(snapSlotId);

  el.classList.add('glow');
  setTimeout(() => el.classList.remove('glow'), 700);

  const sp = snapPxCenter(snapSlotId);
  spawnStarBurst(sp.x, sp.y);

  if (snapSlotId === 'sideBrush') {
    const svg = el.querySelector('svg');
    if (svg) svg.style.animation = 'sideBrushSpin 1.4s linear infinite';
  }

  updatePartsCounter();

  const level = LEVELS[state.levelIdx];
  if (state.snapped.size === level.parts.length) {
    state.completing = true;
    setTimeout(startCompletionSequence, 700);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Return a part to the tray
// ══════════════════════════════════════════════════════════════════════════════
function returnToTray(partId, el) {
  el.classList.remove('dragging');
  el.style.position = '';
  el.style.left     = '';
  el.style.top      = '';
  el.style.zIndex   = '';
  el.style.margin   = '';

  partsTray.appendChild(el);
  el.classList.add('bounce-back');

  setTimeout(() => {
    el.classList.remove('bounce-back');
    el.classList.add('floating');
  }, 560);

  playBoop();
  showToast(ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)]);
}

// ══════════════════════════════════════════════════════════════════════════════
// Toast message
// ══════════════════════════════════════════════════════════════════════════════
let _toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1700);
}

// ══════════════════════════════════════════════════════════════════════════════
// Particle effects
// ══════════════════════════════════════════════════════════════════════════════
function spawnStarBurst(cx, cy) {
  const emojis = ['⭐','✨','🌟','💫','🎉'];
  for (let i = 0; i < 9; i++) {
    const el    = document.createElement('div');
    el.className = 'star-burst';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (Math.random() * 360) * Math.PI / 180;
    const r2    = 55 + Math.random() * 80;
    el.style.left = (cx - 14) + 'px';
    el.style.top  = (cy - 14) + 'px';
    el.style.setProperty('--dx',  (Math.cos(angle) * r2) + 'px');
    el.style.setProperty('--dy',  (Math.sin(angle) * r2 - 20) + 'px');
    el.style.setProperty('--dur', (0.55 + Math.random() * 0.55) + 's');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }
}

function spawnConfetti() {
  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF8C42','#C77DFF','#FF6FD8','#00CFD5'];
  for (let i = 0; i < 65; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background   = colors[Math.floor(Math.random() * colors.length)];
    el.style.width        = (8 + Math.random() * 10) + 'px';
    el.style.height       = (8 + Math.random() * 14) + 'px';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.left         = (10 + Math.random() * 80) + 'vw';
    el.style.top          = (5  + Math.random() * 45) + 'vh';
    el.style.setProperty('--dx',  (Math.random() * 200 - 100) + 'px');
    el.style.setProperty('--dy',  (120 + Math.random() * 240) + 'px');
    el.style.setProperty('--rot', (Math.random() * 800 - 400) + 'deg');
    el.style.setProperty('--dur', (1.0 + Math.random() * 1.4)  + 's');
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Completion sequence
// ══════════════════════════════════════════════════════════════════════════════
async function startCompletionSequence() {
  // 1. Glow sensor eyes
  glowSensorEyes();
  await delay(800);

  // 2. Spin the assembled vacuum once
  await spinVacuum();
  await delay(150);

  // 3. Drive around with trail + play fanfare simultaneously
  startDrivingAnimation();
  playFanfare();

  // 4. Confetti + CLEAN text
  await delay(700);
  spawnConfetti();
  cleanOverlay.classList.remove('hidden');

  const isLast = state.levelIdx === LEVELS.length - 1;
  cleanText.textContent  = isLast ? 'Robot Champion! 🏆' : 'CLEAN! ✨';
  cleanText.style.fontSize = isLast ? 'clamp(2rem, 8vw, 4.5rem)' : '';

  // award star
  state.starsEarned = Math.min(state.starsEarned + 1, 5);
  renderStars();
  renderLevelDots();

  // pop the newly earned star
  const starEls = starsRow.querySelectorAll('.star-icon');
  const newStar = starEls[state.starsEarned - 1];
  if (newStar) { newStar.classList.add('pop'); }

  // 5. Fade out the CLEAN text + backdrop so the play area is clear
  setTimeout(() => cleanOverlay.classList.add('fading'), 2000);

  // 6. Next Level button slides in from the right after a pause
  await delay(2800);
  const nextIdx = state.levelIdx + 1;
  if (isLast) {
    nextBtn.textContent = 'Play Again 🔄';
  } else {
    const nextParts = LEVELS[nextIdx].parts;
    const nextLogoId = nextParts[nextParts.length - 1];
    const nextPng = PART_DEFS[nextLogoId]?.png;
    nextBtn.innerHTML = nextPng
      ? `<img class="next-logo" src="${nextPng}" alt=""> <span>Next →</span>`
      : '<span>Next Level →</span>';
  }
  nextBtn.classList.add('visible');
  nextBtn.style.pointerEvents = 'auto';
}

// ── Glow the sensor "eyes" on the top sensor part ────────────────────────────
function glowSensorEyes() {
  const sensorEl = snapLayer.querySelector('[data-part-id="topSensor"] svg');
  if (!sensorEl) return;
  sensorEl.querySelectorAll('.sensor-eye').forEach(eye => {
    eye.style.fill      = '#00FF88';
    eye.style.animation = 'sensorGlow 0.7s ease-in-out infinite';
  });
}

// ── Spin snap layer 360° ─────────────────────────────────────────────────────
function spinVacuum() {
  const kf   = [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }];
  const opts = { duration: 920, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' };
  try {
    state.spinAnim = snapLayer.animate(kf, opts);
    return new Promise(res => { state.spinAnim.onfinish = res; });
  } catch(e) { return Promise.resolve(); }
}

// ══════════════════════════════════════════════════════════════════════════════
// Canvas driving animation
// ══════════════════════════════════════════════════════════════════════════════
function startDrivingAnimation() {
  resizeCanvas();
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  const W = canvas.width, H = canvas.height;
  const BG = 'rgba(245,242,237,0.12)'; // background fade colour (matches page bg)

  const waypoints = [
    { x: W * 0.50, y: H * 0.50 },
    { x: W * 0.82, y: H * 0.18 },
    { x: W * 0.18, y: H * 0.14 },
    { x: W * 0.12, y: H * 0.82 },
    { x: W * 0.82, y: H * 0.78 },
    { x: W * 0.55, y: H * 0.30 },
    { x: W * 0.50, y: H * 0.50 },
  ];

  const TOTAL_MS = 4400;
  const startT   = performance.now();
  startHum();

  function catmullRom(t, p0, p1, p2, p3) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3);
  }

  function getPos(prog) {
    const segs   = waypoints.length - 1;
    const scaled = prog * segs;
    const seg    = Math.min(Math.floor(scaled), segs - 1);
    const t      = scaled - seg;
    const p0 = waypoints[Math.max(seg-1, 0)];
    const p1 = waypoints[seg];
    const p2 = waypoints[Math.min(seg+1, waypoints.length-1)];
    const p3 = waypoints[Math.min(seg+2, waypoints.length-1)];
    return {
      x: catmullRom(t, p0.x, p1.x, p2.x, p3.x),
      y: catmullRom(t, p0.y, p1.y, p2.y, p3.y),
    };
  }

  function frame(now) {
    const prog = Math.min((now - startT) / TOTAL_MS, 1);
    const pos  = getPos(prog);

    // fade existing trail with a translucent fill (NOT clearRect — that ignores globalAlpha)
    ctx2d.fillStyle = BG;
    ctx2d.fillRect(0, 0, W, H);

    // trail glow dot
    ctx2d.beginPath();
    ctx2d.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
    ctx2d.fillStyle = 'rgba(173,232,244,0.65)';
    ctx2d.fill();

    // mini vacuum — use level colour so it matches the built robot
    drawMiniRobot(pos.x, pos.y);

    if (prog < 1) {
      requestAnimationFrame(frame);
    } else {
      stopHum();
      startPlayMode(pos.x, pos.y);
    }
  }

  requestAnimationFrame(frame);
}

// ══════════════════════════════════════════════════════════════════════════════
// Play mode — tap anywhere on the canvas to drive the robot there
// ══════════════════════════════════════════════════════════════════════════════
function drawMiniRobot(x, y) {
  const c = LEVEL_COLORS[state.levelIdx];
  ctx2d.beginPath();
  ctx2d.arc(x, y, 20, 0, Math.PI * 2);
  ctx2d.fillStyle = c.body;
  ctx2d.fill();
  ctx2d.beginPath();
  ctx2d.arc(x, y, 15, 0, Math.PI * 2);
  ctx2d.fillStyle = c.light;
  ctx2d.fill();
  [[- 6, -5], [6, -5]].forEach(([dx, dy]) => {
    ctx2d.beginPath();
    ctx2d.arc(x + dx, y + dy, 3, 0, Math.PI * 2);
    ctx2d.fillStyle = '#00FF88';
    ctx2d.fill();
  });
}

function startPlayMode(startX, startY) {
  const W = canvas.width, H = canvas.height;
  _playX = startX ?? W / 2;
  _playY = startY ?? H / 2;
  _playTX = _playX;
  _playTY = _playY;
  state.playMode = true;
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'crosshair';
  ctx2d.clearRect(0, 0, W, H);
  drawMiniRobot(_playX, _playY);
}

function stopPlayMode() {
  if (!state.playMode) return;
  state.playMode = false;
  if (state.playRafId) { cancelAnimationFrame(state.playRafId); state.playRafId = null; }
  canvas.style.pointerEvents = 'none';
  canvas.style.cursor = '';
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
}

function tickPlayMode() {
  if (!state.playMode) return;
  const dx = _playTX - _playX;
  const dy = _playTY - _playY;
  const d  = Math.hypot(dx, dy);

  if (d < 1.5) {
    state.playRafId = null;
    return;
  }

  const speed = Math.min(d * 0.12, 10);
  _playX += (dx / d) * speed;
  _playY += (dy / d) * speed;

  // fade old trail
  ctx2d.fillStyle = 'rgba(245,242,237,0.18)';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);

  // trail glow dot
  ctx2d.beginPath();
  ctx2d.arc(_playX, _playY, 12, 0, Math.PI * 2);
  ctx2d.fillStyle = 'rgba(173,232,244,0.45)';
  ctx2d.fill();

  drawMiniRobot(_playX, _playY);
  state.playRafId = requestAnimationFrame(tickPlayMode);
}

// Single shared canvas listener — only active when playMode is true
canvas.addEventListener('pointerdown', e => {
  if (!state.playMode) return;
  const r     = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / r.width;
  const scaleY = canvas.height / r.height;
  _playTX = (e.clientX - r.left) * scaleX;
  _playTY = (e.clientY - r.top)  * scaleY;
  if (!state.playRafId) {
    state.playRafId = requestAnimationFrame(tickPlayMode);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Next Level / Restart
// ══════════════════════════════════════════════════════════════════════════════
nextBtn.addEventListener('click', () => {
  if (state.levelIdx < LEVELS.length - 1) {
    state.levelIdx++;
  } else {
    state.levelIdx   = 0;
    state.starsEarned = 0;
  }
  initLevel();
});

// ══════════════════════════════════════════════════════════════════════════════
// Boot
// ══════════════════════════════════════════════════════════════════════════════
resizeCanvas();
initLevel();
