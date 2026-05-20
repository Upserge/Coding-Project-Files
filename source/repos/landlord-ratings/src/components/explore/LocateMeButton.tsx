import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';

interface LocateMeButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export function LocateMeButton({ onPress, loading = false }: LocateMeButtonProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Center map on your location"
      style={({ pressed }) => [
        styles.btn,
        {
          bottom: insets.bottom + 12,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed || loading ? 0.88 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <FontAwesome name="location-arrow" size={20} color={theme.colors.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 5,
  },
});
