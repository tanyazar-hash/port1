import { test, expect } from '@playwright/test';

const routes = [
  { hash: '#/home', heading: 'САЙТ МОЛЧИТ.' },
  { hash: '#/features', heading: 'ВОЗМОЖНОСТИ' },
  { hash: '#/pricing', heading: 'ТАРИФЫ' },
  { hash: '#/about', heading: 'О СЕРВИСЕ' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Keep screenshots deterministic and allow testing on CI without a GPU.
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
      }),
    });
  });
});

test('every page renders content and does not crash', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    await page.goto('/' + route.hash);
    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('NaN');
    await expect(page.locator('main')).not.toContainText('undefined');
    await page.screenshot({ path: testInfo.outputPath(route.hash.slice(2) + '.png'), fullPage: true, animations: 'disabled' });
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test('navigation changes pages and browser back restores previous page', async ({ page }) => {
  await page.goto('/#/home');
  const menuButton = page.getByRole('button', { name: 'Открыть меню' });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole('navigation', { name: 'Навигация' }).getByRole('link', { name: 'Тарифы' }).click();
  await expect(page).toHaveURL(/#\/pricing$/);
  await expect(page.locator('main h1')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/home$/);
});

test('scroll story has readable content without NaN or blank stage', async ({ page }, testInfo) => {
  await page.goto('/#/home');
  const story = page.locator('.scroll-story');
  await expect(story).toHaveCount(1);
  for (const fraction of [0.08, 0.5, 0.92]) {
    await story.evaluate((element, f) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      const range = Math.max(1, element.getBoundingClientRect().height - window.innerHeight);
      window.scrollTo(0, top + range * f);
    }, fraction);
    await page.waitForTimeout(350);
    await expect(story).not.toContainText('NaN');
    await expect(story.locator('.story-step.current')).toHaveCount(1);
    await expect(story.locator('.story-step.current h2')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('story-' + Math.round(fraction * 100) + '.png'), animations: 'disabled' });
  }
});

test('demo chat responds to a message', async ({ page }) => {
  await page.goto('/#/home');
  await page.getByRole('textbox', { name: 'Сообщение для демо-чата' }).fill('Привет!');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.locator('.bubble.user')).toContainText('Привет!');
  await expect(page.locator('.bubble.bot')).toHaveCount(2);
});

test('calculator updates when range changes', async ({ page }) => {
  await page.goto('/#/home');
  const result = page.locator('.calc-result strong');
  await expect(result).toBeVisible();
  const before = await result.textContent();
  await page.locator('.calc-controls input[type="range"]').first().evaluate((element: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(element, '15000');
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(result).not.toHaveText(before || '');
});
