import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  value: string;
  onValueChange: (val: string) => void;
  size?: 'md' | 'lg';
  containerClassName?: string;
  rightSlot?: React.ReactNode;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      size = 'md',
      containerClassName = '',
      className = '',
      rightSlot,
      placeholder = 'Search...',
      ...rest
    },
    ref
  ) => {
    const hasRightSlot = Boolean(rightSlot) && !value;
    const heightClass = size === 'lg' ? 'h-11 text-sm' : 'h-10 text-sm';

    return (
      <div className={`relative ${containerClassName}`}>
        <Search
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 ${
            size === 'lg' ? 'h-[18px] w-[18px]' : 'h-4 w-4'
          }`}
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50/75 pl-10 ${
            hasRightSlot ? 'pr-20' : value ? 'pr-9' : 'pr-3.5'
          } ${heightClass} text-slate-900 placeholder:text-slate-400 transition-all focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-600/10 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500 dark:focus:bg-slate-900 dark:focus:ring-teal-500/15 ${className}`}
          {...rest}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onValueChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          rightSlot && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {rightSlot}
            </div>
          )
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
