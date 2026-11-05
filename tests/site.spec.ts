import { test, expect } from '@playwright/test';

test('new phone showcase has six chapters and a 3D stage', async ({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle(/FORM \/ FACTOR/);
  await expect(page.locator('.chapter')).toHaveCount(6);
  await expect(page.locator('.chapter-0 h1')).toContainText('НЕ ПРОСТО');
  await expect(page.locator('.object-stage')).toBeVisible();
});

test('initial scroll is at the top and text appears as visitor scrolls', async ({page})=>{
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await page.locator('#chapter-2').scrollIntoViewIfNeeded();
  await expect(page.locator('#chapter-2')).toHaveClass(/is-visible/);
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(300);
});

test('navigation moves through chapters without horizontal overflow', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Перейти к разделу 04'}).click();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(500);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
