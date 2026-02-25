export interface PlacementResult {
  ok: boolean
  reason?: string
}

export type PlacementCondition = (
  tx: number,
  ty: number,
  def: BuildingDef,
  getTileAt?: (tx: number, ty: number) => string
) => PlacementResult

export interface BuildingDef {
  readonly id: string
  readonly displayName: string
  readonly size: { readonly w: number; readonly h: number }
  readonly rotatable: boolean
  readonly placementConditions: readonly PlacementCondition[]
  readonly storageCapacity?: number
  readonly productionInterval?: number
  readonly productionItemId?: string
}

export class BuildingRegistry {
  private readonly definitions = new Map<string, BuildingDef>()

  register(def: BuildingDef): void {
    if (this.definitions.has(def.id)) {
      throw new Error(`Building definition with id '${def.id}' is already registered.`)
    }
    this.definitions.set(def.id, Object.freeze({ ...def }))
  }

  get(id: string): BuildingDef | undefined {
    return this.definitions.get(id)
  }

  getAll(): ReadonlyArray<BuildingDef> {
    return Array.from(this.definitions.values())
  }
}

export function createBuildingRegistry(): BuildingRegistry {
  return new BuildingRegistry()
}

export const buildingRegistry = createBuildingRegistry()
