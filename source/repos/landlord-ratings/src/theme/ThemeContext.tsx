import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRESET_ID, DESIGN_PRESETS } from '@/src/theme/presets';
import type { AppTheme, DesignPresetId } from '@/src/theme/types';

const STORAGE_KEY = '@rentscore/design_preset';

interface ThemeContextValue {
  theme: AppTheme;
  presetId: DesignPresetId;
  setPresetId: (id: DesignPresetId) => Promise<void>;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState<DesignPresetId>(DEFAULT_PRESET_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && stored in DESIGN_PRESETS) {
        setPresetIdState(stored as DesignPresetId);
      }
      setReady(true);
    });
  }, []);

  const setPresetId = useCallback(async (id: DesignPresetId) => {
    setPresetIdState(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: DESIGN_PRESETS[presetId],
      presetId,
      setPresetId,
      ready,
    }),
    [presetId, setPresetId, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
