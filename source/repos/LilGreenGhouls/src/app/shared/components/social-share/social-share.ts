import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-social-share',
  standalone: true,
  templateUrl: './social-share.html',
  styleUrl: './social-share.css',
})
export class SocialShareComponent {
  readonly title = input.required<string>();
  readonly url = input.required<string>();
  readonly excerpt = input<string>('');

  protected copied = signal(false);

  get twitterUrl(): string {
    const text = encodeURIComponent(this.title());
    const link = encodeURIComponent(this.url());
    return `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
  }

  get facebookUrl(): string {
    const link = encodeURIComponent(this.url());
    return `https://www.facebook.com/sharer/sharer.php?u=${link}`;
  }

  get redditUrl(): string {
    const title = encodeURIComponent(this.title());
    const link = encodeURIComponent(this.url());
    return `https://www.reddit.com/submit?url=${link}&title=${title}`;
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = this.url();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
