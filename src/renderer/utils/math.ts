/** Euclidean distance between two points */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/** Returns a unit vector in the direction of (vx, vy). Returns {x:0, y:0} for zero vector. */
export function normalizeVector(vx: number, vy: number): { x: number; y: number } {
  const len = Math.sqrt(vx * vx + vy * vy)
  if (len === 0) return { x: 0, y: 0 }
  return { x: vx / len, y: vy / len }
}
