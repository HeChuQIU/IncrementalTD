import Phaser from 'phaser'
import { createWorld, IWorld } from 'bitecs'
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'
import { initBuildings } from '../../core/buildings/buildingDefinitions'
import { registerBuildingCommand, setWorldAccessor } from '../../console/commands/buildingCommand'
import { registerTileCommand, setTileAt } from '../../console/commands/tileCommand'
import { drillProductionSystem } from '../../core/systems/DrillProductionSystem'
import { storageData } from '../../core/buildings/itemStorageStore'
import { consoleStore } from '../../console/ConsoleStore'
import { SCIFI_COLORS } from '../styles/colors'
import { SCIFI_GEOMETRY } from '../styles/geometry'

const SHORTCUT_COMMANDS = [
  { label: 'building list',           command: '/building list' },
  { label: 'building info drill',     command: '/building info drill' },
  { label: 'place drill @ (3,3)',     command: '/building place drill 3 3' },
  { label: 'tile set 5 5 copper_ore', command: '/tile set 5 5 copper_ore' },
]

export class BuildingDemoScene extends Phaser.Scene {
  private world!: IWorld
  private debugText!: Phaser.GameObjects.Text

  // ─── Runtime diagnostics ──────────────────────────────────────────
  private _diagText!: Phaser.GameObjects.Text
  private _lastKeyEvent = 'none'
  private _lastPointerEvent = 'none'
  private _lastBtnClick = 'none'
  private _diagKeyHandler?: (e: KeyboardEvent) => void

  private ensureConsoleSceneReady(): void {
    if (!this.scene.isActive('ConsoleScene')) {
      this.scene.launch('ConsoleScene')
    }
    if (this.scene.isSleeping('ConsoleScene')) {
      this.scene.wake('ConsoleScene')
    }
  }

  constructor() {
    super({ key: 'BuildingDemoScene' })
  }

  create(): void {
    // ─── ECS ────────────────────────────────────────────────────────
    this.world = createWorld()

    // ─── Commands ───────────────────────────────────────────────────
    initBuildings()
    registerBuildingCommand()
    registerTileCommand()
    setWorldAccessor(() => this.world)

    // ─── Background ─────────────────────────────────────────────────
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, SCIFI_COLORS.background)

    // ─── Grid ───────────────────────────────────────────────────────
    const gridGfx = this.add.graphics()
    gridGfx.lineStyle(1, SCIFI_COLORS.gridLine, 0.8)
    for (let x = 0; x <= GAME_WIDTH; x += TILE_SIZE) {
      gridGfx.moveTo(x, 0); gridGfx.lineTo(x, GAME_HEIGHT)
    }
    for (let y = 0; y <= GAME_HEIGHT; y += TILE_SIZE) {
      gridGfx.moveTo(0, y); gridGfx.lineTo(GAME_WIDTH, y)
    }
    gridGfx.strokePath()

    // ─── Copper ore tiles (3,3)–(4,4) ───────────────────────────────
    const oreGfx = this.add.graphics()
    const oreGroup = [
      { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 3, y: 4 }, { x: 4, y: 4 },
    ]
    oreGroup.forEach(pos => {
      oreGfx.fillStyle(0xb87333, 0.45)
      oreGfx.fillRect(pos.x * TILE_SIZE, pos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      oreGfx.lineStyle(1, 0xd4935a, 0.8)
      oreGfx.strokeRect(pos.x * TILE_SIZE, pos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      setTileAt(pos.x, pos.y, 'copper_ore')
    })
    this.add.text(3 * TILE_SIZE + 2, 3 * TILE_SIZE + 2, 'ORE', {
      fontSize: '9px', fontFamily: SCIFI_GEOMETRY.ui.fontFamily, color: '#d4935a'
    })

    // ─── Debug info (top-left) ───────────────────────────────────────
    this.debugText = this.add.text(8, 8, '', {
      fontSize: '13px',
      fontFamily: SCIFI_GEOMETRY.ui.fontFamily,
      color: '#' + SCIFI_COLORS.uiTextPrimary.toString(16).padStart(6, '0'),
      backgroundColor: '#' + SCIFI_COLORS.uiBackground.toString(16).padStart(6, '0') + 'cc',
      padding: { x: 8, y: 5 },
    }).setDepth(10)

    // ─── Shortcut button panel (right side) ─────────────────────────
    this._buildShortcutPanel()

    // ─── Bottom hint ─────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8,
      '按 ` 键打开/关闭控制台 · 点击右侧按钮快速填入命令',
      {
        fontSize: '11px',
        fontFamily: SCIFI_GEOMETRY.ui.fontFamily,
        color: '#' + SCIFI_COLORS.uiTextSecondary.toString(16).padStart(6, '0'),
      }
    ).setOrigin(0.5, 1).setDepth(10)

    // ─── Console ─────────────────────────────────────────────────────
    this.ensureConsoleSceneReady()

    // Fallback: if ConsoleScene is not active for any reason, handle backquote
    // locally so users can still open the console in this scene.
    this.input.keyboard?.on('keydown-BACKQUOTE', () => {
      if (!this.scene.isActive('ConsoleScene')) {
        this.ensureConsoleSceneReady()
        consoleStore.getState().toggleConsole()
      }
    })

    // ─── Runtime diagnostics ──────────────────────────────────────────
    this._setupDiagnostics()
  }

  private _setupDiagnostics(): void {
    // Yellow diagnostic text at bottom-left (above the hint line)
    this._diagText = this.add.text(8, GAME_HEIGHT - 100, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#ffff00',
      backgroundColor: '#000000cc',
      padding: { x: 4, y: 2 },
    }).setDepth(999)

    // Window-level capture handler: fires BEFORE ConsoleScene's document handler
    this._diagKeyHandler = (e: KeyboardEvent) => {
      this._lastKeyEvent = `${e.code}(${e.key})@${(Date.now() % 100000)}`
      if (e.code === 'Backquote' || e.key === '`') {
        console.log('[DIAG] ★ Backquote at window-capture, isOpen BEFORE:', consoleStore.getState().isOpen)
      }
    }
    window.addEventListener('keydown', this._diagKeyHandler, true)

    // Scene-level pointerdown: detect if Phaser receives mousedown at all
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this._lastPointerEvent = `DOWN(${Math.round(pointer.x)},${Math.round(pointer.y)})@${(Date.now() % 100000)}`
      console.log('[DIAG] Phaser pointerdown in BuildingDemoScene:', pointer.x, pointer.y)
    })

    // Inspect ConsoleScene instance
    const cs = this.scene.get('ConsoleScene') as any
    console.log('[DIAG] ConsoleScene instance:', !!cs)
    console.log('[DIAG] ConsoleScene.domKeyHandler:', !!cs?.domKeyHandler)
    console.log('[DIAG] ConsoleScene.inputField:', !!cs?.inputField)
    console.log('[DIAG] ConsoleScene.consoleContainer:', !!cs?.consoleContainer)
    console.log('[DIAG] ConsoleScene.consoleContainer.visible:', cs?.consoleContainer?.visible)

    // Store subscription for diagnostic logging
    consoleStore.subscribe((state) => {
      console.log('[DIAG] store changed: isOpen=' + state.isOpen + ' pending=' + state.pendingInput)
    })
  }

  // ─── Shortcut panel ──────────────────────────────────────────────
  private _buildShortcutPanel(): void {
    const BTN_W = 228
    const BTN_H = 30
    const GAP = 5
    const RIGHT_MARGIN = 8
    const panelX = GAME_WIDTH - RIGHT_MARGIN - BTN_W
    const startY = 55
    const panelPad = 10
    const panelH = SHORTCUT_COMMANDS.length * (BTN_H + GAP) + panelPad * 2

    // Panel bg
    const panelGfx = this.add.graphics().setDepth(8)
    panelGfx.fillStyle(SCIFI_COLORS.uiBackground, 0.9)
    panelGfx.fillRoundedRect(panelX - panelPad, startY - panelPad - 18, BTN_W + panelPad * 2, panelH + 18, SCIFI_GEOMETRY.ui.cornerRadius)
    panelGfx.lineStyle(1, SCIFI_COLORS.uiBorder, 0.8)
    panelGfx.strokeRoundedRect(panelX - panelPad, startY - panelPad - 18, BTN_W + panelPad * 2, panelH + 18, SCIFI_GEOMETRY.ui.cornerRadius)

    // Panel title
    this.add.text(panelX + BTN_W / 2, startY - 18, '[ 快捷命令 ]', {
      fontSize: '11px', fontFamily: SCIFI_GEOMETRY.ui.fontFamily, color: '#' + SCIFI_COLORS.uiBorder.toString(16).padStart(6, '0')
    }).setOrigin(0.5, 0).setDepth(9)

    SHORTCUT_COMMANDS.forEach(({ label, command }, i) => {
      const btnY = startY + i * (BTN_H + GAP)
      const btnGfx = this.add.graphics().setDepth(9)
      const clrNormal = SCIFI_COLORS.uiBorder
      const clrHover  = SCIFI_COLORS.playerGlow

      const draw = (hover: boolean): void => {
        btnGfx.clear()
        btnGfx.fillStyle(hover ? SCIFI_COLORS.playerPrimary : SCIFI_COLORS.armorDark, 0.8)
        btnGfx.fillRoundedRect(panelX, btnY, BTN_W, BTN_H, 3)
        btnGfx.lineStyle(1, hover ? clrHover : clrNormal)
        btnGfx.strokeRoundedRect(panelX, btnY, BTN_W, BTN_H, 3)
      }
      draw(false)

      // Use a Text game object as the clickable target (more reliable than Zone)
      const btnText = this.add.text(panelX + 10, btnY + BTN_H / 2, '> ' + label, {
        fontSize: '12px',
        fontFamily: SCIFI_GEOMETRY.ui.fontFamily,
        color: '#' + SCIFI_COLORS.uiTextSecondary.toString(16).padStart(6, '0'),
      })
        .setOrigin(0, 0.5)
        .setDepth(10)
        .setInteractive({ cursor: 'pointer' })

      // Use a transparent Rectangle (not Zone) as the wider hit area
      const hitRect = this.add.rectangle(panelX + BTN_W / 2, btnY + BTN_H / 2, BTN_W, BTN_H)
        .setInteractive({ cursor: 'pointer' })
        .setDepth(10)
        .setAlpha(0.001) // nearly invisible but exists in display list

      const onOver = (): void => { draw(true); btnText.setColor('#' + SCIFI_COLORS.playerHighlight.toString(16).padStart(6, '0')) }
      const onOut  = (): void => { draw(false); btnText.setColor('#' + SCIFI_COLORS.uiTextSecondary.toString(16).padStart(6, '0')) }
      const onDown = (): void => {
        this._lastBtnClick = label + '@' + (Date.now() % 100000)
        console.log('[DIAG] Button pointerdown:', label, command)
        this.ensureConsoleSceneReady()
        consoleStore.getState().openConsoleWithInput(command)
      }

      hitRect.on('pointerover', onOver)
      hitRect.on('pointerout',  onOut)
      hitRect.on('pointerdown', onDown)
      btnText.on('pointerover', onOver)
      btnText.on('pointerout',  onOut)
      btnText.on('pointerdown', onDown)
    })
  }

  update(time: number): void {
    drillProductionSystem(this.world, time)

    let copperCount = 0
    for (const storage of storageData.values()) {
      const item = storage.items.find(i => i.itemId === 'copper_ore')
      if (item) copperCount += item.count
    }

    this.debugText.setText(
      `[ Building Demo ]\n` +
      `Time       ${(time / 1000).toFixed(1)}s\n` +
      `Copper Ore ${copperCount}`
    )

    // ─── Live diagnostic display ──────────────────────────────────
    const state = consoleStore.getState()
    const csActive = this.scene.isActive('ConsoleScene')
    this._diagText?.setText(
      `[DIAG] isOpen:${state.isOpen} pending:${state.pendingInput}\n` +
      `ConsoleScene active:${csActive}\n` +
      `lastKey: ${this._lastKeyEvent}\n` +
      `lastPtr: ${this._lastPointerEvent}\n` +
      `lastBtn: ${this._lastBtnClick}`
    )
  }
}
