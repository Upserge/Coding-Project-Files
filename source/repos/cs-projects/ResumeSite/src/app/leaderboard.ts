// Leaderboard system with Firestore persistence and subtle name prompt
import {
  Firestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
  Unsubscribe,
} from '@angular/fire/firestore';

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
    this.unsubscribe = onSnapshot(q, snapshot => {
      this.cachedEntries = snapshot.docs.map(d => d.data() as LeaderboardEntry);
      this.snapshotReady = true;
      const own = this.cachedEntries.find(e => e.name === this.playerName);
      if (own && own.score > this.playerBest) {
        this.playerBest = own.score;
      }
      // Fire once so the caller can seed their score counter from the stored total
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
    if (newScore === 1 && !this.playerName && !this.hasPrompted) {
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
        <span class="name-prompt-emoji">🚀</span>
        <span class="name-prompt-text">Nice shot! Enter your name for the leaderboard</span>
        <div class="name-prompt-input-wrap">
          <input type="text" class="name-prompt-input" placeholder="Your name" maxlength="20" spellcheck="false" autocomplete="off" />
          <button class="name-prompt-submit">→</button>
        </div>
        <span class="name-prompt-error"></span>
        <button class="name-prompt-dismiss">Maybe later</button>
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
    this.panel.className = 'leaderboard-panel';
    document.body.appendChild(this.panel);
    this.refreshPanel();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.panel?.classList.add('visible');
      });
    });

    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.lb-close')) {
        this.closePanel();
      }
    };
    this.panel.addEventListener('click', handleClose);
  }

  private refreshPanel() {
    if (!this.panel) return;
    const entries = this.getEntries();
    const currentName = this.playerName;

    let rowsHtml = '';
    if (entries.length === 0) {
      rowsHtml = '<div class="lb-empty">No runs yet — herd a rocket into a black hole!</div>';
    } else {
      rowsHtml = entries.map((e, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span class="lb-rank">${i + 1}</span>`;
        const isYou = e.name === currentName ? ' lb-you' : '';
        return `
          <div class="lb-row${isYou}">
            <span class="lb-medal">${medal}</span>
            <span class="lb-name">${this.escapeHtml(e.name)}</span>
            <span class="lb-score">${e.score}</span>
          </div>`;
      }).join('');
    }

    this.panel.innerHTML = `
      <div class="lb-header">
        <h3>🏆 Leaderboard</h3>
        <div class="lb-header-actions">
          <button class="lb-close" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="lb-body">
        ${rowsHtml}
      </div>
      <div class="lb-footer">
        ${currentName ? `Playing as <strong>${this.escapeHtml(currentName)}</strong>` : 'Score to join the leaderboard'}
      </div>
    `;
  }

  closePanel() {
    if (!this.panel) return;
    this.panel.classList.remove('visible');
    setTimeout(() => {
      this.panel?.remove();
      this.panel = null;
    }, 300);
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    this.saveRun();
    this.unsubscribe?.();
    this.dismissPrompt();
    this.panel?.remove();
    this.panel = null;
  }
}
