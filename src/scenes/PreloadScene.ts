import Phaser from 'phaser';
import { loadTitleAssets } from '../config/assets';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    document.getElementById('initial-loader')?.remove();

    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x87ceeb);

    const barW = 360;
    const barH = 22;
    const bg = this.add.rectangle(width / 2, height / 2 + 24, barW, barH, 0x1b4d1b, 0.35);
    bg.setStrokeStyle(3, 0xffffff, 0.9);

    const fill = this.add
      .rectangle(width / 2 - barW / 2 + 3, height / 2 + 24, 0, barH - 6, 0x32cd32, 1)
      .setOrigin(0, 0.5);

    this.add
      .text(width / 2, height / 2 - 20, '正在加载…', {
        fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif',
        fontSize: '30px',
        color: '#006400',
        fontStyle: 'bold',
        resolution: 2,
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = (barW - 6) * value;
    });

    loadTitleAssets(this);
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
