import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';

import { type Session } from '@booth/shared';

import { GuestOnly } from './guest-only';
import { RequireSession } from './require-session';
import { RequireStore } from './require-store';
import { type SessionStatus, useSessionStore } from '../session-store';

function Here() {
  const location = useLocation();
  return <p data-testid="here">{location.pathname + location.search}</p>;
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { element: <GuestOnly />, children: [{ path: '/login', element: <Here /> }] },
      {
        element: <RequireSession />,
        children: [
          { path: '/onboarding', element: <Here /> },
          { element: <RequireStore />, children: [{ path: '/dashboard/*', element: <Here /> }] },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return () => screen.getByTestId('here').textContent;
}

const user = { id: 'u1', email: 'ana@example.com', name: 'Ana', isDemo: false };
const withStore: Session = { user, store: { id: 's1', slug: 'la-esquina', name: 'La Esquina' } };

function setSession(status: SessionStatus, session: Session | null = null) {
  useSessionStore.setState({ status, session, accessToken: session ? 'token' : null });
}

describe('route guards', () => {
  beforeEach(() => {
    setSession('signedOut');
  });

  it('sends signed-out owners to sign in, keeping where they were going', () => {
    const here = renderAt('/dashboard/orders?status=PENDING');
    expect(here()).toBe(
      `/login?redirect=${encodeURIComponent('/dashboard/orders?status=PENDING')}`,
    );
  });

  it('sends owners without a store to onboarding', () => {
    setSession('signedIn', { user, store: null });
    expect(renderAt('/dashboard')()).toBe('/onboarding');
  });

  it('lets owners with a store into the dashboard', () => {
    setSession('signedIn', withStore);
    expect(renderAt('/dashboard')()).toBe('/dashboard');
  });

  it('moves signed-in owners away from sign in, honoring a safe redirect', () => {
    setSession('signedIn', withStore);
    expect(renderAt(`/login?redirect=${encodeURIComponent('/dashboard/x')}`)()).toBe(
      '/dashboard/x',
    );
  });

  it('ignores an external redirect', () => {
    setSession('signedIn', withStore);
    expect(renderAt(`/login?redirect=${encodeURIComponent('//evil.com')}`)()).toBe('/dashboard');
  });
});
