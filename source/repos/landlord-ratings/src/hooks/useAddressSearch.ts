import { useEffect, useState } from 'react';
import { searchPlaces } from '@/src/services/places';
import type { PlaceSuggestion } from '@/src/types';

/** Debounced Google Places autocomplete (min 3 characters). */
export function useAddressSearch(query: string, lockedAddress?: string) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3 || query === lockedAddress) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchPlaces(query);
      if (!cancelled) {
        setSuggestions(results);
        setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, lockedAddress]);

  return { suggestions, loading };
}
