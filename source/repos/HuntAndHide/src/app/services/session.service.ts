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
  runTransaction,
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
          const sessions = this.getJoinableSessions(snapshot.docs, Date.now());
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
    const [sessionId] = await this.findJoinableSessionIds();
    if (sessionId) return sessionId;

    return this.createSession();
  }

  async findJoinableSessionIds(): Promise<string[]> {
    const snapshot = await getDocs(this.getLobbyQuery());
    return this.getJoinableSessions(snapshot.docs, Date.now()).map(session => session.id ?? '');
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
    await updateDoc(ref, this.buildPlayerJoinPatch(player));
  }

  async tryJoinSession(
    sessionId: string,
    createPlayer: (session: GameSession) => PlayerState,
  ): Promise<PlayerState | undefined> {
    const ref = this.getSessionRef(sessionId);

    return runTransaction(this.firestore, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) return undefined;

      const session = { id: snapshot.id, ...snapshot.data() } as GameSession;
      if (this.isStaleSession(session, Date.now())) {
        transaction.delete(ref);
        return undefined;
      }
      if (!this.isJoinableSession(session)) return undefined;

      const existingPlayer = session.players?.[this.identity.getToken()];
      if (existingPlayer) return existingPlayer;

      const player = createPlayer(session);
      transaction.update(ref, this.buildPlayerJoinPatch(player));
      return player;
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
    const now = Date.now();

    for (const docSnap of snapshot.docs) {
      const session = docSnap.data() as GameSession;
      if (this.isStaleSession(session, now)) {
        this.deleteSessionSilently(docSnap.ref);
        continue;
      }
      const role = this.getPlayerRole(session, uid);
      if (!role) continue;
      await updateDoc(this.getSessionRef(docSnap.id), this.buildPlayerRemovalPatch(uid, role, false)).catch(() => {});
    }
  }

  async sendHeartbeat(sessionId: string): Promise<void> {
    const now = Date.now();
    await updateDoc(this.getSessionRef(sessionId), { heartbeatAt: now, updatedAt: now });
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
    const lastHeartbeat = now - this.getHeartbeatAt(session);
    if (lastHeartbeat > SessionService.INACTIVE_MS) return true;
    if (this.hasPlayers(session)) return false;
    return now - (session.createdAt ?? 0) > SessionService.STALE_AGE_MS;
  }

  private isJoinableSession(session: GameSession): boolean {
    const hasCounts = typeof session.hiderCount === 'number' && typeof session.hunterCount === 'number';
    return hasCounts && this.getPlayerCount(session) < MAX_PLAYERS_PER_SESSION;
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
      heartbeatAt: now,
      updatedAt: now,
    };
  }

  private deleteSessionSilently(ref: ReturnType<typeof doc>): void {
    deleteDoc(ref).catch(() => {});
  }

  private getJoinableSessions(docSnaps: any[], now: number): GameSession[] {
    return docSnaps
      .filter(docSnap => this.shouldKeepJoinableSession(docSnap, now))
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as GameSession))
      .sort((left, right) => this.getSessionCreatedAt(left) - this.getSessionCreatedAt(right));
  }

  private shouldKeepJoinableSession(docSnap: any, now: number): boolean {
    const session = docSnap.data() as GameSession;
    if (this.isStaleSession(session, now)) {
      this.deleteSessionSilently(docSnap.ref);
      return false;
    }
    return this.isJoinableSession(session);
  }

  private getSessionCreatedAt(session: GameSession): number {
    return session.createdAt ?? 0;
  }

  private getHeartbeatAt(session: GameSession): number {
    return session.heartbeatAt ?? session.updatedAt ?? session.createdAt ?? 0;
  }

  private getPlayerCount(session: GameSession): number {
    return Object.keys(session.players ?? {}).length;
  }

  private hasPlayers(session: GameSession): boolean {
    return this.getPlayerCount(session) > 0;
  }

  private getPlayerRole(session: GameSession, uid: string): 'hider' | 'hunter' | undefined {
    return session.players?.[uid]?.role as 'hider' | 'hunter' | undefined;
  }

  private buildPlayerJoinPatch(player: PlayerState) {
    return {
      [`players.${player.uid}`]: player,
      [`${player.role}Count`]: increment(1),
      updatedAt: Date.now(),
    };
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
