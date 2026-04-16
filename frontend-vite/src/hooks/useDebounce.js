import { useEffect, useState } from 'react';

/**
 * Повертає значення зі затримкою — зручно для пошукових полів.
 * Використання: const debouncedSearch = useDebounce(searchInput, 300);
 */
export function useDebounce(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
