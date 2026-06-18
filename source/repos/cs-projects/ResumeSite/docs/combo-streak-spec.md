# Combo Streak HUD — Implementation Spec

Replaces the legacy circular **combo ring** with a **streak chip** aligned to the ResumeSite cinematic HUD language (glass pills, design tokens, passive game chrome).

---

## Problem with legacy combo UI

| Issue | Detail |
|-------|--------|
| Visual mismatch | 60px dark circle + conic gradient did not match `home-hud`, focus toggle, or entropy/milestone bars |
| Broken visibility | `show()` forced inline `display: flex`, leaving an empty black ring at ×1 or after expiry |
| No affordance | No label, tooltip, or `aria-*`; read as a dead control in the top-right |
| Placement | Floated below site controls with no semantic tie to the rest of the HUD |

Game **logic** (multiplier window, entropy knockback, score scaling) stays unchanged.

---

## Design motif alignment

Reference components:

- `home-hud` — glass pill, `var(--color-surface)`, `backdrop-filter`, `var(--radius-pill)`, Space Grotesk
- `focus-toggle` — reveal via opacity + translate; session-gated game chrome
- `entropy-bar` / `milestone-bar` — compact label + horizontal 4–6px progress track

### Streak chip anatomy

```
      ╭── ring drains over 4s ──╮
     ╭┴─────────────────────────┴╮
     │ STREAK              ×3   │  glass pill
     ╰──────────────────────────╯
```

The **conic-gradient ring** wraps the pill (2px stroke). It starts full on each goal and depletes clockwise over **4 seconds**. When empty, the chip fades out.

| Token | Usage |
|-------|--------|
| `--color-surface` | Pill background |
| `--color-border` | Pill border |
| `--font-display` | Label typography |
| `--color-accent` / `--color-accent-muted` | Default ring + multiplier |
| `#fbbf24` | Hot streak (×5+) — matches score pill & milestone gold |
| `--shadow-sm`, `--duration-normal`, `--ease-spring` | Motion + elevation |

---

## Behavior

### Visibility rules

- **Visible** when `multiplier >= 1` and streak timer is running (after any goal)
- **Hidden** when the 4s window expires
- No `show()` / `hide()` on run start — UI follows streak state only
- First goal shows **×1** with a full ring — signals “score again before this closes”

### Game rules (unchanged)

- Combo window: **4 seconds** wall-clock (not frame-count — refresh-rate independent)
- Max multiplier: **×10**
- `feed()` on each goal → increment multiplier, reset timer, return multiplier for score + entropy knockback
- `tick()` each active frame → drain timer; reset multiplier at 0

### Interaction

- **Display-only** — no click handler
- `title` tooltip: chain timing hint
- `aria-live="polite"` on container; progress track uses `role="progressbar"`

### Motion

- Enter/exit: opacity `0 → 1`, `translateY(-6px → 0)` (matches focus-toggle reveal)
- Hot state (×5+): gold border/fill; optional subtle glow, no infinite pulse (reduced-motion safe)

### Layout

- `position: fixed; top: 68px; right: 20px; z-index: 44`
- Aligns with `home-hud` (`top: 20px; right: 20px`) — sits directly under the control row
- Mobile: `top: 60px; right: 14px; width: 132px`

---

## Module structure

| File | Role |
|------|------|
| `src/app/combo-streak.ts` | Streak state + imperative DOM (replaces `combo-tracker.ts`) |
| `src/styles/combo-streak.css` | Token-based styles |
| `src/app/run-manager.ts` | `readonly streak = new ComboStreak()`; remove combo show/hide |
| `src/app/combo-streak.spec.ts` | Unit tests for logic + visibility |

Remove: `combo-tracker.ts`, `combo-tracker.spec.ts`, `.combo-tracker` CSS block in `styles.css`.

---

## API

```ts
export interface StreakSnapshot {
  readonly multiplier: number;
  readonly timerFraction: number;
  readonly active: boolean;
}

export class ComboStreak {
  init(): void;
  destroy(): void;
  feed(): number;
  tick(): void;
  reset(): void;
  snapshot(): StreakSnapshot;
  readonly active: boolean;
  readonly current: number;
  readonly peak: number;
}
```

`RunManager` exposes `streak` (renamed from `combo`). `finalizeRun` still reports `peakCombo` from `streak.peak`.

---

## Test plan

- [ ] Fresh load → no streak chip in DOM (or inactive)
- [ ] First goal → still hidden (×1)
- [ ] Second goal within 4s → chip fades in with `×2` and draining track
- [ ] Wait 4s without scoring → chip disappears
- [ ] ×5+ streak → gold hot styling
- [ ] `ng test` — streak specs + run-manager specs pass
