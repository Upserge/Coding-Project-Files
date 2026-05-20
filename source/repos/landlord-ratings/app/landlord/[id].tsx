import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EntityHeader } from '@/src/components/EntityHeader';
import { ReportModal } from '@/src/components/ReportModal';
import { ReviewCard } from '@/src/components/ReviewCard';
import { useAuth } from '@/src/context/AuthContext';
import { getLandlord } from '@/src/services/landlords';
import { getProperty } from '@/src/services/properties';
import { getReviewsForLandlord } from '@/src/services/reviews';
import { isItemSaved, saveItem } from '@/src/services/saved';
import type { ReviewSort } from '@/src/utils/ratings';

export default function LandlordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [reportVisible, setReportVisible] = useState(false);

  const { data: landlord, isLoading } = useQuery({
    queryKey: ['landlord', id],
    queryFn: () => getLandlord(id!),
    enabled: Boolean(id),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', 'landlord', id, sort],
    queryFn: () => getReviewsForLandlord(id!, sort),
    enabled: Boolean(id),
  });

  const { data: saved = false } = useQuery({
    queryKey: ['saved', user?.uid, 'landlord', id],
    queryFn: () => isItemSaved(user!.uid, 'landlord', id!),
    enabled: Boolean(user?.uid && id),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveItem(user!.uid, {
        type: 'landlord',
        refId: id!,
        title: landlord!.name,
        subtitle: landlord!.type.replace('_', ' '),
        avgOverall: landlord!.avgOverall,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['saved', user?.uid, 'landlord', id] }),
  });

  if (isLoading || !landlord) {
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
              title={landlord.name}
              subtitle={landlord.type.replace('_', ' ')}
              avgOverall={landlord.avgOverall}
              reviewCount={landlord.reviewCount}
            />
            {user ? (
              <Pressable
                style={styles.saveBtn}
                onPress={() => saveMutation.mutate()}
                disabled={saved}
              >
                <Text style={styles.saveText}>{saved ? 'Saved' : 'Save landlord'}</Text>
              </Pressable>
            ) : null}
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
            <Text style={styles.section}>Reviews across properties</Text>
          </>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ReviewCard review={item} showPropertyLink />}
        ListEmptyComponent={<Text style={styles.empty}>No reviews yet.</Text>}
      />
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        targetType="landlord"
        targetId={landlord.id}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  report: { color: '#fff', marginRight: 8 },
  saveBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: { color: '#0f766e', fontWeight: '700' },
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
