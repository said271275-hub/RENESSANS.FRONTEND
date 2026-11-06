import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2.5 rounded-full neu-raised hover:scale-105 active:neu-inset transition-all duration-200 text-[var(--text-primary)] border border-[var(--border-subtle)] ${className}`}
      title={theme === 'light' ? 'Tungi rejimga o\'tish' : 'Kunduzgi rejimga o\'tish'}
      aria-label="Rejimni o'zgartirish"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-[var(--accent)]" />
      ) : (
        <Sun className="w-5 h-5 text-amber-400" />
      )}
    </button>
  );
};
