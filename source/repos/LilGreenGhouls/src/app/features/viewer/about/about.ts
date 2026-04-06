import { Component } from '@angular/core';
import { SubscribeFormComponent } from '../../../shared/components/subscribe-form/subscribe-form';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [SubscribeFormComponent],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutComponent {
  protected readonly equipment = [
    { icon: '📹', name: 'Night Vision Camera' },
    { icon: '🎙️', name: 'EVP Recorder' },
    { icon: '🌡️', name: 'Thermal Scanner' },
    { icon: '📡', name: 'EMF Detector' },
    { icon: '🔦', name: 'UV Flashlight' },
    { icon: '📸', name: 'Full-Spectrum Camera' },
    { icon: '🧭', name: 'Spirit Box' },
    { icon: '💻', name: 'Analysis Software' },
  ];
}
