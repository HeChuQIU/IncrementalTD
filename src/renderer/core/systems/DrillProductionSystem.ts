import { IWorld, defineQuery } from 'bitecs'
import { ProductionCooldown } from '../components'
import { getBuildingDefId } from '../buildings/buildingStore'
import { addItem } from '../buildings/itemStorageStore'
import { buildingRegistry } from '../buildings/BuildingRegistry'

const drillQuery = defineQuery([ProductionCooldown])

export function drillProductionSystem(world: IWorld, currentTime: number): void {
  const ents = drillQuery(world)
  
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]
    
    // Get components
    const interval = ProductionCooldown.interval[eid]
    const lastTime = ProductionCooldown.lastProductionTime[eid]
    
    // Check if time elapsed
    if (currentTime - lastTime >= interval) {
      const defId = getBuildingDefId(eid)
      if (!defId) continue // Should not happen for valid buildings
      
      const def = buildingRegistry.get(defId)
      if (!def || !def.productionItemId) continue // No production item defined
      
      // Try to produce
      const success = addItem(eid, def.productionItemId, 1)
      
      if (success) {
        // Update last production time
        // Option 1: Set to current time (drift slightly but safer)
        // Option 2: Add interval (precise but catches up)
        // Let's use current time for simplicity and avoiding catch-up loop complexity
        ProductionCooldown.lastProductionTime[eid] = currentTime
      } else {
        // Storage full - do not update time, so it tries again next frame
        // This effectively pauses production
      }
    }
  }
}
