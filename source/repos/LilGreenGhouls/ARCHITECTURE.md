# 👻 LilGreenGhouls — Architecture & Vision

> A paranormal-encounter blogging platform built with Angular 20, Firebase, and a spooky-modern aesthetic.

---

## 1. Project Vision

LilGreenGhouls is a curated digital museum of paranormal adventures. Two admins
document encounters with rich blog posts, photos, videos, and external links.
Viewers (friends & family) browse a beautifully themed site and can subscribe to
a newsletter so they never miss a new post.

---

## 2. Tech Stack & Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Angular 20 (standalone components, signals) | Already scaffolded; latest features like `@let`, signal-based inputs, and built-in control flow (`@if`, `@for`) |
| **Styling** | Tailwind CSS v4 | Utility-first, dark-mode-first design; great for rapid theming without heavy CSS files |
| **UI Components** | Angular CDK (overlay, a11y, drag-drop) | Lightweight headless primitives — no opinionated styling to fight against our custom theme |
| **Rich Text Editor** | Quill via `ngx-quill` | Mature WYSIWYG editor with image/video embed support; outputs HTML or Delta for Firestore storage |
| **Animations** | AOS (Animate On Scroll) + CSS keyframes | Scroll-triggered reveals for that "museum walk-through" feel; CSS for fog/particle ambient effects |
| **Fonts** | Google Fonts — *Creepster* (display), *Inter* (body) | Creepster gives spooky character to headings; Inter is clean and highly readable for body text |
| **Auth** | Firebase Authentication (Google provider) | Zero-password UX; admin whitelist checked against Firestore |
| **Database** | Cloud Firestore | Real-time listeners, offline support, scales to zero cost for small audiences |
| **File Storage** | Firebase Cloud Storage | Direct image/video uploads from the admin editor with security rules |
| **Hosting** | Firebase Hosting | One-command deploy, free SSL, CDN, custom domain support |
| **SSR** | Angular SSR (already scaffolded) | SEO for public pages; faster first paint for viewers |
| **Newsletter** | Firestore trigger → Firebase Cloud Function (future) | Phase 2: Cloud Function watches `posts` collection for `status: published` and emails subscribers via SendGrid/Mailgun |

### Modern UI Techniques Being Used
- **Glassmorphism** — frosted-glass card overlays for post cards and modals
- **Dark mode first** — deep purple/charcoal base with misty green and ghostly white accents
- **Scroll-driven animations** — AOS reveals, parallax hero sections
- **Micro-interactions** — hover glow effects, skeleton loaders, subtle floating particles
- **Responsive grid** — CSS Grid + Tailwind for masonry-like adventure gallery
- **Lazy-loaded routes** — snappy navigation, code-split per feature area

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
subscribers/{odId}
├── email: string
├── displayName: string | null
├── subscribedAt: Timestamp
├── uid: string | null         // if they signed in via Google
└── active: boolean
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
│   │   │   ├── auth.service.ts        # Google sign-in, user$, isAdmin$
│   │   │   ├── posts.service.ts       # Firestore CRUD for posts
│   │   │   ├── subscribers.service.ts # Subscriber management
│   │   │   └── media.service.ts       # Firebase Storage upload/download
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
│   │   │   ├── footer/                # Site footer with ghoul flair
│   │   │   ├── post-card/             # Glassmorphism blog preview card
│   │   │   ├── subscribe-form/        # Email capture inline component
│   │   │   ├── media-gallery/         # Lightbox-style image/video viewer
│   │   │   ├── youtube-embed/         # Responsive YouTube iframe wrapper
│   │   │   ├── tag-chip/              # Styled tag pill
│   │   │   └── skeleton-loader/       # Animated placeholder while loading
│   │   ├── pipes/
│   │   │   └── time-ago.pipe.ts       # "3 days ago" date display
│   │   └── directives/
│   │       └── aos.directive.ts       # Attribute directive wrapping AOS
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
├── styles.css                         # Tailwind imports + global custom styles
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

## 8. Newsletter / Subscriber Flow

```
Visitor enters email in SubscribeForm component
  → SubscribersService.addSubscriber(email, displayName?)
  → Writes to Firestore `subscribers` collection
  → Shows success toast / animation

(Phase 2 - Cloud Function)
  → Firestore trigger on `posts` collection where status changes to 'published'
  → Cloud Function reads all active subscribers
  → Sends email via SendGrid/Mailgun with post title, excerpt, and link
```

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

### Phase 1 — MVP (Current Sprint)
- [x] Project scaffold (Angular 20 + SSR)
- [ ] Tailwind CSS v4 integration + dark spooky theme
- [ ] Firebase Auth (Google) + admin guard
- [ ] Firestore services (posts, subscribers)
- [ ] Viewer pages (home, adventures, adventure detail, about)
- [ ] Admin pages (dashboard, post editor with Quill, post management)
- [ ] Subscribe form component
- [ ] Firebase Hosting deployment

### Phase 2 — Polish & Engagement
- [ ] AOS scroll animations on viewer pages
- [ ] Parallax hero effect
- [ ] Glassmorphism card refinements
- [ ] Fog/particle CSS ambient effects
- [ ] Skeleton loaders for async content
- [ ] Image lightbox in media gallery

### Phase 3 — Newsletter & Growth
- [ ] Firebase Cloud Function for email on publish
- [ ] SendGrid/Mailgun integration
- [ ] Subscriber preferences (frequency, categories)
- [ ] Social share buttons on posts
- [ ] Basic analytics dashboard for admins

### Phase 4 — Community (Future)
- [ ] Viewer comments on posts (moderated)
- [ ] "Like" or "That's Creepy" reaction system
- [ ] Viewer photo submissions
- [ ] RSS feed generation

---

## 13. Key Design Principles

1. **Separation of Concerns** — Feature modules own their routes, components, and local state. Shared components are stateless.
2. **Single Responsibility** — Each service handles one Firestore collection. Guards do one check.
3. **Small Files** — Components, services, and models are in their own files. No god-files.
4. **Business Logic in Services** — Components are thin presentation layers; services handle Firebase interactions and data transformation.
5. **Signals over RxJS where possible** — Use Angular signals for local state; RxJS for Firestore real-time streams.
6. **Progressive Enhancement** — Site works without JS for basic content (SSR), enhances with animations and interactivity.
