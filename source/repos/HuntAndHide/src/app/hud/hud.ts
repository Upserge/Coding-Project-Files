import { Component, inject, computed } from '@angular/core';
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

  // Hider-specific
  protected readonly idlePercent = computed(() => {
    const hider = this.gameLoop.getLocalHider();
    return hider ? this.hiderService.getIdlePercent(hider) : 0;
  });
  protected readonly activeItem = computed(() =>
    this.gameLoop.getLocalHider()?.activeItem ?? null
  );

  // Hunter-specific
  protected readonly hungerPercent = computed(() => {
    const hunter = this.gameLoop.getLocalHunter();
    return hunter ? this.hunterService.getHungerPercent(hunter) : 1;
  });
  protected readonly equippedWeapon = computed(() =>
    this.gameLoop.getLocalHunter()?.equippedWeapon ?? null
  );

  // Shared
  protected readonly score = computed(() =>
    this.gameLoop.getLocalPlayer()?.score ?? 0
  );
}
