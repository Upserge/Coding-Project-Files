import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IdentityService } from '../services/identity.service';
import { LeaderboardService } from '../services/leaderboard.service';

@Component({
  selector: 'app-username-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './username-modal.html',
  styleUrl: './username-modal.css',
})
export class UsernameModalComponent {
  private readonly identity = inject(IdentityService);
  private readonly leaderboard = inject(LeaderboardService);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  protected readonly username = signal('');
  protected readonly errorMsg = signal('');
  protected readonly isChecking = signal(false);

  async confirm(): Promise<void> {
    const name = this.username().trim();

    if (name.length < 2 || name.length > 16) {
      this.errorMsg.set('Name must be 2–16 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      this.errorMsg.set('Letters, numbers, and underscores only.');
      return;
    }

    this.isChecking.set(true);
    this.errorMsg.set('');

    try {
      const taken = await this.leaderboard.isUsernameTaken(name);
      if (taken) {
        this.errorMsg.set('That name is already taken.');
        return;
      }

      this.identity.setUsername(name);
      this.confirmed.emit(name);
    } finally {
      this.isChecking.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onInput(value: string): void {
    this.username.set(value);
    this.errorMsg.set('');
  }
}
