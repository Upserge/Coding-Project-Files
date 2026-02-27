import { inject, Injectable, signal } from '@angular/core';
import { GamePhase } from '../models/session.model';
import { HiderState, HunterState, PlayerState, Vec3 } from '../models/player.model';
import { Item } from '../models/item.model';
import { HiderService } from './hider.service';
import { HunterService, ProjectileState } from './hunter.service';
import { ItemService } from './item.service';
import { InputService } from './input.service';
import { MapService } from './map.service';
import { PlayerService } from './player.service';

/**
 * GameLoopService is the central orchestrator:
 * - Owns the phase state machine (lobby → hiding → hunting → results)
 * - Distributes delta to role-specific services each tick
 * - Manages round timer and win/loss conditions
 *
 * EngineService calls `tick(delta)` every frame via its onTick callback.
 */
@Injectable({ providedIn: 'root' })
export class GameLoopService {
  private readonly hiderService = inject(HiderService);
  private readonly hunterService = inject(HunterService);
  private readonly itemService = inject(ItemService);
  private readonly inputService = inject(InputService);
  private readonly mapService = inject(MapService);
  private readonly playerService = inject(PlayerService);

  // ── Observable state (signals for UI binding) ──────────────
  readonly phase = signal<GamePhase>('lobby');
  readonly roundTimeRemainingMs = signal(0);
  readonly hiders = signal<HiderState[]>([]);
  readonly hunters = signal<HunterState[]>([]);
  readonly items = signal<Item[]>([]);
  readonly projectiles = signal<ProjectileState[]>([]);
  readonly localPlayerUid = signal<string>('');

  private roundDurationMs = 120_000; // 2 minutes per round
  private running = false;

  // ── Lifecycle ──────────────────────────────────────────────

  /** Called when entering the game view — lets players roam while waiting. */
  startLobby(localUid: string, hiderCount: number, hunterCount: number): void {
    this.localPlayerUid.set(localUid);

    const map = this.mapService.generateJungleMap();
    const hiderSpawns = map.spawnPoints.filter(s => s.forRole === 'hider');
    const hunterSpawns = map.spawnPoints.filter(s => s.forRole === 'hunter');
    const itemSpawns = map.spawnPoints.filter(s => s.forRole === 'item');

    // Seed items so players can pick things up during lobby
    const spawnedItems = this.itemService.spawnRoundItems(
      itemSpawns.map(s => s.position),
    );
    this.items.set(spawnedItems);

    // Determine local player role and spawn
    const role = this.playerService.assignRole(hiderCount, hunterCount);

    if (role === 'hider') {
      const spawn = hiderSpawns[hiderCount % hiderSpawns.length];
      const animal = this.playerService.assignAnimal('hider', []);
      const hider = this.playerService.createHiderState(
        animal as any, spawn.position,
      );
      hider.uid = localUid;
      this.hiders.set([hider]);
    } else {
      const spawn = hunterSpawns[hunterCount % hunterSpawns.length];
      const animal = this.playerService.assignAnimal('hunter', []);
      const hunter = this.playerService.createHunterState(
        animal as any, spawn.position,
      );
      hunter.uid = localUid;
      this.hunters.set([hunter]);
    }

    this.phase.set('lobby');
    this.running = true;
  }

  /** Transition from lobby to active gameplay once enough players join. */
  startGame(localUid: string, hiderCount: number, hunterCount: number): void {
    // If lobby was never started, bootstrap everything first
    if (!this.running) {
      this.startLobby(localUid, hiderCount, hunterCount);
    }

    this.phase.set('hunting');
    this.roundTimeRemainingMs.set(this.roundDurationMs);
  }

  stopGame(): void {
    this.running = false;
    this.phase.set('results');
  }

  // ── Tick (called every frame by EngineService) ─────────────

  tick(delta: number): void {
    if (!this.running) return;

    const currentPhase = this.phase();
    if (currentPhase === 'results') return;

    // Lobby: movement + item pickup only (no catches, no win, no timers)
    if (currentPhase === 'lobby') {
      this.tickMovementOnly(delta);
      return;
    }

    this.tickRoundTimer(delta);
    this.tickHiders(delta);
    this.tickHunters(delta);
    this.tickProjectiles(delta);
    this.checkCatches();
    this.checkWinConditions();
  }

  // ── Lobby-mode tick (movement + items, no consequences) ────

  private tickMovementOnly(delta: number): void {
    const localUid = this.localPlayerUid();
    const movement = this.inputService.getMovementVector();
    const action = this.inputService.consumeAction();

    // Move hiders (no idle timer, no conversion)
    this.hiders.update(hiders =>
      hiders.map(hider => {
        const input = hider.uid === localUid ? movement : { x: 0, y: 0, z: 0 };
        const { state } = this.hiderService.tick(hider, delta, input);
        // Reset idle timer in lobby — no consequences
        const lobbyState = { ...state, idleTimerMs: 0 };

        // Item pickup for local player
        if (hider.uid === localUid && action === 'use_item' && lobbyState.activeItem === null) {
          const nearby = this.itemService.findNearbyItems(lobbyState, this.items());
          const hiderItem = nearby.find(i =>
            i.type === 'smoke_bomb' || i.type === 'decoy' || i.type === 'speed_burst'
          );
          if (hiderItem) {
            this.items.update(items =>
              items.map(i => i.id === hiderItem.id ? this.itemService.pickUp(i, localUid) : i)
            );
            return this.hiderService.useItem(lobbyState, hiderItem.type as any);
          }
        }

        return lobbyState;
      }),
    );

    // Move hunters (no hunger drain, no starvation)
    this.hunters.update(hunters =>
      hunters.map(hunter => {
        const input = hunter.uid === localUid ? movement : { x: 0, y: 0, z: 0 };
        const { state } = this.hunterService.tick(hunter, delta, input);
        // Freeze hunger in lobby — no starvation
        const lobbyState = { ...state, hungerRemainingMs: hunter.hungerRemainingMs };

        // Weapon throw still works for fun
        if (hunter.uid === localUid && action === 'throw_weapon') {
          const aimDir = movement.x !== 0 || movement.z !== 0
            ? movement
            : { x: 0, y: 0, z: -1 };
          const proj = this.hunterService.throwWeapon(lobbyState, aimDir);
          this.projectiles.update(p => [...p, proj]);
        }

        // Edible pickup
        if (hunter.uid === localUid && action === 'interact') {
          const nearby = this.itemService.findNearbyItems(lobbyState, this.items());
          const edible = nearby.find(i =>
            i.type === 'berry' || i.type === 'mushroom' || i.type === 'grub'
          );
          if (edible) {
            this.items.update(items =>
              items.map(i => i.id === edible.id ? this.itemService.pickUp(i, localUid) : i)
            );
            return this.hunterService.eatEdible(lobbyState);
          }
        }

        return lobbyState;
      }),
    );

    // Tick projectiles (visual only, no hit detection in lobby)
    this.projectiles.update(projs =>
      projs.map(p => this.hunterService.tickProjectile(p, delta)),
    );
  }

  // ── Round timer ────────────────────────────────────────────

  private tickRoundTimer(delta: number): void {
    const remaining = this.roundTimeRemainingMs() - delta * 1000;
    this.roundTimeRemainingMs.set(Math.max(0, remaining));

    if (remaining <= 0) {
      // Time's up — hiders win this round
      this.stopGame();
    }
  }

  // ── Hider tick ─────────────────────────────────────────────

  private tickHiders(delta: number): void {
    const localUid = this.localPlayerUid();
    const movement = this.inputService.getMovementVector();
    const action = this.inputService.consumeAction();

    const updatedHiders = this.hiders().map(hider => {
      // Only apply local input to the local player
      const input = hider.uid === localUid ? movement : { x: 0, y: 0, z: 0 };
      const { state, result } = this.hiderService.tick(hider, delta, input);

      if (result.convertToHunter) {
        // Queue conversion — will be processed after this loop
        this.convertHiderToHunter(state);
        return null; // Remove from hiders
      }

      // Handle item usage for local player
      if (hider.uid === localUid && action === 'use_item' && state.activeItem === null) {
        const nearby = this.itemService.findNearbyItems(state, this.items());
        const hiderItem = nearby.find(i =>
          i.type === 'smoke_bomb' || i.type === 'decoy' || i.type === 'speed_burst'
        );
        if (hiderItem) {
          this.items.update(items =>
            items.map(i => i.id === hiderItem.id ? this.itemService.pickUp(i, localUid) : i)
          );
          return this.hiderService.useItem(state, hiderItem.type as any);
        }
      }

      return state;
    }).filter((h): h is HiderState => h !== null);

    this.hiders.set(updatedHiders);
  }

  // ── Hunter tick ────────────────────────────────────────────

  private tickHunters(delta: number): void {
    const localUid = this.localPlayerUid();
    const movement = this.inputService.getMovementVector();
    const action = this.inputService.consumeAction();

    const updatedHunters = this.hunters().map(hunter => {
      const input = hunter.uid === localUid ? movement : { x: 0, y: 0, z: 0 };
      const { state, result } = this.hunterService.tick(hunter, delta, input);

      if (result.starved) {
        return { ...state, isAlive: false };
      }

      // Weapon throw for local player
      if (hunter.uid === localUid && action === 'throw_weapon') {
        const aimDir: Vec3 = movement.x !== 0 || movement.z !== 0
          ? movement
          : { x: 0, y: 0, z: -1 }; // default forward
        const proj = this.hunterService.throwWeapon(state, aimDir);
        this.projectiles.update(p => [...p, proj]);
      }

      // Feed on nearby edibles
      if (hunter.uid === localUid && action === 'interact') {
        const nearby = this.itemService.findNearbyItems(state, this.items());
        const edible = nearby.find(i =>
          i.type === 'berry' || i.type === 'mushroom' || i.type === 'grub'
        );
        if (edible) {
          this.items.update(items =>
            items.map(i => i.id === edible.id ? this.itemService.pickUp(i, localUid) : i)
          );
          return this.hunterService.eatEdible(state);
        }
      }

      return state;
    });

    this.hunters.set(updatedHunters);
  }

  // ── Projectile tick ────────────────────────────────────────

  private tickProjectiles(delta: number): void {
    const updated = this.projectiles().map(p =>
      this.hunterService.tickProjectile(p, delta),
    );
    this.projectiles.set(updated);

    // TODO: check projectile collisions with hiders (bolo = slow, spear = tag)
  }

  // ── Catch detection ────────────────────────────────────────

  private checkCatches(): void {
    const currentHunters = this.hunters();
    const currentHiders = this.hiders();
    const caughtHiderUids = new Set<string>();

    const updatedHunters = currentHunters.map(hunter => {
      if (!hunter.isAlive) return hunter;

      for (const hider of currentHiders) {
        if (caughtHiderUids.has(hider.uid)) continue;
        if (this.hunterService.canCatch(hunter, hider)) {
          caughtHiderUids.add(hider.uid);
          return this.hunterService.performCatch(hunter, hider);
        }
      }
      return hunter;
    });

    if (caughtHiderUids.size > 0) {
      this.hunters.set(updatedHunters);
      // Convert caught hiders to hunters
      for (const uid of caughtHiderUids) {
        const caught = currentHiders.find(h => h.uid === uid);
        if (caught) this.convertHiderToHunter(caught);
      }
      this.hiders.update(h => h.filter(hider => !caughtHiderUids.has(hider.uid)));
    }
  }

  // ── Conversion ─────────────────────────────────────────────

  private convertHiderToHunter(hider: HiderState): void {
    const hunter = this.playerService.createHunterState('wolf', hider.position);
    hunter.uid = hider.uid;
    hunter.displayName = hider.displayName;
    this.hunters.update(h => [...h, hunter]);
  }

  // ── Win conditions ─────────────────────────────────────────

  private checkWinConditions(): void {
    const aliveHiders = this.hiders().filter(h => h.isAlive);
    const aliveHunters = this.hunters().filter(h => h.isAlive);

    // All hiders caught or converted — hunters win
    if (aliveHiders.length === 0) {
      this.stopGame();
      return;
    }

    // All hunters starved — hiders win
    if (aliveHunters.length === 0) {
      this.stopGame();
    }
  }

  // ── Queries for UI ─────────────────────────────────────────

  getLocalPlayer(): PlayerState | undefined {
    const uid = this.localPlayerUid();
    return this.hiders().find(h => h.uid === uid)
        ?? this.hunters().find(h => h.uid === uid);
  }

  getLocalHider(): HiderState | undefined {
    return this.hiders().find(h => h.uid === this.localPlayerUid());
  }

  getLocalHunter(): HunterState | undefined {
    return this.hunters().find(h => h.uid === this.localPlayerUid());
  }
}
