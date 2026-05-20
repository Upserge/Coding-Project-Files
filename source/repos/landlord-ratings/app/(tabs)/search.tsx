import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RatingBadge } from '@/src/components/RatingBadge';
import { searchLandlords } from '@/src/services/landlords';
import { searchProperties } from '@/src/services/properties';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState(0);

  const { data: properties = [] } = useQuery({
    queryKey: ['search', 'properties', query],
    queryFn: () => searchProperties(query),
    enabled: query.length >= 2,
  });

  const { data: landlords = [] } = useQuery({
    queryKey: ['search', 'landlords', query],
    queryFn: () => searchLandlords(query),
    enabled: query.length >= 2,
  });

  const filteredProperties = properties.filter((p) => p.avgOverall >= minRating || minRating === 0);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search address or landlord name"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Min rating:</Text>
        {[0, 3, 4].map((r) => (
          <Pressable
            key={r}
            style={[styles.chip, minRating === r && styles.chipActive]}
            onPress={() => setMinRating(r)}
          >
            <Text style={[styles.chipText, minRating === r && styles.chipTextActive]}>
              {r === 0 ? 'Any' : `${r}+`}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={[
          ...filteredProperties.map((p) => ({ type: 'property' as const, item: p })),
          ...landlords.map((l) => ({ type: 'landlord' as const, item: l })),
        ]}
        keyExtractor={(row) => `${row.type}-${row.item.id}`}
        ListHeaderComponent={
          query.length < 2 ? (
            <Text style={styles.hint}>Type at least 2 characters to search</Text>
          ) : null
        }
        ListEmptyComponent={
          query.length >= 2 ? <Text style={styles.hint}>No results found</Text> : null
        }
        renderItem={({ item: row }) =>
          row.type === 'property' ? (
            <Link href={`/property/${row.item.id}`} asChild>
              <Pressable style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.title}>{row.item.formattedAddress}</Text>
                  <Text style={styles.sub}>{row.item.reviewCount} reviews</Text>
                </View>
                <RatingBadge value={row.item.avgOverall} />
              </Pressable>
            </Link>
          ) : (
            <Link href={`/landlord/${row.item.id}`} asChild>
              <Pressable style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.title}>{row.item.name}</Text>
                  <Text style={styles.sub}>{row.item.reviewCount} reviews</Text>
                </View>
                <RatingBadge value={row.item.avgOverall} />
              </Pressable>
            </Link>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  input: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterLabel: { fontSize: 13, color: '#6b7280' },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowText: { flex: 1, paddingRight: 8 },
  title: { fontWeight: '600', fontSize: 15, color: '#111827' },
  sub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  hint: { textAlign: 'center', color: '#6b7280', marginTop: 24, paddingHorizontal: 16 },
});
