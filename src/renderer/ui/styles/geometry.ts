import Phaser from 'phaser'
import { SCIFI_COLORS } from './colors'

export const SCIFI_GEOMETRY = {
  // 塔 (Tower)
  tower: {
    baseRadius: 16,
    coreRadius: 6,
    armorThickness: 2,
    sides: 6 // 六边形底座，体现硬朗几何
  },

  // 敌人 (Enemy)
  enemy: {
    baseRadius: 12,
    coreRadius: 4,
    armorThickness: 2,
    sides: 4 // 四边形/菱形，与塔区分
  },

  // 子弹 (Bullet)
  bullet: {
    length: 12,
    width: 3,
    glowRadius: 6
  },

  // UI
  ui: {
    borderWidth: 2,
    cornerRadius: 0, // 极简风格，直角或极小圆角
    fontFamily: '"Courier New", Courier, monospace' // 科幻感等宽字体
  }
}

// 生成塔的纹理
export interface GenerateTowerTextureParams {
  scene: Phaser.Scene
  key: string
  level?: number
}

export function generateTowerTexture({ scene, key }: GenerateTowerTextureParams): void {
  if (scene.textures.exists(key)) return

  const { baseRadius, coreRadius, armorThickness, sides } = SCIFI_GEOMETRY.tower
  const size = baseRadius * 2 + armorThickness * 2
  const center = size / 2

  const graphics = scene.make.graphics({ x: 0, y: 0 })

  // 绘制外层装甲 (六边形) - 高对比度空心/暗色填充
  graphics.lineStyle(armorThickness, SCIFI_COLORS.playerPrimary)
  graphics.fillStyle(SCIFI_COLORS.background)
  
  const points = []
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides
    points.push(new Phaser.Math.Vector2(
      center + Math.cos(angle) * baseRadius,
      center + Math.sin(angle) * baseRadius
    ))
  }
  graphics.fillPoints(points, true, true)
  graphics.strokePoints(points, true, true)

  // 绘制内层连接线
  graphics.lineStyle(1, SCIFI_COLORS.armorBase)
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides
    graphics.moveTo(center, center)
    graphics.lineTo(
      center + Math.cos(angle) * baseRadius,
      center + Math.sin(angle) * baseRadius
    )
  }
  graphics.strokePath()

  // 绘制能量核心
  graphics.fillStyle(SCIFI_COLORS.playerPrimary)
  graphics.fillCircle(center, center, coreRadius)

  // 绘制核心发光
  graphics.lineStyle(2, SCIFI_COLORS.playerGlow, 0.8)
  graphics.strokeCircle(center, center, coreRadius + 2)

  graphics.generateTexture(key, size, size)
  graphics.destroy()
}

// 生成敌人的纹理
export interface GenerateEnemyTextureParams {
  scene: Phaser.Scene
  key: string
  type?: string
}

export function generateEnemyTexture({ scene, key }: GenerateEnemyTextureParams): void {
  if (scene.textures.exists(key)) return

  const { baseRadius, coreRadius, armorThickness, sides } = SCIFI_GEOMETRY.enemy
  const size = baseRadius * 2 + armorThickness * 2
  const center = size / 2

  const graphics = scene.make.graphics({ x: 0, y: 0 })

  // 绘制外层装甲 (菱形) - 高对比度空心/暗色填充
  graphics.lineStyle(armorThickness, SCIFI_COLORS.enemyPrimary)
  graphics.fillStyle(SCIFI_COLORS.background)
  
  const points = []
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides + Math.PI / 4 // 旋转45度形成菱形
    points.push(new Phaser.Math.Vector2(
      center + Math.cos(angle) * baseRadius,
      center + Math.sin(angle) * baseRadius
    ))
  }
  graphics.fillPoints(points, true, true)
  graphics.strokePoints(points, true, true)

  // 绘制内层连接线
  graphics.lineStyle(1, SCIFI_COLORS.armorBase)
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides + Math.PI / 4
    graphics.moveTo(center, center)
    graphics.lineTo(
      center + Math.cos(angle) * baseRadius,
      center + Math.sin(angle) * baseRadius
    )
  }
  graphics.strokePath()

  // 绘制能量核心
  graphics.fillStyle(SCIFI_COLORS.enemyPrimary)
  graphics.fillCircle(center, center, coreRadius)

  // 绘制核心发光
  graphics.lineStyle(2, SCIFI_COLORS.enemyGlow, 0.8)
  graphics.strokeCircle(center, center, coreRadius + 2)

  graphics.generateTexture(key, size, size)
  graphics.destroy()
}

// 绘制子弹
export interface DrawBulletParams {
  graphics: Phaser.GameObjects.Graphics
  x: number
  y: number
  rotation: number
}

export function drawBullet({ graphics, x, y, rotation }: DrawBulletParams): void {
  const { length, width, glowRadius } = SCIFI_GEOMETRY.bullet

  graphics.clear()
  graphics.setPosition(x, y)
  graphics.setRotation(rotation)

  // 绘制发光光晕
  graphics.fillStyle(SCIFI_COLORS.playerGlow, 0.3)
  graphics.fillEllipse(0, 0, length + glowRadius, width + glowRadius)

  // 绘制子弹核心
  graphics.fillStyle(SCIFI_COLORS.playerHighlight)
  graphics.fillEllipse(0, 0, length, width)
}
