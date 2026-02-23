import Phaser from 'phaser'

const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3
}

export class HUD {
  private scoreText: Phaser.GameObjects.Text
  private killsText: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scoreText = scene.add
      .text(10, 10, 'Score: 0', TEXT_STYLE)
      .setScrollFactor(0)
      .setDepth(10)
    this.killsText = scene.add
      .text(10, 34, 'Kills: 0', TEXT_STYLE)
      .setScrollFactor(0)
      .setDepth(10)
  }

  update(score: number, kills: number): void {
    this.scoreText.setText(`Score: ${score}`)
    this.killsText.setText(`Kills: ${kills}`)
  }
}
