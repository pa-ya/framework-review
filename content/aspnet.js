(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "aspnet",
  name: "ASP.NET Core",
  language: "C#",
  group: "Others",
  navLabel: "ASP.NET",
  tagline: "Cross-platform, **high-performance** web framework for C#: minimal APIs or MVC controllers on the **Kestrel** server, with a unified hosting model, middleware pipeline, and built-in DI.",
  color: "#512bd4",
  readMinutes: 28,

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "**ASP.NET Core** is Microsoft's open-source, cross-platform web framework (Windows/Linux/macOS). It runs on **Kestrel**, a fast async HTTP server, and is consistently near the top of the TechEmpower benchmarks. It is a full rewrite of the old .NET Framework ASP.NET — modern code targets **.NET 8/9** with top-level `Program.cs` and no `Startup.cs`." },
        { type: "heading", text: "Two ways to build HTTP APIs" },
        { type: "table", headers: ["Style", "What it is", "Reach for it when"], rows: [
          ["**Minimal APIs**", "`app.MapGet(...)` route handlers registered directly on the app", "Small-to-medium services, microservices, prototypes; you want minimal ceremony"],
          ["**MVC Controllers**", "`[ApiController]` classes with attribute routing", "Large apps, teams that want convention/structure, model binding, filters, and built-in features like `[ApiController]` validation"]
        ] },
        { type: "p", text: "They are **not** mutually exclusive — you can mix both in one app. Both share the same core: the **middleware pipeline**, **built-in dependency injection**, configuration, and hosting." },
        { type: "heading", text: "The four pillars" },
        { type: "list", items: [
          "**Unified hosting model** — `WebApplication.CreateBuilder(args)` builds the app; `builder.Services` is the DI container, `app.Use...`/`app.Map...` build the pipeline.",
          "**Middleware pipeline** — every request flows through an ordered chain of middleware (routing, auth, your handlers).",
          "**Built-in DI** — first-class `IServiceCollection`; you register services and get constructor injection everywhere.",
          "**Configuration & options** — `appsettings.json` + environment variables + the strongly-typed Options pattern."
        ] },
        { type: "callout", variant: "tip", text: "**Choose ASP.NET Core when** you want a statically-typed, high-throughput backend with a batteries-included ecosystem (EF Core, Identity, Swagger, health checks) and excellent tooling. It scales from a single-file minimal API to a large layered enterprise app." }
      ]
    },
    {
      id: "csharp-essentials",
      title: "Modern C# essentials",
      level: "core",
      body: [
        { type: "p", text: "A tight tour of the C# features you'll use constantly. Modern C# (12+) is expressive and terse." },
        { type: "heading", text: "Types, var, and records" },
        { type: "code", lang: "csharp", code: "var count = 5;              // inferred int\nvar name = \"Ada\";          // inferred string\n\n// class: mutable reference type\npublic class User { public int Id { get; set; } public string Name { get; set; } = \"\"; }\n\n// record: immutable value-like type with built-in equality + `with` copies\npublic record Money(decimal Amount, string Currency);\nvar a = new Money(10, \"USD\");\nvar b = a with { Amount = 20 };   // non-destructive copy\nbool same = a == b;               // structural equality (false here)" },
        { type: "heading", text: "Nullable reference types" },
        { type: "p", text: "With `<Nullable>enable</Nullable>` (default in new projects), `string` is non-null and `string?` is nullable. The compiler warns on possible null dereferences." },
        { type: "code", lang: "csharp", code: "string required = \"x\";     // must not be null\nstring? maybe = null;      // explicitly nullable\nint len = maybe?.Length ?? 0;   // null-conditional + null-coalescing\nrequired = maybe ?? \"fallback\";" },
        { type: "heading", text: "async / await" },
        { type: "code", lang: "csharp", code: "public async Task<User?> GetUserAsync(int id)\n{\n    // await unwraps the Task; the method returns to the caller while I/O is pending\n    User? user = await db.Users.FindAsync(id);\n    return user;\n}" },
        { type: "callout", variant: "warn", text: "`async` methods return `Task`/`Task<T>` (or `ValueTask`). Return `Task` (not `void`) except for event handlers — `async void` swallows exceptions and can't be awaited." },
        { type: "heading", text: "LINQ (method + query syntax)" },
        { type: "code", lang: "csharp", code: "var nums = new[] { 1, 2, 3, 4, 5 };\n\n// method syntax (most common)\nvar evens = nums.Where(n => n % 2 == 0).Select(n => n * 10).ToList();\n\n// query syntax (equivalent, SQL-like)\nvar q = from n in nums where n % 2 == 0 select n * 10;\n\nvar total = nums.Sum();\nvar first = nums.FirstOrDefault(n => n > 3);   // 4, or default(int) if none" },
        { type: "heading", text: "Pattern matching & switch expressions" },
        { type: "code", lang: "csharp", code: "string Describe(object o) => o switch\n{\n    int n when n < 0 => \"negative int\",\n    int n           => $\"int {n}\",\n    string s        => $\"string of length {s.Length}\",\n    null            => \"null\",\n    _               => \"something else\"\n};\n\nif (o is User { Name: \"Ada\" } u) { /* property pattern binds u */ }" },
        { type: "heading", text: "Properties, using declarations, collection expressions" },
        { type: "code", lang: "csharp", code: "public class Account\n{\n    public string Id { get; init; } = \"\";   // init-only: set at construction only\n    public decimal Balance { get; private set; }\n    public string Display => $\"{Id}: {Balance}\";   // expression-bodied read-only\n}\n\n// using declaration: disposed at end of scope (no braces needed)\nusing var stream = File.OpenRead(\"data.txt\");\n\n// collection expressions (C# 12)\nint[] xs = [1, 2, 3];\nList<string> names = [\"a\", \"b\", ..otherNames];   // spread" }
      ]
    },
    {
      id: "setup",
      title: "Project setup & the SDK",
      level: "core",
      body: [
        { type: "p", text: "Install the **.NET SDK** (which includes the `dotnet` CLI and the runtime). Then scaffold a Web API project." },
        { type: "code", lang: "bash", code: "dotnet --version              # verify SDK\ndotnet new webapi -n MyApi    # scaffold a Web API (minimal API template)\ncd MyApi\ndotnet run                    # build + run\ndotnet watch                  # hot reload on file changes\n\n# add packages\ndotnet add package Microsoft.EntityFrameworkCore" },
        { type: "callout", variant: "note", text: "`dotnet new webapi` scaffolds minimal APIs by default in recent SDKs. Add `--use-controllers` (or the older `-controllers` behaviour) if you want MVC controllers instead." },
        { type: "heading", text: "The .csproj" },
        { type: "code", lang: "xml", code: "<Project Sdk=\"Microsoft.NET.Sdk.Web\">\n  <PropertyGroup>\n    <TargetFramework>net9.0</TargetFramework>\n    <Nullable>enable</Nullable>\n    <ImplicitUsings>enable</ImplicitUsings>\n  </PropertyGroup>\n  <ItemGroup>\n    <PackageReference Include=\"Microsoft.EntityFrameworkCore\" Version=\"9.0.0\" />\n  </ItemGroup>\n</Project>" },
        { type: "p", text: "`ImplicitUsings` auto-imports common namespaces (`System`, `System.Linq`, etc.) so you write far fewer `using` lines." },
        { type: "heading", text: "The modern Program.cs" },
        { type: "code", lang: "csharp", code: "var builder = WebApplication.CreateBuilder(args);\n\n// 1) register services in the DI container\nbuilder.Services.AddEndpointsApiExplorer();\nbuilder.Services.AddSwaggerGen();\nbuilder.Services.AddScoped<IUserService, UserService>();\n\nvar app = builder.Build();\n\n// 2) configure the middleware pipeline\nif (app.Environment.IsDevelopment())\n{\n    app.UseSwagger();\n    app.UseSwaggerUI();\n}\napp.UseHttpsRedirection();\n\n// 3) map endpoints\napp.MapGet(\"/health\", () => Results.Ok(\"healthy\"));\n\napp.Run();" },
        { type: "callout", variant: "tip", text: "There's no `Startup.cs` and no `Main` method to write. The two phases are clear: **register services** (`builder.Services`, before `Build()`) then **build the pipeline** (`app.Use...`, after `Build()`)." },
        { type: "heading", text: "appsettings.json" },
        { type: "code", lang: "json", code: "{\n  \"ConnectionStrings\": {\n    \"Default\": \"Host=localhost;Database=myapp;Username=postgres;Password=secret\"\n  },\n  \"Logging\": { \"LogLevel\": { \"Default\": \"Information\" } },\n  \"AllowedHosts\": \"*\"\n}" }
      ]
    },
    {
      id: "minimal-apis",
      title: "Minimal APIs",
      level: "core",
      body: [
        { type: "p", text: "Minimal APIs register route handlers directly on the app with `app.MapGet/MapPost/MapPut/MapDelete`. Handlers are just lambdas or methods; parameters are bound automatically." },
        { type: "heading", text: "Parameter binding" },
        { type: "p", text: "The framework infers where each parameter comes from:" },
        { type: "table", headers: ["Parameter", "Bound from"], rows: [
          ["Matches a route token (`{id}`)", "route value"],
          ["Simple type not in route", "query string"],
          ["Complex type (class/record)", "request body (JSON)"],
          ["Registered service", "DI container"],
          ["`HttpContext`, `HttpRequest`, `CancellationToken`", "the request context"]
        ] },
        { type: "heading", text: "Results / TypedResults" },
        { type: "code", lang: "csharp", code: "app.MapGet(\"/users/{id:int}\", (int id, IUserService svc) =>\n{\n    var user = svc.Find(id);\n    return user is null ? Results.NotFound() : Results.Ok(user);\n});\n\n// TypedResults is strongly typed (better for testing + OpenAPI)\napp.MapGet(\"/ping\", () => TypedResults.Ok(new { status = \"ok\" }));" },
        { type: "callout", variant: "tip", text: "Prefer `TypedResults.Ok(x)` over `Results.Ok(x)` when you can — it returns a concrete type you can assert on in unit tests and it improves OpenAPI metadata." },
        { type: "heading", text: "Route groups + full CRUD" },
        { type: "code", lang: "csharp", code: "var todos = app.MapGroup(\"/todos\");   // shared prefix + can attach filters/auth\n\ntodos.MapGet(\"/\", async (AppDbContext db) =>\n    await db.Todos.AsNoTracking().ToListAsync());\n\ntodos.MapGet(\"/{id:int}\", async (int id, AppDbContext db) =>\n    await db.Todos.FindAsync(id) is Todo t ? Results.Ok(t) : Results.NotFound());\n\ntodos.MapPost(\"/\", async (Todo input, AppDbContext db) =>\n{\n    db.Todos.Add(input);\n    await db.SaveChangesAsync();\n    return Results.Created($\"/todos/{input.Id}\", input);\n});\n\ntodos.MapPut(\"/{id:int}\", async (int id, Todo input, AppDbContext db) =>\n{\n    var todo = await db.Todos.FindAsync(id);\n    if (todo is null) return Results.NotFound();\n    todo.Title = input.Title;\n    todo.Done = input.Done;\n    await db.SaveChangesAsync();\n    return Results.NoContent();\n});\n\ntodos.MapDelete(\"/{id:int}\", async (int id, AppDbContext db) =>\n{\n    var todo = await db.Todos.FindAsync(id);\n    if (todo is null) return Results.NotFound();\n    db.Todos.Remove(todo);\n    await db.SaveChangesAsync();\n    return Results.NoContent();\n});" }
      ]
    },
    {
      id: "controllers",
      title: "MVC controllers",
      level: "core",
      body: [
        { type: "p", text: "Controllers group related endpoints into a class. Add `builder.Services.AddControllers()` and `app.MapControllers()` to wire them up." },
        { type: "code", lang: "csharp", code: "[ApiController]\n[Route(\"api/[controller]\")]   // -> /api/products\npublic class ProductsController : ControllerBase\n{\n    private readonly IProductService _svc;\n    public ProductsController(IProductService svc) => _svc = svc;   // ctor injection\n\n    [HttpGet]\n    public async Task<ActionResult<IEnumerable<Product>>> GetAll([FromQuery] string? search)\n        => Ok(await _svc.SearchAsync(search));\n\n    [HttpGet(\"{id:int}\")]\n    public async Task<ActionResult<Product>> Get(int id)\n    {\n        var p = await _svc.FindAsync(id);\n        return p is null ? NotFound() : Ok(p);\n    }\n\n    [HttpPost]\n    public async Task<ActionResult<Product>> Create([FromBody] CreateProductDto dto)\n    {\n        var created = await _svc.CreateAsync(dto);\n        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);\n    }\n}" },
        { type: "table", headers: ["Attribute", "Meaning"], rows: [
          ["`[ApiController]`", "Opts into API conventions: automatic 400 on invalid model, `[FromBody]` inference, attribute-routing required"],
          ["`[Route(\"api/[controller]\")]`", "Base route; `[controller]` token = class name minus 'Controller'"],
          ["`[HttpGet(\"{id}\")]`", "Verb + route template for the action"],
          ["`[FromBody]` / `[FromQuery]` / `[FromRoute]`", "Explicit binding source"],
          ["`ActionResult<T>`", "Return either an `IActionResult` (`NotFound()`) or a `T` value"]
        ] },
        { type: "callout", variant: "note", text: "**Controllers vs minimal APIs:** prefer controllers when you want automatic model-state validation, filters (`[Authorize]`, action filters), model binding conventions, and clear structure across many endpoints. Prefer minimal APIs for small, focused services and lower overhead." }
      ]
    },
    {
      id: "di",
      title: "Dependency injection",
      level: "core",
      body: [
        { type: "p", text: "ASP.NET Core has a built-in IoC container. You register services on `builder.Services` and receive them via **constructor injection** (in controllers/services) or as **handler parameters** (minimal APIs)." },
        { type: "heading", text: "The three lifetimes" },
        { type: "table", headers: ["Method", "Lifetime", "One instance per..."], rows: [
          ["`AddTransient<I, T>()`", "Transient", "**every resolution** (a new instance each time it's injected)"],
          ["`AddScoped<I, T>()`", "Scoped", "**HTTP request** (shared within one request, e.g. `DbContext`)"],
          ["`AddSingleton<I, T>()`", "Singleton", "**app lifetime** (one instance for the whole process)"]
        ] },
        { type: "code", lang: "csharp", code: "builder.Services.AddScoped<IOrderService, OrderService>();\nbuilder.Services.AddSingleton<IClock, SystemClock>();\nbuilder.Services.AddTransient<IEmailFactory, EmailFactory>();\n\n// consume via constructor\npublic class OrderService : IOrderService\n{\n    private readonly AppDbContext _db;\n    private readonly IClock _clock;\n    public OrderService(AppDbContext db, IClock clock) { _db = db; _clock = clock; }\n}" },
        { type: "heading", text: "The captive dependency pitfall" },
        { type: "p", text: "A **captive dependency** happens when a longer-lived service holds a reference to a shorter-lived one. A **Singleton** is created once and lives forever — if it injects a **Scoped** service (like `DbContext`), that scoped instance gets 'captured' and reused across all requests, defeating per-request isolation and causing bugs or crashes." },
        { type: "code", lang: "csharp", code: "// WRONG: Singleton captures a Scoped DbContext -> shared across all requests\nbuilder.Services.AddSingleton<CacheWarmer>();\npublic class CacheWarmer\n{\n    public CacheWarmer(AppDbContext db) { }   // DbContext is Scoped -> captured!\n}\n\n// RIGHT: inject IServiceScopeFactory and create a scope when you need the DbContext\npublic class CacheWarmer\n{\n    private readonly IServiceScopeFactory _scopes;\n    public CacheWarmer(IServiceScopeFactory scopes) => _scopes = scopes;\n\n    public async Task WarmAsync()\n    {\n        using var scope = _scopes.CreateScope();\n        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();\n        // use db within this scope only\n    }\n}" },
        { type: "callout", variant: "gotcha", text: "The container **validates scopes in Development** and will throw \"Cannot consume scoped service from singleton\". Trust that error — it's catching a real captive-dependency bug." }
      ]
    },
    {
      id: "ef-core",
      title: "Entity Framework Core",
      level: "core",
      body: [
        { type: "p", text: "**EF Core** is the standard ORM. You model tables as entity classes, expose them via `DbSet<T>` on a `DbContext`, and query with LINQ that EF translates to SQL." },
        { type: "heading", text: "DbContext & entities" },
        { type: "code", lang: "csharp", code: "public class Blog\n{\n    public int Id { get; set; }\n    public string Title { get; set; } = \"\";\n    public List<Post> Posts { get; set; } = new();   // one-to-many\n}\n\npublic class Post\n{\n    public int Id { get; set; }\n    public string Body { get; set; } = \"\";\n    public int BlogId { get; set; }        // FK\n    public Blog Blog { get; set; } = null!; // navigation\n}\n\npublic class AppDbContext : DbContext\n{\n    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}\n    public DbSet<Blog> Blogs => Set<Blog>();\n    public DbSet<Post> Posts => Set<Post>();\n\n    protected override void OnModelCreating(ModelBuilder mb)\n    {\n        // Fluent API config (alternative/complement to data annotations)\n        mb.Entity<Blog>().Property(b => b.Title).HasMaxLength(200).IsRequired();\n        mb.Entity<Post>()\n          .HasOne(p => p.Blog).WithMany(b => b.Posts)\n          .HasForeignKey(p => p.BlogId);\n    }\n}" },
        { type: "code", lang: "csharp", code: "// register with a provider (PostgreSQL via Npgsql here)\nbuilder.Services.AddDbContext<AppDbContext>(opt =>\n    opt.UseNpgsql(builder.Configuration.GetConnectionString(\"Default\")));" },
        { type: "callout", variant: "note", text: "`AddDbContext` registers the context as **Scoped** — one per request. Never make a `DbContext` a Singleton: it is **not thread-safe**." },
        { type: "heading", text: "Migrations" },
        { type: "code", lang: "bash", code: "dotnet tool install --global dotnet-ef      # one-time\ndotnet add package Microsoft.EntityFrameworkCore.Design\n\ndotnet ef migrations add InitialCreate       # generate migration from model diff\ndotnet ef database update                     # apply to the database\ndotnet ef migrations remove                   # undo last (if not applied)" },
        { type: "heading", text: "Querying — LINQ to SQL" },
        { type: "code", lang: "csharp", code: "// filtering/projection is translated to SQL and runs in the database\nvar recent = await db.Posts\n    .Where(p => p.Body.Contains(\"ef core\"))\n    .OrderByDescending(p => p.Id)\n    .Select(p => new { p.Id, p.Body })\n    .Take(10)\n    .ToListAsync();\n\n// eager loading related data with Include (avoids N+1)\nvar blogs = await db.Blogs\n    .Include(b => b.Posts)\n    .ToListAsync();\n\n// read-only queries: skip change tracking for speed + less memory\nvar names = await db.Blogs.AsNoTracking()\n    .Select(b => b.Title)\n    .ToListAsync();" },
        { type: "heading", text: "Change tracking & saving" },
        { type: "code", lang: "csharp", code: "var blog = await db.Blogs.FindAsync(1);   // tracked\nblog!.Title = \"Updated\";                  // EF detects the change\nawait db.SaveChangesAsync();              // issues UPDATE only for changed columns\n\ndb.Blogs.Add(new Blog { Title = \"New\" }); // INSERT on save\nawait db.SaveChangesAsync();" },
        { type: "callout", variant: "tip", text: "Use `AsNoTracking()` for any query whose results you only read and return. Change tracking has real overhead; skipping it is a common, cheap perf win for GET endpoints." }
      ]
    },
    {
      id: "validation",
      title: "Validation",
      level: "core",
      body: [
        { type: "p", text: "For simple rules, use **data annotations** on your DTOs. With `[ApiController]`, invalid model state automatically returns a **400** with a problem-details body — you don't write the check." },
        { type: "code", lang: "csharp", code: "public class CreateUserDto\n{\n    [Required, StringLength(80)]\n    public string Name { get; set; } = \"\";\n\n    [Required, EmailAddress]\n    public string Email { get; set; } = \"\";\n\n    [Range(0, 120)]\n    public int Age { get; set; }\n}\n\n// with [ApiController], this action never runs if the DTO is invalid -> auto 400\n[HttpPost]\npublic IActionResult Create([FromBody] CreateUserDto dto) => Ok(dto);" },
        { type: "callout", variant: "gotcha", text: "The automatic 400 is a feature of `[ApiController]` on **controllers**. Minimal APIs do **not** auto-validate — validate manually or use a library/endpoint filter." },
        { type: "heading", text: "FluentValidation for complex rules" },
        { type: "code", lang: "csharp", code: "// dotnet add package FluentValidation.AspNetCore\npublic class CreateUserValidator : AbstractValidator<CreateUserDto>\n{\n    public CreateUserValidator()\n    {\n        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);\n        RuleFor(x => x.Email).NotEmpty().EmailAddress();\n        RuleFor(x => x.Age).InclusiveBetween(0, 120);\n        RuleFor(x => x.Email)\n            .MustAsync(async (email, ct) => await IsUniqueAsync(email, ct))\n            .WithMessage(\"Email already registered\");\n    }\n}\n\n// register\nbuilder.Services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();" },
        { type: "callout", variant: "tip", text: "Reach for **FluentValidation** when rules involve cross-field logic, async checks (uniqueness), or conditional rules — it keeps validation out of your entities and DTOs and is easy to unit test." }
      ]
    },
    {
      id: "middleware",
      title: "The middleware pipeline",
      level: "core",
      body: [
        { type: "p", text: "Every request flows through an ordered chain of **middleware**. Each can inspect/modify the request, call `next()` to pass control on, then act on the response as it unwinds. **Order matters** — this is the #1 source of subtle bugs." },
        { type: "code", lang: "csharp", code: "// CORRECT ordering\napp.UseExceptionHandler(\"/error\"); // 1) outermost: catches everything below\napp.UseHttpsRedirection();\napp.UseStaticFiles();\napp.UseRouting();                  // 2) matches the endpoint\napp.UseCors();                     // after routing, before auth\napp.UseAuthentication();           // 3) WHO are you? (must come first)\napp.UseAuthorization();            // 4) are you ALLOWED? (needs the identity)\napp.MapControllers();              // 5) terminal: run the endpoint" },
        { type: "callout", variant: "warn", text: "`UseAuthentication` MUST come **before** `UseAuthorization`. Authentication establishes the identity; authorization checks it. Swap them and `[Authorize]` sees no user and rejects everything (or silently misbehaves)." },
        { type: "heading", text: "Custom middleware" },
        { type: "code", lang: "csharp", code: "// inline\napp.Use(async (context, next) =>\n{\n    var sw = System.Diagnostics.Stopwatch.StartNew();\n    await next();                  // call the rest of the pipeline\n    sw.Stop();\n    context.Response.Headers[\"X-Elapsed-ms\"] = sw.ElapsedMilliseconds.ToString();\n});\n\n// convention-based class\npublic class RequestLoggingMiddleware\n{\n    private readonly RequestDelegate _next;\n    public RequestLoggingMiddleware(RequestDelegate next) => _next = next;\n\n    public async Task InvokeAsync(HttpContext ctx, ILogger<RequestLoggingMiddleware> log)\n    {\n        log.LogInformation(\"--> {Method} {Path}\", ctx.Request.Method, ctx.Request.Path);\n        await _next(ctx);\n        log.LogInformation(\"<-- {Status}\", ctx.Response.StatusCode);\n    }\n}\napp.UseMiddleware<RequestLoggingMiddleware>();" },
        { type: "callout", variant: "gotcha", text: "If your middleware doesn't call `await next()`, it **short-circuits** the pipeline — nothing after it runs. That's intentional for things like auth challenges, but a bug if you forget it." }
      ]
    },
    {
      id: "auth",
      title: "Authentication & authorization",
      level: "core",
      body: [
        { type: "p", text: "**Authentication** = who you are; **authorization** = what you're allowed to do. The most common API pattern is **JWT bearer** tokens." },
        { type: "heading", text: "Configure JWT bearer" },
        { type: "code", lang: "csharp", code: "builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n    .AddJwtBearer(options =>\n    {\n        options.TokenValidationParameters = new TokenValidationParameters\n        {\n            ValidateIssuer = true,\n            ValidateAudience = true,\n            ValidateLifetime = true,           // reject expired tokens\n            ValidateIssuerSigningKey = true,\n            ValidIssuer = builder.Configuration[\"Jwt:Issuer\"],\n            ValidAudience = builder.Configuration[\"Jwt:Audience\"],\n            IssuerSigningKey = new SymmetricSecurityKey(\n                Encoding.UTF8.GetBytes(builder.Configuration[\"Jwt:Key\"]!))\n        };\n    });\n\nbuilder.Services.AddAuthorization();" },
        { type: "heading", text: "Issue a token" },
        { type: "code", lang: "csharp", code: "string CreateToken(User user, IConfiguration config)\n{\n    var claims = new[]\n    {\n        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),\n        new Claim(ClaimTypes.Name, user.Name),\n        new Claim(ClaimTypes.Role, user.Role)\n    };\n    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config[\"Jwt:Key\"]!));\n    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);\n    var token = new JwtSecurityToken(\n        issuer: config[\"Jwt:Issuer\"],\n        audience: config[\"Jwt:Audience\"],\n        claims: claims,\n        expires: DateTime.UtcNow.AddHours(1),\n        signingCredentials: creds);\n    return new JwtSecurityTokenHandler().WriteToken(token);\n}" },
        { type: "heading", text: "Protect endpoints & policies" },
        { type: "code", lang: "csharp", code: "// policy definition\nbuilder.Services.AddAuthorization(o =>\n{\n    o.AddPolicy(\"AdminOnly\", p => p.RequireRole(\"Admin\"));\n    o.AddPolicy(\"Over18\", p => p.RequireClaim(\"age\", \"18\", \"19\", \"20\"));\n});\n\n[Authorize]                          // any authenticated user\npublic class OrdersController : ControllerBase { }\n\n[Authorize(Policy = \"AdminOnly\")]    // must satisfy the policy\n[HttpDelete(\"{id}\")]\npublic IActionResult Delete(int id) => NoContent();\n\n// minimal API\napp.MapGet(\"/secret\", () => \"top secret\").RequireAuthorization(\"AdminOnly\");" },
        { type: "callout", variant: "note", text: "**ASP.NET Core Identity** is a full membership system (user store, password hashing, lockout, email confirmation, 2FA, external logins) built on EF Core. Use it when you manage your own users; use JWT bearer alone when tokens come from an external issuer (e.g. an identity provider like Auth0/Entra)." }
      ]
    },
    {
      id: "config-options",
      title: "Configuration & the Options pattern",
      level: "core",
      body: [
        { type: "p", text: "Configuration comes from layered sources, later ones overriding earlier: `appsettings.json` -> `appsettings.{Environment}.json` -> environment variables -> command-line args -> user secrets (in Development)." },
        { type: "code", lang: "csharp", code: "// read raw values\nvar conn = builder.Configuration.GetConnectionString(\"Default\");\nvar level = builder.Configuration[\"Logging:LogLevel:Default\"];" },
        { type: "heading", text: "The Options pattern" },
        { type: "p", text: "Bind a config section to a strongly-typed class and inject `IOptions<T>` — no magic strings scattered around your code." },
        { type: "code", lang: "csharp", code: "public class JwtOptions\n{\n    public string Issuer { get; set; } = \"\";\n    public string Audience { get; set; } = \"\";\n    public string Key { get; set; } = \"\";\n}\n\n// bind the \"Jwt\" section\nbuilder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(\"Jwt\"));\n\n// inject where needed\npublic class TokenService\n{\n    private readonly JwtOptions _opts;\n    public TokenService(IOptions<JwtOptions> opts) => _opts = opts.Value;\n}" },
        { type: "table", headers: ["Interface", "Use when"], rows: [
          ["`IOptions<T>`", "Singleton; value read once at startup (most common)"],
          ["`IOptionsSnapshot<T>`", "Scoped; re-reads per request (supports reload)"],
          ["`IOptionsMonitor<T>`", "Singleton with change notifications; use in singletons/background services"]
        ] },
        { type: "heading", text: "Environments & secrets" },
        { type: "code", lang: "bash", code: "# environment selection (Development / Staging / Production)\nexport ASPNETCORE_ENVIRONMENT=Development\n\n# never commit secrets — use user-secrets in dev\ndotnet user-secrets init\ndotnet user-secrets set \"Jwt:Key\" \"super-secret-signing-key\"\n\n# in production, set env vars (double underscore = section separator)\nexport ConnectionStrings__Default=\"Host=db;Database=prod;...\"\nexport Jwt__Key=\"...\"" },
        { type: "callout", variant: "warn", text: "Never store connection strings, JWT keys, or API secrets in `appsettings.json` committed to git. Use **user-secrets** locally and **environment variables** (or a secret manager) in production." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "**xUnit** is the de-facto test framework. Combine it with **Moq** for mocking and `WebApplicationFactory<Program>` for full in-process integration tests." },
        { type: "heading", text: "Unit test + Moq" },
        { type: "code", lang: "csharp", code: "public class OrderServiceTests\n{\n    [Fact]\n    public async Task Cancels_pending_order()\n    {\n        var repo = new Mock<IOrderRepository>();\n        repo.Setup(r => r.FindAsync(1)).ReturnsAsync(new Order { Id = 1, Status = \"Pending\" });\n\n        var svc = new OrderService(repo.Object);\n        var result = await svc.CancelAsync(1);\n\n        Assert.True(result);\n        repo.Verify(r => r.SaveAsync(It.IsAny<Order>()), Times.Once);\n    }\n}" },
        { type: "heading", text: "Integration test with WebApplicationFactory" },
        { type: "code", lang: "csharp", code: "// needs Microsoft.AspNetCore.Mvc.Testing; expose Program via `public partial class Program {}`\npublic class ApiTests : IClassFixture<WebApplicationFactory<Program>>\n{\n    private readonly HttpClient _client;\n    public ApiTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();\n\n    [Fact]\n    public async Task Health_returns_200()\n    {\n        var res = await _client.GetAsync(\"/health\");\n        Assert.Equal(HttpStatusCode.OK, res.StatusCode);\n    }\n}" },
        { type: "callout", variant: "tip", text: "`WebApplicationFactory` boots the real app in-memory with the real DI pipeline. Override services (e.g. swap the DB) with `factory.WithWebHostBuilder(b => b.ConfigureServices(...))`." },
        { type: "heading", text: "Testing EF Core" },
        { type: "code", lang: "csharp", code: "// SQLite in-memory: closest to real SQL behaviour (keeps the connection open!)\nvar conn = new SqliteConnection(\"DataSource=:memory:\");\nconn.Open();\nvar options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options;\nusing var db = new AppDbContext(options);\ndb.Database.EnsureCreated();" },
        { type: "callout", variant: "gotcha", text: "The **EF in-memory provider** is NOT a relational database — it ignores constraints, transactions, and SQL translation quirks. For anything realistic, prefer **SQLite in-memory** (or a real Postgres in a container via Testcontainers)." }
      ]
    },
    {
      id: "structure",
      title: "Project structure & layering",
      level: "deep",
      body: [
        { type: "p", text: "A pragmatic 'clean-architecture-lite' layering keeps concerns separate without over-engineering:" },
        { type: "list", items: [
          "**API layer** — controllers or minimal-API endpoints; HTTP concerns only, maps to/from DTOs.",
          "**Application/service layer** — business logic, orchestration, no HTTP or EF specifics leaking out.",
          "**Infrastructure layer** — EF Core `DbContext`, external clients, repositories; implements interfaces the application defines.",
          "**Domain** — entities and core rules."
        ] },
        { type: "heading", text: "DTOs vs entities" },
        { type: "p", text: "Never expose EF **entities** directly over HTTP. Map them to **DTOs** (data transfer objects). This decouples your API contract from the database schema, avoids over-posting/over-exposing fields, and prevents serialization cycles from navigation properties." },
        { type: "code", lang: "csharp", code: "// entity (internal)          // DTO (API contract)\npublic class User             public record UserDto(int Id, string Name);\n{ public int Id; public string Name; public string PasswordHash; }\n\n// map explicitly (or via a mapper library)\nUserDto ToDto(User u) => new(u.Id, u.Name);   // PasswordHash never leaves the server" },
        { type: "heading", text: "Organizing minimal API endpoints" },
        { type: "code", lang: "csharp", code: "// group endpoints into extension methods instead of a giant Program.cs\npublic static class TodoEndpoints\n{\n    public static RouteGroupBuilder MapTodos(this IEndpointRouteBuilder app)\n    {\n        var g = app.MapGroup(\"/todos\");\n        g.MapGet(\"/\", GetAll);\n        g.MapPost(\"/\", Create);\n        return g;\n    }\n    static async Task<IResult> GetAll(AppDbContext db) => Results.Ok(await db.Todos.ToListAsync());\n    static async Task<IResult> Create(Todo t, AppDbContext db) { /* ... */ return Results.Created(); }\n}\n\n// Program.cs stays tidy:\napp.MapTodos();" },
        { type: "callout", variant: "tip", text: "Stay pragmatic. For a small service, one project with folders is fine. Split into separate projects (API / Application / Infrastructure) only when the boundaries earn their keep." }
      ]
    },
    {
      id: "deployment",
      title: "Deployment",
      level: "deep",
      body: [
        { type: "heading", text: "dotnet publish" },
        { type: "code", lang: "bash", code: "# framework-dependent (needs .NET runtime on the host; small output)\ndotnet publish -c Release -o out\n\n# self-contained (bundles the runtime; larger, no install needed)\ndotnet publish -c Release -r linux-x64 --self-contained true\n\n# trimming + AOT (smallest, fastest startup; some reflection limits apply)\ndotnet publish -c Release -r linux-x64 -p:PublishAot=true" },
        { type: "callout", variant: "note", text: "**Framework-dependent** is the default and simplest. **Self-contained** avoids needing the runtime installed. **AOT/trimming** gives tiny images and instant startup but disallows some reflection-heavy features — validate your app works trimmed before shipping it." },
        { type: "heading", text: "Multi-stage Docker" },
        { type: "code", lang: "text", code: "# build stage: full SDK\nFROM mcr.microsoft.com/dotnet/sdk:9.0 AS build\nWORKDIR /src\nCOPY *.csproj .\nRUN dotnet restore\nCOPY . .\nRUN dotnet publish -c Release -o /app\n\n# runtime stage: slim runtime image only\nFROM mcr.microsoft.com/dotnet/aspnet:9.0\nWORKDIR /app\nCOPY --from=build /app .\nEXPOSE 8080\nENV ASPNETCORE_URLS=http://+:8080\nENTRYPOINT [\"dotnet\", \"MyApi.dll\"]" },
        { type: "callout", variant: "tip", text: "The multi-stage build keeps the SDK (large) out of the final image — you ship only the runtime image plus your published app." },
        { type: "heading", text: "Reverse proxy & health checks" },
        { type: "code", lang: "csharp", code: "// health checks\nbuilder.Services.AddHealthChecks()\n    .AddDbContextCheck<AppDbContext>();\napp.MapHealthChecks(\"/healthz\");\n\n// when behind nginx/traefik, honor forwarded headers for correct scheme/IP\napp.UseForwardedHeaders(new ForwardedHeadersOptions\n{\n    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto\n});" },
        { type: "callout", variant: "warn", text: "Kestrel is production-grade but usually sits **behind a reverse proxy** (nginx/Traefik/YARP) for TLS termination, buffering, and load balancing. Enable `UseForwardedHeaders` or your app sees the proxy's IP/scheme, breaking redirects and logging." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "heading", text: "Async deadlocks from .Result / .Wait()" },
        { type: "code", lang: "csharp", code: "// WRONG: blocking on async can deadlock (esp. in legacy sync contexts)\nvar user = GetUserAsync(id).Result;      // or .Wait() / .GetAwaiter().GetResult()\n\n// RIGHT: async all the way up\nvar user = await GetUserAsync(id);" },
        { type: "callout", variant: "gotcha", text: "**Async all the way.** Never block on a `Task` with `.Result`/`.Wait()` in request code — it ties up thread-pool threads and can deadlock. Make the whole call chain async." },
        { type: "heading", text: "EF change-tracking surprises & AsNoTracking" },
        { type: "p", text: "By default EF **tracks** every entity it materializes, so mutating a fetched object and calling `SaveChanges()` persists it — sometimes unexpectedly. For read-only queries, tracking wastes memory/CPU." },
        { type: "code", lang: "csharp", code: "// read-only GET: opt out of tracking\nvar list = await db.Products.AsNoTracking().ToListAsync();" },
        { type: "heading", text: "The N+1 query" },
        { type: "code", lang: "csharp", code: "// WRONG: lazy access inside a loop -> 1 query for blogs + N for posts\nvar blogs = await db.Blogs.ToListAsync();\nforeach (var b in blogs) { var count = b.Posts.Count; }   // N extra queries\n\n// RIGHT: eager-load with Include -> 1 (or 2) queries total\nvar blogs = await db.Blogs.Include(b => b.Posts).ToListAsync();" },
        { type: "heading", text: "Captive dependency & DbContext lifetime" },
        { type: "callout", variant: "gotcha", text: "Injecting a **Scoped** service (like `DbContext`) into a **Singleton** captures it and breaks per-request isolation. `DbContext` is Scoped and **not thread-safe** — never register it as a Singleton, and never share one instance across concurrent operations. Create a scope (`IServiceScopeFactory`) if a singleton needs it." },
        { type: "heading", text: "DateTime vs DateTimeOffset & UTC" },
        { type: "code", lang: "csharp", code: "// WRONG: ambiguous local time, DST bugs, wrong across timezones\nvar now = DateTime.Now;\n\n// RIGHT: store UTC; use DateTimeOffset to carry the offset explicitly\nvar nowUtc = DateTime.UtcNow;\nvar stamp = DateTimeOffset.UtcNow;   // unambiguous instant" },
        { type: "callout", variant: "tip", text: "Store timestamps in **UTC** and prefer `DateTimeOffset` for anything crossing timezones. PostgreSQL + Npgsql maps `timestamptz` to `DateTime` with `Kind=Utc` — mixing local `DateTime` there throws." },
        { type: "heading", text: "Middleware ordering bugs" },
        { type: "callout", variant: "gotcha", text: "Putting `UseAuthorization` **before** `UseAuthentication`, or registering exception handling too late, produces baffling 401s/500s. Fix the order: exception handler first, then routing, CORS, authentication, authorization, endpoints." },
        { type: "heading", text: "HttpClient disposal -> use IHttpClientFactory" },
        { type: "code", lang: "csharp", code: "// WRONG: new HttpClient per request -> socket exhaustion (TIME_WAIT sockets)\nusing var client = new HttpClient();\n\n// RIGHT: register a typed/named client, inject the factory-managed instance\nbuilder.Services.AddHttpClient(\"github\", c => c.BaseAddress = new Uri(\"https://api.github.com\"));\n\npublic class GitHubService\n{\n    private readonly HttpClient _http;\n    public GitHubService(IHttpClientFactory factory) => _http = factory.CreateClient(\"github\");\n}" },
        { type: "callout", variant: "warn", text: "Creating and disposing `HttpClient` per request exhausts sockets under load. Use **`IHttpClientFactory`** (or a single long-lived client) — it pools and rotates handlers correctly." }
      ]
    }
  ],

  packages: [
    { name: "Microsoft.EntityFrameworkCore", why: "The ORM: DbContext, LINQ-to-SQL, change tracking, migrations." },
    { name: "Microsoft.EntityFrameworkCore.Design", why: "Design-time support the `dotnet ef` CLI needs to scaffold and run migrations." },
    { name: "Npgsql.EntityFrameworkCore.PostgreSQL", why: "PostgreSQL provider for EF Core (`UseNpgsql`)." },
    { name: "Microsoft.AspNetCore.Authentication.JwtBearer", why: "Validate JWT bearer tokens (issuer/audience/lifetime/signing key)." },
    { name: "FluentValidation", why: "Expressive, testable validation for complex/async rules beyond data annotations." },
    { name: "Serilog.AspNetCore", why: "Structured logging with rich sinks (console, files, Seq, etc.)." },
    { name: "Swashbuckle.AspNetCore", why: "Generates Swagger/OpenAPI docs + interactive UI for your API." },
    { name: "xunit", why: "The standard .NET test framework (`[Fact]`, `[Theory]`)." },
    { name: "Moq", why: "Mocking library for isolating dependencies in unit tests." },
    { name: "Microsoft.AspNetCore.Mvc.Testing", why: "`WebApplicationFactory<Program>` for in-process integration tests." }
  ],

  gotchas: [
    "`DbContext` is **Scoped** and **not thread-safe** — never a Singleton, never shared across concurrent tasks.",
    "Injecting a Scoped service into a Singleton = **captive dependency**; the scope validator throws in Development.",
    "`UseAuthentication` must come **before** `UseAuthorization` — order in the pipeline is significant.",
    "Blocking on async with `.Result`/`.Wait()` can **deadlock** and starves the thread pool — go async all the way.",
    "Missing `Include` gives you the **N+1** query problem; missing `AsNoTracking()` wastes memory on read-only GETs.",
    "Minimal APIs do **not** auto-validate DTOs — only `[ApiController]` controllers return automatic 400s.",
    "New `HttpClient` per request exhausts sockets — use **`IHttpClientFactory`**.",
    "Use `DateTime.UtcNow`/`DateTimeOffset`, never `DateTime.Now`, for stored timestamps (DST + timezone bugs).",
    "Never expose EF entities directly over HTTP — map to **DTOs** to avoid over-posting and serialization cycles.",
    "Keep secrets out of `appsettings.json`; use user-secrets (dev) and env vars with `__` separators (prod)."
  ],

  flashcards: [
    { q: "Minimal APIs vs MVC controllers — when each?", a: "Minimal APIs for small/focused services with low ceremony (`app.MapGet`); controllers for larger apps needing model binding, filters, and automatic `[ApiController]` validation. You can mix both." },
    { q: "The three DI lifetimes?", a: "`AddTransient` = new instance every resolution; `AddScoped` = one per HTTP request (e.g. `DbContext`); `AddSingleton` = one for the whole app." },
    { q: "What is a captive dependency?", a: "A longer-lived service holding a shorter-lived one — e.g. a Singleton injecting a Scoped `DbContext`, which captures it across all requests. Fix: use `IServiceScopeFactory` to create a scope." },
    { q: "When and why use `AsNoTracking()`?", a: "For read-only queries. It skips EF's change tracking, saving memory and CPU — a cheap perf win on GET endpoints where you only read and return." },
    { q: "Correct middleware order for auth?", a: "`UseExceptionHandler` -> `UseRouting` -> `UseCors` -> `UseAuthentication` -> `UseAuthorization` -> endpoints. Authentication (who) must precede authorization (allowed?)." },
    { q: "What does the Options pattern give you?", a: "Strongly-typed config: `Configure<T>(section)` binds `appsettings.json` to a class, injected as `IOptions<T>` — no magic strings scattered in code." },
    { q: "How does JWT bearer validation work?", a: "`AddJwtBearer` with `TokenValidationParameters` checks issuer, audience, lifetime (expiry), and the signing key on each request; `[Authorize]` then requires a valid token." },
    { q: "Why does `.Result` cause an async deadlock?", a: "Blocking on a Task ties up a thread waiting for a continuation that may need that same context — deadlock. Fix: `await` all the way up the call chain." },
    { q: "What lifetime is `DbContext` and why?", a: "Scoped (one per request). It's not thread-safe and holds per-request change tracking state, so it must never be a Singleton or shared across concurrent work." },
    { q: "How do you fix the N+1 query problem in EF?", a: "Eager-load related data with `.Include(x => x.Children)` so it's fetched in one query instead of a separate query per parent." }
  ],

  cheatsheet: [
    { label: "New Web API", code: "dotnet new webapi -n MyApi" },
    { label: "Hot reload", code: "dotnet watch" },
    { label: "Map GET", code: "app.MapGet(\"/todos\", () => Results.Ok(list));" },
    { label: "Register scoped service", code: "builder.Services.AddScoped<ISvc, Svc>();" },
    { label: "Add migration", code: "dotnet ef migrations add InitialCreate" },
    { label: "Apply migrations", code: "dotnet ef database update" },
    { label: "Require auth", code: "[Authorize(Policy = \"AdminOnly\")]" },
    { label: "200 OK result", code: "return Results.Ok(user);" },
    { label: "Eager load", code: "db.Blogs.Include(b => b.Posts).ToList();" },
    { label: "Publish release", code: "dotnet publish -c Release -o out" }
  ]
});
