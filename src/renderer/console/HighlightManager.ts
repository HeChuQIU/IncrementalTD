import Phaser from 'phaser'

const TILE_SIZE = 32
const HIGHLIGHT_COLOR = 0xffff44
const HIGHLIGHT_ALPHA = 0.8
const HIGHLIGHT_LINE_WIDTH = 2

export class HighlightManager {
  private graphics: Phaser.GameObjects.Graphics
  private highlightedTile: { x: number; y: number } | null = null

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(999)
  }

  /**
   * Highlight a tile at grid coordinates (x, y).
   * Clears any previous highlight first.
   */
  highlightTile(x: number, y: number): void {
    this.graphics.clear()
    this.highlightedTile = { x, y }

    const pixelX = x * TILE_SIZE
    const pixelY = y * TILE_SIZE

    this.graphics.lineStyle(HIGHLIGHT_LINE_WIDTH, HIGHLIGHT_COLOR, HIGHLIGHT_ALPHA)
    this.graphics.strokeRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE)
  }

  /**
   * Highlight an entity by drawing a circle at its position.
   * (Entity position lookup would need ECS integration — accepts pixel coords directly.)
   */
  highlightEntity(pixelX: number, pixelY: number): void {
    this.graphics.clear()
    this.highlightedTile = null

    this.graphics.lineStyle(HIGHLIGHT_LINE_WIDTH, HIGHLIGHT_COLOR, HIGHLIGHT_ALPHA)
    this.graphics.strokeCircle(pixelX, pixelY, TILE_SIZE / 2)
  }

  /**
   * Clear all highlights.
   */
  clearHighlights(): void {
    this.graphics.clear()
    this.highlightedTile = null
  }

  /**
   * Get the currently highlighted tile coordinates, or null.
   */
  getHighlightedTile(): { x: number; y: number } | null {
    return this.highlightedTile
  }
}

/**
 * Parse grid coordinates (x, y) from a console input string.
 * Looks for the first pair of consecutive integer tokens.
 * Returns null if no valid coordinate pair is found.
 */
export function parseCoordinatesFromInput(input: string): { x: number; y: number } | null {
  if (!input || !input.trim()) return null

  const tokens = input.trim().split(/\s+/)

  // Find the first pair of consecutive integer tokens
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = parseInt(tokens[i], 10)
    const b = parseInt(tokens[i + 1], 10)
    if (!isNaN(a) && !isNaN(b) && tokens[i] === String(a) && tokens[i + 1] === String(b)) {
      return { x: a, y: b }
    }
  }

  return null
}
