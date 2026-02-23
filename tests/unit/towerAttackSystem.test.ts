import { describe, it, expect, vi } from 'vitest'
import { createWorld } from 'bitecs'
import { createTower } from '../../src/renderer/core/entities/tower'
import { createEnemy } from '../../src/renderer/core/entities/enemy'
import { towerAttackSystem } from '../../src/renderer/core/systems/TowerAttackSystem'
import { AttackCooldown, BulletTag, Position } from '../../src/renderer/core/components'
import { defineQuery, hasComponent } from 'bitecs'

const bulletQuery = defineQuery([BulletTag])
const PATH = [
  { x: 0, y: 300 },
  { x: 800, y: 300 }
]

describe('towerAttackSystem', () => {
  it('fires a bullet when enemy is in range and cooldown expired', () => {
    const world = createWorld()
    createTower(world, 400, 300)
    createEnemy(world, 420, 300, PATH) // 20 px away — within 150 range

    const cb = vi.fn()
    towerAttackSystem(world, 2000, cb) // lastAttack=0, interval=1000 → fires

    expect(cb).toHaveBeenCalledOnce()
    expect(hasComponent(world, BulletTag, cb.mock.calls[0][0])).toBe(true)
    expect(bulletQuery(world).length).toBe(1)
  })

  it('does not fire when enemy is out of range', () => {
    const world = createWorld()
    createTower(world, 400, 300)
    createEnemy(world, 700, 300, PATH) // 300 px away — outside 150

    const cb = vi.fn()
    towerAttackSystem(world, 2000, cb)

    expect(cb).not.toHaveBeenCalled()
  })

  it('does not fire when cooldown has not expired', () => {
    const world = createWorld()
    const towerEid = createTower(world, 400, 300)
    createEnemy(world, 420, 300, PATH)
    AttackCooldown.lastAttackTime[towerEid] = 1500 // attacked 500 ms ago (interval = 1000)

    const cb = vi.fn()
    towerAttackSystem(world, 2000, cb)

    expect(cb).not.toHaveBeenCalled()
  })

  it('clears target lock when enemy leaves attack range', () => {
    const world = createWorld()
    const towerEid = createTower(world, 400, 300)
    const enemyEid = createEnemy(world, 420, 300, PATH)

    // First tick — tower acquires target
    towerAttackSystem(world, 2000)
    expect(AttackCooldown.targetEid[towerEid]).toBe(enemyEid)

    // Move enemy out of range, advance time past cooldown
    Position.x[enemyEid] = 700
    towerAttackSystem(world, 4000)

    expect(AttackCooldown.targetEid[towerEid]).toBe(-1)
  })
})
