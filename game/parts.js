// ══════════════════════════════════════════════════════════════════════════════
// Level color palettes — one per level, applied to every part SVG
// ══════════════════════════════════════════════════════════════════════════════
const LEVEL_COLORS = [
  // 1 — Classic Charcoal (Roborock dark grey)
  { body:'#3A3A3A', light:'#5C5C5C', dark:'#181818', bump:'#484848', wheel:'#161616',
    accent:'#E85D04', accent2:'#FF9500', wifiCol:'#00B4D8' },
  // 2 — Ocean Blue (eufy teal)
  { body:'#1B3A5C', light:'#2C5A8C', dark:'#0A1E30', bump:'#1E4878', wheel:'#0A1820',
    accent:'#00C8E8', accent2:'#00A0C0', wifiCol:'#00E8FF' },
  // 3 — Forest Green (ECOVACS style)
  { body:'#1E3E22', light:'#305E36', dark:'#0C1C0E', bump:'#264830', wheel:'#0C160C',
    accent:'#5CC85C', accent2:'#3EA03E', wifiCol:'#80FF80' },
  // 4 — Crimson (iRobot inspired)
  { body:'#4A1818', light:'#6E2828', dark:'#200C0C', bump:'#581C1C', wheel:'#1A0808',
    accent:'#FF4040', accent2:'#FF8888', wifiCol:'#FF6060' },
  // 5 — Galaxy Purple (premium)
  { body:'#2C1A4E', light:'#462A78', dark:'#140C22', bump:'#361E60', wheel:'#100A1C',
    accent:'#C877FF', accent2:'#9944EE', wifiCol:'#AA66FF' },
];

// ══════════════════════════════════════════════════════════════════════════════
// Part definitions
//
// All snap positions are designed for a top-down robot vacuum view.
// Reference frame: 768 × 600 px puzzle area, body center at (384, 300) r=90.
//
// snapX/Y : 0–1 fraction of puzzle-area width/height  (snap-zone CENTER)
// w/h     : SVG element size in px
// z       : CSS z-index layer (×10) — higher = in front
// round   : true → circular snap-hint outline
// svg(c)  : returns SVG string using color palette c
// ══════════════════════════════════════════════════════════════════════════════
const PART_DEFS = {

  // ── Main body disc ──────────────────────────────────────────────────────────
  // Center of the puzzle area; all other parts attach relative to this.
  body: {
    label:'Body', snapX:0.500, snapY:0.500, w:180, h:180, z:3, round:true,
    svg(c) {
      return `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bgrd" cx="40%" cy="35%" r="58%">
            <stop offset="0%"   stop-color="${c.light}"/>
            <stop offset="45%"  stop-color="${c.body}"/>
            <stop offset="100%" stop-color="${c.dark}"/>
          </radialGradient>
        </defs>
        <circle cx="90" cy="90" r="87" fill="url(#bgrd)" stroke="${c.dark}" stroke-width="2"/>
        <circle cx="90" cy="90" r="75" fill="none" stroke="${c.light}" stroke-width="1.2" opacity="0.35"/>
        <path d="M 42,54 A 56,56 0 0 1 90,32" fill="none" stroke="${c.light}" stroke-width="2.5" stroke-linecap="round" opacity="0.28"/>
      </svg>`;
    }
  },

  // ── Front bumper ────────────────────────────────────────────────────────────
  // D-shaped arc on front (top in top-down view).
  // snapY=0.318: flat inner face lands ~12 px inside body top edge → looks attached.
  bumper: {
    label:'Bumper', snapX:0.500, snapY:0.318, w:162, h:62, z:6,
    svg(c) {
      return `<svg width="162" height="62" viewBox="0 0 162 62" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bugrd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="${c.light}"/>
            <stop offset="100%" stop-color="${c.bump}"/>
          </linearGradient>
        </defs>
        <path d="M 8,60 Q 8,4 81,4 Q 154,4 154,60 Z" fill="url(#bugrd)" stroke="${c.dark}" stroke-width="2"/>
        <path d="M 22,58 Q 22,16 81,16 Q 140,16 140,58" fill="none" stroke="${c.light}" stroke-width="1.5" opacity="0.35"/>
      </svg>`;
    }
  },

  // ── Left wheel ──────────────────────────────────────────────────────────────
  // snapX=0.367: right edge of wheel is ~10 px inside body left edge.
  // z=1 (behind body disc z=3) → body covers the inner overlap portion.
  wheelL: {
    label:'Left Wheel', snapX:0.367, snapY:0.500, w:44, h:84, z:1,
    svg(c) {
      return `<svg width="44" height="84" viewBox="0 0 44 84" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="38" height="78" rx="14" fill="${c.wheel}" stroke="${c.dark}" stroke-width="2"/>
        <rect x="8" y="14" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="26" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="38" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="50" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="62" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <path d="M 9,8 L 9,76" stroke="${c.light}" stroke-width="1.5" stroke-linecap="round" opacity="0.25"/>
      </svg>`;
    }
  },

  // ── Right wheel ─────────────────────────────────────────────────────────────
  // Mirror of left wheel. snapX=0.633 → left edge ~10 px inside body right edge.
  wheelR: {
    label:'Right Wheel', snapX:0.633, snapY:0.500, w:44, h:84, z:1,
    svg(c) {
      return `<svg width="44" height="84" viewBox="0 0 44 84" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="38" height="78" rx="14" fill="${c.wheel}" stroke="${c.dark}" stroke-width="2"/>
        <rect x="8" y="14" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="26" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="38" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="50" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <rect x="8" y="62" width="28" height="5" rx="2.5" fill="${c.body}" opacity="0.55"/>
        <path d="M 35,8 L 35,76" stroke="${c.light}" stroke-width="1.5" stroke-linecap="round" opacity="0.25"/>
      </svg>`;
    }
  },

  // ── Power / home button ─────────────────────────────────────────────────────
  // Sits in the exact center of the body disc (same snapX/Y as body).
  // z=8 → renders on top of body disc.
  powerBtn: {
    label:'Power Button', snapX:0.500, snapY:0.500, w:58, h:58, z:8, round:true,
    svg(c) {
      return `<svg width="58" height="58" viewBox="0 0 58 58" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pbgrd" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#F4F4F4"/>
            <stop offset="100%" stop-color="#BEBEBE"/>
          </radialGradient>
        </defs>
        <circle cx="29" cy="29" r="27" fill="#C8C8C8" stroke="#999" stroke-width="2"/>
        <circle cx="29" cy="29" r="20" fill="url(#pbgrd)" stroke="#AAAAAA" stroke-width="1.5"/>
        <path d="M 29,16 L 29,29" stroke="#444" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 20.5,20 A 13,13 0 1,0 37.5,20" fill="none" stroke="#444" stroke-width="3" stroke-linecap="round"/>
        <circle cx="29" cy="37" r="2" fill="#666" opacity="0.45"/>
      </svg>`;
    }
  },

  // ── Side brush ──────────────────────────────────────────────────────────────
  // Front-left of body. z=2 → behind body (z=3), so body covers the small
  // overlap; only the arms that extend beyond the body edge are visible.
  sideBrush: {
    label:'Side Brush', snapX:0.345, snapY:0.533, w:66, h:66, z:2, round:true,
    svg(c) {
      const arms = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        const mx = 33 + Math.cos(a) * 12;
        const my = 33 + Math.sin(a) * 12;
        const x2 = 33 + Math.cos(a) * 30;
        const y2 = 33 + Math.sin(a) * 30;
        arms.push(`<line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c.accent}" stroke-width="8" stroke-linecap="round"/>`);
      }
      return `<svg width="66" height="66" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
        ${arms.join('')}
        <circle cx="33" cy="33" r="11" fill="${c.accent2}" stroke="${c.accent}" stroke-width="2"/>
        <circle cx="33" cy="33" r="4.5" fill="${c.light}" opacity="0.7"/>
      </svg>`;
    }
  },

  // ── Dirt bin door ───────────────────────────────────────────────────────────
  // Rear panel on body disc.
  dirtBin: {
    label:'Dirt Bin', snapX:0.500, snapY:0.568, w:114, h:40, z:4,
    svg(c) {
      return `<svg width="114" height="40" viewBox="0 0 114 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="110" height="36" rx="7" fill="${c.dark}" stroke="${c.dark}" stroke-width="2"/>
        <rect x="7" y="7" width="100" height="26" rx="5" fill="${c.body}"/>
        <rect x="14" y="14" width="86" height="2.5" rx="1.2" fill="${c.light}" opacity="0.5"/>
        <rect x="14" y="20" width="86" height="2.5" rx="1.2" fill="${c.light}" opacity="0.5"/>
        <rect x="48" y="27" width="18" height="7" rx="3.5" fill="${c.bump}" stroke="${c.light}" stroke-width="1" opacity="0.8"/>
        <circle cx="96" cy="14" r="3" fill="${c.accent}" opacity="0.75"/>
      </svg>`;
    }
  },

  // ── Charging contacts ───────────────────────────────────────────────────────
  // Two gold metal strips at rear underside.
  chargingContacts: {
    label:'Charging Pins', snapX:0.500, snapY:0.628, w:96, h:28, z:4,
    svg(c) {
      return `<svg width="96" height="28" viewBox="0 0 96 28" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ccgrd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#E8C060"/>
            <stop offset="100%" stop-color="#B0881E"/>
          </linearGradient>
        </defs>
        <rect x="2"  y="5" width="38" height="18" rx="4" fill="url(#ccgrd)" stroke="#907010" stroke-width="1.5"/>
        <rect x="7"  y="9" width="28" height="10" rx="2" fill="#F0D070" opacity="0.5"/>
        <rect x="56" y="5" width="38" height="18" rx="4" fill="url(#ccgrd)" stroke="#907010" stroke-width="1.5"/>
        <rect x="61" y="9" width="28" height="10" rx="2" fill="#F0D070" opacity="0.5"/>
      </svg>`;
    }
  },

  // ── Top sensor dome ─────────────────────────────────────────────────────────
  // Dome/tower near front-center of body. z=9 (highest) → always on top.
  // Sensor "eyes" glow on completion — selected via class="sensor-eye".
  topSensor: {
    label:'Top Sensor', snapX:0.500, snapY:0.385, w:48, h:48, z:9, round:true,
    svg(c) {
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="${c.dark}" stroke="${c.body}" stroke-width="2"/>
        <circle cx="24" cy="24" r="14" fill="${c.body}" stroke="${c.light}" stroke-width="1" opacity="0.6"/>
        <circle cx="24" cy="24" r="7"  fill="${c.bump}" stroke="${c.light}" stroke-width="1" opacity="0.5"/>
        <circle class="sensor-eye" cx="17" cy="20" r="4" fill="#222"/>
        <circle class="sensor-eye" cx="31" cy="20" r="4" fill="#222"/>
        <circle cx="20" cy="17" r="1.5" fill="${c.light}" opacity="0.55"/>
      </svg>`;
    }
  },

  // ── Main brush roll ─────────────────────────────────────────────────────────
  // Horizontal roller in centre-lower body. Blue/grey bristle stripes are
  // always the same colour — they're functional, not cosmetic.
  brushRoll: {
    label:'Brush Roll', snapX:0.500, snapY:0.512, w:136, h:34, z:4,
    svg(c) {
      const cols = ['#5B8CCC','#888','#5B8CCC','#888','#5B8CCC','#888','#5B8CCC',
                    '#888','#5B8CCC','#888','#5B8CCC','#888','#5B8CCC'];
      const stripes = cols.map((col,i) =>
        `<rect x="${3+i*10}" y="5" width="8" height="24" rx="2" fill="${col}" opacity="0.9"/>`
      ).join('');
      return `<svg width="136" height="34" viewBox="0 0 136 34" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="134" height="32" rx="6" fill="${c.dark}" stroke="${c.dark}" stroke-width="2"/>
        ${stripes}
        <rect x="1"   y="1" width="5" height="32" rx="3" fill="${c.body}"/>
        <rect x="130" y="1" width="5" height="32" rx="3" fill="${c.body}"/>
      </svg>`;
    }
  },

  // ── IR sensor array ─────────────────────────────────────────────────────────
  // Three sensors on the outer bumper face.
  // snapY=0.290: sits on the arc of the bumper (bumper center ≈ snapY 0.318).
  irSensors: {
    label:'IR Sensors', snapX:0.500, snapY:0.290, w:96, h:28, z:7,
    svg(c) {
      return `<svg width="96" height="28" viewBox="0 0 96 28" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="6" width="94" height="16" rx="8" fill="${c.bump}" opacity="0.55"/>
        <circle cx="16" cy="14" r="10" fill="${c.body}" stroke="${c.light}" stroke-width="1.5"/>
        <circle cx="16" cy="14" r="6"  fill="${c.dark}"/>
        <circle cx="14" cy="12" r="3"  fill="#FF2222" opacity="0.85"/>
        <circle cx="48" cy="14" r="10" fill="${c.body}" stroke="${c.light}" stroke-width="1.5"/>
        <circle cx="48" cy="14" r="6"  fill="${c.dark}"/>
        <circle cx="46" cy="12" r="3"  fill="#FF2222" opacity="0.85"/>
        <circle cx="80" cy="14" r="10" fill="${c.body}" stroke="${c.light}" stroke-width="1.5"/>
        <circle cx="80" cy="14" r="6"  fill="${c.dark}"/>
        <circle cx="78" cy="12" r="3"  fill="#FF2222" opacity="0.85"/>
      </svg>`;
    }
  },

  // ── Cliff sensors ───────────────────────────────────────────────────────────
  // Two small sensors at the very rear underside edge.
  cliffSensors: {
    label:'Cliff Sensors', snapX:0.500, snapY:0.672, w:86, h:26, z:4,
    svg(c) {
      return `<svg width="86" height="26" viewBox="0 0 86 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="21" cy="13" r="11" fill="${c.bump}" stroke="${c.dark}" stroke-width="1.5"/>
        <circle cx="21" cy="13" r="7"  fill="${c.body}"/>
        <circle cx="19" cy="11" r="3"  fill="${c.light}" opacity="0.6"/>
        <circle cx="65" cy="13" r="11" fill="${c.bump}" stroke="${c.dark}" stroke-width="1.5"/>
        <circle cx="65" cy="13" r="7"  fill="${c.body}"/>
        <circle cx="63" cy="11" r="3"  fill="${c.light}" opacity="0.6"/>
      </svg>`;
    }
  },

  // ── Wi-Fi / status indicator ────────────────────────────────────────────────
  // Small LED panel on upper-right surface. Uses per-level accent colour.
  wifiLight: {
    label:'Wi-Fi Light', snapX:0.600, snapY:0.403, w:38, h:38, z:8, round:true,
    svg(c) {
      return `<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
        <rect x="2"  y="2"  width="34" height="34" rx="9"  fill="${c.dark}"    stroke="${c.dark}" stroke-width="1.5"/>
        <rect x="6"  y="6"  width="26" height="26" rx="7"  fill="${c.wifiCol}"/>
        <path d="M 8,22  Q 19,11 30,22" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.95"/>
        <path d="M 12,26 Q 19,17 26,26" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.95"/>
        <circle cx="19" cy="30" r="2.5" fill="#fff"/>
        <circle cx="10" cy="10" r="2"   fill="#fff" opacity="0.22"/>
      </svg>`;
    }
  },

  // ── Filter vent ─────────────────────────────────────────────────────────────
  // Grille panel on right side of body.
  filterVent: {
    label:'Filter Vent', snapX:0.605, snapY:0.507, w:62, h:52, z:5,
    svg(c) {
      const lines = Array.from({length:5},(_,i) =>
        `<line x1="10" y1="${12+i*8}" x2="52" y2="${12+i*8}" stroke="${c.light}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`
      ).join('');
      return `<svg width="62" height="52" viewBox="0 0 62 52" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="58" height="48" rx="9" fill="${c.bump}" stroke="${c.dark}" stroke-width="2"/>
        <rect x="6" y="6" width="50" height="40" rx="7" fill="${c.body}"/>
        ${lines}
        <circle cx="10" cy="6"  r="2" fill="${c.bump}"/>
        <circle cx="52" cy="6"  r="2" fill="${c.bump}"/>
        <circle cx="10" cy="46" r="2" fill="${c.bump}"/>
        <circle cx="52" cy="46" r="2" fill="${c.bump}"/>
      </svg>`;
    }
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Level definitions
// ══════════════════════════════════════════════════════════════════════════════
const LEVELS = [
  { id:1, name:'Easy',           parts:['body','bumper','wheelL','wheelR','powerBtn'] },
  { id:2, name:'Getting Harder', parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin'] },
  { id:3, name:'Nice Work!',     parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor'] },
  { id:4, name:'Almost Expert!', parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor','brushRoll','irSensors'] },
  { id:5, name:'Vacuum Expert!', parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor','brushRoll','irSensors','cliffSensors','wifiLight','filterVent'] }
];
