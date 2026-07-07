(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "go-stdlib",
  name: "Standard Library",
  language: "Go",
  tagline: "Build real backends with almost **no dependencies** — since Go 1.22, `net/http` routing plus `log/slog` cover most of what a framework used to.",
  color: "#00ADD8",
  readMinutes: 16,
  group: "Go",

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "Go's standard library is a batteries-included toolkit for HTTP services: `net/http` (server + client + routing), `encoding/json`, `database/sql`, `context`, `log/slog`, `errors`, `sync`. You compose these directly instead of adopting a framework." },
        { type: "list", items: [
          "**Reach for stdlib when:** you want a small dependency graph, long-term stability (the Go 1 compatibility promise), and full control over the request lifecycle.",
          "**What changed:** before **Go 1.22** the built-in `ServeMux` couldn't match methods or path variables, so everyone reached for `chi`, `gorilla/mux` or `echo`. Since 1.22 the stdlib router does method + wildcard routing, and many teams now ship with **zero web-framework dependencies**.",
          "**Mental model:** an HTTP handler is anything with `ServeHTTP(w http.ResponseWriter, r *http.Request)`. Everything — routing, middleware, the whole app — is just handlers wrapping handlers."
        ] },
        { type: "callout", variant: "note", text: "Everything below assumes **Go 1.22+** (enhanced routing) and mentions **1.21** (`log/slog`) and **1.24** (`omitzero`) features where relevant. Check with `go version`." }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "p", text: "Initialize a module, then write `main.go`. No build tool, no server to install — `go run` compiles and runs." },
        { type: "code", lang: "bash", code: "mkdir myapi && cd myapi\ngo mod init github.com/me/myapi   # creates go.mod\n\ngo run .        # compile + run\ngo build -o server .   # produce a single static binary\ngo test ./...   # run all tests" },
        { type: "code", lang: "go", code: "// main.go\npackage main\n\nimport (\n\t\"fmt\"\n\t\"net/http\"\n)\n\nfunc main() {\n\tmux := http.NewServeMux()\n\tmux.HandleFunc(\"GET /\", func(w http.ResponseWriter, r *http.Request) {\n\t\tfmt.Fprintln(w, \"hello\")\n\t})\n\thttp.ListenAndServe(\":8080\", mux)\n}" },
        { type: "callout", variant: "tip", text: "A Go binary is self-contained: `CGO_ENABLED=0 go build` gives you one static file you can drop into a `scratch` container. That single-binary deploy is a big reason people pick Go for backends." }
      ]
    },
    {
      id: "routing",
      title: "Routing — the enhanced ServeMux (Go 1.22)",
      level: "core",
      body: [
        { type: "p", text: "This is the signature modern feature. Patterns now take the form `[METHOD ][HOST]/PATH`, path segments can be **wildcards** `{name}`, and you read them with `r.PathValue(\"name\")`." },
        { type: "code", lang: "go", code: "mux := http.NewServeMux()\n\n// method + path — only matches GET\nmux.HandleFunc(\"GET /items/{id}\", func(w http.ResponseWriter, r *http.Request) {\n\tid := r.PathValue(\"id\")            // the {id} segment as a string\n\tfmt.Fprintf(w, \"item %s\\n\", id)\n})\n\nmux.HandleFunc(\"POST /items\", createItem)\nmux.HandleFunc(\"DELETE /items/{id}\", deleteItem)\n\n// trailing {rest...} captures everything left, incl. slashes\nmux.HandleFunc(\"GET /files/{path...}\", func(w http.ResponseWriter, r *http.Request) {\n\tfmt.Fprintln(w, r.PathValue(\"path\"))   // e.g. \"a/b/c.txt\"\n})" },
        { type: "table", headers: ["Pattern", "Matches"], rows: [
          ["`GET /items/{id}`", "GET (and HEAD) on `/items/anything`, one segment"],
          ["`/items/{id}`", "any method on that path"],
          ["`/files/{path...}`", "everything under `/files/`, slashes included"],
          ["`/posts/`", "any path with the `/posts/` prefix (subtree)"],
          ["`/posts/{$}`", "**only** `/posts/` exactly, not `/posts/x`"],
          ["`example.com/`", "host-specific routing"]
        ] },
        { type: "p", text: "**Precedence** was simplified to two rules: a pattern with a **host** wins over one without, and a more **specific** (method, path) pattern wins over a less specific one — regardless of registration order. `/items/latest` beats `/items/{id}`." },
        { type: "callout", variant: "gotcha", text: "Registering `GET` also registers `HEAD` automatically. Two patterns that overlap but neither is more specific (e.g. `/a/{x}/c` vs `/a/b/{y}`) cause a **panic at registration** — that's intentional, it catches ambiguous routes at startup." },
        { type: "callout", variant: "warn", text: "`PathValue` returns `\"\"` for an unknown wildcard name — a typo silently gives you an empty string, not an error. Wildcard values **are** URL-decoded: ServeMux unescapes each path segment, so `{id}` gives you the decoded value (an encoded `%2F` inside a segment is kept as a literal slash rather than splitting into a new segment)." },
        { type: "link", url: "https://go.dev/blog/routing-enhancements", text: "The Go blog — Routing Enhancements for Go 1.22 (authoritative)" }
      ]
    },
    {
      id: "json",
      title: "JSON with encoding/json",
      level: "core",
      body: [
        { type: "p", text: "Struct fields map to JSON via `json:` tags. Decode request bodies with a `json.Decoder` (streams from the `io.Reader`), encode responses with `json.NewEncoder(w).Encode(v)`." },
        { type: "code", lang: "go", code: "type User struct {\n\tID    int    `json:\"id\"`\n\tEmail string `json:\"email\"`\n\tName  string `json:\"name,omitempty\"`  // dropped when \"\"\n\tPwd   string `json:\"-\"`                // never serialized\n}\n\nfunc createUser(w http.ResponseWriter, r *http.Request) {\n\tvar in User\n\tdec := json.NewDecoder(r.Body)\n\tdec.DisallowUnknownFields()          // reject unexpected keys\n\tif err := dec.Decode(&in); err != nil {\n\t\thttp.Error(w, err.Error(), http.StatusBadRequest)\n\t\treturn\n\t}\n\n\tin.ID = 1\n\tw.Header().Set(\"Content-Type\", \"application/json\")\n\tw.WriteHeader(http.StatusCreated)\n\tjson.NewEncoder(w).Encode(in)\n}" },
        { type: "heading", text: "omitempty vs omitzero (Go 1.24)" },
        { type: "p", text: "`omitempty` omits values that are \"empty\" (`0`, `\"\"`, `nil`, and len-0 slices/maps). It has a famous blind spot: a zero `time.Time` is **not** empty, and a `struct` value is never empty. **Go 1.24** added `omitzero`, which omits a field when it equals its zero value — and honors a custom `IsZero() bool` method." },
        { type: "code", lang: "go", code: "type Event struct {\n\tName string    `json:\"name\"`\n\tAt   time.Time `json:\"at,omitzero\"`   // omitted when zero (1.24+)\n\t// with omitempty, a zero time serializes as \"0001-01-01T00:00:00Z\"\n}" },
        { type: "callout", variant: "tip", text: "Rule of thumb: keep `omitempty` for slices/maps (it drops empty ones), use `omitzero` for `time.Time`, nested structs, and numeric/bool fields where you want the zero value hidden." },
        { type: "callout", variant: "gotcha", text: "`json.Unmarshal` **ignores unknown fields by default** and leaves missing fields at their zero value — so you cannot tell \"absent\" from \"sent as 0/false\". Use a pointer (`*bool`) or `DisallowUnknownFields()` when that distinction matters." },
        { type: "callout", variant: "warn", text: "Only **exported** (capitalized) fields are marshaled. A lowercase field is silently skipped. And decoding into an untyped `map[string]any` turns every number into a `float64`." }
      ]
    },
    {
      id: "request",
      title: "Reading requests & validation",
      level: "core",
      body: [
        { type: "p", text: "Query params, headers, and form values all come off `*http.Request`. There is no stdlib validator — you validate by hand or reach for `go-playground/validator`." },
        { type: "code", lang: "go", code: "func search(w http.ResponseWriter, r *http.Request) {\n\tq := r.URL.Query().Get(\"q\")            // ?q=...\n\tlimit := r.URL.Query().Get(\"limit\")\n\tauth := r.Header.Get(\"Authorization\")\n\t_ = auth\n\n\tn, err := strconv.Atoi(limit)\n\tif err != nil || n < 1 || n > 100 {\n\t\tn = 20                             // clamp / default by hand\n\t}\n\tfmt.Fprintf(w, \"q=%q limit=%d\", q, n)\n}" },
        { type: "p", text: "For richer rules, the community standard is struct-tag validation:" },
        { type: "code", lang: "go", code: "// go get github.com/go-playground/validator/v10\ntype CreateUser struct {\n\tEmail string `json:\"email\" validate:\"required,email\"`\n\tName  string `json:\"name\"  validate:\"required,min=1,max=80\"`\n\tAge   int    `json:\"age\"   validate:\"gte=0,lte=150\"`\n}\n\nvar validate = validator.New()\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n\tvar in CreateUser\n\tjson.NewDecoder(r.Body).Decode(&in)\n\tif err := validate.Struct(in); err != nil {\n\t\thttp.Error(w, err.Error(), http.StatusUnprocessableEntity)\n\t\treturn\n\t}\n}" },
        { type: "callout", variant: "gotcha", text: "Always bound the body before decoding untrusted input: `r.Body = http.MaxBytesReader(w, r.Body, 1<<20)` caps it at 1 MB and returns a clean 413-style error instead of letting a client stream you out of memory." }
      ]
    },
    {
      id: "middleware",
      title: "Middleware — just handlers wrapping handlers",
      level: "core",
      body: [
        { type: "p", text: "Middleware is a function `func(http.Handler) http.Handler`. You wrap the next handler and return a new one. Compose them by nesting; no framework machinery needed." },
        { type: "code", lang: "go", code: "func Logging(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tstart := time.Now()\n\t\tnext.ServeHTTP(w, r)\n\t\tslog.Info(\"request\",\n\t\t\t\"method\", r.Method, \"path\", r.URL.Path,\n\t\t\t\"dur\", time.Since(start))\n\t})\n}\n\nfunc RequireAuth(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tif r.Header.Get(\"Authorization\") == \"\" {\n\t\t\thttp.Error(w, \"unauthorized\", http.StatusUnauthorized)\n\t\t\treturn\n\t\t}\n\t\tnext.ServeHTTP(w, r)\n\t})\n}\n\n// a tiny chain helper\nfunc chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {\n\tfor i := len(mws) - 1; i >= 0; i-- {\n\t\th = mws[i](h)\n\t}\n\treturn h\n}\n\nhandler := chain(mux, Logging, RequireAuth) // Logging runs outermost/first" },
        { type: "callout", variant: "tip", text: "To capture the status code for logging, wrap `http.ResponseWriter` in your own type that records the code passed to `WriteHeader`. That's the standard trick — the stdlib doesn't expose it." },
        { type: "callout", variant: "note", text: "Since 1.22 you can also apply middleware per route group by mounting a wrapped sub-mux, or globally by wrapping the top-level mux. Many teams stop at this pattern and never add a router library." }
      ]
    },
    {
      id: "context",
      title: "context.Context — cancellation & request values",
      level: "core",
      body: [
        { type: "p", text: "Every request carries a `context.Context` (`r.Context()`) that is **cancelled when the client disconnects**. Pass it to DB calls and outbound HTTP so work stops when the request goes away. Use it also to carry request-scoped values (user, request id) set by middleware." },
        { type: "code", lang: "go", code: "type ctxKey string\nconst userKey ctxKey = \"user\"\n\nfunc withUser(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tctx := context.WithValue(r.Context(), userKey, \"alice\")\n\t\tnext.ServeHTTP(w, r.WithContext(ctx))\n\t})\n}\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n\tuser, _ := r.Context().Value(userKey).(string)\n\n\t// propagate cancellation + a timeout to downstream work\n\tctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)\n\tdefer cancel()\n\trows, err := db.QueryContext(ctx, \"SELECT ...\")\n\t_ = rows; _ = err; _ = user\n}" },
        { type: "callout", variant: "gotcha", text: "Never use a plain `string` as a context key — use an **unexported named type** (`type ctxKey string`) so keys from different packages can't collide. Context values are for request-scoped data only, not for passing optional function arguments." }
      ]
    },
    {
      id: "slog",
      title: "Structured logging with log/slog (Go 1.21)",
      level: "core",
      body: [
        { type: "p", text: "`log/slog` is the modern structured logger built into the stdlib since 1.21. It replaces the old unstructured `log` package for services — you get leveled, key/value logs and JSON output for free." },
        { type: "code", lang: "go", code: "// JSON logs to stdout, the norm for containers\nlogger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{\n\tLevel: slog.LevelInfo,\n}))\nslog.SetDefault(logger)   // now the package-level slog.Info/Error use it\n\nslog.Info(\"server starting\", \"port\", 8080, \"env\", \"prod\")\nslog.Error(\"db failed\", \"err\", err, \"retry\", 3)\n\n// attach fields once, reuse — great per-request\nreqLog := slog.With(\"request_id\", rid, \"user\", user)\nreqLog.Info(\"handled\")\n\n// context-aware variant carries values a handler injected\nslog.InfoContext(r.Context(), \"processing\")" },
        { type: "table", headers: ["Want", "slog"], rows: [
          ["Human-readable dev logs", "`slog.NewTextHandler(os.Stderr, ...)`"],
          ["Machine JSON for prod", "`slog.NewJSONHandler(os.Stdout, ...)`"],
          ["Set global logger", "`slog.SetDefault(logger)`"],
          ["Pre-bind fields", "`logger.With(\"k\", v)`"],
          ["Group fields", "`slog.Group(\"http\", \"method\", m)`"]
        ] },
        { type: "callout", variant: "tip", text: "Prefer the typed attr constructors (`slog.Int`, `slog.String`, `slog.Duration`) in hot paths — the `\"key\", value` variadic form allocates and does runtime type work." }
      ]
    },
    {
      id: "server",
      title: "http.Server: timeouts & graceful shutdown",
      level: "core",
      body: [
        { type: "p", text: "`http.ListenAndServe` is fine for demos, but production wants an explicit `http.Server` with **timeouts** (the defaults are none — a slow client can hold a connection forever) and **graceful shutdown**." },
        { type: "code", lang: "go", code: "srv := &http.Server{\n\tAddr:              \":8080\",\n\tHandler:           handler,\n\tReadHeaderTimeout: 5 * time.Second,   // guards against Slowloris\n\tReadTimeout:       10 * time.Second,\n\tWriteTimeout:      15 * time.Second,\n\tIdleTimeout:       60 * time.Second,  // keep-alive reuse\n}\n\n// start in a goroutine so we can wait for a signal\ngo func() {\n\tif err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {\n\t\tslog.Error(\"listen\", \"err\", err)\n\t\tos.Exit(1)\n\t}\n}()\n\n// block until SIGINT/SIGTERM\nctx, stop := signal.NotifyContext(context.Background(),\n\tos.Interrupt, syscall.SIGTERM)\ndefer stop()\n<-ctx.Done()\n\n// drain: stop accepting, let in-flight requests finish (with a deadline)\nshutdownCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)\ndefer cancel()\nif err := srv.Shutdown(shutdownCtx); err != nil {\n\tslog.Error(\"graceful shutdown failed\", \"err\", err)\n}" },
        { type: "callout", variant: "warn", text: "`Shutdown` returns immediately for **hijacked** and **WebSocket** connections — it does not force them closed. Track long-lived connections yourself if you need them to drain, or they'll be cut when the process exits." },
        { type: "callout", variant: "note", text: "`ListenAndServe` always returns a non-nil error; on a clean `Shutdown` that error is `http.ErrServerClosed`, which you must treat as success (as above)." }
      ]
    },
    {
      id: "errors",
      title: "Errors: wrapping, Is & As",
      level: "core",
      body: [
        { type: "p", text: "Go errors are values. Wrap with `fmt.Errorf(\"...: %w\", err)` to preserve the chain, then inspect it with `errors.Is` (sentinel match) and `errors.As` (type match)." },
        { type: "code", lang: "go", code: "var ErrNotFound = errors.New(\"not found\")\n\nfunc getUser(id int) (*User, error) {\n\tu, err := db.lookup(id)\n\tif err != nil {\n\t\treturn nil, fmt.Errorf(\"getUser %d: %w\", id, err)  // wrap\n\t}\n\treturn u, nil\n}\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n\tu, err := getUser(1)\n\tif errors.Is(err, ErrNotFound) {          // matches anywhere in chain\n\t\thttp.Error(w, \"no such user\", http.StatusNotFound)\n\t\treturn\n\t}\n\tvar perr *pq.Error                        // pull a concrete type out\n\tif errors.As(err, &perr) {\n\t\tslog.Error(\"pg\", \"code\", perr.Code)\n\t}\n\t_ = u\n}" },
        { type: "callout", variant: "gotcha", text: "`%w` wraps (chain preserved, `errors.Is/As` see through it); `%v` or `%s` **flattens** to a string and loses the chain. Wrap at most once per layer, and don't wrap `sql.ErrNoRows` away — check it with `errors.Is(err, sql.ErrNoRows)`." }
      ]
    },
    {
      id: "database",
      title: "database/sql, drivers & pgx",
      level: "core",
      body: [
        { type: "p", text: "`database/sql` is a driver-agnostic interface with a built-in **connection pool**. You import a driver for its side-effect registration, then use the standard API. For Postgres the modern choice is **pgx**; `lib/pq` is the older, now maintenance-mode option." },
        { type: "code", lang: "go", code: "import (\n\t\"database/sql\"\n\t_ \"github.com/jackc/pgx/v5/stdlib\"  // registers \"pgx\" driver\n)\n\ndb, err := sql.Open(\"pgx\", \"postgres://user:pass@localhost:5432/app\")\nif err != nil { log.Fatal(err) }\ndb.SetMaxOpenConns(25)\ndb.SetMaxIdleConns(25)\ndb.SetConnMaxLifetime(5 * time.Minute)\nif err := db.PingContext(ctx); err != nil { log.Fatal(err) }" },
        { type: "code", lang: "go", code: "// query rows — ALWAYS pass a context, ALWAYS close rows\nrows, err := db.QueryContext(ctx,\n\t\"SELECT id, email FROM users WHERE active = $1\", true)\nif err != nil { return err }\ndefer rows.Close()\n\nvar users []User\nfor rows.Next() {\n\tvar u User\n\tif err := rows.Scan(&u.ID, &u.Email); err != nil { return err }\n\tusers = append(users, u)\n}\nif err := rows.Err(); err != nil { return err }  // check after the loop\n\n// single row\nvar u User\nerr = db.QueryRowContext(ctx,\n\t\"SELECT id, email FROM users WHERE id = $1\", id,\n).Scan(&u.ID, &u.Email)\nif errors.Is(err, sql.ErrNoRows) { /* 404 */ }" },
        { type: "callout", variant: "gotcha", text: "Placeholders are driver-specific: Postgres uses `$1, $2`, MySQL/SQLite use `?`. Always use placeholders — never `fmt.Sprintf` values into SQL (injection). And `sql.Open` does **not** connect; it lazily builds the pool, so `Ping` to verify the DSN at startup." },
        { type: "table", headers: ["Task", "API"], rows: [
          ["No rows returned", "`db.ExecContext` (INSERT/UPDATE/DELETE)"],
          ["One row", "`QueryRowContext(...).Scan(...)`"],
          ["Many rows", "`QueryContext` + `rows.Next()`/`Scan`"],
          ["Transaction", "`tx, _ := db.BeginTx(ctx, nil)` → `tx.Commit()`/`tx.Rollback()`"],
          ["Reduce boilerplate", "`sqlc` (generate typed code) or `sqlx`"]
        ] },
        { type: "callout", variant: "tip", text: "Many teams pair raw `database/sql` (or `pgx` directly) with **sqlc**, which generates fully-typed Go from your SQL — you get compile-time-checked queries without an ORM." }
      ]
    },
    {
      id: "structure",
      title: "Structuring a stdlib backend",
      level: "core",
      body: [
        { type: "p", text: "A common, framework-free layout: a `main` that only wires things up, a `Server`/handler struct holding dependencies, and route registration in one place. Closures over the struct give handlers access to the DB and logger without globals." },
        { type: "code", lang: "go", code: "type App struct {\n\tDB  *sql.DB\n\tLog *slog.Logger\n}\n\nfunc (a *App) routes() http.Handler {\n\tmux := http.NewServeMux()\n\tmux.HandleFunc(\"GET /users/{id}\", a.getUser)\n\tmux.HandleFunc(\"POST /users\", a.createUser)\n\treturn chain(mux, Logging, RequireAuth)\n}\n\n// handler is a METHOD, so it closes over a.DB / a.Log\nfunc (a *App) getUser(w http.ResponseWriter, r *http.Request) {\n\tid := r.PathValue(\"id\")\n\t_ = id\n}\n\nfunc main() {\n\tapp := &App{DB: mustOpenDB(), Log: slog.Default()}\n\thttp.ListenAndServe(\":8080\", app.routes())\n}" },
        { type: "callout", variant: "tip", text: "Mat Ryer's \"How I write HTTP services\" pattern is the widely-cited reference: a `NewServer(deps) http.Handler` constructor, handlers as closures returning `http.HandlerFunc`, and `run(ctx) error` for testable startup." },
        { type: "link", url: "https://grafana.com/blog/2024/02/09/how-i-write-http-services-in-go-after-13-years/", text: "Mat Ryer — How I write HTTP services in Go after 13 years" }
      ]
    },
    {
      id: "config",
      title: "Configuration",
      level: "deep",
      body: [
        { type: "p", text: "The stdlib way is just `os.Getenv` / `os.LookupEnv`, parsed into a typed struct at startup. `flag` covers CLI options. Reach for `caarlos0/env` or `viper` only when config grows." },
        { type: "code", lang: "go", code: "type Config struct {\n\tAddr        string\n\tDatabaseURL string\n\tDebug       bool\n}\n\nfunc loadConfig() (Config, error) {\n\tc := Config{\n\t\tAddr:        getenv(\"ADDR\", \":8080\"),\n\t\tDatabaseURL: os.Getenv(\"DATABASE_URL\"),\n\t\tDebug:       os.Getenv(\"DEBUG\") == \"true\",\n\t}\n\tif c.DatabaseURL == \"\" {\n\t\treturn c, errors.New(\"DATABASE_URL is required\")\n\t}\n\treturn c, nil\n}\n\nfunc getenv(k, def string) string {\n\tif v, ok := os.LookupEnv(k); ok { return v }\n\treturn def\n}" },
        { type: "callout", variant: "note", text: "Validate config at startup and fail fast (return an error from `run`, don't `log.Fatal` deep in the tree). Twelve-factor style: config from the environment, secrets never in the binary." }
      ]
    },
    {
      id: "testing",
      title: "Testing with net/http/httptest",
      level: "deep",
      body: [
        { type: "p", text: "`httptest.NewRecorder` lets you call a handler directly and inspect the response — no network. `httptest.NewServer` spins up a real loopback server for end-to-end tests. Table-driven tests are idiomatic." },
        { type: "code", lang: "go", code: "func TestGetUser(t *testing.T) {\n\treq := httptest.NewRequest(\"GET\", \"/users/42\", nil)\n\trr := httptest.NewRecorder()\n\n\t// go through the mux so PathValue(\"id\") is populated\n\tapp := &App{ /* fake deps */ }\n\tapp.routes().ServeHTTP(rr, req)\n\n\tif rr.Code != http.StatusOK {\n\t\tt.Fatalf(\"got %d, want 200\", rr.Code)\n\t}\n\tvar got User\n\tjson.NewDecoder(rr.Body).Decode(&got)\n\tif got.ID != 42 {\n\t\tt.Errorf(\"id = %d, want 42\", got.ID)\n\t}\n}" },
        { type: "callout", variant: "gotcha", text: "Calling a handler directly with `httptest.NewRequest` will leave `r.PathValue(\"id\")` empty because nothing set the wildcards. Route through your `ServeMux` (as above), or set them explicitly with `req.SetPathValue(\"id\", \"42\")` (Go 1.22+)." }
      ]
    },
    {
      id: "concurrency",
      title: "Concurrency: goroutines & sync",
      level: "deep",
      body: [
        { type: "p", text: "Each request is served in its own goroutine, so handlers can start more. Guard shared state with `sync` primitives. `sync.WaitGroup` waits for fan-out, `sync.Once` does one-time init, `sync.Mutex`/`RWMutex` protect maps and caches." },
        { type: "code", lang: "go", code: "type Cache struct {\n\tmu sync.RWMutex\n\tm  map[string]string\n}\n\nfunc (c *Cache) Get(k string) (string, bool) {\n\tc.mu.RLock(); defer c.mu.RUnlock()\n\tv, ok := c.m[k]; return v, ok\n}\nfunc (c *Cache) Set(k, v string) {\n\tc.mu.Lock(); defer c.mu.Unlock()\n\tc.m[k] = v\n}\n\n// fan out with a bounded errgroup (golang.org/x/sync/errgroup)\ng, ctx := errgroup.WithContext(r.Context())\nfor _, url := range urls {\n\turl := url\n\tg.Go(func() error { return fetch(ctx, url) })\n}\nif err := g.Wait(); err != nil { /* first error, others cancelled */ }" },
        { type: "callout", variant: "warn", text: "If a handler spawns a goroutine that outlives the request, **do not** use `r.Context()` for it — that context is cancelled when the response is sent. Use `context.Background()` (or `context.WithoutCancel(ctx)` in 1.21+) for detached work. Concurrent map writes without a lock crash the program with `fatal error: concurrent map writes`." }
      ]
    },
    {
      id: "deploy",
      title: "Deployment notes",
      level: "deep",
      body: [
        { type: "list", items: [
          "`CGO_ENABLED=0 go build -ldflags='-s -w'` produces a small, static binary — no libc dependency.",
          "Multi-stage Docker: build on `golang:1.24`, copy the binary into `scratch` or `gcr.io/distroless/static` — images end up a few MB.",
          "One process serves all cores; Go's scheduler handles goroutines. Scale out with more replicas behind a load balancer, not more workers.",
          "Put TLS termination at a proxy/load balancer, or serve directly with `srv.ListenAndServeTLS(cert, key)` / `autocert`.",
          "Set `GOMAXPROCS` to match container CPU limits (or use `automaxprocs`) so the runtime doesn't over-schedule."
        ] },
        { type: "code", lang: "bash", code: "# Dockerfile (multi-stage)\nFROM golang:1.24 AS build\nWORKDIR /src\nCOPY . .\nRUN CGO_ENABLED=0 go build -ldflags='-s -w' -o /app .\n\nFROM gcr.io/distroless/static\nCOPY --from=build /app /app\nEXPOSE 8080\nENTRYPOINT [\"/app\"]" }
      ]
    }
  ],

  packages: [
    { name: "net/http", why: "server, client, routing (1.22 ServeMux)" },
    { name: "encoding/json", why: "marshal/unmarshal, Decoder/Encoder" },
    { name: "context", why: "cancellation, deadlines, request values" },
    { name: "database/sql", why: "driver-agnostic DB + connection pool" },
    { name: "log/slog", why: "structured leveled logging (1.21+)" },
    { name: "errors / fmt", why: "wrapping with %w, errors.Is/As" },
    { name: "sync", why: "Mutex, RWMutex, WaitGroup, Once" },
    { name: "net/http/httptest", why: "handler & server testing" },
    { name: "github.com/jackc/pgx", why: "modern Postgres driver" },
    { name: "github.com/go-playground/validator", why: "struct-tag validation" },
    { name: "sqlc", why: "generate typed Go from SQL" },
    { name: "golang.org/x/sync/errgroup", why: "bounded concurrent fan-out" }
  ],

  gotchas: [
    "`http.Server` has **no timeouts by default** — always set `ReadHeaderTimeout`/`ReadTimeout`/`WriteTimeout`/`IdleTimeout` in production.",
    "`ListenAndServe`/`Serve` return `http.ErrServerClosed` on a clean `Shutdown` — treat that specific error as success.",
    "`r.PathValue(\"typo\")` returns `\"\"`, not an error — a mistyped wildcard name fails silently.",
    "`json.Unmarshal` ignores unknown fields and leaves missing ones at the zero value; use `*T` pointers or `DisallowUnknownFields()` to tell absent from zero.",
    "Only **exported** struct fields are (un)marshaled by `encoding/json`; lowercase fields are silently skipped.",
    "`omitempty` does NOT omit a zero `time.Time` or a struct — that's what `omitzero` (Go 1.24) is for.",
    "`sql.Open` doesn't connect; call `db.PingContext` to validate the DSN, and always `defer rows.Close()` + check `rows.Err()`.",
    "Use `%w` (not `%v`) to wrap errors, or `errors.Is/As` can't see the cause.",
    "Don't use `r.Context()` for goroutines that outlive the request — it's cancelled when the response is sent; use `context.Background()`.",
    "Concurrent writes to a shared map without a lock crash with `fatal error: concurrent map writes`."
  ],

  flashcards: [
    { q: "How do you match method + path and read a URL variable in Go 1.22+?", a: "Register `mux.HandleFunc(\"GET /items/{id}\", h)` and read it with `r.PathValue(\"id\")`. `GET` also auto-registers `HEAD`." },
    { q: "What are the two ServeMux precedence rules?", a: "Host presence wins over no host; a more **specific** (method, path) pattern wins over a less specific one — registration order doesn't matter." },
    { q: "What does a trailing `{name...}` wildcard do?", a: "It captures all remaining path segments, slashes included (e.g. `/files/{path...}`). `/x/{$}` matches only the exact trailing-slash path." },
    { q: "omitempty vs omitzero?", a: "`omitempty` omits 0/\"\"/nil/len-0 but not a zero `time.Time` or struct. `omitzero` (Go 1.24) omits any field equal to its zero value and honors `IsZero()`." },
    { q: "What does `%w` do in `fmt.Errorf`?", a: "It **wraps** the error, preserving the chain so `errors.Is` (sentinel) and `errors.As` (type) can inspect the cause. `%v`/`%s` flatten to a string and lose it." },
    { q: "How do you shut down an http.Server without dropping in-flight requests?", a: "Run `ListenAndServe` in a goroutine, wait on `signal.NotifyContext`, then call `srv.Shutdown(ctx)` with a deadline. Treat `http.ErrServerClosed` as success." },
    { q: "Why call `db.PingContext` after `sql.Open`?", a: "`sql.Open` only builds the pool lazily and doesn't connect, so it won't catch a bad DSN. `Ping` forces a real connection to fail fast at startup." },
    { q: "What is Go's stdlib structured logger and when was it added?", a: "`log/slog`, added in **Go 1.21** — leveled key/value logging with Text and JSON handlers; set global with `slog.SetDefault`." },
    { q: "Why not use a plain string as a context key?", a: "Keys from different packages could collide. Use an unexported named type (`type ctxKey string`) so keys are package-private and unique." },
    { q: "What is HTTP middleware in stdlib Go?", a: "A `func(http.Handler) http.Handler` that wraps the next handler — compose by nesting. No framework needed; the whole app is handlers wrapping handlers." }
  ],

  cheatsheet: [
    { label: "Init module", code: "go mod init github.com/me/app" },
    { label: "Method route", code: "mux.HandleFunc(\"GET /items/{id}\", h)" },
    { label: "Path variable", code: "id := r.PathValue(\"id\")" },
    { label: "Decode body", code: "json.NewDecoder(r.Body).Decode(&in)" },
    { label: "Write JSON", code: "json.NewEncoder(w).Encode(v)" },
    { label: "Structured log", code: "slog.Info(\"msg\", \"key\", val)" },
    { label: "Graceful stop", code: "srv.Shutdown(ctx)" },
    { label: "Query DB", code: "db.QueryContext(ctx, sql, args...)" }
  ]
});
