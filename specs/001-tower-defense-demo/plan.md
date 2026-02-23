# Implementation Plan: Tower Defense Demo

**Branch**: `001-tower-defense-demo` | **Date**: 2026-02-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-tower-defense-demo/spec.md`

## Summary

构建一个简单的塔防游戏演示：地图上有一个塔和不断刷新的敌人，塔自动攻击范围内的敌人，敌人具有血量属性被击杀后消失。技术栈采用 Phaser 3 渲染 + bitECS 实体组件系统 + Zustand 全局状态管理，运行在浏览器和 Electron 桌面端。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Phaser 3, bitECS, Zustand, Vite, Electron  
**Storage**: N/A（无持久化存储需求）  
**Testing**: Vitest（单元测试）、Playwright（集成测试）  
**Package Manager**: pnpm  
**Target Platform**: Browser（Web）+ Electron（Desktop，跨平台）  
**Project Type**: game（HTML5 + 桌面端）  
**Performance Goals**: 游戏逻辑响应流畅；塔防演示规模（单张地图、单个塔）无特殊性能瓶颈  
**Constraints**: 离线可用（Electron 打包）；避免在 update 循环中创建对象（对象池）  
**Scale/Scope**: 单地图、单塔、无限波次敌人刷新的最小可玩演示

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 原则 | 状态 | 说明 |
|---|------|------|------|
| I | TDD（先写测试） | ✅ PASS | Vitest 单元测试 + Playwright 集成测试，所有系统需先有测试用例 |
| II | 函数式编程范式 | ✅ PASS | ECS 系统设计为纯函数，组件为数据结构，避免副作用 |
| III | TypeScript 严格类型 | ✅ PASS | 全部使用 TypeScript 5.x，禁止 any 类型 |
| IV | bitECS 架构 | ✅ PASS | 塔、敌人、子弹均作为 ECS 实体，逻辑放在系统中 |
| V | Zustand 状态管理 | ✅ PASS | 游戏全局状态（分数、游戏状态）使用 Zustand 管理 |
| - | pnpm 包管理 | ✅ PASS | 使用 pnpm 作为包管理器 |

**结论**: 无违规，可继续执行。

## Project Structure

### Documentation (this feature)

```text
specs/001-tower-defense-demo/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── components/     # bitECS 组件定义（Position, Health, Speed 等）
│   ├── systems/        # ECS 系统（EnemySpawnSystem, TowerAttackSystem 等）
│   ├── entities/       # 实体工厂函数（createTower, createEnemy, createBullet）
│   └── constants.ts    # 游戏常量（攻击范围、刷新间隔等）
├── ui/
│   ├── scenes/         # Phaser Scene（BootScene, GameScene）
│   └── sprites/        # 精灵工厂和动画配置
├── store/              # Zustand store（全局游戏状态）
├── utils/              # 工具函数（数学计算、碰撞检测等）
└── main.ts             # Phaser 游戏入口

tests/
├── unit/               # Vitest 单元测试（系统、实体、工具函数）
└── integration/        # Playwright 集成测试（游戏场景 E2E）
```

**Structure Decision**: 使用 Option 1（单项目结构）。无后端/API 需求；Phaser 场景作为渲染层，bitECS 系统作为逻辑层，Zustand 作为状态层，三者在 `src/` 内清晰分离。


