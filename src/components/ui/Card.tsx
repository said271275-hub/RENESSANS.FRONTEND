import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'raised' | 'raised-sm' | 'raised-lg' | 'inset';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'raised',
  className = '',
  ...props
}) => {
  const variantClass = {
    'raised': 'neu-raised p-6',
    'raised-sm': 'neu-raised-sm p-4',
    'raised-lg': 'neu-raised-lg p-8',
    'inset': 'neu-inset p-5',
  }[variant];

  return (
    <div
      className={`border border-[var(--border-subtle)] border-t-[var(--bevel-light)] border-l-[var(--bevel-light)] ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
