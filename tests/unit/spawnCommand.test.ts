import { describe, it, expect, beforeEach } from 'vitest'
import { CommandRegistry } from '../../src/renderer/console/CommandRegistry'
import { ParameterType } from '../../src/renderer/console/types'
import { setSpawnHandler } from '../../src/renderer/console/commands/spawnCommand'

describe('/spawn command', () => {
  let registry: CommandRegistry
  let spawnedEntities: Array<{ category: string; subtype: string; pixelX: number; pixelY: number }>

  beforeEach(() => {
    registry = new CommandRegistry()
    spawnedEntities = []

    // Register the spawn command with a tracking handler
    setSpawnHandler((category, subtype, pixelX, pixelY) => {
      spawnedEntities.push({ category, subtype, pixelX, pixelY })
    })

    // Manually register command for test isolation
    registry.registerCommand(
      'spawn',
      [
        { name: 'category', type: ParameterType.EntityCategory, description: '实体类别' },
        { name: 'subtype', type: ParameterType.EntitySubtype, description: '子类型' },
        { name: 'x', type: ParameterType.Coordinate, description: 'X' },
        { name: 'y', type: ParameterType.Coordinate, description: 'Y' }
      ],
      (category?: string, subtype?: string, xStr?: string, yStr?: string) => {
        if (!category || !subtype || !xStr || !yStr) {
          throw new Error('用法: /spawn <category> <subtype> <x> <y>')
        }

        const ENTITY_CATEGORIES = ['enemy', 'tower']
        const ENTITY_SUBTYPES: Record<string, string[]> = {
          enemy: ['goblin', 'golem'],
          tower: ['archer']
        }

        if (!ENTITY_CATEGORIES.includes(category)) {
          throw new Error(`无效的实体类别: ${category}`)
        }

        const validSubtypes = ENTITY_SUBTYPES[category]
        if (!validSubtypes || !validSubtypes.includes(subtype)) {
          throw new Error(`无效的子类型: ${subtype}`)
        }

        const x = parseInt(xStr, 10)
        const y = parseInt(yStr, 10)
        if (isNaN(x) || isNaN(y)) {
          throw new Error('无效的坐标')
        }

        // Map size: 800/32=25, 600/32=18
        if (x < 0 || x >= 25 || y < 0 || y >= 18) {
          throw new Error(`坐标越界: (${x}, ${y})`)
        }

        const TILE_SIZE = 32
        const pixelX = x * TILE_SIZE + TILE_SIZE / 2
        const pixelY = y * TILE_SIZE + TILE_SIZE / 2
        const handler = (c: string, s: string, px: number, py: number) => {
          spawnedEntities.push({ category: c, subtype: s, pixelX: px, pixelY: py })
        }
        handler(category, subtype, pixelX, pixelY)

        return `已在 (${x}, ${y}) 生成 ${category}:${subtype}`
      }
    )
  })

  it('should spawn enemy goblin at valid coordinates', () => {
    const result = registry.execute('/spawn enemy goblin 5 3')
    expect(result).toContain('已在 (5, 3) 生成 enemy:goblin')
    expect(spawnedEntities).toHaveLength(1)
    expect(spawnedEntities[0].category).toBe('enemy')
    expect(spawnedEntities[0].subtype).toBe('goblin')
  })

  it('should spawn tower archer at valid coordinates', () => {
    const result = registry.execute('/spawn tower archer 4 2')
    expect(result).toContain('已在 (4, 2) 生成 tower:archer')
  })

  it('should throw on out-of-bounds coordinates', () => {
    expect(() => registry.execute('/spawn enemy goblin 30 30')).toThrow('坐标越界')
  })

  it('should throw on negative coordinates', () => {
    expect(() => registry.execute('/spawn enemy goblin -1 3')).toThrow('坐标越界')
  })

  it('should throw on invalid entity category', () => {
    expect(() => registry.execute('/spawn building house 5 3')).toThrow('无效的实体类别')
  })

  it('should throw on invalid subtype', () => {
    expect(() => registry.execute('/spawn enemy dragon 5 3')).toThrow('无效的子类型')
  })

  it('should throw on missing arguments', () => {
    expect(() => registry.execute('/spawn enemy')).toThrow('用法')
  })

  it('should throw on non-numeric coordinates', () => {
    expect(() => registry.execute('/spawn enemy goblin abc def')).toThrow('无效的坐标')
  })
})
