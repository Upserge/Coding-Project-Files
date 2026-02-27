/** Leaderboard types for the permanent Firestore collection. */

export interface LeaderboardEntry {
  username: string;
  highScore: number;
  totalScore: number;
  gamesPlayed: number;
  gamesWonAsHider: number;
  gamesWonAsHunter: number;
  lastSeenAt: number;
}

/** Local identity stored in localStorage (no full auth). */
export interface LocalIdentity {
  /** Random token generated on first visit. */
  token: string;
  username: string;
  createdAt: number;
}
