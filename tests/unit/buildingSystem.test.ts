// Placeholder for tests/unit/placementConditions.test.ts to fix import errors in T011 if any
// This file is actually T010's test which we already created.
// We are implementing T011 now.

import { createBuilding, placeBuilding } from '../../src/renderer/core/buildings/buildingSystem'
import { buildingRegistry, BuildingDef } from '../../src/renderer/core/buildings/BuildingRegistry'
import { createWorld, IWorld } from 'bitecs'
import { describe, it, expect, beforeEach } from 'vitest'
import { BuildingTag, GridPosition, BuildingSize } from '../../src/renderer/core/components'
import { getBuildingDefId, getBuildingAtTile, clearBuildingOccupancy } from '../../src/renderer/core/buildings/buildingStore'

// Helper for resetting
function clearRegistry() {
  (buildingRegistry as any).definitions.clear()
}

describe('buildingSystem', () => {
  let world: IWorld
  
  const mockDef: BuildingDef = {
    id: 'test_drill',
    displayName: 'Test Drill',
    size: { w: 2, h: 2 },
    rotatable: false,
    placementConditions: [], // No conditions for basic create test
    storageCapacity: 100,
    productionInterval: 1000
  }

  beforeEach(() => {
    world = createWorld()
    clearRegistry()
    buildingRegistry.register(mockDef)
    // Clear building store
    // A bit hacky since we don't have a clearAll exposed, but we can clear specific IDs if we knew them.
    // Ideally we'd mock the store but for integration it's fine to rely on empty state if we assume isolation.
    // However, static maps persist across tests. We should clear them.
    // We'll rely on unique IDs or just clearing if possible.
    // For now, let's just test basic creation.
  })

  it('should create a building entity with correct components', () => {
    const eid = createBuilding(world, mockDef, 5, 5)
    
    expect(BuildingTag.marker[eid]).toBeDefined()
    expect(GridPosition.tileX[eid]).toBe(5)
    expect(GridPosition.tileY[eid]).toBe(5)
    expect(BuildingSize.w[eid]).toBe(2)
    expect(BuildingSize.h[eid]).toBe(2)
    
    expect(getBuildingDefId(eid)).toBe('test_drill')
    
    // Check occupancy
    expect(getBuildingAtTile(5, 5)).toBe(eid)
    expect(getBuildingAtTile(6, 5)).toBe(eid)
    expect(getBuildingAtTile(5, 6)).toBe(eid)
    expect(getBuildingAtTile(6, 6)).toBe(eid)
    
    clearBuildingOccupancy(eid)
  })

  it('placeBuilding should fail if custom condition fails', () => {
    const alwaysFail = () => ({ ok: false, reason: 'Fail' })
    const defWithCond = { ...mockDef, id: 'cond_fail', placementConditions: [alwaysFail] }
    buildingRegistry.register(defWithCond)
    
    const result = placeBuilding(world, 'cond_fail', 0, 0)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('Fail')
  })
})
