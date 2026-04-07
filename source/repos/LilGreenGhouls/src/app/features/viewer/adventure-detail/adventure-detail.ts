import { Component, inject, OnInit, signal, viewChild, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DOCUMENT } from '@angular/common';
import { PostsService } from '../../../core/services/posts.service';
import { SubscribeFormComponent } from '../../../shared/components/subscribe-form/subscribe-form';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox/image-lightbox';
import { SocialShareComponent } from '../../../shared/components/social-share/social-share';
import { SafeResourceUrlPipe } from '../../../shared/pipes/safe-resource-url.pipe';
import { Post } from '../../../core/models/post.model';

@Component({
  selector: 'app-adventure-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, SubscribeFormComponent, ImageLightboxComponent, SocialShareComponent, SafeResourceUrlPipe],
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

  private lightbox = viewChild(ImageLightboxComponent);

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
}
