import Phaser from 'phaser';

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
    this.targetY = targetY || y;
    
    // Draw sun
    this.graphics = scene.add.graphics();
    this.drawSun();
    this.add(this.graphics);
    
    // Make interactive
    const hitArea = new Phaser.Geom.Circle(0, 0, 30);
    this.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    
    scene.add.existing(this);
    
    // Auto-disappear after 8 seconds
    scene.time.delayedCall(8000, () => {
      if (!this.collected) {
        this.fadeOut();
      }
    });
  }
  
  private drawSun(): void {
    this.graphics.clear();
    
    // Yellow sun with rays
    this.graphics.fillStyle(0xFFFF00, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px1 = Math.cos(angle) * 20;
      const py1 = Math.sin(angle) * 20;
      const px2 = Math.cos(angle) * 30;
      const py2 = Math.sin(angle) * 30;
      const perpAngle = angle + Math.PI / 2;
      const px3 = Math.cos(perpAngle) * 3;
      const py3 = Math.sin(perpAngle) * 3;
      
      this.graphics.fillTriangle(
        px1 + px3, py1 + py3,
        px1 - px3, py1 - py3,
        px2, py2
      );
    }
    
    // Center circle
    this.graphics.fillStyle(0xFFFF00, 1);
    this.graphics.fillCircle(0, 0, 20);
    this.graphics.fillStyle(0xFFD700, 1);
    this.graphics.fillCircle(0, 0, 18);
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
    
    // Animate to top of screen
    this.scene.tweens.add({
      targets: this,
      x: 100,
      y: 50,
      scale: 0.5,
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
