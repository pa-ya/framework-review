(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "go-chi",
  name: "Go chi",
  language: "Go",
  group: "Go",
  tagline: "A **lightweight, idiomatic** router that is 100% `net/http` compatible — no framework lock-in, just composable middleware and sub-routers.",
  color: "#4a5568",
  readMinutes: 14,

  sections: [
    {
      id: "overview",
      title: "Overview & philosophy",
      level: "core",
      body: [
        { type: "p", text: "chi is *not* a framework — it's a router. Handlers are plain `http.HandlerFunc`, middleware is `func(http.Handler) http.Handler`, and everything composes with the standard library. If you like stdlib Go, you'll like chi." },
        { type: "table", headers: ["", "chi", "Echo"], rows: [
          ["Style", "stdlib `net/http`", "own `Context` + helpers"],
          ["Handlers", "`http.HandlerFunc`", "`func(echo.Context) error`"],
          ["Batteries", "router + middleware only", "bind/validate/JWT built in"],
          ["Lock-in", "minimal (drop-in compatible)", "moderate"]
        ] },
        { type: "callout", variant: "note", text: "Since Go 1.22 the stdlib `http.ServeMux` supports methods + path params (`GET /users/{id}`). chi still wins for nested routers, middleware stacks, and route groups." }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "go mod init github.com/me/myapi\ngo get github.com/go-chi/chi/v5" },
        { type: "code", lang: "go", code: "package main\n\nimport (\n\t\"net/http\"\n\t\"github.com/go-chi/chi/v5\"\n\t\"github.com/go-chi/chi/v5/middleware\"\n)\n\nfunc main() {\n\tr := chi.NewRouter()\n\tr.Use(middleware.Logger)\n\tr.Use(middleware.Recoverer)\n\n\tr.Get(\"/\", func(w http.ResponseWriter, r *http.Request) {\n\t\tw.Write([]byte(\"hello\"))\n\t})\n\n\thttp.ListenAndServe(\":8080\", r)   // r is a standard http.Handler\n}" },
        { type: "callout", variant: "gotcha", text: "`http.ListenAndServe(\":8080\", r)` uses a default server with **no timeouts** (Slowloris risk) and swallows the returned error. In production build the `http.Server` explicitly." },
        { type: "code", lang: "go", code: "srv := &http.Server{\n\tAddr:              \":8080\",\n\tHandler:           r,\n\tReadHeaderTimeout: 5 * time.Second,\n\tReadTimeout:       15 * time.Second,\n\tWriteTimeout:      15 * time.Second,\n\tIdleTimeout:       60 * time.Second,\n}\nlog.Fatal(srv.ListenAndServe())   // then srv.Shutdown(ctx) on SIGTERM to drain" }
      ]
    },
    {
      id: "routing",
      title: "Routing, params & sub-routers",
      level: "core",
      body: [
        { type: "code", lang: "go", code: "r.Get(\"/users/{id}\", getUser)\nr.Post(\"/users\", createUser)\n\nfunc getUser(w http.ResponseWriter, r *http.Request) {\n\tid := chi.URLParam(r, \"id\")            // path param\n\tq := r.URL.Query().Get(\"q\")            // query param\n\tw.Write([]byte(id + \" \" + q))\n}" },
        { type: "p", text: "**`Route`** mounts a nested sub-router (great for REST resources); **`Mount`** attaches an entire handler at a path; **`Group`** applies middleware to a set of inline routes without a prefix." },
        { type: "code", lang: "go", code: "r.Route(\"/users\", func(r chi.Router) {\n\tr.Get(\"/\", listUsers)\n\tr.Post(\"/\", createUser)\n\tr.Route(\"/{id}\", func(r chi.Router) {\n\t\tr.Use(userCtx)              // load user into context for these routes\n\t\tr.Get(\"/\", getUser)\n\t\tr.Put(\"/\", updateUser)\n\t\tr.Delete(\"/\", deleteUser)\n\t})\n})\n\n// Group: shared middleware, no path prefix\nr.Group(func(r chi.Router) {\n\tr.Use(requireAuth)\n\tr.Get(\"/admin\", adminHandler)\n})" }
      ]
    },
    {
      id: "middleware",
      title: "Middleware",
      level: "core",
      body: [
        { type: "p", text: "Middleware is the standard `func(http.Handler) http.Handler`. chi bundles a solid set under `chi/middleware`." },
        { type: "code", lang: "go", code: "r.Use(\n\tmiddleware.RequestID,\n\tmiddleware.RealIP,\n\tmiddleware.Logger,\n\tmiddleware.Recoverer,        // recover panics -> 500\n\tmiddleware.Timeout(60*time.Second),\n)" },
        { type: "code", lang: "go", code: "// custom middleware\nfunc requireAuth(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tif r.Header.Get(\"Authorization\") == \"\" {\n\t\t\thttp.Error(w, \"unauthorized\", http.StatusUnauthorized)\n\t\t\treturn\n\t\t}\n\t\tnext.ServeHTTP(w, r)\n\t})\n}" },
        { type: "callout", variant: "gotcha", text: "`r.Use(...)` must be called **before** you register routes on that router; adding middleware after routes on the same router panics." }
      ]
    },
    {
      id: "context",
      title: "Context values (the idiomatic pattern)",
      level: "core",
      body: [
        { type: "p", text: "Pass request-scoped data (loaded user, request id) via `context.Context`. Use a **private key type** to avoid collisions." },
        { type: "code", lang: "go", code: "type ctxKey string\nconst userKey ctxKey = \"user\"\n\nfunc userCtx(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tid := chi.URLParam(r, \"id\")\n\t\tuser := loadUser(id)                        // from db\n\t\tctx := context.WithValue(r.Context(), userKey, user)\n\t\tnext.ServeHTTP(w, r.WithContext(ctx))\n\t})\n}\n\nfunc getUser(w http.ResponseWriter, r *http.Request) {\n\tuser := r.Context().Value(userKey).(*User)\n\tjson.NewEncoder(w).Encode(user)\n}" },
        { type: "callout", variant: "warn", text: "Never use a plain `string` as a context key (`\"user\"`) — different packages can clash. Always use an unexported custom type." }
      ]
    },
    {
      id: "json",
      title: "JSON in/out & go-chi/render",
      level: "core",
      body: [
        { type: "p", text: "With pure stdlib you encode/decode yourself. `go-chi/render` adds tidy helpers." },
        { type: "code", lang: "go", code: "// stdlib\nfunc createUser(w http.ResponseWriter, r *http.Request) {\n\tvar in CreateUser\n\tif err := json.NewDecoder(r.Body).Decode(&in); err != nil {\n\t\thttp.Error(w, \"bad json\", http.StatusBadRequest)\n\t\treturn\n\t}\n\tw.Header().Set(\"Content-Type\", \"application/json\")\n\tw.WriteHeader(http.StatusCreated)\n\tjson.NewEncoder(w).Encode(in)\n}" },
        { type: "code", lang: "go", code: "// with go-chi/render — same handler, less boilerplate\nimport \"github.com/go-chi/render\"\n\nfunc createUser(w http.ResponseWriter, r *http.Request) {\n\tvar in CreateUser\n\tif err := render.DecodeJSON(r.Body, &in); err != nil {   // decode\n\t\trender.Status(r, http.StatusBadRequest)\n\t\trender.JSON(w, r, map[string]string{\"error\": \"bad json\"})\n\t\treturn\n\t}\n\t// ... persist in ...\n\trender.Status(r, http.StatusCreated)        // sets the status\n\trender.JSON(w, r, in)                        // sets Content-Type + encodes\n}" }
      ]
    },
    {
      id: "db",
      title: "Database access (idiomatic Go)",
      level: "core",
      body: [
        { type: "p", text: "chi doesn't dictate a data layer. The modern idiomatic stack avoids a heavy ORM. Popular options:" },
        { type: "table", headers: ["Tool", "What it is", "Feel"], rows: [
          ["**sqlc**", "generates typed Go from raw SQL", "most popular; SQL-first, no runtime ORM"],
          ["**pgx**", "fast Postgres driver (+ pgxpool)", "direct, high-performance"],
          ["**sqlx**", "thin extension of `database/sql`", "struct scanning, still SQL"],
          ["GORM / Ent", "full ORMs", "if you want an ORM anyway"]
        ] },
        { type: "code", lang: "sql", code: "-- query.sql (sqlc reads this)\n-- name: GetUser :one\nSELECT id, email, name FROM users WHERE id = $1;\n\n-- name: CreateUser :one\nINSERT INTO users (email, name) VALUES ($1, $2) RETURNING *;" },
        { type: "code", lang: "go", code: "// sqlc generates type-safe methods:\nuser, err := queries.GetUser(ctx, id)\nnewUser, err := queries.CreateUser(ctx, CreateUserParams{Email: e, Name: n})" },
        { type: "callout", variant: "tip", text: "**sqlc** is the go-to for chi users: you write SQL, it generates fully typed Go structs and methods — no reflection, compile-time safety, zero ORM magic." }
      ]
    },
    {
      id: "migrations",
      title: "Migrations",
      level: "deep",
      body: [
        { type: "p", text: "Use **golang-migrate** or **goose** for versioned SQL migrations." },
        { type: "code", lang: "bash", code: "# golang-migrate CLI\n# 1. scaffold a pair of files: <ts>_create_users.up.sql / .down.sql\nmigrate create -ext sql -dir migrations create_users\n\n# 2. apply all pending migrations\nmigrate -database \"$DATABASE_URL\" -path migrations up\n\n# roll back the last one / jump to a version\nmigrate -database \"$DATABASE_URL\" -path migrations down 1\nmigrate -database \"$DATABASE_URL\" -path migrations goto 3" }
      ]
    },
    {
      id: "auth",
      title: "JWT auth",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "go get github.com/go-chi/jwtauth/v5" },
        { type: "code", lang: "go", code: "import \"github.com/go-chi/jwtauth/v5\"\n\nvar tokenAuth = jwtauth.New(\"HS256\", []byte(os.Getenv(\"JWT_SECRET\")), nil)\n\nr.Group(func(r chi.Router) {\n\tr.Use(jwtauth.Verifier(tokenAuth))     // parse token from header/cookie\n\tr.Use(jwtauth.Authenticator(tokenAuth)) // reject invalid/absent\n\n\tr.Get(\"/private\", func(w http.ResponseWriter, r *http.Request) {\n\t\t_, claims, _ := jwtauth.FromContext(r.Context())\n\t\trender.JSON(w, r, claims)\n\t})\n})" }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Because a chi router is just an `http.Handler`, test it end-to-end with `httptest.NewServer` or by calling `ServeHTTP` directly." },
        { type: "code", lang: "go", code: "func TestRoute(t *testing.T) {\n\tr := chi.NewRouter()\n\tr.Get(\"/users/{id}\", getUser)\n\n\treq := httptest.NewRequest(\"GET\", \"/users/1\", nil)\n\trec := httptest.NewRecorder()\n\tr.ServeHTTP(rec, req)\n\n\tif rec.Code != http.StatusOK { t.Fatalf(\"got %d\", rec.Code) }\n}" }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "chi's own footguns are almost all about **middleware ordering** and **route composition** — it stays so close to `net/http` that the rest is just Go." },

        { type: "heading", text: "1. Middleware must be registered before routes" },
        { type: "p", text: "chi freezes a router's middleware stack the moment the first route is added to it. Call every `Use` for a router *before* any `Get`/`Post`/`Route` on that same router, or chi panics with `all middlewares must be defined before routes`." },
        { type: "code", lang: "go", code: "// WRONG: middleware added after a route on the same router -> panic\nr := chi.NewRouter()\nr.Get(\"/\", home)\nr.Use(middleware.Logger)          // panics: middleware after route\n\n// RIGHT: stack first, then routes\nr := chi.NewRouter()\nr.Use(middleware.RequestID)       // tag each request\nr.Use(middleware.RealIP)          // trust X-Forwarded-For (behind a proxy only)\nr.Use(middleware.Logger)          // structured access log\nr.Use(middleware.Recoverer)       // turn panics into 500s, keep server up\nr.Get(\"/\", home)                  // routes come after the stack" },
        { type: "callout", variant: "gotcha", text: "Order is execution order: `Recoverer` only protects middleware/handlers registered *after* it, so put it near the top. `RequestID` should precede `Logger` so the log line carries the id. Each sub-router built with `Route`/`Group` has its **own** stack layered on top of the parent's." },

        { type: "heading", text: "2. Reading path params — chi.URLParam, and it's always a string" },
        { type: "p", text: "Path values come from `chi.URLParam(r, name)` (not stdlib `r.PathValue`), and they're always strings — convert and validate yourself." },
        { type: "code", lang: "go", code: "func getUser(w http.ResponseWriter, r *http.Request) {\n\tid, err := strconv.Atoi(chi.URLParam(r, \"id\"))   // {id} -> int\n\tif err != nil {\n\t\thttp.Error(w, \"id must be an integer\", http.StatusBadRequest)\n\t\treturn\n\t}\n\t_ = id\n}\n\n// wildcard params use the {name} form; catch-all is {name}* at the end:\n//   r.Get(\"/files/*\", h) -> chi.URLParam(r, \"*\")" },

        { type: "heading", text: "3. Sub-routers, Mount, and route-pattern conflicts" },
        { type: "p", text: "`Route` and `Mount` compose routers, but two patterns that can match the same request path panic at build time — chi rejects the ambiguity up front rather than picking a winner silently." },
        { type: "code", lang: "go", code: "// A wildcard segment and a Mount at overlapping paths conflict:\nr.Get(\"/users/{id}\", getUser)\nr.Mount(\"/users\", subRouter)      // panics: conflicts with /users/{id}\n\n// Fix: keep a resource under ONE sub-router instead of mixing styles.\nr.Route(\"/users\", func(r chi.Router) {\n\tr.Get(\"/\", listUsers)\n\tr.Mount(\"/{id}/posts\", postsRouter)   // nested, no overlap\n\tr.Get(\"/{id}\", getUser)\n})" },
        { type: "callout", variant: "warn", text: "Trailing slashes are distinct routes in chi: `/users` and `/users/` are not the same. Add `middleware.StripSlashes` or `middleware.RedirectSlashes` (before routes) if you want them unified." },

        { type: "heading", text: "4. chi is stdlib-compatible — lean on that" },
        { type: "p", text: "A `chi.Router` **is** an `http.Handler`, and chi middleware is the standard `func(http.Handler) http.Handler`. Any stdlib or third-party `net/http` middleware drops straight in, and you serve the router with a plain `http.Server`." },
        { type: "code", lang: "go", code: "// mix stdlib middleware and chi middleware freely\nr.Use(someStdlibMiddleware)                 // func(http.Handler) http.Handler\nr.Use(middleware.Timeout(60 * time.Second)) // chi's own\n\n// serve with an explicit server (timeouts + graceful shutdown)\nsrv := &http.Server{Addr: \":8080\", Handler: r, ReadHeaderTimeout: 5 * time.Second}\nsrv.ListenAndServe()" },
        { type: "callout", variant: "note", text: "The heavyweight Go headaches — goroutine leaks, data races, `context` cancellation, the typed-nil error, `defer`-in-loop — are not chi-specific. They live in the **Go Standard Library** deck's 'Common headaches' section; everything there applies unchanged to chi handlers." }
      ]
    }
  ],

  packages: [
    { name: "go-chi/chi/v5", why: "the router" },
    { name: "chi/v5/middleware", why: "logger, recoverer, timeout, cors…" },
    { name: "go-chi/render", why: "JSON encode/decode helpers" },
    { name: "go-chi/jwtauth", why: "JWT verify/auth middleware" },
    { name: "go-chi/cors", why: "CORS middleware" },
    { name: "sqlc-dev/sqlc", why: "type-safe SQL codegen" },
    { name: "jackc/pgx", why: "Postgres driver + pool" },
    { name: "golang-migrate/migrate", why: "SQL migrations" }
  ],

  gotchas: [
    "Register `r.Use(...)` **before** routes on the same router — adding middleware after routes panics.",
    "Never use a bare `string` as a `context` key; use an unexported custom type to avoid collisions.",
    "chi doesn't parse/validate bodies for you — decode JSON and validate yourself (or add a validator lib).",
    "`chi.URLParam(r, \"id\")` returns a string; convert with `strconv.Atoi` and handle the error.",
    "Trailing-slash routes are distinct; add `middleware.StripSlashes`/`RedirectSlashes` if you want them merged.",
    "A nested `Route`/`Mount` gets its own middleware chain — middleware on the parent still applies, order matters.",
    "Put `middleware.Recoverer` near the top of the stack — it only catches panics in middleware/handlers registered **after** it.",
    "Overlapping route patterns (e.g. `/users/{id}` and a `Mount(\"/users\", ...)`) **panic at build time** — chi refuses ambiguous routing rather than guessing.",
    "The big concurrency headaches (goroutine leaks, data races, context, typed-nil errors) are **not** chi-specific — see the Go Standard Library deck."
  ],

  flashcards: [
    { q: "What is chi, fundamentally?", a: "A lightweight **router** (not a framework) that is fully `net/http` compatible — handlers are `http.HandlerFunc`, middleware is `func(http.Handler) http.Handler`." },
    { q: "How do you read a path param in chi?", a: "`chi.URLParam(r, \"id\")` (returns a string)." },
    { q: "Difference between `Route`, `Mount`, and `Group`?", a: "`Route` = nested sub-router at a prefix; `Mount` = attach a whole handler at a path; `Group` = shared middleware for inline routes with **no** prefix." },
    { q: "Correct way to make a context key?", a: "Define an **unexported custom type** (e.g. `type ctxKey string`) — never a bare string, to avoid package collisions." },
    { q: "What's the idiomatic DB stack for chi projects?", a: "Often no ORM: **sqlc** (typed codegen from SQL) + **pgx**; or sqlx. GORM if you want an ORM." },
    { q: "Why must `r.Use()` come before route registration?", a: "chi builds the middleware chain at registration time; adding middleware after routes on the same router panics." },
    { q: "How do you test a chi router?", a: "It's an `http.Handler` — call `r.ServeHTTP(rec, req)` with `httptest`, no framework-specific setup needed." },
    { q: "Why does chi panic if you call `r.Use` after a route?", a: "chi freezes a router's middleware stack when its first route is registered; every `Use` on that router must come before any `Get`/`Post`/`Route`. Sub-routers get their own stack." },
    { q: "Where should `middleware.Recoverer` go and why?", a: "Near the **top** of the stack. Middleware runs in registration order, so Recoverer only wraps (and can recover panics from) handlers/middleware registered after it." }
  ],

  cheatsheet: [
    { label: "New router", code: "r := chi.NewRouter()" },
    { label: "Middleware", code: "r.Use(middleware.Logger)" },
    { label: "Route", code: "r.Get(\"/users/{id}\", h)" },
    { label: "Path param", code: "chi.URLParam(r, \"id\")" },
    { label: "Sub-router", code: "r.Route(\"/users\", func(r chi.Router){…})" },
    { label: "Serve", code: "http.ListenAndServe(\":8080\", r)" },
    { label: "Ctx value", code: "context.WithValue(r.Context(), key, v)" },
    { label: "JSON out", code: "render.JSON(w, r, v)" },
    { label: "Recover panics", code: "r.Use(middleware.Recoverer)" },
    { label: "Group + mw", code: "r.Group(func(r chi.Router){ r.Use(mw); … })" }
  ]
});
