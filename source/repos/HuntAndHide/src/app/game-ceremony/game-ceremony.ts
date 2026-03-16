import { Component, inject } from '@angular/core';
import { GameCeremonyService } from '../services/game-ceremony.service';

@Component({
  selector: 'app-game-ceremony',
  standalone: true,
  templateUrl: './game-ceremony.html',
  styleUrl: './game-ceremony.css',
})
export class GameCeremonyComponent {
  private readonly ceremony = inject(GameCeremonyService);

  protected readonly step = this.ceremony.activeStep;
}
