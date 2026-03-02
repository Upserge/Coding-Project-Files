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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sessionId') ?? '';
    this.sessionId.set(id);

    this.sub = this.sessionService.getSession$(id).subscribe(session => {
      if (!session) return;
      this.session.set(session);
      this.isHost.set(session.hostUid === this.identity.getToken());

      const playerMap = session.players ?? {};
      this.players.set(Object.values(playerMap).filter(Boolean) as PlayerState[]);
    });
  }

  ngOnDestroy(): void {
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
}
