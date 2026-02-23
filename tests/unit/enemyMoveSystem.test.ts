import { describe, it, expect } from 'vitest'
import { createWorld, hasComponent } from 'bitecs'
import { createEnemy } from '../../src/renderer/core/entities/enemy'
import { enemyMoveSystem } from '../../src/renderer/core/systems/EnemyMoveSystem'
import { EnemyTag, Position } from '../../src/renderer/core/components'

describe('enemyMoveSystem', () => {
  it('moves enemy toward the next waypoint', () => {
    const world = createWorld()
    const path = [
      { x: 0, y: 300 },
      { x: 800, y: 300 }
    ]
    const eid = createEnemy(world, 0, 300, path)
    const initialX = Position.x[eid]

    enemyMoveSystem(world, 100) // 100 ms delta

    expect(Position.x[eid]).toBeGreaterThan(initialX)
    expect(hasComponent(world, EnemyTag, eid)).toBe(true)
  })

  it('removes entity when it reaches the end of the path', () => {
    const world = createWorld()
    // Path so short the enemy reaches the endpoint in one step
    const path = [
      { x: 0, y: 300 },
      { x: 4, y: 300 } // 4 px, within WAYPOINT_THRESHOLD (8) after any movement
    ]
    const eid = createEnemy(world, 0, 300, path)

    // Run several frames until removed
    for (let i = 0; i < 20; i++) {
      if (!hasComponent(world, EnemyTag, eid)) break
      enemyMoveSystem(world, 100)
    }

    expect(hasComponent(world, EnemyTag, eid)).toBe(false)
  })

  it('invokes onReachedEnd callback when enemy exits the map', () => {
    const world = createWorld()
    const path = [
      { x: 0, y: 300 },
      { x: 4, y: 300 }
    ]
    const eid = createEnemy(world, 0, 300, path)
    const ended: number[] = []

    for (let i = 0; i < 20; i++) {
      if (!hasComponent(world, EnemyTag, eid)) break
      enemyMoveSystem(world, 100, (e) => ended.push(e))
    }

    expect(ended).toContain(eid)
  })
})
