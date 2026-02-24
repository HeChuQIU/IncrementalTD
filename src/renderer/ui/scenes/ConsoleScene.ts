import Phaser from 'phaser'
import { consoleStore } from '../../console/ConsoleStore'
import { commandRegistry } from '../../console/CommandRegistry'
import { registerHelpCommand } from '../../console/commands/helpCommand'
import { registerSpawnCommand } from '../../console/commands/spawnCommand'
import { registerTileCommand } from '../../console/commands/tileCommand'
import { registerClearCommand } from '../../console/commands/clearCommand'
import { HistoryManager } from '../../console/HistoryManager'
import { HighlightManager, parseCoordinatesFromInput } from '../../console/HighlightManager'
import { completionEngine } from '../../console/CompletionEngine'
import type { ConsoleMessage } from '../../console/types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'

const CONSOLE_HEIGHT_RATIO = 0.4
const CONSOLE_BG_ALPHA = 0.75
const CONSOLE_BG_COLOR = 0x1a1a2e
const INPUT_BG_COLOR = 0x16213e
const MAX_VISIBLE_LINES = 12
const LINE_HEIGHT = 20
const PADDING = 10
const INPUT_HEIGHT = 30

const COLOR_MAP: Record<ConsoleMessage['kind'], string> = {
  input: '#ffffff',
  success: '#44ff44',
  error: '#ff4444'
}

export class ConsoleScene extends Phaser.Scene {
  private consoleContainer!: Phaser.GameObjects.Container
  private bgGraphics!: Phaser.GameObjects.Graphics
  private inputBg!: Phaser.GameObjects.Graphics
  private inputText!: Phaser.GameObjects.Text
  private messageTexts: Phaser.GameObjects.Text[] = []
  private cursorBlink!: Phaser.GameObjects.Rectangle
  private inputBuffer = ''
  private cursorVisible = true
  private cursorTimer?: Phaser.Time.TimerEvent
  private scrollOffset = 0

  // ─── Completion state ───────────────────────────────────────────────
  private completionItems: import('../../console/types').CompletionItem[] = []
  private completionIndex = -1
  private completionTexts: Phaser.GameObjects.Text[] = []
  private completionBg?: Phaser.GameObjects.Graphics

  // ─── History state ──────────────────────────────────────────────────
  private historyManager?: import('../../console/HistoryManager').HistoryManager

  // ─── Highlight state ───────────────────────────────────────────────
  private highlightManager?: import('../../console/HighlightManager').HighlightManager

  private consoleHeight = 0
  private consoleY = 0
  private commandsRegistered = false

  constructor() {
    super({ key: 'ConsoleScene' })
  }

  create(): void {
    this.consoleHeight = GAME_HEIGHT * CONSOLE_HEIGHT_RATIO
    this.consoleY = GAME_HEIGHT - this.consoleHeight

    // Register commands once
    if (!this.commandsRegistered) {
      registerHelpCommand()
      registerSpawnCommand()
      registerTileCommand()
      registerClearCommand()
      this.commandsRegistered = true
    }

    // Instantiate managers
    if (!this.historyManager) {
      this.historyManager = new HistoryManager()
    }
    if (!this.highlightManager) {
      this.highlightManager = new HighlightManager(this.scene.get('GameScene') ?? this)
    }

    // Create container for all console elements
    this.consoleContainer = this.add.container(0, this.consoleY)
    this.consoleContainer.setDepth(1000)

    // ─── Background ─────────────────────────────────────────────────
    this.bgGraphics = this.add.graphics()
    this.bgGraphics.fillStyle(CONSOLE_BG_COLOR, CONSOLE_BG_ALPHA)
    this.bgGraphics.fillRect(0, 0, GAME_WIDTH, this.consoleHeight)
    this.consoleContainer.add(this.bgGraphics)

    // ─── Input background ───────────────────────────────────────────
    this.inputBg = this.add.graphics()
    this.inputBg.fillStyle(INPUT_BG_COLOR, 0.9)
    this.inputBg.fillRect(PADDING, this.consoleHeight - INPUT_HEIGHT - PADDING / 2, GAME_WIDTH - PADDING * 2, INPUT_HEIGHT)
    this.consoleContainer.add(this.inputBg)

    // ─── Input text ─────────────────────────────────────────────────
    this.inputText = this.add.text(PADDING + 8, this.consoleHeight - INPUT_HEIGHT - PADDING / 2 + 6, '> ', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Consolas, monospace'
    })
    this.consoleContainer.add(this.inputText)

    // ─── Cursor ─────────────────────────────────────────────────────
    this.cursorBlink = this.add.rectangle(
      PADDING + 8 + this.inputText.width,
      this.consoleHeight - INPUT_HEIGHT - PADDING / 2 + 6,
      2,
      16,
      0xffffff
    )
    this.cursorBlink.setOrigin(0, 0)
    this.consoleContainer.add(this.cursorBlink)

    this.cursorTimer = this.time.addEvent({
      delay: 530,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible
        this.cursorBlink.setVisible(this.cursorVisible)
      }
    })

    // ─── Keyboard input ─────────────────────────────────────────────
    this.input.keyboard?.on('keydown', this.handleKeyDown, this)

    // Start hidden
    this.consoleContainer.setVisible(false)

    // Subscribe to store changes
    consoleStore.subscribe((state) => {
      this.consoleContainer.setVisible(state.isOpen)
      if (state.isOpen) {
        this.historyManager?.reset()
        this.refreshMessages()
      } else {
        this.highlightManager?.clearHighlights()
      }
    })
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!consoleStore.getState().isOpen) return

    // Prevent game scene from receiving input
    event.stopPropagation()

    switch (event.key) {
      case 'Escape':
        consoleStore.getState().closeConsole()
        this.highlightManager?.clearHighlights()
        this.hideCompletions()
        break

      case 'Enter':
        if (this.completionItems.length > 0 && this.completionIndex >= 0) {
          // Apply selected completion
          this.applyCompletion(this.completionItems[this.completionIndex].label)
        } else {
          this.executeCurrentInput()
        }
        break

      case 'Tab':
        event.preventDefault()
        if (this.completionItems.length > 0) {
          this.applyCompletion(this.completionItems[Math.max(0, this.completionIndex)].label)
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (this.completionItems.length > 0) {
          this.completionIndex = Math.max(0, this.completionIndex - 1)
          this.renderCompletions()
        } else if (this.historyManager) {
          const cmd = this.historyManager.navigateUp()
          if (cmd !== null) {
            this.inputBuffer = cmd
            this.updateInputDisplay()
          }
        }
        break

      case 'ArrowDown':
        event.preventDefault()
        if (this.completionItems.length > 0) {
          this.completionIndex = Math.min(this.completionItems.length - 1, this.completionIndex + 1)
          this.renderCompletions()
        } else if (this.historyManager) {
          const cmd = this.historyManager.navigateDown()
          if (cmd !== null) {
            this.inputBuffer = cmd
          } else {
            this.inputBuffer = ''
          }
          this.updateInputDisplay()
        }
        break

      case 'Backspace':
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1)
          this.updateInputDisplay()
          this.updateCompletions()
          this.updateHighlights()
        }
        break

      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          // Skip backtick to avoid toggling console
          if (event.key === '`') break
          this.inputBuffer += event.key
          this.updateInputDisplay()
          this.updateCompletions()
          this.updateHighlights()
        }
        break
    }
  }

  private executeCurrentInput(): void {
    const input = this.inputBuffer.trim()
    if (!input) return

    // Append input message (white)
    consoleStore.getState().appendMessage({ content: `> ${input}`, kind: 'input' })

    // Execute command
    try {
      const result = commandRegistry.execute(input)
      consoleStore.getState().appendMessage({ content: result, kind: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      consoleStore.getState().appendMessage({ content: msg, kind: 'error' })
    }

    // Push to history
    this.historyManager?.push(input)

    // Clear input
    this.inputBuffer = ''
    this.updateInputDisplay()
    this.hideCompletions()
    this.refreshMessages()

    // Auto-scroll to bottom
    const totalMessages = consoleStore.getState().messages.length
    this.scrollOffset = Math.max(0, totalMessages - MAX_VISIBLE_LINES)
  }

  private updateInputDisplay(): void {
    this.inputText.setText(`> ${this.inputBuffer}`)
    // Update cursor position
    this.cursorBlink.setX(PADDING + 8 + this.inputText.width)
    this.cursorVisible = true
    this.cursorBlink.setVisible(true)
  }

  private refreshMessages(): void {
    // Clear old message texts
    this.messageTexts.forEach((t) => t.destroy())
    this.messageTexts = []

    const messages = consoleStore.getState().messages
    const startIdx = Math.max(0, this.scrollOffset)
    const endIdx = Math.min(messages.length, startIdx + MAX_VISIBLE_LINES)
    const messageAreaHeight = this.consoleHeight - INPUT_HEIGHT - PADDING * 2
    const startY = messageAreaHeight - (endIdx - startIdx) * LINE_HEIGHT

    for (let i = startIdx; i < endIdx; i++) {
      const msg = messages[i]
      const y = startY + (i - startIdx) * LINE_HEIGHT
      const text = this.add.text(PADDING + 8, y, msg.content, {
        fontSize: '13px',
        color: COLOR_MAP[msg.kind],
        fontFamily: 'Consolas, monospace',
        wordWrap: { width: GAME_WIDTH - PADDING * 4 }
      })
      this.consoleContainer.add(text)
      this.messageTexts.push(text)
    }
  }

  // ─── Completion methods (populated in Phase 4) ──────────────────────

  updateCompletions(): void {
    this.completionItems = completionEngine.getCompletions(this.inputBuffer)
    this.completionIndex = this.completionItems.length > 0 ? 0 : -1
    this.renderCompletions()
  }

  renderCompletions(): void {
    this.clearCompletionUI()

    if (this.completionItems.length === 0) return

    const inputY = this.consoleHeight - INPUT_HEIGHT - PADDING / 2
    const itemHeight = 22
    const totalHeight = this.completionItems.length * itemHeight + 4

    // Background
    this.completionBg = this.add.graphics()
    this.completionBg.fillStyle(0x0a0a1a, 0.95)
    this.completionBg.fillRect(PADDING, inputY - totalHeight - 4, GAME_WIDTH - PADDING * 2, totalHeight)
    this.consoleContainer.add(this.completionBg)

    // Items
    this.completionItems.forEach((item, idx) => {
      const y = inputY - totalHeight - 4 + 2 + idx * itemHeight
      const isSelected = idx === this.completionIndex
      const color = isSelected ? '#ffff44' : '#aaaacc'
      const prefix = isSelected ? '► ' : '  '
      const text = this.add.text(PADDING + 12, y, `${prefix}${item.label}  ${item.description}`, {
        fontSize: '12px',
        color,
        fontFamily: 'Consolas, monospace'
      })
      this.consoleContainer.add(text)
      this.completionTexts.push(text)
    })
  }

  hideCompletions(): void {
    this.completionItems = []
    this.completionIndex = -1
    this.clearCompletionUI()
  }

  private clearCompletionUI(): void {
    this.completionTexts.forEach((t) => t.destroy())
    this.completionTexts = []
    this.completionBg?.destroy()
    this.completionBg = undefined
  }

  private applyCompletion(label: string): void {
    const tokens = this.inputBuffer.split(/\s+/)
    if (tokens.length <= 1) {
      // Completing the command name
      this.inputBuffer = '/' + label + ' '
    } else {
      // Completing a parameter — replace last token
      tokens[tokens.length - 1] = label
      this.inputBuffer = tokens.join(' ') + ' '
    }
    this.updateInputDisplay()
    this.hideCompletions()
    this.updateHighlights()
  }

  // ─── Highlight methods (populated in Phase 5) ──────────────────────

  updateHighlights(): void {
    if (!this.highlightManager) return
    const coords = parseCoordinatesFromInput(this.inputBuffer)
    if (coords) {
      this.highlightManager.highlightTile(coords.x, coords.y)
    } else {
      this.highlightManager.clearHighlights()
    }
  }

  // ─── Integration setters ───────────────────────────────────────────

  setHistoryManager(hm: import('../../console/HistoryManager').HistoryManager): void {
    this.historyManager = hm
  }

  setHighlightManager(hm: import('../../console/HighlightManager').HighlightManager): void {
    this.highlightManager = hm
  }
}

