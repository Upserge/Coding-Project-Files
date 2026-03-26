import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
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

  private static readonly COUNTDOWN_S = 30;
  private static readonly HEARTBEAT_MS = 10_000;
  private static readonly GHOST_THRESHOLD_MS = 30_000;

  // ── Ready-up state ──────────────────────────────────────────
  protected readonly isReady = signal(false);
  protected readonly readyCount = signal(0);
  protected readonly totalRealPlayers = signal(0);
  protected readonly countdown = signal(LobbyComponent.COUNTDOWN_S);
  protected readonly allReady = computed(() => {
    const total = this.totalRealPlayers();
    return total > 0 && this.readyCount() >= total;
  });
  protected readonly isUrgent = computed(() => this.countdown() <= 10);

  private sub?: Subscription;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private countdownTimer?: ReturnType<typeof setInterval>;
  private ghostCleanupDone = false;
  private gameStarting = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sessionId') ?? '';
    this.sessionId.set(id);
    this.sub = this.sessionService.getSession$(id).subscribe(session => this.handleSessionUpdate(id, session));
  }

  ngOnDestroy(): void {
    this.stopHeartbeat();
    this.stopCountdown();
    this.sub?.unsubscribe();
  }

  async toggleReady(): Promise<void> {
    const id = this.sessionId();
    const uid = this.identity.getToken();
    this.isReady() ? await this.unready(id, uid) : await this.ready(id, uid);
  }

  async leaveSession(): Promise<void> {
    const uid = this.identity.getToken();
    await this.unready(this.sessionId(), uid).catch(() => {});
    const player = this.players().find(p => p.uid === uid);
    await this.removeLocalPlayer(player, uid);
    await this.router.navigate(['/']);
  }

  // ── Ready helpers ───────────────────────────────────────────

  private async ready(sessionId: string, uid: string): Promise<void> {
    this.isReady.set(true);
    await this.sessionService.setPlayerReady(sessionId, uid);
  }

  private async unready(sessionId: string, uid: string): Promise<void> {
    this.isReady.set(false);
    await this.sessionService.setPlayerUnready(sessionId, uid);
  }

  // ── Countdown timer ─────────────────────────────────────────

  private startCountdown(): void {
    if (this.countdownTimer) return;
    this.countdown.set(LobbyComponent.COUNTDOWN_S);
    this.countdownTimer = setInterval(() => this.tickCountdown(), 1_000);
  }

  private tickCountdown(): void {
    const next = this.countdown() - 1;
    this.countdown.set(Math.max(next, 0));
    if (next > 0) return;
    this.stopCountdown();
    this.tryStartGame();
  }

  private stopCountdown(): void {
    if (!this.countdownTimer) return;
    clearInterval(this.countdownTimer);
    this.countdownTimer = undefined;
  }

  // ── Auto-start ──────────────────────────────────────────────

  private tryStartGame(): void {
    if (this.gameStarting) return;
    if (this.totalRealPlayers() < 1) return;
    this.gameStarting = true;
    this.launchGame();
  }

  private async launchGame(): Promise<void> {
    const id = this.sessionId();
    await this.sessionService.updateSession(id, { phase: 'hunting' });
    await this.router.navigate(['/game', id]);
  }

  // ── Heartbeat ───────────────────────────────────────────────

  private startHeartbeat(sessionId: string): void {
    if (this.heartbeatTimer) return;
    this.sessionService.sendHeartbeat(sessionId).catch(() => {});
    this.heartbeatTimer = setInterval(() => {
      this.sessionService.sendHeartbeat(sessionId).catch(() => {});
    }, LobbyComponent.HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (!this.heartbeatTimer) return;
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  // ── Ghost cleanup ──────────────────────────────────────────

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

  // ── Session snapshot handler ────────────────────────────────

  private handleSessionUpdate(sessionId: string, session: GameSession | undefined): void {
    if (!session) return;
    if (this.shouldNavigateToGame(session)) return void this.navigateToGame(sessionId);
    const playerList = this.syncSessionSignals(session);
    const localToken = this.identity.getToken();
    this.promoteMissingHost(sessionId, session, playerList, localToken);
    this.cleanupGhostHost(sessionId, session, playerList, localToken);
    this.syncHostState(session, localToken);
    this.syncHeartbeat(sessionId);
    this.syncReadyState(session);
    this.checkAutoStart();
  }

  private shouldNavigateToGame(session: GameSession): boolean {
    return session.phase === 'hunting' && !this.gameStarting;
  }

  private navigateToGame(sessionId: string): void {
    this.gameStarting = true;
    this.router.navigate(['/game', sessionId]);
  }

  private syncSessionSignals(session: GameSession): PlayerState[] {
    this.session.set(session);
    const playerList = Object.values(session.players ?? {}).filter(Boolean) as PlayerState[];
    this.players.set(playerList);
    return playerList;
  }

  private syncReadyState(session: GameSession): void {
    const readyMap = session.readyPlayers ?? {};
    const playerList = this.players();
    this.readyCount.set(Object.keys(readyMap).length);
    this.totalRealPlayers.set(playerList.length);
    this.isReady.set(!!readyMap[this.identity.getToken()]);
    this.startCountdownIfNeeded(playerList.length);
  }

  private startCountdownIfNeeded(playerCount: number): void {
    if (playerCount < 1) return;
    this.startCountdown();
  }

  private checkAutoStart(): void {
    if (!this.allReady()) return;
    this.tryStartGame();
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
    const lastActivity = Date.now() - (session.heartbeatAt ?? session.updatedAt ?? session.createdAt ?? 0);
    return lastActivity > LobbyComponent.GHOST_THRESHOLD_MS;
  }

  private async removeLocalPlayer(player: PlayerState | undefined, uid: string): Promise<void> {
    if (!player) return;
    await this.sessionService.removePlayer(this.sessionId(), uid, player.role);
  }
}
