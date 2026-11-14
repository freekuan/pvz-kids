import Phaser from 'phaser';
import { MOWER_SPEED, MOWER_DAMAGE } from '../config/constants';
import { ASSET_MANIFEST } from '../config/assets';

export class LawnMower extends Phaser.GameObjects.Container {
  public row: number;
  public isActive: boolean = false;
  public damage: number = MOWER_DAMAGE;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, row: number) {
    super(scene, x, y);

    this.row = row;

    const mowerKey = ASSET_MANIFEST.lawnmower.key;
    if (scene.textures.exists(mowerKey)) {
      this.sprite = scene.add.image(0, 12, mowerKey);
      this.sprite.setOrigin(0.5, 1);
      const scale = 56 / Math.max(this.sprite.width, this.sprite.height);
      this.sprite.setScale(scale);
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.drawMowerFallback();
      this.add(this.graphics);
    }

    scene.add.existing(this);
  }

  private drawMowerFallback(): void {
    if (!this.graphics) return;
    this.graphics.clear();
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillRect(-30, -18, 60, 30);
  }

  public activate(): void {
    this.isActive = true;
  }

  public update(delta: number): void {
    if (this.isActive) {
      this.x += (MOWER_SPEED * delta) / 1000;

      if (this.sprite) {
        this.sprite.rotation += 0.05;
      } else if (this.graphics) {
        this.graphics.rotation += 0.3;
      }

      if (this.x > 1400) {
        this.destroy();
      }
    }
  }
}