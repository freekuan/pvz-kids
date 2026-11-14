import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../config/assets';

/** Center lawn band between foreground characters — UI overlay anchor. */
const CENTER_X = 640;
const TITLE_Y = 218;
const DEDICATION_EN_Y = 312;
const DEDICATION_ZH_Y = 362;
const START_BTN = { x: CENTER_X, y: 458, width: 340, height: 92 };

/** Max line width for copy kept in the center lawn (between side characters). */
const CENTER_TEXT_WRAP = 380;

const titleTextStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
  fontSize: '46px',
  color: '#2dad2d',
  fontStyle: 'bold',
  align: 'center',
  stroke: '#ffffff',
  strokeThickness: 8,
  shadow: { offsetX: 2, offsetY: 3, color: '#1a5c1a', blur: 4, fill: true },
  wordWrap: { width: CENTER_TEXT_WRAP, useAdvancedWrap: true },
};

const dedicationEnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
  fontSize: '38px',
  color: '#2e6b3a',
  fontStyle: 'bold',
  align: 'center',
  stroke: '#ffffff',
  strokeThickness: 6,
};

const dedicationZhStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  fontSize: '34px',
  color: '#3d7a4a',
  align: 'center',
  stroke: '#ffffff',
  strokeThickness: 5,
};

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    if (this.textures.exists(ASSET_MANIFEST.titleScreen.key)) {
      this.add.image(width / 2, height / 2, ASSET_MANIFEST.titleScreen.key).setOrigin(0.5);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x87ceeb);
    }

    const title = this.add.text(
      CENTER_X,
      TITLE_Y,
      'Plants vs Zombies\nKids',
      titleTextStyle
    );
    title.setOrigin(0.5);

    const dedicationEn = this.add.text(CENTER_X, DEDICATION_EN_Y, 'A Game for Zhiyuan', dedicationEnStyle);
    dedicationEn.setOrigin(0.5);

    const dedicationZh = this.add.text(CENTER_X, DEDICATION_ZH_Y, '给芷鸢的游戏', dedicationZhStyle);
    dedicationZh.setOrigin(0.5);

    const btn = this.add.rectangle(
      START_BTN.x,
      START_BTN.y,
      START_BTN.width,
      START_BTN.height,
      0x32cd32,
      1
    );
    btn.setStrokeStyle(5, 0xffffff, 1);
    btn.setInteractive({ useHandCursor: true });

    const startLabel = this.add.text(START_BTN.x, START_BTN.y, '开始', {
      fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#1b6b1b',
      strokeThickness: 5,
    });
    startLabel.setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(0x45e045);
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x32cd32);
    });
    btn.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });

    // Lift UI above background art.
    [title, dedicationEn, dedicationZh, btn, startLabel].forEach((obj) => obj.setDepth(2));
  }
}