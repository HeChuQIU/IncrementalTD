import { buildingRegistry } from './BuildingRegistry'
import { requiresAtLeastOneTileType, requiresInBounds, requiresNoOverlap } from './PlacementConditions'
import { GRID_W, GRID_H } from '../constants'

/**
 * Initializes default building definitions (tower, drill).
 * Call this once at game startup.
 */
export function initBuildings(): void {
  // Tower: 1x1, no production, no storage
  if (!buildingRegistry.get('tower')) {
    buildingRegistry.register({
      id: 'tower',
      displayName: '防御塔',
      size: { w: 1, h: 1 },
      rotatable: false,
      placementConditions: [
        requiresInBounds(GRID_W, GRID_H),
        requiresNoOverlap()
      ]
    })
  }

  // Drill: 2x2, produces copper_ore, requires copper_ore tile
  if (!buildingRegistry.get('drill')) {
    buildingRegistry.register({
      id: 'drill',
      displayName: '钻机',
      size: { w: 2, h: 2 },
      rotatable: false,
      storageCapacity: 20,
      productionInterval: 5000,
      productionItemId: 'copper_ore',
      placementConditions: [
        requiresInBounds(GRID_W, GRID_H),
        requiresNoOverlap(),
        requiresAtLeastOneTileType('copper_ore')
      ]
    })
  }
}
