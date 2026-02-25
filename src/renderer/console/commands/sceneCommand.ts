import { commandRegistry } from '../CommandRegistry'
import { ParameterType } from '../types'
import { completionEngine } from '../CompletionEngine'
import { consoleStore } from '../ConsoleStore'

let _game: Phaser.Game | null = null

export function registerSceneCommand(game: Phaser.Game): void {
  _game = game

  const SCENE_KEYS = ['BootScene', 'GameScene', 'ConsoleScene', 'BuildingDemoScene']
  completionEngine.registerTypeValues(ParameterType.SceneKey, SCENE_KEYS)

  commandRegistry.registerCommand(
    'scene',
    [{ name: 'sceneKey', type: ParameterType.SceneKey, description: '场景Key (GameScene, BuildingDemoScene)' }],
    (sceneKey?: string) => {
      if (!_game) return '错误: Game实例未绑定'
      if (!sceneKey) return '用法: /scene <SceneKey>'

      const sceneManager = _game.scene
      if (!sceneManager.getScene(sceneKey)) {
        return `错误: 未知场景 '${sceneKey}'`
      }

      // 关闭控制台（释放 CanvasInput 焦点）再切换场景
      consoleStore.getState().closeConsole()

      // 停止除 ConsoleScene 外的所有场景
      sceneManager.getScenes(true).forEach(scene => {
        if (scene.scene.key !== 'ConsoleScene') {
          sceneManager.stop(scene.scene.key)
        }
      })

      // 启动目标场景
      sceneManager.start(sceneKey)

      // ConsoleScene 必须在最顶层渲染，否则会被目标场景的背景覆盖
      sceneManager.bringToTop('ConsoleScene')

      return `正在切换至场景: ${sceneKey}`
    }
  )
}
