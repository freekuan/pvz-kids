import Phaser from 'phaser';
import { PEA_SPEED, PEA_DAMAGE, PEA_DISPLAY_SIZE } from '../config/constants';
import { ASSET_MANIFEST } from '../config/assets';

export class Projectile extends Phaser.GameObjects.Container {
  public damage: number;
  public row: number;
  public isIce: boolean;
  private visual: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, worldY: number, row: number, isIce: boolean = false) {
    super(scene, x, worldY);

    this.row = row;
    this.damage = PEA_DAMAGE;
    this.isIce = isIce;

    const peaKey = ASSET_MANIFEST.pea.key;
    if (scene.textures.exists(peaKey)) {
      const pea = scene.add.image(0, 0, peaKey);
      pea.setOrigin(0.5, 0.5);
      const scale = PEA_DISPLAY_SIZE / Math.max(pea.width, pea.height);
      pea.setScale(scale);
      if (isIce) {
        pea.setTint(0x4fc3f7);
      }
      this.visual = pea;
    } else {
      const graphics = scene.add.graphics();
      graphics.fillStyle(isIce ? 0x4fc3f7 : 0x90ee90, 1);
      graphics.fillCircle(0, 0, 8);
      this.visual = graphics;
    }
    this.add(this.visual);

    this.setDepth(6);
    scene.add.existing(this);

    // Pop-in from barrel & continuous spin in flight
    this.setScale(0.6);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 90,
      ease: 'Back.easeOut',
    });

    scene.tweens.add({
      targets: this.visual,
      angle: 360,
      duration: 550,
      repeat: -1,
      ease: 'Linear',
    });
  }

  public update(delta: number): void {
    this.x += (PEA_SPEED * delta) / 1000;

    if (this.x > 1400) {
      this.destroy();
    }
  }

  /** Classic PvZ pea splat droplets on zombie impact, then destroy projectile. */
  public playHitAndDestroy(): void {
    if (!this.active) return;
    const hitX = this.x;
    const hitY = this.y;
    const scene = this.scene;

    // Small impact ring
    const ringColor = this.isIce ? 0x81d4fa : 0x98fb98;
    const dropColor = this.isIce ? 0x29b6f6 : 0x5cd65c;
    const ring = scene.add.circle(hitX, hitY, 8, ringColor, 0.85);
    ring.setDepth(7);
    scene.tweens.add({
      targets: ring,
      scale: 2.1,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Pea splat droplets
    const dropletCount = 4;
    for (let i = 0; i < dropletCount; i++) {
      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.85, Math.PI * 0.85);
      const dist = Phaser.Math.Between(16, 30);
      const drop = scene.add.circle(hitX, hitY, Phaser.Math.Between(3, 5), dropColor, 1);
      drop.setDepth(7);

      scene.tweens.add({
        targets: drop,
        x: hitX + Math.cos(angle) * dist,
        y: hitY + Math.sin(angle) * dist + 10,
        alpha: 0,
        scale: 0.3,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => drop.destroy(),
      });
    }

    this.destroy();
  }
}
