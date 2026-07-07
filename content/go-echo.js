(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "go-echo",
  name: "Go Echo",
  language: "Go",
  group: "Go",
  tagline: "High-performance, **batteries-included** Go web framework: a rich router, built-in middleware, binding & validation, and a handy `Context`.",
  color: "#00b5b8",
  readMinutes: 15,

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "Echo gives you more out of the box than the standard library: a fast radix-tree router, a unified `echo.Context`, request binding + validation, and a big set of official middleware (JWT, CORS, gzip, rate limit)." },
        { type: "list", items: [
          "**vs chi:** Echo is a *framework* with its own `Context` and helpers; chi sticks close to stdlib `net/http`.",
          "**Reach for it when:** you want productivity helpers (bind/validate/JWT) without assembling them yourself.",
          "Handlers return an `error`, which Echo funnels into a central error handler — clean and idiomatic."
        ] }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "mkdir myapi && cd myapi\ngo mod init github.com/me/myapi\ngo get github.com/labstack/echo/v4" },
        { type: "code", lang: "go", code: "// main.go\npackage main\n\nimport (\n\t\"net/http\"\n\t\"github.com/labstack/echo/v4\"\n\t\"github.com/labstack/echo/v4/middleware\"\n)\n\nfunc main() {\n\te := echo.New()\n\te.Use(middleware.Logger(), middleware.Recover())\n\n\te.GET(\"/\", func(c echo.Context) error {\n\t\treturn c.JSON(http.StatusOK, map[string]string{\"msg\": \"hello\"})\n\t})\n\n\te.Logger.Fatal(e.Start(\":8080\"))\n}" },
        { type: "callout", variant: "tip", text: "Run with live reload using `air` (github.com/air-verse/air) — `air` watches and rebuilds; standard for Go dev." },
        { type: "callout", variant: "note", text: "This deck targets **echo/v4** (stable, supported through end of 2026). **Echo v5** (`github.com/labstack/echo/v5`, released Jan 2026) is the new major line and reworks the middleware config API — check the migration guide before starting a fresh project on it." },
        { type: "heading", text: "Graceful shutdown" },
        { type: "p", text: "`e.Start` blocks. In production, run it in a goroutine and drain in-flight requests on `SIGINT`/`SIGTERM` — a Go must-know." },
        { type: "code", lang: "go", code: "go func() {\n\tif err := e.Start(\":8080\"); err != nil && err != http.ErrServerClosed {\n\t\te.Logger.Fatal(err)\n\t}\n}()\n\nquit := make(chan os.Signal, 1)\nsignal.Notify(quit, os.Interrupt, syscall.SIGTERM)\n<-quit\n\nctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\ndefer cancel()\nif err := e.Shutdown(ctx); err != nil {\n\te.Logger.Fatal(err)\n}" },
        { type: "callout", variant: "tip", text: "Treat `http.ErrServerClosed` as a normal shutdown, not an error." }
      ]
    },
    {
      id: "routing",
      title: "Routing, params & groups",
      level: "core",
      body: [
        { type: "code", lang: "go", code: "e.GET(\"/users/:id\", getUser)      // path param\ne.POST(\"/users\", createUser)\ne.PUT(\"/users/:id\", updateUser)\ne.DELETE(\"/users/:id\", deleteUser)\n\nfunc getUser(c echo.Context) error {\n\tid := c.Param(\"id\")             // path param (string)\n\tq := c.QueryParam(\"q\")          // ?q=...\n\treturn c.JSON(http.StatusOK, echo.Map{\"id\": id, \"q\": q})\n}\n\n// wildcard: /static/* -> c.Param(\"*\")" },
        { type: "p", text: "**Groups** share a prefix and middleware — the standard way to version APIs and protect route sets." },
        { type: "code", lang: "go", code: "api := e.Group(\"/api/v1\")\napi.Use(middleware.CORS())\n\nadmin := api.Group(\"/admin\", authMiddleware)  // group-level middleware\nadmin.GET(\"/stats\", stats)" }
      ]
    },
    {
      id: "binding",
      title: "Binding & validation",
      level: "core",
      body: [
        { type: "p", text: "`c.Bind` maps JSON/form/query/path into a struct using tags. Echo has no built-in validator — plug in `go-playground/validator`." },
        { type: "code", lang: "go", code: "type CreateUser struct {\n\tEmail string `json:\"email\" validate:\"required,email\"`\n\tName  string `json:\"name\"  validate:\"required,min=1,max=80\"`\n\tAge   int    `json:\"age\"   validate:\"gte=0,lte=150\"`\n}\n\nfunc createUser(c echo.Context) error {\n\tvar in CreateUser\n\tif err := c.Bind(&in); err != nil {\n\t\treturn echo.NewHTTPError(http.StatusBadRequest, \"invalid body\")\n\t}\n\tif err := c.Validate(&in); err != nil {\n\t\treturn echo.NewHTTPError(http.StatusBadRequest, err.Error())\n\t}\n\treturn c.JSON(http.StatusCreated, in)\n}" },
        { type: "code", lang: "go", code: "// wire the validator once (implements echo.Validator)\nimport \"github.com/go-playground/validator/v10\"\n\ntype CustomValidator struct{ v *validator.Validate }\nfunc (cv *CustomValidator) Validate(i any) error { return cv.v.Struct(i) }\n\ne.Validator = &CustomValidator{v: validator.New()}" },
        { type: "callout", variant: "gotcha", text: "`c.Bind` needs **exported** struct fields and correct `json` tags. Binding into a value (not a pointer) silently does nothing — always pass `&in`." }
      ]
    },
    {
      id: "responses",
      title: "Responses & context helpers",
      level: "core",
      body: [
        { type: "table", headers: ["Helper", "Sends"], rows: [
          ["`c.JSON(status, v)`", "JSON body"],
          ["`c.String(status, s)`", "plain text"],
          ["`c.NoContent(204)`", "empty response"],
          ["`c.Redirect(302, url)`", "redirect"],
          ["`c.File(path)` / `c.Attachment(...)`", "serve/download a file"],
          ["`c.Stream(status, type, r)`", "stream/SSE"]
        ] },
        { type: "code", lang: "go", code: "// read more from context\nc.Request()          // *http.Request\nc.Response()         // echo.Response (wraps ResponseWriter)\nc.Get(\"user\")        // value stashed by middleware\nc.Set(\"user\", u)     // stash for downstream handlers\nc.RealIP()\nc.Bind, c.FormValue, c.Cookie(\"session\")" }
      ]
    },
    {
      id: "middleware",
      title: "Middleware",
      level: "core",
      body: [
        { type: "p", text: "Echo ships a large official middleware set. Apply globally (`e.Use`), per-group, or per-route." },
        { type: "code", lang: "go", code: "import \"github.com/labstack/echo/v4/middleware\"\n\ne.Use(\n\tmiddleware.Logger(),\n\tmiddleware.Recover(),                 // recover from panics -> 500\n\tmiddleware.CORS(),\n\tmiddleware.Gzip(),\n\tmiddleware.RateLimiter(middleware.NewRateLimiterMemoryStore(20)),\n\tmiddleware.RequestID(),\n)" },
        { type: "p", text: "Custom middleware is a function that wraps the next handler:" },
        { type: "code", lang: "go", code: "func authMiddleware(next echo.HandlerFunc) echo.HandlerFunc {\n\treturn func(c echo.Context) error {\n\t\tif c.Request().Header.Get(\"Authorization\") == \"\" {\n\t\t\treturn echo.NewHTTPError(http.StatusUnauthorized)\n\t\t}\n\t\tc.Set(\"userID\", 42)      // pass data downstream\n\t\treturn next(c)\n\t}\n}\ne.Use(authMiddleware)" }
      ]
    },
    {
      id: "errors",
      title: "Centralized error handling",
      level: "core",
      body: [
        { type: "p", text: "Because handlers return `error`, you customize responses in **one** place via `e.HTTPErrorHandler`." },
        { type: "code", lang: "go", code: "e.HTTPErrorHandler = func(err error, c echo.Context) {\n\tcode := http.StatusInternalServerError\n\tmsg := \"internal error\"\n\tif he, ok := err.(*echo.HTTPError); ok {\n\t\tcode = he.Code\n\t\tmsg = fmt.Sprint(he.Message)\n\t}\n\tc.JSON(code, echo.Map{\"error\": msg})\n}" },
        { type: "callout", variant: "tip", text: "Return `echo.NewHTTPError(status, msg)` from anywhere; the central handler shapes the JSON. Keeps handlers thin." }
      ]
    },
    {
      id: "orm",
      title: "ORM: GORM",
      level: "core",
      body: [
        { type: "p", text: "GORM is the most-used Go ORM: struct models, auto-migration, associations, and a chainable query API." },
        { type: "code", lang: "bash", code: "go get gorm.io/gorm gorm.io/driver/postgres" },
        { type: "code", lang: "go", code: "type User struct {\n\tID    uint   `gorm:\"primaryKey\"`\n\tEmail string `gorm:\"uniqueIndex\"`\n\tName  string\n\tPosts []Post // has-many\n}\n\ndb, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})\ndb.AutoMigrate(&User{}, &Post{})   // dev-time schema sync\n\n// CRUD\ndb.Create(&user)\ndb.First(&user, id)                        // by primary key\ndb.Where(\"email = ?\", email).First(&user)\ndb.Preload(\"Posts\").Find(&users)           // eager load\ndb.Model(&user).Update(\"name\", \"New\")\ndb.Delete(&user, id)" },
        { type: "callout", variant: "gotcha", text: "GORM `Update`/`Updates` with a **struct** skips zero-value fields (0, \"\", false) — they won't be written. Use a `map[string]any` or `Select(...)` to force those columns." }
      ]
    },
    {
      id: "auth",
      title: "JWT auth",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "go get github.com/golang-jwt/jwt/v5 github.com/labstack/echo-jwt/v4" },
        { type: "code", lang: "go", code: "import echojwt \"github.com/labstack/echo-jwt/v4\"\n\n// protect a group: the middleware parses+verifies the token and,\n// on success, stashes the *jwt.Token under c.Get(\"user\").\nr := e.Group(\"/restricted\")\nr.Use(echojwt.WithConfig(echojwt.Config{\n\tSigningKey: []byte(os.Getenv(\"JWT_SECRET\")),   // HS256 secret\n\t// ContextKey: \"user\" (default), TokenLookup: \"header:Authorization,Bearer \"\n}))\n\nr.GET(\"\", func(c echo.Context) error {\n\ttoken := c.Get(\"user\").(*jwt.Token)          // set by the middleware\n\tclaims := token.Claims.(jwt.MapClaims)       // your custom claims\n\treturn c.JSON(http.StatusOK, echo.Map{\"sub\": claims[\"sub\"]})\n})" }
      ]
    },
    {
      id: "config",
      title: "Config & testing",
      level: "deep",
      body: [
        { type: "p", text: "Read config from env directly, or use **viper** for files + env + flags. Test handlers with `net/http/httptest`." },
        { type: "code", lang: "go", code: "func TestGetUser(t *testing.T) {\n\te := echo.New()\n\treq := httptest.NewRequest(http.MethodGet, \"/users/1\", nil)\n\trec := httptest.NewRecorder()\n\tc := e.NewContext(req, rec)\n\tc.SetParamNames(\"id\"); c.SetParamValues(\"1\")\n\n\tif assert.NoError(t, getUser(c)) {\n\t\tassert.Equal(t, http.StatusOK, rec.Code)\n\t}\n}" }
      ]
    },
    {
      id: "structure",
      title: "Project structure",
      level: "deep",
      body: [
        { type: "p", text: "A common layout (loosely the golang-standards style):" },
        { type: "code", lang: "text", code: "cmd/api/main.go          // entrypoint\ninternal/handler/        // echo handlers\ninternal/service/        // business logic\ninternal/repository/     // db access (gorm)\ninternal/model/          // structs\ninternal/middleware/\nconfig/" },
        { type: "callout", variant: "tip", text: "Keep business logic out of handlers. Handlers should bind+validate, call a service, and return. It makes testing and swapping frameworks trivial." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "Echo's sharp edges cluster around its `Context` abstraction: binding + validation wiring, and the fact that `echo.Context` is a **per-request, single-use** object." },

        { type: "heading", text: "1. c.Bind needs a registered Validator to validate" },
        { type: "p", text: "`c.Bind` only maps the request into your struct — it does **not** validate. `c.Validate` calls whatever you assigned to `e.Validator`; if you never set one, it **panics** at runtime. Wire it once at startup." },
        { type: "code", lang: "go", code: "import \"github.com/go-playground/validator/v10\"\n\n// 1. implement echo.Validator and register it ONCE\ntype CustomValidator struct{ v *validator.Validate }\nfunc (cv *CustomValidator) Validate(i any) error {\n\tif err := cv.v.Struct(i); err != nil {\n\t\t// surface a clean 400 instead of the raw validator error\n\t\treturn echo.NewHTTPError(http.StatusBadRequest, err.Error())\n\t}\n\treturn nil\n}\n\nfunc main() {\n\te := echo.New()\n\te.Validator = &CustomValidator{v: validator.New()}\n\t// ...\n}\n\n// 2. in the handler: bind THEN validate, both on a pointer\nfunc createUser(c echo.Context) error {\n\tvar in CreateUser\n\tif err := c.Bind(&in); err != nil {          // maps body/params\n\t\treturn echo.NewHTTPError(http.StatusBadRequest, \"invalid body\")\n\t}\n\tif err := c.Validate(&in); err != nil {      // runs the validator\n\t\treturn err                               // already an *echo.HTTPError\n\t}\n\treturn c.JSON(http.StatusCreated, in)\n}" },
        { type: "callout", variant: "gotcha", text: "Bind a **pointer** (`&in`); binding a value silently does nothing. `c.Bind` reads path and query params too (via `param:`/`query:` tags), but by default only for GET/DELETE — for a JSON body it uses `json` tags." },

        { type: "heading", text: "2. Params: c.Param vs c.QueryParam" },
        { type: "p", text: "Path segments declared with `:name` come from `c.Param`; URL query values come from `c.QueryParam`. Both return strings — convert and default by hand." },
        { type: "code", lang: "go", code: "// route: e.GET(\"/users/:id\", getUser)\nfunc getUser(c echo.Context) error {\n\tid, err := strconv.Atoi(c.Param(\"id\"))       // /users/:id path segment\n\tif err != nil {\n\t\treturn echo.NewHTTPError(http.StatusBadRequest, \"id must be an int\")\n\t}\n\n\tpage := c.QueryParam(\"page\")                  // ?page=... (\"\" if absent)\n\tif page == \"\" { page = \"1\" }\n\n\treturn c.JSON(http.StatusOK, echo.Map{\"id\": id, \"page\": page})\n}" },

        { type: "heading", text: "3. Middleware order & group scope" },
        { type: "p", text: "Echo runs middleware in registration order, so `Recover()` must come early to wrap everything after it. Middleware added to a `Group` applies only to that group's routes." },
        { type: "code", lang: "go", code: "e := echo.New()\ne.Use(middleware.Recover())        // FIRST: catches panics in all that follows\ne.Use(middleware.RequestID())\ne.Use(middleware.Logger())         // sees the request id set above\n\n// group-scoped middleware: auth applies only under /admin\nadmin := e.Group(\"/admin\", authMiddleware)\nadmin.GET(\"/stats\", stats)         // protected\ne.GET(\"/health\", health)           // NOT protected — outside the group" },
        { type: "callout", variant: "warn", text: "A global `e.Use(...)` added *after* you've defined routes still applies to them (Echo resolves middleware at request time), but relying on that is confusing — register global middleware before routes, and use groups for scoped middleware." },

        { type: "heading", text: "4. Return errors — don't write them ad hoc" },
        { type: "p", text: "Handlers return `error`; return `echo.NewHTTPError(status, msg)` and let the **central** `HTTPErrorHandler` shape the response. Don't mix `c.JSON(500, ...)` error responses with returned errors — pick one path (the returned-error path) so error formatting stays in one place." },
        { type: "code", lang: "go", code: "func (h *Handler) getUser(c echo.Context) error {\n\tu, err := h.svc.Find(c.Request().Context(), id)\n\tif errors.Is(err, ErrNotFound) {\n\t\treturn echo.NewHTTPError(http.StatusNotFound, \"user not found\")\n\t}\n\tif err != nil {\n\t\treturn err                    // 500 via the central handler; log there\n\t}\n\treturn c.JSON(http.StatusOK, u)\n}\n\n// one place decides how every error becomes JSON\ne.HTTPErrorHandler = func(err error, c echo.Context) {\n\tcode, msg := http.StatusInternalServerError, \"internal error\"\n\tif he, ok := err.(*echo.HTTPError); ok {\n\t\tcode, msg = he.Code, fmt.Sprint(he.Message)\n\t}\n\tif !c.Response().Committed {      // don't double-write a started response\n\t\tc.JSON(code, echo.Map{\"error\": msg})\n\t}\n}" },

        { type: "heading", text: "5. echo.Context is per-request — never use it in a goroutine" },
        { type: "p", text: "The `echo.Context` (`c`) is recycled after the handler returns; touching it from a goroutine that outlives the request is a use-after-free style bug (garbled data, panics). If you fan out, **copy the values you need** first, and detach from the request context so the goroutine isn't cancelled when the response is sent." },
        { type: "code", lang: "go", code: "func enqueue(c echo.Context) error {\n\t// copy primitives OUT of c before the goroutine starts\n\tuserID := c.Get(\"userID\").(int)\n\tpayload := c.QueryParam(\"job\")\n\n\t// detach: request ctx is cancelled once the response is written\n\tctx := context.WithoutCancel(c.Request().Context()) // Go 1.21+\n\n\tgo func() {\n\t\t// DO NOT touch c here. Use only the copied values + detached ctx.\n\t\tprocess(ctx, userID, payload)\n\t}()\n\n\treturn c.NoContent(http.StatusAccepted)\n}" },
        { type: "callout", variant: "note", text: "The general Go concurrency headaches — goroutine leaks, data races, `context` propagation, the typed-nil error — are covered in depth in the **Go Standard Library** deck's 'Common headaches' section. Echo handlers are ordinary Go, so all of it applies." }
      ]
    }
  ],

  packages: [
    { name: "labstack/echo/v4", why: "the framework" },
    { name: "echo/v4/middleware", why: "official middleware set" },
    { name: "gorm.io/gorm", why: "the standard ORM" },
    { name: "go-playground/validator", why: "struct validation" },
    { name: "golang-jwt/jwt/v5", why: "JWT tokens" },
    { name: "labstack/echo-jwt", why: "JWT middleware" },
    { name: "spf13/viper", why: "config management" },
    { name: "air-verse/air", why: "live reload in dev" }
  ],

  gotchas: [
    "`c.Bind(&s)` needs a **pointer** and exported fields with correct `json` tags — binding a value does nothing.",
    "Echo has no built-in validator; you must set `e.Validator` (e.g. go-playground/validator) or `c.Validate` panics.",
    "GORM struct updates skip zero-values (0/\"\"/false) — use a map or `Select` to update those fields.",
    "Middleware order matters: put `Recover()` early so it catches panics in later middleware/handlers.",
    "Don't forget `Recover()` — an unrecovered panic in a handler crashes the request (and can take the server down).",
    "`GORM AutoMigrate` is convenient but never drops/renames columns — use real migrations (golang-migrate) in prod.",
    "`echo.Context` is recycled after the handler returns — never touch `c` from a goroutine; copy the values you need and detach the context first.",
    "Return `echo.NewHTTPError(...)` and let `HTTPErrorHandler` render it — don't hand-write error JSON with `c.JSON` in one handler and returned errors in another.",
    "General Go concurrency headaches (goroutine leaks, races, context, typed-nil errors) live in the Go Standard Library deck — Echo handlers are plain Go."
  ],

  flashcards: [
    { q: "How do Echo handlers report errors?", a: "They **return an `error`**; Echo routes it to the central `HTTPErrorHandler`. Use `echo.NewHTTPError(status, msg)`." },
    { q: "What does `c.Bind(&s)` do and what does it require?", a: "Maps the request body/params into a struct via tags. Requires a **pointer** and exported fields with `json` tags." },
    { q: "Why doesn't `c.Validate` work by default?", a: "Echo has no built-in validator; you must assign `e.Validator` (commonly wrapping go-playground/validator)." },
    { q: "How do you apply middleware to only a set of routes?", a: "Create a `Group` with a prefix and pass middleware to it (`e.Group(\"/admin\", mw)` or `g.Use(mw)`)." },
    { q: "GORM gotcha when updating with a struct?", a: "Zero-value fields (0, \"\", false) are **skipped**; use a `map[string]any` or `Select` to write them." },
    { q: "Which middleware catches panics, and where should it go?", a: "`middleware.Recover()` — register it **early** so it wraps everything after it." },
    { q: "How do you pass data from middleware to a handler?", a: "`c.Set(\"key\", val)` in middleware, `c.Get(\"key\")` in the handler." },
    { q: "Can you use `echo.Context` inside a goroutine spawned by a handler?", a: "No — `c` is recycled once the handler returns. Copy the primitive values you need out of `c` first, and use a detached context (`context.WithoutCancel(c.Request().Context())`) so the goroutine isn't cancelled when the response is sent." },
    { q: "Where should `middleware.Recover()` sit in the chain?", a: "Register it **first** (before other middleware and routes). Echo runs middleware in registration order, so Recover only catches panics from whatever is registered after it." }
  ],

  cheatsheet: [
    { label: "New app", code: "go mod init … && go get github.com/labstack/echo/v4" },
    { label: "Route", code: "e.GET(\"/users/:id\", handler)" },
    { label: "Path param", code: "c.Param(\"id\")" },
    { label: "JSON reply", code: "return c.JSON(200, v)" },
    { label: "Bind body", code: "c.Bind(&in)" },
    { label: "Group + mw", code: "g := e.Group(\"/api\", mw)" },
    { label: "Error", code: "echo.NewHTTPError(404, \"...\")" },
    { label: "GORM eager", code: "db.Preload(\"Posts\").Find(&xs)" },
    { label: "Register validator", code: "e.Validator = &CustomValidator{...}" },
    { label: "Query param", code: "c.QueryParam(\"page\")" }
  ]
});
