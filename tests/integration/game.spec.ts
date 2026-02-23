import { test, expect } from '@playwright/test'

test('game page loads and renders a canvas element', async ({ page }) => {
  await page.goto('/')
  // Phaser creates a <canvas> element inside #app
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible({ timeout: 5000 })
})

test('canvas has correct dimensions', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible({ timeout: 5000 })
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBe(800)
  expect(box!.height).toBe(600)
})
