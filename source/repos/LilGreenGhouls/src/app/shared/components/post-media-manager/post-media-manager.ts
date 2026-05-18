import { Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostMediaItem } from '../../../core/models/post-media.model';
import { MediaService } from '../../../core/services/media.service';
import { enrichMediaItem, inferMediaTypeFromFile } from '../../../core/utils/post-media.util';
import { isVideoUrl } from '../../../core/utils/media-type.util';

@Component({
  selector: 'app-post-media-manager',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './post-media-manager.html',
  styleUrl: './post-media-manager.css',
})
export class PostMediaManagerComponent {
  private readonly mediaService = inject(MediaService);

  readonly mediaItems = model.required<PostMediaItem[]>();
  readonly uploadError = model<string | null>(null);

  readonly uploading = signal(false);
  protected readonly uploadProgress = signal(0);

  protected isVideoItem(item: PostMediaItem): boolean {
    return item.type === 'video' || isVideoUrl(item.url);
  }

  protected isAudioItem(item: PostMediaItem): boolean {
    return item.type === 'audio';
  }

  async onMediaFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set(null);

    try {
      const uploadedItems: PostMediaItem[] = [];
      for (const file of Array.from(files)) {
        const url = await this.mediaService.uploadFile(
          file,
          `posts/media/${Date.now()}_${file.name}`,
          percent => this.uploadProgress.set(percent),
        );
        uploadedItems.push(
          enrichMediaItem({
            url,
            type: inferMediaTypeFromFile(file),
            title: '',
            caption: '',
          }),
        );
      }
      this.mediaItems.update(items => [...items, ...uploadedItems]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Media upload failed';
      this.uploadError.set(message);
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  async onAudioCoverSelected(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set(null);

    try {
      const coverUrl = await this.mediaService.uploadFile(
        file,
        `posts/audio-covers/${Date.now()}_${file.name}`,
        percent => this.uploadProgress.set(percent),
      );
      this.updateItem(index, item => ({ ...item, coverImageUrl: coverUrl }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cover image upload failed';
      this.uploadError.set(message);
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  removeItem(index: number): void {
    this.mediaItems.update(items => items.filter((_, i) => i !== index));
  }

  removeAudioCover(index: number): void {
    this.updateItem(index, item => ({ ...item, coverImageUrl: '' }));
  }

  updateTitle(index: number, title: string): void {
    this.updateItem(index, item => ({ ...item, title }));
  }

  updateCaption(index: number, caption: string): void {
    this.updateItem(index, item => ({ ...item, caption }));
  }

  private updateItem(
    index: number,
    updater: (item: PostMediaItem) => PostMediaItem,
  ): void {
    this.mediaItems.update(items =>
      items.map((item, i) => (i === index ? enrichMediaItem(updater(item)) : item)),
    );
  }
}
