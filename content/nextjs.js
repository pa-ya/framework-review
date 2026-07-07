(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "nextjs",
  name: "Next.js",
  language: "React / TS",
  tagline: "Full-stack React framework with **file-based routing**, **Server Components**, route handlers, and server actions. This deck focuses on the **App Router**.",
  color: "#ededed",
  readMinutes: 19,

  sections: [
    {
      id: "overview",
      title: "Overview & the two routers",
      level: "core",
      body: [
        { type: "p", text: "Next.js is React + a backend. Since v13 the **App Router** (`app/` directory) is the default and recommended model, built on **React Server Components**. The older **Pages Router** (`pages/`) still works — know it exists, but build new apps with App Router." },
        { type: "list", items: [
          "**Server Components** render on the server by default — they can hit the DB directly and send zero JS to the client.",
          "**Client Components** (`\"use client\"`) run in the browser — needed for state, effects, event handlers.",
          "Routing, layouts, loading/error states, and API endpoints are all **file conventions**.",
          "**Reach for it when:** you want SSR/SSG + a React frontend + API in one deployable app."
        ] }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "npx create-next-app@latest my-app\n#   TypeScript? Yes   App Router? Yes   Tailwind? (your call)\ncd my-app\nnpm run dev        # http://localhost:3000\nnpm run build && npm start   # production" },
        { type: "callout", variant: "tip", text: "Turbopack is the default dev bundler now (`next dev`). It's dramatically faster than webpack for large apps." }
      ]
    },
    {
      id: "routing",
      title: "File-based routing (signature feature)",
      level: "core",
      body: [
        { type: "p", text: "Folders under `app/` become URL segments. Special files define what renders. A route is public only when it contains a `page.tsx`." },
        { type: "code", lang: "text", code: "app/\n  layout.tsx            // root layout (wraps everything)\n  page.tsx              // /\n  loading.tsx           // suspense fallback for this segment\n  error.tsx             // error boundary (must be a client component)\n  not-found.tsx         // 404 UI\n  blog/\n    page.tsx            // /blog\n    [slug]/page.tsx     // /blog/:slug   (dynamic)\n  shop/\n    [...cats]/page.tsx  // /shop/a/b/c   (catch-all)\n  (marketing)/          // route GROUP — organizes without adding a URL segment\n    about/page.tsx      // /about\n  api/\n    users/route.ts      // /api/users   (endpoint, not a page)" },
        { type: "code", lang: "tsx", code: "// app/blog/[slug]/page.tsx — params is a Promise in Next 15\nexport default async function Post({ params }: { params: Promise<{ slug: string }> }) {\n  const { slug } = await params;\n  return <article>Post: {slug}</article>;\n}" },
        { type: "table", headers: ["File", "Purpose"], rows: [
          ["`page.tsx`", "the route's UI (makes it routable)"],
          ["`layout.tsx`", "shared shell, persists across navigation"],
          ["`loading.tsx`", "instant loading UI (wraps in `<Suspense>`)"],
          ["`error.tsx`", "error boundary (client component)"],
          ["`route.ts`", "API endpoint (no UI)"],
          ["`template.tsx`", "like layout but re-mounts each navigation"]
        ] },
        { type: "callout", variant: "gotcha", text: "In Next.js 15, `params` and `searchParams` are **async** (Promises) — you must `await` them. Older code accessed them synchronously." }
      ]
    },
    {
      id: "components",
      title: "Server vs Client Components (core mental model)",
      level: "core",
      body: [
        { type: "p", text: "Everything in `app/` is a **Server Component** by default. Add `\"use client\"` at the top of a file to make it (and its imports) a Client Component." },
        { type: "code", lang: "tsx", code: "// Server Component (default) — runs on server, can be async, can hit DB\nimport { db } from '@/lib/db';\n\nexport default async function Users() {\n  const users = await db.user.findMany();   // direct DB access, no API needed\n  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;\n}" },
        { type: "code", lang: "tsx", code: "'use client';\nimport { useState } from 'react';\n\nexport default function Counter() {\n  const [n, setN] = useState(0);            // hooks require a client component\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}" },
        { type: "table", headers: ["Need", "Component type"], rows: [
          ["DB/filesystem/secrets access", "**Server**"],
          ["`useState`/`useEffect`/event handlers", "**Client** (`\"use client\"`)"],
          ["Browser APIs (window, localStorage)", "**Client**"],
          ["Smaller JS bundle / SEO", "**Server**"]
        ] },
        { type: "callout", variant: "warn", text: "`\"use client\"` marks a **boundary**: everything imported into that tree is also client. Keep it at the leaves (e.g. an interactive button), not the whole page, to avoid shipping too much JS. You can pass Server Components to Client ones via `children`." }
      ]
    },
    {
      id: "route-handlers",
      title: "Route Handlers (REST endpoints)",
      level: "core",
      body: [
        { type: "p", text: "`app/**/route.ts` exports functions named after HTTP methods. Uses the Web `Request`/`Response` APIs." },
        { type: "code", lang: "ts", code: "// app/api/users/route.ts\nimport { NextResponse } from 'next/server';\n\nexport async function GET(req: Request) {\n  const users = await db.user.findMany();\n  return NextResponse.json(users);\n}\n\nexport async function POST(req: Request) {\n  const body = await req.json();\n  const user = await db.user.create({ data: body });\n  return NextResponse.json(user, { status: 201 });\n}" },
        { type: "code", lang: "ts", code: "// dynamic segment: app/api/users/[id]/route.ts\nexport async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params;\n  const user = await db.user.findUnique({ where: { id: Number(id) } });\n  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });\n  return NextResponse.json(user);\n}" },
        { type: "callout", variant: "gotcha", text: "A route file **can't** also be a page — a folder has either `page.tsx` (UI) or `route.ts` (API) at the same level, not both." }
      ]
    },
    {
      id: "server-actions",
      title: "Server Actions (mutations)",
      level: "core",
      body: [
        { type: "p", text: "A function marked `\"use server\"` runs on the server but can be called from client components or used directly as a form `action` — no manual API route needed." },
        { type: "code", lang: "tsx", code: "// app/todos/actions.ts\n'use server';\nimport { revalidatePath } from 'next/cache';\n\nexport async function createTodo(formData: FormData) {\n  const title = formData.get('title') as string;\n  await db.todo.create({ data: { title } });\n  revalidatePath('/todos');      // refresh the cached page\n}" },
        { type: "code", lang: "tsx", code: "// app/todos/page.tsx — wire the action straight to the form\nimport { createTodo } from './actions';\n\nexport default function Page() {\n  return (\n    <form action={createTodo}>\n      <input name=\"title\" />\n      <button type=\"submit\">Add</button>\n    </form>\n  );\n}" },
        { type: "callout", variant: "tip", text: "Server Actions are the modern way to mutate data. Pair with `revalidatePath`/`revalidateTag` to update caches, and `useFormStatus`/`useActionState` for pending/errors on the client." }
      ]
    },
    {
      id: "data-fetching",
      title: "Data fetching & caching",
      level: "core",
      body: [
        { type: "p", text: "In Server Components you just `await` your data (DB call or `fetch`). Next extends `fetch` with caching controls." },
        { type: "code", lang: "tsx", code: "// cached until manually revalidated (default was 'force-cache'; Next 15 defaults fetch to no-store)\nconst res = await fetch('https://api.example.com/data', {\n  next: { revalidate: 60 },        // ISR: re-fetch at most every 60s\n  // cache: 'no-store',            // always fresh (dynamic)\n  // next: { tags: ['data'] },     // tag for revalidateTag('data')\n});\nconst data = await res.json();" },
        { type: "table", headers: ["Goal", "How"], rows: [
          ["Static, revalidate on a timer", "`next: { revalidate: N }` (ISR)"],
          ["Always dynamic/fresh", "`cache: 'no-store'`"],
          ["Invalidate on demand", "tag with `next.tags`, call `revalidateTag`"],
          ["Force a segment dynamic", "`export const dynamic = 'force-dynamic'`"]
        ] },
        { type: "callout", variant: "gotcha", text: "Caching is the #1 source of \"why is my data stale?\" confusion. Defaults have shifted between Next 13/14/15 — be explicit with `revalidate`/`no-store` rather than relying on defaults." }
      ]
    },
    {
      id: "rendering",
      title: "Rendering modes: SSG / SSR / ISR / streaming",
      level: "core",
      body: [
        { type: "list", items: [
          "**Static (SSG):** rendered at build time (default when no dynamic data). Fastest.",
          "**Dynamic (SSR):** rendered per request (triggered by `no-store`, cookies/headers, or `force-dynamic`).",
          "**ISR:** static + periodic `revalidate` — best of both.",
          "**Streaming:** wrap slow parts in `<Suspense>` (or use `loading.tsx`) to stream HTML progressively."
        ] },
        { type: "code", lang: "tsx", code: "// pre-generate dynamic routes at build time\nexport async function generateStaticParams() {\n  const posts = await getPosts();\n  return posts.map(p => ({ slug: p.slug }));\n}" }
      ]
    },
    {
      id: "middleware",
      title: "Middleware",
      level: "core",
      body: [
        { type: "p", text: "A single `middleware.ts` at the project root runs on the **edge** before matched requests — ideal for auth redirects, rewrites, locale detection." },
        { type: "code", lang: "ts", code: "// middleware.ts\nimport { NextResponse } from 'next/server';\nimport type { NextRequest } from 'next/server';\n\nexport function middleware(req: NextRequest) {\n  const token = req.cookies.get('session')?.value;\n  if (!token && req.nextUrl.pathname.startsWith('/dashboard')) {\n    return NextResponse.redirect(new URL('/login', req.url));\n  }\n  return NextResponse.next();\n}\n\nexport const config = { matcher: ['/dashboard/:path*'] };" },
        { type: "callout", variant: "warn", text: "Middleware runs in the **Edge runtime** — no Node APIs, no direct DB drivers, keep it light. Do heavy auth checks in the page/route, not here." }
      ]
    },
    {
      id: "orm",
      title: "ORM: Prisma (and Drizzle)",
      level: "core",
      body: [
        { type: "p", text: "**Prisma** is the most common ORM with Next; **Drizzle** is the lighter, SQL-like alternative. Use them in Server Components, route handlers, and server actions." },
        { type: "code", lang: "ts", code: "// lib/db.ts — reuse one client (avoid exhausting connections in dev)\nimport { PrismaClient } from '@prisma/client';\nconst globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };\nexport const db = globalForPrisma.prisma ?? new PrismaClient();\nif (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;" },
        { type: "callout", variant: "gotcha", text: "In serverless/dev, creating a new `PrismaClient` per request exhausts DB connections. Use the global-singleton pattern above. For serverless Postgres, use a pooler (PgBouncer / Prisma Accelerate / Neon)." }
      ]
    },
    {
      id: "auth",
      title: "Auth — Auth.js (NextAuth)",
      level: "core",
      body: [
        { type: "p", text: "**Auth.js** (formerly NextAuth) is the standard: OAuth providers, credentials, sessions, and a DB adapter." },
        { type: "code", lang: "ts", code: "// auth.ts\nimport NextAuth from 'next-auth';\nimport GitHub from 'next-auth/providers/github';\n\nexport const { handlers, auth, signIn, signOut } = NextAuth({\n  providers: [GitHub],\n});\n\n// app/api/auth/[...nextauth]/route.ts\nexport const { GET, POST } = handlers;\n\n// read the session in a server component\nconst session = await auth();" },
        { type: "link", url: "https://authjs.dev/getting-started", text: "Auth.js docs — providers, adapters, session strategies" }
      ]
    },
    {
      id: "metadata",
      title: "Metadata, images, fonts & env",
      level: "deep",
      body: [
        { type: "code", lang: "tsx", code: "// static or dynamic SEO metadata\nexport const metadata = { title: 'My App', description: '…' };\n// or:\nexport async function generateMetadata({ params }) {\n  const { slug } = await params;\n  return { title: `Post ${slug}` };\n}" },
        { type: "list", items: [
          "`next/image` — automatic optimization, lazy loading, layout-shift prevention.",
          "`next/font` — self-host Google/local fonts with zero layout shift.",
          "Env: server-only vars are private; only `NEXT_PUBLIC_*` are exposed to the browser."
        ] },
        { type: "callout", variant: "warn", text: "Any secret referenced in a Client Component (or prefixed `NEXT_PUBLIC_`) ends up in the browser bundle. Keep secrets in Server Components / route handlers / actions only." }
      ]
    },
    {
      id: "pages-router",
      title: "Pages Router (legacy contrast)",
      level: "deep",
      body: [
        { type: "p", text: "You'll still meet the older `pages/` model. Key differences:" },
        { type: "table", headers: ["App Router", "Pages Router"], rows: [
          ["Server Components + `fetch` caching", "`getServerSideProps` / `getStaticProps`"],
          ["`app/api/x/route.ts`", "`pages/api/x.ts` (handler(req,res))"],
          ["`layout.tsx`", "`_app.tsx` / `_document.tsx`"],
          ["Server Actions", "manual API routes + client fetch"]
        ] },
        { type: "code", lang: "tsx", code: "// pages router data fetching\nexport async function getServerSideProps(ctx) {\n  const data = await getData();\n  return { props: { data } };   // passed to the page component\n}" }
      ]
    }
  ],

  packages: [
    { name: "next / react / react-dom", why: "the framework" },
    { name: "prisma + @prisma/client", why: "ORM (most common)" },
    { name: "drizzle-orm", why: "lightweight ORM alternative" },
    { name: "next-auth (Auth.js)", why: "authentication" },
    { name: "zod", why: "schema validation (actions/forms)" },
    { name: "react-hook-form", why: "forms" },
    { name: "tailwindcss", why: "styling (default option)" },
    { name: "@tanstack/react-query", why: "client-side data caching" },
    { name: "swr", why: "client fetching (by Vercel)" }
  ],

  gotchas: [
    "Next 15: `params`, `searchParams`, `cookies()`, `headers()` are **async** — `await` them.",
    "`\"use client\"` makes the whole imported tree client-side; keep it at interactive leaves to limit bundle size.",
    "Caching defaults changed across v13/14/15 — be explicit with `revalidate` / `cache: 'no-store'`.",
    "Secrets leak if used in client components or prefixed `NEXT_PUBLIC_`; keep them server-side.",
    "A folder can have `page.tsx` OR `route.ts`, not both.",
    "Creating a `new PrismaClient()` per request in serverless exhausts connections — use a global singleton + pooler.",
    "Middleware runs on the Edge runtime — no Node APIs or DB drivers there."
  ],

  flashcards: [
    { q: "In the App Router, are components server or client by default?", a: "**Server Components** by default. Add `\"use client\"` to opt a file (and its import tree) into client rendering." },
    { q: "What file makes a route publicly accessible?", a: "`page.tsx` (for UI) — a folder without one isn't routable. `route.ts` makes an API endpoint instead." },
    { q: "How do you build a REST endpoint in App Router?", a: "`app/**/route.ts` exporting `GET`/`POST`/etc. using Web `Request`/`Response` (or `NextResponse`)." },
    { q: "What is a Server Action?", a: "A `\"use server\"` function that runs on the server, callable from client components or directly as a form `action` — for mutations, no API route needed." },
    { q: "How do you enable ISR for a fetch?", a: "`fetch(url, { next: { revalidate: N } })` — revalidate the cached result every N seconds." },
    { q: "What must you `await` in Next.js 15 that used to be sync?", a: "`params`, `searchParams`, and `cookies()`/`headers()` — they're now Promises." },
    { q: "Why keep `\"use client\"` at the leaves?", a: "Everything imported into a client component ships to the browser; leaf boundaries minimize the JS bundle." },
    { q: "How do you avoid exhausting DB connections with Prisma in Next?", a: "Reuse a **global singleton** `PrismaClient` (not one per request) and use a connection pooler in serverless." }
  ],

  cheatsheet: [
    { label: "New app", code: "npx create-next-app@latest" },
    { label: "Dynamic route", code: "app/blog/[slug]/page.tsx" },
    { label: "API route", code: "app/api/x/route.ts -> export GET()" },
    { label: "Client comp", code: "'use client' (top of file)" },
    { label: "Server action", code: "'use server' fn(formData)" },
    { label: "ISR fetch", code: "fetch(url,{next:{revalidate:60}})" },
    { label: "Revalidate", code: "revalidatePath('/x')" },
    { label: "Middleware", code: "middleware.ts + matcher" }
  ]
});
