import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (e: any) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

const MONTH_NAMES_UZ = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

const DAY_NAMES_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  label,
  placeholder = 'Sanani tanlang...',
  className = '',
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view year and month
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Update view month when value changes
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const yStr = String(year);
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateString = `${yStr}-${mStr}-${dStr}`;

    // Emit change
    onChange({ target: { value: dateString } });
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yStr = String(today.getFullYear());
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const dStr = String(today.getDate()).padStart(2, '0');
    const dateString = `${yStr}-${mStr}-${dStr}`;

    onChange({ target: { value: dateString } });
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ target: { value: '' } });
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    // Sunday is 0 in JS, make Monday 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: viewMonth === 0 ? 11 : viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
      });
    }

    // Next month leading days to complete grid (up to 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: viewMonth === 11 ? 0 : viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Formatted display
  const displayValue = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const [y, m, d] = value.split('-').map(Number);
    const mName = MONTH_NAMES_UZ[m - 1] || '';
    return `${d}-${mName.toLowerCase()}, ${y}`;
  }, [value]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] pl-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full neu-input text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer border border-[var(--border-subtle)] transition-all select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-500/40'
        } ${isOpen ? 'ring-2 ring-red-500/20 border-red-500/40' : ''} ${className}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-red-500 shrink-0" />
          <span className={`font-semibold truncate ${displayValue ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
            {displayValue || placeholder}
          </span>
        </div>

        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-500 transition-colors"
            title="Tozalash"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold">
            {value ? value : ''}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-rose-500 font-semibold pl-1">{error}</p>}

      {/* Custom Soft UI Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 rounded-3xl neu-raised border border-[var(--border-subtle)] bg-[var(--bg-color)]/95 backdrop-blur-2xl shadow-2xl w-72 text-[var(--text-primary)] select-none animate-in fade-in zoom-in-95 duration-150">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl neu-button text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-extrabold text-sm text-[var(--text-primary)]">
              {MONTH_NAMES_UZ[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl neu-button text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAY_NAMES_UZ.map((day) => (
              <span key={day} className="text-[11px] font-bold text-[var(--text-muted)] uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              const currentStr = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
              const isSelected = value === currentStr;
              const isToday = todayStr === currentStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(item.year, item.month, item.day)}
                  className={`w-8 h-8 rounded-xl text-xs flex items-center justify-center font-bold transition-all ${
                    isSelected
                      ? '!bg-red-600 !text-white shadow-md scale-105'
                      : item.isCurrentMonth
                      ? 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-red-500'
                      : 'text-[var(--text-muted)] opacity-35 hover:opacity-70'
                  } ${isToday && !isSelected ? 'border border-red-500/40 text-red-500' : ''}`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-subtle)] text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

