import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Review } from '@/src/types';
import { RatingBadge } from '@/src/components/RatingBadge';
import { StarRating } from '@/src/components/StarRating';

interface ReviewCardProps {
  review: Review;
  showPropertyLink?: boolean;
  propertyAddress?: string;
}

export function ReviewCard({ review, showPropertyLink, propertyAddress }: ReviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.author}>{review.userDisplayName}</Text>
          <Text style={styles.meta}>
            {review.isCurrent ? 'Current resident' : `Lived ${review.moveIn} – ${review.moveOut ?? 'present'}`}
          </Text>
        </View>
        <RatingBadge value={review.overall} />
      </View>

      <StarRating value={review.overall} size={16} />

      <Text style={styles.body}>{review.body}</Text>

      {review.tags.length > 0 ? (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}

      {showPropertyLink && propertyAddress ? (
        <Link href={`/property/${review.propertyId}`} asChild>
          <Pressable>
            <Text style={styles.link}>{propertyAddress}</Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  author: { fontWeight: '700', fontSize: 15, color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20, color: '#374151' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { fontSize: 12, color: '#0f766e', fontWeight: '600' },
  link: { fontSize: 13, color: '#2563eb', marginTop: 4 },
});
