# 研究报告：建筑系统 (Building System)

**所属**: `specs/001-building-system/`  
**日期**: 2026-02-25  
**状态**: 完成，所有 NEEDS CLARIFICATION 已解决

---

## 1. bitECS 中建筑与地砖网格的数据分层

**决策**: 标量/整数数据（锚点坐标、尺寸、旋转、类型 ID、生产计时）放入 bitECS typed arrays；可变长度的嵌套结构（已占用格子列表、物品存储）放入外部 `Map<eid, ...>`，与现有 `pathStore.ts` 模式一致。

**理由**:
- bitECS typed arrays 只能存 `Int8/Uint8/Int16/Uint16/Int32/Float32/Float64` 等标量；嵌套对象和可变长数组无法直接存入
- 项目已有成熟先例：`pathData = new Map<number, Array<{x,y}>>()` 存敌人路径点，`tileMap = new Map<string, string>()` 存地砖类型
- 热路径系统查询只需 typed arrays，冷路径（放置校验、存储更新）走外部 Map

**适入 typed arrays 的组件**:

| 组件 | 字段 | 类型 | 说明 |
|------|------|------|------|
| `GridPosition` | `tileX`, `tileY` | `i16` | 建筑左上角格子坐标 |
| `BuildingSize` | `w`, `h` | `i8` | 占地格数（≤127） |
| `BuildingTypeId` | `value` | `ui8` | 索引进注册表（最多 255 种） |
| `Rotation` | `value` | `ui8` | 0/1/2/3 = 0°/90°/180°/270° |
| `ProductionCooldown` | `interval`, `lastProductionTime` | `f32` | 与 `AttackCooldown` 同构 |
| `BuildingTag` | `marker` | `ui8` | 标记建筑实体 |
| `DrillTag` | `marker` | `ui8` | 标记钻机实体 |

**存入外部 Map 的数据**:

| 数据 | 存储位置 | 说明 |
|------|---------|------|
| 已占用格子列表 | `Map<eid, {tx,ty}[]>` + `Map<"tx,ty", eid>` 反向索引 | 多格建筑占地，快速冲突检测 |
| 物品存储 (`ItemStack[]`) | `Map<eid, ItemStorage>` | 嵌套对象，容量 + 当前物品 |

**备选方案（已否决）**: 将所有建筑数据存入单一外部 Map — 放弃了 bitECS 的查询性能优势，与项目现有 ECS 范式不符。

---

## 2. 建筑注册表模式

**决策**: 单例 + `Map<string, BuildingDef>` + `Object.freeze()` 冻结定义；同时导出工厂函数 `createBuildingRegistry()` 供单元测试使用隔离实例。

**理由**:
- 单例模式使注册表在初始化模块中集中管理，与 `commandRegistry`（已用单例）保持一致
- `Object.freeze()` 防止运行时意外突变定义（项目宪法要求不可变性）
- 工厂函数方便测试：测试无需 mock 全局单例，直接创建独立实例

**接口设计**:
```typescript
interface BuildingDef {
  readonly id: string               // 唯一标识，如 'drill'
  readonly displayName: string      // 显示名，如 '钻机'
  readonly size: { w: number; h: number }  // 占地格数
  readonly rotatable: boolean
  readonly placementConditions: PlacementCondition[]
  readonly storageCapacity?: number // undefined = 无存储
  readonly productionInterval?: number  // undefined = 非生产建筑; ms
  readonly productionItemId?: string
}
```

**备选方案（已否决）**: 使用 TypeScript `enum` 或数字 ID 标识建筑类型 — 可读性差，调试不友好；字符串 ID 在控制台命令中也更易使用。

---

## 3. 放置条件（Placement Condition）模式

**决策**: 函数式谓词 `(tx, ty, def) => { ok: boolean; reason?: string }`；内置多个条件构造器；通过 `checkPlacement()` 组合运行所有条件，第一个失败即返回。

**理由**:
- 函数式谓词完全可组合，无继承层级（符合项目函数式编程宪法要求）
- 纯函数便于单元测试（传入模拟地砖数据即可）
- 钻机的复合条件（地图边界 + 无重叠 + 有矿石地砖）可直接组合三个独立条件

**内置条件构造器**:

| 构造器 | 检查内容 |
|--------|---------|
| `requiresInBounds(mapW, mapH)` | 所有格子在地图范围内 |
| `requiresNoOverlap()` | 目标格子未被其他建筑占用 |
| `requiresAtLeastOneTileType(type)` | 至少一格地砖类型匹配 |

**备选方案（已否决）**: OOP `interface IPlacementCondition { check(): boolean }` — 增加了无谓的类层级，函数式足够表达需求。

---

## 4. 物品存储模式

**决策**: 完全在外部 `Map<eid, ItemStorage>` 中管理；`ItemStorage` 包含 `capacity: number` 和 `items: ItemStack[]`（`ItemStack = { itemId: string; count: number }`）；满仓时 `addItem()` 返回 `false`，生产系统自动跳过。

**理由**:
- 嵌套对象结构无法进 typed arrays（与 `pathStore.ts` 同构处理原则）
- 每帧只有少量建筑需要更新存储，外部 Map 查询开销可忽略
- 简单的 `{ capacity, items }` 结构符合"避免过度工程化"的宪法要求

**满仓暂停机制**: 生产系统在调用 `addItem()` 前检查返回值；若返回 `false`，不更新 `lastProductionTime`，下一帧仍会重试。如此实现"满仓暂停，有空间自动恢复"，无需额外状态标志。

**备选方案（已否决）**: 将 `StorageCount` 作为 typed array 存入 bitECS — 只能存整数，无法表示物品种类；与物品系统的扩展性不符。

---

## 5. 矿石地砖扩展策略

**决策**: 在现有 `tileCommand.ts` 的 `VALID_TILE_TYPES` 数组中添加 `'copper_ore'`；在 `tileMap` 中以 `"tx,ty" -> 'copper_ore'` 存储；放置条件读取 `tileMap` 检查矿石类型；地砖状态永远不被修改（满足"不枯竭"要求）。

**理由**:
- 扩展现有 `tileMap`（`Map<string, string>`）零额外数据结构
- "不枯竭"只需约定：采矿系统只读不写 `tileMap`，既简单又可靠
- 铜矿石颜色使用 `0xB87333`（铜棕色），在深色背景下辨识度高

**矿石地砖视觉渲染**: 静态 `Graphics` 对象，在 `create()` 时一次性绘制，不参与每帧循环（符合性能要求）。

---

## 6. Phaser 3 调试渲染模式

**决策**: 建筑渲染使用 `Phaser.GameObjects.Container`（与现有 `enemySprites` 的 Container 模式一致），内含：
1. `Graphics` 对象：背景填充（半透明深灰）+ 边框（灰色边框线）
2. 静态 `Text` 对象：显示建筑名（白色，10px）
3. 动态 `Text` 对象：显示状态/存储量（金色，9px），每帧调用 `setText()` 更新

**理由**:
- Container 提供统一的位置管理和销毁；`container.destroy()` 自动清理所有子物体
- Phaser 的 `Text.setText()` 仅在内容变化时重新光栅化，每帧调用性能安全
- 与现有 `_buildEnemySprite` 模式保持代码风格统一，降低学习成本

**渲染层次（深度从低到高）**:
```
background → gridGfx → ore tiles (静态Graphics) → building containers → enemy containers → HUD
```

**备选方案（已否决）**: 使用 Phaser 的 `BitmapText` — 需要预先生成字体纹理，对中文支持复杂；`Text` 对象直接支持中文且无需额外资源。

---

## 7. 控制台命令设计（建筑查询）

**决策**: 新增 `building` 命令，支持两个子命令：
- `building list` — 列出所有已注册建筑
- `building info <id>` — 查询指定建筑详情

**理由**:
- 与现有命令风格一致（`tile set`、`spawn enemy`）：`<command> <action> [<arg>]`
- 只读查询，不修改游戏状态，实现简单、安全
- 在控制台内完成"未找到"时的友好提示（符合 FR-004、US1）

**备选方案（已否决）**: 分别注册 `building-list` 和 `building-info` 两个命令 — 命令过多，子命令风格更简洁。

---

## 8. 防御塔纳入建筑系统的策略

**决策**: 以"非侵入"方式接入：在 `BuildingRegistry` 中注册 `tower`（防御塔）定义（1×1，不可旋转，无存储，无放置条件）；现有 `createTower()` 函数不修改；在初始化时额外调用 `buildingRegistry.register(towerDef)` 即可。用于 US3（防御塔在注册表可查询）同时保证 SC-005（零回归）。

**理由**:
- 最小改动原则：不修改已有 ECS 组件和系统，只在注册表中增加一条定义
- 防御塔现有测试不依赖建筑注册表，因此不会因新增注册调用而回归
- 后续可逐步将 `createTower()` 迁移为通过 `buildingSystem.place()` 统一调用

**已解决的待澄清项（NEEDS CLARIFICATION）**: 防御塔占地为 1×1（在代码中 `Position.x/y` 存储像素中心点，网格坐标通过 `Math.floor(pixel / 32)` 换算，同一格子）。
