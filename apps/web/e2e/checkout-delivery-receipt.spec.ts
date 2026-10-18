import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Checkout with delivery and receipt upload', () => {
  test('customer places delivery order with SINPE transfer and uploads receipt', async ({
    page,
  }) => {
    // Intercept receipt upload endpoint to return a valid tracking response with receipt attached,
    // avoiding third-party Cloudinary dependencies in test environments.
    await page.route('**/public/orders/*/receipt', async (route) => {
      const url = route.request().url();
      const token = url.split('/orders/')[1]?.split('/')[0];
      const getRes = await page.request.get(`/api/public/orders/${token}`);
      const current = await getRes.json();
      const updated = {
        ...current,
        paymentStatus: 'RECEIPT_SUBMITTED',
        expiresAt: null,
        receipt: { uploadedAt: new Date().toISOString() },
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    });

    // 1. Visit storefront
    await page.goto('/s/panaderia-demo');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Panadería La Esquina');

    // 2. Add product to cart
    const addButton = page.getByRole('button', { name: /Agregar .* al pedido/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // 3. Open cart and proceed to checkout
    const viewCartButton = page.getByRole('button', { name: /Ver pedido/i });
    await expect(viewCartButton).toBeVisible();
    await viewCartButton.click();

    const continueButton = page.getByRole('button', { name: /Continuar/i });
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    await expect(page).toHaveURL(/\/s\/panaderia-demo\/checkout/);

    // 4. Fill contact details
    await page.locator('input[name="name"]').fill('Mariana Salas');
    await page.locator('input[name="phone"]').fill('8888 5678');

    // 5. Select delivery and delivery zone
    const deliveryOption = page.getByRole('radio', { name: /Envío a domicilio/i });
    await expect(deliveryOption).toBeVisible();
    await deliveryOption.click();

    const zoneOption = page.getByRole('radio', { name: /San Pedro y Montes de Oca/i });
    await expect(zoneOption).toBeVisible();
    await zoneOption.click();

    await page
      .locator('textarea[name="deliveryAddress"]')
      .fill('Calle 1, Casa blanca con portón negro');

    // 6. Select SINPE transfer payment
    const sinpeOption = page.getByRole('radio', { name: /SINPE Móvil/i });
    if (await sinpeOption.isVisible()) {
      await sinpeOption.click();
    }

    // 7. Accept privacy consent
    await page.getByRole('checkbox').check();

    // 8. Place order
    const placeOrderButton = page.getByRole('button', { name: /Hacer pedido/i });
    await expect(placeOrderButton).toBeEnabled();
    await placeOrderButton.click();

    // 9. Verify navigation to tracking page and check payment details
    await expect(page).toHaveURL(/\/t\/[a-zA-Z0-9_-]+/);
    await expect(page.getByText(/8888-1111/)).toBeVisible();

    // 10. Upload payment receipt file
    const fileInput = page.locator('input[type="file"]');
    const fixturePath = path.resolve(__dirname, 'fixtures/receipt.png');
    await fileInput.setInputFiles(fixturePath);

    // 11. Verify receipt upload indicator
    await expect(page.getByText(/Comprobante recibido|Comprobante enviado/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
