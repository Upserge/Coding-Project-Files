import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostCardComponent } from '../../../shared/components/post-card/post-card';
import { SubscribeFormComponent } from '../../../shared/components/subscribe-form/subscribe-form';
import { LocationMarqueeComponent } from '../../../shared/components/location-marquee/location-marquee';
import { AosDirective } from '../../../shared/directives/aos.directive';
import { PostsService } from '../../../core/services/posts.service';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PostCardComponent, SubscribeFormComponent, LocationMarqueeComponent, AosDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private postsService = inject(PostsService);
  protected recentPosts = signal<Post[]>([]);
  protected error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const posts = await this.postsService.getRecentPublished(3);
      this.recentPosts.set(posts);
    } catch (e) {
      console.error('Failed to load recent posts:', e);
      this.error.set('Failed to load recent posts.');
    }
  }
}
