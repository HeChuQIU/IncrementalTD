import { createStore } from 'zustand/vanilla'
import type { ConsoleMessage } from './types'

const MAX_MESSAGES = 50

interface ConsoleState {
  isOpen: boolean
  messages: ConsoleMessage[]
  pendingInput: string | null
}

interface ConsoleActions {
  openConsole: () => void
  closeConsole: () => void
  toggleConsole: () => void
  /** Open the console and pre-fill the input field with `cmd`. */
  openConsoleWithInput: (cmd: string) => void
  clearPendingInput: () => void
  appendMessage: (msg: ConsoleMessage) => void
  clearMessages: () => void
}

export const consoleStore = createStore<ConsoleState & ConsoleActions>((set) => ({
  isOpen: false,
  messages: [],
  pendingInput: null,

  openConsole: () => set({ isOpen: true }),
  closeConsole: () => set({ isOpen: false }),
  toggleConsole: () => set((state) => ({ isOpen: !state.isOpen })),
  openConsoleWithInput: (cmd) => set({ isOpen: true, pendingInput: cmd }),
  clearPendingInput: () => set({ pendingInput: null }),

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
