import { Component } from '@angular/core';

@Component({
  selector: 'app-location-marquee',
  standalone: true,
  templateUrl: './location-marquee.html',
  styleUrl: './location-marquee.css',
})
export class LocationMarqueeComponent {
  readonly locations = [
    { icon: '🏚️', name: 'Eastern State Penitentiary' },
    { icon: '🏰', name: 'Tower of London' },
    { icon: '👻', name: 'Gettysburg Battlefield' },
    { icon: '🕯️', name: 'Winchester Mystery House' },
    { icon: '⚰️', name: 'St. Augustine Lighthouse' },
    { icon: '🦇', name: 'Bran Castle' },
    { icon: '🔦', name: 'Waverly Hills Sanatorium' },
    { icon: '💀', name: 'Catacombs of Paris' },
    { icon: '🕸️', name: 'Myrtles Plantation' },
    { icon: '🌙', name: 'Alcatraz Island' },
  ];
}
