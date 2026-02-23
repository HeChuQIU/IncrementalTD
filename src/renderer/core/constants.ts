export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

export const TOWER_CONFIG = {
  attackRange: 150,
  attackInterval: 1000, // ms
  attackDamage: 10,
  x: 400,
  y: 300
} as const

export const ENEMY_CONFIG = {
  spawnInterval: 2000, // ms
  maxHealth: 50,
  speed: 80 // px/s
} as const

export const BULLET_CONFIG = {
  speed: 300, // px/s
  lifetime: 3000, // ms
  hitRadius: 16 // px
} as const

/** Enemy path: left edge → right edge, straight through map center */
export const ENEMY_PATH: ReadonlyArray<{ x: number; y: number }> = [
  { x: -30, y: 300 },
  { x: 830, y: 300 }
]
