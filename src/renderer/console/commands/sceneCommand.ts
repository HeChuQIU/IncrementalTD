import { commandRegistry } from '../CommandRegistry'
import { ParameterType } from '../types'
import { completionEngine } from '../CompletionEngine'

let _game: Phaser.Game | null = null

export function registerSceneCommand(game: Phaser.Game): void {
  _game = game
  
  // Register scene names for completion
  // Ideally dynamic, but for now hardcode common ones
  const SCENE_KEYS = ['BootScene', 'GameScene', 'ConsoleScene', 'BuildingDemoScene']
  completionEngine.registerTypeValues(ParameterType.SceneKey, SCENE_KEYS) // Or new ParameterType.SceneKey

  commandRegistry.registerCommand(
    'scene',
    [
      { name: 'sceneKey', type: ParameterType.SceneKey, description: '场景Key (GameScene, BuildingDemoScene)' }
    ],
    (sceneKey?: string) => {
      if (!_game) return '错误: Game实例未绑定'
      if (!sceneKey) return '用法: /scene <SceneKey>'
      
      const sceneManager = _game.scene
      if (!sceneManager.getScene(sceneKey)) {
        return `错误: 未知场景 '${sceneKey}'`
      }

      // Stop current active scenes (except Console!)
      // How to know which is active?
      // Usually we switch from GameScene to BuildingDemoScene.
      // We should stop all except ConsoleScene.
      sceneManager.getScenes(true).forEach(scene => {
        if (scene.scene.key !== 'ConsoleScene') {
          sceneManager.stop(scene.scene.key)
        }
      })

      // Start new scene
      sceneManager.start(sceneKey)
      
      return `正在切换至场景: ${sceneKey}`
    }
  )
}
