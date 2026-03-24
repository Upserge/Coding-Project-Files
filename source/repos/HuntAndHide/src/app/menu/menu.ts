import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '../services/identity.service';
import { MatchmakingService } from '../services/matchmaking.service';
import { UsernameModalComponent } from '../username-modal/username-modal';
import { CreditsModalComponent } from '../credits-modal/credits-modal';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [UsernameModalComponent, CreditsModalComponent],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class MenuComponent {
  private readonly router = inject(Router);
  private readonly matchmaking = inject(MatchmakingService);
  private readonly identity = inject(IdentityService);

  protected readonly showModal = signal(false);
  protected readonly showCredits = signal(false);
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

  openCredits(): void {
    this.showCredits.set(true);
  }

  closeCredits(): void {
    this.showCredits.set(false);
  }

  private async joinAndNavigate(): Promise<void> {
    this.isJoining.set(true);
    this.errorMsg.set('');
    let step = 'init';
    try {
      step = 'matchmake';
      const sessionId = await this.matchmaking.joinLobby();

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
