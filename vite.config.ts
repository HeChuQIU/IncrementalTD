import { defineConfig } from 'vite'
import { resolve } from 'path'

// Standalone renderer config – used by `pnpm dev:web` and Playwright
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer')
    }
  },
  server: {
    port: 5173
  }
})
