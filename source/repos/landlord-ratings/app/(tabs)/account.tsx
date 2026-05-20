import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseEnv } from '@/src/config/env';
import { ReviewCard } from '@/src/components/ReviewCard';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { NotificationSettings } from '@/src/components/settings/NotificationSettings';
import { ThemePicker } from '@/src/components/settings/ThemePicker';
import { VerificationUpload } from '@/src/components/settings/VerificationUpload';
import { deleteReview, getReviewsByUser } from '@/src/services/reviews';
import type { Review } from '@/src/types';
import { useTheme } from '@/src/theme/ThemeContext';
import {
  removePropertyFromNearbyCaches,
  removeReviewFromCache,
  syncPropertyStatsFromReviews,
} from '@/src/utils/propertyCache';

export default function AccountScreen() {
  const { user, logOut, isConfigured } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.uid],
    queryFn: () => getReviewsByUser(user!.uid),
    enabled: Boolean(user?.uid),
  });

  const deleteMutation = useMutation({
    mutationFn: async (review: Review) => {
      await deleteReview(review.id);
      return review;
    },
    onSuccess: async (review) => {
      removeReviewFromCache(queryClient, review.propertyId, review.id);
      const property = await syncPropertyStatsFromReviews(queryClient, review.propertyId);
      if (property?.reviewCount === 0) {
        removePropertyFromNearbyCaches(queryClient, review.propertyId);
      }
      await queryClient.invalidateQueries({ queryKey: ['my-reviews', user?.uid] });
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      await queryClient.invalidateQueries({ queryKey: ['properties', 'nearby'] });
    },
  });

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>RentScore</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Sign in to manage reviews, saved listings, and appearance.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Button label="Sign in" />
        </Link>
        <Link href="/(auth)/register" asChild>
          <Button label="Create account" variant="secondary" />
        </Link>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      data={reviews}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <Card style={[styles.header, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {user.displayName ?? 'Renter'}
            </Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user.email}</Text>
            {!isConfigured ? (
              <Text style={[styles.demo, { color: theme.colors.ratingMid }]}>
                Demo mode — add Firebase keys to .env and restart Expo.
              </Text>
            ) : (
              <Text style={[styles.connected, { color: theme.colors.primary }]}>
                Firebase: {firebaseEnv.projectId}
              </Text>
            )}
          </Card>

          <ThemePicker />

          <NotificationSettings />

          <VerificationUpload />

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>My reviews</Text>
        </>
      }
      ListEmptyComponent={
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          You have not written any reviews yet.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.reviewWrap}>
          <ReviewCard review={item} showPropertyLink />
          <Pressable
            onPress={() =>
              Alert.alert('Delete review?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteMutation.mutate(item),
                },
              ])
            }
          >
            <Text style={[styles.delete, { color: theme.colors.danger }]}>Delete review</Text>
          </Pressable>
        </View>
      )}
      ListFooterComponent={
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Link href="/legal/terms">
            <Text style={[styles.legal, { color: theme.colors.accent }]}>Terms of Service</Text>
          </Link>
          <Link href="/legal/privacy">
            <Text style={[styles.legal, { color: theme.colors.accent }]}>Privacy Policy</Text>
          </Link>
          <Pressable
            onPress={async () => {
              await logOut();
              router.replace('/(auth)/login');
            }}
          >
            <Text style={[styles.logout, { color: theme.colors.danger }]}>Sign out</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  header: { padding: 20, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800' },
  email: { marginTop: 4, fontSize: 14 },
  demo: { marginTop: 10, fontSize: 12 },
  connected: { marginTop: 10, fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontWeight: '700', fontSize: 17, marginBottom: 10 },
  list: { padding: 16, paddingBottom: 40 },
  reviewWrap: { marginBottom: 16, gap: 8 },
  delete: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  hint: { textAlign: 'center', paddingVertical: 16 },
  footer: { paddingTop: 24, gap: 12, borderTopWidth: 1, marginTop: 8 },
  legal: { fontSize: 15 },
  logout: { fontWeight: '700', marginTop: 8, fontSize: 15 },
});
