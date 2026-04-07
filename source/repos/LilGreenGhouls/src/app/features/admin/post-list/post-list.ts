import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostsService } from '../../../core/services/posts.service';
import { Post } from '../../../core/models/post.model';
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

  async ngOnInit(): Promise<void> {
    const posts = await this.postsService.getAll();
    this.posts.set(posts);
  }

  async deletePost(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      await this.postsService.delete(id);
      this.posts.update(list => list.filter(p => p.id !== id));
    }
  }

  async toggleStatus(post: Post): Promise<void> {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const update: Partial<Post> = { status: newStatus };
    if (newStatus === 'published' && !post.publishedAt) {
      update.publishedAt = Timestamp.now();
    }
    await this.postsService.update(post.id!, update);
    this.posts.update(list =>
      list.map(p => p.id === post.id ? { ...p, ...update } : p)
    );
  }
}
