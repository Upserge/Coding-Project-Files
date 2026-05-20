import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { RatingBadge } from '@/src/components/RatingBadge';
import { useAuth } from '@/src/context/AuthContext';
import { getSavedItems, removeSavedItem } from '@/src/services/saved';

export default function SavedScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['saved', user?.uid],
    queryFn: () => getSavedItems(user!.uid),
    enabled: Boolean(user?.uid),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeSavedItem(user!.uid, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved', user?.uid] }),
  });

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Sign in to view saved properties and landlords.</Text>
        <Link href="/(auth)/login" style={styles.link}>
          Sign in
        </Link>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      ListEmptyComponent={<Text style={styles.hint}>No saved items yet. Bookmark from a property page.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Link
            href={item.type === 'property' ? `/property/${item.refId}` : `/landlord/${item.refId}`}
            style={styles.rowLink}
          >
            <View style={styles.rowText}>
              <Text style={styles.title}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.sub}>{item.subtitle}</Text> : null}
            </View>
            {item.avgOverall != null ? <RatingBadge value={item.avgOverall} /> : null}
          </Link>
          <Pressable onPress={() => removeMutation.mutate(item.id)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  hint: { textAlign: 'center', color: '#6b7280', padding: 24 },
  link: { color: '#0f766e', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowLink: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1 },
  title: { fontWeight: '600', fontSize: 15 },
  sub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  remove: { color: '#dc2626', fontSize: 13, marginLeft: 8 },
});
