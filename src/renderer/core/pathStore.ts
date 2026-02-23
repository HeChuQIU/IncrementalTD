/**
 * External storage for per-entity path waypoints.
 * bitECS typed arrays cannot hold nested arrays, so we keep them here keyed by entity ID.
 */
const pathData = new Map<number, Array<{ x: number; y: number }>>()

export function setEntityPath(eid: number, points: Array<{ x: number; y: number }>): void {
  pathData.set(eid, [...points])
}

export function getEntityPath(eid: number): Array<{ x: number; y: number }> {
  return pathData.get(eid) ?? []
}

export function removeEntityPath(eid: number): void {
  pathData.delete(eid)
}

/** Clears all stored paths – useful in tests between runs */
export function clearAllPaths(): void {
  pathData.clear()
}
