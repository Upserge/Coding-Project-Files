# 👻 LilGreenGhouls — Architecture & Vision

> A paranormal-encounter blogging platform built with Angular 20, Firebase, and a spooky-modern aesthetic.

---

## 1. Project Vision

LilGreenGhouls is a curated digital museum of paranormal adventures. Two admins
document encounters with rich blog posts, photos, videos, and external links.
Viewers (friends & family) browse a beautifully themed site and can subscribe to
push notifications so they never miss a new post.

---

## 2. Tech Stack & Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Angular 20 (standalone components, signals) | Already scaffolded; latest features like `@let`, signal-based inputs, and built-in control flow (`@if`, `@for`) |
| **Styling** | Tailwind CSS v4 | Utility-first, dark-mode-first design; great for rapid theming without heavy CSS files |
| **UI Components** | Angular CDK (overlay, a11y, drag-drop) | Lightweight headless primitives — no opinionated styling to fight against our custom theme |
| **Rich Text Editor** | Quill via `ngx-quill` | Mature WYSIWYG editor with image/video embed support; outputs HTML or Delta for Firestore storage |
| **Animations** | Custom AOS directive (IntersectionObserver) + CSS keyframes | Scroll-triggered reveals via lightweight attribute directive (`appAos`); no third-party AOS library needed. CSS for fog/particle ambient effects |
| **Fonts** | Google Fonts — *Creepster* (display), *Inter* (body) | Creepster gives spooky character to headings; Inter is clean and highly readable for body text |
| **Auth** | Firebase Authentication (Google provider) | Zero-password UX; admin whitelist checked against Firestore |
| **Database** | Cloud Firestore | Real-time listeners, offline support, scales to zero cost for small audiences |
| **File Storage** | Firebase Cloud Storage | Direct image/video uploads from the admin editor with security rules |
| **Hosting** | Firebase Hosting | One-command deploy, free SSL, CDN, custom domain support |
| **SSR** | Angular SSR (already scaffolded) | SEO for public pages; faster first paint for viewers |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Browser push notifications on Spark (free) plan; admin triggers send from post editor. Service worker handles background delivery. Future-ready for mobile app conversion |

### Modern UI Techniques Being Used
- **Glassmorphism** — frosted-glass card overlays for post cards and modals
- **Dark mode first** — deep purple/charcoal base with misty green and ghostly white accents
- **Scroll-driven animations** — AOS reveals, parallax hero sections
- **Micro-interactions** — hover glow effects, skeleton loaders, subtle floating particles
- **Responsive grid** — CSS Grid + Tailwind for masonry-like adventure gallery
- **Lazy-loaded routes** — snappy navigation, code-split per feature area
- **Gradient animated text** — hero headings use a shifting multi-color gradient (`gradient-text` utility) cycling through ecto-green → haunt-purple → candle-glow
- **Infinite-scroll marquee** — horizontally scrolling location ticker (à la Railway/CandyCode logo bars); CSS `marquee-scroll` keyframe, pauses on hover
- **Floating ghost particles** — ambient emoji particles (`ghost-particle` utility) with staggered `animation-delay` drift upward through hero and CTA sections
- **Pulse-glow CTAs** — primary buttons softly pulse their glow shadow to draw attention (`pulse-glow` utility)
- **Staggered fade-in** — content fades in sequentially using `.fade-in-up` + `.delay-*` classes for a cinematic reveal
- **Gradient-border hover cards** — post cards & team cards show a multi-color gradient border on hover via `::before` pseudo-element (`gradient-border-hover` utility)
- **Shimmer skeleton placeholders** — animated gradient shimmer on cards missing cover images (`shimmer` utility)
- **Atmospheric section dividers** — translucent gradient horizontal rules (`spooky-divider` utility) replace hard borders between content sections
- **Atmospheric CTA banner** — full-width radial-gradient section above the footer with floating particles and a dramatic heading; present on every viewer page via the shell layout
- **Holographic investigator cards** — 3D tilt effect on About Us team cards using CSS `perspective`, `rotateX`/`rotateY` via pointer tracking; rainbow gradient overlay + moving shine spot for a holographic Pokémon-card feel
- **Parallax hero** — `background-attachment: fixed` on hero gradients/fog layers with a subtle radial ecto-green glow pseudo-element; `@supports` guard for compatibility
- **Image lightbox** — fullscreen overlay gallery with prev/next navigation, keyboard support (Escape / Arrow keys), backdrop-blur backdrop, and image counter
- **Evidence Board backdrop (Adventures)** — old-school crime-thriller corkboard atmosphere with warm brown dot-grid texture overlay, red scan-line sweep, case-file floating particles (📌🗂️📎), red pushpin and yarn treatment on post cards. Each card is slightly rotated as if pinned to a board and straightens on hover. Red yarn CSS pseudo-elements connect cards horizontally and vertically. Responsive: yarn hides appropriately at each breakpoint. Status badge uses blood-red. Gives a "detective's evidence wall" feel
- **Candlelit Séance backdrop (About)** — warm atmospheric page with multiple animated candle-glow spots (amber/green radial gradients with CSS flicker keyframes at randomized delays), floating 🕯️/✨ smoke-rise particles, and a slow-rotating conic-gradient séance circle accent behind the team cards. Creates an intimate "summoning room" feel distinct from the home page's cinematic bokeh
- **Home page cinematic hero** — layered bokeh orbs (blurred color circles drifting via `bokeh-drift` keyframes), film-grain noise texture overlay, pulsing radial glow, dual opposing fog layers, and dense ghost-particle field. Each layer uses its own z-index and animation timing for depth

---

## 3. Color Palette & Theming

```
--color-void:        #0d0d1a    /* deepest background */
--color-shadow:      #1a1a2e    /* card/section backgrounds */
--color-phantom:     #16213e    /* secondary surfaces */
--color-mist:        #e0e0e0    /* primary text */
--color-ghost-white: #f5f5f5    /* headings, emphasis */
--color-ecto-green:  #00ff88    /* accents, links, CTAs */
--color-haunt-purple:#7b2ff7    /* secondary accent, gradients */
--color-blood-red:   #ff4444    /* destructive actions, alerts */
--color-candle-glow: #ffaa00    /* warm highlights, hover states */
```

---

## 4. Firestore Collections Schema

### `users`
```
users/{uid}
├── displayName: string
├── email: string
├── photoURL: string
├── role: 'admin' | 'viewer'
├── createdAt: Timestamp
└── lastLogin: Timestamp
```

### `posts`
```
posts/{postId}
├── title: string
├── slug: string              // URL-friendly, auto-generated
├── excerpt: string           // short summary for cards
├── content: string           // HTML from Quill editor
├── coverImageUrl: string     // hero image
├── mediaUrls: string[]       // additional images/videos
├── youtubeEmbeds: string[]   // YouTube video IDs
├── externalLinks: { label: string, url: string }[]
├── tags: string[]            // e.g., ['EVP', 'haunted-house', 'apparition']
├── status: 'draft' | 'published'
├── authorUid: string
├── authorName: string
├── publishedAt: Timestamp | null
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### `subscribers`
```
subscribers/{subId}
├── email: string
├── displayName: string | null
├── subscribedAt: Timestamp
├── uid: string | null         // if they signed in via Google
├── active: boolean
└── preferences:               // notification preferences (optional, defaults applied on creation)
    ├── pushEnabled: boolean
    ├── emailEnabled: boolean
    ├── frequency: 'every-post' | 'weekly-digest' | 'monthly-digest'
    └── categories: string[]   // e.g., ['EVP', 'Haunted Houses', 'Apparitions']
```

### `fcmTokens`
```
fcmTokens/{tokenId}
├── token: string              // FCM registration token
├── email: string | null       // subscriber email (if provided)
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### `site-config` (singleton)
```
site-config/main
├── siteName: string
├── tagline: string
├── aboutText: string
├── socialLinks: { platform: string, url: string }[]
└── heroImageUrl: string
```

---

## 5. Application Structure

```
src/
├── app/
│   ├── core/                          # Singleton services, guards, interceptors
│   │   ├── services/
│   │   │   ├── auth.service.ts               # Google sign-in, user$, isAdmin$
│   │   │   ├── posts.service.ts              # Firestore CRUD for posts
│   │   │   ├── subscribers.service.ts        # Subscriber management
│   │   │   ├── media.service.ts              # Firebase Storage upload/download
│   │   │   └── push-notification.service.ts  # FCM token management & send to subscribers
│   │   ├── guards/
│   │   │   ├── admin.guard.ts         # Protects /admin routes
│   │   │   └── auth.guard.ts          # Requires any Google sign-in
│   │   └── models/
│   │       ├── post.model.ts          # Post interface/type
│   │       ├── user.model.ts          # User interface/type
│   │       └── subscriber.model.ts    # Subscriber interface/type
│   │
│   ├── shared/                        # Reusable dumb components, pipes, directives
│   │   ├── components/
│   │   │   ├── navbar/                # Responsive nav with auth state
│   │   │   ├── footer/                # Multi-column footer with brand, nav, and field-notes quote
│   │   │   ├── post-card/             # Glassmorphism blog preview card with gradient-border hover
│   │   │   ├── subscribe-form/        # Email capture + push notification opt-in
│   │   │   ├── location-marquee/      # Infinite-scroll location ticker (marquee animation)
│   │   │   ├── atmospheric-cta/       # Full-width atmospheric CTA banner (viewer shell, above footer)
│   │   │   ├── image-lightbox/         # Fullscreen image gallery with keyboard nav
│   │   │   ├── media-gallery/         # Lightbox-style image/video viewer
│   │   │   ├── youtube-embed/         # Responsive YouTube iframe wrapper
│   │   │   ├── tag-chip/              # Styled tag pill
│   │   │   └── skeleton-loader/       # Animated placeholder while loading
│   │   ├── pipes/
│   │   │   └── time-ago.pipe.ts       # "3 days ago" date display
│   │   └── directives/
│   │       └── aos.directive.ts       # IntersectionObserver scroll-animation directive (no library dep)
│   │
│   ├── features/
│   │   ├── viewer/                    # Public-facing pages (lazy loaded)
│   │   │   ├── home/                  # Landing: hero, recent posts, subscribe CTA
│   │   │   ├── adventures/            # Filterable grid of all published posts
│   │   │   ├── adventure-detail/      # Full post view with media
│   │   │   ├── about/                 # Team bios, mission, equipment
│   │   │   └── viewer.routes.ts       # Viewer route definitions
│   │   │
│   │   └── admin/                     # Admin-only pages (lazy loaded, guarded)
│   │       ├── dashboard/             # Stats overview: post count, subs, drafts
│   │       ├── post-editor/           # Quill editor + media upload + metadata
│   │       ├── post-list/             # Manage posts table (edit/delete/publish)
│   │       ├── subscriber-list/       # View/export subscribers
│   │       └── admin.routes.ts        # Admin route definitions
│   │
│   ├── layout/
│   │   ├── viewer-shell/              # Viewer layout: navbar + footer + <router-outlet>
│   │   └── admin-shell/               # Admin layout: sidebar nav + <router-outlet>
│   │
│   ├── environments/
│   │   ├── environment.ts             # Firebase config (dev)
│   │   └── environment.prod.ts        # Firebase config (prod)
│   │
│   ├── app.ts                         # Root component
│   ├── app.config.ts                  # Providers (AngularFire, router, hydration)
│   ├── app.routes.ts                  # Top-level routes (viewer shell, admin shell)
│   └── app.routes.server.ts           # SSR route config
│
├── public/
│   └── firebase-messaging-sw.js       # FCM service worker for background push notifications
├── styles.css                         # Tailwind imports + global custom styles + animation utilities (gradient-text, marquee, ghost-particle, pulse-glow, fade-in-up, gradient-border-hover, shimmer, spooky-divider)
├── index.html
├── main.ts
└── main.server.ts
```

---

## 6. Route Map

| Route | Component | Guard | Description |
|-------|-----------|-------|-------------|
| `/` | `HomeComponent` | — | Landing page |
| `/adventures` | `AdventuresComponent` | — | All published posts |
| `/adventures/:slug` | `AdventureDetailComponent` | — | Single post view |
| `/about` | `AboutComponent` | — | Team & mission |
| `/admin` | `DashboardComponent` | `adminGuard` | Admin stats |
| `/admin/posts` | `PostListComponent` | `adminGuard` | Manage posts |
| `/admin/posts/new` | `PostEditorComponent` | `adminGuard` | Create post |
| `/admin/posts/:id/edit` | `PostEditorComponent` | `adminGuard` | Edit post |
| `/admin/subscribers` | `SubscriberListComponent` | `adminGuard` | View subscribers |
| `**` | `NotFoundComponent` | — | 404 page |

All viewer routes live under a `ViewerShellComponent` (navbar + footer).
All admin routes live under an `AdminShellComponent` (sidebar + header).

---

## 7. Auth Flow

```
User clicks "Sign In with Google"
  → Firebase Auth popup
  → On success, AuthService checks Firestore `users/{uid}.role`
    → If 'admin': full access to /admin routes
    → If 'viewer' or new user: create Firestore user doc with role 'viewer'
  → Admin guard reads AuthService.isAdmin$ signal to gate /admin routes
  → Navbar updates to show admin link or viewer state
```

**Admin whitelist** is managed by the `role` field in Firestore `users` collection.
Initial admin accounts are seeded by manually setting `role: 'admin'` in the
Firestore console for the two partner Google accounts.

---

## 8. Subscriber & Push Notification Flow

```
Viewer subscribes:
  → Visitor enters email in SubscribeForm component
  → SubscribersService.addSubscriber(email, displayName?)
  → Writes to Firestore `subscribers` collection
  → PushNotificationService.requestPermissionAndSaveToken(email)
  → Browser prompts for notification permission
  → On grant: FCM token saved to Firestore `fcmTokens/{token}` (deduped by token ID)
  → Shows adaptive success message (with/without push status)

Admin publishes & notifies:
  → Admin creates/edits post in PostEditorComponent, sets status: 'published'
  → After save, UI shows "🔔 Notify Subscribers" button (stays on page)
  → Admin clicks notify → PushNotificationService.sendToAllSubscribers(title, body, link)
  → Service reads all tokens from `fcmTokens` collection
  → Sends push via FCM REST API (https://fcm.googleapis.com/fcm/send)
  → Background: firebase-messaging-sw.js shows native OS notification
  → Click on notification → navigates to /adventures/{slug}
```

> **Why FCM instead of email?** Firebase Spark (free) plan does not support Cloud
> Functions. FCM works entirely client-side with a service worker, requires no
> paid plan, and is future-ready for a native mobile app conversion.

---

## 9. Firestore Security Rules (Outline)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Posts: public read for published, admin write
    match /posts/{postId} {
      allow read: if resource.data.status == 'published';
      allow read, write: if isAdmin();
    }

    // Users: self-read, admin read/write
    match /users/{uid} {
      allow read: if request.auth.uid == uid || isAdmin();
      allow write: if isAdmin();
      allow create: if request.auth.uid == uid;
    }

    // Subscribers: anyone can subscribe, admin can read/manage
    match /subscribers/{subId} {
      allow create: if request.auth != null;
      allow read, update, delete: if isAdmin();
    }

    // FCM tokens: authenticated users can create/update their own, admin can read all
    match /fcmTokens/{tokenId} {
      allow create, update: if request.auth != null;
      allow read: if isAdmin();
    }

    // Site config: public read, admin write
    match /site-config/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    function isAdmin() {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 10. Firebase Storage Rules (Outline)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Admin can upload/delete media
    match /posts/{postId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 11. Deployment Pipeline

```bash
# Development
ng serve                          # http://localhost:4200

# Build for production
ng build --configuration production

# Firebase deploy
firebase deploy                   # Deploys hosting + Firestore rules + Storage rules
```

### firebase.json (target structure)
```json
{
  "hosting": {
    "public": "dist/LilGreenGhouls/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

---

## 12. Phase Roadmap

### Phase 1 — MVP
- [x] Project scaffold (Angular 20 + SSR)
- [x] Tailwind CSS v4 integration + dark spooky theme
- [x] Firebase Auth (Google) + admin guard
- [x] Firestore services (posts, subscribers)
- [x] Viewer pages (home, adventures, adventure detail, about)
- [x] Admin pages (dashboard, post editor with Quill, post management)
- [x] Subscribe form component
- [x] Firebase Hosting deployment

### Phase 2 — Polish & Engagement ✅
- [x] AOS scroll animations on viewer pages (custom IntersectionObserver directive)
- [x] Parallax hero effect (background-attachment: fixed + radial glow)
- [x] Glassmorphism card refinements (gradient-border hover, shimmer placeholders)
- [x] Fog/particle CSS ambient effects (floating ghost particles in hero & CTA)
- [x] Skeleton loaders for async content (shimmer utility on post cards)
- [x] Image lightbox in media gallery (fullscreen overlay, keyboard nav, prev/next)
- [x] Gradient animated text on hero headings
- [x] Infinite-scroll location marquee on home page
- [x] Atmospheric CTA banner in viewer shell
- [x] Enhanced footer with multi-column layout
- [x] Staggered fade-in-up entrance animations
- [x] Pulse-glow CTA buttons
- [x] Spooky gradient section dividers
- [x] Holographic investigator cards on About page (3D tilt + rainbow overlay)
- [x] FCM push notifications (subscribe opt-in + admin-triggered send)
- [x] Evidence Board backdrop on Adventures page (corkboard + pushpin + red yarn + card rotation)
- [x] Candlelit Séance backdrop on About page (candle flicker + séance circle + smoke particles)
- [x] Cinematic hero on Home page (bokeh orbs + grain + pulsing glow + dual fog)

### Phase 3 — Notifications & Growth (current focus)
- [x] FCM push notification service (PushNotificationService)
- [x] Service worker for background notifications (firebase-messaging-sw.js)
- [x] Admin "Notify Subscribers" button in post editor
- [ ] VAPID key + server key configuration (Firebase Console → Cloud Messaging)
- [x] Social share buttons on posts
- [x] Basic analytics dashboard for admins
- [x] Subscriber preferences (notification frequency, categories)
- [ ] Mobile app conversion (Angular → Capacitor/Ionic for native push)

### Phase 4 — Community (current focus)

#### 4a. Viewer Comments on Posts (Moderated)
- [ ] Create `Comment` model: `{ id, postId, authorName, authorEmail, avatarUrl?, content, status: 'pending'|'approved'|'rejected', createdAt }`
- [ ] Create `comments.service.ts` — Firestore CRUD under `posts/{postId}/comments` subcollection
- [ ] Firestore rules: anyone can create (status forced to 'pending'), public read for 'approved', admin read/write all
- [ ] Create `CommentFormComponent` — name + email + textarea, submits with status 'pending'
- [ ] Create `CommentListComponent` — displays approved comments with avatar, name, time-ago, and content
- [ ] Integrate both into `adventure-detail.html` below the subscribe section
- [ ] Create `CommentModerationComponent` in admin — table of pending comments with approve/reject actions
- [ ] Add moderation route `/admin/comments` to admin routes and sidebar nav
- [ ] Add Firestore composite index: `comments` → `status` ASC + `createdAt` DESC

#### 4b. "Like" / "That's Creepy" Reaction System
- [ ] Create `Reaction` model: `{ postId, emoji: '👻'|'😱'|'🔥'|'👍', visitorId, createdAt }`
- [ ] Create `reactions.service.ts` — Firestore operations under `posts/{postId}/reactions` subcollection
- [ ] Visitor identity: generate anonymous UUID in localStorage (no auth required)
- [ ] Firestore rules: create/update if visitorId matches, one reaction per visitorId+postId (use visitorId as doc ID)
- [ ] Create `ReactionBarComponent` — row of emoji buttons with animated counts, highlights user's current pick
- [ ] Optimistic UI: update count immediately, revert on Firestore error
- [ ] Integrate into `adventure-detail.html` above the social share section
- [ ] Show aggregate reaction counts on `PostCardComponent` (read from a `reactionCounts` map field on the post doc)
- [ ] Admin dashboard: display total reactions across all posts

#### 4c. Viewer Photo Submissions
- [ ] Create `Submission` model: `{ id, postId?, authorName, authorEmail, caption, imageUrls: string[], status: 'pending'|'approved'|'rejected', createdAt }`
- [ ] Create `submissions.service.ts` — Firestore CRUD for `submissions` collection
- [ ] Firestore rules: anyone can create (status forced to 'pending'), admin read/write all
- [ ] Storage rules: allow writes to `submissions/{submissionId}/**` for authenticated or anonymous users (size limit 5MB per file)
- [ ] Create `PhotoSubmitFormComponent` — name + email + caption + multi-file upload (max 4 images)
- [ ] Create viewer page `/submit` with the form and guidelines text
- [ ] Create `SubmissionModerationComponent` in admin — grid of pending submissions with image previews, approve/reject
- [ ] Approved submissions: admin can attach to an existing post's `mediaUrls` or create a new community post
- [ ] Add moderation route `/admin/submissions` to admin routes and sidebar nav

#### 4d. RSS Feed Generation
- [ ] Create `rss.service.ts` — generates RSS 2.0 XML string from published posts
- [ ] Create API-like route `/feed` that returns the XML (using Angular SSR route with custom response)
- [ ] Alternative: generate static `feed.xml` at build time via a build script
- [ ] Include: title, description, link, pubDate, author, coverImageUrl as enclosure
- [ ] Add RSS `<link rel="alternate">` tag to `index.html` `<head>`
- [ ] Add RSS icon/link to footer

#### Phase 4 — FCM Push Notification Delivery (prerequisite)
- [ ] Upgrade to Firebase Blaze plan (or set up external server)
- [ ] Create Cloud Function `onNotificationRequestCreated` — triggers on `notificationRequests/{id}` document creation
- [ ] Function reads all tokens from `fcmTokens` collection
- [ ] Function sends FCM messages via Firebase Admin SDK (v1 API)
- [ ] Function updates the notification request doc with `status: 'sent'` and `sentCount`
- [ ] Function cleans up stale/invalid tokens on `messaging/invalid-registration-token` errors

---

## 13. Key Design Principles

1. **Separation of Concerns** — Feature modules own their routes, components, and local state. Shared components are stateless.
2. **Single Responsibility** — Each service handles one Firestore collection. Guards do one check.
3. **Small Files** — Components, services, and models are in their own files. No god-files.
4. **Business Logic in Services** — Components are thin presentation layers; services handle Firebase interactions and data transformation.
5. **Signals over RxJS where possible** — Use Angular signals for local state; RxJS for Firestore real-time streams.
6. **Progressive Enhancement** — Site works without JS for basic content (SSR), enhances with animations and interactivity.

---

## 14. Misc bug fixes & TODOs
- [x] TODO: create error message for subscribe modal to let users know if their email is already registered or if push permission was denied
- [x] TODO: add loading state to subscribe button while processing subscription
- [ ] TODO: add "last updated" timestamp to post detail page, showing how long ago the post was published/updated
- [ ] TODO: implement error handling for failed FCM push notifications
- [ ] TODO: add support for infinite scroll to adventures page in order to future-proof for large amounts of posts
- [ ] TODO: create unit testing for services and critical components (e.g. PostEditorComponent, SubscribeFormComponent)
