import { IWorld, addEntity, addComponent } from 'bitecs'
import { BuildingDef, PlacementResult } from './BuildingRegistry'
import { buildingRegistry } from './BuildingRegistry'
import { checkPlacement } from './PlacementConditions'
import { GridPosition, BuildingSize, Rotation, DrillTag, ProductionCooldown, BuildingTag } from '../components'
import { setBuildingOccupancy, setBuildingDefId } from './buildingStore'
import { initStorage } from './itemStorageStore'

/**
 * Creates a building entity in the ECS world.
 * Does NOT perform placement checks (assumed already valid).
 */
export function createBuilding(
  world: IWorld, 
  def: BuildingDef, 
  anchorTx: number, 
  anchorTy: number, 
  rotationIndex: number = 0
): number {
  const eid = addEntity(world)
  
  // Basic components
  addComponent(world, BuildingTag, eid)
  addComponent(world, GridPosition, eid)
  GridPosition.tileX[eid] = anchorTx
  GridPosition.tileY[eid] = anchorTy
  
  addComponent(world, BuildingSize, eid)
  BuildingSize.w[eid] = def.size.w
  BuildingSize.h[eid] = def.size.h

  // Optional components
  if (def.rotatable) {
    addComponent(world, Rotation, eid)
    Rotation.value[eid] = rotationIndex
  }
  
  if (def.storageCapacity) {
    initStorage(eid, def.storageCapacity)
  }

  if (def.productionInterval) {
    addComponent(world, DrillTag, eid)
    addComponent(world, ProductionCooldown, eid)
    ProductionCooldown.interval[eid] = def.productionInterval
    ProductionCooldown.lastProductionTime[eid] = 0
  }

  // Register in external stores
  setBuildingDefId(eid, def.id)
  
  // Calculate covered tiles (rotation not implemented for now, assume w/h as is)
  const coveredTiles: { tx: number, ty: number }[] = []
  for (let x = 0; x < def.size.w; x++) {
    for (let y = 0; y < def.size.h; y++) {
      coveredTiles.push({ tx: anchorTx + x, ty: anchorTy + y })
    }
  }
  setBuildingOccupancy(eid, coveredTiles)
  
  return eid
}

/**
 * Attempts to place a building at the specified coordinates.
 * Validates all conditions before creation.
 */
export function placeBuilding(
  world: IWorld, 
  defId: string, 
  anchorTx: number, 
  anchorTy: number, 
  rotationIndex: number = 0,
  getTileAt?: (tx: number, ty: number) => string
): PlacementResult & { eid?: number } {
  const def = buildingRegistry.get(defId)
  if (!def) {
    return { ok: false, reason: `Unknown building ID: ${defId}` }
  }

  const check = checkPlacement(anchorTx, anchorTy, def, getTileAt)
  if (!check.ok) {
    return check
  }

  const eid = createBuilding(world, def, anchorTx, anchorTy, rotationIndex)
  return { ok: true, eid }
}
