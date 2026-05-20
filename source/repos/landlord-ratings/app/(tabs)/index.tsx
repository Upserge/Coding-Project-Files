import FontAwesome from '@expo/vector-icons/FontAwesome';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import type { MapRegion } from '@/src/types/map';
import { ExploreSearchPanel } from '@/src/components/explore/ExploreSearchPanel';
import { LocateMeButton } from '@/src/components/explore/LocateMeButton';
import { NoReviewsCard } from '@/src/components/explore/NoReviewsCard';
import { MapSelectionBar } from '@/src/components/MapSelectionBar';
import { PropertyBottomSheet } from '@/src/components/PropertyBottomSheet';
import { PropertyMap } from '@/src/components/PropertyMap';
import { usePropertiesNearby } from '@/src/hooks/usePropertiesNearby';
import { lookupAddressByPlaceId } from '@/src/services/addressLookup';
import { useTheme } from '@/src/theme/ThemeContext';
import type { PlaceSuggestion, Property } from '@/src/types';

const DEFAULT_REGION: MapRegion = {
  latitude: 41.8781,
  longitude: -87.6298,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const SEARCH_REGION_DELTA = 0.025;
const NEARBY_REGION_DELTA = 0.06;

export default function MapScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [noReviewAddress, setNoReviewAddress] = useState<string | null>(null);
  const [noReviewPlaceId, setNoReviewPlaceId] = useState<string | null>(null);
  const [highlightProperty, setHighlightProperty] = useState<Property | null>(null);
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [selected, setSelected] = useState<Property | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [coords, setCoords] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [locating, setLocating] = useState(false);

  const openSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(0);
    setIsSheetOpen(true);
  }, []);

  const dismissSelection = useCallback(() => {
    setSelected(null);
    setHighlightProperty(null);
    setIsSheetOpen(false);
    setNoReviewAddress(null);
    setNoReviewPlaceId(null);
    sheetRef.current?.close();
  }, []);

  const handleSheetIndexChange = useCallback((index: number) => {
    setIsSheetOpen(index >= 0);
  }, []);

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const panToProperty = useCallback((property: Property) => {
    const next: MapRegion = {
      latitude: property.location.latitude,
      longitude: property.location.longitude,
      latitudeDelta: SEARCH_REGION_DELTA,
      longitudeDelta: SEARCH_REGION_DELTA,
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 450);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        searchExpanded ? null : (
          <Pressable
            onPress={() => setSearchExpanded(true)}
            style={styles.headerBtn}
            accessibilityLabel="Search addresses"
            hitSlop={12}
          >
            <FontAwesome name="search" size={20} color={theme.colors.textOnPrimary} />
          </Pressable>
        ),
    });
  }, [navigation, searchExpanded, theme.colors.textOnPrimary]);

  const centerOnUser = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location', 'Enable location to see properties near you.');
      return;
    }

    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const next: MapRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: NEARBY_REGION_DELTA,
        longitudeDelta: NEARBY_REGION_DELTA,
      };
      setCoords({ latitude: next.latitude, longitude: next.longitude });
      setRegion(next);
      mapRef.current?.animateToRegion(next, 450);
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    centerOnUser();
  }, [centerOnUser]);

  const { data: properties = [], isLoading, isFetching } = usePropertiesNearby(
    coords.latitude,
    coords.longitude,
  );

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
      setNoReviewAddress(null);
      setNoReviewPlaceId(null);
      setSelected(property);
      setHighlightProperty(property);
      openSheet();
    },
    [openSheet],
  );

  const handleSearchPlace = useCallback(
    async (suggestion: PlaceSuggestion) => {
      setResolvingPlace(true);
      setNoReviewAddress(null);
      setNoReviewPlaceId(null);
      setSearchExpanded(false);

      try {
        const result = await lookupAddressByPlaceId(suggestion.placeId);
        if (result.kind === 'error') {
          Alert.alert('Address lookup', result.message);
          return;
        }

        if (result.kind === 'has_reviews') {
          setHighlightProperty(result.property);
          setSelected(result.property);
          panToProperty(result.property);
          openSheet();
          return;
        }

        const target = result.property;
        if (target) {
          setHighlightProperty(target);
          panToProperty(target);
        } else {
          setHighlightProperty(null);
          const next: MapRegion = {
            latitude: result.place.latitude,
            longitude: result.place.longitude,
            latitudeDelta: SEARCH_REGION_DELTA,
            longitudeDelta: SEARCH_REGION_DELTA,
          };
          setRegion(next);
          mapRef.current?.animateToRegion(next, 450);
        }

        setNoReviewAddress(result.place.formattedAddress);
        setNoReviewPlaceId(result.place.placeId);
        setSelected(null);
        setIsSheetOpen(false);
        sheetRef.current?.close();
      } finally {
        setResolvingPlace(false);
      }
    },
    [dismissSelection, openSheet, panToProperty],
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
        mapRef={mapRef}
        properties={properties}
        highlightProperty={highlightProperty}
        region={region}
        onRegionChange={setRegion}
        onSelectProperty={handleSelect}
        selectedId={selected?.id}
      />
      <ExploreSearchPanel
        expanded={searchExpanded}
        onCollapse={() => setSearchExpanded(false)}
        onSelectPlace={handleSearchPlace}
        resolving={resolvingPlace}
      />
      {noReviewAddress ? (
        <NoReviewsCard
          address={noReviewAddress}
          onDismiss={() => {
            setNoReviewAddress(null);
            setNoReviewPlaceId(null);
            setHighlightProperty(null);
          }}
          onWriteReview={() => {
            const params: Record<string, string> = {
              prefilledAddress: noReviewAddress,
            };
            if (noReviewPlaceId) params.placeId = noReviewPlaceId;
            if (highlightProperty?.id) params.propertyId = highlightProperty.id;
            router.push({ pathname: '/review/new', params });
          }}
        />
      ) : null}
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
      <LocateMeButton onPress={centerOnUser} loading={locating} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { marginRight: 16, padding: 4 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
