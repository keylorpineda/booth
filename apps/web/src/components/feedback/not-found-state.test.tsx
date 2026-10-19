import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { NotFoundState } from './not-found-state';
import { NotFoundPage } from '../../pages/not-found-page';

describe('NotFoundState', () => {
  it('names what is missing and offers the given way forward', () => {
    render(
      <NotFoundState
        title="No encontramos este producto"
        description="Puede que lo hayan eliminado."
        action={<a href="/dashboard/catalog">Volver al catálogo</a>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No encontramos este producto' })).toBeVisible();
    expect(screen.getByText('Puede que lo hayan eliminado.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toBeVisible();
  });

  it('renders the generic 404 with a link home', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Ir al inicio/ })).toHaveAttribute('href', '/');
  });
});
