import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AboutPage } from './about-page';
import { ABOUT_CONTENT } from '../../content/about';
import { ResumeService } from '../../resume-service';

describe('AboutPage', () => {
  let fixture: ComponentFixture<AboutPage>;
  let title: Title;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [
        provideRouter([]),
        {
          provide: ResumeService,
          useValue: {
            getResume: () => ({
              contact: {
                email: 'jasoncsalas@gmail.com',
                phone: '+1 (951) 385-6192',
                location: 'Santa Barbara, CA',
              },
              links: [{ label: 'GitHub', url: 'https://github.com/upserge' }],
            }),
            refreshReveal: () => undefined,
            refreshParticleFieldLayout: () => undefined,
            copyEmail: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    title = TestBed.inject(Title);
    fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
  });

  it('renders career stats', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const stat of ABOUT_CONTENT.stats) {
      expect(compiled.textContent).toContain(stat.value);
      expect(compiled.textContent).toContain(stat.label);
    }
  });

  it('sets the page title on init', () => {
    expect(title.getTitle()).toBe('About — Jason Salas');
  });
});
