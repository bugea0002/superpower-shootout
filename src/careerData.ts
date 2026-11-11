import {
  AccessoryId,
  HairStyleId,
  KeeperSkillId,
  KickerSkillId,
} from './types';
import {
  CareerEquipment,
  CareerMatchResult,
  CareerSaveData,
  CareerStats,
  EquipmentType,
  LeagueStandingsRow,
  LeagueTeam,
  PlayerPosition,
} from './careerTypes';
import { generateSeasonCalendar } from './careerEventsData';

export const STORAGE_KEY = 'superpower_shootout_career_v1';

export const DIVISION_NAMES: Record<number, { ko: string; en: string; subtitleKo: string }> = {
  4: { ko: '루키 스트리트', en: 'Rookie Street', subtitleKo: '거친 길거리에서 시작되는 전설' },
  3: { ko: '사이버 아카데미', en: 'Cyber Academy', subtitleKo: '최첨단 하이테크 유망주들의 무대' },
  2: { ko: '슈퍼 프로 리그', en: 'Super Pro League', subtitleKo: '초능력 축구의 정점에 도전하는 프로 리그' },
  1: { ko: '갓즈 챔피언십', en: 'Gods Championship', subtitleKo: '신화적 능력을 지닌 지배자들의 최종 결전' },
};

export const STAT_NAMES_KO: Record<keyof CareerStats, string> = {
  power: '슛 파워',
  curve: '커브 / 궤적',
  sweetSpot: '임팩트 존',
  focus: '조준 집중력',
  agility: '민첩성 / 반응',
  reach: '세이브 리치',
  composure: '평정심 / 밸런스',
  anticipation: '예측력 / 시야',
  maxMana: '최대 마나',
  manaRegen: '마나 재생',
};

// =============================================================================
// 16 LEAGUE TEAMS (4 Divisions x 4 Teams)
// =============================================================================
export const DIVISION_TEAMS: LeagueTeam[] = [
  // ---------------------------------------------------------------------------
  // Division 4: 루키 스트리트 (스탯 40 ~ 52)
  // ---------------------------------------------------------------------------
  {
    id: 'street_alley',
    nameKo: '골목길 유나이티드',
    nameEn: 'Alleyway United',
    shortName: 'ALU',
    division: 4,
    color: '#ef4444',
    accentColor: '#fca5a5',
    bgEmblemColor: '#7f1d1d',
    rating: 42,
    emblemKey: 'street',
    kickerSkill: 'flame',
    keeperSkill: 'titan',
    stats: {
      power: 44,
      curve: 38,
      sweetSpot: 42,
      focus: 40,
      agility: 42,
      reach: 44,
      composure: 38,
      anticipation: 40,
      maxMana: 70,
      manaRegen: 8,
    },
    descriptionKo: '거친 길거리 축구로 다져진 투지와 화끈한 슛을 자랑하는 동네 골목대장 팀.',
  },
  {
    id: 'street_thunder',
    nameKo: '썬더 키즈',
    nameEn: 'Thunder Kids',
    shortName: 'THK',
    division: 4,
    color: '#eab308',
    accentColor: '#fef08a',
    bgEmblemColor: '#713f12',
    rating: 45,
    emblemKey: 'street',
    kickerSkill: 'flame',
    keeperSkill: 'icewall',
    stats: {
      power: 46,
      curve: 42,
      sweetSpot: 45,
      focus: 42,
      agility: 46,
      reach: 44,
      composure: 40,
      anticipation: 44,
      maxMana: 72,
      manaRegen: 9,
    },
    descriptionKo: '번개처럼 빠른 스피드와 지치지 않는 에너지로 승부를 거는 유망주 군단.',
  },
  {
    id: 'street_concrete',
    nameKo: '콘크리트 FC',
    nameEn: 'Concrete FC',
    shortName: 'CON',
    division: 4,
    color: '#64748b',
    accentColor: '#cbd5e1',
    bgEmblemColor: '#1e293b',
    rating: 48,
    emblemKey: 'street',
    kickerSkill: 'curve',
    keeperSkill: 'titan',
    stats: {
      power: 47,
      curve: 44,
      sweetSpot: 46,
      focus: 48,
      agility: 45,
      reach: 50,
      composure: 49,
      anticipation: 45,
      maxMana: 75,
      manaRegen: 9,
    },
    descriptionKo: '아스팔트와 콘크리트 바닥에서 단련된 단단한 방어벽과 묵직한 킥을 구사한다.',
  },
  {
    id: 'street_wild',
    nameKo: '와일드 루키즈',
    nameEn: 'Wild Rookies',
    shortName: 'WLD',
    division: 4,
    color: '#10b981',
    accentColor: '#a7f3d0',
    bgEmblemColor: '#064e3b',
    rating: 50,
    emblemKey: 'street',
    kickerSkill: 'mirage',
    keeperSkill: 'icewall',
    stats: {
      power: 49,
      curve: 48,
      sweetSpot: 49,
      focus: 46,
      agility: 50,
      reach: 48,
      composure: 46,
      anticipation: 49,
      maxMana: 76,
      manaRegen: 10,
    },
    descriptionKo: '예측 불가능한 트리키한 플레이와 야생의 감각으로 루키 리그를 제패하려는 신흥 강호.',
  },

  // ---------------------------------------------------------------------------
  // Division 3: 사이버 아카데미 (스탯 56 ~ 69)
  // ---------------------------------------------------------------------------
  {
    id: 'cyber_viper',
    nameKo: '네온 바이퍼',
    nameEn: 'Neon Vipers',
    shortName: 'VIP',
    division: 3,
    color: '#06b6d4',
    accentColor: '#67e8f9',
    bgEmblemColor: '#164e63',
    rating: 58,
    emblemKey: 'cyber',
    kickerSkill: 'curve',
    keeperSkill: 'blackhole',
    stats: {
      power: 56,
      curve: 63,
      sweetSpot: 58,
      focus: 59,
      agility: 60,
      reach: 58,
      composure: 56,
      anticipation: 61,
      maxMana: 80,
      manaRegen: 11,
    },
    descriptionKo: '독사처럼 휘어지는 네온 궤적 슛과 사이버넷 방어 시스템을 구사하는 엘리트 팀.',
  },
  {
    id: 'cyber_mecha',
    nameKo: '메카 킥스',
    nameEn: 'Mecha Kicks',
    shortName: 'MCK',
    division: 3,
    color: '#3b82f6',
    accentColor: '#93c5fd',
    bgEmblemColor: '#1e3a8a',
    rating: 62,
    emblemKey: 'cyber',
    kickerSkill: 'flame',
    keeperSkill: 'titan',
    stats: {
      power: 66,
      curve: 58,
      sweetSpot: 62,
      focus: 61,
      agility: 62,
      reach: 65,
      composure: 60,
      anticipation: 60,
      maxMana: 82,
      manaRegen: 11,
    },
    descriptionKo: '정밀한 로보틱 관절 보조 장치로 폭발적인 슛 파워와 안정된 세이브를 자랑한다.',
  },
  {
    id: 'cyber_hyper',
    nameKo: '하이퍼 테크',
    nameEn: 'Hyper Tech',
    shortName: 'HTC',
    division: 3,
    color: '#8b5cf6',
    accentColor: '#c4b5fd',
    bgEmblemColor: '#4c1d95',
    rating: 65,
    emblemKey: 'cyber',
    kickerSkill: 'mirage',
    keeperSkill: 'blink',
    stats: {
      power: 63,
      curve: 67,
      sweetSpot: 66,
      focus: 66,
      agility: 64,
      reach: 63,
      composure: 65,
      anticipation: 68,
      maxMana: 85,
      manaRegen: 12,
    },
    descriptionKo: '데이터 기반 인공지능 분석으로 골키퍼의 허점을 집요하게 파고드는 하이테크 군단.',
  },
  {
    id: 'cyber_vortex',
    nameKo: '볼텍스 유스',
    nameEn: 'Vortex Youth',
    shortName: 'VTX',
    division: 3,
    color: '#ec4899',
    accentColor: '#fbcfe8',
    bgEmblemColor: '#831843',
    rating: 69,
    emblemKey: 'cyber',
    kickerSkill: 'chrono',
    keeperSkill: 'blackhole',
    stats: {
      power: 67,
      curve: 69,
      sweetSpot: 68,
      focus: 68,
      agility: 69,
      reach: 67,
      composure: 68,
      anticipation: 69,
      maxMana: 88,
      manaRegen: 13,
    },
    descriptionKo: '시공간을 왜곡하는 소용돌이 에너지와 초감각적 반응속도를 갖춘 차세대 스타들.',
  },

  // ---------------------------------------------------------------------------
  // Division 2: 슈퍼 프로 리그 (스탯 73 ~ 84)
  // ---------------------------------------------------------------------------
  {
    id: 'pro_blizzard',
    nameKo: '블리자드 FC',
    nameEn: 'Blizzard FC',
    shortName: 'BLZ',
    division: 2,
    color: '#0ea5e9',
    accentColor: '#bae6fd',
    bgEmblemColor: '#0c4a6e',
    rating: 74,
    emblemKey: 'pro',
    kickerSkill: 'curve',
    keeperSkill: 'icewall',
    stats: {
      power: 74,
      curve: 77,
      sweetSpot: 74,
      focus: 76,
      agility: 75,
      reach: 76,
      composure: 78,
      anticipation: 75,
      maxMana: 92,
      manaRegen: 14,
    },
    descriptionKo: '절대 영도의 냉기로 골문을 봉쇄하고 날카로운 빙결 슛으로 승부를 결정짓는 북부의 맹주.',
  },
  {
    id: 'pro_titan',
    nameKo: '타이탄 가디언즈',
    nameEn: 'Titan Guardians',
    shortName: 'TTN',
    division: 2,
    color: '#16a34a',
    accentColor: '#86efac',
    bgEmblemColor: '#14532d',
    rating: 78,
    emblemKey: 'pro',
    kickerSkill: 'flame',
    keeperSkill: 'titan',
    stats: {
      power: 81,
      curve: 72,
      sweetSpot: 77,
      focus: 78,
      agility: 75,
      reach: 84,
      composure: 81,
      anticipation: 76,
      maxMana: 95,
      manaRegen: 15,
    },
    descriptionKo: '통곡의 벽이라 불리는 철벽 골키퍼와 육중한 캐넌 슈터들이 버티는 프로 명문팀.',
  },
  {
    id: 'pro_shadow',
    nameKo: '섀도우 일레븐',
    nameEn: 'Shadow Eleven',
    shortName: 'SHD',
    division: 2,
    color: '#71717a',
    accentColor: '#d4d4d8',
    bgEmblemColor: '#27272a',
    rating: 81,
    emblemKey: 'pro',
    kickerSkill: 'mirage',
    keeperSkill: 'blink',
    stats: {
      power: 79,
      curve: 83,
      sweetSpot: 81,
      focus: 81,
      agility: 83,
      reach: 79,
      composure: 82,
      anticipation: 83,
      maxMana: 98,
      manaRegen: 15,
    },
    descriptionKo: '그림자 속에서 불시에 튀어나오는 기습 슛과 환영 술수를 자랑하는 은밀한 강자.',
  },
  {
    id: 'pro_phoenix',
    nameKo: '피닉스 스트라이커즈',
    nameEn: 'Phoenix Strikers',
    shortName: 'PHX',
    division: 2,
    color: '#f97316',
    accentColor: '#fed7aa',
    bgEmblemColor: '#7c2d12',
    rating: 84,
    emblemKey: 'pro',
    kickerSkill: 'flame',
    keeperSkill: 'blackhole',
    stats: {
      power: 86,
      curve: 81,
      sweetSpot: 84,
      focus: 83,
      agility: 82,
      reach: 81,
      composure: 85,
      anticipation: 83,
      maxMana: 100,
      manaRegen: 16,
    },
    descriptionKo: '패배 직전에도 불사조처럼 타오르는 역전 본능과 불꽃 슛으로 팬들을 열광시키는 인기 구단.',
  },

  // ---------------------------------------------------------------------------
  // Division 1: 갓즈 챔피언십 (스탯 88 ~ 96)
  // ---------------------------------------------------------------------------
  {
    id: 'gods_olympus',
    nameKo: '올림푸스 신스',
    nameEn: 'Olympus Gods',
    shortName: 'OLY',
    division: 1,
    color: '#f59e0b',
    accentColor: '#fef3c7',
    bgEmblemColor: '#78350f',
    rating: 89,
    emblemKey: 'gods',
    kickerSkill: 'flame',
    keeperSkill: 'titan',
    stats: {
      power: 91,
      curve: 87,
      sweetSpot: 89,
      focus: 90,
      agility: 89,
      reach: 91,
      composure: 90,
      anticipation: 89,
      maxMana: 106,
      manaRegen: 18,
    },
    descriptionKo: '올림포스 주신들의 권능을 부여받은 듯 압도적인 피지컬과 신성한 위압감의 챔피언 후보.',
  },
  {
    id: 'gods_aether',
    nameKo: '에테르 제국',
    nameEn: 'Aether Empire',
    shortName: 'AET',
    division: 1,
    color: '#a855f7',
    accentColor: '#ede9fe',
    bgEmblemColor: '#3b0764',
    rating: 92,
    emblemKey: 'gods',
    kickerSkill: 'curve',
    keeperSkill: 'blackhole',
    stats: {
      power: 90,
      curve: 95,
      sweetSpot: 91,
      focus: 93,
      agility: 92,
      reach: 92,
      composure: 91,
      anticipation: 94,
      maxMana: 110,
      manaRegen: 20,
    },
    descriptionKo: '신비로운 에테르 입자로 궤적을 자유자재로 지배하며 상대의 영혼까지 꿰뚫는 제국군.',
  },
  {
    id: 'gods_chronos',
    nameKo: '크로노스 로드',
    nameEn: 'Chronos Lords',
    shortName: 'CHR',
    division: 1,
    color: '#06b6d4',
    accentColor: '#cffafe',
    bgEmblemColor: '#083344',
    rating: 94,
    emblemKey: 'gods',
    kickerSkill: 'chrono',
    keeperSkill: 'blink',
    stats: {
      power: 94,
      curve: 93,
      sweetSpot: 94,
      focus: 95,
      agility: 94,
      reach: 94,
      composure: 94,
      anticipation: 96,
      maxMana: 115,
      manaRegen: 22,
    },
    descriptionKo: '시간과 공간의 법칙을 비웃는 궁극의 시간 정지 슛과 초공간 세이브의 지배자들.',
  },
  {
    id: 'gods_valhalla',
    nameKo: '묠니르 발할라',
    nameEn: 'Mjolnir Valhalla',
    shortName: 'MJL',
    division: 1,
    color: '#ef4444',
    accentColor: '#fecaca',
    bgEmblemColor: '#450a0a',
    rating: 96,
    emblemKey: 'gods',
    kickerSkill: 'flame',
    keeperSkill: 'titan',
    stats: {
      power: 97,
      curve: 93,
      sweetSpot: 96,
      focus: 95,
      agility: 95,
      reach: 96,
      composure: 96,
      anticipation: 95,
      maxMana: 120,
      manaRegen: 24,
    },
    descriptionKo: '뇌신 토르의 벼락같은 파괴력과 북유럽 전사들의 불굴의 투혼을 지닌 최종 보스 구단.',
  },
];

// =============================================================================
// EQUIPMENT CATALOG (Boots x 4, Gloves x 4, Accessories x 4)
// =============================================================================
export const EQUIPMENT_CATALOG: CareerEquipment[] = [
  // ---------------------------------------------------------------------------
  // Boots (축구화 4종)
  // ---------------------------------------------------------------------------
  {
    id: 'boots_rookie',
    nameKo: '루키 캔버스화',
    nameEn: 'Rookie Canvas',
    type: 'boots',
    position: 'all',
    tier: 1,
    price: 0,
    statBonus: {
      power: 2,
      sweetSpot: 2,
    },
    descKo: '풋풋한 신입 선수의 발을 감싸는 평범하지만 가벼운 기본 캔버스화.',
    color: '#94a3b8',
    accentColor: '#cbd5e1',
  },
  {
    id: 'boots_aero',
    nameKo: '에어로 스파이크',
    nameEn: 'Aero Spike',
    type: 'boots',
    position: 'striker',
    tier: 2,
    price: 300,
    statBonus: {
      power: 5,
      curve: 4,
      sweetSpot: 4,
    },
    descKo: '공기역학적 블레이드 스터드가 장착되어 슛 속도와 커브 회전력이 상승합니다.',
    color: '#38bdf8',
    accentColor: '#0284c7',
  },
  {
    id: 'boots_vortex',
    nameKo: '볼텍스 스트라이커',
    nameEn: 'Vortex Striker',
    type: 'boots',
    position: 'striker',
    tier: 3,
    price: 800,
    statBonus: {
      power: 9,
      curve: 8,
      sweetSpot: 7,
      focus: 5,
    },
    descKo: '강력한 나선형 마찰 패드로 공을 감아 차는 궤적 왜곡과 임팩트 존을 대폭 넓힙니다.',
    color: '#a855f7',
    accentColor: '#7e22ce',
  },
  {
    id: 'boots_meteor',
    nameKo: '갓스피드 메테오',
    nameEn: 'Godspeed Meteor',
    type: 'boots',
    position: 'striker',
    tier: 4,
    price: 2000,
    statBonus: {
      power: 15,
      curve: 12,
      sweetSpot: 12,
      focus: 10,
      maxMana: 10,
    },
    descKo: '유성처럼 낙하하는 전설의 축구화. 경이로운 킥 파워와 절대적인 컨트롤을 선사합니다.',
    color: '#f59e0b',
    accentColor: '#ef4444',
  },

  // ---------------------------------------------------------------------------
  // Gloves (골키퍼 장갑 4종)
  // ---------------------------------------------------------------------------
  {
    id: 'gloves_cotton',
    nameKo: '면장갑',
    nameEn: 'Cotton Gloves',
    type: 'gloves',
    position: 'all',
    tier: 1,
    price: 0,
    statBonus: {
      agility: 2,
      reach: 2,
    },
    descKo: '손에 땀을 흡수해주는 기본적인 골키퍼 면장갑.',
    color: '#e2e8f0',
    accentColor: '#94a3b8',
  },
  {
    id: 'gloves_grip',
    nameKo: '그립 마스터',
    nameEn: 'Grip Master',
    type: 'gloves',
    position: 'goalkeeper',
    tier: 2,
    price: 300,
    statBonus: {
      agility: 5,
      reach: 5,
      composure: 4,
    },
    descKo: '특수 라텍스 패드가 부착되어 강력한 회전 슛도 놓치지 않는 안정감을 줍니다.',
    color: '#22c55e',
    accentColor: '#15803d',
  },
  {
    id: 'gloves_web',
    nameKo: '네온 웹 세이버',
    nameEn: 'Neon Web Saver',
    type: 'gloves',
    position: 'goalkeeper',
    tier: 3,
    price: 800,
    statBonus: {
      agility: 8,
      reach: 9,
      composure: 7,
      anticipation: 6,
    },
    descKo: '손가락 사이에 미세 전자기장을 형성하여 다이빙 세이브 반경을 확장합니다.',
    color: '#06b6d4',
    accentColor: '#0891b2',
  },
  {
    id: 'gloves_aegis',
    nameKo: '타이탄 아이기스',
    nameEn: 'Titan Aegis',
    type: 'gloves',
    position: 'goalkeeper',
    tier: 4,
    price: 2000,
    statBonus: {
      agility: 14,
      reach: 15,
      composure: 12,
      anticipation: 10,
      maxMana: 10,
    },
    descKo: '신화 속 방패 아이기스의 가호를 품은 신의 장갑. 어떠한 슛도 튕겨내거나 붙잡습니다.',
    color: '#fbbf24',
    accentColor: '#d97706',
  },

  // ---------------------------------------------------------------------------
  // Accessories (액세서리 4종)
  // ---------------------------------------------------------------------------
  {
    id: 'acc_headband',
    nameKo: '열정의 헤드밴드',
    nameEn: 'Passion Headband',
    type: 'accessory',
    position: 'all',
    tier: 1,
    price: 250,
    statBonus: {
      focus: 4,
      composure: 4,
      manaRegen: 1,
    },
    descKo: '이마에 두르면 잡념이 사라지고 매 순간 집중력이 솟아오릅니다.',
    color: '#ef4444',
    accentColor: '#b91c1c',
  },
  {
    id: 'acc_glasses',
    nameKo: '분석용 사이버 글래스',
    nameEn: 'Cyber Analyzer',
    type: 'accessory',
    position: 'all',
    tier: 2,
    price: 600,
    statBonus: {
      focus: 7,
      anticipation: 8,
      sweetSpot: 5,
    },
    descKo: '상대의 슛과 다이빙 궤적 데이터를 실시간 HUD로 안구에 투사합니다.',
    color: '#06b6d4',
    accentColor: '#0284c7',
  },
  {
    id: 'acc_mask',
    nameKo: '닌자 섀도우 마스크',
    nameEn: 'Shadow Mask',
    type: 'accessory',
    position: 'all',
    tier: 3,
    price: 1200,
    statBonus: {
      agility: 8,
      curve: 7,
      composure: 8,
      maxMana: 8,
    },
    descKo: '자신의 기척을 숨기고 극한의 침착함과 신속한 몸놀림을 발휘합니다.',
    color: '#374151',
    accentColor: '#111827',
  },
  {
    id: 'acc_crown',
    nameKo: '패왕의 황금 크라운',
    nameEn: 'Overlord Crown',
    type: 'accessory',
    position: 'all',
    tier: 4,
    price: 2500,
    statBonus: {
      power: 10,
      reach: 10,
      focus: 8,
      composure: 8,
      maxMana: 15,
      manaRegen: 3,
    },
    descKo: '그라운드를 지배하는 절대 패자에게만 허락된 황금 왕관. 모든 잠재력이 개방됩니다.',
    color: '#fbbf24',
    accentColor: '#eab308',
  },
];

// =============================================================================
// HELPER FUNCTIONS & STANDINGS CREATION
// =============================================================================

export function getDivisionTeams(division: number): LeagueTeam[] {
  return DIVISION_TEAMS.filter((t) => t.division === division);
}

/**
 * Creates the initial 4-team standings for a division, including 'player_team'
 * and the first 3 AI teams of that division.
 */
export function createInitialStandings(division: number): LeagueStandingsRow[] {
  const divTeams = getDivisionTeams(division);
  const selectedAITeams = divTeams.slice(0, 3);

  const rows: LeagueStandingsRow[] = [
    {
      teamId: 'player_team',
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    },
    ...selectedAITeams.map((t) => ({
      teamId: t.id,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    })),
  ];

  return rows;
}

// =============================================================================
// CAREER SAVE & LOAD
// =============================================================================

export function createInitialCareerSave(
  playerName: string,
  teamName: string,
  position: PlayerPosition,
  hairStyle: HairStyleId = 'spiky',
  accessory: AccessoryId = 'none',
  jerseyNumber: number = 10,
): CareerSaveData {
  const isStriker = position === 'striker';

  // Starting Stats based on position
  const baseStats: CareerStats = isStriker
    ? {
        power: 30,
        curve: 25,
        sweetSpot: 30,
        focus: 25,
        agility: 15,
        reach: 15,
        composure: 15,
        anticipation: 15,
        maxMana: 65,
        manaRegen: 8,
      }
    : {
        power: 15,
        curve: 15,
        sweetSpot: 15,
        focus: 20,
        agility: 30,
        reach: 32,
        composure: 28,
        anticipation: 25,
        maxMana: 65,
        manaRegen: 10,
      };

  // Starting Equipment
  const inventoryIds: string[] = ['boots_rookie', 'gloves_cotton'];
  let equippedAccessoryId = '';

  if (accessory === 'headband') {
    equippedAccessoryId = 'acc_headband';
    inventoryIds.push('acc_headband');
  } else if (accessory === 'glasses') {
    equippedAccessoryId = 'acc_glasses';
    inventoryIds.push('acc_glasses');
  } else if (accessory === 'mask') {
    equippedAccessoryId = 'acc_mask';
    inventoryIds.push('acc_mask');
  } else if (accessory === 'aura_crown') {
    equippedAccessoryId = 'acc_crown';
    inventoryIds.push('acc_crown');
  }

  const initialKickerSkills: [KickerSkillId, KickerSkillId] = isStriker
    ? ['flame', 'curve']
    : ['flame', 'mirage'];

  const initialKeeperSkills: [KeeperSkillId, KeeperSkillId] = isStriker
    ? ['titan', 'icewall']
    : ['titan', 'blackhole'];

  const initialSave: CareerSaveData = {
    version: 1,
    playerName: playerName.trim() || '슈퍼 루키',
    teamName: teamName.trim() || '드림 FC',
    position,
    jerseyNumber: Math.max(1, Math.min(99, jerseyNumber || 10)),
    hairStyle,
    accessory,

    gold: 200,
    trainingPoints: 30,
    division: 4,
    currentMatchIndex: 0,
    seasonNumber: 1,
    careerGoals: 0,
    careerSaves: 0,
    careerWins: 0,
    careerMatches: 0,

    stats: baseStats,
    selectedKickerSkills: initialKickerSkills,
    selectedKeeperSkills: initialKeeperSkills,

    equippedBootsId: 'boots_rookie',
    equippedGlovesId: 'gloves_cotton',
    equippedAccessoryId,
    inventoryIds,

    standings: createInitialStandings(4),
    matchHistory: [],

    reputation: {
      managerTrust: 65,
      fanSupport: 50,
      mediaHype: 35,
    },
    calendar: generateSeasonCalendar(4, getDivisionTeams(4)),
    currentWeek: 1,
    pendingEvent: null,
    activeBuff: null,
    championsTrophies: 0,

    lastSaved: Date.now(),
  };

  return initialSave;
}

export function saveCareerData(data: CareerSaveData): void {
  try {
    data.lastSaved = Date.now();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Failed to save career data:', e);
  }
}

export function loadCareerData(): CareerSaveData | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CareerSaveData;
    if (!parsed || typeof parsed !== 'object' || !parsed.stats || !parsed.playerName) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load career data:', e);
    return null;
  }
}

export function clearCareerData(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to clear career data:', e);
  }
}

// =============================================================================
// CAREER MATCH & LEAGUE PROGRESSION LOGIC
// =============================================================================

/**
 * Returns the next opponent team in the current season (schedule of 6 matches:
 * round-robin home & away against 3 division opponents).
 */
export function getNextOpponent(save: CareerSaveData): LeagueTeam {
  const oppRows = save.standings.filter((s) => s.teamId !== 'player_team');
  const oppIndex = oppRows.length > 0 ? save.currentMatchIndex % oppRows.length : 0;
  const oppRow = oppRows[oppIndex];

  if (oppRow) {
    const team = DIVISION_TEAMS.find((t) => t.id === oppRow.teamId);
    if (team) return team;
  }

  // Fallback to first team of current division
  const divTeams = getDivisionTeams(save.division);
  return divTeams[0] || DIVISION_TEAMS[0];
}

/**
 * Calculates the TP cost to train a specific stat based on its current level.
 */
export function calculateTrainCost(save: CareerSaveData, statKey: keyof CareerStats): number {
  const currentVal = save.stats[statKey];
  if (statKey === 'manaRegen') {
    return Math.max(10, currentVal * 2);
  }
  if (statKey === 'maxMana') {
    return Math.max(10, Math.floor((currentVal - 50) / 3) * 2);
  }
  if (currentVal < 40) return 10;
  if (currentVal < 60) return 15;
  if (currentVal < 80) return 22;
  if (currentVal < 90) return 30;
  return 40;
}

/**
 * Trains a stat using TP.
 */
export function trainStat(
  save: CareerSaveData,
  statKey: keyof CareerStats,
): { success: boolean; message: string; cost: number } {
  const currentVal = save.stats[statKey];
  const cost = calculateTrainCost(save, statKey);

  // Maximum stat limits
  const maxLimit = statKey === 'maxMana' ? 120 : statKey === 'manaRegen' ? 25 : 99;
  if (currentVal >= maxLimit) {
    return {
      success: false,
      message: `이미 ${STAT_NAMES_KO[statKey]} 능력치의 최대치(${maxLimit})에 도달했습니다!`,
      cost,
    };
  }

  if (save.trainingPoints < cost) {
    return {
      success: false,
      message: `훈련 포인트(TP)가 부족합니다! (필요: ${cost} TP, 보유: ${save.trainingPoints} TP)`,
      cost,
    };
  }

  // Stat increment amounts (+2 ~ +4 based on key)
  let gain = 3;
  if (statKey === 'maxMana') {
    gain = 4;
  } else if (statKey === 'manaRegen') {
    gain = 1;
  } else if (currentVal >= 80) {
    gain = 2;
  } else if (currentVal >= 90) {
    gain = 1;
  }

  const newVal = Math.min(maxLimit, currentVal + gain);
  const actualGain = newVal - currentVal;

  save.trainingPoints -= cost;
  save.stats[statKey] = newVal;
  saveCareerData(save);

  return {
    success: true,
    message: `${STAT_NAMES_KO[statKey]} 훈련 완료! (+${actualGain} 상승, 현재: ${newVal})`,
    cost,
  };
}

/**
 * Buys an equipment item from the catalog or equips it if already owned.
 */
export function buyAndEquipItem(
  save: CareerSaveData,
  equipId: string,
): { success: boolean; message: string } {
  const item = EQUIPMENT_CATALOG.find((e) => e.id === equipId);
  if (!item) {
    return { success: false, message: '존재하지 않는 장비입니다.' };
  }

  const alreadyOwned = save.inventoryIds.includes(equipId);

  // Equip if already owned
  if (alreadyOwned) {
    if (item.type === 'boots') {
      save.equippedBootsId = item.id;
    } else if (item.type === 'gloves') {
      save.equippedGlovesId = item.id;
    } else if (item.type === 'accessory') {
      save.equippedAccessoryId = item.id;
    }
    saveCareerData(save);
    return { success: true, message: `${item.nameKo}을(를) 장착했습니다!` };
  }

  // Position restriction check
  if (item.position !== 'all' && item.position !== save.position) {
    const requiredPos = item.position === 'striker' ? '스트라이커' : '골키퍼';
    return {
      success: false,
      message: `이 장비는 ${requiredPos} 포지션 전용입니다!`,
    };
  }

  // Gold check
  if (save.gold < item.price) {
    return {
      success: false,
      message: `골드가 부족합니다! (필요: ${item.price}G, 보유: ${save.gold}G)`,
    };
  }

  // Purchase and equip
  save.gold -= item.price;
  save.inventoryIds.push(item.id);

  if (item.type === 'boots') {
    save.equippedBootsId = item.id;
  } else if (item.type === 'gloves') {
    save.equippedGlovesId = item.id;
  } else if (item.type === 'accessory') {
    save.equippedAccessoryId = item.id;
  }

  saveCareerData(save);
  return {
    success: true,
    message: `${item.nameKo}을(를) 성공적으로 구매하고 장착했습니다!`,
  };
}

/**
 * Computes total effective player stats by adding bonuses from equipped items to base stats.
 */
export function getTotalPlayerStats(save: CareerSaveData): CareerStats {
  const total: CareerStats = { ...save.stats };

  const equippedIds = [
    save.equippedBootsId,
    save.equippedGlovesId,
    save.equippedAccessoryId,
  ].filter(Boolean);

  for (const id of equippedIds) {
    const item = EQUIPMENT_CATALOG.find((e) => e.id === id);
    if (!item || !item.statBonus) continue;

    for (const [key, bonus] of Object.entries(item.statBonus)) {
      const statKey = key as keyof CareerStats;
      if (typeof bonus === 'number') {
        total[statKey] = (total[statKey] ?? 0) + bonus;
      }
    }
  }

  return total;
}

/**
 * Processes the outcome of a career match:
 * - Updates player's stats, gold, and TP
 * - Updates the standings table for player and opponent
 * - Simulates the AI vs AI match in this round to keep the league alive
 * - Re-sorts the table
 * - Checks for promotion/championship at the end of the 6-game season
 */
export function processCareerMatchResult(
  save: CareerSaveData,
  myScore: number,
  oppScore: number,
  opponentId: string,
): {
  won: boolean;
  goldEarned: number;
  tpEarned: number;
  promoted: boolean;
  champion: boolean;
} {
  const won = myScore > oppScore;

  // Rewards: Higher divisions give higher gold/TP bonuses
  const divBonus = 5 - save.division; // Division 4 -> 1, Division 1 -> 4
  const goldEarned = won ? 150 + divBonus * 35 : 50; // 185G ~ 290G for win, 50G for loss
  const tpEarned = won ? 20 + divBonus * 2 : 10;     // 22 ~ 28 TP for win, 10 TP for loss

  // Update Career Records
  save.careerMatches++;
  save.careerGoals += myScore;
  if (save.position === 'goalkeeper') {
    save.careerSaves += Math.max(0, 5 - oppScore);
  }
  if (won) save.careerWins++;
  save.gold += goldEarned;
  save.trainingPoints += tpEarned;

  // Add to match history
  const historyItem: CareerMatchResult = {
    opponentTeamId: opponentId,
    myScore,
    opponentScore: oppScore,
    won,
    goldEarned,
    tpEarned,
    date: new Date().toISOString(),
  };
  save.matchHistory.push(historyItem);

  // 1. Update Player row in standings
  const playerRow = save.standings.find((s) => s.teamId === 'player_team');
  if (playerRow) {
    playerRow.played++;
    if (won) {
      playerRow.won++;
      playerRow.points += 3;
    } else {
      playerRow.lost++;
    }
    playerRow.goalsFor += myScore;
    playerRow.goalsAgainst += oppScore;
    playerRow.goalDiff = playerRow.goalsFor - playerRow.goalsAgainst;
  }

  // 2. Update Opponent row in standings
  const oppRow = save.standings.find((s) => s.teamId === opponentId);
  if (oppRow) {
    oppRow.played++;
    if (!won) {
      oppRow.won++;
      oppRow.points += 3;
    } else {
      oppRow.lost++;
    }
    oppRow.goalsFor += oppScore;
    oppRow.goalsAgainst += myScore;
    oppRow.goalDiff = oppRow.goalsFor - oppRow.goalsAgainst;
  }

  // 3. Simulate the other AI match in this round
  const otherTeams = save.standings.filter(
    (s) => s.teamId !== 'player_team' && s.teamId !== opponentId,
  );
  if (otherTeams.length >= 2) {
    const teamA = otherTeams[0];
    const teamB = otherTeams[1];
    const ratingA = DIVISION_TEAMS.find((t) => t.id === teamA.teamId)?.rating || 50;
    const ratingB = DIVISION_TEAMS.find((t) => t.id === teamB.teamId)?.rating || 50;

    // Simulate shootout score (e.g. 3-2, 4-3, 5-4)
    const baseScore = Math.floor(Math.random() * 3) + 2;
    let scoreA = baseScore;
    let scoreB = baseScore;
    const probA = 0.5 + (ratingA - ratingB) * 0.01;

    if (Math.random() < probA) {
      scoreA += 1;
    } else {
      scoreB += 1;
    }

    teamA.played++;
    teamB.played++;
    teamA.goalsFor += scoreA;
    teamA.goalsAgainst += scoreB;
    teamA.goalDiff = teamA.goalsFor - teamA.goalsAgainst;

    teamB.goalsFor += scoreB;
    teamB.goalsAgainst += scoreA;
    teamB.goalDiff = teamB.goalsFor - teamB.goalsAgainst;

    if (scoreA > scoreB) {
      teamA.won++;
      teamA.points += 3;
      teamB.lost++;
    } else {
      teamB.won++;
      teamB.points += 3;
      teamA.lost++;
    }
  }

  // 4. Sort Standings Table: Points -> Goal Difference -> Goals For -> teamId
  save.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });

  // Advance match counter
  save.currentMatchIndex++;

  // 5. Check Season Completion (6 matches per season)
  let promoted = false;
  let champion = false;

  if (save.currentMatchIndex >= 6) {
    const isFirstPlace = save.standings[0]?.teamId === 'player_team';

    if (isFirstPlace) {
      if (save.division === 1) {
        // Ultimate Champion!
        champion = true;
        save.seasonNumber++;
        save.currentMatchIndex = 0;
        save.standings = createInitialStandings(1);
      } else {
        // Promoted to higher division
        promoted = true;
        save.division -= 1;
        save.seasonNumber++;
        save.currentMatchIndex = 0;
        save.standings = createInitialStandings(save.division);
      }
    } else {
      // Relegated or remain in current division for next season
      save.seasonNumber++;
      save.currentMatchIndex = 0;
      save.standings = createInitialStandings(save.division);
    }
  }

  saveCareerData(save);

  return {
    won,
    goldEarned,
    tpEarned,
    promoted,
    champion,
  };
}
