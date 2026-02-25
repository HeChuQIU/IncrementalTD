import { defineComponent, Types } from 'bitecs'

// ─── Positional ───────────────────────────────────────────────────────────────
export const Position = defineComponent({ x: Types.f32, y: Types.f32 })

// ─── Tower ────────────────────────────────────────────────────────────────────
export const AttackRange = defineComponent({ radius: Types.f32 })
export const AttackDamage = defineComponent({ value: Types.f32 })
/** interval: ms between attacks | lastAttackTime: last attack timestamp | targetEid: -1 = none */
export const AttackCooldown = defineComponent({
  interval: Types.f32,
  lastAttackTime: Types.f32,
  targetEid: Types.i32
})

// ─── Enemy ────────────────────────────────────────────────────────────────────
export const Health = defineComponent({ current: Types.f32, max: Types.f32 })
export const Speed = defineComponent({ value: Types.f32 })
/** Path waypoints are stored externally in pathStore; only the current index lives here */
export const PathIndex = defineComponent({ current: Types.i32, total: Types.i32 })

// ─── Bullet ───────────────────────────────────────────────────────────────────
export const Velocity = defineComponent({ x: Types.f32, y: Types.f32 })
export const BulletData = defineComponent({ targetEid: Types.i32, damage: Types.f32 })
export const Lifetime = defineComponent({ spawnTime: Types.f32, duration: Types.f32 })

// ─── Tags (marker components) ─────────────────────────────────────────────────
export const TowerTag = defineComponent({ marker: Types.ui8 })
export const EnemyTag = defineComponent({ marker: Types.ui8 })
export const BulletTag = defineComponent({ marker: Types.ui8 })
export const BuildingTag = defineComponent({ marker: Types.ui8 })
export const DrillTag = defineComponent({ marker: Types.ui8 })

// ─── Building System ──────────────────────────────────────────────────────────
export const GridPosition = defineComponent({ tileX: Types.i16, tileY: Types.i16 })
export const BuildingSize = defineComponent({ w: Types.i8, h: Types.i8 })
export const Rotation = defineComponent({ value: Types.ui8 })
export const ProductionCooldown = defineComponent({
  interval: Types.f32,
  lastProductionTime: Types.f32
})
