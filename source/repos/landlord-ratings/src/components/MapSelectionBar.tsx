import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RatingBadge } from '@/src/components/RatingBadge';
import { useTheme } from '@/src/theme/ThemeContext';
import type { Property } from '@/src/types';

interface MapSelectionBarProps {
  property: Property;
  onReopen: () => void;
  onDismiss: () => void;
}

/** Shown when a pin is selected but the bottom sheet is dismissed. */
export function MapSelectionBar({ property, onReopen, onDismiss }: MapSelectionBarProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Reopen details for ${property.formattedAddress}`}
        onPress={onReopen}
        style={({ pressed }) => [
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        <View style={styles.main}>
          <RatingBadge value={property.avgOverall} size="sm" />
          <Text style={[styles.address, { color: theme.colors.text }]} numberOfLines={1}>
            {property.formattedAddress}
          </Text>
          <FontAwesome name="chevron-up" size={14} color={theme.colors.primary} />
        </View>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          Tap to open preview
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Clear map selection"
        onPress={onDismiss}
        hitSlop={12}
        style={({ pressed }) => [
          styles.closeBtn,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <FontAwesome name="times" size={16} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 3,
  },
  bar: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  address: { flex: 1, fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
