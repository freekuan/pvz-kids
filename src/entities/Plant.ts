import Phaser from 'phaser';
import { PLANT_TYPES } from '../config/constants';

export class Plant extends Phaser.GameObjects.Container {
  public plantType: string;
  public hp: number;
  public maxHp: number;
  public row: number;
  public col: number;
  private graphics: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, plantType: string, row: number, col: number) {
    super(scene, x, y);
    
    this.plantType = plantType;
    this.row = row;
    this.col = col;
    
    const data = PLANT_TYPES[plantType];
    this.hp = data.hp;
    this.maxHp = data.hp;
    
    // Draw plant body
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawPlant();
    
    // HP bar
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.updateHpBar();
    
    scene.add.existing(this);
  }
  
  private drawPlant(): void {
    this.graphics.clear();
    
    switch (this.plantType) {
      case 'sunflower':
        // Yellow flower
        this.graphics.fillStyle(0xFFD700, 1);
        this.graphics.fillCircle(0, 0, 35);
        this.graphics.fillStyle(0xFFA500, 1);
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const px = Math.cos(angle) * 30;
          const py = Math.sin(angle) * 30;
          this.graphics.fillCircle(px, py, 12);
        }
        // Face
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillCircle(-10, -5, 4);
        this.graphics.fillCircle(10, -5, 4);
        this.graphics.lineStyle(3, 0x000000);
        this.graphics.beginPath();
        this.graphics.arc(0, 5, 15, 0.2, Math.PI - 0.2);
        this.graphics.strokePath();
        break;
        
      case 'peashooter':
        // Green pea shooter
        this.graphics.fillStyle(0x228B22, 1);
        this.graphics.fillCircle(0, 0, 35);
        this.graphics.fillStyle(0x32CD32, 1);
        this.graphics.fillCircle(-5, -5, 28);
        // Eyes
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillCircle(-15, -10, 5);
        this.graphics.fillCircle(5, -10, 5);
        // Mouth (tube)
        this.graphics.fillStyle(0x228B22, 1);
        this.graphics.fillRect(10, -5, 20, 10);
        break;
        
      case 'wallnut':
        // Brown wall-nut
        this.graphics.fillStyle(0x8B4513, 1);
        this.graphics.fillRoundedRect(-35, -35, 70, 70, 10);
        this.graphics.fillStyle(0xA0522D, 1);
        this.graphics.fillRoundedRect(-30, -30, 60, 60, 8);
        // Face
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillCircle(-12, -8, 4);
        this.graphics.fillCircle(12, -8, 4);
        this.graphics.lineStyle(3, 0x000000);
        this.graphics.lineBetween(-15, 10, 15, 10);
        break;
        
      case 'cherrybomb':
        // Red cherries
        this.graphics.fillStyle(0xFF0000, 1);
        this.graphics.fillCircle(-15, 0, 25);
        this.graphics.fillCircle(15, 0, 25);
        this.graphics.fillStyle(0xDC143C, 1);
        this.graphics.fillCircle(-15, -5, 20);
        this.graphics.fillCircle(15, -5, 20);
        // Angry face on left cherry
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillCircle(-20, -5, 3);
        this.graphics.fillCircle(-10, -5, 3);
        this.graphics.lineStyle(2, 0x000000);
        this.graphics.lineBetween(-22, 8, -8, 8);
        break;
    }
  }
  
  private updateHpBar(): void {
    this.hpBar.clear();
    
    if (this.hp < this.maxHp) {
      const barWidth = 60;
      const barHeight = 6;
      const hpPercent = this.hp / this.maxHp;
      
      // Background
      this.hpBar.fillStyle(0x000000, 0.5);
      this.hpBar.fillRect(-barWidth / 2, -50, barWidth, barHeight);
      
      // HP bar
      let color = 0x00FF00;
      if (hpPercent < 0.3) color = 0xFF0000;
      else if (hpPercent < 0.6) color = 0xFFFF00;
      
      this.hpBar.fillStyle(color, 1);
      this.hpBar.fillRect(-barWidth / 2, -50, barWidth * hpPercent, barHeight);
    }
  }
  
  public takeDamage(damage: number): void {
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
    this.updateHpBar();
    
    // Flash red
    this.graphics.setAlpha(0.5);
    this.scene.time.delayedCall(100, () => {
      this.graphics.setAlpha(1);
    });
    
    if (this.hp <= 0) {
      this.destroy();
    }
  }
}
