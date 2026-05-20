import { Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ label, variant = 'primary', style: styleProp, disabled, ...props }: ButtonProps) {
  const { theme } = useTheme();
  const flatStyle = typeof styleProp === 'function' ? undefined : styleProp;

  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : variant === 'secondary'
          ? theme.colors.primarySoft
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.textOnPrimary
      : variant === 'secondary'
        ? theme.colors.primary
        : theme.colors.accent;

  return (
    <Pressable
      style={({ pressed }) => {
        const base: ViewStyle = {
          backgroundColor: bg,
          borderRadius: theme.radius.md,
          borderColor: variant === 'secondary' ? theme.colors.primary : theme.colors.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        };
        return [styles.base, base, flatStyle];
      }}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  label: { fontSize: 16, fontWeight: '700' },
});
