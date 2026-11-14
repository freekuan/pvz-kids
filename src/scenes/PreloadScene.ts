import Phaser from 'phaser';
import { loadGameAssets } from '../config/assets';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x87ceeb);
    this.add.text(width / 2, height / 2, 'Loading…', {
      fontSize: '32px',
      color: '#006400',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    loadGameAssets(this);
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}