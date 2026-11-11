import { AccessoryId, HairStyleId, KeeperSkillId, KickerSkillId } from './types';

export type PlayerPosition = 'striker' | 'goalkeeper';

export interface CareerStats {
  // Striker stats (10 ~ 99)
  power: number;       // 공 비행 속도 & 슛 관통력
  curve: number;       // 궤적 왜곡 각도 & 스핀력
  sweetSpot: number;   // 퍼펙트 임팩트 타이밍 바 구간 너비
  focus: number;       // 조준 흔들림 보정 & 게이지 속도 안정성

  // Goalkeeper stats (10 ~ 99)
  agility: number;     // 다이빙 반응 & 도달 속도
  reach: number;       // 세이브 판정 히트박스 반경 확대
  composure: number;   // 역방향 다이빙 시 감속 페널티 감소
  anticipation: number;// 상대 궤적 예측 가이드 미세 표시

  // Shared stats
  maxMana: number;     // 최대 마나 (65 ~ 120)
  manaRegen: number;   // 라운드당 자동 마나 회복 (+5 ~ +25)
}

export type EquipmentType = 'boots' | 'gloves' | 'accessory';

export interface CareerEquipment {
  id: string;
  nameKo: string;
  nameEn: string;
  type: EquipmentType;
  position: PlayerPosition | 'all';
  tier: number; // 1 ~ 4
  price: number;
  statBonus: Partial<CareerStats>;
  descKo: string;
  color: string;
  accentColor: string;
}

export interface LeagueTeam {
  id: string;
  nameKo: string;
  nameEn: string;
  shortName: string;
  division: number; // 4 (Rookie) -> 3 -> 2 -> 1 (Gods)
  isPlayerTeam?: boolean;
  color: string;
  accentColor: string;
  bgEmblemColor: string;
  rating: number; // 40 ~ 98
  emblemKey: 'street' | 'cyber' | 'pro' | 'gods' | 'player';
  kickerSkill: KickerSkillId;
  keeperSkill: KeeperSkillId;
  stats: CareerStats;
  descriptionKo: string;
}

export interface LeagueStandingsRow {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  points: number;       // 승리 3점, 패배 0점
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
}

export interface CareerMatchResult {
  opponentTeamId: string;
  myScore: number;
  opponentScore: number;
  won: boolean;
  goldEarned: number;
  tpEarned: number;
  date: string;
}

export interface CareerSaveData {
  version: number;
  playerName: string;
  teamName: string;
  position: PlayerPosition;
  jerseyNumber: number;
  hairStyle: HairStyleId;
  accessory: AccessoryId;

  // Economy & Progression
  gold: number;
  trainingPoints: number; // TP
  division: number;       // 4 -> 3 -> 2 -> 1
  currentMatchIndex: number; // 0 ~ 5 (시즌 내 6경기)
  seasonNumber: number;
  careerGoals: number;
  careerSaves: number;
  careerWins: number;
  careerMatches: number;

  // Stats & Skills
  stats: CareerStats;
  selectedKickerSkills: [KickerSkillId, KickerSkillId];
  selectedKeeperSkills: [KeeperSkillId, KeeperSkillId];

  // Equipment
  equippedBootsId: string;
  equippedGlovesId: string;
  equippedAccessoryId: string;
  inventoryIds: string[];

  // League current season table
  standings: LeagueStandingsRow[];
  matchHistory: CareerMatchResult[];

  // FM-Style Reputation (0 ~ 100%)
  reputation: PlayerReputation;

  // Calendar & Events
  calendar: CalendarEntry[];
  currentWeek: number; // 1 ~ 34
  pendingEvent: StoryEvent | null;
  activeBuff: ActiveMatchBuff | null;
  championsTrophies: number;

  lastSaved: number;
}

export interface PlayerReputation {
  managerTrust: number; // 0 ~ 100 (감독 신임도)
  fanSupport: number;   // 0 ~ 100 (팬덤 지지율)
  mediaHype: number;    // 0 ~ 100 (언론/스폰서 관심도)
}

export type StoryEventType = 'newspaper' | 'press_conference' | 'smartphone' | 'manager_meeting';

export interface StoryEventOption {
  textKo: string;
  descKo: string;
  effectTrust: number;
  effectFans: number;
  effectMedia: number;
  effectGold?: number;
  effectTP?: number;
  buff?: ActiveMatchBuff;
}

export interface ActiveMatchBuff {
  id: string;
  nameKo: string;
  type: 'start_mana' | 'sweetspot' | 'power' | 'reach';
  value: number;
  matchesLeft: number;
}

export interface StoryEvent {
  id: string;
  type: StoryEventType;
  titleKo: string;
  senderOrAuthor: string;
  headline?: string;
  bodyTextKo: string;
  options: StoryEventOption[];
  divisionMin?: number;
}

export type CalendarMatchStage = 'league' | 'champions_group' | 'champions_ko' | 'champions_final';

export interface CalendarEntry {
  week: number; // 1 ~ 34
  type: 'league' | 'champions';
  stage: CalendarMatchStage;
  stageNameKo: string;
  opponentTeamId: string;
  played: boolean;
  myScore?: number;
  oppScore?: number;
  eventTriggered?: boolean;
}
