import { NARRATIVE_TOASTS, STORY_SCORE_COMPLETE } from './content/game-narrative';
import { Toast } from './toast';

const CHALLENGE_UNLOCK_KEY = 'narrative-challenge-unlocked';

export class GameNarrative {
  onSessionScore(sessionScore: number): void {
    for (const toast of NARRATIVE_TOASTS) {
      if (sessionScore < toast.minScore) continue;
      if (sessionStorage.getItem(toast.storageKey)) continue;
      sessionStorage.setItem(toast.storageKey, '1');
      Toast.show(toast.message, {
        variant: 'narrative',
        duration: toast.duration ?? 5200,
      });
    }
  }

  onStoryComplete(): void {
    if (sessionStorage.getItem(CHALLENGE_UNLOCK_KEY)) return;
    sessionStorage.setItem(CHALLENGE_UNLOCK_KEY, '1');
  }

  isStoryComplete(sessionScore: number): boolean {
    return sessionScore >= STORY_SCORE_COMPLETE;
  }

  resetForNewRun(): void {
    // Session toasts stay once-per-tab; story pacing resets via upgrade state score.
  }
}
