import { inject, Injectable, signal, computed } from '@angular/core';
import { GamePhase, RoundWinner } from '../models/session.model';
import { HiderState, HunterState, PlayerState, Vec3, HUNTER_ANIMALS } from '../models/player.model';
import { HiderService } from './hider.service';
import { HunterService } from './hunter.service';
import { InputService } from './input.service';
import { MapService } from './map.service';
import { CollisionService } from './collision.service';
import { PlayerService } from './player.service';
import { CpuBrainService } from './cpu-brain.service';
import { CpuSpawnerService } from './cpu-spawner.service';
import { HidingService } from './hiding.service';
import { RoundScoringService } from './round-scoring.service';
import { CatchHandlerService } from './catch-handler.service';
import { HunterRespawnService } from './hunter-respawn.service';

/**
 * GameLoopService is the central orchestrator:
 * - Owns the phase state machine (lobby → hiding → hunting → results)
 * - Distributes delta to role-specific services each tick
 * - Delegates scoring, catches, and respawn to focused services
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
  private readonly scoring = inject(RoundScoringService);
  private readonly catchHandler = inject(CatchHandlerService);
  private readonly respawn = inject(HunterRespawnService);

  // ── Observable state (signals for UI binding) ──────────────
  readonly phase = signal<GamePhase>('lobby');
  readonly roundTimeRemainingMs = signal(0);
  readonly hiders = signal<HiderState[]>([]);
  readonly hunters = signal<HunterState[]>([]);
  readonly localPlayerUid = signal<string>('');
  readonly nearHidingSpot = signal<Vec3 | null>(null);
  readonly hidingCostPositions = signal<Vec3[]>([]);
  readonly roundWinner = signal<RoundWinner>(null);

  // Delegated signals (re-exposed for consumers)
  readonly catchFeed = this.catchHandler.catchFeed;
  readonly catchScorePositions = this.catchHandler.catchScorePositions;
  readonly survivalBonusPositions = this.scoring.survivalBonusPositions;
  readonly roundMvp = this.scoring.roundMvp;
  readonly roundMvps = this.scoring.roundMvps;
  readonly hunterDeathActive = this.respawn.hunterDeathActive;
  readonly hunterDeathCountdown = this.respawn.hunterDeathCountdown;

  readonly lastHiderStanding = computed(() =>
    this.phase() === 'hunting' && this.hiders().filter(h => h.isAlive && !h.isCaught).length === 1
  );
  readonly mvpHunterUid = computed(() => {
    const hunters = this.hunters();
    if (hunters.length === 0) return null;
    const top = hunters.reduce((best, h) => (h.kills > best.kills ? h : best), hunters[0]);
    return top.kills > 0 ? top.uid : null;
  });
  readonly mvpHiderUid = computed(() => {
    const hiders = this.hiders().filter(h => h.isAlive && !h.isCaught);
    if (hiders.length === 0) return null;
    const top = hiders.reduce((best, h) => (h.score > best.score ? h : best), hiders[0]);
    return top.uid;
  });

  private roundDurationMs = 300_000;
  private running = false;

  // ── Lifecycle ──────────────────────────────────────────────

  startLobby(localUid: string, hiderCount: number, hunterCount: number, sessionPlayer?: PlayerState): void {
    this.localPlayerUid.set(localUid);
    this.resetLobbyState();
    this.spawnLocalLobbyPlayer(localUid, hiderCount, hunterCount, sessionPlayer);
    this.phase.set('lobby');
    this.running = true;
    this.reconcileCpuLobbyPlayers();
  }

  startGame(localUid: string, hiderCount: number, hunterCount: number, sessionPlayer?: PlayerState): void {
    if (!this.running) this.startLobby(localUid, hiderCount, hunterCount, sessionPlayer);
    this.phase.set('hunting');
    this.roundTimeRemainingMs.set(this.roundDurationMs);
    this.updateRoundSnapshots();
  }

  stopGame(winner: RoundWinner = null): void {
    this.running = false;
    this.roundWinner.set(winner);
    this.updateRoundSnapshots();
    this.scoring.computeRoundMvp(this.hiders(), this.hunters(), winner);
    this.phase.set('results');
    this.cpuSpawner.dispose();
    this.hidingService.clear();
    this.catchHandler.reset();
    this.scoring.reset();
  }

  reset(): void {
    this.running = false;
    this.phase.set('lobby');
    this.resetLobbyState();
  }

  // ── Tick (called every frame by EngineService) ─────────────

  tick(delta: number): void {
    if (!this.running) return;
    if (this.phase() === 'results') return;
    if (this.phase() === 'lobby') return void this.tickMovementOnly(delta);
    this.tickActiveRound(delta);
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

  // ── Lobby-mode tick (movement only, no consequences) ────

  private tickMovementOnly(delta: number): void {
    const localUid = this.localPlayerUid();
    const movement = this.inputService.getMovementVector();
    const wantsInteract = this.inputService.consumeInteract();
    let localNearSpot: Vec3 | null = null;

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
        if (hider.isHiding) return hider;

        const { state } = this.hiderService.tick(hider, delta, input);
        let lobbyState = { ...state, idleTimerMs: 0 };
        lobbyState = this.resolveHiderCollision(hider, lobbyState, localUid);
        return lobbyState;
      }),
    );
    this.nearHidingSpot.set(localNearSpot);

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

  // ── Active round ──────────────────────────────────────────

  private tickActiveRound(delta: number): void {
    const movement = this.inputService.getMovementVector();
    const wantsSprint = this.inputService.isSprinting();
    const wantsInteract = this.inputService.consumeInteract();
    this.tickRoundTimer(delta);
    this.tickHiders(delta, movement, wantsInteract);
    this.tickHunters(delta, movement, wantsSprint);
    this.processDeathsAndCatches(delta);
    this.updateRoundSnapshots();
    this.checkWinConditions();
  }

  private tickRoundTimer(delta: number): void {
    const remaining = this.roundTimeRemainingMs() - delta * 1000;
    this.roundTimeRemainingMs.set(Math.max(0, remaining));
    const aliveHiders = this.hiders().filter(h => h.isAlive && !h.isCaught);
    this.scoring.trackSurvivalTimes(aliveHiders, delta);
    if (this.scoring.tickSurvivalAccumulator(delta)) {
      this.hiders.set(this.scoring.awardSurvivalBonus(this.hiders(), aliveHiders));
    }
    if (remaining <= 0) this.stopGame('hiders');
  }

  private processDeathsAndCatches(delta: number): void {
    const localUid = this.localPlayerUid();
    const respawned = this.respawn.processPendingDeaths(delta, localUid);
    if (respawned.size > 0) {
      this.hunters.update(h => h.map(hunter =>
        respawned.has(hunter.uid) ? this.respawn.respawnHunter(hunter) : hunter,
      ));
    }

    const catchResult = this.catchHandler.checkCatches(this.hunters(), this.hiders());
    if (catchResult) {
      this.hunters.set(catchResult.updatedHunters);
      this.hiders.set(catchResult.updatedHiders);
    }

    const converted = this.catchHandler.tickPendingCatches(delta);
    if (converted.size > 0) {
      for (const uid of converted) {
        const hider = this.hiders().find(h => h.uid === uid);
        if (hider) this.convertHiderToHunter(hider);
      }
      this.hiders.update(h => h.filter(hider => !converted.has(hider.uid)));
    }
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

      hider = this.exitRoundHidingIfNeeded(hider, wantsHide, isMoving);

      const hiddenHider = this.tryEnterHidingSpot(hider, wantsHide);
      if (hiddenHider) return hiddenHider;

      localNearSpot = this.getLocalNearSpot(hider, localUid, localNearSpot);

      if (hider.isHiding) {
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
      return this.resolveHiderCollision(hider, state, localUid);
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

      const starved = this.respawn.handleStarvation(state, result.starved, localUid);
      if (starved) return starved;

      if (!this.collision) return state;
      const resolved = this.collision.resolvePosition(hunter.position, state.position);
      return { ...state, position: resolved };
    });

    this.hunters.set(updatedHunters);
  }

  // ── Conversion ─────────────────────────────────────────────

  private convertHiderToHunter(hider: HiderState): void {
    this.scoring.snapshotHiderOnConvert(hider);
    this.hidingService.vacate(hider.uid);
    const animal = HUNTER_ANIMALS[Math.floor(Math.random() * HUNTER_ANIMALS.length)];
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
    const huntersEffective = this.hunters().filter(h => h.isAlive).length + this.respawn.pendingCount;

    if (aliveHiders.length === 0) return void this.stopGame('hunters');
    if (huntersEffective === 0) this.stopGame('hiders');
  }

  // ── Input resolution ───────────────────────────────────────

  private resolveInput(uid: string, localUid: string, keyboard: Vec3, cpu: Vec3 | undefined): Vec3 {
    if (uid === localUid) return keyboard;
    return cpu ?? { x: 0, y: 0, z: 0 };
  }

  private getCpuDecision(player: PlayerState, delta: number) {
    if (!player.isCpu) return undefined;
    return this.cpuBrain.decide(player.uid, player.position, delta * 1000);
  }

  private resolveHunterSprint(uid: string, localUid: string, local: boolean, cpu: boolean | undefined): boolean {
    return uid === localUid ? local : (cpu ?? false);
  }

  private resolveHideIntent(uid: string, localUid: string, local: boolean, cpu: boolean | undefined): boolean {
    return uid === localUid ? local : (cpu ?? false);
  }

  // ── Hiding helpers ─────────────────────────────────────────

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
    this.hidingCostPositions.update(p => [...p, { ...hider.position }]);
    return {
      ...hider,
      isHiding: true,
      hidingSpotId: spot.id,
      position: { x: spot.position.x, y: hider.position.y, z: spot.position.z },
      idleTimerMs: 0,
      score: Math.max(0, hider.score - 10),
    };
  }

  private getLocalNearSpot(hider: HiderState, localUid: string, current: Vec3 | null): Vec3 | null {
    if (hider.uid !== localUid || hider.isHiding) return current;
    const nearby = this.hidingService.getNearbyHidingSpot(hider.position);
    return nearby ? { ...nearby.position } : null;
  }

  private resolveHiderCollision(hider: HiderState, updated: HiderState, localUid: string): HiderState {
    if (!this.collision) return updated;
    if (hider.uid !== localUid && !hider.isCpu) return updated;
    const resolved = this.collision.resolvePosition(hider.position, updated.position, undefined, true);
    return { ...updated, position: resolved };
  }

  // ── Snapshots ──────────────────────────────────────────────

  private updateRoundSnapshots(): void {
    for (const hider of this.hiders()) this.scoring.snapshotHider(hider);
    for (const hunter of this.hunters()) this.scoring.snapshotHunter(hunter);
  }

  // ── Spawning ──────────────────────────────────────────────

  private resetLobbyState(): void {
    this.hiders.set([]);
    this.hunters.set([]);
    this.scoring.reset();
    this.catchHandler.reset();
    this.respawn.reset();
    this.roundWinner.set(null);
  }

  private spawnLocalLobbyPlayer(localUid: string, hiderCount: number, hunterCount: number, sessionPlayer?: PlayerState): void {
    const map = this.mapService.generateJungleMap();
    const role = sessionPlayer?.role ?? this.playerService.assignRole(hiderCount, hunterCount);
    const spawns = map.spawnPoints.filter(s => s.forRole === role);
    if (role === 'hider') return void this.spawnLocalHider(localUid, hiderCount, spawns, sessionPlayer?.animal);
    this.spawnLocalHunter(localUid, hunterCount, spawns, sessionPlayer?.animal);
  }

  private spawnLocalHider(localUid: string, hiderCount: number, spawns: { position: Vec3 }[], animal?: string): void {
    const spawn = spawns[hiderCount % spawns.length];
    const picked = animal ?? this.playerService.assignAnimal('hider', []);
    const hider = this.playerService.createHiderState(picked as any, spawn.position);
    hider.uid = localUid;
    this.hiders.set([hider]);
  }

  private spawnLocalHunter(localUid: string, hunterCount: number, spawns: { position: Vec3 }[], animal?: string): void {
    const spawn = spawns[hunterCount % spawns.length];
    const picked = animal ?? this.playerService.assignAnimal('hunter', []);
    const hunter = this.playerService.createHunterState(picked as any, spawn.position);
    hunter.uid = localUid;
    this.hunters.set([hunter]);
  }

  private reconcileCpuLobbyPlayers(): void {
    const reconciled = this.cpuSpawner.reconcile(this.hiders(), this.hunters());
    this.hiders.set(reconciled.hiders);
    this.hunters.set(reconciled.hunters);
  }
}
