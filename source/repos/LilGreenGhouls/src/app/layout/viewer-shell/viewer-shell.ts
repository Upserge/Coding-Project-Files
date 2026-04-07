import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { AtmosphericCtaComponent } from '../../shared/components/atmospheric-cta/atmospheric-cta';

@Component({
  selector: 'app-viewer-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, AtmosphericCtaComponent],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-atmospheric-cta />
      <app-footer />
    </div>
  `,
})
export class ViewerShellComponent {}
