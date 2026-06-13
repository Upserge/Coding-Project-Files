import { CaseStudy } from '../case-study.types';

export const RIOT_VALORANT_CASE_STUDY: CaseStudy = {
  slug: 'riot-valorant',
  title: 'VALORANT Premier & Competitive Quality',
  subtitle: 'Shipping ranked experiences where millions of players feel every defect',
  role: 'Quality Owner — Premier (0→1) · Quality Lead — Competitive',
  timeframe: 'Riot Games · 2020 — Present',
  tags: ['Test strategy', 'Automation', 'Global launch', 'Offshore leadership'],
  heroImage: 'case-studies/valorant-premier-hero.webp',
  externalLinks: [
    {
      label: 'LinkedIn',
      url: 'https://linkedin.com/in/jasoncsalas',
    },
  ],
  summary:
    'Led quality for VALORANT Competitive during a period of massive scope growth, then took Premier from zero to a global launch now live across 20 regional zones spanning the Americas, EMEA, and APAC.',
  metrics: [
    { label: 'Premier zones', value: '20 regions' },
    { label: 'Competitive QA lead', value: '2.5 years' },
    { label: 'Premier ownership', value: '0→1 · ~4 yrs' },
    { label: 'DDE/DRE coverage', value: '80%+' },
  ],
  sections: [
    {
      id: 'context',
      title: 'Context',
      body: [
        'VALORANT Competitive carries enormous scope: ranked integrity, feature cadence, and player trust at a scale where small defects become community-facing incidents overnight.',
        'I spent two and a half years as Quality Lead for Competitive before the area split into three separate teams — a reflection of how much surface area the mode required.',
        'Today I own quality for Premier end-to-end. I took Premier from 0→1 as the sole Quality Owner and have held that role for nearly four years.',
      ],
      figures: [
        {
          src: 'case-studies/valorant-premier-hero.webp',
          alt: 'VALORANT Premier press art',
        },
      ],
    },
    {
      id: 'launch',
      title: 'Premier at global scale',
      body: [
        'VALORANT Premier launched and is available in 20 regional zones, covering players across the Americas, EMEA (Europe, Middle East, and Africa), and APAC.',
        'Launch quality required coordinating validation across regions, release cadences, and live-service expectations — not a single-ship milestone but an ongoing operational program.',
      ],
    },
    {
      id: 'approach',
      title: 'Approach',
      body: [
        'Designed the overall test strategy for Premier launch and continued live support, balancing manual exploration with automation that protects high-risk paths.',
        'Maintained rolling 80%+ DDE/DRE coverage to keep defect detection and removal effectiveness visible to the team.',
        'Led multiple offshore testing teams, aligning execution models, communication rhythms, and quality bars across time zones.',
        'Continuously evaluated and implemented new testing tools — automated and otherwise — to keep pace with feature velocity without sacrificing signal quality.',
      ],
    },
    {
      id: 'impact',
      title: 'Impact',
      body: [
        'Premier moved from concept to a globally available competitive program with quality ownership centralized through its most formative years.',
        'Competitive quality leadership scaled through team splits without losing continuity on player-facing risk — the org grew because the problem space demanded it.',
        'The through-line for my engineering work today: design systems where failure is visible early, coverage is measurable, and shipping standards match what players expect at scale.',
      ],
    },
    {
      id: 'testimonial',
      title: 'Colleague perspective',
      body: [
        '[Placeholder testimonial — Jason will add a quote from a colleague or partner here.]',
        '— Placeholder Name, Role @ Company',
      ],
    },
  ],
};
