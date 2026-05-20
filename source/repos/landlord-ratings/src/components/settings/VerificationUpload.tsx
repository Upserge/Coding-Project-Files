import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useAuth } from '@/src/context/AuthContext';
import { isFirebaseConfigured } from '@/src/services/firebase';
import { getVerification, uploadTenancyVerification } from '@/src/services/verification';
import { useTheme } from '@/src/theme/ThemeContext';

const STATUS_LABELS = {
  pending: 'Under review',
  approved: 'Verified renter',
  rejected: 'Not approved — you may upload again',
} as const;

export function VerificationUpload() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: verification } = useQuery({
    queryKey: ['verification', user?.uid],
    queryFn: () => getVerification(user!.uid),
    enabled: Boolean(user?.uid && isFirebaseConfigured),
  });

  const uploadMutation = useMutation({
    mutationFn: async (uri: string) => uploadTenancyVerification(uri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification', user?.uid] });
      Alert.alert(
        'Uploaded',
        'Your document is pending review. We only use it to confirm you rented at a property.',
      );
    },
    onError: (e) => {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.');
    },
  });

  const pickAndUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload verification.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) return;
    uploadMutation.mutate(result.assets[0].uri);
  };

  if (!user || !isFirebaseConfigured) return null;

  const canUpload = !verification || verification.status === 'rejected';

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Tenancy verification</Text>
      <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
        Optional: upload a lease page or utility bill (address visible). Helps build trust; only you
        and moderation can access the file.
      </Text>

      {verification ? (
        <View style={styles.statusBlock}>
          <Text style={[styles.status, { color: theme.colors.primary }]}>
            {STATUS_LABELS[verification.status]}
          </Text>
          {verification.downloadUrl ? (
            <Image source={{ uri: verification.downloadUrl }} style={styles.thumb} />
          ) : null}
          {verification.rejectionReason ? (
            <Text style={[styles.rejected, { color: theme.colors.danger }]}>
              {verification.rejectionReason}
            </Text>
          ) : null}
        </View>
      ) : null}

      {canUpload ? (
        <Button
          label={uploadMutation.isPending ? 'Uploading…' : 'Upload document'}
          variant="secondary"
          disabled={uploadMutation.isPending}
          onPress={pickAndUpload}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 18 },
  statusBlock: { gap: 8 },
  status: { fontSize: 14, fontWeight: '600' },
  rejected: { fontSize: 12 },
  thumb: { width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' },
});
