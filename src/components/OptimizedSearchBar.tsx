import React, { useCallback, useEffect, useRef, useState } from 'react';

type OptimizedSearchBarProps = {
  onSearchChange: (query: string) => void;
  onToggleList?: () => void;
  onEnterPress?: () => void;
  isMobile?: boolean;
  placeholder?: string;
  className?: string;
};

const OptimizedSearchBar = React.memo(({
  onSearchChange,
  onToggleList,
  onEnterPress,
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
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Call onEnterPress if provided (for immediate map zoom)
      if (onEnterPress) {
        onEnterPress();
      }
      
      // Mobile specific: toggle list and blur input
      if (isMobile && onToggleList) {
        onToggleList();
        inputRef.current?.blur(); // Hide keyboard
      }
    }
  }, [isMobile, onToggleList, onEnterPress]);

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
    <div className={`bg-[#011B2E] rounded-lg shadow-xl border-2 border-[#27131D] p-2 ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full px-3 py-2 border-2 border-[#50394D] rounded-lg bg-[#002C4D] text-[#EBEDEE] placeholder-[#7F8B95] text-sm focus:outline-none focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:shadow-[0_0_15px_rgba(105,240,253,0.4)] transition-all duration-200"
          aria-label="Search tennis courts"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFC3C7] hover:text-[#69F0FD] hover:bg-[#27131D] rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200"
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}

      </div>
    </div>
  );
});

OptimizedSearchBar.displayName = 'OptimizedSearchBar';

export default OptimizedSearchBar;
