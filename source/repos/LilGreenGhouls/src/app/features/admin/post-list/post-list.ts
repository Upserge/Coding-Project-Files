import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostsService } from '../../../core/services/posts.service';
import { Post } from '../../../core/models/post.model';
import { getPostAdventureDate } from '../../../core/utils/post-date.util';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './post-list.html',
  styleUrl: './post-list.css',
})
export class PostListComponent implements OnInit {
  private postsService = inject(PostsService);

  protected posts = signal<Post[]>([]);
  protected statusUpdatingIds = signal<Set<string>>(new Set());
  protected statusError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const posts = await this.postsService.getAll();
    this.posts.set(posts);
  }

  protected displayDate(post: Post): Date {
    return getPostAdventureDate(post);
  }

  protected isStatusUpdating(postId: string | undefined): boolean {
    return postId ? this.statusUpdatingIds().has(postId) : false;
  }

  async onStatusChange(post: Post, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as 'draft' | 'published';

    if (newStatus === post.status) {
      return;
    }

    if (newStatus === 'draft' && post.status === 'published') {
      const confirmed = confirm(
        `Unpublish "${post.title}"? It will be hidden from the site but kept as a draft.`,
      );
      if (!confirmed) {
        select.value = post.status;
        return;
      }
    }

    await this.setStatus(post, newStatus, select);
  }

  async deletePost(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      await this.postsService.delete(id);
      this.posts.update(list => list.filter(p => p.id !== id));
    }
  }

  private async setStatus(
    post: Post,
    newStatus: 'draft' | 'published',
    select?: HTMLSelectElement,
  ): Promise<void> {
    const postId = post.id;
    if (!postId) {
      return;
    }

    this.statusError.set(null);
    this.statusUpdatingIds.update(ids => new Set(ids).add(postId));

    const update: Partial<Post> = { status: newStatus };
    if (newStatus === 'published' && !post.publishedAt) {
      update.publishedAt = Timestamp.now();
    }

    try {
      await this.postsService.update(postId, update);
      this.posts.update(list =>
        list.map(p => (p.id === postId ? { ...p, ...update } : p)),
      );
    } catch (error) {
      if (select) {
        select.value = post.status;
      }
      const message = error instanceof Error ? error.message : 'Failed to update status';
      this.statusError.set(message);
    } finally {
      this.statusUpdatingIds.update(ids => {
        const next = new Set(ids);
        next.delete(postId);
        return next;
      });
    }
  }
}
