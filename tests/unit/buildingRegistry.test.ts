import { describe, it, expect, beforeEach } from 'vitest'
import { createBuildingRegistry } from '../../src/renderer/core/buildings/BuildingRegistry'

describe('BuildingRegistry', () => {
  let registry: ReturnType<typeof createBuildingRegistry>

  beforeEach(() => {
    registry = createBuildingRegistry()
  })

  it('should register and get a building definition', () => {
    const def = {
      id: 'test_building',
      displayName: 'Test Building',
      size: { w: 1, h: 1 },
      rotatable: false,
      placementConditions: []
    }
    registry.register(def)
    
    const retrieved = registry.get('test_building')
    expect(retrieved).toEqual(def)
    expect(Object.isFrozen(retrieved)).toBe(true)
  })

  it('should throw error when registering duplicate id', () => {
    const def = {
      id: 'test_building',
      displayName: 'Test Building',
      size: { w: 1, h: 1 },
      rotatable: false,
      placementConditions: []
    }
    registry.register(def)
    
    expect(() => registry.register(def)).toThrowError(/already registered/)
  })

  it('should return undefined for non-existent id', () => {
    expect(registry.get('unknown')).toBeUndefined()
  })

  it('should return all registered definitions', () => {
    const def1 = {
      id: 'b1',
      displayName: 'B1',
      size: { w: 1, h: 1 },
      rotatable: false,
      placementConditions: []
    }
    const def2 = {
      id: 'b2',
      displayName: 'B2',
      size: { w: 2, h: 2 },
      rotatable: true,
      placementConditions: []
    }
    
    registry.register(def1)
    registry.register(def2)
    
    const all = registry.getAll()
    expect(all).toHaveLength(2)
    expect(all).toContainEqual(def1)
    expect(all).toContainEqual(def2)
  })
})
