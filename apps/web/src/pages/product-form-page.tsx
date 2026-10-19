import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { ErrorState } from '../components/feedback/error-state';
import { NotFoundState } from '../components/feedback/not-found-state';
import { Button, buttonVariants } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { useCanWrite } from '../features/auth/use-can-write';
import { useProduct, useProductMutations } from '../features/catalog-admin/products/api';
import {
  emptyProductForm,
  type ProductForm,
  toProductForm,
  toProductInput,
} from '../features/catalog-admin/products/product-form';
import { ProductFormView } from '../features/catalog-admin/products/product-form-view';
import { ProductImages } from '../features/catalog-admin/products/product-images';
import { useOwnerStore } from '../features/dashboard/api';
import { useOwnerLocale } from '../features/dashboard/use-owner-money';
import { useErrorMessage } from '../hooks/use-error-message';
import { ApiError } from '../lib/api-client';

/** New product (`/new`) or edit an existing one (`/:id`). */
export function ProductFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const locale = useOwnerLocale();
  const store = useOwnerStore();
  const product = useProduct(id);
  const { create, update, remove } = useProductMutations();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = id !== undefined;
  const currency = store.data?.currency;

  if (product.error instanceof ApiError && product.error.status === 404) {
    return (
      <NotFoundState
        title={t('catalog.notFoundTitle')}
        description={t('catalog.notFoundDescription')}
        action={
          <Link to="/dashboard/catalog" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="size-4" />
            {t('catalog.backToCatalog')}
          </Link>
        }
      />
    );
  }
  const error = store.error ?? product.error;
  if (error) return <ErrorState error={error} onRetry={() => void product.refetch()} />;
  if (!currency || (editing && !product.data)) {
    return <Skeleton className="h-[32rem] rounded-card" />;
  }

  const save = (values: ProductForm) => {
    const input = toProductInput(values, currency);
    const onError = (failure: unknown) => toast.error(errorMessage(failure));
    if (editing) {
      update.mutate(
        { id, ...input },
        { onSuccess: () => toast.success(t('catalog.form.saved')), onError },
      );
    } else {
      create.mutate(input, {
        onSuccess: (created) => {
          toast.success(t('catalog.form.created', { name: created.name }));
          // Straight to the edit page, where photos are added.
          void navigate(`/dashboard/catalog/products/${created.id}`, { replace: true });
        },
        onError,
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <title>{`${editing ? t('catalog.form.editTitle') : t('catalog.form.newTitle')} · Booth`}</title>
      <Link
        to="/dashboard/catalog"
        className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}
      >
        <ArrowLeft className="size-4" />
        {t('dashboard.nav.catalog')}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {editing ? (product.data?.name ?? '') : t('catalog.form.newTitle')}
        </h1>
        {editing ? (
          <Button
            variant="ghost"
            className="text-danger"
            disabled={!canWrite}
            aria-label={t('catalog.form.delete')}
            onClick={() => {
              setConfirmDelete(true);
            }}
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">{t('catalog.form.delete')}</span>
          </Button>
        ) : null}
      </div>
      <div className="mt-6 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
        <ProductFormView
          key={product.data?.updatedAt ?? 'new'}
          defaultValues={
            product.data ? toProductForm(product.data, currency, locale) : emptyProductForm(null)
          }
          currency={currency}
          locale={locale}
          saving={create.isPending || update.isPending}
          submitLabel={editing ? t('catalog.form.save') : t('catalog.form.create')}
          onSubmit={save}
        />
      </div>
      {product.data ? (
        <div className="mt-4">
          <ProductImages product={product.data} />
        </div>
      ) : null}
      {editing ? (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={t('catalog.form.deleteTitle', { name: product.data?.name ?? '' })}
          description={t('catalog.form.deleteText')}
          confirmLabel={t('catalog.form.deleteConfirm')}
          destructive
          loading={remove.isPending}
          onConfirm={() => {
            remove.mutate(id, {
              onSuccess: () => {
                toast.success(t('catalog.form.deleted'));
                void navigate('/dashboard/catalog', { replace: true });
              },
              onError: (failure) => toast.error(errorMessage(failure)),
            });
          }}
        />
      ) : null}
    </div>
  );
}
