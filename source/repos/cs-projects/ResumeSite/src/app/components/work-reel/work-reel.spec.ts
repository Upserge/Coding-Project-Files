import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkReelComponent } from './work-reel.component';
import { ProjectItem } from '../../resume-service';

const SAMPLE_ITEMS: ProjectItem[] = [
  {
    title: 'Resume Site',
    hook: 'Interactive résumé.',
    caseStudySlug: 'resume-site',
    url: 'https://example.com',
    tags: ['Angular'],
    featured: true,
  },
  {
    title: 'Gambdle',
    hook: 'Daily slots.',
    url: 'https://example.com/gambdle',
    tags: ['Firebase'],
    featured: true,
  },
  {
    title: 'PAC-MAN',
    hook: 'Canvas arcade.',
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
});
