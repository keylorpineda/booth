import { expect, test } from '@playwright/test';

import { resetDemoSeed } from './helpers/seed';

test.describe('Owner order flow', () => {
  test.beforeEach(() => {
    resetDemoSeed();
  });

  test('owner advances order through its entire lifecycle to completion', async ({ page }) => {
    // 1. Sign in as store owner
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('panaderia@demo.booth.app');
    await page.locator('input[name="password"]').fill('Demo1234!');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();

    // 2. Navigate to orders page
    await expect(page).toHaveURL(/\/dashboard/);
    await page
      .getByRole('link', { name: /Pedidos/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    await expect(page.getByRole('heading', { level: 1, name: /Pedidos/i })).toBeVisible();

    // 3. Find and open the pending order (#PAN101)
    const pendingOrderLink = page.locator('a[href*="/dashboard/orders/demo-order-cr-1"]');
    await expect(pendingOrderLink).toBeVisible();
    await pendingOrderLink.click();

    await expect(page).toHaveURL(/\/dashboard\/orders\/demo-order-cr-1/);
    await expect(page.getByRole('heading', { level: 1, name: /#PAN101/i })).toBeVisible();

    // 4. Confirm the order (PENDING -> CONFIRMED)
    const confirmButton = page.getByRole('button', { name: /Confirmar pedido/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 5. Start preparing (CONFIRMED -> PREPARING)
    const prepareButton = page.getByRole('button', { name: /Empezar a preparar/i });
    await expect(prepareButton).toBeVisible({ timeout: 10_000 });
    await prepareButton.click();

    // 6. Mark as ready (PREPARING -> READY)
    const readyButton = page.getByRole('button', { name: /Marcar como listo/i });
    await expect(readyButton).toBeVisible({ timeout: 10_000 });
    await readyButton.click();

    // 7. Mark as delivered / completed (READY -> COMPLETED)
    const deliverButton = page.getByRole('button', { name: /Marcar como entregado/i });
    await expect(deliverButton).toBeVisible({ timeout: 10_000 });
    await deliverButton.click();

    // 8. Verify the order is marked COMPLETED
    await expect(page.getByText(/Entregado|Este pedido ya se entregó/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
