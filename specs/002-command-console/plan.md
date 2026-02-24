# Implementation Plan: 命令系统与游戏内控制台

**Branch**: `002-command-console` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-command-console/spec.md`

## Summary

为游戏添加命令系统与游戏内控制台。控制台通过反引号键呼出、ESC 关闭，支持智能补全（类型感知前缀匹配）、目标高亮（坐标/实体）、实体放置与地砖编辑命令、命令历史。UI 风格类似《我的世界》，半透明深色背景覆盖游戏画面下方。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Phaser 3, bitECS, Zustand, phaser3-rex-plugins, commander  
**Storage**: N/A（控制台历史不持久化）  
**Testing**: Vitest（单元测试）、Playwright（集成测试，仅 Web）  
**Package Manager**: pnpm  
**Target Platform**: Browser（Web）+ Electron（Desktop，仅验证构建）  
**Project Type**: game feature（HTML5 + 桌面端）

## Constitution Check

| # | 原则 | 状态 | 说明 |
|---|------|------|------|
| I | TDD | ✅ PASS | 每个 US 先写测试后实现 |
| II | 函数式编程 | ✅ PASS | 命令 handler 为纯函数，补全引擎为无副作用查询 |
| III | TypeScript 严格类型 | ✅ PASS | 所有类型定义在 types.ts |
| IV | bitECS 架构 | ✅ PASS | spawn 命令使用已有ECS实体工厂 |
| V | Zustand 状态管理 | ✅ PASS | ConsoleStore 管理控制台状态 |
| VI | 跨平台测试策略 | ✅ PASS | Web 版本完整测试，桌面版本仅验证构建 |

## Project Structure

### Source Code (new files for this feature)

```text
src/renderer/
├── console/
│   ├── types.ts                 # 共享类型定义
│   ├── ConsoleStore.ts          # Zustand 控制台状态
│   ├── CommandRegistry.ts       # 命令注册/解析/分发
│   ├── CompletionEngine.ts      # 类型感知补全引擎
│   ├── HistoryManager.ts        # 命令历史导航
│   ├── HighlightManager.ts      # 地砖/实体高亮
│   └── commands/
│       ├── helpCommand.ts       # /help 命令
│       ├── clearCommand.ts      # /clear 命令
│       ├── spawnCommand.ts      # /spawn 命令
│       └── tileCommand.ts       # /tile 命令
├── ui/scenes/
│   └── ConsoleScene.ts          # 控制台 Phaser Scene

tests/
├── unit/
│   ├── commandRegistry.test.ts
│   ├── consoleStore.test.ts
│   ├── completionEngine.test.ts
│   ├── highlightManager.test.ts
│   ├── historyManager.test.ts
│   ├── spawnCommand.test.ts
│   └── tileCommand.test.ts
└── integration/
    └── console.spec.ts
```
