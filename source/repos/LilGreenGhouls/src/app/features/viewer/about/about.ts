import { Component } from '@angular/core';
import { AosDirective } from '../../../shared/directives/aos.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [AosDirective],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutComponent {
  protected readonly equipment = [
    { icon: '📹', name: 'Night Vision Camera' },
    { icon: '🎙️', name: 'EVP Recorder' },
    { icon: '🌡️', name: 'Thermal Scanner' },
    { icon: '📡', name: 'EMF Detector' },
    { icon: '🪵', name: 'Stake' },
    { icon: '🧄', name: 'Garlic' },
    { icon: '⭕', name: 'Anti-Sea-Bear Circle' },
    { icon: '🩲', name: 'Anti-Sea-Bear Underwear' },
  ];

  protected onCardMouseMove(event: MouseEvent): void {
    const card = (event.currentTarget as HTMLElement);
    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 12;
    const rotateX = ((centerY - y) / centerY) * 12;

    const shineX = (x / rect.width) * 100;
    const shineY = (y / rect.height) * 100;
    const shineAngle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;

    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
    card.style.setProperty('--shine-x', `${shineX}%`);
    card.style.setProperty('--shine-y', `${shineY}%`);
    card.style.setProperty('--shine-angle', `${shineAngle}deg`);
    card.style.setProperty('--holo-opacity', '1');
  }

  protected onCardMouseLeave(event: MouseEvent): void {
    const card = (event.currentTarget as HTMLElement);
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--holo-opacity', '0');
  }
}
