import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/src/components/ui/Button';
import { blurTintForPreset } from '@/src/theme/presets';
import { useTheme } from '@/src/theme/ThemeContext';

interface NoReviewsCardProps {
  address: string;
  onWriteReview: () => void;
  onDismiss: () => void;
}

export function NoReviewsCard({ address, onWriteReview, onDismiss }: NoReviewsCardProps) {
  const { theme, presetId } = useTheme();
  const blurTint = blurTintForPreset(presetId);

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <BlurView
        intensity={Platform.OS === 'ios' ? 60 : 85}
        tint={blurTint}
        style={[styles.card, { borderColor: theme.colors.border }]}
      >
        <Pressable
          onPress={onDismiss}
          style={styles.dismiss}
          accessibilityLabel="Dismiss"
          hitSlop={8}
        >
          <FontAwesome name="times" size={18} color={theme.colors.glassText} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.glassText }]}>No renter reviews yet</Text>
        <Text style={[styles.address, { color: theme.colors.glassText }]} numberOfLines={2}>
          {address}
        </Text>
        <Text style={[styles.body, { color: theme.colors.glassTextMuted }]}>
          Be the first to share your experience at this address.
        </Text>
        <Button label="Write the first review" onPress={onWriteReview} />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 120,
    zIndex: 9,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
    gap: 8,
  },
  dismiss: { position: 'absolute', top: 12, right: 12, zIndex: 1, padding: 4 },
  title: { fontSize: 17, fontWeight: '800', paddingRight: 28 },
  address: { fontSize: 14, fontWeight: '600' },
  body: { fontSize: 13, lineHeight: 19, marginBottom: 4, fontWeight: '500' },
});
