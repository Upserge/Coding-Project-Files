import { CaseStudy } from '../case-study.types';
import { RESUME_SITE_CASE_STUDY } from './resume-site';
import { RIOT_VALORANT_CASE_STUDY } from './riot-valorant';

const CASE_STUDIES: CaseStudy[] = [RESUME_SITE_CASE_STUDY, RIOT_VALORANT_CASE_STUDY];

const CASE_STUDY_BY_SLUG = new Map(CASE_STUDIES.map((study) => [study.slug, study]));

export function getAllCaseStudies(): CaseStudy[] {
  return CASE_STUDIES;
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDY_BY_SLUG.get(slug);
}
