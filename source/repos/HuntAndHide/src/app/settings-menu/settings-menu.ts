import { Component, input, output } from '@angular/core';

export interface SettingsMenuItem {
  label: string;
  icon: string;
  action: string;
}

const MENU_ITEMS: SettingsMenuItem[] = [
  { label: 'Rules', icon: '📖', action: 'rules' },
  { label: 'Fullscreen', icon: '⛶', action: 'fullscreen' },
  { label: 'Leave Game', icon: '🚪', action: 'leave' },
];

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  templateUrl: './settings-menu.html',
  styleUrl: './settings-menu.css',
})
export class SettingsMenuComponent {
  readonly isFullscreen = input(false);

  readonly closed = output<void>();
  readonly leaveGame = output<void>();
  readonly showRules = output<void>();
  readonly toggleFullscreen = output<void>();

  protected readonly menuItems = MENU_ITEMS;

  protected onItemClick(action: string): void {
    const handler = this.actionHandlers[action];
    handler?.();
  }

  protected getFullscreenLabel(): string {
    return this.isFullscreen() ? 'Exit Fullscreen' : 'Fullscreen';
  }

  protected close(): void {
    this.closed.emit();
  }

  private readonly actionHandlers: Record<string, () => void> = {
    rules: () => this.showRules.emit(),
    fullscreen: () => this.toggleFullscreen.emit(),
    leave: () => this.leaveGame.emit(),
  };
}
