import Phaser from 'phaser'
import { SCIFI_COLORS } from './styles/colors'
import { SCIFI_GEOMETRY } from './styles/geometry'

const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  fontFamily: SCIFI_GEOMETRY.ui.fontFamily,
  color: '#' + SCIFI_COLORS.uiTextPrimary.toString(16).padStart(6, '0'),
  stroke: '#' + SCIFI_COLORS.uiBackground.toString(16).padStart(6, '0'),
  strokeThickness: 4
}

export class HUD {
  private scoreText: Phaser.GameObjects.Text
  private killsText: Phaser.GameObjects.Text
  private bgPanel: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.bgPanel = scene.add.graphics()
    this.bgPanel.fillStyle(SCIFI_COLORS.uiBackground, 0.8)
    this.bgPanel.lineStyle(SCIFI_GEOMETRY.ui.borderWidth, SCIFI_COLORS.uiBorder, 0.5)
    this.bgPanel.fillRect(10, 10, 150, 60)
    this.bgPanel.strokeRect(10, 10, 150, 60)
    this.bgPanel.setScrollFactor(0)
    this.bgPanel.setDepth(9)

    this.scoreText = scene.add
      .text(20, 18, 'SCORE: 0', TEXT_STYLE)
      .setScrollFactor(0)
      .setDepth(10)
    this.killsText = scene.add
      .text(20, 42, 'KILLS: 0', TEXT_STYLE)
      .setScrollFactor(0)
      .setDepth(10)
  }

  update(score: number, kills: number): void {
    this.scoreText.setText(`SCORE: ${score}`)
    this.killsText.setText(`KILLS: ${kills}`)
  }
}
