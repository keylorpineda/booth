import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ACTIVE_ORDER_STATUSES, ownerOrderSummarySchema, paginatedSchema } from '@booth/shared';

import { type OrderAlert, orderAlerts, type OrderSnapshot, snapshotOf } from './order-alerts';
import { type AlertsSetting } from './use-alerts-setting';
import { ownerApi } from '../auth/owner-api';
import { useOwnerMoney } from '../dashboard/use-owner-money';

const CHECK_MS = 30_000;
const pageSchema = paginatedSchema(ownerOrderSummarySchema);

/**
 * Watches active orders from any dashboard page (also in a background tab) and tells the owner
 * about new orders and receipts: a toast, a count in the tab title and, when allowed, a system
 * notification that opens the order.
 */
export function useOrderAlerts(setting: AlertsSetting): void {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const money = useOwnerMoney();
  const snapshotRef = useRef<OrderSnapshot>(null);
  const unseenRef = useRef(0);

  const { data } = useQuery({
    queryKey: ['owner', 'orders', 'alerts'],
    queryFn: ({ signal }) =>
      ownerApi(`/me/orders?status=${ACTIVE_ORDER_STATUSES.join(',')}&limit=50`, {
        schema: pageSchema,
        signal,
      }),
    refetchInterval: CHECK_MS,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!data) return;
    const alerts = orderAlerts(snapshotRef.current, data.data);
    snapshotRef.current = snapshotOf(data.data);
    if (alerts.length === 0) return;

    // Lists and details on screen catch up right away.
    void queryClient.invalidateQueries({ queryKey: ['owner', 'orders', 'list'] });

    const open = (alert: OrderAlert) => {
      window.focus();
      void navigate(`/dashboard/orders/${alert.order.id}`);
    };
    for (const alert of alerts) {
      const title = t(`alerts.${alert.kind}.title`, { code: alert.order.code });
      const body = t(`alerts.${alert.kind}.body`, {
        name: alert.order.customerName,
        total: money(alert.order.totalMinor, alert.order.currency),
      });
      toast(title, {
        description: body,
        action: {
          label: t('alerts.open'),
          onClick: () => {
            open(alert);
          },
        },
      });
      if (setting === 'on' && document.visibilityState === 'hidden') {
        const notification = new Notification(title, { body, tag: alert.order.id });
        notification.onclick = () => {
          open(alert);
          notification.close();
        };
      }
    }
    if (document.visibilityState === 'hidden') {
      unseenRef.current += alerts.length;
      document.title = `(${String(unseenRef.current)}) ${document.title.replace(/^\(\d+\) /, '')}`;
    }
  }, [data, setting, t, navigate, queryClient, money]);

  // Back on the tab: the count in the title has been seen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || unseenRef.current === 0) return;
      unseenRef.current = 0;
      document.title = document.title.replace(/^\(\d+\) /, '');
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
