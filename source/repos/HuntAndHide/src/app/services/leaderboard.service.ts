import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { LeaderboardEntry } from '../models/leaderboard.model';

/**
 * Permanent leaderboard stored in Firestore `leaderboard` collection.
 * Documents are keyed by username (guaranteed unique by SessionService).
 */
@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly firestore: any = inject(Firestore);
  private readonly leaderboardCol = collection(this.firestore, 'leaderboard');

  /** Live-stream of all leaderboard entries (sorted client-side). */
  getLeaderboard$(): Observable<LeaderboardEntry[]> {
    return new Observable<LeaderboardEntry[]>(subscriber => {
      const unsubscribe = onSnapshot(this.leaderboardCol,
        snapshot => {
          const entries = snapshot.docs.map(d => d.data() as LeaderboardEntry);
          subscriber.next(entries);
        },
        err => subscriber.error(err),
      );
      return unsubscribe;
    });
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
      await setDoc(ref, this.buildUpdatedEntry(existing, score, won, role));
      return;
    }

    await setDoc(ref, this.buildNewEntry(username, score, won, role));
  }

  /** Check if a username is already taken in the leaderboard. */
  async isUsernameTaken(username: string): Promise<boolean> {
    const ref = doc(this.firestore, 'leaderboard', username);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  private buildUpdatedEntry(
    existing: LeaderboardEntry,
    score: number,
    won: boolean,
    role: 'hider' | 'hunter',
  ): LeaderboardEntry {
    return {
      ...existing,
      highScore: Math.max(existing.highScore, score),
      totalScore: existing.totalScore + score,
      gamesPlayed: existing.gamesPlayed + 1,
      gamesWonAsHider: existing.gamesWonAsHider + Number(won && role === 'hider'),
      gamesWonAsHunter: existing.gamesWonAsHunter + Number(won && role === 'hunter'),
      lastSeenAt: Date.now(),
    };
  }

  private buildNewEntry(
    username: string,
    score: number,
    won: boolean,
    role: 'hider' | 'hunter',
  ): LeaderboardEntry {
    return {
      username,
      highScore: score,
      totalScore: score,
      gamesPlayed: 1,
      gamesWonAsHider: Number(won && role === 'hider'),
      gamesWonAsHunter: Number(won && role === 'hunter'),
      lastSeenAt: Date.now(),
    };
  }
}
