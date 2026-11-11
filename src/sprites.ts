import { GoalRect, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './types';

export interface SpritePalette {
  outline: string;
  outlineSoft: string;
  skin: string;
  skinLight: string;
  skinDark: string;
  skinShadow: string;
  hair: string;
  hairLight: string;
  hairDark: string;
  band: string;
  bandLight: string;
  jersey: string;
  jerseyDark: string;
  jerseyLight: string;
  jerseyShadow: string;
  number: string;
  shorts: string;
  shortsDark: string;
  shortsLight: string;
  socks: string;
  socksDark: string;
  boots: string;
  bootsDark: string;
  bootsLight: string;
  glove: string;
  gloveLight: string;
  gloveDark: string;
}

const BLUE_TEAM_KICKER: SpritePalette = {
  outline: '#080d1a',
  outlineSoft: '#1e293b',
  skin: '#f6c39b',
  skinLight: '#fed7aa',
  skinDark: '#d4956a',
  skinShadow: '#9a5b32',
  hair: '#1e293b',
  hairLight: '#475569',
  hairDark: '#0f172a',
  band: '#ef4444',
  bandLight: '#f87171',
  jersey: '#2563eb',
  jerseyDark: '#1d4ed8',
  jerseyLight: '#60a5fa',
  jerseyShadow: '#1e3a8a',
  number: '#ffffff',
  shorts: '#f8fafc',
  shortsDark: '#cbd5e1',
  shortsLight: '#ffffff',
  socks: '#1d4ed8',
  socksDark: '#172554',
  boots: '#facc15',
  bootsDark: '#ca8a04',
  bootsLight: '#fef08a',
  glove: '#22c55e',
  gloveLight: '#86efac',
  gloveDark: '#15803d',
};

const RED_TEAM_KICKER: SpritePalette = {
  outline: '#100508',
  outlineSoft: '#2a111a',
  skin: '#f2b88f',
  skinLight: '#ffedd5',
  skinDark: '#c9885d',
  skinShadow: '#854d24',
  hair: '#31102f',
  hairLight: '#701a75',
  hairDark: '#1a0519',
  band: '#facc15',
  bandLight: '#fef08a',
  jersey: '#dc2626',
  jerseyDark: '#991b1b',
  jerseyLight: '#f87171',
  jerseyShadow: '#7f1d1d',
  number: '#fef08a',
  shorts: '#1e293b',
  shortsDark: '#0f172a',
  shortsLight: '#334155',
  socks: '#dc2626',
  socksDark: '#991b1b',
  boots: '#38bdf8',
  bootsDark: '#0284c7',
  bootsLight: '#bae6fd',
  glove: '#f97316',
  gloveLight: '#fdba74',
  gloveDark: '#c2410c',
};

const BLUE_TEAM_KEEPER: SpritePalette = {
  ...BLUE_TEAM_KICKER,
  jersey: '#059669',
  jerseyDark: '#065f46',
  jerseyLight: '#34d399',
  jerseyShadow: '#064e3b',
  shorts: '#0f172a',
  shortsDark: '#020617',
  shortsLight: '#1e293b',
  glove: '#38bdf8',
  gloveLight: '#bae6fd',
  gloveDark: '#0369a1',
};

const RED_TEAM_KEEPER: SpritePalette = {
  ...RED_TEAM_KICKER,
  jersey: '#ea580c',
  jerseyDark: '#9a3412',
  jerseyLight: '#fb923c',
  jerseyShadow: '#7c2d12',
  shorts: '#1e1b4b',
  shortsDark: '#0f172a',
  shortsLight: '#312e81',
  glove: '#facc15',
  gloveLight: '#fef08a',
  gloveDark: '#a16207',
};

function createPixelCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

// High-detail pixel drawing helpers
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Organic rounded pixel box with corners clipped for human-like anatomy
function pxClipped(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline?: string
): void {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);

  if (outline) {
    ctx.fillStyle = outline;
    // Cross outline (omitting extreme 1px corners)
    ctx.fillRect(rx + 1, ry - 1, rw - 2, rh + 2);
    ctx.fillRect(rx - 1, ry + 1, rw + 2, rh - 2);
  }

  ctx.fillStyle = fill;
  ctx.fillRect(rx + 1, ry, rw - 2, rh);
  ctx.fillRect(rx, ry + 1, rw, rh - 2);
}

function pxOutlined(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline: string
): void {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  ctx.fillStyle = outline;
  ctx.fillRect(rx - 1, ry, rw + 2, rh);
  ctx.fillRect(rx, ry - 1, rw, rh + 2);
  ctx.fillStyle = fill;
  ctx.fillRect(rx, ry, rw, rh);
}

export type KickerAnimKey = 'idle' | 'charge' | 'runup' | 'kick' | 'celebrate' | 'despair' | 'taunt';
export type KeeperAnimKey =
  | 'idle'
  | 'dive_low_left'
  | 'dive_low_right'
  | 'dive_top_left'
  | 'dive_top_right'
  | 'catch_center'
  | 'celebrate'
  | 'despair'
  | 'taunt';

function txLeft(cx: number): number {
  return cx - 11;
}

function txRight(cx: number): number {
  return cx + 4;
}

export class PixelSpriteBank {
  public kickerBlue: Record<KickerAnimKey, HTMLCanvasElement[]>;
  public kickerRed: Record<KickerAnimKey, HTMLCanvasElement[]>;
  public keeperBlue: Record<KeeperAnimKey, HTMLCanvasElement[]>;
  public keeperRed: Record<KeeperAnimKey, HTMLCanvasElement[]>;
  public soccerBalls: HTMLCanvasElement[];
  public iceBarrierSprite: HTMLCanvasElement;
  public stadiumBackdrop: HTMLCanvasElement;

  constructor() {
    this.kickerBlue = this.buildKickerSprites(BLUE_TEAM_KICKER);
    this.kickerRed = this.buildKickerSprites(RED_TEAM_KICKER);
    this.keeperBlue = this.buildKeeperSprites(BLUE_TEAM_KEEPER);
    this.keeperRed = this.buildKeeperSprites(RED_TEAM_KEEPER);
    this.soccerBalls = this.buildBallSprites();
    this.iceBarrierSprite = this.buildIceBarrierSprite();
    this.stadiumBackdrop = this.buildStadiumBackdrop();
  }

  // =========================================================================
  // KICKER SPRITES (80x80, BACK-VIEW PIXEL ART)
  // =========================================================================
  private buildKickerSprites(pal: SpritePalette): Record<KickerAnimKey, HTMLCanvasElement[]> {
    const idle = [0, 1, 2, 3].map((f) => this.drawKickerBackFrame(pal, 'idle', f));
    const charge = [0, 1].map((f) => this.drawKickerBackFrame(pal, 'charge', f));
    const runup = [0, 1, 2, 3].map((f) => this.drawKickerBackFrame(pal, 'runup', f));
    const kick = [0, 1, 2, 3].map((f) => this.drawKickerBackFrame(pal, 'kick', f));
    const celebrate = [0, 1, 2, 3].map((f) => this.drawKickerBackFrame(pal, 'celebrate', f));
    const despair = [0, 1].map((f) => this.drawKickerBackFrame(pal, 'despair', f));
    const taunt = [0, 1, 2, 3].map((f) => this.drawKickerBackFrame(pal, 'taunt', f));
    return { idle, charge, runup, kick, celebrate, despair, taunt };
  }

  private drawKickerBackFrame(pal: SpritePalette, anim: KickerAnimKey, frame: number): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(80, 80);
    const cx = 40;

    // Ground shadow
    px(ctx, cx - 15, 72, 30, 4, 'rgba(0,0,0,0.38)');
    px(ctx, cx - 11, 71, 22, 6, 'rgba(0,0,0,0.28)');

    let bobY = 0;
    let torsoTiltX = 0;
    let leftLegY = 0;
    let rightLegY = 0;
    let leftArmMode: 'down' | 'wide' | 'up' | 'forward' | 'back' = 'down';
    let rightArmMode: 'down' | 'wide' | 'up' | 'back' = 'down';
    let rightKickStage = -1; // 0: plant, 1: windup, 2: impact, 3: follow-through
    let kneeling = false;

    if (anim === 'idle') {
      bobY = frame === 1 || frame === 2 ? 1 : 0;
    } else if (anim === 'charge') {
      bobY = 4 + frame;
      leftArmMode = 'wide';
      rightArmMode = 'wide';
    } else if (anim === 'runup') {
      bobY = frame % 2 === 0 ? -2 : 1;
      torsoTiltX = frame % 2 === 0 ? -1 : 1;
      leftLegY = frame === 0 ? -6 : frame === 2 ? 3 : 0;
      rightLegY = frame === 2 ? -6 : frame === 0 ? 3 : 0;
      leftArmMode = frame < 2 ? 'forward' : 'wide';
      rightArmMode = frame < 2 ? 'back' : 'wide';
    } else if (anim === 'kick') {
      rightKickStage = frame;
      if (frame === 0) {
        // Plant left foot deep, wind right leg back
        bobY = 2;
        torsoTiltX = -3;
        leftArmMode = 'wide';
        rightArmMode = 'back';
      } else if (frame === 1) {
        // Whipping right leg forward
        bobY = 0;
        torsoTiltX = -4;
        leftArmMode = 'wide';
        rightArmMode = 'wide';
      } else if (frame === 2) {
        // Impact!
        bobY = -2;
        torsoTiltX = -2;
        leftArmMode = 'up';
        rightArmMode = 'wide';
      } else {
        // High follow-through
        bobY = -3;
        torsoTiltX = -3;
        leftArmMode = 'up';
        rightArmMode = 'back';
      }
    } else if (anim === 'celebrate') {
      // High jump & arms celebration
      bobY = frame === 1 || frame === 2 ? -8 : -2;
      leftArmMode = frame === 2 ? 'wide' : 'up';
      rightArmMode = frame === 2 ? 'wide' : 'up';
    } else if (anim === 'taunt') {
      // SIUU / Dance taunt pose!
      bobY = frame === 0 ? -9 : frame === 1 ? -4 : 0;
      torsoTiltX = frame % 2 === 0 ? -2 : 2;
      leftArmMode = frame >= 2 ? 'back' : 'wide';
      rightArmMode = frame >= 2 ? 'back' : 'wide';
    } else if (anim === 'despair') {
      kneeling = true;
      bobY = 9;
    }

    const tx = cx + torsoTiltX;
    const ty = 24 + bobY;

    // ---------------- LEGS & ANATOMY (MUSCULAR CURVED CALVES & KNEE CONTOURS) ----------------
    if (kneeling) {
      // Slumped despair kneeling: realistic curved shins, boots flattened on grass
      pxClipped(ctx, tx - 12, 53, 9, 13, pal.socks, pal.outline);
      px(ctx, tx - 11, 54, 7, 3, pal.socksDark);
      pxClipped(ctx, tx + 3, 53, 9, 13, pal.socks, pal.outline);
      px(ctx, tx + 4, 54, 7, 3, pal.socksDark);
      // Boots
      pxClipped(ctx, tx - 14, 65, 11, 6, pal.boots, pal.outline);
      px(ctx, tx - 13, 66, 3, 4, pal.bootsDark);
      pxClipped(ctx, tx + 3, 65, 11, 6, pal.boots, pal.outline);
      px(ctx, tx + 4, 66, 3, 4, pal.bootsDark);
    } else if (rightKickStage >= 0) {
      // Planted left leg with natural quad & gastrocnemius calf taper
      // Thigh connection
      pxClipped(ctx, tx - 12, 48 + bobY, 8, 8, pal.skinDark, pal.outline);
      px(ctx, tx - 11, 49 + bobY, 4, 6, pal.skin);
      // Knee crease
      px(ctx, tx - 12, 54 + bobY, 8, 2, pal.skinShadow);
      // Bulbous calf tapering to ankle
      pxClipped(ctx, tx - 13, 56 + bobY, 9, 6, pal.socks, pal.outline); // upper calf bulge
      px(ctx, tx - 12, 56 + bobY, 2, 6, pal.jerseyLight); // sock stripe
      pxClipped(ctx, tx - 11, 62 + bobY, 7, 6, pal.socksDark, pal.outline); // slim ankle
      // Cleat / Football Boot with heel counter & studs
      pxClipped(ctx, tx - 14, 67 + bobY, 11, 5, pal.boots, pal.outline);
      px(ctx, tx - 13, 68 + bobY, 9, 2, pal.bootsLight);
      px(ctx, tx - 14, 70 + bobY, 3, 2, pal.bootsDark); // heel cup
      // Studs
      px(ctx, tx - 13, 72 + bobY, 2, 2, '#f8fafc');
      px(ctx, tx - 7, 72 + bobY, 2, 2, '#f8fafc');

      // Dynamic kicking right leg with genuine athletic angles
      if (rightKickStage === 0) {
        // Cocked back toward camera (foreshortened 3D boot & calf)
        pxClipped(ctx, tx + 4, 46, 10, 8, pal.skin, pal.outline);
        px(ctx, tx + 5, 47, 8, 3, pal.skinDark);
        pxClipped(ctx, tx + 5, 51, 11, 9, pal.socks, pal.outline);
        px(ctx, tx + 7, 52, 4, 7, pal.socksDark);
        // Large 3D boot sole facing camera
        pxClipped(ctx, tx + 4, 57, 13, 10, pal.boots, pal.outline);
        px(ctx, tx + 5, 58, 11, 8, pal.bootsDark);
        // Yellow/white studs pattern
        px(ctx, tx + 6, 59, 3, 2, '#facc15');
        px(ctx, tx + 12, 59, 3, 2, '#facc15');
        px(ctx, tx + 6, 64, 3, 2, '#ffffff');
        px(ctx, tx + 12, 64, 3, 2, '#ffffff');
      } else if (rightKickStage === 1) {
        // Mid-swing explosive blur arc
        px(ctx, tx + 7, 47, 16, 14, 'rgba(255,255,255,0.4)');
        pxClipped(ctx, tx + 5, 46, 11, 8, pal.skin, pal.outline);
        pxClipped(ctx, tx + 10, 43, 10, 8, pal.socks, pal.outline);
        pxClipped(ctx, tx + 16, 39, 12, 7, pal.boots, pal.outline);
        px(ctx, tx + 18, 40, 8, 3, pal.bootsLight);
      } else if (rightKickStage === 2) {
        // Impact forward into ball: stretched instep & toe strike
        pxClipped(ctx, tx + 3, 44, 9, 9, pal.skin, pal.outline);
        pxClipped(ctx, tx + 5, 39, 9, 8, pal.socks, pal.outline);
        px(ctx, tx + 6, 40, 2, 6, pal.socksDark);
        pxClipped(ctx, tx + 7, 34, 11, 6, pal.boots, pal.outline);
        px(ctx, tx + 8, 35, 7, 3, pal.bootsLight);
      } else {
        // High follow-through leg extended gracefully
        pxClipped(ctx, tx + 4, 40, 9, 9, pal.skin, pal.outline);
        pxClipped(ctx, tx + 7, 33, 9, 9, pal.socks, pal.outline);
        pxClipped(ctx, tx + 10, 27, 11, 6, pal.boots, pal.outline);
      }
    } else {
      // Standard two legs (muscular calves bulging outward, slim ankles)
      const ly = 50 + bobY + leftLegY;
      const ry = 50 + bobY + rightLegY;

      // Left leg: thigh -> knee -> sculpted calf -> ankle -> boot
      px(ctx, tx - 11, ly, 7, 5, pal.skinDark); // thigh under shorts
      px(ctx, tx - 10, ly + 1, 5, 4, pal.skin);
      px(ctx, tx - 11, ly + 5, 7, 2, pal.skinShadow); // knee crease
      // Sock upper band with accent stripe
      pxClipped(ctx, tx - 12, ly + 6, 8, 4, pal.socks, pal.outline);
      px(ctx, tx - 12, ly + 7, 8, 1, pal.jerseyLight);
      // Calf muscle bulge (left side curve)
      pxClipped(ctx, tx - 13, ly + 9, 9, 6, pal.socks, pal.outline);
      px(ctx, tx - 12, ly + 10, 3, 4, pal.socksDark);
      // Slim ankle
      pxClipped(ctx, tx - 11, ly + 14, 7, 4, pal.socksDark, pal.outline);
      // Boot with curved toe & cleat
      pxClipped(ctx, tx - 13, ly + 17, 10, 5, pal.boots, pal.outline);
      px(ctx, tx - 12, ly + 18, 8, 2, pal.bootsLight);
      px(ctx, tx - 13, ly + 20, 3, 2, pal.bootsDark); // heel counter

      // Right leg: mirror sculpted anatomy
      px(ctx, tx + 4, ry, 7, 5, pal.skinDark);
      px(ctx, tx + 5, ry + 1, 5, 4, pal.skin);
      px(ctx, tx + 4, ry + 5, 7, 2, pal.skinShadow);
      pxClipped(ctx, tx + 4, ry + 6, 8, 4, pal.socks, pal.outline);
      px(ctx, tx + 4, ry + 7, 8, 1, pal.jerseyLight);
      pxClipped(ctx, tx + 4, ry + 9, 9, 6, pal.socks, pal.outline);
      px(ctx, tx + 9, ry + 10, 3, 4, pal.socksDark);
      pxClipped(ctx, tx + 4, ry + 14, 7, 4, pal.socksDark, pal.outline);
      pxClipped(ctx, tx + 3, ry + 17, 10, 5, pal.boots, pal.outline);
      px(ctx, tx + 4, ry + 18, 8, 2, pal.bootsLight);
      px(ctx, tx + 9, ry + 20, 3, 2, pal.bootsDark);
    }

    // ---------------- SHORTS (ATHLETIC FIT WITH SIDE STRIPES & FOLDS) ----------------
    const shortsY = ty + 19;
    // Waistband
    px(ctx, tx - 12, shortsY - 1, 24, 2, pal.shortsDark);
    // Main shorts with natural taper and flare at hem
    pxClipped(ctx, tx - 13, shortsY, 26, 11, pal.shorts, pal.outline);
    // Left leg hem & right leg hem contour
    px(ctx, tx - 13, shortsY + 8, 26, 3, pal.shortsDark);
    // Center fold / groin shadow
    px(ctx, tx - 1, shortsY + 3, 2, 8, pal.outlineSoft);
    // Athletic side piping stripes
    px(ctx, tx - 12, shortsY + 1, 2, 9, pal.jersey);
    px(ctx, tx + 10, shortsY + 1, 2, 9, pal.jersey);

    // ---------------- ARMS (DELTOID, BICEP, FOREARM, HAND CONTOUR) ----------------
    // Left arm
    if (kneeling) {
      pxClipped(ctx, tx - 16, ty + 2, 6, 12, pal.jersey, pal.outline);
      pxClipped(ctx, tx - 14, ty - 4, 6, 8, pal.skin, pal.outline);
    } else if (leftArmMode === 'down') {
      // Shoulder cap (deltoid sleeve)
      pxClipped(ctx, tx - 18, ty + 2, 7, 7, pal.jersey, pal.outline);
      px(ctx, tx - 17, ty + 3, 3, 4, pal.jerseyLight);
      // Bicep/Elbow
      pxClipped(ctx, tx - 17, ty + 8, 5, 6, pal.skin, pal.outline);
      // Forearm taper to clenched fist
      pxClipped(ctx, tx - 18, ty + 13, 6, 7, pal.skinDark, pal.outline);
      px(ctx, tx - 17, ty + 14, 4, 3, pal.skin);
    } else if (leftArmMode === 'wide') {
      pxClipped(ctx, tx - 22, ty + 1, 10, 6, pal.jersey, pal.outline);
      px(ctx, tx - 20, ty + 2, 6, 2, pal.jerseyLight);
      pxClipped(ctx, tx - 29, ty + 3, 8, 5, pal.skin, pal.outline);
      px(ctx, tx - 28, ty + 4, 6, 2, pal.skinLight);
    } else if (leftArmMode === 'up') {
      pxClipped(ctx, tx - 18, ty - 3, 7, 8, pal.jersey, pal.outline);
      pxClipped(ctx, tx - 20, ty - 12, 6, 10, pal.skin, pal.outline);
      px(ctx, tx - 19, ty - 11, 3, 6, pal.skinLight);
    } else if (leftArmMode === 'forward') {
      pxClipped(ctx, tx - 18, ty + 1, 6, 9, pal.jerseyDark, pal.outline);
      pxClipped(ctx, tx - 17, ty - 4, 5, 7, pal.skinDark, pal.outline);
    } else if (leftArmMode === 'back') {
      pxClipped(ctx, tx - 20, ty + 3, 8, 7, pal.jersey, pal.outline);
      pxClipped(ctx, tx - 23, ty + 9, 7, 9, pal.skin, pal.outline);
    }

    // Right arm
    if (kneeling) {
      pxClipped(ctx, tx + 10, ty + 2, 6, 12, pal.jersey, pal.outline);
      pxClipped(ctx, tx + 8, ty - 4, 6, 8, pal.skin, pal.outline);
    } else if (rightArmMode === 'down') {
      pxClipped(ctx, tx + 11, ty + 2, 7, 7, pal.jersey, pal.outline);
      px(ctx, tx + 13, ty + 3, 3, 4, pal.jerseyLight);
      pxClipped(ctx, tx + 12, ty + 8, 5, 6, pal.skin, pal.outline);
      pxClipped(ctx, tx + 12, ty + 13, 6, 7, pal.skinDark, pal.outline);
      px(ctx, tx + 13, ty + 14, 4, 3, pal.skin);
    } else if (rightArmMode === 'wide') {
      pxClipped(ctx, tx + 12, ty + 1, 10, 6, pal.jersey, pal.outline);
      px(ctx, tx + 14, ty + 2, 6, 2, pal.jerseyLight);
      pxClipped(ctx, tx + 21, ty + 3, 8, 5, pal.skin, pal.outline);
      px(ctx, tx + 22, ty + 4, 6, 2, pal.skinLight);
    } else if (rightArmMode === 'up') {
      pxClipped(ctx, tx + 11, ty - 3, 7, 8, pal.jersey, pal.outline);
      pxClipped(ctx, tx + 14, ty - 12, 6, 10, pal.skin, pal.outline);
      px(ctx, tx + 15, ty - 11, 3, 6, pal.skinLight);
    } else if (rightArmMode === 'back') {
      pxClipped(ctx, tx + 12, ty + 3, 8, 7, pal.jersey, pal.outline);
      pxClipped(ctx, tx + 16, ty + 9, 7, 9, pal.skin, pal.outline);
    }

    // ---------------- TORSO (V-TAPER ATHLETIC BACK WITH SHOULDER BLADES & WRINKLES) ----------------
    // Broad athletic shoulders tapering down to slim athletic waist (V-Shape)
    pxClipped(ctx, tx - 14, ty, 28, 7, pal.jersey, pal.outline); // Upper back / Trapezius
    px(ctx, tx - 12, ty + 1, 24, 2, pal.jerseyLight); // Collar bone / shoulder highlight
    pxClipped(ctx, tx - 13, ty + 6, 26, 7, pal.jersey, pal.outline); // Mid-back (latissimus dorsi)
    pxClipped(ctx, tx - 12, ty + 12, 24, 8, pal.jersey, pal.outline); // Lower back / waist
    // Lateral shadows giving 3D cylindrical torso curvature
    px(ctx, tx - 14, ty + 1, 3, 19, pal.jerseyShadow);
    px(ctx, tx + 11, ty + 1, 3, 19, pal.jerseyShadow);
    // Shoulder blade contour lines (scapula depth)
    px(ctx, tx - 8, ty + 4, 3, 4, pal.jerseyDark);
    px(ctx, tx + 5, ty + 4, 3, 4, pal.jerseyDark);
    // Ergonomic crew neck collar
    pxClipped(ctx, tx - 6, ty - 1, 12, 3, pal.number, pal.outline);

    // Stylish athletic Back Number "10" with beveled shadow
    const nx = tx - 6;
    const ny = ty + 6;
    // Shadow
    px(ctx, nx + 2, ny + 1, 3, 10, pal.jerseyShadow);
    px(ctx, nx + 7, ny + 1, 6, 10, pal.jerseyShadow);
    // Number "1"
    px(ctx, nx + 1, ny, 3, 10, pal.number);
    px(ctx, nx, ny + 1, 1, 2, pal.number);
    // Number "0"
    px(ctx, nx + 6, ny, 6, 10, pal.number);
    px(ctx, nx + 8, ny + 2, 2, 6, pal.jersey);

    // ---------------- HEAD & DYNAMIC LAYERED HAIR (BACK VIEW) ----------------
    const hy = ty - 16 + (kneeling ? 3 : 0);
    // Muscular neck (trapezius & spinal groove)
    pxClipped(ctx, tx - 5, ty - 3, 10, 4, pal.skinDark, pal.outline);
    px(ctx, tx - 1, ty - 2, 2, 3, pal.skinShadow);

    // Ears with lobe definition
    pxClipped(ctx, tx - 11, hy + 6, 3, 5, pal.skin, pal.outline);
    px(ctx, tx - 10, hy + 7, 1, 3, pal.skinDark);
    pxClipped(ctx, tx + 8, hy + 6, 3, 5, pal.skin, pal.outline);
    px(ctx, tx + 9, hy + 7, 1, 3, pal.skinDark);

    // Layered Anime Hair (deep shaded base + midtone lock + highlight spikes)
    // Dark silhouette base
    pxClipped(ctx, tx - 10, hy, 20, 14, pal.hairDark, pal.outline);
    // Main hair volume
    pxClipped(ctx, tx - 9, hy + 1, 18, 12, pal.hair);
    // Dynamic windswept hair spikes (top & sides)
    pxClipped(ctx, tx - 13, hy + 2, 5, 5, pal.hair, pal.outline);
    pxClipped(ctx, tx + 8, hy + 2, 5, 5, pal.hair, pal.outline);
    pxClipped(ctx, tx - 8, hy - 3, 7, 5, pal.hair, pal.outline);
    pxClipped(ctx, tx + 1, hy - 4, 7, 6, pal.hair, pal.outline);
    // Glossy hair highlights (sheen)
    px(ctx, tx - 6, hy + 1, 5, 2, pal.hairLight);
    px(ctx, tx + 2, hy, 5, 2, pal.hairLight);
    px(ctx, tx - 11, hy + 3, 2, 3, pal.hairLight);

    // Hero Headband with folds & fluttering tails
    px(ctx, tx - 10, hy + 6, 20, 3, pal.band);
    px(ctx, tx - 10, hy + 6, 20, 1, pal.bandLight); // top highlight
    const wave = frame % 2 === 0 ? 0 : 2;
    // Knot & dual fluttering ribbons
    pxClipped(ctx, tx + 2, hy + 7, 5, 5, pal.band, pal.outline);
    pxClipped(ctx, tx + 6, hy + 8 + wave, 9, 3, pal.band, pal.outline);
    px(ctx, tx + 7, hy + 8 + wave, 7, 1, pal.bandLight);
    pxClipped(ctx, tx + 4, hy + 11 - wave, 8, 3, pal.band, pal.outline);

    return canvas;
  }

  // =========================================================================
  // GOALKEEPER SPRITES (64x64, HIGH-DETAIL FRONT-VIEW PIXEL ART)
  // =========================================================================
  private buildKeeperSprites(pal: SpritePalette): Record<KeeperAnimKey, HTMLCanvasElement[]> {
    return {
      idle: [0, 1, 2, 3].map((f) => this.drawKeeperIdle(pal, f)),
      dive_low_left: [0, 1, 2].map((f) => this.drawKeeperDiveLow(pal, f, false)),
      dive_low_right: [0, 1, 2].map((f) => this.drawKeeperDiveLow(pal, f, true)),
      dive_top_left: [0, 1, 2].map((f) => this.drawKeeperDiveHigh(pal, f, false)),
      dive_top_right: [0, 1, 2].map((f) => this.drawKeeperDiveHigh(pal, f, true)),
      catch_center: [0, 1].map((f) => this.drawKeeperCatchCenter(pal, f)),
      celebrate: [0, 1, 2, 3].map((f) => this.drawKeeperReaction(pal, f, true)),
      despair: [0, 1].map((f) => this.drawKeeperReaction(pal, f, false)),
      taunt: [0, 1, 2, 3].map((f) => this.drawKeeperTaunt(pal, f)),
    };
  }

  private drawKeeperHeadFront(ctx: CanvasRenderingContext2D, pal: SpritePalette, cx: number, hy: number, shout = false): void {
    // Hair volume back/silhouette
    pxClipped(ctx, cx - 8, hy - 4, 16, 8, pal.hairDark, pal.outline);
    // Spiky windswept hair strands
    pxClipped(ctx, cx - 10, hy - 1, 4, 5, pal.hair, pal.outline);
    pxClipped(ctx, cx + 6, hy - 1, 4, 5, pal.hair, pal.outline);
    pxClipped(ctx, cx - 6, hy - 5, 5, 4, pal.hairLight, pal.outline);
    pxClipped(ctx, cx + 1, hy - 5, 5, 4, pal.hairLight, pal.outline);

    // Sculpted human face with defined jawline & chin taper
    pxClipped(ctx, cx - 7, hy + 1, 14, 11, pal.skin, pal.outline);
    px(ctx, cx - 6, hy + 2, 12, 1, pal.skinLight); // forehead highlight
    px(ctx, cx - 6, hy + 9, 12, 3, pal.skinDark); // jaw shadow
    px(ctx, cx - 2, hy + 10, 4, 2, pal.skinShadow); // chin definition

    // Hero Headband with 3D depth
    px(ctx, cx - 7, hy + 1, 14, 2, pal.band);
    px(ctx, cx - 7, hy + 1, 14, 1, pal.bandLight);

    // Sharp anime eyebrows & focused eyes
    px(ctx, cx - 5, hy + 4, 4, 1, pal.hairDark); // left eyebrow
    px(ctx, cx + 1, hy + 4, 4, 1, pal.hairDark); // right eyebrow
    // Eyes (white sclera + pupil + glint)
    px(ctx, cx - 5, hy + 5, 4, 2, '#ffffff');
    px(ctx, cx + 1, hy + 5, 4, 2, '#ffffff');
    px(ctx, cx - 4, hy + 5, 2, 2, '#0f172a'); // left pupil
    px(ctx, cx + 2, hy + 5, 2, 2, '#0f172a'); // right pupil
    px(ctx, cx - 4, hy + 5, 1, 1, '#60a5fa'); // eye reflection
    px(ctx, cx + 2, hy + 5, 1, 1, '#60a5fa');

    // Nose shadow
    px(ctx, cx - 1, hy + 7, 2, 2, pal.skinDark);

    // Mouth
    if (shout) {
      // Roaring open mouth
      pxClipped(ctx, cx - 3, hy + 9, 6, 4, '#7f1d1d', pal.outlineSoft);
      px(ctx, cx - 2, hy + 9, 4, 1, '#ffffff'); // teeth
    } else {
      // Determined grin
      px(ctx, cx - 3, hy + 9, 6, 1, pal.skinShadow);
      px(ctx, cx - 1, hy + 10, 2, 1, pal.skinDark);
    }
  }

  private drawGlove(ctx: CanvasRenderingContext2D, pal: SpritePalette, x: number, y: number, open = true): void {
    // Professional goalkeeper latex gloves with palm grip & padded finger spines
    pxClipped(ctx, x - 5, y - 5, 10, 10, pal.glove, pal.outline);
    px(ctx, x - 4, y - 4, 8, 4, pal.gloveLight); // finger spines / punch zone
    px(ctx, x - 4, y, 8, 4, pal.gloveDark); // latex palm
    px(ctx, x - 2, y + 4, 4, 2, '#ffffff'); // wrist velcro strap
    if (open) {
      // Finger separations
      px(ctx, x - 2, y - 5, 1, 3, pal.outlineSoft);
      px(ctx, x + 1, y - 5, 1, 3, pal.outlineSoft);
    }
  }

  private drawKeeperIdle(pal: SpritePalette, frame: number): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(64, 64);
    const shiftX = frame === 1 ? -2 : frame === 3 ? 2 : 0;
    const bobY = frame % 2 === 0 ? 0 : 2;
    const cx = 32 + shiftX;
    const ty = 23 + bobY;

    // Realistic ground shadow
    px(ctx, cx - 16, 57, 32, 4, 'rgba(0,0,0,0.38)');
    px(ctx, cx - 12, 56, 24, 6, 'rgba(0,0,0,0.22)');

    // Wide goalkeeper ready stance with athletic quadriceps & calves
    // Left leg
    pxClipped(ctx, txLeft(cx), ty + 18, 7, 6, pal.skinDark, pal.outline); // knee connection
    pxClipped(ctx, txLeft(cx) - 1, ty + 21, 8, 8, pal.socks, pal.outline); // sculpted calf
    px(ctx, txLeft(cx), ty + 22, 6, 2, pal.jerseyLight); // sock stripe
    pxClipped(ctx, txLeft(cx), ty + 28, 6, 3, pal.socksDark, pal.outline); // ankle
    pxClipped(ctx, txLeft(cx) - 2, ty + 30, 9, 4, pal.boots, pal.outline); // cleat
    px(ctx, txLeft(cx) - 1, ty + 31, 7, 2, pal.bootsLight);

    // Right leg
    pxClipped(ctx, txRight(cx), ty + 18, 7, 6, pal.skinDark, pal.outline);
    pxClipped(ctx, txRight(cx), ty + 21, 8, 8, pal.socks, pal.outline);
    px(ctx, txRight(cx) + 1, ty + 22, 6, 2, pal.jerseyLight);
    pxClipped(ctx, txRight(cx) + 1, ty + 28, 6, 3, pal.socksDark, pal.outline);
    pxClipped(ctx, txRight(cx), ty + 30, 9, 4, pal.boots, pal.outline);
    px(ctx, txRight(cx) + 1, ty + 31, 7, 2, pal.bootsLight);

    // Knee protector pads
    px(ctx, txLeft(cx) - 1, ty + 20, 8, 3, '#1e293b');
    px(ctx, txRight(cx), ty + 20, 8, 3, '#1e293b');

    // Goalkeeper Shorts with side vents
    pxClipped(ctx, cx - 11, ty + 12, 22, 8, pal.shorts, pal.outline);
    px(ctx, cx - 10, ty + 17, 20, 3, pal.shortsDark);
    px(ctx, cx - 1, ty + 14, 2, 6, pal.outlineSoft); // groin split

    // Muscular Goalkeeper Torso (chest grip pad, padded ribs, collar)
    pxClipped(ctx, cx - 11, ty - 1, 22, 15, pal.jersey, pal.outline);
    px(ctx, cx - 10, ty, 20, 3, pal.jerseyLight); // clavicle & chest highlight
    px(ctx, cx - 11, ty + 1, 3, 13, pal.jerseyShadow); // rib shadow
    px(ctx, cx + 8, ty + 1, 3, 13, pal.jerseyShadow);
    // Padded hexagonal chest impact zone
    pxClipped(ctx, cx - 6, ty + 3, 12, 8, pal.jerseyDark, pal.outlineSoft);
    px(ctx, cx - 4, ty + 4, 8, 6, pal.jersey);

    // Ready outstretched arms & heavy padded gloves
    pxClipped(ctx, cx - 19, ty + 1, 9, 6, pal.jersey, pal.outline);
    px(ctx, cx - 18, ty + 2, 6, 2, pal.jerseyLight);
    pxClipped(ctx, cx + 10, ty + 1, 9, 6, pal.jersey, pal.outline);
    px(ctx, cx + 12, ty + 2, 6, 2, pal.jerseyLight);

    this.drawGlove(ctx, pal, cx - 21, ty + 5 - (frame % 2));
    this.drawGlove(ctx, pal, cx + 21, ty + 5 - (frame % 2));

    this.drawKeeperHeadFront(ctx, pal, cx, ty - 13);
    return canvas;
  }

  private drawKeeperDiveLow(pal: SpritePalette, frame: number, flipRight: boolean): HTMLCanvasElement {
    const [raw, ctx] = createPixelCanvas(64, 64);

    // Realistic blurred turf slide shadow
    px(ctx, 6, 56, 50, 4, 'rgba(0,0,0,0.35)');
    px(ctx, 10, 55, 42, 6, 'rgba(0,0,0,0.18)');

    if (frame === 0) {
      // Explosive lateral crouch & spring load
      pxClipped(ctx, 24, 28, 18, 14, pal.jersey, pal.outline);
      px(ctx, 24, 29, 18, 3, pal.jerseyLight);
      pxClipped(ctx, 26, 40, 18, 8, pal.shorts, pal.outline);
      pxClipped(ctx, 28, 46, 7, 10, pal.socks, pal.outline);
      pxClipped(ctx, 39, 46, 7, 10, pal.socks, pal.outline);
      pxClipped(ctx, 26, 54, 9, 4, pal.boots, pal.outline);
      pxClipped(ctx, 40, 54, 9, 4, pal.boots, pal.outline);
      this.drawGlove(ctx, pal, 14, 34);
      this.drawGlove(ctx, pal, 18, 41);
      this.drawKeeperHeadFront(ctx, pal, 27, 16, true);
    } else {
      // Full horizontal fingertip extension save!
      const ext = frame === 2 ? -4 : 0;
      // Scissor legs trailing right with aerodynamic calf shape
      pxClipped(ctx, 42 + ext, 42, 14, 6, pal.socks, pal.outline);
      px(ctx, 43 + ext, 43, 12, 2, pal.jerseyLight);
      pxClipped(ctx, 45 + ext, 48, 13, 6, pal.socksDark, pal.outline);
      pxClipped(ctx, 55 + ext, 41, 6, 7, pal.boots, pal.outline);
      px(ctx, 56 + ext, 42, 4, 3, pal.bootsLight);
      pxClipped(ctx, 57 + ext, 47, 6, 7, pal.boots, pal.outline);

      // Shorts with hip rotation fold
      pxClipped(ctx, 33 + ext, 40, 12, 12, pal.shorts, pal.outline);
      px(ctx, 33 + ext, 46, 12, 4, pal.shortsDark);

      // Horizontal athletic torso
      pxClipped(ctx, 18 + ext, 37, 18, 13, pal.jersey, pal.outline);
      px(ctx, 18 + ext, 38, 18, 3, pal.jerseyLight);
      px(ctx, 20 + ext, 42, 12, 6, pal.jerseyDark);

      // Head locked on ball
      this.drawKeeperHeadFront(ctx, pal, 18 + ext, 27, true);

      // Fully outstretched arms & pro gloves touching turf/corner
      pxClipped(ctx, 8 + ext, 37, 13, 6, pal.jersey, pal.outline);
      px(ctx, 9 + ext, 38, 10, 2, pal.jerseyLight);
      pxClipped(ctx, 9 + ext, 43, 12, 6, pal.jerseyDark, pal.outline);
      this.drawGlove(ctx, pal, 5 + ext, 38);
      this.drawGlove(ctx, pal, 6 + ext, 46);
    }

    return flipRight ? this.flipHorizontal(raw) : raw;
  }

  private drawKeeperDiveHigh(pal: SpritePalette, frame: number, flipRight: boolean): HTMLCanvasElement {
    const [raw, ctx] = createPixelCanvas(64, 64);

    if (frame === 0) {
      // Explosive upward jump compression
      pxClipped(ctx, 23, 24, 18, 15, pal.jersey, pal.outline);
      px(ctx, 23, 25, 18, 3, pal.jerseyLight);
      pxClipped(ctx, 24, 37, 17, 8, pal.shorts, pal.outline);
      pxClipped(ctx, 25, 44, 7, 11, pal.socks, pal.outline);
      pxClipped(ctx, 35, 44, 7, 11, pal.socks, pal.outline);
      this.drawGlove(ctx, pal, 13, 20);
      this.drawGlove(ctx, pal, 21, 15);
      this.drawKeeperHeadFront(ctx, pal, 27, 12, true);
    } else {
      // Diagonal mid-air superman dive toward top corner!
      const lift = frame === 2 ? -4 : 0;
      // Soft mid-air shadow below
      px(ctx, 14, 58, 32, 3, 'rgba(0,0,0,0.24)');

      // Trailing dynamic legs
      pxClipped(ctx, 39, 36 + lift, 13, 7, pal.socks, pal.outline);
      px(ctx, 40, 37 + lift, 11, 2, pal.jerseyLight);
      pxClipped(ctx, 37, 43 + lift, 12, 7, pal.socksDark, pal.outline);
      pxClipped(ctx, 51, 38 + lift, 6, 7, pal.boots, pal.outline);
      pxClipped(ctx, 48, 45 + lift, 6, 7, pal.boots, pal.outline);

      // Shorts angled upward
      pxClipped(ctx, 30, 31 + lift, 13, 11, pal.shorts, pal.outline);
      px(ctx, 32, 36 + lift, 11, 4, pal.shortsDark);

      // Diagonal athletic torso
      pxClipped(ctx, 18, 23 + lift, 17, 14, pal.jersey, pal.outline);
      px(ctx, 18, 24 + lift, 17, 3, pal.jerseyLight);
      px(ctx, 20, 28 + lift, 11, 6, pal.jerseyDark);

      // Focused head
      this.drawKeeperHeadFront(ctx, pal, 21, 12 + lift, true);

      // Reaching outstretched arms & giant glove tip
      pxClipped(ctx, 8, 15 + lift, 13, 6, pal.jersey, pal.outline);
      px(ctx, 9, 16 + lift, 10, 2, pal.jerseyLight);
      pxClipped(ctx, 11, 22 + lift, 11, 6, pal.jerseyDark, pal.outline);
      this.drawGlove(ctx, pal, 5, 13 + lift);
      this.drawGlove(ctx, pal, 8, 22 + lift);
    }

    return flipRight ? this.flipHorizontal(raw) : raw;
  }

  private drawKeeperCatchCenter(pal: SpritePalette, frame: number): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(64, 64);
    const cx = 32;
    const ty = 22 + frame;

    px(ctx, cx - 14, 57, 28, 4, 'rgba(0,0,0,0.35)');
    pxClipped(ctx, cx - 9, ty + 18, 7, 11, pal.socks, pal.outline);
    pxClipped(ctx, cx + 3, ty + 18, 7, 11, pal.socks, pal.outline);
    pxClipped(ctx, cx - 10, ty + 28, 8, 5, pal.boots, pal.outline);
    pxClipped(ctx, cx + 3, ty + 28, 8, 5, pal.boots, pal.outline);
    pxClipped(ctx, cx - 10, ty + 12, 20, 8, pal.shorts, pal.outline);
    pxClipped(ctx, cx - 10, ty - 1, 20, 15, pal.jersey, pal.outline);
    this.drawKeeperHeadFront(ctx, pal, cx, ty - 13, true);

    // Both gloves firmly clasped around ball at chest level!
    this.drawGlove(ctx, pal, cx - 5, ty + 6);
    this.drawGlove(ctx, pal, cx + 5, ty + 6);
    return canvas;
  }

  private drawKeeperReaction(pal: SpritePalette, frame: number, win: boolean): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(64, 64);
    const cx = 32;
    const ty = win ? (frame % 2 === 1 ? 19 : 23) : 31;

    px(ctx, cx - 14, 57, 28, 4, 'rgba(0,0,0,0.35)');

    if (win) {
      pxClipped(ctx, cx - 9, ty + 18, 7, 11, pal.socks, pal.outline);
      pxClipped(ctx, cx + 3, ty + 18, 7, 11, pal.socks, pal.outline);
      pxClipped(ctx, cx - 10, ty + 28, 8, 5, pal.boots, pal.outline);
      pxClipped(ctx, cx + 3, ty + 28, 8, 5, pal.boots, pal.outline);
      pxClipped(ctx, cx - 10, ty + 12, 20, 8, pal.shorts, pal.outline);
      pxClipped(ctx, cx - 10, ty - 1, 20, 15, pal.jersey, pal.outline);
      // Victory fists pump high!
      pxClipped(ctx, cx - 16, ty - 7, 7, 11, pal.jersey, pal.outline);
      pxClipped(ctx, cx + 9, ty - 7, 7, 11, pal.jersey, pal.outline);
      this.drawGlove(ctx, pal, cx - 15, ty - 10, false);
      this.drawGlove(ctx, pal, cx + 15, ty - 10, false);
      this.drawKeeperHeadFront(ctx, pal, cx, ty - 13, true);
    } else {
      // Slumped on knees in defeat
      pxClipped(ctx, cx - 11, 47, 22, 9, pal.shorts, pal.outline);
      pxClipped(ctx, cx - 10, 34, 20, 15, pal.jersey, pal.outline);
      this.drawGlove(ctx, pal, cx - 13, 52, true);
      this.drawGlove(ctx, pal, cx + 13, 52, true);
      this.drawKeeperHeadFront(ctx, pal, cx, 24, false);
    }
    return canvas;
  }

  private drawKeeperTaunt(pal: SpritePalette, frame: number): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(64, 64);
    const cx = 32;
    const ty = 22 + (frame % 2 === 0 ? 0 : 2);

    px(ctx, cx - 14, 57, 28, 4, 'rgba(0,0,0,0.35)');

    // Wiggle dance legs with athletic musculature
    const legShift = frame === 0 ? -2 : frame === 2 ? 2 : 0;
    pxClipped(ctx, cx - 10 + legShift, ty + 18, 7, 11, pal.socks, pal.outline);
    pxClipped(ctx, cx + 4 - legShift, ty + 18, 7, 11, pal.socks, pal.outline);
    pxClipped(ctx, cx - 11 + legShift, ty + 28, 8, 5, pal.boots, pal.outline);
    pxClipped(ctx, cx + 4 - legShift, ty + 28, 8, 5, pal.boots, pal.outline);
    pxClipped(ctx, cx - 10, ty + 12, 20, 8, pal.shorts, pal.outline);
    pxClipped(ctx, cx - 10, ty - 1, 20, 15, pal.jersey, pal.outline);

    // Finger wag / Shhh taunt or dancing arms!
    if (frame % 2 === 0) {
      // Left glove on hip, right glove pointing finger up (finger-wag!)
      pxClipped(ctx, cx - 15, ty + 3, 7, 9, pal.jersey, pal.outline);
      this.drawGlove(ctx, pal, cx - 13, ty + 11, false);
      pxClipped(ctx, cx + 9, ty - 7, 7, 12, pal.jersey, pal.outline);
      this.drawGlove(ctx, pal, cx + 14, ty - 11, false);
      // Index finger sticking up
      px(ctx, cx + 14, ty - 16, 2, 5, pal.glove);
    } else {
      // Arms waving side to side
      pxClipped(ctx, cx - 16, ty - 3, 7, 10, pal.jersey, pal.outline);
      pxClipped(ctx, cx + 9, ty + 3, 7, 10, pal.jersey, pal.outline);
      this.drawGlove(ctx, pal, cx - 16, ty - 6, true);
      this.drawGlove(ctx, pal, cx + 15, ty + 12, true);
    }

    this.drawKeeperHeadFront(ctx, pal, cx, ty - 13, true);
    return canvas;
  }

  private flipHorizontal(src: HTMLCanvasElement): HTMLCanvasElement {
    const [dst, ctx] = createPixelCanvas(src.width, src.height);
    ctx.translate(src.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return dst;
  }

  // =========================================================================
  // PIXEL SOCCER BALLS (24x24, 4 ROTATION FRAMES)
  // =========================================================================
  private buildBallSprites(): HTMLCanvasElement[] {
    return [0, 1, 2, 3].map((frame) => {
      const [c, ctx] = createPixelCanvas(24, 24);
      const r = 9;
      const cx = 12;
      const cy = 12;

      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          const d2 = x * x + y * y;
          if (d2 <= r * r) {
            if (d2 >= (r - 1.3) * (r - 1.3)) {
              px(ctx, cx + x, cy + y, 1, 1, '#0f172a');
            } else {
              // Classic pentagon patches rotating by frame
              const sx = x + frame * 3;
              const sy = y + frame * 2;
              const patch =
                ((Math.floor((sx + 12) / 5) + Math.floor((sy + 12) / 5)) % 3 === 0) &&
                (Math.abs((sx + 12) % 5 - 2) <= 1.5 && Math.abs((sy + 12) % 5 - 2) <= 1.5);

              if (patch) {
                px(ctx, cx + x, cy + y, 1, 1, '#1e293b');
              } else if (x + y > 5) {
                px(ctx, cx + x, cy + y, 1, 1, '#cbd5e1');
              } else if (x + y < -5) {
                px(ctx, cx + x, cy + y, 1, 1, '#ffffff');
              } else {
                px(ctx, cx + x, cy + y, 1, 1, '#f1f5f9');
              }
            }
          }
        }
      }
      return c;
    });
  }

  // =========================================================================
  // ICE BARRIER CRYSTAL PIXEL SPRITE (56x52)
  // =========================================================================
  private buildIceBarrierSprite(): HTMLCanvasElement {
    const [c, ctx] = createPixelCanvas(56, 52);
    const cols = [
      { x: 4, w: 10, h: 32 },
      { x: 13, w: 12, h: 44 },
      { x: 24, w: 13, h: 48 },
      { x: 36, w: 11, h: 39 },
      { x: 45, w: 8, h: 27 },
    ];
    for (const spire of cols) {
      const topY = 50 - spire.h;
      pxOutlined(ctx, spire.x, topY + 5, spire.w, spire.h - 5, '#38bdf8', '#0c4a6e');
      // Pointed crystal peak
      pxOutlined(ctx, spire.x + 2, topY, spire.w - 4, 6, '#bae6fd', '#0c4a6e');
      // Specular facet highlight
      px(ctx, spire.x + 2, topY + 6, 3, spire.h - 10, '#e0f2fe');
      px(ctx, spire.x + spire.w - 3, topY + 8, 2, spire.h - 10, '#0284c7');
    }
    return c;
  }

  // =========================================================================
  // STADIUM PIXEL BACKDROP (480x270)
  // =========================================================================
  private buildStadiumBackdrop(): HTMLCanvasElement {
    const [c, ctx] = createPixelCanvas(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Night sky bands (16-bit color banding)
    const skyBands = ['#060818', '#0a1029', '#111c42', '#17285c', '#1e3a8a'];
    skyBands.forEach((col, i) => {
      px(ctx, 0, i * 16, VIRTUAL_WIDTH, 17, col);
    });

    // Stars
    for (let i = 0; i < 45; i++) {
      const sx = (i * 97 + 13) % VIRTUAL_WIDTH;
      const sy = (i * 41 + 7) % 58;
      px(ctx, sx, sy, 1, 1, i % 3 === 0 ? '#fef08a' : '#94a3b8');
    }

    // Floodlight towers left & right
    const drawTower = (tx: number) => {
      px(ctx, tx + 8, 16, 6, 48, '#1e293b');
      pxOutlined(ctx, tx, 8, 22, 12, '#334155', '#0f172a');
      for (let lx = 2; lx < 20; lx += 5) {
        px(ctx, tx + lx, 10, 3, 3, '#fef9c3');
        px(ctx, tx + lx, 15, 3, 3, '#fde047');
      }
    };
    drawTower(34);
    drawTower(VIRTUAL_WIDTH - 56);

    // Stadium tiered roof & stands
    px(ctx, 0, 56, VIRTUAL_WIDTH, 66, '#0f172a');
    px(ctx, 0, 54, VIRTUAL_WIDTH, 3, '#334155');

    // Pixel crowd dots in stands
    const crowdColors = ['#ef4444', '#3b82f6', '#facc15', '#f8fafc', '#22c55e', '#a855f7', '#fb923c'];
    for (let row = 0; row < 11; row++) {
      const y = 62 + row * 5;
      px(ctx, 0, y + 3, VIRTUAL_WIDTH, 2, '#090d1a');
      for (let x = 4; x < VIRTUAL_WIDTH - 4; x += 4) {
        const seed = (x * 17 + row * 31) % crowdColors.length;
        px(ctx, x, y, 2, 3, crowdColors[seed]);
      }
    }

    // Advertising LED boards along field perimeter
    const adY = 117;
    px(ctx, 0, adY, VIRTUAL_WIDTH, 11, '#090d1a');
    for (let x = 0; x < VIRTUAL_WIDTH; x += 60) {
      const isBlue = (x / 60) % 2 === 0;
      px(ctx, x + 2, adY + 2, 56, 7, isBlue ? '#1d4ed8' : '#b91c1c');
      px(ctx, x + 8, adY + 4, 44, 3, isBlue ? '#93c5fd' : '#fde047');
    }

    // Perspective striped turf field (y: 128 .. 270)
    const horizonY = 128;
    const fieldH = VIRTUAL_HEIGHT - horizonY;
    for (let py = 0; py < fieldH; py++) {
      const y = horizonY + py;
      const stripe = Math.floor(Math.pow(py / fieldH, 0.78) * 10) % 2 === 0;
      ctx.fillStyle = stripe ? '#15803d' : '#166534';
      ctx.fillRect(0, y, VIRTUAL_WIDTH, 1);
    }

    // Perspective penalty box white pixel lines
    ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
    // Goal line
    px(ctx, 0, 132, VIRTUAL_WIDTH, 2, 'rgba(248, 250, 252, 0.85)');
    // 6-yard box
    this.drawPixelLine(ctx, 145, 132, 112, 162, 'rgba(248, 250, 252, 0.65)');
    this.drawPixelLine(ctx, 335, 132, 368, 162, 'rgba(248, 250, 252, 0.65)');
    px(ctx, 112, 162, 256, 2, 'rgba(248, 250, 252, 0.65)');

    // 18-yard penalty box lines flaring out toward camera
    this.drawPixelLine(ctx, 68, 132, -20, 252, 'rgba(248, 250, 252, 0.7)');
    this.drawPixelLine(ctx, 412, 132, 500, 252, 'rgba(248, 250, 252, 0.7)');

    // Penalty spot (where ball rests)
    px(ctx, 236, 217, 8, 3, '#f8fafc');
    px(ctx, 238, 216, 4, 5, '#f8fafc');

    return c;
  }

  public drawPixelLine(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      ctx.fillRect(ix0, iy0, 2, 1);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        ix0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  // =========================================================================
  // DYNAMIC GOALPOST & REACTIVE PIXEL NET
  // =========================================================================
  public drawGoalAndNet(
    ctx: CanvasRenderingContext2D,
    goal: GoalRect,
    bulgeX: number,
    bulgeY: number,
    bulgeStrength: number
  ): void {
    const depth = 16;
    const innerLeft = goal.left + depth;
    const innerRight = goal.right - depth;
    const innerTop = goal.top + 10;
    const innerBottom = goal.bottom - 5;

    // Back ground shadow inside goal
    px(ctx, goal.left, goal.bottom - 4, goal.width, 5, 'rgba(0,0,0,0.32)');

    // Back stanchions (dark steel)
    this.drawPixelLine(ctx, goal.left, goal.top, innerLeft, innerTop, '#475569');
    this.drawPixelLine(ctx, goal.right, goal.top, innerRight, innerTop, '#475569');
    this.drawPixelLine(ctx, goal.left, goal.bottom, innerLeft, innerBottom, '#334155');
    this.drawPixelLine(ctx, goal.right, goal.bottom, innerRight, innerBottom, '#334155');
    px(ctx, innerLeft, innerTop, innerRight - innerLeft, 2, '#475569');
    px(ctx, innerLeft, innerBottom, innerRight - innerLeft, 1, '#334155');

    // Reactive pixel net mesh!
    ctx.fillStyle = 'rgba(226, 232, 240, 0.42)';
    const cols = 24;
    const rows = 11;

    const getNetNode = (c: number, r: number): [number, number] => {
      const u = c / cols;
      const v = r / rows;
      let nx = innerLeft + (innerRight - innerLeft) * u;
      let ny = innerTop + (innerBottom - innerTop) * v;

      if (bulgeStrength > 0.01) {
        const dx = nx - bulgeX;
        const dy = ny - bulgeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.max(0, 1 - dist / 65) * bulgeStrength;
        nx += (dx * 0.14) * pull;
        ny -= 7 * pull;
      }
      return [Math.round(nx), Math.round(ny)];
    };

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const [x, y] = getNetNode(c, r);
        if (c < cols) {
          const [nx, ny] = getNetNode(c + 1, r);
          this.drawThinNetSegment(ctx, x, y, nx, ny);
        }
        if (r < rows) {
          const [nx, ny] = getNetNode(c, r + 1);
          this.drawThinNetSegment(ctx, x, y, nx, ny);
        }
      }
    }

    // Side net webbing
    for (let r = 1; r < rows; r += 2) {
      const v = r / rows;
      this.drawThinNetSegment(
        ctx,
        goal.left,
        goal.top + goal.height * v,
        innerLeft,
        innerTop + (innerBottom - innerTop) * v
      );
      this.drawThinNetSegment(
        ctx,
        goal.right,
        goal.top + goal.height * v,
        innerRight,
        innerTop + (innerBottom - innerTop) * v
      );
    }

    // Thick pixel Goalposts & Crossbar (Front Layer)
    // Left post
    pxOutlined(ctx, goal.left - 3, goal.top - 3, 5, goal.height + 4, '#f8fafc', '#0f172a');
    px(ctx, goal.left, goal.top - 2, 2, goal.height + 2, '#cbd5e1');
    // Right post
    pxOutlined(ctx, goal.right - 2, goal.top - 3, 5, goal.height + 4, '#f8fafc', '#0f172a');
    px(ctx, goal.right + 1, goal.top - 2, 2, goal.height + 2, '#cbd5e1');
    // Crossbar
    pxOutlined(ctx, goal.left - 3, goal.top - 4, goal.width + 6, 5, '#ffffff', '#0f172a');
    px(ctx, goal.left - 2, goal.top - 1, goal.width + 4, 2, '#cbd5e1');
  }

  private drawThinNetSegment(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    if (steps === 0) return;
    for (let i = 0; i <= steps; i += 2) {
      const t = i / steps;
      ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1);
    }
  }
}
