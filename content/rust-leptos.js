(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "rust-leptos",
  name: "Rust Leptos",
  language: "Rust",
  group: "Rust",
  tagline: "A **fullstack**, fine-grained reactive framework for the browser and the server — signals drive the DOM directly (no virtual DOM), and `#[server]` functions blur the client/server line.",
  color: "#e5397f",
  readMinutes: 34,

  sections: [
    {
      id: "overview",
      title: "Overview & the mental model",
      level: "core",
      body: [
        { type: "p", text: "Leptos is a Rust framework for building **reactive web UIs** — from a client-only SPA to a full server-rendered app with a shared codebase. Its defining idea is **fine-grained reactivity**: your UI is built from **signals** (reactive values), and when a signal changes, Leptos updates *exactly* the DOM nodes and attributes that read it. There is **no virtual DOM and no diffing** — the framework wired up those precise updates once, at first render." },
        { type: "list", items: [
          "**Reach for it when:** you want Rust end-to-end (share types/logic between client and server), SolidJS-style fine-grained reactivity, and strong performance with small WASM bundles.",
          "**Fullstack by design:** the same app compiles **twice** — a server binary (SSR) and a WASM client (hydration) — and `#[server]` functions let you call server code as if it were a local async function.",
          "**Mental model:** *signals are the source of truth*. Views are functions of signals; effects and the DOM subscribe to the signals they read; changing a signal re-runs only those subscribers. You describe relationships, not update steps."
        ] },
        { type: "table", headers: ["Concept", "React/JS analog", "Leptos"], rows: [
          ["Reactive state", "`useState`", "`signal()` / `RwSignal`"],
          ["Derived value", "`useMemo`", "a closure, or `Memo::new`"],
          ["Side effect", "`useEffect`", "`Effect::new`"],
          ["Re-render granularity", "component re-runs", "**only the exact node** that read the signal"],
          ["Data fetching", "React Query", "`Resource` + `<Suspense>`"],
          ["Backend call", "fetch()/tRPC", "`#[server]` function"]
        ] },
        { type: "callout", variant: "note", text: "This guide targets **Leptos 0.8** (current stable, MSRV Rust 1.88, edition 2021). The big rewrite was **0.6 → 0.7**, which introduced the `reactive_graph` engine, the `tachys` renderer, the `signal()` constructors (deprecating `create_*`), and the `path!()` router. 0.8 added Axum 0.8 support and nicer custom server-fn errors. Pin `0.8` for stability — a breaking `0.9` is in progress." },
        { type: "callout", variant: "tip", text: "Coming from an older tutorial? If you see `create_signal`, `create_resource`, `create_effect`, they're the **deprecated 0.6 names**. New code uses `signal()`, `Resource::new`, `Effect::new`. Also, everything imports from one prelude: `use leptos::prelude::*;`." }
      ]
    },
    {
      id: "reactivity",
      title: "Reactivity: signals, derived values, memos & effects",
      level: "core",
      body: [
        { type: "p", text: "Signals are the reactive atoms. In 0.7+ the default signal handles are **arena-allocated, `Copy + 'static`** — they don't own their data, they point into a reactive arena tied to the current owner. Because they're `Copy`, you can freely move the same signal into many closures without cloning." },
        { type: "code", lang: "rust", code: "use leptos::prelude::*;\n\n// split read/write handles — the idiomatic default\nlet (count, set_count) = signal(0);       // ReadSignal<i32>, WriteSignal<i32>\n\n// combined read+write handle\nlet total = RwSignal::new(0);             // RwSignal<i32>" },
        { type: "heading", text: "Reading & writing" },
        { type: "code", lang: "rust", code: "count.get();                 // reactive read (clones T) — subscribes the current context\ncount.get_untracked();       // read WITHOUT subscribing\nset_count.set(5);            // replace the value\nset_count.update(|n| *n += 1);  // mutate in place, notifies once\n\n// guard-based access (avoids cloning) — RAII guards\nlet g = count.read();        // read guard, derefs to &T, reactive\n*total.write() += 1;         // write guard, notifies when it drops\ncount.with(|v| println!(\"{v}\"));      // reactive borrow, no clone\ncount.with_untracked(|v| /* ... */ ());" },
        { type: "callout", variant: "gotcha", text: "`.read()`/`.write()` are backed by a `RefCell`: holding a `read()` guard while you `write()` the **same** signal (or two writes at once) panics at runtime with a borrow error. Keep guards short-lived, or prefer the closure forms `.with()` / `.update()`, which scope the borrow for you." },
        { type: "heading", text: "Derived signals & memos" },
        { type: "p", text: "A **derived signal is just a closure** — no macro, no allocation. It re-computes every time it's read and re-runs its own subscribers. When the computation is expensive, or you want to *skip* downstream updates when the output is unchanged, wrap it in a **`Memo`** (cached, only notifies when the result actually differs)." },
        { type: "code", lang: "rust", code: "let (count, set_count) = signal(2);\n\nlet double = move || count.get() * 2;       // derived signal: a plain closure\nlet memoized = Memo::new(move |_prev| expensive(count.get()));  // cached derived value\n\ndouble();          // 4\nmemoized.get();    // recomputes only when `count` changes AND the output differs" },
        { type: "heading", text: "Effects (side effects)" },
        { type: "p", text: "`Effect::new` runs a side effect whenever the signals it reads change — logging, syncing to `localStorage`, imperatively poking a canvas. Effects run on the **client**, generally not during SSR." },
        { type: "code", lang: "rust", code: "Effect::new(move |_prev| {\n    leptos::logging::log!(\"count is now {}\", count.get());  // re-runs on every change\n});" },
        { type: "callout", variant: "warn", text: "Reactivity only happens **inside a reactive context** (an effect, a memo, or a `view!` closure). Reading a signal in plain code just reads once. The #1 beginner bug: `{count.get()}` in a view reads *once*; write `{count}` or `{move || count.get()}` so the node subscribes and updates." },
        { type: "callout", variant: "note", text: "Need a value to **outlive its component**, be `Clone` instead of `Copy`, or cross threads on the server? Use the `Arc`-prefixed variants — `ArcRwSignal`, `ArcSignal`, `ArcMemo`, `ArcResource` — which are reference-counted rather than arena-tied." }
      ]
    },
    {
      id: "setup",
      title: "Project setup & the two-build model",
      level: "core",
      body: [
        { type: "p", text: "A fullstack Leptos app is **one crate compiled twice**: the **server** (feature `ssr`, an Axum/Actix binary that renders HTML and runs server functions) and the **client** (feature `hydrate`, a WASM bundle that attaches reactivity to that HTML). The **`cargo-leptos`** tool orchestrates both builds, plus the CSS/asset pipeline and hot reload." },
        { type: "code", lang: "bash", code: "# one-time: the build tool + the wasm target\ncargo install cargo-leptos --locked\nrustup target add wasm32-unknown-unknown\n\n# scaffold from the official Axum SSR template\ncargo leptos new --git leptos-rs/start-axum\ncd my-app\n\n# dev server with hot reload of BOTH server and wasm\ncargo leptos watch     # -> http://127.0.0.1:3000" },
        { type: "list", items: [
          "**Templates:** `start-axum` (SSR, the default), `start-axum-workspace` (split crates), `start-actix`, `start-aws`/`start-spin` (serverless). A **CSR-only SPA** uses **Trunk** instead of cargo-leptos.",
          "**`cargo leptos build | serve | watch | end-to-end`** — watch for dev, build/serve for prod, end-to-end runs Playwright tests.",
          "**Structure:** `src/app.rs` (your components + the `App` root + `shell`), `src/main.rs` (server entry, `#[cfg(feature=\"ssr\")]`), `src/lib.rs` (the `hydrate()` entry, `#[cfg(feature=\"hydrate\")]`), `style/`, `public/`."
        ] },
        { type: "callout", variant: "gotcha", text: "Server-only code (DB access, filesystem, secrets) must be gated so it never compiles into the WASM client — put it behind `#[cfg(feature = \"ssr\")]` or inside a `#[server]` function body (whose body only compiles on the server). Leaking a native-only crate into the `hydrate` build is a common first-day error." }
      ]
    },
    {
      id: "components",
      title: "Components & props",
      level: "core",
      body: [
        { type: "p", text: "A component is a plain function annotated with **`#[component]`** that returns `impl IntoView`. Props are its parameters; the macro generates a builder so callers pass them as attributes in `view!`. Component names are `PascalCase` and used like elements: `<ProgressBar/>`." },
        { type: "code", lang: "rust", code: "use leptos::prelude::*;\n\n#[component]\nfn ProgressBar(\n    #[prop(default = 100)] max: u16,        // used if the caller omits it\n    #[prop(into)] progress: Signal<i32>,     // accept a signal, RwSignal, or closure\n    #[prop(optional)] label: Option<String>, // optional -> defaults to None\n) -> impl IntoView {\n    view! {\n        <progress max=max value=progress></progress>\n        {label.map(|l| view! { <span>{l}</span> })}\n    }\n}\n\n// call site — omitted optional/default props are fine\n#[component]\nfn App() -> impl IntoView {\n    let (count, set_count) = signal(0);\n    view! {\n        <button on:click=move |_| set_count.update(|n| *n += 1)>\"+\"</button>\n        <ProgressBar progress=count/>\n    }\n}" },
        { type: "table", headers: ["Prop attribute", "Effect"], rows: [
          ["`#[prop(optional)]`", "prop defaults to `Default::default()`; strips one `Option` layer"],
          ["`#[prop(default = expr)]`", "use `expr` when the caller omits the prop"],
          ["`#[prop(into)]`", "accept anything `Into<T>` — lets one prop take a value, a signal, or a closure"],
          ["`children: Children`", "receive child views (a `Box<dyn FnOnce() -> AnyView>`)"]
        ] },
        { type: "code", lang: "rust", code: "// children: wrap arbitrary content\n#[component]\nfn Card(children: Children) -> impl IntoView {\n    view! { <div class=\"card\">{children()}</div> }\n}\n// <Card><h1>\"Hi\"</h1></Card>   // the <h1> becomes `children`" },
        { type: "callout", variant: "tip", text: "Use `#[prop(into)]` with the type-erased `Signal<T>` for maximum flexibility: the caller can pass a plain `T`, a `RwSignal<T>`, or a derived closure via `Signal::derive(move || ...)`, and the component doesn't care which." }
      ]
    },
    {
      id: "view",
      title: "The view! macro",
      level: "core",
      body: [
        { type: "p", text: "`view!` is an HTML-like macro that expands to a statically-typed view tree (the `tachys` renderer). Elements are real HTML tags; `{ }` interpolates Rust. A **signal or closure** in `{ }` is reactive — its node updates on change; a plain value is rendered once." },
        { type: "code", lang: "rust", code: "let (count, set_count) = signal(0);\nview! {\n    <p>\"Count: \" {count}</p>                  // signal -> reactive text node\n    <p>{move || count.get() * 2}</p>           // reactive closure\n\n    // events\n    <button on:click=move |_| set_count.update(|n| *n += 1)>\"+1\"</button>\n\n    // two-way input binding + typed target event\n    <input\n        prop:value=move || count.get().to_string()\n        on:input:target=move |ev| set_count.set(ev.target().value().parse().unwrap_or(0))\n    />\n}" },
        { type: "heading", text: "Attributes, classes & styles" },
        { type: "code", lang: "rust", code: "view! {\n    // reactive attribute (closure)\n    <a href=move || format!(\"/user/{}\", count.get())>\"profile\"</a>\n\n    // dynamic class — toggle one class reactively\n    <div class:active=move || count.get() > 0></div>\n    <div class=(\"is-high\", move || count.get() > 5)></div>   // hyphenated/dynamic name\n\n    // dynamic inline style\n    <div style:color=move || if count.get() > 0 { \"green\" } else { \"red\" }></div>\n    <div style=(\"width\", move || format!(\"{}px\", count.get()))></div>\n\n    // prefixes: prop: sets a JS DOM property, attr: forces an HTML attribute, bind: two-way binds\n    <input attr:disabled=true bind:value=some_rw_signal/>\n}" },
        { type: "heading", text: "Conditionals" },
        { type: "code", lang: "rust", code: "// <Show> memoizes the condition; both branches stay reactively clean\nview! {\n    <Show when=move || count.get() > 5 fallback=|| view! { <p>\"low\"</p> }>\n        <p>\"high!\"</p>\n    </Show>\n}\n\n// a plain if/else needs matching types -> unify with .into_any()\n{move || if count.get() % 2 == 0 {\n    view! { <p>\"even\"</p> }.into_any()\n} else {\n    view! { <p>\"odd\"</p> }.into_any()\n}}" },
        { type: "heading", text: "Lists with <For>" },
        { type: "p", text: "`<For>` renders a **keyed** list: give it a reactive collection and a stable, unique `key`, and it only re-renders rows whose key set changed (no re-diffing the whole list)." },
        { type: "code", lang: "rust", code: "view! {\n    <For\n        each=move || items.get()          // reactive Vec\n        key=|item| item.id                 // stable unique key\n        let:item                            // bind each element\n    >\n        <li>{item.name.clone()}</li>\n    </For>\n}" },
        { type: "callout", variant: "gotcha", text: "Signals are `Copy`, but **non-`Copy` captures** (a `String`, `Vec`, or struct) used in more than one `move ||` closure must be `.clone()`d first: `let name = name.clone(); move || { ... name ... }`. Otherwise you hit \"value moved into closure.\"" }
      ]
    },
    {
      id: "server-functions",
      title: "Server functions (#[server])",
      level: "core",
      body: [
        { type: "p", text: "A **`#[server]`** function is the killer feature: you write one async Rust function, and Leptos generates a **server endpoint** plus a **client stub** with the same signature. Call it from the client and it becomes an HTTP request; the **body only compiles and runs on the server**, so it can touch the database, filesystem or secrets safely." },
        { type: "code", lang: "rust", code: "use leptos::prelude::*;\nuse leptos::server_fn::error::ServerFnError;\n\n#[server]\npub async fn add_todo(title: String) -> Result<(), ServerFnError> {\n    // server-only: this code is stripped from the WASM client\n    let mut conn = db().await?;\n    sqlx::query!(\"INSERT INTO todos (title) VALUES (?)\", title)\n        .execute(&mut conn).await?;\n    Ok(())\n}\n\n// call it anywhere (client or server) with the same signature:\n// spawn_local(async move { add_todo(\"buy milk\".into()).await.unwrap(); });" },
        { type: "list", items: [
          "**Serialization:** arguments and the `Ok` value must be `Serialize`/`Deserialize` (JSON POST by default). Override with `#[server(input = Cbor, output = Json)]`; encodings include `Json`, `Cbor`, `GetUrl`, multipart, and streaming/WebSocket (0.8).",
          "**Registration is automatic** when the module is compiled into the server binary and you build the route list with `generate_route_list` (see Rendering modes).",
          "**Errors:** the default `Result<T, ServerFnError>` carries the error to the client. **0.8** lets you return `Result<T, YourError>` for any `YourError: FromServerFnError` — clean typed errors instead of stringly boxing.",
          "**Where it runs:** on the server it's a direct call; on the client it's a generated fetch to `/api/...`. Use server extractors (`extract()`) to reach the request, headers, or app state inside the body."
        ] },
        { type: "callout", variant: "tip", text: "Server functions pair naturally with `Action` (for mutations — POST-like) and `Resource` (for reads — GET-like, with `<Suspense>`). You rarely call them with a bare `spawn_local`; wire them into one of those instead so the UI tracks pending/loading state." }
      ]
    },
    {
      id: "actions",
      title: "Actions & forms (mutations)",
      level: "core",
      body: [
        { type: "p", text: "An **`Action`** wraps an async mutation and tracks its lifecycle reactively: `pending()`, `value()` (the latest result) and `version()` (bumps on completion — handy to trigger a resource refetch). For a `#[server]` function, prefer the typed **`ServerAction`**." },
        { type: "code", lang: "rust", code: "// generic action from any async closure\nlet save = Action::new(|title: &String| {\n    let title = title.clone();\n    async move { add_todo(title).await }\n});\nsave.dispatch(\"buy milk\".to_string());\n\nview! {\n    <button on:click=move |_| { save.dispatch(\"item\".into()); }>\"Save\"</button>\n    <Show when=move || save.pending().get()>\"saving...\"</Show>\n    {move || save.value().get().map(|res| format!(\"{res:?}\"))}\n}" },
        { type: "code", lang: "rust", code: "// server-fn-bound action + progressively-enhanced form (works WITHOUT JS)\nlet save = ServerAction::<AddTodo>::new();   // AddTodo = struct the #[server] macro generated\nview! {\n    <ActionForm action=save>\n        <input type=\"text\" name=\"title\"/>     // field names match the fn args\n        <button type=\"submit\">\"Add\"</button>\n    </ActionForm>\n}" },
        { type: "callout", variant: "note", text: "`<ActionForm>` submits to the server function as a real HTML form, so it works before/without hydration and then upgrades to a fetch once WASM loads — great for resilience and SEO. Use `Action::new_local` for `!Send` futures." }
      ]
    },
    {
      id: "async-data",
      title: "Async data: Resource, Suspense & ErrorBoundary",
      level: "core",
      body: [
        { type: "p", text: "A **`Resource`** is reactive async data: give it a **source** (a signal it re-fetches on) and an async **fetcher**. Because resources are serializable, SSR runs the fetch on the server and **streams the value to the client** so it doesn't re-fetch on hydration. You read a resource inside **`<Suspense>`**, which shows a fallback until it resolves." },
        { type: "code", lang: "rust", code: "let (user_id, set_user_id) = signal(1);\n\nlet user = Resource::new(\n    move || user_id.get(),                        // source: refetch when this changes\n    move |id| async move { get_user(id).await },  // async fetcher (often a #[server] fn)\n);\n\nview! {\n    <Suspense fallback=|| view! { <p>\"Loading...\"</p> }>\n        {move || user.get().map(|u| view! { <p>{u.name}</p> })}\n    </Suspense>\n}" },
        { type: "table", headers: ["Tool", "Use for"], rows: [
          ["`Resource::new(src, fetch)`", "reactive data that refetches when the source changes; serializable across SSR"],
          ["`Resource::new_blocking(...)`", "block the SSR response until it resolves (SEO, `<Title>` that needs data)"],
          ["`LocalResource::new(|| async {...})`", "client-only / `!Send` fetch (no source arg; derefs to the value in 0.8)"],
          ["`<Suspense>`", "show a fallback while inner resources load"],
          ["`<Transition>`", "like Suspense, but keep showing OLD content while refetching (no flicker)"],
          ["`<Await future=... let:x>`", "inline one-shot future, no manual resource"],
          ["`<ErrorBoundary>`", "catch `Err` from any `Result`-returning view inside it"]
        ] },
        { type: "code", lang: "rust", code: "// ErrorBoundary catches errors bubbled up from resources / server fns\nview! {\n    <ErrorBoundary fallback=|errors| view! {\n        <div class=\"error\">{move || format!(\"{:?}\", errors.get())}</div>\n    }>\n        <Suspense fallback=|| view! { <p>\"...\"</p> }>\n            {move || user.get().map(|r| r.map(|u| view! { <p>{u.name}</p> }))}\n        </Suspense>\n    </ErrorBoundary>\n}" },
        { type: "callout", variant: "tip", text: "Use `<Transition>` for navigation between routes that share a resource — the previous page stays visible while the next one's data loads, instead of flashing the fallback each time." }
      ]
    },
    {
      id: "backend-structure",
      title: "Backend: structuring a fullstack app",
      level: "core",
      body: [
        { type: "p", text: "Leptos is genuinely fullstack — the `#[server]` boundary is the *only* seam between client and server, and both sides live in **one crate compiled twice**. The mental discipline: shared types (structs, enums, `Params`) compile into **both** builds; anything server-only (DB, filesystem, secrets, native crates) must compile into **only** the `ssr` build, or it poisons the WASM bundle." },
        { type: "code", lang: "text", code: "src/\n  lib.rs            // hydrate() entry (#[cfg(hydrate)]) + `mod` declarations\n  main.rs           // server entry (#[cfg(feature=\"ssr\")]) — Axum, DB pool, migrations\n  app.rs            // <App/>, <Routes>, the shell() — runs on BOTH sides\n  models.rs         // shared types: User, Todo, Params — compile into both builds\n  components/        // UI components (both sides)\n  server/            // server-only: db.rs, auth.rs — gate the module with cfg\n    mod.rs          // #![cfg(feature = \"ssr\")]  <- whole module is server-only\n  api.rs            // the #[server] functions (signature shared, body server-only)" },
        { type: "code", lang: "rust", code: "// api.rs — the function SIGNATURE is shared; the BODY only compiles on the server\n#[server]\npub async fn list_todos() -> Result<Vec<Todo>, ServerFnError> {\n    // `use crate::server::db;` here is fine — this body is ssr-only\n    let todos = crate::server::db::all_todos().await?;\n    Ok(todos)          // Todo must be Serialize + Deserialize to cross the wire\n}" },
        { type: "callout", variant: "gotcha", text: "The error you *will* hit on day one: importing a native-only crate (`sqlx`, `tokio::fs`, `jsonwebtoken`) at module top-level so it compiles into the `hydrate` (WASM) build → a wall of `wasm32-unknown-unknown` link errors. Fix: put that code behind `#[cfg(feature = \"ssr\")]` or *only* inside `#[server]` bodies. A whole server-only module can start with `#![cfg(feature = \"ssr\")]`." },
        { type: "callout", variant: "tip", text: "Types that cross a server function (args + return) must be `Serialize + Deserialize` (serde). Keep them in a shared `models.rs` and derive both — that one struct is your API contract, checked by the compiler on both ends." }
      ]
    },
    {
      id: "server-state-extractors",
      title: "Backend: app state, extractors & the request",
      level: "core",
      body: [
        { type: "p", text: "Inside a `#[server]` body you're on the server, so you often need the DB pool, config, the incoming headers, or to set a response cookie. Two mechanisms: **provided context** (app state you inject once at startup) and **server extractors** (reach into the live Axum request)." },
        { type: "heading", text: "1. Inject app state at startup, read it with expect_context" },
        { type: "p", text: "Register your server routes *with a context closure* that provides your `AppState`. Every server function then reads it with `expect_context`." },
        { type: "code", lang: "rust", code: "// main.rs (ssr) — clone-cheap state, provided into every server fn\n#[derive(Clone)]\nstruct AppState { pool: sqlx::PgPool, leptos_options: LeptosOptions }\n\nlet state = AppState { pool, leptos_options: options.clone() };\n\nlet app = Router::new()\n    .leptos_routes_with_context(\n        &options,\n        routes,\n        { let s = state.clone(); move || provide_context(s.clone()) }, // <- context\n        { let o = options.clone(); move || shell(o.clone()) },\n    )\n    .with_state(state);" },
        { type: "code", lang: "rust", code: "// any server function can now pull it out\n#[server]\npub async fn count_users() -> Result<i64, ServerFnError> {\n    let state = expect_context::<AppState>();      // provided above\n    let n = sqlx::query_scalar!(\"SELECT count(*) FROM users\")\n        .fetch_one(&state.pool).await?;\n    Ok(n.unwrap_or(0))\n}" },
        { type: "heading", text: "2. Server extractors: headers, cookies, setting responses" },
        { type: "code", lang: "rust", code: "use leptos_axum::{extract, ResponseOptions};\nuse axum::http::{HeaderMap, header::SET_COOKIE, HeaderValue};\n\n#[server]\npub async fn who_am_i() -> Result<String, ServerFnError> {\n    // pull any Axum extractor out of the current request:\n    let headers: HeaderMap = extract().await?;\n    let ua = headers.get(\"user-agent\").and_then(|v| v.to_str().ok()).unwrap_or(\"?\");\n\n    // set a response header / cookie from a server fn via ResponseOptions:\n    let resp = expect_context::<ResponseOptions>();\n    resp.insert_header(SET_COOKIE, HeaderValue::from_str(\"seen=1; Path=/; HttpOnly\")?);\n    Ok(ua.to_string())\n}" },
        { type: "callout", variant: "warn", text: "**Background work on the server:** a `#[server]` body runs on Axum's multithreaded Tokio runtime, so `tokio::spawn(async move { ... })` needs a `Send + 'static` future — **clone the pool/data into the task** (`let pool = state.pool.clone();`) rather than borrowing. For `!Send` client-side futures use Leptos's `spawn_local` / `Action::new_local` instead. Don't `tokio::spawn` in client code — it doesn't exist in WASM." },
        { type: "callout", variant: "gotcha", text: "Server extractors must run **inside a server-fn body** (or an SSR context) — `extract()` reaches into the request that's in scope. It returns `Err` if you call it where there is no request (e.g. during a plain unit test with no server context)." }
      ]
    },
    {
      id: "backend-db",
      title: "Backend: database access",
      level: "core",
      body: [
        { type: "p", text: "There's no Leptos-specific ORM — you use the normal Rust stack (**SQLx**, SeaORM, Diesel) *inside server functions*. The pool is created once in `main.rs`, handed in as context (previous section), and every query lives behind the `#[server]` boundary so the driver never reaches WASM." },
        { type: "code", lang: "rust", code: "// main.rs (ssr): build the pool + run migrations at startup\n#[cfg(feature = \"ssr\")]\n#[tokio::main]\nasync fn main() {\n    let pool = sqlx::PgPool::connect(&std::env::var(\"DATABASE_URL\").unwrap())\n        .await.expect(\"db\");\n    sqlx::migrate!().run(&pool).await.expect(\"migrations\");  // ./migrations/*.sql\n    // ... build Router with AppState { pool, .. } as shown above\n}" },
        { type: "code", lang: "rust", code: "// api.rs: full CRUD as server functions\nuse crate::models::Todo;\n\n#[server]\npub async fn add_todo(title: String) -> Result<Todo, ServerFnError> {\n    let pool = expect_context::<AppState>().pool;\n    let row = sqlx::query_as!(Todo,\n        \"INSERT INTO todos (title, done) VALUES ($1, false) RETURNING id, title, done\",\n        title)\n        .fetch_one(&pool).await?;   // sqlx::Error -> ServerFnError via ? (From impl)\n    Ok(row)\n}\n\n#[server]\npub async fn toggle_todo(id: i64) -> Result<(), ServerFnError> {\n    let pool = expect_context::<AppState>().pool;\n    sqlx::query!(\"UPDATE todos SET done = NOT done WHERE id = $1\", id)\n        .execute(&pool).await?;\n    Ok(())\n}" },
        { type: "code", lang: "rust", code: "// wiring it to the UI: a Resource reads, an Action writes, refetch on the action's version\nlet add = ServerAction::<AddTodo>::new();\nlet todos = Resource::new(move || add.version().get(), |_| async { list_todos().await });\n\nview! {\n    <ActionForm action=add>\n        <input name=\"title\"/> <button>\"Add\"</button>\n    </ActionForm>\n    <Suspense fallback=|| view!{ <p>\"…\"</p> }>\n        {move || todos.get().map(|res| res.map(|list| view! {\n            <For each=move || list.clone() key=|t| t.id let:t>\n                <li>{t.title}</li>\n            </For>\n        }))}\n    </Suspense>\n}" },
        { type: "callout", variant: "tip", text: "`sqlx::query!`/`query_as!` check your SQL against a real database **at compile time** — set `DATABASE_URL` (or commit the offline cache with `cargo sqlx prepare`, since cargo-leptos builds twice and CI has no DB). This catches schema drift before you ship." },
        { type: "callout", variant: "note", text: "The `add.version()`→`Resource` source is the idiomatic refetch trigger: the action bumps its version on success, the resource depends on it, so the list re-queries automatically after every mutation. No manual cache invalidation." }
      ]
    },
    {
      id: "backend-auth",
      title: "Backend: authentication end-to-end",
      level: "core",
      body: [
        { type: "p", text: "Auth in Leptos is server-function work plus a cookie. The pattern: a `login` server fn verifies the password and sets a session cookie via `ResponseOptions`; a `current_user` server fn reads the cookie back; routes gate on it with `<ProtectedRoute>`." },
        { type: "code", lang: "rust", code: "use leptos_axum::{extract, ResponseOptions};\nuse axum::http::{HeaderMap, header::SET_COOKIE, HeaderValue};\n\n#[server]\npub async fn login(email: String, password: String) -> Result<(), ServerFnError> {\n    let pool = expect_context::<AppState>().pool;\n    let user = verify_credentials(&pool, &email, &password).await\n        .map_err(|_| ServerFnError::new(\"invalid credentials\"))?;\n\n    let token = create_session(&pool, user.id).await?;   // random id -> sessions table\n    let cookie = format!(\"session={token}; Path=/; HttpOnly; SameSite=Lax; Secure\");\n    expect_context::<ResponseOptions>()\n        .insert_header(SET_COOKIE, HeaderValue::from_str(&cookie)?);\n    Ok(())\n}\n\n#[server]\npub async fn current_user() -> Result<Option<User>, ServerFnError> {\n    let headers: HeaderMap = extract().await?;\n    let Some(token) = session_cookie(&headers) else { return Ok(None) };\n    let pool = expect_context::<AppState>().pool;\n    Ok(load_user_by_session(&pool, &token).await.ok())\n}\n\n#[server]\npub async fn logout() -> Result<(), ServerFnError> {\n    expect_context::<ResponseOptions>().insert_header(\n        SET_COOKIE,\n        HeaderValue::from_str(\"session=; Path=/; Max-Age=0\")?,   // clear it\n    );\n    Ok(())\n}" },
        { type: "code", lang: "rust", code: "// gate routes on the auth resource. ProtectedRoute redirects when the condition is false.\nuse leptos_router::components::ProtectedRoute;\n\nlet user = Resource::new(|| (), |_| async { current_user().await });\n\nview! {\n    <Routes fallback=|| view!{ <p>\"404\"</p> }>\n        <Route path=path!(\"/login\") view=LoginPage/>\n        <ProtectedRoute\n            path=path!(\"/app\")\n            condition=move || user.get().map(|u| matches!(u, Ok(Some(_))))\n            redirect_path=|| \"/login\"\n            view=Dashboard\n        />\n    </Routes>\n}" },
        { type: "callout", variant: "warn", text: "The router condition is **client-side UX only** — it hides the page, it does not secure data. Every protected `#[server]` function must **re-check the session itself** (call `current_user()` / verify the cookie at the top of the body). Never trust that the client didn't call the endpoint directly." },
        { type: "callout", variant: "tip", text: "Don't hand-roll sessions if you'd rather not: the **`leptos_axum` + `axum-login`** (or `tower-sessions`) combo gives you a session store and an `AuthSession` extractor you can pull with `extract()` inside server fns. Set cookies `HttpOnly; Secure; SameSite=Lax` and store only an opaque session id, never the user object." }
      ]
    },
    {
      id: "routing",
      title: "Routing (leptos_router)",
      level: "core",
      body: [
        { type: "p", text: "`leptos_router` gives declarative, nested routing. In 0.7+ routes use the **`path!()`** macro and **`<Routes>` requires a `fallback`**. Links use `<A>` for client-side navigation; nested routes render their child through **`<Outlet/>`**." },
        { type: "code", lang: "rust", code: "use leptos::prelude::*;\nuse leptos_router::components::{Router, Routes, Route, ParentRoute, A, Outlet};\nuse leptos_router::path;\n\n#[component]\nfn App() -> impl IntoView {\n    view! {\n        <Router>\n            <nav>\n                <A href=\"/\">\"Home\"</A>\n                <A href=\"/users/1\">\"User 1\"</A>\n            </nav>\n            <main>\n                <Routes fallback=|| view! { <p>\"404 Not found\"</p> }>\n                    <Route path=path!(\"/\") view=Home/>\n                    <Route path=path!(\"/users/:id\") view=UserProfile/>\n                    <ParentRoute path=path!(\"/settings\") view=SettingsLayout>\n                        <Route path=path!(\"\") view=SettingsHome/>       // index route\n                        <Route path=path!(\"profile\") view=ProfileTab/>\n                    </ParentRoute>\n                    <Route path=path!(\"/*any\") view=NotFound/>          // wildcard\n                </Routes>\n            </main>\n        </Router>\n    }\n}" },
        { type: "code", lang: "rust", code: "// reading params & navigating\nuse leptos_router::hooks::{use_params_map, use_navigate, use_query_map};\n\n#[component]\nfn UserProfile() -> impl IntoView {\n    let params = use_params_map();\n    let id = move || params.read().get(\"id\").unwrap_or_default();\n\n    let navigate = use_navigate();\n    let go_home = move |_| navigate(\"/\", Default::default());\n\n    view! { <p>\"User \" {id}</p> <button on:click=go_home>\"Home\"</button> }\n}" },
        { type: "list", items: [
          "**`<Routes fallback=...>` is mandatory** (compile error without it). Use `<FlatRoutes>` instead when you have no nested routes (slightly faster).",
          "**Nesting:** `<ParentRoute>` wraps child `<Route>`s; the parent's view must include `<Outlet/>` where children render.",
          "**Typed params:** derive `Params` and call `use_params::<T>()` for a `Memo<Result<T, _>>` instead of stringly `use_params_map`.",
          "**`<A>`** does client-side nav (supports active-class + `exact`); `ProtectedRoute` gates routes behind a condition (auth)."
        ] },
        { type: "callout", variant: "gotcha", text: "The `path!(\"/users/:id\")` macro parses the pattern at **compile time** into typed segments — a typo in the pattern is a build error, not a silent 404. You can also spell segments manually: `(StaticSegment(\"users\"), ParamSegment(\"id\"))`." }
      ]
    },
    {
      id: "state-context",
      title: "Shared state: context & stores",
      level: "core",
      body: [
        { type: "p", text: "To share state without prop-drilling, use **context**: `provide_context(value)` near the root, `use_context::<T>()` (or `expect_context::<T>()`) anywhere below. Provide a `Copy` signal (or a `Clone` struct wrapping one) so descendants can both read and write." },
        { type: "code", lang: "rust", code: "#[derive(Clone, Copy)]\nstruct ThemeCtx(RwSignal<String>);\n\n// near the root\nprovide_context(ThemeCtx(RwSignal::new(\"dark\".into())));\n\n// anywhere in the subtree\nlet theme = expect_context::<ThemeCtx>();      // panics with a clear message if missing\nview! {\n    <button on:click=move |_| theme.0.set(\"light\".into())>\"Light mode\"</button>\n    <p>\"theme: \" {move || theme.0.get()}</p>\n}" },
        { type: "heading", text: "reactive_stores: fine-grained nested state" },
        { type: "p", text: "A single `RwSignal<BigStruct>` notifies *every* subscriber when any field changes. **`reactive_stores`** gives per-field reactivity: `#[derive(Store)]` generates field accessors so subscribers depend only on the fields they read — ideal for app-wide state with many independent parts." },
        { type: "code", lang: "rust", code: "use reactive_stores::Store;\n\n#[derive(Store, Clone, Default)]\nstruct AppState {\n    user: String,\n    #[store(key: usize = |t| t.id)]   // keyed collection for lists\n    todos: Vec<Todo>,\n}\n\nlet state = Store::new(AppState::default());\nstate.user().set(\"ada\".into());       // generated field accessor\nstate.user().get();                    // only `user` subscribers re-run — not `todos`" },
        { type: "callout", variant: "note", text: "**`leptos-use`** (crate `leptos-use`) is a separate community library of composables — `use_local_storage`, `use_debounce_fn`, `use_event_listener`, `use_media_query`, `use_websocket`, etc. Think VueUse for Leptos; reach for it before hand-rolling browser-API glue." }
      ]
    },
    {
      id: "rendering-modes",
      title: "Rendering modes, hydration & islands",
      level: "core",
      body: [
        { type: "p", text: "The same app supports several rendering strategies, selected by **Cargo feature flags**:" },
        { type: "table", headers: ["Mode", "Feature", "What it is"], rows: [
          ["**CSR**", "`csr`", "pure client-side SPA; `mount_to_body(App)`. Built with Trunk. No server."],
          ["**SSR**", "`ssr`", "the server binary renders HTML, runs server fns (Axum/Actix)."],
          ["**Hydrate**", "`hydrate`", "the WASM client attaches reactivity to server-rendered HTML."],
          ["**SSR + Hydrate**", "both", "the standard fullstack build (`cargo-leptos` runs both)."]
        ] },
        { type: "p", text: "**Islands** (`islands` feature) is a bundle-shrinking mode: most components render to **static HTML with no client JS**, and only components marked **`#[island]`** ship WASM and become interactive." },
        { type: "code", lang: "rust", code: "#[island]\nfn Counter() -> impl IntoView {\n    let (n, set_n) = signal(0);\n    view! { <button on:click=move |_| set_n.update(|n| *n += 1)>{n}</button> }\n}\n// everything outside islands is static HTML -> tiny WASM payload" },
        { type: "heading", text: "The server entry (leptos_axum)" },
        { type: "code", lang: "rust", code: "#[cfg(feature = \"ssr\")]\n#[tokio::main]\nasync fn main() {\n    use axum::Router;\n    use leptos::prelude::*;\n    use leptos_axum::{generate_route_list, LeptosRoutes};\n    use app::{App, shell};\n\n    let conf = get_configuration(None).unwrap();\n    let options = conf.leptos_options;\n    let routes = generate_route_list(App);        // discovers routes + registers server fns\n\n    let router = Router::new()\n        .leptos_routes(&options, routes, {\n            let o = options.clone();\n            move || shell(o.clone())\n        })\n        .fallback(leptos_axum::file_and_error_handler(shell))\n        .with_state(options);\n\n    let listener = tokio::net::TcpListener::bind(\"127.0.0.1:3000\").await.unwrap();\n    axum::serve(listener, router.into_make_service()).await.unwrap();\n}" },
        { type: "code", lang: "rust", code: "// the WASM entry point, in lib.rs\n#[cfg(feature = \"hydrate\")]\n#[wasm_bindgen::prelude::wasm_bindgen]\npub fn hydrate() {\n    console_error_panic_hook::set_once();\n    leptos::mount::hydrate_body(App);\n}" },
        { type: "callout", variant: "warn", text: "**Effects don't run during SSR.** Don't put load-bearing logic in `Effect::new` expecting it on the server — fetch with `Resource`/server functions instead. And server-side (multithreaded Axum) values/futures often need to be `Send`; `!Send` work uses `LocalResource` / `Action::new_local` / `spawn_local`." }
      ]
    },
    {
      id: "meta-head",
      title: "Document head with leptos_meta",
      level: "deep",
      body: [
        { type: "p", text: "**`leptos_meta`** manages the document `<head>` reactively and correctly across SSR + hydration — titles, meta tags, stylesheets. Call `provide_meta_context()` once, then use its components anywhere; they hoist into `<head>`." },
        { type: "code", lang: "rust", code: "use leptos_meta::*;\n\n#[component]\nfn App() -> impl IntoView {\n    provide_meta_context();          // once, near the root\n    view! {\n        <Stylesheet id=\"leptos\" href=\"/pkg/my-app.css\"/>\n        <Title text=\"My App\"/>\n        <Meta name=\"description\" content=\"A Leptos app\"/>\n        // ...router etc.\n    }\n}\n\n// a per-page reactive title\nview! { <Title text=move || format!(\"User {}\", id())/> }" },
        { type: "callout", variant: "tip", text: "For a title that depends on fetched data (SEO), combine a reactive `<Title>` with a `Resource::new_blocking` so the server waits for the data before sending the fully-titled HTML." }
      ]
    },
    {
      id: "styling-config",
      title: "Styling & Cargo config",
      level: "deep",
      body: [
        { type: "p", text: "`cargo-leptos` runs your CSS pipeline as part of the build. Configure it under `[package.metadata.leptos]` in `Cargo.toml` — point it at a SASS/CSS entry, or a Tailwind input, and it rebuilds on change with no separate watcher." },
        { type: "code", lang: "toml", code: "[package.metadata.leptos]\noutput-name   = \"my-app\"\nsite-root     = \"target/site\"\nsite-pkg-dir  = \"pkg\"\nstyle-file    = \"style/main.scss\"          # SASS/CSS entry\ntailwind-input-file = \"style/tailwind.css\"  # OR Tailwind (v4: a file that @imports tailwindcss)\nassets-dir    = \"public\"\nsite-addr     = \"127.0.0.1:3000\"\nreload-port   = 3001\nbin-features  = [\"ssr\"]\nlib-features  = [\"hydrate\"]" },
        { type: "code", lang: "toml", code: "# the feature wiring that makes the dual build work\n[features]\nhydrate = [\"leptos/hydrate\", \"dep:wasm-bindgen\", \"dep:console_error_panic_hook\"]\nssr = [\n  \"dep:axum\", \"dep:tokio\", \"dep:leptos_axum\",\n  \"leptos/ssr\", \"leptos_meta/ssr\", \"leptos_router/ssr\",\n]\n\n[lib]\ncrate-type = [\"cdylib\", \"rlib\"]   # cdylib for wasm, rlib for the server binary" },
        { type: "callout", variant: "note", text: "Scoped styling options: plain global CSS/SASS via `style-file`, **Tailwind** via `tailwind-input-file`, or component-scoped styles with the `stylance`/`leptos_style` crates. `cargo-leptos` handles the Tailwind/SASS invocation for you." }
      ]
    },
    {
      id: "testing-deploy",
      title: "Testing & deployment",
      level: "deep",
      body: [
        { type: "list", items: [
          "**Unit-test** pure logic and reactive code with plain `#[test]`s; wrap reactive access in a runtime where needed. Component/DOM tests run under `wasm-bindgen-test` in a headless browser.",
          "**End-to-end:** the start templates include a Playwright setup; run it with `cargo leptos end-to-end`.",
          "**Build for prod:** `cargo leptos build --release` produces the server binary plus the hashed WASM/CSS in `site-root`. Ship both: the binary serves the `site/` assets."
        ] },
        { type: "code", lang: "bash", code: "cargo leptos build --release\n# run it: the server binary + its site assets (set env from Cargo metadata)\nLEPTOS_SITE_ROOT=site ./target/release/my-app\n\n# container sketch: build stage runs `cargo leptos build --release`,\n# runtime stage copies the binary + target/site and sets LEPTOS_* env vars." },
        { type: "callout", variant: "tip", text: "Deploy targets: any host that runs the Axum binary (Fly.io, a VPS, a container). For serverless/edge, use the `start-spin`/`start-aws` templates. The WASM + CSS are static assets you can also put behind a CDN." }
      ]
    }
  ],

  packages: [
    { name: "leptos", why: "core: reactivity, view! macro, components, #[server], mount/hydrate" },
    { name: "leptos_router", why: "nested client-side routing (Router/Routes/path!/use_params)" },
    { name: "leptos_meta", why: "reactive document <head> (Title, Meta, Stylesheet), SSR-aware" },
    { name: "leptos_axum", why: "Axum server integration (generate_route_list, leptos_routes)" },
    { name: "reactive_stores", why: "#[derive(Store)] for fine-grained nested-struct/list state" },
    { name: "leptos-use", why: "community composables (storage, timers, websocket, sensors)" },
    { name: "server_fn", why: "the server-function machinery + encodings (re-exported by leptos)" },
    { name: "cargo-leptos", why: "build tool: dual SSR+hydrate compile, CSS/Tailwind, watch" },
    { name: "wasm-bindgen", why: "Rust <-> JS/DOM bindings for the hydrate build" },
    { name: "console_error_panic_hook", why: "surface Rust panics in the browser console" },
    { name: "axum + tokio", why: "the server runtime under the SSR feature" },
    { name: "sqlx / sea-orm", why: "database access inside #[server] functions (ssr-only)" },
    { name: "axum-login / tower-sessions", why: "session store + AuthSession extractor for server-side auth" },
    { name: "http (HeaderMap, SET_COOKIE)", why: "read/set headers & cookies via ResponseOptions in server fns" }
  ],

  gotchas: [
    "Reactivity needs a **reactive context**: `{count.get()}` in a view reads once; write `{count}` or `{move || count.get()}` so the node subscribes and updates.",
    "Signals are `Copy`, but **non-`Copy` captures** (`String`/`Vec`/structs) used in multiple `move ||` closures must be `.clone()`d first — else 'value moved into closure'.",
    "`.read()`/`.write()` return `RefCell` guards: holding a `read()` across a `write()` on the same signal panics. Prefer `.with()` / `.update()` closures.",
    "Use `.get_untracked()` (not `.get()`) when reading a signal **inside an effect that also writes it**, or in event handlers, to avoid a self-triggering loop.",
    "**Ownership/disposal:** arena signals live as long as their owner (component/scope). Accessing one after its scope unmounts panics ('reactive value has been disposed') — use `Arc*` variants or lift state into context.",
    "**Effects don't run on the server** (SSR). Fetch with `Resource`/server functions instead of load-bearing effects.",
    "Server-only crates/code must be behind `#[cfg(feature = \"ssr\")]` or inside a `#[server]` body, or they break the WASM (`hydrate`) build.",
    "Different `view!{}` branches in an `if/else` are different types — call `.into_any()` (or use `<Show>`) to unify them.",
    "`<Routes>` now **requires** a `fallback`, and routes use `path!(\"/x/:id\")`. Old 0.6 `create_*`/router syntax won't compile on 0.7+.",
    "Server-fn args and resource data must be `Serialize`/`Deserialize` (and usually `Send`); `!Send` futures need `LocalResource`/`Action::new_local`/`spawn_local`.",
    "**Server-only crates in the WASM build:** importing `sqlx`/`tokio::fs`/`jsonwebtoken` at module top-level compiles it into `hydrate` → wasm32 link errors. Gate with `#[cfg(feature = \"ssr\")]` or keep it inside `#[server]` bodies.",
    "Get app state (DB pool) into server fns by registering routes with `leptos_routes_with_context` + `provide_context`, then `expect_context::<AppState>()` inside the body — a plain global won't be there on every request.",
    "`tokio::spawn` in a server fn needs a `Send + 'static` future: **clone** the pool/data into the task, don't borrow. `tokio::spawn` doesn't exist in WASM — client-side background work uses `spawn_local`.",
    "A `<ProtectedRoute>` condition is client-side UX only; it does **not** secure data. Re-check the session inside every protected `#[server]` function body.",
    "Server extractors (`leptos_axum::extract()`, `ResponseOptions`) only work inside a server-fn/SSR context — they read the in-scope request and `Err`/panic where there is none."
  ],

  flashcards: [
    { q: "What is fine-grained reactivity and how does it differ from React?", a: "Signals drive the DOM directly: changing a signal updates *exactly* the nodes/attributes that read it — **no virtual DOM, no diffing, no component re-render**. Leptos wired the precise updates once at first render." },
    { q: "How do you create a signal in Leptos 0.7/0.8?", a: "`let (get, set) = signal(0);` for split read/write handles, or `let s = RwSignal::new(0);` for a combined handle. (`create_signal` is the deprecated 0.6 name.)" },
    { q: "How do you read and write a signal?", a: "`s.get()` (reactive read), `s.get_untracked()` (no subscribe), `set.set(v)` / `set.update(|x| ...)`. Guard forms: `s.read()` / `s.write()`; closure forms: `s.with(|v| ...)`." },
    { q: "What's a derived signal vs a Memo?", a: "A **derived signal is a plain closure** (`move || a.get() * 2`) that recomputes on each read. A **`Memo`** caches the result and only notifies subscribers when the output actually changes — use it for expensive computations." },
    { q: "What does a #[server] function do?", a: "Generates a server endpoint + a client stub with the same signature. The **body runs only on the server** (DB/secrets safe); calling from the client becomes an HTTP request. Returns `Result<T, ServerFnError>` (or a `FromServerFnError` type in 0.8)." },
    { q: "How do you render async data?", a: "A `Resource::new(source, fetcher)` inside `<Suspense fallback=...>`. Resources are serializable, so SSR fetches on the server and streams the value to the client (no refetch on hydration)." },
    { q: "How is a fullstack Leptos app built?", a: "One crate compiled **twice**: the server (`ssr` feature, Axum/Actix binary) and the WASM client (`hydrate` feature). `cargo-leptos` orchestrates both; `cargo leptos watch` for dev." },
    { q: "What are islands?", a: "A mode (`islands` feature) where most components render to static HTML with no JS, and only `#[island]`-marked components ship WASM and become interactive — much smaller bundles." },
    { q: "Why might a view not update when a signal changes?", a: "The read isn't in a reactive context. `{count.get()}` reads once; use `{count}` or `{move || count.get()}` so the node subscribes. Reactivity only tracks reads inside effects/memos/view closures." },
    { q: "How do you share state without prop-drilling?", a: "`provide_context(value)` near the root and `use_context::<T>()`/`expect_context::<T>()` below — provide a `Copy` signal. For fine-grained nested state, `#[derive(Store)]` from `reactive_stores`." },
    { q: "How does a server function get the DB pool / app state?", a: "Register routes with `leptos_routes_with_context` and a `provide_context(state)` closure at startup; inside the `#[server]` body pull it out with `expect_context::<AppState>()`. Build the pool once in `main.rs`." },
    { q: "How do you read request headers or set a cookie from a server function?", a: "`leptos_axum::extract::<HeaderMap>().await?` reads any Axum extractor from the current request; `expect_context::<ResponseOptions>().insert_header(SET_COOKIE, ..)` sets response headers/cookies." },
    { q: "Where does database code live in a fullstack Leptos app?", a: "Only inside `#[server]` function bodies (or `#[cfg(feature=\"ssr\")]` modules) — the driver must never compile into the WASM `hydrate` build. Shared types go in a `models.rs` derived `Serialize + Deserialize`." },
    { q: "Is a <ProtectedRoute> enough to secure a page's data?", a: "No — it's client-side UX (hides/redirects the view). Every protected `#[server]` function must re-verify the session in its own body; the endpoint can be called directly." },
    { q: "How do you refetch data after a mutation?", a: "Make the `Resource`'s source depend on the action's `version()`: `Resource::new(move || action.version().get(), ...)`. The action bumps its version on success, so the resource re-queries automatically." },
    { q: "How do you spawn background work on the Leptos server safely?", a: "`tokio::spawn` needs a `Send + 'static` future — clone the pool/data into the task rather than borrowing. On the client (WASM) there is no `tokio::spawn`; use `spawn_local` / `Action::new_local` for `!Send` work." }
  ],

  cheatsheet: [
    { label: "New project", code: "cargo leptos new --git leptos-rs/start-axum" },
    { label: "Dev server", code: "cargo leptos watch" },
    { label: "Signal", code: "let (n, set_n) = signal(0);" },
    { label: "Reactive text", code: "view! { <p>{move || n.get()}</p> }" },
    { label: "Event", code: "on:click=move |_| set_n.update(|n| *n += 1)" },
    { label: "Server fn", code: "#[server] async fn f() -> Result<T, ServerFnError> {..}" },
    { label: "Resource", code: "Resource::new(move || id.get(), |id| async move {..})" },
    { label: "Suspense", code: "<Suspense fallback=|| view!{..}>{move || r.get()}</Suspense>" },
    { label: "Route", code: "<Route path=path!(\"/users/:id\") view=User/>" },
    { label: "Params", code: "let p = use_params_map(); p.read().get(\"id\")" },
    { label: "Context", code: "provide_context(x); expect_context::<T>()" },
    { label: "State in server fn", code: "let s = expect_context::<AppState>();" },
    { label: "Provide state", code: "leptos_routes_with_context(&o, r, move||provide_context(s.clone()), ..)" },
    { label: "Server extractor", code: "let h: HeaderMap = extract().await?;" },
    { label: "Set cookie", code: "expect_context::<ResponseOptions>().insert_header(SET_COOKIE, ..)" },
    { label: "Migrations", code: "sqlx::migrate!().run(&pool).await?" }
  ]
});
