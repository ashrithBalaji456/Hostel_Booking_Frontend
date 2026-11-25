import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectDropdownProps<T extends string = string> {
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

/**
 * Custom curved-edge glassmorphic select dropdown that replaces native OS
 * `<select>` popups with rounded, keyboard-accessible dark-navy menus.
 */
export function SelectDropdown<T extends string = string>({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = 'Select…',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value))
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [value, options]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectAt = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setActiveIndex(index);
    setOpen(false);
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setActiveIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        selectAt(activeIndex);
      }
    } else if (e.key === 'Home' && open) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && open) {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-700/90 bg-slate-900/90 px-3.5 py-2 text-left text-sm text-white transition hover:border-slate-600 focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180 text-cyan-300' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 right-0 z-50 mt-1.5 max-h-64 min-w-[11rem] overflow-auto rounded-2xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-2xl shadow-black/70 backdrop-blur-xl ${menuClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === activeIndex;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectAt(index)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'bg-cyan-500/20 font-medium text-cyan-200'
                      : isHighlighted
                        ? 'bg-slate-800/90 text-white'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
