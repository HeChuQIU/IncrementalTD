# Quickstart: Tower Defense Demo

## 项目概述

这是一个简单的塔防游戏示例，使用 Phaser 3 游戏引擎和 bitECS 实体组件系统架构。游戏包含地图、一个可攻击的塔和不断刷新的敌人，敌人具有血量属性。

## 技术栈

- **语言**: TypeScript 5.x
- **游戏引擎**: Phaser 3
- **ECS 框架**: bitECS
- **状态管理**: Zustand
- **构建工具**: Vite
- **包管理器**: pnpm
- **单元测试**: Vitest
- **集成测试**: Playwright

## 快速开始

### 1. 克隆仓库

```bash
git clone [仓库地址]
cd IncrementalTD
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

浏览器会自动打开游戏页面。

### 4. 运行测试

```bash
# 单元测试
pnpm test:unit

# 集成测试
pnpm test:integration
```

## 游戏玩法

1. **游戏目标**: 阻止敌人到达地图另一端
2. **塔**: 自动攻击范围内的敌人
3. **敌人**: 不断刷新，具有血量属性
4. **得分**: 消灭敌人获得分数

## 项目结构

```
src/
├── core/               # 核心游戏逻辑
│   ├── entities/       # ECS 实体定义
│   ├── components/     # ECS 组件定义
│   ├── systems/        # ECS 系统定义
│   └── constants.ts    # 游戏常量
├── ui/                 # 用户界面
│   ├── scenes/         # Phaser 场景
│   ├── sprites/        # 精灵和动画
│   └── styles/         # 样式文件
├── store/              # 状态管理
├── utils/              # 工具函数
└── main.ts             # 游戏入口
```

## 主要系统

### 敌人刷新系统
- 定期创建新敌人
- 管理刷新间隔
- 分配移动路径

### 敌人移动系统
- 更新敌人位置
- 处理路径跟随
- 检测到达终点

### 塔攻击系统
- 检测范围内敌人
- 管理攻击冷却
- 发射子弹

### 子弹移动系统
- 更新子弹位置
- 检测击中目标

### 伤害计算系统
- 计算伤害
- 更新敌人血量
- 检测死亡

## 自定义配置

### 修改游戏常量

编辑 `src/core/constants.ts`:

```typescript
export const GAME_CONFIG = {
  tower: {
    attackRange: 150,
    attackInterval: 1000,
    attackDamage: 10,
  },
  enemy: {
    spawnInterval: 2000,
    maxHealth: 50,
    speed: 50,
  },
};
```

### 添加新敌人类型

编辑 `src/core/entities/enemy.ts` 和相关系统。

## 部署

### 生产构建

```bash
pnpm build
```

### 桌面应用

```bash
pnpm build:electron
```

生成的应用程序在 `dist/` 目录中。
