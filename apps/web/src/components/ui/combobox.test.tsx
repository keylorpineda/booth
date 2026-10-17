import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxOption } from './combobox';

const options: ComboboxOption[] = [
  { value: 'CRC', label: 'CRC — Costa Rican colón' },
  { value: 'COP', label: 'COP — Colombian peso' },
  { value: 'USD', label: 'USD — US dollar' },
];

describe('Combobox', () => {
  it('displays the selected option label when closed and filters on input', () => {
    const onChange = vi.fn();
    render(
      <Combobox
        id="currency"
        options={options}
        value="CRC"
        onChange={onChange}
        emptyLabel="No matches"
      />,
    );

    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('CRC — Costa Rican colón');

    fireEvent.focus(input);
    expect(screen.getAllByRole('option')).toHaveLength(3);

    fireEvent.change(input, { target: { value: 'colombian' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /COP/ })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('option', { name: /COP/ }));
    expect(onChange).toHaveBeenCalledWith('COP');
  });

  it('supports keyboard navigation with ArrowDown and Enter', () => {
    const onChange = vi.fn();
    render(<Combobox id="currency" options={options} value="CRC" onChange={onChange} />);

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('COP');
  });

  it('does not open when disabled', () => {
    render(<Combobox id="currency" options={options} value="CRC" onChange={vi.fn()} disabled />);

    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
    fireEvent.focus(input);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
