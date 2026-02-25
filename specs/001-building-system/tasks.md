# Tasks: 建筑系统 (Building System)

**Input**: Design documents from `/specs/001-building-system/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅  
**Branch**: `001-building-system`  
**Total tasks**: 36 | **TDD**: 全程执行（先写测试→失败→实现→通过）

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可与其他 [P] 任务并行（无共享文件依赖）
- **[Story]**: 所属用户故事（US1/US2/US3/US4）
- 所有测试任务必须先于对应实现任务执行

---

## Phase 1: Setup（共享基础设施）

**目的**: 提升共享常量、新增 ECS 组件和枚举值，所有用户故事均依赖此阶段。

- [x] T001 将局部 `TILE_SIZE = 32` 提升为导出常量，新增 `GRID_W`/`GRID_H`（由 `GAME_WIDTH/HEIGHT` 派生）到 `src/renderer/core/constants.ts`，并同步更新 `tileCommand.ts` 与 `spawnCommand.ts` 使用 `constants.ts` 中的 `TILE_SIZE`
- [x] T002 [P] 新增 ECS 组件 `BuildingTag`、`GridPosition`、`BuildingSize`、`Rotation`、`DrillTag`、`ProductionCooldown` 到 `src/renderer/core/components/index.ts`
- [x] T003 [P] 新增 `ParameterType.BuildingId` 枚举值到 `src/renderer/console/types.ts`

---

## Phase 2: Foundational（核心模块——阻塞所有用户故事）

**目的**: 建筑注册表、数据存储、放置条件和建筑系统入口是所有用户故事的基础，必须先完成。

**⚠️ 关键**: 所有用户故事实现均依赖此阶段完成。

### 基础测试（先写，确保初始失败）

- [x] T004 [P] 编写 `tests/unit/buildingRegistry.test.ts`：覆盖 `register()`（成功/重复 id 抛错）、`get()`（存在/不存在）、`getAll()`（返回全部定义），使用 `createBuildingRegistry()` 工厂隔离
- [x] T005 [P] 编写 `tests/unit/itemStorageStore.test.ts`：覆盖 `initStorage()`、`addItem()`（成功/满仓返回 false）、`getStorage()`、`clearStorage()`
- [x] T006 [P] 编写 `tests/unit/placementConditions.test.ts`：覆盖 `requiresInBounds()`（越界拒绝）、`requiresNoOverlap()`（重叠拒绝）、`requiresAtLeastOneTileType()`（无匹配地砖拒绝）、`checkPlacement()`（多条件组合）

### 基础实现（使上述测试通过）

- [x] T007 实现 `src/renderer/core/buildings/BuildingRegistry.ts`：定义 `BuildingDef`/`PlacementCondition`/`PlacementResult` 接口，实现 `BuildingRegistry` 类（`register`/`get`/`getAll`，`Object.freeze` 冻结定义），导出 `buildingRegistry` 单例和 `createBuildingRegistry()` 工厂（使 T004 通过）
- [x] T008 [P] 实现 `src/renderer/core/buildings/itemStorageStore.ts`：定义 `ItemStack`/`ItemStorage` 接口，实现 `initStorage()`/`addItem()`/`getStorage()`/`getTotalCount()`/`clearStorage()` 纯函数，导出 `storageData` Map（使 T005 通过）
- [x] T009 [P] 实现 `src/renderer/core/buildings/buildingStore.ts`：实现 `occupiedTilesData`/`tileOccupancyIndex`/`buildingDefIdData` Map，导出 `setBuildingOccupancy()`/`clearBuildingOccupancy()`/`getBuildingAtTile()`/`setBuildingDefId()`/`getBuildingDefId()` 工具函数
- [x] T010 实现 `src/renderer/core/buildings/PlacementConditions.ts`：实现 `requiresInBounds(gridW, gridH)`/`requiresNoOverlap()`/`requiresAtLeastOneTileType(type)` 条件构造器和 `checkPlacement()` 组合函数（使 T006 通过）
- [x] T011 实现 `src/renderer/core/buildings/buildingSystem.ts`：实现 `createBuilding(world, def, anchorTx, anchorTy, rotation?)` 和 `placeBuilding(world, defId, anchorTx, anchorTy, rotation?)` 主入口（依赖 T007–T010）

**Checkpoint**: 核心模块就绪，所有基础测试通过，用户故事实现可以开始。

---

## Phase 3: User Story 1 - 建筑注册表查询 (Priority: P1) 🎯 MVP

**目标**: 玩家可通过控制台 `/building list` 和 `/building info <id>` 查询已注册建筑。

**独立测试**: 注册至少一种建筑（tower），在控制台执行查询命令，验证返回正确信息，无需其他功能即可验证。

### US1 测试（先写，确保初始失败）

- [x] T012 [P] [US1] 编写 `tests/unit/buildingCommand.test.ts`：覆盖 `list`（有/无建筑）、`info`（存在/不存在 id）、`info` 缺少参数、未知 action 的错误格式

### US1 实现

- [x] T013 [US1] 创建 `src/renderer/core/buildings/buildingDefinitions.ts`：调用 `buildingRegistry.register()` 注册 `tower`（1×1，不可旋转，无存储，无生产，无放置条件）和 `drill`（2×2，不可旋转，`storageCapacity: 20`，`productionInterval: 5000`，`productionItemId: 'copper_ore'`，放置条件 `requiresAtLeastOneTileType('copper_ore')` + `requiresNoOverlap()` + `requiresInBounds`）定义
- [x] T014 [US1] 创建 `src/renderer/console/commands/buildingCommand.ts`：注册 `building` 命令，实现 `list`/`info` 子命令（按 `contracts/building-command.md` 契约），注册 `ParameterType.BuildingId` 到 `CompletionEngine`（使 T012 通过）
- [x] T015 [US1] 创建 `registerBuildingCommand()` 和 `initBuildings()` 的对外导出，確保可从场景调用

**Checkpoint**: US1 独立可测试——在控制台输入 `/building list` 应返回已注册建筑列表。

---

## Phase 4: User Story 2 - 铜矿石地砖与钻机放置 (Priority: P2)

**目标**: 地图支持铜矿石地砖；钻机可放置在矿石上并自动产出铜矿石；不满足条件时放置被拒绝。

**独立测试**: 通过代码设置铜矿石地砖，调用 `placeBuilding()` 放置钻机，推进时间，验证存储中出现 `copper_ore` 物品；矿石地砖状态不变。

### US2 测试（先写，确保初始失败）

- [x] T016 [P] [US2] 编写 `tests/unit/drillProductionSystem.test.ts`：覆盖钻机产出（时间未到不产出，时间到产出 1 个）、满仓暂停（`addItem` 返回 false 时不更新 `lastProductionTime`）、多钻机独立计时

### US2 实现

- [x] T017 [US2] 在 `src/renderer/console/commands/tileCommand.ts` 的 `VALID_TILE_TYPES` 数组中追加 `'copper_ore'`，使 `/tile set x y copper_ore` 命令合法
- [x] T018 [US2] 实现 `src/renderer/core/systems/DrillProductionSystem.ts`：定义 `drillQuery`，每帧检查 `ProductionCooldown` 时间，调用 `getBuildingDefId()` 获取 `productionItemId`，调用 `addItem()` 产出（使 T016 通过）
- [x] T019 [US2] 在 `buildingCommand.ts` 中新增 `place` 子命令：`/building place <id> <x> <y>`，调用 `placeBuilding()`，返回成功消息或失败原因

**Checkpoint**: US2 独立可测试——设置铜矿石地砖后 `/building place drill 3 3` 应成功放置，5 秒后存储计数增加；在无矿石区域放置应被拒绝。

---

## Phase 5: User Story 3 - 现有防御塔纳入建筑系统 (Priority: P3)

**目标**: 防御塔以建筑定义形式注册到注册表，现有游戏行为零回归。

**独立测试**: 运行全部现有单元测试，确认全部通过；通过控制台 `/building info tower` 查询成功。

### US3 实现（无需新增测试，验证现有测试通过）

- [x] T020 [US3] 在 `src/renderer/ui/scenes/GameScene.ts` 的 `create()` 中调用 `initBuildings()`（注册 tower/drill 定义）和 `registerBuildingCommand()`
- [x] T021 [US3] 运行 `pnpm test:unit` 确认全部现有测试持续通过（零回归，满足 SC-005）

**Checkpoint**: US3 独立可测试——在 GameScene 中打开控制台查询 `/building info tower` 返回防御塔定义；所有测试通过。

---

## Phase 6: User Story 4 - 验证场景 (Priority: P4)

**目标**: 提供 `BuildingDemoScene`，开发者可直观验证矿石地砖、钻机放置和自动产出的完整循环。

**独立测试**: 切换到验证场景，使用控制台完成"放置钻机 → 观察产出 → 查询建筑信息"全流程，30 秒内完成。

### US4 实现

- [x] T022 [US4] 创建 `src/renderer/ui/scenes/BuildingDemoScene.ts`：  
  `create()` 中绘制 10×10 格网格、绘制预置铜矿石地砖（3,3 ~ 4,4 的 2×2 区块，铜棕色调试图形）、初始化 ECS world、调用 `initBuildings()` + `registerBuildingCommand()` + `registerTileCommand()`、启动 ConsoleScene、注册反引号切换控制台；  
  `update(time, delta)` 中调用 `drillProductionSystem(world, time)` 并刷新建筑调试视图文字（`Container` 内 `Text.setText()`）
- [x] T023 [US4] 在 `src/renderer/main.ts` 中注册 `BuildingDemoScene`，更新场景启动配置使验证场景可通过修改入口访问（或新增 `/scene` 命令跳转）

**Checkpoint**: US4 独立可测试——进入验证场景后，通过控制台依次执行 `/building list`、`/building place drill 3 3`，数秒后观察调试视图中"铜矿石: X/20"数字递增。

---

## Phase 7: Polish & 收尾

**目的**: 验证全量测试、类型检查、构建，确保提交质量。

- [x] T024 [P] 运行 `pnpm test:unit` 确保全部单元测试通过（包括 T004/T005/T006/T012/T016 对应的测试文件）
- [x] T025 [P] 运行 `pnpm typecheck:web` 确保 TypeScript 编译无错误
- [x] T026 运行 `pnpm build` 确保 Electron 桌面构建成功（符合宪法 VI 跨平台验证要求）

---

## 依赖关系（用户故事完成顺序）

```
Phase 1 (Setup)
  └─► Phase 2 (Foundational: Registry / buildingStore / itemStorageStore / PlacementConditions / buildingSystem)
        ├─► Phase 3 (US1: buildingDefinitions → buildingCommand list/info)
        │     └─► Phase 5 (US3: GameScene 接入 → 零回归验证)
        ├─► Phase 4 (US2: DrillProductionSystem → building place 命令)
        │     └─► Phase 6 (US4: BuildingDemoScene)
        └─► Phase 7 (Polish)
```

**US3 依赖 US1**（注册表需先注册定义，GameScene 才能查询 tower）  
**US4 依赖 US1 + US2**（验证场景需要查询命令 + 放置命令 + 生产系统）  
**US1 和 US2 可在 Phase 2 完成后并行推进**

---

## 并行执行示例（Phase 2 完成后）

```
并行 A（US1）: T012 → T013 → T014 → T015
并行 B（US2）: T016 → T017 → T018 → T019
同步点: A + B 完成后 → T020 → T021 → T022 → T023
```

---

## 实现策略

**MVP 范围**: Phase 1 + Phase 2 + Phase 3（US1）  
→ 注册表可查询，tower/drill 已注册，控制台命令 `list`/`info` 正常工作

**增量交付**:
1. MVP：注册表 + 控制台查询（Phase 1~3）
2. 核心功能：矿石地砖 + 钻机放置 + 自动产出（Phase 4）
3. 向后兼容：GameScene 接入注册初始化（Phase 5）
4. 完整验证：BuildingDemoScene（Phase 6）

**格式验证**: 所有任务均包含 checkbox `- [ ]`、顺序 ID（T001~T026）、[P] 并行标记（适用时）、[USn] 故事标签（Phase 3~6）、明确文件路径。
