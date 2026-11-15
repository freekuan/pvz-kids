import Phaser from 'phaser';
import {
  PLANT_TYPES,
  ROW_SPRITE_FOOT_OFFSET,
  PLANT_TILE_FIT,
  TILE_WIDTH,
  PEASHOOTER_MOUTH_X_OF_WIDTH,
  PEASHOOTER_MOUTH_Y_OF_HEIGHT_FROM_TOP,
} from '../config/constants';
import { PLANT_TEXTURE_KEYS } from '../config/assets';

export class Plant extends Phaser.GameObjects.Container {
  public plantType: string;
  public hp: number;
  public maxHp: number;
  public row: number;
  public col: number;
  public isArmed: boolean = false;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private mineLight?: Phaser.GameObjects.Arc;
  private plantSpriteHeight: number = PLANT_TILE_FIT;
  private baseScale: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, plantType: string, row: number, col: number) {
    super(scene, x, y);

    this.plantType = plantType;
    this.row = row;
    this.col = col;

    const data = PLANT_TYPES[plantType];
    this.hp = data.hp;
    this.maxHp = data.hp;

    if (plantType === 'plantern') {
      const aura = scene.add.circle(0, -10, 140, 0xffe066, 0.14);
      aura.setStrokeStyle(2, 0xffd54f, 0.32);
      this.add(aura);
      scene.tweens.add({
        targets: aura,
        alpha: 0.24,
        scale: 1.04,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const textureKey = PLANT_TEXTURE_KEYS[plantType];

    if (textureKey && scene.textures.exists(textureKey)) {
      this.sprite = scene.add.image(0, ROW_SPRITE_FOOT_OFFSET, textureKey);
      this.sprite.setOrigin(0.5, 1);
      const isShooter =
        plantType === 'peashooter' || plantType === 'snowpea' || plantType === 'repeater';
      const heightScale = PLANT_TILE_FIT / this.sprite.height;
      const widthScale = (TILE_WIDTH - 10) / this.sprite.width;
      this.baseScale = isShooter ? heightScale : Math.min(heightScale, widthScale);
      this.sprite.setScale(this.baseScale);
      if (plantType === 'potatomine') {
        this.sprite.setAlpha(0.75);
        this.sprite.setScale(this.baseScale, this.baseScale * 0.72);
      }
      this.plantSpriteHeight = this.sprite.displayHeight;
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.add(this.graphics);
      this.drawPlantFallback();
    }

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.updateHpBar();

    this.setDepth(4);
    scene.add.existing(this);

    this.playPlantPopIn();
    this.startIdleAnimation();
  }

  private playPlantPopIn(): void {
    this.setScale(0.35);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 240,
      ease: 'Back.easeOut',
    });
  }

  private startIdleAnimation(): void {
    const visual = this.sprite ?? this.graphics;
    if (!visual) return;

    if (this.plantType === 'cherrybomb') {
      // Urgent swelling & red flash before detonation
      this.scene.tweens.add({
        targets: visual,
        scaleX: this.baseScale * 1.18,
        scaleY: this.baseScale * 1.18,
        duration: 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.scene.tweens.add({
        targets: visual,
        angle: { from: -6, to: 6 },
        duration: 90,
        yoyo: true,
        repeat: -1,
      });
      return;
    }

    const delay = Phaser.Math.Between(0, 600);
    const swayAngle = this.plantType === 'wallnut' ? 1.8 : 3.2;
    const duration = this.plantType === 'wallnut' ? 1600 : 1100;

    // Gentle squash-and-stretch breathing
    this.scene.tweens.add({
      targets: visual,
      scaleY: this.baseScale * 1.05,
      scaleX: this.baseScale * 0.96,
      duration,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Gentle sway
    this.scene.tweens.add({
      targets: visual,
      angle: { from: -swayAngle, to: swayAngle },
      duration: duration * 1.3,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Quick recoil/spit squash-and-stretch when Peashooter fires. */
  public playShootAnimation(): void {
    const visual = this.sprite ?? this.graphics;
    if (!this.active || !visual) return;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.14,
      scaleY: 0.9,
      duration: 95,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** Warm pulse when Sunflower produces sun. */
  public playProduceSunAnimation(): void {
    if (!this.active) return;

    if (this.sprite) {
      this.sprite.setTint(0xfff59d);
      this.scene.time.delayedCall(220, () => {
        if (this.active && this.sprite?.active) {
          this.sprite.clearTint();
        }
      });
    }

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.13,
      scaleY: 1.13,
      duration: 180,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  /** World position at the shooter snout opening (right-side barrel). */
  public getPeaSpawn(): { worldX: number; worldY: number } | null {
    const isShooter =
      this.plantType === 'peashooter' ||
      this.plantType === 'snowpea' ||
      this.plantType === 'repeater';
    if (!isShooter || !this.sprite) return null;

    const dw = this.sprite.displayWidth;
    const dh = this.sprite.displayHeight;
    const mouthLocalX = dw * PEASHOOTER_MOUTH_X_OF_WIDTH;
    const mouthLocalY = ROW_SPRITE_FOOT_OFFSET - dh * (1 - PEASHOOTER_MOUTH_Y_OF_HEIGHT_FROM_TOP);

    return {
      worldX: this.x + mouthLocalX,
      worldY: this.y + mouthLocalY,
    };
  }

  public armPotatoMine(): void {
    if (!this.active || this.plantType !== 'potatomine') return;
    this.isArmed = true;
    if (this.sprite) {
      this.sprite.setAlpha(1);
      this.sprite.setScale(this.baseScale);
    } else {
      this.drawPlantFallback();
    }

    if (this.mineLight) {
      this.scene.tweens.killTweensOf(this.mineLight);
      this.mineLight.setFillStyle(0xff2222, 1);
      this.scene.tweens.add({
        targets: this.mineLight,
        alpha: 0.35,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    }

    this.scene.tweens.add({
      targets: this,
      scaleY: 1.2,
      scaleX: 0.9,
      duration: 180,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  private drawPlantFallback(): void {
    if (!this.graphics) return;
    this.graphics.clear();

    switch (this.plantType) {
      case 'sunflower':
        this.graphics.fillStyle(0xffd700, 1);
        this.graphics.fillCircle(0, 0, 30);
        break;
      case 'peashooter':
      case 'snowpea':
      case 'repeater':
        this.graphics.fillStyle(this.plantType === 'snowpea' ? 0x4fc3f7 : 0x228b22, 1);
        this.graphics.fillCircle(0, 0, 30);
        break;
      case 'wallnut':
        this.graphics.fillStyle(0x8b4513, 1);
        this.graphics.fillRoundedRect(-30, -30, 60, 60, 10);
        break;
      case 'cherrybomb':
        this.graphics.fillStyle(0xff0000, 1);
        this.graphics.fillCircle(-12, 0, 22);
        this.graphics.fillCircle(12, 0, 22);
        break;
      case 'potatomine': {
        // Dirt mound
        this.graphics.fillStyle(0x6d4c2f, 1);
        this.graphics.fillEllipse(0, 8, 62, 24);
        if (this.isArmed) {
          // Popped-up potato body + eyes + antenna
          this.graphics.fillStyle(0xc68b59, 1);
          this.graphics.fillEllipse(0, -6, 48, 36);
          this.graphics.fillStyle(0xffffff, 1);
          this.graphics.fillCircle(-8, -10, 5);
          this.graphics.fillCircle(8, -10, 5);
          this.graphics.fillStyle(0x000000, 1);
          this.graphics.fillCircle(-7, -10, 2.5);
          this.graphics.fillCircle(9, -10, 2.5);
          this.graphics.lineStyle(3, 0x555555, 1);
          this.graphics.lineBetween(0, -24, 0, -34);
          if (!this.mineLight) {
            this.mineLight = this.scene.add.circle(0, -36, 6, 0xff2222, 1);
            this.add(this.mineLight);
          } else {
            this.mineLight.setPosition(0, -36);
          }
        } else {
          // Buried mound with small warning light
          if (!this.mineLight) {
            this.mineLight = this.scene.add.circle(0, -2, 5, 0xff9800, 0.9);
            this.add(this.mineLight);
          }
        }
        break;
      }
      case 'plantern': {
        // Wooden stem & roots
        this.graphics.fillStyle(0x6d3b1a, 1);
        this.graphics.fillRect(-6, -4, 12, 22);
        this.graphics.fillTriangle(-14, 18, 14, 18, 0, 8);
        // Glowing yellow lantern glass
        this.graphics.fillStyle(0xffeb3b, 1);
        this.graphics.fillRoundedRect(-22, -46, 44, 42, 6);
        this.graphics.fillStyle(0xfff9c4, 0.85);
        this.graphics.fillCircle(0, -25, 14);
        // Dark brown lantern frame & roof
        this.graphics.lineStyle(4, 0x4e270f, 1);
        this.graphics.strokeRoundedRect(-22, -46, 44, 42, 6);
        this.graphics.fillStyle(0x5d2e12, 1);
        this.graphics.fillTriangle(-27, -46, 27, -46, 0, -64);
        this.graphics.fillCircle(0, -66, 4);
        // Cute eyes inside lantern
        this.graphics.fillStyle(0x2b1506, 1);
        this.graphics.fillCircle(-8, -26, 4.5);
        this.graphics.fillCircle(8, -26, 4.5);
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(-6.5, -27.5, 1.8);
        this.graphics.fillCircle(9.5, -27.5, 1.8);
        // Green leaves on corners
        this.graphics.fillStyle(0x2e8b2e, 1);
        this.graphics.fillEllipse(-26, -40, 14, 8);
        this.graphics.fillEllipse(26, -40, 14, 8);
        this.graphics.fillEllipse(-6, -42, 14, 7);
        break;
      }
    }
  }

  private updateHpBar(): void {
    this.hpBar.clear();

    if (this.hp < this.maxHp) {
      const barWidth = 60;
      const barHeight = 6;
      const hpPercent = this.hp / this.maxHp;
      const barY = this.sprite ? -this.plantSpriteHeight - 8 : -50;

      this.hpBar.fillStyle(0x000000, 0.5);
      this.hpBar.fillRect(-barWidth / 2, barY, barWidth, barHeight);

      let color = 0x00ff00;
      if (hpPercent < 0.3) color = 0xff0000;
      else if (hpPercent < 0.6) color = 0xffff00;

      this.hpBar.fillStyle(color, 1);
      this.hpBar.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
    }
  }

  public takeDamage(damage: number): void {
    if (!this.active) return;

    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    const visual = this.sprite ?? this.graphics;
    if (visual) {
      visual.setAlpha(0.55);
      this.scene.time.delayedCall(100, () => {
        if (this.active && visual.active) {
          visual.setAlpha(1);
        }
      });
    }

    if (this.hp <= 0) {
      this.destroy();
    }
  }
}
