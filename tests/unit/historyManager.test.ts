import { describe, it, expect, beforeEach } from 'vitest'
import { HistoryManager } from '../../src/renderer/console/HistoryManager'

describe('HistoryManager', () => {
  let history: HistoryManager

  beforeEach(() => {
    history = new HistoryManager()
  })

  it('should return null on navigateUp with empty history', () => {
    expect(history.navigateUp()).toBeNull()
  })

  it('should return null on navigateDown with empty history', () => {
    expect(history.navigateDown()).toBeNull()
  })

  it('should return most recent command on first navigateUp', () => {
    history.push('/help')
    history.push('/spawn enemy goblin 5 3')
    history.push('/tile set 3 3 wall')

    expect(history.navigateUp()).toBe('/tile set 3 3 wall')
  })

  it('should navigate up through history in reverse order', () => {
    history.push('/help')
    history.push('/spawn enemy goblin 5 3')
    history.push('/tile set 3 3 wall')

    expect(history.navigateUp()).toBe('/tile set 3 3 wall')
    expect(history.navigateUp()).toBe('/spawn enemy goblin 5 3')
    expect(history.navigateUp()).toBe('/help')
  })

  it('should clamp at oldest entry when navigating up past history', () => {
    history.push('/help')
    history.push('/spawn enemy goblin 5 3')

    expect(history.navigateUp()).toBe('/spawn enemy goblin 5 3')
    expect(history.navigateUp()).toBe('/help')
    // Should stay at oldest
    expect(history.navigateUp()).toBe('/help')
  })

  it('should navigate down back towards most recent', () => {
    history.push('/help')
    history.push('/spawn enemy goblin 5 3')
    history.push('/tile set 3 3 wall')

    // Go to oldest
    history.navigateUp()
    history.navigateUp()
    history.navigateUp()

    // Navigate back down
    expect(history.navigateDown()).toBe('/spawn enemy goblin 5 3')
    expect(history.navigateDown()).toBe('/tile set 3 3 wall')
  })

  it('should return null when navigating down past latest', () => {
    history.push('/help')
    history.push('/spawn enemy goblin 5 3')

    history.navigateUp()
    history.navigateUp()

    history.navigateDown()
    history.navigateDown()
    // Past latest → null (clear input)
    expect(history.navigateDown()).toBeNull()
  })

  it('should limit history to 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      history.push(`/cmd${i}`)
    }

    // Navigate to oldest — should be /cmd5 (first 5 got discarded)
    let oldest = ''
    for (let i = 0; i < 20; i++) {
      oldest = history.navigateUp() ?? ''
    }
    expect(oldest).toBe('/cmd5')
  })

  it('should reset navigation pointer', () => {
    history.push('/help')
    history.push('/spawn enemy goblin 5 3')

    history.navigateUp()
    history.navigateUp()

    history.reset()

    // After reset, navigateUp should start from most recent again
    expect(history.navigateUp()).toBe('/spawn enemy goblin 5 3')
  })

  it('should not add duplicate consecutive entries', () => {
    history.push('/help')
    history.push('/help')
    history.push('/help')

    expect(history.navigateUp()).toBe('/help')
    expect(history.navigateUp()).toBe('/help') // clamped, only 1 entry
  })

  it('should handle reset with empty history', () => {
    history.reset()
    expect(history.navigateUp()).toBeNull()
  })
})
