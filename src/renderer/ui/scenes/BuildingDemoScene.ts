import Phaser from 'phaser'
import { createWorld, IWorld } from 'bitecs'
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../../core/constants'
import { initBuildings } from '../../core/buildings/buildingDefinitions'
import { registerBuildingCommand, setWorldAccessor } from '../../console/commands/buildingCommand'
import { registerTileCommand, setTileAt } from '../../console/commands/tileCommand'
import { drillProductionSystem } from '../../core/systems/DrillProductionSystem'
import { storageData } from '../../core/buildings/itemStorageStore'
import { consoleStore } from '../../console/ConsoleStore'

/** One shortcut button entry */
interface ShortcutBtn {
  label: string
  command: string
}

const SHORTCUT_BUTTONS: ShortcutBtn[] = [
  { label: '📋 building list',          command: '/building list' },
  { label: '🔍 info drill',             command: '/building info drill' },
  { label: '🔩 place drill @ (3,3)',    command: '/building place drill 3 3' },
  { label: '🗺️ set tile copper_ore',    command: '/tile set 5 5 copper_ore' },
]

export class BuildingDemoScene extends Phaser.Scene {
  private world!: IWorld
  private debugText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'BuildingDemoScene' })
  }

  create(): void {
    // 1. Init ECS World
    this.world = createWorld()

    // 2. Init Buildings & Commands
    initBuildings()
    registerBuildingCommand()
    registerTileCommand()
    setWorldAccessor(() => this.world)

    // 3. Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e)

    // 4. Grid lines
    const gridGfx = this.add.graphics()
    gridGfx.lineStyle(1, 0x333355, 0.8)
    for (let x = 0; x <= GAME_WIDTH; x += TILE_SIZE) {
      gridGfx.moveTo(x, 0); gridGfx.lineTo(x, GAME_HEIGHT)
    }
    for (let y = 0; y <= GAME_HEIGHT; y += TILE_SIZE) {
      gridGfx.moveTo(0, y); gridGfx.lineTo(GAME_WIDTH, y)
    }
    gridGfx.strokePath()

    // 5. Preset copper ore tiles 3,3 → 4,4 (2×2 block)
    const oreGfx = this.add.graphics()
    oreGfx.fillStyle(0xb87333, 0.55)
    const oreGroup = [
      { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 3, y: 4 }, { x: 4, y: 4 },
    ]
    oreGroup.forEach(pos => {
      oreGfx.fillRect(pos.x * TILE_SIZE, pos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      setTileAt(pos.x, pos.y, 'copper_ore')
    })
    // Label
    this.add.text(3 * TILE_SIZE + 2, 3 * TILE_SIZE + 2, 'Ore', {
      fontSize: '10px', color: '#ffcc88'
    })

    // 6. Debug info panel (top-left)
    this.debugText = this.add.text(8, 8, '', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#e0e0ff',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 },
    }).setDepth(10)

    // 7. Shortcut button panel (right side)
    this._buildShortcutPanel()

    // 8. Hint text at bottom
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 14,
      '按 ` 键打开/关闭控制台 · 点击右侧按钮快速填入命令',
      { fontSize: '12px', color: '#8888aa', fontFamily: 'monospace' }
    ).setOrigin(0.5, 1).setDepth(10)

    // 9. Launch ConsoleScene (only if not already running)
    if (!this.scene.isActive('ConsoleScene')) {
      this.scene.launch('ConsoleScene')
    }
  }

  /** Build shortcut buttons on the right edge. */
  private _buildShortcutPanel(): void {
    const panelX = GAME_WIDTH - 8
    const startY = 60
    const btnH = 28
    const gap = 6
    const maxW = 220

    // Panel background
    const panelGfx = this.add.graphics().setDepth(9)
    const panelH = SHORTCUT_BUTTONS.length * (btnH + gap) + gap + 20
    panelGfx.fillStyle(0x0d0d1a, 0.85)
    panelGfx.fillRoundedRect(panelX - maxW - 8, startY - 16, maxW + 16, panelH, 6)

    // Title
    this.add.text(panelX - 4, startY - 12, '快捷命令', {
      fontSize: '11px', color: '#6688cc', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(10)

    SHORTCUT_BUTTONS.forEach(({ label, command }, i) => {
      const y = startY + i * (btnH + gap)
      const btnGfx = this.add.graphics().setDepth(10)

      const drawBtn = (hover: boolean): void => {
        btnGfx.clear()
        btnGfx.fillStyle(hover ? 0x2244aa : 0x162244, 1)
        btnGfx.fillRoundedRect(panelX - maxW - 4, y, maxW, btnH, 4)
        btnGfx.lineStyle(1, hover ? 0x4466dd : 0x2244aa)
        btnGfx.strokeRoundedRect(panelX - maxW - 4, y, maxW, btnH, 4)
      }
      drawBtn(false)

      const txt = this.add.text(panelX - maxW / 2 - 4, y + btnH / 2, label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#aabbff'
      }).setOrigin(0.5).setDepth(11)

      // Hit area
      const zone = this.add.zone(panelX - maxW - 4, y, maxW, btnH)
        .setOrigin(0).setInteractive({ cursor: 'pointer' }).setDepth(12)

      zone.on('pointerover', () => { drawBtn(true); txt.setColor('#ffffff') })
      zone.on('pointerout',  () => { drawBtn(false); txt.setColor('#aabbff') })
      zone.on('pointerdown', () => {
        consoleStore.getState().openConsoleWithInput(command)
      })
    })
  }

  update(time: number): void {
    drillProductionSystem(this.world, time)

    // Sum all stored copper_ore across all entity storages
    let copperCount = 0
    for (const storage of storageData.values()) {
      const item = storage.items.find(i => i.itemId === 'copper_ore')
      if (item) copperCount += item.count
    }

    this.debugText.setText(
      `[ Building Demo ]\n` +
      `Time:       ${(time / 1000).toFixed(1)}s\n` +
      `Copper Ore: ${copperCount}`
    )
  }
}
