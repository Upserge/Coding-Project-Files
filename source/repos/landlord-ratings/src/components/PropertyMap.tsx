import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { Marker } from 'react-native-maps';
import type { MapRegion } from '@/src/types/map';
import type { Property } from '@/src/types';
import { useTheme } from '@/src/theme/ThemeContext';
import { pinColorForRating } from '@/src/utils/geohash';

interface PropertyMapProps {
  properties: Property[];
  region: MapRegion;
  onRegionChange?: (region: MapRegion) => void;
  onSelectProperty: (property: Property) => void;
  selectedId?: string;
}

export function PropertyMap({
  properties,
  region,
  onRegionChange,
  onSelectProperty,
  selectedId,
}: PropertyMapProps) {
  const { theme } = useTheme();

  const markers = useMemo(
    () =>
      properties.map((p) => ({
        ...p,
        lat: p.location.latitude,
        lng: p.location.longitude,
      })),
    [properties],
  );

  return (
    <View style={styles.container}>
      <ClusteredMapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation
        showsMyLocationButton
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
            pinColor={pinColorForRating(p.avgOverall)}
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
