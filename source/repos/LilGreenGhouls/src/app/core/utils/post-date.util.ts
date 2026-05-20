import { Timestamp } from 'firebase/firestore';
import { Post } from '../models/post.model';

/** Primary date for ordering and displaying when the adventure occurred. */
export function getPostAdventureDate(post: Post): Date {
  return (
    post.adventureAt?.toDate() ??
    post.publishedAt?.toDate() ??
    post.updatedAt?.toDate() ??
    post.createdAt.toDate()
  );
}

export function sortPostsByAdventureDate(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) => getPostAdventureDate(b).getTime() - getPostAdventureDate(a).getTime(),
  );
}

export function timestampToDatetimeLocalValue(ts: Timestamp | null | undefined): string {
  if (!ts) {
    return '';
  }

  const date = ts.toDate();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function datetimeLocalValueToTimestamp(value: string): Timestamp | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Timestamp.fromDate(parsed);
}
