import { expect, test } from '@playwright/test';

import { resetDemoSeed } from './helpers/seed';

test.describe('Subdomains and custom domain routing', () => {
  test.beforeEach(() => {
    resetDemoSeed();
  });

  test('storefront resolves at root path on store subdomain and allows checkout', async ({
    page,
  }) => {
    // 1. Visit root of panaderia-demo.localhost:5173
    await page.goto('http://panaderia-demo.localhost:5173/');

    // 2. Check store header and products are loaded directly at /
    await expect(page.getByText('Panadería La Esquina')).toBeVisible();

    // 3. Add first product to cart
    const addButton = page.getByRole('button', { name: /Agregar/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // 4. Open cart and click checkout
    const cartButton = page.getByRole('button', { name: /Ver pedido/i });
    await expect(cartButton).toBeVisible();
    await cartButton.click();

    const checkoutButton = page.getByRole('button', { name: /Continuar/i });
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // 5. Verify checkout page is reached
    await expect(page).toHaveURL(/checkout/);
    await expect(page.getByRole('heading', { name: /Tus datos|Finalizar compra/i })).toBeVisible();
  });

  test('owner settings shows Booth subdomain and custom domain management', async ({ page }) => {
    // 1. Sign in as cafe owner
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('cafe@demo.booth.app');
    await page.locator('input[name="password"]').fill('Demo1234!');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Open Settings -> Dominio tab
    await page.goto('/dashboard/settings?tab=domain');
    await expect(
      page.getByRole('heading', { name: /Subdominio de Booth|Booth Subdomain/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Dominio personalizado|Custom Domain/i }),
    ).toBeVisible();
    await expect(page.getByText('cafe-demo.booth.app')).toBeVisible();
  });
});
