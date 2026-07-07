(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "fastapi",
  name: "FastAPI",
  language: "Python",
  tagline: "Async Python APIs built on **type hints** — automatic validation, serialization and OpenAPI docs for free.",
  color: "#009688",
  readMinutes: 24,
  group: "Python",

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "FastAPI = **Starlette** (ASGI web toolkit) + **Pydantic** (data validation). You declare types with Python type hints, and FastAPI uses them to validate requests, serialize responses, and generate interactive OpenAPI docs automatically." },
        { type: "list", items: [
          "**Reach for it when:** you want a fast, modern async API with typed request/response models and auto docs.",
          "**Strengths:** performance (on par with Node/Go for I/O), DX, editor autocomplete, first-class async, built-in OpenAPI/Swagger.",
          "**Mental model:** everything is a function with typed parameters; FastAPI inspects the signature to decide what to inject and validate."
        ] },
        { type: "callout", variant: "note", text: "Everything below assumes **Pydantic v2** and **SQLAlchemy 2.0**, the current standard." }
      ]
    },
    {
      id: "setup",
      title: "Project setup",
      level: "core",
      body: [
        { type: "p", text: "Install with the `standard` extra (pulls in `uvicorn`, `httpx`, etc.). Create a virtualenv first." },
        { type: "code", lang: "bash", code: "python -m venv .venv && source .venv/bin/activate\npip install \"fastapi[standard]\"\n\n# run the dev server (auto-reload) — 'fastapi dev' is the new CLI\nfastapi dev main.py\n# equivalent classic command:\nuvicorn main:app --reload" },
        { type: "code", lang: "py", code: "# main.py\nfrom fastapi import FastAPI\n\napp = FastAPI(title=\"My API\", version=\"1.0.0\")\n\n@app.get(\"/\")\nasync def root():\n    return {\"message\": \"hello\"}" },
        { type: "callout", variant: "tip", text: "Open **/docs** for Swagger UI and **/redoc** for ReDoc — both are generated from your code, no config needed." }
      ]
    },
    {
      id: "routing",
      title: "Routing, path & query params",
      level: "core",
      body: [
        { type: "p", text: "Decorate functions with the HTTP method. **Path** params come from the URL template; anything else with a scalar type hint becomes a **query** param." },
        { type: "code", lang: "py", code: "from fastapi import FastAPI\napp = FastAPI()\n\n@app.get(\"/items/{item_id}\")            # path param\nasync def get_item(item_id: int, q: str | None = None, limit: int = 10):\n    # item_id -> path (validated as int)\n    # q       -> optional query (?q=...)\n    # limit   -> query with default\n    return {\"item_id\": item_id, \"q\": q, \"limit\": limit}" },
        { type: "p", text: "Use `Path`, `Query`, and `Annotated` for constraints and metadata (the modern, recommended style):" },
        { type: "code", lang: "py", code: "from typing import Annotated\nfrom fastapi import Query, Path\n\n@app.get(\"/users/{user_id}\")\nasync def get_user(\n    user_id: Annotated[int, Path(ge=1)],\n    search: Annotated[str | None, Query(max_length=50)] = None,\n):\n    ..." },
        { type: "callout", variant: "gotcha", text: "Order matters: `/users/me` must be declared **before** `/users/{user_id}`, otherwise `me` gets captured as an id." }
      ]
    },
    {
      id: "pydantic",
      title: "Request bodies & Pydantic models",
      level: "core",
      body: [
        { type: "p", text: "A parameter typed as a **Pydantic model** is read from the JSON body, validated, and given to you as an object. This is the heart of FastAPI." },
        { type: "code", lang: "py", code: "from pydantic import BaseModel, EmailStr, Field\n\nclass UserCreate(BaseModel):\n    email: EmailStr\n    name: str = Field(min_length=1, max_length=80)\n    age: int | None = Field(default=None, ge=0, le=150)\n\nclass UserOut(BaseModel):\n    id: int\n    email: EmailStr\n    name: str\n\n@app.post(\"/users\", response_model=UserOut, status_code=201)\nasync def create_user(payload: UserCreate) -> UserOut:\n    # payload is fully validated here\n    return UserOut(id=1, email=payload.email, name=payload.name)" },
        { type: "callout", variant: "tip", text: "`response_model` (or the `-> UserOut` return annotation) **filters** the output — extra fields like passwords are stripped even if your object has them. Great for hiding sensitive data." },
        { type: "table", headers: ["Need", "Pydantic v2 tool"], rows: [
          ["Field validation/constraints", "`Field(...)`, `ge/le/min_length/pattern`"],
          ["Custom validators", "`@field_validator`, `@model_validator`"],
          ["Config (e.g. from ORM objects)", "`model_config = ConfigDict(from_attributes=True)`"],
          ["Serialize to dict/json", "`model.model_dump()`, `model.model_dump_json()`"]
        ] }
      ]
    },
    {
      id: "di",
      title: "Dependency Injection (the signature feature)",
      level: "core",
      body: [
        { type: "p", text: "`Depends` lets you declare reusable pieces — DB sessions, current user, pagination, config — that FastAPI resolves and injects. Dependencies can depend on other dependencies." },
        { type: "code", lang: "py", code: "from typing import Annotated\nfrom fastapi import Depends\n\nasync def pagination(skip: int = 0, limit: int = 20):\n    return {\"skip\": skip, \"limit\": min(limit, 100)}\n\n@app.get(\"/items\")\nasync def list_items(page: Annotated[dict, Depends(pagination)]):\n    return page" },
        { type: "p", text: "**Yield dependencies** run setup before the request and teardown after — perfect for DB sessions (the `finally` always runs):" },
        { type: "code", lang: "py", code: "async def get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n\nDBSession = Annotated[Session, Depends(get_db)]\n\n@app.get(\"/items\")\nasync def items(db: DBSession):\n    return db.query(Item).all()" },
        { type: "callout", variant: "tip", text: "Put a dependency at the **router or app** level with `dependencies=[Depends(verify_token)]` to enforce it on every route without needing its return value." }
      ]
    },
    {
      id: "async",
      title: "async def vs def",
      level: "core",
      body: [
        { type: "p", text: "FastAPI supports both. The rule of thumb:" },
        { type: "list", items: [
          "Use `async def` when you `await` async libraries (async DB drivers, `httpx`, etc.).",
          "Use plain `def` when you call **blocking** libraries (many ORMs, `requests`) — FastAPI runs it in a threadpool so it won't block the event loop.",
          "**Never** call blocking code inside an `async def` handler — it freezes the whole server."
        ] },
        { type: "callout", variant: "warn", text: "The #1 FastAPI performance bug: a blocking call (e.g. `time.sleep`, sync DB query, `requests.get`) inside an `async def`. Either make it `def`, or `await` a truly async version, or offload with `run_in_threadpool`." }
      ]
    },
    {
      id: "responses",
      title: "Responses, status codes & errors",
      level: "core",
      body: [
        { type: "p", text: "Return dicts/models (auto-JSON), or a `Response` subclass for control. Raise `HTTPException` for error responses." },
        { type: "code", lang: "py", code: "from fastapi import HTTPException, status\n\n@app.get(\"/items/{id}\")\nasync def get(id: int):\n    item = db_lookup(id)\n    if not item:\n        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=\"Item not found\")\n    return item" },
        { type: "p", text: "Register a global handler to customize error shape or map your own exceptions:" },
        { type: "code", lang: "py", code: "from fastapi import Request\nfrom fastapi.responses import JSONResponse\n\nclass NotFound(Exception):\n    def __init__(self, what): self.what = what\n\n@app.exception_handler(NotFound)\nasync def not_found_handler(request: Request, exc: NotFound):\n    return JSONResponse(status_code=404, content={\"error\": f\"{exc.what} not found\"})" },
        { type: "table", headers: ["Response type", "Use for"], rows: [
          ["`JSONResponse`", "custom JSON + headers/status"],
          ["`PlainTextResponse` / `HTMLResponse`", "text / html"],
          ["`StreamingResponse`", "large files, generators, SSE"],
          ["`FileResponse`", "serving a file from disk"],
          ["`RedirectResponse`", "302/307 redirects"]
        ] }
      ]
    },
    {
      id: "routers",
      title: "Structure: APIRouter & big apps",
      level: "core",
      body: [
        { type: "p", text: "Split routes into modules with `APIRouter`, then include them. This is how real projects stay organized." },
        { type: "code", lang: "py", code: "# routers/users.py\nfrom fastapi import APIRouter\nrouter = APIRouter(prefix=\"/users\", tags=[\"users\"])\n\n@router.get(\"\")\nasync def list_users(): ...\n\n# main.py\nfrom fastapi import FastAPI\nfrom routers import users\napp = FastAPI()\napp.include_router(users.router)" },
        { type: "callout", variant: "tip", text: "A pragmatic layout: `app/` with `main.py`, `routers/`, `models/` (SQLAlchemy), `schemas/` (Pydantic), `crud/` or `services/`, `deps.py`, `core/config.py`." }
      ]
    },
    {
      id: "orm",
      title: "ORM: SQLAlchemy 2.0 & SQLModel",
      level: "core",
      body: [
        { type: "p", text: "FastAPI is ORM-agnostic. The two common choices: **SQLAlchemy 2.0** (the standard) and **SQLModel** (SQLAlchemy + Pydantic in one class, by FastAPI's author)." },
        { type: "heading", text: "SQLAlchemy 2.0" },
        { type: "code", lang: "py", code: "from sqlalchemy import create_engine, String\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker\n\nengine = create_engine(\"postgresql+psycopg://user:pass@localhost/db\")\nSessionLocal = sessionmaker(engine)\n\nclass Base(DeclarativeBase): pass\n\nclass User(Base):\n    __tablename__ = \"users\"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    email: Mapped[str] = mapped_column(String(255), unique=True)\n    name: Mapped[str]\n\nBase.metadata.create_all(engine)   # dev only; use Alembic for real migrations" },
        { type: "code", lang: "py", code: "# CRUD in a handler\nfrom sqlalchemy import select\n\n@app.post(\"/users\")\ndef create(payload: UserCreate, db: DBSession):\n    user = User(email=payload.email, name=payload.name)\n    db.add(user); db.commit(); db.refresh(user)\n    return user\n\n@app.get(\"/users\")\ndef all_users(db: DBSession):\n    return db.scalars(select(User)).all()" },
        { type: "callout", variant: "tip", text: "Return ORM objects directly if your Pydantic `response_model` has `model_config = ConfigDict(from_attributes=True)` — FastAPI converts them for you." },
        { type: "heading", text: "Async SQLAlchemy (AsyncSession)" },
        { type: "p", text: "The other common production setup: fully async DB access with an async driver. Note the `async with` session and `await` on every query." },
        { type: "code", lang: "py", code: "from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession\nfrom sqlalchemy import select\n\nengine = create_async_engine(\"postgresql+asyncpg://user:pass@localhost/db\")\nAsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)\n\nasync def get_db():\n    async with AsyncSessionLocal() as session:\n        yield session\n\nADB = Annotated[AsyncSession, Depends(get_db)]\n\n@app.get(\"/users\")\nasync def list_users(db: ADB):\n    res = await db.scalars(select(User))\n    return res.all()" },
        { type: "callout", variant: "gotcha", text: "Async sessions need an **async driver** (`asyncpg`, not `psycopg2`) and `expire_on_commit=False` — otherwise attribute access after commit triggers a lazy load and raises `MissingGreenlet`." },
        { type: "heading", text: "SQLModel (one class for table + schema)" },
        { type: "code", lang: "py", code: "from sqlmodel import SQLModel, Field, Session, create_engine, select\n\nclass Hero(SQLModel, table=True):\n    id: int | None = Field(default=None, primary_key=True)\n    name: str\n    power: int = 0\n\nengine = create_engine(\"sqlite:///db.sqlite\")\nSQLModel.metadata.create_all(engine)" }
      ]
    },
    {
      id: "migrations",
      title: "Migrations with Alembic",
      level: "deep",
      body: [
        { type: "p", text: "`create_all` is fine for prototypes; production uses **Alembic** for versioned schema migrations." },
        { type: "code", lang: "bash", code: "pip install alembic\nalembic init migrations\n# point migrations/env.py at your Base.metadata, then:\nalembic revision --autogenerate -m \"create users\"\nalembic upgrade head\nalembic downgrade -1" },
        { type: "callout", variant: "gotcha", text: "Autogenerate only sees models that are **imported** by the time `env.py` runs. Import all your model modules there, or migrations will miss tables." }
      ]
    },
    {
      id: "auth",
      title: "Auth: OAuth2 password flow + JWT",
      level: "core",
      body: [
        { type: "p", text: "The canonical FastAPI auth: an OAuth2 password bearer scheme that issues JWTs, plus a dependency that decodes the token and returns the current user." },
        { type: "code", lang: "py", code: "from datetime import datetime, timedelta, timezone\nfrom typing import Annotated\nfrom fastapi import Depends, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm\nimport jwt                       # pip install pyjwt\nfrom pwdlib import PasswordHash  # pip install 'pwdlib[argon2]'\n\npwd = PasswordHash.recommended()   # Argon2 by default\noauth2 = OAuth2PasswordBearer(tokenUrl=\"token\")\nSECRET = \"change-me\"\n\n@app.post(\"/token\")\nasync def login(form: Annotated[OAuth2PasswordRequestForm, Depends()]):\n    user = authenticate(form.username, form.password)  # verify pwd.verify(...)\n    if not user:\n        raise HTTPException(401, \"Bad credentials\")\n    exp = datetime.now(timezone.utc) + timedelta(minutes=30)\n    token = jwt.encode({\"sub\": user.email, \"exp\": exp}, SECRET, algorithm=\"HS256\")\n    return {\"access_token\": token, \"token_type\": \"bearer\"}\n\nasync def current_user(token: Annotated[str, Depends(oauth2)]):\n    try:\n        data = jwt.decode(token, SECRET, algorithms=[\"HS256\"])\n    except jwt.PyJWTError:\n        raise HTTPException(401, \"Invalid token\")\n    return get_user(data[\"sub\"])\n\n@app.get(\"/me\")\nasync def me(user: Annotated[User, Depends(current_user)]):\n    return user" },
        { type: "callout", variant: "tip", text: "The `oauth2_scheme` also wires the **Authorize** button in `/docs`, so you can test protected routes right in Swagger." }
      ]
    },
    {
      id: "middleware",
      title: "Middleware, CORS & background tasks",
      level: "core",
      body: [
        { type: "code", lang: "py", code: "from fastapi.middleware.cors import CORSMiddleware\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=[\"https://app.example.com\"],\n    allow_credentials=True,\n    allow_methods=[\"*\"],\n    allow_headers=[\"*\"],\n)" },
        { type: "p", text: "Custom middleware wraps every request/response:" },
        { type: "code", lang: "py", code: "import time\n@app.middleware(\"http\")\nasync def add_timing(request, call_next):\n    start = time.perf_counter()\n    response = await call_next(request)\n    response.headers[\"X-Process-Time\"] = str(time.perf_counter() - start)\n    return response" },
        { type: "p", text: "**BackgroundTasks** run after the response is sent — good for emails, logging, cache warm-ups (not for heavy CPU work — use Celery for that)." },
        { type: "code", lang: "py", code: "from fastapi import BackgroundTasks\n\n@app.post(\"/signup\")\nasync def signup(email: str, tasks: BackgroundTasks):\n    tasks.add_task(send_welcome_email, email)\n    return {\"ok\": True}" }
      ]
    },
    {
      id: "background-jobs",
      title: "Background work: which tool when",
      level: "core",
      body: [
        { type: "p", text: "\"Do this after responding\" has three very different answers in FastAPI, and picking the wrong one is a classic production mistake. The deciding questions: does the work need to survive a restart/crash? Does it need retries, scheduling, or a separate machine? Is it CPU-heavy?" },
        { type: "table", headers: ["Tool", "Runs where", "Use for", "Don't use for"], rows: [
          ["`BackgroundTasks`", "same process, after response", "fire-and-forget side effects: send an email, write a log, bust a cache", "anything you must not lose, retries, CPU work"],
          ["`Celery`", "separate worker process(es)", "durable jobs, retries, scheduled/periodic, fan-out, heavy CPU", "trivial fast tasks (overkill)"],
          ["`ARQ` / `Dramatiq` / `TaskIQ`", "separate async worker", "same as Celery but you want an **asyncio-native** worker", "if your team already knows Celery"],
          ["`asyncio.create_task`", "same event loop", "concurrent I/O *within* one request you `await` before returning", "work that outlives the request (it can be cancelled)"]
        ] },
        { type: "callout", variant: "warn", text: "`BackgroundTasks` runs **in the same process** and holds no queue: if the server restarts, in-flight tasks vanish, and an unhandled exception in the task is swallowed (logged, never retried). The moment you need durability, retries, or scheduling, move to Celery/ARQ — don't grow `BackgroundTasks` into a job system." },
        { type: "callout", variant: "gotcha", text: "A `BackgroundTasks` function that is `async def` runs on the event loop; a plain `def` one runs in the threadpool. A **blocking** call in an `async def` background task still blocks the whole server — the same async rule applies here." }
      ]
    },
    {
      id: "celery",
      title: "Celery: durable & scheduled task queue",
      level: "core",
      body: [
        { type: "p", text: "Celery is the standard for real background jobs: a **broker** (Redis or RabbitMQ) holds the queue, one or more **worker** processes pull and run tasks, and an optional **result backend** stores return values. Your FastAPI process only *enqueues* — it never runs the job — so heavy/slow work never touches the request path." },
        { type: "code", lang: "bash", code: "pip install \"celery[redis]\"\n# you also need a running Redis: docker run -p 6379:6379 redis" },
        { type: "code", lang: "py", code: "# worker.py — the Celery app + tasks\nfrom celery import Celery\n\ncelery = Celery(\n    \"myapp\",\n    broker=\"redis://localhost:6379/0\",        # queue\n    backend=\"redis://localhost:6379/1\",       # result store (optional)\n)\ncelery.conf.task_track_started = True\n\n@celery.task(bind=True, max_retries=3, default_retry_delay=10)\ndef send_report(self, user_id: int):\n    try:\n        data = build_report(user_id)          # slow / CPU heavy — fine, it's off-request\n        email_report(user_id, data)\n        return {\"user_id\": user_id, \"ok\": True}\n    except TransientError as exc:\n        # exponential backoff retry; raises Retry, not the error\n        raise self.retry(exc=exc, countdown=2 ** self.request.retries)" },
        { type: "code", lang: "bash", code: "# run a worker (separate process from uvicorn) — concurrency = worker processes\ncelery -A worker.celery worker --loglevel=info --concurrency=4\n\n# a beat scheduler for periodic tasks (see below)\ncelery -A worker.celery beat --loglevel=info\n\n# live dashboard\npip install flower && celery -A worker.celery flower   # http://localhost:5555" },
        { type: "heading", text: "Enqueue from an endpoint & poll status" },
        { type: "code", lang: "py", code: "from fastapi import FastAPI, HTTPException\nfrom celery.result import AsyncResult\nfrom worker import celery, send_report\n\napp = FastAPI()\n\n@app.post(\"/reports\", status_code=202)         # 202 Accepted = \"queued, not done\"\nasync def queue_report(user_id: int):\n    task = send_report.delay(user_id)          # .delay() enqueues, returns immediately\n    return {\"task_id\": task.id}\n\n@app.get(\"/reports/{task_id}\")\nasync def report_status(task_id: str):\n    res = AsyncResult(task_id, app=celery)\n    return {\"state\": res.state,                 # PENDING/STARTED/RETRY/SUCCESS/FAILURE\n            \"result\": res.result if res.successful() else None}" },
        { type: "callout", variant: "gotcha", text: "**Never pass ORM objects or DB sessions to a task** — arguments are serialized (JSON/pickle) and the task runs in a *different* process. Pass the **id**, then re-load the row inside the task with its own session. Same for the return value: return plain data, not a SQLAlchemy model." },
        { type: "heading", text: "Scheduled / periodic tasks (beat)" },
        { type: "code", lang: "py", code: "from celery.schedules import crontab\n\ncelery.conf.beat_schedule = {\n    \"nightly-cleanup\": {\n        \"task\": \"worker.cleanup_expired\",\n        \"schedule\": crontab(hour=3, minute=0),   # every day 03:00\n    },\n    \"every-30s\": {\"task\": \"worker.heartbeat\", \"schedule\": 30.0},\n}" },
        { type: "callout", variant: "warn", text: "Celery tasks are **synchronous** by default and each worker is a separate OS process — they do **not** share your FastAPI event loop or `lifespan` state. Create connections (DB, HTTP) inside the task or via Celery signals (`worker_process_init`), not by importing your app's async pool." },
        { type: "callout", variant: "tip", text: "Prefer an **asyncio-native** worker? `ARQ` (by the pydantic author, Redis-based) or `TaskIQ` let you write `async def` tasks and `await` your existing async DB code directly — less impedance mismatch with FastAPI than Celery's sync model." }
      ]
    },
    {
      id: "redis",
      title: "Redis: caching, rate limiting & sessions",
      level: "core",
      body: [
        { type: "p", text: "Redis is the Swiss-army knife next to FastAPI: a response/data **cache**, a **rate-limit** counter, a **session/lock** store, and a **pub/sub** bus. Use the async client (`redis.asyncio`) and open one pooled connection in the lifespan, not per request." },
        { type: "code", lang: "bash", code: "pip install redis     # modern redis-py includes redis.asyncio (aioredis is merged in)" },
        { type: "code", lang: "py", code: "# one shared, pooled client for the app lifetime\nimport redis.asyncio as redis\nfrom contextlib import asynccontextmanager\nfrom fastapi import FastAPI\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    app.state.redis = redis.from_url(\"redis://localhost:6379\", decode_responses=True)\n    yield\n    await app.state.redis.aclose()\n\napp = FastAPI(lifespan=lifespan)" },
        { type: "heading", text: "Cache-aside (the manual pattern)" },
        { type: "code", lang: "py", code: "import json\nfrom fastapi import Depends, Request\n\ndef get_redis(request: Request) -> redis.Redis:\n    return request.app.state.redis\n\n@app.get(\"/products/{pid}\")\nasync def product(pid: int, r: redis.Redis = Depends(get_redis)):\n    key = f\"product:{pid}\"\n    if cached := await r.get(key):        # 1. try cache\n        return json.loads(cached)\n    data = await load_product(pid)         # 2. miss -> source of truth\n    await r.set(key, json.dumps(data), ex=60)   # 3. store with 60s TTL\n    return data\n\n# invalidate on write\n@app.put(\"/products/{pid}\")\nasync def update(pid: int, body: dict, r: redis.Redis = Depends(get_redis)):\n    await save_product(pid, body)\n    await r.delete(f\"product:{pid}\")       # bust the cache\n    return {\"ok\": True}" },
        { type: "heading", text: "Decorator caching with fastapi-cache2" },
        { type: "code", lang: "py", code: "# pip install fastapi-cache2[redis]\nfrom fastapi_cache import FastAPICache\nfrom fastapi_cache.backends.redis import RedisBackend\nfrom fastapi_cache.decorator import cache\n\n# in lifespan: FastAPICache.init(RedisBackend(app.state.redis), prefix=\"cache\")\n\n@app.get(\"/expensive\")\n@cache(expire=30)                     # caches the JSON response for 30s, keyed by path+query\nasync def expensive():\n    return await slow_aggregate()" },
        { type: "heading", text: "Rate limiting" },
        { type: "code", lang: "py", code: "# simplest: a fixed-window counter with INCR + EXPIRE (atomic-ish)\nasync def rate_limit(r: redis.Redis, ip: str, limit=100, window=60):\n    key = f\"rl:{ip}\"\n    hits = await r.incr(key)\n    if hits == 1:\n        await r.expire(key, window)    # start the window on first hit\n    if hits > limit:\n        raise HTTPException(429, \"Too Many Requests\")\n\n# or use a library: `slowapi` (Flask-Limiter port) gives @limiter.limit(\"5/minute\")" },
        { type: "callout", variant: "tip", text: "For production rate limits use a **sliding-window** or **token-bucket** Lua script (atomic in one round-trip) rather than INCR/EXPIRE, which has an edge race and allows bursts at window boundaries. `slowapi` and `fastapi-limiter` ship correct implementations." },
        { type: "callout", variant: "gotcha", text: "`decode_responses=True` gives you `str` back instead of `bytes` — pick one and be consistent, or your cache keys/`json.loads` will fail on the mismatch. And always set a **TTL** (`ex=`) on cache keys; unbounded keys are how Redis silently fills up." }
      ]
    },
    {
      id: "uploads",
      title: "File uploads & serving files",
      level: "core",
      body: [
        { type: "p", text: "Form and file input needs `python-multipart` installed. Use `UploadFile` (spooled to disk above a threshold, so big files don't eat RAM) rather than `bytes`, and stream large files to storage instead of `await file.read()`-ing the whole thing." },
        { type: "code", lang: "bash", code: "pip install python-multipart" },
        { type: "code", lang: "py", code: "from fastapi import FastAPI, UploadFile, File, Form, HTTPException\nimport shutil, uuid\nfrom pathlib import Path\n\nUPLOAD_DIR = Path(\"uploads\"); UPLOAD_DIR.mkdir(exist_ok=True)\n\n@app.post(\"/upload\")\nasync def upload(file: UploadFile, note: str = Form(\"\")):\n    if file.content_type not in {\"image/png\", \"image/jpeg\"}:\n        raise HTTPException(415, \"Only PNG/JPEG allowed\")\n    dest = UPLOAD_DIR / f\"{uuid.uuid4()}_{file.filename}\"\n    # stream copy — never loads the whole file into memory\n    with dest.open(\"wb\") as buffer:\n        shutil.copyfileobj(file.file, buffer)\n    return {\"stored\": dest.name, \"note\": note, \"size\": dest.stat().st_size}\n\n# multiple files\n@app.post(\"/gallery\")\nasync def gallery(files: list[UploadFile]):\n    return {\"count\": len(files), \"names\": [f.filename for f in files]}" },
        { type: "code", lang: "py", code: "# serving files back\nfrom fastapi.responses import FileResponse\nfrom fastapi.staticfiles import StaticFiles\n\napp.mount(\"/static\", StaticFiles(directory=\"public\"), name=\"static\")   # whole dir\n\n@app.get(\"/download/{name}\")\nasync def download(name: str):\n    return FileResponse(UPLOAD_DIR / name, filename=name)   # sets Content-Disposition" },
        { type: "callout", variant: "gotcha", text: "Validate on **content**, not just the extension or client-sent `content_type` (both are spoofable). Cap the size (reject early via a `Content-Length` check or a streaming counter), and never build the save path directly from `file.filename` — a name like `../../etc/passwd` is a path-traversal attack. Generate your own name (UUID) as above." }
      ]
    },
    {
      id: "config",
      title: "Settings & config",
      level: "core",
      body: [
        { type: "p", text: "Use `pydantic-settings` to load typed config from environment variables / `.env`." },
        { type: "code", lang: "py", code: "# pip install pydantic-settings\nfrom pydantic_settings import BaseSettings, SettingsConfigDict\n\nclass Settings(BaseSettings):\n    model_config = SettingsConfigDict(env_file=\".env\")\n    database_url: str\n    secret_key: str\n    debug: bool = False\n\nfrom functools import lru_cache\n@lru_cache\ndef get_settings() -> Settings:\n    return Settings()   # inject via Depends(get_settings)" }
      ]
    },
    {
      id: "lifespan",
      title: "Lifespan events (startup/shutdown)",
      level: "deep",
      body: [
        { type: "p", text: "The modern replacement for `@app.on_event(\"startup\")` is a **lifespan** context manager — for opening/closing DB pools, ML models, connections." },
        { type: "code", lang: "py", code: "from contextlib import asynccontextmanager\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    # startup\n    app.state.pool = await create_pool()\n    yield\n    # shutdown\n    await app.state.pool.close()\n\napp = FastAPI(lifespan=lifespan)" }
      ]
    },
    {
      id: "websockets",
      title: "WebSockets",
      level: "deep",
      body: [
        { type: "code", lang: "py", code: "from fastapi import WebSocket\n\n@app.websocket(\"/ws\")\nasync def ws(socket: WebSocket):\n    await socket.accept()\n    while True:\n        msg = await socket.receive_text()\n        await socket.send_text(f\"echo: {msg}\")" },
        { type: "link", url: "https://fastapi.tiangolo.com/advanced/websockets/", text: "FastAPI docs — WebSockets (connection managers, broadcasting)" }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Use `TestClient` (sync, based on httpx) or `httpx.AsyncClient` for async. Override dependencies to swap DBs/auth." },
        { type: "code", lang: "py", code: "from fastapi.testclient import TestClient\nfrom main import app\n\nclient = TestClient(app)\n\ndef test_read_root():\n    r = client.get(\"/\")\n    assert r.status_code == 200\n\n# swap a dependency for tests\napp.dependency_overrides[get_db] = lambda: FakeDB()" }
      ]
    },
    {
      id: "pagination",
      title: "Pagination",
      level: "deep",
      body: [
        { type: "p", text: "Two schemes. **Offset/limit** is easy and jump-to-page friendly but gets slow on deep pages (`OFFSET 100000` still scans them) and can skip/duplicate rows when data shifts. **Keyset (cursor)** paginates by \"give me rows after this id/timestamp\" — fast at any depth and stable under inserts, but no random page access." },
        { type: "code", lang: "py", code: "from pydantic import BaseModel\nfrom sqlalchemy import select, func\n\nclass Page(BaseModel):\n    items: list[UserOut]\n    total: int\n    limit: int\n    offset: int\n\n@app.get(\"/users\", response_model=Page)\nasync def list_users(db: ADB, limit: int = 20, offset: int = 0):\n    limit = min(limit, 100)                       # cap it — never trust the client\n    total = await db.scalar(select(func.count()).select_from(User))\n    rows = await db.scalars(select(User).limit(limit).offset(offset))\n    return Page(items=rows.all(), total=total, limit=limit, offset=offset)" },
        { type: "code", lang: "py", code: "# keyset / cursor: paginate on the last id you saw (indexed, no OFFSET scan)\n@app.get(\"/feed\")\nasync def feed(db: ADB, after_id: int | None = None, limit: int = 20):\n    q = select(Post).order_by(Post.id).limit(limit)\n    if after_id is not None:\n        q = q.where(Post.id > after_id)\n    rows = (await db.scalars(q)).all()\n    next_cursor = rows[-1].id if rows else None\n    return {\"items\": rows, \"next\": next_cursor}   # client sends ?after_id=next" },
        { type: "callout", variant: "tip", text: "Don't hand-roll if you don't want to: **`fastapi-pagination`** adds a `Params`/`Page[T]` dependency and a `paginate(db, query)` helper that works with SQLAlchemy, and supports both limit-offset and cursor pages with a consistent response shape." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "The bugs that actually bite FastAPI teams, and the fix for each." },
        { type: "heading", text: "1. A blocking call sneaks into async" },
        { type: "p", text: "The single most common cause of a FastAPI app \"getting slow under load\": a sync/blocking call inside `async def`. Offload it instead of rewriting everything." },
        { type: "code", lang: "py", code: "from fastapi.concurrency import run_in_threadpool\n\n@app.get(\"/thumb\")\nasync def thumb(url: str):\n    # heavy sync lib (Pillow, requests, a sync SDK) -> run OFF the event loop\n    img = await run_in_threadpool(make_thumbnail, url)\n    return {\"ok\": True}" },
        { type: "heading", text: "2. yield-dependency cleanup vs BackgroundTasks" },
        { type: "callout", variant: "gotcha", text: "A DB session from a `yield` dependency is **closed when the response is sent** — but `BackgroundTasks` run *after* that. If a background task uses the request's `db`, it hits a closed session. Fix: open a **fresh** session inside the background task, or do the DB work before returning." },
        { type: "heading", text: "3. The N+1 query" },
        { type: "p", text: "Accessing a relationship in a loop fires one query per row. Eager-load it in a single round-trip." },
        { type: "code", lang: "py", code: "from sqlalchemy.orm import selectinload\n\n# BAD: 1 query for authors + N queries (one per author.posts access)\n# GOOD: 2 queries total, relationship preloaded\nauthors = await db.scalars(\n    select(Author).options(selectinload(Author.posts))\n)" },
        { type: "heading", text: "4. Dependencies are cached per-request" },
        { type: "callout", variant: "note", text: "The same `Depends(x)` used by several dependencies in one request is resolved **once** and reused (a feature — one DB session, not five). Need a fresh value each time? `Depends(x, use_cache=False)`." },
        { type: "heading", text: "5. Circular imports in a layered app" },
        { type: "code", lang: "py", code: "# models import schemas import models... -> ImportError\n# break the type-only cycle with TYPE_CHECKING\nfrom typing import TYPE_CHECKING\nif TYPE_CHECKING:\n    from .models import User   # only imported by the type checker, not at runtime" },
        { type: "callout", variant: "warn", text: "**CORS preflight failing** in the browser but the endpoint works in curl? The `OPTIONS` request is handled by `CORSMiddleware`, which must be added with the right `allow_origins`/`allow_methods`/`allow_headers` — and `allow_origins=[\"*\"]` is **incompatible with** `allow_credentials=True`. List explicit origins when you send cookies." }
      ]
    },
    {
      id: "deploy",
      title: "Deployment notes",
      level: "deep",
      body: [
        { type: "list", items: [
          "Run under **uvicorn** with multiple workers, or `gunicorn -k uvicorn.workers.UvicornWorker`.",
          "Put **nginx**/a load balancer in front for TLS + static files.",
          "`fastapi run` is the production CLI shortcut.",
          "Containerize: slim Python base, install deps, `CMD [\"fastapi\", \"run\", \"main.py\", \"--port\", \"80\"]`."
        ] },
        { type: "code", lang: "bash", code: "gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:80" }
      ]
    }
  ],

  packages: [
    { name: "uvicorn", why: "ASGI server (dev + prod)" },
    { name: "pydantic", why: "validation (v2, bundled)" },
    { name: "pydantic-settings", why: "typed env config" },
    { name: "sqlalchemy", why: "the standard ORM (2.0 style)" },
    { name: "sqlmodel", why: "SQLAlchemy + Pydantic combo" },
    { name: "alembic", why: "DB migrations" },
    { name: "pyjwt", why: "JWT encode/decode (prefer over the unmaintained python-jose)" },
    { name: "pwdlib[argon2]", why: "modern password hashing (Argon2); passlib is unmaintained" },
    { name: "httpx", why: "async HTTP client + test client" },
    { name: "celery[redis]", why: "durable/scheduled background jobs (separate worker)" },
    { name: "arq", why: "asyncio-native task queue (write async tasks)" },
    { name: "redis", why: "cache / rate-limit / sessions (async client built in)" },
    { name: "fastapi-cache2", why: "@cache decorator backed by Redis" },
    { name: "slowapi", why: "rate limiting (@limiter.limit)" },
    { name: "python-multipart", why: "required for form fields & file uploads" },
    { name: "fastapi-pagination", why: "drop-in Page[T] pagination" },
    { name: "flower", why: "Celery monitoring dashboard" }
  ],

  gotchas: [
    "Blocking code inside `async def` freezes the event loop — use `def` for sync libs or an async driver.",
    "Declare specific routes (`/users/me`) **before** parameterized ones (`/users/{id}`).",
    "Mutable default arguments (`= []`, `= {}`) are shared across calls — use `Field(default_factory=list)`.",
    "`response_model` filters output fields; if data is missing it can silently drop it — verify the schema matches.",
    "Pydantic v1 → v2 renamed a lot: `.dict()`→`.model_dump()`, `orm_mode`→`from_attributes`, `@validator`→`@field_validator`.",
    "SQLAlchemy sessions aren't thread-safe; create one per request (yield dependency), never a global session.",
    "`BackgroundTasks` run after the response but in-process: a yield-dependency DB session is already closed, and the task isn't retried or persisted — use Celery/ARQ for durable work.",
    "Celery tasks run in a separate process: pass **ids**, not ORM objects/sessions, and build connections inside the task — they don't share your FastAPI event loop or lifespan state.",
    "File uploads need `python-multipart` installed, and never build the save path from `file.filename` (path traversal) — generate your own name.",
    "`CORSMiddleware` with `allow_origins=[\"*\"]` cannot be combined with `allow_credentials=True`; list explicit origins when sending cookies."
  ],

  flashcards: [
    { q: "How does FastAPI decide if a parameter is a path, query, or body value?", a: "Path params match the URL template `{...}`; Pydantic-model-typed params are the JSON **body**; other scalar-typed params are **query** params." },
    { q: "What does `response_model` do beyond documentation?", a: "It **filters and validates** the outgoing data — extra fields (like passwords) are stripped from the response." },
    { q: "When should a handler be `def` instead of `async def`?", a: "When it calls **blocking** libraries. FastAPI runs plain `def` handlers in a threadpool so they don't block the event loop." },
    { q: "How do you get a DB session that always closes, per request?", a: "A **yield dependency**: create the session, `yield` it, close it in `finally`; inject via `Depends(get_db)`." },
    { q: "What is `Depends` used for?", a: "Dependency injection — reusable, composable providers (DB, current user, pagination, config) resolved and injected by FastAPI." },
    { q: "Which Pydantic v2 method replaces `.dict()`?", a: "`.model_dump()` (and `.model_dump_json()` for JSON)." },
    { q: "How do you return a proper 404?", a: "`raise HTTPException(status_code=404, detail=\"...\")`." },
    { q: "How do you let a Pydantic model read from an ORM object?", a: "Set `model_config = ConfigDict(from_attributes=True)` (was `orm_mode` in v1)." },
    { q: "When should you reach for Celery instead of BackgroundTasks?", a: "When the work must survive a restart, needs retries or scheduling, must run on a separate machine, or is CPU-heavy. `BackgroundTasks` is in-process, fire-and-forget, no queue." },
    { q: "Why must you pass an id (not an ORM object) to a Celery task?", a: "The task runs in a **separate process**; arguments are serialized. Pass the id and re-load the row inside the task with its own DB session; return plain data too." },
    { q: "What's the cache-aside pattern with Redis?", a: "On read: check Redis; on miss, hit the source of truth and `SET` it with a TTL. On write: update the source and `DELETE` the key to invalidate." },
    { q: "Offset/limit vs keyset pagination — when each?", a: "Offset/limit for small tables + jump-to-page; keyset (WHERE id > cursor) for large tables/infinite scroll — it's index-fast at any depth and stable under inserts." },
    { q: "How do you offload a blocking call inside an async handler?", a: "`await run_in_threadpool(fn, ...)` from `fastapi.concurrency` — runs it off the event loop without rewriting the handler as `def`." }
  ],

  cheatsheet: [
    { label: "Dev server", code: "fastapi dev main.py" },
    { label: "Prod server", code: "fastapi run main.py --port 80" },
    { label: "Path + query", code: "async def f(id: int, q: str | None = None)" },
    { label: "Body model", code: "async def f(body: UserCreate)" },
    { label: "Inject dep", code: "x: Annotated[T, Depends(dep)]" },
    { label: "Error", code: "raise HTTPException(404, \"not found\")" },
    { label: "Router", code: "app.include_router(users.router)" },
    { label: "Migration", code: "alembic revision --autogenerate -m 'msg'" },
    { label: "Celery task", code: "@celery.task def f(id): ...  # f.delay(id)" },
    { label: "Celery worker", code: "celery -A worker.celery worker -c 4" },
    { label: "Redis cache", code: "await r.set(key, val, ex=60)" },
    { label: "Offload blocking", code: "await run_in_threadpool(fn, arg)" },
    { label: "File upload", code: "async def up(file: UploadFile): ..." }
  ]
});
