import Phaser from 'phaser';
import { ZOMBIE_TYPES } from '../config/constants';
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
  public lastAttackTime: number = 0;
  private sprite?: Phaser.GameObjects.Image;
  private graphics?: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;

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
      this.sprite = scene.add.image(0, 12, textureKey);
      this.sprite.setOrigin(0.5, 1);
      const scale = TARGET_ZOMBIE_HEIGHT / this.sprite.height;
      this.sprite.setScale(scale);
      this.add(this.sprite);
    } else {
      this.graphics = scene.add.graphics();
      this.add(this.graphics);
      this.drawZombieFallback();
    }

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.updateHpBar();

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
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();

    const visual = this.sprite ?? this.graphics;
    if (visual) {
      visual.setAlpha(0.5);
      this.scene.time.delayedCall(100, () => {
        visual.setAlpha(1);
      });
    }

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  public update(delta: number): void {
    if (!this.isEating) {
      this.x -= (this.speed * delta) / 1000;
    }
  }
}