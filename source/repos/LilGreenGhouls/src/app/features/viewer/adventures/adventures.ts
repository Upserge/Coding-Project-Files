import { Component, inject, OnInit, signal } from '@angular/core';
import { PostCardComponent } from '../../../shared/components/post-card/post-card';
import { PostsService } from '../../../core/services/posts.service';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-adventures',
  standalone: true,
  imports: [PostCardComponent],
  templateUrl: './adventures.html',
  styleUrl: './adventures.css',
})
export class AdventuresComponent implements OnInit {
  private postsService = inject(PostsService);

  protected posts = signal<Post[]>([]);
  protected selectedTag = signal<string | null>(null);
  protected allTags = signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    const posts = await this.postsService.getAllPublished();
    this.posts.set(posts);

    const tags = new Set<string>();
    posts.forEach(p => p.tags.forEach(t => tags.add(t)));
    this.allTags.set(Array.from(tags).sort());
  }

  filterByTag(tag: string | null): void {
    this.selectedTag.set(tag);
  }

  get filteredPosts(): Post[] {
    const tag = this.selectedTag();
    if (!tag) return this.posts();
    return this.posts().filter(p => p.tags.includes(tag));
  }
}
