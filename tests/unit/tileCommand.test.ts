import { describe, it, expect, beforeEach } from 'vitest'
import { CommandRegistry } from '../../src/renderer/console/CommandRegistry'
import { ParameterType } from '../../src/renderer/console/types'

describe('/tile set command', () => {
  let registry: CommandRegistry
  let tileData: Map<string, string>
  let pathRecalculated: boolean

  beforeEach(() => {
    tileData = new Map()
    pathRecalculated = false

    registry = new CommandRegistry()
    registry.registerCommand(
      'tile',
      [
        { name: 'action', type: ParameterType.Command, description: '操作 (set)' },
        { name: 'x', type: ParameterType.Coordinate, description: 'X坐标' },
        { name: 'y', type: ParameterType.Coordinate, description: 'Y坐标' },
        { name: 'tileType', type: ParameterType.TileType, description: '地砖类型' }
      ],
      (action?: string, xStr?: string, yStr?: string, tileType?: string) => {
        if (action !== 'set') {
          throw new Error(`未知操作: ${action}。可用: set`)
        }
        if (!xStr || !yStr || !tileType) {
          throw new Error('用法: /tile set <x> <y> <tileType>')
        }

        const VALID_TILE_TYPES = ['wall', 'path', 'empty']
        if (!VALID_TILE_TYPES.includes(tileType)) {
          throw new Error(`无效的地砖类型: ${tileType}。可选: ${VALID_TILE_TYPES.join(', ')}`)
        }

        const x = parseInt(xStr, 10)
        const y = parseInt(yStr, 10)
        if (isNaN(x) || isNaN(y)) {
          throw new Error('无效的坐标')
        }

        if (x < 0 || x >= 25 || y < 0 || y >= 18) {
          throw new Error(`坐标越界: (${x}, ${y})`)
        }

        tileData.set(`${x},${y}`, tileType)
        pathRecalculated = true

        return `已将 (${x}, ${y}) 设为 ${tileType}`
      }
    )
  })

  it('should set tile type at valid coordinates', () => {
    const result = registry.execute('/tile set 3 3 wall')
    expect(result).toContain('已将 (3, 3) 设为 wall')
    expect(tileData.get('3,3')).toBe('wall')
  })

  it('should trigger path recalculation on success', () => {
    registry.execute('/tile set 3 3 wall')
    expect(pathRecalculated).toBe(true)
  })

  it('should set tile to path type', () => {
    registry.execute('/tile set 5 5 path')
    expect(tileData.get('5,5')).toBe('path')
  })

  it('should throw on invalid tile type', () => {
    expect(() => registry.execute('/tile set 3 3 lava')).toThrow('无效的地砖类型')
  })

  it('should throw on out-of-bounds coordinates', () => {
    expect(() => registry.execute('/tile set 30 30 wall')).toThrow('坐标越界')
  })

  it('should throw on missing arguments', () => {
    expect(() => registry.execute('/tile set 3 3')).toThrow('用法')
  })

  it('should throw on unknown action', () => {
    expect(() => registry.execute('/tile delete 3 3 wall')).toThrow('未知操作')
  })

  it('should throw on non-numeric coordinates', () => {
    expect(() => registry.execute('/tile set abc def wall')).toThrow('无效的坐标')
  })
})
