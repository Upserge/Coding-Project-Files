import { resolveReelMedia, projectReelSlug } from './reel-media';
import { ProjectItem } from '../../resume-service';

describe('reel-media', () => {
  const resumeSite: ProjectItem = {
    title: 'Resume Site',
    caseStudySlug: 'resume-site',
    heroImage: 'case-studies/resume-site-hero.jpg',
  };

  it('maps case study slug for Resume Site', () => {
    expect(projectReelSlug(resumeSite)).toBe('resume-site');
  });

  it('returns null when reel motion is disabled', () => {
    expect(resolveReelMedia(resumeSite, false)).toBeNull();
  });

  it('resolves mp4 + hero poster when reel motion is enabled', () => {
    expect(resolveReelMedia(resumeSite, true)).toEqual({
      type: 'loop',
      mp4: 'work/loops/resume-site.mp4',
      poster: 'case-studies/resume-site-hero.jpg',
    });
  });

  it('honours explicit reelMedia overrides', () => {
    const item: ProjectItem = {
      title: 'Custom',
      reelMedia: {
        type: 'loop',
        src: 'work/loops/custom-demo.webm',
        poster: 'work/custom-poster.webp',
      },
    };
    expect(resolveReelMedia(item, true)).toEqual({
      type: 'loop',
      mp4: 'work/loops/custom-demo.mp4',
      poster: 'work/custom-poster.webp',
    });
  });
});
