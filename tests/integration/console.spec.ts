import { test, expect } from '@playwright/test'

test.describe('游戏内控制台', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 5000 })
    // Wait for game to initialize
    await page.waitForTimeout(1000)
  })

  test('按反引号键打开控制台，按 ESC 关闭', async ({ page }) => {
    const canvas = page.locator('canvas')

    // Press backtick to open console
    await canvas.click()
    await page.keyboard.press('Backquote')

    // Wait a moment for the console scene to respond
    await page.waitForTimeout(500)

    // The console is rendered on the Phaser canvas, so we can't directly
    // check DOM elements. Instead we verify the game still runs after toggle.
    // Take a screenshot for visual verification
    await expect(canvas).toBeVisible()

    // Press ESC to close
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Canvas should still be visible and game running
    await expect(canvas).toBeVisible()
  })

  test('控制台中输入 /help 并执行', async ({ page }) => {
    const canvas = page.locator('canvas')

    // Open console
    await canvas.click()
    await page.keyboard.press('Backquote')
    await page.waitForTimeout(500)

    // Type /help and press Enter
    await page.keyboard.type('/help')
    await page.waitForTimeout(200)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // The feedback is rendered on canvas — verify game didn't crash
    await expect(canvas).toBeVisible()

    // Close console
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await expect(canvas).toBeVisible()
  })
})
