# TASK — Backend Frameworks Review Web App

A static, no-server web app for **reviewing** (not learning from scratch) 9 backend
frameworks. Fast 10–20 min read per framework, with study aids. This file is the
single source of truth for scope, decisions, phases, and per-framework content checklists.

---

## 1. Goal & Constraints

- **Purpose:** personal refresher/review tool for frameworks the user already knows.
- **Read time:** 10–20 min per framework. Default view shows the essentials; very
  detailed material is hidden behind expandable "deep dive" blocks.
- **Static only:** no backend, no build step, runs by opening `index.html`.
- **Content order per framework:** easy → hard (init → core syntax → framework-specific
  features → ORM → advanced → gotchas).
- **Frameworks, in this order:**
  1. FastAPI
  2. NestJS
  3. Go Echo
  4. Go chi
  5. Rust Axum
  6. ElysiaJS
  7. Next.js
  8. Django
  9. Laravel
- **Final section:** suggested sample projects (minimal → medium), just ideas, no code.

## 2. Locked Decisions (from Q&A)

| Decision | Choice |
|---|---|
| Build approach | **Multi-file vanilla** HTML/CSS/JS, **no build step** |
| Content loading | Plain `<script>` tags that push into a global `window.FRAMEWORKS` registry — works from `file://` (double-click), no fetch/CORS/server needed |
| Features | Progress tracking (localStorage), global search + collapsibles, sticky sidebar nav + per-section TOC, flashcards/quiz mode |
| Code blocks | Self-contained syntax highlighting (own lightweight highlighter, **no CDN**) + copy button |
| Theme | Dark + light, toggle, persisted in localStorage, respects `prefers-color-scheme` on first load |

> **Why script-tags over fetch():** ES modules and `fetch()` fail under `file://` due to
> CORS. Registering content via `<script>` tags keeps the "just open the file" promise
> while still splitting content into one file per framework.

## 3. Architecture & File Structure

```
frameworks/
  index.html            # shell: head, sidebar, main, modals; loads all scripts
  css/
    theme.css           # design tokens (colors, spacing, radius) + light/dark vars
    layout.css          # sidebar, main, responsive grid
    components.css       # cards, collapsibles, code blocks, flashcards, badges
    animations.css       # transitions, section reveal, progress bars
  js/
    highlight.js         # tiny regex-based highlighter (js/ts/py/go/rust/php/bash)
    render.js            # turns content objects -> DOM (sections, code, collapsibles)
    search.js            # global search/filter across all content
    progress.js          # localStorage progress tracking + progress bars
    flashcards.js        # flashcard + quiz mode logic
    nav.js               # sidebar build, TOC, scroll-spy, keyboard shortcuts
    theme.js             # theme toggle + persistence
    app.js               # bootstraps everything after content scripts load
  content/
    _schema.md           # documents the content object shape (authoring guide)
    fastapi.js           # window.FRAMEWORKS.push({...})
    nestjs.js
    go-echo.js
    go-chi.js
    rust-axum.js
    elysiajs.js
    nextjs.js
    django.js
    laravel.js
    sample-projects.js   # final "projects to build" section
  TASK.md
  README.md              # how to open/use
```

### Content object schema (per framework)

```js
{
  id: "fastapi",
  name: "FastAPI",
  language: "Python",
  tagline: "Async Python APIs with type hints + auto docs",
  color: "#009688",
  readMinutes: 15,
  sections: [
    {
      id: "init",
      title: "Project Setup",
      level: "core",              // "core" (shown) | "deep" (collapsed by default)
      body: [                     // ordered blocks
        { type: "p",    text: "..." },
        { type: "code", lang: "bash", code: "..." },
        { type: "callout", variant: "gotcha|tip|warn", text: "..." },
        { type: "list", items: ["...", "..."] },
        { type: "table", headers: [...], rows: [[...]] },
        { type: "link", url: "...", text: "..." }   // external deep reference
      ]
    }
  ],
  packages: [ { name: "uvicorn", why: "ASGI server" } ],
  gotchas: [ "..." ],
  flashcards: [ { q: "...", a: "..." } ],
  cheatsheet: [ { label: "Run dev", code: "uvicorn main:app --reload" } ]
}
```

Every framework section follows the **same 14-part template** (below) so the app is
consistent and content authoring is a fill-in-the-blanks job.

## 4. Standard Per-Framework Section Template (easy → hard)

Each framework's content is authored in this order. Items marked `deep` are collapsed
by default.

1. **Overview & when to use** — 3–5 lines, strengths, typical use case.
2. **Project setup** — install, scaffold/init, run dev server, folder layout.
3. **Routing basics** — define routes, methods, path params, route groups.
4. **Request handling** — query params, body parsing, headers, validation.
5. **Responses** — status codes, JSON, serialization, streaming/files.
6. **Framework-specific features** — the signature stuff (see per-framework list).
7. **Middleware** — global/route, order, writing custom.
8. **ORM / data access** — the dominant ORM(s), models, migrations, CRUD, relations.
9. **Auth** — the standard auth approach (JWT/session/OAuth) for that ecosystem.
10. **Error handling** — exceptions/error responses, centralized handlers.
11. **Config & env** — settings, env vars, `.env`.
12. **Testing** *(deep)* — the standard test tooling + a minimal example.
13. **Deployment notes** *(deep)* — build/prod command, container hint.
14. **Gotchas / hard points** — pitfalls, footguns, "wish I knew" items.

Plus per framework: **Most-used packages** list, **Cheat card** (quick commands/snippets),
**Flashcards**, and any **deep-dive article links**.

## 5. Per-Framework Content Checklist (what MUST be covered)

> Research pass fills these. These are the non-negotiable topics; expand as needed.

### 5.1 FastAPI (Python)
- Setup: `pip install "fastapi[standard]"`, `uvicorn`, `app = FastAPI()`, `--reload`.
- Path/query params with type hints; `Optional`, defaults.
- **Pydantic** models for request/response, `response_model`, validation.
- **Dependency Injection** (`Depends`) — the signature feature; sub-dependencies, yield deps.
- Async endpoints (`async def`) vs sync; when to use which.
- Auto OpenAPI/Swagger `/docs`, ReDoc `/redoc`.
- Routers (`APIRouter`), tags, prefixes, project structure.
- **ORM:** SQLAlchemy 2.0 (+ **SQLModel** as the FastAPI-native option), **Alembic** migrations.
- Auth: OAuth2 password flow + JWT (`python-jose`, `passlib`), `Security`/scopes.
- Background tasks, `BackgroundTasks`; WebSockets (deep); middleware; CORS.
- Error handling: `HTTPException`, custom exception handlers.
- Settings via `pydantic-settings`.
- Testing: `TestClient` / `httpx` + pytest.
- Gotchas: sync def blocking event loop, mutable default args, response_model filtering.
- Packages: uvicorn, gunicorn, sqlalchemy/sqlmodel, alembic, pydantic-settings, python-jose, passlib, httpx.

### 5.2 NestJS (TypeScript)
- Setup: `npm i -g @nestjs/cli`, `nest new`, `nest g`.
- Architecture: **Modules, Controllers, Providers/Services, Dependency Injection**.
- Decorators: `@Controller`, `@Get/@Post`, `@Param/@Query/@Body`.
- **Pipes** (validation/transform) + `class-validator`/`class-transformer`, `ValidationPipe`.
- **Guards** (auth/roles), **Interceptors** (transform/logging/cache), **Exception Filters**, **Middleware** — the signature feature set; explain the request lifecycle order.
- DTOs, `ConfigModule`, custom providers, dynamic modules (deep).
- **ORM:** **TypeORM** (entities, repositories, `@nestjs/typeorm`) AND **Prisma** (schema, client, migrations) — cover both, note Prisma trend.
- Auth: `@nestjs/passport` + JWT strategy, `@nestjs/jwt`, guards.
- Error handling: built-in `HttpException`, filters.
- Testing: Jest, `@nestjs/testing`, `Test.createTestingModule`.
- Extras: async providers, lifecycle hooks, `@nestjs/swagger`, microservices (deep).
- Gotchas: circular deps + `forwardRef`, provider scope, `ValidationPipe` whitelist/transform.
- Packages: @nestjs/config, @nestjs/typeorm, prisma, @nestjs/passport, passport-jwt, class-validator, @nestjs/swagger.

### 5.3 Go Echo
- Setup: `go mod init`, `go get github.com/labstack/echo/v4`, `e := echo.New()`, `e.Start`.
- Routing: `e.GET/POST`, path params `:id` via `c.Param`, query `c.QueryParam`, groups.
- Binding & validation: `c.Bind(&s)`, struct tags, custom `Validator` (go-playground/validator).
- Context (`echo.Context`), returning JSON `c.JSON`, error `echo.NewHTTPError`.
- **Middleware:** built-ins (Logger, Recover, CORS, JWT), custom middleware, groups.
- Signature: clean middleware model, built-in JWT middleware, static/file serving.
- **ORM:** **GORM** (models, `AutoMigrate`, CRUD, associations, `Preload`).
- Auth: `echo-jwt` middleware / JWT.
- Error handling: centralized `HTTPErrorHandler`.
- Config: viper / env.
- Testing: `httptest` + Echo context.
- Gotchas: pointer vs value in Bind, middleware order, GORM zero-value updates.
- Packages: echo, gorm, golang-jwt, validator, viper.

### 5.4 Go chi
- Setup: `go get github.com/go-chi/chi/v5`, `r := chi.NewRouter()`, stdlib `http.ListenAndServe`.
- Philosophy: **idiomatic net/http**, `http.Handler` compatible, lightweight, composable.
- Routing: `r.Get`, URL params `chi.URLParam`, sub-routers `r.Route`, `r.Mount`, `r.Group`.
- **Middleware:** `r.Use`, chi/middleware stack (Logger, Recoverer, RequestID, Timeout), custom.
- Request/response: stdlib `encoding/json`, `render` package (go-chi/render).
- **ORM/DB:** cover the idiomatic Go options — **sqlc** (codegen from SQL, most popular modern), `database/sql` + `pgx`, `sqlx`; note GORM as alt. Migrations: `golang-migrate`/`goose`.
- Auth: JWT via middleware, `jwtauth` (go-chi/jwtauth).
- Error handling: explicit, helper responders.
- Context values, `context.Context` propagation.
- Testing: `httptest`.
- Gotchas: trailing slash behavior, middleware ordering, context key typing.
- Packages: chi, chi/render, chi/jwtauth, sqlc, pgx, golang-migrate.
- **Note:** contrast Echo (batteries-ish framework) vs chi (stdlib router) — small comparison callout.

### 5.5 Rust Axum
- Setup: `cargo new`, deps: `axum`, `tokio` (full), `serde`, `tower`, `tracing`.
- Async runtime: **Tokio**, `#[tokio::main]`.
- Routing: `Router::new().route("/", get(handler))`, path via `Path`, nesting/merge.
- **Extractors** — signature feature: `Path`, `Query`, `Json`, `State`, custom extractors, order rules (body extractor last).
- Handlers return `impl IntoResponse`; `Json`, status tuples, `Result`.
- **State:** `State<T>`, `with_state`, `Arc` shared state.
- **Middleware:** **Tower** layers, `tower-http` (Trace, Cors, Compression), `middleware::from_fn`.
- **ORM:** **SQLx** (compile-time checked queries, async, migrations) primary; **SeaORM** and **Diesel** as alternatives (note tradeoffs).
- Error handling: custom error type + `IntoResponse`, `thiserror`, `anyhow`.
- Auth: JWT (`jsonwebtoken`), extractor-based auth.
- Config: `dotenvy`, `config`.
- Testing: `tower::ServiceExt::oneshot`.
- Gotchas: extractor ordering, `Send + Sync + 'static` bounds, borrow/ownership in handlers, `Arc<Mutex>` for shared mutable state.
- Packages: axum, tokio, serde, tower-http, sqlx, jsonwebtoken, thiserror, tracing.

### 5.6 ElysiaJS (TypeScript / Bun)
- Setup: **Bun** runtime, `bun create elysia`, `new Elysia().listen(3000)`.
- Method chaining API; end-to-end type safety.
- Routing: `.get/.post`, params `ctx.params`, `ctx.query`, `ctx.body`.
- **Schema/validation** with `t` (TypeBox): `body`, `query`, `params`, `response` schemas — signature feature (validation + type inference + docs).
- **Lifecycle hooks:** `onRequest`, `beforeHandle`, `afterHandle`, `onError`, `derive`, `resolve`.
- **Guards** & scoping, plugins (`.use`), `group`.
- **Eden** — end-to-end typed client.
- State/decorate (`.state`, `.decorate`), dependency injection pattern.
- Swagger via `@elysiajs/swagger`; CORS, JWT plugins (`@elysiajs/jwt`).
- **ORM:** **Prisma** or **Drizzle** (Bun-friendly) — cover Drizzle as the trend, Prisma as mainstream.
- Error handling: `onError`, custom error codes.
- Gotchas: Bun-only APIs, plugin encapsulation/scoping, `.decorate` vs `.state`.
- Packages: @elysiajs/swagger, @elysiajs/cors, @elysiajs/jwt, drizzle-orm, @elysiajs/eden.

### 5.7 Next.js (React / TypeScript) — App Router focus
- Setup: `npx create-next-app@latest`, App Router default.
- **File-based routing** — signature: `app/` folder, `page.tsx`, `layout.tsx`, nested/dynamic `[id]`, catch-all `[...slug]`, route groups `(group)`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- **Server Components vs Client Components** (`"use client"`) — core mental model.
- **Route Handlers** (`app/api/.../route.ts`) — REST endpoints (GET/POST etc.).
- **Server Actions** (`"use server"`) — mutations from components/forms.
- Data fetching: async server components, `fetch` caching, `revalidate`, `cache`, dynamic vs static rendering.
- Rendering modes: SSG/SSR/ISR/streaming, `Suspense`.
- **Middleware** (`middleware.ts`) — edge, auth/redirects.
- Metadata API, `next/image`, `next/font`, env vars (`NEXT_PUBLIC_`).
- **ORM:** **Prisma** (and **Drizzle**) with server components/actions; DB access pattern, connection in serverless.
- Auth: **NextAuth/Auth.js** overview.
- Gotchas: server vs client boundary, `use client` propagation, caching surprises, secrets leaking to client, App Router vs Pages Router note.
- Packages: prisma/drizzle, next-auth, zod, react-hook-form, tailwind.
- Brief **Pages Router** contrast (deep, since some legacy): `getServerSideProps`/`getStaticProps`, `pages/api`.

### 5.8 Django (Python)
- Setup: `django-admin startproject`, `manage.py startapp`, `runserver`, settings, apps.
- **MVT** pattern; project vs app structure.
- **ORM (built-in):** models, fields, `makemigrations`/`migrate`, QuerySets, relations (FK/M2M), `select_related`/`prefetch_related`, managers.
- URLs & views: function vs **class-based views**, `urls.py`, `path`/`re_path`.
- Templates (brief), forms (brief).
- **Django Admin** — signature feature; registering models, customization.
- **Django REST Framework (DRF)** — the API path: serializers, `APIView`, `ViewSets`, routers, permissions, authentication (Token/JWT via SimpleJWT), pagination, throttling. (Major subsection.)
- Auth: built-in `User`, sessions, permissions, `login_required`.
- Middleware, signals (deep), management commands (deep).
- Settings/env: `django-environ`, `.env`, `DEBUG`, `ALLOWED_HOSTS`.
- Testing: `TestCase`, `pytest-django`.
- Gotchas: N+1 queries, migrations conflicts, settings for prod, `null` vs `blank`.
- Packages: djangorestframework, djangorestframework-simplejwt, django-environ, celery, django-cors-headers, gunicorn.

### 5.9 Laravel (PHP)
- Setup: `composer create-project laravel/laravel` / Laravel installer, `php artisan serve`, `.env`, key.
- **Artisan CLI** — signature: `make:model/controller/migration`, `migrate`, `tinker`, `route:list`.
- Routing: `routes/web.php` vs `routes/api.php`, route params, groups, names, `Route::resource`.
- Controllers: resource controllers, single-action, form requests.
- **Eloquent ORM** — signature: models, migrations, relationships (hasMany/belongsTo/many-to-many), mutators/accessors/casts, factories & seeders, eager loading (`with`), scopes.
- **Blade** templating (brief); **request validation** (`$request->validate`, Form Requests).
- **Middleware**, service container & providers, facades, events/listeners, queues & jobs (deep).
- Auth: **Sanctum** (SPA/API tokens) and Passport (OAuth) — Sanctum primary; Breeze/Jetstream starter kits.
- API resources (transformers), pagination.
- Config/env, caching, `.env`.
- Testing: PHPUnit / Pest, feature vs unit.
- Gotchas: N+1 (eager loading), mass assignment (`$fillable`/`$guarded`), migration order, queue worker not running.
- Packages: laravel/sanctum, laravel/passport, laravel/horizon, spatie/laravel-permission, laravel/telescope, pest.

### 5.10 Final Section — Suggested Sample Projects
Grouped minimal → medium. Each: 1–2 lines + which concepts it exercises + suggested
framework fits. Examples to include:
- **Minimal:** URL shortener, TODO API + auth, notes app, weather proxy, pastebin.
- **Medium:** blog with auth+comments, e-commerce cart+orders, real-time chat (WebSockets),
  job board, expense tracker, kanban board, file-upload service, multi-tenant SaaS starter,
  URL health-check monitor with background jobs.
- Add a "build the same small API in 2 frameworks to compare" suggestion.
- Cross-cutting challenges: add rate limiting, pagination, caching, tests, Docker, CI.

## 6. Cross-Framework Extras (nice-to-have ideas)

- **Comparison table** (bonus section): language, async model, ORM, validation, auth,
  perf tier, learning-curve — a one-glance matrix.
- **Cheat card** per framework (sticky/printable quick commands).
- **Keyboard shortcuts:** `/` focus search, `j/k` next/prev framework, `t` theme,
  `f` flashcard mode, `Esc` close modal.
- **Print / export friendly** CSS (so a framework can be printed to PDF).
- **"Reviewed" badges** + overall progress ring in the sidebar.
- **Deep-dive external links** kept in a per-framework "Further reading" list.

## 7. Phases (execution plan)

> Content research (Phase 1) happens **before** building rendering, per user's request.

- **Phase 0 — Scaffolding**
  - Create folder structure, `index.html` skeleton, empty CSS/JS files, README.
  - Define content schema in `content/_schema.md`.
  - Deliverable: app opens with empty shell + placeholder.

- **Phase 1 — Content research & authoring** (the big one)
  - For each framework: research current (2025/2026) idioms, verify commands/versions,
    then author the content object in `content/<fw>.js` following the template §4 and
    checklist §5. Include flashcards + cheat card + gotchas + further-reading links.
  - Do frameworks in the target order; keep read-time in the 10–20 min band.
  - Author `content/sample-projects.js`.
  - Deliverable: all 9 content files + sample projects, schema-valid.

- **Phase 2 — Core UI shell & theming**
  - `theme.css` tokens + light/dark, `theme.js` toggle + persistence + system pref.
  - `layout.css` sidebar + main + responsive; build sidebar from registry (`nav.js`).
  - Deliverable: navigable shell, theme switch works, frameworks list populated.

- **Phase 3 — Content rendering engine**
  - `render.js`: render sections/blocks (p, code, list, table, callout, link).
  - `highlight.js`: lightweight highlighter for js/ts/py/go/rust/php/bash.
  - Collapsibles for `deep` sections + copy buttons on code.
  - Per-section TOC + scroll-spy in `nav.js`.
  - Deliverable: full readable content with highlighting, collapse, copy, TOC.

- **Phase 4 — Review features**
  - `progress.js`: mark reviewed, progress bars/ring, localStorage.
  - `search.js`: global fuzzy-ish search/filter across sections + jump.
  - `flashcards.js`: flashcard deck per framework + quick quiz mode + modal UI.
  - Keyboard shortcuts.
  - Deliverable: study features functional and persisted.

- **Phase 5 — Polish**
  - `animations.css`: section reveal, smooth collapse, progress transitions, subtle motion
    (respect `prefers-reduced-motion`).
  - Responsive/mobile pass, accessibility (focus states, ARIA, contrast), print CSS.
  - Empty/edge states, favicon.
  - Deliverable: polished, accessible, responsive.

- **Phase 6 — QA & finalize**
  - Verify each framework renders, all links valid, search/flashcards/progress work,
    both themes, keyboard shortcuts, mobile.
  - Fill README with usage.
  - Deliverable: shippable app.

## 8. Open Questions / Assumptions

- Assuming latest stable versions as of 2026 for all frameworks (FastAPI + Pydantic v2,
  SQLAlchemy 2.0, NestJS 10+, Next.js App Router, Django 5.x + DRF, Laravel 11/12,
  Axum 0.7+, Elysia 1.x on Bun). Will note versions in content.
- Single-page app (all frameworks in one page, JS-shown/hidden) vs hash-routed sections:
  **plan = single page with sidebar switching active framework** (fast, simple, searchable).
- No analytics, no external network calls at runtime (fully offline).

## 9. Progress Log

- [x] Phase 0 planning — TASK.md created.
- [x] Phase 0 — scaffolding (index.html, folder structure, schema doc)
- [x] Phase 1 — content research & authoring — all 9 frameworks + sample-projects
- [x] Phase 2 — shell & theming (dark/light, sidebar, progress ring)
- [x] Phase 3 — rendering engine (blocks, highlighter, collapsibles, copy, TOC/scroll-spy)
- [x] Phase 4 — review features (progress, search, flashcards/quiz, shortcuts)
- [x] Phase 5 — polish (animations, responsive, print, reduced-motion)
- [x] Phase 6 — QA & finalize (browser-verified dark/light/mobile/flashcards, README)

### Round 2 — review pass + new sections (2026-07-07)

- [x] Technical accuracy review of all 9 original frameworks; fixes applied:
  - FastAPI: passlib → **pwdlib/Argon2** (passlib unmaintained), pyjwt over python-jose, added **async SQLAlchemy** (AsyncSession).
  - NestJS: `emitDecoratorMetadata` note, added **JwtModule** wiring + token signing.
  - Go Echo: **echo v5** existence note, added **graceful shutdown**.
  - Go chi: added **http.Server timeouts** (Slowloris) + shutdown note.
  - Rust Axum: added **0.8 `FromRequestParts` without `#[async_trait]`** extractor; tightened `/{id}` panic wording.
  - Elysia: **`@elysiajs/swagger` → `@elysiajs/openapi`**, fixed `jwt.verify` Bearer-prefix bug.
  - Next.js: middleware Edge/Node runtime + `proxy.ts` (Next 16) note, added **parallel/intercepting routes**, fixed cache comment.
  - Django: added **`Q()`/`F()`** and `transaction.atomic`.
  - Laravel: corrected starter kits (React/Vue/Livewire since L12), added **Sanctum two-modes** gotcha.
- [x] Renderer fix: implemented `*emphasis*` in `inline()` (was documented but unimplemented — ~592 usages across content were showing literal asterisks).
- [x] New content: **Go Standard Library** (net/http, 1.22 ServeMux, slog), **Rust Anchor** (Solana), **Qt** (C++), **Drogon** (C++).
- [x] Sidebar: collapsible **grouped nav** — Go (Standard Library / chi / Echo), Rust (Axum / Anchor), C++ (Qt / Drogon); auto-expands the active group.
- [x] Re-validated all 14 content files (0 structural errors) + browser-verified new sections and grouping.

## Round 3 — polish pass, UX features, second accuracy review

- [x] Full engine review (render/nav/app/search/progress/flashcards/theme/highlight/ux) — no bugs or conflicts found; structural validation stays at **0 errors** (2 warnings are verified-literal `${` in text).
- [x] Second technical-accuracy pass (parallel expert review) with concrete fixes:
  - Qt: corrected the **LTS claim** (LTS = 6.2/6.5/6.8/6.11; 6.9–6.10 are regular releases — was inverted); noted **`qAsConst` deprecated since 6.6** (use `std::as_const`); retagged the `.qrc` block `xml` (was `json`).
  - Go stdlib: fixed an **inverted URL-decoding claim** — ServeMux **does** unescape path segments, so `PathValue` returns decoded values.
  - Anchor: bumped the stale **Anza `solana-cli` version** to the current `4.x` line.
  - Drogon: verified accurate, no changes.
- [x] New UX features (new file `js/ux.js`):
  - **Reading-progress bar** under the top bar + **back-to-top** button (also `g` `g`).
  - **Prev / Next framework** cards at the foot of every page (wrap around, color-tinted; render.js).
  - **Copyable section deep links** — click a section number to copy `…#fw--section`; app.js resolves these anchors on load.
  - **Keyboard-shortcut overlay** (`?` key / `?` button) listing all shortcuts.
  - Sidebar **auto-scrolls the active item into view** on switch (sidebar only, never the page).
- [x] Style polish: gradient **progress ring** (real SVG gradient), **hero top accent bar** in the framework color, distinct **note callout** color, hover states on package cards.
- [x] Print CSS updated to hide the new chrome; all new JS syntax-checked; browser-verified (boot, groups=3, deep-links, footer wrap, accent bar, note styling).
