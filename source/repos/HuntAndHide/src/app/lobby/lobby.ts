import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../services/session.service';
import { IdentityService } from '../services/identity.service';
import { GameSession } from '../models/session.model';
import { PlayerState } from '../models/player.model';

@Component({
  selector: 'app-lobby',
  standalone: true,
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class LobbyComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);
  private readonly identity = inject(IdentityService);

  protected readonly session = signal<GameSession | undefined>(undefined);
  protected readonly players = signal<PlayerState[]>([]);
  protected readonly isHost = signal(false);
  protected readonly sessionId = signal('');

  private sub?: Subscription;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private ghostCleanupDone = false;

  private static readonly HEARTBEAT_MS = 10_000;
  private static readonly GHOST_THRESHOLD_MS = 30_000;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sessionId') ?? '';
    this.sessionId.set(id);
    this.sub = this.sessionService.getSession$(id).subscribe(session => this.handleSessionUpdate(id, session));
  }

  ngOnDestroy(): void {
    this.stopHeartbeat();
    this.sub?.unsubscribe();
  }

  async startGame(): Promise<void> {
    const id = this.sessionId();
    await this.sessionService.updateSession(id, { phase: 'hunting' });
    await this.router.navigate(['/game', id]);
  }

  async leaveSession(): Promise<void> {
    const uid = this.identity.getToken();
    const player = this.players().find(p => p.uid === uid);
    await this.removeLocalPlayer(player, uid);
    await this.router.navigate(['/']);
  }

  private startHeartbeat(sessionId: string): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      this.sessionService.updateSession(sessionId, {}).catch(() => {});
    }, LobbyComponent.HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (!this.heartbeatTimer) return;
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  private async cleanGhostsAndPromote(
    sessionId: string,
    players: PlayerState[],
    localToken: string,
  ): Promise<void> {
    for (const p of players) {
      if (p.uid === localToken) continue;
      await this.sessionService.removePlayer(sessionId, p.uid, p.role).catch(() => {});
    }
    await this.sessionService.updateSession(sessionId, { hostUid: localToken }).catch(() => {});
  }

  private handleSessionUpdate(sessionId: string, session: GameSession | undefined): void {
    if (!session) return;
    const playerList = this.syncSessionSignals(session);
    const localToken = this.identity.getToken();
    this.promoteMissingHost(sessionId, session, playerList, localToken);
    this.cleanupGhostHost(sessionId, session, playerList, localToken);
    this.syncHostState(session, localToken);
    this.syncHeartbeat(sessionId);
  }

  private syncSessionSignals(session: GameSession): PlayerState[] {
    this.session.set(session);
    const playerList = Object.values(session.players ?? {}).filter(Boolean) as PlayerState[];
    this.players.set(playerList);
    return playerList;
  }

  private promoteMissingHost(
    sessionId: string,
    session: GameSession,
    players: PlayerState[],
    localToken: string,
  ): void {
    if (players.some(p => p.uid === session.hostUid)) return;
    if (!players.some(p => p.uid === localToken)) return;
    this.sessionService.updateSession(sessionId, { hostUid: localToken }).catch(() => {});
  }

  private cleanupGhostHost(
    sessionId: string,
    session: GameSession,
    players: PlayerState[],
    localToken: string,
  ): void {
    if (this.isLocalHost(session, localToken)) return;
    if (this.ghostCleanupDone) return;
    if (!this.isGhostSession(session)) return;
    this.ghostCleanupDone = true;
    this.cleanGhostsAndPromote(sessionId, players, localToken);
  }

  private syncHostState(session: GameSession, localToken: string): void {
    this.isHost.set(this.isLocalHost(session, localToken));
  }

  private syncHeartbeat(sessionId: string): void {
    if (this.isHost()) return this.startHeartbeat(sessionId);
    this.stopHeartbeat();
  }

  private isLocalHost(session: GameSession, localToken: string): boolean {
    return session.hostUid === localToken;
  }

  private isGhostSession(session: GameSession): boolean {
    const lastActivity = Date.now() - (session.updatedAt ?? session.createdAt ?? 0);
    return lastActivity > LobbyComponent.GHOST_THRESHOLD_MS;
  }

  private async removeLocalPlayer(player: PlayerState | undefined, uid: string): Promise<void> {
    if (!player) return;
    await this.sessionService.removePlayer(this.sessionId(), uid, player.role);
  }
}
