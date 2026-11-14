import Phaser from 'phaser';
import { ZOMBIE_TYPES } from '../config/constants';

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
  private graphics: Phaser.GameObjects.Graphics;
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
    
    // Draw zombie body
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawZombie();
    
    // HP bar
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.updateHpBar();
    
    scene.add.existing(this);
  }
  
  private drawZombie(): void {
    this.graphics.clear();
    
    // Body color based on type
    let bodyColor = 0x90EE90;
    let headColor = 0x98FB98;
    
    // Body
    this.graphics.fillStyle(bodyColor, 1);
    this.graphics.fillRect(-20, -10, 40, 50);
    
    // Head
    this.graphics.fillStyle(headColor, 1);
    this.graphics.fillCircle(0, -30, 25);
    
    // Eyes
    this.graphics.fillStyle(0xFF0000, 1);
    this.graphics.fillCircle(-10, -35, 4);
    this.graphics.fillCircle(10, -35, 4);
    
    // Mouth
    this.graphics.lineStyle(2, 0x000000);
    this.graphics.lineBetween(-12, -20, 12, -20);
    
    // Type-specific accessories
    switch (this.zombieType) {
      case 'conehead':
        // Orange cone
        this.graphics.fillStyle(0xFF8C00, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(0, -55);
        this.graphics.lineTo(-20, -45);
        this.graphics.lineTo(20, -45);
        this.graphics.closePath();
        this.graphics.fillPath();
        this.graphics.fillStyle(0xFFA500, 1);
        this.graphics.fillTriangle(0, -52, -15, -45, 15, -45);
        break;
        
      case 'buckethead':
        // Metal bucket
        this.graphics.fillStyle(0x808080, 1);
        this.graphics.fillRect(-22, -55, 44, 15);
        this.graphics.fillStyle(0xA9A9A9, 1);
        this.graphics.fillRect(-20, -53, 40, 13);
        this.graphics.lineStyle(2, 0x696969);
        this.graphics.strokeRect(-20, -53, 40, 13);
        break;
    }
    
    // Arms
    this.graphics.fillStyle(bodyColor, 1);
    this.graphics.fillRect(-30, 0, 10, 25);
    this.graphics.fillRect(20, 0, 10, 25);
  }
  
  private updateHpBar(): void {
    this.hpBar.clear();
    
    const barWidth = 60;
    const barHeight = 6;
    const hpPercent = this.hp / this.maxHp;
    
    // Background
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-barWidth / 2, -70, barWidth, barHeight);
    
    // HP bar
    let color = 0x00FF00;
    if (hpPercent < 0.3) color = 0xFF0000;
    else if (hpPercent < 0.6) color = 0xFFFF00;
    
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(-barWidth / 2, -70, barWidth * hpPercent, barHeight);
  }
  
  public takeDamage(damage: number): void {
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();
    
    // Flash white
    this.graphics.setAlpha(0.5);
    this.scene.time.delayedCall(100, () => {
      this.graphics.setAlpha(1);
    });
    
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
