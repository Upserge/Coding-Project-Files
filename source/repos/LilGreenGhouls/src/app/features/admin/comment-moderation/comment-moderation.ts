import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommentsService } from '../../../core/services/comments.service';
import { Comment } from '../../../core/models/comment.model';

@Component({
  selector: 'app-comment-moderation',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './comment-moderation.html',
  styleUrl: './comment-moderation.css',
})
export class CommentModerationComponent implements OnInit {
  private commentsService = inject(CommentsService);
  protected comments = signal<Comment[]>([]);

  async ngOnInit(): Promise<void> {
    const pending = await this.commentsService.getAllPending();
    this.comments.set(pending);
  }

  async approve(comment: Comment): Promise<void> {
    await this.commentsService.updateStatus(comment.postId, comment.id!, 'approved');
    this.comments.update(list => list.filter(c => c.id !== comment.id));
  }

  async reject(comment: Comment): Promise<void> {
    await this.commentsService.updateStatus(comment.postId, comment.id!, 'rejected');
    this.comments.update(list => list.filter(c => c.id !== comment.id));
  }
}
