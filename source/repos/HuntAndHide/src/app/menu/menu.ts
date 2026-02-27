import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameDataService } from '../data/game-data.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class MenuComponent {
  private readonly router = inject(Router);
  private readonly gameData = inject(GameDataService);

  protected readonly playerName = signal('Player');
  protected readonly isCreating = signal(false);

  async createGame(): Promise<void> {
    this.isCreating.set(true);
    try {
      // TODO: replace placeholder UID with real auth uid
      const sessionId = await this.gameData.createSession('anonymous');
      await this.router.navigate(['/game', sessionId]);
    } finally {
      this.isCreating.set(false);
    }
  }

  quickPlay(): void {
    // TODO: matchmaking — for now just create a new session
    this.createGame();
  }
}
