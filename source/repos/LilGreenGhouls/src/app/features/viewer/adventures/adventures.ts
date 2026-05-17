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
  pathD: string;
}

const YARN_VIEWBOX_WIDTH = 1280;
/** Approximate card height for rotation pivot (pin position is fixed from card top) */
const CARD_HEIGHT_ESTIMATE = 380;
/** Needle tip offset from card top — matches .pin-yarn-anchor { top: 16px } */
const PIN_TIP_OFFSET_Y = 16;

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

  private static readonly ROW_SPACING = 450;

  /** Seeded pseudo-random so positions are stable across re-renders */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  readonly filteredPosts = computed(() => {
    const tag = this.selectedTag();
    const posts = this.posts();
    if (!tag) return posts;
    return posts.filter(p => p.tags.includes(tag));
  });

  /** Computed card positions: zigzag rows with random offsets */
  readonly cardPositions = computed<CardPosition[]>(() => {
    const posts = this.filteredPosts();
    return posts.map((_, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;

      // Zigzag: even rows go left-right, odd rows go right-left
      // With 28% width cards: left col at 5%, right col at 62% (10% gap in middle)
      const baseLeft = row % 2 === 0
        ? (col === 0 ? 5 : 42)
        : (col === 0 ? 42 : 5);

      const offsetX = (this.seededRandom(i * 7 + 3) - 0.5) * 14;
      const offsetY = (this.seededRandom(i * 13 + 7) - 0.5) * 40;
      const rotation = ((this.seededRandom(i * 17 + 11) - 0.5) * 5).toFixed(1) + 'deg';

      return {
        left: Math.max(2, Math.min(68, baseLeft + offsetX)),
        top: row * AdventuresComponent.ROW_SPACING + offsetY + 20,
        rotation,
      };
    });
  });

  /** Board height based on number of rows */
  readonly boardHeight = computed(() => {
    const rowCount = Math.ceil(this.filteredPosts().length / 2);
    return Math.max(400, rowCount * AdventuresComponent.ROW_SPACING + 60);
  });

  /** SVG yarn connecting pin needle tips in post order */
  readonly yarnLines = computed<YarnLine[]>(() => {
    const positions = this.cardPositions();
    if (positions.length < 2) return [];

    const cardWidth = YARN_VIEWBOX_WIDTH * 0.28;
    const pinPoints = positions.map(pos => this.pinTipPosition(pos, cardWidth));

    return pinPoints.slice(1).map((end, i) => ({
      pathD: this.buildYarnPath(pinPoints[i], end),
    }));
  });

  /** Pin needle tip in viewBox coords, accounting for card rotation */
  private pinTipPosition(
    pos: CardPosition,
    cardWidth: number,
  ): { x: number; y: number } {
    const rotRad = (parseFloat(pos.rotation) * Math.PI) / 180;
    const cx = (pos.left / 100) * YARN_VIEWBOX_WIDTH + cardWidth / 2;
    const cy = pos.top + CARD_HEIGHT_ESTIMATE / 2;
    const dy = PIN_TIP_OFFSET_Y - CARD_HEIGHT_ESTIMATE / 2;

    return {
      x: cx - dy * Math.sin(rotRad),
      y: cy + dy * Math.cos(rotRad),
    };
  }

  /** Slight sag between pins so the yarn reads like real string */
  private buildYarnPath(
    start: { x: number; y: number },
    end: { x: number; y: number },
  ): string {
    const sag = Math.min(48, Math.abs(end.y - start.y) * 0.12 + 16);
    const c1y = start.y + sag;
    const c2y = end.y - sag;
    return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${start.x.toFixed(1)} ${c1y.toFixed(1)}, ${end.x.toFixed(1)} ${c2y.toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  }

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
}
