import { createStore } from 'zustand/vanilla'
import type { ConsoleMessage } from './types'

const MAX_MESSAGES = 50

interface ConsoleState {
  isOpen: boolean
  messages: ConsoleMessage[]
}

interface ConsoleActions {
  openConsole: () => void
  closeConsole: () => void
  toggleConsole: () => void
  appendMessage: (msg: ConsoleMessage) => void
  clearMessages: () => void
}

export const consoleStore = createStore<ConsoleState & ConsoleActions>((set) => ({
  isOpen: false,
  messages: [],

  openConsole: () => set({ isOpen: true }),
  closeConsole: () => set({ isOpen: false }),
  toggleConsole: () => set((state) => ({ isOpen: !state.isOpen })),

  appendMessage: (msg) =>
    set((state) => {
      const updated = [...state.messages, msg]
      // Keep only the most recent MAX_MESSAGES entries
      if (updated.length > MAX_MESSAGES) {
        return { messages: updated.slice(updated.length - MAX_MESSAGES) }
      }
      return { messages: updated }
    }),

  clearMessages: () => set({ messages: [] })
}))
