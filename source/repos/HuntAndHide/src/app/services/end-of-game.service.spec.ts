import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { EndOfGameService } from './end-of-game.service';
import { GameLoopService } from './game-loop.service';
import { LeaderboardService } from './leaderboard.service';
import { IdentityService } from './identity.service';
import { HiderState, HunterState } from '../models/player.model';

describe('EndOfGameService', () => {
  let service: EndOfGameService;
  let mockLeaderboard: jasmine.SpyObj<LeaderboardService>;

  const hider: HiderState = {
    uid: 'h1', displayName: 'Fox1', role: 'hider', animal: 'fox',
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    isAlive: true, score: 120, isCpu: false,
    idleTimerMs: 0, isHiding: false, hidingSpotId: null, isCaught: false,
    isDashing: false, dashTimeS: 0, dashCooldownS: 0,
  };

  const hunter: HunterState = {
    uid: 'u1', displayName: 'Wolf1', role: 'hunter', animal: 'wolf',
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    isAlive: true, score: 200, isCpu: false,
    hungerRemainingMs: 60000, stamina: 100, isSprinting: false,
    exhaustionCooldownS: 0, exhaustedFeedbackS: 0, kills: 3,
    isPouncing: false, pounceTimeS: 0, pounceCooldownS: 0,
  };

  const mockGameLoop = {
    hiders: signal<HiderState[]>([hider]),
    hunters: signal<HunterState[]>([hunter]),
    phase: signal<string>('hunting'),
    roundWinner: signal(null),
    getLocalPlayer: () => hider,
  };

  beforeEach(() => {
    mockLeaderboard = jasmine.createSpyObj('LeaderboardService', ['recordGameResult']);
    mockLeaderboard.recordGameResult.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        EndOfGameService,
        { provide: GameLoopService, useValue: mockGameLoop },
        { provide: LeaderboardService, useValue: mockLeaderboard },
        { provide: IdentityService, useValue: { getUsername: () => 'TestUser' } },
      ],
    });

    service = TestBed.inject(EndOfGameService);
    service.reset();
    mockGameLoop.phase.set('hunting');
    mockGameLoop.hiders.set([hider]);
    mockGameLoop.hunters.set([hunter]);
  });

  // ── buildScoreboard ──────────────────────────────────────

  it('should build a sorted scoreboard from hiders and hunters', () => {
    const board = service.buildScoreboard();
    expect(board.length).toBe(2);
    expect(board[0].uid).toBe('u1');
    expect(board[1].uid).toBe('h1');
  });

  it('should map hunter kills to catches field', () => {
    const board = service.buildScoreboard();
    const hunterEntry = board.find(e => e.uid === 'u1')!;
    expect(hunterEntry.catches).toBe(3);
  });

  it('should map hider isCaught field', () => {
    const caughtHider = { ...hider, isCaught: true };
    mockGameLoop.hiders.set([caughtHider]);
    const board = service.buildScoreboard();
    expect(board.find(e => e.uid === 'h1')!.isCaught).toBeTrue();
  });

  // ── recordResult ─────────────────────────────────────────

  it('should write to leaderboard on recordResult', async () => {
    await service.recordResult('hiders');
    expect(mockLeaderboard.recordGameResult).toHaveBeenCalledWith('TestUser', 120, true, 'hider');
  });

  it('should only record once (idempotent)', async () => {
    await service.recordResult('hiders');
    await service.recordResult('hiders');
    expect(mockLeaderboard.recordGameResult).toHaveBeenCalledTimes(1);
  });

  it('should allow recording again after reset', async () => {
    await service.recordResult('hiders');
    service.reset();
    await service.recordResult('hiders');
    expect(mockLeaderboard.recordGameResult).toHaveBeenCalledTimes(2);
  });

  // ── recordIfNeeded (safety net) ──────────────────────────

  it('should skip recording if still in lobby', async () => {
    mockGameLoop.phase.set('lobby');
    await service.recordIfNeeded(null);
    expect(mockLeaderboard.recordGameResult).not.toHaveBeenCalled();
  });

  it('should record if game was in progress', async () => {
    mockGameLoop.phase.set('hunting');
    await service.recordIfNeeded('hunters');
    expect(mockLeaderboard.recordGameResult).toHaveBeenCalled();
  });

  it('should infer hiders win when alive hiders exist and no winner given', async () => {
    mockGameLoop.phase.set('hunting');
    await service.recordIfNeeded(null);
    expect(mockLeaderboard.recordGameResult).toHaveBeenCalledWith('TestUser', 120, true, 'hider');
  });
});
