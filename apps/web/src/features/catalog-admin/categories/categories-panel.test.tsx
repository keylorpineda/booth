import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoriesPanel } from './categories-panel';
import { createQueryClient } from '../../../lib/query-client';
import { useSessionStore } from '../../auth/session-store';

const categories = [
  { id: 'c1', name: 'Panes', position: 0, isActive: true, productCount: 3 },
  { id: 'c2', name: 'Bebidas', position: 1, isActive: false, productCount: 0 },
];

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

describe('CategoriesPanel', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    useSessionStore.setState({
      status: 'signedIn',
      accessToken: 'token',
      session: {
        user: { id: 'u1', email: 'ana@example.com', name: 'Ana', isDemo: false },
        store: { id: 's1', slug: 'la-esquina', name: 'La Esquina' },
      },
    });
    fetchMock.mockImplementation((_url, init) =>
      Promise.resolve(json(init?.method === 'PUT' ? [...categories].reverse() : categories)),
    );
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  const renderPanel = () =>
    render(
      <QueryClientProvider client={createQueryClient()}>
        <CategoriesPanel />
      </QueryClientProvider>,
    );

  it('lists categories with counts and marks hidden ones', async () => {
    renderPanel();
    expect(await screen.findByText('Panes')).toBeInTheDocument();
    expect(screen.getByText('3 productos')).toBeInTheDocument();
    expect(screen.getByText('0 productos · Oculta')).toBeInTheDocument();
  });

  it('disables moves past the edges and sends the new order', async () => {
    renderPanel();
    await screen.findByText('Panes');
    expect(screen.getByRole('button', { name: 'Subir Panes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar Bebidas' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Bajar Panes' }));

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
      expect(put?.[1]?.body).toBe(JSON.stringify({ ids: ['c2', 'c1'] }));
    });
  });
});
