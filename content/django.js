(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "django",
  name: "Django",
  language: "Python",
  tagline: "The **batteries-included** Python framework: a powerful built-in ORM, auto admin, migrations, and (via **DRF**) a first-class REST toolkit.",
  color: "#0c4b33",
  readMinutes: 18,
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
        { type: "code", lang: "py", code: "# fix N+1 queries:\nPost.objects.select_related('author')      # FK/one-to-one -> SQL JOIN\nPost.objects.prefetch_related('tags')      # M2M/reverse FK -> 2nd query" },
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
    "Migrations must be committed and applied in order; editing an applied migration causes drift."
  ],

  flashcards: [
    { q: "What does MVT stand for in Django?", a: "**Model** (ORM/data), **View** (request logic), **Template** (HTML). Django's version of MVC." },
    { q: "Difference between `null=True` and `blank=True`?", a: "`null=True` lets the **DB column** be NULL; `blank=True` lets **forms/validation** accept an empty value. Independent settings." },
    { q: "How do you fix N+1 queries?", a: "`select_related('fk')` for FK/one-to-one (JOIN) and `prefetch_related('m2m')` for many-to-many/reverse FK." },
    { q: "Three core DRF pieces for a CRUD API?", a: "**Serializer** (ModelSerializer), **ViewSet** (ModelViewSet), and a **Router** (DefaultRouter) to generate URLs." },
    { q: "What gives you a free CRUD admin UI?", a: "Registering the model in `admin.py` (`@admin.register` / `admin.site.register`) + a superuser." },
    { q: "Why are QuerySets 'lazy'?", a: "They don't hit the DB until evaluated (iterated, sliced, `list()`), letting you chain filters without extra queries." },
    { q: "Two commands to change the schema?", a: "`makemigrations` (generate files from model changes) then `migrate` (apply to DB)." },
    { q: "When should you define a custom user model?", a: "At the **very start** of the project — swapping `AUTH_USER_MODEL` after migrations exist is very painful." }
  ],

  cheatsheet: [
    { label: "New project", code: "django-admin startproject config ." },
    { label: "New app", code: "python manage.py startapp blog" },
    { label: "Migrate", code: "manage.py makemigrations && migrate" },
    { label: "Superuser", code: "manage.py createsuperuser" },
    { label: "Query", code: "Post.objects.filter(author__name='Ada')" },
    { label: "Avoid N+1", code: "qs.select_related('author')" },
    { label: "DRF viewset", code: "class X(viewsets.ModelViewSet): …" },
    { label: "Shell", code: "python manage.py shell" }
  ]
});
