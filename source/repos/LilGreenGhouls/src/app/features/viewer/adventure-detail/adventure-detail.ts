import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostsService } from '../../../core/services/posts.service';
import { SubscribeFormComponent } from '../../../shared/components/subscribe-form/subscribe-form';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-adventure-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, SubscribeFormComponent],
  templateUrl: './adventure-detail.html',
  styleUrl: './adventure-detail.css',
})
export class AdventureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private postsService = inject(PostsService);

  protected post = signal<Post | null>(null);
  protected loading = signal(true);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      const post = await this.postsService.getBySlug(slug);
      this.post.set(post);
    }
    this.loading.set(false);
  }
}
