import Phaser from 'phaser'
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js'
import { BootScene } from './ui/scenes/BootScene'
import { GameScene } from './ui/scenes/GameScene'
import { ConsoleScene } from './ui/scenes/ConsoleScene'
import { GAME_WIDTH, GAME_HEIGHT } from './core/constants'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a1a',
  parent: 'app',
  scene: [BootScene, GameScene, ConsoleScene],
  plugins: {
    scene: [
      {
        key: 'rexUI',
        plugin: UIPlugin,
        mapping: 'rexUI'
      }
    ]
  }
}

new Phaser.Game(config)
