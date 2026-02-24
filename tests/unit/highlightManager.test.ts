import { describe, it, expect, beforeEach } from 'vitest'
import { HighlightManager, parseCoordinatesFromInput } from '../../src/renderer/console/HighlightManager'

// Mock Phaser Graphics object
function createMockGraphics() {
  return {
    clear: () => {},
    lineStyle: () => {},
    strokeRect: () => {},
    strokeCircle: () => {},
    setDepth: () => {},
    destroy: () => {},
    setVisible: () => {}
  }
}

// Mock Phaser Scene
function createMockScene() {
  const mockGraphics = createMockGraphics()
  return {
    add: {
      graphics: () => mockGraphics
    },
    _mockGraphics: mockGraphics
  }
}

describe('HighlightManager', () => {
  let manager: HighlightManager
  let mockScene: ReturnType<typeof createMockScene>

  beforeEach(() => {
    mockScene = createMockScene()
    manager = new HighlightManager(mockScene as unknown as Phaser.Scene)
  })

  describe('highlightTile', () => {
    it('should set highlighted tile after calling highlightTile', () => {
      manager.highlightTile(5, 3)
      expect(manager.getHighlightedTile()).toEqual({ x: 5, y: 3 })
    })

    it('should update highlight when called with new coordinates', () => {
      manager.highlightTile(5, 3)
      manager.highlightTile(2, 7)
      expect(manager.getHighlightedTile()).toEqual({ x: 2, y: 7 })
    })

    it('should not throw on out-of-bounds coordinates', () => {
      expect(() => manager.highlightTile(-1, -1)).not.toThrow()
      expect(() => manager.highlightTile(999, 999)).not.toThrow()
    })
  })

  describe('clearHighlights', () => {
    it('should return null after clearHighlights', () => {
      manager.highlightTile(5, 3)
      manager.clearHighlights()
      expect(manager.getHighlightedTile()).toBeNull()
    })

    it('should not throw when clearing with nothing highlighted', () => {
      expect(() => manager.clearHighlights()).not.toThrow()
    })
  })
})

describe('parseCoordinatesFromInput', () => {
  it('should parse coordinates from spawn command', () => {
    expect(parseCoordinatesFromInput('/spawn enemy goblin 5 3')).toEqual({ x: 5, y: 3 })
  })

  it('should parse coordinates from tile command', () => {
    expect(parseCoordinatesFromInput('/tile set 3 3 wall')).toEqual({ x: 3, y: 3 })
  })

  it('should return null for incomplete coordinates', () => {
    expect(parseCoordinatesFromInput('/spawn enemy goblin 5')).toBeNull()
  })

  it('should return null for non-numeric tokens', () => {
    expect(parseCoordinatesFromInput('/spawn enemy goblin abc def')).toBeNull()
  })

  it('should return null for empty input', () => {
    expect(parseCoordinatesFromInput('')).toBeNull()
  })

  it('should find last pair of consecutive integers', () => {
    expect(parseCoordinatesFromInput('/tile set 4 2 wall')).toEqual({ x: 4, y: 2 })
  })
})
