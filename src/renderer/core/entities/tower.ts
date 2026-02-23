import { addComponent, addEntity, IWorld } from 'bitecs'
import { AttackCooldown, AttackDamage, AttackRange, Position, TowerTag } from '../components'
import { TOWER_CONFIG } from '../constants'

export function createTower(world: IWorld, x: number, y: number): number {
  const eid = addEntity(world)
  addComponent(world, TowerTag, eid)
  addComponent(world, Position, eid)
  addComponent(world, AttackRange, eid)
  addComponent(world, AttackDamage, eid)
  addComponent(world, AttackCooldown, eid)

  Position.x[eid] = x
  Position.y[eid] = y
  AttackRange.radius[eid] = TOWER_CONFIG.attackRange
  AttackDamage.value[eid] = TOWER_CONFIG.attackDamage
  AttackCooldown.interval[eid] = TOWER_CONFIG.attackInterval
  AttackCooldown.lastAttackTime[eid] = 0
  AttackCooldown.targetEid[eid] = -1

  return eid
}
