# Data Model: 科幻极简视觉风格

## 1. 视觉配置常量 (Visual Configuration Constants)

为了实现统一的科幻极简风格，我们需要在 `src/renderer/core/constants.ts` 或新增的 `src/renderer/ui/styles/colors.ts` 中定义一套严格的颜色和样式常量。

### 1.1 核心调色板 (Core Palette)

采用高对比度暗色方案：近纯黑背景 + 深灰网格 + 紫色（玩家）+ 灰白（敌人）。

```typescript
export const SCIFI_COLORS = {
  // 环境与背景 (Environment & Background)
  background: 0x1A1A1A, // 深灰背景
  gridLine: 0x2A2A2A,   // 暗网格线
  gridHighlight: 0x444444, // 亮网格线/区域边界
  pathDot: 0x888888,    // 路径点颜色
  mountain: 0x222222,   // 山脉颜色
  mountainBorder: 0x333333, // 山脉边框颜色

  // 护甲与中性材质 (Armor & Neutral Materials)
  armorDark: 0x333333,  // 基础装甲
  armorBase: 0x555555,  // 中层装甲/连接线
  armorLight: 0x888888, // 高光装甲/边缘

  // 玩家与友方元素 (Player & Friendly Elements)
  playerPrimary: 0x9B59B6, // 紫色 - 塔的主色调/能量核心
  playerSecondary: 0x2ECC71, // 绿色 - 另一种塔
  playerTertiary: 0xFFFFFF, // 白色 - 护盾/基础塔
  playerGlow: 0x9B59B6,    // 发光效果/子弹
  playerHighlight: 0xFFFFFF, // 极高亮/选中状态

  // 敌方与警告元素 (Enemy & Warning Elements)
  enemyPrimary: 0xDDDDDD, // 浅灰/白 - 敌人的主色调/外壳
  enemyGlow: 0xFFFFFF,    // 敌方发光效果
  enemyHighlight: 0xFFFFFF, // 敌方极高亮/受击状态
  enemyDanger: 0xFF4444,  // 红色 - 危险/高阶敌人

  // UI 元素 (UI Elements)
  uiBackground: 0x111111, // 极暗灰 (带透明度)
  uiBorder: 0x555555,     // 灰色边框
  uiTextPrimary: 0xFFFFFF, // 纯白 - 主文本
  uiTextSecondary: 0xAAAAAA, // 浅灰 - 次要文本
  uiTextHighlight: 0xFFD700, // 金色 - 高亮文本 (如金币)
};
```

### 1.2 几何与样式配置 (Geometry & Style Config)

定义塔、敌人、子弹的几何形状参数，以确保"硬朗几何"的风格统一。

```typescript
export const SCIFI_GEOMETRY = {
  // 塔 (Tower)
  tower: {
    baseRadius: 16,
    coreRadius: 6,
    armorThickness: 2, // 细边框，强调高对比线框风格
    sides: 6, // 六边形底座，体现硬朗几何
  },
  
  // 敌人 (Enemy)
  enemy: {
    baseRadius: 12,
    coreRadius: 4,
    armorThickness: 2, // 细边框，强调高对比线框风格
    sides: 4, // 四边形/菱形，与塔区分
  },
  
  // 子弹 (Bullet)
  bullet: {
    length: 12,
    width: 3,
    glowRadius: 6,
  },
  
  // UI
  ui: {
    borderWidth: 2,
    cornerRadius: 0, // 极简风格，直角或极小圆角
    fontFamily: '"Courier New", Courier, monospace', // 科幻感等宽字体
  }
};
```

## 2. 样式生成器接口 (Style Generator Interfaces)

在 `src/renderer/ui/styles/geometry.ts` 中定义纯函数接口，用于生成 Phaser 纹理或绘制 Graphics。

```typescript
// 生成塔的纹理
export interface GenerateTowerTextureParams {
  scene: Phaser.Scene;
  key: string;
  level?: number;
}

// 生成敌人的纹理
export interface GenerateEnemyTextureParams {
  scene: Phaser.Scene;
  key: string;
  type?: string;
}

// 绘制子弹
export interface DrawBulletParams {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  rotation: number;
}
```

## 3. 实体状态扩展 (Entity State Extensions)

虽然不修改底层 ECS 逻辑，但渲染层可能需要跟踪一些视觉状态（如受击闪烁、攻击后坐力）。这些状态将保存在渲染层的 Map 中，而不是 ECS 组件中，以保持逻辑纯粹。

```typescript
// 在 GameScene 中维护的视觉状态
interface VisualState {
  hitFlashTimer: number; // 受击闪烁计时器
  attackRecoil: number;  // 攻击后坐力偏移
  rotation: number;      // 当前朝向
}

// Map<EntityID, VisualState>
```