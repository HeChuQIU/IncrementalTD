import { commandRegistry } from '../CommandRegistry'
import { ParameterType } from '../types'

export function registerHelpCommand(): void {
  commandRegistry.registerCommand(
    'help',
    [
      {
        name: 'command',
        type: ParameterType.Command,
        description: '要查看帮助的命令名称（可选）'
      }
    ],
    (...args: string[]) => {
      const targetCommand = args[0]

      if (targetCommand) {
        const def = commandRegistry.getCommandDef(targetCommand)
        if (!def) {
          throw new Error(`未知命令: ${targetCommand}`)
        }
        const paramsList = def.params
          .map((p) => `  <${p.name}> (${p.type}) - ${p.description}`)
          .join('\n')
        return `/${def.name}${paramsList ? '\n参数:\n' + paramsList : ' (无参数)'}`
      }

      const commands = commandRegistry.getCommands()
      if (commands.length === 0) {
        return '没有已注册的命令。'
      }
      return `可用命令: ${commands.map((c) => '/' + c).join(', ')}\n输入 /help <命令名> 查看详细信息`
    }
  )
}
