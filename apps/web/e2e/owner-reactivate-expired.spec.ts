import { expect, test } from '@playwright/test';

test.describe('Owner reactivates expired order', () => {
  test('owner finds an expired order and reactivates it back to pending', async ({ page }) => {
    // 1. Sign in as store owner
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('panaderia@demo.booth.app');
    await page.locator('input[name="password"]').fill('Demo1234!');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();

    // 2. Navigate to orders page and switch to "Cancelados y vencidos" tab
    await expect(page).toHaveURL(/\/dashboard/);
    await page
      .getByRole('link', { name: /Pedidos/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    const closedTab = page.getByRole('tab', { name: /Cancelados y vencidos/i });
    await expect(closedTab).toBeVisible();
    await closedTab.click();

    // 3. Find and open the expired order (#PAN108)
    const expiredOrderLink = page.getByRole('link', { name: /#PAN108/i });
    await expect(expiredOrderLink).toBeVisible();
    await expiredOrderLink.click();

    await expect(page).toHaveURL(/\/dashboard\/orders\/demo-order-cr-8/);
    await expect(page.getByRole('heading', { level: 1, name: /#PAN108/i })).toBeVisible();

    // 4. Verify expired explanation is shown
    await expect(
      page.getByText(/Este pedido venció porque el cliente no pagó ni subió comprobante/i),
    ).toBeVisible();

    // 5. Click reactivate button
    const reactivateButton = page.getByRole('button', { name: /Reactivar pedido/i });
    await expect(reactivateButton).toBeVisible();
    await reactivateButton.click();

    // 6. Verify order transitioned back to PENDING and can be confirmed
    await expect(page.getByRole('button', { name: /Confirmar pedido/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
