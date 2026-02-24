import { describe, it, expect, beforeEach } from 'vitest'
import { CommandRegistry } from '../../src/renderer/console/CommandRegistry'
import { ParameterType } from '../../src/renderer/console/types'

describe('CommandRegistry', () => {
  let registry: CommandRegistry

  beforeEach(() => {
    registry = new CommandRegistry()
  })

  describe('registerCommand + getCommands', () => {
    it('should return empty array when no commands registered', () => {
      expect(registry.getCommands()).toEqual([])
    })

    it('should return registered command names', () => {
      registry.registerCommand('help', [], () => 'Help text')
      registry.registerCommand('spawn', [], () => 'Spawned')
      expect(registry.getCommands()).toContain('help')
      expect(registry.getCommands()).toContain('spawn')
      expect(registry.getCommands()).toHaveLength(2)
    })
  })

  describe('getCommandDef', () => {
    it('should return undefined for unregistered command', () => {
      expect(registry.getCommandDef('nonexistent')).toBeUndefined()
    })

    it('should return command definition with params', () => {
      const params = [
        { name: 'category', type: ParameterType.EntityCategory, description: '实体类别' }
      ]
      registry.registerCommand('spawn', params, () => 'ok')
      const def = registry.getCommandDef('spawn')
      expect(def).toBeDefined()
      expect(def!.name).toBe('spawn')
      expect(def!.params).toEqual(params)
    })
  })

  describe('execute', () => {
    it('should execute a registered command and return result', () => {
      registry.registerCommand('help', [], () => '可用命令: help')
      const result = registry.execute('/help')
      expect(result).toBe('可用命令: help')
    })

    it('should pass arguments to the handler', () => {
      registry.registerCommand('spawn', [], (...args) => `spawned ${args.join(' ')}`)
      const result = registry.execute('/spawn enemy goblin 5 3')
      expect(result).toBe('spawned enemy goblin 5 3')
    })

    it('should throw on unknown command', () => {
      expect(() => registry.execute('/nonexistent')).toThrow('未知命令')
    })

    it('should throw on empty input', () => {
      expect(() => registry.execute('')).toThrow('空命令')
      expect(() => registry.execute('   ')).toThrow('空命令')
    })

    it('should handle command without leading slash', () => {
      registry.registerCommand('help', [], () => 'ok')
      expect(registry.execute('help')).toBe('ok')
    })

    it('should wrap handler errors gracefully', () => {
      registry.registerCommand('broken', [], () => {
        throw new Error('内部错误')
      })
      expect(() => registry.execute('/broken')).toThrow('命令执行失败')
    })

    it('should not crash on handler throwing non-Error', () => {
      registry.registerCommand('weird', [], () => {
        throw 'string error' // eslint-disable-line no-throw-literal
      })
      expect(() => registry.execute('/weird')).toThrow('命令执行失败')
    })
  })
})
