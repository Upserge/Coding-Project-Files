import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TeamsService } from '../data/teams/teams.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-test-component',
  imports: [AsyncPipe],
  templateUrl: './test-component.html',
  styleUrl: './test-component.css',
})
export class TestComponent {
  private readonly teamsService = inject(TeamsService);
  teams$ = this.teamsService.getTeams$();
  teams = toSignal(this.teams$);

  add() {
    this.teamsService.addTeam({ name: 'Warriors', city: 'San Francisco' });
  }
}
