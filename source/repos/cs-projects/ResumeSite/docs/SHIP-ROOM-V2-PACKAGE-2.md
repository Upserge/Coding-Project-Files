# Ship Room V2 — Package 2: Cinematic Portfolio

Implementation plan for the **Cinematic portfolio** package (aesthetics headline). Builds on completed Phases 1–4 without regressing game systems, routing, deploy, or recruiter-readable content.

**Package scope**


| ID     | Feature             | Summary                                        |
| ------ | ------------------- | ---------------------------------------------- |
| **B5** | Brand system        | Design tokens, typography, consistent surfaces |
| **B3** | Shader upgrade pass | Hero WebGL + black-hole visual polish          |
| **B4** | Reel motion loops   | Cinematic media in the work reel               |
| **B1** | Scroll narrative    | Directed home scroll: hero → proof → projects  |


**Related doc:** `docs/SHIP-ROOM-PLAN.md` (Phases 1–4)

---

## Locked decisions (2026-06-14)


| #   | Topic              | Your choice                  | Implementation note                                                                         |
| --- | ------------------ | ---------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Reel motion assets | **A — WebM + MP4**           | `scripts/media/` ffmpeg pipeline → `public/work/loops/`                                     |
| 2   | Scroll narrative   | **C — Bold snap scroll**     | **Desktop only** (`min-width: 1024px`); CSS `scroll-snap`, not JS scroll hijacking          |
| 3   | Typography         | **A — Inter + display face** | **Space Grotesk** for headings (swap-friendly via `--font-display`)                         |
| 4   | Shader direction   | **C — Studio look**          | Ship `studio` preset first; **fallback preset `aurora` (4A)** via flag if perf/visual fails |
| 5   | Mobile             | **A**                        | No B1 snap + no shader v2 on viewport < 768px; reel stays grid                              |
| 6   | Prototype workflow | **A — Repo flags**           | Modular modules so validated prototypes replace classics; rip-out path per subsystem        |
| 7   | Timeline           | **C**                        | Ship **5a → 5b → 5c → 5d** independently; deploy each when signed off                       |


---

## Goals


| Goal                                    | How we measure                                            |
| --------------------------------------- | --------------------------------------------------------- |
| First impression feels **studio-grade** | Qualitative review + reel/hero pass                       |
| **No functional regressions**           | `npm test` green every merge; manual game + nav checklist |
| **Performance preserved**               | Budgets + manual FPS spot-check on home                   |
| **Clean, maintainable code**            | Feature flags, small modules, no monolith growth          |
| **Tests added with features**           | New specs per subsystem (see Testing strategy)            |


## Non-goals (this package)

- AI chat, 3D ship room, new routes beyond home polish
- Rewriting particle game logic or upgrade systems
- Replacing GitHub Pages hosting model
- Autoplay sound or heavy third-party animation libraries unless approved below

---

## Guiding principles

### 1. Incremental delivery behind flags

Prototype the new look **without** breaking the current site:

```ts
// src/app/content/visual-tier.ts
export type ShaderPreset = 'classic' | 'aurora' | 'studio';

export interface VisualTierConfig {
  brandV2: boolean;
  shaderV2: boolean;
  shaderPreset: ShaderPreset; // studio = 4C target; aurora = 4A fallback
  reelMotion: boolean;
  scrollNarrative: boolean; // desktop snap scroll when true
}

export const VISUAL_TIER: VisualTierConfig = {
  brandV2: false,
  shaderV2: false,
  shaderPreset: 'classic',
  reelMotion: false,
  scrollNarrative: false,
};
```

- `document.documentElement` attributes:
  - `data-visual-tier="classic" | "cinematic"` (any cinematic flag on)
  - `data-shader-preset="classic" | "aurora" | "studio"` when `shaderV2`
- **Classic path stays default** until each sub-phase is signed off.
- Local dev override: `localStorage.setItem('visual-tier-preview', 'cinematic')` (+ optional `shader-preset-preview`).

### 1b. Modular architecture (rip-out friendly)

Each cinematic subsystem lives in its **own folder/file pair** with a **thin factory** — home and services never import v2 internals directly.


| Subsystem    | Classic (keep until rip-out) | Cinematic (prototype)                                  | Factory / switch                         |
| ------------ | ---------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| Visual flags | —                            | `content/visual-tier.ts`                               | `applyVisualTier()`                      |
| Hero shader  | `shader-hero.ts`             | `gl/shader-hero-studio.ts`, `gl/shader-hero-aurora.ts` | `gl/shader-hero.factory.ts`              |
| Black holes  | `black-hole-renderer.ts`     | `gl/black-hole-studio.ts`                              | `gl/black-hole.factory.ts`               |
| Scroll       | existing `.reveal` only      | `scroll/scroll-snap-home.ts` + `scroll-snap-home.css`  | init only if `scrollNarrative` + desktop |
| Reel media   | `heroImage` img              | `reel/reel-media.ts` + video branch in component       | `resolveReelMedia()`                     |
| Brand        | literals in CSS              | `styles/tokens.css` + `styles/cinematic.css`           | `[data-visual-tier="cinematic"]` scope   |


**Rules**

1. **No merging** classic and v2 logic in the same function — factory picks one implementation.
2. **No deleting classic** until you sign off and explicitly “rip out” (see Rip-out checklist).
3. **CSS:** cinematic overrides live in `cinematic.css` or `*-cinematic.css`, not sprinkled in classic rules.
4. **Angular:** lazy `import()` for scroll-snap controller on home only when flag enabled (keeps bundle lean when flags false).

**Rip-out checklist (when a prototype wins)**

1. Set cinematic flag default `true` in `VISUAL_TIER`.
2. Delete classic implementation file(s) + factory branch.
3. Remove flag and dead CSS under classic selectors.
4. Run full test + manual regression; one commit per ripped subsystem.

**Shader 4C → 4A fallback (no refactor)**

Change only `shaderPreset: 'aurora'` in `visual-tier.ts` (or localStorage preview). Factory swaps GLSL module; `shader-hero.ts` classic path unchanged.

### 2. Performance guardrails


| Guardrail              | Threshold                                         | Action if exceeded                                        |
| ---------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Initial JS bundle      | Stay under **750 kB** warning (current ~682 kB)   | Lazy-load cinematic modules; no GSAP on critical path     |
| Home FPS (desktop)     | ≥ **55 fps** median with game running             | Reduce shader cost, cap DPR, disable B1 on low power      |
| Home FPS (mobile)      | ≥ **45 fps** or auto-lite                         | `matchMedia` + `navigator.hardwareConcurrency` tier       |
| Reel media             | **≤ 2 MB** per loop, prefer WebP/video under 1 MB | Compress; static PNG fallback always                      |
| Main thread long tasks | No new **> 50 ms** blocks on scroll               | Snap uses CSS; JS only for nav sync                       |
| Tab hidden             | Existing pause behavior                           | Shader + scroll listeners must respect `visibilitychange` |
| Desktop snap scroll    | Only when `scrollNarrative` + `min-width: 1024px` | Mobile/tablet: classic free scroll                        |


**Baseline capture (before Phase 5a):**

1. Record bundle size from `npm run build:pages`
2. Chrome Performance: 10 s idle on home + 10 s scoring
3. Note Lighthouse performance score (optional, local)

Repeat after each sub-phase.

### 3. Clean code boundaries


| Area            | Rule                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------- |
| **Tokens**      | Single source: `src/styles/tokens.css` imported in `styles.css`                              |
| **Shader**      | `src/app/gl/` — classic stays in place until rip-out; factory selects preset                 |
| **Scroll**      | `src/app/scroll/scroll-snap-home.ts` — isolated; removable without touching `resume-service` |
| **Reel**        | Extend `work-reel` component; media type in `ProjectItem`                                    |
| **Home**        | Home template stays section-based; narrative is CSS + one controller                         |
| **No drive-by** | No unrelated refactors in game/resume-service during aesthetic work                          |


### 4. Accessibility & reduced motion

- `prefers-reduced-motion: reduce` → **no snap scroll**, static hero, `shaderPreset` forced to `classic` or `aurora`, reel poster not video.
- **Snap scroll (2C):** CSS `scroll-snap-type` on `.resume-main` (desktop only) — native scroll, keyboard and nav `scrollTo()` still work; no `preventDefault` on wheel/touch.
- Reel videos: `muted`, `playsinline`, `preload="metadata"`, poster required.
- Contrast checked after B5 token changes (WCAG AA for body text).
- Snap sections must remain reachable via nav links W, J, K, L, ; and command palette.

---

## Implementation phases

Recommended order: **foundation → isolated visuals → reel assets → integrated scroll** (lowest coupling risk first).

```
B5 Brand ──► B3 Shader ──► B4 Reel loops ──► B1 Scroll narrative ──► Flag flip + deploy
```

---

### Phase 5a — Brand system (B5)

**Effort:** ~3–5 days · **Risk:** Low · **Flag:** `brandV2`

**Deliverables**

1. **Design tokens** (`src/styles/tokens.css`)
  - Color ramps: `--bg`, `--surface`, `--accent`, `--accent-muted`, `--glow`
  - Spacing scale, radius scale, shadow presets
  - Motion durations (respect reduced motion)
2. **Typography (3A)**
  - Body: **Inter** (existing stack)
  - Display: **Space Grotesk** via Google Fonts `display=swap` — token `--font-display`
  - Headings use `font-family: var(--font-display)` only under `[data-visual-tier="cinematic"]` until rip-out
3. **Component pass (visual only)**
  - Nav, cards, work showcase, case study headers, about page, game HUD chrome
  - Map existing hard-coded purples to tokens (incremental, file-by-file)
4. **Theme parity** — dark + light tokens, test toggle

**Files (expected)**


| File                                                   | Change                                    |
| ------------------------------------------------------ | ----------------------------------------- |
| `src/styles/tokens.css`                                | New                                       |
| `src/styles.css`                                       | Import tokens; replace literals gradually |
| `src/app/pages/home-page/home-page.css`                | Token usage                               |
| `src/app/app.css`                                      | Nav/dock tokens                           |
| `src/app/components/work-reel/work-reel.component.css` | Token usage                               |
| `src/app/content/visual-tier.ts`                       | Flags + `applyVisualTier()`               |
| `src/styles/cinematic.css`                             | Cinematic-only overrides (scoped)         |


**Tests**


| Test                                                        | Type      |
| ----------------------------------------------------------- | --------- |
| Token CSS builds without error                              | Build     |
| `visual-tier.spec.ts` — flag → `data-visual-tier` attribute | Unit      |
| Optional: computed style smoke in component test            | Light DOM |


**Sign-off checklist**

- [x] Dark/light both readable
- [x] Game HUD, upgrade modal, toasts still legible
- [x] No layout shift on hero
- [x] `npm test` green

---

### Phase 5b — Shader upgrade pass (B3) — preset **studio** (4C), fallback **aurora** (4A)

**Effort:** ship when ready · **Risk:** Medium (GPU) · **Flags:** `shaderV2` + `shaderPreset`

**Deliverables**

1. `**src/app/gl/shader-hero.factory.ts`**
  - `classic` → existing `ShaderHero` (current file, untouched logic)
  - `aurora` → `shader-hero-aurora.ts` — refined noise, theme tokens (**4A fallback**)
  - `studio` → `shader-hero-studio.ts` — higher contrast, faster motion, stronger glow (**4C target**)
2. `**src/app/gl/black-hole.factory.ts`**
  - `classic` → current `black-hole-renderer.ts`
  - `studio` / `aurora` → matching disk shimmer intensity per preset
3. **Score moment FX** — brief pulse on goal; only when `shaderPreset === 'studio'`
4. **Mobile (< 768px):** factory always returns classic hero + classic black holes (5A)

**Validation gate (4C vs 4A)**


| Check                             | If fail → set `shaderPreset: 'aurora'` |
| --------------------------------- | -------------------------------------- |
| Desktop FPS < 50 median with game | Drop to aurora                         |
| Visual too busy / illegible hero  | Drop to aurora                         |
| WebGL errors on target browsers   | Drop to classic                        |


No code deletion required — preset swap only.

**Performance rules**

- Max 1 hero WebGL context + canvas game
- DPR cap `min(dpr, 1.5)` for studio; `1.25` for aurora
- `destroy()` on home leave unchanged

**Tests**


| Test                                                                                      | Type   |
| ----------------------------------------------------------------------------------------- | ------ |
| `shader-hero.factory.spec.ts` — preset → correct class, mobile → classic                  | Unit   |
| `shader-hero-studio.spec.ts` / `shader-hero-aurora.spec.ts` — init/destroy, reducedMotion | Unit   |
| Manual FPS + visual review                                                                | Manual |


**Sign-off checklist**

- [x] `shaderPreset: 'aurora'` works without studio files loaded path issues
- [x] Classic path bit-identical when `shaderV2: false`
- [x] Hero destroys cleanly on route change

---

### Phase 5c — Reel motion loops (B4)

**Effort:** ~5–8 days · **Risk:** Medium (assets + bandwidth) · **Flag:** `reelMotion`

**Deliverables**

1. **Media model** extend `ProjectItem` in `resume-service.ts`:
  ```ts
   reelMedia?: {
     type: 'image' | 'video' | 'loop';
     src: string;
     poster?: string; // required for video
   };
  ```
2. **Asset pipeline (1A)**
  - `scripts/media/render-loops.ps1` (or `.sh`) — ffmpeg WebM + MP4 from source captures
  - `public/work/loops/` — per project: `.webm`, `.mp4`, `poster.webp`
  - Max dimensions ~760×380; target **< 1 MB** per loop
3. **Work reel component**
  - `<video>` with poster fallback; pause when off-screen (`IntersectionObserver`)
  - Pause all reel videos when tab hidden
  - `reelMotion` false → current `<img>` behavior (regression path)
4. **Deploy**
  - `deploy.ps1` already copies recursive `public/` — verify loop folder size in commit

**Tests**


| Test                                                                       | Type            |
| -------------------------------------------------------------------------- | --------------- |
| Extend `work-reel.spec.ts` — image mode, video mode mocked, poster present | Component       |
| `project-media.spec.ts` — resolve media URL helper                         | Unit            |
| Deploy dist contains loop files                                            | Manual / script |


**Sign-off checklist**

- [x] Mobile grid unchanged (reel hidden < 768px today)
- [x] Broken video → poster + img fallback
- [x] No autoplay with sound
- [x] Total new assets < ~8 MB for all projects

---

### Phase 5d — Scroll narrative (B1) — **bold snap scroll, desktop only** (2C)

**Effort:** ship when ready · **Risk:** High (home integration) · **Flag:** `scrollNarrative`

**Scope**

- **Enabled when:** `scrollNarrative` + `min-width: 1024px` + not `prefers-reduced-motion`
- **Disabled on:** mobile/tablet (< 768px per 5A), reduced motion, flag false

**Deliverables**

1. **Snap targets** — one snap stop per major home section:

  | Snap section | Element          | Notes              |
  | ------------ | ---------------- | ------------------ |
  | Hero         | `.resume-header` | Full viewport feel |
  | Work         | `#work`          | Case studies       |
  | Summary      | `#summary`       | Stats + quote      |
  | Projects     | `#projects`      | Reel + grid        |
  | Experience   | `#experience`    | Timeline           |
  | Technologies | `#technologies`  | Tech grid          |

2. `**src/app/scroll/scroll-snap-home.ts`**
  - Adds/removes `scroll-snap-enabled` on `html` or `.resume-main`
  - Syncs nav `active` section on `scroll` (throttled) — does **not** block native scroll
  - `destroy()` removes class + listeners on `HomePage` leave
  - Lazy-loaded from `HomePage` only when flag true
3. **CSS** (`src/app/scroll/scroll-snap-home.css`)
  - `scroll-snap-type: y proximity` on scroll container (bold but not aggressive `mandatory` unless QA prefers)
  - `scroll-snap-align: start` on sections; `scroll-padding-top` for fixed nav (~64px)
  - Import only when cinematic tier active
4. **Coexistence with `.reveal`**
  - Keep reveals on mobile; on desktop snap, optional `reveal` disable via `[data-scroll-snap="on"]` to avoid double motion
5. `**scrollTo()` compatibility**
  - `ResumeService.scrollTo(id)` must set `scroll-margin` / snap alignment so programmatic scroll lands correctly (test W/J/K/L/; keys)

**Tests**


| Test                                                                                | Type   |
| ----------------------------------------------------------------------------------- | ------ |
| `scroll-snap-home.spec.ts` — enable/disable guards (viewport, reduced motion, flag) | Unit   |
| `scroll-snap-home.spec.ts` — destroy removes listeners                              | Unit   |
| Nav `scrollTo('projects')` lands on section                                         | Manual |
| Command palette section jumps                                                       | Manual |


**Sign-off checklist**

- [x] Snap only on desktop; phone scroll feels unchanged
- [x] Focus mode + particle layout refresh unaffected
- [x] No wheel/touch `preventDefault`

---

### Phase 5e — Per-sub-phase ship (7C)

Each sub-phase is **independently deployable** when its sign-off checklist passes:


| Sub-phase      | Flip flag                                  | Deploy?                                  |
| -------------- | ------------------------------------------ | ---------------------------------------- |
| 5a Brand       | `brandV2: true`                            | Yes — visual only, lowest risk           |
| 5b Shader      | `shaderV2: true`, `shaderPreset: 'studio'` | Yes — or `'aurora'` if studio fails gate |
| 5c Reel        | `reelMotion: true`                         | Yes — after loops in `public/`           |
| 5d Snap scroll | `scrollNarrative: true`                    | Yes — desktop-only behavior              |


No “big bang” required. After each deploy:

1. `npm test` + `npm run build:pages`
2. Manual regression checklist
3. `npm run deploy` when you approve

When all four are validated and classics ripped out (optional cleanup pass), update `SHIP-ROOM-PLAN.md` → Phase 5 complete.

---

## Testing strategy

### Always run

```bash
npm test
npm run build:pages
```

### Per-PR test additions (target **+15–25 specs** total for Package 2)


| Module                 | Spec file                     |
| ---------------------- | ----------------------------- |
| Visual tier / flags    | `visual-tier.spec.ts`         |
| Shader factory         | `shader-hero.factory.spec.ts` |
| Scroll snap guards     | `scroll-snap-home.spec.ts`    |
| Reel media resolver    | `project-media.spec.ts`       |
| Work reel video branch | `work-reel.spec.ts` (extend)  |


### Manual regression checklist (every sub-phase)

- [ ] Home hero, typewriter, links, copy email
- [ ] Case studies load (`/work/resume-site`, `/work/riot-valorant`)
- [ ] About page loads
- [ ] Game: score, upgrades, milestone modal, inventory toggle, entropy, combo, focus toggle
- [ ] Leaderboard, command palette (Ctrl+K), keyboard shortcuts
- [ ] Dark/light toggle
- [ ] Deploy path: `npm run build:pages` → dist has chunks + `public/work`

### Optional (later)

- Playwright smoke: home loads, one case study, score > 0
- Lighthouse CI budget in GitHub Actions (not in repo today)

---

## Dependency policy


| Need                | Recommendation                                     | Avoid                             |
| ------------------- | -------------------------------------------------- | --------------------------------- |
| Scroll choreography | CSS `scroll-snap` on desktop; thin sync controller | JS scroll hijacking, GSAP         |
| Video loops         | ffmpeg / Remotion **CLI** → static files           | Remotion player in browser bundle |
| Fonts               | Google Fonts `display=swap` or self-host woff2     | Multiple heavy families           |
| 3D                  | Not in Package 2                                   | Three.js                          |


Any new npm dependency requires: bundle delta note + lazy load plan.

---

## Rollback plan

1. Set subsystem flag to `false` in `visual-tier.ts` → classic behavior (single commit).
2. Shader: `shaderV2: false` or `shaderPreset: 'aurora'` or `'classic'` — no file deletion.
3. Reel: `reelMotion: false` → `heroImage` img path only.
4. Snap: `scrollNarrative: false` → remove snap class via flag; delete `scroll/` folder only after rip-out.
5. Git revert on Jason.io if production issue post-deploy.

---

## Execution order (confirmed)

```
5a Brand (3A) ──► 5b Shader studio/aurora (4C/4A) ──► 5c Reel ffmpeg loops (1A) ──► 5d Snap desktop (2C)
         │                    │                              │                         │
    deploy optional      deploy optional              deploy optional           deploy optional
```

**Next implementation step:** Phase **5a** — `visual-tier.ts`, `tokens.css`, Space Grotesk, `cinematic.css`, `applyVisualTier()` in `app.ts`.

---

## Changelog


| Date       | Change                                                           |
| ---------- | ---------------------------------------------------------------- |
| 2026-06-14 | Locked decisions: 1A, 2C, 3A, 4C/4A fallback, 5A, 6A modular, 7C |
| 2026-06-14 | Initial Package 2 implementation plan                            |


