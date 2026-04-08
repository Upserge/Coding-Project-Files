import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommentsService } from '../../../core/services/comments.service';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './comment-form.html',
  styleUrl: './comment-form.css',
})
export class CommentFormComponent {
  private commentsService = inject(CommentsService);

  postId = input.required<string>();
  commentSubmitted = output<void>();

  protected authorName = signal('');
  protected authorEmail = signal('');
  protected content = signal('');
  protected submitting = signal(false);
  protected submitted = signal(false);
  protected error = signal<string | null>(null);

  async submit(): Promise<void> {
    const name = this.authorName().trim();
    const email = this.authorEmail().trim();
    const body = this.content().trim();

    if (!name || !email || !body) {
      this.error.set('Please fill in all fields.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.commentsService.addComment(this.postId(), {
        authorName: name,
        authorEmail: email,
        content: body,
      });
      this.submitted.set(true);
      this.authorName.set('');
      this.authorEmail.set('');
      this.content.set('');
      this.commentSubmitted.emit();
    } catch {
      this.error.set('Failed to submit comment. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
