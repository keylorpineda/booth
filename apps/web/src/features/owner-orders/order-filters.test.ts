import { describe, expect, it } from 'vitest';

import { parseOrderFilters, toApiQuery, toSearchParams } from './order-filters';

describe('order filters', () => {
  it('defaults to active orders with any payment', () => {
    expect(parseOrderFilters(new URLSearchParams())).toEqual({
      tab: 'active',
      payment: null,
      q: '',
    });
  });

  it('ignores unknown values from a hand-edited URL', () => {
    const filters = parseOrderFilters(new URLSearchParams('tab=x&payment=FREE&q=%20ana%20'));
    expect(filters).toEqual({ tab: 'active', payment: null, q: 'ana' });
  });

  it('round-trips through the URL, keeping only non-default values', () => {
    const filters = { tab: 'closed', payment: 'PAID', q: '7777' } as const;
    expect(parseOrderFilters(toSearchParams(filters))).toEqual(filters);
    expect(toSearchParams({ tab: 'active', payment: null, q: '' }).toString()).toBe('');
  });

  it('maps tabs to the API status lists', () => {
    const query = (tab: 'active' | 'completed' | 'closed' | 'all') =>
      new URLSearchParams(toApiQuery({ tab, payment: null, q: '' })).get('status');
    expect(query('active')).toBe('PENDING,CONFIRMED,PREPARING,READY');
    expect(query('completed')).toBe('COMPLETED');
    expect(query('closed')).toBe('CANCELLED,EXPIRED');
    expect(query('all')).toBeNull();
  });

  it('adds payment, search and cursor to the API query', () => {
    const query = new URLSearchParams(
      toApiQuery({ tab: 'all', payment: 'RECEIPT_SUBMITTED', q: 'SW12CJ' }, 'cursor-1'),
    );
    expect(Object.fromEntries(query)).toEqual({
      paymentStatus: 'RECEIPT_SUBMITTED',
      q: 'SW12CJ',
      cursor: 'cursor-1',
    });
  });
});
