# Data Model: Tower Defense Demo

## 实体 (Entities)

### 塔 (Tower)
**类型**: 游戏实体
**组件**:
- `Position`: 塔的位置 (x, y)
- `AttackRange`: 攻击范围 (radius)
- `AttackInterval`: 攻击间隔 (ms)
- `AttackDamage`: 攻击力 (伤害值)
- `AttackCooldown`: 攻击冷却时间 (ms)
- `Sprite`: 塔的精灵和动画

**状态转换**:
- 就绪 → 攻击中 → 冷却中 → 就绪

### 敌人 (Enemy)
**类型**: 游戏实体
**组件**:
- `Position`: 敌人的位置 (x, y)
- `Health`: 血量 (当前血量, 最大血量)
- `Speed`: 移动速度 (像素/秒)
- `Path`: 移动路径
- `Sprite`: 敌人的精灵和动画

**状态转换**:
- 刷新 → 移动中 → 被攻击 → 死亡/到达终点

### 子弹 (Bullet)
**类型**: 游戏实体
**组件**:
- `Position`: 子弹的位置 (x, y)
- `Velocity`: 速度向量 (vx, vy)
- `Damage`: 伤害值
- `Lifetime`: 生命周期 (ms)
- `Sprite`: 子弹的精灵和动画

**状态转换**:
- 发射 → 飞行中 → 击中目标/过期

## 组件定义

### Position
```typescript
interface Position {
  x: number;
  y: number;
}
```

### AttackRange
```typescript
interface AttackRange {
  radius: number;
}
```

### AttackInterval
```typescript
interface AttackInterval {
  interval: number;
}
```

### AttackDamage
```typescript
interface AttackDamage {
  damage: number;
}
```

### AttackCooldown
```typescript
interface AttackCooldown {
  cooldown: number;
  lastAttackTime: number;
}
```

### Health
```typescript
interface Health {
  current: number;
  max: number;
}
```

### Speed
```typescript
interface Speed {
  value: number;
}
```

### Path
```typescript
interface Path {
  points: { x: number; y: number }[];
  currentIndex: number;
}
```

### Velocity
```typescript
interface Velocity {
  x: number;
  y: number;
}
```

### Lifetime
```typescript
interface Lifetime {
  duration: number;
  spawnTime: number;
}
```

### Sprite
```typescript
interface Sprite {
  key: string;
  frame: number;
  animation: string | null;
}
```

## 系统 (Systems)

### 敌人刷新系统 (EnemySpawnSystem)
- 负责定期创建新的敌人实体
- 管理敌人刷新间隔
- 为每个敌人分配路径

### 敌人移动系统 (EnemyMoveSystem)
- 更新敌人位置
- 处理路径跟随
- 检测敌人是否到达终点或死亡

### 塔攻击系统 (TowerAttackSystem)
- 检测范围内的敌人
- 管理攻击冷却
- 发射子弹

### 子弹移动系统 (BulletMoveSystem)
- 更新子弹位置
- 检测子弹是否击中敌人或过期

### 伤害计算系统 (DamageSystem)
- 计算子弹对敌人的伤害
- 更新敌人血量
- 检测敌人是否死亡

## 状态管理 (Zustand Store)

```typescript
interface GameState {
  isPlaying: boolean;
  score: number;
  enemiesKilled: number;
  towerLevel: number;
  gameSpeed: number;
  // 方法
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  updateScore: (points: number) => void;
  updateEnemiesKilled: () => void;
  upgradeTower: () => void;
}
```
