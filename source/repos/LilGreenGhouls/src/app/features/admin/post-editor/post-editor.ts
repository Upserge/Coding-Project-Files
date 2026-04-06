import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../../core/services/posts.service';
import { MediaService } from '../../../core/services/media.service';
import { AuthService } from '../../../core/services/auth.service';
import { Post } from '../../../core/models/post.model';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-post-editor',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './post-editor.html',
  styleUrl: './post-editor.css',
})
export class PostEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postsService = inject(PostsService);
  private mediaService = inject(MediaService);
  private authService = inject(AuthService);

  protected isEditing = signal(false);
  protected saving = signal(false);
  protected postId = signal<string | null>(null);

  // Form fields
  protected title = '';
  protected excerpt = '';
  protected content = '';
  protected coverImageUrl = '';
  protected tagsInput = '';
  protected youtubeInput = '';
  protected youtubeEmbeds = signal<string[]>([]);
  protected externalLinks = signal<{ label: string; url: string }[]>([]);
  protected newLinkLabel = '';
  protected newLinkUrl = '';
  protected mediaUrls = signal<string[]>([]);
  protected status: 'draft' | 'published' = 'draft';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.postId.set(id);
      const post = await this.postsService.getById(id);
      if (post) {
        this.title = post.title;
        this.excerpt = post.excerpt;
        this.content = post.content;
        this.coverImageUrl = post.coverImageUrl;
        this.tagsInput = post.tags.join(', ');
        this.youtubeEmbeds.set(post.youtubeEmbeds);
        this.externalLinks.set(post.externalLinks);
        this.mediaUrls.set(post.mediaUrls);
        this.status = post.status;
      }
    }
  }

  addYoutubeEmbed(): void {
    const id = this.extractYoutubeId(this.youtubeInput.trim());
    if (id) {
      this.youtubeEmbeds.update(list => [...list, id]);
      this.youtubeInput = '';
    }
  }

  removeYoutubeEmbed(index: number): void {
    this.youtubeEmbeds.update(list => list.filter((_, i) => i !== index));
  }

  addExternalLink(): void {
    if (this.newLinkLabel.trim() && this.newLinkUrl.trim()) {
      this.externalLinks.update(list => [...list, { label: this.newLinkLabel.trim(), url: this.newLinkUrl.trim() }]);
      this.newLinkLabel = '';
      this.newLinkUrl = '';
    }
  }

  removeExternalLink(index: number): void {
    this.externalLinks.update(list => list.filter((_, i) => i !== index));
  }

  async onCoverImageUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const url = await this.mediaService.uploadFile(file, `posts/covers/${Date.now()}_${file.name}`);
      this.coverImageUrl = url;
    }
  }

  async onMediaUpload(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      for (const file of Array.from(files)) {
        const url = await this.mediaService.uploadFile(file, `posts/media/${Date.now()}_${file.name}`);
        this.mediaUrls.update(list => [...list, url]);
      }
    }
  }

  removeMediaUrl(index: number): void {
    this.mediaUrls.update(list => list.filter((_, i) => i !== index));
  }

  async savePost(): Promise<void> {
    this.saving.set(true);
    const user = this.authService.appUser();
    const tags = this.tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const slug = this.generateSlug(this.title);

    const postData: Omit<Post, 'id'> = {
      title: this.title,
      slug,
      excerpt: this.excerpt,
      content: this.content,
      coverImageUrl: this.coverImageUrl,
      mediaUrls: this.mediaUrls(),
      youtubeEmbeds: this.youtubeEmbeds(),
      externalLinks: this.externalLinks(),
      tags,
      status: this.status,
      authorUid: user?.uid ?? '',
      authorName: user?.displayName ?? 'Unknown',
      publishedAt: this.status === 'published' ? Timestamp.now() : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (this.isEditing() && this.postId()) {
      await this.postsService.update(this.postId()!, postData);
    } else {
      await this.postsService.create(postData);
    }

    this.saving.set(false);
    await this.router.navigate(['/admin/posts']);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private extractYoutubeId(input: string): string | null {
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    if (match) return match[1];
    if (/^[\w-]{11}$/.test(input)) return input;
    return null;
  }
}
