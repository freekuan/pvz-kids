import Phaser from 'phaser';
import { PEA_SPEED, PEA_DAMAGE } from '../config/constants';
import { ASSET_MANIFEST } from '../config/assets';

export class Projectile extends Phaser.GameObjects.Container {
  public damage: number;
  public row: number;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, row: number) {
    super(scene, x, y);

    this.row = row;
    this.damage = PEA_DAMAGE;

    const peaKey = ASSET_MANIFEST.pea.key;
    if (scene.textures.exists(peaKey)) {
      this.sprite = scene.add.image(0, 0, peaKey);
      const scale = 22 / Math.max(this.sprite.width, this.sprite.height);
      this.sprite.setScale(scale);
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.graphics.fillStyle(0x90ee90, 1);
      this.graphics.fillCircle(0, 0, 8);
      this.add(this.graphics);
    }

    scene.add.existing(this);
  }

  public update(delta: number): void {
    this.x += (PEA_SPEED * delta) / 1000;

    if (this.x > 1400) {
      this.destroy();
    }
  }
}