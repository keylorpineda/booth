import { expect, test } from '@playwright/test';

test.describe('Not-found screens', () => {
  test('an unknown page explains itself and leads home', async ({ page }) => {
    await page.goto('/esta-pagina-no-existe');
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
    await page.getByRole('link', { name: 'Ir al inicio' }).click();
    await expect(page).toHaveURL('/');
  });

  test('an unknown store says the store was not found', async ({ page }) => {
    await page.goto('/s/tienda-que-no-existe');
    await expect(page.getByRole('heading', { name: 'No encontramos esta tienda' })).toBeVisible();
  });

  test('an invalid tracking link says so', async ({ page }) => {
    await page.goto('/t/token-que-no-existe-1234567890');
    await expect(
      page.getByRole('heading', { name: 'Enlace de seguimiento no válido' }),
    ).toBeVisible();
  });
});
