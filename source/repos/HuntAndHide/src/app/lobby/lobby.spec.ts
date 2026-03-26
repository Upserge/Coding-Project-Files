import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LobbyComponent } from './lobby';
import { SessionService } from '../services/session.service';
import { IdentityService } from '../services/identity.service';
import { GameSession } from '../models/session.model';

describe('LobbyComponent', () => {
  let fixture: ComponentFixture<LobbyComponent>;
  let component: LobbyComponent;
  let lobby: any;
  let sessionSubject: Subject<GameSession | undefined>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const LOCAL_UID = 'player-1';
  const SESSION_ID = 'session-abc';

  const buildPlayer = (uid: string, name: string, role: 'hider' | 'hunter' = 'hider') => ({
    uid, displayName: name, role, animal: role === 'hider' ? 'fox' : 'wolf',
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    isAlive: true, score: 50, isCpu: false,
  }) as any;

  const buildSession = (overrides: Partial<GameSession> = {}): GameSession => ({
    id: SESSION_ID,
    hostUid: LOCAL_UID,
    phase: 'lobby',
    players: { [LOCAL_UID]: buildPlayer(LOCAL_UID, 'P1') },
    readyPlayers: {},
    hiderCount: 1,
    hunterCount: 0,
    roundTimeSeconds: 120,
    currentRound: 0,
    maxRounds: 3,
    createdAt: Date.now(),
    heartbeatAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  beforeEach(async () => {
    sessionSubject = new Subject();
    mockSessionService = jasmine.createSpyObj('SessionService', [
      'getSession$', 'setPlayerReady', 'setPlayerUnready',
      'updateSession', 'sendHeartbeat', 'removePlayer',
    ]);
    mockSessionService.getSession$.and.returnValue(sessionSubject.asObservable());
    mockSessionService.setPlayerReady.and.returnValue(Promise.resolve());
    mockSessionService.setPlayerUnready.and.returnValue(Promise.resolve());
    mockSessionService.updateSession.and.returnValue(Promise.resolve());
    mockSessionService.sendHeartbeat.and.returnValue(Promise.resolve());
    mockSessionService.removePlayer.and.returnValue(Promise.resolve());
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [LobbyComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SessionService, useValue: mockSessionService },
        { provide: IdentityService, useValue: { getToken: () => LOCAL_UID } },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => SESSION_ID } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    lobby = component as any;
  });

  afterEach(() => {
    component.ngOnDestroy();
    fixture.destroy();
  });

  // ── Ready toggle ──────────────────────────────────────────

  it('should start in unready state', () => {
    expect(lobby.isReady()).toBeFalse();
  });

  it('should call setPlayerReady when toggling from unready', async () => {
    component.ngOnInit();
    await component.toggleReady();
    expect(mockSessionService.setPlayerReady).toHaveBeenCalledWith(SESSION_ID, LOCAL_UID);
    expect(lobby.isReady()).toBeTrue();
  });

  it('should call setPlayerUnready when toggling from ready', async () => {
    component.ngOnInit();
    await component.toggleReady();
    await component.toggleReady();
    expect(mockSessionService.setPlayerUnready).toHaveBeenCalledWith(SESSION_ID, LOCAL_UID);
    expect(lobby.isReady()).toBeFalse();
  });

  // ── allReady computed ─────────────────────────────────────

  it('should report allReady false when no players are present', () => {
    expect(lobby.allReady()).toBeFalse();
  });

  it('should report allReady true when every real player is ready', () => {
    lobby.totalRealPlayers.set(2);
    lobby.readyCount.set(2);
    expect(lobby.allReady()).toBeTrue();
  });

  it('should report allReady false when only some players are ready', () => {
    lobby.totalRealPlayers.set(3);
    lobby.readyCount.set(1);
    expect(lobby.allReady()).toBeFalse();
  });

  // ── Countdown timer ───────────────────────────────────────

  it('should initialise countdown to 30 seconds', () => {
    expect(lobby.countdown()).toBe(30);
  });

  it('should decrement countdown each second after session update', () => {
    jasmine.clock().install();
    component.ngOnInit();
    sessionSubject.next(buildSession());
    jasmine.clock().tick(3000);
    expect(lobby.countdown()).toBe(27);
    jasmine.clock().uninstall();
  });

  it('should launch game when countdown reaches 0', async () => {
    jasmine.clock().install();
    component.ngOnInit();
    sessionSubject.next(buildSession());
    jasmine.clock().tick(30_000);
    jasmine.clock().uninstall();
    await fixture.whenStable();
    expect(mockSessionService.updateSession).toHaveBeenCalledWith(SESSION_ID, { phase: 'hunting' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', SESSION_ID]);
  });

  // ── Auto-start on all ready ───────────────────────────────

  it('should launch game when session update shows all players ready', () => {
    component.ngOnInit();
    const session = buildSession({ readyPlayers: { [LOCAL_UID]: true } });
    sessionSubject.next(session);
    expect(mockSessionService.updateSession).toHaveBeenCalledWith(SESSION_ID, { phase: 'hunting' });
  });

  it('should not launch game when only some players are ready', () => {
    component.ngOnInit();
    const session = buildSession({
      players: {
        [LOCAL_UID]: buildPlayer(LOCAL_UID, 'P1'),
        'player-2': buildPlayer('player-2', 'P2', 'hunter'),
      },
      readyPlayers: { [LOCAL_UID]: true },
    });
    sessionSubject.next(session);
    expect(mockSessionService.updateSession).not.toHaveBeenCalledWith(SESSION_ID, { phase: 'hunting' });
  });

  // ── Navigate on phase change ──────────────────────────────

  it('should navigate to game when session phase changes to hunting', () => {
    component.ngOnInit();
    sessionSubject.next(buildSession({ phase: 'hunting' }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', SESSION_ID]);
  });

  // ── Leave clears ready state ──────────────────────────────

  it('should unready the player when leaving the lobby', async () => {
    component.ngOnInit();
    sessionSubject.next(buildSession());
    await component.leaveSession();
    expect(mockSessionService.setPlayerUnready).toHaveBeenCalledWith(SESSION_ID, LOCAL_UID);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });
});
