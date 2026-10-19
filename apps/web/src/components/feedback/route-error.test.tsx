import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RouteError } from './route-error';
import { ApiError } from '../../lib/api-client';

function renderThrowing(error: unknown) {
  const Boom = () => {
    throw error;
  };
  const router = createMemoryRouter([
    { path: '/', element: <Boom />, errorElement: <RouteError /> },
  ]);
  render(<RouterProvider router={router} />);
}

describe('RouteError', () => {
  beforeEach(() => {
    // React and React Router log caught render errors; keep the output clean.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('replaces the framework page with a retry and a way home', () => {
    renderThrowing(new Error('boom'));
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal');
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al inicio/ })).toHaveAttribute('href', '/');
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  it('shows the request id of an API error', () => {
    renderThrowing(new ApiError(500, 'INTERNAL_ERROR', 'x', undefined, 'req-123'));
    expect(screen.getByText('Referencia: req-123')).toBeInTheDocument();
  });

  it('offers the new version when a page chunk is gone after a deploy', () => {
    sessionStorage.setItem('booth.staleReloadAt', String(Date.now()));
    renderThrowing(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'));
    expect(screen.getByRole('alert')).toHaveTextContent('Hay una versión nueva');
    expect(screen.getByRole('button', { name: /Actualizar/ })).toBeInTheDocument();
  });
});
