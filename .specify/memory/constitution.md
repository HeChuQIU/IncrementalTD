<!-- Sync Impact Report:
Version change: 0.0.0 → 1.0.0
Added sections: All sections
Templates requiring updates: ✅ all templates updated
Follow-up TODOs: None
-->

# IncrementalTD Constitution

## Core Principles

### I. Test-Driven Development (TDD) - NON-NEGOTIABLE
严格遵循测试驱动开发流程：先编写测试 → 测试失败 → 实现功能 → 测试通过 → 重构。所有功能必须有对应的测试用例，确保代码质量和可维护性。

### II. Functional Programming Paradigm
倾向于使用函数式编程模式，避免副作用，优先使用纯函数。代码应具有不可变性、可组合性和可测试性。

### III. Type Safety with TypeScript
所有代码必须使用TypeScript编写，严格类型检查。避免使用any类型，确保类型定义的完整性和准确性。

### IV. Entity-Component-System Architecture
使用bitECS作为游戏的ECS框架，实现高性能的实体管理和系统更新。组件应保持简单数据结构，逻辑应放在系统中。

### V. State Management with Zustand
使用Zustand进行全局状态管理，保持状态管理的简单性和可预测性。状态应尽可能局部化，只在必要时使用全局状态。

## Technology Stack Requirements

### Game Engine
- 使用Phaser 3作为游戏引擎，构建塔防和增量游戏玩法
- 游戏逻辑与渲染分离，便于测试和维护

### Desktop Application
- 使用Electron作为桌面端包装，提供跨平台支持
- 主进程与渲染进程通信应通过IPC，保持架构清晰

### Package Manager
- 使用pnpm作为包管理器，提高依赖安装速度和磁盘空间利用率
- 严格管理依赖版本，避免无意识的依赖更新

### Environment Configuration
- 所有敏感信息（如API密钥、token）必须放在.gitignore中的.env文件中
- 环境变量应通过dotenv或类似工具加载，确保安全性

## Development Workflow

### Code Quality
- 代码应遵循ESLint和Prettier规范
- 提交前应运行lint和格式化检查
- 避免过度工程化，保持代码简洁和可读性

### Testing
- 单元测试使用Vitest或Jest
- 集成测试使用Playwright或Cypress
- 游戏逻辑测试应模拟Phaser环境，避免真实DOM依赖

### Version Control
- 使用Git进行版本控制
- 提交信息应清晰简洁，遵循Conventional Commits规范
- 分支管理使用Git Flow或类似策略

## Governance

### Constitution Supremacy
本章程是项目开发的最高指导原则，所有开发活动必须遵循。

### Amendments
章程修改需经过团队讨论和批准，并更新版本号。

### Compliance
所有PR必须验证是否符合章程要求，代码审查应包括章程合规性检查。

**Version**: 1.0.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
