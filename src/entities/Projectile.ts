import Phaser from 'phaser';
import { PEA_SPEED, PEA_DAMAGE, PEA_DISPLAY_SIZE } from '../config/constants';
import { ASSET_MANIFEST } from '../config/assets';

export class Projectile extends Phaser.GameObjects.Container {
  public damage: number;
  public row: number;

  constructor(scene: Phaser.Scene, x: number, worldY: number, row: number) {
    super(scene, x, worldY);

    this.row = row;
    this.damage = PEA_DAMAGE;

    const peaKey = ASSET_MANIFEST.pea.key;
    if (scene.textures.exists(peaKey)) {
      const pea = scene.add.image(0, 0, peaKey);
      pea.setOrigin(0.5, 0.5);
      const scale = PEA_DISPLAY_SIZE / Math.max(pea.width, pea.height);
      pea.setScale(scale);
      this.add(pea);
    } else {
      const graphics = scene.add.graphics();
      graphics.fillStyle(0x90ee90, 1);
      graphics.fillCircle(0, 0, 8);
      this.add(graphics);
    }

    this.setDepth(6);

    scene.add.existing(this);
  }

  public update(delta: number): void {
    this.x += (PEA_SPEED * delta) / 1000;

    if (this.x > 1400) {
      this.destroy();
    }
  }
}