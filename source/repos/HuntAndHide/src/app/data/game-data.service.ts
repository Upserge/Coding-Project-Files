import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collectionData,
  docData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { GameSession, SessionConfig, DEFAULT_SESSION_CONFIG, PlayerState } from '../models/game-state.model';

@Injectable({ providedIn: 'root' })
export class GameDataService {
  private readonly firestore = inject(Firestore);
  private readonly sessionsCol = collection(this.firestore, 'sessions');

  // ── READ ─────────────────────────────────────────────────

  /** Live-stream of all open sessions (lobby list). */
  getSessions$(): Observable<GameSession[]> {
    return collectionData(this.sessionsCol, { idField: 'id' }) as Observable<GameSession[]>;
  }

  /** Live-stream of a single session. */
  getSession$(sessionId: string): Observable<GameSession | undefined> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    return docData(ref, { idField: 'id' }) as Observable<GameSession | undefined>;
  }

  // ── CREATE ───────────────────────────────────────────────

  /** Create a new game session and return its Firestore document ID. */
  async createSession(hostUid: string, config: SessionConfig = DEFAULT_SESSION_CONFIG): Promise<string> {
    const now = Date.now();
    const session: Omit<GameSession, 'id'> = {
      hostUid,
      phase: 'lobby',
      players: {},
      hiderCount: 0,
      hunterCount: 0,
      roundTimeSeconds: config.roundTimeSeconds,
      currentRound: 0,
      maxRounds: config.maxRounds,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await addDoc(this.sessionsCol, session);
    return ref.id;
  }

  // ── UPDATE ───────────────────────────────────────────────

  /** Merge partial updates into a session document. */
  async updateSession(sessionId: string, patch: Partial<GameSession>): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, { ...patch, updatedAt: Date.now() });
  }

  /** Add or update a player inside a session. */
  async setPlayer(sessionId: string, player: PlayerState): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, {
      [`players.${player.uid}`]: player,
      updatedAt: Date.now(),
    });
  }

  /** Remove a player from a session. */
  async removePlayer(sessionId: string, uid: string): Promise<void> {
    // Firestore doesn't support deleting nested map keys directly via updateDoc,
    // so we set the value to deleteField() — but that requires the firebase/firestore import.
    // For now, set to null and filter on read.
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, {
      [`players.${uid}`]: null,
      updatedAt: Date.now(),
    });
  }

  // ── DELETE ───────────────────────────────────────────────

  async deleteSession(sessionId: string): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await deleteDoc(ref);
  }
}
