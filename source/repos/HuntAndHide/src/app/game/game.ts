import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  viewChild,
  inject,
} from '@angular/core';
import { EngineService } from '../engine/engine.service';
import { HudComponent } from '../hud/hud';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [HudComponent],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class GameComponent implements AfterViewInit, OnDestroy {
  private readonly engine = inject(EngineService);
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gameCanvas');
  private resizeObserver!: ResizeObserver;

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;
    await this.engine.init(canvas);
    this.engine.resize(canvas.clientWidth, canvas.clientHeight);

    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.engine.resize(width, height);
    });
    this.resizeObserver.observe(canvas.parentElement!);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.engine.dispose();
  }
}
