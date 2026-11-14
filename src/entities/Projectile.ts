import Phaser from 'phaser';
import { PEA_SPEED, PEA_DAMAGE, PEA_DISPLAY_SIZE } from '../config/constants';
import { ASSET_MANIFEST } from '../config/assets';

export class Projectile extends Phaser.GameObjects.Container {
  public damage: number;
  public row: number;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    rowY: number,
    row: number,
    peaOffsetY: number = 0
  ) {
    super(scene, x, rowY);

    this.row = row;
    this.damage = PEA_DAMAGE;

    const peaKey = ASSET_MANIFEST.pea.key;
    if (scene.textures.exists(peaKey)) {
      this.sprite = scene.add.image(0, peaOffsetY, peaKey);
      this.sprite.setOrigin(0.5, 0.5);
      const scale = PEA_DISPLAY_SIZE / Math.max(this.sprite.width, this.sprite.height);
      this.sprite.setScale(scale);
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.graphics.fillStyle(0x90ee90, 1);
      this.graphics.fillCircle(0, peaOffsetY, 8);
      this.add(this.graphics);
    }

    this.setDepth(5);

    scene.add.existing(this);
  }

  public update(delta: number): void {
    this.x += (PEA_SPEED * delta) / 1000;

    if (this.x > 1400) {
      this.destroy();
    }
  }
}