import { commandRegistry } from '../CommandRegistry'
import { completionEngine } from '../CompletionEngine'
import { ParameterType } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'

// ─── Tile size constant ──────────────────────────────────────────────────────
const TILE_SIZE = 32

/** Valid tile types  */
const VALID_TILE_TYPES = ['wall', 'path', 'empty']

// Register completion values
completionEngine.registerTypeValues(ParameterType.TileType, VALID_TILE_TYPES)

// ─── Tile data store ─────────────────────────────────────────────────────────
const tileMap = new Map<string, string>()

export function getTileAt(x: number, y: number): string {
  return tileMap.get(`${x},${y}`) ?? 'empty'
}

export function getTileMap(): ReadonlyMap<string, string> {
  return tileMap
}

// ─── Path recalculation callback ─────────────────────────────────────────────
type PathRecalcHandler = () => void
let _pathRecalcHandler: PathRecalcHandler | null = null

export function setPathRecalcHandler(handler: PathRecalcHandler): void {
  _pathRecalcHandler = handler
}

export function getPathRecalcHandler(): PathRecalcHandler | null {
  return _pathRecalcHandler
}

// ─── Register tile command ───────────────────────────────────────────────────
export function registerTileCommand(): void {
  commandRegistry.registerCommand(
    'tile',
    [
      { name: 'action', type: ParameterType.Command, description: '操作 (set)' },
      { name: 'x', type: ParameterType.Coordinate, description: 'X格子坐标' },
      { name: 'y', type: ParameterType.Coordinate, description: 'Y格子坐标' },
      { name: 'tileType', type: ParameterType.TileType, description: '地砖类型' }
    ],
    (action?: string, xStr?: string, yStr?: string, tileType?: string) => {
      if (action !== 'set') {
        throw new Error(`未知操作: ${action}。可用: set`)
      }
      if (!xStr || !yStr || !tileType) {
        throw new Error('用法: /tile set <x> <y> <tileType>')
      }

      if (!VALID_TILE_TYPES.includes(tileType)) {
        throw new Error(`无效的地砖类型: ${tileType}。可选: ${VALID_TILE_TYPES.join(', ')}`)
      }

      const x = parseInt(xStr, 10)
      const y = parseInt(yStr, 10)
      if (isNaN(x) || isNaN(y)) {
        throw new Error(`无效的坐标: (${xStr}, ${yStr})`)
      }

      const maxGridX = Math.floor(GAME_WIDTH / TILE_SIZE)
      const maxGridY = Math.floor(GAME_HEIGHT / TILE_SIZE)
      if (x < 0 || x >= maxGridX || y < 0 || y >= maxGridY) {
        throw new Error(`坐标越界: (${x}, ${y})。有效范围: x=[0, ${maxGridX - 1}], y=[0, ${maxGridY - 1}]`)
      }

      tileMap.set(`${x},${y}`, tileType)

      // Trigger path recalculation
      const handler = _pathRecalcHandler
      if (handler) {
        handler()
      }

      return `已将 (${x}, ${y}) 设为 ${tileType}`
    }
  )
}
