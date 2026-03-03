import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  viewChild,
  inject,
  signal,
  computed,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gameCanvas');
  private resizeObserver!: ResizeObserver;
  private sessionSub?: Subscription;
  private paramSub?: Subscription;
  private lobbyStarted = false;
  private gameStarted = false;
  private engineReady = false;

  // ── Lobby state (signals for template) ─────────────────────
  protected readonly inLobby = signal(true);
  protected readonly playerCount = signal(0);
  protected readonly minPlayers = TOTAL_PLAYER_SLOTS;

  // ── Round-results overlay (signals for template) ──────────
  protected readonly showResults = computed(() => this.gameLoop.phase() === 'results');
  protected readonly roundWinner = this.gameLoop.roundWinner;
  protected readonly roundMvp = this.gameLoop.roundMvp;
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
    const canvas = this.canvasRef().nativeElement;
    try {
      await this.engine.init(canvas);
      this.engine.resize(canvas.clientWidth, canvas.clientHeight);
      this.engineReady = true;
    } catch (err) {
      console.error('[Game] Engine init failed:', err);
    }

    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.engine.resize(width, height);
    });
    this.resizeObserver.observe(canvas.parentElement!);

    // React to route param changes — handles initial load AND Play Again re-entry
    this.paramSub = this.route.paramMap.subscribe(params => {
      const sessionId = params.get('sessionId') ?? '';
      this.initSession(sessionId);
    });
  }

  /** Initialize (or reinitialize) the session subscription and game state. */
  private initSession(sessionId: string): void {
    // Tear down previous session if any
    this.sessionSub?.unsubscribe();
    this.lobbyStarted = false;
    this.gameStarted = false;
    this.inLobby.set(true);

    this.sessionSub = this.sessionService.getSession$(sessionId).subscribe({
      next: session => {
        if (!session) return;

        // Start lobby mode immediately so the player can roam
        if (!this.lobbyStarted) {
          this.lobbyStarted = true;
          const uid = this.identity.getToken();
          this.inputService.attach();

          // One-time scene render + tick wiring (persists across sessions)
          if (this.engineReady && !this.engine.onTick) {
            this.sceneRender.init(this.engine.getScene());
            this.engine.onTick = (delta: number) => {
              this.gameLoop.tick(delta);
              this.syncScene(delta);
            };
          }

          this.gameLoop.startLobby(uid, session.hiderCount, session.hunterCount);
        }

        this.onSessionUpdate(session);
      },
      error: err => console.error('[Game] Session subscription error:', err),
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.sessionSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.inputService.detach();
    this.sceneRender.dispose();
    this.engine.dispose();
  }

  // ── Per-frame scene sync ───────────────────────────────────

  private syncScene(delta: number): void {
    const uid = this.identity.getToken();

    // Combine hiders + hunters for player mesh sync
    const allPlayers: PlayerState[] = [
      ...this.gameLoop.hiders(),
      ...this.gameLoop.hunters(),
    ];
    const localRole = this.gameLoop.getLocalPlayer()?.role ?? 'hider';
    this.sceneRender.syncPlayers(allPlayers, uid, delta, localRole);

    // Pass nearby hiding spot position for world-space prompt
    this.sceneRender.setHideSpot(this.gameLoop.nearHidingSpot());

    // Spawn survival bonus floaters (signal is consumed once per award)
    const bonusPositions = this.gameLoop.survivalBonusPositions();
    if (bonusPositions.length > 0) {
      this.sceneRender.showSurvivalBonus(bonusPositions);
      this.gameLoop.survivalBonusPositions.set([]);
    }

    this.sceneRender.tickParticles(delta);

    // Camera follows local player
    const localPlayer = this.gameLoop.getLocalPlayer();
    if (localPlayer) {
      this.engine.followTarget(localPlayer.position, delta);
    }
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

  /** Allow leaving the lobby before game starts. */
  protected async leaveLobby(): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    const uid = this.identity.getToken();
    try {
      await this.sessionService.removePlayer(sessionId, uid, 'hider');
    } catch {
      try { await this.sessionService.removePlayer(sessionId, uid, 'hunter'); } catch {}
    }
    await this.router.navigate(['/']);
  }

  /** Start a new quickplay match from the results screen. */
  protected async playAgain(): Promise<void> {
    this.isJoining.set(true);
    try {
      const sessionId = await this.sessionService.findOrCreateSession();
      const session = await firstValueFrom(this.sessionService.getSession$(sessionId));
      const hiderCount = session?.hiderCount ?? 0;
      const hunterCount = session?.hunterCount ?? 0;
      const takenAnimals = Object.values(session?.players ?? {})
        .filter(Boolean)
        .map((p: any) => p.animal);

      const role = this.playerService.assignRole(hiderCount, hunterCount);
      const animal = this.playerService.assignAnimal(role, takenAnimals);
      const player = this.playerService.createPlayerState(role, animal, { x: 0, y: 0, z: 0 });
      await this.sessionService.joinSession(sessionId, player);

      // Auto-start the game (equivalent to the lobby host pressing Start)
      await this.sessionService.updateSession(sessionId, { phase: 'hunting' });

      // Navigation updates route params → paramMap fires → initSession reinitializes
      await this.router.navigate(['/game', sessionId]);
    } catch (err) {
      console.error('[PlayAgain] Failed:', err);
      await this.router.navigate(['/']);
    } finally {
      this.isJoining.set(false);
    }
  }

  /** Leave to main menu from results screen. */
  protected async leaveToMenu(): Promise<void> {
    await this.router.navigate(['/']);
  }
}
