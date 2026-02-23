export {}

declare global {
  interface Window {
    electron: Record<string, never>
  }
}
