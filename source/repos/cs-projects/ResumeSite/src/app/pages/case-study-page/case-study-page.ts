import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CaseStudy } from '../../content/case-study.types';
import { getCaseStudy } from '../../content/case-studies';
import { ResumeService } from '../../resume-service';

@Component({
  selector: 'app-case-study-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './case-study-page.html',
  styleUrls: ['./case-study-page.css'],
})
export class CaseStudyPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly resumeService = inject(ResumeService);

  protected study: CaseStudy | null = null;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const match = getCaseStudy(slug);
    if (!match) {
      void this.router.navigate(['/']);
      return;
    }

    this.study = match;
    this.title.setTitle(`${match.title} — Jason Salas`);
    this.resumeService.refreshReveal();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  ngOnDestroy(): void {
    this.title.setTitle('Jason Salas');
  }
}
