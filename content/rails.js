(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "rails",
  name: "Ruby on Rails",
  language: "Ruby",
  group: "Others",
  navLabel: "Ruby on Rails",
  tagline: "The original **convention-over-configuration** full-stack framework — Active Record, Hotwire, and \"the majestic monolith\" that lets a small team ship a whole product.",
  color: "#cc0000",
  readMinutes: 28,

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "**Ruby on Rails** (usually just \"Rails\") is a full-stack, opinionated web framework written in Ruby. It popularised the idea of **convention over configuration**: if you name and place things the Rails way, the framework wires everything together for you with almost zero config. A model called `Article` maps to a table called `articles`, is found in `app/models/article.rb`, and its controller is `ArticlesController` — you write the interesting code and Rails infers the plumbing." },
        { type: "p", text: "Rails is built on a handful of core principles that shape every decision:" },
        { type: "list", items: [
          "**Convention over configuration** — sensible defaults everywhere; you only write config when you deviate from the norm.",
          "**DRY (Don't Repeat Yourself)** — one authoritative place for each piece of knowledge (the schema lives in migrations, associations declare relationships once).",
          "**MVC** — **M**odels (Active Record: data + business rules), **V**iews (ERB templates + Hotwire), **C**ontrollers (orchestrate the request/response).",
          "**The majestic monolith** — Rails is unapologetically monolithic. One app, one deploy, one codebase. DHH argues most teams never need microservices, and a well-organised monolith ships faster.",
          "**Batteries included** — ORM, router, mailer, background jobs, WebSockets, asset pipeline, testing, and now auth and deploy tooling all ship in the box."
        ] },
        { type: "heading", text: "Full-stack vs API mode" },
        { type: "p", text: "By default Rails is **full-stack**: it renders HTML server-side and ships **Hotwire** (Turbo + Stimulus) so you build reactive UIs with very little hand-written JavaScript. If you only need a JSON backend for a mobile app or an SPA/React front end, `rails new myapp --api` strips out the view layer, sessions/cookies middleware, and asset handling for a leaner API-only app (covered in its own section)." },
        { type: "heading", text: "When to reach for Rails" },
        { type: "list", items: [
          "**Fast product development** — solo founders and small teams shipping a whole SaaS from marketing page to billing to admin.",
          "**CRUD-heavy apps** — the RESTful `resources` + scaffolding flow makes create/read/update/destroy nearly free.",
          "**You value cohesion over choice** — one blessed way to do most things means less bikeshedding and onboarding.",
          "**Less ideal when** — you need extreme raw throughput per node, a hard real-time/streaming-first system, or your org has already committed to a polyglot microservice mesh."
        ] },
        { type: "callout", variant: "note", text: "Everything below targets modern **Rails 7.x / 8** — Hotwire is the default front end, **importmaps** ship JS with no Node build step, **Solid Queue/Cache/Cable** replace Redis for many apps, and **Kamal** is the default deploy tool." }
      ]
    },
    {
      id: "ruby-essentials",
      title: "Ruby you'll actually use",
      level: "core",
      body: [
        { type: "p", text: "You don't need to be a Ruby expert to be productive in Rails, but a handful of language features show up constantly. This is the tight version — enough to read and write idiomatic Rails." },
        { type: "heading", text: "Everything is an object" },
        { type: "p", text: "There are no primitives. `5`, `nil`, `true`, and a class itself are all objects that respond to methods. `5.times { ... }`, `\"hi\".upcase`, `nil.to_a` all work. Even operators like `+` are method calls (`1 + 2` is `1.+(2)`)." },
        { type: "heading", text: "Symbols vs strings" },
        { type: "p", text: "A **symbol** (`:name`) is an immutable, interned identifier — the same symbol is the same object in memory every time. Use symbols for keys, method names, and fixed labels; use strings for text/data. Rails APIs lean on symbols heavily (`params[:id]`, `validates :email`, `belongs_to :user`)." },
        { type: "code", lang: "ruby", code: "\"hello\".equal?(\"hello\")  # => false  (two different String objects)\n:hello.equal?(:hello)    # => true   (same Symbol object)\n\nuser = { name: \"Ada\", role: :admin }  # symbol keys are the norm in Rails" },
        { type: "heading", text: "Blocks, procs, lambdas & yield" },
        { type: "p", text: "A **block** is an anonymous chunk of code passed to a method. Convention: `do..end` for multi-line blocks, `{ }` for one-liners. A method runs the block it was given with `yield`. Blocks power almost every Rails iteration and DSL." },
        { type: "code", lang: "ruby", code: "# do..end (multi-line) vs { } (one-line)\n[1, 2, 3].each do |n|\n  puts n * 2\nend\n\n[1, 2, 3].map { |n| n * 2 }   # => [2, 4, 6]\n\n# A method that yields to its block\ndef with_logging\n  puts \"start\"\n  yield              # runs the caller's block\n  puts \"done\"\nend\nwith_logging { puts \"working...\" }\n\n# Procs and lambdas are blocks you can store in a variable\nsquare = ->(x) { x * x }   # lambda (strict arity, returns locally)\nsquare.call(4)             # => 16\nadder = proc { |a, b| a + b }" },
        { type: "callout", variant: "gotcha", text: "`{ }` binds more tightly than `do..end`. `foo bar { }` attaches the block to `bar`; `foo bar do..end` attaches it to `foo`. When precedence bites, add parentheses." },
        { type: "heading", text: "Modules & mixins" },
        { type: "p", text: "Ruby has single inheritance but **mixins** give you composition. A `module` is a bag of methods you mix into classes: `include` adds them as **instance** methods, `extend` adds them as **class** methods. Rails uses this everywhere — concerns, `ActiveModel`, helpers." },
        { type: "code", lang: "ruby", code: "module Greetable\n  def greet = \"Hi, I'm #{name}\"\nend\n\nmodule Countable\n  def total = count\nend\n\nclass Person\n  include Greetable          # instance method: person.greet\n  extend  Countable          # class method:    Person.total\n  attr_accessor :name        # generates name and name= reader/writer\n  def initialize(name) = @name = name\nend" },
        { type: "heading", text: "attr_accessor & instance variables" },
        { type: "p", text: "Instance variables start with `@`. `attr_accessor :name` generates both a `name` reader and a `name=` writer; `attr_reader` / `attr_writer` give you just one direction. Active Record generates these for every column automatically." },
        { type: "heading", text: "Truthiness & safe navigation" },
        { type: "p", text: "Only `nil` and `false` are falsy — `0`, `\"\"`, and `[]` are all **truthy**. The safe-navigation operator `&.` calls a method only if the receiver isn't `nil`, avoiding `NoMethodError` on nil." },
        { type: "code", lang: "ruby", code: "user&.address&.city   # nil if user or address is nil, no crash\nname = params[:name] || \"Anonymous\"   # || returns the first truthy value\nvalue = config[:timeout] ||= 30       # set-if-nil idiom" },
        { type: "heading", text: "Metaprogramming at a glance" },
        { type: "p", text: "Ruby lets code define code at runtime. `method_missing` intercepts calls to undefined methods; `define_method` creates methods dynamically. This is how Active Record can respond to `find_by_email(...)` without you writing it. You'll rarely write metaprogramming yourself, but knowing it exists explains Rails' \"magic.\"" },
        { type: "code", lang: "ruby", code: "class DynamicConfig\n  def initialize(data) = @data = data\n  def method_missing(name, *args)\n    @data.key?(name) ? @data[name] : super\n  end\n  def respond_to_missing?(name, _ = false) = @data.key?(name) || super\nend" }
      ]
    },
    {
      id: "setup",
      title: "Setup, structure & generators",
      level: "core",
      body: [
        { type: "p", text: "Rails is a Ruby gem. With Ruby installed, `gem install rails` gives you the `rails` command. Creating an app is one line, and it generates a complete, runnable project with a directory for everything." },
        { type: "code", lang: "bash", code: "gem install rails\n\n# Full-stack app with PostgreSQL\nrails new blog -d postgresql\n\n# API-only app (no views/assets)\nrails new blog_api --api -d postgresql\n\ncd blog\nbin/rails db:create      # create the database\nbin/rails server         # or: bin/rails s  -> http://localhost:3000" },
        { type: "heading", text: "The directory structure" },
        { type: "p", text: "Rails' \"where does this go\" is answered by convention. The important folders:" },
        { type: "table", headers: ["Path", "What lives there"], rows: [
          ["`app/models/`", "Active Record models — data + business rules"],
          ["`app/controllers/`", "Controllers — orchestrate requests"],
          ["`app/views/`", "ERB templates and partials"],
          ["`app/jobs/` · `app/mailers/`", "Background jobs and email classes"],
          ["`app/javascript/` · `app/assets/`", "Stimulus controllers, CSS, images"],
          ["`config/`", "`routes.rb`, `database.yml`, environments, credentials"],
          ["`db/`", "`migrate/` migrations, `schema.rb`, `seeds.rb`"],
          ["`test/` or `spec/`", "Test suite (Minitest default, or RSpec)"],
          ["`Gemfile`", "Dependency manifest (managed by Bundler)"]
        ] },
        { type: "heading", text: "Bundler & the Gemfile" },
        { type: "p", text: "Dependencies are declared in the `Gemfile` and resolved by **Bundler**. `bundle install` reads the Gemfile, resolves versions, and writes exact locked versions to `Gemfile.lock` so every machine installs the identical set." },
        { type: "code", lang: "ruby", code: "# Gemfile\nsource \"https://rubygems.org\"\n\ngem \"rails\", \"~> 8.0\"\ngem \"pg\"                      # PostgreSQL adapter\ngem \"puma\"                    # app server\ngem \"bcrypt\"                  # has_secure_password\ngem \"sidekiq\"                 # background jobs\n\ngroup :development, :test do\n  gem \"rspec-rails\"\n  gem \"factory_bot_rails\"\nend" },
        { type: "heading", text: "The console" },
        { type: "p", text: "`bin/rails console` (aka `bin/rails c`) drops you into an IRB session with your whole app loaded — the single best way to learn and debug. Query models, call methods, inspect data. Add `--sandbox` to auto-rollback everything you do at the end." },
        { type: "code", lang: "bash", code: "bin/rails console\n>> User.count\n>> u = User.find_by(email: \"ada@example.com\")\n>> u.articles.published.count" },
        { type: "heading", text: "Generators" },
        { type: "p", text: "`rails g` (generate) scaffolds boilerplate. The big ones:" },
        { type: "code", lang: "bash", code: "bin/rails g model Article title:string body:text user:references\nbin/rails g controller Articles index show\nbin/rails g migration AddPublishedToArticles published:boolean\n\n# Scaffold = model + migration + controller + views + routes, all at once\nbin/rails g scaffold Comment body:text article:references\n\nbin/rails destroy model Article   # undo a generate" },
        { type: "callout", variant: "tip", text: "`bin/` scripts (`bin/rails`, `bin/rake`, `bin/dev`) use **binstubs** pinned to your bundle — prefer them over bare `rails`/`rake` so you always run the app's exact gem versions." }
      ]
    },
    {
      id: "routing",
      title: "Routing",
      level: "core",
      body: [
        { type: "p", text: "`config/routes.rb` maps incoming HTTP requests to controller actions and generates named URL helpers. The heart of Rails routing is `resources`, which expands into the **seven RESTful actions** with one line." },
        { type: "code", lang: "ruby", code: "# config/routes.rb\nRails.application.routes.draw do\n  root \"articles#index\"          # GET \"/\" -> ArticlesController#index\n\n  resources :articles            # the 7 RESTful routes (below)\nend" },
        { type: "heading", text: "The 7 RESTful routes" },
        { type: "p", text: "`resources :articles` generates exactly these — memorise them, they are the backbone of every Rails app:" },
        { type: "table", headers: ["HTTP", "Path", "Controller#Action", "Purpose", "Helper"], rows: [
          ["GET", "/articles", "articles#index", "list all", "`articles_path`"],
          ["GET", "/articles/new", "articles#new", "blank form", "`new_article_path`"],
          ["POST", "/articles", "articles#create", "create it", "`articles_path`"],
          ["GET", "/articles/:id", "articles#show", "show one", "`article_path(a)`"],
          ["GET", "/articles/:id/edit", "articles#edit", "edit form", "`edit_article_path(a)`"],
          ["PATCH/PUT", "/articles/:id", "articles#update", "save edit", "`article_path(a)`"],
          ["DELETE", "/articles/:id", "articles#destroy", "delete it", "`article_path(a)`"]
        ] },
        { type: "heading", text: "Nested, member & collection routes" },
        { type: "code", lang: "ruby", code: "resources :articles do\n  resources :comments, only: [:create, :destroy]   # /articles/1/comments\n\n  member do\n    patch :publish        # /articles/1/publish  -> publish_article_path\n  end\n  collection do\n    get :search           # /articles/search      -> search_articles_path\n  end\nend\n\n# Limit which actions are generated\nresources :sessions, only: [:new, :create, :destroy]\n\n# Namespaced / versioned API\nnamespace :api do\n  namespace :v1 do\n    resources :articles\n  end\nend" },
        { type: "callout", variant: "tip", text: "A **member** route acts on one record (needs an `:id`, like `/articles/1/publish`); a **collection** route acts on the whole set (`/articles/search`)." },
        { type: "heading", text: "Constraints & inspecting routes" },
        { type: "code", lang: "ruby", code: "get \"/users/:id\", to: \"users#show\", constraints: { id: /\\d+/ }   # numeric ids only\nget \"/:username\", to: \"profiles#show\"                          # vanity URLs\n\nresources :articles, constraints: { subdomain: \"admin\" }" },
        { type: "code", lang: "bash", code: "bin/rails routes                 # print the full routing table\nbin/rails routes -g article      # grep for routes matching \"article\"" }
      ]
    },
    {
      id: "controllers",
      title: "Controllers",
      level: "core",
      body: [
        { type: "p", text: "A controller is a Ruby class whose public methods (**actions**) handle requests. Each action typically loads data, then renders a view or redirects. Instance variables set in the action (`@article`) are visible in the matching view. Controllers inherit from `ApplicationController`." },
        { type: "heading", text: "Strong parameters" },
        { type: "p", text: "Rails refuses to mass-assign request params to a model unless you explicitly **permit** them — this stops an attacker from setting fields you didn't intend (e.g. `admin: true`). The pattern is `params.require(:model).permit(:allowed, :fields)`, conventionally extracted into a private method." },
        { type: "code", lang: "ruby", code: "class ArticlesController < ApplicationController\n  before_action :require_login, except: [:index, :show]\n  before_action :set_article, only: [:show, :edit, :update, :destroy]\n\n  def index\n    @articles = Article.published.includes(:user).order(created_at: :desc)\n  end\n\n  def show; end   # @article set by the before_action\n\n  def new\n    @article = current_user.articles.build\n  end\n\n  def create\n    @article = current_user.articles.build(article_params)\n    if @article.save\n      redirect_to @article, notice: \"Article created.\"\n    else\n      render :new, status: :unprocessable_entity\n    end\n  end\n\n  def update\n    if @article.update(article_params)\n      redirect_to @article, notice: \"Updated.\"\n    else\n      render :edit, status: :unprocessable_entity\n    end\n  end\n\n  def destroy\n    @article.destroy\n    redirect_to articles_path, notice: \"Deleted.\", status: :see_other\n  end\n\n  private\n\n  def set_article\n    @article = Article.find(params[:id])\n  end\n\n  # Strong parameters: whitelist exactly what may be assigned\n  def article_params\n    params.require(:article).permit(:title, :body, :published)\n  end\nend" },
        { type: "heading", text: "before_action filters" },
        { type: "p", text: "`before_action` runs a method before the listed actions — the idiomatic place for authentication, authorization, and record loading (DRY-ing up repeated `find` calls). A filter that renders or redirects **halts** the action chain." },
        { type: "heading", text: "Responding with HTML or JSON" },
        { type: "p", text: "`respond_to` lets one action serve multiple formats based on the request's `Accept` header / extension. Rails renders `show.html.erb` for HTML or serialises to JSON for `/articles/1.json`." },
        { type: "code", lang: "ruby", code: "def show\n  @article = Article.find(params[:id])\n  respond_to do |format|\n    format.html                       # renders show.html.erb\n    format.json { render json: @article }\n  end\nend" },
        { type: "heading", text: "Flash, redirects & sessions" },
        { type: "p", text: "`flash` is a short-lived store that survives exactly one redirect — perfect for \"Saved!\" messages. `session` persists across requests (cookie-backed by default) and is how you keep a user logged in." },
        { type: "code", lang: "ruby", code: "session[:user_id] = user.id        # persists across requests\nflash[:notice] = \"Welcome back!\"   # shown once, after redirect\nflash.now[:alert] = \"Try again\"    # shown on this render (no redirect)\nreset_session                       # e.g. on logout, prevents fixation" }
      ]
    },
    {
      id: "active-record",
      title: "Active Record (the backend core)",
      level: "core",
      body: [
        { type: "p", text: "**Active Record** is Rails' ORM and the heart of the backend. A model class maps to a database table, each instance to a row, and each attribute to a column — all inferred from the schema. You almost never write SQL by hand; you compose Ruby method chains that lazily build queries." },
        { type: "heading", text: "Migrations: evolving the schema" },
        { type: "p", text: "Never edit the database by hand. **Migrations** are versioned Ruby files describing schema changes; running them updates the DB and regenerates `db/schema.rb`. The `change` method is usually auto-reversible (Rails knows how to roll back an `add_column`)." },
        { type: "code", lang: "ruby", code: "# db/migrate/20260101_create_articles.rb\nclass CreateArticles < ActiveRecord::Migration[8.0]\n  def change\n    create_table :articles do |t|\n      t.string  :title, null: false\n      t.text    :body\n      t.boolean :published, default: false, null: false\n      t.references :user, null: false, foreign_key: true\n      t.timestamps          # created_at + updated_at, managed automatically\n    end\n    add_index :articles, :title\n  end\nend" },
        { type: "code", lang: "bash", code: "bin/rails db:migrate       # apply pending migrations\nbin/rails db:rollback      # undo the last one\nbin/rails db:migrate:status" },
        { type: "heading", text: "Associations" },
        { type: "p", text: "Associations declare relationships once and give you navigation methods for free (`article.comments`, `comment.article`). The main kinds:" },
        { type: "code", lang: "ruby", code: "class User < ApplicationRecord\n  has_many :articles, dependent: :destroy\n  has_many :comments\n  has_one  :profile\n  # many-to-many *through* a join model:\n  has_many :taggings\n  has_many :tags, through: :taggings\nend\n\nclass Article < ApplicationRecord\n  belongs_to :user\n  has_many :comments, dependent: :destroy\nend\n\nclass Comment < ApplicationRecord\n  belongs_to :article\n  belongs_to :user\nend" },
        { type: "callout", variant: "note", text: "`has_many :through` is the Rails way to model many-to-many when the join carries data of its own (e.g. a `Tagging` with a `created_at` or `weight`). `has_and_belongs_to_many` exists for join tables with no extra columns, but `through` is almost always the better default." },
        { type: "heading", text: "Validations" },
        { type: "p", text: "Validations enforce data integrity in the model layer and run before every `save`. A failed validation populates `record.errors` and makes `save` return `false`." },
        { type: "code", lang: "ruby", code: "class Article < ApplicationRecord\n  belongs_to :user\n\n  validates :title, presence: true, length: { minimum: 3, maximum: 140 }\n  validates :body,  presence: true\n  validates :slug,  uniqueness: true, allow_nil: true\n\n  validate :publish_date_not_in_past    # custom validation\n\n  private\n  def publish_date_not_in_past\n    return if publish_at.blank? || publish_at >= Time.zone.today\n    errors.add(:publish_at, \"can't be in the past\")\n  end\nend" },
        { type: "heading", text: "The query interface" },
        { type: "p", text: "Query methods return chainable, **lazy** `ActiveRecord::Relation` objects — no SQL runs until you enumerate or ask for results. This is what lets you compose queries across scopes and controllers." },
        { type: "code", lang: "ruby", code: "Article.all\nArticle.where(published: true)\nArticle.where(\"created_at > ?\", 1.week.ago)     # bind param, safe from injection\nArticle.where(published: true).order(created_at: :desc).limit(10)\nArticle.find(5)                    # by primary key, raises if missing\nArticle.find_by(slug: \"hello\")     # first match or nil\nArticle.where.not(user_id: nil)\nArticle.joins(:comments).where(comments: { flagged: true }).distinct\nArticle.group(:user_id).count      # => { 1 => 4, 2 => 9 }\nArticle.pluck(:title)              # array of just the titles" },
        { type: "heading", text: "Scopes" },
        { type: "p", text: "A **scope** is a reusable, chainable query fragment defined on the model — cleaner than repeating `where` clauses in controllers." },
        { type: "code", lang: "ruby", code: "class Article < ApplicationRecord\n  scope :published, -> { where(published: true) }\n  scope :recent,    -> { order(created_at: :desc) }\n  scope :by_author, ->(user) { where(user: user) }\nend\n\nArticle.published.recent.by_author(current_user).limit(5)" },
        { type: "heading", text: "Callbacks" },
        { type: "p", text: "Callbacks hook into a record's lifecycle (`before_save`, `after_create`, `before_destroy`, ...). Handy for derived data like slugs, but keep them small — heavy side effects in callbacks are a classic source of pain (see Common Headaches)." },
        { type: "code", lang: "ruby", code: "class Article < ApplicationRecord\n  before_validation :generate_slug, on: :create\n\n  private\n  def generate_slug\n    self.slug ||= title.parameterize\n  end\nend" }
      ]
    },
    {
      id: "active-record-advanced",
      title: "Active Record — performance & power tools",
      level: "core",
      body: [
        { type: "heading", text: "The N+1 query problem" },
        { type: "p", text: "The single most common Rails performance bug. When you loop over records and touch an association, Active Record fires one extra query **per record** — 1 query for the list plus N for the associations. It's invisible in dev with 3 rows and lethal in prod with 3,000." },
        { type: "code", lang: "ruby", code: "# WRONG — 1 query for articles, then N queries (one per article) for users\n@articles = Article.all\n@articles.each { |a| puts a.user.name }   # a.user hits the DB every iteration\n\n# RIGHT — eager-load users up front: 2 queries total, regardless of count\n@articles = Article.includes(:user)\n@articles.each { |a| puts a.user.name }   # user already loaded" },
        { type: "p", text: "The three eager-loading strategies:" },
        { type: "table", headers: ["Method", "How it loads", "Use when"], rows: [
          ["`includes`", "Lets Rails choose separate queries or a join", "Default — the smart choice"],
          ["`preload`", "Always separate queries (one per association)", "You don't filter on the association"],
          ["`eager_load`", "Always a single LEFT OUTER JOIN", "You `where`/`order` on the association"]
        ] },
        { type: "callout", variant: "tip", text: "Add the **bullet** gem in development — it detects N+1 queries at runtime and tells you exactly where to add `includes`." },
        { type: "heading", text: "Transactions" },
        { type: "p", text: "Wrap multiple writes so they all commit or all roll back. Raising an exception (or a `save!` failure) inside the block rolls the whole thing back." },
        { type: "code", lang: "ruby", code: "ActiveRecord::Base.transaction do\n  from_account.update!(balance: from_account.balance - amount)\n  to_account.update!(balance: to_account.balance + amount)\n  Transfer.create!(from: from_account, to: to_account, amount: amount)\nend  # any exception here rolls back all three writes" },
        { type: "heading", text: "Enums" },
        { type: "code", lang: "ruby", code: "class Article < ApplicationRecord\n  enum :status, { draft: 0, published: 1, archived: 2 }, default: :draft\nend\n\narticle.published!        # setter bang\narticle.published?        # => true\nArticle.published         # scope generated for free\narticle.status            # => \"published\"" },
        { type: "heading", text: "Batching with find_each" },
        { type: "p", text: "Never load a huge table with `.all.each` — it pulls every row into memory. `find_each` yields records in batches (default 1,000), keeping memory flat." },
        { type: "code", lang: "ruby", code: "Article.where(published: true).find_each(batch_size: 500) do |article|\n  ArticleReindexJob.perform_later(article.id)\nend" },
        { type: "heading", text: "Optimistic locking" },
        { type: "p", text: "Add a `lock_version` integer column and Active Record automatically prevents two users from clobbering each other's edits — a concurrent save raises `ActiveRecord::StaleObjectError` instead of silently overwriting." },
        { type: "heading", text: "Raw SQL escape hatch" },
        { type: "p", text: "When the query interface can't express it, drop to SQL — but always use bind parameters, never string interpolation, to stay safe from injection." },
        { type: "code", lang: "ruby", code: "# Sanitized bind params\nArticle.find_by_sql([\"SELECT * FROM articles WHERE views > ?\", 1000])\n\n# Connection-level for aggregates / reports\nActiveRecord::Base.connection.execute(\"REFRESH MATERIALIZED VIEW stats\")" }
      ]
    },
    {
      id: "views-hotwire",
      title: "Views & Hotwire (the frontend)",
      level: "core",
      body: [
        { type: "p", text: "Rails renders HTML server-side with **ERB** templates and makes it feel like an SPA using **Hotwire** — a set of techniques for sending HTML (not JSON) over the wire and letting the browser swap it in. You write mostly server code and a little JavaScript." },
        { type: "heading", text: "ERB, layouts & partials" },
        { type: "p", text: "ERB embeds Ruby in HTML: `<%= %>` outputs a value, `<% %>` runs code without output. A **layout** (`app/views/layouts/application.html.erb`) wraps every page; **partials** (files prefixed with `_`) are reusable view fragments rendered with `render`." },
        { type: "code", lang: "html", code: "<%# app/views/articles/index.html.erb %>\n<h1>Articles</h1>\n\n<%= link_to \"New article\", new_article_path, class: \"btn\" %>\n\n<div id=\"articles\">\n  <%= render @articles %>   <%# renders _article partial once per item %>\n</div>" },
        { type: "code", lang: "html", code: "<%# app/views/articles/_article.html.erb %>\n<article id=\"<%= dom_id(article) %>\">\n  <h2><%= link_to article.title, article %></h2>\n  <p><%= truncate(article.body, length: 200) %></p>\n  <small>by <%= article.user.name %> · <%= time_ago_in_words(article.created_at) %> ago</small>\n</article>" },
        { type: "heading", text: "View helpers & forms" },
        { type: "p", text: "Rails ships helpers for URLs, formatting, and forms. `form_with` builds a form bound to a model, auto-routing to create or update and wiring CSRF protection." },
        { type: "code", lang: "html", code: "<%= form_with model: @article do |f| %>\n  <% if @article.errors.any? %>\n    <div class=\"errors\"><%= @article.errors.full_messages.to_sentence %></div>\n  <% end %>\n\n  <%= f.label :title %>\n  <%= f.text_field :title %>\n\n  <%= f.label :body %>\n  <%= f.text_area :body %>\n\n  <%= f.submit %>\n<% end %>" },
        { type: "heading", text: "Hotwire = Turbo + Stimulus" },
        { type: "list", items: [
          "**Turbo Drive** — intercepts link clicks and form submits, fetches the new page over AJAX, and swaps the `<body>` — full-page navigation speed with no full reloads. On by default, zero code.",
          "**Turbo Frames** — a `<turbo-frame>` is an independently updatable region. A link/form inside it replaces only that frame, not the whole page.",
          "**Turbo Streams** — the server sends fragments of HTML with actions (`append`, `replace`, `remove`) to surgically update the DOM — great for live updates, often over WebSockets.",
          "**Stimulus** — a small JS framework for the sprinkles Turbo can't do: attach behavior to markup via `data-controller` attributes."
        ] },
        { type: "heading", text: "Turbo Frame example — inline edit" },
        { type: "code", lang: "html", code: "<%# show.html.erb — wrap the region in a frame %>\n<%= turbo_frame_tag @article do %>\n  <h2><%= @article.title %></h2>\n  <%= link_to \"Edit\", edit_article_path(@article) %>\n<% end %>\n\n<%# edit.html.erb — SAME frame id: clicking Edit swaps just this box %>\n<%= turbo_frame_tag @article do %>\n  <%= form_with model: @article do |f| %>\n    <%= f.text_field :title %>\n    <%= f.submit \"Save\" %>\n  <% end %>\n<% end %>" },
        { type: "heading", text: "Turbo Stream from a controller" },
        { type: "code", lang: "ruby", code: "# create action — respond with a stream that prepends the new comment\ndef create\n  @comment = @article.comments.create!(comment_params)\n  respond_to do |format|\n    format.turbo_stream   # renders create.turbo_stream.erb (below)\n    format.html { redirect_to @article }\n  end\nend" },
        { type: "code", lang: "html", code: "<%# create.turbo_stream.erb — no page reload, just this DOM op %>\n<%= turbo_stream.prepend \"comments\" do %>\n  <%= render @comment %>\n<% end %>\n<%= turbo_stream.update \"comments_count\", @article.comments.size %>" },
        { type: "heading", text: "Stimulus controller" },
        { type: "code", lang: "html", code: "<%# markup declares controller + targets + actions %>\n<div data-controller=\"clipboard\">\n  <input data-clipboard-target=\"source\" value=\"https://example.com/x\" readonly>\n  <button data-action=\"clipboard#copy\">Copy</button>\n</div>" },
        { type: "code", lang: "text", code: "// app/javascript/controllers/clipboard_controller.js\nimport { Controller } from \"@hotwired/stimulus\"\n\nexport default class extends Controller {\n  static targets = [\"source\"]\n  copy() {\n    navigator.clipboard.writeText(this.sourceTarget.value)\n  }\n}" },
        { type: "callout", variant: "tip", text: "Rails 7+ ships JS with **importmaps** by default — no Node, no webpack, no `npm install`. You pin packages with `bin/importmap pin @hotwired/stimulus` and the browser loads ES modules directly." }
      ]
    },
    {
      id: "auth",
      title: "Authentication",
      level: "core",
      body: [
        { type: "p", text: "Rails gives you two roads: roll your own with `has_secure_password` (simple, transparent, few dependencies) or use **Devise** for a full-featured, batteries-included solution. Rails 8 also ships a built-in auth generator that scaffolds a session-based system for you." },
        { type: "heading", text: "Hand-rolled with has_secure_password" },
        { type: "p", text: "Add `bcrypt` to the Gemfile and a `password_digest` column. `has_secure_password` gives your model a virtual `password`/`password_confirmation`, hashes it with bcrypt, and adds an `authenticate` method." },
        { type: "code", lang: "ruby", code: "# migration: add_column :users, :password_digest, :string\n\nclass User < ApplicationRecord\n  has_secure_password\n  validates :email, presence: true, uniqueness: true\nend\n\n# in the console / anywhere\nuser = User.create!(email: \"a@b.com\", password: \"secret123\")\nuser.authenticate(\"wrong\")     # => false\nuser.authenticate(\"secret123\") # => the user object" },
        { type: "heading", text: "Sessions: login & logout" },
        { type: "code", lang: "ruby", code: "class SessionsController < ApplicationController\n  def create\n    user = User.find_by(email: params[:email])\n    if user&.authenticate(params[:password])\n      reset_session                       # prevent session fixation\n      session[:user_id] = user.id\n      redirect_to root_path, notice: \"Signed in.\"\n    else\n      flash.now[:alert] = \"Invalid email or password\"\n      render :new, status: :unprocessable_entity\n    end\n  end\n\n  def destroy\n    reset_session\n    redirect_to root_path, notice: \"Signed out.\", status: :see_other\n  end\nend" },
        { type: "heading", text: "The require_login filter" },
        { type: "code", lang: "ruby", code: "class ApplicationController < ActionController::Base\n  helper_method :current_user, :logged_in?\n\n  private\n\n  def current_user\n    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]\n  end\n\n  def logged_in? = current_user.present?\n\n  def require_login\n    return if logged_in?\n    redirect_to login_path, alert: \"Please sign in first.\"\n  end\nend" },
        { type: "heading", text: "Devise — the batteries-included path" },
        { type: "p", text: "**Devise** is the de-facto auth gem: registration, confirmable email, recoverable passwords, lockable accounts, OmniAuth, and more, via modular concerns you opt into." },
        { type: "code", lang: "bash", code: "bundle add devise\nbin/rails g devise:install\nbin/rails g devise User      # adds Devise modules + migration\nbin/rails db:migrate" },
        { type: "code", lang: "ruby", code: "class User < ApplicationRecord\n  devise :database_authenticatable, :registerable,\n         :recoverable, :rememberable, :validatable\nend\n\n# controller helpers you get for free:\n# before_action :authenticate_user!\n# current_user, user_signed_in?" },
        { type: "callout", variant: "note", text: "**Rails 8** ships its own auth generator — `bin/rails g authentication` scaffolds a `User`, `Session`, sign-in controller, and password-reset flow with no external gem. It's the recommended starting point for new apps that don't need Devise's full feature set." }
      ]
    },
    {
      id: "jobs",
      title: "Background jobs & mailers",
      level: "core",
      body: [
        { type: "p", text: "Slow work (sending email, calling APIs, generating PDFs, resizing images) shouldn't block the request. **Active Job** is Rails' queuing abstraction; you write jobs against one API and swap the backing engine (**Sidekiq**, **Solid Queue**, etc.) without changing job code." },
        { type: "heading", text: "Defining and enqueuing a job" },
        { type: "code", lang: "ruby", code: "# app/jobs/thumbnail_job.rb\nclass ThumbnailJob < ApplicationJob\n  queue_as :default\n  retry_on Timeout::Error, wait: :polynomially_longer, attempts: 5\n  discard_on ActiveJob::DeserializationError   # record gone, don't retry\n\n  def perform(article_id)\n    article = Article.find(article_id)\n    article.generate_thumbnail!\n  end\nend" },
        { type: "code", lang: "ruby", code: "ThumbnailJob.perform_later(article.id)          # enqueue, return immediately\nThumbnailJob.set(wait: 10.minutes).perform_later(article.id)   # delayed\nThumbnailJob.set(wait_until: Date.tomorrow.noon).perform_later(article.id)\nThumbnailJob.perform_now(article.id)            # run inline (tests/debug)" },
        { type: "callout", variant: "gotcha", text: "Pass **IDs, not objects**, to `perform_later`. Jobs are serialized to the queue; a huge object (or a stale one by the time it runs) causes bugs. Pass `article.id` and `find` it inside `perform`. (GlobalID lets you pass records, but IDs are safest for large or fast-changing data.)" },
        { type: "heading", text: "The backend" },
        { type: "p", text: "**Sidekiq** (Redis-backed, battle-tested, very fast) is the long-standing default. **Solid Queue** (Rails 8's default) runs on your existing SQL database — no Redis to operate. Configure in `config/application.rb`:" },
        { type: "code", lang: "ruby", code: "config.active_job.queue_adapter = :sidekiq      # or :solid_queue" },
        { type: "heading", text: "Mailers with Action Mailer" },
        { type: "p", text: "A mailer looks like a controller: methods build a message, and templates render the body. Deliver in the background with `deliver_later` (queued via Active Job) or synchronously with `deliver_now`." },
        { type: "code", lang: "ruby", code: "# app/mailers/user_mailer.rb\nclass UserMailer < ApplicationMailer\n  def welcome(user)\n    @user = user\n    @url  = login_url\n    mail(to: @user.email, subject: \"Welcome to Blog!\")\n  end\nend\n\n# app/views/user_mailer/welcome.html.erb renders the body\n\n# enqueue delivery (does not block the request)\nUserMailer.welcome(user).deliver_later\nUserMailer.welcome(user).deliver_now      # send immediately (tests)" }
      ]
    },
    {
      id: "realtime-cable",
      title: "Real-time with Action Cable",
      level: "core",
      body: [
        { type: "p", text: "**Action Cable** integrates **WebSockets** into Rails so the server can push to connected clients. You define **channels** (like controllers for WebSocket connections); clients subscribe, the server **broadcasts** messages to a named stream, and every subscriber receives them." },
        { type: "heading", text: "A chat channel" },
        { type: "code", lang: "ruby", code: "# app/channels/room_channel.rb\nclass RoomChannel < ApplicationCable::Channel\n  def subscribed\n    stream_from \"room_#{params[:room_id]}\"    # join this stream\n  end\n\n  def speak(data)\n    message = Message.create!(\n      room_id: params[:room_id], body: data[\"body\"], user: current_user\n    )\n    ActionCable.server.broadcast(\n      \"room_#{params[:room_id]}\",\n      { body: message.body, author: message.user.name }\n    )\n  end\nend" },
        { type: "heading", text: "Authenticating the connection" },
        { type: "code", lang: "ruby", code: "# app/channels/application_cable/connection.rb\nmodule ApplicationCable\n  class Connection < ActionCable::Connection::Base\n    identified_by :current_user\n    def connect\n      self.current_user = User.find_by(id: cookies.encrypted[:user_id]) ||\n                          reject_unauthorized_connection\n    end\n  end\nend" },
        { type: "heading", text: "Turbo Streams ride on top" },
        { type: "p", text: "The killer feature: you rarely write raw Cable code. **Turbo Streams broadcast over Action Cable**. Declare `broadcasts_to` on a model and subscribe with one view helper — new records stream to every viewer's DOM automatically, no JavaScript at all." },
        { type: "code", lang: "ruby", code: "# model: broadcast changes to a stream named after the article\nclass Comment < ApplicationRecord\n  belongs_to :article\n  # append rendered _comment partials to the article's stream on create\n  broadcasts_to ->(comment) { [comment.article, \"comments\"] }\nend" },
        { type: "code", lang: "html", code: "<%# in the article view: subscribe this browser to live updates %>\n<%= turbo_stream_from @article, \"comments\" %>\n\n<div id=\"comments\">\n  <%= render @article.comments %>\n</div>\n<%# a new Comment anywhere now appears here instantly, for everyone %>" },
        { type: "callout", variant: "note", text: "In Rails 8 the WebSocket backend defaults to **Solid Cable** (SQL-backed), so real-time works out of the box without running Redis." }
      ]
    },
    {
      id: "api-mode",
      title: "Rails as a JSON API",
      level: "core",
      body: [
        { type: "p", text: "`rails new myapp --api` produces a slimmed-down app: no view layer, no cookie/session middleware, no asset pipeline. `ApplicationController` inherits from `ActionController::API` (lighter than `::Base`). Everything else — routing, Active Record, jobs, strong params — is identical." },
        { type: "heading", text: "Rendering JSON" },
        { type: "p", text: "For simple payloads, `render json:` serialises with `to_json`. For real APIs you want a serializer to control the shape, hide fields, and embed associations. Options:" },
        { type: "table", headers: ["Tool", "Style", "Notes"], rows: [
          ["`jbuilder`", "View templates (`.json.jbuilder`)", "Ships with Rails; DSL for building JSON"],
          ["`active_model_serializers`", "Serializer classes", "Popular, JSON:API support, less active"],
          ["`alba`", "Serializer classes", "Fast, modern, actively maintained"]
        ] },
        { type: "code", lang: "ruby", code: "# jbuilder: app/views/api/v1/articles/show.json.jbuilder\njson.id       @article.id\njson.title    @article.title\njson.author   @article.user.name\njson.comments @article.comments do |c|\n  json.body c.body\nend" },
        { type: "code", lang: "ruby", code: "# alba serializer\nclass ArticleResource\n  include Alba::Resource\n  attributes :id, :title, :published\n  attribute(:author) { |a| a.user.name }\n  many :comments, resource: CommentResource\nend\n\n# controller\nrender json: ArticleResource.new(@article).serialize" },
        { type: "heading", text: "Versioning" },
        { type: "code", lang: "ruby", code: "namespace :api do\n  namespace :v1 do\n    resources :articles\n  end\nend\n# app/controllers/api/v1/articles_controller.rb -> Api::V1::ArticlesController" },
        { type: "heading", text: "CORS" },
        { type: "p", text: "Browsers block cross-origin requests unless the server opts in. Add **rack-cors** and configure allowed origins for a JS front end on another domain." },
        { type: "code", lang: "ruby", code: "# config/initializers/cors.rb\nRails.application.config.middleware.insert_before 0, Rack::Cors do\n  allow do\n    origins \"https://app.example.com\"\n    resource \"*\", headers: :any, methods: [:get, :post, :patch, :delete]\n  end\nend" },
        { type: "heading", text: "Token authentication" },
        { type: "p", text: "APIs are stateless, so instead of sessions you send a token in a header. Rails ships `authenticate_with_http_token`; a common pattern is a Bearer token verified per request." },
        { type: "code", lang: "ruby", code: "class Api::V1::BaseController < ActionController::API\n  before_action :authenticate!\n\n  private\n  def authenticate!\n    authenticate_with_http_token do |token, _options|\n      @current_user = User.find_by(api_token: token)\n    end || render(json: { error: \"unauthorized\" }, status: :unauthorized)\n  end\nend" }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "deep",
      body: [
        { type: "p", text: "Rails treats testing as first-class — a test app database, fixtures, and generators that scaffold test files alongside code. The choice is **Minitest** (Rails' default, ships in the box, plain assertions) vs **RSpec** (a rich DSL, `describe`/`it`, hugely popular in the community)." },
        { type: "code", lang: "ruby", code: "# Minitest model test — test/models/article_test.rb\nrequire \"test_helper\"\n\nclass ArticleTest < ActiveSupport::TestCase\n  test \"is invalid without a title\" do\n    article = Article.new(body: \"x\")\n    assert_not article.valid?\n    assert_includes article.errors[:title], \"can't be blank\"\n  end\nend" },
        { type: "code", lang: "ruby", code: "# RSpec equivalent — spec/models/article_spec.rb\nRSpec.describe Article, type: :model do\n  it \"is invalid without a title\" do\n    article = build(:article, title: nil)   # FactoryBot\n    expect(article).not_to be_valid\n    expect(article.errors[:title]).to include(\"can't be blank\")\n  end\nend" },
        { type: "heading", text: "Fixtures vs factories" },
        { type: "p", text: "**Fixtures** are static YAML rows loaded into the test DB — fast but rigid. **FactoryBot** builds objects on demand with sensible defaults and overrides — the community favorite for readable, flexible test data." },
        { type: "code", lang: "ruby", code: "# spec/factories/articles.rb\nFactoryBot.define do\n  factory :article do\n    title { \"A title\" }\n    body  { \"Some body text\" }\n    association :user\n    trait :published do\n      published { true }\n    end\n  end\nend\n\ncreate(:article, :published)     # persisted + published\nbuild(:article)                   # in memory, not saved" },
        { type: "heading", text: "System tests" },
        { type: "p", text: "System (a.k.a. feature/end-to-end) tests drive a real browser via **Capybara** — clicking links and filling forms like a user, exercising Turbo/JS too." },
        { type: "code", lang: "ruby", code: "class ArticlesTest < ApplicationSystemTestCase\n  test \"creating an article\" do\n    sign_in users(:ada)\n    visit new_article_path\n    fill_in \"Title\", with: \"Hello\"\n    fill_in \"Body\",  with: \"World\"\n    click_on \"Create Article\"\n    assert_text \"Article created\"\n  end\nend" },
        { type: "code", lang: "bash", code: "bin/rails test               # Minitest: all tests\nbin/rails test:system        # system tests only\nbundle exec rspec            # RSpec\nbundle exec rspec spec/models/article_spec.rb:12   # one example" }
      ]
    },
    {
      id: "deployment",
      title: "Deployment",
      level: "deep",
      body: [
        { type: "heading", text: "Encrypted credentials" },
        { type: "p", text: "Secrets live in `config/credentials.yml.enc`, encrypted with a master key (`config/master.key`, gitignored). You edit them through Rails, which decrypts in memory. No secrets in ENV files sprinkled around servers." },
        { type: "code", lang: "bash", code: "bin/rails credentials:edit                       # opens decrypted YAML in $EDITOR\nEDITOR=\"code --wait\" bin/rails credentials:edit  # use VS Code\n\n# per-environment credentials\nbin/rails credentials:edit --environment production" },
        { type: "code", lang: "ruby", code: "# read them in code\nRails.application.credentials.dig(:aws, :access_key_id)\nRails.application.credentials.secret_key_base" },
        { type: "heading", text: "Production environment" },
        { type: "p", text: "Rails runs in one of three environments (development/test/production) set by `RAILS_ENV`. Production caches classes, serves precompiled assets, and needs `SECRET_KEY_BASE` (or the credentials key) present." },
        { type: "code", lang: "bash", code: "RAILS_ENV=production bin/rails assets:precompile   # build importmap/CSS\nRAILS_ENV=production bin/rails db:migrate\nRAILS_ENV=production bin/rails server" },
        { type: "heading", text: "Assets & importmaps" },
        { type: "p", text: "With importmaps there's no Node build step — JS ships as ES modules pinned in `config/importmap.rb`. CSS is handled by **Propshaft** (the modern asset pipeline). For apps needing bundling, `jsbundling-rails` + `cssbundling-rails` wire up esbuild/Tailwind." },
        { type: "heading", text: "Kamal — Rails 8's default deploy tool" },
        { type: "p", text: "**Kamal** deploys Dockerized apps to your own servers (or any VPS) with zero-downtime rolling releases — no PaaS lock-in. You describe hosts and the image in `config/deploy.yml`, and `kamal deploy` builds, pushes, and boots the containers behind a proxy that handles SSL." },
        { type: "code", lang: "yaml", code: "# config/deploy.yml\nservice: blog\nimage: your-user/blog\nservers:\n  web:\n    - 192.168.0.1\nproxy:\n  ssl: true\n  host: blog.example.com\nregistry:\n  username: your-user\n  password:\n    - KAMAL_REGISTRY_PASSWORD\nenv:\n  secret:\n    - RAILS_MASTER_KEY" },
        { type: "code", lang: "bash", code: "kamal setup            # first-time: install Docker + boot everything\nkamal deploy           # build image, push, rolling-restart with no downtime\nkamal app exec \"bin/rails db:migrate\"   # run migrations on deploy\nkamal rollback         # revert to the previous release\nkamal app logs -f      # tail production logs" },
        { type: "callout", variant: "tip", text: "Run migrations as part of the deploy (Kamal can hook this), and always make migrations **backward-compatible** with the old code during a rolling deploy — the old and new containers run side by side for a moment." }
      ]
    },
    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "heading", text: "N+1 queries" },
        { type: "p", text: "The classic. Looping over records and touching an association fires one query per record. Fix: eager-load with `includes`." },
        { type: "code", lang: "ruby", code: "# WRONG — 1 + N queries\nArticle.all.each { |a| puts a.user.name }\n# RIGHT — 2 queries\nArticle.includes(:user).each { |a| puts a.user.name }" },
        { type: "heading", text: "Mass-assignment" },
        { type: "p", text: "Assigning raw `params` to a model lets an attacker set any column (e.g. `role: \"admin\"`). Fix: always funnel through strong parameters." },
        { type: "code", lang: "ruby", code: "# WRONG — trusts the request entirely\nUser.create(params[:user])\n# RIGHT — whitelist\nUser.create(params.require(:user).permit(:name, :email))" },
        { type: "heading", text: "Callback hell" },
        { type: "p", text: "Piling side effects (emails, API calls, cross-model writes) into model callbacks makes objects impossible to save without triggering the world, and tests slow and brittle. Fix: keep callbacks for derived data only; move real side effects into an explicit **service object (PORO)** called from the controller." },
        { type: "code", lang: "ruby", code: "# WRONG — implicit side effects fire on every save\nclass Order < ApplicationRecord\n  after_create { PaymentGateway.charge(self); Mailer.receipt(self).deliver_now }\nend\n\n# RIGHT — an explicit, testable service\nclass PlaceOrder\n  def initialize(order) = @order = order\n  def call\n    ActiveRecord::Base.transaction do\n      @order.save!\n      PaymentGateway.charge(@order)\n    end\n    OrderMailer.receipt(@order).deliver_later\n  end\nend" },
        { type: "heading", text: "Migration reversibility" },
        { type: "p", text: "`change` auto-reverses simple operations, but some (raw SQL, dropping a column with data) can't be inferred. Fix: use explicit `up`/`down`, or `reversible`, so `db:rollback` works." },
        { type: "code", lang: "ruby", code: "class BackfillStatus < ActiveRecord::Migration[8.0]\n  def up\n    execute \"UPDATE articles SET status = 1 WHERE published = true\"\n  end\n  def down\n    execute \"UPDATE articles SET status = 0\"\n  end\nend" },
        { type: "heading", text: "Zeitwerk autoloading" },
        { type: "p", text: "Rails' **Zeitwerk** loader maps file paths to constant names by convention. A mismatch throws `NameError: expected file .../foo.rb to define constant Foo`. Fix: the file name and class/module name must correspond exactly — `app/services/pdf_export.rb` must define `PdfExport`; a folder like `app/services/billing/` needs `module Billing`. Don't `require` app files; let Zeitwerk autoload them." },
        { type: "callout", variant: "gotcha", text: "Acronyms bite: a file `api_client.rb` autoloads to `ApiClient`, not `APIClient`. If you want `APIClient`, register the inflection in `config/initializers/inflections.rb` (`inflect.acronym \"API\"`)." },
        { type: "heading", text: "Fat models" },
        { type: "p", text: "A model that grows to 800 lines becomes unmaintainable. Fix: extract cohesive behavior into **concerns** (mixins under `app/models/concerns/`) or plain Ruby objects, and push orchestration into services." },
        { type: "code", lang: "ruby", code: "# app/models/concerns/sluggable.rb\nmodule Sluggable\n  extend ActiveSupport::Concern\n  included do\n    before_validation :set_slug, on: :create\n  end\n  private\n  def set_slug = self.slug ||= title.parameterize\nend\n\nclass Article < ApplicationRecord\n  include Sluggable\nend" },
        { type: "heading", text: "Time zones" },
        { type: "p", text: "`Time.now` uses the server's local zone; `Time.zone.now` uses the app's configured zone. Mixing them causes off-by-hours bugs. Fix: always use the `Time.zone` / `.in_time_zone` family and store UTC." },
        { type: "code", lang: "ruby", code: "# WRONG — server local time, unpredictable\nArticle.where(\"created_at > ?\", Time.now.beginning_of_day)\n# RIGHT — app time zone\nArticle.where(\"created_at > ?\", Time.zone.now.beginning_of_day)" },
        { type: "heading", text: "default_scope foot-guns" },
        { type: "p", text: "`default_scope { where(active: true) }` silently filters **every** query, including in associations and `count`, and leaks into record creation (new records inherit the scope's values). It's almost always better to use an explicit named scope you opt into per query." },
        { type: "heading", text: "save vs save!" },
        { type: "p", text: "`save` returns `false` on a validation failure and keeps going — a silent bug if you don't check the return value. `save!` (and `create!`, `update!`) **raise** on failure. Use the bang versions where a failure is truly unexpected (jobs, services, seeds) so it surfaces loudly." },
        { type: "code", lang: "ruby", code: "# WRONG — failure ignored, code continues as if saved\nuser.save\nredirect_to user   # user might be invalid and unsaved!\n\n# RIGHT (controller) — branch on the boolean\nif user.save\n  redirect_to user\nelse\n  render :new, status: :unprocessable_entity\nend\n\n# RIGHT (job/service) — fail loudly\nuser.save!   # raises ActiveRecord::RecordInvalid on failure" }
      ]
    }
  ],

  packages: [
    { name: "rails", why: "The framework itself — router, Active Record, Action Pack, jobs, mailers." },
    { name: "pg", why: "PostgreSQL adapter, the default production database for Rails apps." },
    { name: "puma", why: "The default multi-threaded application/web server." },
    { name: "bcrypt", why: "Password hashing behind `has_secure_password`." },
    { name: "devise", why: "Batteries-included authentication (registration, recovery, lockable, OmniAuth)." },
    { name: "sidekiq", why: "Fast Redis-backed Active Job backend for background processing." },
    { name: "jbuilder", why: "Template DSL for building JSON API responses." },
    { name: "rack-cors", why: "Cross-Origin Resource Sharing middleware for browser-facing APIs." },
    { name: "rspec-rails", why: "The RSpec testing framework integrated with Rails." },
    { name: "factory_bot_rails", why: "Flexible test-data factories to replace static fixtures." },
    { name: "kamal", why: "Rails 8's default tool for zero-downtime Docker deploys to your own servers." }
  ],

  gotchas: [
    "Pass **IDs, not Active Record objects**, to `perform_later` — jobs are serialized and the object may be huge or stale by run time.",
    "`save` fails **silently** (returns `false`); use `save!`/`create!`/`update!` in jobs and services so failures raise.",
    "`Time.now` is server local; use `Time.zone.now` everywhere and store UTC to avoid off-by-hours bugs.",
    "N+1 queries hide in dev with tiny data and explode in prod — reach for `includes` and add the **bullet** gem.",
    "Never assign raw `params` to a model — always go through `params.require(...).permit(...)` (strong parameters).",
    "Zeitwerk requires file names to match constant names exactly; acronyms like `API` need an inflection rule.",
    "`default_scope` leaks into every query, association, and even record creation — prefer explicit named scopes.",
    "`change` migrations can't auto-reverse everything; use `up`/`down` for raw SQL so `db:rollback` works.",
    "`0`, `\"\"`, and `[]` are all **truthy** in Ruby — only `nil` and `false` are falsy.",
    "Fat models and callback-driven side effects hurt fast; extract concerns and service objects (POROs) early."
  ],

  flashcards: [
    { q: "What does \"convention over configuration\" mean in Rails?", a: "Follow naming/placement conventions and Rails wires everything for you with no config — model `Article` -> table `articles` -> `app/models/article.rb` -> `ArticlesController`." },
    { q: "How do strong parameters protect you and what's the syntax?", a: "They block mass-assignment of unpermitted fields. `params.require(:article).permit(:title, :body)` whitelists exactly which attributes may be assigned." },
    { q: "What is an N+1 query and how do you fix it?", a: "Looping over N records and touching an association fires 1 + N queries. Fix by eager-loading: `Article.includes(:user)` collapses it to ~2 queries." },
    { q: "When do you use `has_many :through`?", a: "For many-to-many where the join model carries its own data (e.g. `Tagging`). You associate through the join: `has_many :tags, through: :taggings`." },
    { q: "What are Active Record callbacks and their main pitfall?", a: "Lifecycle hooks (`before_save`, `after_create`, ...). Pitfall: piling side effects into them makes records un-saveable and tests brittle — extract to service objects." },
    { q: "What is Hotwire and its parts?", a: "Rails' way to build reactive UIs by sending HTML over the wire: **Turbo Drive** (fast nav), **Turbo Frames** (partial updates), **Turbo Streams** (live DOM ops), **Stimulus** (JS sprinkles)." },
    { q: "How do you run work in the background in Rails?", a: "Active Job: define a job, call `MyJob.perform_later(record.id)` to enqueue; a backend (Sidekiq / Solid Queue) runs `perform`. Mailers use `.deliver_later`." },
    { q: "What is Zeitwerk and its most common error?", a: "Rails' autoloader that maps file paths to constant names. Common error: `expected file .../foo.rb to define constant Foo` — the file name and class name don't match." },
    { q: "What's the difference between `save` and `save!`?", a: "`save` returns `false` on validation failure (silent); `save!` raises `ActiveRecord::RecordInvalid`. Use the bang version where failure is unexpected." },
    { q: "What are the 7 RESTful actions `resources` generates?", a: "index, new, create, show, edit, update, destroy — mapping GET/POST/PATCH/DELETE across `/things` and `/things/:id`." }
  ],

  cheatsheet: [
    { label: "New app (Postgres)", code: "rails new blog -d postgresql" },
    { label: "Scaffold a resource", code: "bin/rails g scaffold Article title:string body:text" },
    { label: "Run migrations", code: "bin/rails db:migrate" },
    { label: "Interactive console", code: "bin/rails console" },
    { label: "RESTful routes", code: "resources :articles" },
    { label: "Query with conditions", code: "Article.where(published: true).order(created_at: :desc)" },
    { label: "Avoid N+1", code: "Article.includes(:user).each { |a| a.user.name }" },
    { label: "Enqueue a job", code: "ThumbnailJob.perform_later(article.id)" },
    { label: "Secure password model", code: "class User < ApplicationRecord; has_secure_password; end" },
    { label: "Deploy with Kamal", code: "kamal deploy" }
  ]
});
