import {
  CareerEquipment,
  CareerSaveData,
  CareerStats,
  LeagueTeam,
  PlayerPosition,
} from './careerTypes';
import {
  drawDivisionEmblem,
  drawLockerPlayer,
  drawLockerRoomBg,
  drawPixelIcon,
  drawPositionCard,
  PixelIconType,
  px,
  pxBox,
} from './careerSprites';
import {
  drawSmartphoneUI,
  drawPressConferenceUI,
  drawNewspaperUI,
  drawManagerOfficeUI,
  drawReputationHUD,
} from './careerEventSprites';
import {
  calculateTrainCost,
  EQUIPMENT_CATALOG,
  getNextOpponent,
  getTotalPlayerStats,
} from './careerData';
import { AccessoryId, HairStyleId, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './types';

export type CareerHubTab = 'overview' | 'training' | 'shop' | 'standings';

export interface ProfileCreationState {
  playerName: string;
  teamName: string;
  jerseyNumber: number;
  hairStyle: HairStyleId;
  accessory: AccessoryId;
  selectedPos: PlayerPosition;
}

/**
 * 1. Position Selection Screen (Striker vs Goalkeeper)
 */
export function renderCareerPositionSelect(
  ctx: CanvasRenderingContext2D,
  selectedPos: PlayerPosition,
  hoveredPos: PlayerPosition | null,
  time: number
): void {
  // Dark futuristic stadium backdrop
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#070b14');

  // Animated background scanlines
  for (let y = 0; y < VIRTUAL_HEIGHT; y += 4) {
    px(ctx, 0, y, VIRTUAL_WIDTH, 1, 'rgba(255,255,255,0.02)');
  }

  // Header Title
  ctx.textAlign = 'center';
  ctx.font = '900 13px "Press Start 2P", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText('CHOOSE YOUR DESTINY', VIRTUAL_WIDTH / 2, 28);

  ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('커리어 모드에서 육성할 당신의 대표 포지션을 선택하세요', VIRTUAL_WIDTH / 2, 44);

  // Cards layout (w: 180, h: 186)
  const cardW = 180;
  const cardH = 186;
  const cardY = 52;
  const strikerX = 50;
  const keeperX = 250;

  // Striker Card
  drawPositionCard(
    ctx,
    strikerX,
    cardY,
    cardW,
    cardH,
    'striker',
    selectedPos === 'striker',
    hoveredPos === 'striker',
    time
  );

  // Goalkeeper Card
  drawPositionCard(
    ctx,
    keeperX,
    cardY,
    cardW,
    cardH,
    'goalkeeper',
    selectedPos === 'goalkeeper',
    hoveredPos === 'goalkeeper',
    time
  );

  // Bottom Confirmation Bar
  const bottomBarY = 246;
  pxBox(ctx, 110, bottomBarY, 260, 20, '#1e293b', '#facc15', 1);
  ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('▶ [ENTER / 터치] 선택 완료 및 계약 진행', VIRTUAL_WIDTH / 2, bottomBarY + 13);
}

/**
 * 2. Player Profile & Appearance Creation Screen
 */
export function renderCareerCreateProfile(
  ctx: CanvasRenderingContext2D,
  profile: ProfileCreationState,
  time: number
): void {
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#070b14');

  // Top Title
  ctx.textAlign = 'center';
  ctx.font = '900 12px "Press Start 2P", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText('PLAYER CONTRACT REGISTRATION', VIRTUAL_WIDTH / 2, 26);

  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('프로필 정보를 확인하고 입단 계약서에 서명하세요', VIRTUAL_WIDTH / 2, 40);

  // Left: Character Preview Stage (x: 40, y: 52, w: 130, h: 180)
  pxBox(ctx, 40, 52, 130, 180, '#0f172a', '#334155', 2);
  // Stage Spotlight
  px(ctx, 45, 186, 120, 36, '#1e293b');
  px(ctx, 55, 196, 100, 18, '#334155');
  // Character render
  drawLockerPlayer(ctx, 105, 172, profile.selectedPos, profile.hairStyle, profile.accessory, time);

  // Position badge under player
  const posBadgeText = profile.selectedPos === 'striker' ? 'STRIKER' : 'GOALKEEPER';
  const posBadgeColor = profile.selectedPos === 'striker' ? '#f97316' : '#2dd4bf';
  pxBox(ctx, 55, 60, 100, 16, 'rgba(0,0,0,0.6)', posBadgeColor, 1);
  ctx.font = '900 7.5px "Press Start 2P", monospace';
  ctx.fillStyle = posBadgeColor;
  ctx.fillText(posBadgeText, 105, 71);

  // Right: Profile Inputs Box (x: 184, y: 52, w: 256, h: 180)
  pxBox(ctx, 184, 52, 256, 180, '#0f172a', '#334155', 2);

  ctx.textAlign = 'left';
  let curY = 72;

  // 1. Player Name
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('선수 이름:', 196, curY);
  pxBox(ctx, 252, curY - 10, 176, 16, '#1e293b', '#64748b', 1);
  ctx.fillStyle = '#facc15';
  ctx.fillText(profile.playerName, 260, curY + 1);

  // 2. Team Name
  curY += 24;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('소속 구단:', 196, curY);
  pxBox(ctx, 252, curY - 10, 176, 16, '#1e293b', '#64748b', 1);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(profile.teamName, 260, curY + 1);

  // 3. Jersey Number
  curY += 24;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('등번호:', 196, curY);
  pxBox(ctx, 252, curY - 10, 50, 16, '#1e293b', '#64748b', 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`No.${profile.jerseyNumber}`, 277, curY + 1);
  ctx.textAlign = 'left';
  ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('(클릭하여 변경)', 310, curY);

  // 4. Hair Style
  curY += 24;
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('헤어스타일:', 196, curY);
  pxBox(ctx, 252, curY - 10, 84, 16, '#1e293b', '#64748b', 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(profile.hairStyle.toUpperCase(), 294, curY + 1);
  ctx.textAlign = 'left';

  // 5. Accessory
  curY += 24;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('액세서리:', 196, curY);
  pxBox(ctx, 252, curY - 10, 84, 16, '#1e293b', '#64748b', 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(profile.accessory.toUpperCase(), 294, curY + 1);
  ctx.textAlign = 'left';

  // Sign Contract Button
  const signBtnY = 202;
  pxBox(ctx, 196, signBtnY, 232, 22, '#ca8a04', '#facc15', 1);
  ctx.textAlign = 'center';
  ctx.font = '900 8.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText('SIGN CONTRACT & ENTER', 196 + 116, signBtnY + 15);

  // Bottom tip
  ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('항목을 클릭하여 변경하거나 [ENTER]를 눌러 계약을 완료하세요', VIRTUAL_WIDTH / 2, 248);
}

/**
 * 3. Career Clubhouse Locker Room (Main Hub)
 */
export function renderCareerHub(
  ctx: CanvasRenderingContext2D,
  save: CareerSaveData,
  time: number
): void {
  // 1. Draw 100% Procedural Pixel Locker Room Background
  drawLockerRoomBg(ctx, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, time);

  // 2. Draw Player standing by the bench in center
  drawLockerPlayer(
    ctx,
    240,
    192,
    save.position,
    save.hairStyle,
    save.accessory,
    time
  );

  // 3. Top HUD Bar (x: 0, y: 0, w: 480, h: 36)
  pxBox(ctx, 0, 0, VIRTUAL_WIDTH, 36, 'rgba(15, 23, 42, 0.92)', '#334155', 1);

  // Division Emblem & Name on Left
  const divNames = ['', 'DIV 1: GODS', 'DIV 2: SUPER PRO', 'DIV 3: CYBER YOUTH', 'DIV 4: ROOKIE'];
  const divEmblemKeys = ['', 'gods', 'pro', 'cyber', 'street'];
  drawDivisionEmblem(ctx, divEmblemKeys[save.division], 8, 4, 28);

  ctx.textAlign = 'left';
  ctx.font = '900 8px "Press Start 2P", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText(divNames[save.division], 42, 16);

  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${save.teamName} | ${save.playerName} (No.${save.jerseyNumber})`, 42, 28);

  // Currencies on Right: Gold and TP
  const rightHUDX = 320;
  // Gold
  drawPixelIcon(ctx, 'coin', rightHUDX, 10, 16);
  ctx.font = '900 8px "Press Start 2P", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText(`${save.gold}G`, rightHUDX + 20, 22);

  // TP
  drawPixelIcon(ctx, 'tp', rightHUDX + 85, 10, 16);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${save.trainingPoints}TP`, rightHUDX + 105, 22);

  // 4. Next Match Schedule Card (Left side: x: 12, y: 44, w: 140, h: 72)
  const nextOpponent = getNextOpponent(save);
  pxBox(ctx, 12, 44, 140, 72, 'rgba(15, 23, 42, 0.88)', '#eab308', 1);

  const calEntry = save.calendar?.[save.currentWeek - 1];
  const isChamp = calEntry?.type === 'champions';
  const stageTitle = isChamp ? '🌟 [UCL 챔스컵]' : `[분데스리가] W${save.currentWeek}/34`;

  ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = isChamp ? '#38bdf8' : '#fde047';
  ctx.fillText(stageTitle, 18, 56);

  drawDivisionEmblem(ctx, nextOpponent.emblemKey, 18, 62, 22);
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(nextOpponent.nameKo, 46, 73);

  ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`상대 OVR: ${nextOpponent.rating} | 에이스 스킬`, 46, 85);
  ctx.fillText(`시즌 전적: ${save.careerWins}승 ${save.careerMatches - save.careerWins}패`, 18, 104);

  // 4.5 Top-Right FM Reputation HUD (x: 168, y: 44, w: 156)
  if (save.reputation) {
    drawReputationHUD(ctx, save.reputation, 166, 44, 160);
  }

  // 4.6 Active Buff Banner (if active)
  if (save.activeBuff) {
    pxBox(ctx, 166, 84, 160, 32, '#0f172a', '#4ade80', 1);
    ctx.textAlign = 'left';
    ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`⚡ [버프] ${save.activeBuff.nameKo}`, 174, 96);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`효과: +${save.activeBuff.value} (${save.activeBuff.matchesLeft}경기 남음)`, 174, 108);
  }

  // 5. Total Effective Player Stats Card (Right side: x: 338, y: 44, w: 130, h: 70)
  const totalStats = getTotalPlayerStats(save);
  pxBox(ctx, 338, 44, 130, 70, 'rgba(15, 23, 42, 0.88)', '#3b82f6', 1);

  ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#60a5fa';
  ctx.fillText('[선수 종합 능력치]', 344, 56);

  ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#cbd5e1';
  if (save.position === 'striker') {
    ctx.fillText(`파워: ${totalStats.power}   커브: ${totalStats.curve}`, 344, 70);
    ctx.fillText(`스위트스팟: ${totalStats.sweetSpot}  집중: ${totalStats.focus}`, 344, 82);
    ctx.fillText(`최대마나: ${totalStats.maxMana}  마나회복: ${totalStats.manaRegen}`, 344, 94);
  } else {
    ctx.fillText(`민첩: ${totalStats.agility}   리치: ${totalStats.reach}`, 344, 70);
    ctx.fillText(`침착: ${totalStats.composure}  예측: ${totalStats.anticipation}`, 344, 82);
    ctx.fillText(`최대마나: ${totalStats.maxMana}  마나회복: ${totalStats.manaRegen}`, 344, 94);
  }
  ctx.fillStyle = '#facc15';
  ctx.fillText(`통산 득점: ${save.careerGoals}골 / 세이브: ${save.careerSaves}회`, 344, 106);

  // 6. Bottom Navigation Action Buttons (4 Buttons)
  const btnY = 224;
  const btnH = 26;
  const buttons = [
    { id: 'match', title: '⚽ 매치데이 경기 시작', color: '#facc15', bg: '#854d0e', x: 12, w: 150 },
    { id: 'training', title: '🏋️ 스탯 훈련소', color: '#38bdf8', bg: '#0369a1', x: 168, w: 96 },
    { id: 'shop', title: '🛍️ 장비 상점', color: '#c084fc', bg: '#6b21a8', x: 270, w: 96 },
    { id: 'standings', title: '📊 리그 순위표', color: '#4ade80', bg: '#15803d', x: 372, w: 96 },
  ];

  buttons.forEach((b) => {
    pxBox(ctx, b.x, btnY, b.w, btnH, b.bg, b.color, 1);
    ctx.textAlign = 'center';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(b.title, b.x + b.w / 2, btnY + 16);
  });

  // Footer Tip
  ctx.font = '700 6.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('마우스/터치로 탭을 클릭하거나 [1~4] 키를 눌러 메뉴를 이용하세요', VIRTUAL_WIDTH / 2, 260);
}

/**
 * 4. Training Screen (Stats upgrade with TP)
 */
export function renderCareerTraining(
  ctx: CanvasRenderingContext2D,
  save: CareerSaveData,
  selectedStatIdx: number,
  time: number
): void {
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#070b14');

  // Header
  pxBox(ctx, 0, 0, VIRTUAL_WIDTH, 34, '#0f172a', '#334155', 1);
  ctx.textAlign = 'left';
  ctx.font = '900 10px "Press Start 2P", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('CLUB TRAINING FACILITY', 16, 22);

  // TP in Top Right
  drawPixelIcon(ctx, 'tp', 360, 9, 16);
  ctx.font = '900 9px "Press Start 2P", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${save.trainingPoints} TP`, 384, 22);

  // Stat Categories depending on position
  const isStriker = save.position === 'striker';
  const statList: Array<{ key: keyof CareerStats; nameKo: string; icon: PixelIconType; desc: string }> = isStriker
    ? [
        { key: 'power', nameKo: '슛 파워', icon: 'stat_power', desc: '공 비행 속도 & 키퍼 방어 관통력 증가' },
        { key: 'curve', nameKo: '궤적 왜곡/커브', icon: 'stat_curve', desc: '공의 급격한 꺾임 각도 & 스핀 조절' },
        { key: 'sweetSpot', nameKo: '임팩트 정확도', icon: 'stat_sweetspot', desc: '파워 게이지의 퍼펙트(초록) 구간 너비 확장' },
        { key: 'focus', nameKo: '집중력', icon: 'stat_focus', desc: '조준점 흔들림 감소 & 게이지 속도 안정' },
        { key: 'maxMana', nameKo: '최대 마나', icon: 'stat_mana', desc: '경기 중 초능력 스킬 난사 기회 확대' },
        { key: 'manaRegen', nameKo: '마나 재생력', icon: 'stat_mana', desc: '매 턴 자동 회복되는 마나량 증가' },
      ]
    : [
        { key: 'agility', nameKo: '순발력/민첩성', icon: 'stat_agility', desc: '다이빙 이동 속도 & 세이브 반응 가속' },
        { key: 'reach', nameKo: '캐치 반경', icon: 'stat_reach', desc: '세이브 히트박스 영역 대폭 확대' },
        { key: 'composure', nameKo: '역방향 침착성', icon: 'stat_composure', desc: '역방향 다이빙 시 감속 페널티 저항' },
        { key: 'anticipation', nameKo: '궤적 예측력', icon: 'stat_focus', desc: '상대 슛 방향 미세 가이드 표시' },
        { key: 'maxMana', nameKo: '최대 마나', icon: 'stat_mana', desc: '초능력 세이브 스킬 연속 발동 기회' },
        { key: 'manaRegen', nameKo: '마나 재생력', icon: 'stat_mana', desc: '매 턴 자동 회복되는 마나량 증가' },
      ];

  // Stat Cards (6 rows, 2 columns)
  for (let i = 0; i < statList.length; i++) {
    const item = statList[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cardX = 16 + col * 228;
    const cardY = 46 + row * 56;
    const cardW = 220;
    const cardH = 50;

    const isSelected = selectedStatIdx === i;
    const curVal = save.stats[item.key];
    const cost = calculateTrainCost(save, item.key);
    const canAfford = save.trainingPoints >= cost;

    pxBox(
      ctx,
      cardX,
      cardY,
      cardW,
      cardH,
      isSelected ? '#1e293b' : '#0f172a',
      isSelected ? '#38bdf8' : '#334155',
      isSelected ? 2 : 1
    );

    // Icon
    drawPixelIcon(ctx, item.icon, cardX + 8, cardY + 8, 16);

    // Name & Current Stat Value
    ctx.textAlign = 'left';
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isSelected ? '#38bdf8' : '#f8fafc';
    ctx.fillText(`${item.nameKo}: ${curVal}`, cardX + 30, cardY + 18);

    // Stat Bar (0 ~ 99)
    const maxVal = item.key === 'maxMana' ? 120 : item.key === 'manaRegen' ? 25 : 99;
    const fillRatio = Math.min(1, curVal / maxVal);
    px(ctx, cardX + 30, cardY + 23, 110, 6, '#0f172a');
    px(ctx, cardX + 30, cardY + 23, 110 * fillRatio, 6, isSelected ? '#38bdf8' : '#0284c7');

    // Description
    ctx.font = '700 6.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(item.desc, cardX + 30, cardY + 38);

    // Upgrade Button on Right
    const btnX = cardX + 150;
    const btnY = cardY + 14;
    pxBox(ctx, btnX, btnY, 60, 22, canAfford ? '#0369a1' : '#1e293b', canAfford ? '#38bdf8' : '#475569', 1);
    ctx.textAlign = 'center';
    ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = canAfford ? '#ffffff' : '#64748b';
    ctx.fillText(`+강화 (${cost}TP)`, btnX + 30, btnY + 14);
  }

  // Bottom return bar
  const bottomBarY = 230;
  pxBox(ctx, 16, bottomBarY, VIRTUAL_WIDTH - 32, 28, '#0f172a', '#334155', 1);
  ctx.textAlign = 'center';
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#fde047';
  ctx.fillText('▶ [스페이스 / 엔터 / 클릭] 선택 스탯 훈련 진행   |   [ESC] 라커룸 복귀', VIRTUAL_WIDTH / 2, bottomBarY + 17);
}

/**
 * 5. Equipment Shop Screen
 */
export function renderCareerShop(
  ctx: CanvasRenderingContext2D,
  save: CareerSaveData,
  selectedEquipIdx: number,
  time: number
): void {
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#070b14');

  // Header
  pxBox(ctx, 0, 0, VIRTUAL_WIDTH, 34, '#0f172a', '#334155', 1);
  ctx.textAlign = 'left';
  ctx.font = '900 10px "Press Start 2P", monospace';
  ctx.fillStyle = '#c084fc';
  ctx.fillText('PRO GEAR & BOUTIQUE', 16, 22);

  // Gold in Top Right
  drawPixelIcon(ctx, 'coin', 370, 9, 16);
  ctx.font = '900 9px "Press Start 2P", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText(`${save.gold} G`, 394, 22);

  // Filter Catalog by player position + all
  const filteredGear = EQUIPMENT_CATALOG.filter(
    (g) => g.position === 'all' || g.position === save.position
  );

  const safeIdx = Math.max(0, Math.min(filteredGear.length - 1, selectedEquipIdx));
  const selectedGear = filteredGear[safeIdx];

  // Left: Item Catalog List (x: 16, y: 44, w: 260, h: 180)
  pxBox(ctx, 16, 44, 260, 180, '#0f172a', '#334155', 1);
  for (let i = 0; i < filteredGear.length; i++) {
    const item = filteredGear[i];
    const isSelected = i === safeIdx;
    const isOwned = save.inventoryIds.includes(item.id);
    const isEquipped =
      save.equippedBootsId === item.id ||
      save.equippedGlovesId === item.id ||
      save.equippedAccessoryId === item.id;

    const rowY = 50 + i * 28;
    pxBox(
      ctx,
      20,
      rowY,
      252,
      24,
      isSelected ? '#1e293b' : '#0f172a',
      isSelected ? '#c084fc' : '#1e293b',
      1
    );

    // Icon
    const iconType = item.type === 'boots' ? 'boots' : item.type === 'gloves' ? 'gloves' : 'medal';
    drawPixelIcon(ctx, iconType, 26, rowY + 4, 16);

    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isSelected ? '#c084fc' : '#f8fafc';
    ctx.fillText(item.nameKo, 48, rowY + 15);

    // Status on right
    ctx.textAlign = 'right';
    if (isEquipped) {
      ctx.fillStyle = '#22c55e';
      ctx.fillText('[장착중]', 264, rowY + 15);
    } else if (isOwned) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('[보유중]', 264, rowY + 15);
    } else {
      ctx.fillStyle = '#facc15';
      ctx.fillText(`${item.price} G`, 264, rowY + 15);
    }
  }

  // Right: Selected Item Details Box (x: 284, y: 44, w: 180, h: 180)
  pxBox(ctx, 284, 44, 180, 180, '#0f172a', '#c084fc', 2);
  if (selectedGear) {
    ctx.textAlign = 'center';
    ctx.font = '900 8.5px "Press Start 2P", monospace';
    ctx.fillStyle = selectedGear.color;
    ctx.fillText(selectedGear.nameEn, 284 + 90, 64);

    ctx.font = '700 9px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(selectedGear.nameKo, 284 + 90, 80);

    // Large Icon preview
    const previewIcon = selectedGear.type === 'boots' ? 'boots' : selectedGear.type === 'gloves' ? 'gloves' : 'medal';
    drawPixelIcon(ctx, previewIcon, 284 + 74, 90, 32);

    // Stat bonuses list
    ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#4ade80';
    let bY = 138;
    for (const [k, v] of Object.entries(selectedGear.statBonus)) {
      ctx.fillText(`+${v} ${k.toUpperCase()}`, 284 + 90, bY);
      bY += 12;
    }

    // Description
    ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(selectedGear.descKo, 284 + 90, 172);

    // Buy/Equip Button
    const isOwned = save.inventoryIds.includes(selectedGear.id);
    const isEquipped =
      save.equippedBootsId === selectedGear.id ||
      save.equippedGlovesId === selectedGear.id ||
      save.equippedAccessoryId === selectedGear.id;

    const btnY = 194;
    const btnText = isEquipped ? '장착 중' : isOwned ? '장착하기' : `구매하기 (${selectedGear.price}G)`;
    const canBuy = save.gold >= selectedGear.price;
    pxBox(ctx, 294, btnY, 160, 22, isEquipped ? '#15803d' : canBuy ? '#6b21a8' : '#1e293b', '#c084fc', 1);
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(btnText, 284 + 90, btnY + 15);
  }

  // Bottom return bar
  const bottomBarY = 232;
  pxBox(ctx, 16, bottomBarY, VIRTUAL_WIDTH - 32, 26, '#0f172a', '#334155', 1);
  ctx.textAlign = 'center';
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#fde047';
  ctx.fillText('▶ [스페이스 / 엔터] 구매/장착   |   [위/아래] 목록 이동   |   [ESC] 라커룸 복귀', VIRTUAL_WIDTH / 2, bottomBarY + 17);
}

/**
 * 6. Division Standings Table Screen
 */
export function renderCareerStandings(
  ctx: CanvasRenderingContext2D,
  save: CareerSaveData,
  time: number
): void {
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#070b14');

  // Header
  pxBox(ctx, 0, 0, VIRTUAL_WIDTH, 34, '#0f172a', '#334155', 1);
  ctx.textAlign = 'left';
  ctx.font = '900 10px "Press Start 2P", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('LEAGUE TABLE & STANDINGS', 16, 22);

  ctx.textAlign = 'right';
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText(`시즌 ${save.seasonNumber} (진행: ${save.currentMatchIndex}/6 경기)`, VIRTUAL_WIDTH - 16, 22);

  // Standings Card (x: 20, y: 46, w: 440, h: 174)
  pxBox(ctx, 20, 46, 440, 174, '#0f172a', '#334155', 1);

  // Table Columns
  // Rank(30), Team(160), P(30), W(30), L(30), GF(30), GA(30), GD(40), PTS(40)
  const headerY = 64;
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText('순위', 40, headerY);
  ctx.textAlign = 'left';
  ctx.fillText('구단명', 80, headerY);
  ctx.textAlign = 'center';
  ctx.fillText('경기', 230, headerY);
  ctx.fillText('승', 260, headerY);
  ctx.fillText('패', 290, headerY);
  ctx.fillText('득', 320, headerY);
  ctx.fillText('실', 350, headerY);
  ctx.fillText('득실', 385, headerY);
  ctx.fillStyle = '#facc15';
  ctx.fillText('승점', 425, headerY);

  px(ctx, 26, 70, 428, 1, '#334155');

  // Table Rows (4 teams)
  for (let i = 0; i < save.standings.length; i++) {
    const row = save.standings[i];
    const isPlayer = row.teamId === 'player_team';
    const rowY = 82 + i * 32;

    if (isPlayer) {
      pxBox(ctx, 24, rowY - 8, 432, 28, '#1e293b', '#38bdf8', 1);
    }

    // Rank & Promotion Marker
    ctx.textAlign = 'center';
    ctx.font = '900 9px "Press Start 2P", monospace';
    if (i === 0) {
      ctx.fillStyle = '#facc15';
      ctx.fillText('1★', 40, rowY + 9); // Leader
    } else {
      ctx.fillStyle = isPlayer ? '#38bdf8' : '#ffffff';
      ctx.fillText(`${i + 1}`, 40, rowY + 9);
    }

    // Team Name
    const tName = isPlayer ? `${save.teamName} (MY)` : row.teamId;
    ctx.textAlign = 'left';
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isPlayer ? '#38bdf8' : '#f8fafc';
    ctx.fillText(tName, 80, rowY + 9);

    // Stats
    ctx.textAlign = 'center';
    ctx.font = '700 8px "Press Start 2P", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`${row.played}`, 230, rowY + 9);
    ctx.fillText(`${row.won}`, 260, rowY + 9);
    ctx.fillText(`${row.lost}`, 290, rowY + 9);
    ctx.fillText(`${row.goalsFor}`, 320, rowY + 9);
    ctx.fillText(`${row.goalsAgainst}`, 350, rowY + 9);
    ctx.fillText(`${row.goalDiff >= 0 ? '+' : ''}${row.goalDiff}`, 385, rowY + 9);

    // Points
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${row.points}`, 425, rowY + 9);
  }

  // Promotion Rule Tip
  ctx.textAlign = 'left';
  ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('★ 시즌 6경기 종료 후 1위 팀은 상위 디비전으로 승격됩니다!', 30, 204);

  // Bottom return bar
  const bottomBarY = 230;
  pxBox(ctx, 20, bottomBarY, 440, 26, '#0f172a', '#334155', 1);
  ctx.textAlign = 'center';
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#fde047';
  ctx.fillText('▶ [ESC / 클릭] 라커룸 허브로 돌아가기', VIRTUAL_WIDTH / 2, bottomBarY + 17);
}

/**
 * 7. FM-Style Interactive Story Event Screen
 * Dispatches to Smartphone, Press Conference, Newspaper, or Manager Office
 */
export function renderCareerStoryEvent(
  ctx: CanvasRenderingContext2D,
  save: CareerSaveData,
  selectedOptionIdx: number,
  time: number
): void {
  const event = save.pendingEvent;
  if (!event) return;

  if (event.type === 'smartphone') {
    drawSmartphoneUI(ctx, event, selectedOptionIdx, time);
  } else if (event.type === 'press_conference') {
    drawPressConferenceUI(ctx, event, selectedOptionIdx, time);
  } else if (event.type === 'newspaper') {
    drawNewspaperUI(ctx, event, selectedOptionIdx, time);
  } else {
    drawManagerOfficeUI(ctx, event, selectedOptionIdx, time);
  }

  // Draw current reputation HUD in top-left
  drawReputationHUD(ctx, save.reputation, 8, 8, 120);
}
