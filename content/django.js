(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "django",
  name: "Django",
  language: "Python",
  tagline: "The **batteries-included** Python framework: a powerful built-in ORM, auto admin, migrations, and (via **DRF**) a first-class REST toolkit.",
  color: "#0c4b33",
  readMinutes: 21,
  group: "Python",

  sections: [
    {
      id: "overview",
      title: "Overview & the MVT pattern",
      level: "core",
      body: [
        { type: "p", text: "Django gives you almost everything up front: ORM, migrations, auth, an auto-generated admin, forms, templating, and security defaults. It follows **MVT** — Model, View, Template (Django's take on MVC)." },
        { type: "list", items: [
          "**Model** = data (the ORM); **View** = request handler (logic); **Template** = HTML rendering.",
          "A **project** contains multiple **apps** (reusable feature modules).",
          "For JSON APIs you add **Django REST Framework (DRF)** — the de-facto standard.",
          "**Reach for it when:** you want maximum built-in functionality, an admin, and a mature ecosystem."
        ] },
        { type: "callout", variant: "note", text: "Targets Django 5.x + DRF. For pure APIs, most teams use Django + DRF (covered below)." }
      ]
    },
    {
      id: "setup",
      title: "Project & app setup",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "python -m venv .venv && source .venv/bin/activate\npip install django\n\ndjango-admin startproject config .   # project 'config' in current dir\npython manage.py startapp blog       # create an app\npython manage.py runserver           # dev server :8000" },
        { type: "p", text: "Register the app and key settings in `config/settings.py`:" },
        { type: "code", lang: "py", code: "INSTALLED_APPS = [\n    'django.contrib.admin',\n    'django.contrib.auth',\n    # ...\n    'blog',                 # <- your app\n    'rest_framework',       # <- DRF (after pip install)\n]" },
        { type: "callout", variant: "tip", text: "`manage.py` is your command hub: `runserver`, `makemigrations`, `migrate`, `createsuperuser`, `shell`, `test`, `startapp`." }
      ]
    },
    {
      id: "models",
      title: "The ORM: models & relations",
      level: "core",
      body: [
        { type: "p", text: "Models are Python classes; each attribute is a DB column. Django's ORM is one of its biggest strengths." },
        { type: "code", lang: "py", code: "# blog/models.py\nfrom django.db import models\n\nclass Author(models.Model):\n    name = models.CharField(max_length=100)\n    email = models.EmailField(unique=True)\n\nclass Post(models.Model):\n    title = models.CharField(max_length=200)\n    body = models.TextField()\n    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='posts')\n    tags = models.ManyToManyField('Tag', blank=True)\n    published = models.BooleanField(default=False)\n    created_at = models.DateTimeField(auto_now_add=True)\n\n    class Meta:\n        ordering = ['-created_at']\n\n    def __str__(self):\n        return self.title" },
        { type: "callout", variant: "gotcha", text: "`null=True` affects the **database** (column allows NULL); `blank=True` affects **validation/forms** (field may be empty). They're independent — for text fields you often want `blank=True` without `null=True`." }
      ]
    },
    {
      id: "migrations",
      title: "Migrations",
      level: "core",
      body: [
        { type: "code", lang: "bash", code: "python manage.py makemigrations   # generate migration files from model changes\npython manage.py migrate          # apply them to the DB\npython manage.py showmigrations   # see status\npython manage.py sqlmigrate blog 0001   # preview SQL" },
        { type: "callout", variant: "tip", text: "Commit migration files to git. They're the versioned history of your schema — never edit an applied migration; make a new one." }
      ]
    },
    {
      id: "queryset",
      title: "QuerySets — querying the ORM",
      level: "core",
      body: [
        { type: "code", lang: "py", code: "Post.objects.all()\nPost.objects.filter(published=True).exclude(title='')\nPost.objects.get(id=1)                     # raises DoesNotExist / MultipleObjectsReturned\nPost.objects.filter(author__name='Ada')    # traverse relations with __\nPost.objects.filter(title__icontains='django').order_by('-created_at')[:10]\nPost.objects.create(title='Hi', body='...', author=a)\nPost.objects.count()\n\n# aggregation\nfrom django.db.models import Count\nAuthor.objects.annotate(n=Count('posts')).filter(n__gt=5)" },
        { type: "p", text: "QuerySets are **lazy** — no query runs until you iterate, slice, or evaluate them." },
        { type: "code", lang: "py", code: "from django.db.models import Prefetch\n\n# pre-load related rows to fix N+1 (see the 'headaches' section for the full story):\nPost.objects.select_related('author')          # FK/one-to-one -> single SQL JOIN\nPost.objects.prefetch_related('tags')          # M2M/reverse FK -> one extra query, joined in Python\nPost.objects.select_related('author').prefetch_related('tags')   # combine both\n\n# trim the payload of each row:\nPost.objects.only('title', 'author')           # SELECT just these columns (defer the rest)\n\n# filter what gets prefetched, not just which parents match:\nPost.objects.prefetch_related(\n    Prefetch('tags', queryset=Tag.objects.filter(active=True))\n)" },
        { type: "callout", variant: "warn", text: "**N+1 queries** are Django's most common performance bug: looping over posts and accessing `post.author` fires one query per post. Use `select_related` (FK) / `prefetch_related` (M2M) to batch them." },
        { type: "heading", text: "Q() and F() objects" },
        { type: "code", lang: "py", code: "from django.db.models import Q, F\n\n# Q(): OR / complex boolean logic\nPost.objects.filter(Q(published=True) | Q(author__name='Ada'))\n\n# F(): reference a column server-side -> atomic, race-free update\nPost.objects.filter(id=1).update(views=F('views') + 1)" },
        { type: "callout", variant: "tip", text: "Wrap multi-step writes in `with transaction.atomic():` (or the `@transaction.atomic` decorator) so they commit or roll back together. Setting `ATOMIC_REQUESTS=True` wraps every request in a transaction." }
      ]
    },
    {
      id: "admin",
      title: "The Django admin (signature feature)",
      level: "core",
      body: [
        { type: "p", text: "Register a model and get a full CRUD admin UI for free — a huge productivity win for internal tools." },
        { type: "code", lang: "py", code: "# blog/admin.py\nfrom django.contrib import admin\nfrom .models import Post, Author\n\n@admin.register(Post)\nclass PostAdmin(admin.ModelAdmin):\n    list_display = ('title', 'author', 'published', 'created_at')\n    list_filter = ('published', 'created_at')\n    search_fields = ('title', 'body')\n    autocomplete_fields = ('author',)\n\nadmin.site.register(Author)" },
        { type: "code", lang: "bash", code: "python manage.py createsuperuser   # then log in at /admin" }
      ]
    },
    {
      id: "urls-views",
      title: "URLs & views (server-rendered)",
      level: "core",
      body: [
        { type: "p", text: "URLs map to views. Views can be functions or classes. (For APIs, you'll mostly use DRF views — next section.)" },
        { type: "code", lang: "py", code: "# blog/views.py\nfrom django.shortcuts import render, get_object_or_404\nfrom .models import Post\n\ndef post_detail(request, pk):\n    post = get_object_or_404(Post, pk=pk)\n    return render(request, 'blog/detail.html', {'post': post})" },
        { type: "code", lang: "py", code: "# config/urls.py\nfrom django.urls import path, include\nfrom django.contrib import admin\n\nurlpatterns = [\n    path('admin/', admin.site.urls),\n    path('blog/', include('blog.urls')),\n]\n\n# blog/urls.py\nurlpatterns = [\n    path('<int:pk>/', post_detail, name='post-detail'),\n]" }
      ]
    },
    {
      id: "drf",
      title: "Django REST Framework — building APIs",
      level: "core",
      body: [
        { type: "p", text: "DRF is how you build JSON APIs in Django. The core pieces: **Serializers** (validate + convert models ↔ JSON), **ViewSets/Views**, and **Routers**." },
        { type: "code", lang: "bash", code: "pip install djangorestframework" },
        { type: "code", lang: "py", code: "# serializers.py\nfrom rest_framework import serializers\nfrom .models import Post\n\nclass PostSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = Post\n        fields = ['id', 'title', 'body', 'author', 'published']\n        read_only_fields = ['id']" },
        { type: "code", lang: "py", code: "# views.py — a ViewSet gives full CRUD\nfrom rest_framework import viewsets, permissions\nfrom .models import Post\nfrom .serializers import PostSerializer\n\nclass PostViewSet(viewsets.ModelViewSet):\n    queryset = Post.objects.select_related('author').all()\n    serializer_class = PostSerializer\n    permission_classes = [permissions.IsAuthenticatedOrReadOnly]" },
        { type: "code", lang: "py", code: "# urls.py — routers auto-generate REST URLs\nfrom rest_framework.routers import DefaultRouter\nfrom .views import PostViewSet\n\nrouter = DefaultRouter()\nrouter.register('posts', PostViewSet)\nurlpatterns = router.urls   # GET/POST /posts/, GET/PUT/DELETE /posts/{id}/" },
        { type: "callout", variant: "tip", text: "`ModelViewSet` + `ModelSerializer` + `DefaultRouter` gives a complete CRUD API in ~15 lines. Drop down to `APIView`/`GenericAPIView` when you need custom behavior." }
      ]
    },
    {
      id: "drf-auth",
      title: "DRF auth, permissions & pagination",
      level: "core",
      body: [
        { type: "p", text: "JWT is common via **SimpleJWT**. Permissions and pagination are configured per-view or globally." },
        { type: "code", lang: "bash", code: "pip install djangorestframework-simplejwt" },
        { type: "code", lang: "py", code: "# settings.py\nREST_FRAMEWORK = {\n    'DEFAULT_AUTHENTICATION_CLASSES': [\n        'rest_framework_simplejwt.authentication.JWTAuthentication',\n    ],\n    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',\n    'PAGE_SIZE': 20,\n}\n\n# urls.py — token endpoints\nfrom rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView\nurlpatterns += [\n    path('api/token/', TokenObtainPairView.as_view()),\n    path('api/token/refresh/', TokenRefreshView.as_view()),\n]" },
        { type: "list", items: [
          "**Permissions:** `IsAuthenticated`, `IsAdminUser`, `IsAuthenticatedOrReadOnly`, or custom `BasePermission`.",
          "**Throttling:** `DEFAULT_THROTTLE_RATES` for rate limiting.",
          "**Filtering:** `django-filter` integration for query-param filtering."
        ] }
      ]
    },
    {
      id: "auth",
      title: "Built-in auth & users",
      level: "core",
      body: [
        { type: "p", text: "Django ships a full auth system: `User` model, sessions, password hashing, permissions, and login views." },
        { type: "code", lang: "py", code: "from django.contrib.auth import authenticate, login\nfrom django.contrib.auth.decorators import login_required\n\n@login_required\ndef dashboard(request):\n    return render(request, 'dashboard.html')\n\n# access the user anywhere\nrequest.user            # the logged-in user (or AnonymousUser)" },
        { type: "callout", variant: "tip", text: "Create a **custom user model** (`AUTH_USER_MODEL`) at the **start** of a project if you might need extra user fields — swapping it later is painful." }
      ]
    },
    {
      id: "config",
      title: "Settings & environment",
      level: "core",
      body: [
        { type: "p", text: "Keep secrets out of `settings.py`. `django-environ` reads them from `.env`." },
        { type: "code", lang: "py", code: "# pip install django-environ\nimport environ\nenv = environ.Env(DEBUG=(bool, False))\nenviron.Env.read_env()\n\nSECRET_KEY = env('SECRET_KEY')\nDEBUG = env('DEBUG')\nALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])\nDATABASES = {'default': env.db()}   # reads DATABASE_URL" },
        { type: "callout", variant: "warn", text: "For production: `DEBUG = False`, set `ALLOWED_HOSTS`, run `collectstatic`, and never commit `SECRET_KEY`. `DEBUG=True` leaks stack traces and settings." }
      ]
    },
    {
      id: "signals",
      title: "Signals & management commands",
      level: "deep",
      body: [
        { type: "p", text: "**Signals** decouple side effects (e.g. create a profile when a user is created). **Management commands** add custom `manage.py` subcommands." },
        { type: "code", lang: "py", code: "from django.db.models.signals import post_save\nfrom django.dispatch import receiver\n\n@receiver(post_save, sender=User)\ndef create_profile(sender, instance, created, **kwargs):\n    if created:\n        Profile.objects.create(user=instance)" },
        { type: "callout", variant: "gotcha", text: "Signals can make control flow hard to trace. For app-level logic, an explicit service function is often clearer than a signal." }
      ]
    },
    {
      id: "testing",
      title: "Testing & async",
      level: "deep",
      body: [
        { type: "code", lang: "py", code: "from django.test import TestCase\nfrom rest_framework.test import APIClient\n\nclass PostAPITest(TestCase):\n    def setUp(self):\n        self.client = APIClient()\n    def test_list(self):\n        res = self.client.get('/posts/')\n        self.assertEqual(res.status_code, 200)" },
        { type: "list", items: [
          "`python manage.py test` runs the suite; many teams prefer `pytest-django`.",
          "Django supports **async views** (`async def`) and an ASGI server (uvicorn/daphne), though the ORM is still largely sync (use `sync_to_async` / async query methods where available).",
          "**Celery** is the standard for background jobs."
        ] }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "Django is smooth until it isn't. These are the recurring pain points teams hit in real projects — and the concrete fix for each." },

        { type: "heading", text: "1. The N+1 query problem" },
        { type: "p", text: "The single most common Django performance bug: a loop touches a related object, and each iteration silently fires another query." },
        { type: "code", lang: "py", code: "# BAD: N+1 -> 1 query for the posts, then +1 per post for .author\nfor post in Post.objects.all():              # query #1\n    print(post.author.name)                  # +1 query on EACH loop -> N+1\n\n# GOOD: select_related folds the author into the SAME query via a JOIN\nfor post in Post.objects.select_related('author'):   # 1 query, total\n    print(post.author.name)                  # no extra query\n\n# M2M / reverse FK can't JOIN cleanly -> prefetch_related runs ONE more query\nfor post in Post.objects.prefetch_related('tags'):   # 2 queries, total\n    print([t.name for t in post.tags.all()]) # served from the prefetch cache" },
        { type: "table", headers: ["Aspect", "select_related", "prefetch_related"], rows: [
          ["Relation kind", "FK / one-to-one (forward)", "M2M, reverse FK (and FK too)"],
          ["Mechanism", "SQL JOIN in the same query", "Separate query, joined in Python"],
          ["Extra queries", "0 (folded into the JOIN)", "1 per prefetched relation"],
          ["Use when", "You follow one related object", "You follow a set of related objects"]
        ] },
        { type: "callout", variant: "tip", text: "Fix: name every relation you'll touch in the loop up front — `select_related` for single (FK/one-to-one) objects, `prefetch_related` for collections. Install `django-debug-toolbar` (or log queries) to actually see the count drop." },

        { type: "heading", text: "2. QuerySets are lazy — and re-evaluate" },
        { type: "p", text: "A QuerySet does nothing until you evaluate it; once evaluated it caches its rows on that instance. Build a **fresh** queryset and the SQL runs all over again." },
        { type: "code", lang: "py", code: "qs = Post.objects.filter(published=True)   # NOTHING hits the DB yet\nlist(qs)          # NOW it runs, and CACHES the rows on qs\nlist(qs)          # served from the cache -> no second query\n\n# a NEW queryset re-runs the SQL every single time:\nPost.objects.filter(published=True).count()   # query\nPost.objects.filter(published=True).count()   # query AGAIN (re-evaluated)\n\n# ask the DB the cheap question instead of loading everything:\nif qs.exists():        # SELECT 1 ... LIMIT 1   (not all rows)\n    n = qs.count()     # SELECT COUNT(*)         (not len(list(qs)))" },
        { type: "callout", variant: "gotcha", text: "Fix: evaluate a queryset once and reuse the variable. Use `.exists()` instead of `if qs:` and `.count()` instead of `len(qs)` when you don't need the objects — both push the work to the DB instead of loading every row into Python." },

        { type: "heading", text: "3. Migrations pitfalls" },
        { type: "list", items: [
          "`makemigrations` **writes** migration files from your model diffs; `migrate` **applies** them to the DB. They are two separate steps — forgetting the second leaves the schema stale.",
          "Two branches that each add a migration collide on merge — reconcile with `makemigrations --merge`.",
          "Adding a **NOT NULL** column to a table that already has rows fails unless you give `migrate` a value to backfill with (a field `default`, or a data migration).",
          "`migrate --fake` marks a migration applied **without running its SQL** — a foot-gun for legacy/aligned DBs; wrong use causes drift."
        ] },
        { type: "code", lang: "py", code: "# Adding a required column to a populated table? Give migrate something to backfill:\nclass Post(models.Model):\n    view_count = models.IntegerField(default=0)   # default backfills existing rows\n    slug = models.SlugField(null=True)            # or allow NULL, then a data migration" },
        { type: "code", lang: "bash", code: "python manage.py makemigrations           # generate files (does NOT touch the DB)\npython manage.py migrate                  # apply them to the DB\npython manage.py makemigrations --merge   # reconcile migrations from two branches\npython manage.py migrate --fake blog 0005 # record as applied WITHOUT running SQL (careful)" },
        { type: "callout", variant: "warn", text: "Fix: always run `makemigrations` then `migrate`, commit the generated files, and never edit an applied migration — write a new one. Give new required columns a `default` (or a data migration) so existing rows survive the upgrade." },

        { type: "heading", text: "4. Async views with a sync ORM" },
        { type: "p", text: "Django supports `async def` views, but the ORM is still fundamentally **synchronous**. Calling it directly inside async code raises `SynchronousOnlyOperation`." },
        { type: "code", lang: "py", code: "from asgiref.sync import sync_to_async\nfrom django.http import JsonResponse\n\nasync def latest(request):\n    # count = Post.objects.count()          # <- raises SynchronousOnlyOperation\n    count = await sync_to_async(Post.objects.count)()   # wrap the sync call\n\n    # Django 4.1+ also ships async-native ORM methods:\n    post = await Post.objects.aget(pk=1)    # aget / afirst / acount / acreate / ...\n    async for p in Post.objects.all():      # async iteration\n        ...\n    return JsonResponse({'count': count})" },
        { type: "callout", variant: "gotcha", text: "Fix: wrap sync ORM calls in `sync_to_async(...)()`, or use the `a`-prefixed async methods (`aget`, `acount`, `acreate`) and `async for`. Don't reach for async views just for DB work — under a sync ORM they rarely help; async pays off for external I/O (HTTP calls, websockets)." },

        { type: "heading", text: "5. Timezones (USE_TZ)" },
        { type: "p", text: "With `USE_TZ=True` (the modern default), Django stores datetimes in UTC and expects **timezone-aware** values. Mixing in naive datetimes causes warnings and subtle comparison bugs." },
        { type: "code", lang: "py", code: "# settings.py\nUSE_TZ = True          # store in UTC, work with AWARE datetimes\nTIME_ZONE = 'UTC'\n\nfrom django.utils import timezone\nnow = timezone.now()           # aware (UTC) -> use THIS\n# import datetime; datetime.datetime.now()   # naive -> RuntimeWarning when saved" },
        { type: "callout", variant: "warn", text: "Fix: use `django.utils.timezone.now()` (never `datetime.now()`), keep everything aware/UTC in the DB, and convert to the user's zone only at display time with `timezone.localtime()`." },

        { type: "heading", text: "6. Settings & deployment (DEBUG=False)" },
        { type: "p", text: "The dev experience hides production requirements. Flipping `DEBUG=False` changes several behaviors at once." },
        { type: "code", lang: "py", code: "# production settings\nDEBUG = False\nALLOWED_HOSTS = env.list('ALLOWED_HOSTS')   # REQUIRED with DEBUG=False, else every request 400s\nSECRET_KEY = env('SECRET_KEY')              # from the environment, never hard-coded/committed\n\n# Django does NOT serve static files when DEBUG=False.\n# collectstatic gathers them; WhiteNoise (or nginx) serves them:\n#   python manage.py collectstatic\nMIDDLEWARE = [\n    'django.middleware.security.SecurityMiddleware',\n    'whitenoise.middleware.WhiteNoiseMiddleware',   # serve /static/ in prod\n    # ... the rest\n]\nSTATIC_ROOT = BASE_DIR / 'staticfiles'" },
        { type: "callout", variant: "warn", text: "Fix: with `DEBUG=False`, set `ALLOWED_HOSTS`, load `SECRET_KEY` from the environment, run `collectstatic`, and serve static assets via WhiteNoise or nginx — Django won't. Run `python manage.py check --deploy` to catch missing security settings." },

        { type: "heading", text: "7. Signals: convenient but hard to trace" },
        { type: "p", text: "Signals decouple side effects, but they also make control flow invisible — nothing at the call site tells you the extra work happens." },
        { type: "code", lang: "py", code: "# Implicit (signal): runs on EVERY User save, easy to forget it exists\n@receiver(post_save, sender=User)\ndef make_profile(sender, instance, created, **kwargs):\n    if created:\n        Profile.objects.create(user=instance)\n\n# Explicit (service): traceable, testable, obviously called on purpose\ndef register_user(**data):\n    user = User.objects.create_user(**data)\n    Profile.objects.create(user=user)   # you can SEE it happen here\n    return user" },
        { type: "callout", variant: "tip", text: "Fix: prefer an explicit service function (or a `save()` override) for core business flows you own, so the logic is greppable and testable. Reserve signals for genuinely cross-cutting or decoupled concerns (e.g. reacting to a model you don't control)." }
      ]
    }
  ],

  packages: [
    { name: "djangorestframework", why: "REST APIs (serializers, viewsets)" },
    { name: "djangorestframework-simplejwt", why: "JWT auth for DRF" },
    { name: "django-environ", why: "12-factor env config" },
    { name: "django-filter", why: "query-param filtering in DRF" },
    { name: "celery + redis", why: "background jobs / task queue" },
    { name: "django-cors-headers", why: "CORS for SPA/mobile clients" },
    { name: "psycopg[binary]", why: "PostgreSQL driver" },
    { name: "gunicorn", why: "WSGI production server" },
    { name: "drf-spectacular", why: "OpenAPI schema/docs for DRF" }
  ],

  gotchas: [
    "**N+1 queries** from accessing related objects in a loop — use `select_related` (FK) / `prefetch_related` (M2M).",
    "`null=True` (DB column) vs `blank=True` (form validation) are different — don't set `null=True` on text fields casually.",
    "QuerySets are lazy; the query fires on evaluation — be aware of when DB hits happen inside templates/loops.",
    "Set a **custom user model** at project start; changing `AUTH_USER_MODEL` later is very painful.",
    "`DEBUG=True` in production leaks sensitive info; also set `ALLOWED_HOSTS` or requests are rejected.",
    "`.get()` raises `DoesNotExist`/`MultipleObjectsReturned` — use `get_object_or_404` or handle the exception.",
    "Migrations must be committed and applied in order; editing an applied migration causes drift.",
    "Re-using an evaluated QuerySet serves cached rows, but a **fresh** queryset (or `.count()`/`.filter()` again) re-runs the SQL — evaluate once and reuse the variable.",
    "In `async def` views the ORM is still sync: a plain query raises `SynchronousOnlyOperation` — wrap it in `sync_to_async(...)()` or use the `a`-prefixed methods (`aget`, `acount`).",
    "With `DEBUG=False` Django stops serving static files — run `collectstatic` and serve via WhiteNoise/nginx, or your CSS/JS 404s (and set `ALLOWED_HOSTS`)."
  ],

  flashcards: [
    { q: "What does MVT stand for in Django?", a: "**Model** (ORM/data), **View** (request logic), **Template** (HTML). Django's version of MVC." },
    { q: "Difference between `null=True` and `blank=True`?", a: "`null=True` lets the **DB column** be NULL; `blank=True` lets **forms/validation** accept an empty value. Independent settings." },
    { q: "How do you fix N+1 queries?", a: "`select_related('fk')` for FK/one-to-one (JOIN) and `prefetch_related('m2m')` for many-to-many/reverse FK." },
    { q: "Three core DRF pieces for a CRUD API?", a: "**Serializer** (ModelSerializer), **ViewSet** (ModelViewSet), and a **Router** (DefaultRouter) to generate URLs." },
    { q: "What gives you a free CRUD admin UI?", a: "Registering the model in `admin.py` (`@admin.register` / `admin.site.register`) + a superuser." },
    { q: "Why are QuerySets 'lazy'?", a: "They don't hit the DB until evaluated (iterated, sliced, `list()`), letting you chain filters without extra queries." },
    { q: "Two commands to change the schema?", a: "`makemigrations` (generate files from model changes) then `migrate` (apply to DB)." },
    { q: "When should you define a custom user model?", a: "At the **very start** of the project — swapping `AUTH_USER_MODEL` after migrations exist is very painful." },
    { q: "When does a QuerySet actually hit the database?", a: "On **evaluation** — iteration, `list()`, `len()`, slicing to a value, `bool()`, `.count()`, `.exists()`. Chaining `.filter()` stays lazy. Rows are cached on that instance, but a fresh queryset re-runs the SQL." },
    { q: "Why does an ORM call fail in an async view, and how do you fix it?", a: "The ORM is synchronous, so calling it in async context raises `SynchronousOnlyOperation`. Wrap it in `sync_to_async(...)()` or use async methods (`aget`/`acount`/`async for`)." }
  ],

  cheatsheet: [
    { label: "New project", code: "django-admin startproject config ." },
    { label: "New app", code: "python manage.py startapp blog" },
    { label: "Migrate", code: "manage.py makemigrations && migrate" },
    { label: "Superuser", code: "manage.py createsuperuser" },
    { label: "Query", code: "Post.objects.filter(author__name='Ada')" },
    { label: "Avoid N+1", code: "qs.select_related('author')" },
    { label: "DRF viewset", code: "class X(viewsets.ModelViewSet): …" },
    { label: "Shell", code: "python manage.py shell" },
    { label: "Merge migrations", code: "manage.py makemigrations --merge" },
    { label: "ORM in async", code: "await sync_to_async(qs.count)()" }
  ]
});
