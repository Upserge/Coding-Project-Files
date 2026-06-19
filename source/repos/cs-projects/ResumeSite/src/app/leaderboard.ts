// Leaderboard system with Firestore persistence and subtle name prompt
import {
  Firestore,
  collection,
  doc,
  setDoc,
  orderBy,
  query,
  limit,
  onSnapshot,
  Unsubscribe,
} from '@angular/fire/firestore';
import { leaderboardRankMarkup } from './icons/ui-icons';

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export class Leaderboard {
  private panel: HTMLElement | null = null;
  private prompt: HTMLElement | null = null;
  private playerName: string | null = null;
  private hasPrompted = false;
  private currentRunScore = 0;
  private readonly NAME_KEY = 'rocketPlayerName';
  private readonly MAX_ENTRIES = 20;
  private readonly COLLECTION = 'leaderboard';
  private cachedEntries: LeaderboardEntry[] = [];
  private unsubscribe: Unsubscribe | null = null;
  private snapshotReady = false;
  private playerBest = 0;

  constructor(private firestore: Firestore) {}

  init(onBestLoaded?: (best: number) => void) {
    this.playerName = localStorage.getItem(this.NAME_KEY);
    const q = query(
      collection(this.firestore, this.COLLECTION),
      orderBy('score', 'desc'),
      limit(this.MAX_ENTRIES)
    );
    let initialLoadDone = false;
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.cachedEntries = snapshot.docs.map(d => d.data() as LeaderboardEntry);
      this.snapshotReady = true;
      const own = this.cachedEntries.find(e => e.name === this.playerName);
      if (own && own.score > this.playerBest) {
        this.playerBest = own.score;
      }
      if (!initialLoadDone) {
        initialLoadDone = true;
        onBestLoaded?.(this.playerBest);
      }
      if (this.panel?.classList.contains('visible')) {
        this.refreshPanel();
      }
    });
  }

  onScore(newScore: number) {
    this.currentRunScore = newScore;

    // Live-update the leaderboard if the panel is open
    if (this.playerName) {
      this.saveRun();
      if (this.panel?.classList.contains('visible')) {
        this.refreshPanel();
      }
    }

    // After first score, subtly prompt for name if not set
    if (newScore >= 1 && !this.playerName && !this.hasPrompted) {
      setTimeout(() => this.showNamePrompt(), 1200);
    }
  }

  private showNamePrompt() {
    if (this.prompt || this.hasPrompted) return;
    this.hasPrompted = true;

    this.prompt = document.createElement('div');
    this.prompt.className = 'name-prompt';
    this.prompt.innerHTML = `
      <div class="name-prompt-inner">
        <span class="studio-modal-kicker name-prompt-kicker">Leaderboard</span>
        <span class="name-prompt-text">Nice shot! Enter your name for the leaderboard.</span>
        <div class="name-prompt-input-wrap">
          <input type="text" class="name-prompt-input" placeholder="Your name" maxlength="20" spellcheck="false" autocomplete="off" />
          <button type="button" class="studio-btn-primary name-prompt-submit">Save</button>
        </div>
        <span class="name-prompt-error"></span>
        <button type="button" class="name-prompt-dismiss">Maybe later</button>
      </div>
    `;
    document.body.appendChild(this.prompt);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.prompt?.classList.add('visible');
      });
    });

    const input = this.prompt.querySelector('.name-prompt-input') as HTMLInputElement;
    const submit = this.prompt.querySelector('.name-prompt-submit') as HTMLButtonElement;
    const dismiss = this.prompt.querySelector('.name-prompt-dismiss') as HTMLButtonElement;
    const error = this.prompt.querySelector('.name-prompt-error') as HTMLElement;

    input?.focus();

    const handleSubmit = () => {
      const name = input?.value.trim();
      if (!name) return;
      const taken = this.cachedEntries.some(e => e.name === name);
      if (taken) {
        error.textContent = 'Name already taken — choose a different one';
        input.classList.add('name-prompt-input--error');
        input.select();
        return;
      }
      error.textContent = '';
      input.classList.remove('name-prompt-input--error');
      this.playerName = name;
      this.playerBest = 0;
      localStorage.setItem(this.NAME_KEY, name);
      this.saveRun();
      this.dismissPrompt();
    };

    submit?.addEventListener('click', handleSubmit);
    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
      if (e.key === 'Escape') this.dismissPrompt();
    });
    dismiss?.addEventListener('click', () => this.dismissPrompt());
  }

  private dismissPrompt() {
    if (!this.prompt) return;
    this.prompt.classList.remove('visible');
    setTimeout(() => {
      this.prompt?.remove();
      this.prompt = null;
    }, 400);
  }

  saveRun() {
    if (!this.playerName || this.currentRunScore === 0) return;
    // Wait for the first snapshot so we never overwrite a higher stored score
    if (!this.snapshotReady) return;
    if (this.currentRunScore <= this.playerBest) return;

    const entry: LeaderboardEntry = {
      name: this.playerName,
      score: this.currentRunScore,
      date: new Date().toISOString().split('T')[0],
    };
    const docRef = doc(collection(this.firestore, this.COLLECTION), this.playerName);
    setDoc(docRef, entry)
      .then(() => { this.playerBest = this.currentRunScore; })
      .catch(err => console.error('Leaderboard write failed:', err));
  }

  getEntries(): LeaderboardEntry[] {
    return this.cachedEntries;
  }

  getPlayerName(): string | null {
    return this.playerName;
  }

  showPanel() {
    if (this.panel) {
      this.panel.classList.add('visible');
      this.refreshPanel();
      return;
    }

    this.panel = document.createElement('div');
    this.panel.className = 'studio-modal-overlay leaderboard-overlay';
    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) this.closePanel();
    });
    document.body.appendChild(this.panel);
    this.refreshPanel();

    requestAnimationFrame(() => {
      this.panel?.classList.add('visible');
    });
  }

  private refreshPanel() {
    if (!this.panel) return;
    const entries = this.getEntries();
    const currentName = this.playerName;

    let rowsHtml = '';
    if (entries.length === 0) {
      rowsHtml = '<div class="lb-empty">No runs yet — herd a rocket into a black hole to claim the board.</div>';
    } else {
      rowsHtml = entries
        .map((e, i) => {
          const medal = leaderboardRankMarkup(i + 1);
          const isYou = e.name === currentName ? ' lb-you' : '';
          return `
          <div class="lb-row${isYou}">
            <span class="lb-medal">${medal}</span>
            <span class="lb-name">${this.escapeHtml(e.name)}</span>
            <span class="lb-score">${e.score}</span>
          </div>`;
        })
        .join('');
    }

    this.panel.innerHTML = `
      <div class="studio-modal" role="dialog" aria-labelledby="leaderboard-title">
        <header class="studio-modal-header">
          <div>
            <span class="studio-modal-kicker">Session</span>
            <h3 id="leaderboard-title">Leaderboard</h3>
          </div>
          <button type="button" class="studio-modal-close lb-close" aria-label="Close">✕</button>
        </header>
        <div class="studio-modal-body lb-body">
          ${rowsHtml}
        </div>
        <p class="studio-modal-foot">
          ${
            currentName
              ? `Playing as <strong>${this.escapeHtml(currentName)}</strong>`
              : 'Score once to join the board'
          }
        </p>
      </div>
    `;

    this.panel.querySelector('.lb-close')?.addEventListener('click', () => this.closePanel());
  }

  closePanel() {
    if (!this.panel) return;
    this.panel.classList.remove('visible');
    setTimeout(() => {
      this.panel?.remove();
      this.panel = null;
    }, 220);
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    this.saveRun();
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.dismissPrompt();
    this.panel?.remove();
    this.panel = null;
  }
}
