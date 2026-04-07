import { Component, inject } from '@angular/core';
import { FooterComponent } from '../footer/footer';

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
    { value: '9', label: 'Bangers penned', icon: '🌙' },
    { value: '8', label: 'Locations Explored', icon: '🏚️' },
  ];
}
