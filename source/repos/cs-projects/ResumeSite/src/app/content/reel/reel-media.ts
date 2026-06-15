import { ProjectItem } from '../../resume-service';

export type ReelMediaType = 'image' | 'video' | 'loop';

export interface ReelMedia {
  type: ReelMediaType;
  mp4: string;
  poster: string;
}

const TITLE_SLUGS: Record<string, string> = {
  Gambdle: 'gambdle',
  'Hunt and Hide': 'hunt-and-hide',
  'Lil Green Ghouls': 'lil-green-ghouls',
  'PAC-MAN': 'pacman',
};

/** Stable slug for loop filenames under public/work/loops/. */
export function projectReelSlug(item: ProjectItem): string | null {
  if (item.caseStudySlug) {
    return item.caseStudySlug;
  }
  return TITLE_SLUGS[item.title] ?? null;
}

/** Resolve loop URLs when reel motion is enabled. */
export function resolveReelMedia(item: ProjectItem, reelMotion: boolean): ReelMedia | null {
  if (!reelMotion) {
    return null;
  }

  const slug = item.reelMedia?.src
    ? item.reelMedia.src.replace(/^work\/loops\//, '').replace(/\.(webm|mp4)$/, '')
    : projectReelSlug(item);

  if (!slug) {
    return null;
  }

  const poster = item.reelMedia?.poster ?? item.heroImage ?? `work/loops/${slug}.mp4`;

  return {
    type: item.reelMedia?.type ?? 'loop',
    mp4: `work/loops/${slug}.mp4`,
    poster,
  };
}
