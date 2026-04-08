import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommentsService } from '../../../core/services/comments.service';
import { Comment } from '../../../core/models/comment.model';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './comment-list.html',
  styleUrl: './comment-list.css',
})
export class CommentListComponent implements OnInit {
  private commentsService = inject(CommentsService);

  postId = input.required<string>();

  protected comments = signal<Comment[]>([]);
  protected loading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.loadComments();
  }

  async loadComments(): Promise<void> {
    this.loading.set(true);
    try {
      const comments = await this.commentsService.getApproved(this.postId());
      this.comments.set(comments);
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      this.loading.set(false);
    }
  }
}
