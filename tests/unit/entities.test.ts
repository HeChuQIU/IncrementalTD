import { describe, it, expect } from 'vitest'
import { createWorld, hasComponent } from 'bitecs'
import { createTower } from '../../src/renderer/core/entities/tower'
import { createEnemy } from '../../src/renderer/core/entities/enemy'
import { createBullet } from '../../src/renderer/core/entities/bullet'
import {
  TowerTag,
  EnemyTag,
  BulletTag,
  Position,
  AttackRange,
  AttackDamage,
  AttackCooldown,
  Health,
  Speed,
  PathIndex,
  Velocity,
  BulletData
} from '../../src/renderer/core/components'
import { TOWER_CONFIG, ENEMY_CONFIG } from '../../src/renderer/core/constants'

describe('createTower', () => {
  it('attaches correct components and values', () => {
    const world = createWorld()
    const eid = createTower(world, 100, 200)

    expect(hasComponent(world, TowerTag, eid)).toBe(true)
    expect(hasComponent(world, Position, eid)).toBe(true)
    expect(Position.x[eid]).toBe(100)
    expect(Position.y[eid]).toBe(200)
    expect(AttackRange.radius[eid]).toBe(TOWER_CONFIG.attackRange)
    expect(AttackDamage.value[eid]).toBe(TOWER_CONFIG.attackDamage)
    expect(AttackCooldown.interval[eid]).toBe(TOWER_CONFIG.attackInterval)
    expect(AttackCooldown.targetEid[eid]).toBe(-1)
  })
})

describe('createEnemy', () => {
  it('attaches correct components and values', () => {
    const world = createWorld()
    const path = [
      { x: 0, y: 300 },
      { x: 800, y: 300 }
    ]
    const eid = createEnemy(world, 0, 300, path)

    expect(hasComponent(world, EnemyTag, eid)).toBe(true)
    expect(hasComponent(world, Health, eid)).toBe(true)
    expect(Health.current[eid]).toBe(ENEMY_CONFIG.maxHealth)
    expect(Health.max[eid]).toBe(ENEMY_CONFIG.maxHealth)
    expect(Speed.value[eid]).toBe(ENEMY_CONFIG.speed)
    expect(PathIndex.total[eid]).toBe(path.length)
    expect(PathIndex.current[eid]).toBe(0)
  })
})

describe('createBullet', () => {
  it('attaches correct components and values', () => {
    const world = createWorld()
    const eid = createBullet(world, 50, 60, 100, 200, 10, 99, 1000)

    expect(hasComponent(world, BulletTag, eid)).toBe(true)
    expect(Position.x[eid]).toBe(50)
    expect(Position.y[eid]).toBe(60)
    expect(Velocity.x[eid]).toBe(100)
    expect(Velocity.y[eid]).toBe(200)
    expect(BulletData.damage[eid]).toBe(10)
    expect(BulletData.targetEid[eid]).toBe(99)
  })
})
