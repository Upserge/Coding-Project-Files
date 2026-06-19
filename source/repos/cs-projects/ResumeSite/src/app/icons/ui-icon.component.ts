import { Component, input } from '@angular/core';
import type { ThemeIconName } from './ui-icons';

/** Inline theme glyphs for Angular templates (avoids innerHTML sanitization). */
@Component({
  selector: 'ui-icon',
  standalone: true,
  template: `
    @switch (name()) {
      @case ('sun') {
        <svg
          class="ui-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
        </svg>
      }
      @case ('moon') {
        <svg
          class="ui-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M13.2 10.2a5.5 5.5 0 1 1-7.4-7.4 4.8 4.8 0 0 0 7.4 7.4z" />
        </svg>
      }
    }
  `,
})
export class UiIconComponent {
  readonly name = input.required<ThemeIconName>();
}
