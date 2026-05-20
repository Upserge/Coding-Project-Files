import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Review } from '@/src/types';
import { RatingBadge } from '@/src/components/RatingBadge';
import { StarRating } from '@/src/components/StarRating';
import { Card } from '@/src/components/ui/Card';
import { useTheme } from '@/src/theme/ThemeContext';

interface ReviewCardProps {
  review: Review;
  showPropertyLink?: boolean;
}

export function ReviewCard({ review, showPropertyLink }: ReviewCardProps) {
  const { theme } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.author, { color: theme.colors.text }]}>{review.userDisplayName}</Text>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            {review.isCurrent
              ? 'Current resident'
              : `Lived ${review.moveIn} – ${review.moveOut ?? 'present'}`}
          </Text>
        </View>
        <RatingBadge value={review.overall} />
      </View>

      <StarRating value={review.overall} size={16} />

      <Text style={[styles.body, { color: theme.colors.text }]}>{review.body}</Text>

      {review.tags.length > 0 ? (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tagChip, { backgroundColor: theme.colors.primarySoft }]}
            >
              <Text style={[styles.tag, { color: theme.colors.primary }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {showPropertyLink ? (
        <Link href={`/property/${review.propertyId}`} asChild>
          <Pressable>
            <Text style={[styles.link, { color: theme.colors.accent }]}>View property →</Text>
          </Pressable>
        </Link>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  author: { fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 12, marginTop: 2 },
  body: { fontSize: 14, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tag: { fontSize: 12, fontWeight: '600' },
  link: { fontSize: 13, fontWeight: '600', marginTop: 4 },
});
