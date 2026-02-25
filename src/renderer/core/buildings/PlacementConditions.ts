import { BuildingDef, PlacementCondition, PlacementResult } from './BuildingRegistry'
import { getBuildingAtTile } from './buildingStore'

// Helper to get all occupied tiles based on anchor position and size (no rotation for now)
function getCoveredTiles(tx: number, ty: number, w: number, h: number): Array<{ x: number, y: number }> {
  const tiles: Array<{ x: number, y: number }> = []
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      tiles.push({ x: tx + x, y: ty + y })
    }
  }
  return tiles
}

export const requiresInBounds = (gridW: number, gridH: number): PlacementCondition => {
  return (tx, ty, def): PlacementResult => {
    // Check main anchor
    if (tx < 0 || ty < 0 || tx >= gridW || ty >= gridH) {
      return { ok: false, reason: `锚点 (${tx}, ${ty}) 越界` }
    }
    
    // Check full footprint
    if (tx + def.size.w > gridW || ty + def.size.h > gridH) {
       return { ok: false, reason: `建筑范围超出地图边界` }
    }

    return { ok: true }
  }
}

export const requiresNoOverlap = (): PlacementCondition => {
  return (tx, ty, def): PlacementResult => {
    const tiles = getCoveredTiles(tx, ty, def.size.w, def.size.h)
    
    for (const tile of tiles) {
      if (getBuildingAtTile(tile.x, tile.y) !== undefined) {
        return { ok: false, reason: `位置 (${tile.x}, ${tile.y}) 已有建筑重叠` }
      }
    }
    return { ok: true }
  }
}

export const requiresAtLeastOneTileType = (requiredType: string): PlacementCondition => {
  return (tx, ty, def, getTileAt): PlacementResult => {
    if (!getTileAt) return { ok: true } // Cannot verify without map access

    const tiles = getCoveredTiles(tx, ty, def.size.w, def.size.h)
    let found = false
    
    for (const tile of tiles) {
      if (getTileAt(tile.x, tile.y) === requiredType) {
        found = true
        break
      }
    }
    
    if (!found) {
      return { ok: false, reason: `需要至少一格 ${requiredType} 地砖` }
    }
    return { ok: true }
  }
}

export function checkPlacement(
  tx: number, 
  ty: number, 
  def: BuildingDef, 
  getTileAt?: (tx: number, ty: number) => string
): PlacementResult {
  for (const condition of def.placementConditions) {
    const result = condition(tx, ty, def, getTileAt)
    if (!result.ok) {
      return result
    }
  }
  return { ok: true }
}
