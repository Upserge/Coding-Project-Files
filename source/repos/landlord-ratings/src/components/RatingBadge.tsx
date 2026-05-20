import { StyleSheet, Text, View } from 'react-native';
import { formatRating } from '@/src/utils/ratings';

export function RatingBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const display = formatRating(value);
  const bg =
    value >= 4 ? '#dcfce7' : value >= 3 ? '#fef9c3' : value > 0 ? '#fee2e2' : '#f3f4f6';
  const color =
    value >= 4 ? '#166534' : value >= 3 ? '#854d0e' : value > 0 ? '#991b1b' : '#374151';

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
