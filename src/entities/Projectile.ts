import Phaser from 'phaser';
import { PEA_SPEED, PEA_DAMAGE } from '../config/constants';

export class Projectile extends Phaser.GameObjects.Container {
  public damage: number;
  public row: number;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, row: number) {
    super(scene, x, y);
    
    this.row = row;
    this.damage = PEA_DAMAGE;
    
    // Draw pea
    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(0x90EE90, 1);
    this.graphics.fillCircle(0, 0, 8);
    this.graphics.fillStyle(0xADFF2F, 1);
    this.graphics.fillCircle(1, -1, 6);
    this.add(this.graphics);
    
    scene.add.existing(this);
  }
  
  public update(delta: number): void {
    this.x += (PEA_SPEED * delta) / 1000;
    
    // Remove if off screen
    if (this.x > 1400) {
      this.destroy();
    }
  }
}
