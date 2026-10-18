import { expect, test } from '@playwright/test';

test.describe('Demo mode read-only restrictions', () => {
  test('read-only demo account shows demo banner and cannot save changes in settings or catalog', async ({
    page,
  }) => {
    // 1. Sign in as demo owner (cafe@demo.booth.app is seeded with isDemo: true)
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('cafe@demo.booth.app');
    await page.locator('input[name="password"]').fill('Demo1234!');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();

    // 2. Verify demo banner is rendered across the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    const demoBanner = page.getByRole('status');
    await expect(demoBanner).toBeVisible();
    await expect(demoBanner).toContainText(
      /Estás explorando una cuenta demo de solo lectura|read-only demo account/i,
    );

    // 3. Navigate to settings and verify the save button is disabled
    await page
      .getByRole('link', { name: /Ajustes|Settings/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    const settingsSaveButton = page.getByRole('button', {
      name: /Guardar cambios|Save changes/i,
    });
    await expect(settingsSaveButton).toBeVisible();
    await expect(settingsSaveButton).toBeDisabled();

    // 4. Navigate to catalog and edit a product
    await page
      .getByRole('link', { name: /Catálogo|Catalog/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/catalog/);
    const editProductLink = page.locator('a[href*="/catalog/products/"]').first();
    await expect(editProductLink).toBeVisible();
    await editProductLink.click();

    await expect(page).toHaveURL(/\/dashboard\/catalog\/products\/[a-zA-Z0-9_-]+/);

    // 5. Verify the catalog form save button is disabled
    const catalogSaveButton = page.getByRole('button', {
      name: /Guardar producto|Save product/i,
    });
    await expect(catalogSaveButton).toBeVisible();
    await expect(catalogSaveButton).toBeDisabled();
  });
});
