import { useEffect, useState } from 'react';

/**
 * So'rov uzoq davom etayotgan bo'lsa `true` qaytaradi.
 * @param isLoading  - so'rov davom etayotgani
 * @param delayMs    - necha ms dan keyin "sekin" deb hisoblansin (default: 8 sek)
 */
export function useSlowRequest(isLoading: boolean, delayMs = 8_000): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return;
    }
    const id = setTimeout(() => setIsSlow(true), delayMs);
    return () => clearTimeout(id);
  }, [isLoading, delayMs]);

  return isSlow;
}

