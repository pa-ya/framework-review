(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "cpp-drogon",
  name: "Drogon",
  language: "C++",
  tagline: "A **non-blocking**, event-loop C++17/20 HTTP framework — coroutine DB access, a built-in ORM, and top-tier **TechEmpower** throughput.",
  color: "#e04a3f",
  readMinutes: 20,
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
        { type: "code", lang: "cmake", code: "cmake_minimum_required(VERSION 3.5)\nproject(my_app CXX)\n\nset(CMAKE_CXX_STANDARD 20)          # 17 minimum; 20 for coroutines\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\n\nfind_package(Drogon CONFIG REQUIRED)\n\nadd_executable(my_app main.cc)\n\n# Compile controllers, models, filters, and generated views\naux_source_directory(controllers CTL_SRC)\naux_source_directory(models      MODEL_SRC)\ntarget_sources(my_app PRIVATE ${CTL_SRC} ${MODEL_SRC})\n\ntarget_link_libraries(my_app PRIVATE Drogon::Drogon)" },
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
    { name: "CMake", why: "build system; find_package(Drogon)" },
    { name: "vcpkg / Conan", why: "package managers to pull Drogon prebuilt" }
  ],

  gotchas: [
    "**Never block the event loop.** A blocking call (`std::this_thread::sleep`, a sync DB driver, a big CPU crunch) inside a handler stalls *every* request on that loop. Offload with `app().getLoop()->runInLoop`/a thread, or use the async/coroutine APIs.",
    "**Coroutine lifetime:** references and `string_view`s captured before a `co_await` can dangle after it. Capture the `shared_ptr` request/callback by value and copy out any body slices you need.",
    "**ORM models are generated from the live DB schema**, not migrations — re-run `drogon_ctl create model` and rebuild after every schema change or the compiled classes drift.",
    "**Build complexity:** Drogon is a compiled C++ dependency; mismatched compiler/C++ standard (coroutines need C++20) or a stale `ldconfig` cache cause confusing link/runtime errors.",
    "Handler **parameter count must match** the path placeholders (extras are pulled from the request via `fromRequest`); a mismatch yields silent mis-binding or 404s.",
    "Responses are `shared_ptr` and some are cached by the framework — don't mutate a response after passing it to `callback`.",
    "`getDbClient()` returns nullptr if no `db_clients` entry matches the name — always configure the client before using `Mapper`."
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
    { q: "How do you register a WebSocket endpoint?", a: "Inherit `WebSocketController<T>`, override `handleNewMessage/handleNewConnection/handleConnectionClosed`, and map the path with `WS_PATH_ADD(\"/ws\", Get)` inside `WS_PATH_LIST_BEGIN/END`." }
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
    { label: "CMake link", code: "target_link_libraries(app PRIVATE Drogon::Drogon)" }
  ]
});
