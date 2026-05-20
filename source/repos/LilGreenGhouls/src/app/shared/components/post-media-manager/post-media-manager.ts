import { Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaImageFit, PostMediaItem } from '../../../core/models/post-media.model';
import { MediaService } from '../../../core/services/media.service';
import { prepareImageFileForUpload } from '../../../core/utils/heic-conversion.util';
import { enrichMediaItem, inferMediaTypeFromFile } from '../../../core/utils/post-media.util';
import {
  IMAGE_FILE_ACCEPT,
  isVideoUrl,
  MEDIA_GALLERY_ACCEPT,
} from '../../../core/utils/media-type.util';

@Component({
  selector: 'app-post-media-manager',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './post-media-manager.html',
  styleUrl: './post-media-manager.css',
})
export class PostMediaManagerComponent {
  private readonly mediaService = inject(MediaService);

  protected readonly mediaGalleryAccept = MEDIA_GALLERY_ACCEPT;
  protected readonly imageFileAccept = IMAGE_FILE_ACCEPT;

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

  protected isImageItem(item: PostMediaItem): boolean {
    return item.type === 'image';
  }

  protected imageFitClass(fit: MediaImageFit | undefined): string {
    return fit === 'contain' ? 'object-contain bg-void' : 'object-cover';
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
      for (const rawFile of Array.from(files)) {
        const file =
          inferMediaTypeFromFile(rawFile) === 'image'
            ? await prepareImageFileForUpload(rawFile)
            : rawFile;
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
            imageFit: 'cover',
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
      const uploadFile = await prepareImageFileForUpload(file);
      const coverUrl = await this.mediaService.uploadFile(
        uploadFile,
        `posts/audio-covers/${Date.now()}_${uploadFile.name}`,
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

  moveItemUp(index: number): void {
    this.moveItem(index, index - 1);
  }

  moveItemDown(index: number): void {
    this.moveItem(index, index + 1);
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

  updateImageFit(index: number, imageFit: string): void {
    this.updateItem(index, item => ({ ...item, imageFit: this.toMediaImageFit(imageFit) }));
  }

  updateCoverImageFit(index: number, coverImageFit: string): void {
    this.updateItem(index, item => ({ ...item, coverImageFit: this.toMediaImageFit(coverImageFit) }));
  }

  private moveItem(fromIndex: number, toIndex: number): void {
    this.mediaItems.update(items => {
      if (!this.isValidMove(items, fromIndex, toIndex)) {
        return items;
      }

      const reordered = [...items];
      const [item] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, item);
      return reordered;
    });
  }

  private isValidMove(items: PostMediaItem[], fromIndex: number, toIndex: number): boolean {
    return (
      fromIndex !== toIndex &&
      fromIndex >= 0 &&
      toIndex >= 0 &&
      fromIndex < items.length &&
      toIndex < items.length
    );
  }

  private toMediaImageFit(value: string): MediaImageFit {
    return value === 'contain' ? 'contain' : 'cover';
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
