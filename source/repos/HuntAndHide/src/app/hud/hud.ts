import { Component, inject, computed } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { GameLoopService } from '../services/game-loop.service';
import { HiderService } from '../services/hider.service';
import { HunterService } from '../services/hunter.service';
import { ITEM_CONFIGS, WEAPON_CONFIGS } from '../models/item.model';

/** Shape exposed to the template for each inventory slot. */
interface SlotInfo {
  name: string;
  empty: boolean;
  isWeapon: boolean;
}

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

  // ── Item bar (2 slots) ────────────────────────────────────

  protected readonly slot1 = computed((): SlotInfo => {
    const hider = this.gameLoop.getLocalHider();
    if (hider) return this.formatSlot(hider.inventory[0], false);
    const hunter = this.gameLoop.getLocalHunter();
    if (hunter) return this.formatSlot(hunter.inventory[0], true);
    return { name: '', empty: true, isWeapon: false };
  });

  protected readonly slot2 = computed((): SlotInfo => {
    const hider = this.gameLoop.getLocalHider();
    if (hider) return this.formatSlot(hider.inventory[1], false);
    const hunter = this.gameLoop.getLocalHunter();
    if (hunter) return this.formatSlot(hunter.inventory[1], true);
    return { name: '', empty: true, isWeapon: false };
  });

  private formatSlot(item: string | null, isWeapon: boolean): SlotInfo {
    if (!item) return { name: '', empty: true, isWeapon };
    const config = isWeapon
      ? WEAPON_CONFIGS[item as keyof typeof WEAPON_CONFIGS]
      : ITEM_CONFIGS[item as keyof typeof ITEM_CONFIGS];
    return { name: config?.displayName ?? item, empty: false, isWeapon };
  }
}
