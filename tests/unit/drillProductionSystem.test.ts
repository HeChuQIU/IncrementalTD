import { describe, it, expect, beforeEach } from 'vitest'
import { createWorld, IWorld, addComponent, addEntity } from 'bitecs'
import { drillProductionSystem } from '../../src/renderer/core/systems/DrillProductionSystem'
import { DrillTag, ProductionCooldown } from '../../src/renderer/core/components'
import { initStorage, getStorage, addItem } from '../../src/renderer/core/buildings/itemStorageStore'
import { setBuildingDefId, buildingDefIdData } from '../../src/renderer/core/buildings/buildingStore'
import { buildingRegistry } from '../../src/renderer/core/buildings/BuildingRegistry'

describe('DrillProductionSystem', () => {
  let world: IWorld
  
  beforeEach(() => {
    world = createWorld()
    buildingDefIdData.clear()
    
    // Mock definition
    if (!buildingRegistry.get('test_drill')) {
      buildingRegistry.register({
        id: 'test_drill',
        displayName: 'Test Drill',
        size: { w: 2, h: 2 },
        rotatable: false,
        placementConditions: [],
        storageCapacity: 10,
        productionInterval: 1000,
        productionItemId: 'copper_ore'
      })
    }
  })

  it('should produce item when cooldown elapsed', () => {
    const eid = addEntity(world)
    addComponent(world, DrillTag, eid)
    addComponent(world, ProductionCooldown, eid)
    ProductionCooldown.interval[eid] = 1000
    ProductionCooldown.lastProductionTime[eid] = 0
    
    setBuildingDefId(eid, 'test_drill')
    initStorage(eid, 10)
    
    // Time: 1001ms
    drillProductionSystem(world, 1001)
    
    const storage = getStorage(eid)
    expect(storage?.items[0]).toEqual({ itemId: 'copper_ore', count: 1 })
    expect(ProductionCooldown.lastProductionTime[eid]).toBe(1001)
  })

  it('should not produce item when cooldown not elapsed', () => {
    const eid = addEntity(world)
    addComponent(world, DrillTag, eid)
    addComponent(world, ProductionCooldown, eid)
    ProductionCooldown.interval[eid] = 1000
    ProductionCooldown.lastProductionTime[eid] = 0
    
    setBuildingDefId(eid, 'test_drill')
    initStorage(eid, 10)
    
    // Time: 500ms
    drillProductionSystem(world, 500)
    
    const storage = getStorage(eid)
    expect(storage?.items.length).toBe(0)
    expect(ProductionCooldown.lastProductionTime[eid]).toBe(0)
  })

  it('should not produce if storage full', () => {
    const eid = addEntity(world)
    addComponent(world, DrillTag, eid)
    addComponent(world, ProductionCooldown, eid)
    ProductionCooldown.interval[eid] = 1000
    ProductionCooldown.lastProductionTime[eid] = 0
    
    setBuildingDefId(eid, 'test_drill')
    initStorage(eid, 2)
    addItem(eid, 'copper_ore', 2) // Full now
    
    drillProductionSystem(world, 1001)
    
    const storage = getStorage(eid)
    expect(storage?.items[0].count).toBe(2)
    // Last production time should NOT update if failed? 
    // Spec says: "满仓暂停（addItem 返回 false 时不更新 lastProductionTime）"
    expect(ProductionCooldown.lastProductionTime[eid]).toBe(0)
  })

  it('should handle multiple drills independently', () => {
    const d1 = addEntity(world)
    addComponent(world, DrillTag, d1)
    addComponent(world, ProductionCooldown, d1)
    ProductionCooldown.interval[d1] = 1000
    ProductionCooldown.lastProductionTime[d1] = 0
    setBuildingDefId(d1, 'test_drill')
    initStorage(d1, 10)

    const d2 = addEntity(world)
    addComponent(world, DrillTag, d2)
    addComponent(world, ProductionCooldown, d2)
    ProductionCooldown.interval[d2] = 2000
    ProductionCooldown.lastProductionTime[d2] = 0
    setBuildingDefId(d2, 'test_drill')
    initStorage(d2, 10)
    
    // Time 1500: d1 should produce, d2 not
    drillProductionSystem(world, 1500)
    
    expect(getStorage(d1)?.items[0].count).toBe(1)
    expect(getStorage(d2)?.items.length).toBe(0)
  })
})
