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
  query,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import {
  GameSession,
  SessionConfig,
  DEFAULT_SESSION_CONFIG,
  MAX_PLAYERS_PER_SESSION,
} from '../models/session.model';
import { PlayerState } from '../models/player.model';
import { IdentityService } from './identity.service';

/**
 * SessionService manages Firestore game sessions:
 * - CRUD operations
 * - Auto-scaling (overflow at MAX_PLAYERS_PER_SESSION → new session)
 * - Role seeding (count hiders/hunters, assign accordingly)
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly firestore = inject(Firestore);
  private readonly identity = inject(IdentityService);
  private readonly sessionsCol = collection(this.firestore, 'sessions');

  // ── READ ─────────────────────────────────────────────────

  /** Live-stream of sessions in the lobby phase that aren't full. */
  getOpenSessions$(): Observable<GameSession[]> {
    const q = query(this.sessionsCol, where('phase', '==', 'lobby'));
    return collectionData(q, { idField: 'id' }) as Observable<GameSession[]>;
  }

  /** Live-stream of a single session. */
  getSession$(sessionId: string): Observable<GameSession | undefined> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    return docData(ref, { idField: 'id' }) as Observable<GameSession | undefined>;
  }

  // ── JOIN / AUTO-SCALE ────────────────────────────────────

  /**
   * Find an open session with room, or create a new one.
   * Returns the session ID the player should join.
   */
  async findOrCreateSession(): Promise<string> {
    // Fetch open lobby sessions (one-shot read for matchmaking)
    const { getDocs } = await import('@angular/fire/firestore');
    const q = query(this.sessionsCol, where('phase', '==', 'lobby'));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const session = docSnap.data() as GameSession;
      const playerCount = Object.keys(session.players ?? {}).length;
      if (playerCount < MAX_PLAYERS_PER_SESSION) {
        return docSnap.id;
      }
    }

    // No room anywhere — spin up a new session
    return this.createSession();
  }

  // ── CREATE ───────────────────────────────────────────────

  async createSession(config: SessionConfig = DEFAULT_SESSION_CONFIG): Promise<string> {
    const now = Date.now();
    const session: Omit<GameSession, 'id'> = {
      hostUid: this.identity.getToken(),
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

  // ── PLAYER MANAGEMENT ────────────────────────────────────

  /** Add a player to a session, seeding role based on current counts. */
  async joinSession(sessionId: string, player: PlayerState): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, {
      [`players.${player.uid}`]: player,
      [`${player.role}Count`]: player.role === 'hider'
        ? this.increment('hiderCount')
        : this.increment('hunterCount'),
      updatedAt: Date.now(),
    });
  }

  async removePlayer(sessionId: string, uid: string, role: 'hider' | 'hunter'): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    // Use FieldValue.delete() equivalent — for now set to null
    await updateDoc(ref, {
      [`players.${uid}`]: null,
      [`${role}Count`]: this.decrement(`${role}Count`),
      updatedAt: Date.now(),
    });
  }

  // ── UPDATE ───────────────────────────────────────────────

  async updateSession(sessionId: string, patch: Partial<GameSession>): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, { ...patch, updatedAt: Date.now() });
  }

  // ── DELETE ───────────────────────────────────────────────

  async deleteSession(sessionId: string): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await deleteDoc(ref);
  }

  // ── Helpers ──────────────────────────────────────────────

  /**
   * Firestore increment helper.
   * Returns the FieldValue so it can be used in updateDoc.
   */
  private increment(_field: string): unknown {
    // Dynamically import to avoid top-level bundle issues
    // In practice, use `increment(1)` from firebase/firestore
    // For now, return a placeholder — will wire up properly with FieldValue
    return 1; // TODO: replace with `increment(1)` from @angular/fire/firestore
  }

  private decrement(_field: string): unknown {
    return -1; // TODO: replace with `increment(-1)`
  }
}
