import type { CommandDef, ParameterDef } from './types'

/**
 * CommandRegistry: registers commands with typed parameter definitions,
 * parses user input, and dispatches to the appropriate handler.
 *
 * Does NOT use commander at runtime — after analysis, a lightweight custom
 * parser is more suitable for browser/game console use (no process.exit concerns,
 * tighter integration with type-aware completion). Commander remains as a
 * dev dependency reference only.
 */
export class CommandRegistry {
  private commands = new Map<string, CommandDef>()

  /**
   * Register a new command.
   */
  registerCommand(name: string, params: ParameterDef[], handler: (...args: string[]) => string): void {
    this.commands.set(name, { name, params, handler })
  }

  /**
   * Get all registered command names.
   */
  getCommands(): string[] {
    return Array.from(this.commands.keys())
  }

  /**
   * Get the command definition for a given name.
   */
  getCommandDef(name: string): CommandDef | undefined {
    return this.commands.get(name)
  }

  /**
   * Execute a raw input string. Returns the result message.
   * Throws on unknown command or handler error.
   */
  execute(input: string): string {
    const trimmed = input.trim()
    if (!trimmed) {
      throw new Error('空命令')
    }

    // Strip leading '/' if present
    const normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
    const tokens = normalized.split(/\s+/)
    const commandName = tokens[0]
    const args = tokens.slice(1)

    const def = this.commands.get(commandName)
    if (!def) {
      throw new Error(`未知命令: /${commandName}`)
    }

    try {
      return def.handler(...args)
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`命令执行失败: ${err.message}`)
      }
      throw new Error('命令执行失败: 未知错误')
    }
  }
}

/** Singleton registry instance */
export const commandRegistry = new CommandRegistry()
