(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "sample-projects",
  name: "Practice & Projects",
  language: "All",
  tagline: "How to use this deck, a **cross-framework comparison**, and project ideas (minimal → medium) to cement what you reviewed.",
  color: "#f5b301",
  readMinutes: 8,

  sections: [
    {
      id: "how-to-review",
      title: "How to get the most from this deck",
      level: "core",
      body: [
        { type: "list", items: [
          "**Skim the core sections** of a framework (they're ordered easy → hard), then open the **Deep dive** accordions only for topics you've forgotten.",
          "Hit **Study flashcards** (`f`) after reading — the quiz mode tests active recall, which beats re-reading.",
          "Mark each section **Reviewed** to track coverage; the ring in the sidebar shows overall progress.",
          "Use **search** (`/`) to jump straight to a concept across all frameworks (e.g. \"middleware\", \"N+1\", \"JWT\").",
          "Keyboard: `j`/`k` next/prev framework, `t` theme, `f` flashcards, `/` search, `Esc` close."
        ] },
        { type: "callout", variant: "tip", text: "Best retention loop: **read core → flashcards → build one small project → skim gotchas again.** The gotchas list is the single highest-value part to re-read before an interview or a new project." }
      ]
    },
    {
      id: "comparison",
      title: "Cross-framework comparison",
      level: "core",
      body: [
        { type: "p", text: "A one-glance matrix of the **web/API backends** in this deck. \"Batteries\" = how much comes built-in vs assembled from libraries. (Qt is a desktop/embedded GUI toolkit and Anchor targets Solana on-chain programs, so they sit outside these web axes — see the signature-feature list below.)" },
        { type: "table", headers: ["Framework", "Lang", "Async model", "Default ORM / DB", "Validation", "Batteries"], rows: [
          ["FastAPI", "Python", "native async", "SQLAlchemy / SQLModel", "Pydantic", "medium"],
          ["Django", "Python", "sync (+ async views)", "Django ORM (built-in)", "DRF serializers", "very high"],
          ["Flask", "Python", "sync (WSGI)", "SQLAlchemy (extension)", "WTForms / marshmallow", "low (micro)"],
          ["NestJS", "TS", "native", "TypeORM / Prisma", "class-validator", "high"],
          ["ElysiaJS", "TS/Bun", "native", "Drizzle / Prisma", "`t` (TypeBox)", "medium"],
          ["Next.js", "TS", "native", "Prisma / Drizzle", "zod", "high (full-stack)"],
          ["Go stdlib", "Go", "goroutines", "database/sql + pgx", "DIY", "very low (stdlib)"],
          ["chi", "Go", "goroutines", "sqlc / pgx (no ORM)", "DIY", "low (router only)"],
          ["Echo", "Go", "goroutines", "GORM", "validator (plug-in)", "medium"],
          ["Axum", "Rust", "Tokio", "SQLx / SeaORM", "serde + validator", "low-medium"],
          ["Leptos", "Rust", "Tokio", "SQLx", "server-fn + types", "full-stack reactive"],
          ["Drogon", "C++", "event-loop + coroutines", "built-in ORM", "DIY", "medium"],
          ["Phoenix", "Elixir", "BEAM processes", "Ecto", "changesets", "high"],
          ["Dart", "Dart", "event-loop + isolates", "Drift / Serverpod", "manual / DIY", "low-medium"],
          ["Spring", "Java", "sync (+ virtual threads)", "Spring Data JPA", "Bean Validation", "very high"],
          ["ASP.NET Core", "C#", "async (Task)", "EF Core", "Data Annotations", "very high"],
          ["Rails", "Ruby", "sync (threads/fibers)", "Active Record (built-in)", "AR validations", "very high"],
          ["Laravel", "PHP", "sync (+ queues)", "Eloquent (built-in)", "Form Requests", "very high"]
        ] },
        { type: "table", headers: ["Framework", "Signature feature to remember"], rows: [
          ["FastAPI", "`Depends` dependency injection + type-hint-driven validation"],
          ["Django", "Built-in ORM + auto admin + DRF for APIs"],
          ["Flask", "Tiny core; app factory + blueprints; the app/request context"],
          ["NestJS", "Request lifecycle: Guards → Interceptors → Pipes → Filters"],
          ["ElysiaJS", "`t` schema = validation + types + docs; Eden typed client"],
          ["Next.js", "File-based routing + Server Components + Server Actions"],
          ["Go stdlib", "`net/http` + 1.22 ServeMux; middleware = handlers wrapping handlers"],
          ["chi", "Pure `net/http` composition; sub-routers + context values"],
          ["Echo", "Handlers return `error` → central error handler; built-in middleware"],
          ["Axum", "Extractors as typed handler args; Tower middleware layers"],
          ["Leptos", "Fine-grained signals + `#[server]` fns (one crate, two builds)"],
          ["Anchor", "`#[derive(Accounts)]` constraints + PDAs on Solana"],
          ["Qt", "Signals/slots + QObject parent-owns-child memory"],
          ["Drogon", "Controller macros + filters/AOP; coroutine DB access"],
          ["Phoenix", "OTP processes + LiveView; contexts + Ecto changesets"],
          ["Dart", "Isolates for parallelism; Shelf / Dart Frog handlers"],
          ["Spring", "IoC container + `@Transactional` proxies; Spring Data JPA"],
          ["ASP.NET Core", "Middleware pipeline + DI lifetimes; EF Core `Include`"],
          ["Rails", "Convention over config; Active Record + Hotwire"],
          ["Laravel", "Eloquent + Artisan codegen + route model binding"]
        ] }
      ]
    },
    {
      id: "minimal",
      title: "Minimal projects (½–1 day each)",
      level: "core",
      body: [
        { type: "p", text: "Small enough to finish, big enough to touch routing, validation, an ORM, and error handling. Try each in a framework you want to refresh." },
        { type: "list", items: [
          "**TODO API + auth** — CRUD todos scoped to a user; JWT login. The canonical \"do I remember this stack?\" project.",
          "**URL shortener** — POST a long URL → short code; GET redirects. Teaches unique keys, redirects, and a tiny bit of caching.",
          "**Notes app** — markdown notes with tags; full-text-ish search via `like`. Practice relations (note ↔ tags, many-to-many).",
          "**Pastebin** — create/read snippets with expiry; optional syntax language field. Practice TTL/expiry logic.",
          "**Weather proxy** — call a public weather API server-side, cache responses for N minutes. Practice outbound HTTP + caching.",
          "**Bookmark manager** — save links with title/description; fetch page title on submit (background task)."
        ] },
        { type: "callout", variant: "tip", text: "Add the same two features to every minimal project: **input validation** and **pagination**. They're the two things every framework does differently and are worth muscle-memory." }
      ]
    },
    {
      id: "medium",
      title: "Medium projects (a weekend+)",
      level: "core",
      body: [
        { type: "list", items: [
          "**Blog with auth + comments** — users, posts, nested comments, roles (author/admin). Exercises relations, authorization (guards/permissions), and response shaping.",
          "**E-commerce cart & orders** — products, cart, checkout → order with line items; stock decrement in a transaction. Great for DB transactions and state machines.",
          "**Real-time chat** — rooms + messages over **WebSockets**; persist history. Tests the framework's async/streaming story (FastAPI WS, Elysia, Axum, Django Channels, Laravel Reverb, Phoenix Channels/LiveView, Rails Action Cable, ASP.NET SignalR).",
          "**Job board** — companies post jobs, candidates apply; search + filters + pagination. Good for query building and full-text search.",
          "**Expense tracker** — transactions, categories, monthly aggregation reports. Exercises aggregation queries (`GROUP BY`, annotate).",
          "**Kanban board** — boards/columns/cards with drag-order; optimistic updates if you add a frontend. Ordering + reordering logic.",
          "**File-upload service** — presigned uploads to S3-compatible storage, metadata in DB, thumbnail job in a **queue**.",
          "**Multi-tenant SaaS starter** — org/team/membership model, per-tenant data scoping, invitations. The hardest of the set — data isolation is the lesson."
        ] }
      ]
    },
    {
      id: "cross-cutting",
      title: "Cross-cutting challenges (add to any project)",
      level: "core",
      body: [
        { type: "p", text: "Once the CRUD works, layer these on — they're what separates a toy from production, and each framework handles them differently:" },
        { type: "list", items: [
          "**Rate limiting** on auth + write endpoints.",
          "**Pagination + filtering + sorting** via query params.",
          "**Caching** a hot read path (in-memory or Redis) with invalidation.",
          "**Background jobs** — email on signup, nightly cleanup (Celery / BullMQ / queue:work / Tokio task).",
          "**Structured logging + request IDs** and a health-check endpoint.",
          "**Tests** — at least one happy-path + one validation-failure test per endpoint.",
          "**Dockerize** it, add a `docker-compose` with the DB, and a basic **CI** (lint + test).",
          "**OpenAPI docs** — auto (FastAPI/Elysia/DRF) or generated, and try the interactive UI."
        ] }
      ]
    },
    {
      id: "compare-drill",
      title: "The 'same API, two frameworks' drill",
      level: "core",
      body: [
        { type: "p", text: "The single best exercise for reviewing: pick **one** small spec (e.g. the TODO API) and build it in **two** frameworks back-to-back. You instantly feel each framework's philosophy — where it helps and where it gets in the way." },
        { type: "list", items: [
          "**Python duel:** FastAPI vs Django + DRF — explicit/async vs batteries/admin.",
          "**Go duel:** Echo vs chi — framework helpers vs stdlib composition.",
          "**TS duel:** NestJS vs Elysia — structured/DI vs lean/type-inferred.",
          "**Full-stack angle:** Next.js (route handlers + server actions) vs any API framework + a separate frontend."
        ] },
        { type: "callout", variant: "note", text: "Keep a tiny `NOTES.md` while doing the drill: for each framework jot the one thing that surprised you and the one gotcha that bit you. That file becomes your personal version of this deck." }
      ]
    },
    {
      id: "further",
      title: "Further reading",
      level: "deep",
      body: [
        { type: "link", url: "https://github.com/gothinkster/realworld", text: "RealWorld — the same 'Medium clone' app implemented in dozens of frameworks (great for side-by-side comparison)" },
        { type: "link", url: "https://roadmap.sh/backend", text: "roadmap.sh/backend — backend concepts checklist (auth, caching, scaling, messaging)" },
        { type: "link", url: "https://12factor.net/", text: "The Twelve-Factor App — config, deploys, and statelessness principles every backend should follow" },
        { type: "link", url: "https://github.com/golang-standards/project-layout", text: "golang-standards/project-layout — common Go project structure (relevant for Echo & chi)" }
      ]
    }
  ],

  packages: [],
  gotchas: [],
  flashcards: [],
  cheatsheet: []
});
