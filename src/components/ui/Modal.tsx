import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto overscroll-contain ${maxWidthClass} neu-raised-lg border border-[var(--border-subtle)] p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{title}</h3>
            {description && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{description}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={onClose}
            className="!p-2 rounded-full shrink-0 shadow-[var(--shadow-raised-sm)]"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
