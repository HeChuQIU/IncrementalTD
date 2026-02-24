import Phaser from 'phaser'
import {
  RoundRectangle,
  BBCodeText
} from 'phaser3-rex-plugins/templates/ui/ui-components.js'
import { consoleStore } from '../../console/ConsoleStore'
import { commandRegistry } from '../../console/CommandRegistry'
import { registerHelpCommand } from '../../console/commands/helpCommand'
import { registerSpawnCommand } from '../../console/commands/spawnCommand'
import { registerTileCommand } from '../../console/commands/tileCommand'
import { registerClearCommand } from '../../console/commands/clearCommand'
import { HistoryManager } from '../../console/HistoryManager'
import { HighlightManager, parseCoordinatesFromInput } from '../../console/HighlightManager'
import { completionEngine } from '../../console/CompletionEngine'
import type { ConsoleMessage, CompletionItem } from '../../console/types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'

// ─── Layout constants ────────────────────────────────────────────────────────
const CONSOLE_HEIGHT_RATIO = 0.4
const CONSOLE_BG_ALPHA = 0.75
const CONSOLE_BG_COLOR = 0x1a1a2e
const INPUT_BG_COLOR = 0x16213e
const PADDING = 10
const INPUT_HEIGHT = 30
const CORNER_RADIUS = 6
const MAX_VISIBLE_LINES = 12
const LINE_HEIGHT = 20

// ─── BBCode color map ────────────────────────────────────────────────────────
const BBCODE_COLOR: Record<ConsoleMessage['kind'], string> = {
  input: '#ffffff',
  success: '#44ff44',
  error: '#ff4444'
}

export class ConsoleScene extends Phaser.Scene {
  // ─── UI elements ────────────────────────────────────────────────────
  private consoleContainer!: Phaser.GameObjects.Container
  private consoleBg!: RoundRectangle
  private inputBg!: RoundRectangle
  private inputText!: Phaser.GameObjects.Text
  private cursorBlink!: Phaser.GameObjects.Rectangle
  private cursorTimer?: Phaser.Time.TimerEvent
  private cursorVisible = true

  // ─── Rex‑plugins: message display ────────────────────────────────
  private messageDisplay!: BBCodeText
  private scrollOffset = 0

  // ─── Input state ────────────────────────────────────────────────────
  private inputBuffer = ''

  // ─── Completion state ───────────────────────────────────────────────
  private completionItems: CompletionItem[] = []
  private completionIndex = -1
  private completionTexts: Phaser.GameObjects.Text[] = []
  private completionBg?: RoundRectangle

  // ─── Managers ───────────────────────────────────────────────────────
  private historyManager?: HistoryManager
  private highlightManager?: HighlightManager

  // ─── Internal ───────────────────────────────────────────────────────
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

    // ─── Container ──────────────────────────────────────────────────
    this.consoleContainer = this.add.container(0, this.consoleY)
    this.consoleContainer.setDepth(1000)

    // ─── Console background (RoundRectangle) ────────────────────────
    this.consoleBg = new RoundRectangle(
      this,
      GAME_WIDTH / 2,
      this.consoleHeight / 2,
      GAME_WIDTH,
      this.consoleHeight,
      { tl: 0, tr: 0, bl: 0, br: 0 },
      CONSOLE_BG_COLOR,
      CONSOLE_BG_ALPHA
    )
    this.add.existing(this.consoleBg)
    this.consoleContainer.add(this.consoleBg)

    // ─── Input background (RoundRectangle) ──────────────────────────
    const inputY = this.consoleHeight - INPUT_HEIGHT / 2 - PADDING / 2
    this.inputBg = new RoundRectangle(
      this,
      GAME_WIDTH / 2,
      inputY,
      GAME_WIDTH - PADDING * 2,
      INPUT_HEIGHT,
      CORNER_RADIUS,
      INPUT_BG_COLOR,
      0.9
    )
    this.add.existing(this.inputBg)
    this.consoleContainer.add(this.inputBg)

    // ─── Input text ─────────────────────────────────────────────────
    this.inputText = this.add.text(
      PADDING + 8,
      this.consoleHeight - INPUT_HEIGHT - PADDING / 2 + 6,
      '> ',
      { fontSize: '14px', color: '#ffffff', fontFamily: 'Consolas, monospace' }
    )
    this.consoleContainer.add(this.inputText)

    // ─── Cursor blink ───────────────────────────────────────────────
    this.cursorBlink = this.add.rectangle(
      PADDING + 8 + this.inputText.width,
      this.consoleHeight - INPUT_HEIGHT - PADDING / 2 + 6,
      2, 16, 0xffffff
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

    // ─── Message display (BBCodeText) ──────────────────────────────
    const msgAreaWidth = GAME_WIDTH - PADDING * 2

    this.messageDisplay = new BBCodeText(
      this,
      PADDING + 8,
      PADDING,
      '',
      {
        fontSize: '13px',
        fontFamily: 'Consolas, monospace',
        color: '#ffffff',
        wrap: { mode: 'char' as unknown as number, width: msgAreaWidth - 16 }
      }
    )
    this.add.existing(this.messageDisplay)
    this.consoleContainer.add(this.messageDisplay)

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

  // ═══════════════════════════════════════════════════════════════════
  // Keyboard handling
  // ═══════════════════════════════════════════════════════════════════

  private handleKeyDown(event: KeyboardEvent): void {
    if (!consoleStore.getState().isOpen) return
    event.stopPropagation()

    switch (event.key) {
      case 'Escape':
        consoleStore.getState().closeConsole()
        this.highlightManager?.clearHighlights()
        this.hideCompletions()
        break

      case 'Enter':
        if (this.completionItems.length > 0 && this.completionIndex >= 0) {
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
          if (event.key === '`') break
          this.inputBuffer += event.key
          this.updateInputDisplay()
          this.updateCompletions()
          this.updateHighlights()
        }
        break
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Command execution
  // ═══════════════════════════════════════════════════════════════════

  private executeCurrentInput(): void {
    const input = this.inputBuffer.trim()
    if (!input) return

    consoleStore.getState().appendMessage({ content: `> ${input}`, kind: 'input' })

    try {
      const result = commandRegistry.execute(input)
      consoleStore.getState().appendMessage({ content: result, kind: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      consoleStore.getState().appendMessage({ content: msg, kind: 'error' })
    }

    this.historyManager?.push(input)

    this.inputBuffer = ''
    this.updateInputDisplay()
    this.hideCompletions()
    this.refreshMessages()

    // Auto-scroll to bottom
    const totalMessages = consoleStore.getState().messages.length
    this.scrollOffset = Math.max(0, totalMessages - MAX_VISIBLE_LINES)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Display helpers
  // ═══════════════════════════════════════════════════════════════════

  private updateInputDisplay(): void {
    this.inputText.setText(`> ${this.inputBuffer}`)
    this.cursorBlink.setX(PADDING + 8 + this.inputText.width)
    this.cursorVisible = true
    this.cursorBlink.setVisible(true)
  }

  /**
   * Rebuild message display from ConsoleStore.
   * Uses BBCodeText with [color] tags for per-message coloring.
   * Shows the last MAX_VISIBLE_LINES messages, bottom-aligned above the input.
   */
  private refreshMessages(): void {
    const messages = consoleStore.getState().messages
    const startIdx = Math.max(0, this.scrollOffset)
    const endIdx = Math.min(messages.length, startIdx + MAX_VISIBLE_LINES)
    const visible = messages.slice(startIdx, endIdx)

    const bbcodeLines = visible.map(
      (m) => `[color=${BBCODE_COLOR[m.kind]}]${m.content}[/color]`
    )

    const fullText = bbcodeLines.join('\n')
    this.messageDisplay.setText(fullText)

    // Bottom-align: position text so last line sits just above input area
    const messageAreaBottom = this.consoleHeight - INPUT_HEIGHT - PADDING
    const textHeight = this.messageDisplay.height
    this.messageDisplay.setY(Math.max(PADDING, messageAreaBottom - textHeight))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Completion UI
  // ═══════════════════════════════════════════════════════════════════

  updateCompletions(): void {
    this.completionItems = completionEngine.getCompletions(this.inputBuffer)
    this.completionIndex = this.completionItems.length > 0 ? 0 : -1
    this.renderCompletions()
  }

  renderCompletions(): void {
    this.clearCompletionUI()
    if (this.completionItems.length === 0) return

    const completionY = this.consoleHeight - INPUT_HEIGHT - PADDING / 2
    const itemHeight = 22
    const totalHeight = this.completionItems.length * itemHeight + 4

    // Background (RoundRectangle)
    this.completionBg = new RoundRectangle(
      this,
      GAME_WIDTH / 2,
      completionY - totalHeight / 2 - 4,
      GAME_WIDTH - PADDING * 2,
      totalHeight,
      CORNER_RADIUS,
      0x0a0a1a,
      0.95
    )
    this.add.existing(this.completionBg)
    this.consoleContainer.add(this.completionBg)

    // Items
    this.completionItems.forEach((item, idx) => {
      const y = completionY - totalHeight - 4 + 2 + idx * itemHeight
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
    if (this.completionBg) {
      this.completionBg.destroy()
      this.completionBg = undefined
    }
  }

  private applyCompletion(label: string): void {
    const tokens = this.inputBuffer.split(/\s+/)
    if (tokens.length <= 1) {
      this.inputBuffer = '/' + label + ' '
    } else {
      tokens[tokens.length - 1] = label
      this.inputBuffer = tokens.join(' ') + ' '
    }
    this.updateInputDisplay()
    this.hideCompletions()
    this.updateHighlights()
  }

  // ═══════════════════════════════════════════════════════════════════
  // Highlight
  // ═══════════════════════════════════════════════════════════════════

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

  setHistoryManager(hm: HistoryManager): void {
    this.historyManager = hm
  }

  setHighlightManager(hm: HighlightManager): void {
    this.highlightManager = hm
  }
}

