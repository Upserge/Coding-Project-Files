import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { MapRegion } from '@/src/types/map';
import type { Property } from '@/src/types';
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
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation
        showsMyLocationButton
      >
        {markers.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            pinColor={pinColorForRating(p.avgOverall)}
            onPress={() => onSelectProperty(p)}
            opacity={selectedId && selectedId !== p.id ? 0.7 : 1}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});
