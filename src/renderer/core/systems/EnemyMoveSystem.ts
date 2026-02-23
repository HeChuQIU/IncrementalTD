import { defineQuery, hasComponent, removeEntity, IWorld } from 'bitecs'
import { EnemyTag, PathIndex, Position, Speed } from '../components'
import { getEntityPath, removeEntityPath } from '../pathStore'
import { distance, normalizeVector } from '../../utils/math'

const enemyQuery = defineQuery([EnemyTag, Position, Speed, PathIndex])

const WAYPOINT_THRESHOLD = 8 // px to consider waypoint reached

export type EnemyReachedEndCallback = (eid: number) => void

export function enemyMoveSystem(
  world: IWorld,
  delta: number,
  onReachedEnd?: EnemyReachedEndCallback
): void {
  const entities = enemyQuery(world)
  const dt = delta / 1000

  for (const eid of entities) {
    if (!hasComponent(world, EnemyTag, eid)) continue

    const path = getEntityPath(eid)

    // Advance past any waypoints that are already within threshold
    while (PathIndex.current[eid] < path.length) {
      const wp = path[PathIndex.current[eid]]
      if (distance(Position.x[eid], Position.y[eid], wp.x, wp.y) <= WAYPOINT_THRESHOLD) {
        PathIndex.current[eid]++
      } else {
        break
      }
    }

    if (PathIndex.current[eid] >= path.length) {
      removeEntityPath(eid)
      removeEntity(world, eid)
      onReachedEnd?.(eid)
      continue
    }

    const target = path[PathIndex.current[eid]]
    const dir = normalizeVector(target.x - Position.x[eid], target.y - Position.y[eid])
    Position.x[eid] += dir.x * Speed.value[eid] * dt
    Position.y[eid] += dir.y * Speed.value[eid] * dt
  }
}
