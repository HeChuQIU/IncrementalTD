import Phaser from 'phaser'
import {
  RoundRectangle,
  BBCodeText,
  CanvasInput
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
  private inputField!: CanvasInput
  private promptLabel!: Phaser.GameObjects.Text

  // ─── Rex‑plugins: message display ────────────────────────────────
  private messageDisplay!: BBCodeText
  private scrollOffset = 0

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
  private domKeyHandler?: (e: KeyboardEvent) => void

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

    // ─── Input field (CanvasInput with built-in cursor & editing) ───
    const inputCenterY = this.consoleHeight - INPUT_HEIGHT / 2 - PADDING / 2

    // Prompt label
    this.promptLabel = this.add.text(
      PADDING + 4,
      this.consoleHeight - INPUT_HEIGHT - PADDING / 2 + 6,
      '> ',
      { fontSize: '14px', color: '#888888', fontFamily: 'Consolas, monospace' }
    )
    this.consoleContainer.add(this.promptLabel)

    const promptW = this.promptLabel.width
    const fieldWidth = GAME_WIDTH - PADDING * 2 - promptW - 4
    const fieldX = PADDING + promptW + 4 + fieldWidth / 2

    this.inputField = new CanvasInput(this, {
      x: fieldX,
      y: inputCenterY,
      width: fieldWidth,
      height: INPUT_HEIGHT,
      background: {
        color: 0x16213e,
        cornerRadius: CORNER_RADIUS,
        'focus.color': 0x1a2744
      },
      style: {
        fontSize: '14px',
        fontFamily: 'Consolas, monospace',
        color: '#ffffff',
        'cursor.color': '#ffffff',
        'cursor.backgroundColor': '#444466'
      },
      textArea: false,
      enterClose: false,
      text: '',
      wrap: { maxLines: 1, wrapMode: 'none' }
    })
    this.add.existing(this.inputField)
    this.consoleContainer.add(this.inputField)

    // Track text changes for completions & highlights
    this.inputField.on('textchange', () => {
      this.updateCompletions()
      this.updateHighlights()
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

    // ─── Keyboard: capture-phase handler for special keys ──────────
    this.domKeyHandler = (e: KeyboardEvent) => {
      if (!consoleStore.getState().isOpen) return
      this.handleSpecialKey(e)
    }
    document.addEventListener('keydown', this.domKeyHandler, true)

    // Start hidden
    this.consoleContainer.setVisible(false)

    // Subscribe to store changes
    consoleStore.subscribe((state) => {
      this.consoleContainer.setVisible(state.isOpen)
      if (state.isOpen) {
        this.inputField.open()
        this.historyManager?.reset()
        this.refreshMessages()
      } else {
        this.inputField.close()
        this.highlightManager?.clearHighlights()
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // Special key handling (document capture phase)
  // ═══════════════════════════════════════════════════════════════════

  private handleSpecialKey(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        event.stopImmediatePropagation()
        consoleStore.getState().closeConsole()
        this.highlightManager?.clearHighlights()
        this.hideCompletions()
        break

      case 'Enter':
        event.preventDefault()
        event.stopImmediatePropagation()
        if (this.completionItems.length > 0 && this.completionIndex >= 0) {
          this.applyCompletion(this.completionItems[this.completionIndex].label)
        } else {
          this.executeCurrentInput()
        }
        break

      case 'Tab':
        event.preventDefault()
        event.stopImmediatePropagation()
        if (this.completionItems.length > 0) {
          this.applyCompletion(this.completionItems[Math.max(0, this.completionIndex)].label)
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        event.stopImmediatePropagation()
        if (this.completionItems.length > 0) {
          this.completionIndex = Math.max(0, this.completionIndex - 1)
          this.renderCompletions()
        } else if (this.historyManager) {
          const cmd = this.historyManager.navigateUp()
          if (cmd !== null) {
            this.inputField.setText(cmd)
          }
        }
        break

      case 'ArrowDown':
        event.preventDefault()
        event.stopImmediatePropagation()
        if (this.completionItems.length > 0) {
          this.completionIndex = Math.min(this.completionItems.length - 1, this.completionIndex + 1)
          this.renderCompletions()
        } else if (this.historyManager) {
          const cmd = this.historyManager.navigateDown()
          this.inputField.setText(cmd ?? '')
        }
        break

      case '`':
        event.preventDefault()
        event.stopImmediatePropagation()
        break
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Command execution
  // ═══════════════════════════════════════════════════════════════════

  private executeCurrentInput(): void {
    const input = (this.inputField.text ?? '').trim()
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

    this.inputField.setText('')
    this.hideCompletions()
    this.refreshMessages()

    // Auto-scroll to bottom
    const totalMessages = consoleStore.getState().messages.length
    this.scrollOffset = Math.max(0, totalMessages - MAX_VISIBLE_LINES)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Display helpers
  // ═══════════════════════════════════════════════════════════════════

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
    this.completionItems = completionEngine.getCompletions(this.inputField.text ?? '')
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
    const currentText = this.inputField.text ?? ''
    const tokens = currentText.split(/\s+/)
    let newText: string
    if (tokens.length <= 1) {
      newText = '/' + label + ' '
    } else {
      tokens[tokens.length - 1] = label
      newText = tokens.join(' ') + ' '
    }
    this.inputField.setText(newText)
    this.hideCompletions()
    this.updateHighlights()
  }

  // ═══════════════════════════════════════════════════════════════════
  // Highlight
  // ═══════════════════════════════════════════════════════════════════

  updateHighlights(): void {
    if (!this.highlightManager) return
    const coords = parseCoordinatesFromInput(this.inputField.text ?? '')
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

  shutdown(): void {
    if (this.domKeyHandler) {
      document.removeEventListener('keydown', this.domKeyHandler, true)
    }
  }
}

