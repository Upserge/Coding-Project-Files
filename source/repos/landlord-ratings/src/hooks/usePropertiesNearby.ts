import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { getPropertiesNearby } from '@/src/services/properties';
import { enrichPropertiesForMap } from '@/src/utils/propertyCache';

/** How long cached map data is considered fresh before a background refetch. */
export const MAP_PROPERTIES_STALE_MS = 30_000;

/**
 * Nearby properties for the map tab.
 *
 * Pins are derived from published reviews, not Firestore property aggregates
 * (which can stay stale after deletes when Cloud Functions are not deployed).
 *
 * Refetch triggers: mount, tab focus, window focus, invalidation after review changes.
 */
export function usePropertiesNearby(latitude: number, longitude: number, radiusKm = 15) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['properties', 'nearby', latitude, longitude],
    queryFn: async () => {
      const candidates = await getPropertiesNearby(latitude, longitude, radiusKm);
      return enrichPropertiesForMap(candidates, queryClient);
    },
    staleTime: MAP_PROPERTIES_STALE_MS,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: ['properties', 'nearby', latitude, longitude],
      });
    }, [queryClient, latitude, longitude]),
  );

  return query;
}
