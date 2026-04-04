import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { GameScoreboardComponent } from './game-scoreboard';
import { EndOfGameService } from '../services/end-of-game.service';
import { GameLoopService } from '../services/game-loop.service';
import { ScoreboardEntry } from '../models/scoreboard.model';

describe('GameScoreboardComponent', () => {
  let fixture: ComponentFixture<GameScoreboardComponent>;
  let component: GameScoreboardComponent;

  const entries: ScoreboardEntry[] = [
    { uid: 'u1', displayName: 'Wolf1', role: 'hunter', animal: 'wolf', score: 200, isAlive: true, isCpu: false, catches: 3, isCaught: false },
    { uid: 'h1', displayName: 'Fox1', role: 'hider', animal: 'fox', score: 120, isAlive: true, isCpu: false, catches: 0, isCaught: false },
    { uid: 'h2', displayName: 'Rabbit1', role: 'hider', animal: 'rabbit', score: 50, isAlive: false, isCpu: true, catches: 0, isCaught: true },
  ];

  const mockGameLoop = {
    hiders: signal([]),
    hunters: signal([]),
    phase: signal('hunting'),
    roundWinner: signal(null),
    getLocalPlayer: () => null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameScoreboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndOfGameService, useValue: { buildScoreboard: () => entries } },
        { provide: GameLoopService, useValue: mockGameLoop },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameScoreboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose correct playerCount', () => {
    expect((component as any).playerCount()).toBe(3);
  });

  it('should return wolf icon for hunter role', () => {
    expect((component as any).roleIcon(entries[0])).toBe('🐺');
  });

  it('should return leaf icon for hider role', () => {
    expect((component as any).roleIcon(entries[1])).toBe('🌿');
  });

  it('should return "Alive" for alive, uncaught player', () => {
    expect((component as any).statusLabel(entries[1])).toBe('Alive');
  });

  it('should return "Caught" for caught hider', () => {
    expect((component as any).statusLabel(entries[2])).toBe('Caught');
  });

  it('should return "Dead" for dead hunter', () => {
    const deadHunter: ScoreboardEntry = { ...entries[0], isAlive: false };
    expect((component as any).statusLabel(deadHunter)).toBe('Dead');
  });
});
