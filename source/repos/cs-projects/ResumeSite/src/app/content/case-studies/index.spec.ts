import { getAllCaseStudies, getCaseStudy } from './index';

describe('case study registry', () => {
  it('returns known slugs', () => {
    expect(getCaseStudy('resume-site')?.title).toBe('Resume Site');
    expect(getCaseStudy('riot-valorant')?.title).toContain('VALORANT');
    expect(getCaseStudy('missing')).toBeUndefined();
  });

  it('includes required sections for each study', () => {
    for (const study of getAllCaseStudies()) {
      expect(study.slug.length).toBeGreaterThan(0);
      expect(study.summary.length).toBeGreaterThan(0);
      expect(study.metrics.length).toBeGreaterThan(0);
      expect(study.sections.length).toBeGreaterThan(0);
    }
  });
});
