import { inject, Injectable, signal } from '@angular/core';
import { GamePhase } from '../models/session.model';
import { HiderState, HunterState, PlayerState, Vec3 } from '../models/player.model';
import { Item } from '../models/item.model';
import { HiderService } from './hider.service';
import { HunterService, ProjectileState } from './hunter.service';
import { ItemService } from './item.service';
import { InputService } from './input.service';
import { MapService } from './map.service';
import { CollisionService } from './collision.service';
import { PlayerService } from './player.service';
import { CpuBrainService } from './cpu-brain.service';
import { CpuSpawnerService } from './cpu-spawner.service';

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
  private readonly collision = inject(CollisionService);
  private readonly playerService = inject(PlayerService);
  private readonly cpuBrain = inject(CpuBrainService);
  private readonly cpuSpawner = inject(CpuSpawnerService);

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

    // Fill empty slots with CPU players
    const reconciled = this.cpuSpawner.reconcile(this.hiders(), this.hunters());
    this.hiders.set(reconciled.hiders);
    this.hunters.set(reconciled.hunters);
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
    this.cpuSpawner.dispose();
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
        const cpuDecision = hider.isCpu
          ? this.cpuBrain.decide(hider.uid, hider.position, delta * 1000, this.itemService.findNearbyItems(hider, this.items()), hider.activeItem !== null)
          : undefined;

        const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
        const { state } = this.hiderService.tick(hider, delta, input);
        let lobbyState = { ...state, idleTimerMs: 0 };

        // Enforce collisions for local + CPU players
        if ((hider.uid === localUid || hider.isCpu) && this.collision) {
          const resolved = this.collision.resolvePosition(hider.position, lobbyState.position);
          lobbyState = { ...lobbyState, position: resolved };
        }

        // Item pickup for local player
        const hiderAction = hider.isCpu ? cpuDecision?.action : action;
        if (hiderAction === 'use_item' && lobbyState.activeItem === null) {
          const nearby = this.itemService.findNearbyItems(lobbyState, this.items());
          const hiderItem = nearby.find(i =>
            i.type === 'smoke_bomb' || i.type === 'decoy' || i.type === 'speed_burst'
          );
          if (hiderItem) {
            this.items.update(items =>
              items.map(i => i.id === hiderItem.id ? this.itemService.pickUp(i, hider.uid) : i)
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
        const cpuDecision = hunter.isCpu
          ? this.cpuBrain.decide(hunter.uid, hunter.position, delta * 1000, this.itemService.findNearbyItems(hunter, this.items()), false)
          : undefined;

        const input = this.resolveInput(hunter.uid, localUid, movement, cpuDecision?.movement);
        const { state } = this.hunterService.tick(hunter, delta, input);
        let lobbyState = { ...state, hungerRemainingMs: hunter.hungerRemainingMs };

        // Enforce collisions for local + CPU players
        if ((hunter.uid === localUid || hunter.isCpu) && this.collision) {
          const resolved = this.collision.resolvePosition(hunter.position, lobbyState.position);
          lobbyState = { ...lobbyState, position: resolved };
        }

        // Weapon throw
        const hunterAction = hunter.isCpu ? cpuDecision?.action : action;
        if (hunterAction === 'throw_weapon') {
          const aimDir = input.x !== 0 || input.z !== 0
            ? input
            : { x: 0, y: 0, z: -1 };
          const proj = this.hunterService.throwWeapon(lobbyState, aimDir);
          this.projectiles.update(p => [...p, proj]);
        }

        // Edible pickup
        if (hunterAction === 'interact') {
          const nearby = this.itemService.findNearbyItems(lobbyState, this.items());
          const edible = nearby.find(i =>
            i.type === 'berry' || i.type === 'mushroom' || i.type === 'grub'
          );
          if (edible) {
            this.items.update(items =>
              items.map(i => i.id === edible.id ? this.itemService.pickUp(i, hunter.uid) : i)
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
      const cpuDecision = hider.isCpu
        ? this.cpuBrain.decide(hider.uid, hider.position, delta * 1000, this.itemService.findNearbyItems(hider, this.items()), hider.activeItem !== null)
        : undefined;

      const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
      const { state, result } = this.hiderService.tick(hider, delta, input);

      if (result.convertToHunter) {
        this.convertHiderToHunter(state);
        return null;
      }

      // Item usage for local + CPU players
      const hiderAction = hider.isCpu ? cpuDecision?.action : action;
      if (hiderAction === 'use_item' && state.activeItem === null) {
        const nearby = this.itemService.findNearbyItems(state, this.items());
        const hiderItem = nearby.find(i =>
          i.type === 'smoke_bomb' || i.type === 'decoy' || i.type === 'speed_burst'
        );
        if (hiderItem) {
          this.items.update(items =>
            items.map(i => i.id === hiderItem.id ? this.itemService.pickUp(i, hider.uid) : i)
          );
          return this.hiderService.useItem(state, hiderItem.type as any);
        }
      }

      // Enforce collisions and bounds
      if (this.collision) {
        const resolved = this.collision.resolvePosition(hider.position, state.position);
        return { ...state, position: resolved };
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
      const cpuDecision = hunter.isCpu
        ? this.cpuBrain.decide(hunter.uid, hunter.position, delta * 1000, this.itemService.findNearbyItems(hunter, this.items()), false)
        : undefined;

      const input = this.resolveInput(hunter.uid, localUid, movement, cpuDecision?.movement);
      const { state, result } = this.hunterService.tick(hunter, delta, input);

      if (result.starved) {
        return { ...state, isAlive: false };
      }

      // Weapon throw for local + CPU players
      const hunterAction = hunter.isCpu ? cpuDecision?.action : action;
      if (hunterAction === 'throw_weapon') {
        const aimDir: Vec3 = input.x !== 0 || input.z !== 0
          ? input
          : { x: 0, y: 0, z: -1 };
        const proj = this.hunterService.throwWeapon(state, aimDir);
        this.projectiles.update(p => [...p, proj]);
      }

      // Feed on nearby edibles
      if (hunterAction === 'interact') {
        const nearby = this.itemService.findNearbyItems(state, this.items());
        const edible = nearby.find(i =>
          i.type === 'berry' || i.type === 'mushroom' || i.type === 'grub'
        );
        if (edible) {
          this.items.update(items =>
            items.map(i => i.id === edible.id ? this.itemService.pickUp(i, hunter.uid) : i)
          );
          return this.hunterService.eatEdible(state);
        }
      }

      // Enforce collisions and bounds
      if (this.collision) {
        const resolved = this.collision.resolvePosition(hunter.position, state.position);
        return { ...state, position: resolved };
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
    hunter.isCpu = hider.isCpu;
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

  // ── Input resolution ───────────────────────────────────────

  /** Return the appropriate input vector for a player (local keyboard, CPU brain, or zero). */
  private resolveInput(
    playerUid: string,
    localUid: string,
    keyboardMovement: Vec3,
    cpuMovement: Vec3 | undefined,
  ): Vec3 {
    if (playerUid === localUid) return keyboardMovement;
    if (cpuMovement) return cpuMovement;
    return { x: 0, y: 0, z: 0 };
  }
}
