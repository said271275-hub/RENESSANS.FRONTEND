import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = "Ma'lumotlar topilmadi",
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`neu-raised overflow-hidden border border-[var(--border-subtle)] ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-black/[0.03] dark:bg-white/[0.03]">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`py-4 px-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-4">
                      <div className="h-4 bg-[var(--shadow-dark)]/40 rounded-[8px] w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[var(--text-muted)]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-10 h-10 stroke-1 opacity-60 text-indigo-400" />
                    <p className="text-sm font-semibold">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-3.5 px-4 text-sm text-[var(--text-primary)] ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : col.accessor
                        ? (item[col.accessor] as React.ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-black/[0.015] dark:bg-white/[0.015]">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Sahifa <span className="font-extrabold text-[var(--text-primary)]">{currentPage}</span> / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Oldingi
            </Button>
            <Button
              size="sm"
              variant="default"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Keyingi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
