import Phaser from 'phaser';

const SUN_RADIUS = 22;
const SUN_RAY_COUNT = 12;
const SUN_RAY_LENGTH = 14;
const SUN_RAY_WIDTH = 5;

export class Sun extends Phaser.GameObjects.Container {
  public value: number;
  public isFromSky: boolean;
  public targetY: number;
  private graphics: Phaser.GameObjects.Graphics;
  private collected: boolean = false;
  private fallSpeed: number = 50;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number, isFromSky: boolean = false, targetY?: number) {
    super(scene, x, y);

    this.value = value;
    this.isFromSky = isFromSky;
    this.targetY = targetY ?? y;

    this.graphics = scene.add.graphics();
    this.drawSun();
    this.add(this.graphics);

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

  private drawSun(): void {
    this.graphics.clear();
    this.graphics.lineStyle(SUN_RAY_WIDTH, 0xffd200, 1);

    for (let i = 0; i < SUN_RAY_COUNT; i++) {
      const angle = (i / SUN_RAY_COUNT) * Math.PI * 2 - Math.PI / 2;
      const innerX = Math.cos(angle) * (SUN_RADIUS + 4);
      const innerY = Math.sin(angle) * (SUN_RADIUS + 4);
      const outerX = Math.cos(angle) * (SUN_RADIUS + SUN_RAY_LENGTH);
      const outerY = Math.sin(angle) * (SUN_RADIUS + SUN_RAY_LENGTH);
      this.graphics.lineBetween(innerX, innerY, outerX, outerY);
    }

    this.graphics.fillStyle(0xffe033, 1);
    this.graphics.fillCircle(0, 0, SUN_RADIUS);

    this.graphics.fillStyle(0xffc800, 1);
    this.graphics.fillCircle(0, 0, SUN_RADIUS - 5);

    this.graphics.fillStyle(0x5a3a10, 1);
    this.graphics.fillEllipse(-7, -4, 5, 7);
    this.graphics.fillEllipse(7, -4, 5, 7);

    this.graphics.lineStyle(2.5, 0x5a3a10, 1);
    this.graphics.beginPath();
    this.graphics.arc(0, 6, 9, 0.15, Math.PI - 0.15, false);
    this.graphics.strokePath();
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