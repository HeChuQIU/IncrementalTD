import { commandRegistry } from '../CommandRegistry'
import { completionEngine } from '../CompletionEngine'
import { ParameterType } from '../types'
import { buildingRegistry } from '../../core/buildings/BuildingRegistry'
import { placeBuilding } from '../../core/buildings/buildingSystem'
import { getTileAt } from './tileCommand'

// Need ECS world access for placement
let _worldAccessor: (() => any) | null = null

export function setWorldAccessor(accessor: () => any): void {
  _worldAccessor = accessor
}

export function registerBuildingCommand(): void {
  // Update completion values for BuildingId from the registry
  const allIds = buildingRegistry.getAll().map(def => def.id)
  
  // Note: ParameterType.BuildingId value is just 'BuildingId'
  // But completionEngine registerTypeValues expects the type string used in checks
  completionEngine.registerTypeValues(ParameterType.BuildingId, allIds)

  commandRegistry.registerCommand(
    'building',
    [
      { name: 'action', type: ParameterType.Command, description: '操作 (list, info, place)' },
      { name: 'arg1', type: ParameterType.BuildingId, description: 'ID' },
      { name: 'arg2', type: ParameterType.Coordinate, description: 'X (针对 place)' },
      { name: 'arg3', type: ParameterType.Coordinate, description: 'Y (针对 place)' }
    ],
    (action?: string, arg1?: string, arg2?: string, arg3?: string) => {
      // 1. Validate action
      if (!action) {
        throw new Error('用法: /building <action> [args...]')
      }

      const lowerAction = action.toLowerCase()

      if (lowerAction === 'list') {
        const result = handleList()
        return result
      } else if (lowerAction === 'info') {
        const id = arg1
        if (!id) {
          throw new Error('用法: /building info <id>')
        }
        return handleInfo(id)
      } else if (lowerAction === 'place') {
        // /building place <id> <x> <y>
        const id = arg1
        const xStr = arg2
        const yStr = arg3
        
        if (!id || !xStr || !yStr) {
          throw new Error('用法: /building place <id> <x> <y>')
        }
        
        const x = parseInt(xStr, 10)
        const y = parseInt(yStr, 10)
        
        if (isNaN(x) || isNaN(y)) {
           throw new Error(`无效坐标: ${xStr}, ${yStr}`)
        }

        if (!_worldAccessor) {
          throw new Error('系统错误: ECS World 未连接到控制台命令')
        }
        
        const world = _worldAccessor()
        return handlePlace(world, id, x, y)
      } else {
        throw new Error(`未知操作: ${action}。可用: list, info, place`)
      }
    }
  )
}

function handlePlace(world: any, id: string, x: number, y: number): string {
  // Pass getTileAt for conditions that need tile type checking
  const result = placeBuilding(world, id, x, y, 0, getTileAt)
  
  if (result.ok) {
    const def = buildingRegistry.get(id)
    const name = def ? def.displayName : id
    return `已放置 ${name} 于 (${x}, ${y})`
  } else {
    throw new Error(`放置失败: ${result.reason}`)
  }
}

function handleList(): string {
  const defs = buildingRegistry.getAll()
  if (defs.length === 0) {
    return '暂无已注册建筑。'
  }

  const lines = [`已注册建筑 (${defs.length}):`]
  
  for (const def of defs) {
    const rot = def.rotatable ? '可旋转' : '不可旋转'
    const store = def.storageCapacity ? `有存储(${def.storageCapacity})` : '无存储'
    // Format columns: id (8) | name (6) | size (4) | rot | store
    const id = def.id.padEnd(8)
    const name = def.displayName.padEnd(6)
    const size = `${def.size.w}×${def.size.h}`.padEnd(4)
    
    lines.push(`  ${id} ${name} ${size}  ${rot}  ${store}`)
  }
  return lines.join('\n')
}

function handleInfo(id: string): string {
  const def = buildingRegistry.get(id)
  if (!def) {
    return `未找到建筑: ${id}`
  }

  const lines = [`建筑: ${def.id} (${def.displayName})`]
  lines.push(`  占地: ${def.size.w}×${def.size.h} 格`)
  lines.push(`  可旋转: ${def.rotatable ? '是' : '否'}`)
  
  // Condition descriptions
  const conditions: string[] = []
  if (def.id === 'drill') {
    conditions.push('需要至少一格 copper_ore 地砖', '无建筑重叠', '地图内')
  } else if (def.id === 'tower') {
    conditions.push('无建筑重叠', '地图内')
  } else {
    // Generic fallback for unknown types
    if (def.placementConditions.length > 0) {
      conditions.push('包含放置限制 (自定义条件)')
    } else {
      conditions.push('无特殊限制')
    }
  }
  
  if (conditions.length > 0) {
    lines.push(`  放置条件: ${conditions.join(' | ')}`)
  }

  if (def.storageCapacity) {
    lines.push(`  物品存储: 容量 ${def.storageCapacity}`)
  }

  if (def.productionInterval && def.productionItemId) {
    lines.push(`  生产: ${def.productionItemId} / ${def.productionInterval}ms`)
  }

  return lines.join('\n')
}
