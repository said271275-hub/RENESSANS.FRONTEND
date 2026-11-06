import React, { useState, useRef, useEffect, useMemo, useLayoutEffect, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
  value?: string | number;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  menuPlacement?: 'auto' | 'top' | 'bottom';
}

interface MenuPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      children,
      value,
      onChange,
      className = '',
      placeholder = 'Tanlang...',
      disabled = false,
      menuPlacement = 'auto',
      name,
      id,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const setTriggerRef = (node: HTMLDivElement | null) => {
      triggerRef.current = node;
    };

    useImperativeHandle(ref, () => triggerRef.current!, []);

    // Extract options from options prop or <option> children
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options && options.length > 0) {
        return options;
      }
      const extracted: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          extracted.push({
            value: child.props.value !== undefined ? child.props.value : child.props.children,
            label: child.props.children || child.props.value || '',
          });
        }
      });
      return extracted;
    }, [options, children]);

    // Find currently selected option
    const currentOption = useMemo(() => {
      if (value !== undefined) {
        return parsedOptions.find((o) => String(o.value) === String(value));
      }
      return parsedOptions[0];
    }, [value, parsedOptions]);

    const displayLabel = currentOption ? currentOption.label : placeholder;

    // Click outside listener
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          !containerRef.current?.contains(target) &&
          !menuRef.current?.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    useLayoutEffect(() => {
      if (!isOpen || !triggerRef.current) return;

      const updateMenuPosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const gap = 6;
        const viewportPadding = 8;
        const spaceAbove = rect.top - viewportPadding - gap;
        const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
        const estimatedHeight = Math.min(240, parsedOptions.length * 44 + 12);
        const placement = menuPlacement === 'auto'
          ? (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top')
          : menuPlacement;
        const availableSpace = placement === 'bottom' ? spaceBelow : spaceAbove;
        const maxHeight = Math.max(80, Math.min(240, availableSpace));

        setMenuPosition({
          left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - rect.width - viewportPadding)),
          width: rect.width,
          maxHeight,
          placement,
          ...(placement === 'bottom'
            ? { top: rect.bottom + gap }
            : { bottom: window.innerHeight - rect.top + gap }),
        });
      };

      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true);
      return () => {
        window.removeEventListener('resize', updateMenuPosition);
        window.removeEventListener('scroll', updateMenuPosition, true);
      };
    }, [isOpen, menuPlacement, parsedOptions.length]);

    const handleSelect = (optValue: string | number) => {
      if (onChange) {
        onChange({
          target: {
            value: String(optValue),
            name,
          },
        });
      }
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className="relative w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] pl-1">
            {label}
          </label>
        )}

        {/* Custom Soft UI Trigger Button */}
        <div
          ref={setTriggerRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full neu-input text-xs sm:text-sm px-4 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer border border-[var(--border-subtle)] transition-all select-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-500/40'
          } ${isOpen ? 'ring-2 ring-red-500/20 border-red-500/40' : ''} ${
            error ? 'border-rose-400 focus:border-rose-500' : ''
          } ${className}`}
        >
          <span className="font-semibold truncate text-[var(--text-primary)]">
            {displayLabel}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-red-500 shrink-0 transition-transform duration-200 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {error && <p className="text-xs text-rose-500 font-semibold pl-1">{error}</p>}

        {/* Floating Custom Soft UI Dropdown Menu */}
        {isOpen && menuPosition && createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
              ...(menuPosition.top !== undefined
                ? { top: menuPosition.top }
                : { bottom: menuPosition.bottom }),
            }}
            className={`z-[60] overflow-y-auto overscroll-contain rounded-2xl neu-raised border border-[var(--border-subtle)] bg-[var(--bg-color)]/95 p-1.5 shadow-2xl backdrop-blur-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150 ${
              menuPosition.placement === 'top' ? 'origin-bottom' : 'origin-top'
            }`}
          >
            {parsedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between text-left cursor-pointer ${
                    isSelected
                      ? 'bg-red-500/15 text-red-500 border border-red-500/20 font-bold shadow-sm'
                      : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-red-500'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-red-500 shrink-0 ml-2" />}
                </div>
              );
            })}
          </div>,
          document.body
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
