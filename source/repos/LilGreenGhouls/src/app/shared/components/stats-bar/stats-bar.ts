import { Component } from '@angular/core';

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  templateUrl: './stats-bar.html',
  styleUrl: './stats-bar.css',
})
export class StatsBarComponent {
  readonly stats = [
    { value: '12+', label: 'Investigations', icon: '🔦' },
    { value: '200+', label: 'Photos Captured', icon: '📸' },
    { value: '48+', label: 'Hours in the Dark', icon: '🌙' },
    { value: '8', label: 'Locations Explored', icon: '🏚️' },
  ];
}
