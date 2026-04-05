import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HunterService } from './hunter.service';
import {
  HunterState,
  HiderState,
  HUNTER_POUNCE_DURATION_S,
  HUNTER_POUNCE_COOLDOWN_S,
  HUNTER_POUNCE_CATCH_RADIUS,
  HUNTER_POUNCE_STAMINA_COST,
  HUNTER_STAMINA_MAX,
  Vec3,
} from '../models/player.model';

describe('HunterService', () => {
  let service: HunterService;

  const ZERO: Vec3 = { x: 0, y: 0, z: 0 };
  const FORWARD: Vec3 = { x: 0, y: 0, z: -1 };

  const makeHunter = (overrides: Partial<HunterState> = {}): HunterState => ({
    uid: 'u1', displayName: 'Wolf', role: 'hunter', animal: 'wolf',
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    isAlive: true, score: 0, isCpu: false,
    hungerRemainingMs: 60000, stamina: HUNTER_STAMINA_MAX, isSprinting: false,
    exhaustionCooldownS: 0, exhaustedFeedbackS: 0, kills: 0,
    isPouncing: false, pounceTimeS: 0, pounceCooldownS: 0,
    pounceDirection: { x: 0, y: 0, z: 0 },
    ...overrides,
  });

  const makeHider = (overrides: Partial<HiderState> = {}): HiderState => ({
    uid: 'h1', displayName: 'Fox', role: 'hider', animal: 'fox',
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    isAlive: true, score: 50, isCpu: false,
    idleTimerMs: 0, isHiding: false, hidingSpotId: null, isCaught: false,
    isDashing: false, dashTimeS: 0, dashCooldownS: 0,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), HunterService],
    });
    service = TestBed.inject(HunterService);
  });

  it('should start a pounce when wantsPounce is true, moving, and has stamina', () => {
    const hunter = makeHunter();
    const { state, result } = service.tick(hunter, 0.016, FORWARD, false, true);
    expect(state.isPouncing).toBeTrue();
    expect(result.pounceTriggered).toBeTrue();
    expect(state.pounceTimeS).toBeGreaterThan(0);
    expect(state.pounceCooldownS).toBe(HUNTER_POUNCE_COOLDOWN_S);
    expect(state.pounceDirection).toEqual(FORWARD);
  });

  it('should keep the original pounce direction for the full pounce', () => {
    const hunter = makeHunter();
    const started = service.tick(hunter, 0.016, { x: 1, y: 0, z: 0 }, false, true).state;
    const continued = service.tick(started, 0.1, { x: 0, y: 0, z: -1 }, false, false).state;
    expect(continued.pounceDirection).toEqual({ x: 1, y: 0, z: 0 });
    expect(continued.position.x).toBeGreaterThan(started.position.x);
    expect(continued.position.z).toBeCloseTo(started.position.z, 5);
  });

  it('should drain stamina when pounce starts', () => {
    const hunter = makeHunter({ stamina: HUNTER_STAMINA_MAX });
    const { state } = service.tick(hunter, 0.016, FORWARD, false, true);
    expect(state.stamina).toBeLessThan(HUNTER_STAMINA_MAX);
    expect(state.stamina).toBeCloseTo(HUNTER_STAMINA_MAX - HUNTER_POUNCE_STAMINA_COST, 1);
  });

  it('should not pounce when on cooldown', () => {
    const hunter = makeHunter({ pounceCooldownS: 1.5 });
    const { state, result } = service.tick(hunter, 0.016, FORWARD, false, true);
    expect(state.isPouncing).toBeFalse();
    expect(result.pounceTriggered).toBeFalse();
  });

  it('should not pounce when stamina is insufficient', () => {
    const hunter = makeHunter({ stamina: HUNTER_POUNCE_STAMINA_COST - 1 });
    const { state, result } = service.tick(hunter, 0.016, FORWARD, false, true);
    expect(state.isPouncing).toBeFalse();
    expect(result.pounceTriggered).toBeFalse();
  });

  it('should not pounce when stationary', () => {
    const hunter = makeHunter();
    const { state, result } = service.tick(hunter, 0.016, ZERO, false, true);
    expect(state.isPouncing).toBeFalse();
    expect(result.pounceTriggered).toBeFalse();
  });

  it('should end pounce when pounceTimeS expires', () => {
    const hunter = makeHunter({
      isPouncing: true,
      pounceTimeS: 0.05,
      pounceCooldownS: HUNTER_POUNCE_COOLDOWN_S,
      pounceDirection: FORWARD,
    });
    const { state } = service.tick(hunter, 0.1, FORWARD, false);
    expect(state.isPouncing).toBeFalse();
    expect(state.pounceTimeS).toBe(0);
  });

  it('should tick pounce cooldown down over time', () => {
    const hunter = makeHunter({ pounceCooldownS: 2.0 });
    const { state } = service.tick(hunter, 0.5, FORWARD, false);
    expect(state.pounceCooldownS).toBeCloseTo(1.5, 2);
  });

  it('canCatch should use extended range while pouncing', () => {
    const hunter = makeHunter({ isPouncing: true, position: { x: 0, y: 0, z: 0 } });
    const farHider = makeHider({ position: { x: 1.5, y: 0, z: 0 } });
    expect(service.canCatch(hunter, farHider)).toBeTrue();
  });

  it('canCatch should use normal range when not pouncing', () => {
    const hunter = makeHunter({ position: { x: 0, y: 0, z: 0 } });
    const farHider = makeHider({ position: { x: 1.5, y: 0, z: 0 } });
    expect(service.canCatch(hunter, farHider)).toBeFalse();
  });

  it('canCatch should return false when hider is dashing (invulnerable)', () => {
    const hunter = makeHunter({ position: { x: 0, y: 0, z: 0 } });
    const dashingHider = makeHider({ isDashing: true, position: { x: 0.5, y: 0, z: 0 } });
    expect(service.canCatch(hunter, dashingHider)).toBeFalse();
  });

  it('getPounceCooldownPercent returns correct ratio', () => {
    expect(service.getPounceCooldownPercent(makeHunter({ pounceCooldownS: HUNTER_POUNCE_COOLDOWN_S }))).toBe(1);
    expect(service.getPounceCooldownPercent(makeHunter({ pounceCooldownS: 0 }))).toBe(0);
  });
});
