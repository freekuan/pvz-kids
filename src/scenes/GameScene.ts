import Phaser from 'phaser';
import { Plant } from '../entities/Plant';
import { Zombie } from '../entities/Zombie';
import { Projectile } from '../entities/Projectile';
import { Sun } from '../entities/Sun';
import { LawnMower } from '../entities/LawnMower';
import { LEVELS, type LevelConfig, type Wave } from '../config/levels';
import {
  GRID_COLS,
  GRID_ROWS,
  GRID_START_X,
  GRID_START_Y,
  TILE_WIDTH,
  TILE_HEIGHT,
  INITIAL_SUN,
  SKY_SUN_AMOUNT,
  SKY_SUN_INTERVAL,
  SUNFLOWER_SUN_AMOUNT,
  SUNFLOWER_SUN_INTERVAL,
  PEA_SHOOT_INTERVAL,
  WAVE_ADVANCE_HP_RATIO,
  WAVE_MAX_WAIT_MS,
  PLANT_TYPES,
  ZOMBIE_TYPES,
  ROW_SPRITE_FOOT_OFFSET,
  PLANT_TILE_FIT,
  CHERRY_EXPLODE_DELAY,
  CHERRY_DAMAGE,
  CHERRY_RANGE,
  SNOW_PEA_SLOW_DURATION,
  POTATO_ARM_TIME,
  POTATO_DAMAGE,
  PLANTERN_BUFF_RANGE,
  PLANTERN_SPEED_BOOST,
  SNOWFLAKE_DURATION,
  SNOWFLAKE_TICK_INTERVAL,
  SNOWFLAKE_TICK_DAMAGE,
  GAME_SPEED_OPTIONS,
  HOUSE_CENTER_X,
  HUD_BAR_SCALE,
  HUD_BAR_SRC_HEIGHT,
  HUD_BAR_LEFT_X,
  HUD_CLEARANCE_ABOVE_LAWN,
  HUD_TOP_MARGIN,
  HUD_PACKET_BAR_RATIO,
  HUD_SHOVEL_BAR_RATIO,
  HUD_SUN_COUNTER_SRC_WIDTH,
  HUD_SUN_COUNTER_SRC_HEIGHT,
  HUD_PACKET_SRC_WIDTH,
  HUD_PACKET_SRC_HEIGHT,
  HUD_SHOVEL_SRC_WIDTH,
  HUD_SHOVEL_SRC_HEIGHT,
  HUD_BAR_PAD_X,
  HUD_ELEMENT_GAP,
  HUD_PACKET_WIDTH_RATIO,
  HUD_PACKET_HIT_PAD_X,
  HUD_PACKET_HIT_PAD_Y,
  HUD_SHOVEL_HIT_PAD_X,
  HUD_SHOVEL_HIT_PAD_Y,
} from '../config/constants';
import { ASSET_MANIFEST, PACKET_TEXTURE_KEYS, PLANT_TEXTURE_KEYS } from '../config/assets';

export class GameScene extends Phaser.Scene {
  private currentLevel!: LevelConfig;
  private sunCount: number = INITIAL_SUN;
  private sunText!: Phaser.GameObjects.Text;
  
  private plants: Plant[] = [];
  private zombies: Zombie[] = [];
  private projectiles: Projectile[] = [];
  private suns: Sun[] = [];
  private mowers: LawnMower[] = [];
  
  private grid: (Plant | null)[][] = [];
  private selectedPlantType: string | null = null;
  private plantCards: Map<
    string,
    { card: Phaser.GameObjects.Container; highlight: Phaser.GameObjects.Rectangle; cooldownUntil: number }
  > = new Map();
  
  private currentWaveIndex: number = 0;
  private waveInProgress: boolean = false;
  private waveStartTime: number = 0;
  private currentWaveInitialHp: number = 0;
  private zombiesSpawnedInWave: Set<number> = new Set();

  private sunflowerTimers: Map<Plant, Phaser.Time.TimerEvent> = new Map();
  private peashooterTimers: Map<Plant, Phaser.Time.TimerEvent> = new Map();

  private gameOver: boolean = false;
  private showingFinalWaveWarning: boolean = false;
  private waveSpawnComplete: boolean = false;
  private waveRestPending: boolean = false;
  private skySunTimer?: Phaser.Time.TimerEvent;

  private sunTargetX: number = 100;
  private sunTargetY: number = 58;
  private ghostPreview?: Phaser.GameObjects.Image;
  private waveText?: Phaser.GameObjects.Text;
  private waveProgressFill?: Phaser.GameObjects.Rectangle;
  private waveProgressWidth: number = 110;
  private gameSpeed: number = 1;
  private scaledTime: number = 0;
  private speedBtnBg?: Phaser.GameObjects.Rectangle;
  private speedBtnText?: Phaser.GameObjects.Text;
  private packetContainer?: Phaser.GameObjects.Container;
  private packetScrollX: number = 0;
  private maxPacketScrollX: number = 0;
  private scrollLeftBtn?: Phaser.GameObjects.Container;
  private scrollRightBtn?: Phaser.GameObjects.Container;
  private packetScrollTween?: Phaser.Tweens.Tween;
  private isDraggingPackets: boolean = false;
  private dragStartX: number = 0;
  private dragStartScrollX: number = 0;
  private dragMoved: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  shutdown(): void {
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.input.off('pointermove', this.handlePacketDragMove, this);
    this.input.off('wheel', this.handlePacketWheel, this);
    this.skySunTimer?.remove();
    this.skySunTimer = undefined;
    this.sunflowerTimers.forEach((timer) => timer.remove());
    this.peashooterTimers.forEach((timer) => timer.remove());
    this.sunflowerTimers.clear();
    this.peashooterTimers.clear();
  }

  init(data: { level: number }): void {
    const levelIndex = data.level - 1;
    this.currentLevel = LEVELS[levelIndex];
    this.sunCount = INITIAL_SUN;
    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.mowers = [];
    this.selectedPlantType = null;
    this.plantCards.clear();
    this.currentWaveIndex = 0;
    this.waveInProgress = false;
    this.currentWaveInitialHp = 0;
    this.zombiesSpawnedInWave.clear();
    this.sunflowerTimers.clear();
    this.peashooterTimers.clear();
    this.gameOver = false;
    this.showingFinalWaveWarning = false;
    this.waveSpawnComplete = false;
    this.waveRestPending = false;
    this.ghostPreview = undefined;
    this.gameSpeed = 1;
    this.scaledTime = 0;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.packetContainer = undefined;
    this.packetScrollX = 0;
    this.maxPacketScrollX = 0;
    this.scrollLeftBtn = undefined;
    this.scrollRightBtn = undefined;
    this.isDraggingPackets = false;
    this.dragMoved = false;
    
    // Initialize grid
    this.grid = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        this.grid[row][col] = null;
      }
    }
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.input.setTopOnly(true);
    this.input.mouse?.disableContextMenu();
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.off('pointermove', this.handlePacketDragMove, this);
    this.input.on('pointermove', this.handlePacketDragMove, this);
    this.input.off('wheel', this.handlePacketWheel, this);
    this.input.on('wheel', this.handlePacketWheel, this);

    this.drawBackdrop(width, height);

    // Draw lawn
    this.drawLawn();

    // Create UI
    this.createUI();

    // Create seed card bar
    this.createSeedCards();

    // Create lawn mowers
    this.createLawnMowers();

    this.skySunTimer = this.time.addEvent({
      delay: SKY_SUN_INTERVAL,
      callback: this.dropSkySun,
      callbackScope: this,
      loop: true,
    });

    this.scheduleLevelStart();
    this.refreshSunCounter();
  }

  private refreshSunCounter(animate: boolean = false): void {
    if (this.sunText?.active) {
      this.sunText.setText(`${this.sunCount}`);
      if (animate) {
        this.tweens.killTweensOf(this.sunText);
        this.sunText.setScale(1.25);
        this.tweens.add({
          targets: this.sunText,
          scale: 1,
          duration: 180,
          ease: 'Back.easeOut',
        });
      }
    }
    this.updateCardAffordability();
  }

  private updateCardAffordability(): void {
    const now = this.scaledTime;
    this.plantCards.forEach((cardData, plantType) => {
      if (plantType === 'shovel') return;
      const plantData = PLANT_TYPES[plantType];
      const canAfford = this.sunCount >= plantData.sunCost;
      const onCooldown = now < cardData.cooldownUntil;
      cardData.card.setAlpha(canAfford && !onCooldown ? 1 : 0.55);
    });
  }

  private flashInsufficientSun(): void {
    if (!this.sunText?.active) return;
    this.sunText.setColor('#ff4444');
    this.tweens.add({
      targets: this.sunText,
      x: this.sunText.x + 5,
      duration: 55,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (this.sunText?.active) {
          this.sunText.setColor('#ffffff');
        }
      },
    });
  }

  private pointerToWorld(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    return this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  private usesClearBetweenWavesPacing(): boolean {
    return (
      this.currentLevel.prepTimeMs !== undefined &&
      this.currentLevel.restTimeMs !== undefined
    );
  }

  private scheduleLevelStart(): void {
    const prepMs = this.usesClearBetweenWavesPacing()
      ? this.currentLevel.prepTimeMs!
      : 3_000;

    this.time.delayedCall(prepMs, () => {
      if (this.gameOver) return;
      if (this.usesClearBetweenWavesPacing()) {
        this.showZombiesComingBanner(() => this.startNextWave());
      } else {
        this.startNextWave();
      }
    });
  }

  private showZombiesComingBanner(onComplete: () => void): void {
    const { width, height } = this.cameras.main;

    const banner = this.add.text(width / 2, height / 2, '僵尸来了', {
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: '80px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 8,
    });
    banner.setOrigin(0.5);
    banner.setDepth(1000);

    this.tweens.add({
      targets: banner,
      scale: { from: 0.6, to: 1.1 },
      alpha: { from: 1, to: 0 },
      duration: 2200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        banner.destroy();
        onComplete();
      },
    });
  }

  private drawBackdrop(width: number, height: number): void {
    const lawnBottom = GRID_START_Y + (GRID_ROWS - 1) * TILE_HEIGHT + TILE_HEIGHT / 2;
    this.add.rectangle(width / 2, lawnBottom / 2, width, lawnBottom, 0x6ec6f5, 1);
    this.add.rectangle(width / 2, lawnBottom + (height - lawnBottom) / 2, width, height - lawnBottom, 0x5a9e3e);

    if (this.textures.exists(ASSET_MANIFEST.houseSidewalk.key)) {
      const house = this.add.image(HOUSE_CENTER_X, height / 2 + 30, ASSET_MANIFEST.houseSidewalk.key);
      house.setOrigin(0.5, 0.5);
    }
  }

  private drawLawn(): void {
    const lightKey = ASSET_MANIFEST.lawnLight.key;
    const darkKey = ASSET_MANIFEST.lawnDark.key;
    const hasTiles = this.textures.exists(lightKey) && this.textures.exists(darkKey);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = GRID_START_X + col * TILE_WIDTH;
        const y = GRID_START_Y + row * TILE_HEIGHT;

        if (hasTiles) {
          const key = (row + col) % 2 === 0 ? lightKey : darkKey;
          const tileImg = this.add.image(x, y, key);
          tileImg.setDisplaySize(TILE_WIDTH, TILE_HEIGHT);
        } else {
          const shade = (row + col) % 2 === 0 ? 0x7cfc00 : 0x90ee90;
          this.add.rectangle(x, y, TILE_WIDTH - 2, TILE_HEIGHT - 2, shade, 0.85);
        }

        const hit = this.add.zone(x, y, TILE_WIDTH, TILE_HEIGHT);
        hit.setDepth(2);
        hit.setInteractive();
        hit.on('pointerover', () => {
          this.updateGhostPreview(row, col, x, y);
        });
        hit.on('pointerout', () => {
          this.hideGhostPreview();
        });
        hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) {
            this.clearSelection();
            return;
          }
          const { x: wx, y: wy } = this.pointerToWorld(pointer);
          if (this.tryCollectSunAtPointer(wx, wy)) {
            return;
          }
          this.handleTileClick(row, col);
        });
      }
    }
  }

  private getHudLayout(): {
    barW: number;
    barH: number;
    barLeft: number;
    barRight: number;
    barCenterY: number;
    sunCounterX: number;
    sunCounterY: number;
    sunCounterW: number;
    sunCounterH: number;
    sunTextX: number;
    sunTextY: number;
    packetW: number;
    packetH: number;
    packetCentersX: number[];
    packetY: number;
    packetStepX: number;
    viewportLeft: number;
    viewportWidth: number;
    needsScroll: boolean;
    leftArrowX: number;
    rightArrowX: number;
    shovelX: number;
    shovelY: number;
    shovelW: number;
    shovelH: number;
  } {
    const MAX_VISIBLE_PACKETS = 5;
    const plantCount = this.currentLevel.availablePlants.length;
    const needsScroll = plantCount > MAX_VISIBLE_PACKETS;
    const visibleSlots = Math.min(plantCount, MAX_VISIBLE_PACKETS);

    const barH = HUD_BAR_SRC_HEIGHT * HUD_BAR_SCALE;
    const barLeft = needsScroll
      ? 200
      : plantCount === 5
        ? 250
        : HUD_BAR_LEFT_X;
    const lawnTopY = GRID_START_Y - TILE_HEIGHT / 2;
    const packetBottomInset = 3 + (barH * HUD_PACKET_BAR_RATIO) / 2;
    let barCenterY = lawnTopY - HUD_CLEARANCE_ABOVE_LAWN - packetBottomInset;
    const sunCounterH = barH * 0.96;
    const minCenterY = HUD_TOP_MARGIN + sunCounterH / 2 + 1;
    if (barCenterY < minCenterY) {
      barCenterY = minCenterY;
    }

    const sunCounterScale = sunCounterH / HUD_SUN_COUNTER_SRC_HEIGHT;
    const sunCounterW = HUD_SUN_COUNTER_SRC_WIDTH * sunCounterScale;
    const sunCounterY = barCenterY - 1;

    const packetH = barH * HUD_PACKET_BAR_RATIO;
    const packetScale = packetH / HUD_PACKET_SRC_HEIGHT;
    const packetW = HUD_PACKET_SRC_WIDTH * packetScale * HUD_PACKET_WIDTH_RATIO;
    const packetY = barCenterY - 3;

    const shovelH = barH * HUD_SHOVEL_BAR_RATIO;
    const shovelScale = shovelH / HUD_SHOVEL_SRC_HEIGHT;
    const shovelW = HUD_SHOVEL_SRC_WIDTH * shovelScale;
    const shovelY = barCenterY - 2;

    const gap = HUD_ELEMENT_GAP;
    const pad = HUD_BAR_PAD_X;
    const arrowW = 26;
    const arrowGap = 4;

    const viewportWidth =
      visibleSlots > 0 ? visibleSlots * packetW + (visibleSlots - 1) * gap : 0;
    const traySpan = needsScroll
      ? arrowW + arrowGap + viewportWidth + arrowGap + arrowW
      : viewportWidth;
    const barW =
      pad + sunCounterW + gap + traySpan + gap + shovelW + pad;
    const barRight = barLeft + barW;

    let cursorX = barLeft + pad;
    const sunCounterX = cursorX + sunCounterW / 2;
    cursorX += sunCounterW + gap;

    let leftArrowX = cursorX;
    if (needsScroll) {
      leftArrowX = cursorX + arrowW / 2;
      cursorX += arrowW + arrowGap;
    }

    const viewportLeft = cursorX;
    const packetStepX = packetW + gap;
    const packetCentersX: number[] = [];
    for (let i = 0; i < plantCount; i++) {
      packetCentersX.push(viewportLeft + packetW / 2 + i * packetStepX);
    }
    cursorX += viewportWidth;

    let rightArrowX = cursorX;
    if (needsScroll) {
      cursorX += arrowGap;
      rightArrowX = cursorX + arrowW / 2;
      cursorX += arrowW;
    }

    const shovelX = cursorX + gap + shovelW / 2;

    const sunTextX = sunCounterX + sunCounterW * 0.14;
    const sunTextY = sunCounterY;

    return {
      barW,
      barH,
      barLeft,
      barRight,
      barCenterY,
      sunCounterX,
      sunCounterY,
      sunCounterW,
      sunCounterH,
      sunTextX,
      sunTextY,
      packetW,
      packetH,
      packetCentersX,
      packetY,
      packetStepX,
      viewportLeft,
      viewportWidth,
      needsScroll,
      leftArrowX,
      rightArrowX,
      shovelX,
      shovelY,
      shovelW,
      shovelH,
    };
  }

  private createUI(): void {
    const { width } = this.cameras.main;
    const layout = this.getHudLayout();

    if (this.textures.exists(ASSET_MANIFEST.seedBar.key)) {
      this.add
        .image(layout.barLeft + layout.barW / 2, layout.barCenterY, ASSET_MANIFEST.seedBar.key)
        .setDisplaySize(layout.barW, layout.barH)
        .setDepth(10);
    }

    this.sunTargetX = layout.sunCounterX;
    this.sunTargetY = layout.sunCounterY;

    if (this.textures.exists(ASSET_MANIFEST.sunCounter.key)) {
      this.add
        .image(layout.sunCounterX, layout.sunCounterY, ASSET_MANIFEST.sunCounter.key)
        .setDisplaySize(layout.sunCounterW, layout.sunCounterH)
        .setDepth(12);
    }

    this.sunText = this.add.text(layout.sunTextX, layout.sunTextY, `${this.sunCount}`, {
      fontSize: `${Math.round(30 * HUD_BAR_SCALE * 2)}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#6b4423',
      strokeThickness: 3,
      resolution: 2,
    });
    this.sunText.setOrigin(0.5);
    this.sunText.setDepth(13);

    // Level & wave progress indicator on the right of the HUD bar
    const rightAnchorX = Math.min(layout.barRight + 14, width - 325);
    this.add
      .text(rightAnchorX, layout.barCenterY - 14, this.currentLevel.name, {
        fontSize: '20px',
        color: '#1b4d1b',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3,
        resolution: 2,
      })
      .setOrigin(0, 0.5)
      .setDepth(12);

    this.waveText = this.add
      .text(rightAnchorX, layout.barCenterY + 8, `Wave 0/${this.currentLevel.waves.length}`, {
        fontSize: '15px',
        color: '#2e5c1e',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 2,
        resolution: 2,
      })
      .setOrigin(0, 0.5)
      .setDepth(12);

    const barBg = this.add
      .rectangle(rightAnchorX, layout.barCenterY + 24, this.waveProgressWidth, 8, 0x3a2a14, 0.75)
      .setOrigin(0, 0.5)
      .setDepth(12);
    barBg.setStrokeStyle(1, 0xffffff, 0.8);

    this.waveProgressFill = this.add
      .rectangle(rightAnchorX, layout.barCenterY + 24, 0, 6, 0x4be04b, 1)
      .setOrigin(0, 0.5)
      .setDepth(13);

    // Speed toggle button (1x / 1.25x / 1.5x / 2x)
    this.speedBtnBg = this.add
      .rectangle(width - 156, layout.barCenterY, 92, 38, 0x4fc3f7, 1)
      .setStrokeStyle(2, 0x0277bd, 1)
      .setDepth(15)
      .setInteractive({ useHandCursor: true });

    this.speedBtnText = this.add
      .text(width - 156, layout.barCenterY, '⚡ 1x', {
        fontSize: '18px',
        color: '#0d2b45',
        fontStyle: 'bold',
        resolution: 2,
      })
      .setOrigin(0.5)
      .setDepth(16);

    this.speedBtnBg.on('pointerdown', () => this.cycleGameSpeed());

    // Compact Menu button in top-right corner
    const menuBtn = this.add
      .rectangle(width - 56, layout.barCenterY, 86, 38, 0xffd700, 1)
      .setStrokeStyle(2, 0xb87300, 1)
      .setDepth(15)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width - 56, layout.barCenterY, 'Menu', {
        fontSize: '18px',
        color: '#3d2914',
        fontStyle: 'bold',
        resolution: 2,
      })
      .setOrigin(0.5)
      .setDepth(16);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0xffe44d));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0xffd700));
    menuBtn.on('pointerdown', () => this.scene.start('LevelSelectScene'));
  }

  private cycleGameSpeed(): void {
    const idx = GAME_SPEED_OPTIONS.indexOf(this.gameSpeed as (typeof GAME_SPEED_OPTIONS)[number]);
    const nextSpeed = GAME_SPEED_OPTIONS[(idx + 1) % GAME_SPEED_OPTIONS.length];
    this.gameSpeed = nextSpeed;
    this.time.timeScale = nextSpeed;
    this.tweens.timeScale = nextSpeed;

    if (this.speedBtnText?.active) {
      this.speedBtnText.setText(`⚡ ${nextSpeed}x`);
    }
    if (this.speedBtnBg?.active) {
      this.speedBtnBg.setFillStyle(nextSpeed > 1 ? 0xffa726 : 0x4fc3f7);
    }
  }

  private createSeedCards(): void {
    const layout = this.getHudLayout();
    const plantCount = this.currentLevel.availablePlants.length;
    const totalPacketsW =
      plantCount > 0 ? plantCount * layout.packetW + (plantCount - 1) * HUD_ELEMENT_GAP : 0;
    this.maxPacketScrollX = Math.max(0, totalPacketsW - layout.viewportWidth);
    this.packetScrollX = 0;

    this.packetContainer = this.add.container(0, 0);
    this.packetContainer.setDepth(15);

    if (layout.needsScroll) {
      const maskShape = this.make.graphics({}, false);
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(
        layout.viewportLeft - 6,
        layout.packetY - layout.packetH / 2 - 8,
        layout.viewportWidth + 12,
        layout.packetH + 16
      );
      this.packetContainer.setMask(maskShape.createGeometryMask());
    }

    this.currentLevel.availablePlants.forEach((plantType, index) => {
      const x = layout.packetCentersX[index];
      const y = layout.packetY;

      const card = this.add.container(x, y);
      this.packetContainer!.add(card);

      const packetKey = PACKET_TEXTURE_KEYS[plantType];
      if (packetKey && this.textures.exists(packetKey)) {
        const packet = this.add.image(0, 0, packetKey);
        packet.setDisplaySize(layout.packetW, layout.packetH);
        card.add(packet);

        if (plantType === 'repeater') {
          const badge = this.add.text(layout.packetW / 2 - 12, -layout.packetH / 2 + 14, '2x', {
            fontSize: '13px',
            color: '#fff200',
            fontStyle: 'bold',
            stroke: '#1b5e20',
            strokeThickness: 3,
            resolution: 2,
          }).setOrigin(0.5);
          card.add(badge);
        }
      } else {
        const fallback = this.add.rectangle(0, 0, layout.packetW, layout.packetH, 0xe8d4a8, 1);
        fallback.setStrokeStyle(2, 0x6b4423, 1);
        card.add(fallback);
      }

      const data = PLANT_TYPES[plantType];
      const cost = this.add.text(0, layout.packetH / 2 - 8, `${data.sunCost}`, {
        fontSize: '16px',
        color: '#1b3d0a',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3,
        resolution: 2,
      });
      cost.setOrigin(0.5);
      card.add(cost);

      const highlight = this.add.rectangle(0, 0, layout.packetW + 6, layout.packetH + 6);
      highlight.setStrokeStyle(0, 0x000000, 0);
      highlight.setFillStyle(0x000000, 0);
      card.add(highlight);

      const hitW = layout.packetW + (layout.needsScroll ? 6 : HUD_PACKET_HIT_PAD_X * 2);
      const hitH = layout.packetH + HUD_PACKET_HIT_PAD_Y * 2;
      const hit = this.add.zone(0, 0, hitW, hitH);
      hit.setInteractive({ useHandCursor: true });
      const selectedType = plantType;
      hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const cardWorldX = x - this.packetScrollX;
        if (
          layout.needsScroll &&
          (cardWorldX < layout.viewportLeft - 4 ||
            cardWorldX > layout.viewportLeft + layout.viewportWidth + 4)
        ) {
          return;
        }
        if (layout.needsScroll) {
          this.isDraggingPackets = true;
          this.dragStartX = pointer.x;
          this.dragStartScrollX = this.packetScrollX;
          this.dragMoved = false;
        }
        // Delay selection slightly if dragging, or select on pointerup if not dragged
        if (!layout.needsScroll) {
          this.selectPlantCard(selectedType);
        } else {
          hit.once('pointerup', () => {
            if (!this.dragMoved) {
              this.selectPlantCard(selectedType);
            }
          });
        }
      });
      card.add(hit);

      this.plantCards.set(plantType, { card, highlight, cooldownUntil: 0 });
    });

    if (layout.needsScroll) {
      this.scrollLeftBtn = this.createScrollArrowButton(
        layout.leftArrowX,
        layout.packetY,
        '◀',
        () => this.scrollPacketsBy(-layout.packetStepX)
      );
      this.scrollRightBtn = this.createScrollArrowButton(
        layout.rightArrowX,
        layout.packetY,
        '▶',
        () => this.scrollPacketsBy(layout.packetStepX)
      );
      this.updateScrollArrowStates();
    }

    const shovelCard = this.add.container(layout.shovelX, layout.shovelY);
    shovelCard.setDepth(15);

    const shovelHighlight = this.add.rectangle(0, 0, layout.shovelW + 6, layout.shovelH + 6);
    shovelHighlight.setStrokeStyle(0, 0x000000, 0);
    shovelHighlight.setFillStyle(0x000000, 0);
    shovelCard.add(shovelHighlight);

    if (this.textures.exists(ASSET_MANIFEST.shovel.key)) {
      const shovel = this.add.image(0, 0, ASSET_MANIFEST.shovel.key);
      shovel.setDisplaySize(layout.shovelW, layout.shovelH);
      shovelCard.add(shovel);
    }

    const shovelHitW = layout.shovelW + HUD_SHOVEL_HIT_PAD_X * 2;
    const shovelHitH = layout.shovelH + HUD_SHOVEL_HIT_PAD_Y * 2;
    const shovelHit = this.add.zone(0, 0, shovelHitW, shovelHitH);
    shovelHit.setInteractive({ useHandCursor: true });
    shovelHit.on('pointerdown', () => {
      if (this.selectedPlantType === 'shovel') {
        this.clearSelection();
      } else {
        this.selectedPlantType = 'shovel';
        this.updateCardSelection();
      }
    });
    shovelCard.add(shovelHit);

    this.plantCards.set('shovel', { card: shovelCard, highlight: shovelHighlight, cooldownUntil: 0 });
  }

  private clearSelection(): void {
    this.selectedPlantType = null;
    this.hideGhostPreview();
    this.updateCardSelection();
  }

  private updateGhostPreview(row: number, col: number, x: number, y: number): void {
    if (!this.selectedPlantType || this.selectedPlantType === 'shovel') {
      this.hideGhostPreview();
      return;
    }

    if (this.grid[row]?.[col] !== null) {
      this.hideGhostPreview();
      return;
    }

    const textureKey = PLANT_TEXTURE_KEYS[this.selectedPlantType];
    if (!textureKey || !this.textures.exists(textureKey)) {
      this.hideGhostPreview();
      return;
    }

    if (!this.ghostPreview) {
      this.ghostPreview = this.add.image(x, y + ROW_SPRITE_FOOT_OFFSET, textureKey);
      this.ghostPreview.setOrigin(0.5, 1);
      this.ghostPreview.setDepth(3);
      this.ghostPreview.setAlpha(0.45);
    } else {
      this.ghostPreview.setTexture(textureKey);
      this.ghostPreview.setPosition(x, y + ROW_SPRITE_FOOT_OFFSET);
      this.ghostPreview.setVisible(true);
    }
    this.ghostPreview.clearTint();

    const isShooter =
      this.selectedPlantType === 'peashooter' ||
      this.selectedPlantType === 'snowpea' ||
      this.selectedPlantType === 'repeater';
    const heightScale = PLANT_TILE_FIT / this.ghostPreview.height;
    const widthScale = (TILE_WIDTH - 10) / this.ghostPreview.width;
    const scale = isShooter ? heightScale : Math.min(heightScale, widthScale);
    this.ghostPreview.setScale(scale);
  }

  private hideGhostPreview(): void {
    if (this.ghostPreview) {
      this.ghostPreview.setVisible(false);
    }
  }

  private selectPlantCard(plantType: string): void {
    if (this.gameOver) return;

    if (this.selectedPlantType === plantType) {
      this.clearSelection();
      return;
    }

    const cardData = this.plantCards.get(plantType);
    if (!cardData) return;

    const now = this.scaledTime;
    if (now < cardData.cooldownUntil) return;

    const plantData = PLANT_TYPES[plantType];
    if (this.sunCount < plantData.sunCost) {
      this.flashInsufficientSun();
      return;
    }

    this.selectedPlantType = plantType;
    this.updateCardSelection();
  }

  private updateCardSelection(): void {
    this.plantCards.forEach((cardData, plantType) => {
      const selected = plantType === this.selectedPlantType;
      if (selected) {
        cardData.highlight.setStrokeStyle(5, 0xffff00, 1);
      } else {
        cardData.highlight.setStrokeStyle(0, 0x000000, 0);
      }
    });
  }

  private handleTileClick(row: number, col: number): void {
    if (this.gameOver) return;
    if (!this.selectedPlantType) return;

    if (this.selectedPlantType === 'shovel') {
      // Remove plant
      const plant = this.grid[row][col];
      if (plant) {
        this.removePlant(plant);
      }
      this.selectedPlantType = null;
      this.updateCardSelection();
      return;
    }

    if (this.selectedPlantType === 'snowflake') {
      if (!this.spendSunAndStartCooldown('snowflake')) return;
      this.triggerSnowflakeBlizzard();
      this.clearSelection();
      return;
    }

    // Plant a plant
    if (this.grid[row][col] !== null) return;
    if (!this.spendSunAndStartCooldown(this.selectedPlantType)) return;

    const x = GRID_START_X + col * TILE_WIDTH;
    const y = GRID_START_Y + row * TILE_HEIGHT;

    const plant = new Plant(this, x, y, this.selectedPlantType, row, col);
    this.plants.push(plant);
    this.grid[row][col] = plant;

    // Start plant behavior
    if (this.selectedPlantType === 'sunflower') {
      this.startSunflowerProduction(plant);
    } else if (this.selectedPlantType === 'peashooter') {
      this.startPeashooterShooting(plant, false, false);
    } else if (this.selectedPlantType === 'snowpea') {
      this.startPeashooterShooting(plant, true, false);
    } else if (this.selectedPlantType === 'repeater') {
      this.startPeashooterShooting(plant, false, true);
    } else if (this.selectedPlantType === 'cherrybomb') {
      this.explodeCherryBomb(plant);
    } else if (this.selectedPlantType === 'potatomine') {
      this.startPotatoMine(plant);
    } else if (this.selectedPlantType === 'plantern') {
      this.refreshPlanternBuffs();
    }

    this.clearSelection();
  }

  private spendSunAndStartCooldown(plantType: string): boolean {
    const plantData = PLANT_TYPES[plantType];
    if (!plantData || this.sunCount < plantData.sunCost) return false;

    this.sunCount -= plantData.sunCost;
    this.refreshSunCounter();

    const cardData = this.plantCards.get(plantType);
    if (cardData) {
      cardData.cooldownUntil = this.scaledTime + plantData.cooldown;
      this.updateCardAffordability();

      const { packetW, packetH } = this.getHudLayout();
      const overlay = this.add.rectangle(0, 0, packetW, packetH, 0x000000, 0.55);
      cardData.card.add(overlay);

      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: plantData.cooldown,
        onComplete: () => {
          overlay.destroy();
          this.updateCardAffordability();
        },
      });
    }
    return true;
  }

  private triggerSnowflakeBlizzard(): void {
    const { width, height } = this.cameras.main;

    // Subtle icy screen tint during blizzard
    const frostOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x80d8ff, 0);
    frostOverlay.setDepth(18);
    this.tweens.add({
      targets: frostOverlay,
      alpha: 0.16,
      duration: 350,
    });

    const banner = this.add.text(width / 2, height / 2 - 40, '❄️ BLIZZARD! ❄️', {
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: '48px',
      color: '#e1f5fe',
      fontStyle: 'bold',
      stroke: '#0277bd',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: banner,
      y: height / 2 - 90,
      alpha: 0,
      duration: 1300,
      ease: 'Quad.easeOut',
      onComplete: () => banner.destroy(),
    });

    // Apply immediate chill & tick damage to all alive zombies
    const applyBlizzardTick = () => {
      if (this.gameOver) return;
      this.zombies.forEach((zombie) => {
        if (!zombie.active || zombie.isDying) return;
        zombie.applyChill(SNOW_PEA_SLOW_DURATION);
        zombie.takeDamage(SNOWFLAKE_TICK_DAMAGE);
      });
    };

    applyBlizzardTick();

    const damageTimer = this.time.addEvent({
      delay: SNOWFLAKE_TICK_INTERVAL,
      callback: applyBlizzardTick,
      repeat: Math.floor(SNOWFLAKE_DURATION / SNOWFLAKE_TICK_INTERVAL) - 1,
    });

    // Spawn falling snow particles across the screen
    const snowTimer = this.time.addEvent({
      delay: 85,
      loop: true,
      callback: () => {
        if (this.gameOver) return;
        for (let i = 0; i < 3; i++) {
          const sx = Phaser.Math.Between(120, width - 40);
          const sy = Phaser.Math.Between(60, 140);
          const flake = this.add.circle(sx, sy, Phaser.Math.Between(3, 6), 0xffffff, 0.9);
          flake.setDepth(19);
          this.tweens.add({
            targets: flake,
            x: sx - Phaser.Math.Between(40, 110),
            y: height - 20,
            alpha: 0.2,
            duration: Phaser.Math.Between(900, 1400),
            ease: 'Linear',
            onComplete: () => flake.destroy(),
          });
        }
      },
    });

    this.time.delayedCall(SNOWFLAKE_DURATION, () => {
      damageTimer.remove();
      snowTimer.remove();
      this.tweens.add({
        targets: frostOverlay,
        alpha: 0,
        duration: 450,
        onComplete: () => frostOverlay.destroy(),
      });
    });
  }

  private removePlant(plant: Plant): void {
    this.grid[plant.row][plant.col] = null;
    
    const timer = this.sunflowerTimers.get(plant);
    if (timer) {
      timer.remove();
      this.sunflowerTimers.delete(plant);
    }
    
    const shootTimer = this.peashooterTimers.get(plant);
    if (shootTimer) {
      shootTimer.remove();
      this.peashooterTimers.delete(plant);
    }
    
    const index = this.plants.indexOf(plant);
    if (index > -1) {
      this.plants.splice(index, 1);
    }
    
    const wasPlantern = plant.plantType === 'plantern';
    plant.destroy();
    if (wasPlantern) {
      this.refreshPlanternBuffs();
    }
  }

  private isBoostedByPlantern(row: number, col: number): boolean {
    return this.plants.some(
      (p) =>
        p.active &&
        p.plantType === 'plantern' &&
        Math.abs(p.row - row) <= PLANTERN_BUFF_RANGE &&
        Math.abs(p.col - col) <= PLANTERN_BUFF_RANGE
    );
  }

  private refreshPlanternBuffs(): void {
    this.sunflowerTimers.forEach((timer, plant) => {
      if (plant.active) {
        timer.timeScale = this.isBoostedByPlantern(plant.row, plant.col) ? PLANTERN_SPEED_BOOST : 1;
      }
    });
    this.peashooterTimers.forEach((timer, plant) => {
      if (plant.active) {
        timer.timeScale = this.isBoostedByPlantern(plant.row, plant.col) ? PLANTERN_SPEED_BOOST : 1;
      }
    });
  }

  private createLawnMowers(): void {
    for (let row = 0; row < GRID_ROWS; row++) {
      const x = GRID_START_X - 80;
      const y = GRID_START_Y + row * TILE_HEIGHT;
      const mower = new LawnMower(this, x, y, row);
      this.mowers.push(mower);
    }
  }

  private dropSkySun(): void {
    if (this.gameOver) return;
    
    const x = Phaser.Math.Between(GRID_START_X, GRID_START_X + GRID_COLS * TILE_WIDTH);
    const startY = -50;
    const targetY = Phaser.Math.Between(GRID_START_Y, GRID_START_Y + GRID_ROWS * TILE_HEIGHT);
    
    const sun = new Sun(this, x, startY, SKY_SUN_AMOUNT, true, targetY);
    this.registerSun(sun);
  }

  private registerSun(sun: Sun): void {
    this.suns.push(sun);
  }

  private startSunflowerProduction(plant: Plant): void {
    const timer = this.time.addEvent({
      delay: SUNFLOWER_SUN_INTERVAL,
      callback: () => {
        if (!plant.active) {
          timer.remove();
          return;
        }

        plant.playProduceSunAnimation();
        const sun = new Sun(
          this,
          plant.x,
          plant.y,
          SUNFLOWER_SUN_AMOUNT,
          false,
          undefined,
          () => this.collectSun(sun)
        );
        sun.playSunflowerEject();
        this.registerSun(sun);
      },
      callbackScope: this,
      loop: true,
    });

    timer.timeScale = this.isBoostedByPlantern(plant.row, plant.col) ? PLANTERN_SPEED_BOOST : 1;
    this.sunflowerTimers.set(plant, timer);
  }

  private startPeashooterShooting(plant: Plant, isIce: boolean = false, isDouble: boolean = false): void {
    const fireOnePea = () => {
      if (!plant.active || this.gameOver) return;
      const spawn = plant.getPeaSpawn();
      if (spawn) {
        plant.playShootAnimation();
        const projectile = new Projectile(
          this,
          spawn.worldX,
          spawn.worldY,
          plant.row,
          isIce
        );
        this.projectiles.push(projectile);
      }
    };

    const timer = this.time.addEvent({
      delay: PEA_SHOOT_INTERVAL,
      callback: () => {
        if (!plant.active) {
          timer.remove();
          return;
        }

        // Check if there's an alive zombie in this lane ahead of the plant
        const hasZombieInLane = this.zombies.some(
          (z) => z.active && !z.isDying && z.row === plant.row && z.x > plant.x
        );

        if (hasZombieInLane) {
          fireOnePea();
          if (isDouble) {
            this.time.delayedCall(180, fireOnePea);
          }
        }
      },
      callbackScope: this,
      loop: true,
    });

    timer.timeScale = this.isBoostedByPlantern(plant.row, plant.col) ? PLANTERN_SPEED_BOOST : 1;
    this.peashooterTimers.set(plant, timer);
  }

  private startPotatoMine(plant: Plant): void {
    this.time.delayedCall(POTATO_ARM_TIME, () => {
      if (plant.active && !this.gameOver) {
        plant.armPotatoMine();
      }
    });
  }

  private triggerPotatoMineExplosion(plant: Plant): void {
    if (!plant.active) return;

    this.cameras.main.shake(180, 0.009);

    const flash = this.add.circle(plant.x, plant.y, 75, 0xff7043, 0.85);
    flash.setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 380,
      onComplete: () => flash.destroy(),
    });

    const spudow = this.add.text(plant.x, plant.y - 20, 'SPUDOW!', {
      fontSize: '30px',
      color: '#ffeb3b',
      fontStyle: 'bold',
      stroke: '#6d2b00',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: spudow,
      y: plant.y - 70,
      alpha: 0,
      duration: 550,
      ease: 'Quad.easeOut',
      onComplete: () => spudow.destroy(),
    });

    this.zombies.forEach((zombie) => {
      if (zombie.isDying || zombie.row !== plant.row) return;
      if (Math.abs(zombie.x - plant.x) <= TILE_WIDTH * 1.1) {
        zombie.takeDamage(POTATO_DAMAGE);
      }
    });

    this.removePlant(plant);
  }

  private explodeCherryBomb(plant: Plant): void {
    this.time.delayedCall(CHERRY_EXPLODE_DELAY, () => {
      if (!plant.active) return;

      this.cameras.main.shake(220, 0.012);

      // Flash & shockwave ring
      const flash = this.add.circle(plant.x, plant.y, 130, 0xff6600, 0.85);
      flash.setDepth(20);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 2.2,
        duration: 480,
        onComplete: () => flash.destroy(),
      });

      const boomText = this.add.text(plant.x, plant.y - 20, 'BOOM!', {
        fontSize: '42px',
        color: '#ffea00',
        fontStyle: 'bold',
        stroke: '#b30000',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(25);

      this.tweens.add({
        targets: boomText,
        y: plant.y - 80,
        scale: 1.35,
        alpha: 0,
        duration: 650,
        ease: 'Quad.easeOut',
        onComplete: () => boomText.destroy(),
      });

      // Damage zombies in 3x3 area
      this.zombies.forEach((zombie) => {
        if (zombie.isDying) return;
        const dx = Math.abs(zombie.x - plant.x) / TILE_WIDTH;
        const dy = Math.abs(zombie.row - plant.row);

        if (dx <= CHERRY_RANGE && dy <= CHERRY_RANGE) {
          zombie.takeDamage(CHERRY_DAMAGE);
        }
      });

      // Remove cherry bomb
      this.removePlant(plant);
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameOver) return;
    if (pointer.rightButtonDown()) {
      this.clearSelection();
      return;
    }
    const { x, y } = this.pointerToWorld(pointer);
    this.tryCollectSunAtPointer(x, y);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    this.isDraggingPackets = false;
    if (this.gameOver) return;
    const { x, y } = this.pointerToWorld(pointer);
    this.tryCollectSunAtPointer(x, y);
  }

  private createScrollArrowButton(
    x: number,
    y: number,
    symbol: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(16);

    const bg = this.add.rectangle(0, 0, 24, 62, 0x6b4423, 0.92);
    bg.setStrokeStyle(2, 0xe8d4a8, 1);
    bg.setInteractive({ useHandCursor: true });
    container.add(bg);

    const label = this.add.text(0, 0, symbol, {
      fontSize: '16px',
      color: '#fff8e7',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(label);

    bg.on('pointerover', () => bg.setFillStyle(0x8b5a2b, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x6b4423, 0.92));
    bg.on('pointerdown', onClick);

    return container;
  }

  private scrollPacketsBy(deltaX: number): void {
    const target = Phaser.Math.Clamp(this.packetScrollX + deltaX, 0, this.maxPacketScrollX);
    this.packetScrollTween?.stop();
    this.packetScrollTween = this.tweens.add({
      targets: this,
      packetScrollX: target,
      duration: 180,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        if (this.packetContainer) {
          this.packetContainer.x = -this.packetScrollX;
        }
        this.updateScrollArrowStates();
      },
    });
  }

  private setPacketScrollX(value: number): void {
    this.packetScrollX = Phaser.Math.Clamp(value, 0, this.maxPacketScrollX);
    if (this.packetContainer) {
      this.packetContainer.x = -this.packetScrollX;
    }
    this.updateScrollArrowStates();
  }

  private updateScrollArrowStates(): void {
    if (this.scrollLeftBtn) {
      this.scrollLeftBtn.setAlpha(this.packetScrollX > 2 ? 1 : 0.35);
    }
    if (this.scrollRightBtn) {
      this.scrollRightBtn.setAlpha(this.packetScrollX < this.maxPacketScrollX - 2 ? 1 : 0.35);
    }
  }

  private handlePacketDragMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDraggingPackets || !pointer.isDown || this.maxPacketScrollX <= 0) return;
    const dx = pointer.x - this.dragStartX;
    if (Math.abs(dx) > 6) {
      this.dragMoved = true;
    }
    if (this.dragMoved) {
      this.setPacketScrollX(this.dragStartScrollX - dx);
    }
  }

  private handlePacketWheel(
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    deltaX: number,
    deltaY: number
  ): void {
    if (this.maxPacketScrollX <= 0 || this.gameOver) return;
    const { y } = this.pointerToWorld(pointer);
    if (y <= 150) {
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      this.setPacketScrollX(this.packetScrollX + delta * 0.5);
    }
  }

  private tryCollectSunAtPointer(worldX: number, worldY: number): boolean {
    for (let i = this.suns.length - 1; i >= 0; i--) {
      const sun = this.suns[i];
      if (!sun.active || sun.isCollected()) continue;
      if (sun.containsWorldPoint(worldX, worldY)) {
        this.collectSun(sun);
        return true;
      }
    }
    return false;
  }

  private collectSun(sun: Sun): void {
    if (!sun.active || sun.isCollected()) return;

    const value = sun.value;
    const startX = sun.x;
    const startY = sun.y;

    const index = this.suns.indexOf(sun);
    if (index > -1) {
      this.suns.splice(index, 1);
    }

    // Floating "+25" / "+50" feedback
    const floatText = this.add.text(startX, startY - 12, `+${value}`, {
      fontSize: '22px',
      color: '#fff200',
      fontStyle: 'bold',
      stroke: '#6b4423',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: floatText,
      y: startY - 52,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => floatText.destroy(),
    });

    sun.collect(this.sunTargetX, this.sunTargetY, () => {
      if (!this.gameOver) {
        this.sunCount += value;
        this.refreshSunCounter(true);
      }
    });
  }

  private startNextWave(): void {
    if (this.currentWaveIndex >= this.currentLevel.waves.length) {
      return;
    }

    // Show final wave warning
    if (this.currentWaveIndex === this.currentLevel.waves.length - 1 && !this.showingFinalWaveWarning) {
      this.showingFinalWaveWarning = true;
      this.showFinalWaveWarning();
      return;
    }

    const waveEntries = this.currentLevel.waves[this.currentWaveIndex];
    this.currentWaveInitialHp = waveEntries.reduce(
      (sum, entry) => sum + (ZOMBIE_TYPES[entry.zombieType]?.hp ?? 200),
      0
    );

    this.waveInProgress = true;
    this.waveSpawnComplete = false;
    this.waveStartTime = this.scaledTime;
    this.zombiesSpawnedInWave.clear();

    this.currentWaveIndex++;
    this.updateWaveProgressUI();
  }

  private updateWaveProgressUI(): void {
    const total = this.currentLevel.waves.length;
    if (this.waveText?.active) {
      this.waveText.setText(`Wave ${this.currentWaveIndex}/${total}`);
    }
    if (this.waveProgressFill?.active && total > 0) {
      const targetWidth = (this.currentWaveIndex / total) * this.waveProgressWidth;
      this.tweens.add({
        targets: this.waveProgressFill,
        width: targetWidth,
        duration: 350,
        ease: 'Quad.easeOut',
      });
    }
  }

  private showFinalWaveWarning(): void {
    const { width, height } = this.cameras.main;
    
    const warning = this.add.text(width / 2, height / 2, '最后一波', {
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: '80px',
      color: '#FF0000',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 8,
    });
    warning.setOrigin(0.5);
    warning.setDepth(1000);
    
    this.tweens.add({
      targets: warning,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 2000,
      onComplete: () => {
        warning.destroy();
        this.startNextWave();
      },
    });
  }

  private spawnZombiesForWave(): void {
    if (!this.waveInProgress) return;

    const currentWave = this.currentLevel.waves[this.currentWaveIndex - 1];
    const elapsed = this.scaledTime - this.waveStartTime;

    currentWave.forEach((wave: Wave, index: number) => {
      if (this.zombiesSpawnedInWave.has(index)) return;
      
      if (elapsed >= wave.delay) {
        this.spawnZombie(wave.zombieType, wave.lane);
        this.zombiesSpawnedInWave.add(index);
      }
    });

    if (this.zombiesSpawnedInWave.size === currentWave.length) {
      this.waveInProgress = false;
      this.waveSpawnComplete = true;
      this.tryScheduleRestBetweenWaves();
    }
  }

  private tryScheduleRestBetweenWaves(): void {
    if (!this.waveSpawnComplete || this.waveRestPending) return;
    if (this.currentWaveIndex >= this.currentLevel.waves.length) return;

    const aliveZombies = this.zombies.filter((z) => z.active && !z.isDying);
    const remainingHp = aliveZombies.reduce((sum, z) => sum + z.hp, 0);
    const elapsedSinceWaveStart = this.scaledTime - this.waveStartTime;

    const waveClearedEnough =
      aliveZombies.length === 0 ||
      remainingHp <= this.currentWaveInitialHp * WAVE_ADVANCE_HP_RATIO ||
      elapsedSinceWaveStart >= WAVE_MAX_WAIT_MS;

    if (!waveClearedEnough) return;

    this.waveRestPending = true;
    // Shorter rest if player already cleared every zombie
    const restMs = aliveZombies.length === 0
      ? Math.min(this.currentLevel.restTimeMs, 4500)
      : this.currentLevel.restTimeMs;

    this.time.delayedCall(restMs, () => {
      this.waveRestPending = false;
      this.waveSpawnComplete = false;
      if (!this.gameOver) {
        this.startNextWave();
      }
    });
  }

  private spawnBiteParticles(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const leaf = this.add.circle(
        x + Phaser.Math.Between(-14, 14),
        y + Phaser.Math.Between(-20, 4),
        Phaser.Math.Between(3, 5),
        0x4cd94c,
        0.9
      );
      leaf.setDepth(8);
      this.tweens.add({
        targets: leaf,
        x: leaf.x + Phaser.Math.Between(-22, 22),
        y: leaf.y + Phaser.Math.Between(-18, 12),
        alpha: 0,
        scale: 0.3,
        duration: 240,
        ease: 'Quad.easeOut',
        onComplete: () => leaf.destroy(),
      });
    }
  }

  private spawnZombie(zombieType: string, lane: number): void {
    const x = GRID_START_X + GRID_COLS * TILE_WIDTH + 50;
    const y = GRID_START_Y + lane * TILE_HEIGHT;
    
    const zombie = new Zombie(this, x, y, zombieType, lane);
    this.zombies.push(zombie);
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    const scaledDelta = delta * this.gameSpeed;
    this.scaledTime += scaledDelta;

    // Spawn zombies
    this.spawnZombiesForWave();

    // Update suns
    this.suns.forEach((sun) => sun.update(scaledDelta));

    // Update zombies
    this.zombies.forEach((zombie) => {
      zombie.update(scaledDelta);
      if (zombie.isDying) return;

      // Check if zombie reached house
      if (zombie.x < GRID_START_X - 100 && !zombie.isEating) {
        this.loseGame();
      }

      // Check armed potato mines in this row
      for (const plant of this.plants) {
        if (
          plant.active &&
          plant.plantType === 'potatomine' &&
          plant.isArmed &&
          plant.row === zombie.row &&
          Math.abs(zombie.x - plant.x) < 52
        ) {
          this.triggerPotatoMineExplosion(plant);
          return;
        }
      }

      // Check if zombie should eat plant
      if (!zombie.isEating) {
        const col = Math.floor((zombie.x - GRID_START_X) / TILE_WIDTH);
        if (col >= 0 && col < GRID_COLS) {
          const plant = this.grid[zombie.row][col];
          if (plant) {
            const distance = Math.abs(zombie.x - plant.x);
            if (distance < 50) {
              zombie.isEating = true;
            }
          }
        }
      }

      // Attack plant
      if (zombie.isEating) {
        const col = Math.floor((zombie.x - GRID_START_X) / TILE_WIDTH);
        if (col >= 0 && col < GRID_COLS) {
          const plant = this.grid[zombie.row][col];
          if (plant) {
            if (this.scaledTime - zombie.lastAttackTime > zombie.getEffectiveAttackSpeed()) {
              zombie.lastAttackTime = this.scaledTime;
              plant.takeDamage(zombie.damage);
              this.spawnBiteParticles(plant.x, plant.y);

              if (!plant.active) {
                this.grid[zombie.row][col] = null;
                zombie.isEating = false;
                if (plant.plantType === 'plantern') {
                  this.refreshPlanternBuffs();
                }
              }
            }
          } else {
            zombie.isEating = false;
          }
        } else {
          zombie.isEating = false;
        }
      }

      // Check mower collision
      const mower = this.mowers.find((m) => m.row === zombie.row && !m.isActive);
      if (mower && zombie.x < GRID_START_X - 60) {
        mower.activate();
      }
    });

    // Update projectiles
    this.projectiles.forEach((projectile) => {
      projectile.update(scaledDelta);
      if (!projectile.active) return;

      // Check collision with zombies
      for (const zombie of this.zombies) {
        if (!zombie.active || zombie.isDying) continue;
        if (zombie.row === projectile.row) {
          const dx = Math.abs(zombie.x - projectile.x);
          const dy = Math.abs(zombie.y - projectile.y);
          if (dx < 42 && dy < 58) {
            zombie.takeDamage(projectile.damage);
            if (projectile.isIce) {
              zombie.applyChill(SNOW_PEA_SLOW_DURATION);
            }
            projectile.playHitAndDestroy();
            break;
          }
        }
      }
    });

    // Update mowers
    this.mowers.forEach((mower) => {
      mower.update(scaledDelta);

      if (mower.isActive) {
        // Check collision with zombies
        this.zombies.forEach((zombie) => {
          if (!zombie.active || zombie.isDying) return;
          if (zombie.row === mower.row) {
            const distance = Phaser.Math.Distance.Between(mower.x, mower.y, zombie.x, zombie.y);
            if (distance < 60) {
              zombie.takeDamage(mower.damage);
            }
          }
        });
      }
    });

    // Clean up destroyed objects
    this.projectiles = this.projectiles.filter((p) => p.active);
    this.zombies = this.zombies.filter((z) => z.active);
    this.suns = this.suns.filter((s) => s.active);
    this.mowers = this.mowers.filter((m) => m.active);

    this.tryScheduleRestBetweenWaves();

    // Check win condition
    if (
      !this.waveInProgress &&
      this.waveSpawnComplete &&
      this.currentWaveIndex >= this.currentLevel.waves.length &&
      this.zombies.length === 0
    ) {
      this.winGame();
    }
  }

  private winGame(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    // Unlock next level
    const unlockedLevels = Math.max(
      this.getUnlockedLevels(),
      this.currentLevel.level + 1
    );
    localStorage.setItem('pvz_unlocked_levels', unlockedLevels.toString());

    this.showWinPopup();
  }

  private loseGame(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.showLosePopup();
  }

  private showWinPopup(): void {
    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(900);

    const popup = this.add.container(width / 2, height / 2);
    popup.setDepth(1000);

    const bg = this.add.rectangle(0, 0, 500, 400, 0xFFFFFF);
    bg.setStrokeStyle(6, 0x32CD32);
    popup.add(bg);

    const title = this.add.text(0, -120, 'YOU WIN! 🎉', {
      fontSize: '56px',
      color: '#32CD32',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    popup.add(title);

    const message = this.add.text(0, -40, 'Level Complete!', {
      fontSize: '32px',
      color: '#000000',
    });
    message.setOrigin(0.5);
    popup.add(message);

    // Next button
    const nextButton = this.add.rectangle(0, 60, 200, 60, 0x32CD32);
    nextButton.setStrokeStyle(3, 0x228B22);
    nextButton.setInteractive({ useHandCursor: true });
    popup.add(nextButton);

    const nextText = this.add.text(0, 60, 'Next Level', {
      fontSize: '28px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    nextText.setOrigin(0.5);
    popup.add(nextText);

    nextButton.on('pointerdown', () => {
      if (this.currentLevel.level < LEVELS.length) {
        this.scene.restart({ level: this.currentLevel.level + 1 });
      } else {
        this.scene.start('LevelSelectScene');
      }
    });

    // Menu button
    const menuButton = this.add.rectangle(0, 140, 200, 60, 0xFFD700);
    menuButton.setStrokeStyle(3, 0xFF8C00);
    menuButton.setInteractive({ useHandCursor: true });
    popup.add(menuButton);

    const menuText = this.add.text(0, 140, 'Menu', {
      fontSize: '28px',
      color: '#000000',
      fontStyle: 'bold',
    });
    menuText.setOrigin(0.5);
    popup.add(menuText);

    menuButton.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private showLosePopup(): void {
    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(900);

    const popup = this.add.container(width / 2, height / 2);
    popup.setDepth(1000);

    const bg = this.add.rectangle(0, 0, 500, 400, 0xFFFFFF);
    bg.setStrokeStyle(6, 0xFF0000);
    popup.add(bg);

    const title = this.add.text(0, -120, 'GAME OVER', {
      fontSize: '56px',
      color: '#FF0000',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    popup.add(title);

    const message = this.add.text(0, -40, 'Zombies reached your house!', {
      fontSize: '24px',
      color: '#000000',
    });
    message.setOrigin(0.5);
    popup.add(message);

    // Retry button
    const retryButton = this.add.rectangle(0, 60, 200, 60, 0xFF6347);
    retryButton.setStrokeStyle(3, 0xDC143C);
    retryButton.setInteractive({ useHandCursor: true });
    popup.add(retryButton);

    const retryText = this.add.text(0, 60, 'Retry', {
      fontSize: '28px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    retryText.setOrigin(0.5);
    popup.add(retryText);

    retryButton.on('pointerdown', () => {
      this.scene.restart({ level: this.currentLevel.level });
    });

    // Menu button
    const menuButton = this.add.rectangle(0, 140, 200, 60, 0xFFD700);
    menuButton.setStrokeStyle(3, 0xFF8C00);
    menuButton.setInteractive({ useHandCursor: true });
    popup.add(menuButton);

    const menuText = this.add.text(0, 140, 'Menu', {
      fontSize: '28px',
      color: '#000000',
      fontStyle: 'bold',
    });
    menuText.setOrigin(0.5);
    popup.add(menuText);

    menuButton.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private getUnlockedLevels(): number {
    const saved = localStorage.getItem('pvz_unlocked_levels');
    return saved ? parseInt(saved) : 1;
  }
}
