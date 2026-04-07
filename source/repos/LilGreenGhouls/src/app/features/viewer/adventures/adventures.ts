import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { PostCardComponent } from '../../../shared/components/post-card/post-card';
import { AosDirective } from '../../../shared/directives/aos.directive';
import { PostsService } from '../../../core/services/posts.service';
import { Post } from '../../../core/models/post.model';

interface CardPosition {
  left: number;   // percentage (0-66 to keep card on screen with ~33% width)
  top: number;    // px offset within the scatter board
  rotation: string;
}

interface YarnLine {
  x1: number; y1: number;
  x2: number; y2: number;
}

@Component({
  selector: 'app-adventures',
  standalone: true,
  imports: [PostCardComponent, AosDirective],
  templateUrl: './adventures.html',
  styleUrl: './adventures.css',
})
export class AdventuresComponent implements OnInit {
  private postsService = inject(PostsService);

  protected posts = signal<Post[]>([]);
  protected selectedTag = signal<string | null>(null);
  protected allTags = signal<string[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  private static readonly CARD_HEIGHT = 380;
  private static readonly ROW_SPACING = 420;

  /** Seeded pseudo-random so positions are stable across re-renders */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  /** Computed card positions: zigzag rows with random offsets */
  readonly cardPositions = computed<CardPosition[]>(() => {
    const posts = this.filteredPosts;
    return posts.map((_, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;

      // Zigzag: even rows go left-right, odd rows go right-left
      const baseLeft = row % 2 === 0
        ? (col === 0 ? 5 : 52)
        : (col === 0 ? 52 : 5);

      const offsetX = (this.seededRandom(i * 7 + 3) - 0.5) * 14;
      const offsetY = (this.seededRandom(i * 13 + 7) - 0.5) * 40;
      const rotation = ((this.seededRandom(i * 17 + 11) - 0.5) * 5).toFixed(1) + 'deg';

      return {
        left: Math.max(2, Math.min(62, baseLeft + offsetX)),
        top: row * AdventuresComponent.ROW_SPACING + offsetY + 20,
        rotation,
      };
    });
  });

  /** Board height based on number of rows */
  readonly boardHeight = computed(() => {
    const rowCount = Math.ceil(this.filteredPosts.length / 2);
    return Math.max(400, rowCount * AdventuresComponent.ROW_SPACING + 60);
  });

  /** SVG yarn lines connecting sequential card pushpins */
  readonly yarnLines = computed<YarnLine[]>(() => {
    const positions = this.cardPositions();
    if (positions.length < 2) return [];

    const boardWidth = 1280;
    const cardWidth = boardWidth * 0.33;

    return positions.slice(1).map((pos, i) => {
      const prev = positions[i];
      return {
        x1: (prev.left / 100) * boardWidth + cardWidth / 2,
        y1: prev.top + 10,
        x2: (pos.left / 100) * boardWidth + cardWidth / 2,
        y2: pos.top + 10,
      };
    });
  });

  async ngOnInit(): Promise<void> {
    try {
      const posts = await this.postsService.getAllPublished();
      this.posts.set(posts);

      const tags = new Set<string>();
      posts.forEach(p => p.tags.forEach(t => tags.add(t)));
      this.allTags.set(Array.from(tags).sort());
    } catch (e) {
      console.error('Failed to load adventures:', e);
      this.error.set('Failed to load adventures. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }

  filterByTag(tag: string | null): void {
    this.selectedTag.set(tag);
  }

  get filteredPosts(): Post[] {
    const tag = this.selectedTag();
    if (!tag) return this.posts();
    return this.posts().filter(p => p.tags.includes(tag));
  }
}
