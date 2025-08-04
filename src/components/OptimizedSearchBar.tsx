import React, { useCallback, useEffect, useRef, useState } from 'react';

type OptimizedSearchBarProps = {
  onSearchChange: (query: string) => void;
  onToggleList?: () => void;
  isMobile?: boolean;
  placeholder?: string;
  className?: string;
};

const OptimizedSearchBar = React.memo(({
  onSearchChange,
  onToggleList,
  isMobile = false,
  placeholder = 'Search by Name, Address, or Zip Code...',
  className = '',
}: OptimizedSearchBarProps) => {
  const [localQuery, setLocalQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ultra-fast debouncing for mobile (50ms) and normal for desktop (150ms)
  const debounceDelay = isMobile ? 50 : 150;

  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearchChange(query);
    }, debounceDelay);
  }, [onSearchChange, debounceDelay]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Immediate UI update for snappy feel
    setLocalQuery(value);

    // Debounced search for API calls
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    onSearchChange('');

    // Focus input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onSearchChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isMobile && onToggleList) {
      e.preventDefault();
      onToggleList();
      inputRef.current?.blur(); // Hide keyboard
    }
  }, [isMobile, onToggleList]);

  // Optimize for mobile by preventing unnecessary re-renders
  const handleFocus = useCallback(() => {
    if (isMobile) {
      // Ensure viewport adjusts properly on mobile
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isMobile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-xl border border-gray-200 p-2 ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full px-3 py-2 border border-[#BFC3C7] rounded-lg bg-[#FFFFFF] text-[#27131D] text-sm focus:outline-none focus:ring-2 focus:ring-[#EC0037] focus:border-[#EC0037] transition-colors duration-150"
          aria-label="Search tennis courts"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F8B95] hover:text-[#27131D] p-1 transition-colors duration-150"
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
        {isMobile && !localQuery && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
            ↵
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedSearchBar.displayName = 'OptimizedSearchBar';

export default OptimizedSearchBar;
