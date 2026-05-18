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
import { PostMediaItem } from '../../../core/models/post-media.model';
import { partitionMediaItems, resolvePostMedia } from '../../../core/utils/post-media.util';
import { isVideoUrl } from '../../../core/utils/media-type.util';

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

  protected mediaItems = computed(() => {
    const p = this.post();
    if (!p) return [];
    return resolvePostMedia(p);
  });

  protected audioItems = computed(() => partitionMediaItems(this.mediaItems()).audioItems);

  protected galleryItems = computed(() => partitionMediaItems(this.mediaItems()).galleryItems);

  protected galleryUrls = computed(() => this.galleryItems().map(item => item.url));

  protected hasMedia = computed(() => this.mediaItems().length > 0);

  protected lastUpdatedAgo = computed(() => {
    const p = this.post();
    if (!p?.updatedAt) return null;
    const updatedDate = p.updatedAt.toDate();
    const publishedDate = p.publishedAt?.toDate();
    if (publishedDate && updatedDate.getTime() - publishedDate.getTime() < 60_000) return null;
    return this.getTimeAgo(updatedDate);
  });

  private lightbox = viewChild(ImageLightboxComponent);
  private commentList = viewChild(CommentListComponent);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.loading.set(false);
      return;
    }
    const post = await this.postsService.getBySlug(slug);
    this.post.set(post);
    this.loading.set(false);
  }

  openLightbox(index: number): void {
    this.lightboxOpen.set(true);
    setTimeout(() => this.lightbox()?.open(index));
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  onCommentSubmitted(): void {
    this.commentList()?.loadComments();
  }

  protected isVideoItem(item: PostMediaItem): boolean {
    return item.type === 'video' || isVideoUrl(item.url);
  }

  protected displayTitle(item: PostMediaItem): string | null {
    const title = item.title?.trim();
    return title || null;
  }

  protected displayCaption(item: PostMediaItem): string | null {
    const caption = item.caption?.trim();
    return caption || null;
  }

  private getTimeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    const thresholds: [number, string, string][] = [
      [months, 'month', 'months'],
      [weeks, 'week', 'weeks'],
      [days, 'day', 'days'],
      [hours, 'hour', 'hours'],
      [minutes, 'minute', 'minutes'],
    ];

    for (const [value, singular, plural] of thresholds) {
      if (value <= 0) continue;
      return value === 1 ? `1 ${singular} ago` : `${value} ${plural} ago`;
    }

    return 'just now';
  }
}
