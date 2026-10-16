import { useTranslation } from 'react-i18next';

import { type PaymentStatus } from '@booth/shared';

import { Select } from '../../../components/ui/select';
import { PAYMENT_FILTERS } from '../order-filters';

interface PaymentFilterProps {
  value: PaymentStatus | null;
  onChange: (value: PaymentStatus | null) => void;
}

export function PaymentFilter({ value, onChange }: PaymentFilterProps) {
  const { t } = useTranslation();

  return (
    <Select
      aria-label={t('orders.paymentFilter')}
      value={value ?? ''}
      onChange={(event) => {
        onChange(PAYMENT_FILTERS.find((option) => option === event.target.value) ?? null);
      }}
      className="h-11 sm:w-56"
    >
      <option value="">{t('orders.anyPayment')}</option>
      {PAYMENT_FILTERS.map((option) => (
        <option key={option} value={option}>
          {t(`orders.payment.${option}`)}
        </option>
      ))}
    </Select>
  );
}
