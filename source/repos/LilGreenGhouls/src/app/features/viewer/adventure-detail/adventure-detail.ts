import { Component, inject, OnInit, signal, viewChild, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DOCUMENT } from '@angular/common';
import { PostsService } from '../../../core/services/posts.service';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox/image-lightbox';
import { SocialShareComponent } from '../../../shared/components/social-share/social-share';
import { CommentFormComponent } from '../../../shared/components/comment-form/comment-form';
import { CommentListComponent } from '../../../shared/components/comment-list/comment-list';
import { SafeResourceUrlPipe } from '../../../shared/pipes/safe-resource-url.pipe';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-adventure-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, ImageLightboxComponent, SocialShareComponent, CommentFormComponent, CommentListComponent, SafeResourceUrlPipe],
  templateUrl: './adventure-detail.html',
  styleUrl: './adventure-detail.css',
})
export class AdventureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private postsService = inject(PostsService);
  private document = inject(DOCUMENT);

  protected post = signal<Post | null>(null);
  protected loading = signal(true);
  protected lightboxOpen = signal(false);

  protected shareUrl = computed(() => {
    const p = this.post();
    if (!p) return '';
    const origin = this.document.location?.origin ?? '';
    return `${origin}/adventures/${p.slug}`;
  });

  protected lastUpdatedAgo = computed(() => {
    const p = this.post();
    if (!p?.updatedAt) return null;
    const updatedDate = p.updatedAt.toDate();
    const publishedDate = p.publishedAt?.toDate();
    // Only show "updated" if the post was updated after being published
    if (publishedDate && updatedDate.getTime() - publishedDate.getTime() < 60_000) return null;
    return this.getTimeAgo(updatedDate);
  });

  private lightbox = viewChild(ImageLightboxComponent);
  private commentList = viewChild(CommentListComponent);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      const post = await this.postsService.getBySlug(slug);
      this.post.set(post);
    }
    this.loading.set(false);
  }

  openLightbox(index: number): void {
    this.lightboxOpen.set(true);
    // Allow the component to render before calling open
    setTimeout(() => this.lightbox()?.open(index));
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  onCommentSubmitted(): void {
    this.commentList()?.loadComments();
  }

  private getTimeAgo(date: Date): string {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return months === 1 ? '1 month ago' : `${months} months ago`;
    if (weeks > 0) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    if (days > 0) return days === 1 ? '1 day ago' : `${days} days ago`;
    if (hours > 0) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    if (minutes > 0) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    return 'just now';
  }
}
