import { defineQuery, hasComponent, removeEntity, IWorld } from 'bitecs'
import { BulletData, BulletTag, EnemyTag, Lifetime, Position, Velocity } from '../components'
import { distance } from '../../utils/math'
import { BULLET_CONFIG } from '../constants'

const bulletQuery = defineQuery([BulletTag, Position, Velocity, BulletData, Lifetime])

export type BulletHitCallback = (bulletEid: number, targetEid: number, damage: number) => void
export type BulletExpiredCallback = (bulletEid: number) => void

export function bulletMoveSystem(
  world: IWorld,
  time: number,
  delta: number,
  onHit?: BulletHitCallback,
  onExpired?: BulletExpiredCallback
): void {
  const bullets = bulletQuery(world)
  const dt = delta / 1000 // ms → seconds

  for (const eid of bullets) {
    // Check lifetime expiry
    if (time - Lifetime.spawnTime[eid] > Lifetime.duration[eid]) {
      removeEntity(world, eid)
      onExpired?.(eid)
      continue
    }

    // Advance position
    Position.x[eid] += Velocity.x[eid] * dt
    Position.y[eid] += Velocity.y[eid] * dt

    // Validate target still alive
    const targetEid = BulletData.targetEid[eid]
    if (targetEid < 0 || !hasComponent(world, EnemyTag, targetEid)) {
      removeEntity(world, eid)
      onExpired?.(eid)
      continue
    }

    // Collision check
    const d = distance(
      Position.x[eid],
      Position.y[eid],
      Position.x[targetEid],
      Position.y[targetEid]
    )
    if (d <= BULLET_CONFIG.hitRadius) {
      onHit?.(eid, targetEid, BulletData.damage[eid])
      removeEntity(world, eid)
    }
  }
}
