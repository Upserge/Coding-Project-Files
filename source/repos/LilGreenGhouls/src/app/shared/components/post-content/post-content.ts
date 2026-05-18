import { Component, input } from '@angular/core';

@Component({
  selector: 'app-post-content',
  standalone: true,
  template: `<div class="prose-content" [innerHTML]="content()"></div>`,
})
export class PostContentComponent {
  readonly content = input.required<string>();
}
