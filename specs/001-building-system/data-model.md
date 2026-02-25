# 数据模型：建筑系统 (Building System)

**所属**: `specs/001-building-system/`  
**日期**: 2026-02-25  
**依赖**: [research.md](./research.md)

---

## 实体与组件设计

### 1. bitECS typed array 组件（新增）

这些组件存储可直接映射为标量的数据，适合 ECS 热路径查询。

```
BuildingTag { marker: ui8 }
  └─ 标记一个实体为建筑，不携带额外数据

GridPosition { tileX: i16, tileY: i16 }
  └─ 建筑左上角的格子坐标（而非像素坐标）
     tileX, tileY ∈ [0, mapWidth/Height - 1]

BuildingSize { w: i8, h: i8 }
  └─ 建筑占地格数，最大 127×127
     防御塔: w=1, h=1 | 钻机: w=2, h=2

Rotation { value: ui8 }
  └─ 旋转步数：0=0°, 1=90°, 2=180°, 3=270°
     非 rotatable 建筑固定为 0

DrillTag { marker: ui8 }
  └─ 标记需要执行生产系统的建筑实体

ProductionCooldown { interval: f32, lastProductionTime: f32 }
  └─ 生产周期（ms）和上次产出时间（ms）
     与现有 AttackCooldown 结构同构
```

### 2. 外部数据存储（buildingStore.ts）

复杂的可变长度数据通过 `Map<eid, ...>` 存储，与 `pathStore.ts` 模式一致。

```
buildingDefIdData: Map<eid, string>
  └─ 建筑实体 eid → 建筑类型字符串 ID（如 'drill'、'tower'）
     外部所有访问注册表的操作均通过此 Map 取得字符串 ID，再查注册表
     例：buildingRegistry.get(buildingDefIdData.get(eid)!)

occupiedTilesData: Map<eid, Array<{ tx: number; ty: number }>>
  └─ 建筑实际占据的所有格子（含左上角锚点以外的格子）
     2×2 钻机示例: [{tx:1,ty:1},{tx:2,ty:1},{tx:1,ty:2},{tx:2,ty:2}]

tileOccupancyIndex: Map<"tx,ty", eid>
  └─ 反向索引：格子字符串 → 占用该格的建筑 eid
     用于 O(1) 的放置冲突检测和格子查询
```

### 3. 物品存储（itemStorageStore.ts）

```
ItemStack {
  itemId: string    // 如 'copper_ore'
  count: number     // ≥ 0
}

ItemStorage {
  capacity: number        // 最大存储数量（单位：物品总数）
  items: ItemStack[]      // 当前存储的所有物品堆叠
}

storageData: Map<eid, ItemStorage>
  └─ 建筑实体 eid → 其内部物品存储
     无存储的建筑（如防御塔）不会有对应条目
```

### 4. 建筑注册表（BuildingRegistry）

注册表是静态元数据仓库，不参与每帧 ECS tick。

```
PlacementCondition: (tx: number, ty: number, def: BuildingDef) => PlacementResult

PlacementResult {
  ok: boolean
  reason?: string   // 仅在 ok=false 时提供
}

BuildingDef (冻结，不可变) {
  id: string                          // 唯一标识，如 'drill'
  displayName: string                 // 中文显示名，如 '钻机'
  size: { w: number; h: number }      // 占地格数
  rotatable: boolean
  placementConditions: PlacementCondition[]
  storageCapacity?: number            // undefined = 无存储
  productionInterval?: number         // undefined = 非生产建筑 (ms)
  productionItemId?: string           // 生产物品 ID，如 'copper_ore'
}

BuildingRegistry {
  register(def: BuildingDef): void        // 重复注册抛出错误
  get(id: string): BuildingDef | undefined
  getAll(): ReadonlyArray<BuildingDef>
}
```

### 5. 地砖类型扩展

在现有 `tileMap: Map<string, string>` 中新增值 `'copper_ore'`。

```
tileMap key: "tx,ty"（tx、ty 均为整数格子坐标）
tileMap value: 'empty' | 'wall' | 'path' | 'copper_ore'

铜矿石地砖：
  - tileMap.set("tx,ty", 'copper_ore') → 标记为矿石格
  - tileMap 中的矿石键值对永远不会被删除或修改（不枯竭）
  - 放置条件函数通过 tileMap 读取地砖类型进行校验
```

---

## 实体生命周期

### 建筑实体创建

```
createBuilding(world, def, anchorTx, anchorTy, rotation?) → eid

  1. addEntity(world)
  2. addComponent: BuildingTag, GridPosition, BuildingSize
  3. 若 def.rotatable: addComponent Rotation
  4. 若 def.storageCapacity: initStorage(eid, def.storageCapacity)
  5. 若 def.productionInterval: addComponent DrillTag, ProductionCooldown
  6. 计算占地格子集 → 写入 occupiedTilesData + tileOccupancyIndex
  7. 写入 buildingDefIdData.set(eid, def.id)   // 字符串键，供外部查注册表
  8. 返回 eid
```

### 放置校验流程

```
placeBuilding(world, defId, anchorTx, anchorTy, rotation?) → PlacementResult

  1. 查找 BuildingDef（未找到 → 错误）
  2. 取实际宽高（含旋转）
  3. 运行 checkPlacement(anchorTx, anchorTy, def)
     ├─ requiresInBounds: 确认所有格子在地图内
     ├─ requiresNoOverlap: 确认无占用冲突
     └─ 自定义条件（如 requiresAtLeastOneTileType('copper_ore')）
  4. 全部通过 → createBuilding(...) → { ok: true, eid }
  5. 任一失败 → { ok: false, reason: ... }
```

### 建筑实体销毁（预留，不在本次实现范围）

```
destroyBuilding(world, eid)
  1. 清理 buildingDefIdData
  2. 清理 occupiedTilesData + tileOccupancyIndex
  3. 清理 storageData（若有）
  4. removeEntity(world, eid)
```

---

## 状态转换图

```
建筑实体状态:

  [NOT_PLACED]
       │ placeBuilding() 通过所有放置条件
       ▼
  [ACTIVE]
       │ （非生产建筑，如Tower）
       │ 静止，等待外部系统（如 TowerAttackSystem）驱动
       │
       │ （生产建筑，如Drill）
       ├─── ProductionCooldown 计时到期 ──► addItem() 成功 ──► [ACTIVE]（继续）
       └─── ProductionCooldown 计时到期 ──► addItem() 失败（满仓）──► [PAUSED]
                                                   │
                              存储有空间（外部取走物品）
                                                   │
                     下一帧重试 addItem() 成功 ────► [ACTIVE]
```

---

## 验证约束

| 约束 | 规则 |
|------|------|
| 格子坐标范围 | 0 ≤ tx < mapWidth（格数），0 ≤ ty < mapHeight（格数） |
| 钻机占地 | 始终 2×2（不可旋转） |
| 钻机放置条件 | anchorTx~anchorTx+1、anchorTy~anchorTy+1 中至少一格类型为 `copper_ore` |
| 物品存储容量 | 钻机默认 `storageCapacity = 20` |
| 生产间隔 | 钻机默认 `productionInterval = 5000`（5 秒/个，实现阶段可调） |
| 矿石地砖持久性 | tileMap 中 `copper_ore` 条目不受任何采矿操作修改 |
| 注册表唯一性 | `buildingRegistry.register()` 对重复 id 抛出 Error |
| 类型安全 | 所有模块 strict TypeScript，禁用 `any` |
