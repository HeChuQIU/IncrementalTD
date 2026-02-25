# Implementation Plan: 建筑系统 (Building System)

**Branch**: `001-building-system` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-building-system/spec.md`

## Summary

在现有 TypeScript + Phaser 3 + bitECS + Zustand 塔防游戏中引入**建筑系统**：包含建筑注册表（代码注册 + 控制台查询）、多格占地与旋转支持、放置条件校验（边界/重叠/地砖类型）、内部物品存储、钻机生产系统（2×2，矿石地砖上自动产出铜矿石），以及铜矿石地砖类型扩展（永不枯竭）。新增验证场景（`BuildingDemoScene`）供开发者直观演示完整的"矿石地砖 → 放置钻机 → 自动产出"循环。现有防御塔以建筑定义形式纳入注册表，零回归。

**技术方案**: 标量数据进 bitECS typed arrays（`GridPosition`、`ProductionCooldown` 等）；复杂结构（已占格、物品存储）存外部 `Map<eid,...>`，与 `pathStore.ts` 模式一致；建筑定义放只读注册表单例；调试渲染使用 Phaser `Container`（边框 + 中文文字）。

## Technical Context

**Language/Version**: TypeScript 5.3（strict mode）  
**Primary Dependencies**: Phaser 3.80、bitECS 0.3、Zustand 5、Vitest 3、Playwright 1.41  
**Storage**: 运行时内存（`Map<eid,...>`）；无持久化（不在本次范围）  
**Testing**: 单元测试 Vitest（`tests/unit/`）；集成测试 Playwright 仅 Web 版（`tests/integration/`）  
**Target Platform**: Web（Vite dev server）+ Electron 桌面构建验证  
**Project Type**: 增量塔防游戏（桌面/Web 双端）  
**Performance Goals**: 同屏 ≤20 个建筑时保持 60 fps；控制台查询响应 < 1 秒  
**Constraints**: 不引入新 npm 依赖；严格 TypeScript；禁用 `any`；不修改现有通过测试  
**Scale/Scope**: 本次实现 2 种建筑（tower、drill）、1 种矿石地砖（copper_ore）、1 个验证场景

## Constitution Check

*GATE: 设计前检查通过 ✅；设计后（Phase 1）复查通过 ✅*

| 宪法原则 | 状态 | 说明 |
|---------|------|------|
| I. TDD 强制执行 | ✅ | 所有新模块（BuildingRegistry、PlacementConditions、itemStorageStore、DrillProductionSystem）先写测试再实现；见 tasks.md 的 TDD 步骤 |
| II. 函数式编程范式 | ✅ | `PlacementConditions` 为纯函数谓词；`buildingStore`/`itemStorageStore` 导出纯工具函数；无副作用状态突变 |
| III. TypeScript 类型安全 | ✅ | strict mode；`BuildingDef` 使用 `readonly`；所有接口明确类型；禁用 `any` |
| IV. ECS 架构（bitECS） | ✅ | 新增 ECS 组件（`GridPosition`、`ProductionCooldown` 等）遵守 bitECS typed array 约束；复杂数据走外部 Map（`pathStore.ts` 模式） |
| V. Zustand 全局状态管理 | ✅ | 建筑系统的全局状态（如放置的建筑列表）若需跨场景共享，通过 Zustand store 扩展；本次验证场景无跨场景状态，无需新 store |
| VI. 跨平台测试策略 | ✅ | 单元测试覆盖 Web 版本；Electron 仅验证构建成功；验证场景面向 Web 测试 |

**无违规需要复杂性跟踪。**

## Project Structure

### Documentation（本特性）

```text
specs/001-building-system/
├── plan.md              # 本文件
├── research.md          # Phase 0 研究结论
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速入门指南
├── contracts/
│   └── building-command.md   # 控制台命令契约
└── tasks.md             # Phase 2 任务清单（/speckit.tasks 生成）
```

### Source Code（新增文件）

```text
src/renderer/core/buildings/
├── BuildingRegistry.ts        # 建筑注册表单例 + createBuildingRegistry() 工厂
├── PlacementConditions.ts     # 纯函数放置条件构造器
├── buildingStore.ts           # 已占格数据 Map + 反向索引
├── itemStorageStore.ts        # 物品存储 Map
├── buildingSystem.ts          # placeBuilding() 主入口（注册表查询 + 条件校验 + 创建实体）
└── buildingDefinitions.ts     # 注册 tower / drill 定义的初始化模块

src/renderer/core/components/index.ts
  └─ （修改）新增 BuildingTag, GridPosition, BuildingSize,
              Rotation, DrillTag, ProductionCooldown

src/renderer/core/constants.ts
  └─ （修改）新增 TILE_SIZE（从 tileCommand.ts 提升为常量）、GRID_W、GRID_H

src/renderer/core/systems/DrillProductionSystem.ts  # 新增
src/renderer/console/commands/buildingCommand.ts    # 新增
src/renderer/console/types.ts
  └─ （修改）新增 ParameterType.BuildingId

src/renderer/ui/scenes/BuildingDemoScene.ts         # 新增验证场景
src/renderer/main.ts
  └─ （修改）注册 BuildingDemoScene

tests/unit/
├── buildingRegistry.test.ts
├── placementConditions.test.ts
├── itemStorageStore.test.ts
├── drillProductionSystem.test.ts
└── buildingCommand.test.ts
```

**Structure Decision**: 采用标准单项目结构（Option 1），新模块集中在 `src/renderer/core/buildings/`；与现有 `core/entities/`、`core/systems/` 同级，保持架构一致性。

## Complexity Tracking

无宪法违规，此节不适用。

---

## Phase 0: 研究结论摘要

所有 NEEDS CLARIFICATION 已在 [research.md](./research.md) 中解决：

| 议题 | 决策 |
|------|------|
| bitECS 中复杂建筑数据的存储方式 | 标量进 typed arrays；结构体进外部 Map（与 pathStore.ts 同构） |
| 建筑注册表模式 | 单例 + Map + Object.freeze；测试用工厂函数隔离 |
| 放置条件模式 | 函数式谓词 `(tx, ty, def) => PlacementResult`；可组合 |
| 物品存储模式 | `Map<eid, ItemStorage>`；满仓时 `addItem()` 返回 false |
| 矿石地砖持久性 | tileMap 只读约定；永不删改 copper_ore 条目 |
| 调试渲染方案 | Phaser Container + Graphics 边框 + Text（中文名/状态） |
| 防御塔纳入方式 | 零侵入：仅在注册表加一条 BuildingDef；现有代码不改 |
| 控制台命令设计 | `/building list` + `/building info <id>` 子命令风格 |

---

## Phase 1: 设计决策记录

### 数据分层决策

见 [data-model.md](./data-model.md) 完整定义。关键决策：
- `GridPosition`（tileX, tileY）替代像素坐标存储格子锚点，与 `Position`（像素）分离
- 建筑类型 ID 以字符串形式存入 `buildingDefIdData: Map<eid, string>`（外部 Map），不设 ECS 数字索引组件；外部代码一律通过 `buildingDefIdData.get(eid)` 取得字符串 ID 再查注册表
- 钻机 2×2 的占地格列表存外部 Map，放置/销毁时维护反向索引 `"tx,ty" → eid`

### 控制台命令契约

见 [contracts/building-command.md](./contracts/building-command.md)。

新增 `ParameterType.BuildingId` 枚举值，供 `CompletionEngine` 使用注册表动态填充补全候选。

### 验证场景设计

`BuildingDemoScene` 在 `create()` 中：
1. 绘制 10×10 格基础网格（左上角为 (0,0)）
2. 预置 4 格铜矿石地砖（2×2 区域, 格子坐标 3,3 ~ 4,4）
3. 渲染矿石地砖（静态 Graphics）
4. 启动 ConsoleScene（与 GameScene 相同的反引号切换）
5. 注册所有建筑命令
6. 在 `update()` 中运行 `drillProductionSystem` 并刷新建筑视图文字

玩家（开发者）通过控制台：先用 `/tile set` 确认矿石地砖，再用 `/building place drill 3 3` 放置钻机，观察调试视图中存储数字随时间增长。

### 宪法复查结论（Phase 1 后）

设计完全符合宪法要求，重申关键合规点：
- 所有新文件严格 TypeScript，无 `any`
- `PlacementConditions.ts` 纯函数，无副作用
- ECS 组件设计遵循 bitECS typed array 约束
- 测试文件与实现文件一一对应，TDD 流程强制执行
