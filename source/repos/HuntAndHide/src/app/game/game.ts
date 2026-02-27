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
import { Subscription } from 'rxjs';
import { EngineService } from '../engine/engine.service';
import { SceneRenderService } from '../engine/scene-render.service';
import { GameLoopService } from '../services/game-loop.service';
import { SessionService } from '../services/session.service';
import { IdentityService } from '../services/identity.service';
import { InputService } from '../services/input.service';
import { HudComponent } from '../hud/hud';
import { GameSession } from '../models/session.model';
import { PlayerState } from '../models/player.model';

/** Minimum players needed to transition from lobby to gameplay. */
const MIN_PLAYERS_TO_START = 5;

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [HudComponent],
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gameCanvas');
  private resizeObserver!: ResizeObserver;
  private sessionSub?: Subscription;
  private lobbyStarted = false;
  private gameStarted = false;

  // ── Lobby state (signals for template) ─────────────────────
  protected readonly inLobby = signal(true);
  protected readonly playerCount = signal(0);
  protected readonly minPlayers = MIN_PLAYERS_TO_START;

  protected readonly waitingMessage = computed(() => {
    const count = this.playerCount();
    const needed = MIN_PLAYERS_TO_START - count;
    if (needed > 0) {
      return `Waiting for ${needed} more player${needed === 1 ? '' : 's'}...`;
    }
    return 'Starting game...';
  });

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;
    await this.engine.init(canvas);
    this.engine.resize(canvas.clientWidth, canvas.clientHeight);

    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.engine.resize(width, height);
    });
    this.resizeObserver.observe(canvas.parentElement!);

    // Subscribe to live session updates
    const sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    this.sessionSub = this.sessionService.getSession$(sessionId).subscribe(session => {
      if (!session) return;

      // Start lobby mode immediately so the player can roam
      if (!this.lobbyStarted) {
        this.lobbyStarted = true;
        const uid = this.identity.getToken();
        this.inputService.attach();
        this.sceneRender.init(this.engine.getScene());

        this.engine.onTick = (delta: number) => {
          this.gameLoop.tick(delta);
          this.syncScene();
        };

        this.gameLoop.startLobby(uid, session.hiderCount, session.hunterCount);
      }

      this.onSessionUpdate(session);
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.inputService.detach();
    this.sceneRender.dispose();
    this.engine.dispose();
  }

  // ── Per-frame scene sync ───────────────────────────────────

  private syncScene(): void {
    const uid = this.identity.getToken();

    // Combine hiders + hunters for player mesh sync
    const allPlayers: PlayerState[] = [
      ...this.gameLoop.hiders(),
      ...this.gameLoop.hunters(),
    ];
    this.sceneRender.syncPlayers(allPlayers, uid);
    this.sceneRender.syncItems(this.gameLoop.items());
    this.sceneRender.syncProjectiles(this.gameLoop.projectiles());

    // Camera follows local player
    const localPlayer = this.gameLoop.getLocalPlayer();
    if (localPlayer) {
      this.engine.followTarget(localPlayer.position);
    }
  }

  private onSessionUpdate(session: GameSession): void {
    const players = Object.values(session.players ?? {}).filter(Boolean) as PlayerState[];
    this.playerCount.set(players.length);

    // Auto-start when enough players join
    if (!this.gameStarted && players.length >= MIN_PLAYERS_TO_START) {
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
    // Determine local player role from session
    try {
      await this.sessionService.removePlayer(sessionId, uid, 'hider');
    } catch {
      // Try hunter if hider removal fails
      try { await this.sessionService.removePlayer(sessionId, uid, 'hunter'); } catch {}
    }
    await this.router.navigate(['/']);
  }
}
