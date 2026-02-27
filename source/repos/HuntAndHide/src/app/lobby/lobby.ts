import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../services/session.service';
import { IdentityService } from '../services/identity.service';
import { PlayerService } from '../services/player.service';
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
  private readonly playerService = inject(PlayerService);

  protected readonly session = signal<GameSession | undefined>(undefined);
  protected readonly players = signal<PlayerState[]>([]);
  protected readonly isHost = signal(false);
  protected readonly isJoining = signal(false);
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

    this.joinSession(id);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private async joinSession(sessionId: string): Promise<void> {
    this.isJoining.set(true);
    try {
      const session = this.session();
      const hiderCount = session?.hiderCount ?? 0;
      const hunterCount = session?.hunterCount ?? 0;
      const takenAnimals = this.players().map(p => p.animal);

      const role = this.playerService.assignRole(hiderCount, hunterCount);
      const animal = this.playerService.assignAnimal(role, takenAnimals);
      const player = this.playerService.createPlayerState(
        role, animal, { x: 0, y: 0, z: 0 },
      );

      await this.sessionService.joinSession(sessionId, player);
    } finally {
      this.isJoining.set(false);
    }
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
