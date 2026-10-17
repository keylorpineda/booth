import { z } from 'zod';

import { type CreateProductInput, MAX_STOCK, type Product } from '@booth/shared';

import { formatMoneyInput, parseMoneyInput } from '../../../lib/money-input';

/** Form-shaped product schema: text fields as typed, messages as i18n keys. */
export function productFormSchema(currency: string) {
  return z
    .object({
      name: z.string().trim().min(1, 'validation.required').max(120, 'validation.tooLong'),
      description: z.string().trim().max(2000, 'validation.tooLong'),
      price: z.string(),
      categoryId: z.string(),
      isActive: z.boolean(),
      trackStock: z.boolean(),
      stock: z.string().trim(),
    })
    .superRefine((form, ctx) => {
      const price = parseMoneyInput(form.price, currency);
      if (!price.ok) {
        const message = {
          empty: 'validation.required',
          invalid: 'validation.amount',
          decimals: 'validation.amountDecimals',
        }[price.reason];
        ctx.addIssue({ code: 'custom', path: ['price'], message });
      }
      if (form.trackStock) {
        const stock = Number(form.stock);
        if (!/^\d+$/.test(form.stock) || stock > MAX_STOCK) {
          ctx.addIssue({ code: 'custom', path: ['stock'], message: 'validation.stock' });
        }
      }
    });
}

export type ProductForm = z.infer<ReturnType<typeof productFormSchema>>;

export function emptyProductForm(categoryId: string | null): ProductForm {
  return {
    name: '',
    description: '',
    price: '',
    categoryId: categoryId ?? '',
    isActive: true,
    trackStock: false,
    stock: '0',
  };
}

/** An existing product as form values (price shown in the store's format). */
export function toProductForm(product: Product, currency: string, locale: string): ProductForm {
  return {
    name: product.name,
    description: product.description ?? '',
    price: formatMoneyInput(product.priceMinor, currency, locale),
    categoryId: product.categoryId ?? '',
    isActive: product.isActive,
    trackStock: product.trackStock,
    stock: String(product.stock),
  };
}

/** The API body. Only called after validation, so the price parses. */
export function toProductInput(form: ProductForm, currency: string): CreateProductInput {
  const price = parseMoneyInput(form.price, currency);
  if (!price.ok) throw new Error('Price must be validated before submitting');
  return {
    name: form.name,
    description: form.description === '' ? null : form.description,
    priceMinor: price.minor,
    categoryId: form.categoryId === '' ? null : form.categoryId,
    isActive: form.isActive,
    trackStock: form.trackStock,
    stock: form.trackStock ? Number(form.stock) : 0,
  };
}
