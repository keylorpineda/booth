import { Check, ChevronDown } from 'lucide-react';
import { type KeyboardEvent, useId, useMemo, useRef, useState } from 'react';

import { type FieldControlProps } from './field';
import { controlClass } from './input';
import { cn } from '../../lib/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  keywords?: string;
}

export interface ComboboxProps extends FieldControlProps {
  options: readonly ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

/** Searchable single-select combobox for long lists such as currencies and IANA time zones. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel = '—',
  disabled = false,
  className,
  ...controlProps
}: ComboboxProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.value} ${option.keywords ?? ''}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [options, query]);

  const safeIndex = filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : -1;
  const activeOption = safeIndex >= 0 ? filtered[safeIndex] : undefined;

  function openMenu() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    const currentIdx = options.findIndex((option) => option.value === value);
    setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
  }

  function closeMenu() {
    setOpen(false);
    setQuery('');
  }

  function selectOption(nextValue: string) {
    onChange(nextValue);
    closeMenu();
    inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      }
    } else if (event.key === 'Enter') {
      if (open) {
        event.preventDefault();
        if (activeOption) selectOption(activeOption.value);
      }
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        closeMenu();
      }
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeOption ? `${listboxId}-${activeOption.value}` : undefined
        }
        disabled={disabled}
        value={open ? query : (selected?.label ?? value)}
        placeholder={open ? (selected?.label ?? placeholder) : placeholder}
        onFocus={openMenu}
        onBlur={closeMenu}
        onChange={(event) => {
          if (!open) setOpen(true);
          setQuery(event.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          controlClass,
          'h-12 pr-10 disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted',
        )}
        {...controlProps}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink-muted"
      />
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-control border border-line-strong bg-surface-raised py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-2.5 text-sm text-ink-muted">{emptyLabel}</div>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === safeIndex;
              return (
                <div
                  key={option.value}
                  id={`${listboxId}-${option.value}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectOption(option.value);
                  }}
                  onMouseEnter={() => {
                    setActiveIndex(index);
                  }}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm text-ink',
                    isActive && 'bg-brand-soft/60',
                    isSelected && 'font-semibold text-brand',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
