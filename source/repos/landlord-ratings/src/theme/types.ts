export type DesignPresetId = 'trustTeal' | 'midnightAmber' | 'softPaper';

export interface AppTheme {
  id: DesignPresetId;
  name: string;
  tagline: string;
  colors: {
    primary: string;
    primarySoft: string;
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textSecondary: string;
    textOnPrimary: string;
    border: string;
    accent: string;
    danger: string;
    headerBg: string;
    tabBar: string;
    tabBarBorder: string;
    ratingHigh: string;
    ratingMid: string;
    ratingLow: string;
    ratingNone: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}
