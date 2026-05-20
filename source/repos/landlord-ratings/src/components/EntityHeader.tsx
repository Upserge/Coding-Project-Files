import { StyleSheet, Text, View } from 'react-native';
import { RatingBadge } from '@/src/components/RatingBadge';
import { CATEGORY_LABELS } from '@/src/constants/reviewCategories';
import type { ReviewCategory } from '@/src/types';

interface EntityHeaderProps {
  title: string;
  subtitle?: string;
  avgOverall: number;
  reviewCount: number;
  categoryAverages?: Partial<Record<ReviewCategory, number>>;
}

export function EntityHeader({
  title,
  subtitle,
  avgOverall,
  reviewCount,
  categoryAverages,
}: EntityHeaderProps) {
  const categories = Object.entries(categoryAverages ?? {}).filter(
    ([key]) => key !== 'overall',
  ) as [ReviewCategory, number][];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.summary}>
        <RatingBadge value={avgOverall} size="lg" />
        <Text style={styles.count}>
          {reviewCount} review{reviewCount === 1 ? '' : 's'}
        </Text>
      </View>
      {categories.length > 0 ? (
        <View style={styles.categories}>
          {categories.map(([key, val]) => (
            <View key={key} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{CATEGORY_LABELS[key]}</Text>
              <RatingBadge value={val} size="sm" />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  count: { fontSize: 14, color: '#6b7280' },
  categories: { marginTop: 12, gap: 8 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryLabel: { fontSize: 13, color: '#374151', flex: 1, paddingRight: 8 },
});
