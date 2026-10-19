import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { buttonVariants } from '../../../components/ui/button';
import { useCanWrite } from '../../auth/use-can-write';

/** Entry point to the new product form; hidden for the read-only demo account. */
export function AddProductLink() {
  const { t } = useTranslation();
  if (!useCanWrite()) return null;

  return (
    <Link to="/dashboard/catalog/products/new" className={buttonVariants()}>
      <Plus className="size-4" />
      {t('catalog.products.add')}
    </Link>
  );
}
