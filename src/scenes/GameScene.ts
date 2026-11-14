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
} from '../config/constants';
import { ASSET_MANIFEST, PACKET_TEXTURE_KEYS } from '../config/assets';

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
  private seedBarY = 92;
  
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

  private createUI(): void {
    const { width } = this.cameras.main;

    if (this.textures.exists(ASSET_MANIFEST.seedBar.key)) {
      const bar = this.add.image(width / 2 - 40, this.seedBarY, ASSET_MANIFEST.seedBar.key);
      bar.setScale(1.22);
      bar.setDepth(10);
    } else {
      this.add.rectangle(width / 2, this.seedBarY, width, 100, 0x8b4513);
    }

    if (this.textures.exists(ASSET_MANIFEST.sunCounter.key)) {
      this.add.image(98, this.seedBarY - 4, ASSET_MANIFEST.sunCounter.key).setScale(1.05).setDepth(11);
    }

    if (this.textures.exists(ASSET_MANIFEST.sun.key)) {
      this.add.image(width - 52, 72, ASSET_MANIFEST.sun.key).setScale(0.42).setDepth(5);
    }

    this.sunText = this.add.text(125, this.seedBarY - 6, `${this.sunCount}`, {
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#8b5a00',
      strokeThickness: 4,
    });
    this.sunText.setOrigin(0.5);
    this.sunText.setDepth(12);

    this.add.text(width / 2, 168, this.currentLevel.name, {
      fontSize: '26px',
      color: '#1b4d1b',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  private createSeedCards(): void {
    const startX = 268;
    const cardWidth = 88;
    const cardHeight = 118;
    const spacing = 8;

    this.currentLevel.availablePlants.forEach((plantType, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = this.seedBarY;

      const card = this.add.container(x, y);
      card.setDepth(15);

      const packetKey = PACKET_TEXTURE_KEYS[plantType];
      let bg: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      if (packetKey && this.textures.exists(packetKey)) {
        bg = this.add.image(0, 0, packetKey);
        bg.setDisplaySize(cardWidth, cardHeight);
      } else {
        bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x90ee90);
        (bg as Phaser.GameObjects.Rectangle).setStrokeStyle(3, 0x228b22);
      }
      card.add(bg);

      const data = PLANT_TYPES[plantType];
      const cost = this.add.text(0, 48, `${data.sunCost}`, {
        fontSize: '17px',
        color: '#4a2800',
        fontStyle: 'bold',
      });
      cost.setOrigin(0.5);
      card.add(cost);

      const highlight = this.add.rectangle(0, 0, cardWidth + 6, cardHeight + 6);
      highlight.setStrokeStyle(0, 0x000000, 0);
      highlight.setFillStyle(0x000000, 0);
      card.add(highlight);

      const hit = this.add.zone(0, 0, cardWidth, cardHeight);
      hit.setInteractive();
      hit.on('pointerdown', () => {
        this.selectPlantCard(plantType);
      });
      card.add(hit);

      this.plantCards.set(plantType, { card, highlight, cooldownUntil: 0 });
    });

    const shovelX =
      startX + this.currentLevel.availablePlants.length * (cardWidth + spacing) + 28;
    const shovelCard = this.add.container(shovelX, this.seedBarY);
    shovelCard.setDepth(15);

    const shovelHighlight = this.add.rectangle(0, 0, cardWidth, cardHeight);
    shovelHighlight.setStrokeStyle(0, 0x000000, 0);
    shovelHighlight.setFillStyle(0x000000, 0);
    shovelCard.add(shovelHighlight);

    if (this.textures.exists(ASSET_MANIFEST.shovel.key)) {
      const shovel = this.add.image(0, -8, ASSET_MANIFEST.shovel.key);
      shovel.setScale(0.75);
      shovelCard.add(shovel);
    }

    const shovelLabel = this.add.text(0, 46, '铲', {
      fontSize: '18px',
      color: '#4a2800',
      fontStyle: 'bold',
    });
    shovelLabel.setOrigin(0.5);
    shovelCard.add(shovelLabel);

    const shovelHit = this.add.zone(0, 0, cardWidth, cardHeight);
    shovelHit.setInteractive();
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
      const overlay = this.add.rectangle(0, 0, 88, 118, 0x000000, 0.5);
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
    sun.setInteractive();
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
        sun.setInteractive();
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
          const projectile = new Projectile(this, plant.x + 40, plant.y, plant.row);
          this.projectiles.push(projectile);
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
