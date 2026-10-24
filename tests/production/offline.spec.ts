import { expect, test } from '@playwright/test';

test('reloads the complete production atlas offline and runs a new seed search', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText(/\d+ predictions found/)).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · local mode')).toBeVisible();
  await expect(page.getByText(/\d+ predictions found/)).toBeVisible();
  await page.getByRole('textbox', { name: 'World seed' }).fill('hello');
  await page.getByRole('button', { name: 'Explore seed' }).click();
  await expect(page.getByText(/\d+ predictions found/)).toBeVisible();
  await expect(page.getByText('Drawing your world…')).toBeHidden();
  await page.screenshot({ path: '.artifacts/production-offline.png', fullPage: true });
  expect(errors).toEqual([]);
});
