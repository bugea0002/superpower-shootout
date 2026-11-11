import { KickerSkillId, KeeperSkillId, SkillDefinition, DiveZone, GoalRect } from './types';

export const KICKER_SKILLS: SkillDefinition<KickerSkillId>[] = [
  {
    id: 'flame',
    key: '1',
    nameKo: '플레임 캐논',
    nameEn: 'FLAME CANNON',
    manaCost: 35,
    color: '#f97316',
    accentColor: '#fef08a',
    desc: '초고속 화염 직격포! 일반 세이브를 뚫고 골망을 가를 확률 존재',
  },
  {
    id: 'mirage',
    key: '2',
    nameKo: '환영 분신슛',
    nameEn: 'MIRAGE SHOT',
    manaCost: 40,
    color: '#06b6d4',
    accentColor: '#cffafe',
    desc: '공이 3개의 환영으로 분열하여 골키퍼의 예측을 교란',
  },
  {
    id: 'curve',
    key: '3',
    nameKo: '궤적 왜곡',
    nameEn: 'TELEKINESIS',
    manaCost: 45,
    color: '#c084fc',
    accentColor: '#fae8ff',
    desc: '비행 중 염동력으로 공의 방향을 반대 구석으로 급격히 꺾음',
  },
  {
    id: 'chrono',
    key: '4',
    nameKo: '타임 스톱슛',
    nameEn: 'CHRONO DELAY',
    manaCost: 50,
    color: '#eab308',
    accentColor: '#fef9c3',
    desc: '공중에 잠시 정지해 다이빙을 헛치게 만든 뒤 초가속 돌진',
  },
];

export const KEEPER_SKILLS: SkillDefinition<KeeperSkillId>[] = [
  {
    id: 'titan',
    key: '1',
    nameKo: '거인화 수호',
    nameEn: 'TITAN GRIP',
    manaCost: 35,
    color: '#22c55e',
    accentColor: '#bbf7d0',
    desc: '몸집이 거대해져 방어 범위 증폭 + 플레임 캐논 완벽 제압',
  },
  {
    id: 'icewall',
    key: '2',
    nameKo: '얼음 장벽',
    nameEn: 'ICE BARRIER',
    manaCost: 35,
    color: '#38bdf8',
    accentColor: '#e0f2fe',
    desc: '반대편 코너에 크리스탈 얼음벽을 세워 2곳을 동시에 방어',
  },
  {
    id: 'blackhole',
    key: '3',
    nameKo: '블랙홀 실드',
    nameEn: 'GRAVITY PULL',
    manaCost: 40,
    color: '#a855f7',
    accentColor: '#f3e8ff',
    desc: '강력한 중력장으로 주변을 지나는 공과 환영 분신을 흡수 포획',
  },
  {
    id: 'blink',
    key: '4',
    nameKo: '순간이동 세이브',
    nameEn: 'BLINK SAVE',
    manaCost: 50,
    color: '#f43f5e',
    accentColor: '#ffe4e6',
    desc: '골라인 도달 직전 실제 공의 위치로 즉발 워프하여 슈퍼 세이브',
  },
];

export function getKickerSkill(id: KickerSkillId): SkillDefinition<KickerSkillId> | undefined {
  return KICKER_SKILLS.find((s) => s.id === id);
}

export function getKeeperSkill(id: KeeperSkillId): SkillDefinition<KeeperSkillId> | undefined {
  return KEEPER_SKILLS.find((s) => s.id === id);
}

export function zoneToGoalCoords(zone: DiveZone, goal: GoalRect): { x: number; y: number } {
  const thirdW = goal.width / 3;
  const halfH = goal.height / 2;

  let col = 1;
  if (zone === 'top_left' || zone === 'low_left') col = 0;
  else if (zone === 'top_right' || zone === 'low_right') col = 2;

  const row = zone.startsWith('top') ? 0 : 1;

  return {
    x: goal.left + thirdW * (col + 0.5),
    y: goal.top + halfH * (row + 0.52),
  };
}

export function coordsToZone(x: number, y: number, goal: GoalRect): DiveZone {
  const relX = (x - goal.left) / goal.width;
  const relY = (y - goal.top) / goal.height;

  const isTop = relY < 0.48;
  if (relX < 0.35) {
    return isTop ? 'top_left' : 'low_left';
  } else if (relX > 0.65) {
    return isTop ? 'top_right' : 'low_right';
  } else {
    return isTop ? 'top_center' : 'center';
  }
}

export function getOppositeCornerZone(zone: DiveZone): DiveZone {
  switch (zone) {
    case 'top_left':
      return 'low_right';
    case 'low_left':
      return 'top_right';
    case 'top_right':
      return 'low_left';
    case 'low_right':
      return 'top_left';
    case 'top_center':
      return 'low_left';
    case 'center':
      return 'top_right';
  }
}
