import { Component, input, output } from '@angular/core';

/** Option F — floating home controls (score, palette, shortcuts, theme). */
@Component({
  selector: 'app-home-hud',
  standalone: true,
  templateUrl: './home-hud.component.html',
  styleUrl: './home-hud.component.css',
})
export class HomeHudComponent {
  readonly score = input(0);
  readonly showSessionScore = input(false);
  readonly isDarkMode = input(true);

  readonly showCommandPalette = output<void>();
  readonly showShortcuts = output<void>();
  readonly toggleTheme = output<void>();
  readonly showLeaderboard = output<void>();
}
