import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HiderService } from './hider.service';
import {
  HiderState,
  HIDER_DASH_DURATION_S,
  HIDER_DASH_COOLDOWN_S,
  HIDER_DASH_SPEED_MULTIPLIER,
  HIDER_SPEED_MULTIPLIER,
  Vec3,
} from '../models/player.model';

describe('HiderService', () => {
  let service: HiderService;

  const BASE_SPEED = 12;
  const ZERO: Vec3 = { x: 0, y: 0, z: 0 };
  const FORWARD: Vec3 = { x: 0, y: 0, z: -1 };

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
      providers: [provideZonelessChangeDetection(), HiderService],
    });
    service = TestBed.inject(HiderService);
  });

  it('should move at normal speed without dashing', () => {
    const hider = makeHider();
    const { state } = service.tick(hider, 1, FORWARD);
    const expectedZ = -BASE_SPEED * HIDER_SPEED_MULTIPLIER;
    expect(state.position.z).toBeCloseTo(expectedZ, 2);
    expect(state.isDashing).toBeFalse();
  });

  it('should start a dash when wantsDash is true and moving', () => {
    const hider = makeHider();
    const { state, result } = service.tick(hider, 0.016, FORWARD, true);
    expect(state.isDashing).toBeTrue();
    expect(result.dashTriggered).toBeTrue();
    expect(state.dashTimeS).toBeGreaterThan(0);
    expect(state.dashCooldownS).toBe(HIDER_DASH_COOLDOWN_S);
  });

  it('should move at dash speed while dashing', () => {
    const hider = makeHider({ isDashing: true, dashTimeS: HIDER_DASH_DURATION_S, dashCooldownS: HIDER_DASH_COOLDOWN_S });
    const { state } = service.tick(hider, 0.1, FORWARD);
    const expectedZ = hider.position.z + FORWARD.z * BASE_SPEED * HIDER_DASH_SPEED_MULTIPLIER * 0.1;
    expect(state.position.z).toBeCloseTo(expectedZ, 2);
  });

  it('should not dash when on cooldown', () => {
    const hider = makeHider({ dashCooldownS: 1.0 });
    const { state, result } = service.tick(hider, 0.016, FORWARD, true);
    expect(state.isDashing).toBeFalse();
    expect(result.dashTriggered).toBeFalse();
  });

  it('should not dash when stationary', () => {
    const hider = makeHider();
    const { state, result } = service.tick(hider, 0.016, ZERO, true);
    expect(state.isDashing).toBeFalse();
    expect(result.dashTriggered).toBeFalse();
  });

  it('should end dash when dashTimeS expires', () => {
    const hider = makeHider({ isDashing: true, dashTimeS: 0.05, dashCooldownS: HIDER_DASH_COOLDOWN_S });
    const { state } = service.tick(hider, 0.1, FORWARD);
    expect(state.isDashing).toBeFalse();
    expect(state.dashTimeS).toBe(0);
  });

  it('should tick cooldown down over time', () => {
    const hider = makeHider({ dashCooldownS: 2.0 });
    const { state } = service.tick(hider, 0.5, FORWARD);
    expect(state.dashCooldownS).toBeCloseTo(1.5, 2);
  });

  it('isDashInvulnerable returns true when dashing', () => {
    const dashing = makeHider({ isDashing: true });
    expect(service.isDashInvulnerable(dashing)).toBeTrue();
    expect(service.isDashInvulnerable(makeHider())).toBeFalse();
  });

  it('getDashCooldownPercent returns correct ratio', () => {
    expect(service.getDashCooldownPercent(makeHider({ dashCooldownS: HIDER_DASH_COOLDOWN_S }))).toBe(1);
    expect(service.getDashCooldownPercent(makeHider({ dashCooldownS: 0 }))).toBe(0);
  });
});
