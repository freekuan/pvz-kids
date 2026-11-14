import Phaser from 'phaser';
import { MOWER_SPEED, MOWER_DAMAGE } from '../config/constants';

export class LawnMower extends Phaser.GameObjects.Container {
  public row: number;
  public isActive: boolean = false;
  public damage: number = MOWER_DAMAGE;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, row: number) {
    super(scene, x, y);
    
    this.row = row;
    
    // Draw lawn mower
    this.graphics = scene.add.graphics();
    this.drawMower();
    this.add(this.graphics);
    
    scene.add.existing(this);
  }
  
  private drawMower(): void {
    this.graphics.clear();
    
    // Red mower body
    this.graphics.fillStyle(0xFF0000, 1);
    this.graphics.fillRect(-30, -15, 60, 30);
    this.graphics.fillStyle(0xDC143C, 1);
    this.graphics.fillRect(-25, -10, 50, 20);
    
    // Wheels
    this.graphics.fillStyle(0x333333, 1);
    this.graphics.fillCircle(-20, 20, 8);
    this.graphics.fillCircle(20, 20, 8);
    this.graphics.fillStyle(0x555555, 1);
    this.graphics.fillCircle(-20, 20, 5);
    this.graphics.fillCircle(20, 20, 5);
    
    // Blade (front)
    this.graphics.lineStyle(3, 0x888888);
    this.graphics.lineBetween(30, -10, 30, 10);
    this.graphics.lineBetween(32, -8, 32, 8);
  }
  
  public activate(): void {
    this.isActive = true;
  }
  
  public update(delta: number): void {
    if (this.isActive) {
      this.x += (MOWER_SPEED * delta) / 1000;
      
      // Rotate blade effect
      this.graphics.rotation += 0.3;
      
      // Remove if off screen
      if (this.x > 1400) {
        this.destroy();
      }
    }
  }
}
