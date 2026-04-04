import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SettingsMenuComponent } from './settings-menu';

describe('SettingsMenuComponent', () => {
  let fixture: ComponentFixture<SettingsMenuComponent>;
  let component: SettingsMenuComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsMenuComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsMenuComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closed when close is called', () => {
    const spy = spyOn(component.closed, 'emit');
    (component as any).close();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit leaveGame when leave action is clicked', () => {
    const spy = spyOn(component.leaveGame, 'emit');
    (component as any).onItemClick('leave');
    expect(spy).toHaveBeenCalled();
  });

  it('should emit showRules when rules action is clicked', () => {
    const spy = spyOn(component.showRules, 'emit');
    (component as any).onItemClick('rules');
    expect(spy).toHaveBeenCalled();
  });

  it('should emit toggleFullscreen when fullscreen action is clicked', () => {
    const spy = spyOn(component.toggleFullscreen, 'emit');
    (component as any).onItemClick('fullscreen');
    expect(spy).toHaveBeenCalled();
  });

  it('should return "Exit Fullscreen" label when fullscreen is active', () => {
    fixture.componentRef.setInput('isFullscreen', true);
    expect((component as any).getFullscreenLabel()).toBe('Exit Fullscreen');
  });

  it('should return "Fullscreen" label when fullscreen is inactive', () => {
    fixture.componentRef.setInput('isFullscreen', false);
    expect((component as any).getFullscreenLabel()).toBe('Fullscreen');
  });

  it('should not throw for an unknown action', () => {
    expect(() => (component as any).onItemClick('unknown')).not.toThrow();
  });
});
