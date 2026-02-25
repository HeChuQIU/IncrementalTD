import Phaser from 'phaser'
import { createWorld, IWorld } from 'bitecs'
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'
import { initBuildings } from '../../core/buildings/buildingDefinitions'
import { registerBuildingCommand, setWorldAccessor } from '../../console/commands/buildingCommand'
import { registerTileCommand, setTileAt, getTileMap, setPathRecalcHandler } from '../../console/commands/tileCommand'
import { drillProductionSystem } from '../../core/systems/DrillProductionSystem'
import { storageData } from '../../core/buildings/itemStorageStore'
import { occupiedTilesData, buildingDefIdData } from '../../core/buildings/buildingStore'
import { buildingRegistry } from '../../core/buildings/BuildingRegistry'
import { getStorage } from '../../core/buildings/itemStorageStore'
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
  /** Graphics layer for dynamically-set tiles (via /tile set) */
  private _dynamicTileGfx!: Phaser.GameObjects.Graphics
  /** Graphics layer for placed building outlines */
  private _buildingGfx!: Phaser.GameObjects.Graphics
  /** Text labels for placed buildings (eid → Text) */
  private _buildingLabels = new Map<number, Phaser.GameObjects.Text>()
  /** Already-rendered tile keys to avoid redundant draws */
  private _renderedTileKeys = new Set<string>()
  /** Already-rendered building eids to avoid redundant draws */
  private _renderedBuildingEids = new Set<number>()


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

    // ─── Dynamic tile & building layers ──────────────────────────────
    this._dynamicTileGfx = this.add.graphics().setDepth(1)
    this._buildingGfx = this.add.graphics().setDepth(2)

    // ─── Copper ore tiles (3,3)–(4,4) ───────────────────────────────
    const oreGroup = [
      { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 3, y: 4 }, { x: 4, y: 4 },
    ]
    oreGroup.forEach(pos => {
      setTileAt(pos.x, pos.y, 'copper_ore')
    })
    // Render all pre-set tiles visually
    this._refreshTileVisuals()

    // Register handler so future /tile set commands also trigger visual updates
    setPathRecalcHandler(() => this._refreshTileVisuals())

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
    // 确保 ConsoleScene 存活且在最顶层渲染（否则会被当前场景的背景遮住）
    if (!this.scene.isActive('ConsoleScene')) {
      this.scene.launch('ConsoleScene')
    }
    this.scene.bringToTop('ConsoleScene')
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

    // Render any newly-placed buildings
    this._refreshBuildingVisuals()

    // Update building storage labels
    this._updateBuildingLabels(time)

    let copperCount = 0
    for (const storage of storageData.values()) {
      const item = storage.items.find(i => i.itemId === 'copper_ore')
      if (item) copperCount += item.count
    }

    this.debugText.setText(
      `[ Building Demo ]\n` +
      `Time       ${(time / 1000).toFixed(1)}s\n` +
      `Copper Ore ${copperCount}\n` +
      `Buildings  ${buildingDefIdData.size}`
    )
  }

  // ─── Dynamic tile rendering ──────────────────────────────────────
  /** Draw tiles from tileMap that haven't been rendered yet */
  private _refreshTileVisuals(): void {
    const tileMapData = getTileMap()
    for (const [key, type] of tileMapData.entries()) {
      if (this._renderedTileKeys.has(key)) continue
      this._renderedTileKeys.add(key)

      const [txStr, tyStr] = key.split(',')
      const tx = parseInt(txStr, 10)
      const ty = parseInt(tyStr, 10)
      const px = tx * TILE_SIZE
      const py = ty * TILE_SIZE

      if (type === 'copper_ore') {
        this._dynamicTileGfx.fillStyle(0xb87333, 0.45)
        this._dynamicTileGfx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        this._dynamicTileGfx.lineStyle(1, 0xd4935a, 0.8)
        this._dynamicTileGfx.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
        // Label
        this.add.text(px + 2, py + 2, 'ORE', {
          fontSize: '9px', fontFamily: SCIFI_GEOMETRY.ui.fontFamily, color: '#d4935a',
        }).setDepth(1)
      } else if (type === 'wall') {
        this._dynamicTileGfx.fillStyle(SCIFI_COLORS.armorDark, 0.6)
        this._dynamicTileGfx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        this._dynamicTileGfx.lineStyle(1, SCIFI_COLORS.armorBase, 0.8)
        this._dynamicTileGfx.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      } else if (type === 'path') {
        this._dynamicTileGfx.fillStyle(SCIFI_COLORS.playerPrimary, 0.2)
        this._dynamicTileGfx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        this._dynamicTileGfx.lineStyle(1, SCIFI_COLORS.playerPrimary, 0.5)
        this._dynamicTileGfx.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  // ─── Dynamic building rendering ──────────────────────────────────
  /** Draw newly-placed buildings from ECS data */
  private _refreshBuildingVisuals(): void {
    for (const [eid, defId] of buildingDefIdData.entries()) {
      if (this._renderedBuildingEids.has(eid)) continue
      this._renderedBuildingEids.add(eid)

      const def = buildingRegistry.get(defId)
      if (!def) continue

      const tiles = occupiedTilesData.get(eid)
      if (!tiles || tiles.length === 0) continue

      // Calculate bounding rect of occupied tiles
      let minTx = Infinity, minTy = Infinity, maxTx = -Infinity, maxTy = -Infinity
      for (const { tx, ty } of tiles) {
        if (tx < minTx) minTx = tx
        if (ty < minTy) minTy = ty
        if (tx > maxTx) maxTx = tx
        if (ty > maxTy) maxTy = ty
      }

      const px = minTx * TILE_SIZE
      const py = minTy * TILE_SIZE
      const pw = (maxTx - minTx + 1) * TILE_SIZE
      const ph = (maxTy - minTy + 1) * TILE_SIZE

      // Fill building area
      const isDrill = defId === 'drill'
      const fillColor = isDrill ? SCIFI_COLORS.playerSecondary : SCIFI_COLORS.playerPrimary
      const borderColor = isDrill ? 0x27ae60 : 0x8e44ad

      this._buildingGfx.fillStyle(fillColor, 0.3)
      this._buildingGfx.fillRect(px, py, pw, ph)
      this._buildingGfx.lineStyle(2, borderColor, 0.9)
      this._buildingGfx.strokeRect(px + 1, py + 1, pw - 2, ph - 2)

      // Building name label
      const label = this.add.text(px + pw / 2, py + 3, def.displayName.toUpperCase(), {
        fontSize: '10px',
        fontFamily: SCIFI_GEOMETRY.ui.fontFamily,
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0).setDepth(3)

      // Storage label (updated in _updateBuildingLabels)
      if (def.storageCapacity) {
        const storageLabel = this.add.text(px + pw / 2, py + ph - 4, '', {
          fontSize: '9px',
          fontFamily: SCIFI_GEOMETRY.ui.fontFamily,
          color: '#' + SCIFI_COLORS.uiTextHighlight.toString(16).padStart(6, '0'),
        }).setOrigin(0.5, 1).setDepth(3)
        this._buildingLabels.set(eid, storageLabel)
      } else {
        // For non-storage buildings, keep the name label ref
        this._buildingLabels.set(eid, label)
      }
    }
  }

  /** Update storage text for buildings that produce items */
  private _updateBuildingLabels(_time: number): void {
    for (const [eid, label] of this._buildingLabels.entries()) {
      const defId = buildingDefIdData.get(eid)
      if (!defId) continue
      const def = buildingRegistry.get(defId)
      if (!def || !def.storageCapacity) continue

      const storage = getStorage(eid)
      const total = storage ? storage.items.reduce((s, i) => s + i.count, 0) : 0
      label.setText(`${total}/${def.storageCapacity}`)
    }
  }
}
