// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  levelIdx: 0,
  starsEarned: 0,
  snapped: new Set(),
  drag: null,           // { partId, el, offsetX, offsetY, trayEl }
  completing: false,
};

const SNAP_DIST = 60;
const ENCOURAGE = ['Oops! Try again!', 'Almost!', 'Keep trying!', 'So close!'];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const puzzleArea   = document.getElementById('puzzle-area');
const snapLayer    = document.getElementById('snap-layer');
const partsTray    = document.getElementById('parts-tray');
const starsRow     = document.getElementById('stars-row');
const levelNameEl  = document.getElementById('level-name');
const levelNumEl   = document.getElementById('level-num');
const toastEl      = document.getElementById('toast');
const cleanOverlay = document.getElementById('clean-overlay');
const cleanText    = document.getElementById('clean-text');
const nextBtn      = document.getElementById('next-btn');
const canvas       = document.getElementById('trail-canvas');
const ctx2d        = canvas.getContext('2d');

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function getPuzzleRect() {
  return puzzleArea.getBoundingClientRect();
}

function snapPxPos(partId) {
  const def = PART_DEFS[partId];
  const r   = getPuzzleRect();
  return {
    x: r.left + def.snapX * r.width,
    y: r.top  + def.snapY * r.height,
  };
}

// ── Stars UI ──────────────────────────────────────────────────────────────────
function renderStars() {
  starsRow.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('span');
    s.className = 'star-icon' + (i < state.starsEarned ? ' filled' : '');
    s.textContent = i < state.starsEarned ? '⭐' : '☆';
    starsRow.appendChild(s);
  }
}

// ── Level init ────────────────────────────────────────────────────────────────
function initLevel() {
  const level = LEVELS[state.levelIdx];
  state.snapped.clear();
  state.completing = false;
  state.drag = null;

  // top bar
  levelNameEl.textContent = level.name;
  levelNumEl.textContent  = `Level ${level.id}`;
  renderStars();

  // clear previous parts
  snapLayer.innerHTML = '';
  partsTray.innerHTML = '';

  // clear canvas
  resizeCanvas();
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  // hide overlays
  cleanOverlay.classList.add('hidden');
  nextBtn.classList.remove('visible');

  // create tray parts (shuffled)
  const shuffled = shuffle(level.parts);
  shuffled.forEach((partId, i) => {
    const def  = PART_DEFS[partId];
    const wrap = document.createElement('div');
    wrap.className = 'part-wrap floating';
    wrap.dataset.partId = partId;
    wrap.style.animationDelay = `${(i * 0.35) % 2}s`;
    wrap.style.animationDuration = `${2.8 + (i * 0.2) % 1.2}s`;
    wrap.innerHTML = def.svg() + `<div class="part-label">${def.label}</div>`;
    partsTray.appendChild(wrap);
    attachDrag(wrap, partId);
  });
}

// ── Canvas resize ─────────────────────────────────────────────────────────────
function resizeCanvas() {
  const r = getPuzzleRect();
  canvas.width  = r.width;
  canvas.height = r.height;
  canvas.style.left = '0';
  canvas.style.top  = '0';
}

window.addEventListener('resize', () => {
  resizeCanvas();
  // re-position snapped parts
  state.snapped.forEach(partId => {
    const el  = snapLayer.querySelector(`[data-part-id="${partId}"]`);
    if (!el) return;
    const def = PART_DEFS[partId];
    const r   = getPuzzleRect();
    el.style.left = (def.snapX * r.width  - def.w / 2) + 'px';
    el.style.top  = (def.snapY * r.height - def.h / 2) + 'px';
  });
});

// ── Drag & drop ───────────────────────────────────────────────────────────────
function attachDrag(wrap, partId) {
  wrap.addEventListener('pointerdown', e => {
    if (state.snapped.has(partId) || state.completing) return;
    e.preventDefault();
    getAudioCtx(); // unlock audio context on first touch

    const rect = wrap.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // move to body for free positioning
    const def = PART_DEFS[partId];
    document.body.appendChild(wrap);
    wrap.style.position = 'fixed';
    wrap.style.left  = (e.clientX - offsetX) + 'px';
    wrap.style.top   = (e.clientY - offsetY) + 'px';
    wrap.style.zIndex = 2000;
    wrap.style.margin = '0';
    wrap.classList.remove('floating');
    wrap.classList.add('dragging');

    wrap.setPointerCapture(e.pointerId);

    state.drag = { partId, el: wrap, offsetX, offsetY };
  });

  wrap.addEventListener('pointermove', e => {
    if (!state.drag || state.drag.partId !== partId) return;
    e.preventDefault();
    const d = state.drag;
    d.el.style.left = (e.clientX - d.offsetX) + 'px';
    d.el.style.top  = (e.clientY - d.offsetY) + 'px';
  });

  wrap.addEventListener('pointerup', e => {
    if (!state.drag || state.drag.partId !== partId) return;
    e.preventDefault();
    const d   = state.drag;
    state.drag = null;

    const def     = PART_DEFS[partId];
    const elRect  = d.el.getBoundingClientRect();
    const elCx    = elRect.left + elRect.width  / 2;
    const elCy    = elRect.top  + elRect.height / 2;
    const snap    = snapPxPos(partId);
    const d2snap  = dist(elCx, elCy, snap.x, snap.y);

    if (d2snap < SNAP_DIST) {
      doSnap(partId, d.el);
    } else {
      returnToTray(partId, d.el);
    }
  });
}

// ── Snap part ─────────────────────────────────────────────────────────────────
function doSnap(partId, el) {
  const def = PART_DEFS[partId];
  const r   = getPuzzleRect();
  const snapLeft = def.snapX * r.width  - def.w / 2;
  const snapTop  = def.snapY * r.height - def.h / 2;

  // move into snap layer
  el.classList.remove('dragging', 'floating', 'bounce-back');
  el.classList.add('snapped');
  el.style.position = 'absolute';
  el.style.left   = snapLeft + 'px';
  el.style.top    = snapTop  + 'px';
  el.style.zIndex = def.z * 10;
  el.style.margin = '0';

  // remove label
  const label = el.querySelector('.part-label');
  if (label) label.remove();

  snapLayer.appendChild(el);

  playSnap();
  state.snapped.add(partId);

  // green glow then star burst
  el.classList.add('glow');
  setTimeout(() => el.classList.remove('glow'), 600);

  spawnStarBurst(
    r.left + def.snapX * r.width,
    r.top  + def.snapY * r.height
  );

  // side brush: spin continuously after snap
  if (partId === 'sideBrush') {
    const svg = el.querySelector('svg');
    if (svg) svg.style.animation = 'sideBrushSpin 1.2s linear infinite';
  }

  const level = LEVELS[state.levelIdx];
  if (state.snapped.size === level.parts.length) {
    state.completing = true;
    setTimeout(startCompletionSequence, 600);
  }
}

// ── Return to tray ────────────────────────────────────────────────────────────
function returnToTray(partId, el) {
  el.classList.remove('dragging');
  el.classList.add('bounce-back');
  el.style.position = '';
  el.style.left     = '';
  el.style.top      = '';
  el.style.zIndex   = '';
  el.style.margin   = '';

  partsTray.appendChild(el);

  setTimeout(() => {
    el.classList.remove('bounce-back');
    el.classList.add('floating');
  }, 500);

  playBoop();
  showToast(ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)]);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

// ── Star burst particles ──────────────────────────────────────────────────────
function spawnStarBurst(cx, cy) {
  const emojis = ['⭐','✨','🌟','💫'];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'star-burst';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (Math.random() * 360) * Math.PI / 180;
    const r2 = 50 + Math.random() * 70;
    el.style.left = (cx - 12) + 'px';
    el.style.top  = (cy - 12) + 'px';
    el.style.setProperty('--dx', Math.cos(angle) * r2 + 'px');
    el.style.setProperty('--dy', Math.sin(angle) * r2 + 'px');
    el.style.setProperty('--dur', (0.6 + Math.random() * 0.5) + 's');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function spawnConfetti() {
  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF8C42','#C77DFF','#FF6FD8'];
  for (let i = 0; i < 55; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = (20 + Math.random() * 60) + 'vw';
    el.style.top  = (10 + Math.random() * 40) + 'vh';
    const angle = (Math.random() * 360) * Math.PI / 180;
    const r2 = 80 + Math.random() * 160;
    el.style.setProperty('--dx', Math.cos(angle) * r2 + 'px');
    el.style.setProperty('--dy', (100 + Math.random() * 200) + 'px');
    el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    el.style.setProperty('--dur', (1.2 + Math.random() * 1.2) + 's');
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}

// ── Glow sensor eyes ──────────────────────────────────────────────────────────
function glowSensorEyes() {
  const sensorEl = snapLayer.querySelector('[data-part-id="topSensor"] svg');
  if (!sensorEl) return;
  const eyes = sensorEl.querySelectorAll('[id^="sensor-eye"]');
  eyes.forEach(eye => {
    eye.style.fill = '#00FF88';
    eye.style.animation = 'sensorGlow 0.8s ease-in-out infinite';
    eye.style.filter = 'drop-shadow(0 0 6px #00FF88)';
  });
}

// ── Spin vacuum ───────────────────────────────────────────────────────────────
function spinVacuum() {
  // Spin all snapped parts together by wrapping snap layer temporarily
  snapLayer.style.transformOrigin = '50% 50%';

  const r = getPuzzleRect();
  const cx = r.left + r.width / 2;
  const cy = r.top  + r.height / 2;

  // animate via keyframe on a wrapper
  const kf = [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' },
  ];
  const opts = { duration: 900, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' };

  // spin the snap layer around its center
  snapLayer.style.position = 'absolute';
  snapLayer.style.inset = '0';
  try {
    const anim = snapLayer.animate(kf, opts);
    return new Promise(res => { anim.onfinish = res; });
  } catch(e) {
    return Promise.resolve();
  }
}

// ── Canvas driving trail ──────────────────────────────────────────────────────
function startDrivingAnimation() {
  const r = getPuzzleRect();
  resizeCanvas();
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  // waypoints relative to puzzle area (local coords)
  const W = canvas.width, H = canvas.height;
  const waypoints = [
    { x: W * 0.5, y: H * 0.5 },
    { x: W * 0.8, y: H * 0.2 },
    { x: W * 0.2, y: H * 0.15 },
    { x: W * 0.15, y: H * 0.8 },
    { x: W * 0.8, y: H * 0.75 },
    { x: W * 0.5, y: H * 0.5 },
  ];

  const totalDur = 4000; // ms
  const start = performance.now();
  let prevX = waypoints[0].x, prevY = waypoints[0].y;

  startHum();

  // build full path via Catmull-Rom
  function catmullRom(t, p0, p1, p2, p3) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2*p0 - 5*p1 + 4*p2 - p3) * t2 +
      (-p0 + 3*p1 - 3*p2 + p3) * t3
    );
  }

  function getPos(progress) {
    // progress 0-1 across all segments
    const segs = waypoints.length - 1;
    const scaled = progress * segs;
    const seg = Math.min(Math.floor(scaled), segs - 1);
    const t = scaled - seg;
    const p0 = waypoints[Math.max(seg - 1, 0)];
    const p1 = waypoints[seg];
    const p2 = waypoints[Math.min(seg + 1, waypoints.length - 1)];
    const p3 = waypoints[Math.min(seg + 2, waypoints.length - 1)];
    return {
      x: catmullRom(t, p0.x, p1.x, p2.x, p3.x),
      y: catmullRom(t, p0.y, p1.y, p2.y, p3.y),
    };
  }

  function frame(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / totalDur, 1);
    const pos = getPos(progress);

    // fade existing trail
    ctx2d.fillStyle = 'rgba(245,242,237,0.10)';
    ctx2d.fillRect(0, 0, W, H);

    // draw trail dot
    ctx2d.beginPath();
    ctx2d.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx2d.fillStyle = 'rgba(173, 232, 244, 0.7)';
    ctx2d.fill();

    // draw tiny vacuum circle
    ctx2d.beginPath();
    ctx2d.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
    ctx2d.fillStyle = '#3A3A3A';
    ctx2d.fill();
    ctx2d.beginPath();
    ctx2d.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
    ctx2d.fillStyle = '#555';
    ctx2d.fill();

    prevX = pos.x; prevY = pos.y;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      stopHum();
      // fade canvas out
      let alpha = 1;
      const fade = () => {
        alpha -= 0.04;
        ctx2d.globalAlpha = Math.max(alpha, 0);
        ctx2d.clearRect(0, 0, W, H);
        if (alpha > 0) requestAnimationFrame(fade);
        else ctx2d.globalAlpha = 1;
      };
      setTimeout(() => requestAnimationFrame(fade), 400);
    }
  }

  requestAnimationFrame(frame);
}

// ── Completion sequence ───────────────────────────────────────────────────────
async function startCompletionSequence() {
  const level = LEVELS[state.levelIdx];

  // 1. glow eyes
  glowSensorEyes();
  await delay(700);

  // 2. spin
  await spinVacuum();
  await delay(200);

  // 3. drive with trail
  startDrivingAnimation();
  playFanfare();

  // 4. confetti + CLEAN!
  await delay(800);
  spawnConfetti();
  cleanOverlay.classList.remove('hidden');

  if (state.levelIdx === LEVELS.length - 1) {
    cleanText.textContent = "You're a Vacuum Expert! 🤖";
    cleanText.style.fontSize = 'clamp(1.8rem, 7vw, 4rem)';
  } else {
    cleanText.textContent = 'CLEAN! ✨';
  }

  // award star
  state.starsEarned = Math.min(state.starsEarned + 1, 5);
  renderStars();
  // animate latest star
  const starEls = starsRow.querySelectorAll('.star-icon');
  if (starEls[state.starsEarned - 1]) {
    starEls[state.starsEarned - 1].classList.add('pop');
  }

  await delay(2800);

  // 5. next button
  if (state.levelIdx < LEVELS.length - 1) {
    nextBtn.textContent = 'Next Level →';
  } else {
    nextBtn.textContent = 'Play Again 🔄';
  }
  nextBtn.classList.add('visible');
  nextBtn.style.pointerEvents = 'auto';
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Next level / restart ──────────────────────────────────────────────────────
nextBtn.addEventListener('click', () => {
  // reset snap layer animation
  snapLayer.style.animation = '';
  snapLayer.style.transform = '';

  if (state.levelIdx < LEVELS.length - 1) {
    state.levelIdx++;
  } else {
    state.levelIdx = 0;
    state.starsEarned = 0;
  }
  initLevel();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
resizeCanvas();
initLevel();
