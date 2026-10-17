import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { type ProductForm, productFormSchema } from './product-form';
import { StockFields } from './stock-fields';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { MoneyInput } from '../../../components/ui/money-input';
import { Select } from '../../../components/ui/select';
import { SwitchField } from '../../../components/ui/switch-field';
import { Textarea } from '../../../components/ui/textarea';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';
import { useCategories } from '../categories/api';

interface ProductFormViewProps {
  defaultValues: ProductForm;
  currency: string;
  locale: string;
  saving: boolean;
  submitLabel: string;
  onSubmit: (values: ProductForm) => void;
}

/** Name, description, price, category, visibility and stock. */
export function ProductFormView({
  defaultValues,
  currency,
  locale,
  saving,
  submitLabel,
  onSubmit,
}: ProductFormViewProps) {
  const { t } = useTranslation();
  const canWrite = useCanWrite();
  const categories = useCategories().data ?? [];
  const form = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema(currency)),
    defaultValues,
  });
  const error = useFormError(form);
  const submit = form.handleSubmit(onSubmit);

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
      <Field label={t('catalog.form.name')} error={error('name')}>
        {(control) => <Input maxLength={120} {...control} {...form.register('name')} />}
      </Field>
      <Field
        label={t('catalog.form.price')}
        hint={t('catalog.form.priceHint')}
        error={error('price')}
      >
        {(control) => (
          <Controller
            control={form.control}
            name="price"
            render={({ field }) => (
              <MoneyInput
                {...control}
                currency={currency}
                locale={locale}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="max-w-56"
              />
            )}
          />
        )}
      </Field>
      <Field label={t('catalog.form.description')} error={error('description')}>
        {(control) => (
          <Textarea
            rows={4}
            maxLength={2000}
            placeholder={t('catalog.form.descriptionPlaceholder')}
            {...control}
            {...form.register('description')}
          />
        )}
      </Field>
      <Field label={t('catalog.form.category')}>
        {(control) => (
          <Select {...control} {...form.register('categoryId')}>
            <option value="">{t('catalog.products.uncategorized')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="flex flex-col gap-4 rounded-card border border-line p-4">
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <SwitchField
              label={t('catalog.form.isActive')}
              hint={t('catalog.form.isActiveHint')}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <StockFields form={form} />
      </div>
      <Button type="submit" size="lg" disabled={!canWrite} loading={saving}>
        {submitLabel}
      </Button>
    </form>
  );
}
