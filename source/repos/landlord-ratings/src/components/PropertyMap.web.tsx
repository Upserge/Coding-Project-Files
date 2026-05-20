import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MapRegion } from '@/src/types/map';
import type { Property } from '@/src/types';
import { RatingBadge } from '@/src/components/RatingBadge';
import { pinColorForRating } from '@/src/utils/geohash';

interface PropertyMapProps {
  properties: Property[];
  region: MapRegion;
  onRegionChange?: (region: MapRegion) => void;
  onSelectProperty: (property: Property) => void;
  selectedId?: string;
}

/**
 * Web does not support react-native-maps. Show a tappable list instead.
 */
export function PropertyMap({
  properties,
  region,
  onSelectProperty,
  selectedId,
}: PropertyMapProps) {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Map view</Text>
        <Text style={styles.bannerText}>
          Interactive maps are available on iOS and Android. On web, select a property below
          (centered near {region.latitude.toFixed(2)}, {region.longitude.toFixed(2)}).
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {properties.length === 0 ? (
          <Text style={styles.empty}>No properties found nearby.</Text>
        ) : (
          properties.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.row, selectedId === p.id && styles.rowSelected]}
              onPress={() => onSelectProperty(p)}
            >
              <View
                style={[styles.dot, { backgroundColor: pinColorForRating(p.avgOverall) }]}
              />
              <View style={styles.rowText}>
                <Text style={styles.address}>{p.formattedAddress}</Text>
                <Text style={styles.meta}>
                  {p.reviewCount} review{p.reviewCount === 1 ? '' : 's'}
                </Text>
              </View>
              <RatingBadge value={p.avgOverall} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  banner: {
    backgroundColor: '#ccfbf1',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#99f6e4',
  },
  bannerTitle: { fontWeight: '700', color: '#0f766e', marginBottom: 4 },
  bannerText: { fontSize: 13, color: '#115e59', lineHeight: 18 },
  list: { padding: 12, gap: 8 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  rowSelected: { borderColor: '#0f766e', borderWidth: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowText: { flex: 1 },
  address: { fontWeight: '600', fontSize: 14, color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
