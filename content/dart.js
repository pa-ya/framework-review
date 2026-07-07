(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "dart",
  name: "Dart (Backend)",
  language: "Dart",
  group: "Others",
  navLabel: "Dart",
  tagline: "Server-side Dart: **AOT-compiled** native binaries, sound null safety, an event loop for concurrency and `Isolate`s for parallelism.",
  color: "#0175C2",
  readMinutes: 24,
  sections: [
    {
      id: "overview",
      title: "Dart Beyond Flutter",
      level: "core",
      body: [
        { type: "p", text: "Most people meet Dart through Flutter, but the language is a perfectly good general-purpose server runtime. It **AOT-compiles to standalone native executables** (no runtime/interpreter to ship), starts in milliseconds, and has a fast JIT VM for development. The killer combination for backend work is **sound null safety** plus a single-threaded **event loop** for I/O concurrency, with **isolates** for true parallelism." },
        { type: "heading", text: "Why pick Dart for a backend?" },
        { type: "list", items: [
          "Your team already writes Flutter and wants **one language full-stack** (shared models, validation, and DTOs between client and server).",
          "You want **fast cold starts** and small, self-contained binaries (great for containers and serverless).",
          "You want strong static typing with a modern feel: records, pattern matching, sealed classes, exhaustive switches.",
          "High-throughput I/O services (APIs, proxies, real-time gateways) where the event loop shines."
        ] },
        { type: "heading", text: "The server framework landscape" },
        { type: "table", headers: ["Option", "What it is", "Use when"], rows: [
          ["dart:io", "Raw HttpServer in the SDK, no deps", "Learning, tiny tools, full control"],
          ["Shelf", "Composable middleware + handlers (de-facto standard)", "Most APIs; you want control + ecosystem"],
          ["Dart Frog", "File-based routing on top of Shelf, modern DX", "You like Next.js-style routing and fast iteration"],
          ["Serverpod", "Batteries-included backend with codegen, ORM, auth", "You want a full framework and generated Flutter client"]
        ] },
        { type: "callout", variant: "tip", text: "Shelf is the foundation almost everything else builds on. Learn Shelf first; Dart Frog is essentially Shelf with ergonomic routing, and you can drop to raw Shelf handlers any time." },
        { type: "p", text: "The rest of this deck summarizes the language, then goes deep on the concurrency model (event loop + isolates), Shelf, Dart Frog, JSON, databases, auth, and deployment — the things a backend developer actually needs." }
      ]
    },
    {
      id: "language-essentials",
      title: "Language Essentials",
      level: "core",
      body: [
        { type: "p", text: "A fast tour of the syntax you will use constantly. Dart is class-based, statically typed with inference, and null-safe by default." },
        { type: "heading", text: "Variables and null safety" },
        { type: "code", lang: "dart", code: "var count = 0;          // inferred int, mutable\nfinal name = \"ada\";     // runtime constant, set once\nconst pi = 3.14159;      // compile-time constant\n\n// Sound null safety: types are non-nullable unless you add ?\nString title = \"Hello\";  // can never be null\nString? maybe;           // may be null (defaults to null)\n\nint length = maybe?.length ?? 0;   // ?. short-circuits, ?? provides default\nString sure = maybe!;              // ! asserts non-null (throws if wrong)\n\nlate final String config;          // promise to assign before first read\nconfig = loadConfig();             // reading before this throws LateInitializationError" },
        { type: "heading", text: "Functions" },
        { type: "code", lang: "dart", code: "// Positional required + arrow body\nint add(int a, int b) => a + b;\n\n// Named parameters; 'required' makes one mandatory, others have defaults\nString greet(String name, {String greeting = \"Hi\", bool loud = false}) {\n  final msg = \"$greeting, $name\";\n  return loud ? msg.toUpperCase() : msg;\n}\n\n// Optional positional params in [ ]\nint clamp(int x, [int min = 0, int max = 100]) =>\n    x < min ? min : (x > max ? max : x);\n\ngreet(\"Ada\", greeting: \"Welcome\", loud: true); // WELCOME, ADA" },
        { type: "heading", text: "Classes, constructors, factories, getters" },
        { type: "code", lang: "dart", code: "class User {\n  final String id;\n  final String email;\n  int _loginCount = 0;\n\n  // Primary constructor with initializing formals\n  User(this.id, this.email);\n\n  // Named constructor\n  User.guest() : id = \"guest\", email = \"guest@example.com\";\n\n  // Factory can return cached/subtype instances or parse\n  factory User.fromRow(Map<String, Object?> row) =>\n      User(row[\"id\"] as String, row[\"email\"] as String);\n\n  // Getter (computed property)\n  String get domain => email.split(\"@\").last;\n\n  void recordLogin() => _loginCount++;\n}" },
        { type: "heading", text: "Records and destructuring" },
        { type: "p", text: "Records are lightweight anonymous tuples — great for returning multiple values without a class." },
        { type: "code", lang: "dart", code: "(int, String) minMaxLabel(List<int> xs) {\n  final m = xs.reduce((a, b) => a < b ? a : b);\n  return (m, \"min is $m\");\n}\n\n// Named fields + destructuring\n({String host, int port}) endpoint() => (host: \"localhost\", port: 8080);\n\nfinal (host: h, port: p) = endpoint();\nprint(\"$h:$p\"); // localhost:8080" },
        { type: "heading", text: "Pattern matching, sealed classes, switch expressions" },
        { type: "p", text: "`sealed` classes let the compiler verify a `switch` is **exhaustive** — you cannot forget a case. This is the idiomatic way to model result/state unions." },
        { type: "code", lang: "dart", code: "sealed class Shape {}\nclass Circle extends Shape { final double r; Circle(this.r); }\nclass Rect extends Shape { final double w, h; Rect(this.w, this.h); }\n\n// switch expression + object patterns; no default needed (exhaustive)\ndouble area(Shape s) => switch (s) {\n  Circle(:final r) => 3.14159 * r * r,\n  Rect(:final w, :final h) => w * h,\n};" },
        { type: "heading", text: "Enums with members" },
        { type: "code", lang: "dart", code: "enum Role {\n  admin(2),\n  editor(1),\n  viewer(0);\n\n  final int level;\n  const Role(this.level);\n\n  bool canEdit() => level >= editor.level;\n}" },
        { type: "callout", variant: "note", text: "Collection literals support spread (`...`), null-aware spread (`...?`), `if`, and `for` inside them — e.g. `[if (admin) 'panel', ...defaultTabs]`." }
      ]
    },
    {
      id: "async",
      title: "Async: The Event Loop, Futures & Streams",
      level: "core",
      body: [
        { type: "p", text: "This is the single most important concept for backend Dart. Each isolate runs a **single-threaded event loop**. Your code never runs in parallel with itself inside one isolate — instead, I/O operations register callbacks and the loop picks them up when data is ready. `async`/`await` is syntactic sugar over this." },
        { type: "heading", text: "Future and async/await" },
        { type: "code", lang: "dart", code: "Future<String> fetchUser(String id) async {\n  final conn = await pool.acquire();          // suspends; loop does other work\n  try {\n    final rows = await conn.query(\"...\", [id]);\n    return rows.single[\"email\"] as String;\n  } catch (e, stack) {\n    print(\"query failed: $e\\n$stack\");\n    rethrow;\n  } finally {\n    conn.release();\n  }\n}" },
        { type: "heading", text: "Running work concurrently" },
        { type: "p", text: "Because I/O overlaps, you should fire independent requests together with `Future.wait` instead of awaiting them one-by-one." },
        { type: "code", lang: "dart", code: "// Slow: sequential, total = a + b + c\nfinal a = await fetchA();\nfinal b = await fetchB();\n\n// Fast: concurrent, total = max(a, b, c)\nfinal results = await Future.wait([fetchA(), fetchB(), fetchC()]);\nfinal (ra, rb, rc) = (results[0], results[1], results[2]);\n\n// Race the fastest response\nfinal first = await Future.any([primary(), replica()]);" },
        { type: "heading", text: "Streams: many values over time" },
        { type: "p", text: "A `Future` yields one value; a `Stream` yields many. Use `await for` to consume, and pick **single-subscription** (one listener, e.g. file/socket reads) vs **broadcast** (many listeners, e.g. an event bus)." },
        { type: "code", lang: "dart", code: "Stream<int> countTo(int n) async* {\n  for (var i = 1; i <= n; i++) {\n    await Future.delayed(Duration(milliseconds: 100));\n    yield i;                 // emit a value\n  }\n}\n\nawait for (final i in countTo(3)) {\n  print(i); // 1, 2, 3\n}\n\n// Manual control with a StreamController (broadcast so multiple can listen)\nfinal controller = StreamController<String>.broadcast();\nfinal sub = controller.stream.listen((e) => print(\"event: $e\"));\ncontroller.add(\"login\");\nawait sub.cancel();          // ALWAYS cancel to avoid leaks\nawait controller.close();" },
        { type: "callout", variant: "gotcha", text: "Never do heavy synchronous CPU work in a handler — a tight loop hashing or parsing blocks the ENTIRE event loop, freezing every other request. Offload it to an isolate (next section)." },
        { type: "callout", variant: "warn", text: "Forgetting `await` on a Future is a real bug: the work runs unawaited (\"fire and forget\") and any thrown error becomes an unhandled async exception. Turn on the `unawaited_futures` lint." }
      ]
    },
    {
      id: "isolates",
      title: "Isolates: Dart's Parallelism Model",
      level: "core",
      body: [
        { type: "p", text: "Threads share memory; **isolates do not**. Each isolate has its own memory heap and its own event loop. They communicate only by **passing messages** (copies) over ports. This design eliminates data races entirely — but it also means you cannot share mutable objects (like a DB pool) between isolates by reference." },
        { type: "heading", text: "The easy path: Isolate.run" },
        { type: "p", text: "For a one-shot CPU-bound task, `Isolate.run` spins up an isolate, runs your function, returns the result, and shuts it down. Use it so hashing/parsing/image work does not block request handling." },
        { type: "code", lang: "dart", code: "import \"dart:isolate\";\nimport \"dart:convert\";\nimport \"package:crypto/crypto.dart\";\n\nFuture<String> hashPassword(String pw) {\n  // Runs on another core; the main event loop stays responsive.\n  return Isolate.run(() {\n    final bytes = utf8.encode(pw);\n    return sha256.convert(bytes).toString();\n  });\n}\n\nfinal digest = await hashPassword(\"secret\"); // does NOT block other requests" },
        { type: "heading", text: "The manual path: ports for long-lived workers" },
        { type: "code", lang: "dart", code: "import \"dart:isolate\";\n\nFuture<void> spawnWorker() async {\n  final receive = ReceivePort();\n  await Isolate.spawn(_worker, receive.sendPort);\n\n  // First message is the worker's SendPort for us to talk back.\n  final SendPort toWorker = await receive.first as SendPort;\n\n  final reply = ReceivePort();\n  toWorker.send([\"parse-big-file\", reply.sendPort]);\n  final result = await reply.first;\n  print(\"worker returned: $result\");\n}\n\nvoid _worker(SendPort toMain) {\n  final port = ReceivePort();\n  toMain.send(port.sendPort);\n  port.listen((msg) {\n    final (task, SendPort reply) = (msg[0], msg[1] as SendPort);\n    reply.send(\"done: $task\");\n  });\n}" },
        { type: "heading", text: "Scaling HTTP servers across cores" },
        { type: "p", text: "One isolate uses one core. To use all cores for an HTTP server, spawn several isolates that each bind the **same** port with `shared: true`; the OS load-balances connections across them." },
        { type: "callout", variant: "gotcha", text: "You cannot pass a live database connection pool to another isolate — it would be copied/severed. Give each isolate its own pool, or keep DB work on one isolate and only offload pure CPU tasks." }
      ]
    },
    {
      id: "setup",
      title: "Project Setup & Toolchain",
      level: "core",
      body: [
        { type: "p", text: "The `dart` CLI is the whole toolchain: create, fetch deps, run, test, format, analyze, and compile." },
        { type: "code", lang: "bash", code: "dart create -t server-shelf my_api   # scaffold a Shelf server\ncd my_api\ndart pub get                          # fetch dependencies\ndart run bin/server.dart              # run on the JIT VM\ndart compile exe bin/server.dart -o build/server  # AOT native binary" },
        { type: "heading", text: "pubspec.yaml" },
        { type: "code", lang: "yaml", code: "name: my_api\ndescription: A backend service.\nenvironment:\n  sdk: ^3.4.0\n\ndependencies:\n  shelf: ^1.4.0\n  shelf_router: ^1.1.0\n  postgres: ^3.0.0\n\ndev_dependencies:\n  test: ^1.25.0\n  lints: ^4.0.0\n  build_runner: ^2.4.0" },
        { type: "heading", text: "Standard layout" },
        { type: "table", headers: ["Path", "Purpose"], rows: [
          ["bin/", "Entry points (e.g. server.dart with main())"],
          ["lib/", "Library code — most of your app lives here"],
          ["lib/src/", "Private implementation, not exported"],
          ["test/", "Tests (files end in _test.dart)"],
          ["pubspec.yaml", "Package manifest and dependencies"]
        ] },
        { type: "callout", variant: "tip", text: "Run `dart analyze` and `dart format .` in CI. Adopt the `lints` or stricter `very_good_analysis` package via analysis_options.yaml for a strong baseline." }
      ]
    },
    {
      id: "http-shelf",
      title: "Building an HTTP API with Shelf",
      level: "core",
      body: [
        { type: "p", text: "Shelf models a server as a `Handler`: a function from `Request` to `Response` (possibly async). **Middleware** wraps handlers, and a `Pipeline` composes middleware in order. `shelf_router` adds path routing with parameters." },
        { type: "heading", text: "A complete small server" },
        { type: "code", lang: "dart", code: "import \"dart:convert\";\nimport \"dart:io\";\nimport \"package:shelf/shelf.dart\";\nimport \"package:shelf/shelf_io.dart\" as io;\nimport \"package:shelf_router/shelf_router.dart\";\n\nfinal _users = <String, Map<String, Object?>>{\n  \"1\": {\"id\": \"1\", \"email\": \"ada@example.com\"},\n};\n\nRouter _routes() {\n  final router = Router();\n\n  router.get(\"/health\", (Request req) => Response.ok(\"ok\"));\n\n  // Path parameter: available via req.params\n  router.get(\"/users/<id>\", (Request req, String id) {\n    final user = _users[id];\n    if (user == null) return Response.notFound(jsonEncode({\"error\": \"not found\"}));\n    return Response.ok(jsonEncode(user),\n        headers: {\"content-type\": \"application/json\"});\n  });\n\n  router.post(\"/users\", (Request req) async {\n    final body = jsonDecode(await req.readAsString()) as Map<String, Object?>;\n    final id = (_users.length + 1).toString();\n    _users[id] = {\"id\": id, ...body};\n    return Response(201, body: jsonEncode(_users[id]),\n        headers: {\"content-type\": \"application/json\"});\n  });\n\n  return router;\n}\n\n// Custom logging + CORS middleware\nMiddleware _cors() => (Handler inner) => (Request req) async {\n  final res = await inner(req);\n  return res.change(headers: {\n    \"access-control-allow-origin\": \"*\",\n    \"access-control-allow-methods\": \"GET, POST, PUT, DELETE, OPTIONS\",\n  });\n};\n\nvoid main() async {\n  final handler = Pipeline()\n      .addMiddleware(logRequests())\n      .addMiddleware(_cors())\n      .addHandler(_routes().call);\n\n  final port = int.parse(Platform.environment[\"PORT\"] ?? \"8080\");\n  final server = await io.serve(handler, InternetAddress.anyIPv4, port);\n  print(\"listening on \${server.address.host}:\${server.port}\");\n}" },
        { type: "callout", variant: "note", text: "Middleware order matters: the first `addMiddleware` is the OUTERMOST wrapper (runs first on the way in, last on the way out). Put logging outermost, auth after it." },
        { type: "callout", variant: "tip", text: "Read the body exactly once with `await req.readAsString()`. Stash parsed values on the request with `req.change(context: {...})` to pass data to later middleware/handlers." }
      ]
    },
    {
      id: "dart-frog",
      title: "Dart Frog: File-Based Routing",
      level: "core",
      body: [
        { type: "p", text: "Dart Frog is a lightweight framework (built on Shelf) with **file-based routing** à la Next.js. A file at `routes/users/[id].dart` maps to `/users/:id`. It has a dev server with hot reload (`dart_frog dev`) and compiles to a production build (`dart_frog build`)." },
        { type: "heading", text: "A static route: routes/users/index.dart" },
        { type: "code", lang: "dart", code: "import \"dart:convert\";\nimport \"package:dart_frog/dart_frog.dart\";\n\nFuture<Response> onRequest(RequestContext context) async {\n  switch (context.request.method) {\n    case HttpMethod.get:\n      return Response.json(body: {\"users\": []});\n    case HttpMethod.post:\n      final body = await context.request.json() as Map<String, dynamic>;\n      return Response.json(statusCode: 201, body: body);\n    default:\n      return Response(statusCode: 405);\n  }\n}" },
        { type: "heading", text: "A dynamic route: routes/users/[id].dart" },
        { type: "code", lang: "dart", code: "import \"package:dart_frog/dart_frog.dart\";\n\n// The [id] segment is passed as a positional argument.\nResponse onRequest(RequestContext context, String id) {\n  final db = context.read<Database>();      // dependency injection\n  final user = db.find(id);\n  return user == null\n      ? Response(statusCode: 404)\n      : Response.json(body: user.toJson());\n}" },
        { type: "heading", text: "Middleware + dependency injection: routes/_middleware.dart" },
        { type: "p", text: "A `_middleware.dart` file applies to its folder and everything below it. `provider` injects a value that handlers read with `context.read<T>()`." },
        { type: "code", lang: "dart", code: "import \"package:dart_frog/dart_frog.dart\";\n\nHandler middleware(Handler handler) {\n  return handler\n      .use(requestLogger())\n      .use(provider<Database>((context) => Database.instance));\n}" },
        { type: "callout", variant: "tip", text: "Dart Frog is a great pick when you want minimal boilerplate and Next.js-style routing but still want to drop to raw Shelf handlers when needed." }
      ]
    },
    {
      id: "json-serialization",
      title: "JSON Serialization",
      level: "core",
      body: [
        { type: "p", text: "Dart has no runtime reflection in AOT builds, so JSON mapping is either **manual** or **code-generated**. Start manual; move to codegen as models grow." },
        { type: "heading", text: "Manual fromJson / toJson" },
        { type: "code", lang: "dart", code: "class User {\n  final String id;\n  final String email;\n  final int age;\n  User({required this.id, required this.email, required this.age});\n\n  factory User.fromJson(Map<String, dynamic> j) => User(\n        id: j[\"id\"] as String,\n        email: j[\"email\"] as String,\n        age: j[\"age\"] as int,\n      );\n\n  Map<String, dynamic> toJson() => {\"id\": id, \"email\": email, \"age\": age};\n}\n\nfinal user = User.fromJson(jsonDecode(raw) as Map<String, dynamic>);\nfinal out = jsonEncode(user); // calls toJson() automatically" },
        { type: "heading", text: "json_serializable + build_runner" },
        { type: "p", text: "Annotate the class and let `build_runner` generate the boilerplate into a `.g.dart` part file." },
        { type: "code", lang: "dart", code: "import \"package:json_annotation/json_annotation.dart\";\npart \"user.g.dart\";\n\n@JsonSerializable()\nclass User {\n  final String id;\n  @JsonKey(name: \"email_address\")\n  final String email;\n  User({required this.id, required this.email});\n\n  factory User.fromJson(Map<String, dynamic> j) => _\\$UserFromJson(j);\n  Map<String, dynamic> toJson() => _\\$UserToJson(this);\n}" },
        { type: "code", lang: "bash", code: "dart run build_runner build --delete-conflicting-outputs\n# or watch mode during development:\ndart run build_runner watch" },
        { type: "heading", text: "freezed for immutable models + unions" },
        { type: "p", text: "`freezed` generates immutable classes with `copyWith`, value equality, and — crucially — **sealed unions** with pattern-matchable variants." },
        { type: "code", lang: "dart", code: "import \"package:freezed_annotation/freezed_annotation.dart\";\npart \"result.freezed.dart\";\n\n@freezed\nsealed class ApiResult<T> with _\\$ApiResult<T> {\n  const factory ApiResult.success(T data) = Success<T>;\n  const factory ApiResult.failure(String message, int code) = Failure<T>;\n}\n\n// Exhaustive handling via switch on the generated sealed type\nString render(ApiResult<String> r) => switch (r) {\n  Success(:final data) => \"ok: $data\",\n  Failure(:final message) => \"error: $message\",\n};" },
        { type: "callout", variant: "note", text: "The generated files (`*.g.dart`, `*.freezed.dart`) are declared with `part` and must be committed or regenerated in CI. Note the escaped `$` in generated symbol names is a quirk of this deck, not real Dart." }
      ]
    },
    {
      id: "database",
      title: "Databases: Postgres & ORMs",
      level: "core",
      body: [
        { type: "p", text: "For raw SQL against Postgres, the `postgres` package is the standard. Always use **parameterized queries** — never string-concatenate user input." },
        { type: "heading", text: "Connecting and querying" },
        { type: "code", lang: "dart", code: "import \"package:postgres/postgres.dart\";\n\nfinal conn = await Connection.open(\n  Endpoint(\n    host: \"localhost\",\n    database: \"app\",\n    username: \"app\",\n    password: Platform.environment[\"DB_PASSWORD\"]!,\n  ),\n  settings: ConnectionSettings(sslMode: SslMode.disable),\n);\n\n// Named parameters guard against SQL injection\nfinal result = await conn.execute(\n  Sql.named(\"SELECT id, email FROM users WHERE email = @email\"),\n  parameters: {\"email\": \"ada@example.com\"},\n);\nfor (final row in result) {\n  print(\"\${row[0]} -> \${row[1]}\");\n}\nawait conn.close();" },
        { type: "heading", text: "A simple repository pattern" },
        { type: "code", lang: "dart", code: "class UserRepository {\n  final Connection _db;\n  UserRepository(this._db);\n\n  Future<User?> findById(String id) async {\n    final rows = await _db.execute(\n      Sql.named(\"SELECT id, email FROM users WHERE id = @id\"),\n      parameters: {\"id\": id},\n    );\n    if (rows.isEmpty) return null;\n    final r = rows.single.toColumnMap();\n    return User(id: r[\"id\"] as String, email: r[\"email\"] as String);\n  }\n\n  Future<void> insert(User u) => _db.execute(\n        Sql.named(\"INSERT INTO users (id, email) VALUES (@id, @email)\"),\n        parameters: {\"id\": u.id, \"email\": u.email},\n      );\n}" },
        { type: "heading", text: "Typed ORMs" },
        { type: "list", items: [
          "**Drift** — reactive, type-safe query builder and ORM (SQLite, plus Postgres). Generates Dart from your table definitions; queries return typed rows and can be watched as Streams.",
          "**stormberry** — a Postgres-focused ORM with code generation for models and repositories.",
          "**Serverpod** ships its own built-in ORM: you define models in YAML and get typed CRUD + relations generated for you."
        ] },
        { type: "callout", variant: "gotcha", text: "Use a connection POOL for concurrent request handling, and always close it on shutdown. A single shared Connection serializes queries and can deadlock under load." }
      ]
    },
    {
      id: "auth",
      title: "Authentication: JWT & Password Hashing",
      level: "core",
      body: [
        { type: "p", text: "A typical flow: hash passwords with bcrypt on signup, verify on login, then issue a signed **JWT** the client sends in the `Authorization: Bearer` header. Middleware verifies the token on protected routes." },
        { type: "heading", text: "Hashing passwords" },
        { type: "code", lang: "dart", code: "import \"package:bcrypt/bcrypt.dart\";\n\nfinal hash = BCrypt.hashpw(\"user-password\", BCrypt.gensalt());\nfinal ok = BCrypt.checkpw(\"user-password\", hash); // true\n\n// bcrypt is deliberately slow (CPU-bound) — run it off the event loop:\nfinal hashed = await Isolate.run(() => BCrypt.hashpw(pw, BCrypt.gensalt()));" },
        { type: "heading", text: "Signing and verifying JWTs" },
        { type: "code", lang: "dart", code: "import \"package:dart_jsonwebtoken/dart_jsonwebtoken.dart\";\n\nfinal secret = SecretKey(Platform.environment[\"JWT_SECRET\"]!);\n\nString issueToken(String userId) {\n  final jwt = JWT({\"sub\": userId, \"role\": \"user\"});\n  return jwt.sign(secret, expiresIn: Duration(hours: 2));\n}\n\nJWT? verify(String token) {\n  try {\n    return JWT.verify(token, secret); // throws on bad signature/expiry\n  } on JWTExpiredException {\n    return null;\n  } on JWTException {\n    return null;\n  }\n}" },
        { type: "heading", text: "Auth middleware (Shelf)" },
        { type: "code", lang: "dart", code: "Middleware authRequired() => (Handler inner) => (Request req) {\n  final header = req.headers[\"authorization\"];\n  if (header == null || !header.startsWith(\"Bearer \")) {\n    return Response(401, body: jsonEncode({\"error\": \"missing token\"}));\n  }\n  final jwt = verify(header.substring(7));\n  if (jwt == null) {\n    return Response(401, body: jsonEncode({\"error\": \"invalid token\"}));\n  }\n  // Attach the user id so handlers can read it.\n  final updated = req.change(context: {\"userId\": jwt.payload[\"sub\"]});\n  return inner(updated);\n};" },
        { type: "callout", variant: "warn", text: "Keep the JWT secret in an environment variable / secret manager, never in source. Use short access-token lifetimes plus refresh tokens for long sessions." }
      ]
    },
    {
      id: "serverpod",
      title: "Serverpod: The Batteries-Included Option",
      level: "deep",
      body: [
        { type: "p", text: "Serverpod is a full backend framework built specifically for the Flutter/Dart stack. Instead of assembling routing + ORM + auth yourself, you define **endpoints** and **models**, run codegen, and get a typed **Dart client library** you call from Flutter as if it were local functions." },
        { type: "heading", text: "Model definition (a .spy.yaml file)" },
        { type: "code", lang: "yaml", code: "class: User\ntable: users\nfields:\n  email: String\n  name: String\n  age: int?\nindexes:\n  email_idx:\n    fields: email\n    unique: true" },
        { type: "heading", text: "An endpoint" },
        { type: "code", lang: "dart", code: "import \"package:serverpod/serverpod.dart\";\n\nclass UserEndpoint extends Endpoint {\n  // Callable from the generated client as client.user.create(...)\n  Future<User> create(Session session, User user) async {\n    return User.db.insertRow(session, user);\n  }\n\n  Future<User?> findByEmail(Session session, String email) async {\n    return User.db.findFirstRow(\n      session,\n      where: (t) => t.email.equals(email),\n    );\n  }\n}" },
        { type: "p", text: "Running `serverpod generate` produces the ORM classes (`User.db`), serialization, and the client SDK. Serverpod also bundles **authentication**, **caching** (Redis-backed), **task scheduling** (future calls), file uploads, and streaming/websockets." },
        { type: "callout", variant: "tip", text: "Worth it when you own both the Dart backend and a Flutter frontend and want end-to-end type safety with minimal glue. Heavier and more opinionated than Shelf/Dart Frog — overkill for a small standalone API." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "`package:test` is the standard. Test files end in `_test.dart`; run everything with `dart test`. Handlers are just functions, so you can call them directly with a synthetic `Request`." },
        { type: "code", lang: "dart", code: "import \"package:test/test.dart\";\nimport \"package:shelf/shelf.dart\";\n\nvoid main() {\n  group(\"health handler\", () {\n    test(\"returns 200 ok\", () async {\n      final res = await healthHandler(Request(\"GET\", Uri.parse(\"http://x/health\")));\n      expect(res.statusCode, 200);\n      expect(await res.readAsString(), \"ok\");\n    });\n  });\n}" },
        { type: "heading", text: "Mocking with mocktail" },
        { type: "p", text: "`mocktail` needs no code generation — you subclass `Mock` and stub methods with `when(...).thenAnswer(...)`." },
        { type: "code", lang: "dart", code: "import \"package:mocktail/mocktail.dart\";\nimport \"package:test/test.dart\";\n\nclass MockRepo extends Mock implements UserRepository {}\n\nvoid main() {\n  test(\"service returns user email\", () async {\n    final repo = MockRepo();\n    when(() => repo.findById(\"1\"))\n        .thenAnswer((_) async => User(id: \"1\", email: \"ada@x.com\"));\n\n    final service = UserService(repo);\n    expect(await service.emailOf(\"1\"), \"ada@x.com\");\n    verify(() => repo.findById(\"1\")).called(1);\n  });\n}" },
        { type: "callout", variant: "tip", text: "Use `@Tags([\"integration\"])` and run subsets with `dart test -t integration`. Keep DB-backed tests separate from fast unit tests." }
      ]
    },
    {
      id: "deployment",
      title: "Deployment",
      level: "deep",
      body: [
        { type: "p", text: "`dart compile exe` produces a single self-contained native binary (the Dart runtime is baked in). That makes for tiny, fast-starting containers — ideal for Kubernetes or serverless." },
        { type: "code", lang: "bash", code: "dart compile exe bin/server.dart -o build/server\n./build/server   # no Dart SDK needed on the target machine" },
        { type: "heading", text: "Multi-stage Dockerfile" },
        { type: "code", lang: "text", code: "# --- build stage: full SDK ---\nFROM dart:stable AS build\nWORKDIR /app\nCOPY pubspec.* ./\nRUN dart pub get\nCOPY . .\nRUN dart pub get --offline\nRUN dart compile exe bin/server.dart -o bin/server\n\n# --- runtime stage: minimal image ---\nFROM scratch\nCOPY --from=build /runtime/ /\nCOPY --from=build /app/bin/server /app/bin/server\nEXPOSE 8080\nCMD [\"/app/bin/server\"]" },
        { type: "heading", text: "Config from the environment" },
        { type: "code", lang: "dart", code: "final port = int.parse(Platform.environment[\"PORT\"] ?? \"8080\");\nfinal dbUrl = Platform.environment[\"DATABASE_URL\"]\n    ?? (throw StateError(\"DATABASE_URL is required\"));\nfinal debug = Platform.environment[\"DEBUG\"] == \"true\";" },
        { type: "callout", variant: "good", text: "The official `dart` image bundles a `/runtime/` folder with exactly the shared libs the AOT binary needs, so you can copy it into `FROM scratch` for a minimal final image." },
        { type: "callout", variant: "note", text: "Handle SIGTERM to drain connections and close DB pools gracefully: listen on `ProcessSignal.sigterm.watch()` before exiting." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "The recurring traps in server-side Dart, and the fixes." },
        { type: "heading", text: "1. Blocking the event loop" },
        { type: "code", lang: "dart", code: "// WRONG: heavy sync CPU work freezes ALL requests\nString handler(Request r) => expensiveHash(bigInput); // blocks the loop\n\n// RIGHT: offload to an isolate\nFuture<String> handler(Request r) => Isolate.run(() => expensiveHash(bigInput));" },
        { type: "heading", text: "2. Sharing objects across isolates" },
        { type: "p", text: "Isolates do not share memory — a message is **copied**. You cannot hand a live DB pool to another isolate; give each isolate its own pool, or keep DB work on the main isolate and only offload pure computation." },
        { type: "heading", text: "3. Forgetting to await a Future" },
        { type: "code", lang: "dart", code: "// WRONG: fire-and-forget; errors become unhandled async exceptions\nsaveAudit(event);              // returns a Future you dropped\n\n// RIGHT: await it, or explicitly mark intentional with unawaited()\nawait saveAudit(event);\n// import 'dart:async'; unawaited(saveAudit(event)); // if truly fire-and-forget" },
        { type: "heading", text: "4. Leaking stream subscriptions" },
        { type: "code", lang: "dart", code: "// WRONG: subscription lives forever, holds resources\ncontroller.stream.listen(handle);\n\n// RIGHT: keep the handle and cancel when done\nfinal sub = controller.stream.listen(handle);\n// ... later\nawait sub.cancel();" },
        { type: "heading", text: "5. late fields read before init" },
        { type: "p", text: "A `late` field that is read before assignment throws `LateInitializationError`. Only use `late` when you can guarantee initialization happens first; otherwise use a nullable field with a null check." },
        { type: "heading", text: "6. Unintended string interpolation" },
        { type: "p", text: "In real Dart, a `$` in a double-quoted string starts interpolation. To print a literal dollar sign write `\\$`. (Separately, in THIS deck's source, the two-char sequence for a braced interpolation must be escaped — a quirk of the authoring format, not of Dart itself.)" },
        { type: "heading", text: "7. Connection pools not closed" },
        { type: "callout", variant: "gotcha", text: "Open pools/streams/servers must be closed on shutdown or you leak file descriptors and connections. Wire cleanup to SIGTERM and use try/finally around per-request acquisitions." }
      ]
    }
  ],
  packages: [
    { name: "shelf", why: "composable HTTP server middleware — the de-facto foundation" },
    { name: "shelf_router", why: "path routing with parameters on top of Shelf" },
    { name: "dart_frog", why: "file-based routing framework with hot-reload DX" },
    { name: "postgres", why: "PostgreSQL client with parameterized queries and pooling" },
    { name: "drift", why: "type-safe reactive ORM / query builder (SQLite + Postgres)" },
    { name: "json_serializable", why: "codegen for fromJson/toJson boilerplate" },
    { name: "build_runner", why: "runs code generators (json_serializable, freezed, drift)" },
    { name: "freezed", why: "immutable data classes, copyWith, and sealed unions" },
    { name: "dart_jsonwebtoken", why: "sign and verify JWTs for auth" },
    { name: "bcrypt", why: "slow password hashing with per-user salts" },
    { name: "mocktail", why: "mocking for tests with no code generation" },
    { name: "serverpod", why: "full backend framework with ORM, auth, and generated client" }
  ],
  gotchas: [
    "One isolate = one core; the event loop never runs your code in parallel with itself.",
    "Heavy synchronous CPU work blocks EVERY request — offload to `Isolate.run`.",
    "Isolates don't share memory; messages are copied, so you can't share a DB pool by reference.",
    "Forgetting `await` silently drops the Future and hides thrown errors — enable `unawaited_futures`.",
    "Stream subscriptions leak unless you `cancel()` them; broadcast controllers must be `close()`d.",
    "`late` fields throw `LateInitializationError` if read before assignment.",
    "No runtime reflection in AOT — JSON needs manual mapping or `build_runner` codegen.",
    "Always use parameterized SQL (`@name`), never string interpolation into queries.",
    "Use a connection POOL under load and close it on SIGTERM to avoid leaked connections.",
    "Middleware order matters: the first `addMiddleware` is outermost (runs first inbound)."
  ],
  flashcards: [
    { q: "What is Dart's concurrency model within a single isolate?", a: "A single-threaded **event loop**: async I/O registers callbacks; your code never runs in parallel with itself. `async`/`await` sugars over the loop." },
    { q: "How do isolates differ from OS threads?", a: "Isolates have **no shared memory** — each has its own heap and event loop, and they communicate only by passing (copied) messages over ports. No data races." },
    { q: "Future vs Stream?", a: "A `Future` completes with **one** value (or error). A `Stream` emits **many** values over time; consume with `await for`, and choose single-subscription vs broadcast." },
    { q: "What does sound null safety give you?", a: "Types are non-nullable by default; `?` makes them nullable, `!` asserts non-null, `??`/`?.` handle nulls, and `late` defers initialization. The compiler enforces it soundly." },
    { q: "What are records used for?", a: "Lightweight anonymous tuples like `(int, String)` or named `({int x, int y})` — return multiple values without defining a class, and destructure them with patterns." },
    { q: "Why sealed classes?", a: "The compiler knows all subtypes, so a `switch` over them is checked for **exhaustiveness** — you can't forget a case, and no `default` is needed. Ideal for result/state unions." },
    { q: "How does a Shelf Pipeline work?", a: "`Pipeline().addMiddleware(a).addMiddleware(b).addHandler(h)` — middleware wrap the handler; the first added is the outermost, running first on the way in." },
    { q: "How do you avoid blocking the event loop with CPU-bound work?", a: "Run it in another isolate, most simply `await Isolate.run(() => heavyWork())`, so the request-handling loop stays responsive." },
    { q: "What does `dart compile exe` produce?", a: "A single **AOT-compiled native binary** with the runtime baked in — no SDK needed to run it, milliseconds to start, ideal for slim containers." },
    { q: "How do you run independent async calls concurrently?", a: "`await Future.wait([a(), b(), c()])` overlaps them (total time ≈ the slowest), instead of awaiting each sequentially." }
  ],
  cheatsheet: [
    { label: "Scaffold a server", code: "dart create -t server-shelf my_api" },
    { label: "Fetch deps", code: "dart pub get" },
    { label: "Run on the VM", code: "dart run bin/server.dart" },
    { label: "AOT native binary", code: "dart compile exe bin/server.dart -o build/server" },
    { label: "Run tests", code: "dart test" },
    { label: "Shelf handler", code: "Response health(Request r) => Response.ok(\"ok\");" },
    { label: "Offload CPU work", code: "final h = await Isolate.run(() => sha256.convert(bytes).toString());" },
    { label: "Parse JSON", code: "final m = jsonDecode(raw) as Map<String, dynamic>;" },
    { label: "Postgres query", code: "await conn.execute(Sql.named(\"SELECT * FROM users WHERE id=@id\"), parameters: {\"id\": id});" },
    { label: "Run code generation", code: "dart run build_runner build --delete-conflicting-outputs" }
  ]
});
