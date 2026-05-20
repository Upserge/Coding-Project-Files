import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { useTheme } from '@/src/theme/ThemeContext';

export default function LoginScreen() {
  const { signIn, isConfigured } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!isConfigured) {
      router.replace('/(tabs)');
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Sign in failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.hero, { backgroundColor: theme.colors.headerBg }]}>
        <Text style={[styles.brand, { color: theme.colors.textOnPrimary }]}>RentScore</Text>
        <Text style={[styles.heroSub, { color: theme.colors.primarySoft }]}>
          Know before you sign the lease
        </Text>
      </View>

      <View style={styles.form}>
        {!isConfigured ? (
          <Button label="Continue in demo mode" onPress={() => router.replace('/(tabs)')} />
        ) : (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button
              label={loading ? 'Signing in…' : 'Sign in'}
              onPress={handleLogin}
              disabled={loading}
            />
          </>
        )}

        <Link href="/(auth)/register" style={styles.link}>
          <Text style={{ color: theme.colors.accent, textAlign: 'center', fontWeight: '600' }}>
            Create an account
          </Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingTop: 72,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brand: { fontSize: 36, fontWeight: '800' },
  heroSub: { fontSize: 16, marginTop: 8, opacity: 0.95 },
  form: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  link: { marginTop: 16 },
});
