import { RetroAudioEngine } from './audio';
import { MultiplayerClient } from './network';
import {
  coordsToZone,
  getKeeperSkill,
  getKickerSkill,
  getOppositeCornerZone,
  KEEPER_SKILLS,
  KICKER_SKILLS,
  zoneToGoalCoords,
} from './skills';
import { KeeperAnimKey, KickerAnimKey, PixelSpriteBank, logicalSize } from './sprites';
import {
  AIDifficulty,
  BallState,
  DiveZone,
  GameMode,
  GoalRect,
  KeeperActor,
  KeeperSkillId,
  KickerActor,
  KickerSkillId,
  ScreenState,
  ShotResult,
  PlayerCustomization,
  HairStyleId,
  AccessoryId,
  TurnPhase,
  TurnRole,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  RENDER_SCALE,
} from './types';
import { PixelVFXManager } from './vfx';
import {
  CareerSaveData,
  LeagueTeam,
  PlayerPosition,
  CareerStats,
} from './careerTypes';
import {
  loadCareerData,
  saveCareerData,
  createInitialCareerSave,
  getNextOpponent,
  trainStat,
  buyAndEquipItem,
  getTotalPlayerStats,
  processCareerMatchResult,
  EQUIPMENT_CATALOG,
} from './careerData';
import {
  renderCareerPositionSelect,
  renderCareerCreateProfile,
  renderCareerHub,
  renderCareerTraining,
  renderCareerShop,
  renderCareerStandings,
  renderCareerStoryEvent,
  ProfileCreationState,
} from './careerUI';
import {
  getRandomStoryEvent,
  applyStoryEventOption,
} from './careerEventsData';

interface SkillSlotRect {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class SuperpowerShootoutGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: PixelSpriteBank;
  private vfx: PixelVFXManager;
  private audio: RetroAudioEngine;
  private net: MultiplayerClient;

  private screen: ScreenState = 'title';
  private gameMode: GameMode = 'vs_ai';
  private difficulty: AIDifficulty = 'pro';
  private menuIndex = 0;
  private onlineRoomInput = '1004';

  // Goal geometry in 480x270 virtual space
  private readonly goal: GoalRect = {
    left: 132,
    right: 348,
    top: 56,
    bottom: 136,
    width: 216,
    height: 80,
  };

  private readonly penaltySpot = { x: 240, y: 218 };

  // Match scoreboard & state
  private round = 1; // 1..5, then 6+ sudden death
  private isSuddenDeath = false;
  private turnRole: TurnRole = 'player_kick'; // 'player_kick' = Team Blue kicking, 'player_keep' = Team Red kicking
  private phase: TurnPhase = 'intro';
  private phaseTimer = 0;

  private blueHistory: ShotResult[] = [];
  private redHistory: ShotResult[] = [];
  private blueScore = 0;
  private redScore = 0;
  private blueMana = 65;
  private redMana = 65;
  private readonly maxMana = 100;
  private winnerText = '';

  // Active turn skill choices
  private selectedKickerSkill: KickerSkillId = 'none';
  private selectedKeeperSkill: KeeperSkillId = 'none';

  // Career Mode state
  private careerSave: CareerSaveData | null = null;
  private careerPosChoice: PlayerPosition = 'striker';
  private careerHoverPos: PlayerPosition | null = null;
  private careerProfileState: ProfileCreationState = {
    playerName: '유망주',
    teamName: '골목길FC',
    jerseyNumber: 10,
    hairStyle: 'spiky',
    accessory: 'headband',
    selectedPos: 'striker',
  };
  private careerSelectedStatIdx = 0;
  private careerSelectedEquipIdx = 0;
  private careerSelectedEventOptionIdx = 0;
  private careerCurrentOpponent: LeagueTeam | null = null;
  private careerMatchResultSummary: {
    won: boolean;
    goldEarned: number;
    tpEarned: number;
    promoted: boolean;
    champion: boolean;
  } | null = null;

  // Skill cooldown tracking (round number when skill was last used)
  private kickerSkillCooldowns: Map<string, number> = new Map();
  private keeperSkillCooldowns: Map<string, number> = new Map();

  // Mobile touch controls (Method A: touch aim + kick button + swipe dive)
  private isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  private touchKickButtonRect = { x: 388, y: 172, w: 84, h: 36 };
  private touchSwipeStart: { x: number; y: number; time: number } | null = null;
  private touchSwipeTrail: Array<{ x: number; y: number; alpha: number }> = [];
  private activeKickTouchId: number | null = null;

  // Aim & Power meter
  private aimX = 240;
  private aimY = 96;
  private keeperAimZone: DiveZone = 'center';
  private powerGauge = 0;
  private powerDir = 1;
  private reflexBonus = false;

  // AI planned decisions for current turn
  private aiPlannedDiveZone: DiveZone = 'center';
  private aiPlannedKeeperSkill: KeeperSkillId = 'none';
  private aiDiveTriggerZ = 0.34;
  private aiAimTimer = 0;
  private aiTargetAimX = 240;
  private aiTargetAimY = 90;

  // Actors & Ball
  private kicker!: KickerActor;
  private keeper!: KeeperActor;
  private ball!: BallState;

  // Net bulge animation
  private netBulgeX = 240;
  private netBulgeY = 96;
  private netBulgeStrength = 0;

  // Input state
  private keys: Set<string> = new Set();
  private mousePos = { x: 240, y: 96, active: false };
  private skillSlotRects: SkillSlotRect[] = [];
  private elapsedTime = 0;
  private hitStopTimer = 0;
  private slowMoFactor = 1;
  private slowMoTimer = 0;

  // Player Loadout & Customization
  private customPlayer: PlayerCustomization = {
    jerseyNumber: 10,
    hairStyle: 'spiky',
    accessory: 'headband',
    selectedKickerSkills: ['flame', 'curve'],
    selectedKeeperSkills: ['titan', 'icewall'],
  };

  // In-game pause & help dialog
  private isPaused = false;
  private showHelpModal = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // 4x backing store (1920x1080) for fine dots & crisp text; game logic stays in 480x270 units
    canvas.width = VIRTUAL_WIDTH * RENDER_SCALE;
    canvas.height = VIRTUAL_HEIGHT * RENDER_SCALE;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.sprites = new PixelSpriteBank();
    // Re-rasterize sprites once pixel fonts finish loading (jersey numbers use canvas text)
    document.fonts?.ready.then(() => this.rebuildPlayerSprites());
    this.vfx = new PixelVFXManager();
    this.audio = new RetroAudioEngine();
    this.net = new MultiplayerClient();

    this.setupNetworkCallbacks();
    this.resetTurnActors();
    this.bindEvents();
    this.checkUrlRoomParam();
  }

  private checkUrlRoomParam(): void {
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        this.onlineRoomInput = room.trim().toUpperCase().slice(0, 6);
        this.gameMode = 'online_multi';
        this.screen = 'online_lobby';
        setTimeout(() => {
          this.net.connect(this.onlineRoomInput);
        }, 500);
      }
    } catch (_) {}
  }

  private setupNetworkCallbacks(): void {
    this.net.onMatchReady = () => {
      this.audio.playUiSelect();
      this.startNewMatch();
    };

    this.net.onGameEvent = (event, fromRole) => {
      if (this.gameMode !== 'online_multi') return;

      if (event.type === 'kick_action') {
        // Opponent kicked!
        this.aimX = event.aimX;
        this.aimY = event.aimY;
        this.powerGauge = event.power;
        this.selectedKickerSkill = event.skill as KickerSkillId;
        this.kicker.skillAura = this.selectedKickerSkill;
        this.beginKickerRunup();
      } else if (event.type === 'keeper_dive') {
        // Opponent keeper dived!
        const zone = event.zone as DiveZone;
        const skill = event.skill as KeeperSkillId;
        this.reflexBonus = event.reflexBonus;
        this.executeKeeperDive(zone, skill);
      } else if (event.type === 'restart_match') {
        // Opponent requested rematch
        this.startNewMatch();
      }
    };

    this.net.onOpponentLeft = () => {
      if (this.screen === 'playing') {
        this.vfx.showBanner('OPPONENT LEFT!', '상대방이 접속을 종료했습니다.', '#ef4444', '#0f172a', 2.0);
      }
    };
  }

  public start(): void {
    let last = performance.now();
    const loop = (now: number) => {
      const rawDt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.update(rawDt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // =========================================================================
  // INPUT HANDLING
  // =========================================================================
  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      if (e.repeat) return;
      this.keys.add(code);

      if (code === 'KeyM') {
        this.audio.toggleMute();
        return;
      }
      if (code === 'KeyC') {
        document.getElementById('crt-overlay')?.classList.toggle('off');
        return;
      }

      this.handleKeyPress(code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') {
        this.handleActionRelease();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pt = this.clientToVirtual(e.clientX, e.clientY);
      this.mousePos.x = pt.x;
      this.mousePos.y = pt.y;
      this.mousePos.active = true;

      if (this.screen === 'playing') {
        const humanKicking = this.isHumanControllingKicker();
        const humanKeeping = this.isHumanControllingKeeper();
        if (humanKicking && this.phase === 'aiming') {
          this.aimX = Math.max(this.goal.left - 18, Math.min(this.goal.right + 18, pt.x));
          this.aimY = Math.max(this.goal.top - 14, Math.min(this.goal.bottom + 4, pt.y));
        } else if (humanKeeping && (this.phase === 'aiming' || this.phase === 'charging' || this.phase === 'runup' || this.phase === 'ball_flight')) {
          if (pt.y < 180) {
            this.keeperAimZone = coordsToZone(pt.x, pt.y, this.goal);
          }
        }
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        // If this touch finger is holding the kick button, ignore it for aiming
        if (t.identifier === this.activeKickTouchId) {
          continue;
        }

        const pt = this.clientToVirtual(t.clientX, t.clientY);
        this.mousePos.x = pt.x;
        this.mousePos.y = pt.y;

        if (this.screen === 'playing') {
          const humanKicking = this.isHumanControllingKicker();
          const humanKeeping = this.isHumanControllingKeeper();

          // Mobile touch trail for visual feedback
          this.touchSwipeTrail.push({ x: pt.x, y: pt.y, alpha: 1.0 });

          if (humanKicking && (this.phase === 'aiming' || this.phase === 'charging')) {
            // Dragging aim inside field area
            if (pt.y < 210) {
              this.aimX = Math.max(this.goal.left - 18, Math.min(this.goal.right + 18, pt.x));
              this.aimY = Math.max(this.goal.top - 14, Math.min(this.goal.bottom + 4, pt.y));
            }
          } else if (humanKeeping && this.touchSwipeStart) {
            // Swipe detection for keeper dive
            const dx = pt.x - this.touchSwipeStart.x;
            const dy = pt.y - this.touchSwipeStart.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 22 && !this.keeper.hasDived && (this.phase === 'ball_flight' || this.phase === 'charging' || this.phase === 'runup' || this.phase === 'aiming')) {
              const zone = this.vectorToDiveZone(dx, dy);
              this.keeperAimZone = zone;
              this.executeKeeperDive(zone, this.selectedKeeperSkill);
              this.touchSwipeStart = null;
            }
          }
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const pt = this.clientToVirtual(e.clientX, e.clientY);
      this.handlePointerDown(pt.x, pt.y);
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      this.handleActionRelease();
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const pt = this.clientToVirtual(t.clientX, t.clientY);

        // Check if touch is on dedicated Kick Button
        const btn = this.touchKickButtonRect;
        const isKickBtnHit =
          this.screen === 'playing' &&
          this.isHumanControllingKicker() &&
          pt.x >= btn.x - 6 && pt.x <= btn.x + btn.w + 6 &&
          pt.y >= btn.y - 6 && pt.y <= btn.y + btn.h + 6;

        if (isKickBtnHit) {
          this.activeKickTouchId = t.identifier;
          this.handleActionPress();
        } else {
          // Aim or UI tap
          this.mousePos.x = pt.x;
          this.mousePos.y = pt.y;
          this.touchSwipeStart = { x: pt.x, y: pt.y, time: performance.now() };
          this.touchSwipeTrail = [{ x: pt.x, y: pt.y, alpha: 1.0 }];
          this.handlePointerDown(pt.x, pt.y);
        }
      }
    }, { passive: false });

    const handleTouchRelease = (e: TouchEvent) => {
      let shouldReleaseKick = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.activeKickTouchId) {
          this.activeKickTouchId = null;
          shouldReleaseKick = true;
        }
      }
      // If the kick finger lifted or if no fingers remain on screen
      if (shouldReleaseKick || e.touches.length === 0) {
        this.touchSwipeStart = null;
        this.activeKickTouchId = null;
        this.handleActionRelease(true);
      }
    };

    window.addEventListener('touchend', handleTouchRelease, { passive: false });
    window.addEventListener('touchcancel', handleTouchRelease, { passive: false });
  }

  private clientToVirtual(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIRTUAL_WIDTH,
      y: ((clientY - rect.top) / rect.height) * VIRTUAL_HEIGHT,
    };
  }

  private handleKeyPress(code: string): void {
    if (this.screen === 'title') {
      if (code === 'Space' || code === 'Enter') {
        this.audio.playUiSelect();
        this.screen = 'mode_select';
        this.menuIndex = 0;
      }
      return;
    }

    if (this.screen === 'mode_select') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        this.menuIndex = (this.menuIndex + 5) % 6;
        this.audio.playUiSelect();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.menuIndex = (this.menuIndex + 1) % 6;
        this.audio.playUiSelect();
      } else if (code === 'Space' || code === 'Enter') {
        this.selectMenuOption(this.menuIndex);
      } else if (code === 'Escape') {
        this.screen = 'title';
      }
      return;
    }

    if (this.screen === 'career_select_position') {
      if (code === 'ArrowLeft' || code === 'ArrowRight' || code === 'KeyA' || code === 'KeyD') {
        this.audio.playUiSelect();
        this.careerPosChoice = this.careerPosChoice === 'striker' ? 'goalkeeper' : 'striker';
      } else if (code === 'Space' || code === 'Enter') {
        this.audio.playUiSelect();
        this.careerProfileState.selectedPos = this.careerPosChoice;
        this.screen = 'career_create_profile';
      } else if (code === 'Escape') {
        this.screen = 'mode_select';
      }
      return;
    }

    if (this.screen === 'career_create_profile') {
      if (code === 'Space' || code === 'Enter') {
        this.confirmCareerProfileCreation();
      } else if (code === 'Escape') {
        this.screen = 'career_select_position';
      }
      return;
    }

    if (this.screen === 'career_hub') {
      if (code === 'Digit1') {
        this.startCareerMatch();
      } else if (code === 'Digit2') {
        this.audio.playUiSelect();
        this.screen = 'career_training';
      } else if (code === 'Digit3') {
        this.audio.playUiSelect();
        this.screen = 'career_shop';
      } else if (code === 'Digit4') {
        this.audio.playUiSelect();
        this.screen = 'career_standings';
      } else if (code === 'Space' || code === 'Enter') {
        this.startCareerMatch();
      } else if (code === 'Escape') {
        this.screen = 'mode_select';
      }
      return;
    }

    if (this.screen === 'career_training') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        this.careerSelectedStatIdx = (this.careerSelectedStatIdx + 4) % 6;
        this.audio.playUiSelect();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.careerSelectedStatIdx = (this.careerSelectedStatIdx + 2) % 6;
        this.audio.playUiSelect();
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        this.careerSelectedStatIdx = (this.careerSelectedStatIdx + 5) % 6;
        this.audio.playUiSelect();
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.careerSelectedStatIdx = (this.careerSelectedStatIdx + 1) % 6;
        this.audio.playUiSelect();
      } else if (code === 'Space' || code === 'Enter') {
        this.handleCareerTrainAction();
      } else if (code === 'Escape') {
        this.screen = 'career_hub';
      }
      return;
    }

    if (this.screen === 'career_shop') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        this.careerSelectedEquipIdx = Math.max(0, this.careerSelectedEquipIdx - 1);
        this.audio.playUiSelect();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.careerSelectedEquipIdx = this.careerSelectedEquipIdx + 1;
        this.audio.playUiSelect();
      } else if (code === 'Space' || code === 'Enter') {
        this.handleCareerShopAction();
      } else if (code === 'Escape') {
        this.screen = 'career_hub';
      }
      return;
    }

    if (this.screen === 'career_standings') {
      if (code === 'Escape' || code === 'Space' || code === 'Enter') {
        this.audio.playUiSelect();
        this.screen = 'career_hub';
      }
      return;
    }

    if (this.screen === 'career_event' && this.careerSave && this.careerSave.pendingEvent) {
      const opts = this.careerSave.pendingEvent.options;
      if (code === 'ArrowUp' || code === 'KeyW') {
        this.careerSelectedEventOptionIdx = (this.careerSelectedEventOptionIdx + opts.length - 1) % opts.length;
        this.audio.playUiSelect();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.careerSelectedEventOptionIdx = (this.careerSelectedEventOptionIdx + 1) % opts.length;
        this.audio.playUiSelect();
      } else if (code === 'Digit1' && opts.length >= 1) {
        this.careerSelectedEventOptionIdx = 0;
        this.confirmCareerStoryEventChoice();
      } else if (code === 'Digit2' && opts.length >= 2) {
        this.careerSelectedEventOptionIdx = 1;
        this.confirmCareerStoryEventChoice();
      } else if (code === 'Digit3' && opts.length >= 3) {
        this.careerSelectedEventOptionIdx = 2;
        this.confirmCareerStoryEventChoice();
      } else if (code === 'Space' || code === 'Enter') {
        this.confirmCareerStoryEventChoice();
      }
      return;
    }

    if (this.screen === 'customization') {
      if (code === 'Space' || code === 'Enter') {
        this.confirmCustomizationAndProceed();
      } else if (code === 'Escape') {
        this.screen = 'mode_select';
      }
      return;
    }

    if (this.screen === 'online_lobby') {
      if (code === 'Backspace') {
        this.onlineRoomInput = this.onlineRoomInput.slice(0, -1);
        this.audio.playUiSelect();
      } else if (code.startsWith('Digit') || code.startsWith('Key')) {
        const char = code.replace('Digit', '').replace('Key', '').toUpperCase();
        if (this.onlineRoomInput.length < 6 && char.length === 1) {
          this.onlineRoomInput += char;
          this.audio.playUiSelect();
        }
      } else if (code === 'Enter' || code === 'Space') {
        this.audio.playUiSelect();
        this.net.connect(this.onlineRoomInput);
      } else if (code === 'Escape') {
        this.net.disconnect();
        this.screen = 'mode_select';
      }
      return;
    }

    if (this.screen === 'match_over') {
      if (code === 'Space' || code === 'Enter') {
        this.audio.playUiSelect();
        if (this.gameMode === 'career') {
          this.advanceCareerWeekAndTriggerEvent();
          return;
        }
        if (this.gameMode === 'online_multi') {
          this.net.sendEvent({ type: 'restart_match' });
        }
        this.startNewMatch();
      } else if (code === 'Escape') {
        this.audio.stopBgm();
        this.screen = this.gameMode === 'career' ? 'career_hub' : 'mode_select';
      }
      return;
    }

    // In-game controls
    if (this.screen === 'playing') {
      if (code === 'KeyH') {
        this.audio.playUiSelect();
        this.showHelpModal = !this.showHelpModal;
        return;
      }

      if (code === 'Escape') {
        if (this.showHelpModal) {
          this.audio.playUiSelect();
          this.showHelpModal = false;
          return;
        }
        this.audio.playUiSelect();
        this.isPaused = !this.isPaused;
        return;
      }

      if (this.isPaused || this.showHelpModal) {
        if (code === 'Space' || code === 'Enter') {
          this.audio.playUiSelect();
          this.isPaused = false;
          this.showHelpModal = false;
        }
        return;
      }

      // Skill keys 1..4 (or Q,W,E,R)
      const skillSlotMap: Record<string, number> = {
        Digit1: 0, KeyQ: 0,
        Digit2: 1, KeyW: 1,
        Digit3: 2, KeyE: 2,
        Digit4: 3, KeyR: 3,
      };
      if (code in skillSlotMap) {
        this.tryToggleSkillSlot(skillSlotMap[code]);
        return;
      }

      if (code === 'Space') {
        this.handleActionPress();
      }
    }
  }

  private handlePointerDown(vx: number, vy: number): void {
    if (this.screen === 'title') {
      this.audio.playUiSelect();
      this.screen = 'mode_select';
      return;
    }

    if (this.screen === 'mode_select') {
      for (let i = 0; i < 6; i++) {
        const btnY = 74 + i * 27;
        if (vx >= 100 && vx <= 380 && vy >= btnY && vy <= btnY + 23) {
          this.selectMenuOption(i);
          return;
        }
      }
      return;
    }

    if (this.screen === 'career_select_position') {
      // Striker Card (x: 50..230, y: 52..238)
      if (vx >= 50 && vx <= 230 && vy >= 52 && vy <= 238) {
        this.audio.playUiSelect();
        this.careerPosChoice = 'striker';
        return;
      }
      // Keeper Card (x: 250..430, y: 52..238)
      if (vx >= 250 && vx <= 430 && vy >= 52 && vy <= 238) {
        this.audio.playUiSelect();
        this.careerPosChoice = 'goalkeeper';
        return;
      }
      // Confirm Button at bottom (x: 110..370, y: 246..266)
      if (vx >= 110 && vx <= 370 && vy >= 246 && vy <= 266) {
        this.audio.playUiSelect();
        this.careerProfileState.selectedPos = this.careerPosChoice;
        this.screen = 'career_create_profile';
        return;
      }
      return;
    }

    if (this.screen === 'career_create_profile') {
      this.handleCareerProfileClick(vx, vy);
      return;
    }

    if (this.screen === 'career_hub') {
      this.handleCareerHubClick(vx, vy);
      return;
    }

    if (this.screen === 'career_training') {
      this.handleCareerTrainingClick(vx, vy);
      return;
    }

    if (this.screen === 'career_shop') {
      this.handleCareerShopClick(vx, vy);
      return;
    }

    if (this.screen === 'career_standings') {
      // Bottom return or screen click
      this.audio.playUiSelect();
      this.screen = 'career_hub';
      return;
    }

    if (this.screen === 'career_event' && this.careerSave && this.careerSave.pendingEvent) {
      this.handleCareerEventClick(vx, vy);
      return;
    }

    if (this.screen === 'customization') {
      this.handleCustomizationClick(vx, vy);
      return;
    }

    if (this.screen === 'online_lobby') {
      // Room code box click (prompts mobile keyboard or quick code input)
      if (vx >= 160 && vx <= 320 && vy >= 85 && vy <= 125) {
        this.audio.playUiSelect();
        const entered = window.prompt('참가할 4~6자리 방 코드를 입력하세요:', this.onlineRoomInput);
        if (entered !== null) {
          const sanitized = entered.trim().toUpperCase().slice(0, 6);
          if (sanitized) this.onlineRoomInput = sanitized;
        }
        return;
      }

      // Connect button click
      if (vx >= 140 && vx <= 340 && vy >= 170 && vy <= 198) {
        this.audio.playUiSelect();
        this.net.connect(this.onlineRoomInput);
        return;
      }
      // Back button click
      if (vx >= 180 && vx <= 300 && vy >= 210 && vy <= 232) {
        this.audio.playUiSelect();
        this.net.disconnect();
        this.screen = 'mode_select';
        return;
      }
      return;
    }

    if (this.screen === 'match_over') {
      this.audio.playUiSelect();
      if (this.gameMode === 'career') {
        this.advanceCareerWeekAndTriggerEvent();
        return;
      }
      if (this.gameMode === 'online_multi') {
        this.net.sendEvent({ type: 'restart_match' });
      }
      this.startNewMatch();
      return;
    }

    if (this.screen === 'playing') {
      // If help modal is open, clicking closes it
      if (this.showHelpModal) {
        this.audio.playUiSelect();
        this.showHelpModal = false;
        return;
      }

      // If paused, check buttons: Resume, Retry, Main Menu
      if (this.isPaused) {
        // Button 1: [RESUME (계속하기)] (140, 95, 200, 26)
        if (vx >= 140 && vx <= 340 && vy >= 95 && vy <= 121) {
          this.audio.playUiSelect();
          this.isPaused = false;
          return;
        }

        // Button 2: [RETRY (다시하기)] (140, 130, 200, 26)
        if (vx >= 140 && vx <= 340 && vy >= 130 && vy <= 156) {
          this.audio.playUiSelect();
          this.isPaused = false;
          if (this.gameMode === 'online_multi') {
            this.net.sendEvent({ type: 'restart_match' });
          }
          this.startNewMatch();
          return;
        }

        // Button 3: [MAIN MENU (메인으로)] (140, 165, 200, 26)
        if (vx >= 140 && vx <= 340 && vy >= 165 && vy <= 191) {
          this.audio.playUiSelect();
          this.isPaused = false;
          if (this.gameMode === 'online_multi') {
            this.net.disconnect();
          }
          this.audio.stopBgm();
          this.screen = 'mode_select';
          return;
        }

        // Outside click does not accidentally unpause
        return;
      }

      // [?] Help Button click at top-left (8, 6, 20, 20)
      if (vx >= 8 && vx <= 28 && vy >= 6 && vy <= 26) {
        this.audio.playUiSelect();
        this.showHelpModal = true;
        return;
      }

      // Check skill slot clicks at bottom bar
      for (const slot of this.skillSlotRects) {
        if (vx >= slot.x && vx <= slot.x + slot.w && vy >= slot.y && vy <= slot.y + slot.h) {
          this.tryToggleSkillSlot(slot.index);
          return;
        }
      }

      if (this.isHumanControllingKicker()) {
        const btn = this.touchKickButtonRect;
        const clickedKickBtn = vx >= btn.x && vx <= btn.x + btn.w && vy >= btn.y && vy <= btn.y + btn.h;

        if (this.phase === 'aiming') {
          if (clickedKickBtn) {
            // Touch kick button begins charging
            this.handleActionPress();
          } else {
            // Screen drag updates aim without accidentally starting power charge
            if (vy < 210) {
              this.aimX = Math.max(this.goal.left - 18, Math.min(this.goal.right + 18, vx));
              this.aimY = Math.max(this.goal.top - 14, Math.min(this.goal.bottom + 4, vy));
            }
            // On desktop mouse click outside kick button, it also begins charging
            if (!this.isTouchDevice) {
              this.handleActionPress();
            }
          }
        } else if (this.phase === 'charging') {
          if (!clickedKickBtn && vy < 210) {
            this.aimX = Math.max(this.goal.left - 18, Math.min(this.goal.right + 18, vx));
            this.aimY = Math.max(this.goal.top - 14, Math.min(this.goal.bottom + 4, vy));
          }
        }
      } else if (this.isHumanControllingKeeper()) {
        if (!this.isTouchDevice) {
          if (vy < 185) {
            this.keeperAimZone = coordsToZone(vx, vy, this.goal);
          }
          this.handleActionPress();
        }
        // On touch device, goalkeeper dives via swipe gesture in touchmove!
      }
    }
  }

  private selectMenuOption(idx: number): void {
    this.audio.playUiSelect();
    if (idx === 0) {
      // 🏆 Career Mode: Road to Champion
      this.gameMode = 'career';
      const saved = loadCareerData();
      if (saved) {
        this.careerSave = saved;
        this.screen = 'career_hub';
      } else {
        this.careerPosChoice = 'striker';
        this.screen = 'career_select_position';
      }
    } else if (idx === 1) {
      this.gameMode = 'vs_ai';
      this.difficulty = 'rookie';
      this.screen = 'customization';
    } else if (idx === 2) {
      this.gameMode = 'vs_ai';
      this.difficulty = 'pro';
      this.screen = 'customization';
    } else if (idx === 3) {
      this.gameMode = 'vs_ai';
      this.difficulty = 'legend';
      this.screen = 'customization';
    } else if (idx === 4) {
      this.gameMode = 'local_2p';
      this.difficulty = 'pro';
      this.screen = 'customization';
    } else {
      this.gameMode = 'online_multi';
      this.screen = 'customization';
    }
  }

  private isHumanControllingKicker(): boolean {
    if (this.gameMode === 'local_2p') return true;
    if (this.gameMode === 'online_multi') {
      const isP1Turn = this.turnRole === 'player_kick';
      return (isP1Turn && this.net.myRole === 'p1') || (!isP1Turn && this.net.myRole === 'p2');
    }
    if (this.gameMode === 'career') {
      // Striker career: Human kicks in player_kick turn!
      // Keeper career: AI teammate kicks in player_kick turn!
      return this.careerSave?.position === 'striker' && this.turnRole === 'player_kick';
    }
    return this.turnRole === 'player_kick';
  }

  private isHumanControllingKeeper(): boolean {
    if (this.gameMode === 'local_2p') return true;
    if (this.gameMode === 'online_multi') {
      const isP1Keeper = this.turnRole === 'player_keep';
      return (isP1Keeper && this.net.myRole === 'p1') || (!isP1Keeper && this.net.myRole === 'p2');
    }
    if (this.gameMode === 'career') {
      // Keeper career: Human dives in player_keep turn!
      // Striker career: AI teammate keeper dives in player_keep turn!
      return this.careerSave?.position === 'goalkeeper' && this.turnRole === 'player_keep';
    }
    return this.turnRole === 'player_keep';
  }

  private vectorToDiveZone(dx: number, dy: number): DiveZone {
    // Determine 6 dive zones based on angle/displacement
    // Upwards vs Lowers
    const isUp = dy < -10;
    const isLow = dy > 10;
    const absX = Math.abs(dx);

    if (absX < 14) {
      if (isUp) return 'top_center';
      return 'center';
    }

    if (dx < 0) {
      return isLow ? 'low_left' : 'top_left';
    } else {
      return isLow ? 'low_right' : 'top_right';
    }
  }

  private getSkillCooldownRemaining(skillId: string, isKeeper: boolean): number {
    const map = isKeeper ? this.keeperSkillCooldowns : this.kickerSkillCooldowns;
    const lastRound = map.get(skillId);
    if (lastRound === undefined) return 0;
    const def = isKeeper
      ? getKeeperSkill(skillId as KeeperSkillId)
      : getKickerSkill(skillId as KickerSkillId);
    const cd = def?.cooldownRounds ?? 1;
    const diff = this.round - lastRound;
    return Math.max(0, cd - diff);
  }

  private tryToggleSkillSlot(slotIndex: number): void {
    if (this.gameMode === 'vs_ai') {
      if (this.turnRole === 'player_kick' && this.phase === 'aiming') {
        const skills = this.getActiveKickerSkills();
        const skill = skills[slotIndex];
        if (!skill) return;
        if (this.selectedKickerSkill === skill.id) {
          this.selectedKickerSkill = 'none';
          this.kicker.skillAura = 'none';
          this.audio.playUiSelect();
        } else {
          const cd = this.getSkillCooldownRemaining(skill.id, false);
          if (cd > 0) {
            this.audio.playPostHit();
            this.vfx.showBanner('COOLDOWN!', `${cd}라운드 후 재사용 가능`, '#94a3b8', '#0f172a', 0.8);
            return;
          }
          if (this.blueMana >= skill.manaCost) {
            this.selectedKickerSkill = skill.id;
            this.kicker.skillAura = skill.id;
            this.audio.playSkillToggle();
            this.vfx.spawnShockwave(this.kicker.x, this.kicker.y + 8, 28, skill.color, 0.25);
          }
        }
      } else if (
        this.turnRole === 'player_keep' &&
        (this.phase === 'aiming' || this.phase === 'charging' || this.phase === 'runup' || (this.phase === 'ball_flight' && !this.keeper.hasDived))
      ) {
        const skills = this.getActiveKeeperSkills();
        const skill = skills[slotIndex];
        if (!skill) return;
        if (this.selectedKeeperSkill === skill.id) {
          this.selectedKeeperSkill = 'none';
          this.audio.playUiSelect();
        } else {
          const cd = this.getSkillCooldownRemaining(skill.id, true);
          if (cd > 0) {
            this.audio.playPostHit();
            this.vfx.showBanner('COOLDOWN!', `${cd}라운드 후 재사용 가능`, '#94a3b8', '#0f172a', 0.8);
            return;
          }
          if (this.blueMana >= skill.manaCost) {
            this.selectedKeeperSkill = skill.id;
            this.audio.playSkillToggle();
            this.vfx.spawnShockwave(this.keeper.x, this.keeper.y, 24, skill.color, 0.25);
          }
        }
      }
    } else if (this.gameMode === 'online_multi') {
      const myMana = this.net.myRole === 'p1' ? this.blueMana : this.redMana;
      if (this.isHumanControllingKicker() && this.phase === 'aiming') {
        const skills = this.getActiveKickerSkills();
        const skill = skills[slotIndex];
        if (!skill) return;
        if (this.selectedKickerSkill === skill.id) {
          this.selectedKickerSkill = 'none';
          this.kicker.skillAura = 'none';
          this.audio.playUiSelect();
        } else {
          const cd = this.getSkillCooldownRemaining(skill.id, false);
          if (cd > 0) {
            this.audio.playPostHit();
            this.vfx.showBanner('COOLDOWN!', `${cd}라운드 후 재사용 가능`, '#94a3b8', '#0f172a', 0.8);
            return;
          }
          if (myMana >= skill.manaCost) {
            this.selectedKickerSkill = skill.id;
            this.kicker.skillAura = skill.id;
            this.audio.playSkillToggle();
            this.vfx.spawnShockwave(this.kicker.x, this.kicker.y + 8, 28, skill.color, 0.25);
          }
        }
      } else if (
        this.isHumanControllingKeeper() &&
        (this.phase === 'aiming' || this.phase === 'charging' || this.phase === 'runup' || (this.phase === 'ball_flight' && !this.keeper.hasDived))
      ) {
        const skills = this.getActiveKeeperSkills();
        const skill = skills[slotIndex];
        if (!skill) return;
        if (this.selectedKeeperSkill === skill.id) {
          this.selectedKeeperSkill = 'none';
          this.audio.playUiSelect();
        } else {
          const cd = this.getSkillCooldownRemaining(skill.id, true);
          if (cd > 0) {
            this.audio.playPostHit();
            this.vfx.showBanner('COOLDOWN!', `${cd}라운드 후 재사용 가능`, '#94a3b8', '#0f172a', 0.8);
            return;
          }
          if (myMana >= skill.manaCost) {
            this.selectedKeeperSkill = skill.id;
            this.audio.playSkillToggle();
            this.vfx.spawnShockwave(this.keeper.x, this.keeper.y, 24, skill.color, 0.25);
          }
        }
      }
    } else {
      // Local 2P: during aiming, kicker uses 1-4; during runup/flight, keeper uses 1-4!
      const kickerMana = this.turnRole === 'player_kick' ? this.blueMana : this.redMana;
      const keeperMana = this.turnRole === 'player_kick' ? this.redMana : this.blueMana;

      if (this.phase === 'aiming') {
        const skill = KICKER_SKILLS[slotIndex];
        if (!skill) return;
        if (this.selectedKickerSkill === skill.id) {
          this.selectedKickerSkill = 'none';
          this.kicker.skillAura = 'none';
          this.audio.playUiSelect();
        } else {
          const cd = this.getSkillCooldownRemaining(skill.id, false);
          if (cd > 0) {
            this.audio.playPostHit();
            this.vfx.showBanner('COOLDOWN!', `${cd}라운드 후 재사용 가능`, '#94a3b8', '#0f172a', 0.8);
            return;
          }
          if (kickerMana >= skill.manaCost) {
            this.selectedKickerSkill = skill.id;
            this.kicker.skillAura = skill.id;
            this.audio.playSkillToggle();
          }
        }
      } else if (this.phase === 'runup' || (this.phase === 'ball_flight' && !this.keeper.hasDived)) {
        const skill = KEEPER_SKILLS[slotIndex];
        if (!skill) return;
        if (this.selectedKeeperSkill === skill.id) {
          this.selectedKeeperSkill = 'none';
          this.audio.playUiSelect();
        } else {
          const cd = this.getSkillCooldownRemaining(skill.id, true);
          if (cd > 0) {
            this.audio.playPostHit();
            this.vfx.showBanner('COOLDOWN!', `${cd}라운드 후 재사용 가능`, '#94a3b8', '#0f172a', 0.8);
            return;
          }
          if (keeperMana >= skill.manaCost) {
            this.selectedKeeperSkill = skill.id;
            this.audio.playSkillToggle();
          }
        }
      }
    }
  }

  private handleActionPress(): void {
    if (this.isHumanControllingKicker() && this.phase === 'aiming') {
      this.phase = 'charging';
      this.powerGauge = 0.05;
      this.powerDir = 1;
      this.kicker.anim = 'charge';
      this.kicker.frame = 0;
      return;
    }

    // Human keeper reflex dive trigger!
    if (
      this.isHumanControllingKeeper() &&
      (this.phase === 'ball_flight' || this.phase === 'chrono_pause') &&
      !this.keeper.hasDived
    ) {
      // Check if player timed SPACE right around sweet reflex window
      if (this.ball.z >= 0.25 && this.ball.z <= 0.78 && this.phase === 'ball_flight') {
        this.reflexBonus = true;
      }
      this.executeKeeperDive(this.keeperAimZone, this.selectedKeeperSkill);
    }
  }

  private handleActionRelease(isFromTouch = false): void {
    if (this.isHumanControllingKicker() && this.phase === 'charging') {
      if (isFromTouch) {
        // Mobile-only touch latency compensation (approx 80ms touch-to-render lag)
        // Does NOT widen sweetspot, but samples the gauge exactly when user's finger lifted!
        const latencySec = 0.082;
        const chargeSpeed = 1.45;
        this.powerGauge = Math.max(0.12, Math.min(1.22, this.powerGauge - this.powerDir * chargeSpeed * latencySec));
      }
      this.beginKickerRunup();
    }
  }

  // =========================================================================
  // MATCH & TURN LIFECYCLE
  // =========================================================================
  private startNewMatch(): void {
    this.screen = 'playing';
    this.round = 1;
    this.isSuddenDeath = false;
    this.turnRole = 'player_kick';
    this.blueHistory = [];
    this.redHistory = [];
    this.blueScore = 0;
    this.redScore = 0;
    this.blueMana = 70;
    this.redMana = 70;
    this.winnerText = '';
    this.kickerSkillCooldowns.clear();
    this.keeperSkillCooldowns.clear();

    this.audio.startBgm(false);
    this.setupTurn();
  }

  // =========================================================================
  // CAREER MODE SYSTEMS & HANDLERS
  // =========================================================================
  private startCareerMatch(): void {
    if (!this.careerSave) return;
    this.careerCurrentOpponent = getNextOpponent(this.careerSave);
    const totalStats = getTotalPlayerStats(this.careerSave);

    // Apply player's custom appearance
    this.sprites.rebuildCustomSprites(
      this.careerSave.jerseyNumber,
      this.careerSave.hairStyle,
      this.careerSave.accessory
    );

    this.gameMode = 'career';
    this.screen = 'playing';
    this.round = 1;
    this.isSuddenDeath = false;
    this.turnRole = 'player_kick';
    this.blueHistory = [];
    this.redHistory = [];
    this.blueScore = 0;
    this.redScore = 0;
    this.blueMana = totalStats.maxMana;
    if (this.careerSave.activeBuff?.type === 'start_mana') {
      this.blueMana = Math.min(totalStats.maxMana + 50, this.blueMana + this.careerSave.activeBuff.value);
    }
    this.redMana = 70;
    this.winnerText = '';
    this.kickerSkillCooldowns.clear();
    this.keeperSkillCooldowns.clear();
    this.careerMatchResultSummary = null;

    this.audio.startBgm(false);
    this.setupTurn();
  }

  private confirmCareerProfileCreation(): void {
    this.audio.playUiSelect();
    this.careerSave = createInitialCareerSave(
      this.careerProfileState.playerName,
      this.careerProfileState.teamName,
      this.careerProfileState.selectedPos,
      this.careerProfileState.hairStyle,
      this.careerProfileState.accessory,
      this.careerProfileState.jerseyNumber
    );
    saveCareerData(this.careerSave);
    this.screen = 'career_hub';
  }

  private handleCareerProfileClick(vx: number, vy: number): void {
    const hairList: HairStyleId[] = ['spiky', 'dread', 'bowl', 'curly', 'bald'];
    const accList: AccessoryId[] = ['none', 'headband', 'glasses', 'mask', 'aura_crown'];

    // 1. Jersey number decrement/increment (y: 110..128)
    if (vx >= 240 && vx <= 320 && vy >= 110 && vy <= 128) {
      this.audio.playUiSelect();
      this.careerProfileState.jerseyNumber = (this.careerProfileState.jerseyNumber % 99) + 1;
      return;
    }

    // 2. Hair style cycler (y: 134..152)
    if (vx >= 240 && vx <= 340 && vy >= 134 && vy <= 152) {
      this.audio.playUiSelect();
      const curIdx = hairList.indexOf(this.careerProfileState.hairStyle);
      this.careerProfileState.hairStyle = hairList[(curIdx + 1) % hairList.length];
      return;
    }

    // 3. Accessory cycler (y: 158..176)
    if (vx >= 240 && vx <= 340 && vy >= 158 && vy <= 176) {
      this.audio.playUiSelect();
      const curIdx = accList.indexOf(this.careerProfileState.accessory);
      this.careerProfileState.accessory = accList[(curIdx + 1) % accList.length];
      return;
    }

    // 4. Sign contract button (x: 196..428, y: 202..224)
    if (vx >= 196 && vx <= 428 && vy >= 202 && vy <= 224) {
      this.confirmCareerProfileCreation();
      return;
    }
  }

  private handleCareerHubClick(vx: number, vy: number): void {
    if (vy >= 224 && vy <= 250) {
      // 1. Match Start button (x: 12..162)
      if (vx >= 12 && vx <= 162) {
        this.audio.playUiSelect();
        this.startCareerMatch();
        return;
      }
      // 2. Training Facility button (x: 168..264)
      if (vx >= 168 && vx <= 264) {
        this.audio.playUiSelect();
        this.screen = 'career_training';
        return;
      }
      // 3. Pro Gear Shop button (x: 270..366)
      if (vx >= 270 && vx <= 366) {
        this.audio.playUiSelect();
        this.screen = 'career_shop';
        return;
      }
      // 4. Standings table button (x: 372..468)
      if (vx >= 372 && vx <= 468) {
        this.audio.playUiSelect();
        this.screen = 'career_standings';
        return;
      }
    }
  }

  private handleCareerTrainingClick(vx: number, vy: number): void {
    // Check click on 6 stat cards
    for (let i = 0; i < 6; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = 16 + col * 228;
      const cardY = 46 + row * 56;
      if (vx >= cardX && vx <= cardX + 220 && vy >= cardY && vy <= cardY + 50) {
        this.careerSelectedStatIdx = i;
        this.handleCareerTrainAction();
        return;
      }
    }

    // Bottom return button (y: 230..258)
    if (vy >= 230 && vy <= 258) {
      this.audio.playUiSelect();
      this.screen = 'career_hub';
      return;
    }
  }

  private handleCareerShopClick(vx: number, vy: number): void {
    if (!this.careerSave) return;
    const filteredGear = EQUIPMENT_CATALOG.filter(
      (g) => g.position === 'all' || g.position === this.careerSave!.position
    );

    // Left catalog item click (x: 20..272, y: 50 + i * 28)
    for (let i = 0; i < filteredGear.length; i++) {
      const rowY = 50 + i * 28;
      if (vx >= 20 && vx <= 272 && vy >= rowY && vy <= rowY + 24) {
        this.audio.playUiSelect();
        this.careerSelectedEquipIdx = i;
        return;
      }
    }

    // Right buy/equip button click (x: 294..454, y: 194..216)
    if (vx >= 294 && vx <= 454 && vy >= 194 && vy <= 216) {
      this.handleCareerShopAction();
      return;
    }

    // Bottom return button (y: 232..258)
    if (vy >= 232 && vy <= 258) {
      this.audio.playUiSelect();
      this.screen = 'career_hub';
      return;
    }
  }

  private handleCareerTrainAction(): void {
    if (!this.careerSave) return;
    const isStriker = this.careerSave.position === 'striker';
    const statKeys: Array<keyof CareerStats> = isStriker
      ? ['power', 'curve', 'sweetSpot', 'focus', 'maxMana', 'manaRegen']
      : ['agility', 'reach', 'composure', 'anticipation', 'maxMana', 'manaRegen'];

    const targetKey = statKeys[this.careerSelectedStatIdx];
    if (!targetKey) return;

    const result = trainStat(this.careerSave, targetKey);
    if (result.success) {
      this.audio.playSkillEffect('titan');
      saveCareerData(this.careerSave);
      this.vfx.showBanner('TRAINING SUCCESS!', result.message, '#38bdf8', '#0f172a', 1.0);
    } else {
      this.audio.playPostHit();
      this.vfx.showBanner('TRAINING FAILED!', result.message, '#ef4444', '#0f172a', 1.0);
    }
  }

  private handleCareerShopAction(): void {
    if (!this.careerSave) return;
    const filteredGear = EQUIPMENT_CATALOG.filter(
      (g) => g.position === 'all' || g.position === this.careerSave!.position
    );
    const targetGear = filteredGear[this.careerSelectedEquipIdx];
    if (!targetGear) return;

    const result = buyAndEquipItem(this.careerSave, targetGear.id);
    if (result.success) {
      this.audio.playGoalSwishAndCheer();
      saveCareerData(this.careerSave);
      this.vfx.showBanner('GEAR EQUIPPED!', result.message, '#c084fc', '#0f172a', 1.2);
    } else {
      this.audio.playPostHit();
      this.vfx.showBanner('CANNOT BUY!', result.message, '#ef4444', '#0f172a', 1.0);
    }
  }

  private advanceCareerWeekAndTriggerEvent(): void {
    if (!this.careerSave) {
      this.screen = 'mode_select';
      return;
    }

    // 1. Advance calendar week (1..34)
    this.careerSave.currentWeek = Math.min(34, this.careerSave.currentWeek + 1);

    // 2. Consume active buff match count
    if (this.careerSave.activeBuff) {
      this.careerSave.activeBuff.matchesLeft--;
      if (this.careerSave.activeBuff.matchesLeft <= 0) {
        this.careerSave.activeBuff = null;
      }
    }

    // 3. Roll for Story Event (100% trigger between matches)
    const evt = getRandomStoryEvent(this.careerSave);
    this.careerSave.pendingEvent = evt;
    this.careerSelectedEventOptionIdx = 0;
    saveCareerData(this.careerSave);

    this.audio.playTauntFanfare();
    this.screen = 'career_event';
  }

  private confirmCareerStoryEventChoice(): void {
    if (!this.careerSave || !this.careerSave.pendingEvent) {
      this.screen = 'career_hub';
      return;
    }

    const opts = this.careerSave.pendingEvent.options;
    const selectedOpt = opts[this.careerSelectedEventOptionIdx] ?? opts[0];
    if (selectedOpt) {
      const outcome = applyStoryEventOption(this.careerSave, selectedOpt);
      this.careerSave.pendingEvent = null;
      saveCareerData(this.careerSave);

      this.audio.playGoalSwishAndCheer();
      this.vfx.showBanner('EVENT RESOLVED!', outcome.messageKo, '#facc15', '#0f172a', 1.8);
    }

    this.screen = 'career_hub';
  }

  private handleCareerEventClick(vx: number, vy: number): void {
    if (!this.careerSave || !this.careerSave.pendingEvent) return;
    const event = this.careerSave.pendingEvent;

    if (event.type === 'smartphone') {
      for (let i = 0; i < event.options.length; i++) {
        const optY = 122 + i * 36;
        if (vx >= 126 && vx <= 348 && vy >= optY && vy <= optY + 32) {
          this.careerSelectedEventOptionIdx = i;
          this.confirmCareerStoryEventChoice();
          return;
        }
      }
    } else if (event.type === 'press_conference') {
      for (let i = 0; i < event.options.length; i++) {
        const optY = 190 + i * 24;
        if (vx >= 20 && vx <= 460 && vy >= optY && vy <= optY + 22) {
          this.careerSelectedEventOptionIdx = i;
          this.confirmCareerStoryEventChoice();
          return;
        }
      }
    } else if (event.type === 'newspaper') {
      for (let i = 0; i < event.options.length; i++) {
        const optY = 164 + i * 29;
        if (vx >= 54 && vx <= 414 && vy >= optY && vy <= optY + 25) {
          this.careerSelectedEventOptionIdx = i;
          this.confirmCareerStoryEventChoice();
          return;
        }
      }
    } else {
      for (let i = 0; i < event.options.length; i++) {
        const optY = 186 + i * 25;
        if (vx >= 30 && vx <= 450 && vy >= optY && vy <= optY + 22) {
          this.careerSelectedEventOptionIdx = i;
          this.confirmCareerStoryEventChoice();
          return;
        }
      }
    }
  }

  private resetTurnActors(): void {
    this.kicker = {
      x: 220,
      y: 230,
      anim: 'idle',
      frame: 0,
      animTimer: 0,
      skillAura: 'none',
    };

    this.keeper = {
      x: 240,
      y: 112,
      baseX: 240,
      baseY: 112,
      targetX: 240,
      targetY: 112,
      anim: 'idle',
      frame: 0,
      animTimer: 0,
      hasDived: false,
      diveZone: 'center',
      scale: 1,
      skillActive: 'none',
      iceWallZone: null,
      blackHoleActive: false,
      blinked: false,
    };

    this.ball = {
      z: 0,
      startX: this.penaltySpot.x,
      startY: this.penaltySpot.y,
      targetX: 240,
      targetY: 96,
      x: this.penaltySpot.x,
      y: this.penaltySpot.y,
      groundY: this.penaltySpot.y,
      radius: 9,
      speed: 1.55,
      power: 0.85,
      perfectImpact: false,
      spin: 0,
      curveOffset: 0,
      curveTriggered: false,
      chronoTriggered: false,
      chronoTimer: 0,
      deflected: false,
      vx: 0,
      vy: 0,
      mirageClones: [],
    };
  }

  private setupTurn(): void {
    this.vfx.resetRound();
    this.resetTurnActors();
    this.selectedKickerSkill = 'none';
    this.selectedKeeperSkill = 'none';
    this.aimX = 240 + (Math.random() - 0.5) * 40;
    this.aimY = 96;
    this.keeperAimZone = 'center';
    this.powerGauge = 0;
    this.reflexBonus = false;
    this.netBulgeStrength = 0;
    this.slowMoFactor = 1;
    this.slowMoTimer = 0;

    this.phase = 'intro';
    this.phaseTimer = 0.85;

    const roundTitle = this.isSuddenDeath ? `SUDDEN DEATH R${this.round}` : `ROUND ${this.round}`;
    const roleSub =
      this.gameMode === 'local_2p'
        ? this.turnRole === 'player_kick'
          ? 'P1 KICKER vs P2 KEEPER'
          : 'P2 KICKER vs P1 KEEPER'
        : this.gameMode === 'online_multi'
        ? this.isHumanControllingKicker()
          ? 'YOUR KICK! 골문을 노려라!'
          : 'YOUR SAVE! 상대의 슛을 막아라!'
        : this.turnRole === 'player_kick'
        ? 'YOUR KICK! 골문을 노려라!'
        : 'YOUR SAVE! 슈팅을 막아내라!';

    const bannerColor =
      this.gameMode === 'online_multi'
        ? this.isHumanControllingKicker()
          ? '#38bdf8'
          : '#fb923c'
        : this.turnRole === 'player_kick'
        ? '#38bdf8'
        : '#fb923c';

    this.vfx.showBanner(
      roundTitle,
      roleSub,
      bannerColor,
      '#0f172a',
      0.95
    );
    this.audio.playWhistle(false);

    this.planAIDecisionsForTurn();
  }

  private planAIDecisionsForTurn(): void {
    const zones: DiveZone[] = ['top_left', 'top_center', 'top_right', 'low_left', 'center', 'low_right'];
    this.aiPlannedDiveZone = zones[Math.floor(Math.random() * zones.length)];
    this.aiPlannedKeeperSkill = 'none';
    this.aiDiveTriggerZ = this.difficulty === 'legend' ? 0.46 : this.difficulty === 'pro' ? 0.36 : 0.25;

    if (this.gameMode === 'vs_ai' && this.turnRole === 'player_keep') {
      // AI is Kicker (Red Team)
      this.aiAimTimer = 0.85 + Math.random() * 0.55;
      const cornerChoices = [
        { x: this.goal.left + 22, y: this.goal.top + 18 },
        { x: this.goal.right - 22, y: this.goal.top + 18 },
        { x: this.goal.left + 24, y: this.goal.bottom - 14 },
        { x: this.goal.right - 24, y: this.goal.bottom - 14 },
        { x: 240, y: this.goal.top + 20 },
      ];
      const pick = cornerChoices[Math.floor(Math.random() * cornerChoices.length)];
      const spread = this.difficulty === 'rookie' ? 24 : this.difficulty === 'pro' ? 12 : 6;
      this.aiTargetAimX = pick.x + (Math.random() - 0.5) * spread;
      this.aiTargetAimY = pick.y + (Math.random() - 0.5) * spread;

      // AI Kicker Superpower selection
      const skillProb = this.difficulty === 'legend' ? 0.78 : this.difficulty === 'pro' ? 0.58 : 0.35;
      if (Math.random() < skillProb) {
        const affordable = KICKER_SKILLS.filter((s) => s.manaCost <= this.redMana);
        if (affordable.length > 0) {
          const chosen = affordable[Math.floor(Math.random() * affordable.length)];
          this.selectedKickerSkill = chosen.id;
          this.kicker.skillAura = chosen.id;
        }
      }
    }
  }

  private beginKickerRunup(): void {
    if (this.gameMode === 'online_multi' && this.isHumanControllingKicker()) {
      this.net.sendEvent({
        type: 'kick_action',
        aimX: this.aimX,
        aimY: this.aimY,
        power: this.powerGauge,
        skill: this.selectedKickerSkill,
      });
    }

    this.phase = 'runup';
    this.phaseTimer = 0.38;
    this.kicker.anim = 'runup';
    this.kicker.frame = 0;

    // Consume Kicker Mana if skill active
    const skillDef = getKickerSkill(this.selectedKickerSkill);
    if (skillDef) {
      this.kickerSkillCooldowns.set(skillDef.id, this.round);
      if (this.gameMode === 'online_multi') {
        if (this.net.myRole === 'p1') {
          this.blueMana = Math.max(0, this.blueMana - skillDef.manaCost);
        } else {
          this.redMana = Math.max(0, this.redMana - skillDef.manaCost);
        }
      } else if (this.turnRole === 'player_kick') {
        this.blueMana = Math.max(0, this.blueMana - skillDef.manaCost);
      } else {
        this.redMana = Math.max(0, this.redMana - skillDef.manaCost);
      }
      this.vfx.triggerSpeedLines(skillDef.color, 0.55);
      this.vfx.showBanner(skillDef.nameEn + '!', skillDef.nameKo, skillDef.accentColor, '#0f172a', 0.72);
    }
  }

  private launchShot(): void {
    this.phase = 'ball_flight';
    this.kicker.anim = 'kick';
    this.kicker.frame = 2;
    this.hitStopTimer = this.selectedKickerSkill !== 'none' ? 0.075 : 0.04;

    let sweetMin = 0.76;
    let sweetMax = 0.94;
    let powerBonusSpeed = 1.0;

    if (this.gameMode === 'career' && this.careerSave) {
      const stats = getTotalPlayerStats(this.careerSave);
      if (this.careerSave.position === 'striker' && this.turnRole === 'player_kick') {
        // Striker sweetspot width expansion (up to +0.06 on each side)
        let sweetExpand = Math.min(0.06, (stats.sweetSpot - 30) * 0.001);
        if (this.careerSave.activeBuff?.type === 'sweetspot') {
          sweetExpand += this.careerSave.activeBuff.value * 0.001;
        }
        sweetMin -= sweetExpand;
        sweetMax += sweetExpand;
        // Shot speed bonus from power stat (e.g. power 70 -> +20% speed)
        let powerBonus = (stats.power - 30) * 0.004;
        if (this.careerSave.activeBuff?.type === 'power') {
          powerBonus += this.careerSave.activeBuff.value * 0.003;
        }
        powerBonusSpeed = 1 + powerBonus;
      }
    }

    const sweetSpot = this.powerGauge >= sweetMin && this.powerGauge <= sweetMax;
    const isUnderpowerRed = this.powerGauge >= 0.58 && this.powerGauge < sweetMin;
    const isOverpowerRed = this.powerGauge > 1.03;
    const isWeakGray = this.powerGauge < 0.58;

    let finalTargetX = this.aimX;
    let finalTargetY = this.aimY;

    if (sweetSpot) {
      // Pinpoint accurate shot straight into aimed spot!
    } else if (isWeakGray) {
      // Gray undercharge: slight inaccuracy, but significantly slower flight speed
      finalTargetX += (Math.random() - 0.5) * 12;
      finalTargetY += (0.58 - this.powerGauge) * 18; // drops lower due to low power
    } else if (isUnderpowerRed) {
      // Early red zone: high inaccuracy, often misses goal frame!
      const missSpread = (0.76 - this.powerGauge) * 120 + 25;
      finalTargetX += (Math.random() < 0.5 ? -1 : 1) * (missSpread + Math.random() * 20);
      finalTargetY += (Math.random() - 0.5) * 35;
    } else if (isOverpowerRed) {
      // Overpower red zone: wild deviation, high risk of skying over bar or wide
      const missSpread = (this.powerGauge - 1.03) * 160 + 30;
      finalTargetX += (Math.random() < 0.5 ? -1 : 1) * (missSpread + Math.random() * 25);
      finalTargetY -= (this.powerGauge - 1.0) * 55 + Math.random() * 20; // skyrockets out!
    }

    // If Telekinesis Curve is active, initially fake toward opposite side, then snap into aimed corner!
    let curveDelta = 0;
    if (this.selectedKickerSkill === 'curve') {
      const aimOffsetFromCenter = finalTargetX - 240;
      const fakeStartTargetX = Math.abs(aimOffsetFromCenter) < 25
        ? 240 + (Math.random() < 0.5 ? -68 : 68)
        : 240 - aimOffsetFromCenter * 0.85;
      curveDelta = finalTargetX - fakeStartTargetX;
      finalTargetX = fakeStartTargetX;
    }

    const baseSpeed = isWeakGray
      ? 0.72 + this.powerGauge * 0.55 // Slow float in gray zone
      : 1.45 + this.powerGauge * 0.75;
    const skillSpeedMult = this.selectedKickerSkill === 'flame' ? 1.38 : 1.0;

    this.ball.z = 0;
    this.ball.startX = this.penaltySpot.x;
    this.ball.startY = this.penaltySpot.y;
    this.ball.targetX = finalTargetX;
    this.ball.targetY = finalTargetY;
    this.ball.speed = baseSpeed * skillSpeedMult * powerBonusSpeed;
    this.ball.power = this.powerGauge;
    this.ball.perfectImpact = sweetSpot;
    this.ball.curveOffset = curveDelta;
    this.ball.curveTriggered = false;
    this.ball.chronoTriggered = false;
    this.ball.deflected = false;

    if (this.selectedKickerSkill === 'mirage') {
      this.ball.mirageClones = [
        { offsetX: -48, offsetY: -12, phase: 0 },
        { offsetX: 48, offsetY: 10, phase: Math.PI },
      ];
    } else {
      this.ball.mirageClones = [];
    }

    // Impact VFX & Audio
    const sparkColors =
      this.selectedKickerSkill === 'flame'
        ? ['#fef08a', '#f97316', '#ef4444']
        : this.selectedKickerSkill === 'mirage'
        ? ['#cffafe', '#06b6d4', '#38bdf8']
        : this.selectedKickerSkill === 'curve'
        ? ['#fae8ff', '#c084fc', '#9333ea']
        : this.selectedKickerSkill === 'chrono'
        ? ['#fef9c3', '#facc15', '#eab308']
        : sweetSpot
        ? ['#fef08a', '#4ade80', '#ffffff']
        : ['#ffffff', '#cbd5e1'];

    this.vfx.spawnShockwave(this.penaltySpot.x, this.penaltySpot.y, sweetSpot ? 34 : 22, sparkColors[0], 0.25);
    this.vfx.spawnBurst(this.penaltySpot.x, this.penaltySpot.y, 18, sparkColors, 45, 165, 4, 70);
    this.vfx.triggerShake(this.selectedKickerSkill !== 'none' ? 4.5 : sweetSpot ? 3 : 1.8, 0.16);
    this.audio.playKick(this.selectedKickerSkill !== 'none', sweetSpot);

    // Prepare AI Goalkeeper reaction if AI is keeping
    if (this.gameMode === 'vs_ai' && this.turnRole === 'player_kick') {
      this.decideAIKeeperReaction();
    }
  }

  private decideAIKeeperReaction(): void {
    const actualZone = coordsToZone(this.ball.targetX + this.ball.curveOffset, this.ball.targetY, this.goal);
    const initialFakeZone = coordsToZone(this.ball.targetX, this.ball.targetY, this.goal);

    let readAccuracy = this.difficulty === 'legend' ? 0.72 : this.difficulty === 'pro' ? 0.5 : 0.28;

    // Mirage Shot confuses AI!
    if (this.selectedKickerSkill === 'mirage') {
      readAccuracy *= 0.42;
    }
    // Telekinesis Curve tricks AI into diving toward initial fake trajectory unless AI has Blink!
    if (this.selectedKickerSkill === 'curve') {
      readAccuracy *= 0.35;
    }
    // Chrono Delay baits early dive!
    if (this.selectedKickerSkill === 'chrono') {
      this.aiDiveTriggerZ = 0.28;
      readAccuracy *= 0.55;
    }

    if (Math.random() < readAccuracy) {
      this.aiPlannedDiveZone = actualZone;
    } else if (this.selectedKickerSkill === 'curve' && Math.random() < 0.75) {
      this.aiPlannedDiveZone = initialFakeZone;
    }

    // AI Goalkeeper superpower usage
    const skillChance = this.difficulty === 'legend' ? 0.72 : this.difficulty === 'pro' ? 0.46 : 0.22;
    if (Math.random() < skillChance) {
      const affordable = KEEPER_SKILLS.filter((s) => s.manaCost <= this.redMana);
      if (affordable.length > 0) {
        const pick = affordable[Math.floor(Math.random() * affordable.length)];
        this.aiPlannedKeeperSkill = pick.id;
        if (pick.id === 'blink') {
          this.aiDiveTriggerZ = 0.76; // Blink triggers late right before goal line!
        }
      }
    }
  }

  private executeKeeperDive(zone: DiveZone, skillId: KeeperSkillId): void {
    if (this.keeper.hasDived) return;
    this.keeper.hasDived = true;
    this.keeper.diveZone = zone;

    if (this.gameMode === 'online_multi' && this.isHumanControllingKeeper()) {
      this.net.sendEvent({
        type: 'keeper_dive',
        zone,
        skill: skillId,
        reflexBonus: this.reflexBonus,
      });
    }

    // Consume keeper mana if skill selected
    const skillDef = getKeeperSkill(skillId);
    const keeperIsBlue = this.gameMode === 'online_multi' ? this.net.myRole === 'p1' : this.turnRole === 'player_keep';
    const currentMana = keeperIsBlue ? this.blueMana : this.redMana;

    if (skillDef && currentMana >= skillDef.manaCost) {
      this.keeperSkillCooldowns.set(skillDef.id, this.round);
      if (keeperIsBlue) this.blueMana -= skillDef.manaCost;
      else this.redMana -= skillDef.manaCost;

      this.keeper.skillActive = skillId;
      this.audio.playSkillEffect(skillId);

      if (skillId === 'titan') {
        this.keeper.scale = 1.65;
        this.vfx.spawnShockwave(this.keeper.x, this.keeper.y, 40, '#22c55e', 0.32);
        this.vfx.triggerShake(3.5, 0.18);
      } else if (skillId === 'icewall') {
        this.keeper.iceWallZone = getOppositeCornerZone(zone);
        const wallPt = zoneToGoalCoords(this.keeper.iceWallZone, this.goal);
        this.vfx.spawnBurst(wallPt.x, wallPt.y, 16, ['#e0f2fe', '#38bdf8', '#0284c7'], 30, 110, 4, 60);
      } else if (skillId === 'blackhole') {
        this.keeper.blackHoleActive = true;
      } else if (skillId === 'blink') {
        // Teleport directly to actual ball target coordinate!
        this.keeper.blinked = true;
        this.vfx.spawnBurst(this.keeper.x, this.keeper.y, 20, ['#f43f5e', '#ffe4e6', '#fb7185'], 40, 140, 4, 0);
        this.vfx.addAfterimage(this.keeper.x, this.keeper.y, 1, '#f43f5e', 'keeper');

        const clampedX = Math.max(this.goal.left + 14, Math.min(this.goal.right - 14, this.ball.targetX));
        const clampedY = Math.max(this.goal.top + 14, Math.min(this.goal.bottom - 8, this.ball.targetY));
        this.keeper.x = clampedX;
        this.keeper.y = clampedY + 6;
        this.keeper.targetX = clampedX;
        this.keeper.targetY = clampedY + 6;
        zone = coordsToZone(clampedX, clampedY, this.goal);
        this.keeper.diveZone = zone;
        this.vfx.spawnShockwave(clampedX, clampedY, 32, '#f43f5e', 0.25);
      }
    }

    const dest = zoneToGoalCoords(zone, this.goal);
    if (!this.keeper.blinked) {
      this.keeper.targetX = dest.x;
      this.keeper.targetY = dest.y + 8;
    }

    if (zone === 'top_left') this.keeper.anim = 'dive_top_left';
    else if (zone === 'top_right') this.keeper.anim = 'dive_top_right';
    else if (zone === 'low_left') this.keeper.anim = 'dive_low_left';
    else if (zone === 'low_right') this.keeper.anim = 'dive_low_right';
    else this.keeper.anim = 'catch_center';

    this.keeper.frame = 0;
    this.keeper.animTimer = 0;
  }

  // =========================================================================
  // MAIN UPDATE LOOP
  // =========================================================================
  private update(rawDt: number): void {
    this.elapsedTime += rawDt;

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= rawDt;
      this.vfx.update(rawDt * 0.25);
      return;
    }

    if (this.isPaused) {
      return; // Freeze game updates while paused
    }

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDt;
      if (this.slowMoTimer <= 0) this.slowMoFactor = 1;
    }

    const dt = rawDt * this.slowMoFactor;
    this.vfx.update(dt);

    if (this.netBulgeStrength > 0) {
      this.netBulgeStrength = Math.max(0, this.netBulgeStrength - dt * 2.4);
    }

    if (this.screen !== 'playing') {
      // Animate idle actors on title / menu screen
      this.updateActorFrames(dt);
      if (Math.random() < 0.35) {
        this.vfx.spawnAuraParticles(220, 224, ['#38bdf8', '#facc15']);
      }
      return;
    }

    this.updateActorFrames(dt);
    this.updateAimInputs(dt);

    // Kicker skill aura particles
    if (this.kicker.skillAura !== 'none' && (this.phase === 'aiming' || this.phase === 'charging' || this.phase === 'runup')) {
      const s = getKickerSkill(this.kicker.skillAura);
      if (s) this.vfx.spawnAuraParticles(this.kicker.x, this.kicker.y - 6, [s.color, s.accentColor]);
    }

    switch (this.phase) {
      case 'intro':
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) {
          this.phase = 'aiming';
        }
        break;

      case 'aiming':
        if (this.gameMode === 'vs_ai' && this.turnRole === 'player_keep') {
          // AI Kicker aiming countdown
          this.aimX += (this.aiTargetAimX - this.aimX) * Math.min(1, dt * 6);
          this.aimY += (this.aiTargetAimY - this.aimY) * Math.min(1, dt * 6);
          this.aiAimTimer -= dt;
          if (this.aiAimTimer <= 0) {
            this.phase = 'charging';
            this.powerGauge = 0.1;
            this.kicker.anim = 'charge';
          }
        }
        break;

      case 'charging': {
        const chargeSpeed = 1.45;
        this.powerGauge += this.powerDir * chargeSpeed * dt;
        if (this.powerGauge >= 1.22) {
          this.powerGauge = 1.22;
          this.powerDir = -1;
        } else if (this.powerGauge <= 0.12) {
          this.powerGauge = 0.12;
          this.powerDir = 1;
        }

        // AI releases near sweet spot
        if (this.gameMode === 'vs_ai' && this.turnRole === 'player_keep') {
          const targetRelease = this.difficulty === 'legend' ? 0.86 : this.difficulty === 'pro' ? 0.82 : 0.72;
          if (this.powerGauge >= targetRelease) {
            this.beginKickerRunup();
          }
        }
        break;
      }

      case 'runup':
        this.phaseTimer -= dt;
        this.kicker.x += 36 * dt;
        this.kicker.y -= 28 * dt;
        if (this.phaseTimer <= 0.08 && this.kicker.anim !== 'kick') {
          this.kicker.anim = 'kick';
          this.kicker.frame = 0;
        }
        if (this.phaseTimer <= 0) {
          this.launchShot();
        }
        break;

      case 'chrono_pause':
        this.ball.chronoTimer -= rawDt;
        // Keeper keeps moving/falling if they already dived early!
        this.updateKeeperMovement(rawDt);
        if (this.ball.chronoTimer <= 0) {
          this.phase = 'ball_flight';
          this.ball.speed *= 1.55;
          this.vfx.triggerFlash('#fef9c3', 0.1);
          this.vfx.spawnShockwave(this.ball.x, this.ball.y, 30, '#eab308', 0.22);
          this.audio.playKick(true, true);
        }
        break;

      case 'ball_flight':
        this.updateBallFlight(dt);
        this.updateKeeperMovement(dt);
        break;

      case 'resolution':
        this.updateDeflectedBall(dt);
        this.updateKeeperMovement(dt);
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) {
          this.advanceTurnOrFinishMatch();
        }
        break;
    }
  }

  private updateAimInputs(dt: number): void {
    const aimSpeed = 145;
    if (this.isHumanControllingKicker() && this.phase === 'aiming') {
      if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) this.aimX -= aimSpeed * dt;
      if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) this.aimX += aimSpeed * dt;
      if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) this.aimY -= aimSpeed * dt;
      if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) this.aimY += aimSpeed * dt;

      this.aimX = Math.max(this.goal.left - 22, Math.min(this.goal.right + 22, this.aimX));
      this.aimY = Math.max(this.goal.top - 16, Math.min(this.goal.bottom + 4, this.aimY));
    }

    if (this.isHumanControllingKeeper() && !this.keeper.hasDived) {
      const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
      const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
      const up = this.keys.has('ArrowUp') || this.keys.has('KeyW');
      const down = this.keys.has('ArrowDown') || this.keys.has('KeyS');

      if (left || right || up || down) {
        if (left) {
          this.keeperAimZone = up ? 'top_left' : 'low_left';
        } else if (right) {
          this.keeperAimZone = up ? 'top_right' : 'low_right';
        } else if (up) {
          this.keeperAimZone = 'top_center';
        } else if (down) {
          this.keeperAimZone = 'center';
        }
      }
    }
  }

  private updateBallFlight(dt: number): void {
    const prevZ = this.ball.z;
    this.ball.z += this.ball.speed * dt;
    const z = this.ball.z;

    // 1. Telekinesis mid-flight snap curve!
    if (this.selectedKickerSkill === 'curve' && !this.ball.curveTriggered && z >= 0.46) {
      this.ball.curveTriggered = true;
      this.ball.targetX += this.ball.curveOffset;
      this.vfx.spawnShockwave(this.ball.x, this.ball.y, 30, '#c084fc', 0.25);
      this.vfx.spawnBurst(this.ball.x, this.ball.y, 16, ['#fae8ff', '#c084fc', '#9333ea'], 40, 130, 3, 0);
      this.audio.playSkillEffect('curve');
    }

    // 2. Chrono Delay mid-air time stop!
    if (this.selectedKickerSkill === 'chrono' && !this.ball.chronoTriggered && z >= 0.5) {
      this.ball.chronoTriggered = true;
      this.ball.chronoTimer = 0.52;
      this.phase = 'chrono_pause';
      this.vfx.triggerFlash('#fef08a', 0.12);
      this.vfx.spawnShockwave(this.ball.x, this.ball.y, 38, '#eab308', 0.3);
      this.audio.playSkillEffect('chrono');
      return;
    }

    // 3. AI Keeper dive trigger or Human auto-assist dive at z >= 0.72 if direction held
    if (!this.keeper.hasDived) {
      if (this.gameMode === 'vs_ai' && this.turnRole === 'player_kick' && z >= this.aiDiveTriggerZ) {
        this.executeKeeperDive(this.aiPlannedDiveZone, this.aiPlannedKeeperSkill);
      } else if (this.isHumanControllingKeeper() && z >= 0.72) {
        // Automatic dive into selected direction if player hasn't pressed SPACE manually yet
        this.executeKeeperDive(this.keeperAimZone, this.selectedKeeperSkill);
      }
    }

    // 4. Black Hole gravitational pull on the ball!
    if (this.keeper.blackHoleActive && z > 0.35 && z < 1.0) {
      const pullStrength = 220 * dt;
      this.ball.targetX += (this.keeper.x - this.ball.targetX) * Math.min(1, pullStrength * 0.045);
      this.ball.targetY += ((this.keeper.y - 6) - this.ball.targetY) * Math.min(1, pullStrength * 0.045);
      this.ball.mirageClones.forEach((c) => {
        c.offsetX *= 0.88;
        c.offsetY *= 0.88;
      });
    }

    // Compute 2.5D perspective ball position & arc height
    const easeZ = Math.min(1.0, z);
    const groundY = this.ball.startY + (this.goal.bottom - this.ball.startY) * easeZ;
    // At z = 1.0 (goal line), arcLift drops to 0 so ball precisely hits aimed targetY!
    const arcLift = Math.sin(Math.min(1, z) * Math.PI) * (18 + this.ball.power * 10) * (1 - easeZ);

    let bx = this.ball.startX + (this.ball.targetX - this.ball.startX) * easeZ;
    let by = this.ball.startY + (this.ball.targetY - this.ball.startY) * easeZ - arcLift;

    if (this.selectedKickerSkill === 'curve' && this.ball.curveTriggered) {
      // Smooth whip interpolation right after trigger
      const whip = Math.min(1, (z - 0.46) / 0.25);
      bx = this.ball.startX + ((this.ball.targetX - this.ball.curveOffset * (1 - whip)) - this.ball.startX) * easeZ;
    }

    this.ball.x = bx;
    this.ball.y = by;
    this.ball.groundY = groundY;
    this.ball.radius = Math.max(5, Math.round(9 - z * 3.5));
    this.ball.spin += dt * 18;

    // Continuous skill trail VFX
    if (this.selectedKickerSkill === 'flame') {
      this.vfx.spawnFlameTrail(bx, by, groundY);
      this.vfx.addAfterimage(bx, by, 1 - z * 0.35, '#f97316', 'ball');
    } else if (this.selectedKickerSkill === 'curve') {
      this.vfx.addAfterimage(bx, by, 1 - z * 0.35, '#c084fc', 'ball');
    } else if (this.ball.perfectImpact) {
      this.vfx.addAfterimage(bx, by, 1 - z * 0.35, '#38bdf8', 'ball');
    }

    // Dramatic slow-mo on close superpower clash near goal line!
    if (prevZ < 0.78 && z >= 0.78 && (this.selectedKickerSkill !== 'none' || this.keeper.skillActive !== 'none')) {
      this.slowMoFactor = 0.42;
      this.slowMoTimer = 0.22;
    }

    // 5. GOAL LINE EVALUATION AT z >= 1.0
    if (prevZ < 1.0 && z >= 1.0) {
      this.evaluateGoalLineCollision();
    }
  }

  private evaluateGoalLineCollision(): void {
    const bx = this.ball.x;
    const by = this.ball.y;
    const g = this.goal;

    this.slowMoFactor = 1;
    this.slowMoTimer = 0;

    // 1. Check Ice Barrier collision first!
    if (this.keeper.iceWallZone) {
      const wallCenter = zoneToGoalCoords(this.keeper.iceWallZone, g);
      if (Math.abs(bx - wallCenter.x) <= 31 && Math.abs(by - wallCenter.y) <= 27) {
        this.triggerSaveResolution('ICE BARRIER!', '얼음 장벽 완벽 방어!', '#38bdf8');
        return;
      }
    }

    // 2. Check Goalkeeper Save Hitbox!
    const keeperGloveX = this.keeper.x;
    const keeperGloveY = this.keeper.y - 6;
    let saveRadiusX = 25 * this.keeper.scale;
    let saveRadiusY = 22 * this.keeper.scale;

    // Career Mode Keeper Reach bonus
    if (this.gameMode === 'career' && this.careerSave) {
      const stats = getTotalPlayerStats(this.careerSave);
      if (this.careerSave.position === 'goalkeeper' && this.turnRole === 'player_keep') {
        let reachBonus = 1 + (stats.reach - 30) * 0.005; // Expands glove reach up to +35%
        if (this.careerSave.activeBuff?.type === 'reach') {
          reachBonus += this.careerSave.activeBuff.value * 0.005;
        }
        saveRadiusX *= reachBonus;
        saveRadiusY *= reachBonus;
      }
    }

    if (this.reflexBonus) {
      saveRadiusX *= 1.28;
      saveRadiusY *= 1.25;
    }
    if (this.keeper.blackHoleActive) {
      saveRadiusX = 48;
      saveRadiusY = 38;
    }
    if (this.keeper.blinked) {
      saveRadiusX = 34;
      saveRadiusY = 30;
    }

    const dx = Math.abs(bx - keeperGloveX);
    const dy = Math.abs(by - keeperGloveY);
    const keeperTouched = dx <= saveRadiusX && dy <= saveRadiusY;

    // Check inside goal frame vs post vs miss (giving generous arcade margin)
    const inFrameX = bx >= g.left - 1 && bx <= g.right + 1;
    const inFrameY = by >= g.top - 1 && by <= g.bottom + 4;
    const hitPost =
      !inFrameX || !inFrameY
        ? bx >= g.left - 11 && bx <= g.right + 11 && by >= g.top - 10 && by <= g.bottom + 8
        : false;

    if (keeperTouched && (inFrameX && inFrameY)) {
      // Flame Cannon breakthrough check against normal non-Titan/non-Blink save!
      if (
        this.selectedKickerSkill === 'flame' &&
        this.keeper.skillActive !== 'titan' &&
        this.keeper.skillActive !== 'blink' &&
        dx > 10 &&
        Math.random() < 0.55
      ) {
        // Breakthrough! Ball blasts off keeper's gloves into the net!
        this.vfx.spawnBurst(bx, by, 28, ['#fef08a', '#f97316', '#ef4444'], 60, 200, 4, 80);
        this.triggerGoalResolution('FLAME BREAK!!', '초고속 화염포가 방어를 뚫었다!');
        return;
      }

      const saveTitle =
        this.keeper.skillActive === 'blink'
          ? 'BLINK SAVE!!'
          : this.keeper.skillActive === 'blackhole'
          ? 'GRAVITY CATCH!'
          : this.keeper.skillActive === 'titan'
          ? 'TITAN BLOCK!'
          : this.reflexBonus
          ? 'SUPER SAVE!!'
          : 'SAVED!';
      const saveSub = this.reflexBonus ? '환상적인 반사신경 슈퍼 세이브!' : '골키퍼의 철벽 선방!';
      this.triggerSaveResolution(saveTitle, saveSub, '#4ade80');
      return;
    }

    if (inFrameX && inFrameY) {
      const goalTitle = this.ball.perfectImpact ? 'SUPER GOAL!!!' : 'GOAL!!!';
      const goalSub =
        this.selectedKickerSkill !== 'none'
          ? `${getKickerSkill(this.selectedKickerSkill)?.nameKo} 작렬!`
          : '골망을 시원하게 가릅니다!';
      this.triggerGoalResolution(goalTitle, goalSub);
      return;
    }

    if (hitPost) {
      this.recordShotResult('post');
      this.phase = 'resolution';
      this.phaseTimer = 1.8;
      this.ball.deflected = true;
      this.ball.vx = bx < 240 ? -130 : 130;
      this.ball.vy = -85;
      this.kicker.anim = 'despair';
      // Keeper taunts on opponent miss!
      this.keeper.anim = Math.random() < 0.6 ? 'taunt' : 'celebrate';
      this.vfx.spawnShockwave(bx, by, 26, '#facc15', 0.25);
      this.vfx.spawnBurst(bx, by, 18, ['#ffffff', '#facc15', '#cbd5e1'], 50, 160, 3, 120);
      this.vfx.triggerShake(4, 0.22);
      this.vfx.showBanner('POST HIT!', '골대를 강타하고 튕겨나갑니다!', '#facc15', '#0f172a', 1.4);
      this.audio.playPostHit();
      if (this.keeper.anim === 'taunt') this.audio.playTauntFanfare();
      return;
    }

    // Wide or over the bar!
    this.recordShotResult('miss');
    this.phase = 'resolution';
    this.phaseTimer = 1.7;
    this.ball.deflected = true;
    this.ball.vx = (bx - 240) * 0.7;
    this.ball.vy = -55;
    this.kicker.anim = 'despair';
    this.keeper.anim = Math.random() < 0.6 ? 'taunt' : 'celebrate';
    this.vfx.showBanner('MISSED!', '골문을 완전히 벗어났습니다!', '#f87171', '#0f172a', 1.35);
    this.audio.playMissSigh();
    if (this.keeper.anim === 'taunt') this.audio.playTauntFanfare();
  }

  private triggerGoalResolution(title: string, subtitle: string): void {
    this.recordShotResult('goal');
    this.phase = 'resolution';
    this.phaseTimer = 1.95;

    // Bulge reactive pixel net!
    this.netBulgeX = this.ball.x;
    this.netBulgeY = this.ball.y;
    this.netBulgeStrength = 1.0;

    // Settle ball inside back of net
    this.ball.deflected = true;
    this.ball.vx = (240 - this.ball.x) * 0.2;
    this.ball.vy = 28;

    // Kicker celebration: SIUU / Taunt or Celebrate!
    const doTaunt = Math.random() < 0.55;
    this.kicker.anim = doTaunt ? 'taunt' : 'celebrate';
    this.keeper.anim = 'despair';

    // Reward kicker bonus mana
    if (this.turnRole === 'player_kick') {
      this.blueMana = Math.min(this.maxMana, this.blueMana + 15);
      if (this.gameMode === 'career' && this.careerSave) {
        this.careerSave.careerGoals++;
      }
    } else {
      this.redMana = Math.min(this.maxMana, this.redMana + 15);
    }

    this.hitStopTimer = 0.06;
    this.vfx.triggerFlash('#ffffff', 0.14);
    this.vfx.triggerShake(5.5, 0.32);
    this.vfx.spawnShockwave(this.ball.x, this.ball.y, 44, '#facc15', 0.35);
    this.vfx.spawnConfetti();
    const finalTitle = doTaunt ? `${title} (SIUUU!!)` : title;
    this.vfx.showBanner(finalTitle, subtitle, '#facc15', '#0f172a', 1.65);
    this.audio.playGoalSwishAndCheer();
    if (doTaunt) this.audio.playTauntFanfare();
  }

  private triggerSaveResolution(title: string, subtitle: string, color: string): void {
    this.recordShotResult('saved');
    this.phase = 'resolution';
    this.phaseTimer = 1.85;

    this.ball.deflected = true;
    if (this.keeper.blackHoleActive) {
      this.ball.vx = 0;
      this.ball.vy = 0;
    } else {
      this.ball.vx = this.ball.x < 240 ? -145 : 145;
      this.ball.vy = -75;
    }

    this.kicker.anim = 'despair';
    const keeperDoTaunt = Math.random() < 0.5;
    this.keeper.anim = keeperDoTaunt ? 'taunt' : 'celebrate';

    // Reward keeper bonus mana
    if (this.turnRole === 'player_keep') {
      this.blueMana = Math.min(this.maxMana, this.blueMana + 18);
      if (this.gameMode === 'career' && this.careerSave) {
        this.careerSave.careerSaves++;
      }
    } else {
      this.redMana = Math.min(this.maxMana, this.redMana + 18);
    }

    this.hitStopTimer = 0.065;
    this.vfx.triggerFlash(color, 0.12);
    this.vfx.triggerShake(4.5, 0.25);
    this.vfx.spawnShockwave(this.ball.x, this.ball.y, 38, color, 0.3);
    this.vfx.spawnBurst(this.ball.x, this.ball.y, 24, ['#ffffff', color, '#facc15'], 55, 175, 4, 95);
    this.vfx.showBanner(title, subtitle, color, '#0f172a', 1.55);
    this.audio.playSaveImpact(this.keeper.skillActive !== 'none' || this.reflexBonus);
    if (this.keeper.anim === 'taunt') {
      this.audio.playTauntFanfare();
    }
  }

  private recordShotResult(res: ShotResult): void {
    if (this.turnRole === 'player_kick') {
      this.blueHistory.push(res);
      if (res === 'goal') this.blueScore++;
    } else {
      this.redHistory.push(res);
      if (res === 'goal') this.redScore++;
    }
  }

  private updateDeflectedBall(dt: number): void {
    if (!this.ball.deflected) return;
    if (this.keeper.blackHoleActive && this.blueHistory[this.blueHistory.length - 1] !== 'goal' && this.redHistory[this.redHistory.length - 1] !== 'goal') {
      this.ball.x += (this.keeper.x - this.ball.x) * Math.min(1, dt * 12);
      this.ball.y += (this.keeper.y - this.ball.y) * Math.min(1, dt * 12);
      return;
    }

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.vy += 240 * dt;

    const floorY = 136;
    if (this.ball.y > floorY) {
      this.ball.y = floorY;
      this.ball.vy = -this.ball.vy * 0.42;
      this.ball.vx *= 0.72;
    }
  }

  private updateKeeperMovement(dt: number): void {
    if (this.keeper.hasDived) {
      const diveSpeed = 11.5;
      this.keeper.x += (this.keeper.targetX - this.keeper.x) * Math.min(1, diveSpeed * dt);
      this.keeper.y += (this.keeper.targetY - this.keeper.y) * Math.min(1, diveSpeed * dt);
    } else if (this.isHumanControllingKeeper()) {
      // Subtle anticipation lean toward aimed zone
      const hint = zoneToGoalCoords(this.keeperAimZone, this.goal);
      const leanX = 240 + (hint.x - 240) * 0.14;
      this.keeper.x += (leanX - this.keeper.x) * Math.min(1, 8 * dt);
    }
  }

  private updateActorFrames(dt: number): void {
    // Kicker frame advance
    this.kicker.animTimer += dt;
    const kInterval = this.kicker.anim === 'runup' ? 0.08 : this.kicker.anim === 'kick' ? 0.09 : 0.16;
    if (this.kicker.animTimer >= kInterval) {
      this.kicker.animTimer = 0;
      const maxFrames = this.kicker.anim === 'idle' || this.kicker.anim === 'runup' || this.kicker.anim === 'kick' || this.kicker.anim === 'celebrate' || this.kicker.anim === 'taunt' ? 4 : 2;
      if (this.kicker.anim === 'kick') {
        this.kicker.frame = Math.min(maxFrames - 1, this.kicker.frame + 1);
      } else {
        this.kicker.frame = (this.kicker.frame + 1) % maxFrames;
      }
    }

    // Keeper frame advance
    this.keeper.animTimer += dt;
    const gInterval = this.keeper.anim.startsWith('dive') ? 0.09 : 0.16;
    if (this.keeper.animTimer >= gInterval) {
      this.keeper.animTimer = 0;
      if (this.keeper.anim.startsWith('dive')) {
        this.keeper.frame = Math.min(2, this.keeper.frame + 1);
      } else if (this.keeper.anim === 'idle' || this.keeper.anim === 'celebrate' || this.keeper.anim === 'taunt') {
        this.keeper.frame = (this.keeper.frame + 1) % 4;
      } else {
        this.keeper.frame = (this.keeper.frame + 1) % 2;
      }
    }
  }

  private advanceTurnOrFinishMatch(): void {
    // Passive mana regeneration every turn
    this.blueMana = Math.min(this.maxMana, this.blueMana + 20);
    this.redMana = Math.min(this.maxMana, this.redMana + 20);

    // Check official penalty shootout victory rules!
    if (!this.isSuddenDeath) {
      const blueTaken = this.blueHistory.length;
      const redTaken = this.redHistory.length;
      const blueRemaining = 5 - blueTaken;
      const redRemaining = 5 - redTaken;

      if (this.blueScore > this.redScore + redRemaining) {
        this.finishMatch(true);
        return;
      }
      if (this.redScore > this.blueScore + blueRemaining) {
        this.finishMatch(false);
        return;
      }

      if (blueTaken === 5 && redTaken === 5) {
        if (this.blueScore !== this.redScore) {
          this.finishMatch(this.blueScore > this.redScore);
          return;
        } else {
          // Enter SUDDEN DEATH!
          this.isSuddenDeath = true;
          this.round = 6;
          this.turnRole = 'player_kick';
          this.audio.startBgm(true);
          this.setupTurn();
          return;
        }
      }
    } else {
      // Sudden death: evaluate after both teams have kicked in the current round
      if (this.blueHistory.length === this.redHistory.length) {
        if (this.blueScore !== this.redScore) {
          this.finishMatch(this.blueScore > this.redScore);
          return;
        }
        this.round++;
        this.turnRole = 'player_kick';
        this.setupTurn();
        return;
      }
    }

    // Alternate turn role
    if (this.turnRole === 'player_kick') {
      this.turnRole = 'player_keep';
    } else {
      this.turnRole = 'player_kick';
      this.round++;
    }

    this.setupTurn();
  }

  private finishMatch(blueWon: boolean): void {
    this.screen = 'match_over';
    this.audio.playWhistle(true);

    const isWinner =
      this.gameMode === 'online_multi'
        ? (blueWon && this.net.myRole === 'p1') || (!blueWon && this.net.myRole === 'p2')
        : blueWon;

    if (isWinner) {
      this.vfx.spawnConfetti();
      this.audio.playGoalSwishAndCheer();
    }

    if (this.gameMode === 'career' && this.careerSave) {
      const oppId = this.careerCurrentOpponent?.id ?? 'opp';
      const result = processCareerMatchResult(this.careerSave, this.blueScore, this.redScore, oppId);
      saveCareerData(this.careerSave);
      this.careerMatchResultSummary = result;
      if (result.champion) {
        this.winnerText = `👑 WORLD CHAMPION! 세계 최강 등극!`;
      } else if (result.promoted) {
        this.winnerText = `🏆 DIV PROMOTED! (+${result.goldEarned}G / +${result.tpEarned}TP)`;
      } else {
        this.winnerText = blueWon
          ? `VICTORY! (+${result.goldEarned}G / +${result.tpEarned}TP)`
          : `DEFEAT... (+${result.goldEarned}G / +${result.tpEarned}TP)`;
      }
    } else if (this.gameMode === 'local_2p') {
      this.winnerText = blueWon ? 'PLAYER 1 WINS!!' : 'PLAYER 2 WINS!!';
    } else if (this.gameMode === 'online_multi') {
      this.winnerText = isWinner ? 'VICTORY!! 경기 승리!' : 'DEFEAT... 아쉬운 패배!';
    } else {
      this.winnerText = blueWon ? 'VICTORY!! 챔피언 등극!' : 'DEFEAT... 재도전하세요!';
    }
  }

  // =========================================================================
  // RENDERING PIPELINE (480x270 PIXEL CANVAS)
  // =========================================================================
  private render(): void {
    const ctx = this.ctx;
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.save();

    // Standalone Career Mode Screens (Render full pixel canvas and exit)
    if (this.screen === 'career_select_position') {
      renderCareerPositionSelect(ctx, this.careerPosChoice, this.careerHoverPos, this.elapsedTime);
      ctx.restore();
      return;
    }
    if (this.screen === 'career_create_profile') {
      renderCareerCreateProfile(ctx, this.careerProfileState, this.elapsedTime);
      ctx.restore();
      return;
    }
    if (this.screen === 'career_hub' && this.careerSave) {
      renderCareerHub(ctx, this.careerSave, this.elapsedTime);
      ctx.restore();
      return;
    }
    if (this.screen === 'career_training' && this.careerSave) {
      renderCareerTraining(ctx, this.careerSave, this.careerSelectedStatIdx, this.elapsedTime);
      ctx.restore();
      return;
    }
    if (this.screen === 'career_shop' && this.careerSave) {
      renderCareerShop(ctx, this.careerSave, this.careerSelectedEquipIdx, this.elapsedTime);
      ctx.restore();
      return;
    }
    if (this.screen === 'career_standings' && this.careerSave) {
      renderCareerStandings(ctx, this.careerSave, this.elapsedTime);
      ctx.restore();
      return;
    }
    if (this.screen === 'career_event' && this.careerSave && this.careerSave.pendingEvent) {
      renderCareerStoryEvent(ctx, this.careerSave, this.careerSelectedEventOptionIdx, this.elapsedTime);
      ctx.restore();
      return;
    }

    const [shakeX, shakeY] = this.vfx.getShakeOffset();
    ctx.translate(shakeX, shakeY);

    // 1. Stadium Pixel Backdrop + Animated Crowd Wave
    ctx.drawImage(this.sprites.stadiumBackdrop, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    this.renderAnimatedCrowdHighlights(ctx);

    // 2.Scorch marks on turf
    this.vfx.renderGroundScorch(ctx);

    // 3. Goalpost & Reactive Pixel Net
    this.sprites.drawGoalAndNet(ctx, this.goal, this.netBulgeX, this.netBulgeY, this.netBulgeStrength);

    // 4. Ice Barrier Crystal (if active)
    if (this.keeper.iceWallZone) {
      const wp = zoneToGoalCoords(this.keeper.iceWallZone, this.goal);
      const [iw, ih] = logicalSize(this.sprites.iceBarrierSprite);
      ctx.drawImage(this.sprites.iceBarrierSprite, Math.round(wp.x - 28), Math.round(wp.y - 24), iw, ih);
    }

    // 5. Black Hole Vortex behind/around Keeper
    if (this.keeper.blackHoleActive) {
      this.vfx.renderBlackHole(ctx, this.keeper.x, this.keeper.y - 6, this.elapsedTime);
    }

    // 6. Goalkeeper Pixel Sprite (Front-View)
    this.renderKeeperSprite(ctx);

    // 7. Soccer Ball & Mirage Clones (if z > 0, draw in flight; if z == 0, draw on penalty spot)
    this.renderSoccerBallAndClones(ctx);

    // 9. World Pixel VFX (Shockwaves, Particles, Afterimages)
    this.vfx.renderWorldEffects(ctx);
    if (this.phase === 'chrono_pause') {
      this.vfx.renderChronoClock(ctx, this.ball.x, this.ball.y, 1 - this.ball.chronoTimer / 0.52);
    }

    // 10. Kicker Pixel Sprite in Foreground (Back-View!)
    this.renderKickerSprite(ctx);

    ctx.restore();

    // 11. Screen Overlays & UI Screens
    this.vfx.renderScreenOverlays(ctx, this.elapsedTime);

    if (this.screen === 'title') {
      this.renderTitleOverlay(ctx);
    } else if (this.screen === 'mode_select') {
      this.renderModeSelectOverlay(ctx);
    } else if (this.screen === 'customization') {
      this.renderCustomizationOverlay(ctx);
    } else if (this.screen === 'online_lobby') {
      this.renderOnlineLobbyOverlay(ctx);
    } else if (this.screen === 'playing') {
      this.renderMatchHUD(ctx);
      if (this.isPaused) {
        this.renderPauseOverlay(ctx);
      }
      if (this.showHelpModal) {
        this.renderHelpModal(ctx);
      }
    } else if (this.screen === 'match_over') {
      this.renderMatchHUD(ctx);
      this.renderMatchOverOverlay(ctx);
      if (this.showHelpModal) {
        this.renderHelpModal(ctx);
      }
    }
  }

  private renderAnimatedCrowdHighlights(ctx: CanvasRenderingContext2D): void {
    // Twinkling camera flashes in stadium stands!
    const flashSeed = Math.floor(this.elapsedTime * 8);
    for (let i = 0; i < 6; i++) {
      const fx = ((flashSeed * 73 + i * 89) % (VIRTUAL_WIDTH - 20)) + 10;
      const fy = 64 + ((flashSeed * 37 + i * 19) % 44);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx, fy, 2, 2);
    }
  }

  private renderKeeperSprite(ctx: CanvasRenderingContext2D): void {
    const keeperSheet = this.turnRole === 'player_kick' ? this.sprites.keeperRed : this.sprites.keeperBlue;
    const frames = keeperSheet[this.keeper.anim as KeeperAnimKey];
    const img = frames[Math.min(frames.length - 1, this.keeper.frame)];

    const w = Math.round(64 * this.keeper.scale);
    const h = Math.round(64 * this.keeper.scale);
    const dx = Math.round(this.keeper.x - w / 2);
    const dy = Math.round(this.keeper.y - h + 22 * this.keeper.scale);

    // Indicator when human controls keeper: Floating [YOU] badge & ground ring
    const isHumanKeeper = this.isHumanControllingKeeper();
    if (isHumanKeeper && (this.phase === 'aiming' || this.phase === 'charging' || this.phase === 'runup' || this.phase === 'ball_flight')) {
      // Ground circle ring
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(this.keeper.x, this.keeper.y + 4, 18, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Floating [YOU] badge
      const bobY = Math.sin(this.elapsedTime * 6) * 3;
      const badgeY = dy - 10 + bobY;
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(this.keeper.x - 14, badgeY - 7, 28, 10);
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.keeper.x - 13.5, badgeY - 6.5, 27, 9);
      ctx.font = '700 6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('YOU', this.keeper.x, badgeY);

      // Downward pointer triangle
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(this.keeper.x - 4, badgeY + 3);
      ctx.lineTo(this.keeper.x + 4, badgeY + 3);
      ctx.lineTo(this.keeper.x, badgeY + 7);
      ctx.closePath();
      ctx.fill();
    }

    if (this.keeper.skillActive === 'titan') {
      // Green emerald aura outline pulse
      ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
      ctx.fillRect(dx + 8, dy + 10, w - 16, h - 14);
    }

    ctx.drawImage(img, dx, dy, w, h);
  }

  private renderKickerSprite(ctx: CanvasRenderingContext2D): void {
    const kickerSheet = this.turnRole === 'player_kick' ? this.sprites.kickerBlue : this.sprites.kickerRed;
    const frames = kickerSheet[this.kicker.anim as KickerAnimKey];
    const img = frames[Math.min(frames.length - 1, this.kicker.frame)];

    const dx = Math.round(this.kicker.x - 40);
    const dy = Math.round(this.kicker.y - 62);

    // Indicator when human controls kicker: Floating [YOU] badge & ground ring
    const isHumanKicker = this.isHumanControllingKicker();
    if (isHumanKicker && (this.phase === 'aiming' || this.phase === 'charging')) {
      // Ground circle ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(this.kicker.x, this.kicker.y + 4, 18, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Floating [YOU] badge
      const bobY = Math.sin(this.elapsedTime * 6) * 3;
      const badgeY = dy - 10 + bobY;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(this.kicker.x - 14, badgeY - 7, 28, 10);
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.kicker.x - 13.5, badgeY - 6.5, 27, 9);
      ctx.font = '700 6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('YOU', this.kicker.x, badgeY);

      // Downward pointer triangle
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(this.kicker.x - 4, badgeY + 3);
      ctx.lineTo(this.kicker.x + 4, badgeY + 3);
      ctx.lineTo(this.kicker.x, badgeY + 7);
      ctx.closePath();
      ctx.fill();
    }

    const [kw, kh] = logicalSize(img);
    ctx.drawImage(img, dx, dy, kw, kh);
  }

  private renderSoccerBallAndClones(ctx: CanvasRenderingContext2D): void {
    const frameIdx = Math.floor(this.ball.spin) % 4;
    const ballImg = this.sprites.soccerBalls[frameIdx];

    const scale = this.ball.z > 0 ? Math.max(0.52, 1 - this.ball.z * 0.42) : 0.92;
    const drawSize = Math.round(24 * scale);

    // Ball ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    const shadowW = Math.max(6, Math.round(14 * scale));
    ctx.fillRect(Math.round(this.ball.x - shadowW / 2), Math.round(this.ball.groundY + 3), shadowW, 3);

    // Mirage clones during flight
    if (this.selectedKickerSkill === 'mirage' && this.phase === 'ball_flight' && this.ball.z > 0.16) {
      for (const clone of this.ball.mirageClones) {
        const wobble = Math.sin(this.ball.z * 14 + clone.phase);
        const cx = Math.round(this.ball.x + clone.offsetX * wobble * (1 - this.ball.z * 0.25));
        const cy = Math.round(this.ball.y + clone.offsetY * Math.cos(this.ball.z * 12 + clone.phase));
        ctx.save();
        ctx.globalAlpha = 0.78;
        ctx.drawImage(ballImg, Math.round(cx - drawSize / 2), Math.round(cy - drawSize / 2), drawSize, drawSize);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.fillRect(Math.round(cx - drawSize / 3), Math.round(cy - drawSize / 3), Math.round(drawSize * 0.66), Math.round(drawSize * 0.66));
        ctx.restore();
      }
    }

    // Main soccer ball
    const bx = Math.round(this.ball.x - drawSize / 2);
    const by = Math.round(this.ball.y - drawSize / 2);
    ctx.drawImage(ballImg, bx, by, drawSize, drawSize);

    // Elemental overlay tint on ball
    if (this.selectedKickerSkill === 'flame' && this.ball.z > 0 && !this.ball.deflected) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.55)';
      ctx.fillRect(Math.round(this.ball.x - drawSize * 0.35), Math.round(this.ball.y - drawSize * 0.35), Math.round(drawSize * 0.7), Math.round(drawSize * 0.7));
    }
  }

  // Safe pixel crosshair & keeper glove target guide
  private drawPixelCrosshair(ctx: CanvasRenderingContext2D, rx: number, ry: number, color: string): void {
    const x = Math.round(rx);
    const y = Math.round(ry);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 9, y - 2, 6, 4);
    ctx.fillRect(x + 3, y - 2, 6, 4);
    ctx.fillRect(x - 2, y - 9, 4, 6);
    ctx.fillRect(x - 2, y + 3, 4, 6);

    ctx.fillStyle = color;
    ctx.fillRect(x - 8, y - 1, 5, 2);
    ctx.fillRect(x + 3, y - 1, 5, 2);
    ctx.fillRect(x - 1, y - 8, 2, 5);
    ctx.fillRect(x - 1, y + 3, 2, 5);
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  private renderMatchHUD(ctx: CanvasRenderingContext2D): void {
    // Render Aim Crosshair or Keeper Glove Target first
    const isKickerAiming = this.isHumanControllingKicker() && (this.phase === 'aiming' || this.phase === 'charging');
    const isKeeperAiming = this.isHumanControllingKeeper() && !this.keeper.hasDived && (this.phase === 'aiming' || this.phase === 'charging' || this.phase === 'runup' || this.phase === 'ball_flight');

    if (isKickerAiming) {
      const rx = Math.round(this.aimX);
      const ry = Math.round(this.aimY);
      const sweet = this.phase === 'charging' && this.powerGauge >= 0.76 && this.powerGauge <= 0.94;
      const col = sweet ? '#4ade80' : Math.floor(this.elapsedTime * 8) % 2 === 0 ? '#facc15' : '#38bdf8';

      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      for (let i = 1; i <= 6; i++) {
        const t = i / 7;
        const tx = Math.round(this.penaltySpot.x + (rx - this.penaltySpot.x) * t);
        const ty = Math.round(this.penaltySpot.y + (ry - this.penaltySpot.y) * t - Math.sin(t * Math.PI) * 15);
        ctx.fillRect(tx - 1, ty - 1, 2, 2);
      }
      this.drawPixelCrosshair(ctx, rx, ry, col);
    } else if (isKeeperAiming) {
      const gp = zoneToGoalCoords(this.keeperAimZone, this.goal);
      this.drawPixelCrosshair(ctx, gp.x, gp.y, '#4ade80');
    }

    // ---------------- TOP SCOREBOARD ----------------
    ctx.fillStyle = 'rgba(9, 13, 26, 0.88)';
    ctx.fillRect(8, 6, VIRTUAL_WIDTH - 16, 30);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(8, 6, VIRTUAL_WIDTH - 16, 2);

    // Blue Team (Left)
    const isP1Human = this.gameMode === 'online_multi' ? this.net.myRole === 'p1' : true;
    const p1RoleTag = this.turnRole === 'player_kick' ? '[KICK]' : '[KEEP]';
    const p1Label =
      this.gameMode === 'career' && this.careerSave
        ? this.careerSave.position === 'striker'
          ? (this.turnRole === 'player_kick' ? `[KICK] ${this.careerSave.playerName.slice(0, 4)}` : '[AI GK] TEAM')
          : (this.turnRole === 'player_keep' ? `[KEEP] ${this.careerSave.playerName.slice(0, 4)}` : '[AI ST] TEAM')
        : this.gameMode === 'local_2p'
        ? `P1 ${p1RoleTag}`
        : this.gameMode === 'online_multi'
        ? this.net.myRole === 'p1' ? `YOU ${p1RoleTag}` : `P1 ${p1RoleTag}`
        : `YOU ${p1RoleTag}`;

    // Top-left [?] Help Icon button
    ctx.fillStyle = this.showHelpModal ? '#38bdf8' : '#1e293b';
    ctx.fillRect(11, 10, 14, 12);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.strokeRect(11.5, 10.5, 13, 11);
    ctx.font = '700 8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.showHelpModal ? '#0f172a' : '#facc15';
    ctx.fillText('?', 18, 19);

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(28, 10, 56, 12);
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p1Label, 56, 19);

    this.renderPenaltyDots(ctx, 88, 12, this.blueHistory, true);

    // Center Score & Round
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(198, 9, 84, 24);
    ctx.strokeStyle = this.isSuddenDeath ? '#ef4444' : '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(198.5, 9.5, 83, 23);

    ctx.font = '700 11px "Press Start 2P", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${this.blueScore} - ${this.redScore}`, 240, 21);

    ctx.font = '700 6px "Press Start 2P", monospace';
    ctx.fillStyle = this.isSuddenDeath ? '#f87171' : '#94a3b8';
    ctx.fillText(this.isSuddenDeath ? 'SUDDEN DEATH' : `ROUND ${Math.min(5, this.round)}/5`, 240, 30);

    // Red Team (Right)
    const p2RoleTag = this.turnRole === 'player_kick' ? '[KEEP]' : '[KICK]';
    const p2Label =
      this.gameMode === 'career' && this.careerCurrentOpponent
        ? `${p2RoleTag} ${this.careerCurrentOpponent.shortName}`
        : this.gameMode === 'local_2p'
        ? `${p2RoleTag} P2`
        : this.gameMode === 'online_multi'
        ? this.net.myRole === 'p2' ? `${p2RoleTag} YOU` : `${p2RoleTag} P2`
        : `${p2RoleTag} AI`;
    this.renderPenaltyDots(ctx, 276, 12, this.redHistory, false);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(VIRTUAL_WIDTH - 84, 10, 72, 12);
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p2Label, VIRTUAL_WIDTH - 48, 19);

    // Active Match Buff banner in Career Mode
    if (this.gameMode === 'career' && this.careerSave?.activeBuff) {
      const buff = this.careerSave.activeBuff;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(140, 38, 200, 12);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(140.5, 38.5, 199, 11);
      ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`★ ${buff.nameKo} (${buff.matchesLeft}경기 남음)`, 240, 47);
    }

    // Mana Bars under each team
    this.renderManaBar(ctx, 12, 25, 168, 7, this.blueMana, '#38bdf8');
    this.renderManaBar(ctx, VIRTUAL_WIDTH - 180, 25, 168, 7, this.redMana, '#fb923c');

    // ---------------- POWER / TIMING GAUGE (When Kicker Charging or Aiming) ----------------
    if (this.isHumanControllingKicker() && (this.phase === 'aiming' || this.phase === 'charging')) {
      // In touch devices, place the gauge in the upper center so user thumb on [KICK] doesn't obscure it!
      const gx = this.isTouchDevice ? 170 : 352;
      const gy = this.isTouchDevice ? 44 : 178;
      const gw = this.isTouchDevice ? 140 : 114;
      const gh = 13;

      ctx.fillStyle = 'rgba(9, 13, 26, 0.9)';
      ctx.fillRect(gx - 2, gy - 12, gw + 4, gh + 16);

      ctx.font = '700 7px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#facc15';
      ctx.fillText(this.phase === 'charging' ? 'RELEASE:SHOOT' : this.isTouchDevice ? 'TOUCH & KICK' : 'HOLD SPACE/클릭', gx, gy - 3);

      // Meter track zones (Gray -> Early Red -> Sweet Green -> Overpower Red)
      ctx.fillStyle = '#475569'; // Gray zone (0.0..0.58)
      ctx.fillRect(gx, gy, gw, gh);

      // Early Red Danger Zone (0.58..0.76 out of 1.22)
      const earlyRedStart = Math.round((0.58 / 1.22) * gw);
      const earlyRedWidth = Math.round(((0.76 - 0.58) / 1.22) * gw);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(gx + earlyRedStart, gy, earlyRedWidth, gh);

      // Sweet spot green band (0.76..0.94 out of 1.22)
      const sweetStart = Math.round((0.76 / 1.22) * gw);
      const sweetWidth = Math.round(((0.94 - 0.76) / 1.22) * gw);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(gx + sweetStart, gy, sweetWidth, gh);

      // Late Overpower red band (1.03..1.22)
      const overStart = Math.round((1.03 / 1.22) * gw);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(gx + overStart, gy, gw - overStart, gh);

      // Current fill
      const fillW = Math.round((this.powerGauge / 1.22) * gw);
      const isRed = (this.powerGauge >= 0.58 && this.powerGauge < 0.76) || this.powerGauge > 1.03;
      const isGreen = this.powerGauge >= 0.76 && this.powerGauge <= 0.94;
      ctx.fillStyle = isGreen ? '#4ade80' : isRed ? '#f87171' : '#94a3b8';
      ctx.fillRect(gx, gy + 3, fillW, gh - 6);

      // Marker needle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx + fillW - 1, gy - 1, 3, gh + 2);

      // If mobile touch device, render dedicated [KICK] button at bottom right (far away from top gauge)
      if (this.isTouchDevice) {
        const btn = this.touchKickButtonRect;
        const isCharging = this.phase === 'charging';
        ctx.fillStyle = isCharging ? '#0284c7' : '#0f172a';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

        // 3D Pixel Bevel frame
        ctx.fillStyle = isCharging ? '#7dd3fc' : '#475569';
        ctx.fillRect(btn.x, btn.y, btn.w, 2);
        ctx.fillRect(btn.x, btn.y, 2, btn.h);
        ctx.fillStyle = isCharging ? '#0369a1' : '#020617';
        ctx.fillRect(btn.x, btn.y + btn.h - 2, btn.w, 2);
        ctx.fillRect(btn.x + btn.w - 2, btn.y, 2, btn.h);

        ctx.font = '700 9px "Galmuri11", "DungGeunMo", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isCharging ? '#facc15' : '#ffffff';
        ctx.fillText(isCharging ? '떼면 슛!' : '꾹 눌러 슛', btn.x + btn.w / 2, btn.y + 22);
      }
    } else if (this.isHumanControllingKeeper() && !this.keeper.hasDived && (this.phase === 'aiming' || this.phase === 'charging' || this.phase === 'runup' || this.phase === 'ball_flight')) {
      if (this.isTouchDevice) {
        // Subtle hint for mobile swipe
        ctx.fillStyle = 'rgba(9, 13, 26, 0.75)';
        ctx.fillRect(324, 172, 146, 20);
        ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4ade80';
        ctx.fillText('방향으로 슥 드래그/스와이프!', 397, 185);
      } else {
        // Minimal subtle indicator on PC
        ctx.fillStyle = 'rgba(9, 13, 26, 0.65)';
        ctx.fillRect(344, 175, 126, 17);
        ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('WASD: 방향  SPACE: 다이빙', 407, 187);
      }
    }

    // Render mobile touch swipe trail if any
    if (this.touchSwipeTrail.length > 1) {
      ctx.save();
      for (let i = 1; i < this.touchSwipeTrail.length; i++) {
        const p1 = this.touchSwipeTrail[i - 1];
        const p2 = this.touchSwipeTrail[i];
        ctx.strokeStyle = `rgba(56, 189, 248, ${p2.alpha * 0.7})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        p2.alpha *= 0.92;
      }
      ctx.restore();
      this.touchSwipeTrail = this.touchSwipeTrail.filter((p) => p.alpha > 0.08);
    }

    // ---------------- BOTTOM SUPERPOWER SKILL BAR ----------------
    this.renderSkillBar(ctx);
  }



  private renderPenaltyDots(
    ctx: CanvasRenderingContext2D,
    startX: number,
    y: number,
    history: ShotResult[],
    leftToRight: boolean
  ): void {
    const displaySlots = Math.max(5, history.length);
    const recentStart = Math.max(0, displaySlots - 5);

    for (let i = 0; i < 5; i++) {
      const idx = recentStart + i;
      const res: ShotResult = history[idx] ?? 'pending';
      const dx = leftToRight ? startX + i * 19 : startX + (4 - i) * 19;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dx - 1, y - 1, 12, 10);

      if (res === 'goal') {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(dx + 1, y + 1, 8, 6);
        ctx.fillStyle = '#bbf7d0';
        ctx.fillRect(dx + 2, y + 2, 3, 2);
      } else if (res === 'pending') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(dx + 2, y + 2, 6, 4);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(dx + 1, y + 1, 8, 6);
        ctx.fillStyle = '#fecaca';
        ctx.fillRect(dx + 4, y + 3, 2, 2);
      }
    }
  }

  private renderManaBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    mana: number,
    color: string
  ): void {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, w, h);
    const fillW = Math.round((mana / this.maxMana) * (w - 2));
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, fillW, h - 2);

    ctx.font = '700 6px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`MP ${Math.round(mana)}`, x + 4, y + 6);
  }

  private getActiveKickerSkills(): typeof KICKER_SKILLS {
    if (this.gameMode === 'local_2p') {
      return KICKER_SKILLS;
    }
    return KICKER_SKILLS.filter((s) => this.customPlayer.selectedKickerSkills.includes(s.id));
  }

  private getActiveKeeperSkills(): typeof KEEPER_SKILLS {
    if (this.gameMode === 'local_2p') {
      return KEEPER_SKILLS;
    }
    return KEEPER_SKILLS.filter((s) => this.customPlayer.selectedKeeperSkills.includes(s.id));
  }

  private renderSkillBar(ctx: CanvasRenderingContext2D): void {
    const showingKeeperSkills =
      this.gameMode === 'vs_ai'
        ? this.turnRole === 'player_keep'
        : this.gameMode === 'online_multi'
        ? this.isHumanControllingKeeper()
        : this.phase !== 'aiming' && this.phase !== 'charging';

    const skills = showingKeeperSkills ? this.getActiveKeeperSkills() : this.getActiveKickerSkills();
    const activeId = showingKeeperSkills ? this.selectedKeeperSkill : this.selectedKickerSkill;
    const currentMana =
      this.gameMode === 'vs_ai'
        ? this.blueMana
        : this.gameMode === 'online_multi'
        ? this.net.myRole === 'p1' ? this.blueMana : this.redMana
        : showingKeeperSkills
        ? this.turnRole === 'player_kick'
          ? this.redMana
          : this.blueMana
        : this.turnRole === 'player_kick'
        ? this.blueMana
        : this.redMana;

    this.skillSlotRects = [];
    const slotW = 108;
    const slotH = 26;
    const gap = 8;
    const totalW = skills.length * slotW + (skills.length - 1) * gap;
    const startX = Math.round((VIRTUAL_WIDTH - totalW) / 2);
    const y = VIRTUAL_HEIGHT - 31;

    skills.forEach((s, idx) => {
      const x = startX + idx * (slotW + gap);
      this.skillSlotRects.push({ index: idx, x, y, w: slotW, h: slotH });

      const isSelected = activeId === s.id;
      const cdRemaining = this.getSkillCooldownRemaining(s.id, showingKeeperSkills);
      const isCooldown = cdRemaining > 0;
      const canAfford = currentMana >= s.manaCost && !isCooldown;

      ctx.fillStyle = isSelected ? 'rgba(30, 41, 59, 0.96)' : 'rgba(9, 13, 26, 0.88)';
      ctx.fillRect(x, y, slotW, slotH);

      ctx.strokeStyle = isSelected ? s.color : isCooldown ? '#ef4444' : canAfford ? '#475569' : '#1e293b';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1);

      // Key badge [1]..[4]
      ctx.fillStyle = isCooldown ? '#475569' : canAfford ? s.color : '#334155';
      ctx.fillRect(x + 3, y + 3, 13, 11);
      ctx.font = '700 7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(s.key, x + 9.5, y + 11);

      // Skill Name (Korean)
      ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = isCooldown ? '#64748b' : canAfford ? (isSelected ? s.accentColor : '#f8fafc') : '#64748b';
      ctx.fillText(s.nameKo, x + 20, y + 12);

      // Mana Cost or Cooldown badge
      ctx.font = '700 6px "Press Start 2P", monospace';
      if (isCooldown) {
        ctx.fillStyle = '#f87171';
        ctx.fillText(`CD ${cdRemaining}R`, x + 20, y + 22);
      } else {
        ctx.fillStyle = canAfford ? '#38bdf8' : '#ef4444';
        ctx.fillText(`MP ${s.manaCost}`, x + 20, y + 22);
      }

      if (isSelected) {
        ctx.fillStyle = s.accentColor;
        ctx.fillText('ON', x + slotW - 18, y + 22);
      }
    });
  }

  // =========================================================================
  // TITLE, MENU & MATCH OVER OVERLAYS
  // =========================================================================
  private renderTitleOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(5, 8, 22, 0.62)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Top Arcade Title Plate
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(46, 36, VIRTUAL_WIDTH - 92, 92);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 36, VIRTUAL_WIDTH - 92, 92);

    ctx.textAlign = 'center';
    ctx.font = '900 20px "Press Start 2P", monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('SUPERPOWER', VIRTUAL_WIDTH / 2 + 2, 68);
    ctx.fillStyle = '#facc15';
    ctx.fillText('SUPERPOWER', VIRTUAL_WIDTH / 2, 66);

    ctx.font = '900 18px "Press Start 2P", monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('SHOOTOUT', VIRTUAL_WIDTH / 2 + 2, 94);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('SHOOTOUT', VIRTUAL_WIDTH / 2, 92);

    ctx.font = '700 9px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('* 도트 그래픽 이능력 승부차기 배틀 *', VIRTUAL_WIDTH / 2, 115);

    if (Math.floor(this.elapsedTime * 2.5) % 2 === 0) {
      ctx.fillStyle = 'rgba(9, 13, 26, 0.85)';
      ctx.fillRect(128, 198, 224, 24);
      ctx.font = '700 10px "Press Start 2P", monospace';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('PRESS SPACE / CLICK', VIRTUAL_WIDTH / 2, 214);
    }
  }

  private confirmCustomizationAndProceed(): void {
    this.audio.playUiSelect();
    this.sprites.rebuildCustomSprites(
      this.customPlayer.jerseyNumber,
      this.customPlayer.hairStyle,
      this.customPlayer.accessory
    );

    if (this.gameMode === 'online_multi') {
      this.screen = 'online_lobby';
    } else {
      this.startNewMatch();
    }
  }

  private rebuildPlayerSprites(): void {
    this.sprites.rebuildCustomSprites(
      this.customPlayer.jerseyNumber,
      this.customPlayer.hairStyle,
      this.customPlayer.accessory
    );
  }

  private handleCustomizationClick(vx: number, vy: number): void {
    const before = JSON.stringify(this.customPlayer);
    this.handleCustomizationClickInner(vx, vy);
    // Any look change → re-rasterize so the LIVE PREVIEW updates instantly
    if (this.screen === 'customization' && JSON.stringify(this.customPlayer) !== before) {
      this.rebuildPlayerSprites();
    }
  }

  private handleCustomizationClickInner(vx: number, vy: number): void {
    const hairList: HairStyleId[] = ['spiky', 'dread', 'bowl', 'curly', 'bald'];
    const accList: AccessoryId[] = ['none', 'headband', 'glasses', 'mask', 'aura_crown'];

    // 1. Back Number decrement / increment (left: 20..38, y: 56..74; right: 88..106, y: 56..74)
    if (vx >= 22 && vx <= 42 && vy >= 56 && vy <= 74) {
      this.audio.playUiSelect();
      this.customPlayer.jerseyNumber = this.customPlayer.jerseyNumber <= 1 ? 99 : this.customPlayer.jerseyNumber - 1;
      return;
    }
    if (vx >= 86 && vx <= 106 && vy >= 56 && vy <= 74) {
      this.audio.playUiSelect();
      this.customPlayer.jerseyNumber = this.customPlayer.jerseyNumber >= 99 ? 1 : this.customPlayer.jerseyNumber + 1;
      return;
    }

    // 2. Hair styles (Row 1, y: 92..112)
    hairList.forEach((h, i) => {
      const bx = 22 + i * 42;
      if (vx >= bx && vx <= bx + 38 && vy >= 92 && vy <= 112) {
        this.audio.playUiSelect();
        this.customPlayer.hairStyle = h;
      }
    });

    // 3. Accessories (Row 2, y: 130..150)
    accList.forEach((a, i) => {
      const bx = 22 + i * 42;
      if (vx >= bx && vx <= bx + 38 && vy >= 130 && vy <= 150) {
        this.audio.playUiSelect();
        this.customPlayer.accessory = a;
      }
    });

    // 4. Kicker Skills (2 slots selection, y: 172..192)
    KICKER_SKILLS.forEach((s, i) => {
      const bx = 22 + i * 54;
      if (vx >= bx && vx <= bx + 50 && vy >= 172 && vy <= 192) {
        this.audio.playSkillToggle();
        const cur = [...this.customPlayer.selectedKickerSkills];
        if (cur.includes(s.id)) {
          // toggle off only if we have at least 1 remaining
          if (cur.length > 1) {
            this.customPlayer.selectedKickerSkills = [cur.find((id) => id !== s.id)!] as any;
          }
        } else {
          if (cur.length >= 2) {
            // Replace the oldest
            this.customPlayer.selectedKickerSkills = [cur[1], s.id];
          } else {
            this.customPlayer.selectedKickerSkills.push(s.id);
          }
        }
      }
    });

    // 5. Keeper Skills (2 slots selection, y: 212..232)
    KEEPER_SKILLS.forEach((s, i) => {
      const bx = 22 + i * 54;
      if (vx >= bx && vx <= bx + 50 && vy >= 212 && vy <= 232) {
        this.audio.playSkillToggle();
        const cur = [...this.customPlayer.selectedKeeperSkills];
        if (cur.includes(s.id)) {
          if (cur.length > 1) {
            this.customPlayer.selectedKeeperSkills = [cur.find((id) => id !== s.id)!] as any;
          }
        } else {
          if (cur.length >= 2) {
            this.customPlayer.selectedKeeperSkills = [cur[1], s.id];
          } else {
            this.customPlayer.selectedKeeperSkills.push(s.id);
          }
        }
      }
    });

    // 6. Confirm / Start Button (bottom center: 280..450, y: 236..260)
    if (vx >= 270 && vx <= 455 && vy >= 236 && vy <= 262) {
      this.confirmCustomizationAndProceed();
      return;
    }

    // 7. Back Button (22..82, y: 240..260)
    if (vx >= 22 && vx <= 92 && vy >= 238 && vy <= 260) {
      this.audio.playUiSelect();
      this.screen = 'mode_select';
      return;
    }
  }

  private renderCustomizationOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(5, 8, 22, 0.94)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Header Title
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, 8, VIRTUAL_WIDTH - 32, 26);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16.5, 8.5, VIRTUAL_WIDTH - 33, 25);

    ctx.font = '900 11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    ctx.fillText('CUSTOMIZE & LOADOUT (선수 세팅)', VIRTUAL_WIDTH / 2, 24);

    // Left Panel: Settings (x: 16 ~ 260)
    // Section 1: 등번호 (Jersey Number)
    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('1. 등번호 (NO.)', 22, 48);

    // Number Stepper: [-] [ 10 ] [+]
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, 56, 20, 18);
    ctx.fillRect(44, 56, 40, 18);
    ctx.fillRect(86, 56, 20, 18);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(22.5, 56.5, 19, 17);
    ctx.strokeRect(44.5, 56.5, 39, 17);
    ctx.strokeRect(86.5, 56.5, 19, 17);

    ctx.textAlign = 'center';
    ctx.font = '700 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('-', 32, 69);
    ctx.fillStyle = '#facc15';
    ctx.fillText(this.customPlayer.jerseyNumber.toString(), 64, 70);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('+', 96, 69);

    // Section 2: 머리스타일 (Hair Style)
    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('2. 헤어스타일 (HAIR)', 22, 86);

    const hairList: { id: HairStyleId; label: string }[] = [
      { id: 'spiky', label: '스파이크' },
      { id: 'dread', label: '드레드' },
      { id: 'bowl', label: '바가지' },
      { id: 'curly', label: '웨이브' },
      { id: 'bald', label: '스킨헤드' },
    ];
    hairList.forEach((h, i) => {
      const bx = 22 + i * 42;
      const isSel = this.customPlayer.hairStyle === h.id;
      ctx.fillStyle = isSel ? '#2563eb' : '#1e293b';
      ctx.fillRect(bx, 92, 38, 20);
      ctx.strokeStyle = isSel ? '#facc15' : '#475569';
      ctx.lineWidth = isSel ? 1.5 : 1;
      ctx.strokeRect(bx + 0.5, 92.5, 37, 19);

      ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSel ? '#ffffff' : '#94a3b8';
      ctx.fillText(h.label, bx + 19, 105);
    });

    // Section 3: 악세사리 (Accessory)
    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('3. 악세사리 (ITEM)', 22, 124);

    const accList: { id: AccessoryId; label: string }[] = [
      { id: 'none', label: '없음' },
      { id: 'headband', label: '헤드밴드' },
      { id: 'glasses', label: '고글' },
      { id: 'mask', label: '마스크' },
      { id: 'aura_crown', label: '황금관' },
    ];
    accList.forEach((a, i) => {
      const bx = 22 + i * 42;
      const isSel = this.customPlayer.accessory === a.id;
      ctx.fillStyle = isSel ? '#2563eb' : '#1e293b';
      ctx.fillRect(bx, 130, 38, 20);
      ctx.strokeStyle = isSel ? '#facc15' : '#475569';
      ctx.lineWidth = isSel ? 1.5 : 1;
      ctx.strokeRect(bx + 0.5, 130.5, 37, 19);

      ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSel ? '#ffffff' : '#94a3b8';
      ctx.fillText(a.label, bx + 19, 143);
    });

    // Section 4: 슛 스킬 선택 (2개)
    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#f97316';
    ctx.fillText('4. 키커 스킬 (2개 장착)', 22, 166);

    KICKER_SKILLS.forEach((s, i) => {
      const bx = 22 + i * 54;
      const isSel = this.customPlayer.selectedKickerSkills.includes(s.id);
      ctx.fillStyle = isSel ? 'rgba(249, 115, 22, 0.35)' : '#1e293b';
      ctx.fillRect(bx, 172, 50, 20);
      ctx.strokeStyle = isSel ? s.color : '#475569';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(bx + 0.5, 172.5, 49, 19);

      ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSel ? s.accentColor : '#94a3b8';
      ctx.fillText(s.nameKo.slice(0, 5), bx + 25, 184);
    });

    // Section 5: 키퍼 스킬 선택 (2개)
    ctx.textAlign = 'left';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('5. 골키퍼 스킬 (2개 장착)', 22, 206);

    KEEPER_SKILLS.forEach((s, i) => {
      const bx = 22 + i * 54;
      const isSel = this.customPlayer.selectedKeeperSkills.includes(s.id);
      ctx.fillStyle = isSel ? 'rgba(34, 197, 94, 0.35)' : '#1e293b';
      ctx.fillRect(bx, 212, 50, 20);
      ctx.strokeStyle = isSel ? s.color : '#475569';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(bx + 0.5, 212.5, 49, 19);

      ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSel ? s.accentColor : '#94a3b8';
      ctx.fillText(s.nameKo.slice(0, 5), bx + 25, 224);
    });

    // Right Panel: Live Preview Card (x: 260 ~ 460)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(260, 42, 202, 186);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(260.5, 42.5, 201, 185);

    ctx.textAlign = 'center';
    ctx.font = '700 7.5px "Press Start 2P", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('LIVE PREVIEW', 361, 56);

    // Live Player Previews
    const previewKicker = this.sprites.kickerBlue.idle[0];
    const previewKeeper = this.sprites.keeperBlue.idle[0];
    if (previewKicker) {
      ctx.drawImage(previewKicker, 275, 76, 72, 72);
      ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`키커 [NO.${this.customPlayer.jerseyNumber}]`, 311, 160);
    }
    if (previewKeeper) {
      ctx.drawImage(previewKeeper, 365, 82, 60, 60);
      ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('골키퍼', 395, 160);
    }

    // Selected Skill Summary in Preview
    ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#f97316';
    const kickStr = this.customPlayer.selectedKickerSkills.map((id) => getKickerSkill(id)?.nameKo).join(' · ');
    ctx.fillText(`[KICK] ${kickStr}`, 361, 182);

    ctx.fillStyle = '#22c55e';
    const keepStr = this.customPlayer.selectedKeeperSkills.map((id) => getKeeperSkill(id)?.nameKo).join(' · ');
    ctx.fillText(`[KEEP] ${keepStr}`, 361, 198);

    // Bottom Action Buttons
    // Back Button (3D Pixel Bevel)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, 238, 70, 22);
    ctx.fillStyle = '#475569';
    ctx.fillRect(22, 238, 70, 2);
    ctx.fillRect(22, 238, 2, 22);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(22, 258, 70, 2);
    ctx.fillRect(90, 238, 2, 22);
    ctx.textAlign = 'center';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('[ 뒤로가기 ]', 57, 252);

    // Start / Confirm Match Button (3D Pixel Bevel)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(270, 236, 185, 24);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(270, 236, 185, 2);
    ctx.fillRect(270, 236, 2, 24);
    ctx.fillStyle = '#14532d';
    ctx.fillRect(270, 258, 185, 2);
    ctx.fillRect(453, 236, 2, 24);
    ctx.font = '700 9px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('[ 경기 시작 (START) ]', 362, 252);
  }

  private renderModeSelectOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(5, 8, 22, 0.78)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = '900 13px "Press Start 2P", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('SELECT GAME MODE', VIRTUAL_WIDTH / 2, 48);

    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('AI 대결, 로컬 2인용 또는 온라인 룸 배틀을 선택하세요', VIRTUAL_WIDTH / 2, 66);

    const options = [
      { title: '🏆 [CAREER] ROAD TO CHAMPION', sub: '슈터/키퍼를 골라 밑바닥 리그에서 전설로!', color: '#fbbf24' },
      { title: '1P VS AI - ROOKIE', sub: '입문자용 AI 골키퍼 & 키커', color: '#4ade80' },
      { title: '1P VS AI - PRO', sub: '표준 아케이드 밸런스 대결', color: '#38bdf8' },
      { title: '1P VS AI - LEGEND', sub: '초반응 초능력 마스터 AI에 도전!', color: '#f43f5e' },
      { title: 'LOCAL 2P VERSUS', sub: '한 기기에서 친구와 심리전 승부차기!', color: '#c084fc' },
      { title: '[NET] ONLINE MULTIPLAYER', sub: '다른 기기(폰/PC)와 방 코드로 실시간 대전!', color: '#facc15' },
    ];

    options.forEach((opt, i) => {
      const y = 74 + i * 27;
      const selected = this.menuIndex === i;

      ctx.fillStyle = selected ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(100, y, 280, 23);
      ctx.strokeStyle = selected ? opt.color : '#334155';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(100.5, y + 0.5, 279, 22);

      ctx.font = '700 8px "Press Start 2P", monospace';
      ctx.fillStyle = selected ? opt.color : '#f8fafc';
      ctx.fillText((selected ? '> ' : '') + opt.title, VIRTUAL_WIDTH / 2, y + 10);

      ctx.font = '700 7.5px "Galmuri11", "DungGeunMo", monospace';
      ctx.fillStyle = selected ? '#fde047' : '#94a3b8';
      ctx.fillText(opt.sub, VIRTUAL_WIDTH / 2, y + 19);
    });
  }

  private renderOnlineLobbyOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(5, 8, 22, 0.88)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = '900 13px "Press Start 2P", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('ONLINE MULTIPLAYER LOBBY', VIRTUAL_WIDTH / 2, 45);

    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('참가할 방 번호(Room Code)를 입력하세요', VIRTUAL_WIDTH / 2, 65);

    // Room Code Input Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(160, 85, 160, 36);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(160, 85, 160, 36);

    ctx.font = '900 18px "Press Start 2P", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(this.onlineRoomInput + (Math.floor(this.elapsedTime * 3) % 2 === 0 ? '_' : ''), VIRTUAL_WIDTH / 2, 110);

    // Mobile helper: tap to change room code
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('터치하여 코드 변경 (기본: 1004)', VIRTUAL_WIDTH / 2, 129);

    // Status Message
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = this.net.connected ? '#4ade80' : '#f87171';
    ctx.fillText(this.net.statusMessage, VIRTUAL_WIDTH / 2, 147);

    // Connect Button (3D Pixel Bevel)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(140, 168, 200, 28);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(140, 168, 200, 2);
    ctx.fillRect(140, 168, 2, 28);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(140, 194, 200, 2);
    ctx.fillRect(338, 168, 2, 28);

    ctx.font = '700 9px "Press Start 2P", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('JOIN / CREATE ROOM', VIRTUAL_WIDTH / 2, 186);

    // Back Button
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ESC 또는 [뒤로가기]', VIRTUAL_WIDTH / 2, 222);
  }

  private renderPauseOverlay(ctx: CanvasRenderingContext2D): void {
    // Dim background
    ctx.fillStyle = 'rgba(5, 8, 22, 0.82)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Modal frame
    const modalX = 120;
    const modalY = 52;
    const modalW = 240;
    const modalH = 166;

    ctx.fillStyle = '#090d1a';
    ctx.fillRect(modalX, modalY, modalW, modalH);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX + 0.5, modalY + 0.5, modalW - 1, modalH - 1);

    // Header banner
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(modalX + 2, modalY + 2, modalW - 4, 30);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(modalX + 2.5, modalY + 2.5, modalW - 5, 29);

    ctx.textAlign = 'center';
    ctx.font = '900 11px "Press Start 2P", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('PAUSED', VIRTUAL_WIDTH / 2, modalY + 18);
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('[ 일시정지 ]', VIRTUAL_WIDTH / 2, modalY + 28);

    // Button 1: [RESUME (계속하기)] (140, 95, 200, 26) - 3D Pixel Bevel
    ctx.fillStyle = '#15803d';
    ctx.fillRect(140, 95, 200, 26);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(140, 95, 200, 2);
    ctx.fillRect(140, 95, 2, 26);
    ctx.fillStyle = '#14532d';
    ctx.fillRect(140, 119, 200, 2);
    ctx.fillRect(338, 95, 2, 26);
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('[ 계속하기 (RESUME) ]', VIRTUAL_WIDTH / 2, 112);

    // Button 2: [RETRY (다시하기)] (140, 130, 200, 26) - 3D Pixel Bevel
    ctx.fillStyle = '#b45309';
    ctx.fillRect(140, 130, 200, 26);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(140, 130, 200, 2);
    ctx.fillRect(140, 130, 2, 26);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(140, 154, 200, 2);
    ctx.fillRect(338, 130, 2, 26);
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('[ 다시하기 (RETRY) ]', VIRTUAL_WIDTH / 2, 147);

    // Button 3: [MAIN MENU (메인으로)] (140, 165, 200, 26) - 3D Pixel Bevel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(140, 165, 200, 26);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(140, 165, 200, 2);
    ctx.fillRect(140, 165, 2, 26);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(140, 189, 200, 2);
    ctx.fillRect(338, 165, 2, 26);
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('[ 메인으로 (MAIN MENU) ]', VIRTUAL_WIDTH / 2, 182);

    // Bottom hint
    ctx.font = '700 7px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('ESC 키를 눌러도 계속할 수 있습니다', VIRTUAL_WIDTH / 2, 207);
  }

  private renderHelpModal(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(5, 8, 22, 0.88)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Dialog Box
    const bx = 34;
    const by = 24;
    const bw = VIRTUAL_WIDTH - 68;
    const bh = VIRTUAL_HEIGHT - 48;

    ctx.fillStyle = '#090d1a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

    // Header Title
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx + 2, by + 2, bw - 4, 22);
    ctx.textAlign = 'center';
    ctx.font = '700 9px "Press Start 2P", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('[ HOW TO PLAY (조작법) ]', VIRTUAL_WIDTH / 2, by + 16);

    ctx.textAlign = 'left';
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';

    // Section 1: Kicker
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('【 키커 조작 (KICKER) 】', bx + 12, by + 40);
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('• 조준 : WASD / 마우스 / 화면 터치 드래그', bx + 16, by + 54);
    ctx.fillText('• 슛차기 : SPACE / 마우스 누르기 / 우측하단 [슛] 버튼', bx + 16, by + 68);
    ctx.fillText('• 게이지 : 초록색(스위트스팟) 구간에 떼면 정확하고 강력한 슛!', bx + 16, by + 82);

    // Section 2: Keeper
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('【 골키퍼 조작 (KEEPER) 】', bx + 12, by + 104);
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('• 다이빙 : WASD / 마우스 클릭 / 화면 터치 스와이프', bx + 16, by + 118);
    ctx.fillText('• 타이밍 : 슛 날아오는 순간 다이빙 시 슈퍼 세이브 보너스!', bx + 16, by + 132);

    // Section 3: Superpowers & Pause
    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('【 초능력 스킬 & 기능 】', bx + 12, by + 154);
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('• 초능력 : 하단 슬롯 터치 또는 숫자키 1~4 / Q,W,E,R', bx + 16, by + 168);
    ctx.fillText('• 일시정지 : 게임 중 ESC (계속 / 다시하기 / 메인메뉴)', bx + 16, by + 182);
    ctx.fillText('• 화면설정 : 우측상단 [전체화면] 주소창숨김 / [비율: 꽉채움]', bx + 16, by + 196);

    // Close button prompt
    ctx.textAlign = 'center';
    ctx.font = '700 8px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('[ 화면 터치 / ESC 키로 닫기 ]', VIRTUAL_WIDTH / 2, by + bh - 8);
  }

  private renderMatchOverOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(5, 8, 22, 0.76)';
    ctx.fillRect(0, 58, VIRTUAL_WIDTH, 162);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(64, 68, VIRTUAL_WIDTH - 128, 142);

    ctx.textAlign = 'center';
    ctx.font = '700 13px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText(this.winnerText, VIRTUAL_WIDTH / 2, 104);

    ctx.font = '900 18px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.blueScore}  :  ${this.redScore}`, VIRTUAL_WIDTH / 2, 138);

    ctx.font = '700 8.5px "Galmuri11", "DungGeunMo", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('SPACE / 클릭: 다시 경기하기   |   ESC: 모드 선택', VIRTUAL_WIDTH / 2, 176);
  }
}
