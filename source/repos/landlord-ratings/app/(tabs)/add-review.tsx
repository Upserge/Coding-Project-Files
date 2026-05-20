import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';

export default function AddReviewTab() {
  const router = useRouter();
  const { user, isConfigured } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share your rental experience</Text>
      <Text style={styles.body}>
        Help future renters by rating a property and landlord you have lived with. Reviews include
        category scores and a written summary, similar to Rate My Professor.
      </Text>

      {!isConfigured ? (
        <Text style={styles.note}>
          Demo mode: Firebase is not configured. Reviews are stored in memory for testing.
        </Text>
      ) : null}

      {user || !isConfigured ? (
        <Pressable style={styles.btn} onPress={() => router.push('/review/new')}>
          <Text style={styles.btnText}>Start a review</Text>
        </Pressable>
      ) : (
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Sign in to review</Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  body: { fontSize: 15, lineHeight: 22, color: '#4b5563' },
  note: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    color: '#065f46',
    fontSize: 13,
  },
  btn: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
