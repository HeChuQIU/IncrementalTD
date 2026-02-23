import { addComponent, addEntity, IWorld } from 'bitecs'
import { BulletData, BulletTag, Lifetime, Position, Velocity } from '../components'
import { BULLET_CONFIG } from '../constants'

export function createBullet(
  world: IWorld,
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  targetEid: number,
  spawnTime: number
): number {
  const eid = addEntity(world)
  addComponent(world, BulletTag, eid)
  addComponent(world, Position, eid)
  addComponent(world, Velocity, eid)
  addComponent(world, BulletData, eid)
  addComponent(world, Lifetime, eid)

  Position.x[eid] = x
  Position.y[eid] = y
  Velocity.x[eid] = vx
  Velocity.y[eid] = vy
  BulletData.targetEid[eid] = targetEid
  BulletData.damage[eid] = damage
  Lifetime.spawnTime[eid] = spawnTime
  Lifetime.duration[eid] = BULLET_CONFIG.lifetime

  return eid
}
