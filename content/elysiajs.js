(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "elysiajs",
  name: "ElysiaJS",
  language: "TypeScript / Bun",
  tagline: "Bun-first, **end-to-end type-safe** framework: a fluent chainable API, schema validation with `t`, lifecycle hooks, and the Eden typed client.",
  color: "#a855f7",
  readMinutes: 16,
  group: "TypeScript",

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
        { type: "code", lang: "ts", code: "new Elysia()\n  // every route below is prefixed with /api/v1\n  .group('/api/v1', app => app\n    .get('/health', () => 'ok')          // -> GET /api/v1/health\n    .get('/users', () => [])             // -> GET /api/v1/users\n  )\n  // a group can also carry a shared schema/guard as its 2nd arg\n  .group('/admin', { beforeHandle: requireAdmin }, app => app\n    .get('/stats', () => ({ ok: true })) // guarded by requireAdmin\n  )\n  .listen(3000);" }
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
        { type: "code", lang: "ts", code: "// server: export the type (NOT the value) alongside the app\nexport const app = new Elysia().post('/users', /* ... */);\nexport type App = typeof app;\n\n// client\nimport { treaty } from '@elysiajs/eden';\nimport type { App } from '../server';\n\nconst api = treaty<App>('localhost:3000');\n\n// path segments map to routes; the method is the function you call\nconst { data, error } = await api.users.post({ name: 'Ada' });\n//     ^ data: typed from the route's response schema\n//              error: typed union of the route's error statuses\n\nif (error) {\n  // error.status is a literal union (e.g. 422 | 500); error.value is typed per status\n  switch (error.status) {\n    case 422: console.error('validation', error.value); break;\n    default:  throw error.value;\n  }\n} else {\n  console.log(data.name);   // fully typed, no casting\n}" }
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
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "Elysia's magic is its type inference. Almost every confusing bug traces back to that inference breaking silently — the code still runs, but your types (and Eden) go quietly stale. These are the traps that bite real projects." },

        { type: "heading", text: "1. Breaking the method chain kills inference" },
        { type: "p", text: "Elysia accumulates types **through the chain**. If you call a method on its own statement without keeping the returned instance, the new types are discarded — the app runs, but `ctx.user` is `unknown` and Eden loses the route. Elysia returns a *new* type on every call, so you must keep it." },
        { type: "code", lang: "ts", code: "// WRONG — the .get result is thrown away; app's type never learns the route\nconst app = new Elysia();\napp.decorate('db', createDb());   // return value discarded\napp.get('/users', ({ db }) => db.all());   // db is `unknown` here!\n\n// RIGHT (a) — one continuous chain\nconst app = new Elysia()\n  .decorate('db', createDb())\n  .get('/users', ({ db }) => db.all());   // db fully typed\n\n// RIGHT (b) — if you must split, REASSIGN so types accumulate\nlet app2 = new Elysia();\napp2 = app2.decorate('db', createDb());\napp2 = app2.get('/users', ({ db }) => db.all());" },
        { type: "callout", variant: "gotcha", text: "Fix: never call `.get`/`.use`/`.decorate` as a bare statement. Either keep one fluent chain, or reassign `app = app.use(...)` every time. A dropped return value = silently lost types and a broken Eden client." },

        { type: "heading", text: "2. decorate vs derive vs state vs resolve" },
        { type: "p", text: "Four ways to enrich the context — the difference is *when* they run and *what* they add. Static vs per-request is the key distinction." },
        { type: "table", headers: ["Method", "Runs", "Adds to", "Use for"], rows: [
          ["`decorate`", "once, at startup (static)", "`ctx.<key>`", "services: DB client, logger, config object"],
          ["`state`", "once, at startup (static)", "`ctx.store.<key>`", "shared mutable data: counters, feature flags"],
          ["`derive`", "**every request** (before validation)", "`ctx.<key>`", "cheap per-request values from raw context (parse a header)"],
          ["`resolve`", "**every request** (after validation)", "`ctx.<key>`", "values needing validated input, e.g. load user from a validated token"]
        ] },
        { type: "code", lang: "ts", code: "new Elysia()\n  .decorate('db', createDb())                 // static service\n  .state('requests', 0)                       // static mutable store\n  .derive(({ headers }) => ({                  // per-request, pre-validation\n    bearer: headers.authorization?.slice(7),   // strip \"Bearer \"\n  }))\n  .resolve(async ({ bearer, db }) => ({        // per-request, post-validation\n    user: bearer ? await db.userFromToken(bearer) : null,\n  }))\n  .get('/me', ({ user, store }) => {\n    store.requests++;                          // mutate shared state\n    return user;\n  });" },
        { type: "callout", variant: "gotcha", text: "Fix: put heavy or DB-touching work in `resolve`/`derive` only when it must run per request — and keep it lean. `decorate`/`state` run once, so use them for anything that doesn't change between requests. Doing an auth DB lookup in `decorate` would run it a single time at boot, not per user." },

        { type: "heading", text: "3. Plugin hooks are encapsulated by default" },
        { type: "p", text: "A hook, `derive`, or `state` defined inside a plugin is **local** to that plugin — it does NOT leak to the parent app. This surprises people who add auth in a plugin and find the parent's routes unguarded. Control the scope explicitly with `.as(...)`." },
        { type: "code", lang: "ts", code: "// This beforeHandle only guards routes INSIDE authPlugin, not the parent\nconst authPlugin = new Elysia({ name: 'auth' })   // name -> deduped if used twice\n  .onBeforeHandle(({ set }) => { /* ...check... */ })\n  .as('scoped');   // 'scoped' = propagate one level up; 'global' = to the whole app\n\nconst app = new Elysia()\n  .use(authPlugin)\n  .use(authPlugin)   // registered ONCE thanks to the `name`\n  .get('/protected', () => 'ok');" },
        { type: "callout", variant: "gotcha", text: "Fix: encapsulation is the default and usually what you want. To share a hook, end the plugin with `.as('scoped')` (one level up) or `.as('global')` (entire app). Always give reusable plugins a `name` so double-`.use()` dedupes instead of running twice." },

        { type: "heading", text: "4. Eden loses types silently" },
        { type: "p", text: "Eden's typed client is `treaty<App>()` where `type App = typeof app`. If inference broke anywhere upstream (see headache #1), `App` is incomplete — but there's no error. The client just returns `any`/loses routes, and you only notice when autocomplete is missing." },
        { type: "callout", variant: "warn", text: "Fix: when Eden autocomplete disappears, don't debug the client — debug the server chain. Hover `typeof app` on the server: if a route or decoration is missing there, a broken chain upstream is the cause. Also export `type App = typeof app`, never the runtime value, to the client." },

        { type: "heading", text: "5. Validation is not the same as TS types" },
        { type: "p", text: "TS types are erased at runtime; `t` schemas are the only thing that actually *validates* incoming data. A plain TS type on `body` gives autocomplete but zero runtime safety. Use `t` on `body`/`query`/`params`/`headers`/`response` — and lean on coercion for query strings." },
        { type: "code", lang: "ts", code: "new Elysia()\n  .get('/search', ({ query }) => query.page + 1, {\n    query: t.Object({\n      q:    t.String(),\n      page: t.Numeric({ default: 1 }),   // t.Numeric coerces \"2\" (string) -> 2\n    }),\n  })\n  .post('/users', ({ body, status }) => {\n    if (body.age < 18) return status(403, 'must be 18+');   // typed status helper\n    return body;\n  }, {\n    body: t.Object({ name: t.String(), age: t.Number() }),\n    // invalid body -> automatic 422 BEFORE the handler ever runs\n  });" },
        { type: "callout", variant: "gotcha", text: "Fix: query/param values arrive as strings — use `t.Numeric`/`t.BooleanString` to coerce, not `t.Number`, or validation fails on `\"2\"`. Return `status(code, body)` (or `error(code, body)` in older versions) instead of throwing for expected error responses; reserve thrown errors + `onError` for the unexpected." },

        { type: "heading", text: "6. It targets Bun, not Node" },
        { type: "p", text: "Elysia is built on Bun's runtime and APIs. Running it under `node`, or pulling Node-only native packages, can break in non-obvious ways. Use the Bun toolchain end to end." },
        { type: "code", lang: "bash", code: "bun run src/index.ts        # run (not: node index.ts)\nbun --watch src/index.ts    # watch/hot-reload in dev\nbun build src/index.ts --target bun --outdir dist   # bundle for Bun\nbun test                    # Bun's built-in test runner" },
        { type: "callout", variant: "warn", text: "Fix: standardize on `bun run`/`bun --watch`/`bun test` and prefer Bun-native or pure-JS packages (e.g. Drizzle + `bun:sqlite`/`postgres`). Before adopting a Node library, confirm it works on Bun — most do, but native addons and some Node internals are the usual failures." },

        { type: "heading", text: "7. onError, error codes & mapResponse" },
        { type: "p", text: "`onError` is your central funnel for thrown errors; match on `code` (a string union) and set the response. `mapResponse` is the lowest-level hook to reshape the final response (e.g. custom serialization, headers) after `afterHandle`." },
        { type: "code", lang: "ts", code: "new Elysia()\n  .onError(({ code, error, set }) => {\n    // code: 'NOT_FOUND' | 'VALIDATION' | 'PARSE' | 'INTERNAL_SERVER_ERROR' | custom\n    if (code === 'VALIDATION') { set.status = 422; return { errors: error.all }; }\n    if (code === 'NOT_FOUND')  { set.status = 404; return { error: 'not found' }; }\n    set.status = 500;\n    return { error: 'internal' };\n  })\n  .mapResponse(({ response, set }) => {\n    // last chance to transform the outgoing response for every route\n    set.headers['x-powered-by'] = 'elysia';\n    return response;\n  })\n  .get('/boom', () => { throw new Error('nope'); });" },
        { type: "callout", variant: "tip", text: "Fix: register ONE top-level `onError` for consistent error shapes, and read `error.code`/`error.all` for validation details. Use `mapResponse` (not `afterHandle`) when you need to touch the serialized response or headers globally — it runs last, on every response." }
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
    "`derive` runs per request and adds to context; heavy work there runs on every request — keep it cheap.",
    "Calling `.get`/`.use`/`.decorate` as a bare statement discards the returned type — keep one chain or reassign `app = app.use(...)`.",
    "Plugin hooks are **scoped** by default; end the plugin with `.as('scoped')` or `.as('global')` to propagate, and give it a `name` to dedupe.",
    "Query/param values are strings — use `t.Numeric`/`t.BooleanString` to coerce, not `t.Number`, or validation fails on values like `\"2\"`."
  ],

  flashcards: [
    { q: "What runtime is Elysia built for?", a: "**Bun** (Bun-first). Some Node-only packages may not work." },
    { q: "How do you validate a request body and get types for free?", a: "Pass a schema built with `t` (TypeBox) as the route's second arg (`{ body: t.Object({...}) }`) — it validates at runtime, infers types, and feeds OpenAPI." },
    { q: "Which hook is the place for auth/guard logic?", a: "`beforeHandle` (runs after validation, before the handler)." },
    { q: "Difference between `state` and `decorate`?", a: "`state` adds mutable data to `ctx.store`; `decorate` adds services/functions directly to the context (e.g. a DB client)." },
    { q: "How do you add a computed, typed value (like current user) to context?", a: "`derive` (or `resolve`) — returns an object merged into the context with full typing." },
    { q: "What is Eden?", a: "Elysia's **end-to-end typed client**: export `type App = typeof app`, then call the API with full type-safety (tRPC-style over REST)." },
    { q: "What's a plugin in Elysia?", a: "Just another Elysia instance you `.use()`; hooks/state inside are **encapsulated** unless named or marked global." },
    { q: "Why did my Eden client suddenly lose its types?", a: "Inference broke upstream on the server — usually a broken method chain (a bare `.get`/`.use` whose return value was discarded). Keep one chain or reassign `app = app.use(...)`, and export `type App = typeof app`. It fails silently, no error." },
    { q: "`derive` vs `resolve` vs `decorate`?", a: "`decorate` adds a static value once at startup; `derive` runs per request BEFORE validation; `resolve` runs per request AFTER validation (so it can use validated input, e.g. load the user from a validated token)." }
  ],

  cheatsheet: [
    { label: "New app", code: "bun create elysia my-app" },
    { label: "Route", code: ".get('/x/:id', ({params}) => …)" },
    { label: "Body schema", code: ".post('/x', h, { body: t.Object({…}) })" },
    { label: "Set status", code: "set.status = 201" },
    { label: "Add to ctx", code: ".derive(() => ({ user }))" },
    { label: "Guard set", code: ".guard({ beforeHandle }, app => …)" },
    { label: "Use plugin", code: ".use(openapi())" },
    { label: "Typed client", code: "treaty<App>('host')" },
    { label: "Share plugin hook", code: ".onBeforeHandle(fn).as('scoped')" },
    { label: "Coerce query num", code: "t.Numeric({ default: 1 })" }
  ]
});
