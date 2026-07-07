(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "laravel",
  name: "Laravel",
  language: "PHP",
  tagline: "The **full-stack PHP** framework: expressive routing, the **Eloquent** ORM, **Artisan** CLI, migrations, queues, and elegant developer ergonomics.",
  color: "#ff2d20",
  readMinutes: 20,

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "Laravel is a batteries-included MVC framework with a famously pleasant DX. The pillars: **Artisan** (CLI/codegen), **Eloquent** (Active Record ORM), **migrations**, a powerful **service container**, and starter kits for auth." },
        { type: "list", items: [
          "**Routing** → **Controller** → **Model (Eloquent)** → **View (Blade)** or JSON.",
          "The **service container** resolves dependencies (type-hint them and Laravel injects them).",
          "**Facades** give static-like access to services (`Cache::get(...)`, `DB::table(...)`).",
          "**Reach for it when:** you want a productive, cohesive full-stack PHP app with strong conventions."
        ] },
        { type: "callout", variant: "note", text: "Targets Laravel 11/12 (slim skeleton: no `Kernel.php`, config in `bootstrap/app.php`)." }
      ]
    },
    {
      id: "setup",
      title: "Project setup & Artisan",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "composer create-project laravel/laravel my-app\ncd my-app\nphp artisan serve                 # dev server :8000\n# .env is created automatically; generate the app key:\nphp artisan key:generate" },
        { type: "p", text: "**Artisan** is your primary tool — code generation, migrations, a REPL, and route inspection." },
        { type: "code", lang: "bash", code: "php artisan make:model Post -mcr   # model + migration + controller (resource)\nphp artisan make:controller PostController --api\nphp artisan make:migration create_posts_table\nphp artisan migrate\nphp artisan tinker                 # interactive REPL\nphp artisan route:list             # all registered routes" },
        { type: "callout", variant: "tip", text: "`make:model Post -mcr` scaffolds the model, its migration, and a resource controller in one command — the fastest way to start a feature." }
      ]
    },
    {
      id: "routing",
      title: "Routing",
      level: "core",
      body: [
        { type: "p", text: "Web routes live in `routes/web.php` (sessions, CSRF); API routes in `routes/api.php` (stateless, `/api` prefix). Enable API routes with `php artisan install:api` in Laravel 11+." },
        { type: "code", lang: "php", code: "// routes/api.php\nuse Illuminate\\Support\\Facades\\Route;\nuse App\\Http\\Controllers\\PostController;\n\nRoute::get('/posts/{post}', [PostController::class, 'show']);\nRoute::post('/posts', [PostController::class, 'store']);\n\n// one line for full REST CRUD:\nRoute::apiResource('posts', PostController::class);\n\n// groups: shared prefix + middleware\nRoute::middleware('auth:sanctum')->prefix('admin')->group(function () {\n    Route::get('/stats', [AdminController::class, 'stats']);\n});" },
        { type: "callout", variant: "tip", text: "**Route model binding:** type-hint `Post $post` and Laravel auto-fetches the model by the `{post}` id (404 if missing) — no manual lookup." }
      ]
    },
    {
      id: "controllers",
      title: "Controllers & requests",
      level: "core",
      body: [
        { type: "code", lang: "php", code: "class PostController extends Controller\n{\n    public function index() {\n        return Post::latest()->paginate(20);   // auto-JSON + pagination\n    }\n\n    public function show(Post $post) {          // route model binding\n        return $post;\n    }\n\n    public function store(Request $request) {\n        $data = $request->validate([\n            'title' => 'required|string|max:200',\n            'body'  => 'required|string',\n        ]);\n        return Post::create($data);\n    }\n}" },
        { type: "callout", variant: "tip", text: "Returning an Eloquent model or collection auto-serializes to JSON. Returning a paginator also includes pagination metadata." }
      ]
    },
    {
      id: "validation",
      title: "Validation & Form Requests",
      level: "core",
      body: [
        { type: "p", text: "Inline `$request->validate([...])` is quick; **Form Requests** move rules (and authorization) into a dedicated class for reuse." },
        { type: "code", lang: "bash", code: "php artisan make:request StorePostRequest" },
        { type: "code", lang: "php", code: "class StorePostRequest extends FormRequest\n{\n    public function authorize(): bool { return true; }\n    public function rules(): array {\n        return [\n            'title' => ['required', 'string', 'max:200'],\n            'body'  => ['required', 'string'],\n        ];\n    }\n}\n\n// inject it — validation runs automatically before the method body\npublic function store(StorePostRequest $request) {\n    return Post::create($request->validated());\n}" },
        { type: "callout", variant: "gotcha", text: "On validation failure Laravel returns **422** with JSON errors for API requests (or redirects back for web). No manual error handling needed." }
      ]
    },
    {
      id: "eloquent",
      title: "Eloquent ORM (signature feature)",
      level: "core",
      body: [
        { type: "p", text: "Eloquent is an Active Record ORM — each model maps to a table, each instance to a row. Rich, expressive query builder." },
        { type: "code", lang: "php", code: "// app/Models/Post.php\nclass Post extends Model\n{\n    protected $fillable = ['title', 'body', 'published'];   // mass-assignable\n    protected $casts = ['published' => 'boolean'];\n\n    public function author() {\n        return $this->belongsTo(User::class);\n    }\n    public function comments() {\n        return $this->hasMany(Comment::class);\n    }\n}" },
        { type: "code", lang: "php", code: "// queries\nPost::all();\nPost::find(1);\nPost::where('published', true)->orderBy('created_at', 'desc')->get();\nPost::where('title', 'like', '%laravel%')->first();\nPost::create(['title' => 'Hi', 'body' => '...']);\n$post->update(['title' => 'New']);\n$post->delete();\n\n// relationships\n$post->author;                 // lazy load\n$post->comments()->count();\nPost::with('author', 'comments')->get();   // eager load (avoids N+1)" },
        { type: "callout", variant: "warn", text: "**Mass assignment:** only `$fillable` fields can be set via `create()`/`update()` with an array. Omit a field and it's silently dropped; without `$fillable`/`$guarded` you get a `MassAssignmentException`." }
      ]
    },
    {
      id: "migrations",
      title: "Migrations, factories & seeders",
      level: "core",
      body: [
        { type: "code", lang: "php", code: "// database/migrations/xxxx_create_posts_table.php\npublic function up(): void {\n    Schema::create('posts', function (Blueprint $table) {\n        $table->id();\n        $table->string('title');\n        $table->text('body');\n        $table->boolean('published')->default(false);\n        $table->foreignId('user_id')->constrained()->cascadeOnDelete();\n        $table->timestamps();\n    });\n}" },
        { type: "code", lang: "bash", code: "php artisan migrate\nphp artisan migrate:rollback\nphp artisan migrate:fresh --seed   # drop all, re-migrate, run seeders" },
        { type: "code", lang: "php", code: "// factories generate fake data for tests/seeding\nPost::factory()->count(50)->create();\nPost::factory()->hasComments(3)->create();" }
      ]
    },
    {
      id: "eager-loading",
      title: "N+1 & eager loading",
      level: "core",
      body: [
        { type: "p", text: "Laravel's most common perf pitfall. Accessing a relationship inside a loop fires a query per row." },
        { type: "code", lang: "php", code: "// BAD: N+1 — one query per post for its author\nforeach (Post::all() as $post) {\n    echo $post->author->name;\n}\n\n// GOOD: eager load up front (2 queries total)\nforeach (Post::with('author')->get() as $post) {\n    echo $post->author->name;\n}" },
        { type: "callout", variant: "tip", text: "Call `Model::preventLazyLoading()` in dev (in a service provider) to throw whenever a lazy load happens — it surfaces every hidden N+1." }
      ]
    },
    {
      id: "api-resources",
      title: "API Resources (response shaping)",
      level: "core",
      body: [
        { type: "p", text: "Resources transform models into JSON — control exactly which fields and shapes go out (Laravel's equivalent of serializers)." },
        { type: "code", lang: "bash", code: "php artisan make:resource PostResource" },
        { type: "code", lang: "php", code: "class PostResource extends JsonResource\n{\n    public function toArray($request): array {\n        return [\n            'id'     => $this->id,\n            'title'  => $this->title,\n            'author' => new UserResource($this->whenLoaded('author')),\n        ];\n    }\n}\n\n// in the controller\nreturn PostResource::collection(Post::with('author')->paginate());" }
      ]
    },
    {
      id: "auth",
      title: "Auth — Sanctum & starter kits",
      level: "core",
      body: [
        { type: "p", text: "**Sanctum** is the go-to for SPA/API token auth; **Passport** for full OAuth2. Since Laravel 12, `laravel new` scaffolds an official **React**, **Vue**, or **Livewire** starter kit (auth + settings UI built in). Breeze/Jetstream still exist but were dropped from the installer." },
        { type: "callout", variant: "gotcha", text: "Sanctum has **two modes**: (1) **API tokens** — `createToken()` + `Authorization: Bearer`, for mobile/third-party clients; (2) **SPA auth** — cookie/session based with CSRF for a first-party SPA on the same top-level domain (set `SANCTUM_STATEFUL_DOMAINS`, hit `/sanctum/csrf-cookie`, then normal session login). Don't issue Bearer tokens to your own same-site SPA." },
        { type: "code", lang: "bash", code: "php artisan install:api        # installs Sanctum + api routes\n# issue a token after verifying credentials:" },
        { type: "code", lang: "php", code: "// login controller\n$user = User::where('email', $request->email)->first();\nif (!$user || !Hash::check($request->password, $user->password)) {\n    return response()->json(['message' => 'Invalid'], 401);\n}\n$token = $user->createToken('api')->plainTextToken;\nreturn ['token' => $token];\n\n// protect routes with the sanctum guard\nRoute::middleware('auth:sanctum')->get('/me', fn (Request $r) => $r->user());" }
      ]
    },
    {
      id: "container",
      title: "Service container, providers & facades",
      level: "deep",
      body: [
        { type: "p", text: "The **service container** is an IoC container: type-hint a dependency and Laravel resolves it. **Service providers** register bindings; **facades** are static proxies to container services." },
        { type: "code", lang: "php", code: "// bind an interface to an implementation (in a service provider)\n$this->app->bind(PaymentGateway::class, StripeGateway::class);\n\n// then just type-hint it anywhere — Laravel injects StripeGateway\npublic function __construct(private PaymentGateway $gateway) {}\n\n// facades: Cache::put(...), DB::table(...), Log::info(...)\nCache::remember('stats', 3600, fn () => expensiveQuery());" }
      ]
    },
    {
      id: "queues",
      title: "Queues, jobs & events",
      level: "deep",
      body: [
        { type: "p", text: "Offload slow work (emails, image processing) to **queued jobs**. Configure a driver (database, Redis) and run a worker." },
        { type: "code", lang: "bash", code: "php artisan make:job SendWelcomeEmail\nphp artisan queue:work            # run the worker (keep it running!)" },
        { type: "code", lang: "php", code: "// app/Jobs/SendWelcomeEmail.php\nclass SendWelcomeEmail implements ShouldQueue\n{\n    use Queueable, SerializesModels;   // model stored by id, re-fetched when the job runs\n\n    public function __construct(public User $user) {}\n\n    public function handle(): void {\n        Mail::to($this->user)->send(new WelcomeMail($this->user));\n    }\n}\n\n// dispatch from a controller/service:\nSendWelcomeEmail::dispatch($user);                       // push onto the queue\nSendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(5));\nSendWelcomeEmail::dispatch($user)->onQueue('emails');    // route to a named queue" },
        { type: "callout", variant: "gotcha", text: "Dispatched jobs do nothing until a **worker** is running (`queue:work`). Forgetting the worker (or to restart it after deploy) is a classic \"why didn't my email send?\" bug. Use **Horizon** for Redis queues + monitoring." }
      ]
    },
    {
      id: "blade",
      title: "Blade templating & other bits",
      level: "deep",
      body: [
        { type: "code", lang: "php", code: "{{-- resources/views/posts/show.blade.php --}}\n<h1>{{ $post->title }}</h1>          {{-- auto-escaped --}}\n@if ($post->published)\n  <span>Live</span>\n@endif\n@foreach ($post->comments as $c)\n  <p>{{ $c->body }}</p>\n@endforeach\n<x-layout>...</x-layout>            {{-- Blade component --}}" },
        { type: "list", items: [
          "**Events/Listeners** decouple side effects; **Notifications** send mail/SMS/Slack.",
          "**Task scheduling** in `routes/console.php` via `Schedule::command(...)->daily()`.",
          "**Telescope** for local debugging, **Pint** for code style, **Livewire/Inertia** for reactive UIs."
        ] }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Laravel favors **Pest** (or PHPUnit) with expressive HTTP + DB assertions." },
        { type: "code", lang: "php", code: "// Pest\nit('creates a post', function () {\n    $user = User::factory()->create();\n    $res = $this->actingAs($user)->postJson('/api/posts', [\n        'title' => 'Hi', 'body' => 'World',\n    ]);\n    $res->assertStatus(201);\n    $this->assertDatabaseHas('posts', ['title' => 'Hi']);\n});" }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "The failure modes that bite almost every Laravel app in production. Each has a boring, reliable fix." },

        { type: "heading", text: "N+1 queries hidden in Blade loops" },
        { type: "p", text: "A relationship accessed inside a loop (or a `@foreach` in Blade) fires one query per row. Ten posts each printing `$post->author->name` becomes 1 + 10 = 11 queries." },
        { type: "code", lang: "php", code: "// BAD: 1 + N queries — author loaded lazily on each iteration\n$posts = Post::latest()->get();\n// Blade view: @foreach ($posts as $post) {{ $post->author->name }} @endforeach\n\n// GOOD: eager load everything the view will touch (2 queries total)\n$posts = Post::with(['author', 'comments'])->latest()->get();\n\n// nested + loading onto an already-fetched model:\nPost::with('comments.author')->get();   // dot = nested relation\n$post->load('comments');                // load onto an existing instance\n$post->loadMissing('author');           // only if not already loaded" },
        { type: "callout", variant: "tip", text: "Fix: call `Model::preventLazyLoading(! app()->isProduction())` in `AppServiceProvider::boot()` — any lazy load then throws in dev/tests, surfacing every hidden N+1. Verify query counts with **Laravel Debugbar** or **Telescope**." },

        { type: "heading", text: "Mass assignment silently drops fields" },
        { type: "p", text: "`Model::create($request->all())` only sets columns listed in `$fillable`. A field you forgot to whitelist is dropped with no error; with neither `$fillable` nor `$guarded` defined you get a `MassAssignmentException`." },
        { type: "callout", variant: "gotcha", text: "Fix: keep an explicit `$fillable` whitelist and pass validated data, not raw input — `Post::create($request->validated())`. Avoid `$guarded = []` (allow-all) unless the input is fully trusted; it's how attackers slip in columns like `is_admin`." },

        { type: "heading", text: "env() returns null after config:cache" },
        { type: "p", text: "In production you run `php artisan config:cache` for speed. Once config is cached, `env()` returns **null everywhere except inside `config/*.php` files**. Code calling `env('STRIPE_KEY')` directly then works locally but breaks in prod." },
        { type: "code", lang: "php", code: "// config/services.php — env() is fine INSIDE config files\nreturn ['stripe' => ['key' => env('STRIPE_KEY')]];\n\n// anywhere else in the app, ALWAYS read through config():\n$key = config('services.stripe.key');   // survives config:cache\n// $key = env('STRIPE_KEY');            // returns null in prod!" },
        { type: "callout", variant: "warn", text: "Fix: never call `env()` outside `config/`. Read `config('...')` in app code. Note `route:cache` breaks any route defined with a closure — keep routes in controllers so caching works. Re-run cache commands (or `config:clear`) on each deploy." },

        { type: "heading", text: "Queues: no worker, sync driver, stale models" },
        { type: "p", text: "Three separate traps: (1) the default `QUEUE_CONNECTION=sync` runs jobs inline, so nothing is truly queued; (2) with a real driver, dispatched jobs do nothing until a long-running `queue:work` process is up — and it must restart on every deploy; (3) jobs use `SerializesModels`, storing only the model **id** and re-fetching on run — if the row was deleted meanwhile the job fails with `ModelNotFoundException`." },
        { type: "code", lang: "bash", code: "# .env — use a real driver, not sync\nQUEUE_CONNECTION=database          # or redis\nphp artisan make:queue-table && php artisan migrate   # for the database driver\n\nphp artisan queue:work --tries=3   # long-running worker (Supervisor/Horizon in prod)\nphp artisan queue:restart          # ask workers to exit after the current job (run on deploy)\nphp artisan queue:failed           # inspect the failed_jobs table\nphp artisan queue:retry all        # requeue failed jobs" },
        { type: "callout", variant: "gotcha", text: "Fix: run workers under Supervisor (or **Horizon** for Redis) so they auto-restart, add `queue:restart` to your deploy script, and monitor the `failed_jobs` table. Dispatch model **ids**, never unsaved models, into jobs." },

        { type: "heading", text: "Migrations: ordering, down(), and data loss" },
        { type: "list", items: [
          "**FK ordering:** a table with `foreignId()->constrained()` must migrate *after* the table it references — migrations run in filename-timestamp order, so name them accordingly.",
          "**down() correctness:** write a real inverse (`Schema::dropIfExists(...)` / drop the added column) so `migrate:rollback` actually reverses the change.",
          "**Data loss:** `migrate:fresh` and `migrate:refresh` drop **every** table — never against production. Change prod data with forward-only migrations."
        ] },
        { type: "callout", variant: "warn", text: "Fix: use `migrate:fresh --seed` locally/CI; in prod run only forward-only `php artisan migrate`. Laravel prompts for confirmation when the environment is `production` unless you pass `--force`, so keep that guard on." },

        { type: "heading", text: "Dates, timezones & JSON: lean on $casts" },
        { type: "p", text: "Eloquent returns raw strings for JSON columns and inconsistent types for dates unless you cast them. Store timestamps in UTC (`APP_TIMEZONE=UTC`) and convert with Carbon only when displaying." },
        { type: "code", lang: "php", code: "class Post extends Model\n{\n    protected $casts = [\n        'published_at' => 'datetime',   // -> Carbon instance\n        'meta'         => 'array',      // JSON column <-> PHP array\n        'published'    => 'boolean',\n    ];\n}\n\n// dates are now Carbon and JSON is a real array:\n$post->published_at->diffForHumans();               // \"3 hours ago\"\n$post->published_at->timezone('America/New_York');  // convert for display only\n$post->meta['tags'][] = 'php';                       // array access, re-encoded on save" },
        { type: "callout", variant: "tip", text: "Fix: cast every date column to `datetime` and every JSON column to `array`. Keep storage in UTC and convert at display time — mixing app timezones into the database is a debugging nightmare." },

        { type: "heading", text: "Validation: centralize with Form Requests" },
        { type: "callout", variant: "note", text: "Fix: past a couple of rules, move validation into a `FormRequest` (`php artisan make:request`) — it holds `rules()` + `authorize()`, runs automatically before the controller, and hands you clean `$request->validated()` data (never `$request->all()`) to pass into `create()`. This also closes the mass-assignment hole above." }
      ]
    }
  ],

  packages: [
    { name: "laravel/sanctum", why: "SPA/API token auth" },
    { name: "laravel/passport", why: "full OAuth2 server" },
    { name: "laravel/breeze", why: "minimal auth scaffolding" },
    { name: "laravel/jetstream", why: "richer auth + teams" },
    { name: "laravel/horizon", why: "Redis queue dashboard" },
    { name: "laravel/telescope", why: "local debug/insight" },
    { name: "spatie/laravel-permission", why: "roles & permissions" },
    { name: "pestphp/pest", why: "expressive testing" },
    { name: "laravel/pint", why: "opinionated code formatter" }
  ],

  gotchas: [
    "**Mass assignment:** fields must be in `$fillable` (or use `$guarded`) or `create()`/`update()` drops them / throws.",
    "**N+1 queries:** eager load with `->with('rel')`; use `preventLazyLoading()` in dev to catch them.",
    "Queued jobs need a running worker (`queue:work`) and a restart after deploy — otherwise they silently pile up.",
    "`routes/api.php` needs `php artisan install:api` in Laravel 11+ before it exists.",
    "`.env` is not read in cached config — after `config:cache` you must `config:clear` when changing env locally.",
    "Route model binding 404s automatically if the model isn't found — don't also null-check manually.",
    "Web routes are stateful (CSRF, sessions); API routes are stateless — use the right file.",
    "`env()` returns **null** outside `config/*.php` once `config:cache` runs in prod — read every value via `config('...')` in app code, never `env()`.",
    "`migrate:fresh`/`migrate:refresh` drop **every** table — never run them against production; use forward-only `php artisan migrate`.",
    "Queued jobs re-fetch Eloquent models by id via `SerializesModels` — a row deleted before the job runs throws `ModelNotFoundException`."
  ],

  flashcards: [
    { q: "What is Eloquent?", a: "Laravel's **Active Record ORM** — each model maps to a table, each instance to a row, with an expressive query builder and relationships." },
    { q: "What is `$fillable` and why does it matter?", a: "The list of **mass-assignable** columns. `create()`/`update()` with an array only sets fillable fields; others are dropped (or throw) — a security guard against mass assignment." },
    { q: "How do you avoid N+1 queries in Eloquent?", a: "Eager load relations with `Model::with('relation')->get()` instead of accessing them lazily in a loop." },
    { q: "What is route model binding?", a: "Type-hinting `Post $post` in a controller auto-resolves the model from the `{post}` route param (404 if not found) — no manual query." },
    { q: "What's the fastest way to scaffold a feature via Artisan?", a: "`php artisan make:model Post -mcr` — model + migration + resource controller in one command." },
    { q: "Sanctum vs Passport?", a: "**Sanctum** = lightweight SPA/API token auth (most common); **Passport** = full OAuth2 server." },
    { q: "Why isn't my queued job running?", a: "No worker is running — dispatched jobs only execute when `php artisan queue:work` is active (and restarted after deploys)." },
    { q: "Where do web vs API routes live and how do they differ?", a: "`routes/web.php` (stateful: sessions + CSRF) vs `routes/api.php` (stateless, `/api` prefix, token auth)." },
    { q: "Why does `env()` return null in production but work locally?", a: "Once `php artisan config:cache` runs, `env()` reads only work **inside `config/*.php`**. Everywhere else read `config('...')`; the cached config no longer parses `.env`." },
    { q: "What does `SerializesModels` do to a queued job's model?", a: "It stores only the model's **primary key**, then re-fetches a fresh instance from the DB when the job runs — so a row deleted in the meantime throws `ModelNotFoundException`." }
  ],

  cheatsheet: [
    { label: "New app", code: "composer create-project laravel/laravel app" },
    { label: "Scaffold", code: "php artisan make:model Post -mcr" },
    { label: "Migrate", code: "php artisan migrate" },
    { label: "REST routes", code: "Route::apiResource('posts', PostController::class)" },
    { label: "Validate", code: "$request->validate([...])" },
    { label: "Eager load", code: "Post::with('author')->get()" },
    { label: "Queue worker", code: "php artisan queue:work" },
    { label: "Restart workers", code: "php artisan queue:restart" },
    { label: "Cache config (prod)", code: "php artisan config:cache" },
    { label: "REPL", code: "php artisan tinker" }
  ]
});
