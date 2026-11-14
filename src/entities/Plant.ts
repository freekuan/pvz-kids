import Phaser from 'phaser';
import {
  PLANT_TYPES,
  ROW_SPRITE_FOOT_OFFSET,
  PLANT_TILE_FIT,
  TILE_WIDTH,
  PEASHOOTER_MOUTH_X_RATIO,
  PEASHOOTER_MOUTH_Y_RATIO,
} from '../config/constants';
import { PLANT_TEXTURE_KEYS } from '../config/assets';

export class Plant extends Phaser.GameObjects.Container {
  public plantType: string;
  public hp: number;
  public maxHp: number;
  public row: number;
  public col: number;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private plantSpriteHeight: number = PLANT_TILE_FIT;

  constructor(scene: Phaser.Scene, x: number, y: number, plantType: string, row: number, col: number) {
    super(scene, x, y);

    this.plantType = plantType;
    this.row = row;
    this.col = col;

    const data = PLANT_TYPES[plantType];
    this.hp = data.hp;
    this.maxHp = data.hp;

    const textureKey = PLANT_TEXTURE_KEYS[plantType];
    if (textureKey && scene.textures.exists(textureKey)) {
      this.sprite = scene.add.image(0, ROW_SPRITE_FOOT_OFFSET, textureKey);
      this.sprite.setOrigin(0.5, 1);
      const scale = Math.min(
        PLANT_TILE_FIT / this.sprite.height,
        (TILE_WIDTH - 10) / this.sprite.width
      );
      this.sprite.setScale(scale);
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
  }

  /** World X at the peashooter mouth and local Y offset for the pea sprite on the row. */
  public getPeaSpawn(): { worldX: number; rowY: number; peaOffsetY: number } | null {
    if (this.plantType !== 'peashooter' || !this.sprite) return null;

    const dw = this.sprite.displayWidth;
    const dh = this.sprite.displayHeight;
    const mouthLocalX = dw * PEASHOOTER_MOUTH_X_RATIO;
    const mouthLocalY = ROW_SPRITE_FOOT_OFFSET - dh * PEASHOOTER_MOUTH_Y_RATIO;

    return {
      worldX: this.x + mouthLocalX,
      rowY: this.y,
      peaOffsetY: mouthLocalY,
    };
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
        this.graphics.fillStyle(0x228b22, 1);
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
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    const visual = this.sprite ?? this.graphics;
    if (visual) {
      visual.setAlpha(0.5);
      this.scene.time.delayedCall(100, () => {
        visual.setAlpha(1);
      });
    }

    if (this.hp <= 0) {
      this.destroy();
    }
  }
}