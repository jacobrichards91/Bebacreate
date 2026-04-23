// ── Part definitions ──────────────────────────────────────────────────────────
// snapX/Y: 0–1 fraction of puzzle-area width/height
// w/h: SVG viewport size in px
// z: stacking order when snapped (lower = behind)
const PART_DEFS = {
  body: {
    label: 'Body', snapX: 0.50, snapY: 0.50, w: 180, h: 180, z: 1,
    svg() {
      return `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bodyGrad" cx="42%" cy="38%" r="55%">
            <stop offset="0%" stop-color="#5A5A5A"/>
            <stop offset="100%" stop-color="#2A2A2A"/>
          </radialGradient>
        </defs>
        <circle cx="90" cy="90" r="86" fill="url(#bodyGrad)" stroke="#1A1A1A" stroke-width="2"/>
        <circle cx="90" cy="90" r="78" fill="none" stroke="#444" stroke-width="1" opacity="0.5"/>
        <circle cx="72" cy="72" r="22" fill="none" stroke="#555" stroke-width="1" opacity="0.3"/>
      </svg>`;
    }
  },

  bumper: {
    label: 'Bumper', snapX: 0.50, snapY: 0.275, w: 160, h: 60, z: 3,
    svg() {
      return `<svg width="160" height="60" viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bumperGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5C5C5C"/>
            <stop offset="100%" stop-color="#383838"/>
          </linearGradient>
        </defs>
        <path d="M10,58 Q10,4 80,4 Q150,4 150,58 Z" fill="url(#bumperGrad)" stroke="#222" stroke-width="2"/>
        <path d="M22,56 Q22,14 80,14 Q138,14 138,56" fill="none" stroke="#666" stroke-width="1.5" opacity="0.4"/>
      </svg>`;
    }
  },

  wheelL: {
    label: 'Left Wheel', snapX: 0.235, snapY: 0.52, w: 44, h: 80, z: 2,
    svg() {
      return `<svg width="44" height="80" viewBox="0 0 44 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="36" height="72" rx="14" ry="14" fill="#1E1E1E" stroke="#111" stroke-width="2"/>
        <rect x="10" y="16" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
        <rect x="10" y="30" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
        <rect x="10" y="44" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
        <rect x="10" y="58" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
      </svg>`;
    }
  },

  wheelR: {
    label: 'Right Wheel', snapX: 0.765, snapY: 0.52, w: 44, h: 80, z: 2,
    svg() {
      return `<svg width="44" height="80" viewBox="0 0 44 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="36" height="72" rx="14" ry="14" fill="#1E1E1E" stroke="#111" stroke-width="2"/>
        <rect x="10" y="16" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
        <rect x="10" y="30" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
        <rect x="10" y="44" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
        <rect x="10" y="58" width="24" height="6" rx="3" fill="#333" opacity="0.6"/>
      </svg>`;
    }
  },

  powerBtn: {
    label: 'Power Button', snapX: 0.50, snapY: 0.42, w: 52, h: 52, z: 8,
    svg() {
      return `<svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
        <circle cx="26" cy="26" r="24" fill="#D8D8D8" stroke="#AAA" stroke-width="2"/>
        <circle cx="26" cy="26" r="17" fill="#E8E8E8" stroke="#BBB" stroke-width="1.5"/>
        <path d="M26,14 L26,26" stroke="#555" stroke-width="3" stroke-linecap="round"/>
        <path d="M19,17.5 A12,12 0 1,0 33,17.5" fill="none" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    }
  },

  sideBrush: {
    label: 'Side Brush', snapX: 0.275, snapY: 0.695, w: 60, h: 60, z: 4,
    svg() {
      // 6-arm asterisk
      const arms = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60) * Math.PI / 180;
        const x2 = 30 + Math.cos(a) * 26;
        const y2 = 30 + Math.sin(a) * 26;
        arms.push(`<line x1="30" y1="30" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#E85D04" stroke-width="7" stroke-linecap="round"/>`);
      }
      return `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        ${arms.join('')}
        <circle cx="30" cy="30" r="8" fill="#FF8C00" stroke="#C84D00" stroke-width="1.5"/>
      </svg>`;
    }
  },

  dirtBin: {
    label: 'Dirt Bin Door', snapX: 0.50, snapY: 0.735, w: 110, h: 38, z: 5,
    svg() {
      return `<svg width="110" height="38" viewBox="0 0 110 38" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="104" height="32" rx="6" fill="#2E2E2E" stroke="#1A1A1A" stroke-width="2"/>
        <rect x="8" y="8" width="94" height="22" rx="4" fill="#383838"/>
        <rect x="14" y="13" width="82" height="3" rx="1.5" fill="#444" opacity="0.7"/>
        <rect x="14" y="19" width="82" height="3" rx="1.5" fill="#444" opacity="0.7"/>
        <circle cx="55" cy="19" r="5" fill="#555" stroke="#3A3A3A" stroke-width="1"/>
      </svg>`;
    }
  },

  chargingContacts: {
    label: 'Charging Pins', snapX: 0.50, snapY: 0.795, w: 90, h: 26, z: 6,
    svg() {
      return `<svg width="90" height="26" viewBox="0 0 90 26" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="5" width="34" height="16" rx="3" fill="#C8A84B" stroke="#9A7C2A" stroke-width="1.5"/>
        <rect x="8" y="9" width="26" height="8" rx="2" fill="#E0C060" opacity="0.6"/>
        <rect x="52" y="5" width="34" height="16" rx="3" fill="#C8A84B" stroke="#9A7C2A" stroke-width="1.5"/>
        <rect x="56" y="9" width="26" height="8" rx="2" fill="#E0C060" opacity="0.6"/>
      </svg>`;
    }
  },

  topSensor: {
    label: 'Top Sensor', snapX: 0.50, snapY: 0.355, w: 44, h: 44, z: 9,
    svg() {
      return `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="20" fill="#111" stroke="#333" stroke-width="2"/>
        <circle cx="22" cy="22" r="13" fill="#1A1A1A" stroke="#444" stroke-width="1"/>
        <circle cx="22" cy="22" r="6" fill="#222" stroke="#555" stroke-width="1"/>
        <circle id="sensor-eye-l" cx="16" cy="18" r="3.5" fill="#333"/>
        <circle id="sensor-eye-r" cx="28" cy="18" r="3.5" fill="#333"/>
      </svg>`;
    }
  },

  brushRoll: {
    label: 'Brush Roll', snapX: 0.50, snapY: 0.60, w: 130, h: 32, z: 4,
    svg() {
      const stripes = [];
      const colors = ['#5B8CCC','#888','#5B8CCC','#888','#5B8CCC','#888','#5B8CCC','#888','#5B8CCC','#888','#5B8CCC','#888'];
      for (let i = 0; i < 12; i++) {
        stripes.push(`<rect x="${4 + i * 10}" y="6" width="8" height="20" rx="2" fill="${colors[i]}" opacity="0.85"/>`);
      }
      return `<svg width="130" height="32" viewBox="0 0 130 32" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="126" height="28" rx="5" fill="#2C2C2C" stroke="#1A1A1A" stroke-width="2"/>
        ${stripes.join('')}
      </svg>`;
    }
  },

  irSensors: {
    label: 'IR Sensors', snapX: 0.50, snapY: 0.215, w: 90, h: 26, z: 7,
    svg() {
      return `<svg width="90" height="26" viewBox="0 0 90 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="13" r="9" fill="#3A3A3A" stroke="#555" stroke-width="1.5"/>
        <circle cx="18" cy="13" r="5" fill="#222"/>
        <circle cx="45" cy="13" r="9" fill="#3A3A3A" stroke="#555" stroke-width="1.5"/>
        <circle cx="45" cy="13" r="5" fill="#222"/>
        <circle cx="72" cy="13" r="9" fill="#3A3A3A" stroke="#555" stroke-width="1.5"/>
        <circle cx="72" cy="13" r="5" fill="#222"/>
        <circle cx="18" cy="11" r="2.5" fill="#FF4444" opacity="0.7"/>
        <circle cx="45" cy="11" r="2.5" fill="#FF4444" opacity="0.7"/>
        <circle cx="72" cy="11" r="2.5" fill="#FF4444" opacity="0.7"/>
      </svg>`;
    }
  },

  cliffSensors: {
    label: 'Cliff Sensors', snapX: 0.50, snapY: 0.855, w: 80, h: 24, z: 6,
    svg() {
      return `<svg width="80" height="24" viewBox="0 0 80 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="12" r="10" fill="#484848" stroke="#333" stroke-width="1.5"/>
        <circle cx="20" cy="12" r="6"  fill="#333"/>
        <circle cx="20" cy="10" r="2.5" fill="#666"/>
        <circle cx="60" cy="12" r="10" fill="#484848" stroke="#333" stroke-width="1.5"/>
        <circle cx="60" cy="12" r="6"  fill="#333"/>
        <circle cx="60" cy="10" r="2.5" fill="#666"/>
      </svg>`;
    }
  },

  wifiLight: {
    label: 'Wi-Fi Light', snapX: 0.635, snapY: 0.415, w: 34, h: 34, z: 9,
    svg() {
      return `<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="28" height="28" rx="7" fill="#006994" stroke="#004E6E" stroke-width="1.5"/>
        <rect x="7" y="7" width="20" height="20" rx="5" fill="#00B4D8"/>
        <path d="M10,18 Q17,11 24,18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
        <path d="M13,21 Q17,15 21,21" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
        <circle cx="17" cy="24" r="2" fill="#fff"/>
      </svg>`;
    }
  },

  filterVent: {
    label: 'Filter Vent', snapX: 0.72, snapY: 0.525, w: 60, h: 50, z: 5,
    svg() {
      const lines = [];
      for (let i = 0; i < 5; i++) {
        lines.push(`<line x1="10" y1="${12 + i * 7}" x2="50" y2="${12 + i * 7}" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>`);
      }
      return `<svg width="60" height="50" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="54" height="44" rx="7" fill="#2E2E2E" stroke="#1A1A1A" stroke-width="2"/>
        ${lines.join('')}
      </svg>`;
    }
  }
};

// ── Level definitions ─────────────────────────────────────────────────────────
const LEVELS = [
  { id: 1, name: 'Easy',            parts: ['body','bumper','wheelL','wheelR','powerBtn'] },
  { id: 2, name: 'Getting Harder',  parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin'] },
  { id: 3, name: 'Nice Work!',      parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor'] },
  { id: 4, name: 'Almost Expert!',  parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor','brushRoll','irSensors'] },
  { id: 5, name: 'Vacuum Expert!',  parts: ['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','chargingContacts','topSensor','brushRoll','irSensors','cliffSensors','wifiLight','filterVent'] }
];
