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

    this.sub = this.sessionService.getSession$(id).subscribe(session => {
      if (!session) return;
      this.session.set(session);

      const playerMap = session.players ?? {};
      const playerList = Object.values(playerMap).filter(Boolean) as PlayerState[];
      this.players.set(playerList);

      const localToken = this.identity.getToken();
      const hostPresent = playerList.some(p => p.uid === session.hostUid);

      // Auto-promote: if host left the player list, claim host
      if (!hostPresent && playerList.some(p => p.uid === localToken)) {
        this.sessionService.updateSession(id, { hostUid: localToken }).catch(() => {});
      }

      // Ghost detection: if host exists in list but hasn't heartbeated, they're gone
      const isLocalHost = session.hostUid === localToken;
      if (!isLocalHost && !this.ghostCleanupDone) {
        const lastActivity = Date.now() - (session.updatedAt ?? session.createdAt ?? 0);
        if (lastActivity > LobbyComponent.GHOST_THRESHOLD_MS) {
          this.ghostCleanupDone = true;
          this.cleanGhostsAndPromote(id, playerList, localToken);
        }
      }

      this.isHost.set(session.hostUid === localToken);

      // Host heartbeat: keep updatedAt fresh so others know we're alive
      if (this.isHost() && !this.heartbeatTimer) {
        this.startHeartbeat(id);
      } else if (!this.isHost()) {
        this.stopHeartbeat();
      }
    });
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
    if (player) {
      await this.sessionService.removePlayer(this.sessionId(), uid, player.role);
    }
    await this.router.navigate(['/']);
  }

  private startHeartbeat(sessionId: string): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      this.sessionService.updateSession(sessionId, {}).catch(() => {});
    }, LobbyComponent.HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private async cleanGhostsAndPromote(
    sessionId: string,
    players: PlayerState[],
    localToken: string,
  ): Promise<void> {
    for (const p of players) {
      if (p.uid !== localToken) {
        await this.sessionService.removePlayer(sessionId, p.uid, p.role).catch(() => {});
      }
    }
    await this.sessionService.updateSession(sessionId, { hostUid: localToken }).catch(() => {});
  }
}
