import { Injectable } from '@angular/core';
import { Post } from '../models/post.model';

const FEED_TITLE = 'Lil Green Ghouls Adventures';
const FEED_DESCRIPTION = 'Paranormal encounters, field notes, and spooky adventures from Lil Green Ghouls.';
const FEED_LANGUAGE = 'en-us';

@Injectable({ providedIn: 'root' })
export class RssService {
  generateFeed(posts: Post[], siteUrl: string): string {
    const baseUrl = this.normalizeSiteUrl(siteUrl);
    const items = posts.map(post => this.generateItem(post, baseUrl)).join('\n');
    const lastBuildDate = this.getLastBuildDate(posts);

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${this.escapeXml(FEED_TITLE)}</title>
    <description>${this.escapeXml(FEED_DESCRIPTION)}</description>
    <link>${this.escapeXml(baseUrl)}</link>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;
  }

  private generateItem(post: Post, baseUrl: string): string {
    const link = `${baseUrl}/adventures/${post.slug}`;
    const description = this.stripHtml(post.excerpt || post.content);
    const publishedAt = this.getPostDate(post);
    const enclosure = this.generateEnclosure(post.coverImageUrl);

    return `    <item>
      <title>${this.escapeXml(post.title)}</title>
      <description>${this.escapeXml(description)}</description>
      <link>${this.escapeXml(link)}</link>
      <guid isPermaLink="true">${this.escapeXml(link)}</guid>
      <pubDate>${publishedAt}</pubDate>
      <author>${this.escapeXml(post.authorName)}</author>${enclosure}
    </item>`;
  }

  private generateEnclosure(coverImageUrl: string): string {
    const url = coverImageUrl.trim();
    if (!url) {
      return '';
    }

    return `
      <enclosure url="${this.escapeXml(url)}" type="${this.getImageMimeType(url)}" length="0" />`;
  }

  private getLastBuildDate(posts: Post[]): string {
    const latestDate = posts
      .map(post => this.getPostDateValue(post))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return (latestDate ?? new Date()).toUTCString();
  }

  private getPostDate(post: Post): string {
    return this.getPostDateValue(post).toUTCString();
  }

  private getPostDateValue(post: Post): Date {
    return post.publishedAt?.toDate() ?? post.updatedAt.toDate() ?? post.createdAt.toDate();
  }

  private stripHtml(value: string): string {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeSiteUrl(siteUrl: string): string {
    return siteUrl.replace(/\/+$/, '');
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private getImageMimeType(url: string): string {
    const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      gif: 'image/gif',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    return extension ? mimeTypes[extension] ?? 'image/jpeg' : 'image/jpeg';
  }
}
