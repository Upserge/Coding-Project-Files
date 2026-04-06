import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p class="font-display text-8xl text-haunt-purple">404</p>
      <h1 class="font-display text-4xl text-ghost-white">Ghost Not Found</h1>
      <p class="max-w-md text-mist/60">
        The spirit you're looking for has crossed over to another dimension.
        Maybe try a different path?
      </p>
      <a routerLink="/"
         class="glow-green rounded-lg bg-ecto-green px-6 py-3 font-semibold text-void no-underline transition-all hover:bg-candle-glow">
        Return Home
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
