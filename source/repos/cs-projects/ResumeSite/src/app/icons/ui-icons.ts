export type ThemeIconName = 'sun' | 'moon';

export type UpgradeCategoryIconName = 'mobility' | 'control' | 'scoring' | 'chaos' | 'survival';

const SVG_OPEN =
  '<svg class="ui-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

const SVG_CLOSE = '</svg>';

function iconSvg(paths: string, className = 'ui-icon'): string {
  const open = SVG_OPEN.replace('class="ui-icon"', `class="${className}"`);
  return `${open}${paths}${SVG_CLOSE}`;
}

const THEME_PATHS: Record<ThemeIconName, string> = {
  sun: '<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>',
  moon: '<path d="M13.2 10.2a5.5 5.5 0 1 1-7.4-7.4 4.8 4.8 0 0 0 7.4 7.4z"/>',
};

const UPGRADE_PATHS: Record<UpgradeCategoryIconName, string> = {
  mobility:
    '<path d="M3 12 12 3"/><path d="M7 3h5v5"/><path d="M9 11l2 2"/><path d="M3 9v4h4"/>',
  control: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.25"/><path d="M8 2.5v2M8 11.5v2M2.5 8h2M11.5 8h2"/>',
  scoring: '<path d="M8 2.5 10.2 6.8l4.8.7-3.5 3.4.8 4.8L8 13.3 3.7 15.7l.8-4.8-3.5-3.4 4.8-.7L8 2.5z"/>',
  chaos: '<path d="M2.5 11.5 6 4.5l2.5 4 2.5-6 2.5 9"/>',
  survival:
    '<path d="M8 1.75 13.25 4.5V8c0 3-2.25 5.5-5.25 6.75C4.75 13.5 2.75 11 2.75 8V4.5L8 1.75z"/>',
};

/** Sun when dark mode is active (switch to light); moon when light mode is active. */
export function themeIcon(isDarkMode: boolean, className = 'ui-icon'): string {
  return iconSvg(THEME_PATHS[isDarkMode ? 'sun' : 'moon'], className);
}

export function upgradeCategoryIcon(
  category: UpgradeCategoryIconName,
  className = 'ui-icon ui-icon--upgrade',
): string {
  return iconSvg(UPGRADE_PATHS[category], className);
}

export function leaderboardRankMarkup(rank: number): string {
  if (rank === 1) return '<span class="lb-rank lb-rank--gold">1</span>';
  if (rank === 2) return '<span class="lb-rank lb-rank--silver">2</span>';
  if (rank === 3) return '<span class="lb-rank lb-rank--bronze">3</span>';
  return `<span class="lb-rank">${rank}</span>`;
}
