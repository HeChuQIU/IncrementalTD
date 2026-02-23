import { IWorld } from 'bitecs'
import { createEnemy } from '../entities/enemy'
import { ENEMY_CONFIG, ENEMY_PATH } from '../constants'

let lastSpawnTime = 0

/** Reset spawn timer – call between test runs or on scene restart */
export function resetSpawnTimer(): void {
  lastSpawnTime = 0
}

export type EnemySpawnedCallback = (eid: number) => void

export function enemySpawnSystem(
  world: IWorld,
  time: number,
  onSpawned?: EnemySpawnedCallback
): void {
  if (time - lastSpawnTime >= ENEMY_CONFIG.spawnInterval) {
    lastSpawnTime = time
    const start = ENEMY_PATH[0]
    const eid = createEnemy(world, start.x, start.y, [...ENEMY_PATH])
    onSpawned?.(eid)
  }
}
