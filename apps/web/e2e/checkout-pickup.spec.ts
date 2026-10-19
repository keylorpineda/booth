import { expect, test } from '@playwright/test';

test.describe('Checkout with pickup', () => {
  test('customer browses products and places a pickup order with cash', async ({ page }) => {
    // 1. Visit storefront
    await page.goto('/s/panaderia-demo');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Panadería La Esquina');

    // 2. Add first product to cart
    const addButton = page.getByRole('button', { name: /^Agregar /i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // 3. Open cart sheet from floating bar
    const viewCartButton = page.getByRole('button', { name: /Ver pedido/i });
    await expect(viewCartButton).toBeVisible();
    await viewCartButton.click();

    // 4. Proceed to checkout
    const continueButton = page.getByRole('button', { name: /Continuar/i });
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    await expect(page).toHaveURL(/\/s\/panaderia-demo\/checkout/);

    // 5. Fill contact information
    await page.locator('input[name="name"]').fill('Carlos Gómez');
    await page.locator('input[name="phone"]').fill('8888 1234');

    // 6. Ensure pickup is selected
    const pickupOption = page.getByRole('radio', { name: /Retiro en tienda|Pasar a recoger/i });
    await expect(pickupOption).toBeVisible();
    await pickupOption.click();

    // 7. Choose cash payment
    const cashOption = page.getByRole('radio', { name: /Efectivo/i });
    if (await cashOption.isVisible()) {
      await cashOption.click();
    }

    // 8. Accept privacy consent
    await page.getByRole('checkbox').check();

    // 9. Place the order
    const placeOrderButton = page.getByRole('button', { name: /Hacer pedido/i });
    await expect(placeOrderButton).toBeEnabled();
    await placeOrderButton.click();

    // 10. Verify redirect to tracking page
    await expect(page).toHaveURL(/\/t\/[a-zA-Z0-9_-]+/);
    await expect(page.getByText(/¡Pedido guardado!/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Enviar pedido por WhatsApp/i })).toBeVisible();
  });
});
