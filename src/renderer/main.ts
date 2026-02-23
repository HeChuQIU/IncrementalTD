import Phaser from 'phaser'
import { BootScene } from './ui/scenes/BootScene'
import { GameScene } from './ui/scenes/GameScene'
import { GAME_WIDTH, GAME_HEIGHT } from './core/constants'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a1a',
  parent: 'app',
  scene: [BootScene, GameScene]
}

new Phaser.Game(config)
