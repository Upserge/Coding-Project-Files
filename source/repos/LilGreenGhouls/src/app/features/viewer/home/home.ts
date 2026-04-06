import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostCardComponent } from '../../../shared/components/post-card/post-card';
import { SubscribeFormComponent } from '../../../shared/components/subscribe-form/subscribe-form';
import { PostsService } from '../../../core/services/posts.service';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PostCardComponent, SubscribeFormComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private postsService = inject(PostsService);
  protected recentPosts = signal<Post[]>([]);

  async ngOnInit(): Promise<void> {
    const posts = await this.postsService.getRecentPublished(3);
    this.recentPosts.set(posts);
  }
}
