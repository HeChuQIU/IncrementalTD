import { describe, it, expect, beforeEach } from 'vitest'
import { consoleStore } from '../../src/renderer/console/ConsoleStore'

describe('ConsoleStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    consoleStore.setState({ isOpen: false, messages: [] })
  })

  describe('initial state', () => {
    it('should have isOpen as false', () => {
      expect(consoleStore.getState().isOpen).toBe(false)
    })

    it('should have empty messages array', () => {
      expect(consoleStore.getState().messages).toEqual([])
    })
  })

  describe('openConsole / closeConsole / toggleConsole', () => {
    it('should set isOpen to true on openConsole', () => {
      consoleStore.getState().openConsole()
      expect(consoleStore.getState().isOpen).toBe(true)
    })

    it('should set isOpen to false on closeConsole', () => {
      consoleStore.getState().openConsole()
      consoleStore.getState().closeConsole()
      expect(consoleStore.getState().isOpen).toBe(false)
    })

    it('should toggle isOpen on toggleConsole', () => {
      consoleStore.getState().toggleConsole()
      expect(consoleStore.getState().isOpen).toBe(true)
      consoleStore.getState().toggleConsole()
      expect(consoleStore.getState().isOpen).toBe(false)
    })
  })

  describe('appendMessage', () => {
    it('should add a message to messages array', () => {
      consoleStore.getState().appendMessage({ content: 'hello', kind: 'input' })
      expect(consoleStore.getState().messages).toHaveLength(1)
      expect(consoleStore.getState().messages[0]).toEqual({ content: 'hello', kind: 'input' })
    })

    it('should add multiple messages in order', () => {
      consoleStore.getState().appendMessage({ content: 'cmd1', kind: 'input' })
      consoleStore.getState().appendMessage({ content: 'ok', kind: 'success' })
      consoleStore.getState().appendMessage({ content: 'fail', kind: 'error' })
      const msgs = consoleStore.getState().messages
      expect(msgs).toHaveLength(3)
      expect(msgs[0].kind).toBe('input')
      expect(msgs[1].kind).toBe('success')
      expect(msgs[2].kind).toBe('error')
    })

    it('should discard oldest messages when exceeding 50', () => {
      // Add 52 messages
      for (let i = 0; i < 52; i++) {
        consoleStore.getState().appendMessage({ content: `msg-${i}`, kind: 'input' })
      }
      const msgs = consoleStore.getState().messages
      expect(msgs).toHaveLength(50)
      // First message should be msg-2 (0 and 1 discarded)
      expect(msgs[0].content).toBe('msg-2')
      expect(msgs[49].content).toBe('msg-51')
    })
  })

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      consoleStore.getState().appendMessage({ content: 'test', kind: 'input' })
      consoleStore.getState().appendMessage({ content: 'test2', kind: 'success' })
      consoleStore.getState().clearMessages()
      expect(consoleStore.getState().messages).toEqual([])
    })
  })
})
