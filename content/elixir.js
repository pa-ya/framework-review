(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "elixir",
  name: "Elixir & Phoenix",
  language: "Elixir",
  group: "Others",
  navLabel: "Elixir & Erlang",
  tagline: "The **BEAM** stack: Erlang's battle-tested VM, Elixir's friendly syntax, and **Phoenix** for real-time, fault-tolerant, massively concurrent fullstack apps.",
  color: "#9b59b6",
  readMinutes: 30,

  sections: [
    {
      id: "overview",
      title: "Overview: the BEAM, the actor model & \"let it crash\"",
      level: "core",
      body: [
        { type: "p", text: "This stack is three layers on one virtual machine. **Erlang** is a functional language built by Ericsson in the 1980s to run telephone switches — systems that must handle millions of simultaneous calls and *never* go down. Its runtime, the **BEAM** (the Erlang VM), is the crown jewel. **Elixir** (created by José Valim in 2012) is a modern language with Ruby-flavoured syntax, macros and superb tooling that **compiles to the same BEAM bytecode** and interops seamlessly with Erlang. **Phoenix** is the flagship web framework written in Elixir." },
        { type: "heading", text: "The actor model & lightweight processes" },
        { type: "p", text: "The BEAM's defining idea: everything is a **process**. Not an OS process or a thread — a BEAM process is an extremely cheap, isolated unit of concurrency scheduled by the VM. You can spawn *millions* of them on one machine (each starts at ~a few KB). Processes **share no memory**; they communicate only by sending immutable **messages** to each other's mailboxes. This is the **actor model**, and it's why the BEAM scales across all CPU cores almost for free." },
        { type: "list", items: [
          "**Isolation** — one process crashing cannot corrupt another's memory. There is no shared mutable state to race on, so whole classes of concurrency bugs vanish.",
          "**Preemptive scheduling** — the VM time-slices processes fairly, so one busy process can't starve the rest. Latency stays low even under load.",
          "**Per-process GC** — garbage collection happens per process and never stops the world."
        ] },
        { type: "heading", text: "\"Let it crash\" & OTP" },
        { type: "p", text: "Instead of defensively guarding against every possible error, BEAM code follows **\"let it crash\"**: write the happy path, and when a process hits an unexpected state, let it die. A **supervisor** — a process whose only job is to watch other processes — notices the death and **restarts** the child from a known-good initial state. This self-healing structure is **OTP** (Open Telecom Platform): a set of battle-tested behaviours (`GenServer`, `Supervisor`, `Application`) and design principles that turn \"let it crash\" into an engineering discipline rather than a hope." },
        { type: "callout", variant: "note", text: "Mental model: **Erlang/Elixir** is the language, the **BEAM** is the VM, **OTP** is the standard library of concurrency patterns, and **Phoenix** is a web framework built on top. When people say \"the BEAM\" they mean the whole runtime you get for free: preemptive scheduling, distribution, supervision, hot code upgrades." },
        { type: "heading", text: "When to reach for this stack" },
        { type: "list", items: [
          "**Real-time & massively concurrent** — chat, presence, live dashboards, multiplayer, collaborative editing, notifications. WhatsApp famously served millions of connections per node on Erlang.",
          "**Fault-tolerant, always-on** — telecom, payment rails, IoT device fleets, anything where uptime is the product.",
          "**Fullstack web with live UI** — Phoenix + LiveView lets one team ship interactive frontends without a separate JS SPA.",
          "**Where it fits *less* well** — CPU-bound number crunching (NIFs/Rust help but it's not the sweet spot), and tiny scripts where a heavier runtime isn't worth it."
        ] }
      ]
    },

    {
      id: "erlang-crash-course",
      title: "Erlang crash course",
      level: "core",
      body: [
        { type: "p", text: "You will rarely *write* much Erlang, but understanding it demystifies Elixir — every Elixir concept maps to an Erlang one underneath, and you'll call Erlang libraries directly. Erlang is a **functional, process-oriented** language: no classes, no mutable variables, no loops (recursion instead)." },
        { type: "heading", text: "Basic syntax" },
        { type: "p", text: "The surprises coming from mainstream languages: **variables are Capitalized and immutable** (bind once). Lowercase words are **atoms** — named constants that stand for themselves (like symbols/enums). Statements end with `,`, clauses with `;`, and a definition with `.`" },
        { type: "code", lang: "erlang", code: "% variables start Uppercase and bind exactly once (immutable)\nName = \"Ada\".\nCount = 42.\n% Count = 43.   %% would crash: no match, already bound to 42\n\n% atoms are lowercase constants that equal themselves\nok, error, undefined.\n\n% tuples: fixed-size grouped values, often tagged with an atom\nPoint = {point, 3, 4}.\nResult = {ok, \"loaded\"}.\n\n% lists: variable length, [Head | Tail] cons syntax\nNums = [1, 2, 3].\n[First | Rest] = Nums.   %% First = 1, Rest = [2, 3]" },
        { type: "heading", text: "Pattern matching & case" },
        { type: "p", text: "`=` is not assignment — it is **pattern matching**. The left side is a pattern matched against the right; if it matches, any unbound variables get bound. This is the core control-flow tool, used in `case`, in function heads, everywhere." },
        { type: "code", lang: "erlang", code: "% destructure by matching shapes\n{ok, Payload} = {ok, \"data\"}.   %% binds Payload = \"data\"\n\n% case matches a value against clauses top to bottom\nclassify(N) ->\n    case N of\n        0            -> zero;\n        N when N > 0 -> positive;   %% 'when' adds a guard\n        _            -> negative     %% _ is the catch-all\n    end." },
        { type: "heading", text: "A module" },
        { type: "p", text: "Code lives in **modules**. `-module` names it, `-export` lists the public functions as `Name/Arity` (arity = number of arguments; it's part of a function's identity on the BEAM). Multiple function clauses with different patterns replace `if`/loops." },
        { type: "code", lang: "erlang", code: "-module(math_utils).\n-export([factorial/1]).\n\n% two clauses; the VM tries them top-down by pattern\nfactorial(0) -> 1;\nfactorial(N) when N > 0 ->\n    N * factorial(N - 1)." },
        { type: "heading", text: "Processes: spawn, send (!), receive" },
        { type: "p", text: "Concurrency primitives are in the language itself. `spawn` starts a process running a function and returns its **pid** (process id). `Pid ! Message` sends an (immutable, copied) message to that process's mailbox. `receive` blocks, pattern-matches the mailbox, and handles messages." },
        { type: "code", lang: "erlang", code: "-module(echo).\n-export([start/0, loop/0]).\n\nstart() ->\n    Pid = spawn(echo, loop, []),   %% spawn a process running loop/0\n    Pid ! {self(), \"hello\"},        %% send it a message (self() = my pid)\n    receive                          %% wait for the reply\n        {reply, Text} -> io:format(\"got: ~s~n\", [Text])\n    end.\n\nloop() ->\n    receive\n        {From, Text} ->\n            From ! {reply, Text},    %% echo it back\n            loop()                    %% tail-recurse to keep serving\n    end." },
        { type: "heading", text: "OTP: gen_server & supervisors" },
        { type: "p", text: "Writing raw `receive` loops for real servers is repetitive and error-prone, so OTP provides **behaviours**: `gen_server` is a generic server process (you fill in callbacks for handling calls/casts), and `supervisor` restarts children per a strategy. These two abstractions underpin nearly all production BEAM code — Elixir's `GenServer` and `Supervisor` are thin wrappers over the exact same Erlang behaviours." },
        { type: "heading", text: "Why Elixir exists" },
        { type: "p", text: "Erlang's runtime is world-class; its syntax and tooling felt dated. Elixir keeps the VM and adds: a familiar, extensible syntax; a real **macro** system (metaprogramming, so Phoenix/Ecto DSLs read beautifully); first-class tooling (**Mix** build tool, **Hex** package manager, docs, formatter, testing); protocols and polymorphism; and modern data structures. Crucially the interop is **zero-cost** — Elixir atoms, tuples and lists *are* Erlang's, so you call any Erlang module directly:" },
        { type: "code", lang: "elixir", code: "# calling Erlang stdlib from Elixir: modules are :lowercase atoms\nhash = :crypto.hash(:sha256, \"password\")   # Erlang's :crypto\nnow  = :calendar.local_time()               # Erlang's :calendar\nrand = :rand.uniform(100)                    # Erlang's :rand\n# no bindings, no FFI — same VM, same data types" },
        { type: "callout", variant: "tip", text: "Rule of thumb: if you need a low-level building block, check whether Erlang's stdlib (`:crypto`, `:ets`, `:queue`, `:timer`, `:os`) already has it. Reaching into `:erlang_module` from Elixir is idiomatic, not a hack." }
      ]
    },

    {
      id: "elixir-essentials",
      title: "Elixir essentials",
      level: "core",
      body: [
        { type: "p", text: "Elixir is functional and immutable: you never mutate data, you transform it into new data. The three tools you'll use constantly are **pattern matching**, the **pipe operator**, and **modules of small functions**." },
        { type: "heading", text: "Modules & functions" },
        { type: "p", text: "`def` defines a public function, `defp` a private one. Functions have multiple clauses matched by pattern and refined by **guards** (`when`). The last expression is the return value — no `return` keyword." },
        { type: "code", lang: "elixir", code: "defmodule Account do\n  # multiple clauses: the VM picks the first matching head\n  def describe(%{balance: b}) when b < 0, do: \"overdrawn by #{abs(b)}\"\n  def describe(%{balance: 0}),           do: \"empty\"\n  def describe(%{balance: b}),           do: \"balance: #{b}\"\n\n  defp cents_to_dollars(c), do: c / 100   # private helper\nend" },
        { type: "heading", text: "Immutability & pattern matching everywhere" },
        { type: "p", text: "`=` is the **match operator**, not assignment — same as Erlang. Rebinding a name creates a *new* binding; it never mutates the old data. Pattern matching destructures in function heads, in `=`, in `case`, in `for`, in `with`." },
        { type: "code", lang: "elixir", code: "{:ok, value} = {:ok, 42}          # binds value = 42\n[first | rest] = [1, 2, 3]         # first = 1, rest = [2, 3]\n%{name: n} = %{name: \"Ada\", age: 36}  # pull one key out\n\n# the pin operator ^ matches against an existing value instead of rebinding\nexpected = 200\n^expected = response_status         # matches only if status == 200" },
        { type: "heading", text: "Core data types" },
        { type: "list", items: [
          "**Atoms** — `:ok`, `:error`, `:user` — named constants; the building blocks of tagged tuples like `{:ok, result}`.",
          "**Tuples** — `{:ok, value}` — fixed size, fast random access; the idiomatic way to return success/failure.",
          "**Lists** — `[1, 2, 3]` — linked lists, cheap to prepend, O(n) to access by index.",
          "**Maps** — `%{key: v}` or `%{\"str\" => v}` — the general key/value store.",
          "**Keyword lists** — `[timeout: 5000, retries: 3]` — a list of `{atom, value}` tuples, used for optional function options.",
          "**Structs** — `%User{name: \"Ada\"}` — maps with a fixed set of keys and a named type; defined with `defstruct`."
        ] },
        { type: "heading", text: "The pipe operator |>" },
        { type: "p", text: "`|>` passes the value on its left as the **first argument** of the function on its right. It turns nested calls inside-out into a top-to-bottom pipeline that reads like a recipe — the single most recognizable Elixir idiom." },
        { type: "code", lang: "elixir", code: "# without pipes: read inside-out, painful\nresult = Enum.sum(Enum.map(Enum.filter(1..10, &(rem(&1, 2) == 0)), &(&1 * &1)))\n\n# with pipes: read top to bottom\nresult =\n  1..10\n  |> Enum.filter(&(rem(&1, 2) == 0))   # keep evens -> [2,4,6,8,10]\n  |> Enum.map(&(&1 * &1))              # square them -> [4,16,36,64,100]\n  |> Enum.sum()                        # -> 220\n\n# &(...) is the capture shorthand for an anonymous fn; &1 is its first arg" },
        { type: "heading", text: "with: chaining the happy path" },
        { type: "p", text: "`with` chains a series of pattern matches; it proceeds only while each matches, and short-circuits to the `else` (returning the non-matching value) on the first failure. It's the clean way to sequence several operations that each return `{:ok, _}` or `{:error, _}` without a pyramid of nested `case`." },
        { type: "code", lang: "elixir", code: "def publish(user_id, params) do\n  with {:ok, user}  <- fetch_user(user_id),\n       :ok          <- authorize(user, :publish),\n       {:ok, post}  <- create_post(user, params),\n       {:ok, _mail} <- notify_followers(post) do\n    {:ok, post}\n  else\n    {:error, :not_found} -> {:error, \"user missing\"}\n    {:error, reason}     -> {:error, reason}\n  end\nend" },
        { type: "heading", text: "Comprehensions with for" },
        { type: "code", lang: "elixir", code: "# generators + filters + a body\nfor n <- 1..20, rem(n, 3) == 0, do: n * n   # [9, 36, 81, 144, 225, 324]\n\n# multiple generators (cartesian) and :into to build a map\nfor x <- [1, 2], y <- [:a, :b], into: %{}, do: {x, y}\n# => %{1 => :b, 2 => :b}  (later keys win)" },
        { type: "callout", variant: "tip", text: "Idiomatic Elixir returns **tagged tuples** — `{:ok, value}` / `{:error, reason}` — from anything that can fail, and lets the caller pattern-match. Functions that raise on failure get a `!` suffix by convention (`File.read/1` vs `File.read!/1`)." }
      ]
    },

    {
      id: "processes-otp",
      title: "Processes, GenServer & OTP",
      level: "core",
      body: [
        { type: "p", text: "This is *the* backend concept. State in Elixir doesn't live in mutable variables — it lives **inside a process** whose recursive loop threads the state along. OTP wraps that pattern in reusable behaviours so you write callbacks, not raw `receive` loops." },
        { type: "heading", text: "GenServer: a stateful server process" },
        { type: "p", text: "A **GenServer** is a process that holds state and responds to messages via callbacks. **`handle_call`** answers *synchronous* requests (caller waits for a reply). **`handle_cast`** handles *asynchronous* fire-and-forget messages. **`handle_info`** handles everything else (raw messages, timers, monitors). You typically wrap the raw message-passing in a clean **client API** so callers never touch `GenServer.call` directly." },
        { type: "code", lang: "elixir", code: "defmodule Bank.Account do\n  use GenServer\n\n  # ---- Client API (runs in the CALLER's process) ----\n  def start_link(opts) do\n    name = Keyword.fetch!(opts, :name)\n    GenServer.start_link(__MODULE__, 0, name: name)\n  end\n\n  def balance(acct),         do: GenServer.call(acct, :balance)\n  def deposit(acct, amount), do: GenServer.cast(acct, {:deposit, amount})\n  def withdraw(acct, amount), do: GenServer.call(acct, {:withdraw, amount})\n\n  # ---- Server callbacks (run INSIDE the GenServer process) ----\n  @impl true\n  def init(initial_balance), do: {:ok, initial_balance}\n\n  @impl true\n  def handle_call(:balance, _from, balance) do\n    {:reply, balance, balance}          # {:reply, value_to_caller, new_state}\n  end\n\n  def handle_call({:withdraw, amount}, _from, balance) when amount <= balance do\n    {:reply, :ok, balance - amount}\n  end\n  def handle_call({:withdraw, _amount}, _from, balance) do\n    {:reply, {:error, :insufficient_funds}, balance}\n  end\n\n  @impl true\n  def handle_cast({:deposit, amount}, balance) do\n    {:noreply, balance + amount}        # no reply; just update state\n  end\n\n  @impl true\n  def handle_info(:tick, balance) do    # e.g. from Process.send_after/3\n    {:noreply, balance}\n  end\nend" },
        { type: "code", lang: "elixir", code: "{:ok, _pid} = Bank.Account.start_link(name: :alice)\nBank.Account.deposit(:alice, 100)   # async cast\nBank.Account.balance(:alice)         # => 100 (sync call)\nBank.Account.withdraw(:alice, 40)    # => :ok\nBank.Account.withdraw(:alice, 999)   # => {:error, :insufficient_funds}" },
        { type: "callout", variant: "note", text: "`call` **blocks** the caller until the server replies (default 5s timeout) and thus applies back-pressure; `cast` returns immediately and gives no guarantee it was handled. Use `call` when you need the result or the back-pressure; use `cast` for pure fire-and-forget." },
        { type: "heading", text: "Supervisors & supervision trees" },
        { type: "p", text: "A **Supervisor** starts and monitors child processes; if a child crashes, it restarts it according to a **strategy**. Supervisors are nested into a **supervision tree** rooted at your Application, so a well-designed app self-heals: transient failures are absorbed by restarting a small subtree from clean state." },
        { type: "code", lang: "elixir", code: "defmodule MyApp.Application do\n  use Application\n\n  @impl true\n  def start(_type, _args) do\n    children = [\n      MyApp.Repo,                         # the Ecto database process\n      {Phoenix.PubSub, name: MyApp.PubSub},\n      {Bank.Account, name: :alice},       # our GenServer\n      MyAppWeb.Endpoint                   # the Phoenix web server\n    ]\n\n    # one_for_one: if a child dies, restart ONLY that child\n    Supervisor.start_link(children, strategy: :one_for_one, name: MyApp.Supervisor)\n  end\nend" },
        { type: "table", headers: ["Strategy", "On a child crash"], rows: [
          ["`:one_for_one`", "Restart only the crashed child (the common default)."],
          ["`:one_for_all`", "Restart *all* children (use when they depend on each other)."],
          ["`:rest_for_one`", "Restart the crashed child and any started *after* it."]
        ] },
        { type: "heading", text: "Task, Agent & Registry" },
        { type: "list", items: [
          "**`Task`** — run work concurrently. `Task.async/1` + `Task.await/1` for a result, `Task.start/1` for fire-and-forget, `Task.async_stream/3` to map over a collection in parallel with bounded concurrency.",
          "**`Agent`** — a tiny wrapper around a process for simple shared state, when you don't need the full GenServer callback surface.",
          "**`Registry`** — a fast, built-in process registry to look up/dispatch to processes by key (e.g. one GenServer per chat room, found by room id). Also powers `:via` tuples for naming dynamic processes.",
          "**`DynamicSupervisor`** — a supervisor for children started on demand at runtime (e.g. spawn a worker per connected user)."
        ] },
        { type: "code", lang: "elixir", code: "# parallel fan-out with Task, bounded to the schedulers\n[\"a.com\", \"b.com\", \"c.com\"]\n|> Task.async_stream(&fetch_status/1, max_concurrency: 10, timeout: 8_000)\n|> Enum.map(fn {:ok, status} -> status end)\n\n# Agent for trivial shared state\n{:ok, agent} = Agent.start_link(fn -> %{} end)\nAgent.update(agent, &Map.put(&1, :hits, 1))\nAgent.get(agent, & &1)   # => %{hits: 1}" },
        { type: "callout", variant: "good", text: "\"Let it crash\" in practice: don't wrap every call in try/rescue. Write the happy path, keep risky state in a supervised process, and let the supervisor restart it clean. Reserve rescue for errors you can *meaningfully* recover from right here." }
      ]
    },

    {
      id: "mix-setup",
      title: "Mix, project layout & running Phoenix",
      level: "core",
      body: [
        { type: "p", text: "**Mix** is Elixir's build tool and task runner — compile, test, manage deps, run generators, and custom tasks. **Hex** is the package registry it pulls from. Phoenix ships as a Mix archive that adds the `phx.new` generator." },
        { type: "code", lang: "bash", code: "# one-time: install the Phoenix project generator\nmix archive.install hex phx_new\n\n# create a new app (--live scaffolds LiveView; add --database sqlite3 etc.)\nmix phx.new my_app\ncd my_app\n\nmix deps.get              # fetch dependencies into deps/\nmix ecto.create           # create the database\nmix phx.server            # start the web server on http://localhost:4000\niex -S mix phx.server     # ...the same, but inside an interactive IEx shell" },
        { type: "heading", text: "Project layout" },
        { type: "p", text: "Phoenix splits your code into a **business/domain layer** and a **web layer** on purpose — the web layer is just one interface to your application's core." },
        { type: "table", headers: ["Path", "What lives there"], rows: [
          ["`lib/my_app/`", "Business logic: **contexts**, Ecto schemas, GenServers, domain modules. No web concerns."],
          ["`lib/my_app_web/`", "Web layer: router, controllers, LiveViews, components, templates, plugs, JSON views."],
          ["`lib/my_app/application.ex`", "The OTP supervision tree — what starts when the app boots."],
          ["`config/`", "`config.exs` (compile-time), `dev/test/prod.exs`, and `runtime.exs` (runtime)."],
          ["`priv/repo/migrations/`", "Ecto database migrations."],
          ["`mix.exs`", "Project definition: deps, app name, OTP application module, aliases."],
          ["`test/`", "ExUnit tests mirroring the lib structure."]
        ] },
        { type: "code", lang: "elixir", code: "# mix.exs — dependencies are a list of tuples\ndefp deps do\n  [\n    {:phoenix, \"~> 1.7.14\"},\n    {:phoenix_live_view, \"~> 1.0\"},\n    {:ecto_sql, \"~> 3.12\"},\n    {:postgrex, \">= 0.0.0\"},\n    {:bcrypt_elixir, \"~> 3.1\"},\n    {:jason, \"~> 1.4\"},\n    {:oban, \"~> 2.18\"}\n  ]\nend" },
        { type: "callout", variant: "tip", text: "`iex -S mix` boots your whole app inside a REPL — you can call any function, inspect running processes with `:observer.start()`, and hot-reload. It's the single most productive tool in the Elixir workflow." }
      ]
    },

    {
      id: "phoenix-contexts",
      title: "Contexts: the app's public API",
      level: "core",
      body: [
        { type: "p", text: "A **context** is a plain Elixir module that groups related functionality behind a clear API — Phoenix's take on **bounded contexts**. `Accounts`, `Billing`, `Catalog` are contexts. The rule: the **web layer talks to contexts, never to `Repo` or schemas directly**. Controllers and LiveViews call `Accounts.create_user/1`; they don't build Ecto queries. This keeps business logic reusable, testable in isolation, and swappable behind a stable interface." },
        { type: "code", lang: "bash", code: "# generate a context + schema + migration in one shot\nmix phx.gen.context Accounts User users \\\n    name:string email:string:unique age:integer\n# creates: lib/my_app/accounts.ex        (the context, public functions)\n#          lib/my_app/accounts/user.ex   (the Ecto schema)\n#          priv/repo/migrations/..._create_users.exs" },
        { type: "code", lang: "elixir", code: "defmodule MyApp.Accounts do\n  @moduledoc \"The Accounts context: the public API for users.\"\n  import Ecto.Query, warn: false\n  alias MyApp.Repo\n  alias MyApp.Accounts.User\n\n  def list_users, do: Repo.all(User)\n\n  def get_user!(id), do: Repo.get!(User, id)\n\n  def get_user_by_email(email), do: Repo.get_by(User, email: email)\n\n  def create_user(attrs) do\n    %User{}\n    |> User.changeset(attrs)\n    |> Repo.insert()          # => {:ok, user} | {:error, changeset}\n  end\n\n  def update_user(%User{} = user, attrs) do\n    user |> User.changeset(attrs) |> Repo.update()\n  end\n\n  def delete_user(%User{} = user), do: Repo.delete(user)\n\n  # domain logic belongs here too, not in the controller\n  def active_adults do\n    from(u in User, where: u.age >= 18, order_by: u.name) |> Repo.all()\n  end\nend" },
        { type: "callout", variant: "good", text: "The payoff: your controller/LiveView becomes a thin translator between HTTP and `Accounts.*`. Swapping HTTP for a GraphQL API, a CLI, or a background job means reusing the *same* context functions — the business rules live in exactly one place." },
        { type: "callout", variant: "gotcha", text: "Don't over-slice early. It's fine to start with a couple of broad contexts and split later. But resist the temptation to `import Ecto.Query` and run `Repo` calls straight from a controller — that's the leak that erodes the whole design." }
      ]
    },

    {
      id: "ecto",
      title: "Ecto: schemas, changesets & queries",
      level: "core",
      body: [
        { type: "p", text: "**Ecto** is the database toolkit — not a classic ORM but a set of composable pieces: **schemas** (map tables to structs), **changesets** (cast + validate input), **`Repo`** (the process that talks to the DB), and **`Ecto.Query`** (a composable query DSL). It's explicit by design: nothing is loaded or saved by magic." },
        { type: "heading", text: "Schema & changeset" },
        { type: "p", text: "A **changeset** is Ecto's killer feature: it captures a set of changes to apply, casting external params to typed fields, running validations, and collecting errors — *before* touching the database. Invalid data never reaches your table." },
        { type: "code", lang: "elixir", code: "defmodule MyApp.Accounts.User do\n  use Ecto.Schema\n  import Ecto.Changeset\n\n  schema \"users\" do\n    field :name, :string\n    field :email, :string\n    field :age, :integer\n    field :password, :string, virtual: true   # not stored\n    field :password_hash, :string\n\n    has_many :posts, MyApp.Blog.Post\n    timestamps(type: :utc_datetime)            # inserted_at / updated_at\n  end\n\n  def changeset(user, attrs) do\n    user\n    |> cast(attrs, [:name, :email, :age, :password])   # whitelist fields\n    |> validate_required([:name, :email])\n    |> validate_format(:email, ~r/@/)\n    |> validate_number(:age, greater_than_or_equal_to: 0)\n    |> unique_constraint(:email)              # backed by a DB unique index\n  end\nend" },
        { type: "heading", text: "Migrations" },
        { type: "code", lang: "elixir", code: "defmodule MyApp.Repo.Migrations.CreateUsers do\n  use Ecto.Migration\n\n  def change do\n    create table(:users) do\n      add :name, :string, null: false\n      add :email, :string, null: false\n      add :age, :integer\n      add :password_hash, :string\n      timestamps(type: :utc_datetime)\n    end\n\n    create unique_index(:users, [:email])   # enforces unique_constraint above\n  end\nend" },
        { type: "code", lang: "bash", code: "mix ecto.gen.migration add_posts   # create an empty migration file\nmix ecto.migrate                    # run pending migrations\nmix ecto.rollback                   # undo the last migration\nmix ecto.reset                      # drop, create, migrate, seed" },
        { type: "heading", text: "Querying: keyword & pipe syntax" },
        { type: "p", text: "`Ecto.Query` composes safely (parameters are always bound, never string-interpolated, so SQL injection isn't a concern). Two equivalent styles: a **keyword** form (`from x in T, where: ...`) and a **pipe/macro** form you build up with `|>`." },
        { type: "code", lang: "elixir", code: "import Ecto.Query\nalias MyApp.{Repo, Accounts.User}\n\n# keyword syntax\nquery =\n  from u in User,\n    where: u.age >= 18 and not is_nil(u.email),\n    order_by: [desc: u.inserted_at],\n    select: %{id: u.id, name: u.name},\n    limit: 20\n\nRepo.all(query)\n\n# pipe syntax — great for building queries conditionally\ndef search(term) do\n  User\n  |> where([u], ilike(u.name, ^\"%#{term}%\"))   # ^ pins a runtime value\n  |> order_by([u], asc: u.name)\n  |> Repo.all()\nend" },
        { type: "heading", text: "Associations & preload" },
        { type: "p", text: "Associations are **not** loaded automatically (no lazy loading — that's deliberate, to avoid hidden N+1 queries). You explicitly `preload` what you need, which Ecto fetches in one extra query." },
        { type: "code", lang: "elixir", code: "# schema side\nschema \"posts\" do\n  field :title, :string\n  belongs_to :user, MyApp.Accounts.User   # adds user_id\nend\n\n# preload in a query (one query for users, one for their posts)\nusers = Repo.all(from u in User, preload: [:posts])\n\n# or preload an already-loaded struct\nuser = Repo.get!(User, id) |> Repo.preload(:posts)\nEnum.map(user.posts, & &1.title)" },
        { type: "heading", text: "Transactions & Ecto.Multi" },
        { type: "p", text: "For multi-step writes that must all succeed or all roll back, use **`Ecto.Multi`** — it composes operations into one atomic transaction and reports *which* step failed." },
        { type: "code", lang: "elixir", code: "alias Ecto.Multi\n\ndef transfer(from_id, to_id, amount) do\n  Multi.new()\n  |> Multi.update(:debit,  debit_changeset(from_id, amount))\n  |> Multi.update(:credit, credit_changeset(to_id, amount))\n  |> Multi.insert(:ledger, ledger_changeset(from_id, to_id, amount))\n  |> Repo.transaction()\n  |> case do\n    {:ok, %{ledger: entry}}        -> {:ok, entry}\n    {:error, step, changeset, _}   -> {:error, step, changeset}\n  end\nend" },
        { type: "callout", variant: "warn", text: "`Repo.insert/1` returns `{:ok, struct}` **or** `{:error, changeset}` — it does not raise. You MUST handle both. The bang versions (`Repo.insert!/1`) raise on failure; use them only where a failure is truly exceptional." }
      ]
    },

    {
      id: "router-controllers",
      title: "Router, controllers & the conn",
      level: "core",
      body: [
        { type: "p", text: "Every request flows through the **router**, down a **pipeline** of plugs, into a **controller action**, which uses the `conn` (connection struct) and returns it. The `conn` carries everything about the request/response and is transformed step by step — a plug pipeline in the purest sense." },
        { type: "heading", text: "The router" },
        { type: "p", text: "`scope` groups routes under a path/module prefix, `pipe_through` applies a pipeline of plugs to them, and `resources` expands to the standard RESTful routes (index/show/new/create/edit/update/delete)." },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.Router do\n  use MyAppWeb, :router\n\n  pipeline :browser do\n    plug :accepts, [\"html\"]\n    plug :fetch_session\n    plug :fetch_live_flash\n    plug :protect_from_forgery       # CSRF protection\n    plug :put_secure_browser_headers\n  end\n\n  pipeline :api do\n    plug :accepts, [\"json\"]\n  end\n\n  scope \"/\", MyAppWeb do\n    pipe_through :browser\n    get \"/\", PageController, :home\n    resources \"/users\", UserController   # -> 7 RESTful routes\n  end\n\n  scope \"/api\", MyAppWeb do\n    pipe_through :api\n    resources \"/posts\", PostController, only: [:index, :show, :create]\n  end\nend" },
        { type: "callout", variant: "tip", text: "Run `mix phx.routes` to print every route, its HTTP verb, path, and the controller/action it dispatches to. Indispensable when debugging routing." },
        { type: "heading", text: "A controller (JSON API)" },
        { type: "p", text: "A controller is a module of **actions** — functions of `(conn, params)` that return a `conn`. Actions call the **context** for data and then render. Note how it delegates all business logic to `Accounts`." },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.UserController do\n  use MyAppWeb, :controller\n  alias MyApp.Accounts\n\n  def index(conn, _params) do\n    users = Accounts.list_users()\n    json(conn, %{data: Enum.map(users, &user_json/1)})\n  end\n\n  def show(conn, %{\"id\" => id}) do\n    user = Accounts.get_user!(id)     # raises 404 if missing (via FallbackController)\n    json(conn, %{data: user_json(user)})\n  end\n\n  def create(conn, %{\"user\" => params}) do\n    case Accounts.create_user(params) do\n      {:ok, user} ->\n        conn\n        |> put_status(:created)\n        |> put_resp_header(\"location\", ~p\"/api/users/#{user.id}\")\n        |> json(%{data: user_json(user)})\n\n      {:error, changeset} ->\n        conn\n        |> put_status(:unprocessable_entity)\n        |> json(%{errors: translate_errors(changeset)})\n    end\n  end\n\n  defp user_json(u), do: %{id: u.id, name: u.name, email: u.email}\nend" },
        { type: "heading", text: "Rendering HTML" },
        { type: "p", text: "For HTML responses, `render(conn, :index, users: users)` renders a HEEx template via the controller's paired **HTML module**. Phoenix 1.7 uses function components (`~H`) rather than the old separate view/template split." },
        { type: "code", lang: "elixir", code: "def index(conn, _params) do\n  render(conn, :index, users: Accounts.list_users())\nend\n# renders MyAppWeb.UserHTML.index/1  (a function component using ~H)" }
      ]
    },

    {
      id: "plugs",
      title: "Plugs: composable middleware",
      level: "core",
      body: [
        { type: "p", text: "**Plug** is the specification the whole HTTP layer is built on: a plug is anything that takes a `conn` and options and returns a (transformed) `conn`. Both Phoenix pipelines and individual endpoints are just plugs composed together. There are two flavours." },
        { type: "list", items: [
          "**Function plug** — a plain function `plug(conn, opts) :: conn`. Great for small, local steps referenced by name in a pipeline.",
          "**Module plug** — a module implementing `init/1` (compile-time option prep) and `call/2` (per-request logic). Reusable across apps and configurable."
        ] },
        { type: "code", lang: "elixir", code: "# A module plug: require an API key, or HALT the pipeline.\ndefmodule MyAppWeb.Plugs.RequireApiKey do\n  import Plug.Conn\n\n  def init(opts), do: opts        # runs once at compile time\n\n  def call(conn, _opts) do        # runs on every request\n    case get_req_header(conn, \"x-api-key\") do\n      [key] -> if valid?(key), do: conn, else: unauthorized(conn)\n      _     -> unauthorized(conn)\n    end\n  end\n\n  defp unauthorized(conn) do\n    conn\n    |> put_status(:unauthorized)\n    |> Phoenix.Controller.json(%{error: \"invalid api key\"})\n    |> halt()                     # STOP: downstream plugs/action won't run\n  end\n\n  defp valid?(key), do: key == Application.fetch_env!(:my_app, :api_key)\nend" },
        { type: "callout", variant: "gotcha", text: "The crucial primitive is **`halt/1`**. A plug that rejects a request must call `halt(conn)` — otherwise Phoenix keeps walking the pipeline and eventually runs the controller action anyway, defeating your guard. `halt` + a response is the pattern for auth/rate-limit/validation plugs." },
        { type: "code", lang: "elixir", code: "# wire the module plug into an API pipeline in the router\npipeline :authenticated_api do\n  plug :accepts, [\"json\"]\n  plug MyAppWeb.Plugs.RequireApiKey       # module plug\n  plug :put_request_id                    # a local function plug\nend\n\n# a function plug defined right in the router\ndefp put_request_id(conn, _opts) do\n  Plug.Conn.put_resp_header(conn, \"x-request-id\", Ecto.UUID.generate())\nend" }
      ]
    },

    {
      id: "auth",
      title: "Authentication with phx.gen.auth",
      level: "core",
      body: [
        { type: "p", text: "Phoenix ships a first-party auth generator, **`mix phx.gen.auth`**, that scaffolds complete, secure, session-based authentication — not a library dependency but generated code you own and can edit. It's the recommended starting point for user accounts." },
        { type: "code", lang: "bash", code: "mix phx.gen.auth Accounts User users\nmix deps.get        # pulls in bcrypt_elixir (password hashing)\nmix ecto.migrate" },
        { type: "heading", text: "What it generates" },
        { type: "list", items: [
          "**`User` schema + changesets** — registration, email change, and password change changesets with secure **bcrypt** hashing and validations.",
          "**`UserToken` schema** — hashed session and email-confirmation/reset tokens stored in the DB.",
          "**Registration, session, settings, confirmation & reset controllers** (or LiveViews) with their templates.",
          "**`fetch_current_user` plug** — reads the session token, loads the user, and assigns `conn.assigns.current_user` on every request.",
          "**`require_authenticated_user` plug** — redirects to the login page (and halts) if no user is signed in.",
          "**Router `scope`s** wired with the right pipelines, plus `redirect_if_user_is_authenticated` for login/register pages."
        ] },
        { type: "heading", text: "Protecting routes" },
        { type: "code", lang: "elixir", code: "scope \"/\", MyAppWeb do\n  pipe_through [:browser]\n  get \"/\", PageController, :home           # public\nend\n\nscope \"/\", MyAppWeb do\n  # this plug halts + redirects if nobody is logged in\n  pipe_through [:browser, :require_authenticated_user]\n\n  get \"/dashboard\", DashboardController, :index\n  resources \"/settings\", SettingsController\nend" },
        { type: "code", lang: "elixir", code: "# in a controller, the current user is already assigned by the plug\ndef index(conn, _params) do\n  user = conn.assigns.current_user\n  render(conn, :index, projects: MyApp.Projects.for_user(user))\nend" },
        { type: "callout", variant: "note", text: "The generator's sessions are cookie-backed and token-verified. Because it's *your* code, you extend it freely — add roles, 2FA, OAuth — instead of fighting a black-box auth library. For pure token APIs, many teams pair this with `Guardian` (JWT) or issue their own signed tokens." }
      ]
    },

    {
      id: "liveview",
      title: "Phoenix LiveView: real-time UI, no JS",
      level: "core",
      body: [
        { type: "p", text: "**LiveView** is Phoenix's answer to the SPA. The UI is rendered on the **server**, held as stateful process state, and streamed to the browser over a **WebSocket**. When state changes, LiveView computes a minimal diff and pushes only what changed — the browser patches the DOM. You get rich, real-time interactivity **without writing custom JavaScript**, and your logic stays in Elixir with full access to your contexts." },
        { type: "heading", text: "The lifecycle" },
        { type: "list", ordered: true, items: [
          "**`mount/3`** — runs first (once over HTTP for a fast first paint, then again when the WebSocket connects). Set initial state with `assign`.",
          "**`render/1`** (or a `~H` heredoc) — renders the current assigns to HEEx. Re-runs on every state change.",
          "**`handle_event/3`** — handles browser events (`phx-click`, `phx-submit`, `phx-change`) and updates assigns.",
          "**`handle_info/2`** — handles server-side messages (PubSub broadcasts, timers) to push live updates."
        ] },
        { type: "heading", text: "A counter" },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.CounterLive do\n  use MyAppWeb, :live_view\n\n  def mount(_params, _session, socket) do\n    {:ok, assign(socket, count: 0)}\n  end\n\n  def handle_event(\"inc\", _params, socket) do\n    {:noreply, update(socket, :count, &(&1 + 1))}\n  end\n\n  def handle_event(\"dec\", _params, socket) do\n    {:noreply, update(socket, :count, &(&1 - 1))}\n  end\n\n  def render(assigns) do\n    ~H\"\"\"\n    <div class=\"counter\">\n      <button phx-click=\"dec\">-</button>\n      <span>{@count}</span>\n      <button phx-click=\"inc\">+</button>\n    </div>\n    \"\"\"\n  end\nend" },
        { type: "p", text: "The `~H` sigil is a **HEEx** (HTML+EEx) template: compile-time-checked HTML where `{@count}` interpolates an assign and `phx-click=\"inc\"` binds a click to `handle_event(\"inc\", ...)`. No fetch, no client state, no JSON API — the button click travels the socket, the server updates state and re-renders, and only the diff comes back." },
        { type: "heading", text: "A form with validation" },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.UserFormLive do\n  use MyAppWeb, :live_view\n  alias MyApp.Accounts\n  alias MyApp.Accounts.User\n\n  def mount(_params, _session, socket) do\n    changeset = Accounts.change_user(%User{})\n    {:ok, assign(socket, form: to_form(changeset))}\n  end\n\n  # phx-change: validate live on every keystroke\n  def handle_event(\"validate\", %{\"user\" => params}, socket) do\n    changeset =\n      %User{} |> Accounts.change_user(params) |> Map.put(:action, :validate)\n    {:noreply, assign(socket, form: to_form(changeset))}\n  end\n\n  # phx-submit: actually create\n  def handle_event(\"save\", %{\"user\" => params}, socket) do\n    case Accounts.create_user(params) do\n      {:ok, user} ->\n        {:noreply,\n         socket\n         |> put_flash(:info, \"User created\")\n         |> push_navigate(to: ~p\"/users/#{user.id}\")}   # live navigation\n\n      {:error, changeset} ->\n        {:noreply, assign(socket, form: to_form(changeset))}\n    end\n  end\n\n  def render(assigns) do\n    ~H\"\"\"\n    <.form for={@form} phx-change=\"validate\" phx-submit=\"save\">\n      <.input field={@form[:name]} label=\"Name\" />\n      <.input field={@form[:email]} label=\"Email\" />\n      <.button>Save</.button>\n    </.form>\n    \"\"\"\n  end\nend" },
        { type: "callout", variant: "good", text: "`push_navigate`/`push_patch` do **live navigation**: they swap LiveViews (or update params) over the existing socket without a full page reload, keeping the SPA feel while all logic stays server-side." },
        { type: "callout", variant: "warn", text: "Every connected LiveView is a **stateful process on your server**, holding its assigns in memory for the life of the connection. That's what makes it real-time — but it also means UI state costs server RAM per connection. Keep assigns lean; use `stream`s for large collections instead of holding thousands of rows in `assign`." }
      ]
    },

    {
      id: "pubsub-channels",
      title: "PubSub & Channels: real-time broadcast",
      level: "core",
      body: [
        { type: "p", text: "Real-time features (chat, notifications, live presence, dashboards) need one part of the system to **broadcast** and many others to **receive**. Phoenix gives you two tools: **`Phoenix.PubSub`** (a fast, distributed publish/subscribe bus that works across a cluster) and **Channels** (a higher-level, bidirectional WebSocket abstraction for custom JS/mobile clients)." },
        { type: "heading", text: "PubSub basics" },
        { type: "p", text: "A process **subscribes** to a topic string; anyone can **broadcast** a message to that topic and every subscriber's mailbox receives it (delivered via `handle_info`). PubSub is topic-based and cluster-aware — broadcast on node A reaches subscribers on node B automatically." },
        { type: "code", lang: "elixir", code: "# subscribe (e.g. inside a GenServer or LiveView mount)\nPhoenix.PubSub.subscribe(MyApp.PubSub, \"room:42\")\n\n# broadcast from anywhere — a context function, a controller, a job\nPhoenix.PubSub.broadcast(MyApp.PubSub, \"room:42\",\n  {:new_message, %{user: \"ada\", body: \"hi\"}})" },
        { type: "heading", text: "LiveView + PubSub: pushing live updates" },
        { type: "p", text: "The most common pattern: a LiveView subscribes on connect, a context broadcasts when data changes, and each subscribed LiveView receives it in `handle_info` and updates its assigns — so every open browser updates instantly." },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.RoomLive do\n  use MyAppWeb, :live_view\n\n  def mount(%{\"id\" => id}, _session, socket) do\n    if connected?(socket) do\n      Phoenix.PubSub.subscribe(MyApp.PubSub, \"room:#{id}\")\n    end\n    {:ok, assign(socket, id: id, messages: Chat.recent(id))}\n  end\n\n  # user submits the form -> persist + broadcast to everyone in the room\n  def handle_event(\"send\", %{\"body\" => body}, socket) do\n    {:ok, msg} = Chat.create_message(socket.assigns.id, body)\n    Phoenix.PubSub.broadcast(MyApp.PubSub, \"room:#{socket.assigns.id}\",\n      {:new_message, msg})\n    {:noreply, socket}\n  end\n\n  # arrives in EVERY subscribed LiveView (including the sender)\n  def handle_info({:new_message, msg}, socket) do\n    {:noreply, update(socket, :messages, &(&1 ++ [msg]))}\n  end\nend" },
        { type: "heading", text: "Channels (for non-LiveView clients)" },
        { type: "p", text: "When your client is a mobile app or custom JS (not a LiveView), **Channels** give a bidirectional messaging API over the same socket. A `Channel` module handles `join/3` and `handle_in/3`, and pushes with `broadcast!`. LiveView is preferred for web UIs; Channels shine for native/third-party clients." },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.RoomChannel do\n  use Phoenix.Channel\n\n  def join(\"room:\" <> _id, _params, socket), do: {:ok, socket}\n\n  def handle_in(\"new_msg\", %{\"body\" => body}, socket) do\n    broadcast!(socket, \"new_msg\", %{body: body})   # to all joined clients\n    {:noreply, socket}\n  end\nend" },
        { type: "callout", variant: "tip", text: "**`Phoenix.Presence`** builds on PubSub to track who is online per topic (join/leave, metadata) with conflict-free replicated state across the cluster — the standard way to build \"3 users viewing this page\" indicators." }
      ]
    },

    {
      id: "testing",
      title: "Testing with ExUnit",
      level: "deep",
      body: [
        { type: "p", text: "**ExUnit** is the built-in test framework — fast, concurrent, and integrated with Mix (`mix test`). Phoenix adds `ConnTest` for controllers, `LiveViewTest` for LiveViews, and a **SQL sandbox** so each test runs in its own transaction that's rolled back afterward, letting tests run concurrently without stepping on shared data." },
        { type: "heading", text: "Testing a context" },
        { type: "code", lang: "elixir", code: "defmodule MyApp.AccountsTest do\n  use MyApp.DataCase, async: true      # DataCase sets up the SQL sandbox\n  alias MyApp.Accounts\n\n  test \"create_user/1 with valid data\" do\n    assert {:ok, user} = Accounts.create_user(%{name: \"Ada\", email: \"a@x.io\"})\n    assert user.name == \"Ada\"\n  end\n\n  test \"create_user/1 rejects a missing email\" do\n    assert {:error, changeset} = Accounts.create_user(%{name: \"Ada\"})\n    assert %{email: [\"can't be blank\"]} = errors_on(changeset)\n  end\nend" },
        { type: "heading", text: "Testing a controller" },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.UserControllerTest do\n  use MyAppWeb.ConnCase, async: true\n\n  test \"GET /api/users returns json\", %{conn: conn} do\n    conn = get(conn, ~p\"/api/users\")\n    assert %{\"data\" => _} = json_response(conn, 200)\n  end\n\n  test \"POST /api/users with bad data returns 422\", %{conn: conn} do\n    conn = post(conn, ~p\"/api/users\", user: %{name: \"\"})\n    assert json_response(conn, 422)[\"errors\"]\n  end\nend" },
        { type: "heading", text: "Testing a LiveView" },
        { type: "code", lang: "elixir", code: "defmodule MyAppWeb.CounterLiveTest do\n  use MyAppWeb.ConnCase, async: true\n  import Phoenix.LiveViewTest\n\n  test \"clicking + increments\", %{conn: conn} do\n    {:ok, view, html} = live(conn, ~p\"/counter\")\n    assert html =~ \"<span>0</span>\"\n\n    # simulate a phx-click and assert the rendered result\n    assert render_click(view, :inc) =~ \"<span>1</span>\"\n  end\nend" },
        { type: "callout", variant: "tip", text: "`async: true` runs test *modules* in parallel across cores — a huge speedup safely enabled by the per-test SQL sandbox. Keep it on unless a test touches truly global state (e.g. a named singleton process)." }
      ]
    },

    {
      id: "deployment",
      title: "Deployment: releases, config & clustering",
      level: "deep",
      body: [
        { type: "p", text: "Production Elixir ships as a **release**: `mix release` bundles your compiled app, its deps, and a trimmed copy of the Erlang runtime (ERTS) into a self-contained artifact with start/stop/remote-console scripts. No Elixir install needed on the server." },
        { type: "code", lang: "bash", code: "MIX_ENV=prod mix release\n_build/prod/rel/my_app/bin/my_app start          # run it\n_build/prod/rel/my_app/bin/my_app remote          # attach an IEx console\n_build/prod/rel/my_app/bin/my_app eval \"MyApp.Release.migrate()\"" },
        { type: "heading", text: "Compile-time vs runtime config" },
        { type: "p", text: "This distinction bites everyone. `config/*.exs` (except runtime.exs) is evaluated at **compile time** and baked into the release — it *cannot* read production secrets. **`config/runtime.exs`** runs when the release **boots**, so it's where you read environment variables for DB URLs, secrets, and ports." },
        { type: "code", lang: "elixir", code: "# config/runtime.exs — evaluated at boot, reads the environment\nimport Config\n\nif config_env() == :prod do\n  database_url =\n    System.get_env(\"DATABASE_URL\") ||\n      raise \"DATABASE_URL is missing\"\n\n  config :my_app, MyApp.Repo,\n    url: database_url,\n    pool_size: String.to_integer(System.get_env(\"POOL_SIZE\") || \"10\")\n\n  config :my_app, MyAppWeb.Endpoint,\n    secret_key_base: System.fetch_env!(\"SECRET_KEY_BASE\"),\n    url: [host: System.get_env(\"PHX_HOST\"), port: 443, scheme: \"https\"],\n    http: [port: String.to_integer(System.get_env(\"PORT\") || \"4000\")]\nend" },
        { type: "heading", text: "Migrations on release" },
        { type: "p", text: "A release has no Mix, so you can't run `mix ecto.migrate` in prod. `phx.gen.release` generates a `MyApp.Release` module you invoke via `bin/my_app eval`." },
        { type: "code", lang: "elixir", code: "defmodule MyApp.Release do\n  @app :my_app\n\n  def migrate do\n    load_app()\n    for repo <- repos() do\n      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))\n    end\n  end\n\n  defp repos, do: Application.fetch_env!(@app, :ecto_repos)\n  defp load_app, do: Application.load(@app)\nend" },
        { type: "heading", text: "Docker & clustering" },
        { type: "list", items: [
          "**Docker** — multi-stage build: compile the release in an Elixir image, copy the self-contained release into a slim runtime image (Debian/Alpine). No Elixir needed in the final layer.",
          "**Clustering** — BEAM nodes connect natively. `libcluster` auto-discovers and connects nodes (Kubernetes, DNS, gossip), after which PubSub, Presence, and distributed processes span the cluster for free.",
          "**PaaS** — Fly.io and Gigalixir are BEAM-friendly and handle clustering + rolling deploys with little config."
        ] },
        { type: "callout", variant: "gotcha", text: "Set `SECRET_KEY_BASE`, `DATABASE_URL`, and `PHX_HOST` as real environment variables and read them in `runtime.exs`. Anything referenced only in `config/prod.exs` is frozen at build time — changing that env var in prod has no effect until you rebuild the release." }
      ]
    },

    {
      id: "headaches",
      title: "Common headaches & how to handle them",
      level: "deep",
      body: [
        { type: "p", text: "The BEAM removes many classic bugs but introduces its own failure modes. These are the ones that actually bite teams, with fixes." },
        { type: "heading", text: "1. A single GenServer becomes a bottleneck" },
        { type: "p", text: "A GenServer processes messages **one at a time**. Route all your traffic through one and every `call` **serializes** behind the others — you've built a global lock. This is the most common Elixir performance mistake." },
        { type: "code", lang: "elixir", code: "# WRONG: one GenServer holds ALL sessions; every read/write serializes\ndefmodule Sessions do\n  use GenServer\n  def get(id), do: GenServer.call(__MODULE__, {:get, id})   # bottleneck\n  def put(id, v), do: GenServer.call(__MODULE__, {:put, id, v})\nend\n\n# RIGHT: use ETS — concurrent in-memory reads/writes, no single process\ndefmodule Sessions do\n  def init, do: :ets.new(:sessions, [:named_table, :public, read_concurrency: true])\n  def get(id), do: :ets.lookup(:sessions, id)\n  def put(id, v), do: :ets.insert(:sessions, {id, v})\nend" },
        { type: "p", text: "Fixes: use **ETS** (in-memory tables with concurrent access) for shared read-heavy state; **partition** work across many processes (e.g. one GenServer per user/room via a `Registry`); or simply don't funnel independent work through one process. Reserve a single GenServer for genuinely serial state." },
        { type: "heading", text: "2. Unbounded mailbox growth" },
        { type: "p", text: "If a process receives messages faster than it handles them, its mailbox grows without limit until the node runs out of memory. Cause: fire-and-forget `cast`/`send` to a slow consumer." },
        { type: "callout", variant: "gotcha", text: "Use synchronous **`call`** instead of `cast` when you need back-pressure — the caller blocks, naturally slowing producers to the consumer's pace. For high-volume streaming, reach for **`GenStage`/`Flow`/Broadway**, which have demand-driven back-pressure built in. Monitor `Process.info(pid, :message_queue_len)`." },
        { type: "heading", text: "3. handle_call timeouts" },
        { type: "p", text: "`GenServer.call/2` waits **5 seconds** by default, then the *caller* crashes with a timeout — even though the server may still be chugging. If a callback does slow work (an HTTP request, a big query) inside `handle_call`, callers time out." },
        { type: "code", lang: "elixir", code: "# don't block the server in handle_call for slow work.\n# Reply immediately and do the work elsewhere, or bump the timeout deliberately.\ndef handle_call({:report, id}, from, state) do\n  Task.start(fn ->\n    result = slow_report(id)              # runs OUTSIDE the GenServer\n    GenServer.reply(from, result)          # reply when done\n  end)\n  {:noreply, state}                        # server stays responsive\nend" },
        { type: "heading", text: "4. Atom exhaustion" },
        { type: "p", text: "Atoms are **never garbage collected** and the VM caps the atom table (~1M). Creating atoms from **user input** can exhaust it and crash the whole node — a real DoS vector." },
        { type: "code", lang: "elixir", code: "# WRONG: every distinct input creates a permanent atom\nrole = String.to_atom(params[\"role\"])          # DoS: attacker floods atoms\n\n# RIGHT: only convert to atoms you've already defined\nrole = String.to_existing_atom(params[\"role\"]) # raises if not pre-existing\n# even safer: validate against an explicit whitelist\nrole = Map.get(%{\"admin\" => :admin, \"user\" => :user}, params[\"role\"], :user)" },
        { type: "heading", text: "5. Ecto N+1 queries (forgetting preload)" },
        { type: "p", text: "Ecto never lazy-loads. Access an unloaded association in a loop and you either get a `%Ecto.Association.NotLoaded{}` struct or, if you query per-item, one query per row." },
        { type: "code", lang: "elixir", code: "# WRONG: a query per user to get their posts (N+1)\nusers = Repo.all(User)\nEnum.map(users, fn u -> Repo.preload(u, :posts).posts end)\n\n# RIGHT: preload once, in the original query (2 queries total)\nusers = Repo.all(from u in User, preload: [:posts])\nEnum.map(users, & &1.posts)" },
        { type: "heading", text: "6. Ignoring changeset errors" },
        { type: "callout", variant: "warn", text: "`Repo.insert/update/delete` return `{:ok, _}` **or** `{:error, changeset}` — they don't raise. If you write `{:ok, user} = Repo.insert(cs)` and the insert fails validation, you get a **MatchError** and a 500 instead of a friendly form error. Always `case` on both branches (or use the `!` variant only where failure is truly impossible)." },
        { type: "heading", text: "7. LiveView state costs server memory" },
        { type: "p", text: "Each LiveView connection is a process holding its assigns in RAM for the whole session. Stuffing large collections into `assign` multiplies memory by your concurrent-user count." },
        { type: "callout", variant: "tip", text: "Use LiveView **`stream`s** for lists (they don't retain items in socket state), keep assigns minimal, and store derived/large data outside the socket (ETS, cache, re-query on demand). Watch memory under load, not just in dev." },
        { type: "heading", text: "8. Compile-time vs runtime config" },
        { type: "callout", variant: "gotcha", text: "`config/config.exs` and `config/prod.exs` are **compile-time** — baked into the release. Secrets and anything that changes per-environment belong in **`config/runtime.exs`**, which reads `System.get_env/1` at boot. Putting `System.get_env` in `config.exs` reads it at *build* time (usually empty), a classic \"works in dev, nil in prod\" bug." }
      ]
    }
  ],

  packages: [
    { name: "phoenix", why: "The web framework itself — router, controllers, endpoint, LiveView integration." },
    { name: "phoenix_live_view", why: "Server-rendered, stateful, real-time UI over WebSockets with no custom JS." },
    { name: "ecto", why: "The core database toolkit: schemas, changesets, and the composable query DSL." },
    { name: "ecto_sql", why: "SQL adapters and migration support layered on top of Ecto." },
    { name: "postgrex", why: "The PostgreSQL driver Ecto talks to (Postgres is the default DB)." },
    { name: "plug_cowboy", why: "Adapter running Phoenix on the Cowboy HTTP server (Bandit is the modern alternative)." },
    { name: "phoenix_pubsub", why: "The distributed publish/subscribe bus behind Channels, Presence, and LiveView broadcasts." },
    { name: "bcrypt_elixir", why: "Password hashing used by phx.gen.auth (argon2_elixir is the stronger alternative)." },
    { name: "jason", why: "The fast JSON encoder/decoder Phoenix uses for API rendering and params." },
    { name: "telemetry", why: "Metrics/instrumentation events emitted across Phoenix, Ecto, and the VM for observability." },
    { name: "oban", why: "Robust, Postgres-backed background job processing with retries, scheduling, and uniqueness." }
  ],

  gotchas: [
    "`=` is **pattern match**, not assignment — `^x` pins an existing value instead of rebinding it.",
    "`Repo.insert/1` returns `{:ok, _}` **or** `{:error, changeset}` and never raises — handle both or use the `!` variant deliberately.",
    "Ecto **never lazy-loads** associations; forgetting `preload` gives you `%NotLoaded{}` or an N+1 storm.",
    "**Never** `String.to_atom/1` on user input — atoms aren't GC'd and you'll hit atom-table exhaustion. Use `String.to_existing_atom/1`.",
    "A plug that rejects a request must call **`halt/1`**, or Phoenix runs the controller action anyway.",
    "One GenServer handling all traffic **serializes** every request — partition, or use **ETS** for shared state.",
    "`config/*.exs` is **compile-time**; read env vars for secrets in **`config/runtime.exs`** at boot.",
    "`GenServer.call/2` times out after **5s** by default — don't do slow I/O inside `handle_call`.",
    "Every LiveView connection is a **stateful server process** holding assigns in RAM — keep assigns lean, use `stream`s for lists.",
    "The web layer should call **contexts**, not `Repo`/schemas directly — that boundary is the whole point."
  ],

  flashcards: [
    { q: "What is a GenServer and what are its three main callbacks?", a: "A stateful server process. `handle_call` (synchronous, replies to caller), `handle_cast` (async fire-and-forget), and `handle_info` (raw messages, timers, PubSub)." },
    { q: "What does a Supervisor do and what is `:one_for_one`?", a: "It starts and monitors child processes, restarting them on crash. `:one_for_one` restarts **only** the crashed child (the common default)." },
    { q: "In Elixir, what does `=` actually do?", a: "It's the **match operator**, not assignment: it matches the left pattern against the right value and binds any unbound variables. `^` pins to match an existing value." },
    { q: "What does the pipe operator `|>` do?", a: "Passes the value on its left as the **first argument** to the function on its right, turning nested calls into a top-to-bottom pipeline." },
    { q: "What is an Ecto changeset for?", a: "Casting external params to typed fields, running validations, and collecting errors **before** hitting the DB. It returns valid/invalid state without touching the table." },
    { q: "What is a plug, and what does `halt/1` do?", a: "A plug takes a `conn` + opts and returns a transformed `conn` (composable middleware). `halt/1` stops the pipeline so downstream plugs and the controller action don't run — essential for auth guards." },
    { q: "How does LiveView update the UI without custom JS?", a: "The UI is rendered and kept as state on the server; over a WebSocket, events (`phx-click`) call `handle_event`, state changes, and only the rendered **diff** is pushed to patch the DOM." },
    { q: "What is a Phoenix context and why use it?", a: "A module that groups related functionality behind a public API (a bounded context). The web layer calls contexts, not `Repo`/schemas, so business logic stays reusable and testable." },
    { q: "What does \"let it crash\" mean?", a: "Write the happy path and let a process die on unexpected state; a supervisor restarts it from clean state. Self-healing beats defensive error-guarding everywhere." },
    { q: "Why is `String.to_atom/1` on user input dangerous?", a: "Atoms are never garbage-collected and the atom table is capped (~1M); attacker-controlled input can exhaust it and crash the node. Use `String.to_existing_atom/1` or a whitelist." }
  ],

  cheatsheet: [
    { label: "New Phoenix app", code: "mix phx.new my_app" },
    { label: "Run the server", code: "mix phx.server" },
    { label: "App inside a REPL", code: "iex -S mix phx.server" },
    { label: "Run migrations", code: "mix ecto.migrate" },
    { label: "Generate a context", code: "mix phx.gen.context Accounts User users name:string email:string:unique" },
    { label: "Scaffold auth", code: "mix phx.gen.auth Accounts User users" },
    { label: "Pipe example", code: "1..10 |> Enum.filter(&(rem(&1, 2) == 0)) |> Enum.sum()" },
    { label: "Sync GenServer call", code: "GenServer.call(pid, {:withdraw, 40})" },
    { label: "Run a query", code: "Repo.all(from u in User, where: u.age >= 18, preload: [:posts])" },
    { label: "Broadcast to a topic", code: "Phoenix.PubSub.broadcast(MyApp.PubSub, \"room:42\", {:new_message, msg})" }
  ]
});
