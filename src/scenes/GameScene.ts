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
  PLANT_TYPES,
  CHERRY_EXPLODE_DELAY,
  CHERRY_DAMAGE,
  CHERRY_RANGE,
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
import { ASSET_MANIFEST, PACKET_TEXTURE_KEYS } from '../config/assets';

const PACKET_DISPLAY_NAMES: Record<string, string> = {
  sunflower: 'Sunflower',
  peashooter: 'Peashooter',
  wallnut: 'Wall-nut',
  cherrybomb: 'Cherry Bomb',
};

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
  private zombiesSpawnedInWave: Set<number> = new Set();
  
  private sunflowerTimers: Map<Plant, Phaser.Time.TimerEvent> = new Map();
  private peashooterTimers: Map<Plant, Phaser.Time.TimerEvent> = new Map();
  
  private gameOver: boolean = false;
  private showingFinalWaveWarning: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
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
    this.zombiesSpawnedInWave.clear();
    this.sunflowerTimers.clear();
    this.peashooterTimers.clear();
    this.gameOver = false;
    this.showingFinalWaveWarning = false;
    
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

    this.drawBackdrop(width, height);

    // Draw lawn
    this.drawLawn();

    // Create UI
    this.createUI();

    // Create seed card bar
    this.createSeedCards();

    // Create lawn mowers
    this.createLawnMowers();

    // Start sky sun drops
    this.time.addEvent({
      delay: SKY_SUN_INTERVAL,
      callback: this.dropSkySun,
      callbackScope: this,
      loop: true,
    });

    // Start first wave after delay
    this.time.delayedCall(3000, () => {
      this.startNextWave();
    });
  }

  private drawBackdrop(width: number, height: number): void {
    const lawnBottom = GRID_START_Y + GRID_ROWS * TILE_HEIGHT + 40;
    this.add.rectangle(width / 2, lawnBottom / 2 + 80, width, lawnBottom, 0x6ec6f5, 1);
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
        hit.setInteractive();
        hit.on('pointerdown', () => {
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
    shovelX: number;
    shovelY: number;
    shovelW: number;
    shovelH: number;
  } {
    const barH = HUD_BAR_SRC_HEIGHT * HUD_BAR_SCALE;
    const barLeft = HUD_BAR_LEFT_X;
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

    const plantCount = this.currentLevel.availablePlants.length;
    const gap = HUD_ELEMENT_GAP;
    const pad = HUD_BAR_PAD_X;
    const packetsSpan =
      plantCount > 0 ? plantCount * packetW + (plantCount - 1) * gap : 0;
    const barW =
      pad + sunCounterW + gap + packetsSpan + gap + shovelW + pad;
    const barRight = barLeft + barW;

    let cursorX = barLeft + pad;
    const sunCounterX = cursorX + sunCounterW / 2;
    cursorX += sunCounterW + gap;

    const packetCentersX: number[] = [];
    for (let i = 0; i < plantCount; i++) {
      packetCentersX.push(cursorX + packetW / 2);
      cursorX += packetW + gap;
    }

    const shovelX = cursorX + shovelW / 2;

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
    });
    this.sunText.setOrigin(0.5);
    this.sunText.setDepth(13);

    const levelLabelX = Math.min(layout.barRight + 14, width - 8);
    this.add
      .text(levelLabelX, layout.barCenterY, this.currentLevel.name, {
        fontSize: '24px',
        color: '#1b4d1b',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5)
      .setDepth(5);
  }

  private createSeedCards(): void {
    const layout = this.getHudLayout();

    this.currentLevel.availablePlants.forEach((plantType, index) => {
      const x = layout.packetCentersX[index];
      const y = layout.packetY;

      const card = this.add.container(x, y);
      card.setDepth(15);

      const packetKey = PACKET_TEXTURE_KEYS[plantType];
      if (packetKey && this.textures.exists(packetKey)) {
        const packet = this.add.image(0, 0, packetKey);
        packet.setDisplaySize(layout.packetW, layout.packetH);
        card.add(packet);
      } else {
        const fallback = this.add.rectangle(0, 0, layout.packetW, layout.packetH, 0xe8d4a8, 1);
        fallback.setStrokeStyle(2, 0x6b4423, 1);
        card.add(fallback);
      }

      const data = PLANT_TYPES[plantType];
      const label = PACKET_DISPLAY_NAMES[plantType] ?? plantType;
      const nameText = this.add.text(0, layout.packetH / 2 - 18, label, {
        fontSize: '11px',
        color: '#3d2914',
        fontStyle: 'bold',
        stroke: '#fff8e7',
        strokeThickness: 2,
      });
      nameText.setOrigin(0.5);
      card.add(nameText);

      const cost = this.add.text(0, layout.packetH / 2 - 4, `${data.sunCost}`, {
        fontSize: '15px',
        color: '#1b3d0a',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 2,
      });
      cost.setOrigin(0.5);
      card.add(cost);

      const highlight = this.add.rectangle(0, 0, layout.packetW + 6, layout.packetH + 6);
      highlight.setStrokeStyle(0, 0x000000, 0);
      highlight.setFillStyle(0x000000, 0);
      card.add(highlight);

      const hitW = layout.packetW + HUD_PACKET_HIT_PAD_X * 2;
      const hitH = layout.packetH + HUD_PACKET_HIT_PAD_Y * 2;
      const hit = this.add.zone(0, 0, hitW, hitH);
      hit.setInteractive({ useHandCursor: true });
      const selectedType = plantType;
      hit.on('pointerdown', () => {
        this.selectPlantCard(selectedType);
      });
      card.add(hit);

      this.plantCards.set(plantType, { card, highlight, cooldownUntil: 0 });
    });

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
      this.selectedPlantType = 'shovel';
      this.updateCardSelection();
    });
    shovelCard.add(shovelHit);

    this.plantCards.set('shovel', { card: shovelCard, highlight: shovelHighlight, cooldownUntil: 0 });
  }

  private selectPlantCard(plantType: string): void {
    if (this.gameOver) return;

    const cardData = this.plantCards.get(plantType);
    if (!cardData) return;

    const now = this.time.now;
    if (now < cardData.cooldownUntil) return;

    const plantData = PLANT_TYPES[plantType];
    if (this.sunCount < plantData.sunCost) return;

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

    // Plant a plant
    if (this.grid[row][col] !== null) return;

    const plantData = PLANT_TYPES[this.selectedPlantType];
    if (this.sunCount < plantData.sunCost) return;

    const x = GRID_START_X + col * TILE_WIDTH;
    const y = GRID_START_Y + row * TILE_HEIGHT;

    const plant = new Plant(this, x, y, this.selectedPlantType, row, col);
    this.plants.push(plant);
    this.grid[row][col] = plant;

    this.sunCount -= plantData.sunCost;
    this.sunText.setText(`${this.sunCount}`);

    // Start cooldown
    const cardData = this.plantCards.get(this.selectedPlantType);
    if (cardData) {
      cardData.cooldownUntil = this.time.now + plantData.cooldown;
      
      // Visual cooldown overlay
      const { packetW, packetH } = this.getHudLayout();
      const overlay = this.add.rectangle(0, 0, packetW, packetH, 0x000000, 0.5);
      cardData.card.add(overlay);
      
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: plantData.cooldown,
        onComplete: () => {
          overlay.destroy();
        },
      });
    }

    // Start plant behavior
    if (this.selectedPlantType === 'sunflower') {
      this.startSunflowerProduction(plant);
    } else if (this.selectedPlantType === 'peashooter') {
      this.startPeashooterShooting(plant);
    } else if (this.selectedPlantType === 'cherrybomb') {
      this.explodeCherryBomb(plant);
    }

    this.selectedPlantType = null;
    this.updateCardSelection();
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
    
    plant.destroy();
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
    sun.on('pointerdown', () => {
      this.collectSun(sun);
    });
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
        
        const sun = new Sun(this, plant.x, plant.y, SUNFLOWER_SUN_AMOUNT);
        sun.playSunflowerEject();
        sun.on('pointerdown', () => {
          this.collectSun(sun);
        });
        this.suns.push(sun);
      },
      callbackScope: this,
      loop: true,
    });
    
    this.sunflowerTimers.set(plant, timer);
  }

  private startPeashooterShooting(plant: Plant): void {
    const timer = this.time.addEvent({
      delay: 1500,
      callback: () => {
        if (!plant.active) {
          timer.remove();
          return;
        }
        
        // Check if there's a zombie in this lane
        const hasZombieInLane = this.zombies.some(z => z.row === plant.row && z.x > plant.x);
        
        if (hasZombieInLane) {
          const spawn = plant.getPeaSpawn();
          if (spawn) {
            const projectile = new Projectile(
              this,
              spawn.worldX,
              spawn.rowY,
              plant.row,
              spawn.peaOffsetY
            );
            this.projectiles.push(projectile);
          }
        }
      },
      callbackScope: this,
      loop: true,
    });
    
    this.peashooterTimers.set(plant, timer);
  }

  private explodeCherryBomb(plant: Plant): void {
    this.time.delayedCall(CHERRY_EXPLODE_DELAY, () => {
      if (!plant.active) return;

      // Flash effect
      const flash = this.add.circle(plant.x, plant.y, 150, 0xFF6600, 0.8);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 2,
        duration: 500,
        onComplete: () => flash.destroy(),
      });

      // Damage zombies in 3x3 area
      this.zombies.forEach(zombie => {
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

  private collectSun(sun: Sun): void {
    sun.collect(() => {
      this.sunCount += sun.value;
      this.sunText.setText(`${this.sunCount}`);
    });
    
    const index = this.suns.indexOf(sun);
    if (index > -1) {
      this.suns.splice(index, 1);
    }
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

    this.waveInProgress = true;
    this.waveStartTime = this.time.now;
    this.zombiesSpawnedInWave.clear();

    this.currentWaveIndex++;
  }

  private showFinalWaveWarning(): void {
    const { width, height } = this.cameras.main;
    
    const warning = this.add.text(width / 2, height / 2, 'FINAL WAVE!', {
      fontSize: '72px',
      color: '#FF0000',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 6,
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
    const elapsed = this.time.now - this.waveStartTime;

    currentWave.forEach((wave: Wave, index: number) => {
      if (this.zombiesSpawnedInWave.has(index)) return;
      
      if (elapsed >= wave.delay) {
        this.spawnZombie(wave.zombieType, wave.lane);
        this.zombiesSpawnedInWave.add(index);
      }
    });

    // Check if wave is complete
    if (this.zombiesSpawnedInWave.size === currentWave.length) {
      this.waveInProgress = false;
      
      // Start next wave after delay
      this.time.delayedCall(15000, () => {
        this.startNextWave();
      });
    }
  }

  private spawnZombie(zombieType: string, lane: number): void {
    const x = GRID_START_X + GRID_COLS * TILE_WIDTH + 50;
    const y = GRID_START_Y + lane * TILE_HEIGHT;
    
    const zombie = new Zombie(this, x, y, zombieType, lane);
    this.zombies.push(zombie);
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    // Spawn zombies
    this.spawnZombiesForWave();

    // Update suns
    this.suns.forEach(sun => sun.update(delta));

    // Update zombies
    this.zombies.forEach(zombie => {
      zombie.update(delta);

      // Check if zombie reached house
      if (zombie.x < GRID_START_X - 100 && !zombie.isEating) {
        this.loseGame();
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
            if (time - zombie.lastAttackTime > zombie.attackSpeed) {
              zombie.lastAttackTime = time;
              plant.takeDamage(zombie.damage);
              
              if (!plant.active) {
                zombie.isEating = false;
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
      const mower = this.mowers.find(m => m.row === zombie.row && !m.isActive);
      if (mower && zombie.x < GRID_START_X - 60) {
        mower.activate();
      }
    });

    // Update projectiles
    this.projectiles.forEach(projectile => {
      projectile.update(delta);

      // Check collision with zombies
      this.zombies.forEach(zombie => {
        if (zombie.row === projectile.row) {
          const distance = Phaser.Math.Distance.Between(projectile.x, projectile.y, zombie.x, zombie.y);
          if (distance < 40) {
            zombie.takeDamage(projectile.damage);
            projectile.destroy();
          }
        }
      });
    });

    // Update mowers
    this.mowers.forEach(mower => {
      mower.update(delta);

      if (mower.isActive) {
        // Check collision with zombies
        this.zombies.forEach(zombie => {
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
    this.projectiles = this.projectiles.filter(p => p.active);
    this.zombies = this.zombies.filter(z => z.active);
    this.suns = this.suns.filter(s => s.active);
    this.mowers = this.mowers.filter(m => m.active);

    // Check win condition
    if (!this.waveInProgress && 
        this.currentWaveIndex >= this.currentLevel.waves.length && 
        this.zombies.length === 0) {
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
