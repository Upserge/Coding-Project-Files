import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RatingBadge } from '@/src/components/RatingBadge';
import { Card } from '@/src/components/ui/Card';
import { SUGGESTED_TAGS } from '@/src/constants/reviewCategories';
import { searchAll } from '@/src/services/search';
import { useTheme } from '@/src/theme/ThemeContext';

export default function SearchScreen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [tag, setTag] = useState<string | undefined>();

  const { data, isFetching } = useQuery({
    queryKey: ['search', query, minRating, tag],
    queryFn: () => searchAll({ term: query, minRating, tag }),
    enabled: query.length >= 2 || Boolean(tag),
  });

  const rows = [
    ...(data?.properties ?? []).map((p) => ({ type: 'property' as const, item: p })),
    ...(data?.landlords ?? []).map((l) => ({ type: 'landlord' as const, item: l })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchHeader, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          placeholder="Address, city, or landlord name"
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />

        <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Min rating</Text>
        <View style={styles.chips}>
          {[0, 3, 4].map((r) => (
            <Pressable
              key={r}
              style={[
                styles.chip,
                {
                  backgroundColor: minRating === r ? theme.colors.primary : theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setMinRating(r)}
            >
              <Text
                style={{
                  color: minRating === r ? theme.colors.textOnPrimary : theme.colors.text,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {r === 0 ? 'Any' : `${r}+`}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Tags</Text>
        <View style={styles.chips}>
          <Pressable
            style={[
              styles.chip,
              {
                backgroundColor: !tag ? theme.colors.primary : theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setTag(undefined)}
          >
            <Text style={{ color: !tag ? theme.colors.textOnPrimary : theme.colors.text, fontSize: 13 }}>
              All
            </Text>
          </Pressable>
          {SUGGESTED_TAGS.slice(0, 6).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.chip,
                {
                  backgroundColor: tag === t ? theme.colors.primary : theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setTag(tag === t ? undefined : t)}
            >
              <Text
                style={{
                  color: tag === t ? theme.colors.textOnPrimary : theme.colors.text,
                  fontSize: 13,
                }}
              >
                #{t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => `${row.type}-${row.item.id}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          query.length < 2 && !tag ? (
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Search by address or landlord, or tap a tag to browse reviews.
            </Text>
          ) : isFetching ? (
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>Searching…</Text>
          ) : null
        }
        ListEmptyComponent={
          query.length >= 2 || tag ? (
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>No results found</Text>
          ) : null
        }
        renderItem={({ item: row }) =>
          row.type === 'property' ? (
            <Link href={`/property/${row.item.id}`} asChild>
              <Pressable>
                <Card style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                      {row.item.formattedAddress}
                    </Text>
                    <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
                      {row.item.reviewCount} reviews
                    </Text>
                  </View>
                  <RatingBadge value={row.item.avgOverall} />
                </Card>
              </Pressable>
            </Link>
          ) : (
            <Link href={`/landlord/${row.item.id}`} asChild>
              <Pressable>
                <Card style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{row.item.name}</Text>
                    <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
                      {row.item.reviewCount} reviews
                    </Text>
                  </View>
                  <RatingBadge value={row.item.avgOverall} />
                </Card>
              </Pressable>
            </Link>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: {
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  input: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    fontSize: 16,
  },
  filterLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
  },
  rowText: { flex: 1, paddingRight: 8 },
  title: { fontWeight: '600', fontSize: 15 },
  sub: { fontSize: 12, marginTop: 2 },
  hint: { textAlign: 'center', marginTop: 24, paddingHorizontal: 16 },
});
