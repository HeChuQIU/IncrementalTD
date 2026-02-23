import Phaser from 'phaser'
import { createWorld, IWorld } from 'bitecs'
import { createTower } from '../../core/entities/tower'
import { createEnemy } from '../../core/entities/enemy'
import { towerAttackSystem } from '../../core/systems/TowerAttackSystem'
import { bulletMoveSystem } from '../../core/systems/BulletMoveSystem'
import { applyDamage } from '../../core/systems/DamageSystem'
import { enemySpawnSystem, resetSpawnTimer } from '../../core/systems/EnemySpawnSystem'
import { enemyMoveSystem } from '../../core/systems/EnemyMoveSystem'
import { Position } from '../../core/components'
import { TOWER_CONFIG, ENEMY_PATH, GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'
import { useGameStore } from '../../store/gameStore'
import { HUD } from '../HUD'

export class GameScene extends Phaser.Scene {
  private world!: IWorld
  private enemySprites = new Map<number, Phaser.GameObjects.Container>()
  private bulletSprites = new Map<number, Phaser.GameObjects.Graphics>()
  private hud!: HUD

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.world = createWorld()
    resetSpawnTimer()
    useGameStore.getState().reset()

    // ─── Map ────────────────────────────────────────────────────────────────
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2d5a27)
    // Road
    this.add.rectangle(GAME_WIDTH / 2, 300, GAME_WIDTH, 60, 0x8b7355)

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

    useGameStore.getState().startGame()
  }

  update(time: number, delta: number): void {
    if (!useGameStore.getState().isPlaying) return

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
      g.fillStyle(0xffff44)
      g.fillCircle(0, 0, 4)
      g.setPosition(Position.x[bulletEid], Position.y[bulletEid])
      this.bulletSprites.set(bulletEid, g)
    })

    // 4. Bullet movement and hit detection
    bulletMoveSystem(
      this.world,
      time,
      delta,
      (bulletEid, targetEid, damage) => {
        applyDamage(this.world, targetEid, damage, (diedEid) => {
          this._destroyEnemySprite(diedEid)
          useGameStore.getState().incrementKills()
          useGameStore.getState().incrementScore(10)
        })
        this._destroyBulletSprite(bulletEid)
      },
      (bulletEid) => {
        this._destroyBulletSprite(bulletEid)
      }
    )

    // 5. Sync surviving sprite positions from ECS
    for (const [eid, container] of this.enemySprites) {
      container.setPosition(Position.x[eid], Position.y[eid])
    }
    for (const [eid, g] of this.bulletSprites) {
      g.setPosition(Position.x[eid], Position.y[eid])
    }

    // 6. Update HUD
    const { score, enemiesKilled } = useGameStore.getState()
    this.hud.update(score, enemiesKilled)
  }

  // ─── Sprite helpers ───────────────────────────────────────────────────────

  private _buildTowerSprite(x: number, y: number, range: number): void {
    // Range circle (debug overlay)
    const rangeGfx = this.add.graphics()
    rangeGfx.lineStyle(1, 0x4444ff, 0.25)
    rangeGfx.strokeCircle(x, y, range)

    // Tower body
    const body = this.add.graphics()
    body.fillStyle(0x4488ff)
    body.fillRect(x - 16, y - 16, 32, 32)
    body.lineStyle(2, 0x88aaff)
    body.strokeRect(x - 16, y - 16, 32, 32)

    // Barrel
    const barrel = this.add.graphics()
    barrel.lineStyle(4, 0x88aaff)
    barrel.lineBetween(x, y, x + 20, y)
  }

  private _buildEnemySprite(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const body = this.add.graphics()
    body.fillStyle(0xff4444)
    body.fillCircle(0, 0, 14)

    const hpBg = this.add.graphics()
    hpBg.fillStyle(0x333333)
    hpBg.fillRect(-14, 18, 28, 4)

    const hpFill = this.add.graphics()
    hpFill.fillStyle(0x44ff44)
    hpFill.fillRect(-14, 18, 28, 4)

    container.add([body, hpBg, hpFill])
    return container
  }

  private _destroyEnemySprite(eid: number): void {
    const sprite = this.enemySprites.get(eid)
    if (sprite) {
      sprite.destroy()
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
