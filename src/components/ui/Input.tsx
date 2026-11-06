import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] pl-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full neu-input text-sm font-medium ${icon ? 'pl-11' : 'pl-4'} ${rightElement ? 'pr-11' : 'pr-4'} ${
              error ? 'border-red-400 focus:border-red-500' : ''
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center text-[var(--text-secondary)]">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
