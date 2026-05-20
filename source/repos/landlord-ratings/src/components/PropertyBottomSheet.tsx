import FontAwesome from '@expo/vector-icons/FontAwesome';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { forwardRef, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Property } from '@/src/types';
import { RatingBadge } from '@/src/components/RatingBadge';
import { useTheme } from '@/src/theme/ThemeContext';

interface PropertyBottomSheetProps {
  property: Property | null;
  onWriteReview: () => void;
  /** Fires when the sheet snap index changes (-1 = dismissed). */
  onSheetIndexChange?: (index: number) => void;
  /** Fires when the sheet is fully closed (swipe down or programmatic close). */
  onSheetClose?: () => void;
}

/** Compact peek — full card tap opens property; write review is a separate action. */
const SNAP_POINTS = ['28%'];

export const PropertyBottomSheet = forwardRef<BottomSheet, PropertyBottomSheetProps>(
  function PropertyBottomSheet({ property, onWriteReview, onSheetIndexChange, onSheetClose }, ref) {
    const router = useRouter();
    const { theme } = useTheme();
    const snapPoints = useMemo(() => SNAP_POINTS, []);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={onSheetIndexChange}
        onClose={onSheetClose}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      >
        <BottomSheetView style={styles.content}>
          {property ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View details for ${property.formattedAddress}`}
                onPress={() => router.push(`/property/${property.id}`)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[styles.address, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {property.formattedAddress}
                  </Text>
                  <FontAwesome name="chevron-right" size={14} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.row}>
                  <RatingBadge value={property.avgOverall} size="lg" />
                  <Text style={[styles.count, { color: theme.colors.textSecondary }]}>
                    {property.reviewCount} review{property.reviewCount === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={[styles.cardHint, { color: theme.colors.textSecondary }]}>
                  Tap for reviews and details
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Write a review for this property"
                onPress={onWriteReview}
                style={({ pressed }) => [styles.writeReview, { opacity: pressed ? 0.7 : 1 }]}
              >
                <FontAwesome name="pencil" size={14} color={theme.colors.primary} />
                <Text style={[styles.writeReviewText, { color: theme.colors.primary }]}>
                  Write a review
                </Text>
              </Pressable>
            </>
          ) : (
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Tap a pin to explore a property
            </Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  address: { flex: 1, fontSize: 17, fontWeight: '700', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { fontSize: 14 },
  cardHint: { fontSize: 13 },
  writeReview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  writeReviewText: { fontSize: 15, fontWeight: '600' },
  hint: { textAlign: 'center', paddingVertical: 8 },
});
