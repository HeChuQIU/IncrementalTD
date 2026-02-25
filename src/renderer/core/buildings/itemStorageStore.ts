export interface ItemStack {
  itemId: string
  count: number
}

export interface ItemStorage {
  capacity: number
  items: ItemStack[]
}

export const storageData = new Map<number, ItemStorage>()

export function initStorage(eid: number, capacity: number): void {
  storageData.set(eid, { capacity, items: [] })
}

export function addItem(eid: number, itemId: string, count: number): boolean {
  const storage = storageData.get(eid)
  if (!storage) return false

  const currentTotal = getTotalCount(eid)
  if (currentTotal + count > storage.capacity) {
    return false
  }

  const existingItem = storage.items.find(item => item.itemId === itemId)
  if (existingItem) {
    existingItem.count += count
  } else {
    storage.items.push({ itemId, count })
  }

  return true
}

export function getStorage(eid: number): ItemStorage | undefined {
  return storageData.get(eid)
}

export function getTotalCount(eid: number): number {
  const storage = storageData.get(eid)
  if (!storage) return 0
  return storage.items.reduce((sum, item) => sum + item.count, 0)
}

export function clearStorage(eid: number): void {
  storageData.delete(eid)
}
