import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Link } from 'expo-router';
import { forwardRef, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Property } from '@/src/types';
import { RatingBadge } from '@/src/components/RatingBadge';

interface PropertyBottomSheetProps {
  property: Property | null;
  onWriteReview: () => void;
}

export const PropertyBottomSheet = forwardRef<BottomSheet, PropertyBottomSheetProps>(
  function PropertyBottomSheet({ property, onWriteReview }, ref) {
    const snapPoints = useMemo(() => ['22%', '45%'], []);

    return (
      <BottomSheet ref={ref} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView style={styles.content}>
          {property ? (
            <>
              <Text style={styles.address}>{property.formattedAddress}</Text>
              <View style={styles.row}>
                <RatingBadge value={property.avgOverall} size="lg" />
                <Text style={styles.count}>
                  {property.reviewCount} review{property.reviewCount === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.actions}>
                <Link href={`/property/${property.id}`} asChild>
                  <Pressable style={styles.primaryBtn}>
                    <Text style={styles.primaryText}>View details</Text>
                  </Pressable>
                </Link>
                <Pressable style={styles.secondaryBtn} onPress={onWriteReview}>
                  <Text style={styles.secondaryText}>Write review</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.hint}>Tap a pin to see property details</Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20, gap: 12 },
  address: { fontSize: 17, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { fontSize: 14, color: '#6b7280' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#0f766e', fontWeight: '700' },
  hint: { color: '#6b7280', textAlign: 'center' },
});
