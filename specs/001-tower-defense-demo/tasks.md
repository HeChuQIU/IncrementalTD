# Tasks: Tower Defense Demo

**Input**: Design documents from `/specs/001-tower-defense-demo/`
**Branch**: `001-tower-defense-demo`
**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [quickstart.md](quickstart.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1 / US2 / US3)
- **TDD**: Constitution I — 所有 Implementation 任务前必须先写测试(RED)，再实现(GREEN)，再重构(REFACTOR)

---

## Phase 1: Setup

**Purpose**: 使用成熟脚手架完成项目初始化，避免手写配置文件

- [ ] T001 使用 `pnpm create electron-vite@latest . --template vanilla-ts` 在仓库根目录生成 Electron + Vite + TypeScript 项目结构（含 `src/main/`、`src/preload/`、`src/renderer/` 和 `vite.config.ts`）
- [ ] T002 安装游戏依赖：`pnpm add phaser bitecs zustand`
- [ ] T003 [P] 安装开发/测试依赖：`pnpm add -D vitest @vitest/coverage-v8 jsdom @types/node`
- [ ] T004 [P] 安装 Playwright：`pnpm create playwright` 选择 TypeScript + 在已有项目中添加
- [ ] T005 [P] 在 `vite.config.ts` 中添加 `test` 字段配置 Vitest（environment: jsdom，coverage provider: v8）；在 `package.json` 中添加 `test:unit`、`test:integration`、`test:coverage` 脚本

**Checkpoint**: `pnpm dev` 能打开 Electron 窗口；`pnpm test:unit` 能空跑通过

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 定义 ECS 组件、实体工厂、常量和 Zustand Store — 所有 User Story 共用

**⚠️ CRITICAL**: 此阶段完成前，任何 User Story 均无法开始

- [ ] T006 在 `src/renderer/core/constants.ts` 定义所有游戏常量（塔攻击范围 150、攻击间隔 1000ms、攻击伤害 10；敌人刷新间隔 2000ms、最大血量 50、移动速度 50px/s；子弹速度 300px/s）
- [ ] T007 [P] 在 `src/renderer/core/components/index.ts` 用 bitECS `defineComponent` 定义所有组件：`Position`、`Health`、`Speed`、`AttackRange`、`AttackDamage`、`AttackCooldown`、`Path`、`Velocity`、`Lifetime`、`Tag`（TowerTag / EnemyTag / BulletTag）
- [ ] T008 [P] 在 `src/renderer/store/gameStore.ts` 用 Zustand 创建 GameStore：`isPlaying`、`score`、`enemiesKilled`；actions: `startGame`、`pauseGame`、`incrementScore`、`incrementKills`
- [ ] T009 在 `src/renderer/core/entities/` 创建三个实体工厂函数：`createTower(world, x, y)`、`createEnemy(world, x, y, path[])`、`createBullet(world, x, y, vx, vy, damage)`（各自返回 ECS entity id）
- [ ] T010 [P] 在 `src/renderer/utils/math.ts` 实现 `distance(x1,y1,x2,y2)`、`normalizeVector(vx,vy)` 纯函数
- [ ] T011 [P] 在 `src/renderer/ui/scenes/` 创建 `BootScene.ts`（加载位图资源）和 `GameScene.ts` 骨架（空 `create()`/`update()` — 仅挂载场景，不含逻辑）
- [ ] T012 在 `src/renderer/main.ts` 初始化 Phaser.Game，注册 BootScene → GameScene，挂载到 `#app`

**Checkpoint**: 项目编译无错误；空游戏场景能在 Electron 窗口渲染

---

## Phase 3: User Story 1 — 塔防基础玩法展示 (Priority: P1) 🎯 MVP

**Goal**: 游戏启动后立即可见地图、一个塔、至少一个敌人；塔能攻击并击杀敌人

**Independent Test**: 运行 `pnpm dev`，观察场景内出现地图背景 + 塔精灵 + 敌人精灵；给一个位于攻击范围内的敌人，塔射出子弹且敌人血量归零后消失

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T013 [P] [US1] 在 `tests/unit/entities.test.ts` 为 `createTower`、`createEnemy`、`createBullet` 编写单元测试：验证组件值正确附加到实体
- [ ] T014 [P] [US1] 在 `tests/unit/damageSystem.test.ts` 为 DamageSystem 编写单元测试：敌人血量 > 0 时存活；血量 ≤ 0 时实体被移除

### 实现 — TDD GREEN 阶段

- [ ] T015 [US1] 在 `src/renderer/ui/scenes/GameScene.ts` 的 `create()` 中：绘制地图背景色块、用 `createTower` 在地图中心创建塔精灵、用 `createEnemy` 创建一个初始敌人精灵（路径从左到右）
- [ ] T016 [US1] 在 `src/renderer/core/systems/TowerAttackSystem.ts` 实现纯函数 `towerAttackSystem(world, time)`：检测 AttackRange 内的敌人、判断冷却、调用 `createBullet` 发射子弹，更新 `AttackCooldown.lastAttackTime`
- [ ] T017 [US1] 在 `src/renderer/core/systems/BulletMoveSystem.ts` 实现纯函数 `bulletMoveSystem(world, delta)`：按 Velocity 更新子弹 Position；检测与敌人 Position 的碰撞（圆形检测）；命中后标记子弹为待移除
- [ ] T018 [US1] 在 `src/renderer/core/systems/DamageSystem.ts` 实现纯函数 `damageSystem(world)`：对命中标记的子弹施加伤害到目标敌人 Health；`Health.current ≤ 0` 时调用 `removeEntity` 并更新 GameStore kills/score
- [ ] T019 [US1] 在 `GameScene.update(time, delta)` 中按顺序调用 `towerAttackSystem`、`bulletMoveSystem`、`damageSystem`，并同步 Phaser 精灵位置/销毁

**Checkpoint**: US1 完整可玩 — 启动后看到场景、塔攻击初始敌人、敌人死亡消失；单元测试全绿

---

## Phase 4: User Story 3 — 塔攻击机制精化 (Priority: P1)

**Goal**: 精化攻击范围检测和冷却逻辑：进入范围才攻击、离开范围停止攻击

**Independent Test**: 将敌人放在范围外观察塔不攻击；挪入范围内观察攻击开始；拖出范围观察攻击停止

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T020 [P] [US3] 在 `tests/unit/towerAttackSystem.test.ts` 测试：① 敌人在范围内且冷却结束 → 射出子弹；② 敌人不在范围内 → 不射出子弹；③ 冷却未结束 → 不射出子弹；④ 敌人已离开范围 → 移除锁定目标

### 实现 — TDD GREEN 阶段

- [ ] T021 [US3] 在 `TowerAttackSystem` 中添加目标锁定逻辑：优先锁定距离最近的范围内敌人；若当前目标离开范围则清空锁定（更新 `src/renderer/core/systems/TowerAttackSystem.ts`）
- [ ] T022 [US3] 在 `GameScene` 中添加攻击范围可视圆（调试用，生产可隐藏）— 更新 `src/renderer/ui/scenes/GameScene.ts`

**Checkpoint**: US3 测试全绿；塔的攻击行为符合进入/离开范围的生命周期

---

## Phase 5: User Story 2 — 敌人刷新系统 (Priority: P2)

**Goal**: 敌人按固定间隔从地图左端刷新，沿路径向右端移动，到达终点后消失

**Independent Test**: 运行游戏 10 秒，观察多批敌人出现；等待一个敌人走到右端边界，确认其自动消失

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T023 [P] [US2] 在 `tests/unit/enemySpawnSystem.test.ts` 测试：经过 2 个刷新间隔后产出 2 个实体；间隔未到不产出
- [ ] T024 [P] [US2] 在 `tests/unit/enemyMoveSystem.test.ts` 测试：敌人沿 Path 移动，到达路径末端后实体被移除

### 实现 — TDD GREEN 阶段

- [ ] T025 [US2] 在 `src/renderer/core/systems/EnemySpawnSystem.ts` 实现纯函数 `enemySpawnSystem(world, time)`：使用 `ENEMY_SPAWN_INTERVAL` 计时，调用 `createEnemy` 并为其分配预设路径（左端 → 右端）
- [ ] T026 [US2] 在 `src/renderer/core/systems/EnemyMoveSystem.ts` 实现纯函数 `enemyMoveSystem(world, delta)`：按 Speed 沿 Path 更新 Position；当 `Path.currentIndex >= points.length` 时调用 `removeEntity`
- [ ] T027 [US2] 在 `GameScene.update()` 中集成 `enemySpawnSystem` 与 `enemyMoveSystem`（在 TowerAttackSystem 之前调用），并更新 Phaser 精灵的动态创建/销毁逻辑 — 更新 `src/renderer/ui/scenes/GameScene.ts`

**Checkpoint**: US2 测试全绿；游戏中敌人持续刷新并移动，所有 US1–US3 功能同时可用

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T028 [P] 在 `src/renderer/ui/` 添加 HUD：左上角显示 Zustand Store 的 `score` 和 `enemiesKilled` — 新建 `src/renderer/ui/HUD.ts`
- [ ] T029 [P] 配置 ESLint（`pnpm dlx @eslint/migrate-config` + TypeScript 规则）和 Prettier；在 `package.json` 添加 `lint` / `format` 脚本
- [ ] T030 按 `quickstart.md` 验证完整流程：`pnpm install` → `pnpm dev` → 游戏可玩；`pnpm test:unit` 全绿；`pnpm build` 产出 Electron 安装包
- [ ] T031 [P] 在 `tests/integration/` 添加 Playwright smoke test：启动游戏页面，断言 canvas 元素存在，游戏在 1 秒内出现敌人精灵

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 立即开始，无依赖
- **Phase 2 (Foundational)**: 依赖 Phase 1 完成 — 阻塞所有 User Story
- **Phase 3 (US1)**: 依赖 Phase 2 完成
- **Phase 4 (US3)**: 依赖 Phase 3 完成（在 TowerAttackSystem 基础上精化）
- **Phase 5 (US2)**: 依赖 Phase 2 完成，可与 Phase 3/4 并行进行
- **Phase 6 (Polish)**: 依赖所有 User Story 完成

### User Story Dependencies

| Story | Priority | 依赖 | 独立可测试 |
|-------|----------|------|------------|
| US1 塔防基础玩法展示 | P1 | Phase 2 | ✅ 单独场景可验证攻击与死亡 |
| US3 塔攻击机制精化  | P1 | US1 (TowerAttackSystem) | ✅ 单元测试独立验证 |
| US2 敌人刷新系统    | P2 | Phase 2（独立于 US1/US3）| ✅ 单元测试独立验证 |

### Parallel Opportunities

- T003 / T004 / T005 可并行（不同配置文件）
- T007 / T008 / T010 / T011 可并行（不同模块）
- T013 / T014 可并行（不同测试文件）
- T023 / T024 可并行（不同测试文件）
- US2 (Phase 5) 的测试 T023/T024 可在 US1 实现期间并行编写

---

## Parallel Example: Phase 2 Setup (pnpm)

```bash
# Terminal 1 — ECS 组件
code src/renderer/core/components/index.ts

# Terminal 2 — Zustand Store
code src/renderer/store/gameStore.ts

# Terminal 3 — 工具函数
code src/renderer/utils/math.ts
```

## Parallel Example: US1 Tests (TDD RED)

```bash
# Terminal 1
pnpm vitest run tests/unit/entities.test.ts

# Terminal 2
pnpm vitest run tests/unit/damageSystem.test.ts
```

---

## Implementation Strategy

### MVP Scope (Minimum Viable Playable Demo)

仅完成 **Phase 1 + Phase 2 + Phase 3 (US1)** 即可得到完整可玩演示：
塔攻击范围内的初始敌人 → 子弹飞行 → 敌人死亡。

### Incremental Delivery Order

1. **T001–T005**: Scaffold（~30 min）
2. **T006–T012**: Foundational（~1 h）
3. **T013–T019**: US1 MVP（~2 h）— 可对外演示
4. **T020–T022**: US3 精化（~1 h）
5. **T023–T027**: US2 刷新系统（~1.5 h）
6. **T028–T031**: Polish（~1 h）
