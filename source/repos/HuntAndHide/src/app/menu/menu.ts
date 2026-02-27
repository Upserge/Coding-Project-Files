import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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

  /** Quick Play: prompt for name if needed, then join a session. */
  quickPlay(): void {
    if (!this.identity.hasUsername()) {
      this.showModal.set(true);
      return;
    }
    this.joinAndNavigate();
  }

  /** Called when the modal confirms a valid unique name. */
  onNameConfirmed(_name: string): void {
    this.showModal.set(false);
    this.joinAndNavigate();
  }

  onModalCancelled(): void {
    this.showModal.set(false);
  }

  private async joinAndNavigate(): Promise<void> {
    this.isJoining.set(true);
    try {
      const sessionId = await this.sessionService.findOrCreateSession();

      // Read session snapshot to determine role assignment
      const session = await new Promise<any>((resolve) => {
        const sub = this.sessionService.getSession$(sessionId).subscribe(s => {
          sub.unsubscribe();
          resolve(s);
        });
      });

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

      await this.sessionService.joinSession(sessionId, player);
      await this.router.navigate(['/game', sessionId]);
    } finally {
      this.isJoining.set(false);
    }
  }
}
