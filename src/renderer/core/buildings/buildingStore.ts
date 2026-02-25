// Building entity -> All occupied tiles
export const occupiedTilesData = new Map<number, Array<{ tx: number; ty: number }>>()

// "tx,ty" -> Building entity ID
export const tileOccupancyIndex = new Map<string, number>()

// Building entity -> Building Definition ID string
export const buildingDefIdData = new Map<number, string>()

export function setBuildingOccupancy(eid: number, tiles: Array<{ tx: number; ty: number }>): void {
  occupiedTilesData.set(eid, tiles)
  for (const { tx, ty } of tiles) {
    tileOccupancyIndex.set(`${tx},${ty}`, eid)
  }
}

export function clearBuildingOccupancy(eid: number): void {
  const tiles = occupiedTilesData.get(eid)
  if (tiles) {
    for (const { tx, ty } of tiles) {
      tileOccupancyIndex.delete(`${tx},${ty}`)
    }
    occupiedTilesData.delete(eid)
  }
}

export function getBuildingAtTile(tx: number, ty: number): number | undefined {
  return tileOccupancyIndex.get(`${tx},${ty}`)
}

export function setBuildingDefId(eid: number, defId: string): void {
  buildingDefIdData.set(eid, defId)
}

export function getBuildingDefId(eid: number): string | undefined {
  return buildingDefIdData.get(eid)
}
