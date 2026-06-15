import { Component, inject, OnDestroy, OnInit, ElementRef, afterNextRender } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Title } from '@angular/platform-browser';

import { ABOUT_CONTENT } from '../../content/about';

import { ResumeService } from '../../resume-service';



@Component({

  selector: 'app-about-page',

  standalone: true,

  imports: [RouterLink],

  templateUrl: './about-page.html',

  styleUrls: ['./about-page.css'],

})

export class AboutPage implements OnInit, OnDestroy {

  private readonly title = inject(Title);

  private readonly resumeService = inject(ResumeService);

  private readonly host = inject(ElementRef<HTMLElement>);



  protected readonly about = ABOUT_CONTENT;

  protected readonly contact = this.resumeService.getResume().contact;

  protected readonly links = this.resumeService.getResume().links;

  constructor() {
    afterNextRender(() => {
      setTimeout(() => this.resumeService.refreshParticleFieldLayout(), 0);
    });
  }

  ngOnInit(): void {

    this.title.setTitle('About — Jason Salas');

    this.resumeService.refreshReveal(this.host.nativeElement);

    window.scrollTo({ top: 0, behavior: 'auto' });

  }



  ngOnDestroy(): void {

    this.title.setTitle('Jason Salas');

  }



  async copyEmail(): Promise<void> {

    await this.resumeService.copyEmail();

  }

}


