import { describe, it, expect, beforeEach } from 'vitest'
import { createWorld, defineQuery, hasComponent } from 'bitecs'
import { enemySpawnSystem, resetSpawnTimer } from '../../src/renderer/core/systems/EnemySpawnSystem'
import { EnemyTag } from '../../src/renderer/core/components'
import { ENEMY_CONFIG } from '../../src/renderer/core/constants'

const enemyQuery = defineQuery([EnemyTag])

describe('enemySpawnSystem', () => {
  beforeEach(() => {
    resetSpawnTimer()
  })

  it('spawns an enemy when time reaches the spawn interval', () => {
    const world = createWorld()
    enemySpawnSystem(world, ENEMY_CONFIG.spawnInterval)
    expect(enemyQuery(world).length).toBe(1)
  })

  it('spawns two enemies after two full intervals', () => {
    const world = createWorld()
    enemySpawnSystem(world, ENEMY_CONFIG.spawnInterval)
    enemySpawnSystem(world, ENEMY_CONFIG.spawnInterval * 2)
    expect(enemyQuery(world).length).toBe(2)
  })

  it('does not spawn before the interval elapses', () => {
    const world = createWorld()
    enemySpawnSystem(world, ENEMY_CONFIG.spawnInterval - 1)
    expect(enemyQuery(world).length).toBe(0)
  })

  it('invokes onSpawned callback with the new entity id', () => {
    const world = createWorld()
    const spawned: number[] = []
    enemySpawnSystem(world, ENEMY_CONFIG.spawnInterval, (eid) => spawned.push(eid))

    expect(spawned.length).toBe(1)
    expect(hasComponent(world, EnemyTag, spawned[0])).toBe(true)
  })
})
