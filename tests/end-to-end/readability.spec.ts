import { expect, test } from '@playwright/test';

test('keeps the atlas readable at 125 percent display scaling', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One display-scaling regression is sufficient.');
  const context = await browser.newContext({ viewport: { width: 1152, height: 720 }, deviceScaleFactor: 1.25 });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5174/');
    await expect(page.getByText(/\d+ predictions found/)).toBeVisible();
    expect(await page.locator('.discovery-copy > strong').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    expect(await page.locator('.discovery-copy > small').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    await page.screenshot({ path: '.artifacts/desktop-125-percent.png', fullPage: true });
  } finally {
    await context.close();
  }
});
