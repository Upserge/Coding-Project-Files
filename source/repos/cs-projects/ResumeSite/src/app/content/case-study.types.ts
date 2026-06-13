export interface CaseStudyLink {
  label: string;
  url: string;
}

export interface CaseStudyMetric {
  label: string;
  value: string;
}

export interface CaseStudyFigure {
  src: string;
  alt: string;
  caption?: string;
}

export interface CaseStudySection {
  id: string;
  title: string;
  body: string[];
  figures?: CaseStudyFigure[];
}

export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  timeframe: string;
  tags: string[];
  heroImage?: string;
  externalLinks: CaseStudyLink[];
  summary: string;
  metrics: CaseStudyMetric[];
  sections: CaseStudySection[];
}
