# Research Findings: Tower Defense Demo

## Decision 1: 游戏引擎选择
**选择**: Phaser 3
**理由**: 成熟的 HTML5 游戏引擎，文档完善，社区活跃，支持 TypeScript
**备选方案**:
- Three.js: 更适合 3D 游戏，2D 开发复杂度高
- PixiJS: 轻量级渲染引擎，但缺少游戏框架特性

## Decision 2: 实体组件系统 (ECS)
**选择**: bitECS
**理由**: 高性能的 ECS 库，专为游戏优化，API 简单易用
**备选方案**:
- Entity-Component-System: 自定义实现，开发周期长
- PlayCanvas ECS: 与 PlayCanvas 引擎绑定，不灵活

## Decision 3: 状态管理
**选择**: Zustand
**理由**: 轻量级，API 简单，无 boilerplate 代码，适合游戏状态管理
**备选方案**:
- Redux: 功能强大但复杂，不适合简单游戏
- MobX: 响应式编程，但学习曲线陡峭

## Decision 4: 桌面端包装
**选择**: Electron
**理由**: 成熟的桌面端应用框架，支持跨平台，与 Web 技术栈兼容
**备选方案**:
- Tauri: 更小的包体积，但 Rust 学习成本高
- Neutralinojs: 更轻量，但生态系统较小

## Decision 5: 单元测试框架
**选择**: Vitest
**理由**: 快速，支持 TypeScript，与 Vite 构建工具集成良好
**备选方案**:
- Jest: 成熟稳定，但配置复杂
- Mocha: 灵活但需要额外插件

## Decision 6: 集成测试框架
**选择**: Playwright
**理由**: 支持多种浏览器，自动等待机制，测试稳定
**备选方案**:
- Cypress: 简单易用，但只支持 Chrome 浏览器

## 技术最佳实践

### Phaser 3 最佳实践
1. 使用场景（Scene）管理游戏状态
2. 合理使用对象池（Object Pooling）优化性能
3. 避免在 update 方法中创建新对象

### bitECS 最佳实践
1. 组件保持简单数据结构，无逻辑
2. 系统职责单一，只处理实体更新
3. 使用查询（Query）优化实体检索

### 塔防游戏架构
1. 地图数据与逻辑分离
2. 使用路径寻找算法计算敌人路径
3. 塔攻击范围使用空间分区优化
