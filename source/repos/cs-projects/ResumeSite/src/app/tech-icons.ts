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
