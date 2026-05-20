import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAddressSearch } from '@/src/hooks/useAddressSearch';
import { blurTintForPreset } from '@/src/theme/presets';
import { useTheme } from '@/src/theme/ThemeContext';
import type { PlaceSuggestion } from '@/src/types';

interface ExploreSearchPanelProps {
  expanded: boolean;
  onCollapse: () => void;
  onSelectPlace: (suggestion: PlaceSuggestion) => void;
  resolving?: boolean;
}

export function ExploreSearchPanel({
  expanded,
  onCollapse,
  onSelectPlace,
  resolving = false,
}: ExploreSearchPanelProps) {
  const { theme, presetId } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { suggestions, loading } = useAddressSearch(query);

  const panGesture = Gesture.Pan().onEnd((e) => {
    if (e.translationY < -36 || e.velocityY < -400) {
      onCollapse();
    }
  });

  if (!expanded) return null;

  const blurTint = blurTintForPreset(presetId);
  const canClear = query.length > 0;

  return (
    <View style={[styles.anchor, { top: insets.top + 4 }]} pointerEvents="box-none">
      <GestureDetector gesture={panGesture}>
        <View style={styles.panelShadow}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 55 : 80}
            tint={blurTint}
            style={[styles.blur, { borderColor: theme.colors.border }]}
          >
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: theme.colors.glassTextMuted }]} />
              <Text style={[styles.swipeHint, { color: theme.colors.glassTextMuted }]}>
                Swipe up to hide
              </Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    paddingRight: canClear ? 40 : 14,
                  },
                ]}
                placeholder="Search any rental address…"
                placeholderTextColor={theme.colors.glassTextMuted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {canClear ? (
                <Pressable
                  onPress={() => setQuery('')}
                  style={styles.clearBtn}
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                >
                  <FontAwesome
                    name="times-circle"
                    size={20}
                    color={theme.colors.glassTextMuted}
                  />
                </Pressable>
              ) : null}
            </View>

            <Text style={[styles.helper, { color: theme.colors.glassText }]}>
              We show reviews when renters have rated this address.
            </Text>

            {resolving ? (
              <ActivityIndicator style={styles.spinner} color={theme.colors.primary} />
            ) : null}

            {(loading || suggestions.length > 0) && !resolving ? (
              <View
                style={[
                  styles.suggestions,
                  { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
                ]}
              >
                {loading && suggestions.length === 0 ? (
                  <Text style={[styles.suggestionText, { color: theme.colors.glassTextMuted }]}>
                    Searching…
                  </Text>
                ) : null}
                {suggestions.map((s) => (
                  <Pressable
                    key={s.placeId}
                    style={[styles.suggestionRow, { borderBottomColor: theme.colors.border }]}
                    onPress={() => {
                      setQuery(s.description);
                      onSelectPlace(s);
                    }}
                  >
                    <Text style={[styles.suggestionText, { color: theme.colors.glassText }]} numberOfLines={2}>
                      {s.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </BlurView>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
  },
  panelShadow: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  blur: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 8, gap: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  swipeHint: { fontSize: 11, fontWeight: '600' },
  inputRow: { position: 'relative', justifyContent: 'center' },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  helper: { fontSize: 12, marginTop: 8, lineHeight: 17, fontWeight: '500' },
  spinner: { marginTop: 12 },
  suggestions: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: { fontSize: 14, fontWeight: '500' },
});
