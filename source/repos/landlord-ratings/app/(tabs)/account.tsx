import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { firebaseEnv } from '@/src/config/env';
import { getReviewsByUser } from '@/src/services/reviews';
import { ReviewCard } from '@/src/components/ReviewCard';

export default function AccountScreen() {
  const { user, logOut, isConfigured } = useAuth();
  const router = useRouter();

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.uid],
    queryFn: () => getReviewsByUser(user!.uid),
    enabled: Boolean(user?.uid),
  });

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>RentScore Account</Text>
        <Text style={styles.body}>Sign in to manage your reviews and saved listings.</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Sign in</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/register" asChild>
          <Pressable style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>Create account</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.displayName ?? 'Renter'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {!isConfigured ? (
          <Text style={styles.demo}>Demo mode — add EXPO_PUBLIC_FIREBASE_* keys to .env and restart Expo.</Text>
        ) : (
          <Text style={styles.connected}>Connected to Firebase project: {firebaseEnv.projectId}</Text>
        )}
      </View>

      <Text style={styles.section}>My reviews</Text>
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.hint}>You have not written any reviews yet.</Text>}
        renderItem={({ item }) => <ReviewCard review={item} showPropertyLink />}
      />

      <View style={styles.footer}>
        <Link href="/legal/terms">
          <Text style={styles.legal}>Terms of Service</Text>
        </Link>
        <Link href="/legal/privacy">
          <Text style={styles.legal}>Privacy Policy</Text>
        </Link>
        <Pressable
          onPress={async () => {
            await logOut();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.logout}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  body: { color: '#6b7280', lineHeight: 20 },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  name: { fontSize: 20, fontWeight: '700' },
  email: { color: '#6b7280', marginTop: 4 },
  demo: { marginTop: 8, fontSize: 12, color: '#b45309' },
  connected: { marginTop: 8, fontSize: 12, color: '#0f766e' },
  section: { fontWeight: '700', padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  hint: { color: '#6b7280', paddingHorizontal: 16 },
  footer: { padding: 20, gap: 12, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  legal: { color: '#2563eb' },
  logout: { color: '#dc2626', fontWeight: '600', marginTop: 8 },
  btn: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnOutlineText: { color: '#0f766e', fontWeight: '700' },
});
