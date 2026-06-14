import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectItem } from '../../resume-service';

@Component({
  selector: 'app-work-reel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './work-reel.component.html',
  styleUrl: './work-reel.component.css',
})
export class WorkReelComponent {
  readonly items = input.required<ProjectItem[]>();

  panelAccent(index: number): string {
    const accents = [
      'rgba(124, 92, 255, 0.45)',
      'rgba(245, 158, 11, 0.4)',
      'rgba(94, 234, 212, 0.35)',
      'rgba(192, 132, 252, 0.4)',
      'rgba(239, 68, 68, 0.32)',
    ];
    return accents[index % accents.length];
  }
}
