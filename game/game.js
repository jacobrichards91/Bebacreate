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

// Fleet of completed robots (persists across levels)
// Each entry: { el, dockCX, dockCY, scale, dx, dy, vx, vy }
const robotFleet = [];  // each robot carries its own .state ('docked'|'cleaning'|'returning')

const SNAP_DIST   = 55;
const ENCOURAGE   = ['Oops! Try again! 😅', 'Almost! 💪', 'Keep trying! 🌟', 'So close! 🎯', "You've got this! 🤖"];
const LOGO_PARTS  = ['logoIrobot', 'logoEufy', 'logoRoborock', 'logoTapo', 'logoDreame', 'logoShark', 'logoEcovacs'];

// ══════════════════════════════════════════════════════════════════════════════
// Fleet helpers
// ══════════════════════════════════════════════════════════════════════════════
// Robot visual bounding box (px, full scale): width=246, height=214
const ROBOT_VW = 246, ROBOT_VH = 214;
const DOCK_H   = 64;    // dock zone height (px) at top of puzzle area
const DOCK_PAD = 10;    // padding around each individual dock shape
const MAX_PLAY_SCALE = 0.90;   // cap for big play-mode robots

function calcDockScale(N) {
  const r = puzzleArea.getBoundingClientRect();
  const scaleW = (r.width - 4) / N / ROBOT_VW;
  const scaleH = DOCK_H / ROBOT_VH;
  return Math.max(Math.min(scaleW, scaleH, 0.30), 0.10);
}

function calcPlayScale(dockScale, N) {
  const r = puzzleArea.getBoundingClientRect();
  // Allow docks to overlap a bit so more robots can stay big enough to tap
  const widthCap = (r.width * 1.15) / N / ROBOT_VW;
  // Floor keeps the power button comfortably tappable even at high N
  return Math.max(Math.min(dockScale * 3, widthCap, MAX_PLAY_SCALE), 0.42);
}

function applyFleetTransform(robot) {
  const r  = puzzleArea.getBoundingClientRect();
  const tx = robot.dockCX - r.width  / 2 + robot.dx;
  const ty = robot.dockCY - r.height / 2 + robot.dy;
  robot.el.style.transform = `translate(${tx}px,${ty}px) scale(${robot.scale})`;
}

function updateFleetLayout(animateNew) {
  const N = robotFleet.length;
  if (N === 0) { _buildDock(); return; }

  const r         = puzzleArea.getBoundingClientRect();
  const dockScale = calcDockScale(N);
  const playScale = calcPlayScale(dockScale, N);
  const activeScale = state.playMode ? playScale : dockScale;
  // In play mode, robots sit just below the dock (top of robot ~ bottom of dock prongs)
  const activeCY = state.playMode
    ? DOCK_H + (ROBOT_VH * playScale) / 2
    : DOCK_H / 2;
  const slotW = r.width / N;

  robotFleet.forEach((robot, i) => {
    const scaleChanged = Math.abs(robot.scale - activeScale) > 0.001;
    robot.dockScale = dockScale;
    robot.playScale = playScale;
    robot.scale     = activeScale;
    robot.dockCX    = slotW / 2 + i * slotW;
    robot.dockCY    = activeCY;

    const isNew = animateNew && i === N - 1;
    if (isNew) {
      // Start at puzzle centre (full-size), then settle into home slot
      robot.el.style.transition = '';
      robot.el.style.transform  = 'translate(0px,0px) scale(1)';
      requestAnimationFrame(() => {
        robot.el.style.transition = 'transform 0.85s cubic-bezier(0.34,1.56,0.64,1)';
        applyFleetTransform(robot);
        setTimeout(() => {
          robot.el.style.transition = '';
          if (robot.state === 'docked' && state.playMode) {
            robot.el.classList.add('play-docked');
          }
        }, 880);
      });
    } else if (scaleChanged) {
      robot.el.style.transition = 'transform 0.7s ease-in-out';
      applyFleetTransform(robot);
      setTimeout(() => { robot.el.style.transition = ''; }, 720);
    } else {
      applyFleetTransform(robot);
    }

    // Keep play-docked class in sync with state (existing fleet members
    // entering play mode should start glowing immediately)
    if (!isNew) {
      const shouldGlow = state.playMode && robot.state === 'docked';
      robot.el.classList.toggle('play-docked', shouldGlow);
    }
  });
  _buildDock();
}

function captureRobot() {
  const clone = snapLayer.cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.add('fleet-robot');
  clone.classList.remove('play-docked');
  clone.style.cssText = 'position:absolute;inset:0;pointer-events:none;transform-origin:50% 50%;z-index:8;';
  puzzleArea.appendChild(clone);
  robotFleet.push({
    el: clone, dockCX: 0, dockCY: DOCK_H / 2,
    dockScale: 0.28, playScale: 0.85, scale: 1,
    dx: 0, dy: 0, vx: 0, vy: 0,
    state: 'docked',   // per-robot: 'docked' | 'cleaning' | 'returning'
  });
}

function clearFleet() {
  robotFleet.forEach(r => r.el.remove());
  robotFleet.length = 0;
}

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
  state.snapped.forEach(partId => {
    const el  = snapLayer.querySelector(`[data-part-id="${partId}"]`);
    if (!el) return;
    const def = PART_DEFS[partId];
    const r   = getPuzzleRect();
    el.style.left = (r.width  / 2 + (def.bx || 0) - def.w / 2) + 'px';
    el.style.top  = (r.height / 2 + (def.by || 0) - def.h / 2) + 'px';
  });
  updateFleetLayout(false);
});

// ══════════════════════════════════════════════════════════════════════════════
// Level initialisation
// ══════════════════════════════════════════════════════════════════════════════
function initLevel() {
  const level = LEVELS[state.levelIdx];

  // Randomise the logo for this level
  const logoIdx = level.parts.findIndex(id => id.startsWith('logo'));
  if (logoIdx >= 0) {
    level.parts[logoIdx] = LOGO_PARTS[Math.floor(Math.random() * LOGO_PARTS.length)];
  }

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
  snapLayer.style.display = '';   // ensure visible for building (was hidden in play mode)
  updateFleetLayout(false);       // position prior robots in dock, rebuild dock visual

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
// Play mode — all fleet robots bounce; dock returns them home
// ══════════════════════════════════════════════════════════════════════════════
function startPlayMode() {
  captureRobot();
  snapLayer.style.display = 'none';   // hide build layer; fleet clone takes over
  state.playMode = true;
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'default';
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  // All robots start docked in play mode
  robotFleet.forEach(r => { r.state = 'docked'; r.dx = 0; r.dy = 0; r.vx = 0; r.vy = 0; });
  updateFleetLayout(true);            // move new robot into dock slot, glow existing
}

function _buildDock() {
  document.getElementById('play-dock')?.remove();
  const r = puzzleArea.getBoundingClientRect();
  const W = r.width;
  const N = robotFleet.length;

  // Each robot gets its own charging station
  const slotW = N > 0 ? W / N : W;
  const dockW = N > 0
    ? Math.max(48, Math.min(slotW - 4, ROBOT_VW * robotFleet[0].dockScale + DOCK_PAD * 2, 100))
    : 90;

  const stations = N > 0
    ? robotFleet.map((robot, i) => {
        const cx = robot.dockCX;
        const x  = Math.round(cx - dockW / 2);
        return `<g class="dock-station" data-robot-idx="${i}" pointer-events="all" transform="translate(${x},0)">
          <rect x="0" y="0" width="${dockW}" height="44" rx="7" fill="url(#dkgrd)" stroke="#555" stroke-width="1"/>
          <rect x="4" y="3" width="${dockW - 8}" height="3" rx="1.5" fill="rgba(255,255,255,0.12)"/>
          <rect x="7" y="9" width="${dockW - 14}" height="4" rx="2" fill="#00CC66" opacity="0.85"/>
          <text x="${dockW / 2}" y="32" text-anchor="middle" font-family="Nunito,sans-serif"
                font-size="8" font-weight="900" fill="#888" letter-spacing="0.06em">HOME</text>
          <rect x="${dockW / 2 - 7}" y="42" width="14" height="20" rx="4" fill="#C8A84B" stroke="#907010" stroke-width="1.2"/>
          <rect x="${dockW / 2 - 4}" y="44" width="5"  height="8"  rx="2" fill="#F0D070" opacity="0.6"/>
        </g>`;
      }).join('')
    : `<g class="dock-station" transform="translate(${(W - dockW) / 2},0)">
        <rect x="0" y="0" width="${dockW}" height="44" rx="7" fill="url(#dkgrd)" stroke="#555" stroke-width="1"/>
        <rect x="${dockW / 2 - 7}" y="42" width="14" height="20" rx="4" fill="#C8A84B" stroke="#907010" stroke-width="1.2"/>
        <rect x="${dockW / 2 - 4}" y="44" width="5"  height="8"  rx="2" fill="#F0D070" opacity="0.6"/>
      </g>`;

  const dock = document.createElement('div');
  dock.id = 'play-dock';
  dock.innerHTML = `<svg width="${W}" height="${DOCK_H}" viewBox="0 0 ${W} ${DOCK_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dkgrd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#484848"/>
        <stop offset="100%" stop-color="#1E1E1E"/>
      </linearGradient>
    </defs>
    ${stations}
  </svg>`;
  puzzleArea.appendChild(dock);

  // Each station only returns its associated robot. Empty SVG space
  // lets taps fall through to the canvas so launch-taps still work.
  dock.querySelectorAll('.dock-station[data-robot-idx]').forEach(station => {
    station.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (!state.playMode) return;
      const idx = parseInt(station.dataset.robotIdx, 10);
      const robot = robotFleet[idx];
      if (!robot || robot.state !== 'cleaning') return;
      robot.state = 'returning';
      if (!state.playRafId) state.playRafId = requestAnimationFrame(tickPlayMode);
    });
  });
}

function stopPlayMode() {
  if (!state.playMode) return;
  state.playMode = false;
  if (state.playRafId) { cancelAnimationFrame(state.playRafId); state.playRafId = null; }
  canvas.style.pointerEvents = 'none';
  canvas.style.cursor = '';
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  // Reset all robot state and positions
  robotFleet.forEach(r => {
    r.dx = 0; r.dy = 0; r.vx = 0; r.vy = 0;
    r.state = 'docked';
    r.el.classList.remove('play-docked');
    applyFleetTransform(r);
  });
  snapLayer.style.display = '';   // show build layer again for next level
  document.getElementById('play-dock')?.remove();
}

function _drawPlayTrails(r) {
  ctx2d.fillStyle = 'rgba(245,242,237,0.05)';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);
  robotFleet.forEach(robot => {
    if (robot.state === 'docked') return;   // skip still robots
    const cx = canvas.width  * ((robot.dockCX + robot.dx) / r.width);
    const cy = canvas.height * ((robot.dockCY + robot.dy) / r.height);
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, Math.max(14 * robot.scale, 4), 0, Math.PI * 2);
    ctx2d.fillStyle = 'rgba(173,232,244,0.35)';
    ctx2d.fill();
  });
}

function tickPlayMode() {
  if (!state.playMode) return;
  const r = puzzleArea.getBoundingClientRect();
  let anyActive = false;

  robotFleet.forEach(robot => {
    if (robot.state === 'cleaning') {
      anyActive = true;
      robot.dx += robot.vx;
      robot.dy += robot.vy;
      const halfW = ROBOT_VW / 2 * robot.scale;
      const halfH = ROBOT_VH / 2 * robot.scale;
      // Bounds are relative to this robot's home slot
      const minDX = halfW - robot.dockCX;
      const maxDX = r.width  - halfW - robot.dockCX;
      const minDY = halfH - robot.dockCY;
      const maxDY = r.height - halfH - robot.dockCY;
      if (robot.dx > maxDX) { robot.dx = maxDX; robot.vx = -Math.abs(robot.vx); }
      if (robot.dx < minDX) { robot.dx = minDX; robot.vx =  Math.abs(robot.vx); }
      if (robot.dy > maxDY) { robot.dy = maxDY; robot.vy = -Math.abs(robot.vy); }
      if (robot.dy < minDY) { robot.dy = minDY; robot.vy =  Math.abs(robot.vy); }
      applyFleetTransform(robot);
    } else if (robot.state === 'returning') {
      const d = Math.hypot(robot.dx, robot.dy);
      if (d < 2) {
        robot.dx = 0; robot.dy = 0;
        robot.state = 'docked';
        robot.el.classList.add('play-docked');
        applyFleetTransform(robot);
      } else {
        anyActive = true;
        const speed = Math.min(d * 0.08, 10);
        robot.dx -= (robot.dx / d) * speed;
        robot.dy -= (robot.dy / d) * speed;
        applyFleetTransform(robot);
      }
    }
  });

  _drawPlayTrails(r);

  if (anyActive) {
    state.playRafId = requestAnimationFrame(tickPlayMode);
  } else {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    state.playRafId = null;
  }
}

// Tap a docked robot's power button to launch that one robot only
canvas.addEventListener('pointerdown', e => {
  if (!state.playMode) return;
  const r = puzzleArea.getBoundingClientRect();
  const tapX = e.clientX - r.left;
  const tapY = e.clientY - r.top;
  for (const robot of robotFleet) {
    if (robot.state !== 'docked') continue;  // only docked robots can be launched
    const rCX = robot.dockCX + robot.dx;
    const rCY = robot.dockCY + robot.dy;
    if (Math.hypot(tapX - rCX, tapY - rCY) < Math.max(60 * robot.scale, 36)) {
      robot.el.classList.remove('play-docked');
      const sectors = [35, 145, 215, 325];
      const angle = (sectors[Math.floor(Math.random() * 4)] + (Math.random() - 0.5) * 30) * Math.PI / 180;
      robot.vx = Math.cos(angle) * 2.2;
      robot.vy = Math.sin(angle) * 2.2;
      robot.state = 'cleaning';
      if (!state.playRafId) state.playRafId = requestAnimationFrame(tickPlayMode);
      break;  // launch at most one per tap
    }
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
    clearFleet();
  }
  initLevel();
});

// ══════════════════════════════════════════════════════════════════════════════
// Boot
// ══════════════════════════════════════════════════════════════════════════════
resizeCanvas();
initLevel();
