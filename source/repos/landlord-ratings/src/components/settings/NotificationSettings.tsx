import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { Card } from '@/src/components/ui/Card';
import { useAuth } from '@/src/context/AuthContext';
import { db, isFirebaseConfigured } from '@/src/services/firebase';
import {
  disablePushNotifications,
  enablePushNotifications,
} from '@/src/services/notifications';
import { useTheme } from '@/src/theme/ThemeContext';

async function fetchPushEnabled(userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.data()?.pushNotificationsEnabled !== false;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: enabled = false, isLoading } = useQuery({
    queryKey: ['push-enabled', user?.uid],
    queryFn: () => fetchPushEnabled(user!.uid),
    enabled: Boolean(user?.uid && isFirebaseConfigured),
  });

  const toggleMutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!user) throw new Error('Not signed in');
      if (next) {
        const ok = await enablePushNotifications(user.uid);
        if (!ok) {
          throw new Error(
            Platform.OS === 'android'
              ? 'Push requires a physical device and Expo Go may not support remote push on Android. Use a dev build or test on iOS.'
              : 'Allow notifications in system settings and use a physical device.',
          );
        }
      } else {
        await disablePushNotifications(user.uid);
      }
    },
    onSuccess: (_, next) => {
      queryClient.setQueryData(['push-enabled', user?.uid], next);
    },
    onError: (e) => {
      Alert.alert('Notifications', e instanceof Error ? e.message : 'Could not update setting.');
    },
  });

  if (!user || !isFirebaseConfigured) return null;

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Saved property alerts</Text>
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            Get notified when someone reviews a property you saved. Works on a physical device;
            iOS Expo Go supports push; Android Expo Go does not (SDK 53+).
          </Text>
        </View>
        <Switch
          value={enabled}
          disabled={isLoading || toggleMutation.isPending}
          onValueChange={(v) => toggleMutation.mutate(v)}
          trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textCol: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});
