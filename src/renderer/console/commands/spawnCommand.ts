import { commandRegistry } from '../CommandRegistry'
import { completionEngine } from '../CompletionEngine'
import { ParameterType } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'

// ─── Tile size constant (for grid coordinate → pixel conversion) ─────────────
const TILE_SIZE = 32

/** Known entity categories */
const ENTITY_CATEGORIES = ['enemy', 'tower']

/** Known entity subtypes by category */
const ENTITY_SUBTYPES: Record<string, string[]> = {
  enemy: ['goblin', 'golem'],
  tower: ['archer']
}

/** All subtypes flattened for completion */
const ALL_SUBTYPES = Object.values(ENTITY_SUBTYPES).flat()

// Register completion values
completionEngine.registerTypeValues(ParameterType.EntityCategory, ENTITY_CATEGORIES)
completionEngine.registerTypeValues(ParameterType.EntitySubtype, ALL_SUBTYPES)

export function registerSpawnCommand(): void {
  commandRegistry.registerCommand(
    'spawn',
    [
      { name: 'category', type: ParameterType.EntityCategory, description: '实体类别 (enemy/tower)' },
      { name: 'subtype', type: ParameterType.EntitySubtype, description: '实体子类型' },
      { name: 'x', type: ParameterType.Coordinate, description: 'X格子坐标' },
      { name: 'y', type: ParameterType.Coordinate, description: 'Y格子坐标' }
    ],
    (category?: string, subtype?: string, xStr?: string, yStr?: string) => {
      if (!category || !subtype || !xStr || !yStr) {
        throw new Error('用法: /spawn <category> <subtype> <x> <y>')
      }

      if (!ENTITY_CATEGORIES.includes(category)) {
        throw new Error(`无效的实体类别: ${category}。可选: ${ENTITY_CATEGORIES.join(', ')}`)
      }

      const validSubtypes = ENTITY_SUBTYPES[category]
      if (!validSubtypes || !validSubtypes.includes(subtype)) {
        throw new Error(`无效的子类型: ${subtype}。${category} 可选: ${(validSubtypes ?? []).join(', ')}`)
      }

      const x = parseInt(xStr, 10)
      const y = parseInt(yStr, 10)

      if (isNaN(x) || isNaN(y)) {
        throw new Error(`无效的坐标: (${xStr}, ${yStr})。坐标必须为整数。`)
      }

      // Validate bounds (grid coordinates)
      const maxGridX = Math.floor(GAME_WIDTH / TILE_SIZE)
      const maxGridY = Math.floor(GAME_HEIGHT / TILE_SIZE)
      if (x < 0 || x >= maxGridX || y < 0 || y >= maxGridY) {
        throw new Error(`坐标越界: (${x}, ${y})。有效范围: x=[0, ${maxGridX - 1}], y=[0, ${maxGridY - 1}]`)
      }

      // Actual entity creation happens via game scene
      // We use an event system or direct access — for now, use a callback registry
      const pixelX = x * TILE_SIZE + TILE_SIZE / 2
      const pixelY = y * TILE_SIZE + TILE_SIZE / 2

      const spawnHandler = getSpawnHandler()
      if (spawnHandler) {
        spawnHandler(category, subtype, pixelX, pixelY)
      }

      return `已在 (${x}, ${y}) 生成 ${category}:${subtype}`
    }
  )
}

// ─── Spawn handler callback ──────────────────────────────────────────────────
type SpawnHandler = (category: string, subtype: string, pixelX: number, pixelY: number) => void
let _spawnHandler: SpawnHandler | null = null

export function setSpawnHandler(handler: SpawnHandler): void {
  _spawnHandler = handler
}

export function getSpawnHandler(): SpawnHandler | null {
  return _spawnHandler
}
