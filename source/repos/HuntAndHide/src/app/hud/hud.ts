import { Component, inject, computed, signal, effect, input, output, HostListener } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { GameLoopService } from '../services/game-loop.service';
import { HiderService } from '../services/hider.service';
import { HunterService } from '../services/hunter.service';
import { SettingsMenuComponent } from '../settings-menu/settings-menu';
import { GameScoreboardComponent } from '../game-scoreboard/game-scoreboard';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [UpperCasePipe, SettingsMenuComponent, GameScoreboardComponent],
  templateUrl: './hud.html',
  styleUrl: './hud.css',
})
export class HudComponent {
  private readonly gameLoop = inject(GameLoopService);
  private readonly hiderService = inject(HiderService);
  private readonly hunterService = inject(HunterService);

  readonly isFullscreen = input(false);
  readonly toggleFullscreenRequested = output<void>();
  readonly leaveGameRequested = output<void>();
  readonly showRulesRequested = output<void>();

  protected readonly settingsOpen = signal(false);
  protected readonly scoreboardVisible = signal(false);

  @HostListener('window:keydown.escape')
  protected onEscape(): void {
    this.settingsOpen.update(open => !open);
  }

  @HostListener('window:keydown.tab', ['$event'])
  protected onTabDown(event: Event): void {
    event.preventDefault();
    this.scoreboardVisible.set(true);
  }

  @HostListener('window:keyup.tab')
  protected onTabUp(): void {
    this.scoreboardVisible.set(false);
  }

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
  protected readonly dashCooldownPercent = computed(() => {
    const hider = this.gameLoop.getLocalHider();
    return hider ? this.hiderService.getDashCooldownPercent(hider) : 0;
  });
  protected readonly isDashing = computed(() =>
    this.gameLoop.getLocalHider()?.isDashing ?? false
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
  protected readonly isHunterExhausted = computed(() => {
    const hunter = this.gameLoop.getLocalHunter();
    return hunter ? this.hunterService.isExhausted(hunter) : false;
  });
  protected readonly hunterExhaustionCountdown = computed(() => {
    const hunter = this.gameLoop.getLocalHunter();
    if (!hunter) return 0;
    return Math.max(0, hunter.exhaustionCooldownS).toFixed(1);
  });
  protected readonly pounceCooldownPercent = computed(() => {
    const hunter = this.gameLoop.getLocalHunter();
    return hunter ? this.hunterService.getPounceCooldownPercent(hunter) : 0;
  });
  protected readonly isPouncing = computed(() =>
    this.gameLoop.getLocalHunter()?.isPouncing ?? false
  );

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

  protected openSettings(): void {
    this.settingsOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsOpen.set(false);
  }

  protected onLeaveGame(): void {
    this.settingsOpen.set(false);
    this.leaveGameRequested.emit();
  }

  protected onShowRules(): void {
    this.settingsOpen.set(false);
    this.showRulesRequested.emit();
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
