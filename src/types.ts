export const VIRTUAL_WIDTH = 480;
export const VIRTUAL_HEIGHT = 270;

export type GameMode = 'vs_ai' | 'local_2p' | 'online_multi';
export type AIDifficulty = 'rookie' | 'pro' | 'legend';

export type ScreenState = 'title' | 'mode_select' | 'online_lobby' | 'playing' | 'match_over';

export type TurnRole = 'player_kick' | 'player_keep';

export type TurnPhase =
  | 'intro'        // 라운드 시작 연출
  | 'aiming'       // 조준 및 스킬 선택
  | 'charging'     // 파워 게이지 차징
  | 'runup'        // 키커 도움닫기 모션
  | 'ball_flight'  // 공 비행 및 골키퍼 다이빙 / 스킬 발동
  | 'chrono_pause' // 타임 스톱 정지 연출
  | 'resolution'   // 골 / 세이브 / 노골 결과 연출
  | 'next_turn';   // 다음 턴 전환

export type KickerSkillId = 'none' | 'flame' | 'mirage' | 'curve' | 'chrono';
export type KeeperSkillId = 'none' | 'blackhole' | 'blink' | 'titan' | 'icewall';

export type CelebrationType = 'siu' | 'shhh' | 'samba' | 'default';

export type DiveZone =
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'low_left'
  | 'center'
  | 'low_right';

export type ShotResult = 'pending' | 'goal' | 'saved' | 'post' | 'miss';

export interface SkillDefinition<T extends string> {
  id: T;
  key: string;
  nameKo: string;
  nameEn: string;
  manaCost: number;
  cooldownRounds: number;
  color: string;
  accentColor: string;
  desc: string;
}

export interface GoalRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface BallState {
  // Normalized progress z: 0 (penalty spot) -> 1 (goal line) -> 1.18 (back of net)
  z: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  // Actual screen coords
  x: number;
  y: number;
  groundY: number;
  radius: number;
  speed: number;
  power: number; // 0..1.25 (sweet spot around 0.82..0.95)
  perfectImpact: boolean;
  spin: number;
  curveOffset: number;
  curveTriggered: boolean;
  chronoTriggered: boolean;
  chronoTimer: number;
  deflected: boolean;
  vx: number;
  vy: number;
  mirageClones: Array<{ offsetX: number; offsetY: number; phase: number }>;
}

export interface KickerActor {
  x: number;
  y: number;
  anim: 'idle' | 'charge' | 'runup' | 'kick' | 'celebrate' | 'despair' | 'taunt';
  celebrationType?: CelebrationType;
  frame: number;
  animTimer: number;
  skillAura: KickerSkillId;
}

export interface KeeperActor {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  targetX: number;
  targetY: number;
  anim:
    | 'idle'
    | 'dive_low_left'
    | 'dive_low_right'
    | 'dive_top_left'
    | 'dive_top_right'
    | 'catch_center'
    | 'celebrate'
    | 'despair'
    | 'taunt';
  celebrationType?: CelebrationType;
  frame: number;
  animTimer: number;
  hasDived: boolean;
  diveZone: DiveZone;
  scale: number;
  skillActive: KeeperSkillId;
  iceWallZone: DiveZone | null;
  blackHoleActive: boolean;
  blinked: boolean;
}

export interface PixelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  dither?: boolean;
}

export interface Afterimage {
  x: number;
  y: number;
  scale: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'ball' | 'keeper';
}

export interface BannerPopup {
  title: string;
  subtitle: string;
  color: string;
  strokeColor: string;
  timer: number;
  duration: number;
}
