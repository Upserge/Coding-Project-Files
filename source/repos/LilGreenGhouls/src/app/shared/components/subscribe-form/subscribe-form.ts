import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscribersService } from '../../../core/services/subscribers.service';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import {
  NotificationFrequency,
  DEFAULT_SUBSCRIBER_PREFERENCES,
} from '../../../core/models/subscriber-preferences.model';

@Component({
  selector: 'app-subscribe-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subscribe-form.html',
  styleUrl: './subscribe-form.css',
})
export class SubscribeFormComponent {
  private subscribersService = inject(SubscribersService);
  private pushService = inject(PushNotificationService);

  protected email = '';
  protected status = signal<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  protected notificationsEnabled = signal(false);
  protected pushDenied = signal(false);
  protected showPreferences = signal(false);
  protected subscriberId = signal<string | null>(null);

  protected frequency = signal<NotificationFrequency>(DEFAULT_SUBSCRIBER_PREFERENCES.frequency);

  protected readonly availableCategories = ['EVP', 'Haunted Houses', 'Apparitions', 'Equipment Reviews', 'Investigations'];
  protected selectedCategories = signal<string[]>([]);

  async subscribe(): Promise<void> {
    if (!this.email.trim()) return;

    this.status.set('loading');
    let result: 'created' | 'duplicate';
    try {
      result = await this.subscribersService.addSubscriber(this.email.trim());
    } catch {
      this.status.set('error');
      return;
    }

    if (result === 'duplicate') {
      this.status.set('duplicate');
      return;
    }

    // Push notification opt-in is best-effort — don't block subscription on FCM failures
    try {
      const token = await this.pushService.requestPermissionAndSaveToken(this.email.trim());
      this.notificationsEnabled.set(!!token);
      if (!token) {
        this.pushDenied.set(true);
      }
    } catch {
      // FCM may fail (e.g., no VAPID key, denied permissions) — that's OK
      this.notificationsEnabled.set(false);
      this.pushDenied.set(true);
    }

    try {
      const subscriber = await this.subscribersService.findByEmail(this.email.trim());
      if (subscriber?.id) {
        this.subscriberId.set(subscriber.id);
      }
    } catch {
      // Non-critical — preferences panel just won't be available
    }

    this.status.set('success');
    this.email = '';
  }

  protected resetForm(): void {
    this.status.set('idle');
    this.email = '';
    this.pushDenied.set(false);
  }

  togglePreferences(): void {
    this.showPreferences.update(v => !v);
  }

  toggleCategory(category: string): void {
    this.selectedCategories.update(cats =>
      cats.includes(category) ? cats.filter(c => c !== category) : [...cats, category],
    );
  }

  async savePreferences(): Promise<void> {
    const id = this.subscriberId();
    if (!id) return;

    await this.subscribersService.updatePreferences(id, {
      frequency: this.frequency(),
      categories: this.selectedCategories(),
      pushEnabled: this.notificationsEnabled(),
    });
    this.showPreferences.set(false);
  }
}
