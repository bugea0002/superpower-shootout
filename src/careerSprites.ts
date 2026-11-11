import { AccessoryId, HairStyleId, RENDER_SCALE } from './types';
import { PlayerPosition } from './careerTypes';

export type PixelIconType =
  | 'coin'
  | 'tp'
  | 'boots'
  | 'gloves'
  | 'trophy'
  | 'medal'
  | 'stat_power'
  | 'stat_curve'
  | 'stat_sweetspot'
  | 'stat_focus'
  | 'stat_agility'
  | 'stat_reach'
  | 'stat_composure'
  | 'stat_mana';

/** Helper to draw crisp pixel rectangle */
export function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Pixel bordered box */
export function pxBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  border: string,
  borderWidth = 1
): void {
  px(ctx, x, y, w, h, fill);
  px(ctx, x, y, w, borderWidth, border);
  px(ctx, x, y + h - borderWidth, w, borderWidth, border);
  px(ctx, x, y, borderWidth, h, border);
  px(ctx, x + w - borderWidth, y, borderWidth, h, border);
}

/**
 * 100% Canvas Procedural Pixel Art:
 * Locker Room Clubhouse Background
 */
export function drawLockerRoomBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
): void {
  // 1. Dark Industrial Ceiling (0 ~ 40)
  px(ctx, 0, 0, w, 42, '#090d16');
  // Ceiling beams
  for (let bx = 0; bx < w; bx += 40) {
    px(ctx, bx, 0, 4, 38, '#131b2e');
    px(ctx, bx + 1, 0, 2, 38, '#1e293b');
  }
  // Air Duct pipe
  px(ctx, 0, 14, w, 12, '#1e293b');
  px(ctx, 0, 15, w, 2, '#334155'); // Highlight
  px(ctx, 0, 24, w, 2, '#0f172a'); // Shadow
  for (let rx = 10; rx < w; rx += 25) {
    px(ctx, rx, 14, 2, 12, '#475569'); // Rivet band
  }

  // Pendant warm lights
  const lampPositions = [w * 0.25, w * 0.75];
  lampPositions.forEach((lx, idx) => {
    // Cord
    px(ctx, lx, 0, 1, 28, '#0f172a');
    // Shade
    px(ctx, lx - 6, 28, 13, 4, '#1e293b');
    px(ctx, lx - 4, 26, 9, 3, '#334155');
    // Bulb glow (subtle flicker)
    const flicker = 0.88 + Math.sin(time * 3 + idx * 2.1) * 0.12;
    px(ctx, lx - 2, 32, 5, 3, `rgba(254, 240, 138, ${0.9 * flicker})`);

    // Light cone cone overlay
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lx, 34);
    ctx.lineTo(lx - 45, h * 0.75);
    ctx.lineTo(lx + 45, h * 0.75);
    ctx.closePath();
    const grad = ctx.createLinearGradient(lx, 34, lx, h * 0.75);
    grad.addColorStop(0, `rgba(254, 240, 138, ${0.12 * flicker})`);
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  });

  // 2. Vintage Brick Wall (42 ~ 170)
  px(ctx, 0, 42, w, 128, '#26171b');
  // Brick mortar and textures
  const brickH = 8;
  const brickW = 16;
  for (let by = 42; by < 170; by += brickH) {
    const row = Math.floor((by - 42) / brickH);
    const offset = (row % 2) * (brickW / 2);
    px(ctx, 0, by, w, 1, '#180d10'); // Horizontal mortar
    for (let bx = -offset; bx < w; bx += brickW) {
      px(ctx, bx, by, 1, brickH, '#180d10'); // Vertical mortar
      // Subtle brick color variation
      if ((bx + by * 3) % 7 === 0) {
        px(ctx, bx + 1, by + 1, brickW - 2, 1, '#3b2127'); // Brick highlight
      } else if ((bx + by) % 5 === 0) {
        px(ctx, bx + 1, by + brickH - 2, brickW - 2, 1, '#1b0e12'); // Brick shadow
      }
    }
  }

  // Tactical Whiteboard in center-left (x: 18, y: 56, w: 90, h: 52)
  pxBox(ctx, 18, 56, 92, 54, '#f8fafc', '#475569', 2);
  pxBox(ctx, 22, 60, 84, 46, '#15803d', '#166534', 1); // Green pitch board
  // Pitch lines on board
  px(ctx, 63, 60, 1, 46, '#ffffff'); // Center line
  pxBox(ctx, 58, 77, 12, 12, 'transparent', '#ffffff', 1); // Center circle
  pxBox(ctx, 22, 70, 16, 26, 'transparent', '#ffffff', 1); // Penalty box left
  pxBox(ctx, 90, 70, 16, 26, 'transparent', '#ffffff', 1); // Penalty box right
  // Magnets (red and blue player markers)
  px(ctx, 42, 72, 4, 4, '#ef4444');
  px(ctx, 48, 86, 4, 4, '#ef4444');
  px(ctx, 76, 75, 4, 4, '#3b82f6');
  px(ctx, 82, 88, 4, 4, '#3b82f6');
  px(ctx, 63, 80, 4, 4, '#facc15'); // Yellow ball magnet

  // Trophy Shelf on right (x: 368, y: 56, w: 94, h: 48)
  px(ctx, 368, 80, 94, 4, '#78350f'); // Wood shelf top
  px(ctx, 370, 84, 90, 3, '#451a03'); // Shelf bottom
  // Bracket supports
  px(ctx, 376, 84, 4, 8, '#334155');
  px(ctx, 450, 84, 4, 8, '#334155');
  // Trophies on shelf
  drawPixelIcon(ctx, 'trophy', 382, 62, 16);
  drawPixelIcon(ctx, 'medal', 412, 64, 14);
  drawPixelIcon(ctx, 'trophy', 436, 60, 18);

  // Lockers (x: 120, y: 50, w: 236, h: 120)
  const lockerW = 44;
  for (let li = 0; li < 5; li++) {
    const lx = 126 + li * (lockerW + 4);
    // Locker frame
    pxBox(ctx, lx, 50, lockerW, 116, '#1e293b', '#0f172a', 2);
    // Number plate
    pxBox(ctx, lx + lockerW / 2 - 8, 54, 16, 7, '#facc15', '#854d0e', 1);
    px(ctx, lx + lockerW / 2 - 2, 56, 4, 3, '#000000');

    // Locker louvers / vents
    for (let vy = 66; vy < 80; vy += 3) {
      px(ctx, lx + 8, vy, lockerW - 16, 1, '#0f172a');
    }

    // Locker contents (Open locker at index 1 & 3)
    if (li === 1 || li === 3) {
      px(ctx, lx + 4, 84, lockerW - 8, 76, '#0f172a'); // Dark interior
      // Hanging jersey
      const jerseyCol = li === 1 ? '#2563eb' : '#dc2626';
      px(ctx, lx + 12, 88, lockerW - 24, 34, jerseyCol);
      px(ctx, lx + 14, 86, lockerW - 28, 4, '#f8fafc'); // Hanger
      // Shoes in bottom
      px(ctx, lx + 8, 146, 12, 6, '#facc15');
      px(ctx, lx + lockerW - 20, 146, 12, 6, '#facc15');
    } else {
      // Closed door handle
      px(ctx, lx + lockerW - 8, 108, 3, 10, '#cbd5e1');
    }
  }

  // 3. Wood Parquet Flooring (166 ~ h)
  px(ctx, 0, 166, w, h - 166, '#78350f');
  px(ctx, 0, 166, w, 2, '#451a03'); // Baseboard shadow
  // Wood plank lines
  for (let py = 168; py < h; py += 10) {
    px(ctx, 0, py, w, 1, '#451a03');
    const row = Math.floor((py - 168) / 10);
    const pOffset = (row % 3) * 35;
    for (let pxCoord = -pOffset; pxCoord < w; pxCoord += 55) {
      px(ctx, pxCoord, py, 1, 10, '#451a03');
      // Wood grain highlight
      px(ctx, pxCoord + 2, py + 2, 28, 1, '#92400e');
    }
  }

  // Locker room bench (x: 100, y: 194, w: 280, h: 22)
  // Cast iron legs
  px(ctx, 116, 204, 8, 22, '#0f172a');
  px(ctx, 356, 204, 8, 22, '#0f172a');
  px(ctx, 236, 204, 8, 22, '#0f172a');
  // Bench oak top
  px(ctx, 102, 194, 276, 10, '#b45309');
  px(ctx, 102, 194, 276, 2, '#fde68a'); // Top rim highlight
  px(ctx, 102, 202, 276, 2, '#78350f'); // Bottom edge

  // Gym duffle bag near bench (x: 74, y: 202)
  pxBox(ctx, 74, 202, 24, 14, '#0284c7', '#0369a1', 1);
  px(ctx, 80, 198, 12, 4, '#0f172a'); // Strap
  px(ctx, 74, 207, 24, 2, '#f8fafc'); // White stripe

  // Soccer ball on floor (x: 396, y: 204)
  drawFloorSoccerBall(ctx, 396, 206, time);
}

/** Pixel Soccer Ball resting on floor */
function drawFloorSoccerBall(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  // Shadow
  px(ctx, x - 2, y + 10, 18, 4, 'rgba(0,0,0,0.4)');
  // Ball sphere (14x14)
  pxBox(ctx, x, y, 14, 14, '#ffffff', '#0f172a', 1);
  // Hexagon patches
  px(ctx, x + 5, y + 4, 4, 4, '#0f172a');
  px(ctx, x + 2, y + 2, 2, 2, '#0f172a');
  px(ctx, x + 10, y + 2, 2, 2, '#0f172a');
  px(ctx, x + 2, y + 9, 2, 2, '#0f172a');
  px(ctx, x + 10, y + 9, 2, 2, '#0f172a');
  // Subtle shine
  px(ctx, x + 3, y + 1, 3, 1, '#ffffff');
}

/**
 * Large Hero Position Selection Card
 * Striker (Flame Cleat) vs Goalkeeper (Titan Crystal Glove)
 */
export function drawPositionCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  position: PlayerPosition,
  isSelected: boolean,
  isHovered: boolean,
  time: number
): void {
  const isStriker = position === 'striker';
  const pulse = Math.sin(time * 5) * 0.5 + 0.5;

  // Outer frame colors
  let borderColor = isSelected
    ? '#facc15'
    : isHovered
    ? (isStriker ? '#f97316' : '#38bdf8')
    : '#334155';
  let bgColor = isSelected
    ? (isStriker ? '#3b0d11' : '#07241f')
    : (isStriker ? '#22080a' : '#041714');

  // Main Card Body
  pxBox(ctx, x, y, w, h, bgColor, borderColor, isSelected ? 3 : 2);

  // Background pixel aura pattern
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const sparkX = x + 12 + ((Math.sin(time * 2 + i * 1.7) * 0.5 + 0.5) * (w - 24));
    const sparkY = y + 18 + ((Math.cos(time * 2.3 + i * 2.1) * 0.5 + 0.5) * (h - 70));
    const sparkCol = isStriker
      ? (i % 2 === 0 ? '#ea580c' : '#facc15')
      : (i % 2 === 0 ? '#0d9488' : '#38bdf8');
    px(ctx, sparkX, sparkY, 2, 2, sparkCol);
  }
  ctx.restore();

  // Top Badge / Role Name
  const roleName = isStriker ? 'STRIKER' : 'GOALKEEPER';
  const roleSub = isStriker ? '에이스 스트라이커' : '절대 수호 골키퍼';
  const headerColor = isStriker ? '#f97316' : '#2dd4bf';

  pxBox(ctx, x + 12, y + 10, w - 24, 18, 'rgba(0,0,0,0.4)', headerColor, 1);
  ctx.font = '900 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = headerColor;
  ctx.fillText(roleName, x + w / 2, y + 23);

  // Central Large Pixel Illustration Box (w: 80, h: 72)
  const illusX = x + (w - 84) / 2;
  const illusY = y + 36;
  pxBox(ctx, illusX, illusY, 84, 72, 'rgba(15, 23, 42, 0.8)', borderColor, 1);

  if (isStriker) {
    // Large Flaming Golden Cleat (32x24 pixel art)
    drawStrikerHeroCleat(ctx, illusX + 16, illusY + 20, time);
  } else {
    // Large Lightning Crystal Keeper Glove (32x24 pixel art)
    drawKeeperHeroGlove(ctx, illusX + 18, illusY + 18, time);
  }

  // Description Tagline
  ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(roleSub, x + w / 2, y + 124);

  // Key stats bullets
  ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#cbd5e1';
  if (isStriker) {
    ctx.fillText('• 슛 파워 & 궤적 왜곡 특화', x + w / 2, y + 140);
    ctx.fillText('• 퍼펙트 임팩트 관통력 극대화', x + w / 2, y + 152);
    ctx.fillText('• 화염포 / 환영분신 / 벼락슛', x + w / 2, y + 164);
  } else {
    ctx.fillText('• 다이빙 속도 & 세이브 범위 특화', x + w / 2, y + 140);
    ctx.fillText('• 역방향 감속 페널티 저항', x + w / 2, y + 152);
    ctx.fillText('• 거인화 / 블랙홀 / 워프 블링크', x + w / 2, y + 164);
  }

  // Selection Button Indicator at bottom
  const btnY = y + h - 28;
  const btnColor = isSelected ? '#facc15' : '#334155';
  const btnText = isSelected ? '▶ 선택됨 (SELECTED)' : (isHovered ? '클릭하여 선택' : '포지션 선택');
  pxBox(ctx, x + 16, btnY, w - 32, 20, isSelected ? '#ca8a04' : '#1e293b', btnColor, 1);
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
  ctx.fillText(btnText, x + w / 2, btnY + 13);
}

/** Detailed Pixel Art: Flaming Golden Cleat for Striker */
function drawStrikerHeroCleat(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  // Fire aura behind boot
  const fireAnim = Math.floor((time * 12) % 4);
  const flameCols = ['#f97316', '#ea580c', '#eab308', '#dc2626'];
  for (let fi = 0; fi < 6; fi++) {
    const fx = x + fi * 6 + ((fireAnim * 2) % 4);
    const fy = y - 4 - ((fireAnim + fi) % 5) * 2;
    px(ctx, fx, fy, 4, 6, flameCols[(fi + fireAnim) % flameCols.length]);
  }

  // Golden Cleat Body
  // Heel
  px(ctx, x + 2, y + 8, 8, 12, '#ca8a04');
  px(ctx, x + 4, y + 6, 6, 4, '#eab308');
  // Ankle collar
  px(ctx, x + 6, y + 2, 10, 6, '#facc15');
  px(ctx, x + 8, y + 1, 6, 2, '#fef08a'); // Highlight
  // Main foot instep & sole
  px(ctx, x + 8, y + 8, 22, 10, '#facc15');
  px(ctx, x + 14, y + 6, 12, 4, '#fde047');
  // Toe box
  px(ctx, x + 26, y + 11, 14, 8, '#eab308');
  px(ctx, x + 34, y + 14, 8, 5, '#ca8a04');
  // Studs / Cleats (Spikes underneath)
  px(ctx, x + 6, y + 20, 4, 5, '#0f172a');
  px(ctx, x + 14, y + 20, 4, 4, '#0f172a');
  px(ctx, x + 26, y + 20, 4, 5, '#0f172a');
  px(ctx, x + 36, y + 19, 4, 4, '#0f172a');

  // Red racing stripe
  px(ctx, x + 10, y + 10, 18, 3, '#dc2626');
  px(ctx, x + 12, y + 9, 14, 2, '#f87171');

  // Sparkles
  const sparkFrame = Math.sin(time * 8);
  if (sparkFrame > 0) {
    px(ctx, x + 36, y + 4, 3, 3, '#ffffff');
    px(ctx, x + 2, y + 2, 2, 2, '#fef08a');
  }
}

/** Detailed Pixel Art: Titan Lightning Glove for Goalkeeper */
function drawKeeperHeroGlove(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  // Electric aura sparks
  const sparkAnim = Math.sin(time * 10);
  if (sparkAnim > 0.2) {
    px(ctx, x + 4, y - 4, 2, 6, '#38bdf8');
    px(ctx, x + 26, y - 2, 4, 2, '#a855f7');
    px(ctx, x + 36, y + 14, 2, 4, '#38bdf8');
  }

  // Glove Wristband (Strap)
  px(ctx, x + 10, y + 18, 18, 8, '#0f172a');
  px(ctx, x + 12, y + 20, 14, 4, '#0284c7'); // Blue band strap

  // Palm / Back of hand
  px(ctx, x + 8, y + 6, 22, 14, '#059669');
  px(ctx, x + 10, y + 8, 18, 10, '#10b981'); // Emerald center
  px(ctx, x + 12, y + 10, 14, 6, '#34d399'); // Highlight

  // Fingers (Index, Middle, Ring, Pinky)
  px(ctx, x + 6, y - 2, 5, 10, '#059669');  // Pinky
  px(ctx, x + 12, y - 6, 5, 13, '#10b981'); // Ring
  px(ctx, x + 18, y - 8, 5, 15, '#34d399'); // Middle (longest)
  px(ctx, x + 24, y - 5, 5, 12, '#10b981'); // Index
  // Thumb (angled right)
  px(ctx, x + 29, y + 7, 8, 6, '#059669');
  px(ctx, x + 33, y + 5, 6, 5, '#34d399');

  // Grip Emboss Padding (Titan Crystal hexagon on palm)
  px(ctx, x + 15, y + 9, 6, 6, '#38bdf8');
  px(ctx, x + 16, y + 10, 4, 4, '#bae6fd');
}

/**
 * Procedural Pixel UI Icons (16x16 standard)
 */
export function drawPixelIcon(
  ctx: CanvasRenderingContext2D,
  icon: PixelIconType,
  x: number,
  y: number,
  size = 16
): void {
  const s = size / 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  switch (icon) {
    case 'coin':
      // Gold Coin
      px(ctx, 3, 1, 10, 14, '#eab308');
      px(ctx, 1, 3, 14, 10, '#eab308');
      px(ctx, 4, 2, 8, 12, '#facc15');
      px(ctx, 2, 4, 12, 8, '#facc15');
      px(ctx, 5, 4, 6, 8, '#ca8a04'); // Inner ring
      px(ctx, 6, 5, 4, 6, '#fef08a'); // Emboss
      px(ctx, 7, 6, 2, 4, '#854d0e'); // 'G' notch
      break;

    case 'tp':
      // Training Point (Blue Dumbbell)
      px(ctx, 1, 4, 4, 8, '#0284c7');
      px(ctx, 2, 5, 2, 6, '#38bdf8');
      px(ctx, 11, 4, 4, 8, '#0284c7');
      px(ctx, 12, 5, 2, 6, '#38bdf8');
      px(ctx, 4, 7, 8, 2, '#cbd5e1'); // Barbell handle
      px(ctx, 5, 7, 6, 1, '#ffffff');
      break;

    case 'boots':
      // Mini Cleat
      px(ctx, 2, 7, 5, 6, '#ca8a04');
      px(ctx, 6, 5, 8, 7, '#facc15');
      px(ctx, 11, 7, 4, 5, '#eab308');
      px(ctx, 3, 13, 2, 2, '#0f172a');
      px(ctx, 8, 13, 2, 2, '#0f172a');
      px(ctx, 13, 12, 2, 2, '#0f172a');
      break;

    case 'gloves':
      // Mini Keeper Glove
      px(ctx, 4, 9, 8, 6, '#0f172a');
      px(ctx, 3, 3, 10, 7, '#059669');
      px(ctx, 4, 2, 7, 7, '#10b981');
      px(ctx, 5, 1, 2, 3, '#34d399');
      px(ctx, 8, 1, 2, 3, '#34d399');
      px(ctx, 12, 5, 3, 3, '#10b981');
      break;

    case 'trophy':
      // Gold Trophy Cup
      px(ctx, 3, 2, 10, 6, '#facc15');
      px(ctx, 2, 3, 12, 4, '#facc15');
      px(ctx, 4, 8, 8, 2, '#eab308');
      px(ctx, 6, 10, 4, 3, '#ca8a04'); // Stem
      px(ctx, 4, 13, 8, 2, '#854d0e'); // Base
      px(ctx, 1, 3, 2, 3, '#ca8a04'); // Left handle
      px(ctx, 13, 3, 2, 3, '#ca8a04'); // Right handle
      px(ctx, 5, 3, 2, 4, '#fef08a'); // Shine
      break;

    case 'medal':
      // Silver / Gold Ribbon Medal
      px(ctx, 5, 1, 3, 6, '#dc2626'); // Red ribbon
      px(ctx, 8, 1, 3, 6, '#2563eb'); // Blue ribbon
      px(ctx, 4, 7, 8, 8, '#facc15'); // Medallion
      px(ctx, 5, 6, 6, 10, '#facc15');
      px(ctx, 6, 8, 4, 6, '#fef08a');
      break;

    case 'stat_power':
      // Red Flame
      px(ctx, 6, 1, 4, 4, '#ef4444');
      px(ctx, 4, 4, 8, 8, '#f97316');
      px(ctx, 3, 7, 10, 8, '#dc2626');
      px(ctx, 6, 6, 4, 6, '#facc15'); // Inner yellow flame
      break;

    case 'stat_curve':
      // Purple Vortex Curve Arrow
      px(ctx, 7, 2, 6, 2, '#c084fc');
      px(ctx, 11, 4, 3, 4, '#c084fc');
      px(ctx, 11, 8, 2, 5, '#a855f7');
      px(ctx, 8, 12, 4, 2, '#7e22ce');
      px(ctx, 3, 10, 5, 3, '#9333ea');
      px(ctx, 2, 8, 3, 3, '#c084fc'); // Arrowhead
      break;

    case 'stat_sweetspot':
      // Green Bullseye Target
      px(ctx, 6, 1, 4, 2, '#22c55e');
      px(ctx, 6, 13, 4, 2, '#22c55e');
      px(ctx, 1, 6, 2, 4, '#22c55e');
      px(ctx, 13, 6, 2, 4, '#22c55e');
      px(ctx, 3, 3, 10, 10, 'transparent');
      px(ctx, 6, 6, 4, 4, '#ef4444'); // Red bullseye center
      px(ctx, 7, 7, 2, 2, '#fef08a');
      break;

    case 'stat_focus':
      // Eye Focus / Scope
      px(ctx, 2, 6, 12, 4, '#38bdf8');
      px(ctx, 4, 4, 8, 8, '#0284c7');
      px(ctx, 6, 6, 4, 4, '#ffffff');
      px(ctx, 7, 7, 2, 2, '#0f172a');
      break;

    case 'stat_agility':
      // Winged Boot
      px(ctx, 3, 6, 10, 7, '#38bdf8');
      px(ctx, 2, 2, 6, 5, '#ffffff'); // Wing
      px(ctx, 6, 1, 4, 3, '#bae6fd');
      break;

    case 'stat_reach':
      // Open Giant Hand
      px(ctx, 3, 6, 10, 8, '#10b981');
      px(ctx, 3, 2, 2, 5, '#34d399');
      px(ctx, 6, 1, 2, 6, '#34d399');
      px(ctx, 9, 2, 2, 5, '#34d399');
      px(ctx, 12, 4, 2, 4, '#34d399');
      break;

    case 'stat_composure':
      // Shield of Calm
      px(ctx, 3, 2, 10, 4, '#818cf8');
      px(ctx, 4, 6, 8, 6, '#6366f1');
      px(ctx, 6, 12, 4, 3, '#4f46e5');
      px(ctx, 7, 5, 2, 6, '#ffffff');
      break;

    case 'stat_mana':
      // Blue Mana Crystal Diamond
      px(ctx, 7, 1, 2, 2, '#38bdf8');
      px(ctx, 5, 3, 6, 3, '#0ea5e9');
      px(ctx, 3, 6, 10, 4, '#0284c7');
      px(ctx, 5, 10, 6, 3, '#0369a1');
      px(ctx, 7, 13, 2, 2, '#0c4a6e');
      px(ctx, 6, 4, 3, 4, '#e0f2fe'); // Facet shine
      break;
  }

  ctx.restore();
}

/**
 * Division League Emblems (16x16 ~ 32x32)
 */
export function drawDivisionEmblem(
  ctx: CanvasRenderingContext2D,
  emblemKey: string,
  x: number,
  y: number,
  size = 28
): void {
  const s = size / 28;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  if (emblemKey === 'street') {
    // Div 4: Red Brick Shield with Graffiti
    pxBox(ctx, 2, 2, 24, 24, '#7f1d1d', '#b91c1c', 2);
    px(ctx, 6, 6, 16, 2, '#f97316');
    px(ctx, 6, 12, 16, 2, '#f97316');
    px(ctx, 6, 18, 16, 2, '#f97316');
    // Spray star
    px(ctx, 12, 8, 4, 12, '#facc15');
    px(ctx, 8, 12, 12, 4, '#facc15');
  } else if (emblemKey === 'cyber') {
    // Div 3: Neon Hexagon Cyber
    pxBox(ctx, 4, 2, 20, 24, '#3b0764', '#c084fc', 2);
    px(ctx, 2, 6, 24, 16, 'transparent');
    // Circuit traces
    px(ctx, 8, 8, 12, 2, '#06b6d4');
    px(ctx, 13, 8, 2, 12, '#06b6d4');
    px(ctx, 8, 18, 12, 2, '#06b6d4');
    px(ctx, 12, 12, 4, 4, '#f0abfc');
  } else if (emblemKey === 'pro') {
    // Div 2: Super Pro Shield with Wings
    pxBox(ctx, 4, 2, 20, 22, '#1e3a8a', '#60a5fa', 2);
    px(ctx, 8, 22, 12, 4, '#1d4ed8');
    px(ctx, 12, 26, 4, 2, '#1e40af');
    // Golden Star in center
    px(ctx, 12, 8, 4, 8, '#facc15');
    px(ctx, 9, 10, 10, 4, '#facc15');
  } else if (emblemKey === 'gods') {
    // Div 1: Golden Olympus Laurel & Lightning
    pxBox(ctx, 4, 4, 20, 20, '#451a03', '#facc15', 2);
    // Laurel crown dots
    for (let li = 0; li < 6; li++) {
      px(ctx, 2 + li * 2, 6 + li * 3, 3, 3, '#fde047');
      px(ctx, 23 - li * 2, 6 + li * 3, 3, 3, '#fde047');
    }
    // Lightning bolt in center
    px(ctx, 14, 5, 4, 6, '#ffffff');
    px(ctx, 10, 10, 8, 4, '#fef08a');
    px(ctx, 12, 14, 4, 8, '#ffffff');
  } else {
    // Player custom team emblem
    pxBox(ctx, 4, 2, 20, 24, '#0f172a', '#38bdf8', 2);
    px(ctx, 12, 6, 4, 14, '#ffffff');
    px(ctx, 6, 12, 16, 4, '#ffffff');
    px(ctx, 10, 10, 8, 8, '#facc15');
  }

  ctx.restore();
}

/**
 * Animated Player in Locker Room:
 * - Striker: Juggles/taps soccer ball on toe with athletic balance
 * - Goalkeeper: Claps gloves together and drops into defensive ready stance
 */
export function drawLockerPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  position: PlayerPosition,
  hairStyle: HairStyleId,
  accessory: AccessoryId,
  time: number
): void {
  const isStriker = position === 'striker';
  const loop = time % 2.0; // 2-second animation loop

  ctx.save();
  ctx.translate(x, y);

  if (isStriker) {
    // Striker: breathing and juggling ball
    const jugglePhase = (time * 2.5) % 1.0; // Ball juggling frequency
    // Body vertical bobbing
    const bobY = Math.sin(time * 5) * 1.5;

    // Ground shadow
    px(ctx, -14, 22, 28, 4, 'rgba(0,0,0,0.3)');

    // Left standing leg
    px(ctx, -6, 2 + bobY, 4, 18, '#1e40af'); // Blue shorts/socks
    px(ctx, -8, 20, 6, 4, '#ca8a04');       // Gold boot on floor

    // Right kicking/lifting leg
    const kickUp = Math.sin(jugglePhase * Math.PI) * 7;
    px(ctx, 2, 2 + bobY - kickUp * 0.5, 4, 14, '#1e40af');
    px(ctx, 4, 16 - kickUp, 7, 5, '#facc15'); // Lifting boot

    // Juggling Soccer ball
    const ballArcY = -Math.sin(jugglePhase * Math.PI) * 16;
    drawFloorSoccerBall(ctx, 7, 6 + ballArcY, time * 3);

    // Torso (Jersey)
    px(ctx, -8, -16 + bobY, 16, 18, '#2563eb');
    px(ctx, -6, -14 + bobY, 12, 14, '#3b82f6'); // Center chest
    px(ctx, -2, -10 + bobY, 4, 6, '#ffffff');   // Number 9

    // Arms
    px(ctx, -11, -14 + bobY, 3, 12, '#f6c39b'); // Skin left arm
    px(ctx, 8, -14 + bobY, 3, 10, '#f6c39b');  // Right arm balanced out

    // Head
    drawPlayerHead(ctx, -6, -30 + bobY, hairStyle, accessory, '#f6c39b', time);
  } else {
    // Goalkeeper: glove clap and ready crouch stance
    const clapCycle = Math.sin(time * 3);
    const crouchY = clapCycle > 0 ? 1 : 0;

    // Ground shadow
    px(ctx, -16, 22, 32, 4, 'rgba(0,0,0,0.3)');

    // Wide athletic stance legs
    px(ctx, -10, 4 + crouchY, 5, 17, '#064e3b'); // Dark teal shorts
    px(ctx, -12, 20, 7, 4, '#0f172a');          // Dark boots
    px(ctx, 5, 4 + crouchY, 5, 17, '#064e3b');
    px(ctx, 5, 20, 7, 4, '#0f172a');

    // Torso (GK Jersey)
    px(ctx, -9, -14 + crouchY, 18, 18, '#059669');
    px(ctx, -7, -12 + crouchY, 14, 14, '#10b981');
    px(ctx, -2, -8 + crouchY, 4, 6, '#fef08a'); // Number 1

    // Clapping Hands / Big Gloves
    const clapIn = Math.abs(Math.sin(time * 4)) * 4;
    // Left glove
    px(ctx, -14 + clapIn, -8 + crouchY, 6, 8, '#38bdf8');
    px(ctx, -13 + clapIn, -7 + crouchY, 4, 6, '#10b981');
    // Right glove
    px(ctx, 8 - clapIn, -8 + crouchY, 6, 8, '#38bdf8');
    px(ctx, 9 - clapIn, -7 + crouchY, 4, 6, '#10b981');

    // Head
    drawPlayerHead(ctx, -6, -28 + crouchY, hairStyle, accessory, '#f2b88f', time);
  }

  ctx.restore();
}

/** Render player head, hair and accessory in pixel art */
function drawPlayerHead(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  hair: HairStyleId,
  acc: AccessoryId,
  skinCol: string,
  time: number
): void {
  // Face / Head base (12x13)
  px(ctx, hx, hy, 12, 13, skinCol);
  px(ctx, hx + 1, hy + 1, 10, 11, skinCol);

  // Eyes (Blinking every 3 seconds)
  const isBlink = Math.floor(time * 2) % 6 === 0;
  if (!isBlink) {
    px(ctx, hx + 2, hy + 5, 2, 2, '#0f172a');
    px(ctx, hx + 8, hy + 5, 2, 2, '#0f172a');
    px(ctx, hx + 3, hy + 5, 1, 1, '#ffffff'); // Eye shine
    px(ctx, hx + 9, hy + 5, 1, 1, '#ffffff');
  } else {
    px(ctx, hx + 2, hy + 6, 3, 1, '#0f172a');
    px(ctx, hx + 8, hy + 6, 3, 1, '#0f172a');
  }

  // Mouth
  px(ctx, hx + 5, hy + 9, 3, 1, '#854d24');

  // Hair Styles
  const hairCol = '#1e293b';
  const hairHigh = '#475569';
  if (hair === 'spiky') {
    // Spiky Hair
    px(ctx, hx - 2, hy - 4, 16, 5, hairCol);
    px(ctx, hx, hy - 7, 4, 4, hairCol);
    px(ctx, hx + 5, hy - 8, 4, 5, hairHigh);
    px(ctx, hx + 10, hy - 6, 4, 4, hairCol);
  } else if (hair === 'dread') {
    // Dreadlocks
    px(ctx, hx - 2, hy - 3, 16, 5, '#291e13');
    px(ctx, hx - 3, hy + 1, 3, 10, '#3d2b19');
    px(ctx, hx + 12, hy + 1, 3, 10, '#3d2b19');
  } else if (hair === 'bowl') {
    // Bowl cut
    px(ctx, hx - 1, hy - 3, 14, 6, '#31102f');
    px(ctx, hx, hy + 2, 12, 2, '#31102f');
  } else if (hair === 'curly') {
    // Curly Afro
    px(ctx, hx - 3, hy - 6, 18, 9, '#1a1005');
    px(ctx, hx - 2, hy - 5, 16, 7, '#3d2508');
  } // 'bald' has no hair overlay

  // Accessories
  if (acc === 'headband') {
    px(ctx, hx - 1, hy + 2, 14, 3, '#ef4444');
    px(ctx, hx + 1, hy + 3, 10, 1, '#f87171');
  } else if (acc === 'glasses') {
    pxBox(ctx, hx + 1, hy + 4, 4, 4, 'rgba(56, 189, 248, 0.4)', '#0284c7', 1);
    pxBox(ctx, hx + 7, hy + 4, 4, 4, 'rgba(56, 189, 248, 0.4)', '#0284c7', 1);
    px(ctx, hx + 5, hy + 5, 2, 1, '#0284c7');
  } else if (acc === 'mask') {
    px(ctx, hx + 1, hy + 7, 10, 5, '#0f172a');
    px(ctx, hx + 3, hy + 8, 6, 2, '#334155');
  } else if (acc === 'aura_crown') {
    px(ctx, hx + 1, hy - 6, 10, 3, '#facc15');
    px(ctx, hx + 1, hy - 8, 2, 3, '#fde047');
    px(ctx, hx + 5, hy - 9, 2, 4, '#fde047');
    px(ctx, hx + 9, hy - 8, 2, 3, '#fde047');
  }
}
