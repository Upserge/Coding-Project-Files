# RentScore — Implementation phase tracker

## Phase 1 — Foundation ✅ Complete

| Item | Status |
|------|--------|
| Expo Router + 4 tabs (Explore map search merged) | ✅ |
| Firebase Auth (email) + env config | ✅ |
| Firestore rules, indexes, Storage rules | ✅ |
| Map tab + location + property pins | ✅ |
| Property bottom sheet | ✅ |
| Demo mode fallback | ✅ |

## Phase 2 — Reviews core ✅ Complete

| Item | Status |
|------|--------|
| Places autocomplete → property upsert | ✅ |
| Landlord create/search | ✅ |
| Multi-category review form + tags | ✅ |
| Cloud Function: moderate + aggregates | ✅ |
| Property & landlord detail + sorted reviews | ✅ |
| User-selectable app themes (Account → App theme) | ✅ |
| Delete own reviews | ✅ |

## Phase 3 — Discovery polish ✅ Complete

| Item | Status |
|------|--------|
| Explore: Places address search on map (any address) | ✅ |
| Geo query “near me” | ✅ |
| Saved bookmarks | ✅ |
| Sort reviews (newest / highest / lowest) | ✅ |
| Map pin clustering (native) | ✅ |
| Themed UI + cards/buttons | ✅ |
| Map refresh after new review | ✅ |

## Phase 4 — Trust & growth ✅ Complete

| Item | Status |
|------|--------|
| Report content (text) | ✅ |
| Map/property cache refresh strategy | ✅ |
| Rate limits / duplicate detection (Functions) | ✅ |
| Push notifications (saved property) | ✅ |
| Tenancy verification uploads | ✅ |

## Phase 4b — Review photos (credibility) ⏳ Planned

Renters can attach photos to reviews (unit condition, maintenance issues, etc.) to build trust.

| Item | Status |
|------|--------|
| `expo-image-picker` — pick 1–5 photos per review | ⏳ |
| Upload to Firebase Storage `uploads/{uid}/reviews/{reviewId}/…` | ⏳ |
| `Review.photoUrls: string[]` + thumbnail gallery on `ReviewCard` | ⏳ |
| Optional caption per photo | ⏳ |
| Compress / max size limits (e.g. 5 MB each) | ⏳ |
| Cloud Function: strip EXIF, basic moderation flag | ⏳ |

### Report flow for photos

When reporting a **review**, expand reasons to include:

- Irrelevant photos (not this property / misleading)
- Offensive or inappropriate photos
- Photos contain personal information (faces, mail, license plates)
- Spam or advertising in photos

Extend `Report` model:

```ts
targetType: 'review' | 'property' | 'landlord' | 'review_photo'
targetId: string        // review id, or `${reviewId}/photos/{index}`
photoUrl?: string       // optional, for moderation queue
```

`ReportModal` should show photo-specific reasons when the user taps “Report” on an image or on a review that has photos.

## Phase 5 — Legal & launch ⏳ Partial

| Item | Status |
|------|--------|
| Terms of Service + Privacy (in-app) | ✅ |
| EAS config | ✅ |
| Store assets + production builds | ⏳ |
| Landlord dispute email flow | ⏳ |

---

## Data refresh: when does the map update?

There is **no continuous polling** on the map tab. Property pins use React Query with **event-driven** refetch:

| Trigger | When |
|---------|------|
| **Tab focus** | Returning to Explore / Map invalidates nearby properties |
| **Stale after 30s** | `staleTime: 30_000` — refetch on next mount/focus if data is older than 30 seconds |
| **After submitting a review** | Optimistic pin color update immediately, then poll Firestore up to ~9s for Cloud Function aggregates |
| **Window focus (web)** | `refetchOnWindowFocus: true` |

Pin color (`avgOverall`) on the property document is updated by the **Cloud Function** (`onReviewWrite`), not the client — Firestore rules block direct client updates to aggregates.

**UI fallback:** After submit, the app derives `avgOverall` / `reviewCount` from published reviews in Firestore and patches React Query caches (map pins, bottom sheet, property header). This keeps pins accurate even when Cloud Functions are not deployed.

Ensure functions are deployed:

```bash
npm run firebase:deploy
```

### Phase 4 — deploy & test notes

| Feature | Deploy step | How to test |
|---------|-------------|-------------|
| Rate limits / moderation | `npm run firebase:deploy` | Submit reviews; 6th in 24h should reject; duplicate body on another property within 7 days rejects |
| Push (saved property) | Deploy functions + set `EAS_PROJECT_ID` in `.env` | Physical iPhone + Expo Go: Account → enable alerts, save a property, post review from another account |
| Tenancy verification | Deploy rules + storage | Account → upload image; doc appears in `verifications/{uid}` |

**Windows / Expo Go:** iOS push works on a physical device in Expo Go. Android remote push is **not** available in Expo Go (SDK 53+); use a dev build or test push on iOS. Run `npm install` on each machine after pulling (this PC may not have had `node_modules`).

---

## App themes (Account → App theme)

1. **Frost Slate** — default; cool glass UI for map search  
2. **Twilight Glass** — dark indigo glass  
3. **Clear Sky** — airy blue-white glass  
4. **Trust Teal** — original teal look  
5. **Midnight Amber** — dark mode  
6. **Soft Paper** — warm, review-first  

Choice is saved per device via AsyncStorage.
