import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectItem } from '../../resume-service';
import { ReelMedia, resolveReelMedia } from '../../content/reel/reel-media';
import { VISUAL_FEATURES } from '../../content/visual-tier';

@Component({
  selector: 'app-work-reel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './work-reel.component.html',
  styleUrl: './work-reel.component.css',
})
export class WorkReelComponent implements AfterViewInit, OnDestroy {
  readonly items = input.required<ProjectItem[]>();

  @ViewChildren('reelVideo') private readonly reelVideos!: QueryList<ElementRef<HTMLVideoElement>>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly failedVideos = signal<ReadonlySet<string>>(new Set());
  private videoObserver: IntersectionObserver | null = null;
  private readonly visibilityHandler = () => this.syncVideoPlayback();
  private readonly reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected readonly reelMotion = VISUAL_FEATURES.reelMotion && !this.reducedMotion;

  ngAfterViewInit(): void {
    this.setupVideoObserver();
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    });
    this.reelVideos.changes.subscribe(() => {
      this.videoObserver?.disconnect();
      this.setupVideoObserver();
    });
  }

  ngOnDestroy(): void {
    this.videoObserver?.disconnect();
    this.videoObserver = null;
  }

  panelAccent(index: number): string {
    const accents = [
      'rgba(124, 92, 255, 0.45)',
      'rgba(245, 158, 11, 0.4)',
      'rgba(94, 234, 212, 0.35)',
      'rgba(192, 132, 252, 0.4)',
      'rgba(239, 68, 68, 0.32)',
    ];
    return accents[index % accents.length];
  }

  reelMediaFor(item: ProjectItem): ReelMedia | null {
    if (this.failedVideos().has(item.title)) {
      return null;
    }
    return resolveReelMedia(item, this.reelMotion);
  }

  onVideoError(item: ProjectItem): void {
    this.failedVideos.update((current) => {
      const next = new Set(current);
      next.add(item.title);
      return next;
    });
  }

  private setupVideoObserver(): void {
    if (!this.reelMotion || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.videoObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && !document.hidden) {
            video.play().catch(() => undefined);
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.35, rootMargin: '8px 0px' },
    );

    for (const ref of this.reelVideos) {
      this.videoObserver.observe(ref.nativeElement);
    }
  }

  private syncVideoPlayback(): void {
    if (document.hidden) {
      for (const ref of this.reelVideos) {
        ref.nativeElement.pause();
      }
      return;
    }

    if (!this.videoObserver) {
      return;
    }

    for (const ref of this.reelVideos) {
      const video = ref.nativeElement;
      const rect = video.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (visible) {
        video.play().catch(() => undefined);
      }
    }
  }
}
