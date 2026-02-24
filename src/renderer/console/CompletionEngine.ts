import type { CommandRegistry } from './CommandRegistry'
import type { CompletionItem } from './types'
import { ParameterType } from './types'

const MAX_COMPLETIONS = 8

/**
 * Type-aware completion engine.
 * Resolves completions based on the current token position and expected parameter type.
 */
export class CompletionEngine {
  private typeValues = new Map<ParameterType, string[]>()
  private registry: CommandRegistry

  constructor(registry: CommandRegistry) {
    this.registry = registry
  }

  /**
   * Register legal values for a given parameter type.
   * Replaces any previously registered values for that type.
   */
  registerTypeValues(type: ParameterType, values: string[]): void {
    this.typeValues.set(type, [...values])
  }

  /**
   * Get completion candidates for the current input string.
   */
  getCompletions(input: string): CompletionItem[] {
    if (!input || !input.trim()) return []

    const trimmed = input.trimStart()
    const hasSlash = trimmed.startsWith('/')
    const normalized = hasSlash ? trimmed.slice(1) : trimmed

    // Split into tokens — trailing space means user is starting a new token
    const trailingSpace = input.endsWith(' ')
    const tokens = normalized.split(/\s+/).filter((t) => t.length > 0)

    // Determine which token index we're completing
    const currentTokenIndex = trailingSpace ? tokens.length : Math.max(0, tokens.length - 1)
    const currentPrefix = trailingSpace ? '' : (tokens[tokens.length - 1] ?? '')

    if (currentTokenIndex === 0) {
      // Completing the command name
      return this.filterByPrefix(
        this.registry.getCommands(),
        currentPrefix,
        '命令'
      )
    }

    // We're completing a parameter — find the command definition
    const commandName = tokens[0]
    const def = this.registry.getCommandDef(commandName)
    if (!def) return []

    // Parameter index is currentTokenIndex - 1 (0-based)
    const paramIndex = currentTokenIndex - 1
    if (paramIndex >= def.params.length) return []

    const paramDef = def.params[paramIndex]
    const values = this.typeValues.get(paramDef.type) ?? []
    return this.filterByPrefix(values, currentPrefix, paramDef.description)
  }

  private filterByPrefix(values: string[], prefix: string, description: string): CompletionItem[] {
    const lower = prefix.toLowerCase()
    return values
      .filter((v) => v.toLowerCase().startsWith(lower))
      .slice(0, MAX_COMPLETIONS)
      .map((v) => ({ label: v, description }))
  }
}

// ─── Singleton instance (uses global commandRegistry) ────────────────────────
import { commandRegistry } from './CommandRegistry'

export const completionEngine = new CompletionEngine(commandRegistry)
