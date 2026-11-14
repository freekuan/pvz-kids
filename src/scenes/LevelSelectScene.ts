import Phaser from 'phaser';
import { LEVELS } from '../config/levels';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB);

    // Title
    const title = this.add.text(width / 2, 80, 'Select Level', {
      fontSize: '56px',
      color: '#006400',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Get unlocked levels from localStorage
    const unlockedLevels = this.getUnlockedLevels();

    // Level buttons
    const startX = width / 2 - 250;
    const startY = height / 2;
    const spacing = 140;

    LEVELS.forEach((level, index) => {
      const x = startX + (index % 5) * spacing;
      const y = startY;

      const isUnlocked = index < unlockedLevels;
      const buttonColor = isUnlocked ? 0x32CD32 : 0x808080;

      const button = this.add.rectangle(x, y, 120, 120, buttonColor);
      button.setStrokeStyle(4, 0x006400);

      const levelText = this.add.text(x, y - 15, `${level.level}`, {
        fontSize: '48px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      });
      levelText.setOrigin(0.5);

      const nameText = this.add.text(x, y + 25, level.name.replace('Level ', ''), {
        fontSize: '20px',
        color: '#FFFFFF',
      });
      nameText.setOrigin(0.5);

      if (isUnlocked) {
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
          button.setFillStyle(0x3FE03F);
        });

        button.on('pointerout', () => {
          button.setFillStyle(0x32CD32);
        });

        button.on('pointerdown', () => {
          this.scene.start('GameScene', { level: index + 1 });
        });
      } else {
        // Lock icon
        const lock = this.add.text(x, y + 25, '🔒', {
          fontSize: '32px',
        });
        lock.setOrigin(0.5);
      }
    });

    // Back button
    const backButton = this.add.rectangle(100, height - 60, 150, 60, 0xFFD700);
    backButton.setStrokeStyle(3, 0xFF8C00);
    backButton.setInteractive({ useHandCursor: true });

    const backText = this.add.text(100, height - 60, 'Back', {
      fontSize: '28px',
      color: '#000000',
      fontStyle: 'bold',
    });
    backText.setOrigin(0.5);

    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xFFE44D);
    });

    backButton.on('pointerout', () => {
      backButton.setFillStyle(0xFFD700);
    });

    backButton.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });

    // Reset progress button (for testing)
    const resetButton = this.add.rectangle(width - 100, height - 60, 150, 60, 0xFF6347);
    resetButton.setStrokeStyle(3, 0xDC143C);
    resetButton.setInteractive({ useHandCursor: true });

    const resetText = this.add.text(width - 100, height - 60, 'Reset', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    resetText.setOrigin(0.5);

    resetButton.on('pointerover', () => {
      resetButton.setFillStyle(0xFF7F66);
    });

    resetButton.on('pointerout', () => {
      resetButton.setFillStyle(0xFF6347);
    });

    resetButton.on('pointerdown', () => {
      localStorage.removeItem('pvz_unlocked_levels');
      this.scene.restart();
    });
  }

  private getUnlockedLevels(): number {
    const saved = localStorage.getItem('pvz_unlocked_levels');
    return saved ? parseInt(saved) : 1;
  }
}
