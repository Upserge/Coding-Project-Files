import { HeaderBackButton as NavHeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';

interface HeaderBackButtonProps {
  /** Fallback when there is no stack history (e.g. after router.replace). */
  fallbackHref?: '/(tabs)';
  tintColor?: string;
}

/**
 * Reliable back navigation for Expo Router stack screens.
 * iOS "Tabs" labels often fail to pop when history was replaced; swipe still works.
 */
export function HeaderBackButton({ fallbackHref = '/(tabs)', tintColor }: HeaderBackButtonProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const color = tintColor ?? theme.colors.primary;

  return (
    <NavHeaderBackButton
      tintColor={color}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        if (router.canDismiss()) {
          router.dismiss();
          return;
        }
        router.replace(fallbackHref);
      }}
    />
  );
}
