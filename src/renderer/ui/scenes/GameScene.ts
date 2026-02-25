import Phaser from 'phaser'
import { createWorld, IWorld } from 'bitecs'
import { createTower } from '../../core/entities/tower'
import { createEnemy } from '../../core/entities/enemy'
import { towerAttackSystem } from '../../core/systems/TowerAttackSystem'
import { bulletMoveSystem } from '../../core/systems/BulletMoveSystem'
import { applyDamage } from '../../core/systems/DamageSystem'
import { enemySpawnSystem, resetSpawnTimer } from '../../core/systems/EnemySpawnSystem'
import { enemyMoveSystem } from '../../core/systems/EnemyMoveSystem'
import { Health, Position, Velocity } from '../../core/components'
import { TOWER_CONFIG, ENEMY_PATH, GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'
import { gameStore } from '../../store/gameStore'
import { consoleStore } from '../../console/ConsoleStore'
import { HUD } from '../HUD'
import { generateTowerTexture, generateEnemyTexture, drawBullet } from '../styles/geometry'
import { SCIFI_COLORS } from '../styles/colors'

export class GameScene extends Phaser.Scene {
  private world!: IWorld
  private enemySprites = new Map<
    number,
    { container: Phaser.GameObjects.Container; hpFill: Phaser.GameObjects.Graphics; sprite: Phaser.GameObjects.Sprite }
  >()
  private bulletSprites = new Map<number, Phaser.GameObjects.Graphics>()
  private hud!: HUD

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.world = createWorld()
    resetSpawnTimer()
    gameStore.getState().reset()

    // ─── Generate Textures ──────────────────────────────────────────────────
    generateTowerTexture({ scene: this, key: 'tower_texture' })
    generateEnemyTexture({ scene: this, key: 'enemy_texture' })

    // ─── Map ────────────────────────────────────────────────────────────────
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, SCIFI_COLORS.background)
    
    // Grid lines
    const gridGfx = this.add.graphics()
    gridGfx.lineStyle(1, SCIFI_COLORS.gridLine, 0.8) // 提高网格线不透明度
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      gridGfx.moveTo(x, 0)
      gridGfx.lineTo(x, GAME_HEIGHT)
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      gridGfx.moveTo(0, y)
      gridGfx.lineTo(GAME_WIDTH, y)
    }
    gridGfx.strokePath()

    // Road (Sci-fi path)
    const roadGfx = this.add.graphics()
    roadGfx.lineStyle(4, SCIFI_COLORS.gridHighlight, 1) // 提高路径不透明度
    roadGfx.beginPath()
    roadGfx.moveTo(ENEMY_PATH[0].x, ENEMY_PATH[0].y)
    for (let i = 1; i < ENEMY_PATH.length; i++) {
      roadGfx.lineTo(ENEMY_PATH[i].x, ENEMY_PATH[i].y)
    }
    roadGfx.strokePath()
    
    // Road glow
    const roadGlow = this.add.graphics()
    roadGlow.lineStyle(12, SCIFI_COLORS.gridHighlight, 0.4) // 提高发光不透明度
    roadGlow.setBlendMode(Phaser.BlendModes.ADD)
    roadGlow.beginPath()
    roadGlow.moveTo(ENEMY_PATH[0].x, ENEMY_PATH[0].y)
    for (let i = 1; i < ENEMY_PATH.length; i++) {
      roadGlow.lineTo(ENEMY_PATH[i].x, ENEMY_PATH[i].y)
    }
    roadGlow.strokePath()

    // ─── Tower ──────────────────────────────────────────────────────────────
    const towerEid = createTower(this.world, TOWER_CONFIG.x, TOWER_CONFIG.y)
    this._buildTowerSprite(TOWER_CONFIG.x, TOWER_CONFIG.y, TOWER_CONFIG.attackRange)

    // Suppress unused variable warning – tower EID is used by ECS systems via queries
    void towerEid

    // ─── Initial enemy ──────────────────────────────────────────────────────
    const start = ENEMY_PATH[0]
    const enemyEid = createEnemy(this.world, start.x, start.y, [...ENEMY_PATH])
    this.enemySprites.set(enemyEid, this._buildEnemySprite(start.x, start.y))

    // ─── HUD ────────────────────────────────────────────────────────────────
    this.hud = new HUD(this)

    // ─── Console ────────────────────────────────────────────────────────────
    this.scene.launch('ConsoleScene')

    // Toggle console with backtick key
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === '`') {
        event.preventDefault()
        consoleStore.getState().toggleConsole()
      }
    })

    gameStore.getState().startGame()
  }

  update(time: number, delta: number): void {
    if (!gameStore.getState().isPlaying) return

    // 1. Spawn new enemies
    enemySpawnSystem(this.world, time, (eid) => {
      const start = ENEMY_PATH[0]
      this.enemySprites.set(eid, this._buildEnemySprite(start.x, start.y))
    })

    // 2. Move enemies along path
    enemyMoveSystem(this.world, delta, (eid) => {
      this._destroyEnemySprite(eid)
    })

    // 3. Tower attacks (includes US3 target-lock logic)
    towerAttackSystem(this.world, time, (bulletEid) => {
      const g = this.add.graphics()
      g.setBlendMode(Phaser.BlendModes.ADD)
      const vx = Velocity.x[bulletEid]
      const vy = Velocity.y[bulletEid]
      const rotation = Math.atan2(vy, vx)
      drawBullet({ graphics: g, x: Position.x[bulletEid], y: Position.y[bulletEid], rotation })
      this.bulletSprites.set(bulletEid, g)
    })

    // 4. Bullet movement and hit detection
    bulletMoveSystem(
      this.world,
      time,
      delta,
      (bulletEid, targetEid, damage) => {
        // Hit flash
        const enemyView = this.enemySprites.get(targetEid)
        if (enemyView && enemyView.sprite.active) {
          enemyView.sprite.setTintFill(0xffffff)
          this.time.delayedCall(50, () => {
            if (enemyView.sprite.active) {
              enemyView.sprite.clearTint()
            }
          })
        }

        applyDamage(this.world, targetEid, damage, (diedEid) => {
          this._destroyEnemySprite(diedEid)
          gameStore.getState().incrementKills()
          gameStore.getState().incrementScore(10)
        })
        this._destroyBulletSprite(bulletEid)
      },
      (bulletEid) => {
        this._destroyBulletSprite(bulletEid)
      }
    )

    // 5. Sync surviving sprite positions from ECS
    for (const [eid, enemyView] of this.enemySprites) {
      enemyView.container.setPosition(Position.x[eid], Position.y[eid])
      const current = Math.max(0, Health.current[eid])
      const max = Math.max(1, Health.max[eid])
      const ratio = Phaser.Math.Clamp(current / max, 0, 1)
      enemyView.hpFill.clear()
      enemyView.hpFill.fillStyle(SCIFI_COLORS.enemyPrimary)
      enemyView.hpFill.fillRect(-14, 18, 28 * ratio, 3)
    }
    for (const [eid, g] of this.bulletSprites) {
      const vx = Velocity.x[eid]
      const vy = Velocity.y[eid]
      const rotation = Math.atan2(vy, vx)
      drawBullet({ graphics: g, x: Position.x[eid], y: Position.y[eid], rotation })
    }

    // 6. Update HUD
    const { score, enemiesKilled } = gameStore.getState()
    this.hud.update(score, enemiesKilled)
  }

  // ─── Sprite helpers ───────────────────────────────────────────────────────

  /** Expose ECS world for console commands */
  getWorld(): IWorld {
    return this.world
  }

  private _buildTowerSprite(x: number, y: number, range: number): void {
    // Range circle (debug overlay)
    const rangeGfx = this.add.graphics()
    rangeGfx.lineStyle(1, SCIFI_COLORS.gridHighlight, 0.25)
    rangeGfx.strokeCircle(x, y, range)

    // Tower body
    const towerSprite = this.add.sprite(x, y, 'tower_texture')
    towerSprite.setBlendMode(Phaser.BlendModes.ADD)
  }

  private _buildEnemySprite(
    x: number,
    y: number
  ): { container: Phaser.GameObjects.Container; hpFill: Phaser.GameObjects.Graphics; sprite: Phaser.GameObjects.Sprite } {
    const container = this.add.container(x, y)

    const sprite = this.add.sprite(0, 0, 'enemy_texture')
    sprite.setBlendMode(Phaser.BlendModes.ADD)

    const hpBg = this.add.graphics()
    hpBg.fillStyle(SCIFI_COLORS.uiBackground, 0.8)
    hpBg.fillRect(-14, 18, 28, 3)

    const hpFill = this.add.graphics()
    hpFill.fillStyle(SCIFI_COLORS.enemyPrimary)
    hpFill.fillRect(-14, 18, 28, 3)

    container.add([sprite, hpBg, hpFill])
    return { container, hpFill, sprite }
  }

  private _destroyEnemySprite(eid: number): void {
    const sprite = this.enemySprites.get(eid)
    if (sprite) {
      sprite.container.destroy()
      this.enemySprites.delete(eid)
    }
  }

  private _destroyBulletSprite(eid: number): void {
    const sprite = this.bulletSprites.get(eid)
    if (sprite) {
      sprite.destroy()
      this.bulletSprites.delete(eid)
    }
  }
}
