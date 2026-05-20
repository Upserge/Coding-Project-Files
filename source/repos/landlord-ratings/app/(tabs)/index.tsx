import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import type { MapRegion } from '@/src/types/map';
import { MapSelectionBar } from '@/src/components/MapSelectionBar';
import { PropertyBottomSheet } from '@/src/components/PropertyBottomSheet';
import { PropertyMap } from '@/src/components/PropertyMap';
import { usePropertiesNearby } from '@/src/hooks/usePropertiesNearby';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Property } from '@/src/types';

const DEFAULT_REGION: MapRegion = {
  latitude: 41.8781,
  longitude: -87.6298,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [selected, setSelected] = useState<Property | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [coords, setCoords] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });

  const openSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(0);
    setIsSheetOpen(true);
  }, []);

  const dismissSelection = useCallback(() => {
    setSelected(null);
    setIsSheetOpen(false);
    sheetRef.current?.close();
  }, []);

  const handleSheetIndexChange = useCallback((index: number) => {
    setIsSheetOpen(index >= 0);
  }, []);

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

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

  const { data: properties = [], isLoading, isFetching } = usePropertiesNearby(
    coords.latitude,
    coords.longitude,
  );

  // Keep selection in sync when property list refreshes (e.g. after a new review).
  useEffect(() => {
    if (!selected) return;
    const updated = properties.find((p) => p.id === selected.id);
    if (!updated) {
      dismissSelection();
      return;
    }
    if (updated !== selected) setSelected(updated);
  }, [properties, selected, dismissSelection]);

  const handleSelect = useCallback(
    (property: Property) => {
      setSelected(property);
      openSheet();
    },
    [openSheet],
  );

  const showSelectionBar = selected != null && !isSheetOpen;

  return (
    <View style={styles.container}>
      {(isLoading || isFetching) && properties.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}
      <PropertyMap
        properties={properties}
        region={region}
        onRegionChange={setRegion}
        onSelectProperty={handleSelect}
        selectedId={selected?.id}
      />
      {showSelectionBar ? (
        <MapSelectionBar
          property={selected}
          onReopen={openSheet}
          onDismiss={dismissSelection}
        />
      ) : null}
      <PropertyBottomSheet
        ref={sheetRef}
        property={selected}
        onSheetIndexChange={handleSheetIndexChange}
        onSheetClose={handleSheetClose}
        onWriteReview={() =>
          router.push({ pathname: '/review/new', params: { propertyId: selected?.id } })
        }
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
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
