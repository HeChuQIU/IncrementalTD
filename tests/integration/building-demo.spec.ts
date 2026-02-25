import { test, expect, type Page } from '@playwright/test'

/**
 * 通过 window.__executeConsoleCommand 直接调用命令（绕过 CanvasInput 键盘焦点问题）
 * 等同于在控制台输入并按 Enter 执行
 */
async function executeCommand(page: Page, command: string): Promise<string> {
  return page.evaluate((cmd: string) => {
    return (window as any).__executeConsoleCommand?.(cmd) ?? '未找到命令执行器'
  }, command)
}

/** 读取 consoleStore.isOpen 状态 */
async function isConsoleOpen(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const store = (window as any).__consoleStore
    return store?.getState?.().isOpen ?? false
  })
}

/** 等待某个场景激活 */
async function waitForScene(page: Page, sceneKey: string, timeout = 3000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const active = await page.evaluate((key: string) => {
      return (window as any).__phaserGame?.scene?.isActive(key) ?? false
    }, sceneKey)
    if (active) return true
    await page.waitForTimeout(100)
  }
  return false
}

test.describe('BuildingDemoScene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible({ timeout: 8000 })
    // 等待启动完成（BootScene → GameScene → ConsoleScene）
    await page.waitForTimeout(2000)
  })

  test('通过 /scene 命令切换到 BuildingDemoScene', async ({ page }) => {
    // 直接调用命令（绕过 CanvasInput 键盘焦点问题）
    await executeCommand(page, '/scene BuildingDemoScene')
    await page.waitForTimeout(800)

    // 场景切换后控制台应已关闭（sceneCommand 调用了 closeConsole）
    expect(await isConsoleOpen(page)).toBe(false)

    // BuildingDemoScene 应激活
    const sceneActive = await waitForScene(page, 'BuildingDemoScene')
    expect(sceneActive).toBe(true)
  })

  test('BuildingDemoScene 中反引号可打开/关闭控制台', async ({ page }) => {
    // 先切换到 BuildingDemoScene
    await executeCommand(page, '/scene BuildingDemoScene')
    await page.waitForTimeout(800)

    // 确认场景已切换，控制台已关闭
    expect(await waitForScene(page, 'BuildingDemoScene')).toBe(true)
    expect(await isConsoleOpen(page)).toBe(false)

    // 点击画布确保焦点在页面上，然后按反引号打开控制台
    await page.locator('canvas').click()
    await page.keyboard.press('Backquote')
    await page.waitForTimeout(400)

    expect(await isConsoleOpen(page)).toBe(true)

    // 按 Escape 关闭
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    expect(await isConsoleOpen(page)).toBe(false)
  })

  test('快捷命令按钮点击打开控制台并填入命令', async ({ page }) => {
    // 切换到 BuildingDemoScene
    await executeCommand(page, '/scene BuildingDemoScene')
    await page.waitForTimeout(800)

    expect(await waitForScene(page, 'BuildingDemoScene')).toBe(true)
    expect(await isConsoleOpen(page)).toBe(false)

    // 获取画布边界
    const canvasBB = await page.locator('canvas').boundingBox()
    expect(canvasBB).not.toBeNull()

    // 第一个快捷按钮在画布内的坐标（参见 BuildingDemoScene._buildShortcutPanel）
    // panelX = GAME_WIDTH(800) - PAD(8) - BTN_W(228) = 564
    // button 1 center: x = 564 + 228/2 = 678, y = 55 + 30/2 = 70
    const btnX = canvasBB!.x + 564 + 228 / 2
    const btnY = canvasBB!.y + 55 + 30 / 2

    await page.mouse.click(btnX, btnY)
    await page.waitForTimeout(500)

    // 控制台应该已打开
    expect(await isConsoleOpen(page)).toBe(true)

    // pendingInput 应已被 ConsoleScene 消费（为 null）
    const pendingInputRaw = await page.evaluate(() => {
      // 返回 JSON 字符串以区分 null 与 undefined
      const v = (window as any).__consoleStore?.getState?.().pendingInput
      return JSON.stringify(v)
    })
    // ConsoleScene 消费 pendingInput 后会调用 clearPendingInput() 将其设为 null
    expect(pendingInputRaw).toBe('null')
  })

  test('/building list 在 BuildingDemoScene 中可执行', async ({ page }) => {
    // 切换场景
    await executeCommand(page, '/scene BuildingDemoScene')
    await page.waitForTimeout(800)

    expect(await waitForScene(page, 'BuildingDemoScene')).toBe(true)

    // 直接执行 /building list 命令
    const result = await executeCommand(page, '/building list')
    await page.waitForTimeout(200)

    // 结果应包含建筑定义信息或"暂无"提示
    expect(result).toMatch(/tower|drill|暂无|building/i)

    // 通过 store 消息列表验证最后一条消息是 success
    const lastMsg = await page.evaluate(() => {
      const msgs = (window as any).__consoleStore?.getState?.().messages ?? []
      return msgs[msgs.length - 1]
    })
    expect(lastMsg).toBeDefined()
    expect(lastMsg.kind).toBe('success')
  })
})

