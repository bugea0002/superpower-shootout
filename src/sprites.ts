import { GoalRect, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './types';

export interface SpritePalette {
  outline: string;
  skin: string;
  skinDark: string;
  hair: string;
  hairLight: string;
  band: string;
  jersey: string;
  jerseyDark: string;
  jerseyLight: string;
  number: string;
  shorts: string;
  shortsDark: string;
  socks: string;
  boots: string;
  glove: string;
  gloveLight: string;
}

const BLUE_TEAM_KICKER: SpritePalette = {
  outline: '#0b1021',
  skin: '#f6c39b',
  skinDark: '#d4956a',
  hair: '#1e293b',
  hairLight: '#475569',
  band: '#ef4444',
  jersey: '#2563eb',
  jerseyDark: '#1d4ed8',
  jerseyLight: '#60a5fa',
  number: '#f8fafc',
  shorts: '#f8fafc',
  shortsDark: '#cbd5e1',
  socks: '#1d4ed8',
  boots: '#facc15',
  glove: '#22c55e',
  gloveLight: '#86efac',
};

const RED_TEAM_KICKER: SpritePalette = {
  outline: '#0b1021',
  skin: '#f2b88f',
  skinDark: '#c9885d',
  hair: '#31102f',
  hairLight: '#701a75',
  band: '#facc15',
  jersey: '#dc2626',
  jerseyDark: '#991b1b',
  jerseyLight: '#f87171',
  number: '#fef08a',
  shorts: '#1e293b',
  shortsDark: '#0f172a',
  socks: '#dc2626',
  boots: '#38bdf8',
  glove: '#f97316',
  gloveLight: '#fdba74',
};

const BLUE_TEAM_KEEPER: SpritePalette = {
  ...BLUE_TEAM_KICKER,
  jersey: '#059669',
  jerseyDark: '#065f46',
  jerseyLight: '#34d399',
  shorts: '#0f172a',
  shortsDark: '#020617',
  glove: '#38bdf8',
  gloveLight: '#bae6fd',
};

const RED_TEAM_KEEPER: SpritePalette = {
  ...RED_TEAM_KICKER,
  jersey: '#ea580c',
  jerseyDark: '#9a3412',
  jerseyLight: '#fb923c',
  shorts: '#1e1b4b',
  shortsDark: '#0f172a',
  glove: '#facc15',
  gloveLight: '#fef08a',
};

function createPixelCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
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
  px(ctx, x - 1, y, w + 2, h, outline);
  px(ctx, x, y - 1, w, h + 2, outline);
  px(ctx, x, y, w, h, fill);
}

export type KickerAnimKey = 'idle' | 'charge' | 'runup' | 'kick' | 'celebrate' | 'despair';
export type KeeperAnimKey =
  | 'idle'
  | 'dive_low_left'
  | 'dive_low_right'
  | 'dive_top_left'
  | 'dive_top_right'
  | 'catch_center'
  | 'celebrate'
  | 'despair';

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
    const celebrate = [0, 1].map((f) => this.drawKickerBackFrame(pal, 'celebrate', f));
    const despair = [0, 1].map((f) => this.drawKickerBackFrame(pal, 'despair', f));
    return { idle, charge, runup, kick, celebrate, despair };
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
    let leftArmMode: 'down' | 'wide' | 'up' | 'forward' = 'down';
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
      bobY = frame === 1 ? -6 : -1;
      leftArmMode = 'up';
      rightArmMode = 'up';
    } else if (anim === 'despair') {
      kneeling = true;
      bobY = 9;
    }

    const tx = cx + torsoTiltX;
    const ty = 24 + bobY;

    // ---------------- LEGS (drawn behind shorts) ----------------
    if (kneeling) {
      // Kneeling legs on turf
      pxOutlined(ctx, tx - 11, 56, 8, 12, pal.socks, pal.outline);
      pxOutlined(ctx, tx + 3, 56, 8, 12, pal.socks, pal.outline);
      pxOutlined(ctx, tx - 13, 66, 9, 5, pal.boots, pal.outline);
      pxOutlined(ctx, tx + 4, 66, 9, 5, pal.boots, pal.outline);
    } else if (rightKickStage >= 0) {
      // Planted left leg
      pxOutlined(ctx, tx - 11, 51 + bobY, 7, 9, pal.skinDark, pal.outline);
      pxOutlined(ctx, tx - 11, 58 + bobY, 7, 10, pal.socks, pal.outline);
      px(ctx, tx - 11, 59 + bobY, 7, 2, pal.jerseyLight);
      pxOutlined(ctx, tx - 12, 67 + bobY, 9, 5, pal.boots, pal.outline);
      // Studs
      px(ctx, tx - 11, 72 + bobY, 2, 2, '#f8fafc');
      px(ctx, tx - 6, 72 + bobY, 2, 2, '#f8fafc');

      // Dynamic kicking right leg
      if (rightKickStage === 0) {
        // Cocked back toward camera (foreshortened big boot!)
        pxOutlined(ctx, tx + 4, 48, 9, 10, pal.skin, pal.outline);
        pxOutlined(ctx, tx + 5, 52, 10, 11, pal.socks, pal.outline);
        pxOutlined(ctx, tx + 4, 57, 12, 9, pal.boots, pal.outline);
        // Sole studs facing camera
        px(ctx, tx + 6, 59, 2, 2, '#0f172a');
        px(ctx, tx + 12, 59, 2, 2, '#0f172a');
        px(ctx, tx + 6, 63, 2, 2, '#0f172a');
        px(ctx, tx + 12, 63, 2, 2, '#0f172a');
      } else if (rightKickStage === 1) {
        // Mid-swing blur arc
        px(ctx, tx + 8, 49, 14, 12, 'rgba(255,255,255,0.45)');
        pxOutlined(ctx, tx + 5, 48, 10, 8, pal.skin, pal.outline);
        pxOutlined(ctx, tx + 10, 45, 9, 8, pal.socks, pal.outline);
        pxOutlined(ctx, tx + 16, 42, 10, 6, pal.boots, pal.outline);
      } else if (rightKickStage === 2) {
        // Impact forward into ball
        pxOutlined(ctx, tx + 3, 46, 8, 10, pal.skin, pal.outline);
        pxOutlined(ctx, tx + 4, 41, 8, 8, pal.socks, pal.outline);
        pxOutlined(ctx, tx + 5, 36, 9, 6, pal.boots, pal.outline);
      } else {
        // High follow-through leg extended forward-up
        pxOutlined(ctx, tx + 4, 42, 8, 9, pal.skin, pal.outline);
        pxOutlined(ctx, tx + 7, 35, 8, 9, pal.socks, pal.outline);
        pxOutlined(ctx, tx + 9, 29, 10, 6, pal.boots, pal.outline);
      }
    } else {
      // Standard two legs (idle / charge / runup / celebrate)
      const ly = 51 + bobY + leftLegY;
      const ry = 51 + bobY + rightLegY;

      // Left calf & sock & boot
      pxOutlined(ctx, tx - 10, ly, 7, 7, pal.skin, pal.outline);
      px(ctx, tx - 10, ly, 2, 7, pal.skinDark);
      pxOutlined(ctx, tx - 10, ly + 6, 7, 10, pal.socks, pal.outline);
      px(ctx, tx - 10, ly + 7, 7, 2, pal.number);
      pxOutlined(ctx, tx - 11, ly + 15, 8, 5, pal.boots, pal.outline);

      // Right calf & sock & boot
      pxOutlined(ctx, tx + 3, ry, 7, 7, pal.skin, pal.outline);
      px(ctx, tx + 8, ry, 2, 7, pal.skinDark);
      pxOutlined(ctx, tx + 3, ry + 6, 7, 10, pal.socks, pal.outline);
      px(ctx, tx + 3, ry + 7, 7, 2, pal.number);
      pxOutlined(ctx, tx + 3, ry + 15, 8, 5, pal.boots, pal.outline);
    }

    // ---------------- SHORTS ----------------
    const shortsY = ty + 20;
    pxOutlined(ctx, tx - 12, shortsY, 24, 9, pal.shorts, pal.outline);
    px(ctx, tx - 12, shortsY + 6, 24, 3, pal.shortsDark);
    px(ctx, tx - 1, shortsY + 4, 2, 5, pal.outline); // leg split

    // ---------------- ARMS ----------------
    // Left arm
    if (kneeling) {
      pxOutlined(ctx, tx - 15, ty + 2, 5, 11, pal.jersey, pal.outline);
      pxOutlined(ctx, tx - 13, ty - 4, 5, 8, pal.skin, pal.outline);
    } else if (leftArmMode === 'down') {
      pxOutlined(ctx, tx - 17, ty + 3, 5, 8, pal.jersey, pal.outline);
      pxOutlined(ctx, tx - 17, ty + 11, 5, 9, pal.skin, pal.outline);
    } else if (leftArmMode === 'wide') {
      pxOutlined(ctx, tx - 21, ty + 2, 9, 6, pal.jersey, pal.outline);
      pxOutlined(ctx, tx - 27, ty + 4, 7, 5, pal.skin, pal.outline);
    } else if (leftArmMode === 'up') {
      pxOutlined(ctx, tx - 18, ty - 2, 6, 8, pal.jersey, pal.outline);
      pxOutlined(ctx, tx - 20, ty - 11, 5, 10, pal.skin, pal.outline);
    } else if (leftArmMode === 'forward') {
      pxOutlined(ctx, tx - 17, ty + 1, 5, 9, pal.jerseyDark, pal.outline);
      pxOutlined(ctx, tx - 16, ty - 4, 4, 6, pal.skinDark, pal.outline);
    }

    // Right arm
    if (kneeling) {
      pxOutlined(ctx, tx + 10, ty + 2, 5, 11, pal.jersey, pal.outline);
      pxOutlined(ctx, tx + 8, ty - 4, 5, 8, pal.skin, pal.outline);
    } else if (rightArmMode === 'down') {
      pxOutlined(ctx, tx + 12, ty + 3, 5, 8, pal.jersey, pal.outline);
      pxOutlined(ctx, tx + 12, ty + 11, 5, 9, pal.skin, pal.outline);
    } else if (rightArmMode === 'wide') {
      pxOutlined(ctx, tx + 12, ty + 2, 9, 6, pal.jersey, pal.outline);
      pxOutlined(ctx, tx + 20, ty + 4, 7, 5, pal.skin, pal.outline);
    } else if (rightArmMode === 'up') {
      pxOutlined(ctx, tx + 12, ty - 2, 6, 8, pal.jersey, pal.outline);
      pxOutlined(ctx, tx + 15, ty - 11, 5, 10, pal.skin, pal.outline);
    } else if (rightArmMode === 'back') {
      pxOutlined(ctx, tx + 12, ty + 4, 7, 7, pal.jersey, pal.outline);
      pxOutlined(ctx, tx + 16, ty + 10, 6, 8, pal.skin, pal.outline);
    }

    // ---------------- TORSO / JERSEY BACK ----------------
    pxOutlined(ctx, tx - 13, ty + 1, 26, 20, pal.jersey, pal.outline);
    // Side shading & shoulder trim
    px(ctx, tx - 13, ty + 1, 4, 20, pal.jerseyDark);
    px(ctx, tx + 10, ty + 1, 3, 20, pal.jerseyDark);
    px(ctx, tx - 13, ty + 1, 26, 3, pal.jerseyLight);
    // Collar
    px(ctx, tx - 6, ty, 12, 2, pal.number);

    // Pixel Back Number "10"
    const nx = tx - 6;
    const ny = ty + 6;
    // "1"
    px(ctx, nx + 1, ny, 3, 10, pal.number);
    px(ctx, nx, ny + 1, 1, 2, pal.number);
    // "0"
    px(ctx, nx + 6, ny, 6, 10, pal.number);
    px(ctx, nx + 8, ny + 2, 2, 6, pal.jersey);

    // ---------------- HEAD & SPIKY ANIME HAIR (BACK VIEW) ----------------
    const hy = ty - 15 + (kneeling ? 3 : 0);
    // Neck
    px(ctx, tx - 4, ty - 2, 8, 3, pal.skinDark);

    // Ears
    pxOutlined(ctx, tx - 10, hy + 7, 2, 4, pal.skin, pal.outline);
    pxOutlined(ctx, tx + 8, hy + 7, 2, 4, pal.skin, pal.outline);

    // Back of hair base
    pxOutlined(ctx, tx - 9, hy + 1, 18, 13, pal.hair, pal.outline);
    // Anime spikes!
    pxOutlined(ctx, tx - 12, hy + 3, 4, 4, pal.hair, pal.outline);
    pxOutlined(ctx, tx + 8, hy + 3, 4, 4, pal.hair, pal.outline);
    pxOutlined(ctx, tx - 7, hy - 2, 6, 4, pal.hair, pal.outline);
    pxOutlined(ctx, tx + 1, hy - 3, 6, 5, pal.hair, pal.outline);
    // Hair highlight pixels
    px(ctx, tx - 5, hy + 2, 4, 2, pal.hairLight);
    px(ctx, tx + 2, hy + 1, 4, 2, pal.hairLight);

    // Flowing Hero Headband + Tails!
    px(ctx, tx - 9, hy + 7, 18, 3, pal.band);
    const wave = frame % 2 === 0 ? 0 : 2;
    // Knot & flowing tails
    pxOutlined(ctx, tx + 2, hy + 8, 4, 4, pal.band, pal.outline);
    pxOutlined(ctx, tx + 6, hy + 9 + wave, 8, 3, pal.band, pal.outline);
    pxOutlined(ctx, tx + 4, hy + 12 - wave, 7, 2, pal.band, pal.outline);

    return canvas;
  }

  // =========================================================================
  // GOALKEEPER SPRITES (64x64, FRONT-VIEW PIXEL ART)
  // =========================================================================
  private buildKeeperSprites(pal: SpritePalette): Record<KeeperAnimKey, HTMLCanvasElement[]> {
    return {
      idle: [0, 1, 2, 3].map((f) => this.drawKeeperIdle(pal, f)),
      dive_low_left: [0, 1, 2].map((f) => this.drawKeeperDiveLow(pal, f, false)),
      dive_low_right: [0, 1, 2].map((f) => this.drawKeeperDiveLow(pal, f, true)),
      dive_top_left: [0, 1, 2].map((f) => this.drawKeeperDiveHigh(pal, f, false)),
      dive_top_right: [0, 1, 2].map((f) => this.drawKeeperDiveHigh(pal, f, true)),
      catch_center: [0, 1].map((f) => this.drawKeeperCatchCenter(pal, f)),
      celebrate: [0, 1].map((f) => this.drawKeeperReaction(pal, f, true)),
      despair: [0, 1].map((f) => this.drawKeeperReaction(pal, f, false)),
    };
  }

  private drawKeeperHeadFront(ctx: CanvasRenderingContext2D, pal: SpritePalette, cx: number, hy: number, shout = false): void {
    // Hair back spikes
    pxOutlined(ctx, cx - 7, hy - 2, 14, 6, pal.hair, pal.outline);
    pxOutlined(ctx, cx - 9, hy + 1, 3, 4, pal.hair, pal.outline);
    pxOutlined(ctx, cx + 6, hy + 1, 3, 4, pal.hair, pal.outline);
    // Face
    pxOutlined(ctx, cx - 6, hy + 2, 12, 10, pal.skin, pal.outline);
    px(ctx, cx - 6, hy + 9, 12, 3, pal.skinDark);
    // Headband
    px(ctx, cx - 6, hy + 2, 12, 2, pal.band);
    // Fierce eyes
    px(ctx, cx - 4, hy + 5, 3, 2, '#0f172a');
    px(ctx, cx + 1, hy + 5, 3, 2, '#0f172a');
    px(ctx, cx - 4, hy + 5, 1, 1, '#ffffff');
    px(ctx, cx + 1, hy + 5, 1, 1, '#ffffff');
    // Mouth
    if (shout) {
      px(ctx, cx - 2, hy + 8, 4, 3, '#7f1d1d');
    } else {
      px(ctx, cx - 2, hy + 9, 4, 1, '#7c2d12');
    }
  }

  private drawGlove(ctx: CanvasRenderingContext2D, pal: SpritePalette, x: number, y: number): void {
    pxOutlined(ctx, x - 4, y - 4, 8, 8, pal.glove, pal.outline);
    px(ctx, x - 3, y - 3, 5, 4, pal.gloveLight);
  }

  private drawKeeperIdle(pal: SpritePalette, frame: number): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(64, 64);
    const shiftX = frame === 1 ? -2 : frame === 3 ? 2 : 0;
    const bobY = frame % 2 === 0 ? 0 : 2;
    const cx = 32 + shiftX;
    const ty = 24 + bobY;

    // Shadow
    px(ctx, cx - 14, 57, 28, 4, 'rgba(0,0,0,0.35)');

    // Wide goalkeeper ready stance legs
    pxOutlined(ctx, cx - 11, ty + 19, 6, 11, pal.socks, pal.outline);
    pxOutlined(ctx, cx + 5, ty + 19, 6, 11, pal.socks, pal.outline);
    // Knee pads
    px(ctx, cx - 11, ty + 20, 6, 3, '#1e293b');
    px(ctx, cx + 5, ty + 20, 6, 3, '#1e293b');
    // Boots
    pxOutlined(ctx, cx - 13, ty + 29, 7, 4, pal.boots, pal.outline);
    pxOutlined(ctx, cx + 6, ty + 29, 7, 4, pal.boots, pal.outline);

    // Shorts
    pxOutlined(ctx, cx - 10, ty + 13, 20, 7, pal.shorts, pal.outline);

    // Torso
    pxOutlined(ctx, cx - 9, ty, 18, 14, pal.jersey, pal.outline);
    px(ctx, cx - 9, ty, 18, 3, pal.jerseyLight);
    px(ctx, cx - 4, ty + 4, 8, 6, pal.jerseyDark); // chest grip pad

    // Outstretched ready arms + big gloves
    pxOutlined(ctx, cx - 17, ty + 2, 8, 5, pal.jersey, pal.outline);
    pxOutlined(ctx, cx + 9, ty + 2, 8, 5, pal.jersey, pal.outline);
    this.drawGlove(ctx, pal, cx - 19, ty + 5 - (frame % 2));
    this.drawGlove(ctx, pal, cx + 19, ty + 5 - (frame % 2));

    this.drawKeeperHeadFront(ctx, pal, cx, ty - 12);
    return canvas;
  }

  private drawKeeperDiveLow(pal: SpritePalette, frame: number, flipRight: boolean): HTMLCanvasElement {
    const [raw, ctx] = createPixelCanvas(64, 64);

    // Draw diving to the LEFT in local space, flip horizontally if flipRight
    px(ctx, 8, 56, 46, 4, 'rgba(0,0,0,0.3)');

    if (frame === 0) {
      // Crouch & lean left
      pxOutlined(ctx, 26, 30, 16, 13, pal.jersey, pal.outline);
      pxOutlined(ctx, 28, 42, 16, 7, pal.shorts, pal.outline);
      pxOutlined(ctx, 30, 48, 6, 9, pal.socks, pal.outline);
      pxOutlined(ctx, 40, 48, 6, 9, pal.socks, pal.outline);
      this.drawGlove(ctx, pal, 16, 36);
      this.drawGlove(ctx, pal, 20, 42);
      this.drawKeeperHeadFront(ctx, pal, 28, 18, true);
    } else {
      // Full horizontal stretch save!
      const ext = frame === 2 ? -3 : 0;
      // Legs trailing right
      pxOutlined(ctx, 42 + ext, 43, 14, 5, pal.socks, pal.outline);
      pxOutlined(ctx, 44 + ext, 49, 13, 5, pal.socks, pal.outline);
      pxOutlined(ctx, 55 + ext, 42, 5, 6, pal.boots, pal.outline);
      pxOutlined(ctx, 56 + ext, 48, 5, 6, pal.boots, pal.outline);

      // Shorts
      pxOutlined(ctx, 34 + ext, 41, 10, 11, pal.shorts, pal.outline);
      // Horizontal torso
      pxOutlined(ctx, 20 + ext, 39, 16, 12, pal.jersey, pal.outline);
      px(ctx, 20 + ext, 39, 16, 3, pal.jerseyLight);

      // Head looking at ball
      this.drawKeeperHeadFront(ctx, pal, 19 + ext, 30, true);

      // Fully outstretched arms & giant goalkeeper gloves on the left!
      pxOutlined(ctx, 9 + ext, 39, 12, 5, pal.jersey, pal.outline);
      pxOutlined(ctx, 10 + ext, 45, 11, 5, pal.jerseyDark, pal.outline);
      this.drawGlove(ctx, pal, 7 + ext, 40);
      this.drawGlove(ctx, pal, 8 + ext, 47);
    }

    return flipRight ? this.flipHorizontal(raw) : raw;
  }

  private drawKeeperDiveHigh(pal: SpritePalette, frame: number, flipRight: boolean): HTMLCanvasElement {
    const [raw, ctx] = createPixelCanvas(64, 64);

    if (frame === 0) {
      // Explosive upward coil
      pxOutlined(ctx, 24, 26, 16, 14, pal.jersey, pal.outline);
      pxOutlined(ctx, 25, 39, 15, 7, pal.shorts, pal.outline);
      pxOutlined(ctx, 26, 46, 6, 10, pal.socks, pal.outline);
      pxOutlined(ctx, 35, 46, 6, 10, pal.socks, pal.outline);
      this.drawGlove(ctx, pal, 15, 22);
      this.drawGlove(ctx, pal, 22, 18);
      this.drawKeeperHeadFront(ctx, pal, 28, 14, true);
    } else {
      // Diagonal mid-air superman dive toward top-left corner!
      const lift = frame === 2 ? -3 : 0;
      // Airborne shadow
      px(ctx, 16, 58, 28, 3, 'rgba(0,0,0,0.22)');

      // Trailing bent legs bottom-right
      pxOutlined(ctx, 40, 38 + lift, 12, 6, pal.socks, pal.outline);
      pxOutlined(ctx, 38, 45 + lift, 11, 6, pal.socks, pal.outline);
      pxOutlined(ctx, 51, 40 + lift, 5, 6, pal.boots, pal.outline);
      pxOutlined(ctx, 48, 47 + lift, 5, 6, pal.boots, pal.outline);

      // Shorts
      pxOutlined(ctx, 32, 33 + lift, 11, 10, pal.shorts, pal.outline);

      // Diagonal torso
      pxOutlined(ctx, 20, 25 + lift, 15, 13, pal.jersey, pal.outline);
      px(ctx, 20, 25 + lift, 15, 3, pal.jerseyLight);

      // Head
      this.drawKeeperHeadFront(ctx, pal, 22, 14 + lift, true);

      // Top-left reaching arms & gloves!
      pxOutlined(ctx, 10, 17 + lift, 12, 5, pal.jersey, pal.outline);
      pxOutlined(ctx, 12, 24 + lift, 10, 5, pal.jerseyDark, pal.outline);
      this.drawGlove(ctx, pal, 7, 15 + lift);
      this.drawGlove(ctx, pal, 10, 23 + lift);
    }

    return flipRight ? this.flipHorizontal(raw) : raw;
  }

  private drawKeeperCatchCenter(pal: SpritePalette, frame: number): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(64, 64);
    const cx = 32;
    const ty = 23 + frame;

    px(ctx, cx - 13, 57, 26, 4, 'rgba(0,0,0,0.35)');
    pxOutlined(ctx, cx - 9, ty + 19, 6, 11, pal.socks, pal.outline);
    pxOutlined(ctx, cx + 3, ty + 19, 6, 11, pal.socks, pal.outline);
    pxOutlined(ctx, cx - 10, ty + 29, 7, 4, pal.boots, pal.outline);
    pxOutlined(ctx, cx + 3, ty + 29, 7, 4, pal.boots, pal.outline);
    pxOutlined(ctx, cx - 9, ty + 13, 18, 7, pal.shorts, pal.outline);
    pxOutlined(ctx, cx - 9, ty, 18, 14, pal.jersey, pal.outline);
    this.drawKeeperHeadFront(ctx, pal, cx, ty - 12, true);

    // Both gloves locked together over chest!
    this.drawGlove(ctx, pal, cx - 4, ty + 6);
    this.drawGlove(ctx, pal, cx + 4, ty + 6);
    return canvas;
  }

  private drawKeeperReaction(pal: SpritePalette, frame: number, win: boolean): HTMLCanvasElement {
    const [canvas, ctx] = createPixelCanvas(64, 64);
    const cx = 32;
    const ty = win ? (frame === 1 ? 19 : 23) : 31;

    px(ctx, cx - 13, 57, 26, 4, 'rgba(0,0,0,0.35)');

    if (win) {
      pxOutlined(ctx, cx - 9, ty + 19, 6, 11, pal.socks, pal.outline);
      pxOutlined(ctx, cx + 3, ty + 19, 6, 11, pal.socks, pal.outline);
      pxOutlined(ctx, cx - 10, ty + 29, 7, 4, pal.boots, pal.outline);
      pxOutlined(ctx, cx + 3, ty + 29, 7, 4, pal.boots, pal.outline);
      pxOutlined(ctx, cx - 9, ty + 13, 18, 7, pal.shorts, pal.outline);
      pxOutlined(ctx, cx - 9, ty, 18, 14, pal.jersey, pal.outline);
      // Victory fists up!
      pxOutlined(ctx, cx - 15, ty - 6, 6, 10, pal.jersey, pal.outline);
      pxOutlined(ctx, cx + 9, ty - 6, 6, 10, pal.jersey, pal.outline);
      this.drawGlove(ctx, pal, cx - 14, ty - 9);
      this.drawGlove(ctx, pal, cx + 14, ty - 9);
      this.drawKeeperHeadFront(ctx, pal, cx, ty - 12, true);
    } else {
      // Slumped on knees
      pxOutlined(ctx, cx - 10, 48, 20, 8, pal.shorts, pal.outline);
      pxOutlined(ctx, cx - 9, 36, 18, 13, pal.jersey, pal.outline);
      this.drawGlove(ctx, pal, cx - 12, 53);
      this.drawGlove(ctx, pal, cx + 12, 53);
      this.drawKeeperHeadFront(ctx, pal, cx, 26, false);
    }
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
