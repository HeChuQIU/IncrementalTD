import { commandRegistry } from '../CommandRegistry'
import { consoleStore } from '../ConsoleStore'

export function registerClearCommand(): void {
  commandRegistry.registerCommand(
    'clear',
    [],
    () => {
      consoleStore.getState().clearMessages()
      return '控制台已清空'
    }
  )
}
