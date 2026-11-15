import Phaser from 'phaser';
import { SUN_COLLECT_HIT_RADIUS, SUN_DEPTH } from '../config/constants';
import { ASSET_MANIFEST } from '../config/assets';

const COLLECTIBLE_SUN_SIZE = 54;

export class Sun extends Phaser.GameObjects.Container {
  public value: number;
  public isFromSky: boolean;
  public targetY: number;
  private visual!: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private baseScale: number = 1;
  private collected: boolean = false;
  private landed: boolean = false;
  private fallSpeed: number = 55;
  private onAutoCollect?: () => void;
  private expiryWarningTimer?: Phaser.Time.TimerEvent;
  private expireTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    value: number,
    isFromSky: boolean = false,
    targetY?: number,
    onAutoCollect?: () => void
  ) {
    super(scene, x, y);

    this.value = value;
    this.isFromSky = isFromSky;
    this.targetY = targetY ?? y;
    this.onAutoCollect = onAutoCollect;

    const sunKey = ASSET_MANIFEST.sun.key;
    if (scene.textures.exists(sunKey)) {
      const sprite = scene.add.image(0, 0, sunKey);
      this.baseScale = COLLECTIBLE_SUN_SIZE / Math.max(sprite.width, sprite.height);
      sprite.setScale(this.baseScale);
      this.visual = sprite;
    } else {
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xffe033, 1);
      graphics.fillCircle(0, 0, 22);
      this.visual = graphics;
    }
    this.add(this.visual);

    this.setDepth(SUN_DEPTH);
    scene.add.existing(this);

    this.setInteractive({
      hitArea: new Phaser.Geom.Circle(0, 0, SUN_COLLECT_HIT_RADIUS),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
      draggable: false,
    });

    if (!this.isFromSky) {
      this.startIdlePulse();
    }

    // Blink warning before disappearing (sky sun) or auto-collecting (sunflower sun)
    this.expiryWarningTimer = scene.time.delayedCall(5800, () => {
      if (!this.collected && this.active) {
        scene.tweens.add({
          targets: this.visual,
          alpha: 0.4,
          duration: 240,
          yoyo: true,
          repeat: 4,
        });
      }
    });

    this.expireTimer = scene.time.delayedCall(8200, () => {
      if (!this.collected && this.active) {
        if (!this.isFromSky && this.onAutoCollect) {
          this.onAutoCollect();
        } else {
          this.fadeOut();
        }
      }
    });
  }

  private startIdlePulse(): void {
    this.scene.tweens.add({
      targets: this.visual,
      angle: 360,
      duration: 9000,
      repeat: -1,
      ease: 'Linear',
    });

    this.scene.tweens.add({
      targets: this.visual,
      scale: { from: this.baseScale * 0.94, to: this.baseScale * 1.07 },
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public isCollected(): boolean {
    return this.collected;
  }

  public containsWorldPoint(worldX: number, worldY: number): boolean {
    return Phaser.Math.Distance.Between(worldX, worldY, this.x, this.y) <= SUN_COLLECT_HIT_RADIUS;
  }

  /** Classic PvZ: pop at the plant, arc up with slight horizontal drift, then bounce to rest. */
  public playSunflowerEject(): void {
    const originY = this.y;
    const peakY = originY - 68;
    const restY = originY - 14;
    const driftX = Phaser.Math.Between(-28, 28);

    this.setScale(0.5);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 240,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: this,
      x: this.x + driftX,
      duration: 660,
      ease: 'Sine.easeOut',
    });

    this.scene.tweens.add({
      targets: this,
      y: peakY,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.collected || !this.active) return;
        this.scene.tweens.add({
          targets: this,
          y: restY,
          duration: 300,
          ease: 'Bounce.easeOut',
        });
      },
    });
  }

  public update(delta: number): void {
    if (this.isFromSky && !this.landed && !this.collected) {
      this.y += (this.fallSpeed * delta) / 1000;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.landed = true;
      }
    }
  }

  public collect(targetX: number, targetY: number, onComplete: () => void): void {
    if (this.collected) return;
    this.collected = true;
    this.disableInteractive();
    this.expiryWarningTimer?.remove();
    this.expireTimer?.remove();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      scale: 0.42,
      duration: 460,
      ease: 'Cubic.easeInOut',
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
      scale: 0.7,
      duration: 450,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
