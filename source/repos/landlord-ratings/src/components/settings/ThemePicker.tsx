import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/ui/Card';
import { PRESET_LIST } from '@/src/theme/presets';
import { useTheme } from '@/src/theme/ThemeContext';
import type { DesignPresetId } from '@/src/theme/types';

/** User-facing theme selector — choice persists on this device. */
export function ThemePicker() {
  const { theme, presetId, setPresetId } = useTheme();

  return (
    <Card style={styles.wrap}>
      <View style={styles.headerRow}>
        <FontAwesome name="paint-brush" size={18} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>App theme</Text>
      </View>
      <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
        Pick a look for RentScore. Your theme is saved on this phone or browser.
      </Text>

      {PRESET_LIST.map((preset) => {
        const selected = preset.id === presetId;
        return (
          <Pressable
            key={preset.id}
            onPress={() => setPresetId(preset.id as DesignPresetId)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.option,
              {
                backgroundColor: preset.colors.surfaceMuted,
                borderColor: selected ? preset.colors.primary : theme.colors.border,
                borderWidth: selected ? 2 : 1,
              },
            ]}
          >
            <View style={styles.optionTop}>
              <View style={styles.swatchRow}>
                {[
                  preset.colors.primary,
                  preset.colors.background,
                  preset.colors.accent,
                  preset.colors.ratingHigh,
                ].map((c) => (
                  <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                ))}
              </View>
              {selected ? (
                <View style={[styles.check, { backgroundColor: preset.colors.primary }]}>
                  <FontAwesome name="check" size={12} color={preset.colors.textOnPrimary} />
                </View>
              ) : null}
            </View>
            <Text style={[styles.optionName, { color: preset.colors.text }]}>{preset.name}</Text>
            <Text style={[styles.optionTag, { color: preset.colors.textSecondary }]}>
              {preset.tagline}
            </Text>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 14, lineHeight: 20 },
  option: {
    borderRadius: 14,
    padding: 14,
    gap: 6,
    marginTop: 4,
  },
  optionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swatchRow: { flexDirection: 'row', gap: 6 },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: { fontSize: 16, fontWeight: '700' },
  optionTag: { fontSize: 13 },
});
