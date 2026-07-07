(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "elysiajs",
  name: "ElysiaJS",
  language: "TypeScript / Bun",
  tagline: "Bun-first, **end-to-end type-safe** framework: a fluent chainable API, schema validation with `t`, lifecycle hooks, and the Eden typed client.",
  color: "#a855f7",
  readMinutes: 14,

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "Elysia runs on **Bun** and is designed around **method chaining** and **type inference**. You build an app by chaining `.get`, `.post`, `.use`, `.decorate` — and the types flow through the whole chain, including to a typed client (**Eden**)." },
        { type: "list", items: [
          "Extremely fast (Bun + optimized routing).",
          "Validation, docs, and types come from a single schema written with `t` (TypeBox).",
          "**Reach for it when:** you're on Bun and want tRPC-like end-to-end types for a REST API.",
          "**Key rule:** keep the chain — reassigning to a new variable can lose type inference."
        ] }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "# install Bun first: curl -fsSL https://bun.sh/install | bash\nbun create elysia my-app\ncd my-app\nbun run dev          # watch mode" },
        { type: "code", lang: "ts", code: "// src/index.ts\nimport { Elysia } from 'elysia';\n\nconst app = new Elysia()\n  .get('/', () => 'Hello Elysia')\n  .get('/json', () => ({ ok: true }))   // objects auto-serialize to JSON\n  .listen(3000);\n\nconsole.log('running on', app.server?.hostname, app.server?.port);" },
        { type: "callout", variant: "tip", text: "Return values are sent automatically: a string → text, an object → JSON, a `Response` → as-is, a `File` → streamed." }
      ]
    },
    {
      id: "routing",
      title: "Routing & the context object",
      level: "core",
      body: [
        { type: "p", text: "Each handler receives one **context** object; destructure what you need: `params`, `query`, `body`, `set`, `headers`, `store`, plus anything you decorated." },
        { type: "code", lang: "ts", code: "new Elysia()\n  .get('/users/:id', ({ params: { id }, query }) => {\n    return { id, q: query.q };     // /users/1?q=hi\n  })\n  .post('/users', ({ body, set }) => {\n    set.status = 201;              // set status via context\n    return body;\n  })\n  .listen(3000);" },
        { type: "p", text: "Group routes with a shared prefix; nest by mounting plugins." },
        { type: "code", lang: "ts", code: ".group('/api/v1', app => app\n  .get('/health', () => 'ok')\n  .get('/users', () => [])\n)" }
      ]
    },
    {
      id: "validation",
      title: "Schema validation with t (signature feature)",
      level: "core",
      body: [
        { type: "p", text: "Attach a schema to any route with the second argument. `t` (TypeBox) validates `body`, `query`, `params`, `headers`, and `response` — and infers the handler's types automatically." },
        { type: "code", lang: "ts", code: "import { Elysia, t } from 'elysia';\n\nnew Elysia()\n  .post('/users', ({ body }) => {\n    // body is typed { email: string; name: string; age?: number }\n    return body;\n  }, {\n    body: t.Object({\n      email: t.String({ format: 'email' }),\n      name:  t.String({ minLength: 1, maxLength: 80 }),\n      age:   t.Optional(t.Number({ minimum: 0 })),\n    }),\n    response: t.Object({ email: t.String(), name: t.String() }),\n  })\n  .listen(3000);" },
        { type: "callout", variant: "tip", text: "One schema does three jobs: runtime **validation** (auto 422 on failure), compile-time **types**, and **OpenAPI** docs. No DTOs, no decorators." }
      ]
    },
    {
      id: "lifecycle",
      title: "Lifecycle hooks",
      level: "core",
      body: [
        { type: "p", text: "Hooks let you run logic at each stage. `derive`/`resolve` add typed values to the context (e.g. the current user)." },
        { type: "table", headers: ["Hook", "Runs"], rows: [
          ["`onRequest`", "earliest, before routing (good for global checks)"],
          ["`onParse`", "parse body"],
          ["`onTransform`", "mutate context before validation"],
          ["`beforeHandle`", "after validation, before handler (auth/guards)"],
          ["`afterHandle`", "transform the response"],
          ["`onError`", "handle thrown errors"],
          ["`derive` / `resolve`", "add computed values to context"]
        ] },
        { type: "code", lang: "ts", code: "new Elysia()\n  .derive(({ headers }) => ({\n    bearer: headers.authorization?.split(' ')[1],   // now ctx.bearer exists, typed\n  }))\n  .onBeforeHandle(({ bearer, set }) => {\n    if (!bearer) { set.status = 401; return 'Unauthorized'; }\n  })\n  .get('/me', ({ bearer }) => ({ token: bearer }))\n  .listen(3000);" }
      ]
    },
    {
      id: "guards",
      title: "Guards, state & decorate",
      level: "core",
      body: [
        { type: "p", text: "`guard` applies schema/hooks to a set of routes. `state` adds shared mutable data (`ctx.store`); `decorate` adds shared services/functions to the context." },
        { type: "code", lang: "ts", code: "new Elysia()\n  .state('version', '1.0')                 // ctx.store.version\n  .decorate('db', createDb())              // ctx.db\n  .guard({\n    beforeHandle: ({ headers, set }) => {\n      if (!headers.authorization) { set.status = 401; return 'no auth'; }\n    }\n  }, app => app\n    .get('/secret', ({ db }) => db.secrets())\n  )\n  .listen(3000);" },
        { type: "callout", variant: "gotcha", text: "`state` = plain mutable data (`store`); `decorate` = services/functions. Reach for `decorate` for a DB client, `state` for counters/config flags." }
      ]
    },
    {
      id: "plugins",
      title: "Plugins & structure",
      level: "core",
      body: [
        { type: "p", text: "A plugin is just another Elysia instance you `.use()`. This is how you split an app into modules — and Elysia dedupes plugins by name." },
        { type: "code", lang: "ts", code: "// users.plugin.ts\nexport const users = new Elysia({ prefix: '/users' })\n  .get('/', () => [])\n  .post('/', ({ body }) => body, { body: t.Object({ name: t.String() }) });\n\n// index.ts\nimport { users } from './users.plugin';\nnew Elysia().use(users).listen(3000);" },
        { type: "callout", variant: "gotcha", text: "Plugin **encapsulation**: hooks/state defined inside a plugin stay local to it by default. To share globally, give the plugin a `name` and/or mark hooks as `{ as: 'global' }`." }
      ]
    },
    {
      id: "official-plugins",
      title: "Official plugins (openapi, cors, jwt)",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "bun add @elysiajs/openapi @elysiajs/cors @elysiajs/jwt @elysiajs/cookie" },
        { type: "code", lang: "ts", code: "import { openapi } from '@elysiajs/openapi';\nimport { cors } from '@elysiajs/cors';\nimport { jwt } from '@elysiajs/jwt';\n\nnew Elysia()\n  .use(cors())\n  .use(openapi())                          // docs at /openapi, spec at /openapi/json\n  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET! }))\n  .post('/sign', ({ jwt }) => jwt.sign({ sub: 'user1' }))\n  .get('/verify', async ({ jwt, headers, set }) => {\n    const token = headers.authorization?.split(' ')[1];   // strip \"Bearer \"\n    const payload = token && await jwt.verify(token);\n    if (!payload) { set.status = 401; return 'bad token'; }\n    return payload;\n  })\n  .listen(3000);" },
        { type: "callout", variant: "note", text: "`@elysiajs/swagger` is deprecated — use `@elysiajs/openapi` (Scalar UI). Schemas written with `t` still auto-populate the spec." }
      ]
    },
    {
      id: "orm",
      title: "ORM: Drizzle (or Prisma)",
      level: "core",
      body: [
        { type: "p", text: "Elysia is ORM-agnostic. **Drizzle** is the popular Bun-friendly choice (lightweight, SQL-like, great types); **Prisma** also works." },
        { type: "code", lang: "bash", code: "bun add drizzle-orm postgres\nbun add -D drizzle-kit" },
        { type: "code", lang: "ts", code: "import { drizzle } from 'drizzle-orm/postgres-js';\nimport { pgTable, serial, text } from 'drizzle-orm/pg-core';\nimport { eq } from 'drizzle-orm';\nimport postgres from 'postgres';\n\nexport const users = pgTable('users', {\n  id: serial('id').primaryKey(),\n  email: text('email').notNull().unique(),\n  name: text('name').notNull(),\n});\n\nconst db = drizzle(postgres(process.env.DATABASE_URL!));\n\nawait db.select().from(users);\nawait db.insert(users).values({ email, name });\nawait db.select().from(users).where(eq(users.id, 1));" },
        { type: "code", lang: "bash", code: "bunx drizzle-kit generate   # create migration from schema\nbunx drizzle-kit migrate    # apply" }
      ]
    },
    {
      id: "eden",
      title: "Eden — end-to-end typed client",
      level: "deep",
      body: [
        { type: "p", text: "Export your app's **type**, then call the API from a client (or another service) with full autocomplete and type-checking — tRPC-style, but over plain REST." },
        { type: "code", lang: "ts", code: "// server: export the type\nexport type App = typeof app;\n\n// client\nimport { treaty } from '@elysiajs/eden';\nimport type { App } from '../server';\n\nconst api = treaty<App>('localhost:3000');\nconst { data, error } = await api.users.post({ name: 'Ada' });\n//     ^ fully typed from the server's schema" }
      ]
    },
    {
      id: "errors",
      title: "Error handling",
      level: "deep",
      body: [
        { type: "code", lang: "ts", code: "new Elysia()\n  .onError(({ code, error, set }) => {\n    if (code === 'NOT_FOUND') { set.status = 404; return 'Not found'; }\n    if (code === 'VALIDATION') { set.status = 422; return error.message; }\n    set.status = 500; return 'Internal error';\n  })\n  .get('/boom', () => { throw new Error('nope'); })\n  .listen(3000);" },
        { type: "p", text: "Built-in error codes include `NOT_FOUND`, `VALIDATION`, `PARSE`, `INTERNAL_SERVER_ERROR`. You can also throw custom error classes and match on them." }
      ]
    }
  ],

  packages: [
    { name: "elysia", why: "the framework (includes `t`)" },
    { name: "@elysiajs/openapi", why: "OpenAPI docs (Scalar UI); replaces the deprecated @elysiajs/swagger" },
    { name: "@elysiajs/cors", why: "CORS" },
    { name: "@elysiajs/jwt", why: "JWT sign/verify" },
    { name: "@elysiajs/eden", why: "end-to-end typed client" },
    { name: "drizzle-orm + drizzle-kit", why: "Bun-friendly ORM + migrations" },
    { name: "@prisma/client", why: "alternative ORM" },
    { name: "@elysiajs/cookie", why: "cookie handling" }
  ],

  gotchas: [
    "It's **Bun-first** — some Node-only APIs/packages may not work; test on Bun.",
    "Keep the method chain intact; breaking it into reassigned variables can lose type inference.",
    "Plugin **encapsulation**: hooks/state are local to the plugin unless you name it or set `{ as: 'global' }`.",
    "`state` (store) vs `decorate` (services) — mixing them up leads to confusing context shapes.",
    "Validation failures return **422** automatically; don't also hand-check the same fields.",
    "`derive` runs per request and adds to context; heavy work there runs on every request — keep it cheap."
  ],

  flashcards: [
    { q: "What runtime is Elysia built for?", a: "**Bun** (Bun-first). Some Node-only packages may not work." },
    { q: "How do you validate a request body and get types for free?", a: "Pass a schema built with `t` (TypeBox) as the route's second arg (`{ body: t.Object({...}) }`) — it validates at runtime, infers types, and feeds OpenAPI." },
    { q: "Which hook is the place for auth/guard logic?", a: "`beforeHandle` (runs after validation, before the handler)." },
    { q: "Difference between `state` and `decorate`?", a: "`state` adds mutable data to `ctx.store`; `decorate` adds services/functions directly to the context (e.g. a DB client)." },
    { q: "How do you add a computed, typed value (like current user) to context?", a: "`derive` (or `resolve`) — returns an object merged into the context with full typing." },
    { q: "What is Eden?", a: "Elysia's **end-to-end typed client**: export `type App = typeof app`, then call the API with full type-safety (tRPC-style over REST)." },
    { q: "What's a plugin in Elysia?", a: "Just another Elysia instance you `.use()`; hooks/state inside are **encapsulated** unless named or marked global." }
  ],

  cheatsheet: [
    { label: "New app", code: "bun create elysia my-app" },
    { label: "Route", code: ".get('/x/:id', ({params}) => …)" },
    { label: "Body schema", code: ".post('/x', h, { body: t.Object({…}) })" },
    { label: "Set status", code: "set.status = 201" },
    { label: "Add to ctx", code: ".derive(() => ({ user }))" },
    { label: "Guard set", code: ".guard({ beforeHandle }, app => …)" },
    { label: "Use plugin", code: ".use(openapi())" },
    { label: "Typed client", code: "treaty<App>('host')" }
  ]
});
