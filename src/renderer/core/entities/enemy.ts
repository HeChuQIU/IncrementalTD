import { addComponent, addEntity, IWorld } from 'bitecs'
import { EnemyTag, Health, PathIndex, Position, Speed } from '../components'
import { setEntityPath } from '../pathStore'
import { ENEMY_CONFIG } from '../constants'

export function createEnemy(
  world: IWorld,
  x: number,
  y: number,
  path: Array<{ x: number; y: number }>
): number {
  const eid = addEntity(world)
  addComponent(world, EnemyTag, eid)
  addComponent(world, Position, eid)
  addComponent(world, Health, eid)
  addComponent(world, Speed, eid)
  addComponent(world, PathIndex, eid)

  Position.x[eid] = x
  Position.y[eid] = y
  Health.current[eid] = ENEMY_CONFIG.maxHealth
  Health.max[eid] = ENEMY_CONFIG.maxHealth
  Speed.value[eid] = ENEMY_CONFIG.speed
  PathIndex.current[eid] = 0
  PathIndex.total[eid] = path.length
  setEntityPath(eid, path)

  return eid
}
