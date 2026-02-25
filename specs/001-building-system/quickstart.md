# 快速入门：建筑系统 (Building System)

**目标读者**: 本项目开发者  
**日期**: 2026-02-25

---

## 核心概念速览

| 概念 | 文件位置（实现后） | 说明 |
|------|-----------------|------|
| 建筑定义 & 注册表 | `src/renderer/core/buildings/BuildingRegistry.ts` | 全局单例，存储所有 `BuildingDef` |
| 放置条件 | `src/renderer/core/buildings/PlacementConditions.ts` | 纯函数谓词，组合校验 |
| 物品存储 | `src/renderer/core/buildings/itemStorageStore.ts` | `Map<eid, ItemStorage>` |
| 建筑存储（已占格） | `src/renderer/core/buildings/buildingStore.ts` | `Map<eid, tile[]>` + 反向索引 |
| 钻机生产系统 | `src/renderer/core/systems/DrillProductionSystem.ts` | 每帧检查 `ProductionCooldown` |
| 建筑控制台命令 | `src/renderer/console/commands/buildingCommand.ts` | `/building list` 和 `/building info <id>` |
| 验证场景 | `src/renderer/ui/scenes/BuildingDemoScene.ts` | 含铜矿石地砖 + 钻机的演示场景 |

---

## 开发者快速上手（Feature 完成后）

### 1. 查询所有建筑（控制台）

启动游戏后按反引号 (`` ` ``) 打开控制台，输入：
```
/building list
```
输出示例：
```
已注册建筑 (2):
  tower    防御塔    1×1  不可旋转  无存储
  drill    钻机      2×2  不可旋转  有存储(20)
```

### 2. 查询建筑详情（控制台）

```
/building info drill
```
输出：
```
建筑: drill (钻机)
  占地: 2×2 格
  可旋转: 否
  放置条件: 需要至少一格 copper_ore 地砖 | 无建筑重叠 | 地图内
  物品存储: 容量 20
  生产: copper_ore / 5000ms
```

### 3. 放置铜矿石地砖（控制台）

```
/tile set 3 3 copper_ore
/tile set 3 4 copper_ore
/tile set 4 3 copper_ore
/tile set 4 4 copper_ore
```
地图上 (3,3)~(4,4) 的 2×2 区域将显示铜棕色矿石图案。

### 4. 放置钻机（控制台）

在矿石地砖上放置 2×2 钻机，锚点选 (3,3)：
```
/building place drill 3 3
```
成功响应：
```
已放置 钻机 于 (3, 3)
```
失败响应示例（无矿石）：
```
放置失败: 需要至少一格 copper_ore 地砖
```

### 5. 运行验证场景

切换到验证场景（实现后可通过命令或直接修改入口）：
```
/scene building-demo
```
场景将自动预置铜矿石地砖，可直接使用 `/building place` 放置钻机并观察产出。

---

## 在代码中使用建筑系统

### 注册新建筑类型

```typescript
import { buildingRegistry } from '../buildings/BuildingRegistry'
import { requiresAtLeastOneTileType, requiresNoOverlap, requiresInBounds } from '../buildings/PlacementConditions'

buildingRegistry.register({
  id: 'my_building',
  displayName: '我的建筑',
  size: { w: 1, h: 1 },
  rotatable: false,
  placementConditions: [requiresInBounds(GRID_W, GRID_H), requiresNoOverlap()],
})
```

### 放置建筑

```typescript
import { placeBuilding } from '../buildings/buildingSystem'

const result = placeBuilding(world, 'drill', 3, 3)
if (!result.ok) {
  console.warn('放置失败:', result.reason)
}
```

### 读取建筑物品存储

```typescript
import { getStorage } from '../buildings/itemStorageStore'

const storage = getStorage(drillEid)
// storage.items → [{ itemId: 'copper_ore', count: 5 }]
// storage.capacity → 20
```

---

## 单元测试注意事项

- `BuildingRegistry` 使用工厂函数 `createBuildingRegistry()` 创建隔离实例（避免单例污染）
- `PlacementConditions` 为纯函数，传入模拟 `tileMap` 和 `tileOccupancyIndex` 即可独立测试
- `DrillProductionSystem` 可通过模拟 `time` 参数控制时间推进
- 测试文件位于 `tests/unit/` 并以 `*.test.ts` 命名

---

## 关键常量参考

| 常量 | 值 | 位置 |
|------|-----|------|
| `TILE_SIZE` | `32`（像素） | `src/renderer/core/constants.ts` |
| `GRID_W` | `Math.floor(GAME_WIDTH / TILE_SIZE)` = 25 | 由 `constants.ts` 派生 |
| `GRID_H` | `Math.floor(GAME_HEIGHT / TILE_SIZE)` = 18 | 由 `constants.ts` 派生 |
| 钻机生产间隔 | `5000` ms（默认） | 建筑定义中 `productionInterval` |
| 钻机存储容量 | `20`（默认） | 建筑定义中 `storageCapacity` |

---

## 常见问题

**Q: 钻机放置后不产出矿石？**  
A: 确认 `drillProductionSystem(world, time)` 已在 `GameScene.update()` 或验证场景的 `update()` 中调用，并且传入的 `time` 是毫秒级单位（Phaser 的 `time` 参数即为毫秒）。

**Q: 控制台找不到 `building` 命令？**  
A: 确认 `registerBuildingCommand()` 已在场景的 `create()` 中调用，且调用时机在建筑注册完成之后。

**Q: 如何在不启动 Phaser 的情况下测试建筑放置逻辑？**  
A: `placeBuilding()` 和 `PlacementConditions` 均为纯 TypeScript，不依赖 Phaser。直接在 Vitest 单元测试中导入即可，无需模拟 Phaser 环境。
