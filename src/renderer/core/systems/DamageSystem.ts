import { hasComponent, removeEntity, IWorld } from 'bitecs'
import { EnemyTag, Health } from '../components'
import { removeEntityPath } from '../pathStore'

export type EnemyDiedCallback = (eid: number) => void

/**
 * Applies damage to an enemy entity.
 * Removes the entity (and its path data) when health drops to 0.
 */
export function applyDamage(
  world: IWorld,
  targetEid: number,
  damage: number,
  onDied?: EnemyDiedCallback
): void {
  if (!hasComponent(world, EnemyTag, targetEid)) return

  Health.current[targetEid] -= damage

  if (Health.current[targetEid] <= 0) {
    removeEntityPath(targetEid)
    removeEntity(world, targetEid)
    onDied?.(targetEid)
  }
}
