import { StyleSheet, Text, View } from 'react-native';
import { RatingBadge } from '@/src/components/RatingBadge';
import { Card } from '@/src/components/ui/Card';
import { CATEGORY_LABELS } from '@/src/constants/reviewCategories';
import type { ReviewCategory } from '@/src/types';
import { useTheme } from '@/src/theme/ThemeContext';

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
  const { theme } = useTheme();
  const categories = Object.entries(categoryAverages ?? {}).filter(
    ([key]) => key !== 'overall',
  ) as [ReviewCategory, number][];

  return (
    <Card style={[styles.wrap, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
      <View style={styles.summary}>
        <RatingBadge value={avgOverall} size="lg" />
        <Text style={[styles.count, { color: theme.colors.textSecondary }]}>
          {reviewCount} review{reviewCount === 1 ? '' : 's'}
        </Text>
      </View>
      {categories.length > 0 ? (
        <View style={[styles.categories, { borderTopColor: theme.colors.border }]}>
          {categories.map(([key, val]) => (
            <View key={key} style={styles.categoryRow}>
              <Text style={[styles.categoryLabel, { color: theme.colors.text }]}>
                {CATEGORY_LABELS[key]}
              </Text>
              <RatingBadge value={val} size="sm" />
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { margin: 16, marginBottom: 8, padding: 18, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  subtitle: { fontSize: 14 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  count: { fontSize: 14 },
  categories: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryLabel: { fontSize: 13, flex: 1, paddingRight: 8 },
});
