import { Component } from '@angular/core';

@Component({
  selector: 'app-location-marquee',
  standalone: true,
  templateUrl: './location-marquee.html',
  styleUrl: './location-marquee.css',
})
export class LocationMarqueeComponent {
  readonly locations = [
    { icon: '🏚️', name: 'Our own fuckin house' },
    { icon: '🏰', name: 'The Queen Mary' },
    { icon: '👻', name: 'Solvang' },
    { icon: '🕯️', name: 'Winchester Mystery House: SOON' },
    { icon: '⚰️', name: 'Some random Insane Asylum in Kentucky: SOON' },
    { icon: '🦇', name: 'Charleston, South Carolina ig: SOON' },
    { icon: '🔦', name: 'Alcatraz: SOON' },
    { icon: '💀', name: 'Crescent Hotel, also Arkansas: SOON' },
    { icon: '🕸️', name: 'Pismo Beach' },
    { icon: '🌙', name: 'Angel Island' },
  ];
}
