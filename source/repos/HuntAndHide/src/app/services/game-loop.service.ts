import { inject, Injectable, signal, computed } from '@angular/core';
import { GamePhase, RoundMvp, RoundWinner } from '../models/session.model';
import { HiderState, HunterState, PlayerState, Vec3, HUNTER_STAMINA_MAX } from '../models/player.model';
import { HiderService } from './hider.service';
import { HunterService } from './hunter.service';
import { InputService } from './input.service';
import { MapService } from './map.service';
import { CollisionService } from './collision.service';
import { PlayerService } from './player.service';
import { CpuBrainService } from './cpu-brain.service';
import { CpuSpawnerService } from './cpu-spawner.service';
import { HidingService } from './hiding.service';

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
  private readonly inputService = inject(InputService);
  private readonly mapService = inject(MapService);
  private readonly collision = inject(CollisionService);
  private readonly playerService = inject(PlayerService);
  private readonly cpuBrain = inject(CpuBrainService);
  private readonly cpuSpawner = inject(CpuSpawnerService);
  private readonly hidingService = inject(HidingService);

  // ── Observable state (signals for UI binding) ──────────────
  readonly phase = signal<GamePhase>('lobby');
  readonly roundTimeRemainingMs = signal(0);
  readonly hiders = signal<HiderState[]>([]);
  readonly hunters = signal<HunterState[]>([]);
  readonly localPlayerUid = signal<string>('');
  /** World position of the nearest unoccupied hiding spot (null when none). */
  readonly nearHidingSpot = signal<Vec3 | null>(null);
  /** Recent catch events for the HUD kill-feed (auto-expire after display). */
  readonly catchFeed = signal<{ hunterName: string; hiderName: string; time: number }[]>([]);
  /** True when exactly one alive (non-caught) hider remains during hunting phase. */
  readonly lastHiderStanding = computed(() =>
    this.phase() === 'hunting' && this.hiders().filter(h => h.isAlive && !h.isCaught).length === 1
  );
  /** MVP stats computed at round end for the scoreboard ceremony. */
  readonly roundMvp = signal<RoundMvp | null>(null);
  /** Which team won the round (null before results). */
  readonly roundWinner = signal<RoundWinner>(null);

  private roundDurationMs = 100_000; // 10 minutes per round -- longer than normal for testing purposes
  private running = false;
  /** Per-hunter catch counter (uid → count) built up during the round. */
  private catchCounts = new Map<string, number>();

  /** Duration (seconds) to keep caught hiders visible before converting. */
  private readonly catchAnimDuration = 0.6;
  /** Pending caught hiders awaiting conversion (uid → remaining seconds). */
  private pendingCatches = new Map<string, number>();

  // ── Hit-stop (brief slow-motion on catch) ──────────────────
  private timeScale = 1;
  private hitStopRemaining = 0;
  private readonly hitStopDuration = 0.15;
  private readonly hitStopScale = 0.2;

  // ── Lifecycle ──────────────────────────────────────────────

  /** Called when entering the game view — lets players roam while waiting. */
  startLobby(localUid: string, hiderCount: number, hunterCount: number): void {
    this.localPlayerUid.set(localUid);

    // Clear stale state from any previous round
    this.hiders.set([]);
    this.hunters.set([]);
    this.pendingCatches.clear();
    this.catchCounts.clear();
    this.catchFeed.set([]);
    this.roundMvp.set(null);
    this.roundWinner.set(null);
    this.timeScale = 1;
    this.hitStopRemaining = 0;

    const map = this.mapService.generateJungleMap();
    const hiderSpawns = map.spawnPoints.filter(s => s.forRole === 'hider');
    const hunterSpawns = map.spawnPoints.filter(s => s.forRole === 'hunter');

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

  stopGame(winner: RoundWinner = null): void {
    this.running = false;
    this.roundWinner.set(winner);
    this.computeRoundMvp();
    this.phase.set('results');
    this.cpuSpawner.dispose();
    this.hidingService.clear();
    this.pendingCatches.clear();
    this.catchCounts.clear();
  }

  // ── Tick (called every frame by EngineService) ─────────────

  tick(delta: number): void {
    if (!this.running) return;

    // Advance hit-stop timer with raw delta, then scale game delta
    if (this.hitStopRemaining > 0) {
      this.hitStopRemaining = Math.max(0, this.hitStopRemaining - delta);
      this.timeScale = this.hitStopRemaining > 0 ? this.hitStopScale : 1;
    }
    delta *= this.timeScale;

    const currentPhase = this.phase();
    if (currentPhase === 'results') return;

    // Lobby: movement + item pickup only (no catches, no win, no timers)
    if (currentPhase === 'lobby') {
      this.tickMovementOnly(delta);
      return;
    }

    const movement = this.inputService.getMovementVector();
    const wantsSprint = this.inputService.isSprinting();
    const wantsInteract = this.inputService.consumeInteract();

    this.tickRoundTimer(delta);
    this.tickHiders(delta, movement, wantsInteract);
    this.tickHunters(delta, movement, wantsSprint);
    this.checkCatches();
    this.tickPendingCatches(delta);
    this.checkWinConditions();
  }

  // ── Lobby-mode tick (movement only, no consequences) ────

  private tickMovementOnly(delta: number): void {
    const localUid = this.localPlayerUid();
    const movement = this.inputService.getMovementVector();
    const wantsInteract = this.inputService.consumeInteract();
    let localNearSpot: Vec3 | null = null;

    // Move hiders (no idle timer, no conversion)
    this.hiders.update(hiders =>
      hiders.map(hider => {
        const cpuDecision = hider.isCpu
          ? this.cpuBrain.decide(hider.uid, hider.position, delta * 1000)
          : undefined;

        const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
        const isMoving = input.x !== 0 || input.z !== 0;

        // Exit hiding on movement
        if (hider.isHiding && isMoving) {
          this.hidingService.vacate(hider.uid);
          hider = { ...hider, isHiding: false, hidingSpotId: null };
        }

        // Attempt to enter a hiding spot (F key / CPU)
        const wantsHide = hider.uid === localUid ? wantsInteract : (cpuDecision?.wantsHide ?? false);
        if (wantsHide && !hider.isHiding) {
          const spot = this.hidingService.getNearbyHidingSpot(hider.position);
          if (spot && this.hidingService.occupy(spot.id, hider.uid)) {
            return {
              ...hider,
              isHiding: true,
              hidingSpotId: spot.id,
              position: { x: spot.position.x, y: hider.position.y, z: spot.position.z },
              idleTimerMs: 0,
            };
          }
        }

        // World-space prompt for local player
        if (hider.uid === localUid && !hider.isHiding) {
          const nearby = this.hidingService.getNearbyHidingSpot(hider.position);
          localNearSpot = nearby ? { ...nearby.position } : null;
        }

        if (hider.isHiding) return hider; // stay put while hidden in lobby

        const { state } = this.hiderService.tick(hider, delta, input);
        let lobbyState = { ...state, idleTimerMs: 0 };

        if ((hider.uid === localUid || hider.isCpu) && this.collision) {
          const resolved = this.collision.resolvePosition(hider.position, lobbyState.position, undefined, true);
          lobbyState = { ...lobbyState, position: resolved };
        }

        return lobbyState;
      }),
    );
    this.nearHidingSpot.set(localNearSpot);

    // Move hunters (no hunger drain, no starvation)
    this.hunters.update(hunters =>
      hunters.map(hunter => {
        const cpuDecision = hunter.isCpu
          ? this.cpuBrain.decide(hunter.uid, hunter.position, delta * 1000)
          : undefined;

        const wantsSprint = hunter.uid === localUid
          ? this.inputService.isSprinting()
          : (cpuDecision?.wantsSprint ?? false);
        const input = this.resolveInput(hunter.uid, localUid, movement, cpuDecision?.movement);
        const { state } = this.hunterService.tick(hunter, delta, input, wantsSprint);
        let lobbyState = { ...state, hungerRemainingMs: hunter.hungerRemainingMs };

        if ((hunter.uid === localUid || hunter.isCpu) && this.collision) {
          const resolved = this.collision.resolvePosition(hunter.position, lobbyState.position);
          lobbyState = { ...lobbyState, position: resolved };
        }

        return lobbyState;
      }),
    );
  }

  // ── Round timer ────────────────────────────────────────────

  private tickRoundTimer(delta: number): void {
    const remaining = this.roundTimeRemainingMs() - delta * 1000;
    this.roundTimeRemainingMs.set(Math.max(0, remaining));

    if (remaining <= 0) {
      // Time's up — hiders win this round
      this.stopGame('hiders');
    }
  }

  // ── Hider tick ─────────────────────────────────────────────

  private tickHiders(delta: number, movement: Vec3, localWantsInteract: boolean): void {
    const localUid = this.localPlayerUid();
    let localNearSpot: Vec3 | null = null;

    const updatedHiders = this.hiders().map(hider => {
      const cpuDecision = hider.isCpu
        ? this.cpuBrain.decide(hider.uid, hider.position, delta * 1000)
        : undefined;

      const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
      const isMoving = input.x !== 0 || input.z !== 0;

      // ── Exit hiding on movement ───────────────────────────
      if (hider.isHiding && isMoving) {
        this.hidingService.vacate(hider.uid);
        hider = { ...hider, isHiding: false, hidingSpotId: null };
      }

      // ── Attempt to enter a hiding spot (F key / CPU) ───────
      const wantsHide = hider.uid === localUid ? localWantsInteract : (cpuDecision?.wantsHide ?? false);
      if (wantsHide && !hider.isHiding) {
        const spot = this.hidingService.getNearbyHidingSpot(hider.position);
        if (spot && this.hidingService.occupy(spot.id, hider.uid)) {
          return {
            ...hider,
            isHiding: true,
            hidingSpotId: spot.id,
            position: { x: spot.position.x, y: hider.position.y, z: spot.position.z },
            idleTimerMs: 0,
          };
        }
      }

      // ── Check nearby spot for world-space prompt (local player only) ──
      if (hider.uid === localUid && !hider.isHiding) {
        const nearby = this.hidingService.getNearbyHidingSpot(hider.position);
        localNearSpot = nearby ? { ...nearby.position } : null;
      }

      // ── Normal movement tick ─────────────────────────────────
      if (hider.isHiding) {
        // While hidden, only tick idle timer (no movement)
        const { state, result } = this.hiderService.tick(hider, delta, { x: 0, y: 0, z: 0 });
        if (result.convertToHunter) {
          this.hidingService.vacate(state.uid);
          this.convertHiderToHunter(state);
          return null;
        }
        return state;
      }

      const { state, result } = this.hiderService.tick(hider, delta, input);

      if (result.convertToHunter) {
        this.convertHiderToHunter(state);
        return null;
      }

      let updated = state;

      // Enforce collisions and bounds (hiders can walk through hiding obstacles)
      if (this.collision) {
        const resolved = this.collision.resolvePosition(hider.position, updated.position, undefined, true);
        updated = { ...updated, position: resolved };
      }

      return updated;
    }).filter((h): h is HiderState => h !== null);

    this.hiders.set(updatedHiders);
    this.nearHidingSpot.set(localNearSpot);
  }

  // ── Hunter tick ────────────────────────────────────────────

  private tickHunters(delta: number, movement: Vec3, wantsSprint: boolean): void {
    const localUid = this.localPlayerUid();

    const updatedHunters = this.hunters().map(hunter => {
      const cpuDecision = hunter.isCpu
        ? this.cpuBrain.decide(hunter.uid, hunter.position, delta * 1000)
        : undefined;

      const sprint = hunter.uid === localUid ? wantsSprint : (cpuDecision?.wantsSprint ?? false);
      const input = this.resolveInput(hunter.uid, localUid, movement, cpuDecision?.movement);
      const { state, result } = this.hunterService.tick(hunter, delta, input, sprint);

      if (result.starved) {
        return { ...state, isAlive: false };
      }

      let updated = state;

      // Enforce collisions and bounds
      if (this.collision) {
        const resolved = this.collision.resolvePosition(hunter.position, updated.position);
        updated = { ...updated, position: resolved };
      }

      return updated;
    });

    this.hunters.set(updatedHunters);
  }

  // ── Catch detection ────────────────────────────────────────

  private checkCatches(): void {
    const currentHunters = this.hunters();
    const currentHiders = this.hiders();
    const catchPairs: { hunterName: string; hiderName: string; hiderUid: string }[] = [];

    const updatedHunters = currentHunters.map(hunter => {
      if (!hunter.isAlive) return hunter;

      for (const hider of currentHiders) {
        if (hider.isCaught) continue;
        if (catchPairs.some(p => p.hiderUid === hider.uid)) continue;
        if (this.hunterService.canCatch(hunter, hider)) {
          catchPairs.push({ hunterName: hunter.displayName, hiderName: hider.displayName, hiderUid: hider.uid });
          return this.hunterService.performCatch(hunter, hider);
        }
      }
      return hunter;
    });

    if (catchPairs.length > 0) {
      this.hunters.set(updatedHunters);
      this.hitStopRemaining = this.hitStopDuration;

      // Track per-hunter catch counts for MVP
      for (const pair of catchPairs) {
        const hunter = updatedHunters.find(h => h.displayName === pair.hunterName);
        if (hunter) {
          this.catchCounts.set(hunter.uid, (this.catchCounts.get(hunter.uid) ?? 0) + 1);
        }
      }

      const now = Date.now();
      this.catchFeed.update(f => [
        ...f,
        ...catchPairs.map(p => ({ hunterName: p.hunterName, hiderName: p.hiderName, time: now })),
      ]);

      const caughtUids = new Set(catchPairs.map(p => p.hiderUid));
      this.hiders.update(h => h.map(hider => {
        if (caughtUids.has(hider.uid)) {
          this.hidingService.vacate(hider.uid);
          this.pendingCatches.set(hider.uid, this.catchAnimDuration);
          return { ...hider, isCaught: true, isAlive: false, isHiding: false, hidingSpotId: null };
        }
        return hider;
      }));
    }
  }

  /** Tick pending catches — convert to hunters once animation finishes. */
  private tickPendingCatches(delta: number): void {
    // Expire old kill-feed entries (display for 3 seconds)
    const now = Date.now();
    this.catchFeed.update(f => f.filter(e => now - e.time < 3000));

    if (this.pendingCatches.size === 0) return;
    const converted = new Set<string>();

    for (const [uid, remaining] of this.pendingCatches) {
      const t = remaining - delta;
      if (t <= 0) {
        converted.add(uid);
        this.pendingCatches.delete(uid);
        const hider = this.hiders().find(h => h.uid === uid);
        if (hider) this.convertHiderToHunter(hider);
      } else {
        this.pendingCatches.set(uid, t);
      }
    }

    if (converted.size > 0) {
      this.hiders.update(h => h.filter(hider => !converted.has(hider.uid)));
    }
  }

  // ── Conversion ─────────────────────────────────────────────

  private convertHiderToHunter(hider: HiderState): void {
    this.hidingService.vacate(hider.uid);
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

    if (aliveHiders.length === 0) {
      this.stopGame('hunters');
      return;
    }

    if (aliveHunters.length === 0) {
      this.stopGame('hiders');
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

  // ── MVP computation ────────────────────────────────────────

  private computeRoundMvp(): void {
    const allPlayers = [...this.hiders(), ...this.hunters()];
    if (allPlayers.length === 0) {
      this.roundMvp.set(null);
      return;
    }

    // Find top scorer
    const sorted = [...allPlayers].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const catches = this.catchCounts.get(top.uid) ?? 0;
    const survived = top.role === 'hider' ? top.isAlive : true;

    this.roundMvp.set({
      displayName: top.displayName,
      role: top.role,
      score: top.score,
      catches,
      survived,
    });
  }
}
