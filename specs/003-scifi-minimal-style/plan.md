# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

将游戏的视觉风格全面更新为带有科幻要素的极简风格（未来军事科技方向）。采用中性平衡配色方案（灰色、蓝灰为基础，配以冷色调科技感色彩），更新核心游戏元素（防御塔、敌人、子弹）、UI界面（HUD、控制台）以及游戏环境（地图、背景）的视觉表现，同时保证游戏性能和可读性。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Phaser 3, bitECS, Zustand  
**Storage**: N/A  
**Testing**: Vitest (Unit), Playwright (Integration)  
**Target Platform**: Web (detailed testing), Electron Desktop (build only)  
**Project Type**: Game (Tower Defense)  
**Performance Goals**: 维持当前帧率（不低于更新前的95%），支持高密度战斗场景（50+敌人同屏）  
**Constraints**: 必须遵循极简设计原则，避免过度装饰；必须保持现有游戏元素的可识别性和可区分性；色盲模式友好  
**Scale/Scope**: 更新所有现有的视觉渲染逻辑（GameScene, HUD, ConsoleScene），不改变底层ECS核心逻辑。

### Unknowns & Clarifications Needed
- **[RESOLVED]**: 如何在 Phaser 3 中高效实现"硬朗几何造型"和"护甲质感"？
  - **方案**: 使用 `Phaser.GameObjects.Graphics` 绘制复杂的几何图形（如六边形、菱形），然后通过 `generateTexture()` 将其转换为可复用的 Sprite 纹理。这既能实现极简的几何风格，又能保证 50+ 敌人同屏的极高渲染性能。
- **[RESOLVED]**: 如何在 Phaser 3 中实现科幻风格常见的发光/泛光（Glow/Bloom）效果而不严重影响性能？
  - **方案**: 优先使用 `blendMode: Phaser.BlendModes.ADD` 配合半透明的几何图形来模拟发光效果；对于关键元素（如子弹），谨慎使用 Phaser 3.60+ 内置的 `postFX.addGlow()`。
- **[RESOLVED]**: 具体的"中性平衡配色方案"（灰色、蓝灰、冷色调）的十六进制颜色代码规范是什么？
  - **方案**: 采用基于 Tailwind CSS 色板的深蓝灰（Slate/Cyan/Orange）配色方案。背景为深蓝灰（`#0F172A`），玩家元素为青色（`#06B6D4`），敌方元素为橙色（`#F97316`），护甲为不同层级的灰色（`#475569` 到 `#94A3B8`）。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TDD**: 视觉更新可能难以进行传统的单元测试，但必须确保现有的集成测试（Playwright）在视觉更新后仍然通过，且UI组件的渲染逻辑应尽可能可测试。
- **II. Functional Programming**: 视觉配置和样式生成已提取为纯函数（如 `GenerateTowerTextureParams`），避免在 Scene 类中硬编码样式。
- **III. TypeScript Strict**: 所有新增的颜色配置、样式接口已有严格的 TypeScript 类型定义（见 `data-model.md`）。
- **IV. ECS**: 视觉更新严格限制在渲染层（Phaser Scenes），视觉状态（如受击闪烁、后坐力）保存在渲染层的 Map 中，不修改底层的 bitECS 系统和组件逻辑，保持逻辑与表现分离。
- **V. Zustand**: UI界面（HUD、控制台）的视觉更新继续响应 Zustand store 的状态变化。
- **VI. Cross-platform testing**: 确保 Web 版本的 Playwright 测试通过，Electron 桌面版本能够成功构建。

**Post-Design Check**: ✅ 所有设计决策均符合宪法要求，特别是 ECS 架构的纯粹性和函数式编程原则。

## Project Structure

### Documentation (this feature)

```text
specs/003-scifi-minimal-style/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── renderer/
│   ├── core/
│   │   └── constants.ts       # 更新颜色和视觉配置常量
│   ├── ui/
│   │   ├── scenes/
│   │   │   ├── GameScene.ts   # 更新核心元素和环境的渲染逻辑
│   │   │   └── ConsoleScene.ts# 更新控制台视觉样式
│   │   ├── HUD.ts             # 更新HUD视觉样式
│   │   └── styles/            # [新增] 存放科幻极简风格的样式配置和生成函数
│   │       ├── colors.ts
│   │       └── geometry.ts
```

**Structure Decision**: 保持现有的项目结构，在 `src/renderer/ui/` 下新增 `styles/` 目录用于集中管理视觉样式配置和纯函数生成器，以符合函数式编程原则并保持代码整洁。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无违规。
