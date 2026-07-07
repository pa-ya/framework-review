(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "go-echo",
  name: "Go Echo",
  language: "Go",
  tagline: "High-performance, **batteries-included** Go web framework: a rich router, built-in middleware, binding & validation, and a handy `Context`.",
  color: "#00b5b8",
  readMinutes: 13,

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
        { type: "callout", variant: "tip", text: "Run with live reload using `air` (github.com/air-verse/air) — `air` watches and rebuilds; standard for Go dev." }
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
        { type: "code", lang: "go", code: "import echojwt \"github.com/labstack/echo-jwt/v4\"\n\n// protect a group\nr := e.Group(\"/restricted\")\nr.Use(echojwt.WithConfig(echojwt.Config{\n\tSigningKey: []byte(os.Getenv(\"JWT_SECRET\")),\n}))\n\nr.GET(\"\", func(c echo.Context) error {\n\ttoken := c.Get(\"user\").(*jwt.Token)\n\tclaims := token.Claims.(jwt.MapClaims)\n\treturn c.JSON(200, echo.Map{\"sub\": claims[\"sub\"]})\n})" }
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
    "`GORM AutoMigrate` is convenient but never drops/renames columns — use real migrations (golang-migrate) in prod."
  ],

  flashcards: [
    { q: "How do Echo handlers report errors?", a: "They **return an `error`**; Echo routes it to the central `HTTPErrorHandler`. Use `echo.NewHTTPError(status, msg)`." },
    { q: "What does `c.Bind(&s)` do and what does it require?", a: "Maps the request body/params into a struct via tags. Requires a **pointer** and exported fields with `json` tags." },
    { q: "Why doesn't `c.Validate` work by default?", a: "Echo has no built-in validator; you must assign `e.Validator` (commonly wrapping go-playground/validator)." },
    { q: "How do you apply middleware to only a set of routes?", a: "Create a `Group` with a prefix and pass middleware to it (`e.Group(\"/admin\", mw)` or `g.Use(mw)`)." },
    { q: "GORM gotcha when updating with a struct?", a: "Zero-value fields (0, \"\", false) are **skipped**; use a `map[string]any` or `Select` to write them." },
    { q: "Which middleware catches panics, and where should it go?", a: "`middleware.Recover()` — register it **early** so it wraps everything after it." },
    { q: "How do you pass data from middleware to a handler?", a: "`c.Set(\"key\", val)` in middleware, `c.Get(\"key\")` in the handler." }
  ],

  cheatsheet: [
    { label: "New app", code: "go mod init … && go get github.com/labstack/echo/v4" },
    { label: "Route", code: "e.GET(\"/users/:id\", handler)" },
    { label: "Path param", code: "c.Param(\"id\")" },
    { label: "JSON reply", code: "return c.JSON(200, v)" },
    { label: "Bind body", code: "c.Bind(&in)" },
    { label: "Group + mw", code: "g := e.Group(\"/api\", mw)" },
    { label: "Error", code: "echo.NewHTTPError(404, \"...\")" },
    { label: "GORM eager", code: "db.Preload(\"Posts\").Find(&xs)" }
  ]
});
