import { PlayerReputation, StoryEvent, StoryEventType } from './careerTypes';
import { px, pxBox } from './careerSprites';
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './types';

/**
 * 100% Procedural Pixel Art Event Visuals
 * 4 Styles: Smartphone, Press Conference, Newspaper, Manager Office
 */

/**
 * Top/Corner Reputation HUD (3 Bars: Trust, Fans, Media)
 */
export function drawReputationHUD(
  ctx: CanvasRenderingContext2D,
  rep: PlayerReputation,
  x: number,
  y: number,
  w = 140
): void {
  pxBox(ctx, x, y, w, 36, 'rgba(15, 23, 42, 0.92)', '#334155', 1);

  // 1. Manager Trust (👔)
  ctx.textAlign = 'left';
  ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText(`👔 신임: ${rep.managerTrust}%`, x + 6, y + 10);
  px(ctx, x + 58, y + 4, 74, 5, '#0f172a');
  px(ctx, x + 58, y + 4, (74 * rep.managerTrust) / 100, 5, '#22c55e');

  // 2. Fan Support (💖)
  ctx.fillStyle = '#f472b6';
  ctx.fillText(`💖 팬덤: ${rep.fanSupport}%`, x + 6, y + 21);
  px(ctx, x + 58, y + 15, 74, 5, '#0f172a');
  px(ctx, x + 58, y + 15, (74 * rep.fanSupport) / 100, 5, '#ec4899');

  // 3. Media Hype (📰)
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`📰 관심: ${rep.mediaHype}%`, x + 6, y + 32);
  px(ctx, x + 58, y + 26, 74, 5, '#0f172a');
  px(ctx, x + 58, y + 26, (74 * rep.mediaHype) / 100, 5, '#0284c7');
}

/**
 * 1. 📱 Smartphone Messenger UI
 */
export function drawSmartphoneUI(
  ctx: CanvasRenderingContext2D,
  event: StoryEvent,
  selectedIdx: number,
  time: number
): void {
  // Dim outer backdrop
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, 'rgba(5, 8, 22, 0.85)');

  // Smartphone Chassis in center (w: 240, h: 250, x: 120, y: 10)
  const phoneX = 120;
  const phoneY = 8;
  const phoneW = 240;
  const phoneH = 254;

  // Phone outer bezel (Metal / Sleek Black)
  pxBox(ctx, phoneX, phoneY, phoneW, phoneH, '#090d16', '#475569', 3);
  pxBox(ctx, phoneX + 3, phoneY + 3, phoneW - 6, phoneH - 6, '#0f172a', '#1e293b', 1);

  // Top speaker & selfie camera notch
  px(ctx, phoneX + phoneW / 2 - 20, phoneY + 5, 40, 4, '#1e293b');
  px(ctx, phoneX + phoneW / 2 + 25, phoneY + 5, 4, 4, '#0284c7'); // Camera lens shine

  // Screen Area (x: 126, y: 18, w: 228, h: 236)
  const sx = phoneX + 6;
  const sy = phoneY + 12;
  const sw = phoneW - 12;
  const sh = phoneH - 20;
  px(ctx, sx, sy, sw, sh, '#0d1527');

  // Status Bar (Time, Wifi, Battery)
  ctx.textAlign = 'left';
  ctx.font = '700 7px "Press Start 2P", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('14:30', sx + 8, sy + 10);
  // Battery bar
  pxBox(ctx, sx + sw - 22, sy + 3, 14, 8, '#0f172a', '#94a3b8', 1);
  px(ctx, sx + sw - 20, sy + 5, 9, 4, '#22c55e');

  // Messenger Header Bar (Chat recipient info)
  pxBox(ctx, sx, sy + 14, sw, 24, '#1e293b', '#334155', 1);
  // Avatar dot circle
  pxBox(ctx, sx + 8, sy + 18, 16, 16, '#0284c7', '#38bdf8', 1);
  px(ctx, sx + 13, sy + 21, 6, 6, '#ffffff');
  // Name & Online green dot
  ctx.textAlign = 'left';
  ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(event.senderOrAuthor, sx + 30, sy + 27);
  // Online indicator dot
  px(ctx, sx + 30, sy + 32, 4, 4, '#22c55e');
  ctx.font = '700 6.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('온라인 대화 중', sx + 37, sy + 36);

  // Received Chat Bubble (Message body)
  const bubbleY = sy + 46;
  pxBox(ctx, sx + 10, bubbleY, sw - 20, 56, '#1e293b', '#3b82f6', 1);
  // Chat tail
  px(ctx, sx + 6, bubbleY + 6, 4, 6, '#1e293b');

  ctx.textAlign = 'left';
  ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#f8fafc';
  // Wrap or format lines
  renderMultilineText(ctx, event.bodyTextKo, sx + 16, bubbleY + 14, sw - 32, 12);

  // Reply Options (Bottom 3 Choices as buttons)
  const optStartY = bubbleY + 64;
  for (let i = 0; i < event.options.length; i++) {
    const opt = event.options[i];
    const isSelected = selectedIdx === i;
    const optY = optStartY + i * 36;
    const btnColor = isSelected ? '#facc15' : '#334155';
    const btnBg = isSelected ? '#1e3a8a' : '#0f172a';

    pxBox(ctx, sx + 8, optY, sw - 16, 32, btnBg, btnColor, isSelected ? 2 : 1);

    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isSelected ? '#fde047' : '#ffffff';
    ctx.fillText(`${i + 1}. ${opt.textKo}`, sx + 14, optY + 13);

    // Consequence / Preview line
    ctx.font = '700 6.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(opt.descKo, sx + 14, optY + 24);
  }

  // Home Bar at phone bottom
  px(ctx, phoneX + phoneW / 2 - 25, phoneY + phoneH - 6, 50, 3, '#94a3b8');
}

/**
 * 2. 🎙️ Press Conference UI
 */
export function drawPressConferenceUI(
  ctx: CanvasRenderingContext2D,
  event: StoryEvent,
  selectedIdx: number,
  time: number
): void {
  // Dark Press Room Backdrop with Sponsor Logo Wall
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#080d1a');

  // Sponsor Logo Grid on Backdrop
  for (let y = 10; y < 110; y += 22) {
    for (let x = 12; x < VIRTUAL_WIDTH - 20; x += 55) {
      pxBox(ctx, x, y, 48, 16, '#0f172a', '#1e293b', 1);
      ctx.textAlign = 'center';
      ctx.font = '700 6px "Press Start 2P", monospace';
      ctx.fillStyle = '#334155';
      ctx.fillText('SUPER', x + 24, y + 11);
    }
  }

  // Camera Flashes! (Twinkling white/cyan bursts in the press crowd)
  const flashAnim = Math.floor(time * 6);
  for (let fi = 0; fi < 5; fi++) {
    const fx = ((flashAnim * 83 + fi * 97) % (VIRTUAL_WIDTH - 30)) + 15;
    const fy = 18 + ((flashAnim * 41 + fi * 29) % 80);
    const flashSize = ((fi + flashAnim) % 3) + 2;
    px(ctx, fx, fy, flashSize, flashSize, '#ffffff');
    px(ctx, fx - 1, fy, flashSize + 2, 1, 'rgba(255,255,255,0.6)');
    px(ctx, fx, fy - 1, 1, flashSize + 2, 'rgba(255,255,255,0.6)');
  }

  // Press Table in foreground (y: 110 ~ 138)
  pxBox(ctx, 20, 110, VIRTUAL_WIDTH - 40, 28, '#1e293b', '#475569', 2);
  // Microphones on table (4 Mics)
  const micPositions = [100, 180, 280, 360];
  micPositions.forEach((mx) => {
    // Mic stand
    px(ctx, mx, 94, 2, 16, '#0f172a');
    // Mic head foam
    pxBox(ctx, mx - 3, 86, 8, 10, '#0284c7', '#38bdf8', 1);
  });
  // Press Nameplate
  pxBox(ctx, 210, 116, 60, 14, '#facc15', '#ca8a04', 1);
  ctx.textAlign = 'center';
  ctx.font = '900 6.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText('PLAYER', 240, 126);

  // Reporter Question Box (x: 20, y: 144, w: 440, h: 42)
  pxBox(ctx, 20, 144, VIRTUAL_WIDTH - 40, 40, '#0f172a', '#facc15', 1);
  ctx.textAlign = 'left';
  ctx.font = '900 7.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText(`[기자회견] ${event.titleKo}`, 30, 156);

  ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#f8fafc';
  renderMultilineText(ctx, `기자 질문: "${event.bodyTextKo}"`, 30, 168, VIRTUAL_WIDTH - 60, 12);

  // Response Options (3 Columns or 3 Rows at bottom: y: 190 ~ 258)
  for (let i = 0; i < event.options.length; i++) {
    const opt = event.options[i];
    const isSelected = selectedIdx === i;
    const optY = 190 + i * 24;
    const btnColor = isSelected ? '#facc15' : '#334155';
    const btnBg = isSelected ? '#1e3a8a' : '#0f172a';

    pxBox(ctx, 20, optY, VIRTUAL_WIDTH - 40, 22, btnBg, btnColor, isSelected ? 2 : 1);

    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isSelected ? '#fde047' : '#ffffff';
    ctx.fillText(`${i + 1}. [답변] ${opt.textKo}`, 30, optY + 14);

    // Consequence
    ctx.textAlign = 'right';
    ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(opt.descKo, VIRTUAL_WIDTH - 30, optY + 14);
  }
}

/**
 * 3. 📰 Daily Sports Newspaper UI
 */
export function drawNewspaperUI(
  ctx: CanvasRenderingContext2D,
  event: StoryEvent,
  selectedIdx: number,
  time: number
): void {
  // Vintage dark desk background
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#180e0c');

  // Newspaper Sheet (Vintage Sepia/Paper color)
  const npX = 40;
  const npY = 10;
  const npW = 400;
  const npH = 250;
  pxBox(ctx, npX, npY, npW, npH, '#f5efe6', '#d6c7b2', 2);
  // Paper fold shadow
  px(ctx, npX + npW / 2, npY, 2, npH, 'rgba(0,0,0,0.06)');

  // Newspaper Masthead / Header
  ctx.textAlign = 'center';
  ctx.font = '900 13px "Press Start 2P", monospace';
  ctx.fillStyle = '#1c1917';
  ctx.fillText('SUPERPOWER SPORTS DAILY', npX + npW / 2, npY + 22);

  // Subheader line (Date, Issue, Price)
  px(ctx, npX + 12, npY + 28, npW - 24, 1, '#1c1917');
  ctx.font = '700 6px "Press Start 2P", monospace';
  ctx.fillStyle = '#78716c';
  ctx.fillText('VOL. 884 | CHRONICLES OF LEAGUE HEROES | ISSUE TODAY', npX + npW / 2, npY + 36);
  px(ctx, npX + 12, npY + 40, npW - 24, 2, '#1c1917');

  // Big Front-Page Headline
  ctx.font = '900 11px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#991b1b'; // Red breaking news color
  ctx.fillText(event.headline ?? event.titleKo, npX + npW / 2, npY + 56);

  // Left side: Greyscale Dot Photo Illustration (x: 52, y: 64, w: 90, h: 64)
  pxBox(ctx, npX + 14, npY + 64, 110, 64, '#e7e5e4', '#44403c', 1);
  // Greyscale player kicking silhouette inside photo
  drawPhotoSilhouette(ctx, npX + 68, npY + 110);
  ctx.font = '700 6px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#78716c';
  ctx.fillText('▲ 경기 하이라이트 포착', npX + 68, npY + 122);

  // Right side: News Article Body Column (x: 170, y: 64)
  ctx.textAlign = 'left';
  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#1c1917';
  renderMultilineText(ctx, event.bodyTextKo, npX + 134, npY + 74, npW - 148, 13);

  // Bottom Divider
  px(ctx, npX + 12, npY + 136, npW - 24, 1, '#a8a29e');
  ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#44403c';
  ctx.fillText('선수의 대응 및 공식 성명 선택:', npX + 14, npY + 148);

  // Options (3 Newspaper editorial choices)
  for (let i = 0; i < event.options.length; i++) {
    const opt = event.options[i];
    const isSelected = selectedIdx === i;
    const optY = npY + 154 + i * 29;

    pxBox(ctx, npX + 14, optY, npW - 28, 25, isSelected ? '#1c1917' : '#e7e5e4', isSelected ? '#991b1b' : '#a8a29e', 1);

    ctx.textAlign = 'left';
    ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isSelected ? '#facc15' : '#1c1917';
    ctx.fillText(`${i + 1}. ${opt.textKo}`, npX + 22, optY + 12);

    ctx.font = '700 6.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isSelected ? '#cbd5e1' : '#78716c';
    ctx.fillText(opt.descKo, npX + 22, optY + 20);
  }
}

/**
 * 4. 👔 Manager Meeting UI
 */
export function drawManagerOfficeUI(
  ctx: CanvasRenderingContext2D,
  event: StoryEvent,
  selectedIdx: number,
  time: number
): void {
  // Executive Office Backdrop (Warm mahogany & luxury wallpaper)
  px(ctx, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#1a1012');

  // Office Bookshelves & Team Pennants in Background
  px(ctx, 16, 20, 110, 80, '#2d1810');
  px(ctx, 354, 20, 110, 80, '#2d1810');
  // Bookshelf shelves
  for (let by = 40; by < 100; by += 20) {
    px(ctx, 16, by, 110, 2, '#451a03');
    px(ctx, 354, by, 110, 2, '#451a03');
  }

  // Club Crest Shield in Center Wall
  pxBox(ctx, 222, 14, 36, 40, '#0f172a', '#facc15', 2);
  ctx.textAlign = 'center';
  ctx.font = '900 8px "Press Start 2P", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText('FC', 240, 38);

  // Manager Character Bust in Center (x: 240, y: 95)
  drawManagerBust(ctx, 240, 92, time);

  // Big Mahogany Executive Desk in Foreground (y: 104 ~ 132)
  pxBox(ctx, 30, 104, VIRTUAL_WIDTH - 60, 28, '#451a03', '#78350f', 2);
  px(ctx, 30, 104, VIRTUAL_WIDTH - 60, 2, '#92400e'); // Desk top highlight
  // Laptop / Notepad on desk
  pxBox(ctx, 100, 108, 28, 16, '#334155', '#64748b', 1);
  pxBox(ctx, 340, 110, 32, 14, '#f8fafc', '#cbd5e1', 1); // Document

  // Manager Dialogue Box (x: 30, y: 138, w: 420, h: 42)
  pxBox(ctx, 30, 138, VIRTUAL_WIDTH - 60, 42, '#0f172a', '#4ade80', 1);
  ctx.textAlign = 'left';
  ctx.font = '900 7.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText(`[감독실 1:1 면담] ${event.titleKo}`, 40, 150);

  ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
  ctx.fillStyle = '#ffffff';
  renderMultilineText(ctx, `감독: "${event.bodyTextKo}"`, 40, 164, VIRTUAL_WIDTH - 80, 12);

  // 3 Response Options
  for (let i = 0; i < event.options.length; i++) {
    const opt = event.options[i];
    const isSelected = selectedIdx === i;
    const optY = 186 + i * 25;
    const btnColor = isSelected ? '#4ade80' : '#334155';
    const btnBg = isSelected ? '#064e3b' : '#0f172a';

    pxBox(ctx, 30, optY, VIRTUAL_WIDTH - 60, 22, btnBg, btnColor, isSelected ? 2 : 1);

    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = isSelected ? '#86efac' : '#ffffff';
    ctx.fillText(`${i + 1}. [면담 답변] ${opt.textKo}`, 40, optY + 14);

    ctx.textAlign = 'right';
    ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(opt.descKo, VIRTUAL_WIDTH - 40, optY + 14);
  }
}

/** Render Manager Character Bust */
function drawManagerBust(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  // Suit Torso
  pxBox(ctx, x - 20, y, 40, 20, '#0f172a', '#1e293b', 1);
  // White shirt collar & red tie
  px(ctx, x - 4, y, 8, 8, '#ffffff');
  px(ctx, x - 2, y + 2, 4, 14, '#dc2626');

  // Head / Face
  px(ctx, x - 8, y - 16, 16, 16, '#f6c39b');
  // Grey hair
  px(ctx, x - 10, y - 20, 20, 6, '#94a3b8');
  px(ctx, x - 10, y - 16, 3, 8, '#94a3b8');
  px(ctx, x + 7, y - 16, 3, 8, '#94a3b8');
  // Serious eyes
  px(ctx, x - 5, y - 10, 3, 2, '#0f172a');
  px(ctx, x + 2, y - 10, 3, 2, '#0f172a');
  // Mustache / Stern mouth
  px(ctx, x - 4, y - 4, 8, 2, '#475569');
}

/** Render Greyscale Silhouette for Newspaper Photo */
function drawPhotoSilhouette(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  // Player kicking silhouette
  px(ctx, cx - 10, cy - 24, 18, 18, '#44403c'); // Torso
  px(ctx, cx - 4, cy - 36, 10, 10, '#292524');  // Head
  px(ctx, cx - 6, cy - 8, 6, 16, '#292524');   // Standing leg
  px(ctx, cx + 4, cy - 14, 16, 6, '#1c1917');  // Kicking leg out
  // Ball in air
  pxBox(ctx, cx + 24, cy - 20, 10, 10, '#ffffff', '#000000', 1);
}

/** Multiline Text Rendering Helper */
function renderMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let curLine = '';
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = curLine ? `${curLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(curLine, x, curY);
      curLine = words[i];
      curY += lineHeight;
    } else {
      curLine = testLine;
    }
  }
  if (curLine) {
    ctx.fillText(curLine, x, curY);
  }
}
