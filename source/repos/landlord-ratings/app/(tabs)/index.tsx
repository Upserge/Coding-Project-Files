import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { MapRegion } from '@/src/types/map';
import { PropertyBottomSheet } from '@/src/components/PropertyBottomSheet';
import { PropertyMap } from '@/src/components/PropertyMap';
import { getPropertiesNearby } from '@/src/services/properties';
import type { Property } from '@/src/types';

const DEFAULT_REGION: MapRegion = {
  latitude: 41.8781,
  longitude: -87.6298,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const router = useRouter();
  const sheetRef = useRef<BottomSheet>(null);
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [selected, setSelected] = useState<Property | null>(null);
  const [coords, setCoords] = useState({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location', 'Enable location to see properties near you.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const next = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
      setCoords({ latitude: next.latitude, longitude: next.longitude });
      setRegion(next);
    })();
  }, []);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', 'nearby', coords.latitude, coords.longitude],
    queryFn: () => getPropertiesNearby(coords.latitude, coords.longitude, 15),
  });

  const handleSelect = useCallback((property: Property) => {
    setSelected(property);
    sheetRef.current?.snapToIndex(0);
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : (
        <PropertyMap
          properties={properties}
          region={region}
          onRegionChange={setRegion}
          onSelectProperty={handleSelect}
          selectedId={selected?.id}
        />
      )}
      <PropertyBottomSheet
        ref={sheetRef}
        property={selected}
        onWriteReview={() => router.push({ pathname: '/review/new', params: { propertyId: selected?.id } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
