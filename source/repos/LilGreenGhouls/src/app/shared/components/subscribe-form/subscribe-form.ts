import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscribersService } from '../../../core/services/subscribers.service';

@Component({
  selector: 'app-subscribe-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subscribe-form.html',
  styleUrl: './subscribe-form.css',
})
export class SubscribeFormComponent {
  private subscribersService = inject(SubscribersService);

  protected email = '';
  protected status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  async subscribe(): Promise<void> {
    if (!this.email.trim()) return;

    this.status.set('loading');
    try {
      await this.subscribersService.addSubscriber(this.email.trim());
      this.status.set('success');
      this.email = '';
    } catch {
      this.status.set('error');
    }
  }
}
