import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeContext';

interface AppScreenProps extends ViewProps {
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  padded?: boolean;
}

export function AppScreen({
  children,
  scroll,
  scrollProps,
  padded = true,
  style,
  ...props
}: AppScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={[
        padded && { padding: theme.spacing.md, paddingBottom: theme.spacing.lg + insets.bottom },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ flexGrow: 1 }}
        {...scrollProps}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
