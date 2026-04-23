// ── Web Audio API ─────────────────────────────────────────────────────────────
let _audioCtx = null;
let _humOsc = null, _humGain = null;

function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function playTone(freq, duration, type = 'sine', peakGain = 0.28) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch (e) { /* silently ignore if audio unavailable */ }
}

function playSnap() {
  playTone(820, 0.12, 'sine', 0.3);
}

function playBoop() {
  playTone(200, 0.18, 'sine', 0.22);
  setTimeout(() => playTone(160, 0.12, 'sine', 0.12), 60);
}

function playFanfare() {
  // soft ascending 3-note chime (triangle = much gentler than sine at same gain)
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.28, 'triangle', 0.12), i * 220);
  });
  // tiny sparkle tail
  setTimeout(() => playTone(1046, 0.35, 'sine', 0.05), 750);
}

function startHum() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    _humOsc = ctx.createOscillator();
    _humGain = ctx.createGain();
    _humOsc.connect(_humGain);
    _humGain.connect(ctx.destination);
    _humOsc.type = 'triangle'; // much softer than sawtooth
    _humOsc.frequency.value = 180; // motor-whir pitch, less bass rumble
    const now = ctx.currentTime;
    _humGain.gain.setValueAtTime(0, now);
    _humGain.gain.linearRampToValueAtTime(0.035, now + 0.6);
    _humOsc.start(now);
  } catch (e) {}
}

function stopHum() {
  if (!_humOsc || !_humGain) return;
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    _humGain.gain.linearRampToValueAtTime(0, now + 0.5);
    _humOsc.stop(now + 0.55);
  } catch (e) {}
  _humOsc = null;
  _humGain = null;
}
