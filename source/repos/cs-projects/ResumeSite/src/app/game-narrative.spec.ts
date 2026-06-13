import { NARRATIVE_TOASTS, STORY_SCORE_COMPLETE } from './content/game-narrative';
import { GameNarrative } from './game-narrative';

describe('GameNarrative', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('marks story complete at configured score', () => {
    const narrative = new GameNarrative();
    expect(narrative.isStoryComplete(STORY_SCORE_COMPLETE - 1)).toBe(false);
    expect(narrative.isStoryComplete(STORY_SCORE_COMPLETE)).toBe(true);
  });

  it('defines toast thresholds in ascending order', () => {
    const scores = NARRATIVE_TOASTS.map((t) => t.minScore);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(scores[scores.length - 1]).toBe(STORY_SCORE_COMPLETE);
  });
});
