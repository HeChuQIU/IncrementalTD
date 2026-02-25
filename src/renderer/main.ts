import Phaser from 'phaser'
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js'
import { BootScene } from './ui/scenes/BootScene'
import { GameScene } from './ui/scenes/GameScene'
import { ConsoleScene } from './ui/scenes/ConsoleScene'
import { BuildingDemoScene } from './ui/scenes/BuildingDemoScene'
import { GAME_WIDTH, GAME_HEIGHT } from './core/constants'
import { consoleStore } from './console/ConsoleStore'
import { commandRegistry } from './console/CommandRegistry'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a1a',
  parent: 'app',
  scene: [BootScene, GameScene, ConsoleScene, BuildingDemoScene],
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

const game = new Phaser.Game(config)

// Expose for Playwright integration tests
if (typeof window !== 'undefined') {
  ;(window as any).__phaserGame = game
  ;(window as any).__consoleStore = consoleStore
  // Helper: execute a console command directly (bypasses keyboard focus issues)
  ;(window as any).__executeConsoleCommand = (cmd: string): string => {
    try {
      const result = commandRegistry.execute(cmd)
      consoleStore.getState().appendMessage({ content: result, kind: 'success' })
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      consoleStore.getState().appendMessage({ content: msg, kind: 'error' })
      return msg
    }
  }
}
