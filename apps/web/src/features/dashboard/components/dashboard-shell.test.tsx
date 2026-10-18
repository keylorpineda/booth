import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';

import { DashboardShell } from './dashboard-shell';
import { createQueryClient } from '../../../lib/query-client';
import { useSessionStore } from '../../auth/session-store';
import { useCanWrite } from '../../auth/use-can-write';

function SaveButton() {
  return (
    <button type="button" disabled={!useCanWrite()}>
      Save
    </button>
  );
}

function renderShell(isDemo: boolean) {
  useSessionStore.setState({
    status: 'signedIn',
    accessToken: 'token',
    session: {
      user: { id: 'u1', email: 'ana@example.com', name: 'Ana Mora', isDemo },
      store: { id: 's1', slug: 'la-esquina', name: 'La Esquina' },
      role: 'OWNER',
    },
  });
  const router = createMemoryRouter(
    [
      {
        path: '/dashboard',
        element: <DashboardShell />,
        children: [{ index: true, element: <SaveButton /> }],
      },
    ],
    { initialEntries: ['/dashboard'] },
  );
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('DashboardShell', () => {
  beforeEach(() => {
    useSessionStore.setState({ status: 'unknown', session: null, accessToken: null });
  });

  it('shows the store name and navigation to every section', () => {
    renderShell(false);
    expect(screen.getByText('La Esquina')).toBeInTheDocument();
    const navs = screen.getAllByRole('navigation');
    for (const nav of navs) {
      expect(within(nav).getAllByRole('link')).toHaveLength(4);
    }
  });

  it('explains the demo account and disables save actions', () => {
    renderShell(true);
    expect(screen.getByRole('status')).toHaveTextContent(/demo/i);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('keeps save actions enabled for real owners', () => {
    renderShell(false);
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
