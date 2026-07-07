(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "cpp-drogon",
  name: "Drogon",
  language: "C++",
  tagline: "A **non-blocking**, event-loop C++17/20 HTTP framework — coroutine DB access, a built-in ORM, and top-tier **TechEmpower** throughput.",
  color: "#e04a3f",
  readMinutes: 22,
  group: "C++",

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "**Drogon** is a high-performance, fully asynchronous C++17/20 HTTP application framework. It runs on its own event-loop networking library, **Trantor**, using a non-blocking, epoll/kqueue reactor with a thread pool of event loops — so a handful of threads serve very large numbers of connections. It consistently ranks near the top of the **TechEmpower** web framework benchmarks." },
        { type: "list", items: [
          "**Reach for it when:** you need raw throughput and low latency, want to stay in C++, or must embed a web layer into an existing native codebase.",
          "**Strengths:** speed, an integrated async **ORM** (PostgreSQL/MySQL/SQLite3), C++20 **coroutines** for readable async code, WebSockets, filters (middleware), and a CSP view engine — all in one framework.",
          "**Mental model:** everything runs on non-blocking event loops. A request handler is a function that receives an `HttpRequestPtr` and either **invokes a callback** with a response or (with coroutines) `co_return`s one. Never block the loop."
        ] },
        { type: "callout", variant: "note", text: "Name check: the framework is **Drogon** (github.com/drogonframework/drogon) — sometimes misheard as \"Dragon.\" There is no C++ backend framework called \"Dragon\"; the correct spelling is **Drogon**." },
        { type: "callout", variant: "tip", text: "Everything below targets modern Drogon (1.9.x line, C++17 minimum; coroutines need a C++20 compiler)." }
      ]
    },
    {
      id: "lifecycle",
      title: "How a request flows (mental model)",
      level: "core",
      body: [
        { type: "p", text: "Before the syntax, hold the shape of the pipeline in your head — it tells you *where* each Drogon concept plugs in. A connection is accepted on a listener, parsed into an `HttpRequestPtr`, then pushed through a chain of hooks before and after your handler runs, all on a **single event loop thread**." },
        { type: "list", ordered: true, items: [
          "**Accept & parse** — a listener accepts the socket; Trantor's event loop reads bytes and builds an immutable `HttpRequestPtr`.",
          "**Pre-routing advice** (`registerPreRoutingAdvice`) — global AOP hook that sees *every* request before any route is matched (rate-limiting, global CORS, request logging).",
          "**Routing** — Drogon matches the path + method against self-registered controllers / `registerHandler` routes.",
          "**Post-routing advice** then **filters** — once a route is chosen, its `HttpFilter`s run (auth, validation). A filter can **short-circuit** with a response or **pass** to the next.",
          "**Handler** — your controller method / lambda / coroutine runs and produces an `HttpResponsePtr` (via `callback(...)` or `co_return`).",
          "**Post-handling advice** — global hook to mutate the outgoing response (security headers, timing).",
          "**Send** — Drogon applies compression, caching and session cookies, then writes the response back on the same loop."
        ] },
        { type: "callout", variant: "note", text: "Two extension points, two scopes: **filters** are *per-route* middleware you attach by name; **advices** (AOP) are *global* lifecycle hooks registered once on `app()`. Reach for a filter for \"protect these endpoints,\" an advice for \"do X on every request.\"" },
        { type: "callout", variant: "warn", text: "Every stage above happens on **one event-loop thread**. Nothing here is a thread pool per request — which is exactly why a single blocking call (sync DB, sleep, heavy CPU) in your handler stalls every other in-flight request on that loop. Stay non-blocking end to end." }
      ]
    },
    {
      id: "setup",
      title: "Install & create a project",
      level: "core",
      body: [
        { type: "p", text: "Drogon is a compiled library. Install its build dependencies, then either build Drogon from source or pull it via a package manager (**vcpkg** / **Conan**). Core deps: a C++17/20 compiler, **CMake** (>= 3.5), **jsoncpp**, zlib, and OpenSSL; optional DB client libs (**libpq**, **mysqlclient**, **sqlite3**)." },
        { type: "code", lang: "bash", code: "# Debian/Ubuntu build deps\nsudo apt install git gcc g++ cmake libjsoncpp-dev uuid-dev \\\n     zlib1g-dev openssl libssl-dev \\\n     libpq-dev libmysqlclient-dev libsqlite3-dev\n\n# Build & install Drogon from source (brings drogon_ctl)\ngit clone https://github.com/drogonframework/drogon\ncd drogon && git submodule update --init\nmkdir build && cd build\ncmake .. && make -j$(nproc) && sudo make install" },
        { type: "code", lang: "bash", code: "# Or via a package manager\nvcpkg install drogon\n# conan: add 'drogon/1.9.x' to your conanfile\n\n# Scaffold a new project (creates CMakeLists, main.cpp, controllers/, models/, views/, config.json)\ndrogon_ctl create project my_app\ncd my_app" },
        { type: "callout", variant: "gotcha", text: "`drogon_ctl` (the code generator + project scaffolder) is installed alongside the library. If `drogon_ctl` isn't found after install, your install prefix's `bin` isn't on `PATH`, or the shared lib path isn't in the loader cache (`sudo ldconfig`)." }
      ]
    },
    {
      id: "cmake",
      title: "Building with CMake",
      level: "core",
      body: [
        { type: "p", text: "Drogon ships CMake package config. Consumers just `find_package(Drogon)` and link `Drogon::Drogon`, which transitively pulls Trantor, jsoncpp, and the DB clients." },
        { type: "code", lang: "cmake", code: "cmake_minimum_required(VERSION 3.5)\nproject(my_app CXX)\n\nset(CMAKE_CXX_STANDARD 20)          # 17 minimum; 20 for coroutines\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nfind_package(Drogon CONFIG REQUIRED)\n\nadd_executable(my_app main.cc)\n\n# Compile controllers, models, filters, and generated views\naux_source_directory(controllers CTL_SRC)\naux_source_directory(models      MODEL_SRC)\ntarget_sources(my_app PRIVATE \${CTL_SRC} \${MODEL_SRC})\n\ntarget_link_libraries(my_app PRIVATE Drogon::Drogon)" },
        { type: "code", lang: "bash", code: "mkdir build && cd build\ncmake .. && make -j$(nproc)\n./my_app        # reads ./config.json by default if you loadConfigFile it" },
        { type: "callout", variant: "tip", text: "The scaffolded `CMakeLists.txt` also wires **CSP view** compilation via `drogon_create_views(...)`, turning `.csp` templates into generated C++ source at build time." }
      ]
    },
    {
      id: "bootstrap",
      title: "App bootstrap & configuration",
      level: "core",
      body: [
        { type: "p", text: "`drogon::app()` returns the global singleton `HttpAppFramework`. Configure it fluently in code, or load everything from a `config.json`, then call `.run()` (this blocks and starts the event loops)." },
        { type: "code", lang: "cpp", code: "#include <drogon/drogon.h>\n\nint main() {\n    // Option A: configure in code\n    drogon::app()\n        .addListener(\"0.0.0.0\", 8080)\n        .setThreadNum(0)            // 0 = one loop per hardware core\n        .setDocumentRoot(\"./static\")\n        .run();\n\n    // Option B (typical): load everything from JSON\n    // drogon::app().loadConfigFile(\"./config.json\").run();\n}" },
        { type: "code", lang: "json", code: "{\n  \"listeners\": [\n    { \"address\": \"0.0.0.0\", \"port\": 8080, \"https\": false }\n  ],\n  \"app\": {\n    \"threads_num\": 0,\n    \"document_root\": \"./static\",\n    \"enable_session\": true,\n    \"session_timeout\": 0,\n    \"log\": { \"log_level\": \"DEBUG\" }\n  },\n  \"db_clients\": []\n}" },
        { type: "callout", variant: "note", text: "`setThreadNum(0)` uses one event loop per CPU core — the usual production setting. Each loop is single-threaded, which is *why* blocking calls are so damaging (see gotchas)." }
      ]
    },
    {
      id: "controllers",
      title: "Routing with HttpController",
      level: "core",
      body: [
        { type: "p", text: "The main routing style is a class inheriting `drogon::HttpController<T>` (CRTP). Controllers **self-register** — declaring them is enough; there's no central route table to edit. Map paths inside a `METHOD_LIST_BEGIN/END` block with `METHOD_ADD` or `ADD_METHOD_TO`. Path placeholders (`{1}`, `{2}` or `{name}`) become trailing handler parameters, auto-converted to their C++ types." },
        { type: "code", lang: "cpp", code: "// controllers/User.h\n#pragma once\n#include <drogon/HttpController.h>\nusing namespace drogon;\n\nclass User : public drogon::HttpController<User> {\n  public:\n    METHOD_LIST_BEGIN\n    // path params map to the extra handler args, in order\n    ADD_METHOD_TO(User::getInfo, \"/user/{id}/info\", Get);\n    ADD_METHOD_TO(User::login,   \"/user/login\",      Post);\n    METHOD_LIST_END\n\n    void getInfo(const HttpRequestPtr &req,\n                 std::function<void(const HttpResponsePtr &)> &&callback,\n                 int userId) const;\n    void login(const HttpRequestPtr &req,\n               std::function<void(const HttpResponsePtr &)> &&callback);\n};" },
        { type: "code", lang: "cpp", code: "// controllers/User.cc\n#include \"User.h\"\n\nvoid User::getInfo(const HttpRequestPtr &req,\n                   std::function<void(const HttpResponsePtr &)> &&callback,\n                   int userId) const {\n    Json::Value ret;\n    ret[\"user_id\"] = userId;\n    ret[\"name\"]    = \"Jack\";\n    callback(HttpResponse::newHttpJsonResponse(ret));\n}" },
        { type: "list", items: [
          "**HTTP method constants:** `Get`, `Post`, `Put`, `Delete`, `Patch`, `Head`, `Options`.",
          "**`HttpController`** groups related RESTful endpoints and supports path parameters — the workhorse.",
          "**`HttpSimpleController`** maps *one* fixed path to a class via `PATH_ADD` — good for a single endpoint.",
          "The **same path** can be registered under different methods (classic REST), each routed to its own handler."
        ] },
        { type: "callout", variant: "gotcha", text: "If the handler has **more parameters than path placeholders**, the extra ones are converted from the request itself (query/body) via `fromRequest`. Mismatched counts/types are a common source of silent 404s or wrong bindings — keep the signature aligned with the path." }
      ]
    },
    {
      id: "register-handler",
      title: "Routing with registerHandler (lambdas)",
      level: "core",
      body: [
        { type: "p", text: "For quick or dynamic routes you can skip the controller class and register a lambda directly on the app. Path params bind to the trailing lambda args, and you can attach filters as a final list." },
        { type: "code", lang: "cpp", code: "drogon::app().registerHandler(\n    \"/hello/{name}\",\n    [](const HttpRequestPtr &req,\n       std::function<void(const HttpResponsePtr &)> &&callback,\n       const std::string &name) {\n        auto resp = HttpResponse::newHttpResponse();\n        resp->setBody(\"Hello, \" + name + \"!\");\n        callback(resp);\n    },\n    {Get});   // allowed methods; add filter names after: {Get, \"LoginFilter\"}\n\n// Coroutine form: return drogon::Task<HttpResponsePtr>\ndrogon::app().registerHandler(\n    \"/count\",\n    [](HttpRequestPtr req) -> drogon::Task<HttpResponsePtr> {\n        auto db = drogon::app().getDbClient();\n        auto r  = co_await db->execSqlCoro(\"SELECT COUNT(*) FROM users\");\n        auto resp = HttpResponse::newHttpResponse();\n        resp->setBody(std::to_string(r[0][0].as<size_t>()));\n        co_return resp;\n    });" },
        { type: "callout", variant: "tip", text: "`registerHandler` is great for glue and prototypes; `HttpController` classes scale better for real apps because routing lives next to the handler and needs no central registration." }
      ]
    },
    {
      id: "request-response",
      title: "Requests, responses & JSON",
      level: "core",
      body: [
        { type: "p", text: "`HttpRequestPtr` is a `shared_ptr` to an immutable request. Pull data with `getParameter`/`getParameters` (query + form), `getBody`, `getHeader`, `getJsonObject`. Build responses with the `HttpResponse::newHttp*Response` factories. JSON uses **jsoncpp**'s `Json::Value`." },
        { type: "code", lang: "cpp", code: "void handler(const HttpRequestPtr &req,\n             std::function<void(const HttpResponsePtr &)> &&callback) {\n    // Query/form params: /search?q=drogon&page=2\n    std::string q = req->getParameter(\"q\");\n    // Raw body\n    std::string_view raw = req->getBody();\n    // Parsed JSON body (nullptr if not valid JSON)\n    auto json = req->getJsonObject();\n    if (!json) {\n        auto resp = HttpResponse::newHttpResponse();\n        resp->setStatusCode(k400BadRequest);\n        callback(resp);\n        return;\n    }\n\n    Json::Value out;\n    out[\"query\"]    = q;\n    out[\"received\"] = (*json)[\"name\"];\n    auto resp = HttpResponse::newHttpJsonResponse(out);   // sets Content-Type\n    resp->setStatusCode(k200OK);\n    callback(resp);\n}" },
        { type: "table", headers: ["Factory", "Produces"], rows: [
          ["`HttpResponse::newHttpJsonResponse(v)`", "JSON body from a `Json::Value`"],
          ["`HttpResponse::newHttpResponse()`", "empty response you fill via `setBody`/`setStatusCode`"],
          ["`HttpResponse::newHttpViewResponse(name, data)`", "rendered CSP view"],
          ["`HttpResponse::newFileResponse(path)`", "serve a file from disk"],
          ["`HttpResponse::newRedirectionResponse(url)`", "302/301 redirect"]
        ] },
        { type: "callout", variant: "warn", text: "Status codes are the `kXxx` enum (`k404NotFound`, `k201Created`, ...). Responses are `shared_ptr`; the framework caches some — don't mutate a response after handing it to `callback`." }
      ]
    },
    {
      id: "uploads-static",
      title: "File uploads, static files & downloads",
      level: "core",
      body: [
        { type: "p", text: "For `multipart/form-data` uploads, parse the request with a **`MultiPartParser`**: it splits out the uploaded files (`getFiles()` → `HttpFile`) from the ordinary form fields (`getParameters()`). Each `HttpFile` can be streamed to disk with `save()`/`saveAs()` without you touching raw bytes." },
        { type: "code", lang: "cpp", code: "#include <drogon/MultiPartParser.h>\nusing namespace drogon;\n\nvoid upload(const HttpRequestPtr &req,\n            std::function<void(const HttpResponsePtr &)> &&callback) {\n    MultiPartParser parser;\n    if (parser.parse(req) != 0 || parser.getFiles().empty()) {\n        auto r = HttpResponse::newHttpResponse();\n        r->setStatusCode(k400BadRequest);\n        callback(r);\n        return;\n    }\n    for (const HttpFile &f : parser.getFiles()) {\n        // saved under the configured upload_path (see config.json)\n        f.saveAs(\"uploads/\" + f.getFileName());   // or f.save() to keep the name\n        LOG_INFO << f.getFileName() << \" \" << f.fileLength() << \" bytes\";\n    }\n    // non-file fields from the same multipart body\n    std::string caption = parser.getParameter<std::string>(\"caption\");\n\n    Json::Value ret;\n    ret[\"count\"] = (int)parser.getFiles().size();\n    callback(HttpResponse::newHttpJsonResponse(ret));\n}" },
        { type: "list", items: [
          "**`HttpFile`** exposes `getFileName()`, `fileLength()`, `getContentType()`, `fileContent()` (a `string_view`), `save()`, `saveAs(path)`, and `getMd5()`.",
          "The **upload directory** and max body size are config: `upload_path`, `client_max_body_size`, `client_max_memory_body_size` in `config.json`'s `app` block.",
          "**Static files** in `document_root` are served automatically (with caching + ranges). Restrict types with `file_types` in config."
        ] },
        { type: "code", lang: "cpp", code: "// Serve a file as a download (Content-Disposition: attachment)\nauto resp = HttpResponse::newFileResponse(\n    \"/var/data/report.pdf\",   // path on disk\n    \"report-2026.pdf\",        // attachment filename shown to the browser\n    CT_APPLICATION_PDF);\ncallback(resp);\n\n// Or stream a large response without loading it all in memory\nauto stream = HttpResponse::newStreamResponse(\n    [](char *buf, size_t len) -> std::size_t { /* fill buf, return bytes; 0 = done */ return 0; },\n    \"big.csv\", CT_TEXT_PLAIN);" },
        { type: "callout", variant: "gotcha", text: "Uploads over `client_max_body_size` are rejected before your handler runs — a mysterious 413/dropped request is almost always this limit. Raise it in config for large uploads, and prefer `newStreamResponse`/`newFileResponse` over building a giant `std::string` body in memory." }
      ]
    },
    {
      id: "filters",
      title: "Filters (middleware) & CORS",
      level: "core",
      body: [
        { type: "p", text: "**Filters** are Drogon's middleware. A filter inherits `drogon::HttpFilter<T>` and implements `doFilter`, receiving two callbacks: `FilterCallback` to **reject** (short-circuit with a response) and `FilterChainCallback` to **pass** to the next filter/handler. Attach filters by class name on routes." },
        { type: "code", lang: "cpp", code: "#include <drogon/HttpFilter.h>\nusing namespace drogon;\n\nclass LoginFilter : public drogon::HttpFilter<LoginFilter> {\n  public:\n    void doFilter(const HttpRequestPtr &req,\n                  FilterCallback &&fcb,\n                  FilterChainCallback &&fccb) override {\n        if (req->getHeader(\"Authorization\").empty()) {\n            auto resp = HttpResponse::newHttpResponse();\n            resp->setStatusCode(k401Unauthorized);\n            fcb(resp);      // reject: stop the chain here\n            return;\n        }\n        fccb();             // pass: continue to the handler\n    }\n};" },
        { type: "code", lang: "cpp", code: "// Attach by name in a controller...\nMETHOD_LIST_BEGIN\nADD_METHOD_TO(Account::profile, \"/me\", Get, \"LoginFilter\");\nMETHOD_LIST_END\n\n// ...or in registerHandler's trailing list\napp().registerHandler(\"/me\", &handler, {Get, \"LoginFilter\"});" },
        { type: "list", items: [
          "Enable **CORS** by adding a filter that sets `Access-Control-Allow-*` headers and answers preflight `Options` requests, or set them via a post-handling advice.",
          "For cross-cutting concerns beyond routing, Drogon has an **AOP** system: register `registerPreRoutingAdvice`, `registerPostHandlingAdvice`, etc. on the app for global request/response hooks.",
          "Filters are also self-registering by class name — just define the class and reference the name."
        ] },
        { type: "link", url: "https://github.com/drogonframework/drogon/wiki/ENG-06-AOP-Aspect-Oriented-Programming", text: "Drogon wiki — AOP / advices (global request lifecycle hooks)" }
      ]
    },
    {
      id: "auth-jwt",
      title: "Auth end-to-end: a JWT filter",
      level: "core",
      body: [
        { type: "p", text: "Drogon has no bundled auth, so the idiomatic pattern is a **filter** that validates a `Bearer` token and stashes the decoded identity where the handler can read it. Drogon ships no JWT type either — pair it with a header-only library like **jwt-cpp**. The key trick: a filter passes data to the handler through the request's **attributes** map (`req->attributes()`)." },
        { type: "code", lang: "cpp", code: "// filters/JwtAuth.h — validate 'Authorization: Bearer <token>'\n#pragma once\n#include <drogon/HttpFilter.h>\n#include <jwt-cpp/jwt.h>\nusing namespace drogon;\n\nclass JwtAuth : public drogon::HttpFilter<JwtAuth> {\n  public:\n    void doFilter(const HttpRequestPtr &req,\n                  FilterCallback &&fcb,\n                  FilterChainCallback &&fccb) override {\n        auto reject = [&](auto code){ auto r = HttpResponse::newHttpResponse();\n                                      r->setStatusCode(code); fcb(r); };\n        std::string h = req->getHeader(\"Authorization\");\n        if (h.rfind(\"Bearer \", 0) != 0) return reject(k401Unauthorized);\n        try {\n            auto decoded = jwt::decode(h.substr(7));\n            jwt::verify()\n                .allow_algorithm(jwt::algorithm::hs256{\"my-secret\"})\n                .with_issuer(\"my-app\")\n                .verify(decoded);\n            // hand the user id to the handler via request attributes\n            req->attributes()->insert(\n                \"user_id\", decoded.get_payload_claim(\"sub\").as_string());\n            fccb();                       // pass\n        } catch (...) {\n            reject(k401Unauthorized);      // bad/expired token\n        }\n    }\n};" },
        { type: "code", lang: "cpp", code: "// Issue a token on login...\nstd::string token = jwt::create()\n    .set_issuer(\"my-app\")\n    .set_subject(std::to_string(user.getValueOfId()))\n    .set_expires_at(std::chrono::system_clock::now() + std::chrono::hours{24})\n    .sign(jwt::algorithm::hs256{\"my-secret\"});\n\n// ...attach the filter by class name, then read the identity in the handler\nMETHOD_LIST_BEGIN\nADD_METHOD_TO(Account::profile, \"/me\", Get, \"JwtAuth\");\nMETHOD_LIST_END\n\nvoid Account::profile(const HttpRequestPtr &req,\n                      std::function<void(const HttpResponsePtr &)> &&cb) const {\n    auto uid = req->getAttributes()->get<std::string>(\"user_id\");\n    // ...load and return the user\n}" },
        { type: "callout", variant: "tip", text: "Stateless JWTs suit APIs (no server-side session store, scales across processes). If you instead want server-managed logins, enable Drogon **sessions** (`req->session()`) and gate routes on a session key — but that pins users to a session store. Keep the signing secret in `custom_config`, not source." },
        { type: "callout", variant: "gotcha", text: "`req->attributes()` is the correct channel for filter→handler data — don't try to mutate the immutable request body. Always verify **expiry** and **algorithm** explicitly (`allow_algorithm`); accepting `alg: none` or an unverified token is a classic JWT vulnerability." }
      ]
    },
    {
      id: "orm",
      title: "Built-in ORM: models & Mapper",
      level: "core",
      body: [
        { type: "p", text: "Drogon ships its own async ORM. You **generate model classes from an existing schema** (Drogon reads the DB, so the schema is the source of truth). Configure a `DbClient` in `config.json`, then use `Mapper<T>` for typed CRUD. Supported backends: **PostgreSQL**, **MySQL/MariaDB**, **SQLite3**." },
        { type: "code", lang: "json", code: "// config.json — db_clients section\n{\n  \"db_clients\": [{\n    \"name\": \"default\",\n    \"rdbms\": \"postgresql\",\n    \"host\": \"127.0.0.1\",\n    \"port\": 5432,\n    \"dbname\": \"mydb\",\n    \"user\": \"postgres\",\n    \"passwd\": \"secret\",\n    \"connection_number\": 4,\n    \"is_fast\": false\n  }]\n}" },
        { type: "code", lang: "json", code: "// models/model.json — tells drogon_ctl what to generate\n{\n  \"rdbms\": \"postgresql\",\n  \"host\": \"127.0.0.1\",\n  \"port\": 5432,\n  \"dbname\": \"mydb\",\n  \"user\": \"postgres\",\n  \"passwd\": \"secret\",\n  \"tables\": [\"users\"]\n}" },
        { type: "code", lang: "bash", code: "# Generate C++ model classes into ./models from the live schema\ndrogon_ctl create model ./models" },
        { type: "code", lang: "cpp", code: "#include \"models/Users.h\"\n#include <drogon/orm/Mapper.h>\nusing namespace drogon::orm;\nusing drogon_model::mydb::Users;\n\nvoid list(const HttpRequestPtr &req,\n          std::function<void(const HttpResponsePtr &)> &&callback) {\n    auto db = drogon::app().getDbClient();          // \"default\"\n    Mapper<Users> mp(db);\n    // Async find with a criteria + chained modifiers\n    mp.orderBy(Users::Cols::_join_time)\n      .limit(25)\n      .findBy(\n        Criteria(Users::Cols::_gender, CompareOperator::EQ, 1),\n        [callback](const std::vector<Users> &users) {\n            Json::Value arr(Json::arrayValue);\n            for (auto &u : users) arr.append(u.toJson());\n            callback(HttpResponse::newHttpJsonResponse(arr));\n        },\n        [callback](const DrogonDbException &e) {\n            auto r = HttpResponse::newHttpResponse();\n            r->setStatusCode(k500InternalServerError);\n            callback(r);\n        });\n}" },
        { type: "list", items: [
          "**Getters** come in two forms: `getUserName()` returns a `shared_ptr` (null = SQL NULL); `getValueOfUserName(def)` returns a value with a default.",
          "`Mapper<T>` offers `findByPrimaryKey`, `findBy`, `findAll`, `insert`, `update`, `deleteByPrimaryKey` — each in **async (callback)**, **future**, and **coroutine** flavors.",
          "**`Criteria`** builds typed WHERE clauses with `&&` / `||` and `CompareOperator::EQ/Like/GT/...`, using generated `Users::Cols::_col` names.",
          "Raw SQL: `db->execSqlAsync(\"... WHERE id=$1\", cb, errCb, 42)` with `$1`/`?` placeholders bound by trailing args."
        ] },
        { type: "callout", variant: "gotcha", text: "Models are generated from the **actual database**, not migrations. After any `ALTER TABLE` you must re-run `drogon_ctl create model` and rebuild, or the compiled classes drift from the schema. Drogon has no built-in migration tool — pair it with an external migrator." }
      ]
    },
    {
      id: "coroutines",
      title: "Coroutines & async DB access",
      level: "core",
      body: [
        { type: "p", text: "With C++20, coroutines turn callback pyramids into linear code. A handler returns `drogon::Task<HttpResponsePtr>` (or `Task<>` with the callback form) and uses `co_await` on the `*Coro` methods. Every async Drogon API has a `Coro` twin: `execSqlAsync` → `execSqlCoro`, and `CoroMapper<T>` mirrors `Mapper<T>`." },
        { type: "code", lang: "cpp", code: "#include <drogon/orm/CoroMapper.h>\nusing namespace drogon;\nusing namespace drogon::orm;\nusing drogon_model::mydb::Users;\n\nTask<HttpResponsePtr> getUser(HttpRequestPtr req, int id) {\n    auto db = app().getDbClient();\n    try {\n        CoroMapper<Users> mp(db);\n        Users user = co_await mp.findByPrimaryKey(id);   // suspends, no block\n        co_return HttpResponse::newHttpJsonResponse(user.toJson());\n    } catch (const DrogonDbException &e) {\n        auto resp = HttpResponse::newHttpResponse();\n        resp->setStatusCode(k404NotFound);\n        co_return resp;\n    }\n}" },
        { type: "code", lang: "cpp", code: "// Transaction inside a coroutine: newTransactionCoro gives an RAII transaction\nTask<> transfer(std::shared_ptr<DbClient> db, int from, int to, int cents) {\n    auto tx = co_await db->newTransactionCoro();\n    co_await tx->execSqlCoro(\"UPDATE acct SET bal=bal-$1 WHERE id=$2\", cents, from);\n    co_await tx->execSqlCoro(\"UPDATE acct SET bal=bal+$1 WHERE id=$2\", cents, to);\n    // commits when tx goes out of scope unless rollback() was called\n    co_return;\n}" },
        { type: "callout", variant: "warn", text: "**Coroutine lifetime is the #1 trap.** Anything captured by reference must outlive every suspension point. The `HttpRequestPtr` and callbacks are `shared_ptr` (safe to capture by value); a local reference or a `std::string_view` into the body may dangle after a `co_await`. Prefer capturing by value." },
        { type: "link", url: "https://github.com/drogonframework/drogon/wiki/ENG-16-Coroutines", text: "Drogon wiki — Coroutines (Task, co_await, awaiters)" }
      ]
    },
    {
      id: "websockets",
      title: "WebSockets",
      level: "deep",
      body: [
        { type: "p", text: "Real-time endpoints use a `WebSocketController<T>` with `WS_PATH_LIST_BEGIN/END` and `WS_PATH_ADD`. Override the three lifecycle hooks; send frames via the `WebSocketConnectionPtr`." },
        { type: "code", lang: "cpp", code: "#include <drogon/WebSocketController.h>\nusing namespace drogon;\n\nclass Echo : public drogon::WebSocketController<Echo> {\n  public:\n    void handleNewMessage(const WebSocketConnectionPtr &conn,\n                          std::string &&msg,\n                          const WebSocketMessageType &type) override {\n        conn->send(\"echo: \" + msg);\n    }\n    void handleNewConnection(const HttpRequestPtr &req,\n                             const WebSocketConnectionPtr &conn) override {\n        conn->send(\"welcome\");\n    }\n    void handleConnectionClosed(const WebSocketConnectionPtr &conn) override {}\n\n    WS_PATH_LIST_BEGIN\n    WS_PATH_ADD(\"/ws/echo\", Get);\n    WS_PATH_LIST_END\n};" },
        { type: "callout", variant: "tip", text: "Store per-connection state with `conn->setContext(...)` / `getContext<T>()`. For broadcast, keep your own thread-safe set of connections (mutate it on the connection's own loop with `conn->getLoop()->queueInLoop`)." }
      ]
    },
    {
      id: "views-sessions",
      title: "Views, sessions & cookies",
      level: "deep",
      body: [
        { type: "p", text: "Drogon has a **CSP** (C++ Server Pages) view engine: `.csp` files mixing HTML and `<%c++ ... c++%>` / `<%=expr%>` are compiled to C++ at build time and rendered with `newHttpViewResponse(\"ViewName\", data)`." },
        { type: "code", lang: "cpp", code: "// Render a CSP view with data\nHttpViewData data;\ndata.insert(\"title\", std::string(\"Home\"));\ndata.insert(\"count\", 42);\ncallback(HttpResponse::newHttpViewResponse(\"Home\", data));\n\n// Sessions (enable_session:true in config): per-client key/value store\nauto session = req->session();\nsession->insert(\"user_id\", 7);\nint uid = session->get<int>(\"user_id\");\n\n// Cookies\nauto resp = HttpResponse::newHttpResponse();\nresp->addCookie(Cookie(\"theme\", \"dark\"));" },
        { type: "callout", variant: "note", text: "Sessions are stored server-side and keyed by a cookie; enable them with `enable_session` (config) or `.enableSession(...)` in code. For APIs you'll usually prefer stateless JWTs in a filter instead." }
      ]
    },
    {
      id: "plugins-config",
      title: "Plugins, custom config & exceptions",
      level: "deep",
      body: [
        { type: "p", text: "A **plugin** (`drogon::Plugin<T>`) is a long-lived object with `initAndStart(config)` / `shutdown`, listed in `config.json`'s `plugins` array and started at boot — ideal for connection pools, background workers, or shared services. Retrieve one with `app().getPlugin<MyPlugin>()`." },
        { type: "code", lang: "cpp", code: "class Cache : public drogon::Plugin<Cache> {\n  public:\n    void initAndStart(const Json::Value &config) override {\n        ttl_ = config.get(\"ttl\", 60).asInt();\n    }\n    void shutdown() override {}\n  private:\n    int ttl_ = 60;\n};\n\n// elsewhere: drogon::app().getPlugin<Cache>()->..." },
        { type: "list", items: [
          "**Custom config:** arbitrary keys under `\"custom_config\"` in `config.json` are readable via `app().getCustomConfig()`.",
          "**Exceptions:** register `app().setExceptionHandler(...)` to convert uncaught exceptions thrown in handlers into a controlled `HttpResponse` instead of a 500.",
          "**Redis:** Drogon includes an async Redis client (`app().getRedisClient()`) with the same callback/coroutine model as the DB clients."
        ] },
        { type: "link", url: "https://github.com/drogonframework/drogon/wiki/ENG-11-Plugins", text: "Drogon wiki — Plugins" }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Drogon ships a lightweight test framework (`drogon::test`) and `drogon_ctl create project` can scaffold a test target. You spin up the app on a loop in a thread and drive it with an `HttpClient`, or unit-test pure logic directly." },
        { type: "code", lang: "cpp", code: "#include <drogon/drogon_test.h>\n#include <drogon/HttpClient.h>\nusing namespace drogon;\n\nDROGON_TEST(GetUser) {\n    auto client = HttpClient::newHttpClient(\"http://127.0.0.1:8080\");\n    auto req = HttpRequest::newHttpRequest();\n    req->setPath(\"/user/1/info\");\n    client->sendRequest(req, [TEST_CTX](ReqResult r, const HttpResponsePtr &resp) {\n        REQUIRE(r == ReqResult::Ok);\n        CHECK(resp->getStatusCode() == k200OK);\n    });\n}\n\nint main() {\n    // start app on a background thread, then:\n    return drogon::test::run(0, nullptr);\n}" },
        { type: "callout", variant: "tip", text: "`TEST_CTX` keeps the async assertion context alive across the callback — capture it in every lambda that runs `CHECK`/`REQUIRE`, or the test finishes before the response arrives." }
      ]
    },
    {
      id: "deploy-perf",
      title: "Deployment & performance notes",
      level: "deep",
      body: [
        { type: "list", items: [
          "Ship a **static or slim** binary + its `config.json`; a small multi-stage Docker image (build stage with the toolchain, runtime stage with just the binary and shared libs) is the common pattern.",
          "Set `threads_num` to 0 (one loop per core). Because loops are single-threaded, Drogon scales vertically extremely well — a single process usually saturates the box; put **nginx** in front only for TLS termination or static assets if you prefer.",
          "Enable Drogon's built-in **gzip/brotli** compression and static-file caching via config.",
          "Turn on **`is_fast`** DB clients (one connection pinned per event loop) for the lowest-latency query path when you don't need cross-loop sharing."
        ] },
        { type: "code", lang: "bash", code: "# Multi-stage Docker sketch\n# FROM drogonframework/drogon AS build\n# COPY . /src && cd /src/build && cmake .. && make -j\n# FROM ubuntu:24.04\n# COPY --from=build /src/build/my_app /app/my_app\n# COPY config.json /app/config.json\n# CMD [\"/app/my_app\"]" },
        { type: "callout", variant: "good", text: "Drogon's single biggest performance win is architectural: non-blocking I/O + coroutine DB access means one thread handles thousands of in-flight requests. Keep every handler non-blocking and you inherit the benchmark-topping throughput for free." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "Drogon's speed comes from a *small* pool of single-threaded event loops. That architecture is also where every sharp edge lives: block a loop and you stall thousands of requests; capture a reference across a `co_await` and it dangles; forget a registration macro and you get a silent 404. Here is each trap and its fix." },

        { type: "heading", text: "1. Blocking the event loop" },
        { type: "p", text: "There is no thread-per-request pool. A handler runs *on* one of the few event loops, so any blocking call — a synchronous DB driver, `std::this_thread::sleep_for`, a big CPU crunch, a blocking file read — freezes **every other in-flight request** pinned to that loop. Under load the symptom is baffling: throughput collapses and latencies spike even though CPU looks idle (the loop is parked in a blocking syscall)." },
        { type: "code", lang: "cpp", code: "// WRONG — blocks the whole event loop; every request on this loop stalls\nvoid slow(const HttpRequestPtr &req,\n          std::function<void(const HttpResponsePtr &)> &&cb) {\n    std::this_thread::sleep_for(std::chrono::seconds(2));   // NEVER on a loop\n    auto rows = blockingQuery();                            // sync DB = poison\n    cb(HttpResponse::newHttpResponse());\n}\n\n// RIGHT (coroutine) — co_await suspends the loop instead of blocking it\nTask<HttpResponsePtr> fast(HttpRequestPtr req) {\n    auto db   = app().getDbClient();\n    auto rows = co_await db->execSqlCoro(\"SELECT * FROM users\");   // yields, no block\n    co_return HttpResponse::newHttpJsonResponse(rowsToJson(rows));\n}\n\n// RIGHT (unavoidable blocking/CPU work) — push it off the loop to a worker thread\nvoid report(const HttpRequestPtr &req,\n            std::function<void(const HttpResponsePtr &)> &&cb) {\n    // trantor thread pool: run heavy work off the event loops, reply when done\n    static trantor::EventLoopThreadPool pool(2);   // create once, not per request\n    pool.getNextLoop()->queueInLoop([cb = std::move(cb)]{\n        auto body = heavyCpuCrunch();              // safe: not on a request loop\n        auto resp = HttpResponse::newHttpResponse();\n        resp->setBody(body);\n        cb(resp);\n    });\n}" },
        { type: "callout", variant: "gotcha", text: "**Fix:** never block a handler. Use the **async/coroutine** DB and I/O APIs (`execSqlCoro`, `*Async`) so the loop suspends instead of parking. For genuinely blocking libraries or CPU-bound work, offload to a **worker thread / `trantor::EventLoopThreadPool`** and invoke the `callback` when done — never do the heavy work inline. `app().getLoop()->queueInLoop(...)` schedules work on a loop but does **not** make blocking work safe; it still runs on a loop thread." },

        { type: "heading", text: "2. Coroutine gotchas (co_await, Task<>)" },
        { type: "p", text: "Coroutines make async code read like sync code, but they need a C++20 compiler and the coroutine-enabled `DbClient`, and they change the lifetime rules. The two classic failures are a dangling capture across a suspension point and an exception thrown across `co_await` that you never catch." },
        { type: "code", lang: "cpp", code: "// WRONG — 'body' is a string_view into the request; after co_await it may dangle\nTask<HttpResponsePtr> bad(HttpRequestPtr req) {\n    std::string_view body = req->getBody();      // view, not owned\n    co_await someAsyncThing();                    // suspension point\n    parse(body);                                  // body may be invalid here\n    co_return HttpResponse::newHttpResponse();\n}\n\n// RIGHT — copy out what you need BEFORE the first co_await; wrap DB in try/catch\nTask<HttpResponsePtr> good(HttpRequestPtr req) {   // req is a shared_ptr: safe by value\n    std::string body{req->getBody()};             // own the bytes\n    try {\n        auto db = app().getDbClient();\n        co_await db->execSqlCoro(\"INSERT INTO log(body) VALUES($1)\", body);\n    } catch (const DrogonDbException &e) {\n        auto r = HttpResponse::newHttpResponse();\n        r->setStatusCode(k500InternalServerError);\n        co_return r;                               // an uncaught throw here would 500 the request\n    }\n    co_return HttpResponse::newHttpResponse();\n}" },
        { type: "callout", variant: "gotcha", text: "**Fix:** compile with **C++20** and a coroutine-capable `DbClient`; capture the `HttpRequestPtr`/callback **by value** (they are `shared_ptr`) and copy any `string_view`/reference into an owned value *before* the first `co_await`. Wrap `co_await`ed DB/IO in `try/catch` (`DrogonDbException`) — an exception that escapes a coroutine handler surfaces as a 500 and can be hard to trace. Fire-and-forget coroutines should use `drogon::async_run(...)` so they're driven to completion." },

        { type: "heading", text: "3. Silent 404s from missing registration" },
        { type: "p", text: "Controllers self-register, but only if the registration macros are present *and* the translation unit is compiled and linked. Forget the `METHOD_LIST_BEGIN/END` block, forget to add the `.cc` to CMake, or mistype the path, and the route simply doesn't exist — the request 404s with no error at build time." },
        { type: "code", lang: "cpp", code: "class User : public drogon::HttpController<User> {\n  public:\n    METHOD_LIST_BEGIN                                  // REQUIRED — omit it and every route is a 404\n    ADD_METHOD_TO(User::getInfo, \"/user/{id}/info\", Get);\n    METHOD_LIST_END\n\n    void getInfo(const HttpRequestPtr &req,\n                 std::function<void(const HttpResponsePtr &)> &&callback,\n                 int userId) const;\n};" },
        { type: "code", lang: "cmake", code: "# The controller's .cc MUST be compiled in, or the self-registration never runs\naux_source_directory(controllers CTL_SRC)\ntarget_sources(my_app PRIVATE \${CTL_SRC})\n# Static libs are worse: the linker may drop \"unused\" controller objects.\n# Force them in with --whole-archive (GCC/Clang) or /WHOLEARCHIVE (MSVC).\ntarget_link_options(my_app PRIVATE LINKER:--whole-archive)" },
        { type: "callout", variant: "gotcha", text: "**Fix:** every route needs its `ADD_METHOD_TO`/`METHOD_ADD` inside a `METHOD_LIST_BEGIN/END` block, and the controller's `.cc` must actually be compiled into the binary (add it to CMake). If routes vanish when you move controllers into a **static library**, the linker garbage-collected the unreferenced registration objects — link the controller lib with `--whole-archive`. Dump the live route table at startup with `drogon_ctl` / `app().getHandlersInfo()` to confirm what registered. Controllers are **singletons** — don't store per-request state in members." },

        { type: "heading", text: "4. Dangling captures & callback lifetime" },
        { type: "p", text: "In the classic (non-coroutine) API you reply by invoking a `callback`, often from *inside* an async completion that runs later. Capturing a **reference** to something owned by the current stack frame — or to the `callback` itself by reference — means it's gone by the time the async op completes." },
        { type: "code", lang: "cpp", code: "// WRONG — captures the callback by reference; the frame is gone when the query finishes\nvoid bad(const HttpRequestPtr &req,\n         std::function<void(const HttpResponsePtr &)> &&cb) {\n    auto db = app().getDbClient();\n    db->execSqlAsync(\"SELECT 1\",\n        [&cb](const orm::Result &r){ cb(HttpResponse::newHttpResponse()); },  // &cb dangles\n        [](const orm::DrogonDbException &){});\n}\n\n// RIGHT — move the callback INTO the lambda; capture request by value (shared_ptr)\nvoid good(const HttpRequestPtr &req,\n          std::function<void(const HttpResponsePtr &)> &&cb) {\n    auto db = app().getDbClient();\n    db->execSqlAsync(\"SELECT 1\",\n        [cb = std::move(cb)](const orm::Result &r){        // callback owned by the lambda\n            cb(HttpResponse::newHttpJsonResponse(Json::Value{}));\n        },\n        [cb](const orm::DrogonDbException &e){             // error path must reply too\n            auto resp = HttpResponse::newHttpResponse();\n            resp->setStatusCode(k500InternalServerError);\n            cb(resp);\n        });\n}" },
        { type: "callout", variant: "gotcha", text: "**Fix:** move the `callback` into the async lambda (`[cb = std::move(cb)]`) so it outlives the handler frame, and capture the `HttpRequestPtr` **by value** — it's a `shared_ptr`, so it stays alive as long as the lambda does. Never capture local references or `string_view`s into the body across an async boundary. And make sure **every** path (including the error callback) invokes the callback exactly once — forgetting it leaks the connection until it times out." },

        { type: "heading", text: "5. Config & build wiring" },
        { type: "p", text: "Two config/build details bite newcomers: `threads_num` *is* the number of event loops (get it wrong and you either under-use cores or oversubscribe them), and the `drogon_ctl` codegen must be re-run after schema or view changes so the generated C++ matches reality." },
        { type: "code", lang: "json", code: "{\n  \"app\": {\n    \"threads_num\": 0,          // 0 = one event loop per hardware core (usual prod value)\n    \"document_root\": \"./static\"\n  },\n  \"db_clients\": [\n    { \"name\": \"default\", \"rdbms\": \"postgresql\", \"host\": \"127.0.0.1\",\n      \"port\": 5432, \"dbname\": \"mydb\", \"user\": \"pg\", \"passwd\": \"secret\",\n      \"connection_number\": 4, \"is_fast\": false }\n  ]\n}" },
        { type: "code", lang: "bash", code: "# Re-run codegen after ANY schema change, then rebuild\ndrogon_ctl create model ./models     # models are generated from the LIVE db\n# ...and after editing .csp views, let CMake's drogon_create_views regenerate them\ncmake --build build\n\n# 'drogon_ctl not found' after install? the bin dir isn't on PATH,\n# or the shared lib cache is stale:\nsudo ldconfig" },
        { type: "callout", variant: "gotcha", text: "**Fix:** set `threads_num` to `0` (one loop per core) for production; remember each loop is single-threaded, so \"add more threads\" does not rescue a blocking handler — fix the blocking first. Re-run `drogon_ctl create model` after every `ALTER TABLE` (Drogon has no migrations — models drift silently from the schema otherwise) and let CMake regenerate `.csp` views. If `drogon_ctl` isn't found post-install, its `bin` dir isn't on `PATH` or the loader cache is stale (`sudo ldconfig`). A `getDbClient()` returning null means no matching `db_clients` entry in `config.json`." }
      ]
    }
  ],

  packages: [
    { name: "drogon", why: "the framework library itself (link Drogon::Drogon)" },
    { name: "trantor", why: "Drogon's async event-loop / networking core (bundled)" },
    { name: "jsoncpp", why: "JSON parsing & Json::Value used throughout" },
    { name: "drogon_ctl", why: "CLI: scaffold projects, generate models & views" },
    { name: "libpq", why: "PostgreSQL client lib for the ORM" },
    { name: "mysqlclient / mariadb", why: "MySQL/MariaDB client for the ORM" },
    { name: "sqlite3", why: "embedded SQLite backend for the ORM" },
    { name: "OpenSSL", why: "TLS listeners + hashing utilities" },
    { name: "jwt-cpp", why: "header-only JWT create/verify (Drogon bundles no auth)" },
    { name: "CMake", why: "build system; find_package(Drogon)" },
    { name: "vcpkg / Conan", why: "package managers to pull Drogon prebuilt" }
  ],

  gotchas: [
    "**Never block the event loop.** A blocking call (`std::this_thread::sleep`, a sync DB driver, a big CPU crunch) inside a handler stalls *every* request on that loop. Offload with `app().getLoop()->runInLoop`/a thread, or use the async/coroutine APIs.",
    "**Coroutine lifetime:** references and `string_view`s captured before a `co_await` can dangle after it. Capture the `shared_ptr` request/callback by value and copy out any body slices you need.",
    "**ORM models are generated from the live DB schema**, not migrations — re-run `drogon_ctl create model` and rebuild after every schema change or the compiled classes drift.",
    "**Build complexity:** Drogon is a compiled C++ dependency; mismatched compiler/C++ standard (coroutines need C++20) or a stale `ldconfig` cache cause confusing link/runtime errors.",
    "Handler **parameter count must match** the path placeholders (extras are pulled from the request via `fromRequest`); a mismatch yields silent mis-binding or 404s.",
    "**Uploads over `client_max_body_size`** are rejected before your handler runs — raise it (and `upload_path`) in `config.json` for large files, and stream big responses via `newFileResponse`/`newStreamResponse`.",
    "A **filter passes data to the handler** through `req->attributes()`, not by mutating the (immutable) request. When verifying JWTs, always pin the algorithm and check expiry.",
    "Responses are `shared_ptr` and some are cached by the framework — don't mutate a response after passing it to `callback`.",
    "`getDbClient()` returns nullptr if no `db_clients` entry matches the name — always configure the client before using `Mapper`.",
    "**Missing registration = silent 404:** a route needs `ADD_METHOD_TO`/`METHOD_ADD` inside `METHOD_LIST_BEGIN/END`, and the controller's `.cc` must be compiled into the binary. If controllers live in a **static library**, link it with `--whole-archive` or the linker drops the self-registration objects.",
    "**Async callback lifetime:** in the classic API, move the `callback` into the async lambda (`[cb = std::move(cb)]`) and capture the request by value (`shared_ptr`) — capturing either by reference dangles once the handler frame returns. Reply on **every** path (including the error callback) exactly once, or the connection leaks until timeout.",
    "`threads_num` *is* the number of event loops; since each loop is single-threaded, adding threads does **not** fix a blocking handler — remove the blocking call first."
  ],

  flashcards: [
    { q: "What networking core does Drogon run on, and what's its concurrency model?", a: "**Trantor** — a non-blocking, epoll/kqueue event-loop library. Drogon runs a pool of single-threaded event loops (typically one per CPU core)." },
    { q: "How do you define a controller route with a path parameter?", a: "Inherit `drogon::HttpController<T>`, then inside `METHOD_LIST_BEGIN/END` use `ADD_METHOD_TO(Class::method, \"/path/{id}\", Get);` — the `{id}` binds to a trailing handler parameter." },
    { q: "How does a classic (non-coroutine) handler return a response?", a: "It takes a `std::function<void(const HttpResponsePtr&)>&& callback` and calls `callback(resp)` — it doesn't `return` the response." },
    { q: "How do you build a JSON response?", a: "Fill a jsoncpp `Json::Value`, then `HttpResponse::newHttpJsonResponse(value)` (which also sets Content-Type)." },
    { q: "What is a Drogon Filter and how does it short-circuit?", a: "Middleware inheriting `HttpFilter<T>`; `doFilter` gets `FilterCallback fcb` (call it to reject with a response) and `FilterChainCallback fccb` (call it to pass to the next handler)." },
    { q: "How do you generate ORM model classes?", a: "Write a `model.json` with DB connection + tables, then run `drogon_ctl create model ./models`. Models are generated from the live schema." },
    { q: "What does `Mapper<T>` provide over raw SQL?", a: "Typed CRUD (`findByPrimaryKey`, `findBy`, `insert`, `update`, `deleteByPrimaryKey`) with `Criteria` WHERE-builders, in async, future, and coroutine forms." },
    { q: "How do coroutine DB calls look, and what's the naming convention?", a: "Handler returns `drogon::Task<HttpResponsePtr>` and uses `co_await db->execSqlCoro(...)` or `CoroMapper<T>`. Every async API has a `Coro` twin; end with `co_return resp`." },
    { q: "What is the single most dangerous mistake in a Drogon handler?", a: "Blocking the event loop (sleep, sync DB, heavy CPU) — it freezes all requests on that loop. Keep handlers non-blocking / async." },
    { q: "How do you register a WebSocket endpoint?", a: "Inherit `WebSocketController<T>`, override `handleNewMessage/handleNewConnection/handleConnectionClosed`, and map the path with `WS_PATH_ADD(\"/ws\", Get)` inside `WS_PATH_LIST_BEGIN/END`." },
    { q: "What's the difference between a filter and an AOP advice?", a: "A **filter** is *per-route* middleware attached by class name (auth/validation for specific endpoints). An **advice** (`registerPreRoutingAdvice`/`registerPostHandlingAdvice`) is a *global* lifecycle hook registered once on `app()` for every request." },
    { q: "How do you handle a multipart file upload?", a: "Use `MultiPartParser`: `parser.parse(req)`, then `getFiles()` gives `HttpFile`s (`saveAs(path)`, `fileContent()`, `getContentType()`) and `getParameters()` gives the non-file fields. Cap size with `client_max_body_size` in config." },
    { q: "How does an auth filter pass the decoded user to the handler?", a: "Through the request **attributes** map: `req->attributes()->insert(\"user_id\", id)` in the filter, then `req->getAttributes()->get<...>(\"user_id\")` in the handler — the request body itself is immutable." },
    { q: "A route returns 404 even though the controller compiles — what are the two usual causes?", a: "Either the route macro is missing/outside the `METHOD_LIST_BEGIN/END` block, or the controller's `.cc` isn't compiled/linked so its self-registration never runs. In a **static library**, the linker drops the unreferenced registration objects — link with `--whole-archive`." },
    { q: "In a classic (callback) handler, why does capturing the callback by reference in an async lambda crash, and what's the fix?", a: "The handler frame returns before the async op completes, so a captured reference dangles. **Move** the callback into the lambda (`[cb = std::move(cb)]`) and capture the `HttpRequestPtr` by value (it's a `shared_ptr`). Reply on every path, including the error callback." }
  ],

  cheatsheet: [
    { label: "New project", code: "drogon_ctl create project my_app" },
    { label: "Generate models", code: "drogon_ctl create model ./models" },
    { label: "Bootstrap", code: "drogon::app().loadConfigFile(\"config.json\").run();" },
    { label: "Controller route", code: "ADD_METHOD_TO(User::getInfo, \"/user/{id}\", Get);" },
    { label: "Lambda route", code: "app().registerHandler(\"/hi/{n}\", handler, {Get});" },
    { label: "JSON response", code: "callback(HttpResponse::newHttpJsonResponse(json));" },
    { label: "Coroutine query", code: "auto r = co_await db->execSqlCoro(\"SELECT 1\");" },
    { label: "ORM find", code: "Mapper<Users>(db).findByPrimaryKey(id, cb, errCb);" },
    { label: "Save upload", code: "MultiPartParser p; p.parse(req); p.getFiles()[0].saveAs(path);" },
    { label: "File download", code: "HttpResponse::newFileResponse(path, name, CT_APPLICATION_PDF);" },
    { label: "Filter -> handler", code: "req->attributes()->insert(\"user_id\", id);" },
    { label: "CMake link", code: "target_link_libraries(app PRIVATE Drogon::Drogon)" },
    { label: "Own callback in async", code: "db->execSqlAsync(sql, [cb = std::move(cb)](auto &r){ cb(resp); }, errCb);" },
    { label: "Offload blocking work", code: "loop->queueInLoop([cb = std::move(cb)]{ cb(heavyResp()); });" }
  ]
});
