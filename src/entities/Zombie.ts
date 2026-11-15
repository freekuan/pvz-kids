import Phaser from 'phaser';
import { ZOMBIE_TYPES, ROW_SPRITE_FOOT_OFFSET, SNOW_PEA_SLOW_FACTOR } from '../config/constants';
import { ZOMBIE_TEXTURE_KEYS } from '../config/assets';

const TARGET_ZOMBIE_HEIGHT = 98;

export class Zombie extends Phaser.GameObjects.Container {
  public zombieType: string;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public damage: number;
  public attackSpeed: number;
  public row: number;
  public isEating: boolean = false;
  public isDying: boolean = false;
  public isChilled: boolean = false;
  public lastAttackTime: number = 0;
  private chillRemainingMs: number = 0;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private baseScale: number = 1;
  private animTime: number = Math.random() * 10;

  constructor(scene: Phaser.Scene, x: number, y: number, zombieType: string, row: number) {
    super(scene, x, y);

    this.zombieType = zombieType;
    this.row = row;

    const data = ZOMBIE_TYPES[zombieType];
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.speed = data.speed;
    this.damage = data.damage;
    this.attackSpeed = data.attackSpeed;

    const textureKey = ZOMBIE_TEXTURE_KEYS[zombieType];
    if (textureKey && scene.textures.exists(textureKey)) {
      this.sprite = scene.add.image(0, ROW_SPRITE_FOOT_OFFSET, textureKey);
      this.sprite.setOrigin(0.5, 1);
      this.baseScale = TARGET_ZOMBIE_HEIGHT / this.sprite.height;
      this.sprite.setScale(this.baseScale);
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.add(this.graphics);
      this.drawZombieFallback();
    }

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.updateHpBar();

    this.setDepth(5);
    scene.add.existing(this);
  }

  private drawZombieFallback(): void {
    if (!this.graphics) return;
    this.graphics.clear();
    this.graphics.fillStyle(0x90ee90, 1);
    this.graphics.fillRect(-20, -10, 40, 50);
    this.graphics.fillStyle(0x98fb98, 1);
    this.graphics.fillCircle(0, -30, 25);
  }

  private updateHpBar(): void {
    this.hpBar.clear();

    const barWidth = 60;
    const barHeight = 6;
    const hpPercent = this.hp / this.maxHp;
    const barY = this.sprite ? -TARGET_ZOMBIE_HEIGHT - 10 : -70;

    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth, barHeight);

    let color = 0x00ff00;
    if (hpPercent < 0.3) color = 0xff0000;
    else if (hpPercent < 0.6) color = 0xffff00;

    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
  }

  public takeDamage(damage: number): void {
    if (this.isDying || !this.active) return;

    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    const visual = this.sprite ?? this.graphics;
    if (visual) {
      if (this.sprite) {
        this.sprite.setTint(0xffb3b3);
      }
      visual.setAlpha(0.75);
      this.scene.time.delayedCall(95, () => {
        if (this.active && !this.isDying && visual.active) {
          visual.setAlpha(1);
          if (this.isChilled) {
            this.sprite?.setTint(0x80d8ff);
          } else {
            this.sprite?.clearTint();
          }
        }
      });

      // Slight hit recoil
      if (!this.isEating) {
        this.scene.tweens.add({
          targets: visual,
          x: 4,
          duration: 60,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      }
    }

    if (this.hp <= 0) {
      this.playDeathAnimation();
    }
  }

  private playDeathAnimation(): void {
    if (this.isDying) return;
    this.isDying = true;
    this.isEating = false;
    this.hpBar.setVisible(false);

    const visual = this.sprite ?? this.graphics;
    if (visual) {
      this.scene.tweens.killTweensOf(visual);
      visual.setAlpha(1);
      this.sprite?.clearTint();
    }

    this.scene.tweens.add({
      targets: this,
      angle: 82,
      y: this.y + 14,
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  public applyChill(durationMs: number): void {
    if (this.isDying || !this.active) return;
    this.isChilled = true;
    this.chillRemainingMs = Math.max(this.chillRemainingMs, durationMs);
    this.sprite?.setTint(0x80d8ff);
  }

  public getEffectiveAttackSpeed(): number {
    return this.isChilled ? this.attackSpeed / SNOW_PEA_SLOW_FACTOR : this.attackSpeed;
  }

  public update(delta: number): void {
    if (this.isDying) return;

    if (this.isChilled) {
      this.chillRemainingMs -= delta;
      if (this.chillRemainingMs <= 0) {
        this.isChilled = false;
        this.chillRemainingMs = 0;
        this.sprite?.clearTint();
      }
    }

    const speedMultiplier = this.isChilled ? SNOW_PEA_SLOW_FACTOR : 1;
    this.animTime += (delta / 1000) * speedMultiplier;
    const visual = this.sprite ?? this.graphics;

    if (!this.isEating) {
      this.x -= (this.speed * speedMultiplier * delta) / 1000;

      // Shamble wobble & step bobbing
      if (visual) {
        visual.angle = Math.sin(this.animTime * 4.2) * 4.5;
        const bob = Math.abs(Math.sin(this.animTime * 4.2)) * 3.5;
        visual.y = (this.sprite ? ROW_SPRITE_FOOT_OFFSET : 0) - bob;
        if (this.sprite) {
          this.sprite.setScale(this.baseScale, this.baseScale);
        }
      }
    } else {
      // Rhythmic chomp / lean forward while eating
      if (visual) {
        const chomp = Math.sin(this.animTime * 11);
        visual.angle = -6 + chomp * 4.5;
        visual.y = this.sprite ? ROW_SPRITE_FOOT_OFFSET : 0;
        if (this.sprite) {
          this.sprite.setScale(
            this.baseScale * (1 + chomp * 0.04),
            this.baseScale * (1 - chomp * 0.05)
          );
        }
      }
    }
  }
}
