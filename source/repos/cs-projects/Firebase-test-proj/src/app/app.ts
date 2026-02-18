import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { TeamsService } from './data/teams/teams.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Firebase-test-proj');

  private readonly teamsService = inject(TeamsService);
  teams$ = this.teamsService.getTeams$();
  teams = toSignal(this.teams$);

  add() {
    this.teamsService.addTeam({ name: 'Warriors', city: 'San Francisco' });
  }
}
