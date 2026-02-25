import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerBuildingCommand } from '../../src/renderer/console/commands/buildingCommand'
import { commandRegistry } from '../../src/renderer/console/CommandRegistry'
import { buildingRegistry } from '../../src/renderer/core/buildings/BuildingRegistry'

describe('buildingCommand', () => {
  beforeEach(() => {
    // Clear registry before each test - access private map via any casting or just rely on overwrite
    ;(commandRegistry as any).commands.clear()
    
    // Mock BuildingRegistry
    vi.spyOn(buildingRegistry, 'getAll').mockReturnValue([])
    vi.spyOn(buildingRegistry, 'get').mockReturnValue(undefined)
    
    registerBuildingCommand()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should list registered buildings', () => {
    // Use getCommandDef instead of getCommand
    const listCmd = commandRegistry.getCommandDef('building')
    expect(listCmd).toBeDefined()
    
    const result = listCmd?.handler('list')
    expect(result).toContain('暂无已注册建筑')
    
    // Mock with data
    // Use any cast for compatibility with readonly array property
    const mockDefs: any[] = [
      { id: 'tower', displayName: 'Tower', size: { w: 1, h: 1 }, rotatable: false, placementConditions: [] }
    ]
    vi.spyOn(buildingRegistry, 'getAll').mockReturnValue(mockDefs)
    
    const resultWithData = listCmd?.handler('list')
    expect(resultWithData).toContain('tower')
    expect(resultWithData).toContain('Tower')
  })

  it('should show info for a specific building', () => {
    const infoCmd = commandRegistry.getCommandDef('building')
    
    // Mock get
    const drillDef: any = { 
      id: 'drill', 
      displayName: 'Drill', 
      size: { w: 2, h: 2 }, 
      rotatable: false, 
      placementConditions: [],
      storageCapacity: 20
    }
    vi.spyOn(buildingRegistry, 'get').mockImplementation((id) => id === 'drill' ? drillDef : undefined)
    
    const result = infoCmd?.handler('info', 'drill')
    expect(result).toContain('drill')
    expect(result).toContain('Drill')
    expect(result).toContain('2×2')
    expect(result).toContain('容量 20')
  })

  it('should return not found for unknown building info', () => {
    const infoCmd = commandRegistry.getCommandDef('building')
    const result = infoCmd?.handler('info', 'unknown')
    expect(result).toContain('未找到建筑: unknown')
  })

  it('should show usage error for missing info id', () => {
    const infoCmd = commandRegistry.getCommandDef('building')
    expect(() => infoCmd?.handler('info')).toThrowError(/用法/)
  })

  it('should show error for unknown action', () => {
    const cmd = commandRegistry.getCommandDef('building')
    expect(() => cmd?.handler('unknown')).toThrowError(/未知操作/)
  })
})
