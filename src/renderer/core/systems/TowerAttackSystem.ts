import { defineQuery, hasComponent, IWorld } from 'bitecs'
import {
  AttackCooldown,
  AttackDamage,
  AttackRange,
  EnemyTag,
  Position,
  TowerTag
} from '../components'
import { createBullet } from '../entities/bullet'
import { normalizeVector, distance } from '../../utils/math'
import { BULLET_CONFIG } from '../constants'

const towerQuery = defineQuery([TowerTag, Position, AttackRange, AttackDamage, AttackCooldown])
const enemyQuery = defineQuery([EnemyTag, Position])

export type BulletCreatedCallback = (bulletEid: number) => void

/**
 * Pure ECS system: detects enemies in range, manages cooldown, fires bullets.
 * Target is locked until it leaves range (US3 refinement included).
 */
export function towerAttackSystem(
  world: IWorld,
  time: number,
  onBulletCreated?: BulletCreatedCallback
): void {
  const towers = towerQuery(world)
  const enemies = enemyQuery(world)

  for (const towerEid of towers) {
    const tx = Position.x[towerEid]
    const ty = Position.y[towerEid]
    const range = AttackRange.radius[towerEid]
    const interval = AttackCooldown.interval[towerEid]
    const lastAttack = AttackCooldown.lastAttackTime[towerEid]
    let targetEid = AttackCooldown.targetEid[towerEid]

    // US3: drop locked target if it left range or was removed
    if (targetEid >= 0) {
      const stillAlive = hasComponent(world, EnemyTag, targetEid)
      const inRange = stillAlive && distance(tx, ty, Position.x[targetEid], Position.y[targetEid]) <= range
      if (!inRange) {
        targetEid = -1
        AttackCooldown.targetEid[towerEid] = -1
      }
    }

    // US3: acquire nearest enemy in range if no current target
    if (targetEid < 0) {
      let nearest = -1
      let nearestDist = Infinity
      for (const eid of enemies) {
        const d = distance(tx, ty, Position.x[eid], Position.y[eid])
        if (d <= range && d < nearestDist) {
          nearest = eid
          nearestDist = d
        }
      }
      targetEid = nearest
      AttackCooldown.targetEid[towerEid] = targetEid
    }

    // Fire if target exists and cooldown expired
    if (targetEid >= 0 && time - lastAttack >= interval) {
      AttackCooldown.lastAttackTime[towerEid] = time
      const ex = Position.x[targetEid]
      const ey = Position.y[targetEid]
      const dir = normalizeVector(ex - tx, ey - ty)
      const speed = BULLET_CONFIG.speed
      const bulletEid = createBullet(
        world,
        tx,
        ty,
        dir.x * speed,
        dir.y * speed,
        AttackDamage.value[towerEid],
        targetEid,
        time
      )
      onBulletCreated?.(bulletEid)
    }
  }
}
