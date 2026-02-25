import { describe, it, expect, beforeEach } from 'vitest'
import { initStorage, addItem, getStorage, clearStorage, getTotalCount, storageData } from '../../src/renderer/core/buildings/itemStorageStore'

describe('itemStorageStore', () => {
  beforeEach(() => {
    storageData.clear()
  })

  it('should initialize storage for an entity', () => {
    initStorage(1, 20)
    const storage = getStorage(1)
    expect(storage).toBeDefined()
    expect(storage?.capacity).toBe(20)
    expect(storage?.items).toEqual([])
  })

  it('should add item successfully if under capacity', () => {
    initStorage(1, 20)
    const success = addItem(1, 'copper_ore', 5)
    expect(success).toBe(true)
    
    const storage = getStorage(1)
    expect(storage?.items).toHaveLength(1)
    expect(storage?.items[0]).toEqual({ itemId: 'copper_ore', count: 5 })
    expect(getTotalCount(1)).toBe(5)
  })

  it('should stack items of the same type', () => {
    initStorage(1, 20)
    addItem(1, 'copper_ore', 5)
    addItem(1, 'copper_ore', 10)
    
    const storage = getStorage(1)
    expect(storage?.items).toHaveLength(1)
    expect(storage?.items[0]).toEqual({ itemId: 'copper_ore', count: 15 })
    expect(getTotalCount(1)).toBe(15)
  })

  it('should return false and not add item if capacity is exceeded', () => {
    initStorage(1, 20)
    addItem(1, 'copper_ore', 15)
    
    const success = addItem(1, 'copper_ore', 10)
    expect(success).toBe(false)
    
    const storage = getStorage(1)
    expect(storage?.items[0].count).toBe(15) // Unchanged
  })

  it('should clear storage for an entity', () => {
    initStorage(1, 20)
    addItem(1, 'copper_ore', 5)
    
    clearStorage(1)
    expect(getStorage(1)).toBeUndefined()
  })
})
