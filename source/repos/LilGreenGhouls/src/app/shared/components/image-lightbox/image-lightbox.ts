import { Component, input, output, signal, computed } from '@angular/core';

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  templateUrl: './image-lightbox.html',
  styleUrl: './image-lightbox.css',
})
export class ImageLightboxComponent {
  readonly images = input.required<string[]>();
  readonly closed = output<void>();

  protected currentIndex = signal(0);

  protected currentImage = computed(() => this.images()[this.currentIndex()]);
  protected hasNext = computed(() => this.currentIndex() < this.images().length - 1);
  protected hasPrev = computed(() => this.currentIndex() > 0);
  protected counter = computed(() => `${this.currentIndex() + 1} / ${this.images().length}`);

  open(index: number): void {
    this.currentIndex.set(index);
  }

  next(): void {
    if (this.hasNext()) {
      this.currentIndex.update(i => i + 1);
    }
  }

  prev(): void {
    if (this.hasPrev()) {
      this.currentIndex.update(i => i - 1);
    }
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('lightbox-backdrop')) {
      this.close();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape': this.close(); break;
      case 'ArrowRight': this.next(); break;
      case 'ArrowLeft': this.prev(); break;
    }
  }
}
