import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkReelComponent } from './work-reel.component';
import { ProjectItem } from '../../resume-service';

const SAMPLE_ITEMS: ProjectItem[] = [
  {
    title: 'Resume Site',
    hook: 'Interactive résumé.',
    caseStudySlug: 'resume-site',
    heroImage: 'case-studies/resume-site-hero.jpg',
    url: 'https://example.com',
    tags: ['Angular'],
    featured: true,
  },
  {
    title: 'Gambdle',
    hook: 'Daily slots.',
    heroImage: 'work/gambdle-hero.png',
    url: 'https://example.com/gambdle',
    tags: ['Firebase'],
    featured: true,
  },
  {
    title: 'PAC-MAN',
    hook: 'Canvas arcade.',
    heroImage: 'work/pacman-hero.png',
    url: 'https://example.com/pacman',
    tags: ['Canvas'],
  },
];

describe('WorkReelComponent', () => {
  let fixture: ComponentFixture<WorkReelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkReelComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkReelComponent);
    fixture.componentRef.setInput('items', SAMPLE_ITEMS);
    fixture.detectChanges();
  });

  it('renders one panel per project', () => {
    const panels = fixture.nativeElement.querySelectorAll('.work-reel-panel');
    expect(panels.length).toBe(SAMPLE_ITEMS.length);
  });

  it('exposes case study and live demo actions when configured', () => {
    const primaryLinks = fixture.nativeElement.querySelectorAll('.work-reel-btn--primary');
    const ghostLinks = fixture.nativeElement.querySelectorAll('.work-reel-btn--ghost');
    expect(primaryLinks.length).toBe(1);
    expect(ghostLinks.length).toBe(SAMPLE_ITEMS.length);
  });

  it('uses loop video with hero poster when reel motion is enabled', () => {
    const videos = fixture.nativeElement.querySelectorAll('video.work-reel-visual-media');
    expect(videos.length).toBe(SAMPLE_ITEMS.length);
    expect(videos[0].getAttribute('poster')).toBe('case-studies/resume-site-hero.jpg');
    expect(videos[0].querySelector('source[type="video/mp4"]')?.getAttribute('src')).toBe(
      'work/loops/resume-site.mp4',
    );
    expect(videos[0].hasAttribute('muted')).toBeTrue();
    expect(videos[0].hasAttribute('playsinline')).toBeTrue();
  });

  it('falls back to hero image when video errors', () => {
    const component = fixture.componentInstance;
    component.onVideoError(SAMPLE_ITEMS[0]);
    fixture.detectChanges();

    const videos = fixture.nativeElement.querySelectorAll('video.work-reel-visual-media');
    const images = fixture.nativeElement.querySelectorAll('.work-reel-visual img');
    expect(videos.length).toBe(SAMPLE_ITEMS.length - 1);
    expect(images.length).toBe(1);
    expect(images[0].getAttribute('src')).toBe('case-studies/resume-site-hero.jpg');
  });
});
