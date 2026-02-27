import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  collectionData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { LeaderboardEntry } from '../models/leaderboard.model';

/**
 * Permanent leaderboard stored in Firestore `leaderboard` collection.
 * Documents are keyed by username (guaranteed unique by SessionService).
 */
@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly firestore = inject(Firestore);
  private readonly leaderboardCol = collection(this.firestore, 'leaderboard');

  /** Live-stream of all leaderboard entries (sorted client-side). */
  getLeaderboard$(): Observable<LeaderboardEntry[]> {
    return collectionData(this.leaderboardCol) as Observable<LeaderboardEntry[]>;
  }

  /** Get a single player's leaderboard entry. */
  async getEntry(username: string): Promise<LeaderboardEntry | null> {
    const ref = doc(this.firestore, 'leaderboard', username);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as LeaderboardEntry) : null;
  }

  /** Create or update a player's leaderboard entry after a game. */
  async recordGameResult(
    username: string,
    score: number,
    won: boolean,
    role: 'hider' | 'hunter',
  ): Promise<void> {
    const ref = doc(this.firestore, 'leaderboard', username);
    const existing = await this.getEntry(username);

    if (existing) {
      const updated: LeaderboardEntry = {
        ...existing,
        highScore: Math.max(existing.highScore, score),
        totalScore: existing.totalScore + score,
        gamesPlayed: existing.gamesPlayed + 1,
        gamesWonAsHider: existing.gamesWonAsHider + (won && role === 'hider' ? 1 : 0),
        gamesWonAsHunter: existing.gamesWonAsHunter + (won && role === 'hunter' ? 1 : 0),
        lastSeenAt: Date.now(),
      };
      await setDoc(ref, updated);
    } else {
      const entry: LeaderboardEntry = {
        username,
        highScore: score,
        totalScore: score,
        gamesPlayed: 1,
        gamesWonAsHider: won && role === 'hider' ? 1 : 0,
        gamesWonAsHunter: won && role === 'hunter' ? 1 : 0,
        lastSeenAt: Date.now(),
      };
      await setDoc(ref, entry);
    }
  }

  /** Check if a username is already taken in the leaderboard. */
  async isUsernameTaken(username: string): Promise<boolean> {
    const ref = doc(this.firestore, 'leaderboard', username);
    const snap = await getDoc(ref);
    return snap.exists();
  }
}
