import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LeaderboardService } from '../services/leaderboard.service';
import { GameLoopService } from '../services/game-loop.service';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { PlayerState } from '../models/player.model';
import { RoundMvp, RoundMvps, RoundWinner } from '../models/session.model';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [],
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.css',
})
export class ScoreboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly gameLoop = inject(GameLoopService);

  protected readonly roundPlayers = signal<PlayerState[]>([]);
  protected readonly topScores = signal<LeaderboardEntry[]>([]);
  protected readonly mvp = signal<RoundMvp | null>(null);
  protected readonly mvps = signal<RoundMvps | null>(null);
  protected readonly winner = signal<RoundWinner>(null);

  ngOnInit(): void {
    const allPlayers: PlayerState[] = [
      ...this.gameLoop.hiders(),
      ...this.gameLoop.hunters(),
    ];
    this.roundPlayers.set(
      allPlayers.sort((a, b) => b.score - a.score),
    );

    this.mvp.set(this.gameLoop.roundMvp());
    this.mvps.set(this.gameLoop.roundMvps());
    this.winner.set(this.gameLoop.roundWinner());

    this.leaderboard.getLeaderboard$().subscribe(entries => {
      this.topScores.set(
        entries.sort((a, b) => b.highScore - a.highScore).slice(0, 10),
      );
    });
  }

  async playAgain(): Promise<void> {
    await this.router.navigate(['/']);
  }
}
