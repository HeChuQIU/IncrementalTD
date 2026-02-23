import { describe, it, expect } from 'vitest'
import { createWorld, hasComponent } from 'bitecs'
import { createEnemy } from '../../src/renderer/core/entities/enemy'
import { applyDamage } from '../../src/renderer/core/systems/DamageSystem'
import { EnemyTag, Health } from '../../src/renderer/core/components'

const PATH = [
  { x: 0, y: 300 },
  { x: 800, y: 300 }
]

describe('applyDamage', () => {
  it('reduces health when damage < current health', () => {
    const world = createWorld()
    const eid = createEnemy(world, 0, 300, PATH)
    const initial = Health.current[eid]

    applyDamage(world, eid, 10)

    expect(Health.current[eid]).toBe(initial - 10)
    expect(hasComponent(world, EnemyTag, eid)).toBe(true)
  })

  it('removes entity when health drops to 0', () => {
    const world = createWorld()
    const eid = createEnemy(world, 0, 300, PATH)

    applyDamage(world, eid, 9999)

    expect(hasComponent(world, EnemyTag, eid)).toBe(false)
  })

  it('invokes onDied callback with entity id', () => {
    const world = createWorld()
    const eid = createEnemy(world, 0, 300, PATH)
    const died: number[] = []

    applyDamage(world, eid, 9999, (e) => died.push(e))

    expect(died).toContain(eid)
  })

  it('does nothing when target is not an enemy entity', () => {
    const world = createWorld()
    expect(() => applyDamage(world, 9999, 10)).not.toThrow()
  })
})
