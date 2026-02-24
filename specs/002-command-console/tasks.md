# Tasks: 命令系统与游戏内控制台

**Input**: Design documents from `/specs/002-command-console/`  
**Branch**: `002-command-console`  
**Prerequisites**: [spec.md](spec.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（操作不同文件，无互相依赖）
- **[Story]**: 所属用户故事（US1 / US2 / US3 / US4 / US5）
- **TDD**: 宪法第 I 条 — 所有 Implementation 任务前必须先写测试 (RED)，再实现 (GREEN)，再重构 (REFACTOR)
- **测试范围**: 宪法第 VI 条 — 仅测试 Web 版本，桌面版本仅需验证构建成功

---

## Phase 1: Setup（依赖安装）

**Purpose**: 安装 `phaser3-rex-plugins` 和 `commander`，可选配置 Vite 别名

- [ ] T001 安装 UI 层依赖：`pnpm add phaser3-rex-plugins`
- [ ] T002 安装命令解析层依赖：`pnpm add commander @commander-js/extra-typings`

**Checkpoint**: `pnpm build` 或 `pnpm dev` 编译无报错，两个新包出现在 `node_modules/`

---

## Phase 2: Foundational（阻塞性基础）

**Purpose**: 定义全局类型、Console 状态 Store、CommandRegistry 骨架——所有用户故事共用

**⚠️ CRITICAL**: 此阶段完成前，任何 User Story 均无法开始

- [ ] T003 在 `src/renderer/console/types.ts` 定义所有共享类型：`ParameterType`（枚举 `Command | EntityCategory | EntitySubtype | TileType | Coordinate`）、`ParameterDef`（name、type、description）、`ConsoleMessage`（content、kind: `'input' | 'success' | 'error'`）、`CompletionItem`（label、description）
- [ ] T004 [P] 在 `src/renderer/console/ConsoleStore.ts` 用 Zustand 创建 ConsoleStore：状态 `isOpen: boolean`、`messages: ConsoleMessage[]`（最多 50 条）；actions `openConsole()`、`closeConsole()`、`appendMessage(msg)`、`clearMessages()`
- [ ] T005 [P] 在 `src/renderer/console/CommandRegistry.ts` 创建 CommandRegistry 骨架：内部持有 `commander` Program 实例（配置 `.exitOverride()` 禁止 `process.exit`）、`registerCommand(name, paramDefs, handler)` 方法、`execute(input: string): Promise<string>` 方法（调用 commander 解析并返回结果文字）、`getCommands(): string[]` 方法（用于补全）
- [ ] T006 在 `src/renderer/ui/scenes/ConsoleScene.ts` 建立 Phaser.Scene 骨架（`key: 'ConsoleScene'`），`create()` 为空，准备接收 rex-plugins UI 组件；在 `src/renderer/ui/scenes/GameScene.ts` 的 `create()` 中启动 ConsoleScene（`this.scene.launch('ConsoleScene')`）

**Checkpoint**: 项目编译无错误，ConsoleStore 可从外部访问，CommandRegistry 可实例化

---

## Phase 3: User Story 1 — 呼出控制台并执行命令 (P1) 🎯 MVP

**Goal**: 玩家可按反引号键呼出/隐藏控制台，输入命令并回车执行，查看反馈；ESC 关闭控制台

**Independent Test**: 运行 `pnpm dev`，按反引号键出现半透明控制台，输入 `/help` 回车，控制台显示绿色反馈；按 ESC 控制台消失，游戏继续响应键盘

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T007 [P] [US1] 在 `tests/unit/commandRegistry.test.ts` 编写单元测试：注册命令后可通过 `execute('/help')` 获得非空字符串结果；执行不存在的命令抛出可捕获的错误而非崩溃；`getCommands()` 返回已注册命令名称数组
- [ ] T008 [P] [US1] 在 `tests/unit/consoleStore.test.ts` 编写单元测试：初始状态 `isOpen === false`；`openConsole()` 后 `isOpen === true`；`appendMessage` 后 `messages` 长度增加；超过 50 条时最旧消息被丢弃

### 实现 — TDD GREEN 阶段

- [ ] T009 [US1] 实现 `CommandRegistry.execute(input)` 完整逻辑：解析命令名及参数 → 调用已注册 handler → 返回成功字符串；commander 抛出异常时捕获并返回错误描述
- [ ] T010 [US1] 在 `src/renderer/console/commands/helpCommand.ts` 实现 `/help` 命令（列出所有已注册命令名称）并在 CommandRegistry 中注册
- [ ] T011 [US1] 在 `src/renderer/ui/scenes/ConsoleScene.ts` 用 rex-plugins 构建控制台 UI：半透明深色矩形背景（alpha 0.75，铺满屏幕宽度，高度占屏 40%，屏幕底部定位）、用 `BBCodeText` 实现可滚动消息历史区域（`UI/ScrollablePanel`）、底部 `CanvasInput` 输入框（白色文字）
- [ ] T012 [US1] 在 `ConsoleScene` 的 `create()` 中监听回车键：获取输入框内容 → 追加白色输入消息 → 调用 `ConsoleStore` 中的 CommandRegistry → 追加绿色成功或红色错误消息 → 清空输入框
- [ ] T013 [US1] 在 `GameScene.ts` 中注册反引号键（`` ` ``）监听：按下时切换 `ConsoleStore.isOpen` 并调用 `ConsoleScene` 显隐；订阅 `isOpen` 状态，`isOpen === true` 时禁用游戏自身的键盘事件监听，`isOpen === false` 时恢复
- [ ] T014 [US1] 在 `ConsoleScene` 中监听 ESC 键：调用 `ConsoleStore.closeConsole()`，触发控制台隐藏

**Checkpoint**: US1 完整可测；控制台可呼出、执行命令、显示彩色反馈、关闭

---

## Phase 4: User Story 2 — 智能补全辅助输入 (P1)

**Goal**: 输入命令或参数前缀时，弹出类型感知的候选列表；Tab 键填入第一个候选；方向键导航后回车确认

**Independent Test**: 按反引号打开控制台，输入 `/sp`，出现 `/spawn` 候选；继续输入 `/spawn ` 后键入 `en`，出现 `enemy` 候选；按 Tab 自动填入

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T015 [P] [US2] 在 `tests/unit/completionEngine.test.ts` 编写单元测试：输入 `'/sp'` 返回以 `sp` 开头的命令补全候选；输入 `'/spawn '`（命令已完整，光标在参数1位置-EntityCategory 类型）返回注册的实体类别候选；输入不合法前缀时返回空数组；候选项上限为 8 条

### 实现 — TDD GREEN 阶段

- [ ] T016 [US2] 在 `src/renderer/console/CompletionEngine.ts` 实现补全引擎：`getCompletions(input: string): CompletionItem[]` 方法，解析当前输入位置（token 索引）→ 根据 CommandRegistry 提供的参数定义获取期望类型 → 从对应类型注册表做前缀过滤 → 返回最多 8 条 `CompletionItem`；实现 `registerTypeValues(type: ParameterType, values: string[])` 用于注册各类型的合法候选值
- [ ] T017 [US2] 在 `src/renderer/console/commands/spawnCommand.ts` 用 `CompletionEngine.registerTypeValues` 注册实体类别（`enemy`, `tower`）和子类型（`goblin`，`archer` 等）
- [ ] T018 [US2] 在 `ConsoleScene` 中实现补全候选浮层：输入框内容变化时调用 `CompletionEngine.getCompletions()` → 用 `BBCodeText` 在输入框上方渲染候选列表（当前选中项高亮）；无候选时隐藏浮层
- [ ] T019 [US2] 在 `ConsoleScene` 中处理 Tab 键：将第一个候选项文字填入输入框的当前 token 位置；处理上下方向键：在候选列表中移动选中项；处理回车：若候选列表高亮时填入选中项而非执行命令

**Checkpoint**: US2 完整可测；智能补全候选正确过滤，Tab/方向键操作符合预期

---

## Phase 5: User Story 3 — 目标高亮 (P2)

**Goal**: 输入坐标参数时，游戏地图上对应地砖实时高亮；输入实体 ID 时高亮对应实体；控制台关闭时高亮消失

**Independent Test**: 打开控制台，输入 `/spawn enemy goblin 5 3`，地图坐标 (5, 3) 的地砖出现高亮黄色边框；修改为 `4 2`，高亮转移；按 ESC，高亮消失

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T020 [P] [US3] 在 `tests/unit/highlightManager.test.ts` 编写单元测试（mock Phaser.Scene）：`highlightTile(5, 3)` 后 `getHighlightedTile()` 返回 `{x:5, y:3}`；`clearHighlights()` 后返回 `null`；超出地图边界的坐标不抛异常

### 实现 — TDD GREEN 阶段

- [ ] T021 [US3] 在 `src/renderer/console/HighlightManager.ts` 实现高亮管理器：持有 `Phaser.GameObjects.Graphics` 实例（在构造时注入 scene）；`highlightTile(x, y)` 清除旧高亮并在格子坐标换算为像素坐标后绘制黄色描边矩形；`highlightEntity(entityId)` 在实体位置绘制高亮圆圈；`clearHighlights()` 清除所有 Graphics 绘制
- [ ] T022 [US3] 在 `ConsoleScene` 的输入事件中集成 HighlightManager：每次输入框内容变化时，解析当前 token 中的坐标参数 → 若合法则调用 `highlightTile(x, y)`，否则调用 `clearHighlights()`
- [ ] T023 [US3] 在 `ConsoleStore.closeConsole()` action 中调用 `HighlightManager.clearHighlights()` 确保控制台关闭时清除所有高亮

**Checkpoint**: US3 完整可测；坐标高亮随输入实时更新，关闭时自动清除

---

## Phase 6: User Story 4 — 放置与编辑实体/地砖 (P2)

**Goal**: `/spawn enemy goblin x y` 在指定格子生成敌人；`/spawn tower archer x y` 放置塔；`/tile set x y wall` 修改地砖并触发寻路重算

**Independent Test**: 控制台执行 `/spawn enemy goblin 5 3`，游戏场景中 (5,3) 处出现哥布林精灵，控制台显示绿色成功消息；执行 `/tile set 3 3 wall`，地砖变为障碍物

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T024 [P] [US4] 在 `tests/unit/spawnCommand.test.ts` 编写单元测试（mock bitECS world 和 Phaser scene）：`/spawn enemy goblin 5 3` 创建包含正确 Position 组件的实体；坐标越界时返回错误字符串；实体子类型不存在时返回错误字符串
- [ ] T025 [P] [US4] 在 `tests/unit/tileCommand.test.ts` 编写单元测试：`/tile set 3 3 wall` 修改地砖状态为不可通行；地砖类型不合法时返回错误；越界时返回错误；成功后调用寻路重算函数

### 实现 — TDD GREEN 阶段

- [ ] T026 [US4] 在 `src/renderer/console/commands/spawnCommand.ts` 实现 `/spawn <category> <subtype> <x> <y>` 命令：验证坐标在地图范围内 → 根据 category/subtype 调用对应实体工厂（`createEnemy` / `createTower`）→ 返回成功消息（含坐标和类型）；在 CommandRegistry 中注册，参数类型关联到 `EntityCategory`、`EntitySubtype`、`Coordinate`
- [ ] T027 [US4] 在 `src/renderer/console/commands/tileCommand.ts` 实现 `/tile set <x> <y> <tileType>` 命令（子命令模式）：验证坐标 → 修改地图 tileData → 触发 pathStore 路径重算 → 返回成功消息；在 CommandRegistry 中注册，`tileType` 参数关联到 `TileType`；用 `CompletionEngine.registerTypeValues` 注册合法地砖类型（`wall`、`path`、`empty`）
- [ ] T028 [US4] 在 `GameScene.ts` 中提供 `getWorld()` 和 `getScene()` 访问接口，供命令 handler 在执行时获取当前 ECS world 和 Phaser scene 引用

**Checkpoint**: US4 完整可测；放置命令执行后场景实时变化，越界和无效类型均有错误反馈

---

## Phase 7: User Story 5 — 历史记录与调试辅助 (P3)

**Goal**: 输入框内按上/下方向键回溯命令历史（最多 20 条）；消息颜色分类（白/绿/红）；新消息时自动滚动到底部

**Independent Test**: 执行 3 条命令后，按上方向键依次回溯到最近一条历史命令；查看消息区域，颜色正确区分

### 先写测试 — TDD RED 阶段 ⚠️

- [ ] T029 [P] [US5] 在 `tests/unit/historyManager.test.ts` 编写单元测试：push 3 条命令后，`navigateUp()` 依次返回最近 → 第二近 → 第三近命令；到达历史末尾后继续 `navigateUp()` 返回最旧命令（不越界）；`navigateDown()` 从历史末尾回到最新；历史超过 20 条时最旧记录被丢弃；`reset()` 后导航指针回到初始位置

### 实现 — TDD GREEN 阶段

- [ ] T030 [US5] 在 `src/renderer/console/HistoryManager.ts` 实现命令历史管理器：`push(command: string)` 添加条目（上限 20，覆盖最旧）；`navigateUp(): string | null`、`navigateDown(): string | null` 导航；`reset()` 重置指针（每次打开控制台时调用）
- [ ] T031 [US5] 在 `ConsoleScene` 中集成 HistoryManager：命令成功执行后调用 `HistoryManager.push()`；开控制台时调用 `reset()`；`CanvasInput` 内按上/下方向键时（避免与补全候选导航冲突：候选列表不显示时才触发历史导航）调用 `navigateUp/Down` 并填入输入框
- [ ] T032 [US5] 在 `ConsoleScene` 中确保消息追加后 `ScrollablePanel` 自动滚动到底部（调用 rex-plugins 的 `scrollToBottom()` 或等效 API）

**Checkpoint**: US5 完整可测；历史导航和自动滚动均符合预期

---

## Phase 8: Polish（整合与收尾）

**Purpose**: 集成测试、连接现有游戏逻辑、增加便利命令

- [ ] T033 在 `tests/integration/console.spec.ts` 编写 Playwright Web 集成测试：启动 Web 版本（`pnpm dev` + vite server）→ 按反引号键 → 验证控制台 overlay 出现（DOM 或 canvas snapshot）→ 输入 `/help` 按回车 → 验证出现成功反馈文本 → 按 ESC → 验证控制台消失
- [ ] T034 [P] 在 `src/renderer/console/commands/helpCommand.ts` 完善 `/help [command]` 命令：无参数时列出所有命令；带命令名参数时显示该命令的参数说明
- [ ] T035 [P] 在 `src/renderer/console/commands/clearCommand.ts` 实现 `/clear` 命令（调用 `ConsoleStore.clearMessages()`）并注册
- [ ] T036 验证桌面版本构建成功：运行 `pnpm build` 确认 Electron 产物生成无错误（不做功能测试）

---

## 依赖关系（用户故事完成顺序）

```
Phase 1 (Setup)
    └── Phase 2 (Foundation)
            ├── Phase 3 (US1: 控制台基础) 🎯 MVP
            │       └── Phase 4 (US2: 智能补全)  ← US1 完成后即可开始
            │       └── Phase 5 (US3: 目标高亮)  ← US1 完成后即可开始（与 US2 并行）
            │       └── Phase 6 (US4: 放置命令)  ← US1 完成后即可开始（与 US2/US3 并行）
            │               └── Phase 7 (US5: 历史记录) ← US1-US4 均不严格阻塞，可随时穿插
            └── Phase 8 (Polish) ← 所有 US 完成后
```

## 各用户故事并行执行示例

**Phase 3（US1）完成后可并行启动：**

```
开发者 A: T015-T019（US2 智能补全引擎与 UI）
开发者 B: T020-T023（US3 目标高亮管理器）
开发者 C: T024-T028（US4 spawn/tile 命令实现）
```

**US4 完成后：**

```
开发者 A: T029-T032（US5 历史记录）
开发者 B: T033-T036（Polish 整合测试）
```

## 实现策略

**MVP 范围**（仅 Phase 1-3）：安装依赖 → 定义类型与 Store → 实现基础控制台 UI 与命令执行。  
完成后玩家即可呼出/关闭控制台，执行 `/help` 并看到彩色反馈，是最小可演示的功能闭环。

**增量交付顺序**：US1（基础闭环）→ US2（智能补全，降低使用门槛）→ US4（实际操作能力）→ US3（交互体验增强）→ US5（效率辅助）
