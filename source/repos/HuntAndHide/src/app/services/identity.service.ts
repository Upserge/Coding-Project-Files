import { Injectable } from '@angular/core';
import { LocalIdentity } from '../models/leaderboard.model';

const STORAGE_KEY = 'hh_identity';

/**
 * Lightweight identity backed by localStorage.
 * No full auth — just a random token + username for returning-player tracking.
 */
@Injectable({ providedIn: 'root' })
export class IdentityService {

  private identity: LocalIdentity | null = null;

  /** Load or create identity on first access. */
  getIdentity(): LocalIdentity {
    if (this.identity) return this.identity;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return this.useStoredIdentity(stored);

    // First visit — generate a new identity (username set later by player)
    this.identity = {
      token: this.generateToken(),
      username: '',
      createdAt: Date.now(),
    };
    this.persist();
    return this.identity;
  }

  getToken(): string {
    return this.getIdentity().token;
  }

  getUsername(): string {
    return this.getIdentity().username;
  }

  hasUsername(): boolean {
    return this.getIdentity().username.length > 0;
  }

  /** Set the player's chosen username (after uniqueness check). */
  setUsername(username: string): void {
    const id = this.getIdentity();
    id.username = username;
    this.persist();
  }

  private persist(): void {
    if (!this.identity) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.identity));
  }

  private useStoredIdentity(stored: string): LocalIdentity {
    this.identity = JSON.parse(stored) as LocalIdentity;
    return this.identity;
  }

  private generateToken(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
}
