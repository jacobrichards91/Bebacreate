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

// Play-mode robot position (puzzle-area center offsets, px)
let _playDX = 0, _playDY = 0;
let _dockDX = 0, _dockDY = 0;   // dock/home position
let _vx = 0, _vy = 0;           // velocity while bouncing
let _playState = 'docked';       // 'docked' | 'cleaning' | 'returning'

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
// Driving animation — moves the real assembled robot around the puzzle area
// ══════════════════════════════════════════════════════════════════════════════
function startDrivingAnimation() {
  // Cancel the spin animation so its committed transform doesn't fight ours
  if (state.spinAnim) { state.spinAnim.cancel(); state.spinAnim = null; }

  resizeCanvas();
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  const r  = puzzleArea.getBoundingClientRect();
  const mx = r.width  * 0.27;  // max X offset keeping 180px robot in view
  const my = r.height * 0.20;  // max Y offset

  // Waypoints as offsets from puzzle-area center (puzzle-area px)
  const waypoints = [
    { dx:  0,   dy:  0  },
    { dx:  mx,  dy: -my },
    { dx: -mx,  dy: -my },
    { dx: -mx,  dy:  my },
    { dx:  mx,  dy:  my },
    { dx:  0,   dy:  0  },
  ];

  const TOTAL_MS = 4000;
  const startT   = performance.now();

  function catmullRom(t, p0, p1, p2, p3) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3);
  }

  function getOffset(prog) {
    const segs   = waypoints.length - 1;
    const scaled = prog * segs;
    const seg    = Math.min(Math.floor(scaled), segs - 1);
    const t      = scaled - seg;
    const p0 = waypoints[Math.max(seg-1, 0)];
    const p1 = waypoints[seg];
    const p2 = waypoints[Math.min(seg+1, waypoints.length-1)];
    const p3 = waypoints[Math.min(seg+2, waypoints.length-1)];
    return {
      dx: catmullRom(t, p0.dx, p1.dx, p2.dx, p3.dx),
      dy: catmullRom(t, p0.dy, p1.dy, p2.dy, p3.dy),
    };
  }

  function frame(now) {
    const prog = Math.min((now - startT) / TOTAL_MS, 1);
    const off  = getOffset(prog);

    // Move the real assembled robot
    snapLayer.style.transform = `translate(${off.dx}px,${off.dy}px)`;

    // Draw a fading trail dot on canvas at the robot's canvas-space position
    const cx = canvas.width  * (0.5 + off.dx / r.width);
    const cy = canvas.height * (0.5 + off.dy / r.height);
    ctx2d.fillStyle = 'rgba(245,242,237,0.10)';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx2d.fillStyle = 'rgba(173,232,244,0.55)';
    ctx2d.fill();

    if (prog < 1) {
      requestAnimationFrame(frame);
    } else {
      startPlayMode();
    }
  }

  requestAnimationFrame(frame);
}

// ══════════════════════════════════════════════════════════════════════════════
// Play mode — power button bounces robot; dock returns it home
// ══════════════════════════════════════════════════════════════════════════════
function startPlayMode() {
  const r  = puzzleArea.getBoundingClientRect();
  // Dock prong tips sit 62px below puzzle-area top.
  // Bumper centre at dy: r.height/2 + dy - 98
  // Set bumper centre = 62 → dy = 62 + 98 - r.height/2 = 160 - r.height/2
  _dockDX = 0;
  _dockDY = 160 - r.height / 2;

  _playDX = 0; _playDY = 0;
  _vx = 0; _vy = 0;
  _playState = 'returning';   // glide robot from centre up to dock

  state.playMode = true;
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'default';
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  state.playRafId = requestAnimationFrame(tickPlayMode);
  _buildDock();
}

function _buildDock() {
  document.getElementById('play-dock')?.remove();
  const dock = document.createElement('div');
  dock.id = 'play-dock';
  dock.innerHTML = `<svg width="160" height="62" viewBox="0 0 160 62" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dkgrd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#484848"/>
        <stop offset="100%" stop-color="#1E1E1E"/>
      </linearGradient>
    </defs>
    <rect x="5" y="0" width="150" height="46" rx="10" fill="url(#dkgrd)" stroke="#666" stroke-width="1.5"/>
    <rect x="15" y="3" width="130" height="4" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect class="dock-led" x="20" y="11" width="120" height="6" rx="3" fill="#00CC66" opacity="0.85"/>
    <text x="80" y="38" text-anchor="middle" font-family="Nunito,sans-serif"
          font-size="11" font-weight="900" fill="#888" letter-spacing="0.08em">HOME BASE</text>
    <rect x="50" y="42" width="14" height="20" rx="4" fill="#C8A84B" stroke="#907010" stroke-width="1.2"/>
    <rect x="96" y="42" width="14" height="20" rx="4" fill="#C8A84B" stroke="#907010" stroke-width="1.2"/>
    <rect x="53" y="44" width="5" height="8" rx="2" fill="#F0D070" opacity="0.6"/>
    <rect x="99" y="44" width="5" height="8" rx="2" fill="#F0D070" opacity="0.6"/>
  </svg>`;
  puzzleArea.appendChild(dock);
  dock.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if (_playState === 'cleaning') {
      _playState = 'returning';
      if (!state.playRafId) state.playRafId = requestAnimationFrame(tickPlayMode);
    }
  });
}

function stopPlayMode() {
  if (!state.playMode) return;
  state.playMode = false;
  if (state.playRafId) { cancelAnimationFrame(state.playRafId); state.playRafId = null; }
  canvas.style.pointerEvents = 'none';
  canvas.style.cursor = '';
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  snapLayer.style.transform = '';
  snapLayer.classList.remove('play-docked');
  document.getElementById('play-dock')?.remove();
  _playState = 'docked';
}

function _drawPlayTrail(r) {
  const cx = canvas.width  * (0.5 + _playDX / r.width);
  const cy = canvas.height * (0.5 + _playDY / r.height);
  ctx2d.fillStyle = 'rgba(245,242,237,0.06)';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);
  ctx2d.beginPath();
  ctx2d.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx2d.fillStyle = 'rgba(173,232,244,0.32)';
  ctx2d.fill();
}

function tickPlayMode() {
  if (!state.playMode) return;
  const r = puzzleArea.getBoundingClientRect();

  // ── Bouncing ──────────────────────────────────────────────────────────────
  if (_playState === 'cleaning') {
    const maxDX = r.width  / 2 - 96;
    const minDY = -(r.height / 2 - 130);   // bumper top at puzzle-area top
    const maxDY =  r.height / 2 - 86;      // cliff sensors at puzzle-area bottom

    _playDX += _vx;
    _playDY += _vy;

    if (_playDX >  maxDX) { _playDX =  maxDX; _vx = -Math.abs(_vx); }
    if (_playDX < -maxDX) { _playDX = -maxDX; _vx =  Math.abs(_vx); }
    if (_playDY >  maxDY) { _playDY =  maxDY; _vy = -Math.abs(_vy); }
    if (_playDY <  minDY) { _playDY =  minDY; _vy =  Math.abs(_vy); }

    snapLayer.style.transform = `translate(${_playDX}px,${_playDY}px)`;
    _drawPlayTrail(r);
    state.playRafId = requestAnimationFrame(tickPlayMode);
    return;
  }

  // ── Returning to dock ─────────────────────────────────────────────────────
  if (_playState === 'returning') {
    const dx = _dockDX - _playDX;
    const dy = _dockDY - _playDY;
    const d  = Math.hypot(dx, dy);

    if (d < 2) {
      _playDX = _dockDX; _playDY = _dockDY;
      snapLayer.style.transform = `translate(${_playDX}px,${_playDY}px)`;
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      _playState = 'docked';
      state.playRafId = null;
      snapLayer.classList.add('play-docked');  // power button glow hint
      return;
    }

    const speed = Math.min(d * 0.08, 10);
    _playDX += (dx / d) * speed;
    _playDY += (dy / d) * speed;
    snapLayer.style.transform = `translate(${_playDX}px,${_playDY}px)`;
    _drawPlayTrail(r);
    state.playRafId = requestAnimationFrame(tickPlayMode);
  }
}

// Tap the robot's power button (centre of robot) to start cleaning
canvas.addEventListener('pointerdown', e => {
  if (!state.playMode) return;
  const r = puzzleArea.getBoundingClientRect();
  const tapX = e.clientX - r.left;
  const tapY = e.clientY - r.top;
  const robotCX = r.width  / 2 + _playDX;
  const robotCY = r.height / 2 + _playDY;

  if (Math.hypot(tapX - robotCX, tapY - robotCY) < 38 && _playState === 'docked') {
    snapLayer.classList.remove('play-docked');
    // Diagonal launch angle (avoids boring straight bounces)
    const sectors  = [35, 145, 215, 325];
    const angle    = (sectors[Math.floor(Math.random() * 4)] + (Math.random() - 0.5) * 30) * Math.PI / 180;
    _vx = Math.cos(angle) * 2.2;
    _vy = Math.sin(angle) * 2.2;
    _playState = 'cleaning';
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    if (!state.playRafId) state.playRafId = requestAnimationFrame(tickPlayMode);
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
