import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../config/assets';

export class Sun extends Phaser.GameObjects.Container {
  public value: number;
  public isFromSky: boolean;
  public targetY: number;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;
  private collected: boolean = false;
  private fallSpeed: number = 50;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number, isFromSky: boolean = false, targetY?: number) {
    super(scene, x, y);

    this.value = value;
    this.isFromSky = isFromSky;
    this.targetY = targetY ?? y;

    const sunKey = ASSET_MANIFEST.sun.key;
    if (scene.textures.exists(sunKey)) {
      this.sprite = scene.add.image(0, 0, sunKey);
      const scale = 52 / this.sprite.width;
      this.sprite.setScale(scale);
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.drawSunFallback();
      this.add(this.graphics);
    }

    const hitRadius = 34;
    const hitArea = new Phaser.Geom.Circle(0, 0, hitRadius);
    this.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    scene.add.existing(this);

    scene.time.delayedCall(8000, () => {
      if (!this.collected) {
        this.fadeOut();
      }
    });
  }

  private drawSunFallback(): void {
    if (!this.graphics) return;
    this.graphics.clear();
    this.graphics.fillStyle(0xffff00, 1);
    this.graphics.fillCircle(0, 0, 20);
  }

  public update(delta: number): void {
    if (this.isFromSky && this.y < this.targetY && !this.collected) {
      this.y += (this.fallSpeed * delta) / 1000;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
      }
    }
  }

  public collect(onComplete: () => void): void {
    if (this.collected) return;
    this.collected = true;

    this.scene.tweens.add({
      targets: this,
      x: 100,
      y: 58,
      scale: 0.4,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        onComplete();
        this.destroy();
      },
    });
  }

  private fadeOut(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}