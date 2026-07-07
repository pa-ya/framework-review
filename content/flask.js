(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "flask",
  name: "Flask",
  language: "Python",
  tagline: "The **micro-framework**: a tiny, unopinionated core (routing + Jinja2) that you grow with extensions — from a one-file API to a full server-rendered web app.",
  color: "#5b6673",
  readMinutes: 19,
  group: "Python",

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "Flask is a **WSGI** micro-framework built on two libraries by the same team: **Werkzeug** (the WSGI toolkit — routing, request/response objects, the dev server) and **Jinja2** (templating). \"Micro\" means the core is small and makes **no decisions for you** — no built-in ORM, no forms, no auth. You add exactly the pieces you need via extensions." },
        { type: "list", items: [
          "**Reach for it when:** you want full control and a minimal surface — a small API, a server-rendered web app, an admin/internal tool, or you want to understand every moving part.",
          "**Strengths:** simplicity, a gentle learning curve, huge ecosystem of extensions, and a mature, stable core. Great for both APIs *and* classic HTML apps (Jinja templates + forms).",
          "**Mental model:** one `Flask` **application object** dispatches requests to **view functions** you register with `@app.route`. Everything else — DB, forms, auth, migrations — is a library you bolt on."
        ] },
        { type: "table", headers: ["Pick", "Over", "When"], rows: [
          ["**Flask**", "FastAPI", "You want server-rendered HTML (Jinja), a sync WSGI app, or maximum flexibility / minimal magic."],
          ["**Flask**", "Django", "You want to assemble your own stack instead of adopting a batteries-included monolith."],
          ["**FastAPI**", "Flask", "You want async-first, typed request/response models and automatic OpenAPI docs."],
          ["**Django**", "Flask", "You want an admin, ORM, auth and migrations out of the box with conventions."]
        ] },
        { type: "callout", variant: "note", text: "This guide targets **Flask 3.x** (Python 3.9+). Flask is **synchronous WSGI** at heart; it added limited `async def` view support in 2.0, but it is not an async framework like FastAPI — see the async section." }
      ]
    },
    {
      id: "setup",
      title: "Project setup & the minimal app",
      level: "core",
      body: [
        { type: "p", text: "Create a virtualenv, install Flask, write a module that creates the `app` object, and run it with the `flask` CLI (not `python app.py` in production)." },
        { type: "code", lang: "bash", code: "python -m venv .venv && source .venv/bin/activate\npip install Flask\n\n# run the dev server (auto-reload + interactive debugger)\nexport FLASK_APP=app.py       # or app:create_app for a factory\nflask run --debug\n#   * Running on http://127.0.0.1:5000" },
        { type: "code", lang: "py", code: "# app.py\nfrom flask import Flask\n\napp = Flask(__name__)          # __name__ helps Flask locate templates/static\n\n@app.route(\"/\")\ndef index():\n    return \"Hello, Flask!\"     # a str return becomes a 200 text/html response\n\nif __name__ == \"__main__\":\n    app.run(debug=True)        # dev only; use gunicorn in production" },
        { type: "callout", variant: "gotcha", text: "`app.run()` / `flask run` start Werkzeug's **development** server — single-process, not for production. It's convenient (auto-reload, the in-browser debugger) but you must deploy behind **gunicorn**/**uWSGI**/**waitress** (see Deployment)." },
        { type: "callout", variant: "tip", text: "`--debug` enables the reloader *and* the interactive traceback debugger. Never run with debug on in production — the debugger allows arbitrary code execution via its console." }
      ]
    },
    {
      id: "routing",
      title: "Routing, methods & URL building",
      level: "core",
      body: [
        { type: "p", text: "Map URLs to view functions with `@app.route`. Dynamic segments use `<converter:name>` and are passed as keyword arguments. Restrict verbs with `methods=`, or use the shortcut decorators (`@app.get`, `@app.post`, ... added in 2.0)." },
        { type: "code", lang: "py", code: "@app.route(\"/users/<int:user_id>\")          # int converter -> validated & cast\ndef get_user(user_id):\n    return {\"id\": user_id}\n\n@app.route(\"/posts/<slug>\")                  # default (string) converter\ndef post(slug):\n    return f\"post: {slug}\"\n\n@app.post(\"/users\")                          # method shortcut (== methods=[\"POST\"])\ndef create_user():\n    ...\n\n@app.route(\"/search\", methods=[\"GET\", \"POST\"])\ndef search():\n    ..." },
        { type: "table", headers: ["Converter", "Matches"], rows: [
          ["`<string:x>` (default)", "any text without a slash"],
          ["`<int:x>` / `<float:x>`", "integers / floats, cast to the type"],
          ["`<path:x>`", "text **including** slashes (sub-paths)"],
          ["`<uuid:x>`", "a UUID string"]
        ] },
        { type: "p", text: "Never hard-code URLs — build them with **`url_for`** (keyed by the *function name*), so routes can change without breaking links. It also handles the correct static path and query strings." },
        { type: "code", lang: "py", code: "from flask import url_for\n\nurl_for(\"get_user\", user_id=7)            # -> /users/7\nurl_for(\"get_user\", user_id=7, ref=\"nav\")  # -> /users/7?ref=nav\nurl_for(\"static\", filename=\"app.css\")     # -> /static/app.css" },
        { type: "callout", variant: "gotcha", text: "A view function name must be **unique** across the app — `url_for` and Flask's routing key off it. Two views named `index` (outside blueprints) collide. Blueprints namespace this as `url_for(\"blueprint.view\")`." }
      ]
    },
    {
      id: "request-response",
      title: "The request & building responses",
      level: "core",
      body: [
        { type: "p", text: "Read input from the global **`request`** proxy (query string, form, JSON, files, headers). Return a `str` (HTML), a `dict`/`list` (auto-JSON since 2.1), a `(body, status)` or `(body, status, headers)` tuple, or a `Response` object." },
        { type: "code", lang: "py", code: "from flask import request, jsonify, make_response, redirect, url_for, abort\n\n@app.post(\"/items\")\ndef create():\n    # query string: /items?debug=1\n    debug = request.args.get(\"debug\", type=int)\n    # form-encoded body (HTML forms)\n    name = request.form.get(\"name\")\n    # JSON body (Content-Type: application/json)\n    data = request.get_json(silent=True) or {}\n    # uploaded files\n    f = request.files.get(\"avatar\")\n    if f:\n        f.save(f\"/uploads/{f.filename}\")\n\n    if not data.get(\"email\"):\n        abort(400, description=\"email required\")   # -> 400 error handler\n\n    return {\"ok\": True, \"name\": name}, 201          # dict -> JSON, status 201" },
        { type: "table", headers: ["`request` attribute", "Holds"], rows: [
          ["`request.args`", "query-string params (`?a=1`) — a `MultiDict`"],
          ["`request.form`", "form-encoded body fields (HTML `<form>`)"],
          ["`request.get_json()`", "parsed JSON body (`request.json` shorthand)"],
          ["`request.files`", "uploaded files (`multipart/form-data`)"],
          ["`request.values`", "combined args + form"],
          ["`request.headers` / `request.cookies`", "request headers / cookies"]
        ] },
        { type: "code", lang: "py", code: "# explicit responses\nreturn jsonify(items=[1, 2, 3])                 # JSON Response\nreturn redirect(url_for(\"index\"))               # 302 redirect\nresp = make_response(\"body\", 200)\nresp.headers[\"X-Custom\"] = \"1\"\nresp.set_cookie(\"theme\", \"dark\", httponly=True)\nreturn resp" },
        { type: "callout", variant: "note", text: "`request` (and `session`, `g`, `current_app`) are **context-local proxies** — they magically refer to the *current* request without being passed around. That's powerful but is the root of the classic \"working outside of request context\" error (see Contexts)." }
      ]
    },
    {
      id: "templates",
      title: "Templates & server-rendered HTML (Jinja2)",
      level: "core",
      body: [
        { type: "p", text: "For fullstack (server-rendered) apps, Flask renders **Jinja2** templates from a `templates/` folder with `render_template`. Jinja gives you variables (`{{ }}`), logic (`{% %}`), filters (`| upper`), and — crucially — **template inheritance** for shared layout." },
        { type: "code", lang: "py", code: "from flask import render_template\n\n@app.get(\"/\")\ndef home():\n    users = [{\"name\": \"Ada\"}, {\"name\": \"Linus\"}]\n    return render_template(\"home.html\", users=users, title=\"Home\")" },
        { type: "code", lang: "xml", code: "{# templates/base.html — the layout #}\n<!doctype html>\n<html>\n  <head>\n    <title>{% block title %}{{ title }}{% endblock %}</title>\n    <link rel=\"stylesheet\" href=\"{{ url_for('static', filename='app.css') }}\">\n  </head>\n  <body>\n    {% for msg in get_flashed_messages() %}<div class=\"flash\">{{ msg }}</div>{% endfor %}\n    {% block content %}{% endblock %}\n  </body>\n</html>" },
        { type: "code", lang: "xml", code: "{# templates/home.html — extends the layout #}\n{% extends \"base.html\" %}\n{% block content %}\n  <h1>Users</h1>\n  <ul>\n    {% for u in users %}\n      <li>{{ u.name }} — {{ u.name | upper }}</li>\n    {% else %}\n      <li>No users yet.</li>\n    {% endfor %}\n  </ul>\n{% endblock %}" },
        { type: "list", items: [
          "**Autoescaping is on** for `.html`/`.xml` templates — `{{ user_input }}` is HTML-escaped by default, so Jinja is XSS-safe unless you explicitly mark text `| safe` (only for trusted HTML).",
          "**`{% include %}`** pulls in partials; **`{% macro %}`** defines reusable snippets (like components).",
          "Static assets live in `static/` and are referenced via `url_for('static', filename=...)`.",
          "**Flash messages** (`flash(\"Saved\")` + `get_flashed_messages()`) show one-shot notices across a redirect."
        ] },
        { type: "callout", variant: "tip", text: "Jinja `{{ }}` interpolation is **not** Python f-strings — it's evaluated by the template engine at render time and autoescaped. Prefer passing data into the template over building HTML strings in Python." }
      ]
    },
    {
      id: "app-factory",
      title: "Structure: application factory & blueprints",
      level: "core",
      body: [
        { type: "p", text: "A one-file `app` is fine for demos; real apps use the **application factory** pattern — a `create_app()` function that builds and configures the app. It makes testing, multiple configs, and avoiding circular imports far easier. Routes are split into **blueprints** (modular groups of routes, templates and static files)." },
        { type: "code", lang: "py", code: "# app/__init__.py — the factory\nfrom flask import Flask\n\ndef create_app(config=None):\n    app = Flask(__name__)\n    app.config.from_object(\"config.Settings\")\n    if config:\n        app.config.update(config)\n\n    # init extensions against THIS app (see ORM section)\n    from .extensions import db, migrate\n    db.init_app(app)\n    migrate.init_app(app, db)\n\n    # register blueprints\n    from .users.routes import bp as users_bp\n    app.register_blueprint(users_bp, url_prefix=\"/users\")\n    return app" },
        { type: "code", lang: "py", code: "# app/users/routes.py — a blueprint\nfrom flask import Blueprint, render_template\n\nbp = Blueprint(\"users\", __name__, template_folder=\"templates\")\n\n@bp.get(\"/\")\ndef list_users():\n    return render_template(\"users/list.html\")\n\n@bp.get(\"/<int:user_id>\")\ndef detail(user_id):\n    return {\"id\": user_id}\n# url_for(\"users.detail\", user_id=1)  -> /users/1  (note the 'users.' prefix)" },
        { type: "callout", variant: "tip", text: "Run a factory with `flask --app app:create_app run`. The extension pattern — construct the extension object **module-level**, then bind it in the factory with `.init_app(app)` — is what avoids circular imports and lets you create multiple app instances in tests." },
        { type: "callout", variant: "note", text: "A pragmatic layout: `app/__init__.py` (factory), `app/extensions.py` (db, migrate, login_manager singletons), `app/<feature>/routes.py` + `models.py` + `templates/`, `config.py`, `wsgi.py` (entrypoint for gunicorn)." }
      ]
    },
    {
      id: "contexts",
      title: "Application & request contexts (the classic gotcha)",
      level: "core",
      body: [
        { type: "p", text: "Flask uses **context-local** globals so you don't thread `request`/`db` through every function. There are two contexts, each pushed automatically during a request and torn down after:" },
        { type: "table", headers: ["Global", "Context", "What it is"], rows: [
          ["`request`", "request", "the incoming HTTP request"],
          ["`session`", "request", "a signed-cookie dict for per-user state"],
          ["`g`", "app (per request)", "a scratchpad for data during one request (e.g. the DB conn, current user)"],
          ["`current_app`", "app", "the active application object (config, logger, extensions)"]
        ] },
        { type: "code", lang: "py", code: "from flask import g, session, current_app\n\n# session: signed cookie, survives across requests (per browser)\nsession[\"user_id\"] = 42\nuid = session.get(\"user_id\")\n\n# g: lives for ONE request only — cache per-request objects here\ndef get_db():\n    if \"db\" not in g:\n        g.db = connect(current_app.config[\"DATABASE_URL\"])\n    return g.db\n\n@app.teardown_appcontext\ndef close_db(exc):\n    db = g.pop(\"db\", None)\n    if db is not None:\n        db.close()" },
        { type: "callout", variant: "gotcha", text: "\"**RuntimeError: Working outside of application/request context**\" is *the* Flask beginner error. It means you touched `request`/`current_app`/`db` outside a request (e.g. at import time, in a script, or a background thread). Wrap that code in `with app.app_context():` (or `app.test_request_context()`)." },
        { type: "callout", variant: "warn", text: "`session` is stored in a **cryptographically signed cookie** (tamper-proof, but readable by the client) — set a strong `SECRET_KEY` and never put secrets in it. For server-side sessions use the Flask-Session extension." }
      ]
    },
    {
      id: "orm",
      title: "Database: Flask-SQLAlchemy & migrations",
      level: "core",
      body: [
        { type: "p", text: "Flask has no ORM; the standard choice is **Flask-SQLAlchemy** (a thin integration of SQLAlchemy that manages the engine, a scoped session, and app config). Schema changes are versioned with **Flask-Migrate** (Alembic under the hood)." },
        { type: "code", lang: "bash", code: "pip install Flask-SQLAlchemy Flask-Migrate" },
        { type: "code", lang: "py", code: "# app/extensions.py\nfrom flask_sqlalchemy import SQLAlchemy\nfrom flask_migrate import Migrate\n\ndb = SQLAlchemy()\nmigrate = Migrate()\n# (bound to the app in create_app via db.init_app(app))" },
        { type: "code", lang: "py", code: "# app/users/models.py\nfrom sqlalchemy.orm import Mapped, mapped_column\nfrom ..extensions import db\n\nclass User(db.Model):\n    id: Mapped[int] = mapped_column(primary_key=True)\n    email: Mapped[str] = mapped_column(unique=True)\n    name: Mapped[str]\n\n    def to_dict(self):\n        return {\"id\": self.id, \"email\": self.email, \"name\": self.name}" },
        { type: "code", lang: "py", code: "# queries (SQLAlchemy 2.0 style via db.session)\nfrom sqlalchemy import select\n\nuser = db.session.get(User, 1)                        # by primary key\nusers = db.session.scalars(select(User)).all()        # all rows\nada = db.session.scalar(select(User).filter_by(name=\"Ada\"))\n\n# create\ndb.session.add(User(email=\"a@x.io\", name=\"Ada\"))\ndb.session.commit()\n\n# Flask-SQLAlchemy convenience 404 for web views:\nfrom flask import abort\nuser = db.get_or_404(User, 1)                         # 404 if missing" },
        { type: "code", lang: "bash", code: "# migrations (Flask-Migrate / Alembic)\nflask db init                       # once: create migrations/ folder\nflask db migrate -m \"create users\"  # autogenerate a revision from models\nflask db upgrade                    # apply to the database\nflask db downgrade                  # roll back one" },
        { type: "callout", variant: "gotcha", text: "The `db.session` is tied to the request context and cleaned up on teardown. Don't share one session across threads, and always `commit()` (or `rollback()` on error) — Flask-SQLAlchemy removes the session at the end of the request, but uncommitted changes are lost." }
      ]
    },
    {
      id: "auth",
      title: "Auth: sessions with Flask-Login (and JWT for APIs)",
      level: "core",
      body: [
        { type: "p", text: "For classic server-rendered apps, **Flask-Login** manages the logged-in user in the session: it stores the user id, reloads the user each request, and gives you `@login_required` and `current_user`." },
        { type: "code", lang: "py", code: "# pip install Flask-Login\nfrom flask_login import (LoginManager, UserMixin, login_user,\n                         logout_user, login_required, current_user)\nfrom werkzeug.security import generate_password_hash, check_password_hash\n\nlogin_manager = LoginManager()\nlogin_manager.login_view = \"auth.login\"   # redirect target for @login_required\n\nclass User(UserMixin, db.Model):\n    id: Mapped[int] = mapped_column(primary_key=True)\n    email: Mapped[str] = mapped_column(unique=True)\n    pw_hash: Mapped[str]\n    def check(self, pw): return check_password_hash(self.pw_hash, pw)\n\n@login_manager.user_loader\ndef load_user(user_id):\n    return db.session.get(User, int(user_id))" },
        { type: "code", lang: "py", code: "@bp.post(\"/login\")\ndef login():\n    user = db.session.scalar(select(User).filter_by(email=request.form[\"email\"]))\n    if user and user.check(request.form[\"password\"]):\n        login_user(user)                 # sets the session cookie\n        return redirect(url_for(\"index\"))\n    flash(\"Bad credentials\")\n    return redirect(url_for(\"auth.login\"))\n\n@bp.get(\"/me\")\n@login_required                          # 401/redirect if not logged in\ndef me():\n    return {\"email\": current_user.email}\n\n@bp.post(\"/logout\")\ndef logout():\n    logout_user()\n    return redirect(url_for(\"index\"))" },
        { type: "callout", variant: "tip", text: "Always hash passwords — `generate_password_hash` (scrypt/pbkdf2 via Werkzeug) or `argon2`. Never store plaintext. For a **JSON API** prefer stateless **JWTs** (e.g. `Flask-JWT-Extended`) over cookie sessions, and add CSRF protection (Flask-WTF) for cookie-based form apps." }
      ]
    },
    {
      id: "forms",
      title: "Forms & validation (Flask-WTF)",
      level: "core",
      body: [
        { type: "p", text: "For HTML forms, **Flask-WTF** wraps WTForms: declarative form classes, server-side validation, and — importantly — automatic **CSRF protection**. It's the standard for server-rendered form apps." },
        { type: "code", lang: "py", code: "# pip install Flask-WTF\nfrom flask_wtf import FlaskForm\nfrom wtforms import StringField, PasswordField\nfrom wtforms.validators import DataRequired, Email, Length\n\nclass RegisterForm(FlaskForm):\n    email = StringField(\"Email\", validators=[DataRequired(), Email()])\n    password = PasswordField(\"Password\", validators=[DataRequired(), Length(min=8)])\n\n@bp.route(\"/register\", methods=[\"GET\", \"POST\"])\ndef register():\n    form = RegisterForm()\n    if form.validate_on_submit():          # POST + valid + CSRF ok\n        create_user(form.email.data, form.password.data)\n        return redirect(url_for(\"index\"))\n    return render_template(\"register.html\", form=form)   # GET or invalid" },
        { type: "code", lang: "xml", code: "{# register.html — render the form + CSRF token #}\n<form method=\"post\">\n  {{ form.csrf_token }}\n  {{ form.email.label }} {{ form.email() }}\n  {% for e in form.email.errors %}<span class=\"err\">{{ e }}</span>{% endfor %}\n  {{ form.password.label }} {{ form.password() }}\n  <button type=\"submit\">Sign up</button>\n</form>" },
        { type: "callout", variant: "gotcha", text: "CSRF protection needs a `SECRET_KEY`. If your form POST returns **400 Bad Request**, you likely forgot to render `{{ form.csrf_token }}` in the template — the missing token fails validation." }
      ]
    },
    {
      id: "rest-api",
      title: "Building a JSON API",
      level: "core",
      body: [
        { type: "p", text: "Flask makes a fine JSON API without extra libraries: return dicts (auto-JSON), group routes in a blueprint, and register **error handlers** that return JSON instead of HTML. For bigger APIs, add a serialization/validation layer (**marshmallow** / **pydantic**) or a helper framework (**Flask-RESTful**, **Flask-Smorest** for OpenAPI)." },
        { type: "code", lang: "py", code: "api = Blueprint(\"api\", __name__, url_prefix=\"/api\")\n\n@api.get(\"/users\")\ndef list_users():\n    users = db.session.scalars(select(User)).all()\n    return {\"users\": [u.to_dict() for u in users]}   # dict -> JSON\n\n@api.post(\"/users\")\ndef create_user():\n    data = request.get_json()\n    if not data or \"email\" not in data:\n        return {\"error\": \"email required\"}, 400\n    u = User(email=data[\"email\"], name=data.get(\"name\", \"\"))\n    db.session.add(u); db.session.commit()\n    return u.to_dict(), 201\n\n# JSON error handlers (so /api/* never returns an HTML error page)\n@api.errorhandler(404)\ndef not_found(e):\n    return {\"error\": \"not found\"}, 404" },
        { type: "list", items: [
          "Return **`dict`/`list`** and Flask serializes to JSON automatically (2.1+); use `jsonify(...)` when you need to set headers/status explicitly.",
          "Class-based views: subclass **`MethodView`** to group `get`/`post`/`put`/`delete` for one resource.",
          "**CORS** for browser clients: `pip install Flask-Cors` then `CORS(app)` (or per-blueprint).",
          "For request/response **schemas + validation + OpenAPI**, reach for **Flask-Smorest** (marshmallow) — the closest Flask gets to FastAPI's auto-docs."
        ] },
        { type: "callout", variant: "tip", text: "Register error handlers app-wide with `@app.errorhandler(Exception)` to convert unexpected exceptions into a controlled JSON 500 — and check `request.accept_mimetypes` if you serve both HTML pages and JSON from one app." }
      ]
    },
    {
      id: "config",
      title: "Configuration & the CLI",
      level: "core",
      body: [
        { type: "p", text: "`app.config` is a dict you populate from a config **object/class**, environment variables, or a file. Keep secrets out of source — load them from the environment. Flask also has an extensible **CLI** (`flask` command) via Click." },
        { type: "code", lang: "py", code: "# config.py\nimport os\nclass Settings:\n    SECRET_KEY = os.environ[\"SECRET_KEY\"]\n    SQLALCHEMY_DATABASE_URI = os.environ.get(\"DATABASE_URL\", \"sqlite:///app.db\")\n    DEBUG = os.environ.get(\"FLASK_DEBUG\") == \"1\"\n\n# in the factory:\napp.config.from_object(\"config.Settings\")\napp.config.from_prefixed_env()     # loads FLASK_* env vars\n# app.config.from_pyfile(\"instance/local.cfg\", silent=True)  # untracked overrides" },
        { type: "code", lang: "py", code: "# custom CLI command: flask seed\nimport click\n@app.cli.command(\"seed\")\ndef seed():\n    \"\"\"Seed the database with sample data.\"\"\"\n    db.session.add(User(email=\"a@x.io\", name=\"Ada\"))\n    db.session.commit()\n    click.echo(\"seeded\")" },
        { type: "callout", variant: "note", text: "The **instance folder** (`instance/`) is for per-deployment files (a local config, the SQLite db) that shouldn't be committed. Enable with `Flask(__name__, instance_relative_config=True)`." }
      ]
    },
    {
      id: "middleware",
      title: "Hooks, error handlers & middleware",
      level: "deep",
      body: [
        { type: "p", text: "Flask exposes the request lifecycle through **decorated hooks** rather than a middleware chain. WSGI middleware wraps the whole app underneath." },
        { type: "code", lang: "py", code: "@app.before_request\ndef require_json_for_api():\n    if request.path.startswith(\"/api\") and request.method == \"POST\":\n        if not request.is_json:\n            return {\"error\": \"expected JSON\"}, 415\n\n@app.after_request\ndef add_headers(resp):\n    resp.headers[\"X-Frame-Options\"] = \"DENY\"\n    return resp                       # MUST return the response\n\n@app.errorhandler(404)\ndef page_not_found(e):\n    return render_template(\"404.html\"), 404\n\n# true WSGI middleware (e.g. behind a proxy that sets X-Forwarded-*)\nfrom werkzeug.middleware.proxy_fix import ProxyFix\napp.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)" },
        { type: "callout", variant: "tip", text: "Hooks can be **blueprint-scoped** (`@bp.before_request`) to apply only to that blueprint's routes — e.g. an auth check on every `/admin` route without touching the rest of the app." }
      ]
    },
    {
      id: "async",
      title: "Async views & background work",
      level: "deep",
      body: [
        { type: "p", text: "Flask 2.0+ accepts `async def` views (install `Flask[async]`), but Flask is still a **WSGI/synchronous** framework: each async view runs in its own event loop on a worker thread. It does **not** give you FastAPI-style concurrency — it's mainly convenient for awaiting an occasional async library." },
        { type: "code", lang: "py", code: "# pip install \"Flask[async]\" httpx\nimport httpx\n\n@app.get(\"/proxy\")\nasync def proxy():\n    # each request spins up (and tears down) its own event loop on a\n    # worker thread -- fine for awaiting a lib, NOT true concurrency\n    async with httpx.AsyncClient(timeout=5) as client:\n        r = await client.get(\"https://api.example.com/status\")\n    return r.json()\n\n# CANNOT await background work after returning: the loop is gone.\n# Offload long/CPU jobs to a queue instead:\n#   from .tasks import send_email      # a Celery/RQ task\n#   send_email.delay(user.email)       # returns immediately" },
        { type: "callout", variant: "warn", text: "For real concurrency or true ASGI, use **Quart** (an ASGI-native, Flask-API-compatible framework) instead. For CPU-heavy or long jobs, offload to a task queue (**Celery** / **RQ**) — don't block a Flask worker." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Flask ships a **test client** (`app.test_client()`) that drives the app without a running server, plus a **CLI runner**. With the factory pattern you build a throwaway app configured for tests." },
        { type: "code", lang: "py", code: "# conftest.py (pytest)\nimport pytest\nfrom app import create_app\nfrom app.extensions import db\n\n@pytest.fixture\ndef client():\n    app = create_app({\"TESTING\": True, \"SQLALCHEMY_DATABASE_URI\": \"sqlite://\"})\n    with app.app_context():\n        db.create_all()\n        yield app.test_client()\n\ndef test_create_user(client):\n    r = client.post(\"/api/users\", json={\"email\": \"a@x.io\"})\n    assert r.status_code == 201\n    assert r.get_json()[\"email\"] == \"a@x.io\"" },
        { type: "callout", variant: "tip", text: "`test_client()` keeps a session cookie jar across requests, so you can log in and then hit protected routes. Use `app.test_request_context()` when you need to test code that touches `request`/`g` directly." }
      ]
    },
    {
      id: "deploy",
      title: "Deployment",
      level: "deep",
      body: [
        { type: "list", items: [
          "**Never** ship the dev server. Run a production **WSGI server**: `gunicorn` (Linux), `waitress` (cross-platform/Windows), or `uWSGI`.",
          "Point the server at the app callable — `wsgi:app` where `wsgi.py` does `app = create_app()`.",
          "Put **nginx** in front for TLS, static files, and buffering; scale with multiple gunicorn workers.",
          "Set `SECRET_KEY`, `DATABASE_URL`, etc. via **environment variables**; run `flask db upgrade` on deploy."
        ] },
        { type: "code", lang: "bash", code: "pip install gunicorn\n# 4 sync workers; wsgi.py exposes `app`\ngunicorn -w 4 -b 0.0.0.0:8000 wsgi:app\n\n# for many async/slow-I/O views, use gthread or gevent workers:\ngunicorn -w 2 -k gthread --threads 8 wsgi:app" },
        { type: "callout", variant: "gotcha", text: "Gunicorn's default **sync** worker handles one request at a time per worker — size `-w` to your CPU (a common start: `2 × cores + 1`). For lots of slow I/O, use `gthread` or `gevent` workers rather than piling on sync workers." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "The Contexts and App-factory sections introduced *why* Flask works the way it does. This section is the field guide to the **consequences** — the errors and surprises that bite in real deployments, and the concrete fix for each. Skim it before you ship." },

        { type: "heading", text: "1. `current_app`/`db` in a thread, script, or at import time" },
        { type: "p", text: "The \"Working outside of application context\" `RuntimeError` (covered in Contexts) shows up most often *outside* a normal request: a background `threading.Thread`, a plain Python script, a Celery task, or module-level code that runs at import. There is no request being handled, so the context-local globals have nothing to point at. **Push a context manually.**" },
        { type: "code", lang: "py", code: "from myapp import create_app\nfrom myapp.extensions import db\nfrom myapp.models import User\n\napp = create_app()\n\n# WRONG: no context active -> RuntimeError\n# users = db.session.scalars(select(User)).all()\n\n# RIGHT: push an application context for the duration of the block\nwith app.app_context():\n    users = db.session.scalars(select(User)).all()\n    # current_app, db, g are all usable in here\n\n# In a background thread you must push the context INSIDE the thread,\n# because contexts are thread-local (they don't inherit across threads):\nimport threading\n\ndef worker(app):\n    with app.app_context():\n        db.session.add(User(email=\"bg@x.io\", name=\"bg\"))\n        db.session.commit()\n\nthreading.Thread(target=worker, args=(app,)).start()" },
        { type: "callout", variant: "tip", text: "For one-off exploration use **`flask shell`** — it opens a Python REPL with an application context already pushed and `app`/`db` (and anything registered via `@app.shell_context_processor`) preloaded, so `db.session` just works without the `with` block." },

        { type: "heading", text: "2. One slow request blocks a whole worker" },
        { type: "p", text: "Flask is **synchronous WSGI**: a worker processes exactly one request start-to-finish before taking the next. A single 10-second call (an external API, a heavy report, `time.sleep`) means that worker serves *nobody* else for 10 seconds. The dev server makes this worse — by default it's effectively single-request, so it is never a capacity test and never for production." },
        { type: "table", headers: ["Symptom", "Cause", "Fix"], rows: [
          ["App \"hangs\" under light load", "Too few workers for blocking I/O", "More gunicorn workers, or `-k gthread`/`gevent`"],
          ["A slow endpoint stalls everything", "Long work inline in the view", "Offload to a task queue (Celery/RQ); return a job id"],
          ["`async def` view still not concurrent", "WSGI runs each in its own loop", "Use an ASGI server (Quart/Hypercorn) for real concurrency"]
        ] },
        { type: "callout", variant: "warn", text: "`async def` views (see Async section) run in a **fresh per-request event loop on a worker thread** — they let you `await` a library but give **no** throughput gain over sync views under WSGI. If you need thousands of concurrent connections, you need an ASGI stack, not `async def` on Flask." },

        { type: "heading", text: "3. Module/global state is per-process, not shared across workers" },
        { type: "p", text: "In production you run **multiple gunicorn workers**, each a separate OS process with its **own** copy of your module globals. An in-memory dict cache, a counter, or a naive rate-limiter works perfectly with one dev worker and then silently fragments in production: request A hits worker 1's copy, request B hits worker 2's copy." },
        { type: "code", lang: "py", code: "# BROKEN across workers: each process has its own _cache / _hits\n_cache = {}\n_hits = 0\n\n@app.get(\"/count\")\ndef count():\n    global _hits\n    _hits += 1              # only counts THIS worker's requests\n    return {\"hits\": _hits}\n\n# FIX: keep shared state in an external store every worker can reach\nimport redis\nr = redis.Redis.from_url(app.config[\"REDIS_URL\"])\n\n@app.get(\"/count2\")\ndef count2():\n    return {\"hits\": r.incr(\"hits\")}   # atomic, shared by all workers" },
        { type: "callout", variant: "gotcha", text: "Any cross-request shared state — caches, counters, rate limits, session stores, background schedulers — must live in **Redis, a database, or a dedicated service**, not a Python global. (Flask-Limiter, Flask-Caching, Flask-Session all take a Redis/DB backend for exactly this reason.)" },

        { type: "heading", text: "4. `DetachedInstanceError`: using a model after its session closed" },
        { type: "p", text: "Flask-SQLAlchemy scopes `db.session` to the request and **removes it on teardown** (the Contexts/ORM sections touched on this). A model instance loaded in one request/context is *bound* to that session; touch a lazy-loaded attribute after teardown and SQLAlchemy raises **`DetachedInstanceError`** because it can no longer emit the query. Common triggers: stashing a model in a module global, passing an instance into a background thread, or accessing a relationship in a template after `session.remove()`." },
        { type: "code", lang: "py", code: "# TRAP: hand a live ORM object to a thread; its session is torn down\n#       by the time the thread reads user.orders -> DetachedInstanceError\n\n# FIX 1: pass the primary key, re-fetch inside the new context\ndef worker(app, user_id):\n    with app.app_context():\n        user = db.session.get(User, user_id)   # fresh, session-bound\n        _process(user.orders)\n\n# FIX 2: force-load what you need before the session goes away\nfrom sqlalchemy.orm import selectinload\nuser = db.session.scalar(\n    select(User).options(selectinload(User.orders)).filter_by(id=1)\n)\n# user.orders is now eagerly populated and safe to read later\n\n# FIX 3: read attributes into plain data while the session is open\ndata = user.to_dict()   # a dict survives; the ORM instance may not" },
        { type: "callout", variant: "note", text: "Rule of thumb: **don't let ORM instances outlive their request/context.** Pass IDs across boundaries and re-query, eager-load relationships you'll need later, or serialize to a plain `dict` before the session is removed." },

        { type: "heading", text: "5. Circular imports with the factory, extensions & blueprints" },
        { type: "p", text: "The app-factory + `init_app` pattern (App-factory section) exists precisely to **break import cycles**, but you can still create one. The usual mistake: importing `app` at the top of a models/routes module, or constructing an extension against a specific app. The cure is discipline — extensions are created *bare* in one module, models import only that extension, and blueprints are imported **inside** `create_app` (deferred), not at module top." },
        { type: "code", lang: "py", code: "# extensions.py -- create BARE, no app anywhere\nfrom flask_sqlalchemy import SQLAlchemy\ndb = SQLAlchemy()\n\n# models.py -- import the extension, never `from app import app`\nfrom .extensions import db\nclass User(db.Model): ...\n\n# __init__.py (the factory)\ndef create_app():\n    app = Flask(__name__)\n    from .extensions import db\n    db.init_app(app)                     # bind here, not at import time\n\n    # import blueprints INSIDE the factory to defer their imports\n    from .users.routes import bp as users_bp\n    from .api.routes import bp as api_bp\n    app.register_blueprint(users_bp, url_prefix=\"/users\")\n    app.register_blueprint(api_bp,  url_prefix=\"/api\")   # order matters if\n    return app                                            # prefixes overlap" },
        { type: "callout", variant: "gotcha", text: "If you hit `ImportError: cannot import name ... (most likely due to a circular import)`, the fix is almost always: (a) create the extension bare in `extensions.py`, (b) import models from the extension — never from the app package's `__init__`, and (c) move blueprint imports **inside** `create_app`. Registration order only matters when two blueprints claim overlapping URL rules or you rely on the first-registered error handler." },

        { type: "heading", text: "6. `debug=True` and a missing `SECRET_KEY` in production" },
        { type: "p", text: "The Setup section flagged that the debugger runs arbitrary code; it bears repeating as a **security** headache because it's a real, exploited RCE. With debug on, Werkzeug's interactive traceback exposes a console guarded only by a PIN — reachable by anyone who can trigger an exception on a public server. Separately, if `SECRET_KEY` is unset or hard-coded, session cookies and CSRF tokens can be forged." },
        { type: "code", lang: "py", code: "# NEVER in production: hard-coded debug / secret\n# app.run(debug=True)\n# app.secret_key = \"dev\"\n\nimport os\n\n# Load the secret from the environment; fail loudly if absent\napp.config[\"SECRET_KEY\"] = os.environ[\"SECRET_KEY\"]   # KeyError if missing = good\n\n# Debug should be driven by env, defaulting OFF\napp.config[\"DEBUG\"] = os.environ.get(\"FLASK_DEBUG\") == \"1\"" },
        { type: "code", lang: "bash", code: "# generate a strong secret once, keep it in the environment / a secret store\npython -c \"import secrets; print(secrets.token_hex(32))\"\nexport SECRET_KEY=\"...the generated value...\"\n\n# production start -- no --debug flag anywhere\ngunicorn -w 4 -b 0.0.0.0:8000 wsgi:app" },
        { type: "callout", variant: "warn", text: "Treat `debug=True` / `flask run --debug` as **local-only**. In production run under gunicorn with `DEBUG` off and `SECRET_KEY` sourced from the environment (or a secrets manager). A leaked or default secret key lets attackers forge signed sessions and CSRF tokens." },

        { type: "heading", text: "7. Config sprawl across environments" },
        { type: "p", text: "As dev/staging/prod diverge, scattered `app.config[...]` assignments become impossible to reason about. Centralize config into **classes** (a base plus per-environment subclasses) and load the right one via `from_object`, then layer environment overrides with `from_prefixed_env`. Keep secrets in the environment, defaults in code." },
        { type: "code", lang: "py", code: "# config.py -- one place, per-environment classes\nimport os\n\nclass BaseConfig:\n    SECRET_KEY = os.environ.get(\"SECRET_KEY\", \"dev-only-change-me\")\n    SQLALCHEMY_DATABASE_URI = os.environ.get(\"DATABASE_URL\", \"sqlite:///app.db\")\n    SQLALCHEMY_TRACK_MODIFICATIONS = False\n\nclass DevConfig(BaseConfig):\n    DEBUG = True\n\nclass ProdConfig(BaseConfig):\n    DEBUG = False\n    SECRET_KEY = os.environ[\"SECRET_KEY\"]        # required in prod\n\nCONFIGS = {\"dev\": DevConfig, \"prod\": ProdConfig}" },
        { type: "code", lang: "py", code: "# factory: pick the class from an env var, then let FLASK_* override\ndef create_app():\n    app = Flask(__name__)\n    env = os.environ.get(\"APP_ENV\", \"dev\")\n    app.config.from_object(CONFIGS[env])          # base per-environment values\n    app.config.from_prefixed_env()                # FLASK_* env vars win last\n    # app.config.from_pyfile(\"instance/local.cfg\", silent=True)  # optional\n    return app" },
        { type: "callout", variant: "tip", text: "Precedence, low → high: **class defaults** (`from_object`) → **env overrides** (`from_prefixed_env`, e.g. `FLASK_SQLALCHEMY_DATABASE_URI=...`) → optional untracked **instance file**. Pick the environment with a single var (`APP_ENV`) so one image runs everywhere with no code changes." }
      ]
    }
  ],

  packages: [
    { name: "Flask", why: "the framework (bundles Werkzeug + Jinja2 + Click)" },
    { name: "Werkzeug", why: "WSGI toolkit: routing, request/response, dev server (bundled)" },
    { name: "Jinja2", why: "template engine for server-rendered HTML (bundled)" },
    { name: "Flask-SQLAlchemy", why: "SQLAlchemy integration: engine + scoped session" },
    { name: "Flask-Migrate", why: "Alembic migrations via `flask db` commands" },
    { name: "Flask-Login", why: "session-based user auth (@login_required, current_user)" },
    { name: "Flask-WTF", why: "WTForms + automatic CSRF protection" },
    { name: "Flask-JWT-Extended", why: "stateless JWT auth for JSON APIs" },
    { name: "Flask-Cors", why: "CORS headers for browser clients" },
    { name: "Flask-Smorest / marshmallow", why: "schemas, validation & OpenAPI docs" },
    { name: "gunicorn / waitress", why: "production WSGI servers" },
    { name: "Celery / RQ", why: "background/async task queues" }
  ],

  gotchas: [
    "**\"Working outside of application/request context\"** — you used `request`/`current_app`/`db` outside a request. Wrap it in `with app.app_context():` (or `test_request_context()`).",
    "The dev server (`flask run` / `app.run()`) is **not for production** — deploy behind gunicorn/waitress/uWSGI.",
    "`debug=True` exposes an interactive debugger that runs arbitrary code — never enable it in production.",
    "View function names must be **unique** (globally, or per blueprint) — `url_for` keys off them. Use `url_for(\"blueprint.view\")` inside blueprints.",
    "`session` is a **signed cookie** — tamper-proof but client-readable; set a strong `SECRET_KEY` and keep secrets out of it.",
    "Flask is **synchronous WSGI**; `async def` views don't give FastAPI-style concurrency. Use Quart (ASGI) or a task queue for real async/long jobs.",
    "Always `db.session.commit()` (or `rollback()`); the session is discarded at request teardown and uncommitted changes are lost.",
    "Construct extensions at module level and bind with `.init_app(app)` in the factory — creating them against a specific app causes circular imports.",
    "A 400 on a form POST usually means a missing/invalid **CSRF token** — render `{{ form.csrf_token }}`.",
    "Jinja autoescapes by default; only use `| safe` on HTML you fully trust, or you reintroduce XSS.",
    "**Module globals are per-worker** — in-memory caches, counters and rate limits fragment across gunicorn processes. Keep shared state in Redis/DB.",
    "**`DetachedInstanceError`** means you used an ORM instance after its request/session was torn down. Pass the primary key and re-query, eager-load, or serialize to a dict first.",
    "Push a context (`with app.app_context():`) for `db`/`current_app` in **scripts, Celery tasks and background threads** — and push it *inside* the thread, since contexts are thread-local."
  ],

  flashcards: [
    { q: "What two libraries does Flask build on, and what does each do?", a: "**Werkzeug** (WSGI toolkit — routing, request/response, dev server) and **Jinja2** (templating). \"Flask = Werkzeug + Jinja2 + glue.\"" },
    { q: "What does \"micro-framework\" mean for Flask?", a: "The core is small and unopinionated — **no built-in ORM, forms, or auth**. You add exactly the pieces you need via extensions." },
    { q: "How do you avoid hard-coding URLs, and what key does it use?", a: "`url_for(\"view_function_name\", **params)` — it's keyed by the **function name** (namespaced as `blueprint.view` inside blueprints), and also builds static and query URLs." },
    { q: "What causes \"Working outside of application/request context\"?", a: "Touching `request`/`current_app`/`session`/`g` outside an active request (import time, a script, a background thread). Fix with `with app.app_context():`." },
    { q: "What's the difference between `g` and `session`?", a: "`g` is a **per-request** scratchpad (gone after the response — cache the DB conn there). `session` is a **signed cookie** that persists per-browser across requests." },
    { q: "What is the application factory pattern and why use it?", a: "A `create_app()` function that builds/configures the app. It eases testing, multiple configs, and — with module-level extensions bound via `.init_app(app)` — avoids circular imports." },
    { q: "What is a blueprint?", a: "A modular group of routes (and templates/static) registered onto the app with `app.register_blueprint(bp, url_prefix=...)`; its endpoints are namespaced (`url_for(\"bp.view\")`)." },
    { q: "How does Flask return JSON?", a: "Return a `dict`/`list` (auto-serialized since 2.1) or call `jsonify(...)` when you need explicit status/headers. A `(body, status)` tuple sets the status code." },
    { q: "Is Flask async? ", a: "No — it's **synchronous WSGI**. It accepts `async def` views (2.0+) run on a per-view event loop, but for real concurrency use Quart (ASGI) or a task queue like Celery." },
    { q: "How do you protect an HTML form and validate it?", a: "**Flask-WTF**: a `FlaskForm` subclass with WTForms validators; `form.validate_on_submit()` checks POST + validity + **CSRF**, and you render `{{ form.csrf_token }}`." },
    { q: "Why does an in-memory counter or cache give wrong results in production?", a: "Production runs **multiple gunicorn workers, each its own process** with its own module globals — state fragments per-worker. Put shared state in **Redis/DB** (e.g. `r.incr(\"hits\")`), not a Python global." },
    { q: "What is `DetachedInstanceError` and how do you avoid it?", a: "You accessed an ORM instance after its `db.session` was removed at request teardown (e.g. in a thread or template after `session.remove()`). Fix: **pass the primary key and re-query** in a fresh context, **eager-load** relationships up front, or **serialize to a dict** while the session is open." }
  ],

  cheatsheet: [
    { label: "Dev server", code: "flask --app app run --debug" },
    { label: "Minimal app", code: "app = Flask(__name__); @app.route(\"/\")" },
    { label: "Dynamic route", code: "@app.get(\"/u/<int:id>\")" },
    { label: "Build URL", code: "url_for(\"users.detail\", user_id=1)" },
    { label: "JSON out", code: "return {\"ok\": True}, 201" },
    { label: "Render template", code: "return render_template(\"home.html\", **ctx)" },
    { label: "Blueprint", code: "bp = Blueprint(\"users\", __name__)" },
    { label: "Migrate", code: "flask db migrate -m 'msg' && flask db upgrade" },
    { label: "Protect route", code: "@login_required" },
    { label: "Prod server", code: "gunicorn -w 4 wsgi:app" },
    { label: "Context for scripts", code: "with app.app_context(): db.session.commit()" },
    { label: "Shell w/ context", code: "flask shell" }
  ]
});
