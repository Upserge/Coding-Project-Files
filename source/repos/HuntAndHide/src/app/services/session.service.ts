import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  increment,
  deleteField,
  onSnapshot,
} from 'firebase/firestore';
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
 * - Auto-scaling (overflow at MAX_PLAYERS_PER_SESSION \u2192 new session)
 * - Role seeding (count hiders/hunters, assign accordingly)
 *
 * Uses raw Firebase SDK functions (not AngularFire wrappers) for
 * compatibility with zoneless change detection.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly firestore: any = inject(Firestore);
  private readonly identity = inject(IdentityService);
  private readonly sessionsCol = collection(this.firestore, 'sessions');

  // \u2500\u2500 READ \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  /** Live-stream of sessions in the lobby phase that aren't full. */
  getOpenSessions$(): Observable<GameSession[]> {
    const q = query(this.sessionsCol, where('phase', '==', 'lobby'));
    return new Observable<GameSession[]>(subscriber => {
      const unsubscribe = onSnapshot(q,
        snapshot => {
          const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GameSession));
          subscriber.next(sessions);
        },
        err => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  /** Live-stream of a single session. */
  getSession$(sessionId: string): Observable<GameSession | undefined> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    return new Observable<GameSession | undefined>(subscriber => {
      const unsubscribe = onSnapshot(ref,
        snapshot => {
          subscriber.next(
            snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as GameSession : undefined,
          );
        },
        err => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  // \u2500\u2500 JOIN / AUTO-SCALE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  /**
   * Find an open session with room, or create a new one.
   * Returns the session ID the player should join.
   */
  async findOrCreateSession(): Promise<string> {
    // Fetch open lobby sessions (one-shot read for matchmaking)
    const q = query(this.sessionsCol, where('phase', '==', 'lobby'));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const session = docSnap.data() as GameSession;
      const playerCount = Object.keys(session.players ?? {}).length;
      const hasRequiredFields =
        typeof session.hiderCount === 'number' &&
        typeof session.hunterCount === 'number';
      if (hasRequiredFields && playerCount < MAX_PLAYERS_PER_SESSION) {
        return docSnap.id;
      }
    }

    // No room anywhere (or only stale sessions) \u2014 spin up a new session
    return this.createSession();
  }

  // \u2500\u2500 CREATE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

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

  // \u2500\u2500 PLAYER MANAGEMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  /** Add a player to a session, seeding role based on current counts. */
  async joinSession(sessionId: string, player: PlayerState): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, {
      [`players.${player.uid}`]: player,
      [`${player.role}Count`]: increment(1),
      updatedAt: Date.now(),
    });
  }

  async removePlayer(sessionId: string, uid: string, role: 'hider' | 'hunter'): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, {
      [`players.${uid}`]: deleteField(),
      [`${role}Count`]: increment(-1),
      updatedAt: Date.now(),
    });
  }

  // \u2500\u2500 UPDATE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  async updateSession(sessionId: string, patch: Partial<GameSession>): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(ref, { ...patch, updatedAt: Date.now() });
  }

  // \u2500\u2500 DELETE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  async deleteSession(sessionId: string): Promise<void> {
    const ref = doc(this.firestore, 'sessions', sessionId);
    await deleteDoc(ref);
  }

  }
