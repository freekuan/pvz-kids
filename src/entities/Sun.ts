import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../config/assets';

const COLLECTIBLE_SUN_SIZE = 52;

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
      const scale = COLLECTIBLE_SUN_SIZE / Math.max(this.sprite.width, this.sprite.height);
      this.sprite.setScale(scale);
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.drawSunFallback();
      this.add(this.graphics);
    }

    const hitRadius = 34;
    this.setInteractive({
      hitArea: new Phaser.Geom.Circle(0, 0, hitRadius),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
    this.setDepth(20);

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
    this.graphics.fillStyle(0xffe033, 1);
    this.graphics.fillCircle(0, 0, 22);
  }

  /** Classic PvZ: pop at the plant, arc up, then drop a short way and rest. */
  public playSunflowerEject(): void {
    const originY = this.y;
    const peakY = originY - 62;
    const restY = originY - 18;

    this.scene.tweens.add({
      targets: this,
      y: peakY,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.collected || !this.active) return;
        this.scene.tweens.add({
          targets: this,
          y: restY,
          duration: 280,
          ease: 'Quad.easeIn',
        });
      },
    });
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
    this.scene.tweens.killTweensOf(this);

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