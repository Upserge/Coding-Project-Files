import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../services/session.service';
import { IdentityService } from '../services/identity.service';
import { PlayerService } from '../services/player.service';
import { UsernameModalComponent } from '../username-modal/username-modal';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [UsernameModalComponent],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class MenuComponent {
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);
  private readonly identity = inject(IdentityService);
  private readonly playerService = inject(PlayerService);

  protected readonly showModal = signal(false);
  protected readonly isJoining = signal(false);
  protected readonly errorMsg = signal('');

  /** Quick Play: prompt for name if needed, then join a session. */
  async quickPlay(): Promise<void> {
    if (!this.identity.hasUsername()) {
      this.showModal.set(true);
      return;
    }
    await this.joinAndNavigate();
  }

  /** Called when the modal confirms a valid unique name. */
  async onNameConfirmed(_name: string): Promise<void> {
    this.showModal.set(false);
    await this.joinAndNavigate();
  }

  onModalCancelled(): void {
    this.showModal.set(false);
  }

  private async joinAndNavigate(): Promise<void> {
    this.isJoining.set(true);
    this.errorMsg.set('');
    let step = 'init';
    try {
      step = 'cleanStale';
      await this.sessionService.removePlayerFromAllSessions();

      step = 'findOrCreate';
      const sessionId = await this.sessionService.findOrCreateSession();

      step = 'getSession';
      const session = await firstValueFrom(
        this.sessionService.getSession$(sessionId),
      );

      step = 'assignRole';
      const hiderCount = session?.hiderCount ?? 0;
      const hunterCount = session?.hunterCount ?? 0;
      const takenAnimals = Object.values(session?.players ?? {})
        .filter(Boolean)
        .map((p: any) => p.animal);

      const role = this.playerService.assignRole(hiderCount, hunterCount);
      const animal = this.playerService.assignAnimal(role, takenAnimals);
      const player = this.playerService.createPlayerState(
        role, animal, { x: 0, y: 0, z: 0 },
      );

      step = 'joinSession';
      await this.sessionService.joinSession(sessionId, player);

      step = 'navigate';
      await this.router.navigate(['/lobby', sessionId]);
    } catch (err: any) {
      console.error(`[QuickPlay] Failed at step="${step}":`, err);
      const detail = err?.code ? `${err.code}: ${err.message}` : (err?.message ?? String(err));
      this.errorMsg.set(`Join failed at "${step}": ${detail}`);
    } finally {
      this.isJoining.set(false);
    }
  }
}
