// ─── Parameter Type Enum ──────────────────────────────────────────────────────
export enum ParameterType {
  Command = 'Command',
  EntityCategory = 'EntityCategory',
  EntitySubtype = 'EntitySubtype',
  TileType = 'TileType',
  Coordinate = 'Coordinate'
}

// ─── Parameter Definition ────────────────────────────────────────────────────
export interface ParameterDef {
  name: string
  type: ParameterType
  description: string
}

// ─── Console Message ─────────────────────────────────────────────────────────
export interface ConsoleMessage {
  content: string
  kind: 'input' | 'success' | 'error'
}

// ─── Completion Item ─────────────────────────────────────────────────────────
export interface CompletionItem {
  label: string
  description: string
}

// ─── Command Definition ─────────────────────────────────────────────────────
export interface CommandDef {
  name: string
  params: ParameterDef[]
  handler: (...args: string[]) => string
}
