import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    // All graphics are drawn procedurally – no external assets needed
  }

  create(): void {
    this.scene.start('GameScene')
  }
}
