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
    this.status.set('loading');
    this.pushDenied.set(false);
    this.notificationsEnabled.set(false);

    try {
      const email = this.email.trim();
      const addedSubscriber = await this.addEmailSubscriber(email);
      if (!addedSubscriber) {
        return;
      }

      const token = await this.pushService.requestPermissionAndSaveToken(email || undefined);
      this.notificationsEnabled.set(!!token);
      if (!token) {
        this.pushDenied.set(true);
      }

      await this.loadSubscriberPreferences(email);
      this.status.set('success');
      this.email = '';
    } catch {
      this.status.set('error');
    }
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

  private async addEmailSubscriber(email: string): Promise<boolean> {
    if (!email) {
      return true;
    }

    const result = await this.subscribersService.addSubscriber(email);
    if (result !== 'duplicate') {
      return true;
    }

    this.status.set('duplicate');
    return false;
  }

  private async loadSubscriberPreferences(email: string): Promise<void> {
    if (!email) {
      return;
    }

    try {
      const subscriber = await this.subscribersService.findByEmail(email);
      if (!subscriber?.id) {
        return;
      }

      this.subscriberId.set(subscriber.id);
    } catch {
      // Non-admin users may not be allowed to read subscribers.
    }
  }
}
