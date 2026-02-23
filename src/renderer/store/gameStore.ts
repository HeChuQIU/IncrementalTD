import { create } from 'zustand'

interface GameState {
  isPlaying: boolean
  score: number
  enemiesKilled: number
}

interface GameActions {
  startGame: () => void
  pauseGame: () => void
  incrementScore: (points: number) => void
  incrementKills: () => void
  reset: () => void
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  isPlaying: false,
  score: 0,
  enemiesKilled: 0,
  startGame: () => set({ isPlaying: true }),
  pauseGame: () => set({ isPlaying: false }),
  incrementScore: (points) => set((state) => ({ score: state.score + points })),
  incrementKills: () => set((state) => ({ enemiesKilled: state.enemiesKilled + 1 })),
  reset: () => set({ isPlaying: false, score: 0, enemiesKilled: 0 })
}))
