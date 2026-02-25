import { describe, it, expect, beforeEach } from 'vitest'
import { requiresInBounds, requiresNoOverlap, requiresAtLeastOneTileType, checkPlacement } from '../../src/renderer/core/buildings/PlacementConditions'
import { BuildingDef } from '../../src/renderer/core/buildings/BuildingRegistry'
import { clearBuildingOccupancy, setBuildingOccupancy } from '../../src/renderer/core/buildings/buildingStore'

describe('PlacementConditions', () => {
  const mockDef: BuildingDef = {
    id: 'test_building',
    displayName: 'Test',
    size: { w: 2, h: 2 },
    rotatable: false,
    placementConditions: []
  }

  beforeEach(() => {
    clearBuildingOccupancy(1)
    clearBuildingOccupancy(2)
  })

  describe('requiresInBounds', () => {
    const condition = requiresInBounds(10, 10)

    it('should allow placement within bounds', () => {
      const result = condition(0, 0, mockDef)
      expect(result.ok).toBe(true)
      
      const result2 = condition(8, 8, mockDef)
      expect(result2.ok).toBe(true)
    })

    it('should reject placement out of bounds', () => {
      const result = condition(-1, 0, mockDef)
      expect(result.ok).toBe(false)
      expect(result.reason).toMatch(/越界/)
      
      const result2 = condition(9, 9, mockDef) // 9+2=11 > 10
      expect(result2.ok).toBe(false)
      expect(result2.reason).toMatch(/越界|超出地图边界/)
    })
  })

  describe('requiresNoOverlap', () => {
    const condition = requiresNoOverlap()

    it('should allow placement when no overlap', () => {
      const result = condition(0, 0, mockDef)
      expect(result.ok).toBe(true)
    })

    it('should reject placement when overlapping with existing building', () => {
      setBuildingOccupancy(1, [{ tx: 1, ty: 1 }])
      
      const result = condition(0, 0, mockDef) // covers (0,0) to (1,1)
      expect(result.ok).toBe(false)
      expect(result.reason).toMatch(/重叠/)
    })
  })

  describe('requiresAtLeastOneTileType', () => {
    const condition = requiresAtLeastOneTileType('copper_ore')
    
    // Mock tileMap getter
    const mockTileMap = new Map<string, string>()
    const mockGetTileAt = (tx: number, ty: number) => mockTileMap.get(`${tx},${ty}`) ?? 'empty'

    it('should allow placement when at least one tile matches', () => {
      mockTileMap.set('1,1', 'copper_ore')
      const result = condition(0, 0, mockDef, mockGetTileAt)
      expect(result.ok).toBe(true)
    })

    it('should reject placement when no tiles match', () => {
      mockTileMap.clear()
      const result = condition(0, 0, mockDef, mockGetTileAt)
      expect(result.ok).toBe(false)
      expect(result.reason).toMatch(/需要至少一格 copper_ore 地砖/)
    })
  })

  describe('checkPlacement', () => {
    it('should return ok if all conditions pass', () => {
      const defWithConditions: BuildingDef = {
        ...mockDef,
        placementConditions: [
          requiresInBounds(10, 10),
          requiresNoOverlap()
        ]
      }
      
      const result = checkPlacement(0, 0, defWithConditions)
      expect(result.ok).toBe(true)
    })

    it('should return first failure reason if any condition fails', () => {
      const defWithConditions: BuildingDef = {
        ...mockDef,
        placementConditions: [
          requiresInBounds(10, 10),
          requiresNoOverlap()
        ]
      }
      
      const result = checkPlacement(9, 9, defWithConditions)
      expect(result.ok).toBe(false)
      expect(result.reason).toMatch(/越界|超出地图边界/)
    })
  })
})
