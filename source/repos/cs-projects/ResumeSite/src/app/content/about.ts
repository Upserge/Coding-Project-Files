export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutTestimonial {
  quote: string;
  attribution: string;
}

export interface AboutDownload {
  label: string;
  url: string;
}

export interface AboutContent {
  headline: string;
  subtitle: string;
  photo: string;
  photoAlt: string;
  bio: string[];
  stats: AboutStat[];
  testimonials: AboutTestimonial[];
  downloads: AboutDownload[];
  pullQuote: AboutTestimonial;
}

export const ABOUT_CONTENT: AboutContent = {
  headline: 'Jason Salas',
  subtitle: 'Software developer · QA leader · builder of systems people rely on',
  photo: 'j-logo.png',
  photoAlt: 'Jason Salas',
  bio: [
    'I have spent more than a decade shipping software across startups, aerospace, and gaming — from medical and mobile products to SpaceX supply-chain tooling and six years on VALORANT.',
    'At Riot I led quality for Competitive through massive scope growth, then owned Premier from 0→1 through a global launch now live in 20 regional zones. The through-line is the same everywhere: make failure visible early, keep coverage measurable, and match shipping standards to what users actually feel.',
    'This site is both portfolio and proof — the résumé you can read, the game you can play, and the code you can inspect on GitHub.',
  ],
  stats: [
    { value: '10+', label: 'Years shipping' },
    { value: '6', label: 'Years on VALORANT' },
    { value: '20', label: 'Premier regions' },
    { value: '92+', label: 'Unit tests on this site' },
  ],
  pullQuote: {
    quote:
      'I design systems where failure is visible early, coverage is measurable, and shipping standards match what players expect at scale.',
    attribution: 'On quality at Riot Games',
  },
  testimonials: [],
  downloads: [
    {
      label: 'Resume Site source',
      url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/cs-projects/ResumeSite',
    },
    {
      label: 'LinkedIn profile',
      url: 'https://linkedin.com/in/jasoncsalas',
    },
  ],
};
