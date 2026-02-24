const MAX_HISTORY = 20

/**
 * 命令历史管理器。
 * 存储最近 20 条已执行命令，支持上/下方向键导航。
 */
export class HistoryManager {
  private entries: string[] = []
  private pointer = -1

  /**
   * 添加一条命令到历史末尾。
   * 连续重复的命令不会添加。超过上限时丢弃最旧条目。
   */
  push(command: string): void {
    // Skip consecutive duplicates
    if (this.entries.length > 0 && this.entries[this.entries.length - 1] === command) {
      return
    }

    this.entries.push(command)

    // Trim oldest entries if over limit
    if (this.entries.length > MAX_HISTORY) {
      this.entries.splice(0, this.entries.length - MAX_HISTORY)
    }

    this.pointer = -1
  }

  /**
   * 向上导航（回溯到更旧的命令）。
   * 返回历史命令字符串，如果历史为空返回 null。
   */
  navigateUp(): string | null {
    if (this.entries.length === 0) return null

    if (this.pointer === -1) {
      // Start from most recent
      this.pointer = this.entries.length - 1
    } else if (this.pointer > 0) {
      this.pointer--
    }
    // else: already at oldest, clamp

    return this.entries[this.pointer]
  }

  /**
   * 向下导航（前进到更新的命令）。
   * 超过最新条目时返回 null（表示清空输入框）。
   */
  navigateDown(): string | null {
    if (this.entries.length === 0) return null

    if (this.pointer === -1) return null

    if (this.pointer < this.entries.length - 1) {
      this.pointer++
      return this.entries[this.pointer]
    }

    // Past latest — reset pointer and return null
    this.pointer = -1
    return null
  }

  /**
   * 重置导航指针到初始位置。
   * 每次打开控制台时调用。
   */
  reset(): void {
    this.pointer = -1
  }
}
