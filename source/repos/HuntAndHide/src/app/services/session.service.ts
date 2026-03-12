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
  private static readonly STALE_AGE_MS = 10 * 60 * 1000;
  private static readonly INACTIVE_MS = 30 * 1000;

  // \u2500\u2500 READ \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  /** Live-stream of sessions in the lobby phase that aren't full. */
  getOpenSessions$(): Observable<GameSession[]> {
    const q = this.getLobbyQuery();
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
    const ref = this.getSessionRef(sessionId);
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
    const snapshot = await getDocs(this.getLobbyQuery());
    const now = Date.now();

    for (const docSnap of snapshot.docs) {
      const session = docSnap.data() as GameSession;
      if (this.isStaleSession(session, now)) {
        this.deleteSessionSilently(docSnap.ref);
        continue;
      }
      if (this.isJoinableSession(session)) return docSnap.id;
    }

    return this.createSession();
  }

  // \u2500\u2500 CREATE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  async createSession(config: SessionConfig = DEFAULT_SESSION_CONFIG): Promise<string> {
    const session = this.buildSessionDocument(config);
    const ref = await addDoc(this.sessionsCol, session);
    return ref.id;
  }

  // \u2500\u2500 PLAYER MANAGEMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  /** Add a player to a session, seeding role based on current counts. */
  async joinSession(sessionId: string, player: PlayerState): Promise<void> {
    const ref = this.getSessionRef(sessionId);
    await updateDoc(ref, {
      [`players.${player.uid}`]: player,
      [`${player.role}Count`]: increment(1),
      updatedAt: Date.now(),
    });
  }

  async removePlayer(sessionId: string, uid: string, role: 'hider' | 'hunter'): Promise<void> {
    await updateDoc(this.getSessionRef(sessionId), this.buildPlayerRemovalPatch(uid, role, true));
  }

  /** Remove the current player from every lobby session (pre-join cleanup).
   *  Does NOT bump updatedAt so stale detection remains accurate. */
  async removePlayerFromAllSessions(): Promise<void> {
    const uid = this.identity.getToken();
    const snapshot = await getDocs(this.getLobbyQuery());

    for (const docSnap of snapshot.docs) {
      const session = docSnap.data() as GameSession;
      const role = this.getPlayerRole(session, uid);
      if (!role) continue;
      await updateDoc(this.getSessionRef(docSnap.id), this.buildPlayerRemovalPatch(uid, role, false)).catch(() => {});
    }
  }

  // \u2500\u2500 UPDATE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  async updateSession(sessionId: string, patch: Partial<GameSession>): Promise<void> {
    await updateDoc(this.getSessionRef(sessionId), { ...patch, updatedAt: Date.now() });
  }

  // \u2500\u2500 DELETE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  async deleteSession(sessionId: string): Promise<void> {
    await deleteDoc(this.getSessionRef(sessionId));
  }

  private getLobbyQuery() {
    return query(this.sessionsCol, where('phase', '==', 'lobby'));
  }

  private getSessionRef(sessionId: string) {
    return doc(this.firestore, 'sessions', sessionId);
  }

  private isStaleSession(session: GameSession, now: number): boolean {
    const createdAge = now - (session.createdAt ?? 0);
    const lastActivity = now - (session.updatedAt ?? session.createdAt ?? 0);
    return createdAge > SessionService.STALE_AGE_MS || lastActivity > SessionService.INACTIVE_MS;
  }

  private isJoinableSession(session: GameSession): boolean {
    const playerCount = Object.keys(session.players ?? {}).length;
    const hasCounts = typeof session.hiderCount === 'number' && typeof session.hunterCount === 'number';
    return hasCounts && playerCount < MAX_PLAYERS_PER_SESSION;
  }

  private buildSessionDocument(config: SessionConfig): Omit<GameSession, 'id'> {
    const now = Date.now();
    return {
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
  }

  private deleteSessionSilently(ref: ReturnType<typeof doc>): void {
    deleteDoc(ref).catch(() => {});
  }

  private getPlayerRole(session: GameSession, uid: string): 'hider' | 'hunter' | undefined {
    return session.players?.[uid]?.role as 'hider' | 'hunter' | undefined;
  }

  private buildPlayerRemovalPatch(
    uid: string,
    role: 'hider' | 'hunter',
    includeUpdatedAt: boolean,
  ) {
    const patch = {
      [`players.${uid}`]: deleteField(),
      [`${role}Count`]: increment(-1),
    };
    if (!includeUpdatedAt) return patch;
    return { ...patch, updatedAt: Date.now() };
  }

  }
