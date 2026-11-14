import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB);

    // Title
    const title = this.add.text(width / 2, height / 3, 'Plants vs Zombies\nKids', {
      fontSize: '72px',
      color: '#006400',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#FFFFFF',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 2, 'Tower Defense Game', {
      fontSize: '32px',
      color: '#228B22',
      align: 'center',
    });
    subtitle.setOrigin(0.5);

    // Play button
    const playButton = this.add.rectangle(width / 2, height * 0.65, 300, 80, 0x32CD32);
    playButton.setStrokeStyle(4, 0x006400);
    playButton.setInteractive({ useHandCursor: true });

    const playText = this.add.text(width / 2, height * 0.65, 'PLAY', {
      fontSize: '48px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    playText.setOrigin(0.5);

    playButton.on('pointerover', () => {
      playButton.setFillStyle(0x3FE03F);
    });

    playButton.on('pointerout', () => {
      playButton.setFillStyle(0x32CD32);
    });

    playButton.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });

    // Instructions
    const instructions = this.add.text(
      width / 2,
      height * 0.85,
      'Tap cards to plant • Defend your house from zombies!',
      {
        fontSize: '24px',
        color: '#333333',
        align: 'center',
      }
    );
    instructions.setOrigin(0.5);
  }
}
