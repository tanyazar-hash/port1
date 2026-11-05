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

test('chapters reveal later and the phone stays behind readable text', async ({page})=>{
  await page.goto('/');
  await expect(page.locator('#chapter-0')).toHaveClass(/is-visible/);
  await expect(page.locator('#chapter-1')).not.toHaveClass(/is-visible/);
  await expect(page.locator('.object-stage')).toHaveCSS('z-index','2');
  await expect(page.locator('main')).toHaveCSS('z-index','5');
  await expect(page.locator('.falling-trails i')).toHaveCount(5);
  await page.evaluate(()=>window.scrollTo({top:window.innerHeight*.3,behavior:'instant'}));
  await expect(page.locator('#chapter-1')).not.toHaveClass(/is-visible/);
  await page.evaluate(()=>window.scrollTo({top:window.innerHeight*.78,behavior:'instant'}));
  await expect(page.locator('#chapter-1')).toHaveClass(/is-visible/);
});
