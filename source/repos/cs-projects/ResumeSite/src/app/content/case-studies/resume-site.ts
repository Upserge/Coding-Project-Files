import { CaseStudy } from '../case-study.types';

export const RESUME_SITE_CASE_STUDY: CaseStudy = {
  slug: 'resume-site',
  title: 'Resume Site',
  subtitle: 'An interactive portfolio that is also the proof of work',
  role: 'Designer, developer, and deploy owner',
  timeframe: '2024 — Present',
  tags: ['Angular', 'WebGL', 'Canvas', 'Firebase', 'GitHub Pages'],
  heroImage: 'case-studies/resume-site-hero.svg',
  externalLinks: [
    {
      label: 'View source on GitHub',
      url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/cs-projects/ResumeSite',
    },
    {
      label: 'Live site',
      url: 'https://upserge.github.io/Jason.io/',
    },
  ],
  summary:
    'A single-page Angular portfolio that doubles as a technical demo: WebGL hero shader, full-viewport canvas game, Firestore leaderboard, keyboard-driven navigation, and a one-command deploy pipeline to GitHub Pages.',
  metrics: [
    { label: 'Stack', value: 'Angular 21' },
    { label: 'Game systems', value: '15 upgrades' },
    { label: 'Unit tests', value: '80+ specs' },
  ],
  sections: [
    {
      id: 'problem',
      title: 'Problem',
      body: [
        'A static PDF résumé cannot show how I think about systems, performance, or player-facing quality.',
        'I wanted a home base that feels intentional for engineering recruiters: readable content up front, with craft demonstrated in the browser itself.',
      ],
    },
    {
      id: 'approach',
      title: 'Approach',
      body: [
        'Built as a standalone Angular SPA with a canvas particle game running behind the résumé, wired to Firestore for persistent leaderboard scores.',
        'Layered a WebGL hero shader, scroll-driven reveals, magnetic interactions, and focus-mode opacity tiers so the game and résumé coexist without fighting for attention.',
        'Added a deploy script that commits source to the monorepo, builds with the correct GitHub Pages base href, and publishes dist assets plus a 404 SPA fallback.',
      ],
    },
    {
      id: 'impact',
      title: 'Impact',
      body: [
        'The site is both portfolio and artifact: visitors can read the résumé, play the game, and inspect the implementation on GitHub.',
        'Phase 1 introduces on-site case studies so project proof lives on the domain instead of only linking out to repos.',
      ],
    },
    {
      id: 'learnings',
      title: 'Learnings',
      body: [
        'Performance work (spatial grids, capped DPR, tab visibility pauses) matters as much as visual polish when a game loop runs behind content.',
        'Deploy ergonomics are part of the product: if shipping is painful, the site will not stay current.',
      ],
    },
  ],
};
