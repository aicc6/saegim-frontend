'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (next: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  optionClassName?: string;
  ariaLabel?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  buttonClassName,
  optionClassName,
  ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const selected = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [value, options],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Set initial highlighted to selected or first
    const index = Math.max(
      0,
      options.findIndex((opt) => opt.value === value),
    );
    setHighlightedIndex(index === -1 ? 0 : index);
  }, [isOpen, options, value]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      e.preventDefault();
      return;
    }
    if (!isOpen) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(options.length - 1, i + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[highlightedIndex];
      if (opt) {
        onChange(opt.value);
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`w-full rounded-2xl border border-border-subtle bg-white p-3.5 text-left text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus shadow-card flex items-center justify-between ${
          buttonClassName ?? ''
        }`}
      >
        <span>{selected?.label ?? placeholder ?? '선택'}</span>
        <svg
          className="h-5 w-5 text-text-secondary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 right-0 mt-2 max-h-64 overflow-auto rounded-2xl border border-border-subtle bg-white shadow-card z-20"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2.5 cursor-pointer text-body ${
                  isHighlighted
                    ? 'bg-background-hover'
                    : isSelected
                      ? 'bg-background-secondary'
                      : 'bg-white'
                } text-text-primary hover:bg-background-hover ${optionClassName ?? ''}`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
