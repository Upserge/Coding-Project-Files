import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostsService } from '../../../core/services/posts.service';
import { SubscribersService } from '../../../core/services/subscribers.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private postsService = inject(PostsService);
  private subscribersService = inject(SubscribersService);

  protected publishedCount = signal(0);
  protected draftCount = signal(0);
  protected subscriberCount = signal(0);

  async ngOnInit(): Promise<void> {
    const [published, drafts, subs] = await Promise.all([
      this.postsService.getCountByStatus('published'),
      this.postsService.getCountByStatus('draft'),
      this.subscribersService.getActiveCount(),
    ]);
    this.publishedCount.set(published);
    this.draftCount.set(drafts);
    this.subscriberCount.set(subs);
  }
}
