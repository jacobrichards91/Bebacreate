// ══════════════════════════════════════════════════════════════════════════════
// Part definitions
// snapX/Y : 0–1 fraction of puzzle-area width/height (center of snap target)
// w/h     : SVG viewport size in px
// z       : stacking order when snapped (lower = further behind)
// round   : true → circular snap hint
// ══════════════════════════════════════════════════════════════════════════════
const PART_DEFS = {

  body: {
    label: 'Body', snapX: 0.50, snapY: 0.50, w: 180, h: 180, z: 3, round: true,
    svg() {
      return `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bG" cx="40%" cy="35%" r="58%">
            <stop offset="0%"   stop-color="#5A5A5A"/>  <!-- lighter grey in centre (spec) -->
            <stop offset="45%"  stop-color="#3A3A3A"/>  <!-- dark charcoal (spec) -->
            <stop offset="100%" stop-color="#222222"/>  <!-- darker edge -->
          </radialGradient>
        </defs>
        <circle cx="90" cy="90" r="87" fill="url(#bG)" stroke="#111" stroke-width="2"/>
        <circle cx="90" cy="90" r="76" fill="none" stroke="#4A4A4A" stroke-width="1.5" opacity="0.45"/>
        <path d="M 42,54 A 56,56 0 0 1 90,32" fill="none" stroke="#666" stroke-width="2.5" stroke-linecap="round" opacity="0.30"/>
      </svg>`;
    }
  },

  bumper: {
    label: 'Bumper', snapX: 0.50, snapY: 0.335, w: 162, h: 62, z: 6,
    svg() {
      return `<svg width="162" height="62" viewBox="0 0 162 62" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="buG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#606060"/>
            <stop offset="100%" stop-color="#383838"/>
          </linearGradient>
        </defs>
        <!-- D-shaped bumper -->
        <path d="M 8,60 Q 8,4 81,4 Q 154,4 154,60 Z" fill="url(#buG)" stroke="#1A1A1A" stroke-width="2"/>
        <!-- inner arc highlight -->
        <path d="M 22,58 Q 22,16 81,16 Q 140,16 140,58" fill="none" stroke="#707070" stroke-width="1.5" opacity="0.4"/>
        <!-- two small sensor dots on bumper face -->
        <circle cx="55" cy="32" r="4" fill="#2A2A2A" stroke="#555" stroke-width="1"/>
        <circle cx="107" cy="32" r="4" fill="#2A2A2A" stroke="#555" stroke-width="1"/>
      </svg>`;
    }
  },

  wheelL: {
    label: 'Left Wheel', snapX: 0.365, snapY: 0.50, w: 44, h: 84, z: 1,
    svg() {
      return `<svg width="44" height="84" viewBox="0 0 44 84" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="38" height="78" rx="15" fill="#1C1C1C" stroke="#0A0A0A" stroke-width="2"/>
        <!-- tread lines -->
        <rect x="8" y="14" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="26" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="38" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="50" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="62" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <!-- highlight -->
        <path d="M 9,8 L 9,76" stroke="#444" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
      </svg>`;
    }
  },

  wheelR: {
    label: 'Right Wheel', snapX: 0.635, snapY: 0.50, w: 44, h: 84, z: 1,
    svg() {
      return `<svg width="44" height="84" viewBox="0 0 44 84" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="38" height="78" rx="15" fill="#1C1C1C" stroke="#0A0A0A" stroke-width="2"/>
        <rect x="8" y="14" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="26" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="38" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="50" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <rect x="8" y="62" width="28" height="5" rx="2.5" fill="#333" opacity="0.7"/>
        <path d="M 35,8 L 35,76" stroke="#444" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
      </svg>`;
    }
  },

  powerBtn: {
    label: 'Power Button', snapX: 0.50, snapY: 0.46, w: 58, h: 58, z: 8, round: true,
    svg() {
      return `<svg width="58" height="58" viewBox="0 0 58 58" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pbG" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#F0F0F0"/>
            <stop offset="100%" stop-color="#C0C0C0"/>
          </radialGradient>
        </defs>
        <circle cx="29" cy="29" r="27" fill="#CCCCCC" stroke="#999" stroke-width="2"/>
        <circle cx="29" cy="29" r="20" fill="url(#pbG)" stroke="#BBB" stroke-width="1.5"/>
        <!-- power icon -->
        <path d="M 29,16 L 29,29" stroke="#444" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 20.5,20 A 13,13 0 1,0 37.5,20" fill="none" stroke="#444" stroke-width="3" stroke-linecap="round"/>
        <!-- center dot -->
        <circle cx="29" cy="37" r="2" fill="#555" opacity="0.4"/>
      </svg>`;
    }
  },

  sideBrush: {
    label: 'Side Brush', snapX: 0.295, snapY: 0.660, w: 66, h: 66, z: 4, round: true,
    svg() {
      // 5-arm asterisk as per spec ("5-pointed star/asterisk shape")
      const arms = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;  // 360/5 = 72° apart, start at top
        const mx = 33 + Math.cos(a) * 13;
        const my = 33 + Math.sin(a) * 13;
        const x2 = 33 + Math.cos(a) * 30;
        const y2 = 33 + Math.sin(a) * 30;
        arms.push(`<line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#E85D04" stroke-width="8" stroke-linecap="round"/>`);
      }
      return `<svg width="66" height="66" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
        ${arms.join('')}
        <circle cx="33" cy="33" r="12" fill="#FF9500" stroke="#CC5500" stroke-width="2"/>
        <circle cx="33" cy="33" r="5"  fill="#FFB84D" opacity="0.8"/>
      </svg>`;
    }
  },

  dirtBin: {
    label: 'Dirt Bin', snapX: 0.50, snapY: 0.695, w: 114, h: 40, z: 5,
    svg() {
      return `<svg width="114" height="40" viewBox="0 0 114 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="110" height="36" rx="7" fill="#252525" stroke="#111" stroke-width="2"/>
        <rect x="7" y="7" width="100" height="26" rx="5" fill="#303030"/>
        <!-- grip lines -->
        <rect x="14" y="14" width="86" height="2.5" rx="1.2" fill="#484848"/>
        <rect x="14" y="20" width="86" height="2.5" rx="1.2" fill="#484848"/>
        <!-- latch button -->
        <rect x="48" y="27" width="18" height="7" rx="3.5" fill="#404040" stroke="#555" stroke-width="1"/>
        <!-- small indicator light -->
        <circle cx="96" cy="14" r="3" fill="#E85D04" opacity="0.7"/>
      </svg>`;
    }
  },

  chargingContacts: {
    label: 'Charging Pins', snapX: 0.50, snapY: 0.775, w: 96, h: 28, z: 6,
    svg() {
      return `<svg width="96" height="28" viewBox="0 0 96 28" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ccG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#E8C060"/>
            <stop offset="100%" stop-color="#B8902A"/>
          </linearGradient>
        </defs>
        <!-- left contact -->
        <rect x="3"  y="5" width="37" height="18" rx="4" fill="url(#ccG)" stroke="#9A7020" stroke-width="1.5"/>
        <rect x="8"  y="9" width="27" height="10" rx="2" fill="#F0D070" opacity="0.55"/>
        <!-- right contact -->
        <rect x="56" y="5" width="37" height="18" rx="4" fill="url(#ccG)" stroke="#9A7020" stroke-width="1.5"/>
        <rect x="61" y="9" width="27" height="10" rx="2" fill="#F0D070" opacity="0.55"/>
        <!-- gap marker -->
        <line x1="48" y1="8" x2="48" y2="20" stroke="#C0B090" stroke-width="1" opacity="0.5"/>
      </svg>`;
    }
  },

  topSensor: {
    label: 'Top Sensor', snapX: 0.50, snapY: 0.375, w: 48, h: 48, z: 9, round: true,
    svg() {
      return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#0E0E0E" stroke="#333" stroke-width="2"/>
        <circle cx="24" cy="24" r="14" fill="#181818" stroke="#444" stroke-width="1"/>
        <circle cx="24" cy="24" r="7"  fill="#1E1E1E" stroke="#505050" stroke-width="1"/>
        <!-- "eyes" — glowed by JS on completion -->
        <circle class="sensor-eye" cx="17" cy="20" r="4" fill="#2A2A2A"/>
        <circle class="sensor-eye" cx="31" cy="20" r="4" fill="#2A2A2A"/>
        <!-- small reflection glint -->
        <circle cx="20" cy="17" r="1.5" fill="#555" opacity="0.6"/>
      </svg>`;
    }
  },

  brushRoll: {
    label: 'Brush Roll', snapX: 0.50, snapY: 0.575, w: 136, h: 34, z: 4,
    svg() {
      const blues = '#5B8CCC', grays = '#888888';
      const stripes = [];
      for (let i = 0; i < 13; i++) {
        stripes.push(`<rect x="${3 + i * 10}" y="5" width="8" height="24" rx="2" fill="${i % 2 === 0 ? blues : grays}" opacity="0.88"/>`);
      }
      return `<svg width="136" height="34" viewBox="0 0 136 34" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="134" height="32" rx="6" fill="#242424" stroke="#111" stroke-width="2"/>
        ${stripes.join('')}
        <!-- end caps -->
        <rect x="1"   y="1" width="5" height="32" rx="3" fill="#1A1A1A"/>
        <rect x="130" y="1" width="5" height="32" rx="3" fill="#1A1A1A"/>
      </svg>`;
    }
  },

  irSensors: {
    label: 'IR Sensors', snapX: 0.50, snapY: 0.290, w: 96, h: 28, z: 7,
    svg() {
      return `<svg width="96" height="28" viewBox="0 0 96 28" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="6" width="94" height="16" rx="8" fill="#2A2A2A" opacity="0.5"/>
        <!-- left sensor -->
        <circle cx="16" cy="14" r="10" fill="#383838" stroke="#555" stroke-width="1.5"/>
        <circle cx="16" cy="14" r="6"  fill="#222"/>
        <circle cx="14" cy="12" r="3"  fill="#FF3333" opacity="0.8"/>
        <!-- center sensor -->
        <circle cx="48" cy="14" r="10" fill="#383838" stroke="#555" stroke-width="1.5"/>
        <circle cx="48" cy="14" r="6"  fill="#222"/>
        <circle cx="46" cy="12" r="3"  fill="#FF3333" opacity="0.8"/>
        <!-- right sensor -->
        <circle cx="80" cy="14" r="10" fill="#383838" stroke="#555" stroke-width="1.5"/>
        <circle cx="80" cy="14" r="6"  fill="#222"/>
        <circle cx="78" cy="12" r="3"  fill="#FF3333" opacity="0.8"/>
      </svg>`;
    }
  },

  cliffSensors: {
    label: 'Cliff Sensors', snapX: 0.50, snapY: 0.845, w: 86, h: 26, z: 6,
    svg() {
      return `<svg width="86" height="26" viewBox="0 0 86 26" xmlns="http://www.w3.org/2000/svg">
        <!-- left -->
        <circle cx="21" cy="13" r="11" fill="#484848" stroke="#303030" stroke-width="1.5"/>
        <circle cx="21" cy="13" r="7"  fill="#333"/>
        <circle cx="19" cy="11" r="3"  fill="#666"/>
        <!-- right -->
        <circle cx="65" cy="13" r="11" fill="#484848" stroke="#303030" stroke-width="1.5"/>
        <circle cx="65" cy="13" r="7"  fill="#333"/>
        <circle cx="63" cy="11" r="3"  fill="#666"/>
      </svg>`;
    }
  },

  wifiLight: {
    label: 'Wi-Fi Light', snapX: 0.635, snapY: 0.43, w: 38, h: 38, z: 9, round: true,
    svg() {
      return `<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
        <rect x="2"  y="2"  width="34" height="34" rx="9"  fill="#005577" stroke="#003A55" stroke-width="1.5"/>
        <rect x="6"  y="6"  width="26" height="26" rx="7"  fill="#00B4D8"/>
        <!-- wifi arcs -->
        <path d="M 8,22  Q 19,11 30,22" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.95"/>
        <path d="M 12,26 Q 19,17 26,26" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.95"/>
        <circle cx="19" cy="30" r="2.5" fill="#fff"/>
        <!-- top-left shine -->
        <circle cx="10" cy="10" r="2"   fill="#fff" opacity="0.25"/>
      </svg>`;
    }
  },

  filterVent: {
    label: 'Filter Vent', snapX: 0.715, snapY: 0.525, w: 62, h: 52, z: 5,
    svg() {
      const lines = [];
      for (let i = 0; i < 5; i++) {
        lines.push(`<line x1="10" y1="${12 + i * 8}" x2="52" y2="${12 + i * 8}" stroke="#606060" stroke-width="3" stroke-linecap="round"/>`);
      }
      return `<svg width="62" height="52" viewBox="0 0 62 52" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="58" height="48" rx="9" fill="#282828" stroke="#111" stroke-width="2"/>
        <rect x="6" y="6" width="50" height="40" rx="7" fill="#2E2E2E"/>
        ${lines.join('')}
        <!-- small rivets -->
        <circle cx="10" cy="6"  r="2" fill="#3A3A3A"/>
        <circle cx="52" cy="6"  r="2" fill="#3A3A3A"/>
        <circle cx="10" cy="46" r="2" fill="#3A3A3A"/>
        <circle cx="52" cy="46" r="2" fill="#3A3A3A"/>
      </svg>`;
    }
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Level definitions (cumulative parts each level)
// ══════════════════════════════════════════════════════════════════════════════
const LEVELS = [
  { id: 1, name: 'Easy',           parts: ['body','bumper','wheelL','wheelR','powerBtn'] },
  { id: 2, name: 'Getting Harder', parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin'] },
  { id: 3, name: 'Nice Work!',     parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor'] },
  { id: 4, name: 'Almost Expert!', parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor','brushRoll','irSensors'] },
  { id: 5, name: 'Vacuum Expert!', parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor','brushRoll','irSensors','cliffSensors','wifiLight','filterVent'] }
];
