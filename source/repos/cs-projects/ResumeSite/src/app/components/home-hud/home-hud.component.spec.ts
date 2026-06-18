import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeHudComponent } from './home-hud.component';

describe('HomeHudComponent', () => {
  let fixture: ComponentFixture<HomeHudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHudComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHudComponent);
    fixture.detectChanges();
  });

  it('renders palette and utility controls', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.home-hud-btn--text')).not.toBeNull();
    expect(el.querySelectorAll('.home-hud-btn--icon').length).toBe(2);
  });

  it('hides score until showSessionScore is true', () => {
    fixture.componentRef.setInput('showSessionScore', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-hud-btn--score')).toBeNull();

    fixture.componentRef.setInput('showSessionScore', true);
    fixture.componentRef.setInput('score', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home-hud-btn--score')).not.toBeNull();
  });

  it('emits showCommandPalette from palette button', () => {
    let opened = false;
    fixture.componentInstance.showCommandPalette.subscribe(() => {
      opened = true;
    });
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.home-hud-btn--text');
    btn?.click();
    expect(opened).toBeTrue();
  });
});
