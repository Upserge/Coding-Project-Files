import { Component, inject, computed } from '@angular/core';
import { GameLoopService } from '../services/game-loop.service';
import { EndOfGameService } from '../services/end-of-game.service';
import { ScoreboardEntry } from '../models/scoreboard.model';

@Component({
  selector: 'app-game-scoreboard',
  standalone: true,
  templateUrl: './game-scoreboard.html',
  styleUrl: './game-scoreboard.css',
})
export class GameScoreboardComponent {
  private readonly endOfGame = inject(EndOfGameService);

  /**
   * Computed signal — rebuilds only when hiders()/hunters() change.
   * Uses the same ScoreboardEntry shape that Firestore will persist,
   * guaranteeing display ↔ storage parity.
   */
  protected readonly entries = computed<ScoreboardEntry[]>(() =>
    this.endOfGame.buildScoreboard()
  );

  protected readonly playerCount = computed(() => this.entries().length);

  protected roleIcon(entry: ScoreboardEntry): string {
    return entry.role === 'hunter' ? '🐺' : '🌿';
  }

  protected statusLabel(entry: ScoreboardEntry): string {
    if (entry.role === 'hider' && entry.isCaught) return 'Caught';
    if (!entry.isAlive) return 'Dead';
    return 'Alive';
  }
}
