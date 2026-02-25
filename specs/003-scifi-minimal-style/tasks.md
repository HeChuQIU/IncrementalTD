---
description: "Task list template for feature implementation"
---

# Tasks: 科幻极简视觉风格

**Input**: Design documents from `/specs/003-scifi-minimal-style/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup & Foundational

**Purpose**: 建立科幻极简风格的基础配置和样式生成器，为所有后续的视觉更新提供基础。

- [ ] T001 创建样式配置目录 `src/renderer/ui/styles/`
- [ ] T002 [P] 在 `src/renderer/ui/styles/colors.ts` 中实现 `SCIFI_COLORS` 调色板常量
- [ ] T003 [P] 在 `src/renderer/ui/styles/geometry.ts` 中实现 `SCIFI_GEOMETRY` 几何配置常量
- [ ] T004 在 `src/renderer/ui/styles/geometry.ts` 中实现 `generateTowerTexture` 纯函数
- [ ] T005 在 `src/renderer/ui/styles/geometry.ts` 中实现 `generateEnemyTexture` 纯函数
- [ ] T006 在 `src/renderer/ui/styles/geometry.ts` 中实现 `drawBullet` 纯函数

**Checkpoint**: 基础样式配置和生成器已就绪，可以开始更新具体的游戏元素。

---

## Phase 2: User Story 1 - 核心游戏元素视觉更新 (Priority: P1) 🎯 MVP

**Goal**: 将防御塔、敌人、子弹的视觉表现更新为科幻极简风格。

**Independent Test**: 启动游戏，观察生成的敌人、建造的防御塔以及塔攻击敌人时的子弹，验证它们是否采用了新的几何形状和配色，且在深色背景下清晰可辨。

### Implementation for User Story 1

- [ ] T007 [US1] 在 `src/renderer/ui/scenes/GameScene.ts` 的 `create` 方法中，调用 `generateTowerTexture` 和 `generateEnemyTexture` 预生成纹理
- [ ] T008 [US1] 修改 `src/renderer/ui/scenes/GameScene.ts` 中的 `_buildTowerSprite` 方法，使用新生成的科幻塔纹理，并添加发光效果 (ADD blend mode)
- [ ] T009 [US1] 修改 `src/renderer/ui/scenes/GameScene.ts` 中的 `_buildEnemySprite` 方法，使用新生成的科幻敌人纹理，并更新血条样式以符合极简风格
- [ ] T010 [US1] 修改 `src/renderer/ui/scenes/GameScene.ts` 中 `towerAttackSystem` 的回调，使用 `drawBullet` 绘制科幻风格的子弹（紫色发光轨迹）
- [ ] T011 [US1] 在 `src/renderer/ui/scenes/GameScene.ts` 中实现受击闪烁效果（当敌人受到伤害时，短暂改变颜色或亮度）

**Checkpoint**: 核心游戏元素（塔、敌人、子弹）已完全更新为科幻极简风格。

---

## Phase 3: User Story 2 - UI界面视觉更新 (Priority: P2)

**Goal**: 将 HUD 和命令控制台的视觉表现更新为科幻极简风格。

**Independent Test**: 在游戏中查看顶部/底部的 HUD 信息，按 \` 键打开控制台，验证所有 UI 元素是否采用了极暗灰背景、灰色边框和科幻等宽字体，且文本以纯白高对比呈现。

### Implementation for User Story 2

- [ ] T012 [P] [US2] 修改 `src/renderer/ui/HUD.ts`，更新背景面板、文本颜色和字体，使其符合 `SCIFI_COLORS` 和极简风格
- [ ] T013 [P] [US2] 修改 `src/renderer/ui/scenes/ConsoleScene.ts`，更新控制台背景（极暗灰半透明）、边框（灰色）和输入提示符
- [ ] T014 [US2] 修改 `src/renderer/ui/scenes/ConsoleScene.ts` 中的文本渲染逻辑，使用科幻等宽字体，并根据文本类型（命令、错误、系统信息）应用不同的科幻配色
- [ ] T015 [US2] 在 `src/renderer/ui/scenes/ConsoleScene.ts` 中为控制台光标添加科幻风格的闪烁效果

**Checkpoint**: 所有 UI 界面已更新为科幻极简风格，与核心游戏元素保持视觉统一。

---

## Phase 4: User Story 3 - 游戏环境视觉更新 (Priority: P3)

**Goal**: 将游戏地图背景和路径更新为科幻极简风格。

**Independent Test**: 启动游戏，观察整体背景颜色、网格线和敌人行进路径，验证它们是否营造了深邃的科技感氛围。

### Implementation for User Story 3

- [ ] T016 [US3] 修改 `src/renderer/ui/scenes/GameScene.ts` 的 `create` 方法，将主背景颜色更新为 `SCIFI_COLORS.background` (近纯黑深灰)
- [ ] T017 [US3] 在 `src/renderer/ui/scenes/GameScene.ts` 中添加绘制科幻网格线的方法，使用 `SCIFI_COLORS.gridLine`
- [ ] T018 [US3] 修改 `src/renderer/ui/scenes/GameScene.ts` 中的路径（Road）绘制逻辑，将其更新为具有科技感的发光路径或极简几何通道，替代原有的泥土色矩形

**Checkpoint**: 游戏环境已更新，整个游戏的视觉风格完全统一为科幻极简风格。

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 确保视觉更新没有破坏现有功能，并进行最终的性能和视觉打磨。

- [x] T019 运行 `npm run test:e2e` (Playwright) 确保视觉更新没有破坏现有的集成测试逻辑
- [x] T020 检查并优化高密度战斗场景（大量子弹和敌人）下的渲染性能，确保帧率稳定
- [x] T021 验证色盲模式友好性（确保紫色塔/子弹与灰白色敌人之间有足够的明度对比度）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 必须首先完成，为后续提供颜色和几何配置。
- **User Story 1 (Phase 2)**: 依赖 Phase 1。这是 MVP，完成后游戏核心视觉即发生改变。
- **User Story 2 (Phase 3)**: 依赖 Phase 1。可以与 Phase 2 并行开发。
- **User Story 3 (Phase 4)**: 依赖 Phase 1。可以与 Phase 2/3 并行开发，但建议在核心元素确定后进行，以便更好地调整环境对比度。
- **Polish (Phase 5)**: 必须在所有 User Stories 完成后进行。

### Parallel Opportunities

- T002 和 T003 可以并行。
- T004, T005, T006 在 T002/T003 完成后可以并行。
- T012 (HUD) 和 T013/T014/T015 (Console) 可以并行。
- 如果有多个开发者，US1, US2, US3 可以在 Phase 1 完成后完全并行开发。

---

## Parallel Example: User Story 1 & 2

```bash
# Developer A works on Core Elements (US1)
git checkout -b feature/003-core-visuals
# Completes T007, T008, T009, T010, T011

# Developer B works on UI (US2)
git checkout -b feature/003-ui-visuals
# Completes T012, T013, T014, T015
```