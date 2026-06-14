import { Component, computed, inject, signal, afterNextRender, DestroyRef, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { timer } from 'rxjs';
import { expand } from 'rxjs/operators';
import { ResumeService } from '../../resume-service';
import { Toast } from '../../toast';
import { getAllCaseStudies } from '../../content/case-studies';
import { CaseStudy } from '../../content/case-study.types';
import { GAME_STORY_COPY } from '../../content/game-narrative';
import { WorkReelComponent } from '../../components/work-reel/work-reel.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, WorkReelComponent],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css'],
})
export class HomePage implements OnDestroy {
  private readonly resumeService = inject(ResumeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly highlightedSection = this.resumeService.highlightedSection;
  protected readonly resume = signal(this.resumeService.getResume());
  protected readonly typedRole = signal('');
  protected readonly contact = computed(() => this.resume().contact);
  protected readonly links = computed(() => this.resume().links);
  protected readonly techCategories = computed(() => this.resumeService.getTechCategories());
  protected readonly caseStudies = signal<CaseStudy[]>(
    [...getAllCaseStudies()].sort((a, b) => {
      if (a.slug === 'riot-valorant') return -1;
      if (b.slug === 'riot-valorant') return 1;
      return 0;
    })
  );
  protected readonly gameStory = GAME_STORY_COPY;

  protected readonly reelProjects = computed(() =>
    this.resume().projects.filter((p) => p.featured || p.heroImage)
  );

  protected readonly gridProjects = computed(() => {
    const reelTitles = new Set(this.reelProjects().map((p) => p.title));
    return this.resume().projects.filter((p) => !reelTitles.has(p.title));
  });

  private readonly roles = ['Software Developer', 'Full-Stack Engineer', 'QA Engineer', 'Problem Solver', 'Regular Dude'];
  private roleIndex = 0;
  private charIndex = 0;
  private isDeleting = false;

  constructor() {
    afterNextRender(() => {
      this.resumeService.refreshReveal();
      this.resumeService.initShaderHero();
      this.resumeService.initHeroLogo();
      this.resumeService.refreshMagneticButtons();
      setTimeout(() => this.resumeService.refreshParticleFieldLayout(), 0);
    });

    timer(1600).pipe(
      expand(() => {
        const current = this.roles[this.roleIndex];
        if (this.isDeleting) {
          this.charIndex--;
          this.typedRole.set(current.substring(0, this.charIndex));
          if (this.charIndex === 0) {
            this.isDeleting = false;
            this.roleIndex = (this.roleIndex + 1) % this.roles.length;
            return timer(400);
          }
          return timer(35);
        }

        this.charIndex++;
        this.typedRole.set(current.substring(0, this.charIndex));
        if (this.charIndex === current.length) {
          this.isDeleting = true;
          return timer(2200);
        }
        return timer(70);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.resumeService.destroyShaderHero();
  }

  openLink(url: string) {
    window.open(url, '_blank', 'noopener');
  }

  async copyEmail() {
    try {
      await navigator.clipboard.writeText(this.contact().email);
      Toast.show('Email copied!');
    } catch {
      Toast.show('Failed to copy email');
    }
  }

  getTechSVG(tech: string) {
    return this.sanitizer.bypassSecurityTrustHtml(this.resumeService.getTechSVG(tech));
  }

  getProjectSVG(title: string) {
    return this.sanitizer.bypassSecurityTrustHtml(this.resumeService.getProjectSVG(title));
  }

  openTechLink(tech: string) {
    const link = this.resumeService.getTechLink(tech);
    if (link) {
      this.openLink(link);
    }
  }

  scrollToWork() {
    this.resumeService.scrollTo('work');
  }
}
