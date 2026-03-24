import { inject, Injectable, signal, computed } from '@angular/core';
import { GamePhase, RoundMvp, RoundWinner } from '../models/session.model';
import { HiderState, HunterState, PlayerState, Vec3, HUNTER_STAMINA_MAX, HUNTER_ANIMALS, HUNTER_HUNGER_MS } from '../models/player.model';
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
  /** Positions where survival bonus was just awarded (consumed by scene-render for floaters). */
  readonly survivalBonusPositions = signal<Vec3[]>([]);

  private roundDurationMs = 300_000; // Change how long each round lasts here
  private running = false;
  /** Per-hunter catch counter (uid → count) built up during the round. */
  private catchCounts = new Map<string, number>();

  /** Duration (seconds) to keep caught hiders visible before converting. */
  private readonly catchAnimDuration = 0.6;
  /** Pending caught hiders awaiting conversion (uid → remaining seconds). */
  private pendingCatches = new Map<string, number>();

  // ── Hider survival scoring ─────────────────────────────────
  /** Seconds between each survival score award. */
  private readonly survivalIntervalS = 30;
  /** Points awarded to each alive hider per interval. */
  private readonly survivalBonusPoints = 50;
  /** Accumulator tracking elapsed seconds since last survival award. */
  private survivalAccumulatorS = 0;
  /** Per-hider survival time in seconds (uid → seconds alive during hunting). */
  private survivalTimes = new Map<string, number>();

  // ── Hunter death / respawn ─────────────────────────────────
  /** Seconds the "YOU DIED" overlay stays before respawn. */
  private readonly deathTimerS = 3;
  /** Starved hunters awaiting respawn (uid → remaining seconds). */
  private pendingDeaths = new Map<string, number>();
  /** True while the local hunter is in the death/respawn window. */
  readonly hunterDeathActive = signal(false);
  /** Countdown seconds remaining for the local hunter's death overlay. */
  readonly hunterDeathCountdown = signal(0);

  // ── Hit-stop (brief slow-motion on catch) ──────────────────
  private timeScale = 1;
  private hitStopRemaining = 0;
  private readonly hitStopDuration = 0.15;
  private readonly hitStopScale = 0.2;

  // ── Lifecycle ──────────────────────────────────────────────

  /** Called when entering the game view — lets players roam while waiting. */
  startLobby(localUid: string, hiderCount: number, hunterCount: number): void {
    this.localPlayerUid.set(localUid);
    this.resetLobbyState();
    this.spawnLocalLobbyPlayer(localUid, hiderCount, hunterCount);
    this.phase.set('lobby');
    this.running = true;
    this.reconcileCpuLobbyPlayers();
  }

  /** Transition from lobby to active gameplay once enough players join. */
  startGame(localUid: string, hiderCount: number, hunterCount: number): void {
    if (!this.running) this.startLobby(localUid, hiderCount, hunterCount);
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
    this.survivalAccumulatorS = 0;
  }

  /** Clear all round/results state so a fresh session can start cleanly. */
  reset(): void {
    this.running = false;
    this.phase.set('lobby');
    this.resetLobbyState();
  }

  // ── Tick (called every frame by EngineService) ─────────────

  tick(delta: number): void {
    if (!this.running) return;
    const scaledDelta = this.applyHitStop(delta);
    if (this.phase() === 'results') return;
    if (this.phase() === 'lobby') return void this.tickMovementOnly(scaledDelta);
    this.tickActiveRound(scaledDelta);
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
        const cpuDecision = this.getCpuDecision(hider, delta);
        const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
        const isMoving = input.x !== 0 || input.z !== 0;

        hider = this.exitLobbyHidingIfMoving(hider, isMoving);

        const wantsHide = this.resolveHideIntent(hider.uid, localUid, wantsInteract, cpuDecision?.wantsHide);
        const hiddenHider = this.tryEnterHidingSpot(hider, wantsHide);
        if (hiddenHider) return hiddenHider;

        localNearSpot = this.getLocalNearSpot(hider, localUid, localNearSpot);

        if (hider.isHiding) return hider; // stay put while hidden in lobby

        const { state } = this.hiderService.tick(hider, delta, input);
        let lobbyState = { ...state, idleTimerMs: 0 };

        lobbyState = this.resolveHiderCollision(hider, lobbyState, localUid);

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
    const remaining = this.updateRoundTime(delta);
    const aliveHiders = this.getAliveActiveHiders();
    this.trackSurvivalTimes(aliveHiders, delta);
    this.awardSurvivalBonusIfDue(aliveHiders, delta);
    if (remaining <= 0) this.stopGame('hiders');
  }

  /** Award survival score to all alive hiders and emit positions for floaters. */
  private awardSurvivalBonus(aliveHiders: HiderState[]): void {
    const positions: Vec3[] = [];
    this.hiders.update(hiders =>
      hiders.map(h => {
        const alive = aliveHiders.some(a => a.uid === h.uid);
        if (alive) {
          positions.push({ ...h.position });
          return { ...h, score: h.score + this.survivalBonusPoints };
        }
        return h;
      }),
    );
    this.survivalBonusPositions.set(positions);
  }

  private resetLobbyState(): void {
    this.hiders.set([]);
    this.hunters.set([]);
    this.resetRoundState();
  }

  private resetRoundState(): void {
    this.pendingCatches.clear();
    this.pendingDeaths.clear();
    this.hunterDeathActive.set(false);
    this.hunterDeathCountdown.set(0);
    this.catchCounts.clear();
    this.catchFeed.set([]);
    this.roundMvp.set(null);
    this.roundWinner.set(null);
    this.timeScale = 1;
    this.hitStopRemaining = 0;
    this.survivalAccumulatorS = 0;
    this.survivalTimes.clear();
  }

  private spawnLocalLobbyPlayer(localUid: string, hiderCount: number, hunterCount: number): void {
    const map = this.mapService.generateJungleMap();
    const role = this.playerService.assignRole(hiderCount, hunterCount);
    if (role === 'hider') return void this.spawnLocalHider(localUid, hiderCount, map.spawnPoints.filter(s => s.forRole === 'hider'));
    this.spawnLocalHunter(localUid, hunterCount, map.spawnPoints.filter(s => s.forRole === 'hunter'));
  }

  private spawnLocalHider(localUid: string, hiderCount: number, spawns: { position: Vec3 }[]): void {
    const spawn = spawns[hiderCount % spawns.length];
    const animal = this.playerService.assignAnimal('hider', []);
    const hider = this.playerService.createHiderState(animal as any, spawn.position);
    hider.uid = localUid;
    this.hiders.set([hider]);
  }

  private spawnLocalHunter(localUid: string, hunterCount: number, spawns: { position: Vec3 }[]): void {
    const spawn = spawns[hunterCount % spawns.length];
    const animal = this.playerService.assignAnimal('hunter', []);
    const hunter = this.playerService.createHunterState(animal as any, spawn.position);
    hunter.uid = localUid;
    this.hunters.set([hunter]);
  }

  private reconcileCpuLobbyPlayers(): void {
    const reconciled = this.cpuSpawner.reconcile(this.hiders(), this.hunters());
    this.hiders.set(reconciled.hiders);
    this.hunters.set(reconciled.hunters);
  }

  private applyHitStop(delta: number): number {
    if (this.hitStopRemaining > 0) this.updateHitStopTimer(delta);
    return delta * this.timeScale;
  }

  private updateHitStopTimer(delta: number): void {
    this.hitStopRemaining = Math.max(0, this.hitStopRemaining - delta);
    this.timeScale = this.hitStopRemaining > 0 ? this.hitStopScale : 1;
  }

  private tickActiveRound(delta: number): void {
    const movement = this.inputService.getMovementVector();
    const wantsSprint = this.inputService.isSprinting();
    const wantsInteract = this.inputService.consumeInteract();
    this.tickRoundTimer(delta);
    this.tickHiders(delta, movement, wantsInteract);
    this.tickHunters(delta, movement, wantsSprint);
    this.processPendingDeaths(delta);
    this.checkCatches();
    this.tickPendingCatches(delta);
    this.checkWinConditions();
  }

  private updateRoundTime(delta: number): number {
    const remaining = this.roundTimeRemainingMs() - delta * 1000;
    this.roundTimeRemainingMs.set(Math.max(0, remaining));
    return remaining;
  }

  private getAliveActiveHiders(): HiderState[] {
    return this.hiders().filter(h => h.isAlive && !h.isCaught);
  }

  private trackSurvivalTimes(aliveHiders: HiderState[], delta: number): void {
    for (const hider of aliveHiders) {
      this.survivalTimes.set(hider.uid, (this.survivalTimes.get(hider.uid) ?? 0) + delta);
    }
  }

  private awardSurvivalBonusIfDue(aliveHiders: HiderState[], delta: number): void {
    this.survivalAccumulatorS += delta;
    if (this.survivalAccumulatorS < this.survivalIntervalS) return;
    this.survivalAccumulatorS -= this.survivalIntervalS;
    this.awardSurvivalBonus(aliveHiders);
  }

  // ── Hider tick ─────────────────────────────────────────────

  private tickHiders(delta: number, movement: Vec3, localWantsInteract: boolean): void {
    const localUid = this.localPlayerUid();
    let localNearSpot: Vec3 | null = null;

    const updatedHiders = this.hiders().map(hider => {
      const cpuDecision = this.getCpuDecision(hider, delta);

      const input = this.resolveInput(hider.uid, localUid, movement, cpuDecision?.movement);
      const isMoving = input.x !== 0 || input.z !== 0;

      const wantsHide = this.resolveHideIntent(hider.uid, localUid, localWantsInteract, cpuDecision?.wantsHide);

      // ── Exit hiding (local: movement key, CPU: brain no longer wants to hide) ──
      hider = this.exitRoundHidingIfNeeded(hider, wantsHide, isMoving);

      // ── Attempt to enter a hiding spot (F key / CPU) ───────
      const hiddenHider = this.tryEnterHidingSpot(hider, wantsHide);
      if (hiddenHider) return hiddenHider;

      // ── Check nearby spot for world-space prompt (local player only) ──
      localNearSpot = this.getLocalNearSpot(hider, localUid, localNearSpot);

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
      updated = this.resolveHiderCollision(hider, updated, localUid);

      return updated;
    }).filter((h): h is HiderState => h !== null);

    this.hiders.set(updatedHiders);
    this.nearHidingSpot.set(localNearSpot);
  }

  // ── Hunter tick ────────────────────────────────────────────

  private tickHunters(delta: number, movement: Vec3, wantsSprint: boolean): void {
    const localUid = this.localPlayerUid();

    const updatedHunters = this.hunters().map(hunter => {
      const cpuDecision = this.getCpuDecision(hunter, delta);
      const sprint = this.resolveHunterSprint(hunter.uid, localUid, wantsSprint, cpuDecision?.wantsSprint);
      const input = this.resolveInput(hunter.uid, localUid, movement, cpuDecision?.movement);
      const { state, result } = this.hunterService.tick(hunter, delta, input, sprint);

      const starvedHunter = this.handleHunterStarvation(state, result.starved, localUid);
      if (starvedHunter) return starvedHunter;

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

  // ── Hunter death / respawn processing ──────────────────────

  private processPendingDeaths(delta: number): void {
    const localUid = this.localPlayerUid();
    const respawned = new Set<string>();

    for (const [uid, remaining] of this.pendingDeaths) {
      this.processPendingDeath(uid, remaining, delta, localUid, respawned);
    }

    this.applyRespawnedHunters(respawned);
  }

  private respawnHunter(hunter: HunterState): HunterState {
    const spawnPos = this.collision.ejectFromObstacles({ x: 0, y: 0, z: 0 });
    return {
      ...hunter,
      position: spawnPos,
      hungerRemainingMs: HUNTER_HUNGER_MS,
      stamina: HUNTER_STAMINA_MAX,
      isAlive: true,
    };
  }

  // ── Conversion ─────────────────────────────────────────────

  private convertHiderToHunter(hider: HiderState): void {
    this.hidingService.vacate(hider.uid);
    const animal = HUNTER_ANIMALS[Math.floor(Math.random() * HUNTER_ANIMALS.length)];
    // Eject from any obstacle the hider was hiding inside
    const spawnPos = this.collision.ejectFromObstacles(hider.position);
    const hunter = this.playerService.createHunterState(animal, spawnPos);
    hunter.uid = hider.uid;
    hunter.displayName = hider.displayName;
    hunter.isCpu = hider.isCpu;
    this.hunters.update(h => [...h, hunter]);
  }

  // ── Win conditions ─────────────────────────────────────────

  private checkWinConditions(): void {
    const aliveHiders = this.hiders().filter(h => h.isAlive);
    const aliveHunters = this.hunters().filter(h => h.isAlive);
    // Hunters pending respawn still count — don't end the round while any are reviving
    const huntersEffective = aliveHunters.length + this.pendingDeaths.size;

    if (aliveHiders.length === 0) {
      this.stopGame('hunters');
      return;
    }

    if (huntersEffective === 0) {
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

  private getCpuDecision(player: PlayerState, delta: number) {
    if (!player.isCpu) return undefined;
    return this.cpuBrain.decide(player.uid, player.position, delta * 1000);
  }

  private resolveHunterSprint(
    hunterUid: string,
    localUid: string,
    localWantsSprint: boolean,
    cpuWantsSprint: boolean | undefined,
  ): boolean {
    if (hunterUid === localUid) return localWantsSprint;
    return cpuWantsSprint ?? false;
  }

  private handleHunterStarvation(
    state: HunterState,
    starved: boolean,
    localUid: string,
  ): HunterState | null {
    if (!starved) return null;
    if (this.pendingDeaths.has(state.uid)) return null;
    this.pendingDeaths.set(state.uid, this.deathTimerS);
    this.activateHunterDeathOverlay(state.uid, localUid);
    return { ...state, isAlive: false };
  }

  private activateHunterDeathOverlay(hunterUid: string, localUid: string): void {
    if (hunterUid !== localUid) return;
    this.hunterDeathActive.set(true);
    this.hunterDeathCountdown.set(this.deathTimerS);
  }

  private processPendingDeath(
    uid: string,
    remaining: number,
    delta: number,
    localUid: string,
    respawned: Set<string>,
  ): void {
    const next = remaining - delta;
    if (next <= 0) return void this.finishPendingDeath(uid, localUid, respawned);
    this.pendingDeaths.set(uid, next);
    this.updateHunterDeathCountdown(uid, localUid, next);
  }

  private finishPendingDeath(uid: string, localUid: string, respawned: Set<string>): void {
    respawned.add(uid);
    this.pendingDeaths.delete(uid);
    if (uid !== localUid) return;
    this.hunterDeathActive.set(false);
    this.hunterDeathCountdown.set(0);
  }

  private updateHunterDeathCountdown(uid: string, localUid: string, remaining: number): void {
    if (uid !== localUid) return;
    this.hunterDeathCountdown.set(Math.ceil(remaining));
  }

  private applyRespawnedHunters(respawned: Set<string>): void {
    if (respawned.size === 0) return;
    this.hunters.update(hunters =>
      hunters.map(hunter => respawned.has(hunter.uid) ? this.respawnHunter(hunter) : hunter),
    );
  }

  private resolveHideIntent(
    playerUid: string,
    localUid: string,
    localWantsInteract: boolean,
    cpuWantsHide: boolean | undefined,
  ): boolean {
    if (playerUid === localUid) return localWantsInteract;
    return cpuWantsHide ?? false;
  }

  private exitLobbyHidingIfMoving(hider: HiderState, isMoving: boolean): HiderState {
    if (!hider.isHiding || !isMoving) return hider;
    return this.clearHidingState(hider);
  }

  private exitRoundHidingIfNeeded(hider: HiderState, wantsHide: boolean, isMoving: boolean): HiderState {
    if (!hider.isHiding) return hider;
    const shouldExit = hider.isCpu ? !wantsHide : isMoving;
    if (!shouldExit) return hider;
    return this.clearHidingState(hider);
  }

  private clearHidingState(hider: HiderState): HiderState {
    this.hidingService.vacate(hider.uid);
    return { ...hider, isHiding: false, hidingSpotId: null };
  }

  private tryEnterHidingSpot(hider: HiderState, wantsHide: boolean): HiderState | null {
    if (!wantsHide || hider.isHiding) return null;
    const spot = this.hidingService.getNearbyHidingSpot(hider.position);
    if (!spot || !this.hidingService.occupy(spot.id, hider.uid)) return null;
    return {
      ...hider,
      isHiding: true,
      hidingSpotId: spot.id,
      position: { x: spot.position.x, y: hider.position.y, z: spot.position.z },
      idleTimerMs: 0,
    };
  }

  private getLocalNearSpot(
    hider: HiderState,
    localUid: string,
    currentNearSpot: Vec3 | null,
  ): Vec3 | null {
    if (hider.uid !== localUid || hider.isHiding) return currentNearSpot;
    const nearby = this.hidingService.getNearbyHidingSpot(hider.position);
    return nearby ? { ...nearby.position } : null;
  }

  private resolveHiderCollision(hider: HiderState, updated: HiderState, localUid: string): HiderState {
    if (!this.collision) return updated;
    if (hider.uid !== localUid && !hider.isCpu) return updated;
    const resolved = this.collision.resolvePosition(hider.position, updated.position, undefined, true);
    return { ...updated, position: resolved };
  }

  // ── MVP computation ────────────────────────────────────────

  private computeRoundMvp(): void {
    const allPlayers = [...this.hiders(), ...this.hunters()];
    if (allPlayers.length === 0) {
      this.roundMvp.set(null);
      return;
    }

    const winner = this.roundWinner();

    // Hiders win → MVP is the hider who survived the longest
    const top = winner === 'hiders'
      ? this.pickLongestSurvivor(allPlayers)
      : this.pickTopScorer(allPlayers);

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

  /** Select the hider with the longest survival time; falls back to top scorer. */
  private pickLongestSurvivor(players: PlayerState[]): PlayerState {
    const hiders = players.filter(p => p.role === 'hider');
    if (hiders.length === 0) return this.pickTopScorer(players);

    return [...hiders].sort((a, b) =>
      (this.survivalTimes.get(b.uid) ?? 0) - (this.survivalTimes.get(a.uid) ?? 0),
    )[0];
  }

  /** Select the player with the highest score. */
  private pickTopScorer(players: PlayerState[]): PlayerState {
    return [...players].sort((a, b) => b.score - a.score)[0];
  }
}
