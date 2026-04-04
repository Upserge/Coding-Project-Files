import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { HudComponent } from './hud';
import { GameLoopService } from '../services/game-loop.service';
import { HiderService } from '../services/hider.service';
import { HunterService } from '../services/hunter.service';

describe('HudComponent – Settings', () => {
  let fixture: ComponentFixture<HudComponent>;
  let component: HudComponent;
  let hud: any;

  const mockGameLoop = {
    phase: signal('hunting'),
    roundTimeRemainingMs: signal(60000),
    hiders: signal([]),
    hunters: signal([]),
    catchFeed: signal([]),
    hunterDeathActive: signal(false),
    hunterDeathCountdown: signal(0),
    lastHiderStanding: signal(false),
    getLocalHider: () => null,
    getLocalHunter: () => null,
    getLocalPlayer: () => null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HudComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: GameLoopService, useValue: mockGameLoop },
        { provide: HiderService, useValue: { getIdlePercent: () => 0, getDashCooldownPercent: () => 0 } },
        { provide: HunterService, useValue: { getHungerPercent: () => 1, getStaminaPercent: () => 1, isExhausted: () => false, getPounceCooldownPercent: () => 0 } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HudComponent);
    component = fixture.componentInstance;
    hud = component as any;
  });

  // ── Settings open/close ──────────────────────────────────

  it('should start with settings closed', () => {
    expect(hud.settingsOpen()).toBeFalse();
  });

  it('should open settings when openSettings is called', () => {
    hud.openSettings();
    expect(hud.settingsOpen()).toBeTrue();
  });

  it('should close settings when closeSettings is called', () => {
    hud.settingsOpen.set(true);
    hud.closeSettings();
    expect(hud.settingsOpen()).toBeFalse();
  });

  // ── ESC key toggles ──────────────────────────────────────

  it('should open settings on first ESC press', () => {
    hud.onEscape();
    expect(hud.settingsOpen()).toBeTrue();
  });

  it('should close settings on second ESC press', () => {
    hud.onEscape();
    hud.onEscape();
    expect(hud.settingsOpen()).toBeFalse();
  });

  // ── Leave game output ────────────────────────────────────

  it('should emit leaveGameRequested and close settings on leave', () => {
    const spy = spyOn(component.leaveGameRequested, 'emit');
    hud.settingsOpen.set(true);
    hud.onLeaveGame();
    expect(spy).toHaveBeenCalled();
    expect(hud.settingsOpen()).toBeFalse();
  });

  // ── Show rules output ────────────────────────────────────

  it('should emit showRulesRequested and close settings on rules', () => {
    const spy = spyOn(component.showRulesRequested, 'emit');
    hud.settingsOpen.set(true);
    hud.onShowRules();
    expect(spy).toHaveBeenCalled();
    expect(hud.settingsOpen()).toBeFalse();
  });

  // ── TAB scoreboard ───────────────────────────────────────

  it('should start with scoreboard hidden', () => {
    expect(hud.scoreboardVisible()).toBeFalse();
  });

  it('should show scoreboard on TAB keydown', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    spyOn(event, 'preventDefault');
    hud.onTabDown(event);
    expect(hud.scoreboardVisible()).toBeTrue();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should hide scoreboard on TAB keyup', () => {
    hud.scoreboardVisible.set(true);
    hud.onTabUp();
    expect(hud.scoreboardVisible()).toBeFalse();
  });

  it('should keep scoreboard visible across multiple TAB keydowns', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    hud.onTabDown(event);
    hud.onTabDown(event);
    expect(hud.scoreboardVisible()).toBeTrue();
  });
});
