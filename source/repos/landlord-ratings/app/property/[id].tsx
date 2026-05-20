import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HeaderBackButton } from '@/src/components/navigation/HeaderBackButton';
import { EntityHeader } from '@/src/components/EntityHeader';
import { ReportModal } from '@/src/components/ReportModal';
import { ReviewCard } from '@/src/components/ReviewCard';
import { useAuth } from '@/src/context/AuthContext';
import { getLandlord } from '@/src/services/landlords';
import { getProperty } from '@/src/services/properties';
import { getReviewsForProperty } from '@/src/services/reviews';
import { isItemSaved, saveItem } from '@/src/services/saved';
import { syncPropertyStatsFromReviews } from '@/src/utils/propertyCache';
import type { ReviewSort } from '@/src/utils/ratings';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [reportVisible, setReportVisible] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getProperty(id!),
    enabled: Boolean(id),
  });

  const { data: landlord } = useQuery({
    queryKey: ['landlord', property?.landlordId],
    queryFn: () => getLandlord(property!.landlordId!),
    enabled: Boolean(property?.landlordId),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', 'property', id, sort],
    queryFn: () => getReviewsForProperty(id!, sort),
    enabled: Boolean(id),
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void syncPropertyStatsFromReviews(queryClient, id);
    }, [id, queryClient]),
  );

  const { data: saved = false } = useQuery({
    queryKey: ['saved', user?.uid, 'property', id],
    queryFn: () => isItemSaved(user!.uid, 'property', id!),
    enabled: Boolean(user?.uid && id),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveItem(user!.uid, {
        type: 'property',
        refId: id!,
        title: property!.formattedAddress,
        subtitle: landlord?.name,
        avgOverall: property!.avgOverall,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['saved', user?.uid, 'property', id] }),
  });

  if (isLoading || !property) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Property',
          headerBackTitle: 'Back',
          headerLeft: () => <HeaderBackButton />,
          headerRight: () => (
            <Pressable onPress={() => setReportVisible(true)}>
              <Text style={styles.report}>Report</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <>
            <EntityHeader
              title={property.formattedAddress}
              subtitle={landlord ? `Managed by ${landlord.name}` : undefined}
              avgOverall={property.avgOverall}
              reviewCount={property.reviewCount}
              categoryAverages={property.categoryAverages}
            />
            {landlord ? (
              <Pressable
                style={styles.landlordLink}
                onPress={() => router.push(`/landlord/${landlord.id}`)}
              >
                <Text style={styles.landlordLinkText}>View landlord profile →</Text>
              </Pressable>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() =>
                  router.push({ pathname: '/review/new', params: { propertyId: property.id } })
                }
              >
                <Text style={styles.primaryText}>Write review</Text>
              </Pressable>
              {user ? (
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => saveMutation.mutate()}
                  disabled={saved}
                >
                  <Text style={styles.secondaryText}>{saved ? 'Saved' : 'Save'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.sortRow}>
              {(['newest', 'highest', 'lowest'] as ReviewSort[]).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.sortChip, sort === s && styles.sortChipActive]}
                  onPress={() => setSort(s)}
                >
                  <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.section}>Reviews</Text>
          </>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No reviews yet. Be the first!</Text>}
      />
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        targetType="property"
        targetId={property.id}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  report: { color: '#fff', marginRight: 8 },
  landlordLink: { paddingHorizontal: 16, paddingBottom: 8 },
  landlordLinkText: { color: '#2563eb', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 0 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f766e',
  },
  secondaryText: { color: '#0f766e', fontWeight: '700' },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  sortChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sortChipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  sortText: { fontSize: 12, color: '#374151' },
  sortTextActive: { color: '#fff' },
  section: { fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12, backgroundColor: '#f9fafb' },
  empty: { color: '#6b7280', textAlign: 'center', padding: 24 },
});
