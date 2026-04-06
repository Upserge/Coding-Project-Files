import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SubscribersService } from '../../../core/services/subscribers.service';
import { Subscriber } from '../../../core/models/subscriber.model';

@Component({
  selector: 'app-subscriber-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './subscriber-list.html',
  styleUrl: './subscriber-list.css',
})
export class SubscriberListComponent implements OnInit {
  private subscribersService = inject(SubscribersService);
  protected subscribers = signal<Subscriber[]>([]);

  async ngOnInit(): Promise<void> {
    const subs = await this.subscribersService.getAll();
    this.subscribers.set(subs);
  }

  async removeSubscriber(id: string): Promise<void> {
    await this.subscribersService.remove(id);
    this.subscribers.update(list => list.filter(s => s.id !== id));
  }
}
