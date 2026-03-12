import { Component, inject, computed, signal, effect, input, output } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { GameLoopService } from '../services/game-loop.service';
import { HiderService } from '../services/hider.service';
import { HunterService } from '../services/hunter.service';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './hud.html',
  styleUrl: './hud.css',
})
export class HudComponent {
  private readonly gameLoop = inject(GameLoopService);
  private readonly hiderService = inject(HiderService);
  private readonly hunterService = inject(HunterService);

  readonly isFullscreen = input(false);
  readonly toggleFullscreenRequested = output<void>();

  // ── Derived signals for the template ───────────────────────

  protected readonly phase = this.gameLoop.phase;
  protected readonly timeRemaining = computed(() =>
    Math.ceil(this.gameLoop.roundTimeRemainingMs() / 1000)
  );
  protected readonly playerCount = computed(() =>
    this.gameLoop.hiders().length + this.gameLoop.hunters().length
  );

  protected readonly isHider = computed(() => !!this.gameLoop.getLocalHider());
  protected readonly isHunter = computed(() => !!this.gameLoop.getLocalHunter());
  protected readonly roleClass = computed(() =>
    this.isHider() ? 'role-hider' : this.isHunter() ? 'role-hunter' : ''
  );

  // Hider-specific
  protected readonly idlePercent = computed(() => {
    const hider = this.gameLoop.getLocalHider();
    return hider ? this.hiderService.getIdlePercent(hider) : 0;
  });
  protected readonly isHiding = computed(() =>
    this.gameLoop.getLocalHider()?.isHiding ?? false
  );

  // Hunter-specific
  protected readonly hungerPercent = computed(() => {
    const hunter = this.gameLoop.getLocalHunter();
    return hunter ? this.hunterService.getHungerPercent(hunter) : 1;
  });
  protected readonly staminaPercent = computed(() => {
    const hunter = this.gameLoop.getLocalHunter();
    return hunter ? this.hunterService.getStaminaPercent(hunter) : 1;
  });

  // Shared
  protected readonly score = computed(() =>
    this.gameLoop.getLocalPlayer()?.score ?? 0
  );

  // Hunter death overlay
  protected readonly hunterDeathActive = this.gameLoop.hunterDeathActive;
  protected readonly hunterDeathCountdown = this.gameLoop.hunterDeathCountdown;

  // Kill-feed
  protected readonly catchFeed = this.gameLoop.catchFeed;

  // Last hider standing
  protected readonly lastHider = this.gameLoop.lastHiderStanding;

  // Catch flash overlay — brief red vignette pulse on each catch event
  protected readonly catchFlashActive = signal(false);
  private lastCatchCount = 0;
  private catchFlashTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const feed = this.catchFeed();
      if (this.shouldTriggerCatchFlash(feed.length)) this.triggerCatchFlash();
      this.lastCatchCount = feed.length;
    });
  }

  protected toggleFullscreen(): void {
    this.toggleFullscreenRequested.emit();
  }

  private triggerCatchFlash(): void {
    this.catchFlashActive.set(true);
    this.clearCatchFlashTimer();
    this.catchFlashTimer = setTimeout(() => this.catchFlashActive.set(false), 400);
  }

  private shouldTriggerCatchFlash(feedLength: number): boolean {
    return feedLength > this.lastCatchCount && this.lastCatchCount > 0;
  }

  private clearCatchFlashTimer(): void {
    if (!this.catchFlashTimer) return;
    clearTimeout(this.catchFlashTimer);
  }
}
