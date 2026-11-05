import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Visual walkthrough: opens the real page in Chromium, scrolls all six chapters,
 * waits for the scroll-driven Three.js scene to settle, and captures each shot.
 * Screenshots are stored as downloadable GitHub Actions artifacts.
 */
test('capture complete scroll journey for visual review', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const folder = join('test-results', 'visual-review', testInfo.project.name);
  mkdirSync(folder, { recursive: true });

  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.chapter')).toHaveCount(6);
  await expect(page.locator('.object-stage canvas')).toBeVisible({ timeout: 20_000 });

  // Allow GLB download, WebGL compilation and first camera frame to finish.
  await page.waitForTimeout(2400);
  const shots: Array<{ chapter: number; label: string; scrollY: number; image: string }> = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate(index => {
      const section = document.querySelectorAll<HTMLElement>('.chapter')[index];
      window.scrollTo({ top: section.offsetTop + (section.offsetHeight - innerHeight) / 2, behavior: 'instant' });
    }, i);
    await expect(page.locator('.shot-caption strong')).toContainText('/ 0' + (i + 1));
    // Smooth-damped camera, lighting and text reveals must finish before capture.
    await page.waitForTimeout(1500);
    const image = `chapter-${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: join(folder, image), animations: 'disabled' });
    const scrollY = await page.evaluate(() => window.scrollY);
    shots.push({ chapter: i + 1, label: await page.locator('.shot-caption strong').innerText(), scrollY, image });
  }

  // Mid-scroll captures reveal unwanted spins, jumps or text collisions.
  for (const [index, fraction] of [[2, 0.5], [4, 0.5]] as const) {
    await page.evaluate(([chapter, progress]) => {
      const section = document.querySelectorAll<HTMLElement>('.chapter')[chapter];
      window.scrollTo({ top: section.offsetTop + section.clientHeight * progress, behavior: 'instant' });
    }, [index, fraction] as const);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(folder, `transition-${index + 1}-to-${index + 2}.png`), animations: 'disabled' });
  }

  const dimensions = await page.evaluate(() => ({
    viewportWidth: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    webgl: Boolean(document.querySelector('.object-stage canvas')),
  }));
  writeFileSync(join(folder, 'review.json'), JSON.stringify({
    project: testInfo.project.name,
    url: page.url(),
    dimensions,
    shots,
    browserErrors: errors,
  }, null, 2));

  expect(dimensions.documentWidth, 'Page must not overflow horizontally').toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(errors, 'No uncaught browser errors').toEqual([]);
});
