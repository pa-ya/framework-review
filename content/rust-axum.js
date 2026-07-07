(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "rust-axum",
  name: "Rust Axum",
  language: "Rust",
  group: "Rust",
  tagline: "Ergonomic async web framework from the **Tokio** team — routing built on **extractors**, middleware via **Tower**, no macros required.",
  color: "#dea584",
  readMinutes: 18,

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "Axum is built on **Tokio** (async runtime), **Hyper** (HTTP), and **Tower** (middleware). Its defining idea: handlers are async functions whose **arguments are extractors** — Axum pulls each argument out of the request by its type. No custom context object, no attribute macros." },
        { type: "list", items: [
          "Handlers return anything implementing `IntoResponse`.",
          "Shared data flows through `State`; middleware are Tower `Layer`s.",
          "**Reach for it when:** you want Rust's performance/safety with a clean, type-driven API.",
          "The learning curve is Rust itself (ownership, `async`, trait bounds), not Axum."
        ] },
        { type: "callout", variant: "note", text: "Content targets **Axum 0.7/0.8** (uses `tokio::net::TcpListener` + `axum::serve`)." }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "cargo new myapi && cd myapi\ncargo add axum\ncargo add tokio --features full\ncargo add serde --features derive\ncargo add serde_json" },
        { type: "code", lang: "rust", code: "// src/main.rs\nuse axum::{routing::get, Router, Json};\nuse serde_json::json;\n\n#[tokio::main]\nasync fn main() {\n    let app = Router::new().route(\"/\", get(root));\n\n    let listener = tokio::net::TcpListener::bind(\"0.0.0.0:8080\").await.unwrap();\n    axum::serve(listener, app).await.unwrap();\n}\n\nasync fn root() -> Json<serde_json::Value> {\n    Json(json!({ \"msg\": \"hello\" }))\n}" },
        { type: "callout", variant: "tip", text: "Use `cargo watch -x run` for live reload (`cargo install cargo-watch`)." }
      ]
    },
    {
      id: "routing",
      title: "Routing",
      level: "core",
      body: [
        { type: "code", lang: "rust", code: "use axum::routing::{get, post};\n\nlet app = Router::new()\n    .route(\"/users\", get(list_users).post(create_user))\n    .route(\"/users/{id}\", get(get_user).delete(delete_user));\n\n// nest a sub-router under a prefix\nlet api = Router::new().route(\"/health\", get(health));\nlet app = Router::new().nest(\"/api/v1\", api);\n\n// merge two routers\nlet app = user_routes().merge(post_routes());" },
        { type: "callout", variant: "note", text: "Axum 0.8 changed the path param syntax from `/:id` to `/{id}` (curly braces). If you see `:id` in older tutorials, that's 0.7." }
      ]
    },
    {
      id: "extractors",
      title: "Extractors (the signature feature)",
      level: "core",
      body: [
        { type: "p", text: "Each handler argument is an **extractor** — its type tells Axum what to pull from the request. Add as many as you need." },
        { type: "code", lang: "rust", code: "use axum::extract::{Path, Query, Json, State};\nuse std::collections::HashMap;\nuse serde::Deserialize;\n\n#[derive(Deserialize)]\nstruct CreateUser { email: String, name: String }\n\n// Path param\nasync fn get_user(Path(id): Path<u64>) -> String {\n    format!(\"user {id}\")\n}\n\n// Query params\nasync fn search(Query(params): Query<HashMap<String, String>>) -> String {\n    format!(\"{:?}\", params)\n}\n\n// JSON body (validated by serde during extraction)\nasync fn create_user(Json(body): Json<CreateUser>) -> String {\n    body.email\n}" },
        { type: "table", headers: ["Extractor", "Pulls from"], rows: [
          ["`Path<T>`", "URL path params"],
          ["`Query<T>`", "query string"],
          ["`Json<T>`", "JSON body (must be **last** argument)"],
          ["`State<T>`", "shared app state"],
          ["`HeaderMap` / `TypedHeader`", "headers"],
          ["`Extension<T>`", "data injected by middleware"]
        ] },
        { type: "callout", variant: "gotcha", text: "**Order rule:** any body-consuming extractor (`Json`, `String`, `Bytes`, `Form`) must be the **last** argument — the body can only be read once. Put `State`, `Path`, `Query` before it." }
      ]
    },
    {
      id: "responses",
      title: "Responses & IntoResponse",
      level: "core",
      body: [
        { type: "p", text: "Return any type implementing `IntoResponse`. Tuples let you set status and headers." },
        { type: "code", lang: "rust", code: "use axum::http::StatusCode;\nuse axum::response::IntoResponse;\n\n// tuple: (status, body)\nasync fn create() -> impl IntoResponse {\n    (StatusCode::CREATED, Json(json!({ \"id\": 1 })))\n}\n\n// Result — Ok/Err both IntoResponse\nasync fn get_user(Path(id): Path<u64>) -> Result<Json<User>, StatusCode> {\n    let user = db_lookup(id).ok_or(StatusCode::NOT_FOUND)?;\n    Ok(Json(user))\n}" },
        { type: "table", headers: ["Return type", "Becomes"], rows: [
          ["`String` / `&str`", "200 text/plain"],
          ["`Json<T>`", "200 application/json"],
          ["`StatusCode`", "empty body with status"],
          ["`(StatusCode, T)`", "status + body"],
          ["`Result<T, E>`", "Ok or Err, both `IntoResponse`"]
        ] }
      ]
    },
    {
      id: "state",
      title: "Shared state",
      level: "core",
      body: [
        { type: "p", text: "Attach shared data (DB pool, config) with `.with_state(...)`, extract it with `State<T>`. Clone-cheap types (`Arc`, pools) are ideal." },
        { type: "code", lang: "rust", code: "#[derive(Clone)]\nstruct AppState { db: sqlx::PgPool }\n\nlet state = AppState { db: pool };\nlet app = Router::new()\n    .route(\"/users\", get(list_users))\n    .with_state(state);\n\nasync fn list_users(State(state): State<AppState>) -> Json<Vec<User>> {\n    let users = sqlx::query_as::<_, User>(\"SELECT * FROM users\")\n        .fetch_all(&state.db).await.unwrap();\n    Json(users)\n}" },
        { type: "callout", variant: "tip", text: "For shared **mutable** state, wrap it: `Arc<Mutex<T>>` (or `RwLock`). For pools/clients that are already `Clone + Send + Sync`, just store them directly." }
      ]
    },
    {
      id: "errors",
      title: "Error handling",
      level: "core",
      body: [
        { type: "p", text: "The idiomatic pattern: a custom error enum that implements `IntoResponse`, so handlers can use `?` and return `Result<_, AppError>`." },
        { type: "code", lang: "rust", code: "use axum::{http::StatusCode, response::{IntoResponse, Response}};\n\nenum AppError {\n    NotFound,\n    Db(sqlx::Error),\n}\n\nimpl IntoResponse for AppError {\n    fn into_response(self) -> Response {\n        let (status, msg) = match self {\n            AppError::NotFound => (StatusCode::NOT_FOUND, \"not found\"),\n            AppError::Db(_)   => (StatusCode::INTERNAL_SERVER_ERROR, \"db error\"),\n        };\n        (status, Json(json!({ \"error\": msg }))).into_response()\n    }\n}\n\n// enable ? from sqlx::Error\nimpl From<sqlx::Error> for AppError {\n    fn from(e: sqlx::Error) -> Self { AppError::Db(e) }\n}\n\nasync fn get_user(Path(id): Path<u64>, State(s): State<AppState>)\n    -> Result<Json<User>, AppError> {\n    let user = sqlx::query_as::<_, User>(\"SELECT * FROM users WHERE id = $1\")\n        .bind(id as i64).fetch_optional(&s.db).await?   // ? -> AppError::Db\n        .ok_or(AppError::NotFound)?;\n    Ok(Json(user))\n}" },
        { type: "callout", variant: "tip", text: "`thiserror` reduces boilerplate for library-style errors; `anyhow` is handy for app-level \"any error\" during prototyping." }
      ]
    },
    {
      id: "middleware",
      title: "Middleware via Tower",
      level: "core",
      body: [
        { type: "p", text: "Middleware are Tower **layers**. Use the ready-made ones from `tower-http`, or write your own with `middleware::from_fn`." },
        { type: "code", lang: "bash", code: "cargo add tower-http --features trace,cors,compression-full" },
        { type: "code", lang: "rust", code: "use tower_http::{trace::TraceLayer, cors::CorsLayer, compression::CompressionLayer};\n\nlet app = Router::new()\n    .route(\"/\", get(root))\n    .layer(TraceLayer::new_for_http())\n    .layer(CompressionLayer::new())\n    .layer(CorsLayer::permissive());" },
        { type: "code", lang: "rust", code: "// custom middleware\nuse axum::{middleware::{self, Next}, extract::Request, response::Response};\n\nasync fn auth(req: Request, next: Next) -> Result<Response, StatusCode> {\n    if req.headers().get(\"authorization\").is_none() {\n        return Err(StatusCode::UNAUTHORIZED);\n    }\n    Ok(next.run(req).await)\n}\n\nlet app = Router::new().route(\"/\", get(root))\n    .layer(middleware::from_fn(auth));" },
        { type: "callout", variant: "gotcha", text: "Layers apply **bottom-up / outside-in**: the last `.layer()` added is the outermost. Order affects which runs first — put tracing outermost, auth closer to the handler." }
      ]
    },
    {
      id: "orm",
      title: "ORM / DB: SQLx (and alternatives)",
      level: "core",
      body: [
        { type: "p", text: "**SQLx** is the most common with Axum: async, and it checks your SQL against the DB **at compile time** (with the `query!` macros). It's not a full ORM — you write SQL." },
        { type: "code", lang: "bash", code: "cargo add sqlx --features runtime-tokio,postgres,macros\ncargo add tokio --features full" },
        { type: "code", lang: "rust", code: "use sqlx::postgres::PgPoolOptions;\n\nlet pool = PgPoolOptions::new()\n    .max_connections(5)\n    .connect(&std::env::var(\"DATABASE_URL\")?).await?;\n\n#[derive(sqlx::FromRow, serde::Serialize)]\nstruct User { id: i64, email: String, name: String }\n\n// runtime-checked query\nlet users = sqlx::query_as::<_, User>(\"SELECT id, email, name FROM users\")\n    .fetch_all(&pool).await?;\n\n// compile-time checked (needs DATABASE_URL at build, or sqlx prepare)\nlet user = sqlx::query_as!(User, \"SELECT id, email, name FROM users WHERE id = $1\", id)\n    .fetch_one(&pool).await?;" },
        { type: "table", headers: ["Option", "Style"], rows: [
          ["**SQLx**", "async, SQL-first, compile-time checked queries"],
          ["**SeaORM**", "async, full ORM (entities, relations)"],
          ["**Diesel**", "sync, mature ORM, strong compile-time guarantees"]
        ] },
        { type: "callout", variant: "gotcha", text: "The `query!`/`query_as!` macros hit a live DB at compile time. In CI/offline builds run `cargo sqlx prepare` to cache query metadata in `.sqlx/`." }
      ]
    },
    {
      id: "auth",
      title: "JWT auth",
      level: "deep",
      body: [
        { type: "code", lang: "bash", code: "cargo add jsonwebtoken\ncargo add serde --features derive" },
        { type: "code", lang: "rust", code: "use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};\n\n#[derive(serde::Serialize, serde::Deserialize)]\nstruct Claims { sub: String, exp: usize }\n\n// sign\nlet token = encode(&Header::default(), &claims,\n    &EncodingKey::from_secret(secret))?;\n\n// verify inside a handler/extractor\nlet data = decode::<Claims>(&token,\n    &DecodingKey::from_secret(secret), &Validation::default())?;" },
        { type: "p", text: "For clean ergonomics, implement `FromRequestParts` on an `AuthUser` type so protected handlers just take `user: AuthUser` as an argument." },
        { type: "callout", variant: "note", text: "**Axum 0.8:** `FromRequestParts` / `FromRequest` no longer need `#[async_trait]` — implement the async method natively. (Also new in 0.8: `Option<T>` as an extractor now requires `T: OptionalFromRequestParts`.)" },
        { type: "code", lang: "rust", code: "use axum::{extract::FromRequestParts, http::{request::Parts, StatusCode}};\n\nstruct AuthUser { id: String }\n\nimpl<S: Send + Sync> FromRequestParts<S> for AuthUser {\n    type Rejection = StatusCode;\n    // no #[async_trait] in 0.8\n    async fn from_request_parts(parts: &mut Parts, _s: &S) -> Result<Self, Self::Rejection> {\n        let token = parts.headers.get(\"authorization\")\n            .and_then(|v| v.to_str().ok())\n            .and_then(|v| v.strip_prefix(\"Bearer \"))\n            .ok_or(StatusCode::UNAUTHORIZED)?;\n        let claims = verify(token).map_err(|_| StatusCode::UNAUTHORIZED)?;\n        Ok(AuthUser { id: claims.sub })\n    }\n}" }
      ]
    },
    {
      id: "config",
      title: "Config & tracing",
      level: "deep",
      body: [
        { type: "code", lang: "bash", code: "cargo add dotenvy\ncargo add tracing tracing-subscriber" },
        { type: "code", lang: "rust", code: "dotenvy::dotenv().ok();\ntracing_subscriber::fmt::init();\nlet db_url = std::env::var(\"DATABASE_URL\").expect(\"DATABASE_URL not set\");" }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Drive the router directly with `tower::ServiceExt::oneshot` — no network needed." },
        { type: "code", lang: "rust", code: "use tower::ServiceExt; // for .oneshot\nuse axum::body::Body;\nuse axum::http::{Request, StatusCode};\n\n#[tokio::test]\nasync fn health_ok() {\n    let app = Router::new().route(\"/health\", get(|| async { \"ok\" }));\n    let res = app.oneshot(\n        Request::builder().uri(\"/health\").body(Body::empty()).unwrap()\n    ).await.unwrap();\n    assert_eq!(res.status(), StatusCode::OK);\n}" }
      ]
    }
  ],

  packages: [
    { name: "axum", why: "the framework" },
    { name: "tokio (features=full)", why: "async runtime" },
    { name: "serde + serde_json", why: "(de)serialization" },
    { name: "tower-http", why: "trace/cors/compression layers" },
    { name: "sqlx", why: "async, compile-time-checked SQL" },
    { name: "sea-orm / diesel", why: "full ORM alternatives" },
    { name: "jsonwebtoken", why: "JWT" },
    { name: "thiserror / anyhow", why: "error ergonomics" },
    { name: "tracing + tracing-subscriber", why: "structured logging" },
    { name: "dotenvy", why: "load .env" }
  ],

  gotchas: [
    "Body extractors (`Json`, `String`, `Form`, `Bytes`) must be the **last** handler argument — the body is read once.",
    "Axum 0.8 uses `/{id}` path syntax; the older `/:id` is 0.7 — using it in 0.8 panics when the router is built (a runtime panic, not a compile error).",
    "Tower layers apply outside-in: the **last** `.layer()` is outermost — order changes execution order.",
    "`sqlx::query!` macros need a live DB at compile time; run `cargo sqlx prepare` for offline/CI builds.",
    "Handlers must be `Send + 'static`; holding a non-`Send` value across an `.await` won't compile.",
    "State type must be `Clone`; put expensive/shared things behind `Arc` and mutable state behind `Arc<Mutex<_>>`."
  ],

  flashcards: [
    { q: "What is an 'extractor' in Axum?", a: "A handler argument whose **type** tells Axum what to pull from the request (`Path`, `Query`, `Json`, `State`, headers…)." },
    { q: "What's the ordering rule for extractors?", a: "A body-consuming extractor (`Json`, `Form`, `String`, `Bytes`) must be the **last** argument — the body can only be consumed once." },
    { q: "How does a handler return a response?", a: "By returning any type implementing `IntoResponse` — `String`, `Json<T>`, `StatusCode`, `(StatusCode, T)`, or `Result<_, E>`." },
    { q: "How is shared state provided and consumed?", a: "`.with_state(state)` on the router; extract with `State<T>` (T must be `Clone`)." },
    { q: "How do you make `?` work in handlers?", a: "Define an error type implementing `IntoResponse` (+ `From` conversions), and return `Result<T, AppError>`." },
    { q: "What are Axum middleware built on?", a: "**Tower** layers — use `tower-http` layers or `middleware::from_fn`; the last `.layer()` is the outermost." },
    { q: "What makes SQLx special vs a typical ORM?", a: "It's SQL-first and can **check queries at compile time** against a real DB (`query!`/`query_as!` macros)." },
    { q: "How do you unit-test an Axum router without a network?", a: "`app.oneshot(request)` via `tower::ServiceExt`." }
  ],

  cheatsheet: [
    { label: "New app", code: "cargo add axum tokio -F tokio/full" },
    { label: "Router", code: "Router::new().route(\"/x\", get(h))" },
    { label: "Path param", code: "Path(id): Path<u64>" },
    { label: "JSON body", code: "Json(body): Json<T>  // last arg" },
    { label: "State", code: ".with_state(s) + State(s): State<T>" },
    { label: "Layer", code: ".layer(TraceLayer::new_for_http())" },
    { label: "Serve", code: "axum::serve(listener, app).await" },
    { label: "SQLx query", code: "sqlx::query_as!(User, \"…\", id).fetch_one(&pool)" }
  ]
});
