# Data Model: 科幻极简视觉风格

## 1. 视觉配置常量 (Visual Configuration Constants)

为了实现统一的科幻极简风格，我们需要在 `src/renderer/core/constants.ts` 或新增的 `src/renderer/ui/styles/colors.ts` 中定义一套严格的颜色和样式常量。

### 1.1 核心调色板 (Core Palette)

基于 Tailwind CSS 的 Slate (蓝灰), Cyan (青色), Orange (橙色) 色系。

```typescript
export const SCIFI_COLORS = {
  // 环境与背景 (Environment & Background)
  background: 0x0F172A, // Slate 900 - 深邃太空蓝灰
  gridLine: 0x1E293B,   // Slate 800 - 暗网格线
  gridHighlight: 0x334155, // Slate 700 - 亮网格线/区域边界

  // 护甲与中性材质 (Armor & Neutral Materials)
  armorDark: 0x475569,  // Slate 600 - 基础装甲
  armorBase: 0x64748B,  // Slate 500 - 中层装甲
  armorLight: 0x94A3B8, // Slate 400 - 高光装甲/边缘

  // 玩家与友方元素 (Player & Friendly Elements)
  playerPrimary: 0x06B6D4, // Cyan 500 - 塔的主色调/能量核心
  playerGlow: 0x22D3EE,    // Cyan 400 - 发光效果/子弹
  playerHighlight: 0x67E8F9, // Cyan 300 - 极高亮/选中状态

  // 敌方与警告元素 (Enemy & Warning Elements)
  enemyPrimary: 0xF97316, // Orange 500 - 敌人的主色调/能量核心
  enemyGlow: 0xFB923C,    // Orange 400 - 敌方发光效果
  enemyHighlight: 0xFDBA74, // Orange 300 - 敌方极高亮/受击状态
  enemyDanger: 0xEF4444,  // Red 500 - 危险/高阶敌人

  // UI 元素 (UI Elements)
  uiBackground: 0x0F172A, // Slate 900 (带透明度)
  uiBorder: 0x06B6D4,     // Cyan 500
  uiTextPrimary: 0xF8FAFC, // Slate 50 - 主文本
  uiTextSecondary: 0x94A3B8, // Slate 400 - 次要文本
  uiTextHighlight: 0x22D3EE, // Cyan 400 - 高亮文本
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
    armorThickness: 4,
    sides: 6, // 六边形底座，体现硬朗几何
  },
  
  // 敌人 (Enemy)
  enemy: {
    baseRadius: 12,
    coreRadius: 4,
    armorThickness: 3,
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