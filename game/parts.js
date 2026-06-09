// ══════════════════════════════════════════════════════════════════════════════
// ROBOT VACUUM — realistic underside ("service bay") view
//
// The robot is drawn belly-up, front pointing to the top of the screen —
// the view you get when you flip a real robot vacuum over. Every part sits
// where it genuinely lives on a real machine:
//
//            ┌── bumper band + brand label (front lip)
//            │     caster wheel, flanked by gold charging pads
//            │     floor-sensor window strip
//   side ────┤     battery door + power button (dead centre)
//   brush    │     drive wheels in wells, left & right     ├── cliff sensors
//            │     brush roll in its suction window
//            └── dust bin curving along the rear rim, filter grille on it
//
// Because the charging pads face the front, docked robots meet the charging
// station at the top of the play area nose-first — like the real thing.
// ══════════════════════════════════════════════════════════════════════════════

// ── Level palettes — real product finishes ────────────────────────────────────
// shell    main molded plastic        well    recessed bays (near-black)
// shellLt  highlight sheen            panel   secondary panel tone
// shellDk  shadow tone                rubber  tires / roller body
// trim     seam lines                 accent  side brush, latch, roller fins
// glass    smoked sensor windows      glow    status / LED tint
const LEVEL_COLORS = [
  // 1 — Graphite (classic Roomba black)
  { shell:'#33353A', shellLt:'#52555C', shellDk:'#1B1C20', well:'#101114', panel:'#2A2C30',
    trim:'#0C0D0F', rubber:'#1A1B1E', rubberLt:'#3A3C42', accent:'#B5CC2E', accent2:'#8FA51E', glass:'#15181D', glow:'#37C871' },
  // 2 — Arctic (Roborock pearl white)
  { shell:'#D9DCE0', shellLt:'#F2F4F6', shellDk:'#ABB0B8', well:'#23262B', panel:'#C4C8CE',
    trim:'#878D96', rubber:'#26282C', rubberLt:'#4A4D54', accent:'#00B8C8', accent2:'#0090A0', glass:'#1A1D22', glow:'#00C8E8' },
  // 3 — Ocean Navy
  { shell:'#24395A', shellLt:'#3D5A85', shellDk:'#15233A', well:'#0C1320', panel:'#1E3050',
    trim:'#0A1018', rubber:'#171C26', rubberLt:'#35405A', accent:'#2EC5E8', accent2:'#1898B8', glass:'#0E1620', glow:'#40D8FF' },
  // 4 — Forest
  { shell:'#2A4630', shellLt:'#44684C', shellDk:'#182B1D', well:'#0D1810', panel:'#223A28',
    trim:'#0B130D', rubber:'#161E18', rubberLt:'#34453A', accent:'#7ED957', accent2:'#56B232', glass:'#0F1A12', glow:'#80FF80' },
  // 5 — Crimson
  { shell:'#5A2228', shellLt:'#83383F', shellDk:'#3A1216', well:'#1E0A0C', panel:'#4A1C22',
    trim:'#170709', rubber:'#221214', rubberLt:'#46282C', accent:'#FF8A5E', accent2:'#E8633A', glass:'#1C0E10', glow:'#FF6B6B' },
  // 6 — Aubergine
  { shell:'#3D2A56', shellLt:'#5C4480', shellDk:'#271838', well:'#140C1E', panel:'#332246',
    trim:'#0F0917', rubber:'#1C1424', rubberLt:'#3C3050', accent:'#C77DFF', accent2:'#9C50DC', glass:'#150E1E', glow:'#C890FF' },
  // 7 — Deep Teal
  { shell:'#155052', shellLt:'#287678', shellDk:'#0A3234', well:'#051A1B', panel:'#104244',
    trim:'#031416', rubber:'#0E1E1F', rubberLt:'#2A4648', accent:'#2EE6C8', accent2:'#18B89E', glass:'#081A1B', glow:'#40FFE0' },
  // 8 — Sunset Copper
  { shell:'#5C3A20', shellLt:'#855A34', shellDk:'#3B2412', well:'#1E1108', panel:'#4C3019',
    trim:'#170D05', rubber:'#241710', rubberLt:'#483525', accent:'#FFA040', accent2:'#E07E1E', glass:'#1C120A', glow:'#FFB860' },
  // 9 — Slate
  { shell:'#414B58', shellLt:'#626E80', shellDk:'#2A313B', well:'#13171D', panel:'#363F4A',
    trim:'#0E1115', rubber:'#1C2026', rubberLt:'#3C434E', accent:'#6FA8FF', accent2:'#4880DC', glass:'#11151B', glow:'#80B8FF' },
  // 10 — Champion Gold
  { shell:'#332C18', shellLt:'#544A2C', shellDk:'#1F1A0D', well:'#0F0C05', panel:'#2A2414',
    trim:'#0B0904', rubber:'#1A1710', rubberLt:'#3A3424', accent:'#FFD24D', accent2:'#DCA920', glass:'#15110A', glow:'#FFE066' },
];

// ── Geometry helpers ──────────────────────────────────────────────────────────
// Angles in degrees, 0 = straight up (robot front), positive clockwise.
function _pt(cx, cy, r, deg) {
  const a = deg * Math.PI / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}
function _fmt(n) { return (Math.round(n * 10) / 10).toString(); }
// Annular band between two radii, swept from angle a0 to a1.
function arcBandPath(cx, cy, rO, rI, a0, a1) {
  const [ox0, oy0] = _pt(cx, cy, rO, a0), [ox1, oy1] = _pt(cx, cy, rO, a1);
  const [ix0, iy0] = _pt(cx, cy, rI, a0), [ix1, iy1] = _pt(cx, cy, rI, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${_fmt(ox0)},${_fmt(oy0)} A ${rO},${rO} 0 ${large} 1 ${_fmt(ox1)},${_fmt(oy1)} ` +
         `L ${_fmt(ix1)},${_fmt(iy1)} A ${rI},${rI} 0 ${large} 0 ${_fmt(ix0)},${_fmt(iy0)} Z`;
}
// Single arc path (no closing), for seam lines.
function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = _pt(cx, cy, r, a0), [x1, y1] = _pt(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${_fmt(x0)},${_fmt(y0)} A ${r},${r} 0 ${large} 1 ${_fmt(x1)},${_fmt(y1)}`;
}
// Phillips-head screw.
function screw(x, y, r, c) {
  return `<g opacity="0.85">
    <circle cx="${x}" cy="${y}" r="${r}" fill="${c.shellDk}" stroke="${c.trim}" stroke-width="0.8"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="${c.panel}"/>
    <path d="M ${x - r * 0.45},${y} H ${x + r * 0.45} M ${x},${y - r * 0.45} V ${y + r * 0.45}"
          stroke="${c.trim}" stroke-width="1" stroke-linecap="round"/>
  </g>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Part definitions
// bx/by — pixel offset of the part's CENTRE from the puzzle-area centre.
//         Body disc: r=87. Front of the robot = negative y (towards the dock).
// w/h   — SVG size in px.   z — stacking layer (×10).   round — circular hint.
// svg(c, uid) — markup using palette c; uid suffixes gradient ids so every
//               level's gradients stay distinct (inline SVG ids are global!).
// ══════════════════════════════════════════════════════════════════════════════
const PART_DEFS = {

  // ── Chassis (the molded underside shell) ────────────────────────────────────
  body: {
    label:'Body', bx:0, by:0, w:184, h:184, z:3, round:true,
    svg(c, uid) {
      return `<svg width="184" height="184" viewBox="0 0 184 184" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bShell${uid}" cx="38%" cy="32%" r="72%">
            <stop offset="0%"  stop-color="${c.shellLt}"/>
            <stop offset="42%" stop-color="${c.shell}"/>
            <stop offset="88%" stop-color="${c.shellDk}"/>
            <stop offset="100%" stop-color="${c.shellDk}"/>
          </radialGradient>
          <radialGradient id="bFloor${uid}" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stop-color="rgba(30,24,18,0.30)"/>
            <stop offset="100%" stop-color="rgba(30,24,18,0)"/>
          </radialGradient>
        </defs>
        <ellipse cx="92" cy="99" rx="88" ry="83" fill="url(#bFloor${uid})"/>
        <circle cx="92" cy="92" r="87" fill="url(#bShell${uid})" stroke="${c.trim}" stroke-width="1.6"/>
        <path d="${arcPath(92, 92, 85.5, -120, 120)}" fill="none" stroke="${c.shellLt}" stroke-width="1.2" opacity="0.30"/>
        <circle cx="92" cy="92" r="79" fill="none" stroke="${c.shellDk}" stroke-width="2.4" opacity="0.55"/>
        <circle cx="92" cy="92" r="77" fill="none" stroke="${c.shellLt}" stroke-width="0.8" opacity="0.18"/>
        <path d="${arcPath(92, 92, 62, -52, 52)}" fill="none" stroke="${c.trim}" stroke-width="1.1" opacity="0.45"/>
        <path d="${arcPath(92, 92, 62, 124, 236)}" fill="none" stroke="${c.trim}" stroke-width="1.1" opacity="0.40"/>
        <path d="${arcPath(92, 92, 70, -38, 38)}" fill="none" stroke="${c.shellLt}" stroke-width="0.8" opacity="0.14"/>
        ${screw(54, 96, 4, c)}
        ${screw(130, 96, 4, c)}
        ${screw(44, 148, 4, c)}
        ${screw(140, 148, 4, c)}
        ${screw(92, 178, 3.4, c)}
        <path d="${arcPath(92, 92, 44, 150, 210)}" fill="none" stroke="${c.shellLt}" stroke-width="0.9" opacity="0.12"/>
      </svg>`;
    }
  },

  // ── Bumper — sprung band hugging the front rim ──────────────────────────────
  bumper: {
    label:'Bumper', bx:0, by:-62, w:152, h:56, z:6,
    svg(c, uid) {
      // body centre sits at (76, 90) in this svg's space
      const CX = 76, CY = 90;
      return `<svg width="152" height="56" viewBox="0 0 152 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="buFace${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="${c.rubberLt}"/>
            <stop offset="45%" stop-color="${c.rubber}"/>
            <stop offset="100%" stop-color="${c.trim}"/>
          </linearGradient>
        </defs>
        <path d="${arcBandPath(CX, CY, 89, 66, -55, 55)}" fill="url(#buFace${uid})" stroke="${c.trim}" stroke-width="1.4"/>
        <path d="${arcPath(CX, CY, 86.5, -53, 53)}" fill="none" stroke="${c.rubberLt}" stroke-width="1.6" opacity="0.55"/>
        <path d="${arcPath(CX, CY, 68.5, -52, 52)}" fill="none" stroke="#000" stroke-width="1.6" opacity="0.35"/>
        <path d="${arcPath(CX, CY, 78, -50, -34)}" stroke="${c.shellLt}" stroke-width="5" stroke-linecap="round" opacity="0.16" fill="none"/>
        <path d="M ${_pt(CX, CY, 89, -30)[0]},${_pt(CX, CY, 89, -30)[1]} L ${_pt(CX, CY, 66, -30)[0]},${_pt(CX, CY, 66, -30)[1]}" stroke="${c.trim}" stroke-width="1.2" opacity="0.6"/>
        <path d="M ${_pt(CX, CY, 89, 30)[0]},${_pt(CX, CY, 89, 30)[1]} L ${_pt(CX, CY, 66, 30)[0]},${_pt(CX, CY, 66, 30)[1]}" stroke="${c.trim}" stroke-width="1.2" opacity="0.6"/>
        <path d="${arcBandPath(CX, CY, 87, 82, -49, -41)}" fill="${c.rubberLt}" opacity="0.5"/>
        <path d="${arcBandPath(CX, CY, 87, 82, 41, 49)}" fill="${c.rubberLt}" opacity="0.5"/>
      </svg>`;
    }
  },

  // ── Caster wheel — the front swivel ─────────────────────────────────────────
  casterWheel: {
    label:'Caster Wheel', bx:0, by:-44, w:42, h:42, z:5, round:true,
    svg(c, uid) {
      return `<svg width="42" height="42" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="caPl${uid}" cx="40%" cy="34%" r="70%">
            <stop offset="0%" stop-color="${c.shellLt}"/>
            <stop offset="100%" stop-color="${c.shellDk}"/>
          </radialGradient>
          <linearGradient id="caWh${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${c.rubberLt}"/>
            <stop offset="55%" stop-color="${c.rubber}"/>
            <stop offset="100%" stop-color="#000"/>
          </linearGradient>
        </defs>
        <circle cx="21" cy="21" r="20" fill="${c.well}" stroke="${c.trim}" stroke-width="1.3"/>
        <circle cx="21" cy="20" r="19" fill="none" stroke="#000" stroke-width="1.6" opacity="0.4"/>
        <circle cx="21" cy="21" r="15.5" fill="url(#caPl${uid})" stroke="${c.trim}" stroke-width="1"/>
        <rect x="9" y="15.5" width="24" height="11" rx="5.5" fill="url(#caWh${uid})" stroke="${c.trim}" stroke-width="1"/>
        <path d="M 11,21 H 31" stroke="${c.rubberLt}" stroke-width="1.4" opacity="0.5"/>
        <rect x="11" y="17" width="8" height="2.2" rx="1.1" fill="#fff" opacity="0.18"/>
        <circle cx="6.5" cy="21" r="2.2" fill="${c.panel}" stroke="${c.trim}" stroke-width="0.8"/>
        <circle cx="35.5" cy="21" r="2.2" fill="${c.panel}" stroke="${c.trim}" stroke-width="0.8"/>
      </svg>`;
    }
  },

  // ── Charging pads — brushed gold, flanking the caster (they kiss the dock) ──
  chargingContacts: {
    label:'Charging Pads', bx:0, by:-44, w:122, h:28, z:4,
    svg(c, uid) {
      const pad = (px) => `
        <g transform="translate(${px},14)">
          <rect x="-17" y="-10" width="34" height="20" rx="7" fill="${c.well}" opacity="0.9"/>
          <rect x="-15" y="-8" width="30" height="16" rx="6" fill="url(#auPad${uid})" stroke="#8A6A14" stroke-width="1.1"/>
          <rect x="-11" y="-5" width="22" height="3" rx="1.5" fill="#FFE9A0" opacity="0.65"/>
          <rect x="-11" y="2"  width="22" height="2" rx="1"   fill="#A07818" opacity="0.55"/>
        </g>`;
      return `<svg width="122" height="28" viewBox="0 0 122 28" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="auPad${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F0CE6C"/>
            <stop offset="50%" stop-color="#D9AF42"/>
            <stop offset="100%" stop-color="#A8821E"/>
          </linearGradient>
        </defs>
        ${pad(21)}
        ${pad(101)}
      </svg>`;
    }
  },

  // ── Floor sensor strip — smoked window, three IR eyes ───────────────────────
  irSensors: {
    label:'Floor Sensors', bx:0, by:-17, w:88, h:16, z:5,
    svg(c, uid) {
      return `<svg width="88" height="16" viewBox="0 0 88 16" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="irGl${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2A3138"/>
            <stop offset="30%" stop-color="${c.glass}"/>
            <stop offset="100%" stop-color="#000"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="86" height="14" rx="7" fill="${c.well}"/>
        <rect x="2.2" y="2.2" width="83.6" height="11.6" rx="5.8" fill="url(#irGl${uid})" stroke="${c.trim}" stroke-width="0.8"/>
        <rect x="8" y="3.6" width="34" height="2" rx="1" fill="#fff" opacity="0.10"/>
        <circle class="sensor-eye" cx="24" cy="8" r="3" fill="#4A1014"/>
        <circle class="sensor-eye" cx="44" cy="8" r="3" fill="#4A1014"/>
        <circle class="sensor-eye" cx="64" cy="8" r="3" fill="#4A1014"/>
        <circle cx="23" cy="7" r="1" fill="#FF5A4A" opacity="0.85"/>
        <circle cx="43" cy="7" r="1" fill="#FF5A4A" opacity="0.85"/>
        <circle cx="63" cy="7" r="1" fill="#FF5A4A" opacity="0.85"/>
      </svg>`;
    }
  },

  // ── Power button on the battery door — dead centre ──────────────────────────
  powerBtn: {
    label:'Power Button', bx:0, by:12, w:44, h:44, z:8, round:true,
    svg(c, uid) {
      return `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pwDome${uid}" cx="38%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#FAFBFC"/>
            <stop offset="55%" stop-color="#D8DBDF"/>
            <stop offset="100%" stop-color="#A9ADB4"/>
          </radialGradient>
          <linearGradient id="pwRing${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#E8EAED"/>
            <stop offset="50%" stop-color="#9CA1A8"/>
            <stop offset="100%" stop-color="#DDE0E4"/>
          </linearGradient>
        </defs>
        <circle cx="22" cy="22" r="21" fill="${c.panel}" stroke="${c.trim}" stroke-width="1.2"/>
        <circle cx="22" cy="22" r="18.5" fill="none" stroke="${c.shellDk}" stroke-width="1.4" opacity="0.7"/>
        ${screw(8, 8, 2.4, c)}
        ${screw(36, 36, 2.4, c)}
        <circle cx="22" cy="22" r="14.5" fill="url(#pwRing${uid})" stroke="#787D84" stroke-width="0.9"/>
        <circle cx="22" cy="22" r="12" fill="url(#pwDome${uid})"/>
        <path d="M 22,13.5 L 22,21" stroke="#2E3338" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M 16.2,16.4 A 8.2,8.2 0 1 0 27.8,16.4" fill="none" stroke="#2E3338" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    }
  },

  // ── Side brush — three neat bristle tufts (Roomba-style), front-left ────────
  sideBrush: {
    label:'Side Brush', bx:-58, by:-26, w:62, h:62, z:7, round:true,
    svg(c, uid) {
      let arms = '';
      for (let i = 0; i < 3; i++) {
        const base = i * 120;
        // a tight fan of three strands per tuft, bound at the hub
        arms += `<g transform="rotate(${base} 31 31)">
          <path d="M 31,22 Q 28.6,13 26.5,6.5" fill="none" stroke="${c.accent}" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M 31,22 Q 31,12 31,5"       fill="none" stroke="${c.accent}" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M 31,22 Q 33.4,13 35.5,6.5" fill="none" stroke="${c.accent}" stroke-width="2.6" stroke-linecap="round"/>
        </g>`;
      }
      return `<svg width="62" height="62" viewBox="0 0 62 62" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sbHub${uid}" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stop-color="#E2E5E9"/>
            <stop offset="60%" stop-color="#A9AEB5"/>
            <stop offset="100%" stop-color="#6E737B"/>
          </radialGradient>
        </defs>
        <ellipse cx="31" cy="33" rx="12" ry="11" fill="#000" opacity="0.16"/>
        ${arms}
        <circle cx="31" cy="31" r="9.5" fill="url(#sbHub${uid})" stroke="#565B63" stroke-width="1.2"/>
        <circle cx="31" cy="31" r="3.2" fill="${c.panel}" stroke="${c.trim}" stroke-width="0.9"/>
        <path d="M 29.6,31 H 32.4 M 31,29.6 V 32.4" stroke="${c.trim}" stroke-width="0.9" stroke-linecap="round"/>
      </svg>`;
    }
  },

  // ── Cliff sensors — two small windows on the front-right shell, each
  //    aligned to the rim's local tangent so they follow the body curve ───────
  cliffSensors: {
    label:'Cliff Sensors', bx:40, by:-48, w:56, h:48, z:6,
    svg(c, uid) {
      // svg centre maps to body (40,-48); window positions in body coords:
      const win = (bxp, byp, rot) => {
        const x = bxp - 40 + 28, y = byp + 48 + 24;
        return `
        <g transform="translate(${x},${y}) rotate(${rot})">
          <rect x="-10" y="-6.5" width="20" height="13" rx="4.5" fill="${c.well}"/>
          <rect x="-8" y="-4.5" width="16" height="9" rx="3.5" fill="url(#clGl${uid})" stroke="${c.trim}" stroke-width="0.8"/>
          <circle class="sensor-eye" cx="0" cy="0" r="2.5" fill="#4A1014"/>
          <rect x="-5.5" y="-3.4" width="7" height="1.5" rx="0.75" fill="#fff" opacity="0.12"/>
        </g>`;
      };
      return `<svg width="56" height="48" viewBox="0 0 56 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="clGl${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2A3138"/>
            <stop offset="100%" stop-color="#000"/>
          </linearGradient>
        </defs>
        ${win(50, -40, 51)}
        ${win(30, -56, 28)}
      </svg>`;
    }
  },

  // ── Drive wheels — treaded rubber in recessed wells (inside the body!) ──────
  wheelL: {
    label:'Wheel', bx:-62, by:8, w:42, h:86, z:5,
    svg(c, uid) { return wheelSvg(c, uid, 'L'); }
  },
  wheelR: {
    label:'Wheel', bx:62, by:8, w:42, h:86, z:5,
    svg(c, uid) { return wheelSvg(c, uid, 'R'); }
  },

  // ── Brush roll — chevron rubber fins in the suction window ──────────────────
  brushRoll: {
    label:'Brush Roll', bx:0, by:46, w:80, h:32, z:5,
    svg(c, uid) {
      let fins = '';
      for (let i = 0; i < 6; i++) {
        const x = 13 + i * 9.2;
        fins += `<path d="M ${x},6.5 L ${x + 5},16 L ${x},25.5" fill="none" stroke="${c.accent}" stroke-width="2.6" stroke-linecap="round" opacity="0.92"/>`;
      }
      return `<svg width="80" height="32" viewBox="0 0 80 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="brTube${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${c.rubberLt}"/>
            <stop offset="45%" stop-color="${c.rubber}"/>
            <stop offset="100%" stop-color="#000"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="78" height="30" rx="9" fill="${c.well}" stroke="${c.trim}" stroke-width="1.2"/>
        <rect x="2.5" y="2.5" width="75" height="27" rx="8" fill="none" stroke="#000" stroke-width="1.4" opacity="0.45"/>
        <rect x="11" y="5" width="58" height="22" rx="11" fill="url(#brTube${uid})"/>
        ${fins}
        <rect x="13" y="6.4" width="54" height="3" rx="1.5" fill="#fff" opacity="0.14"/>
        <rect x="4" y="5" width="7" height="22" rx="2.5" fill="${c.panel}" stroke="${c.trim}" stroke-width="0.9"/>
        <rect x="69" y="5" width="7" height="22" rx="2.5" fill="${c.panel}" stroke="${c.trim}" stroke-width="0.9"/>
        <circle cx="7.5" cy="16" r="1.8" fill="${c.shellDk}"/>
        <circle cx="72.5" cy="16" r="1.8" fill="${c.shellDk}"/>
      </svg>`;
    }
  },

  // ── Dust bin — curved module hugging the rear rim, see-through window ───────
  dirtBin: {
    label:'Dust Bin', bx:0, by:72, w:124, h:28, z:4,
    svg(c, uid) {
      // body centre sits at (62, -58) in this svg's space; rear rim arc r=84
      const dust = [[26,13],[34,17],[44,12],[52,18],[60,14],[68,17],[74,12]]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${1.2 + (i % 3) * 0.5}" fill="${i % 2 ? '#8A8378' : '#6E675C'}" opacity="0.8"/>`).join('');
      return `<svg width="124" height="28" viewBox="0 0 124 28" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dbWin${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3A3F46"/>
            <stop offset="100%" stop-color="#16181C"/>
          </linearGradient>
        </defs>
        <path d="M 4,2.8 H 120 A 84,84 0 0 1 4,2.8 Z" fill="${c.panel}" stroke="${c.trim}" stroke-width="1.3"/>
        <path d="M 7,5 H 117 A 80,80 0 0 1 7,5 Z" fill="none" stroke="${c.shellDk}" stroke-width="1" opacity="0.6"/>
        <rect x="22" y="8" width="58" height="13" rx="6.5" fill="url(#dbWin${uid})" stroke="${c.trim}" stroke-width="0.9" opacity="0.95"/>
        ${dust}
        <rect x="26" y="9.4" width="28" height="2.4" rx="1.2" fill="#fff" opacity="0.10"/>
        <g>
          <rect x="52" y="1" width="20" height="8" rx="3.5" fill="${c.accent}" stroke="${c.accent2}" stroke-width="1"/>
          <path d="M 57,3.4 V 6.6 M 62,3.4 V 6.6 M 67,3.4 V 6.6" stroke="${c.accent2}" stroke-width="1.4" stroke-linecap="round"/>
        </g>
        ${screw(12, 6.5, 2.6, c)}
        ${screw(112, 6.5, 2.6, c)}
      </svg>`;
    }
  },

  // ── Filter grille — slatted door on the bin's right bay ─────────────────────
  filterVent: {
    label:'Filter', bx:33, by:71, w:28, h:16, z:5,
    svg(c, uid) {
      const slats = [0, 1, 2].map(i =>
        `<rect x="4" y="${4 + i * 3.2}" width="20" height="1.8" rx="0.9" fill="${c.well}" opacity="0.9"/>`).join('');
      return `<svg width="28" height="16" viewBox="0 0 28 16" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="26" height="14" rx="4" fill="${c.shell}" stroke="${c.trim}" stroke-width="1"/>
        <rect x="1.8" y="1.8" width="24.4" height="2.2" rx="1.1" fill="${c.shellLt}" opacity="0.35"/>
        ${slats}
      </svg>`;
    }
  },
};

// ── Drive wheel builder (shared by both wheels — they're interchangeable) ─────
function wheelSvg(c, uid, side) {
  let treads = '';
  for (let i = 0; i < 8; i++) {
    const y = 13 + i * 7.6;
    treads += `<path d="M 10,${y} L 21,${y + 3.4} L 32,${y}" fill="none" stroke="${c.rubberLt}" stroke-width="2.4" stroke-linecap="round" opacity="0.75"/>`;
  }
  return `<svg width="42" height="86" viewBox="0 0 42 86" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="whT${side}${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#000"/>
        <stop offset="22%" stop-color="${c.rubber}"/>
        <stop offset="50%" stop-color="${c.rubberLt}"/>
        <stop offset="78%" stop-color="${c.rubber}"/>
        <stop offset="100%" stop-color="#000"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="40" height="84" rx="16" fill="${c.well}" stroke="${c.trim}" stroke-width="1.2"/>
    <rect x="3" y="3" width="36" height="80" rx="14.5" fill="none" stroke="#000" stroke-width="1.6" opacity="0.5"/>
    <rect x="7.5" y="8" width="27" height="70" rx="12" fill="url(#whT${side}${uid})" stroke="#000" stroke-width="1"/>
    ${treads}
    <rect x="9.5" y="11" width="3" height="64" rx="1.5" fill="#fff" opacity="0.07"/>
    <rect x="16" y="2.6" width="10" height="4" rx="2" fill="${c.panel}" stroke="${c.trim}" stroke-width="0.8"/>
  </svg>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Brand logos — true-transparency PNGs on a glossy product-label plate.
// The plate snaps onto the bumper face, like the brand mark on a real machine.
// ══════════════════════════════════════════════════════════════════════════════
function makeLogoDef(png, label) {
  return {
    label, bx:0, by:-70, w:84, h:26, z:9, png,
    svg() {
      return `<svg width="84" height="26" viewBox="0 0 84 26" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="80" height="22" rx="11" fill="#000" opacity="0.30"/>
        <rect x="1" y="1" width="82" height="23" rx="11.5" fill="#FAFBFC" stroke="rgba(0,0,0,0.22)" stroke-width="1"/>
        <rect x="3" y="2.6" width="78" height="9" rx="6" fill="#FFFFFF" opacity="0.65"/>
        <image href="${png}" x="9" y="3.5" width="66" height="18" preserveAspectRatio="xMidYMid meet"/>
      </svg>`;
    }
  };
}

PART_DEFS.logoIrobot   = makeLogoDef('irobot.png',       'iRobot Logo');
PART_DEFS.logoEufy     = makeLogoDef('eufy.png',         'eufy Logo');
PART_DEFS.logoRoborock = makeLogoDef('roborock.png',     'Roborock Logo');
PART_DEFS.logoTapo     = makeLogoDef('logo.png',         'Tapo Logo');
PART_DEFS.logoShark    = makeLogoDef('Shark.png',        'Shark Logo');
PART_DEFS.logoIlife    = makeLogoDef('ilife_logo.png',   'iLife Logo');
PART_DEFS.logoSamsung  = makeLogoDef('samsung_logo.png', 'Samsung Logo');

// ══════════════════════════════════════════════════════════════════════════════
// Level definitions — difficulty grows by adding real parts.
// The logo slot is randomised per level at load time (see game.js).
// ══════════════════════════════════════════════════════════════════════════════
const LEVELS = [
  { id:1,  name:'Easy',           parts:['body','bumper','wheelL','wheelR','powerBtn','logoIrobot'] },
  { id:2,  name:'Getting Harder', parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','logoEufy'] },
  { id:3,  name:'Nice Work!',     parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','casterWheel','chargingContacts','logoRoborock'] },
  { id:4,  name:'Almost Expert!', parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','casterWheel','chargingContacts','brushRoll','irSensors','logoTapo'] },
  { id:5,  name:'Vacuum Expert!', parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','casterWheel','chargingContacts','brushRoll','irSensors','cliffSensors','filterVent','logoShark'] },
  { id:6,  name:'Again!',         parts:['body','bumper','wheelL','wheelR','powerBtn','logoIlife'] },
  { id:7,  name:'Keep Going!',    parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','logoSamsung'] },
  { id:8,  name:'Almost There!',  parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','casterWheel','chargingContacts','logoIrobot'] },
  { id:9,  name:'Super Builder!', parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','casterWheel','chargingContacts','brushRoll','irSensors','logoEufy'] },
  { id:10, name:'Champion! 🏆',   parts:['body','bumper','wheelL','wheelR','powerBtn','sideBrush','dirtBin','casterWheel','chargingContacts','brushRoll','irSensors','cliffSensors','filterVent','logoRoborock'] }
];
