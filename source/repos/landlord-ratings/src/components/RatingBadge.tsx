import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { formatRating } from '@/src/utils/ratings';

export function RatingBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const { theme } = useTheme();
  const display = formatRating(value);

  const color =
    value >= 4
      ? theme.colors.ratingHigh
      : value >= 3
        ? theme.colors.ratingMid
        : value > 0
          ? theme.colors.ratingLow
          : theme.colors.ratingNone;

  const bg =
    value >= 4
      ? `${theme.colors.ratingHigh}22`
      : value >= 3
        ? `${theme.colors.ratingMid}22`
        : value > 0
          ? `${theme.colors.ratingLow}22`
          : theme.colors.surfaceMuted;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'lg' && styles.lg]}>
      <Text style={[styles.text, { color }, size === 'lg' && styles.lgText]}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  lg: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  text: { fontWeight: '700', fontSize: 14 },
  lgText: { fontSize: 22 },
});
