// SVG tech icon definitions with animations and links
export const TECH_ICONS: { [key: string]: string } = {
  javascript: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.js-text { font-size: 60px; font-weight: bold; fill: currentColor; }</style>
    </defs>
    <rect width="100" height="100" fill="transparent"/>
    <text x="50" y="70" text-anchor="middle" class="js-text">JS</text>
    <path d="M 20 20 Q 50 10 80 20" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3" class="animate-draw"/>
  </svg>`,
  angular: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.ng-path { fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; }</style>
    </defs>
    <polygon points="50,15 85,75 50,65 15,75" class="ng-path" fill="currentColor" opacity="0.7"/>
    <polygon points="50,65 50,35 30,75 70,75" class="ng-path" fill="none"/>
  </svg>`,
  python: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.py-circle { fill: currentColor; opacity: 0.8; }</style>
    </defs>
    <circle cx="35" cy="35" r="18" class="py-circle"/>
    <circle cx="65" cy="65" r="18" class="py-circle"/>
    <path d="M 50 50 Q 60 60 70 50" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
  </svg>`,
  sql: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.sql-col { fill: currentColor; opacity: 0.7; }</style>
    </defs>
    <rect x="15" y="25" width="16" height="50" class="sql-col" rx="2"/>
    <rect x="42" y="20" width="16" height="55" class="sql-col" rx="2"/>
    <rect x="69" y="30" width="16" height="45" class="sql-col" rx="2"/>
    <line x1="10" y1="80" x2="90" y2="80" stroke="currentColor" stroke-width="2" opacity="0.5"/>
  </svg>`,
  postman: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.pm-envelope { fill: currentColor; opacity: 0.8; }</style>
    </defs>
    <rect x="20" y="30" width="60" height="45" class="pm-envelope" rx="4"/>
    <path d="M 20 30 L 50 55 L 80 30" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>`,
  jql: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.jql-text { font-size: 40px; font-weight: bold; fill: currentColor; }</style>
    </defs>
    <rect width="100" height="100" fill="transparent"/>
    <text x="50" y="65" text-anchor="middle" class="jql-text">JQL</text>
  </svg>`,
  databricks: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.db-diamond { fill: currentColor; opacity: 0.8; }</style>
    </defs>
    <polygon points="50,15 85,50 50,85 15,50" class="db-diamond"/>
    <path d="M 50 30 L 70 50 L 50 70 L 30 50 Z" fill="transparent" stroke="currentColor" stroke-width="2" opacity="0.5"/>
  </svg>`,
  jenkins: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.jenkins-gear { fill: currentColor; opacity: 0.8; }</style>
    </defs>
    <circle cx="50" cy="50" r="30" class="jenkins-gear"/>
    <circle cx="50" cy="50" r="20" fill="transparent" stroke="currentColor" stroke-width="2" opacity="0.5"/>
    <g opacity="0.6">
      <rect x="48" y="15" width="4" height="8" fill="currentColor"/>
      <rect x="48" y="77" width="4" height="8" fill="currentColor"/>
      <rect x="15" y="48" width="8" height="4" fill="currentColor"/>
      <rect x="77" y="48" width="8" height="4" fill="currentColor"/>
    </g>
  </svg>`,
  swagger: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>.swagger-path { fill: currentColor; opacity: 0.8; }</style>
    </defs>
    <path d="M 30 30 Q 50 20 70 30 Q 80 35 80 50 Q 80 65 70 70 Q 50 80 30 70 Q 20 65 20 50 Q 20 35 30 30" class="swagger-path"/>
    <circle cx="50" cy="50" r="10" fill="transparent" stroke="currentColor" stroke-width="2" opacity="0.5"/>
  </svg>`,
};

export const TECH_LINKS: { [key: string]: string } = {
  javascript: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  angular: 'https://angular.io',
  python: 'https://www.python.org',
  sql: 'https://www.postgresql.org',
  postman: 'https://www.postman.com',
  jql: 'https://www.atlassian.com/software/jira/guides/jql',
  databricks: 'https://www.databricks.com',
  jenkins: 'https://www.jenkins.io',
  swagger: 'https://swagger.io',
};

export function getTechSVG(tech: string): string {
  const t = tech.toLowerCase();
  if (t.includes('javascript') || t === 'js') return TECH_ICONS['javascript'];
  if (t.includes('angular')) return TECH_ICONS['angular'];
  if (t.includes('python')) return TECH_ICONS['python'];
  if (t.includes('sql')) return TECH_ICONS['sql'];
  if (t.includes('postman')) return TECH_ICONS['postman'];
  if (t.includes('jql')) return TECH_ICONS['jql'];
  if (t.includes('databricks')) return TECH_ICONS['databricks'];
  if (t.includes('jenkins')) return TECH_ICONS['jenkins'];
  if (t.includes('swagger')) return TECH_ICONS['swagger'];
  return TECH_ICONS['javascript'];
}

export function getTechLink(tech: string): string {
  const t = tech.toLowerCase();
  if (t.includes('javascript') || t === 'js') return TECH_LINKS['javascript'];
  if (t.includes('angular')) return TECH_LINKS['angular'];
  if (t.includes('python')) return TECH_LINKS['python'];
  if (t.includes('sql')) return TECH_LINKS['sql'];
  if (t.includes('postman')) return TECH_LINKS['postman'];
  if (t.includes('jql')) return TECH_LINKS['jql'];
  if (t.includes('databricks')) return TECH_LINKS['databricks'];
  if (t.includes('jenkins')) return TECH_LINKS['jenkins'];
  if (t.includes('swagger')) return TECH_LINKS['swagger'];
  return '';
}

// ===== Project SVG Icons =====
export const PROJECT_ICONS: { [key: string]: string } = {
  'resume site': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="12" width="60" height="76" rx="6" fill="none" stroke="currentColor" stroke-width="3" opacity="0.8"/>
    <line x1="32" y1="30" x2="68" y2="30" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
    <line x1="32" y1="42" x2="60" y2="42" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
    <line x1="32" y1="52" x2="64" y2="52" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
    <line x1="32" y1="62" x2="56" y2="62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
    <circle cx="68" cy="72" r="10" fill="currentColor" opacity="0.25"/>
    <path d="M 65 72 L 68 68 L 71 72" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`,
  'pokedex': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="3" opacity="0.8"/>
    <line x1="12" y1="50" x2="88" y2="50" stroke="currentColor" stroke-width="3" opacity="0.6"/>
    <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="3" opacity="0.8"/>
    <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.7"/>
  </svg>`,
  'deck of cards': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="16" width="48" height="68" rx="6" fill="currentColor" opacity="0.15" transform="rotate(-8 42 50)"/>
    <rect x="28" y="14" width="48" height="68" rx="6" fill="currentColor" opacity="0.25" transform="rotate(4 52 48)"/>
    <rect x="26" y="16" width="48" height="68" rx="6" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.8"/>
    <path d="M 50 32 C 58 24 68 32 50 48 C 32 32 42 24 50 32" fill="currentColor" opacity="0.7"/>
  </svg>`,
  'number guesser': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="3" opacity="0.3"/>
    <text x="50" y="46" text-anchor="middle" font-size="32" font-weight="bold" fill="currentColor" opacity="0.8">?</text>
    <text x="34" y="78" font-size="16" font-weight="bold" fill="currentColor" opacity="0.4">0</text>
    <text x="58" y="78" font-size="16" font-weight="bold" fill="currentColor" opacity="0.4">9</text>
    <line x1="48" y1="74" x2="52" y2="74" stroke="currentColor" stroke-width="2" opacity="0.3"/>
  </svg>`,
  'array algorithms': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text x="14" y="62" font-size="42" font-weight="bold" fill="currentColor" opacity="0.4">[</text>
    <text x="76" y="62" font-size="42" font-weight="bold" fill="currentColor" opacity="0.4">]</text>
    <rect x="30" y="56" width="8" height="20" rx="2" fill="currentColor" opacity="0.5"/>
    <rect x="42" y="40" width="8" height="36" rx="2" fill="currentColor" opacity="0.6"/>
    <rect x="54" y="48" width="8" height="28" rx="2" fill="currentColor" opacity="0.7"/>
    <rect x="66" y="32" width="8" height="44" rx="2" fill="currentColor" opacity="0.8"/>
    <path d="M 34 28 L 42 20 L 50 28" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
    <path d="M 54 28 L 62 20 L 70 28" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
  </svg>`,
  'book tracker': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M 50 22 L 50 82" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    <path d="M 50 22 C 50 22 38 18 22 22 L 22 74 C 38 70 50 74 50 74" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 50 22 C 50 22 62 18 78 22 L 78 74 C 62 70 50 74 50 74" fill="currentColor" opacity="0.25" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
    <line x1="30" y1="36" x2="44" y2="34" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
    <line x1="30" y1="46" x2="44" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
    <line x1="30" y1="56" x2="42" y2="54" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
  </svg>`,
};

export function getProjectSVG(title: string): string {
  const t = title.toLowerCase();
  return PROJECT_ICONS[t] || PROJECT_ICONS['resume site'];
}
