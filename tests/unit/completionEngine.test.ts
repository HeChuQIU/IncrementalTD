import { describe, it, expect, beforeEach } from 'vitest'
import { CompletionEngine } from '../../src/renderer/console/CompletionEngine'
import { CommandRegistry } from '../../src/renderer/console/CommandRegistry'
import { ParameterType } from '../../src/renderer/console/types'

describe('CompletionEngine', () => {
  let engine: CompletionEngine
  let registry: CommandRegistry

  beforeEach(() => {
    registry = new CommandRegistry()
    engine = new CompletionEngine(registry)

    // Register test commands
    registry.registerCommand(
      'spawn',
      [
        { name: 'category', type: ParameterType.EntityCategory, description: '实体类别' },
        { name: 'subtype', type: ParameterType.EntitySubtype, description: '实体子类型' },
        { name: 'x', type: ParameterType.Coordinate, description: 'X坐标' },
        { name: 'y', type: ParameterType.Coordinate, description: 'Y坐标' }
      ],
      () => 'ok'
    )
    registry.registerCommand('help', [], () => 'help')
    registry.registerCommand(
      'tile',
      [
        { name: 'action', type: ParameterType.Command, description: '操作' },
        { name: 'x', type: ParameterType.Coordinate, description: 'X坐标' },
        { name: 'y', type: ParameterType.Coordinate, description: 'Y坐标' },
        { name: 'type', type: ParameterType.TileType, description: '地砖类型' }
      ],
      () => 'ok'
    )

    // Register type values
    engine.registerTypeValues(ParameterType.EntityCategory, ['enemy', 'tower'])
    engine.registerTypeValues(ParameterType.EntitySubtype, ['goblin', 'archer', 'golem'])
    engine.registerTypeValues(ParameterType.TileType, ['wall', 'path', 'empty'])
    engine.registerTypeValues(ParameterType.Command, ['set'])
  })

  describe('command name completion', () => {
    it('should return all commands for empty input after slash', () => {
      const items = engine.getCompletions('/')
      expect(items.length).toBeGreaterThan(0)
    })

    it('should return commands matching prefix "sp"', () => {
      const items = engine.getCompletions('/sp')
      expect(items).toHaveLength(1)
      expect(items[0].label).toBe('spawn')
    })

    it('should return commands matching prefix "h"', () => {
      const items = engine.getCompletions('/h')
      expect(items).toHaveLength(1)
      expect(items[0].label).toBe('help')
    })

    it('should return empty for non-matching prefix', () => {
      const items = engine.getCompletions('/xyz')
      expect(items).toHaveLength(0)
    })
  })

  describe('parameter completion', () => {
    it('should return EntityCategory candidates for first param of /spawn', () => {
      const items = engine.getCompletions('/spawn ')
      expect(items.length).toBeGreaterThan(0)
      const labels = items.map((i) => i.label)
      expect(labels).toContain('enemy')
      expect(labels).toContain('tower')
    })

    it('should filter EntityCategory by prefix "en"', () => {
      const items = engine.getCompletions('/spawn en')
      expect(items).toHaveLength(1)
      expect(items[0].label).toBe('enemy')
    })

    it('should return EntitySubtype candidates for second param of /spawn', () => {
      const items = engine.getCompletions('/spawn enemy ')
      const labels = items.map((i) => i.label)
      expect(labels).toContain('goblin')
      expect(labels).toContain('archer')
      expect(labels).toContain('golem')
    })

    it('should filter EntitySubtype by prefix "gob"', () => {
      const items = engine.getCompletions('/spawn enemy gob')
      expect(items).toHaveLength(1)
      expect(items[0].label).toBe('goblin')
    })

    it('should return TileType candidates for tile command', () => {
      const items = engine.getCompletions('/tile set 3 3 ')
      const labels = items.map((i) => i.label)
      expect(labels).toContain('wall')
      expect(labels).toContain('path')
      expect(labels).toContain('empty')
    })
  })

  describe('max candidates limit', () => {
    it('should return at most 8 candidates', () => {
      // Register many subtypes
      engine.registerTypeValues(ParameterType.EntitySubtype, [
        'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10'
      ])
      const items = engine.getCompletions('/spawn enemy ')
      expect(items.length).toBeLessThanOrEqual(8)
    })
  })

  describe('edge cases', () => {
    it('should return empty for blank input', () => {
      const items = engine.getCompletions('')
      expect(items).toHaveLength(0)
    })

    it('should return empty for whitespace-only input', () => {
      const items = engine.getCompletions('   ')
      expect(items).toHaveLength(0)
    })

    it('should handle Coordinate type with no registered values', () => {
      // Coordinate type has no registered values — should return empty
      const items = engine.getCompletions('/spawn enemy goblin ')
      expect(items).toHaveLength(0)
    })
  })
})
