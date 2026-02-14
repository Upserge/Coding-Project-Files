import { Leaderboard, LeaderboardEntry } from './leaderboard';

describe('Leaderboard', () => {
  let lb: Leaderboard;
  const STORAGE_KEY = 'rocketLeaderboard';
  const NAME_KEY = 'rocketPlayerName';

  beforeEach(() => {
    localStorage.clear();
    lb = new Leaderboard();
    lb.init();
  });

  afterEach(() => {
    lb.destroy();
    localStorage.clear();
  });

  function getStoredEntries(): LeaderboardEntry[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function setPlayerName(name: string) {
    localStorage.setItem(NAME_KEY, name);
    lb = new Leaderboard();
    lb.init();
  }

  // ===== One Entry Per Player =====

  it('should create only one entry per player regardless of how many times saveRun is called', () => {
    setPlayerName('Alice');
    lb.onScore(1);
    lb.saveRun();
    lb.saveRun();
    lb.saveRun();

    const entries = getStoredEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe('Alice');
    expect(entries[0].score).toBe(1);
  });

  it('should keep only one entry per player across multiple page visits', () => {
    setPlayerName('Bob');
    lb.onScore(3);
    lb.saveRun();

    const lb2 = new Leaderboard();
    lb2.init();
    lb2.onScore(1);
    lb2.saveRun();

    const entries = getStoredEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe('Bob');
    expect(entries[0].score).toBe(3);

    lb2.destroy();
  });

  it('should update score when new run beats previous best', () => {
    setPlayerName('Carol');
    lb.onScore(2);
    lb.saveRun();

    const lb2 = new Leaderboard();
    lb2.init();
    lb2.onScore(8);
    lb2.saveRun();

    const entries = getStoredEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].score).toBe(8);

    lb2.destroy();
  });

  it('should not downgrade score when new run is worse than previous best', () => {
    setPlayerName('Dave');
    lb.onScore(10);
    lb.saveRun();

    const lb2 = new Leaderboard();
    lb2.init();
    lb2.onScore(2);
    lb2.saveRun();

    const entries = getStoredEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].score).toBe(10);

    lb2.destroy();
  });

  it('should create separate entries for different players', () => {
    setPlayerName('Eve');
    lb.onScore(5);
    lb.saveRun();

    localStorage.setItem(NAME_KEY, 'Frank');
    const lb2 = new Leaderboard();
    lb2.init();
    lb2.onScore(9);
    lb2.saveRun();

    const entries = getStoredEntries();
    expect(entries.length).toBe(2);
    expect(entries[0].name).toBe('Frank');
    expect(entries[0].score).toBe(9);
    expect(entries[1].name).toBe('Eve');
    expect(entries[1].score).toBe(5);

    lb2.destroy();
  });

  // ===== Live Update Within a Run =====

  it('should update score live as player scores within a single run', () => {
    setPlayerName('Grace');

    lb.onScore(1);
    expect(getStoredEntries().length).toBe(1);
    expect(getStoredEntries()[0].score).toBe(1);

    lb.onScore(2);
    expect(getStoredEntries().length).toBe(1);
    expect(getStoredEntries()[0].score).toBe(2);

    lb.onScore(5);
    expect(getStoredEntries().length).toBe(1);
    expect(getStoredEntries()[0].score).toBe(5);
  });

  it('should not auto-save when player name is not set', () => {
    lb.onScore(1);
    lb.onScore(2);
    lb.onScore(3);

    expect(getStoredEntries().length).toBe(0);
  });

  // ===== Save Guards =====

  it('should not save when player name is not set', () => {
    lb.onScore(5);
    lb.saveRun();
    expect(getStoredEntries().length).toBe(0);
  });

  it('should not save when score is zero', () => {
    setPlayerName('Hank');
    lb.saveRun();
    expect(getStoredEntries().length).toBe(0);
  });

  // ===== Sorting and Limits =====

  it('should sort entries by score descending', () => {
    setPlayerName('Player1');
    lb.onScore(2);
    lb.saveRun();

    localStorage.setItem(NAME_KEY, 'Player2');
    const lb2 = new Leaderboard();
    lb2.init();
    lb2.onScore(10);
    lb2.saveRun();

    localStorage.setItem(NAME_KEY, 'Player3');
    const lb3 = new Leaderboard();
    lb3.init();
    lb3.onScore(5);
    lb3.saveRun();

    const entries = getStoredEntries();
    expect(entries.map(e => e.score)).toEqual([10, 5, 2]);

    lb2.destroy();
    lb3.destroy();
  });

  it('should limit entries to MAX_ENTRIES (20)', () => {
    for (let i = 0; i < 25; i++) {
      localStorage.setItem(NAME_KEY, 'Player' + i);
      const instance = new Leaderboard();
      instance.init();
      instance.onScore(i + 1);
      instance.saveRun();
      instance.destroy();
    }

    const entries = getStoredEntries();
    expect(entries.length).toBe(20);
    expect(entries[0].score).toBe(25);
    expect(entries[entries.length - 1].score).toBe(6);
  });

  // ===== getEntries =====

  it('should return empty array when no data stored', () => {
    expect(lb.getEntries()).toEqual([]);
  });

  it('should return empty array when stored data is invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    expect(lb.getEntries()).toEqual([]);
  });

  // ===== Player Name Persistence =====

  it('should load player name from localStorage on init', () => {
    localStorage.setItem(NAME_KEY, 'Ivy');
    const fresh = new Leaderboard();
    fresh.init();
    expect(fresh.getPlayerName()).toBe('Ivy');
    fresh.destroy();
  });

  it('should return null when no player name is stored', () => {
    expect(lb.getPlayerName()).toBeNull();
  });

  // ===== Name Prompt =====

  it('should not prompt for name if player name is already set', () => {
    setPlayerName('Jake');
    lb.onScore(1);
    const prompt = document.querySelector('.name-prompt');
    expect(prompt).toBeNull();
  });
});
