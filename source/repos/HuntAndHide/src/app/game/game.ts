import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  viewChild,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { Subscription, firstValueFrom } from 'rxjs';
import { EngineService } from '../engine/engine.service';
import { SceneRenderService } from '../engine/scene-render.service';
import { GameLoopService } from '../services/game-loop.service';
import { SessionService } from '../services/session.service';
import { IdentityService } from '../services/identity.service';
import { InputService } from '../services/input.service';
import { PlayerService } from '../services/player.service';
import { LeaderboardService } from '../services/leaderboard.service';
import { FullscreenService } from '../services/fullscreen.service';
import { HudComponent } from '../hud/hud';
import { GameSession, RoundMvp, RoundWinner } from '../models/session.model';
import { PlayerState, PlayerRole } from '../models/player.model';

/** Total player slots (real + CPU). */
const TOTAL_PLAYER_SLOTS = 10;

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [HudComponent, UpperCasePipe],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class GameComponent implements AfterViewInit, OnDestroy {
  private readonly engine = inject(EngineService);
  private readonly sceneRender = inject(SceneRenderService);
  private readonly gameLoop = inject(GameLoopService);
  private readonly sessionService = inject(SessionService);
  private readonly identity = inject(IdentityService);
  private readonly inputService = inject(InputService);
  private readonly playerService = inject(PlayerService);
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly fullscreen = inject(FullscreenService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gameCanvas');
  readonly viewportRef = viewChild.required<ElementRef<HTMLDivElement>>('gameViewport');
  private resizeObserver!: ResizeObserver;
  private sessionSub?: Subscription;
  private paramSub?: Subscription;
  private lobbyStarted = false;
  private gameStarted = false;
  private engineReady = false;
  private resultRecorded = false;
  private currentSessionId = '';

  // ── Lobby state (signals for template) ─────────────────────
  protected readonly inLobby = signal(true);
  protected readonly playerCount = signal(0);
  protected readonly minPlayers = TOTAL_PLAYER_SLOTS;

  // ── Round-results overlay (signals for template) ──────────
  protected readonly showResults = computed(() => this.gameLoop.phase() === 'results');
  protected readonly roundWinner = this.gameLoop.roundWinner;
  protected readonly roundMvp = this.gameLoop.roundMvp;
  protected readonly isFullscreen = this.fullscreen.isActive;
  protected readonly roundPlayers = computed(() => {
    const all: PlayerState[] = [...this.gameLoop.hiders(), ...this.gameLoop.hunters()];
    return [...all].sort((a, b) => b.score - a.score);
  });
  protected readonly isJoining = signal(false);

  protected readonly waitingMessage = computed(() => {
    const count = this.playerCount();
    return count >= TOTAL_PLAYER_SLOTS
      ? 'Starting game...'
      : `Players: ${count} / ${TOTAL_PLAYER_SLOTS} (CPU filling remaining slots)`;
  });

  async ngAfterViewInit(): Promise<void> {
    this.fullscreen.registerTarget(this.viewportRef().nativeElement);
    const canvas = this.canvasRef().nativeElement;
    await this.initEngine(canvas);
    this.observeViewportResize(canvas);
    this.subscribeToRouteParams();
  }

  @HostListener('window:keydown', ['$event'])
  protected onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'F11') return;
    event.preventDefault();
    this.toggleFullscreen();
  }

  /** Initialize (or reinitialize) the session subscription and game state. */
  private initSession(sessionId: string): void {
    this.resetSessionState(sessionId);
    this.sessionSub = this.sessionService.getSession$(sessionId).subscribe({
      next: session => this.handleSessionSnapshot(session),
      error: err => console.error('[Game] Session subscription error:', err),
    });
  }

  ngOnDestroy(): void {
    this.disposeViewResources();
    this.cleanupSession();
  }

  protected toggleFullscreen(): void {
    this.fullscreen.toggle();
  }

  // ── Per-frame scene sync ───────────────────────────────────

  private syncScene(delta: number): void {
    const uid = this.identity.getToken();
    this.recordRoundResultIfNeeded();
    this.syncPlayerMeshes(uid, delta);
    this.sceneRender.setHideSpot(this.gameLoop.nearHidingSpot());
    this.syncSurvivalBonusFloaters();
    this.sceneRender.tickParticles(delta);
    this.followLocalPlayer(delta);
  }

  private onSessionUpdate(session: GameSession): void {
    // Total displayed count includes CPU players from the game loop
    const totalPlayers = this.gameLoop.hiders().length + this.gameLoop.hunters().length;
    this.playerCount.set(totalPlayers);

    // Transition to gameplay when the host starts the game (phase set to 'hunting')
    if (!this.gameStarted && session.phase === 'hunting') {
      this.startGameplay(session);
    }
  }

  private startGameplay(session: GameSession): void {
    this.gameStarted = true;
    this.inLobby.set(false);

    const uid = this.identity.getToken();
    this.gameLoop.startGame(uid, session.hiderCount, session.hunterCount);
  }

  /** Record game result to Firestore leaderboard and update session phase. */
  private async recordRoundResult(): Promise<void> {
    const sessionId = this.currentSessionId;
    const username = this.identity.getUsername();
    if (!username) return; // no leaderboard entry without a username

    const localPlayer = this.gameLoop.getLocalPlayer();
    const winner = this.gameLoop.roundWinner();
    if (!localPlayer || !winner) return;

    const won = winner === (localPlayer.role === 'hider' ? 'hiders' : 'hunters');
    await this.recordLeaderboardResult(username, localPlayer, won);
    await this.updateResultsPhase(sessionId);
  }

  /** Allow leaving the lobby before game starts. */
  protected async leaveLobby(): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    const uid = this.identity.getToken();
    await this.removeLobbyPlayer(sessionId, uid, 'hider');
    await this.removeLobbyPlayer(sessionId, uid, 'hunter');
    await this.router.navigate(['/']);
  }

  /** Start a new quickplay match from the results screen. */
  protected async playAgain(): Promise<void> {
    this.isJoining.set(true);
    try {
      const sessionId = await this.joinReplaySession();
      await this.startReplaySession(sessionId);
      await this.router.navigate(['/game', sessionId]);
    } catch (err) {
      await this.handlePlayAgainFailure(err);
    } finally {
      this.isJoining.set(false);
    }
  }

  /** Leave to main menu from results screen. */
  protected async leaveToMenu(): Promise<void> {
    await this.cleanupSession();
    await this.router.navigate(['/']);
  }

  /** Remove the Firestore session document if the game is over. */
  private async cleanupSession(): Promise<void> {
    if (!this.currentSessionId) return;
    try {
      await this.sessionService.deleteSession(this.currentSessionId);
    } catch { /* another player may have already deleted it */ }
  }

  private async initEngine(canvas: HTMLCanvasElement): Promise<void> {
    try {
      await this.engine.init(canvas);
      this.engine.resize(canvas.clientWidth, canvas.clientHeight);
      this.engineReady = true;
    } catch (err) {
      console.error('[Game] Engine init failed:', err);
    }
  }

  private observeViewportResize(canvas: HTMLCanvasElement): void {
    this.resizeObserver = new ResizeObserver(([entry]) => this.resizeFromEntry(entry));
    this.resizeObserver.observe(canvas.parentElement!);
  }

  private resizeFromEntry(entry: ResizeObserverEntry): void {
    const { width, height } = entry.contentRect;
    this.engine.resize(width, height);
  }

  private subscribeToRouteParams(): void {
    this.paramSub = this.route.paramMap.subscribe(params => this.initSession(this.readSessionId(params)));
  }

  private readSessionId(params: any): string {
    return params.get('sessionId') ?? '';
  }

  private resetSessionState(sessionId: string): void {
    this.sessionSub?.unsubscribe();
    this.lobbyStarted = false;
    this.gameStarted = false;
    this.resultRecorded = false;
    this.currentSessionId = sessionId;
    this.inLobby.set(true);
  }

  private handleSessionSnapshot(session: GameSession | undefined): void {
    if (!session) return;
    this.startLobbyIfNeeded(session);
    this.onSessionUpdate(session);
  }

  private startLobbyIfNeeded(session: GameSession): void {
    if (this.lobbyStarted) return;
    this.lobbyStarted = true;
    this.inputService.attach();
    this.initSceneTickIfNeeded();
    this.gameLoop.startLobby(this.identity.getToken(), session.hiderCount, session.hunterCount);
  }

  private initSceneTickIfNeeded(): void {
    if (!this.engineReady) return;
    if (this.engine.onTick) return;
    this.sceneRender.init(this.engine.getScene());
    this.engine.onTick = (delta: number) => this.tickScene(delta);
  }

  private tickScene(delta: number): void {
    this.gameLoop.tick(delta);
    this.syncScene(delta);
  }

  private disposeViewResources(): void {
    this.paramSub?.unsubscribe();
    this.sessionSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.inputService.detach();
    this.sceneRender.dispose();
    this.engine.dispose();
  }

  private recordRoundResultIfNeeded(): void {
    if (this.gameLoop.phase() !== 'results') return;
    if (this.resultRecorded) return;
    this.resultRecorded = true;
    this.recordRoundResult();
  }

  private syncPlayerMeshes(uid: string, delta: number): void {
    const allPlayers = [...this.gameLoop.hiders(), ...this.gameLoop.hunters()];
    const localRole = this.gameLoop.getLocalPlayer()?.role ?? 'hider';
    this.sceneRender.syncPlayers(allPlayers, uid, delta, localRole);
  }

  private syncSurvivalBonusFloaters(): void {
    const bonusPositions = this.gameLoop.survivalBonusPositions();
    if (!bonusPositions.length) return;
    this.sceneRender.showSurvivalBonus(bonusPositions);
    this.gameLoop.survivalBonusPositions.set([]);
  }

  private followLocalPlayer(delta: number): void {
    const localPlayer = this.gameLoop.getLocalPlayer();
    if (!localPlayer) return;
    this.engine.followTarget(localPlayer.position, delta);
  }

  private async recordLeaderboardResult(
    username: string,
    localPlayer: PlayerState,
    won: boolean,
  ): Promise<void> {
    try {
      await this.leaderboardService.recordGameResult(username, localPlayer.score, won, localPlayer.role);
    } catch (err) {
      console.error('[Game] Failed to record leaderboard result:', err);
    }
  }

  private async updateResultsPhase(sessionId: string): Promise<void> {
    try {
      await this.sessionService.updateSession(sessionId, { phase: 'results' as any });
    } catch (err) {
      console.error('[Game] Failed to update session phase:', err);
    }
  }

  private async removeLobbyPlayer(
    sessionId: string,
    uid: string,
    role: 'hider' | 'hunter',
  ): Promise<void> {
    try {
      await this.sessionService.removePlayer(sessionId, uid, role);
    } catch {}
  }

  private async joinReplaySession(): Promise<string> {
    await this.cleanupSession();
    const sessionId = await this.sessionService.findOrCreateSession();
    const session = await firstValueFrom(this.sessionService.getSession$(sessionId));
    const player = this.buildReplayPlayer(session);
      await this.sessionService.joinSession(sessionId, player);
    return sessionId;
  }

  private buildReplayPlayer(session: GameSession | undefined): PlayerState {
    const hiderCount = session?.hiderCount ?? 0;
    const hunterCount = session?.hunterCount ?? 0;
    const takenAnimals = Object.values(session?.players ?? {}).filter(Boolean).map((p: any) => p.animal);
    const role = this.playerService.assignRole(hiderCount, hunterCount);
    const animal = this.playerService.assignAnimal(role, takenAnimals);
    return this.playerService.createPlayerState(role, animal, { x: 0, y: 0, z: 0 });
  }

  private async startReplaySession(sessionId: string): Promise<void> {
    await this.sessionService.updateSession(sessionId, { phase: 'hunting' });
  }

  private async handlePlayAgainFailure(err: unknown): Promise<void> {
    console.error('[PlayAgain] Failed:', err);
    await this.router.navigate(['/']);
  }
}
