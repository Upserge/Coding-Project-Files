import { inject, Injectable, signal } from '@angular/core';
import { GamePhase } from '../models/session.model';
import { HiderState, HunterState, PlayerState, Vec3, BOLO_SLOW_MS, DecoyState, ITEM_EFFECT_DURATION_MS } from '../models/player.model';
import { Item } from '../models/item.model';
import { HiderService } from './hider.service';
import { HunterService, ProjectileState } from './hunter.service';
import { ItemService } from './item.service';
import { InputService, PlayerAction } from './input.service';
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
  readonly decoys = signal<DecoyState[]>([]);
  readonly localPlayerUid = signal<string>('');

  private roundDurationMs = 600_000; // 10 minutes per round -- longer than normal for testing purposes
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
    this.decoys.set([]);
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

    const movement = this.inputService.getMovementVector();
    const action = this.inputService.consumeAction();

    this.tickRoundTimer(delta);
    this.tickHiders(delta, movement, action);
    this.tickHunters(delta, movement, action);
    this.tickProjectiles(delta);
    this.tickDecoys(delta);
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
          ? this.cpuBrain.decide(hider.uid, hider.position, delta * 1000, this.itemService.findNearbyItems(hider, this.items()), hider.inventory.some(s => s !== null))
          : undefined;

        const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
        const { state } = this.hiderService.tick(hider, delta, input);
        let lobbyState = { ...state, idleTimerMs: 0 };

        // Enforce collisions for local + CPU players
        if ((hider.uid === localUid || hider.isCpu) && this.collision) {
          const resolved = this.collision.resolvePosition(hider.position, lobbyState.position);
          lobbyState = { ...lobbyState, position: resolved };
        }

        const hiderAction = hider.isCpu ? cpuDecision?.action : action;

        // Pick up nearby hider item into inventory (F)
        if (hiderAction === 'interact' && this.hiderService.hasInventorySpace(lobbyState)) {
          const nearby = this.itemService.findNearbyItems(lobbyState, this.items());
          const hiderItem = nearby.find(i => this.itemService.isHiderItem(i.type));
          if (hiderItem && this.itemService.isHiderItem(hiderItem.type)) {
            this.items.update(items =>
              items.map(i => i.id === hiderItem.id ? this.itemService.pickUp(i, hider.uid) : i)
            );
            return this.hiderService.addToInventory(lobbyState, hiderItem.type);
          }
        }

        // Use item from slot (1 or 2, E = alias for slot 1)
        const prevActive = lobbyState.activeItem;
        if (hiderAction === 'use_slot_1' || hiderAction === 'use_item') {
          lobbyState = this.hiderService.useSlot(lobbyState, 0);
        } else if (hiderAction === 'use_slot_2') {
          lobbyState = this.hiderService.useSlot(lobbyState, 1);
        }

        // Spawn decoy on activation
        if (lobbyState.activeItem === 'decoy' && prevActive !== 'decoy') {
          this.spawnDecoy(lobbyState);
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

        const hunterAction = hunter.isCpu ? cpuDecision?.action : action;

        // Pick up nearby weapon into inventory (F)
        if (hunterAction === 'interact') {
          // Try weapon pickup first
          const nearby = this.itemService.findNearbyItems(lobbyState, this.items());
          const weaponItem = nearby.find(i => this.itemService.isWeapon(i.type));
          if (weaponItem && this.itemService.isWeapon(weaponItem.type) && this.hunterService.hasInventorySpace(lobbyState)) {
            this.items.update(items =>
              items.map(i => i.id === weaponItem.id ? this.itemService.pickUp(i, hunter.uid) : i)
            );
            return this.hunterService.addToInventory(lobbyState, weaponItem.type);
          }
          // Fall back to eating edible
          const edible = nearby.find(i => this.itemService.isEdible(i.type));
          if (edible) {
            this.items.update(items =>
              items.map(i => i.id === edible.id ? this.itemService.pickUp(i, hunter.uid) : i)
            );
            return this.hunterService.eatEdible(lobbyState);
          }
        }

        // Throw weapon from inventory slot (1, 2, or E = alias for slot 1)
        if (hunterAction === 'use_slot_1' || hunterAction === 'use_slot_2' || hunterAction === 'use_item') {
          const slotIdx = hunterAction === 'use_slot_2' ? 1 : 0;
          const aimDir = input.x !== 0 || input.z !== 0
            ? input
            : { x: 0, y: 0, z: -1 };
          const result = this.hunterService.useSlot(lobbyState, slotIdx, aimDir);
          if (result) {
            this.projectiles.update(p => [...p, result.proj]);
            return result.state;
          }
        }

        // Legacy throw (Q) — throws equipped weapon directly
        if (hunterAction === 'throw_weapon') {
          const aimDir = input.x !== 0 || input.z !== 0
            ? input
            : { x: 0, y: 0, z: -1 };
          const proj = this.hunterService.throwWeapon(lobbyState, aimDir);
          this.projectiles.update(p => [...p, proj]);
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

  private tickHiders(delta: number, movement: Vec3, action: PlayerAction): void {
    const localUid = this.localPlayerUid();

    const updatedHiders = this.hiders().map(hider => {
      const cpuDecision = hider.isCpu
        ? this.cpuBrain.decide(hider.uid, hider.position, delta * 1000, this.itemService.findNearbyItems(hider, this.items()), hider.inventory.some(s => s !== null))
        : undefined;

      const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
      const { state, result } = this.hiderService.tick(hider, delta, input);

      if (result.convertToHunter) {
        this.convertHiderToHunter(state);
        return null;
      }

      let updated = state;
      const hiderAction = hider.isCpu ? cpuDecision?.action : action;

      // Pick up nearby hider item into inventory (F)
      if (hiderAction === 'interact' && this.hiderService.hasInventorySpace(updated)) {
        const nearby = this.itemService.findNearbyItems(updated, this.items());
        const hiderItem = nearby.find(i => this.itemService.isHiderItem(i.type));
        if (hiderItem && this.itemService.isHiderItem(hiderItem.type)) {
          this.items.update(items =>
            items.map(i => i.id === hiderItem.id ? this.itemService.pickUp(i, hider.uid) : i)
          );
          updated = this.hiderService.addToInventory(updated, hiderItem.type);
        }
      }

      // Use item from slot (1 or 2, E = alias for slot 1)
      const prevActive = updated.activeItem;
      if (hiderAction === 'use_slot_1' || hiderAction === 'use_item') {
        updated = this.hiderService.useSlot(updated, 0);
      } else if (hiderAction === 'use_slot_2') {
        updated = this.hiderService.useSlot(updated, 1);
      }

      // Spawn decoy on activation
      if (updated.activeItem === 'decoy' && prevActive !== 'decoy') {
        this.spawnDecoy(updated);
      }

      // Enforce collisions and bounds
      if (this.collision) {
        const resolved = this.collision.resolvePosition(hider.position, updated.position);
        return { ...updated, position: resolved };
      }

      return updated;
    }).filter((h): h is HiderState => h !== null);

    this.hiders.set(updatedHiders);
  }

  // ── Hunter tick ────────────────────────────────────────────

  private tickHunters(delta: number, movement: Vec3, action: PlayerAction): void {
    const localUid = this.localPlayerUid();

    const updatedHunters = this.hunters().map(hunter => {
      const cpuDecision = hunter.isCpu
        ? this.cpuBrain.decide(hunter.uid, hunter.position, delta * 1000, this.itemService.findNearbyItems(hunter, this.items()), false)
        : undefined;

      const input = this.resolveInput(hunter.uid, localUid, movement, cpuDecision?.movement);
      const { state, result } = this.hunterService.tick(hunter, delta, input);

      if (result.starved) {
        return { ...state, isAlive: false };
      }

      let updated = state;
      const hunterAction = hunter.isCpu ? cpuDecision?.action : action;

      // Pick up nearby weapon or edible (F)
      if (hunterAction === 'interact') {
        const nearby = this.itemService.findNearbyItems(updated, this.items());
        const weaponItem = nearby.find(i => this.itemService.isWeapon(i.type));
        if (weaponItem && this.itemService.isWeapon(weaponItem.type) && this.hunterService.hasInventorySpace(updated)) {
          this.items.update(items =>
            items.map(i => i.id === weaponItem.id ? this.itemService.pickUp(i, hunter.uid) : i)
          );
          updated = this.hunterService.addToInventory(updated, weaponItem.type);
        } else {
          const edible = nearby.find(i => this.itemService.isEdible(i.type));
          if (edible) {
            this.items.update(items =>
              items.map(i => i.id === edible.id ? this.itemService.pickUp(i, hunter.uid) : i)
            );
            updated = this.hunterService.eatEdible(updated);
          }
        }
      }

      // Throw weapon from inventory slot (1, 2, or E = alias for slot 1)
      if (hunterAction === 'use_slot_1' || hunterAction === 'use_slot_2' || hunterAction === 'use_item') {
        const slotIdx = hunterAction === 'use_slot_2' ? 1 : 0;
        const aimDir: Vec3 = input.x !== 0 || input.z !== 0
          ? input
          : { x: 0, y: 0, z: -1 };
        const slotResult = this.hunterService.useSlot(updated, slotIdx, aimDir);
        if (slotResult) {
          this.projectiles.update(p => [...p, slotResult.proj]);
          updated = slotResult.state;
        }
      }

      // Legacy throw (Q) — throws equipped weapon directly
      if (hunterAction === 'throw_weapon') {
        const aimDir: Vec3 = input.x !== 0 || input.z !== 0
          ? input
          : { x: 0, y: 0, z: -1 };
        const proj = this.hunterService.throwWeapon(updated, aimDir);
        this.projectiles.update(p => [...p, proj]);
      }

      // Enforce collisions and bounds
      if (this.collision) {
        const resolved = this.collision.resolvePosition(hunter.position, updated.position);
        return { ...updated, position: resolved };
      }

      return updated;
    });

    this.hunters.set(updatedHunters);
  }

  // ── Projectile tick ────────────────────────────────────────

  private tickProjectiles(delta: number): void {
    const updated = this.projectiles().map(p =>
      this.hunterService.tickProjectile(p, delta),
    );
    this.projectiles.set(updated);
    this.checkProjectileHits();
  }

  // ── Projectile-hider collision ─────────────────────────────

  private readonly spearHitRadius = 1.5;
  private readonly boloHitRadius = 3.0;

  private checkProjectileHits(): void {
    const projs = this.projectiles();
    const currentHiders = this.hiders();

    const hitProjIds = new Set<string>();
    const convertUids = new Set<string>();
    const slowUids = new Set<string>();

    for (const proj of projs) {
      if (proj.isLanded) continue;

      for (const hider of currentHiders) {
        if (!hider.isAlive || convertUids.has(hider.uid)) continue;

        const dx = proj.position.x - hider.position.x;
        const dz = proj.position.z - hider.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const hitRadius = proj.type === 'bolo' ? this.boloHitRadius : this.spearHitRadius;

        if (dist <= hitRadius) {
          hitProjIds.add(proj.id);
          if (proj.type === 'spear') {
            convertUids.add(hider.uid);
          } else {
            slowUids.add(hider.uid);
          }
          break;
        }
      }
    }

    if (hitProjIds.size === 0) return;

    // Remove consumed projectiles
    this.projectiles.update(p => p.filter(proj => !hitProjIds.has(proj.id)));

    // Convert spear-hit hiders to hunters
    for (const uid of convertUids) {
      const hit = currentHiders.find(h => h.uid === uid);
      if (hit) this.convertHiderToHunter(hit);
    }

    // Apply bolo slow and remove converted hiders
    this.hiders.update(hiders =>
      hiders
        .filter(h => !convertUids.has(h.uid))
        .map(h => slowUids.has(h.uid)
          ? { ...h, slowRemainingMs: BOLO_SLOW_MS }
          : h
        )
    );
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
        if (hider.activeItem === 'smoke_bomb') continue; // smoke bomb grants catch immunity
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

  // ── Decoy lifecycle ────────────────────────────────────────

  private nextDecoyId = 0;

  private spawnDecoy(hider: HiderState): void {
    const angle = Math.random() * Math.PI * 2;
    const decoy: DecoyState = {
      id: `decoy_${this.nextDecoyId++}`,
      position: { ...hider.position },
      direction: { x: Math.cos(angle), y: 0, z: Math.sin(angle) },
      remainingMs: ITEM_EFFECT_DURATION_MS,
      animal: hider.animal,
      displayName: hider.displayName,
    };
    this.decoys.update(d => [...d, decoy]);
  }

  private tickDecoys(delta: number): void {
    const deltaMs = delta * 1000;
    const speed = 10; // world-units per second (slightly slower than hiders)
    this.decoys.update(decoys =>
      decoys
        .map(d => ({
          ...d,
          position: {
            x: d.position.x + d.direction.x * speed * delta,
            y: d.position.y,
            z: d.position.z + d.direction.z * speed * delta,
          },
          remainingMs: d.remainingMs - deltaMs,
        }))
        .filter(d => d.remainingMs > 0)
    );
  }

  // ── Conversion ─────────────────────────────────────────────

  private convertHiderToHunter(hider: HiderState): void {
    const hunter = this.playerService.createHunterState('wolf', hider.position);
    hunter.uid = hider.uid;
    hunter.displayName = hider.displayName;
    hunter.isCpu = hider.isCpu;
    hunter.inventory = ['spear', null];
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
