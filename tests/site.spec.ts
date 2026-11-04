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
    await expect(story.locator('.story-step.current')).toHaveCSS('opacity', '1');
    await expect(story.locator('.story-step.current')).toHaveCSS('visibility', 'visible');
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


test('interactive story chapters respond to clicks', async ({ page }) => {
  await page.goto('/#/home');
  const chapters=page.getByRole('navigation', {name:'Этапы истории'});
  await expect(chapters.getByRole('button')).toHaveCount(3);
  await chapters.getByRole('button', {name:/этапу 2: Контакт/}).click();
  await expect(chapters.getByRole('button', {name:/этапу 2: Контакт/})).toHaveAttribute('aria-current','step');
  await expect(page.locator('.story-step.current')).toContainText('ПЕРВЫЙ ШАГ');
  await chapters.getByRole('button', {name:/этапу 3: Результат/}).click();
  await expect(chapters.getByRole('button', {name:/этапу 3: Результат/})).toHaveAttribute('aria-current','step');
});


test('sticky cinematic scene remains pinned while changing chapters', async ({ page }) => {
  await page.goto('/#/home');
  const story = page.locator('.scroll-story');
  const sticky = page.locator('.story-sticky');
  await story.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const el = document.querySelector('.scroll-story');
    if (el) window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top + window.innerHeight * 0.35);
  });
  await page.waitForTimeout(500);
  const position = await sticky.evaluate(el => el.getBoundingClientRect().top);
  expect(Math.abs(position)).toBeLessThan(10);
  await expect(story.locator('.story-step.current')).toBeVisible();
  await expect(page.getByRole('navigation', {name:'Этапы истории'})).toBeInViewport();
});


test('business demo switches scenarios and resets conversation', async ({ page }) => {
  await page.goto('/#/home');
  const selector=page.getByRole('group',{name:'Выберите тип бизнеса'});
  await expect(selector.getByRole('button')).toHaveCount(3);
  await selector.getByRole('button',{name:'Услуги'}).click();
  await expect(selector.getByRole('button',{name:'Услуги'})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.bubble.bot').first()).toContainText('Расскажите');
  await page.getByRole('button',{name:'Хочу узнать стоимость'}).click();
  await expect(page.locator('.bubble.bot')).toHaveCount(2);
  await selector.getByRole('button',{name:'IT / SaaS'}).click();
  await expect(page.locator('.bubble.user')).toHaveCount(0);
  await expect(page.locator('.bubble.bot')).toHaveCount(1);
  await expect(page.locator('.bubble.bot')).toContainText('возможностями продукта');
});


test('features and about pages use a decorative glass sculpture instead of a robot', async ({ page }) => {
  for (const route of ['features','about']) {
    await page.goto('/#/'+route);
    await expect(page.locator('.inner-hero-robot')).toBeVisible();
    await expect(page.locator('.inner-hero-orb')).toBeVisible();
    await expect(page.locator('.robot-showcase')).toHaveCount(0);
    await expect(page.locator('.inner-hero-robot h1')).toBeVisible();
  }
});

test('pricing FAQ has light glass layout and accessible accordion', async ({ page }) => {
  await page.goto('/#/pricing');
  const faq=page.locator('.faq-glass');
  await expect(faq).toBeVisible();
  await expect(faq.locator('.faq-sculpture')).toBeVisible();
  const question=faq.getByRole('button',{name:/Нужно ли программировать/});
  if (await question.getAttribute('aria-expanded') !== 'true') await question.click();
  await expect(question).toHaveAttribute('aria-expanded','true');
  await expect(faq.getByText(/подключение выполняется/)).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded','false');
  // FAQ shares the continuous site canvas instead of introducing a hard gradient seam.
  await expect(faq).toHaveCSS('background-image', 'none');
  const siteBackground=await page.locator('.site').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(siteBackground).toContain('gradient');
});


test('mobile pages have no horizontal document overflow', async ({ page }) => {
  for (const route of routes) {
    await page.goto('/' + route.hash);
    await expect(page.locator('main h1')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document, route.hash + ' overflow').toBeLessThanOrEqual(dimensions.viewport + 2);
  }
});

test('FAQ answers are labelled regions and hidden when collapsed', async ({ page }) => {
  await page.goto('/#/pricing');
  const question = page.locator('#faq-question-0');
  const answer = page.locator('#faq-answer-0');
  await expect(question).toHaveAttribute('aria-controls', 'faq-answer-0');
  await expect(answer).toHaveAttribute('aria-labelledby', 'faq-question-0');
  await expect(answer).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await expect(answer).toBeHidden();
  await question.click();
  await expect(answer).toBeVisible();
});

test('demo does not append stale replies after scenario switch', async ({ page }) => {
  await page.goto('/#/home');
  await page.getByRole('button', { name: 'Помогите выбрать товар' }).click();
  await page.getByRole('group', { name: 'Выберите тип бизнеса' }).getByRole('button', { name: 'Услуги' }).click();
  await page.waitForTimeout(650);
  await expect(page.locator('.bubble.bot')).toHaveCount(1);
  await expect(page.locator('.bubble.user')).toHaveCount(0);
});

test('document metadata uses Kontaktium branding and Russian language', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page).toHaveTitle(/Контактиум/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /AI-консультант/);
});

test('FAQ has light decorative glass artwork and no dark WebGL canvas', async ({ page }) => {
  await page.goto('/#/pricing');
  await expect(page.locator('.faq-glass-orb')).toBeVisible();
  await expect(page.locator('.faq-sculpture canvas')).toHaveCount(0);
});

test('continuous site palette has transparent section backgrounds and readable story', async ({ page }) => {
  await page.goto('/#/home');
  const selectors = ['.hero-section', '.scroll-story', '.story-sticky', '.stat-band', '.split-section', '.demo-section', '.process-section', '.calculator-section', '.end-section'];
  for (const selector of selectors) {
    const background = await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor);
    expect(background, selector + ' should not create a hard background edge').toBe('rgba(0, 0, 0, 0)');
  }
  await expect(page.locator('.site')).not.toHaveCSS('background-image', 'none');
  await expect(page.locator('.story-step.current h2')).toBeVisible();
});

test('editorial call to action has readable context and glass illustration', async ({ page }) => {
  for (const route of ['home', 'features', 'about']) {
    await page.goto('/#/' + route);
    const cta = page.locator('.end-section');
    await expect(cta.locator('.end-content h2')).toBeVisible();
    await expect(cta.locator('.end-content p')).toBeVisible();
    await expect(cta.locator('.end-art')).toBeVisible();
    await expect(cta.getByRole('button')).toBeVisible();
  }
});

test('sections receive varied scroll-reveal styles', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.locator('.hero-content h1')).toHaveAttribute('data-motion','rise');
  await expect(page.locator('.hero-copy')).toHaveAttribute('data-motion','slide-left');
  await expect(page.locator('.process-card').first()).toHaveAttribute('data-motion','rise');
  await expect(page.locator('.chatbox')).toHaveAttribute('data-motion','scale');
  await expect(page.locator('.end-art')).toHaveAttribute('data-motion','rise');
});

test('scroll reveals remain readable when reduced motion is enabled', async ({ page }) => {
  await page.goto('/#/home');
  const cards=page.locator('.process-card');
  await cards.first().scrollIntoViewIfNeeded();
  await expect(cards.first()).toHaveClass(/visible/);
  await expect(cards.first()).toHaveCSS('opacity','1');
  // translate3d(0,0,0) computes to an identity matrix in Chromium.
  const transform = await cards.first().evaluate(el => getComputedStyle(el).transform);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)', 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)']).toContain(transform);
  await page.goto('/#/pricing');
  await expect(page.locator('.faq-item').first()).toHaveClass(/visible/);
  await expect(page.locator('.faq-item').first()).toHaveCSS('opacity','1');
});

test('opening and reloading the site starts at the top instead of restoring the middle', async ({ page }) => {
  await page.goto('/#/home');
  await page.locator('.process-section').scrollIntoViewIfNeeded();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(200);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await expect(page.locator('.hero-section')).toBeVisible();
});

test('switching pages resets scroll to the first screen', async ({ page }) => {
  await page.goto('/#/home');
  await page.locator('.process-section').scrollIntoViewIfNeeded();
  await page.locator('.site-header .nav a[href="#/pricing"]').click();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await expect(page.locator('.inner-hero')).toBeVisible();
});

test('demo chat does not pull the visitor away from the hero after initial render', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.locator('.messages .bubble.bot')).toHaveCount(1);
  // The old chat scrollIntoView({behavior:'smooth'}) started after React mounted
  // and dragged the whole document into the demo section.
  await page.waitForTimeout(1600);
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeLessThan(5);
  await expect(page.locator('.hero-content h1')).toBeInViewport();
});

test('chat auto-scroll stays inside the message log', async ({ page }) => {
  await page.goto('/#/home');
  await page.locator('.demo-section').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Помогите выбрать товар' }).click();
  await expect(page.locator('.messages .bubble')).toHaveCount(3);
  const log = page.locator('.messages');
  const internalScroll = await log.evaluate(el => ({ scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
  expect(internalScroll.scrollTop).toBeGreaterThanOrEqual(0);
  expect(internalScroll.scrollHeight).toBeGreaterThanOrEqual(internalScroll.clientHeight);
});
