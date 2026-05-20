import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { Marker } from 'react-native-maps';
import type { RefObject } from 'react';
import type MapView from 'react-native-maps';
import type { MapRegion } from '@/src/types/map';
import type { Property } from '@/src/types';
import { useTheme } from '@/src/theme/ThemeContext';
import { pinColorForRating } from '@/src/utils/geohash';

interface PropertyMapProps {
  properties: Property[];
  region: MapRegion;
  mapRef?: RefObject<MapView | null>;
  /** Pin for an address not in the nearby list (e.g. from address search). */
  highlightProperty?: Property | null;
  onRegionChange?: (region: MapRegion) => void;
  onSelectProperty: (property: Property) => void;
  selectedId?: string;
}

export function PropertyMap({
  properties,
  region,
  mapRef,
  highlightProperty,
  onRegionChange,
  onSelectProperty,
  selectedId,
}: PropertyMapProps) {
  const { theme } = useTheme();

  const markers = useMemo(() => {
    const list = [...properties];
    if (
      highlightProperty &&
      !list.some((p) => p.id === highlightProperty.id)
    ) {
      list.push(highlightProperty);
    }
    return list.map((p) => ({
      ...p,
      lat: p.location.latitude,
      lng: p.location.longitude,
    }));
  }, [properties, highlightProperty]);

  return (
    <View style={styles.container}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
        clusterColor={theme.colors.primary}
        clusterTextColor={theme.colors.textOnPrimary}
        radius={48}
        minZoomLevel={1}
      >
        {markers.map((p) => (
          <Marker
            key={p.id}
            identifier={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            pinColor={
              p.reviewCount > 0 ? pinColorForRating(p.avgOverall) : theme.colors.ratingNone
            }
            onPress={() => onSelectProperty(p)}
            onSelect={() => onSelectProperty(p)}
            opacity={selectedId && selectedId !== p.id ? 0.7 : 1}
          />
        ))}
      </ClusteredMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});
