(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "sql",
  name: "SQL",
  language: "SQL",
  group: "Databases",
  navLabel: "SQL",
  color: "#e38c00",
  readMinutes: 38,
  tagline: "The **declarative language of relational data** — you describe the *set* of rows you want and the engine figures out how to get them. One standard, many dialects (**PostgreSQL**, MySQL, SQLite). This deck takes you from `CREATE TABLE` to recursive CTEs, window functions, PL/pgSQL, and query-plan tuning.",

  sections: [
    {
      id: "overview",
      title: "Overview & the relational mental model",
      level: "core",
      body: [
        { type: "p", text: "SQL (Structured Query Language) is how you talk to a **relational database**: data lives in **tables** (relations), each table is a set of **rows** (tuples), and each row has the same typed **columns** (attributes). The revolutionary idea — from Codd's relational model — is that you work with data **declaratively and set-at-a-time**: you state *what* result you want, not *how* to loop over disk pages to build it. The engine's **query planner** picks the algorithm (which index, which join order)." },
        { type: "p", text: "This is the biggest mental shift for programmers coming from imperative code. You do **not** write `for each row { ... }`. You write a `SELECT` that describes a set, and think in terms of **filtering, joining, grouping, and projecting sets**. If you find yourself wanting a loop, you almost always want a `JOIN`, a `GROUP BY`, or a window function instead." },
        { type: "code", lang: "sql", code: "-- Imperative thinking (wrong instinct):  \"loop customers, for each sum their orders\"\n-- Declarative SQL: describe the set of (customer, total) pairs and let the engine do it.\nSELECT c.name, SUM(o.amount) AS lifetime_value\nFROM   customers c\nJOIN   orders o ON o.customer_id = c.id\nWHERE  o.status = 'paid'\nGROUP  BY c.name\nHAVING SUM(o.amount) > 1000\nORDER  BY lifetime_value DESC;" },
        { type: "heading", text: "ACID — the guarantee that makes SQL trustworthy" },
        { type: "list", items: [
          "**Atomicity** — a transaction is all-or-nothing; a crash mid-way rolls the whole thing back.",
          "**Consistency** — every committed transaction moves the DB from one valid state to another (constraints, foreign keys, and checks always hold).",
          "**Isolation** — concurrent transactions don't step on each other; each behaves (at the strictest level) as if it ran alone.",
          "**Durability** — once `COMMIT` returns, the data survives a power loss (it's in the write-ahead log on disk)."
        ] },
        { type: "heading", text: "One standard, many dialects" },
        { type: "p", text: "There is an **ISO SQL standard** (SQL:2023 is the latest), but every engine implements a slightly different subset plus its own extensions. This deck teaches **PostgreSQL** as the primary dialect (the most standards-compliant, feature-rich open-source engine) and explicitly flags where **MySQL** and **SQLite** diverge." },
        { type: "table", headers: ["Engine", "Shape", "Sweet spot"], rows: [
          ["**PostgreSQL**", "full-featured client/server, MVCC", "the default powerhouse: complex queries, JSONB, CTEs, extensions, strict correctness"],
          ["**MySQL / MariaDB**", "client/server, huge ecosystem", "web apps (LAMP/WordPress), read-heavy workloads, managed cloud offerings everywhere"],
          ["**SQLite**", "embedded, single file, no server", "mobile, edge, desktop apps, tests, small sites — the DB *is* a `.db` file"],
          ["**SQL Server / Oracle**", "commercial client/server", "enterprise shops; T-SQL / PL/SQL dialects (out of scope here)"]
        ] },
        { type: "callout", variant: "note", text: "SQL keywords are **case-insensitive** (`select` == `SELECT`); the common convention is UPPERCASE keywords, lowercase identifiers. Statements end with a **semicolon** `;`. Strings use **single quotes** `'text'`; double quotes `\"col\"` mean *identifier* in standard SQL (Postgres/SQLite), while MySQL uses backticks `` `col` `` by default." }
      ]
    },
    {
      id: "setup",
      title: "Setup: installing, connecting, GUIs",
      level: "core",
      body: [
        { type: "p", text: "You need two things: a running database **server** (except SQLite, which is serverless) and a **client** to talk to it. The fastest path to a real server is Docker; the fastest path to *any* SQL at all is SQLite, which is just a library and a file." },
        { type: "heading", text: "PostgreSQL" },
        { type: "code", lang: "bash", code: "# Install locally\nsudo apt install postgresql        # Debian/Ubuntu\nbrew install postgresql@17         # macOS\n\n# ...or run it in Docker (throwaway, one line)\ndocker run --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:17\n\n# Connect with the psql CLI (the canonical Postgres client)\npsql \"postgresql://postgres:secret@localhost:5432/postgres\"\n# or, on a local install using your OS user:\nsudo -u postgres psql" },
        { type: "code", lang: "sql", code: "-- inside psql: create a database, a user, and grant access\nCREATE DATABASE shop;\nCREATE USER app WITH PASSWORD 'app_pw';\nGRANT ALL PRIVILEGES ON DATABASE shop TO app;\n\\c shop            -- connect to the shop database (psql meta-command)\nGRANT ALL ON SCHEMA public TO app;   -- PG 15+: needed for the user to create tables" },
        { type: "p", text: "**psql meta-commands** (backslash) are your friends: `\\l` list databases, `\\dt` list tables, `\\d tablename` describe a table, `\\du` list users/roles, `\\x` toggle expanded output, `\\timing` show query times, `\\q` quit." },
        { type: "heading", text: "MySQL" },
        { type: "code", lang: "bash", code: "docker run --name my -e MYSQL_ROOT_PASSWORD=secret -p 3306:3306 -d mysql:8.4\n\n# connect with the mysql CLI\nmysql -h 127.0.0.1 -P 3306 -u root -p" },
        { type: "code", lang: "sql", code: "CREATE DATABASE shop;\nCREATE USER 'app'@'%' IDENTIFIED BY 'app_pw';\nGRANT ALL PRIVILEGES ON shop.* TO 'app'@'%';\nFLUSH PRIVILEGES;\nUSE shop;          -- select the active database\nSHOW TABLES;       -- MySQL's equivalent of \\dt" },
        { type: "heading", text: "SQLite" },
        { type: "code", lang: "bash", code: "# No server. The database is a single file. The CLI ships with most OSes.\nsqlite3 shop.db\n\n# useful dot-commands inside the sqlite3 shell:\n#   .tables            list tables\n#   .schema users      show a table's DDL\n#   .mode column       pretty columnar output\n#   .headers on        show column names\n#   .quit" },
        { type: "callout", variant: "tip", text: "**GUI clients** make exploration far nicer. **DBeaver** (free, Java, connects to *everything*) and **pgAdmin** (Postgres-specific) are the workhorses; **TablePlus**, **DataGrip** (JetBrains), and **Beekeeper Studio** are popular too. They give you a schema tree, an ERD, autocompleting SQL editors, and visual EXPLAIN plans. For SQLite, **DB Browser for SQLite** is the classic." },
        { type: "callout", variant: "gotcha", text: "The connection string format is worth memorizing: `postgresql://user:password@host:port/dbname`. MySQL uses `mysql://...` and default port **3306**; Postgres defaults to **5432**. A wrong port or a firewall are the two most common \"can't connect\" causes — check `pg_hba.conf` (Postgres host-based auth) if a local connection is refused." }
      ]
    },
    {
      id: "datatypes",
      title: "Data types & NULL",
      level: "core",
      body: [
        { type: "p", text: "Choosing the right type is a correctness decision, not a formality — it controls storage, indexability, comparison rules, and whether bad data can even enter the table. Here are the categories every backend dev must know (Postgres names shown; equivalents noted)." },
        { type: "table", headers: ["Category", "Use", "Type (Postgres)"], rows: [
          ["Integer", "ids, counts", "`SMALLINT` / `INTEGER` / `BIGINT`"],
          ["Exact decimal", "**money, anything you sum**", "`NUMERIC(p, s)` (a.k.a. `DECIMAL`)"],
          ["Approximate float", "scientific, ratios — NOT money", "`REAL` / `DOUBLE PRECISION`"],
          ["Text", "strings", "`TEXT` (unbounded), `VARCHAR(n)` (capped)"],
          ["Boolean", "true/false", "`BOOLEAN`"],
          ["Date/time", "timestamps", "`DATE`, `TIME`, `TIMESTAMPTZ`, `INTERVAL`"],
          ["UUID", "distributed ids", "`UUID`"],
          ["JSON", "semi-structured", "`JSONB` (binary, indexable) / `JSON`"],
          ["Array", "list in one column", "`INTEGER[]`, `TEXT[]` (Postgres only)"],
          ["Enum", "fixed value set", "`CREATE TYPE ... AS ENUM`"]
        ] },
        { type: "callout", variant: "warn", text: "**Money is NEVER a float.** `FLOAT`/`DOUBLE` are binary approximations: `0.1 + 0.2 != 0.3`. Storing prices as `DOUBLE` will eventually produce `$19.999999998`. Use **`NUMERIC(12, 2)`** (exact, base-10) for any amount you add, multiply, or compare. Floats are for measurements and ratios where tiny error is fine." },
        { type: "heading", text: "Dates, times, and the timezone trap" },
        { type: "p", text: "Use **`TIMESTAMPTZ`** (`timestamp with time zone`), not plain `TIMESTAMP`, for any real-world instant. Despite the name, `TIMESTAMPTZ` does *not* store a zone — it stores a UTC instant and converts to/from your session's `TimeZone` on the way in/out. Plain `TIMESTAMP` stores a naive wall-clock with no zone, so the same value means different instants in different places — a classic bug source." },
        { type: "code", lang: "sql", code: "SET TimeZone = 'UTC';\nCREATE TABLE events (id BIGINT, occurred_at TIMESTAMPTZ);\nINSERT INTO events VALUES (1, '2026-07-08 14:30:00+02');  -- stored as 12:30 UTC\nSELECT occurred_at AT TIME ZONE 'America/New_York' FROM events;  -- convert on read\nSELECT now(), current_date, occurred_at + INTERVAL '3 days' FROM events;" },
        { type: "heading", text: "NULL and three-valued logic" },
        { type: "p", text: "`NULL` means **unknown / absent**, not zero and not empty string. It infects every comparison: any operator applied to `NULL` yields `NULL` (which is *not* true), so SQL logic is **three-valued**: TRUE, FALSE, UNKNOWN. This is the single most common source of surprising query results." },
        { type: "code", lang: "sql", code: "SELECT 1 = NULL;          -- NULL (not true, not false!)\nSELECT NULL = NULL;       -- NULL — two unknowns aren't \"equal\"\nSELECT 1 <> NULL;         -- NULL\n\n-- You MUST use IS NULL / IS NOT NULL to test for it:\nSELECT * FROM users WHERE deleted_at IS NULL;      -- correct\n-- SELECT * FROM users WHERE deleted_at = NULL;    -- WRONG: returns 0 rows, silently\n\n-- WHERE only keeps rows where the predicate is TRUE — UNKNOWN rows are dropped.\n-- So `WHERE status <> 'paid'` EXCLUDES rows where status IS NULL. Surprising!" },
        { type: "code", lang: "sql", code: "-- The NULL-handling toolkit\nSELECT COALESCE(nickname, name, 'anonymous') AS display;  -- first non-NULL\nSELECT NULLIF(a, b);        -- NULL if a = b, else a (handy to avoid div-by-zero)\nSELECT price / NULLIF(qty, 0) AS unit_price;              -- qty=0 -> NULL, not error\n-- Aggregates SKIP NULLs: COUNT(col) ignores NULLs; COUNT(*) counts all rows.\nSELECT COUNT(*) AS rows, COUNT(email) AS with_email FROM users;" },
        { type: "callout", variant: "gotcha", text: "`NULL` is also why `UNIQUE` constraints allow multiple NULLs (two unknowns aren't equal, so they don't conflict) and why `IN (1, 2, NULL)` behaves oddly with `NOT IN`. Reach for `COALESCE` early and mark columns `NOT NULL` whenever the absence of a value is genuinely meaningless." }
      ]
    },
    {
      id: "ddl",
      title: "DDL: defining schema (CREATE, constraints, ALTER)",
      level: "core",
      body: [
        { type: "p", text: "**DDL** (Data Definition Language) shapes the database: `CREATE`, `ALTER`, `DROP`. The schema is where you encode your invariants — a good schema makes illegal states *unrepresentable*. Push as much correctness into constraints as you can; the database enforces them no matter which app or script writes to it." },
        { type: "code", lang: "sql", code: "CREATE TABLE customers (\n  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- SQL-standard auto id\n  email       TEXT        NOT NULL UNIQUE,\n  name        TEXT        NOT NULL,\n  country     CHAR(2)     NOT NULL DEFAULT 'US',\n  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE orders (\n  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  customer_id  BIGINT      NOT NULL REFERENCES customers(id) ON DELETE CASCADE,\n  amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),\n  status       TEXT        NOT NULL DEFAULT 'pending'\n                 CHECK (status IN ('pending','paid','shipped','cancelled')),\n  placed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),\n  -- a generated (computed) column, stored on write:\n  amount_cents BIGINT GENERATED ALWAYS AS (amount * 100) STORED\n);" },
        { type: "table", headers: ["Constraint", "Guarantees"], rows: [
          ["`PRIMARY KEY`", "unique + not null; the row's identity (one per table)"],
          ["`FOREIGN KEY` / `REFERENCES`", "the value exists in another table — referential integrity"],
          ["`UNIQUE`", "no duplicate values (allows multiple NULLs)"],
          ["`NOT NULL`", "the column must have a value"],
          ["`CHECK (expr)`", "an arbitrary boolean invariant on the row"],
          ["`DEFAULT expr`", "value used when INSERT omits the column"]
        ] },
        { type: "heading", text: "Foreign key referential actions" },
        { type: "p", text: "`ON DELETE` / `ON UPDATE` decide what happens to child rows when the parent they reference is removed or re-keyed. Choosing correctly is a data-integrity design decision:" },
        { type: "list", items: [
          "**`ON DELETE CASCADE`** — delete the children too (delete a customer → their orders vanish). Powerful but dangerous; easy to wipe more than you meant.",
          "**`ON DELETE RESTRICT`** / **`NO ACTION`** (default) — refuse to delete the parent while children exist. The safe default.",
          "**`ON DELETE SET NULL`** — orphan the children by nulling the FK (the column must be nullable).",
          "**`ON DELETE SET DEFAULT`** — set the FK back to its column default."
        ] },
        { type: "heading", text: "ALTER, DROP, and schemas" },
        { type: "code", lang: "sql", code: "ALTER TABLE customers ADD COLUMN phone TEXT;\nALTER TABLE customers ALTER COLUMN country SET DEFAULT 'GB';\nALTER TABLE customers ADD CONSTRAINT chk_email CHECK (email LIKE '%@%');\nALTER TABLE customers RENAME COLUMN name TO full_name;\nALTER TABLE orders  DROP COLUMN amount_cents;\n\nDROP TABLE IF EXISTS orders;            -- IF EXISTS avoids an error if absent\nTRUNCATE customers RESTART IDENTITY;    -- fast wipe all rows, reset the id counter\n\n-- Schemas are namespaces for tables inside one database:\nCREATE SCHEMA billing;\nCREATE TABLE billing.invoices (id BIGINT PRIMARY KEY);\nSET search_path TO billing, public;     -- resolve unqualified names here" },
        { type: "callout", variant: "note", text: "**Auto-increment differs by dialect.** Postgres: `GENERATED ALWAYS AS IDENTITY` (modern, SQL-standard) or the older `SERIAL`. MySQL: `BIGINT AUTO_INCREMENT`. SQLite: `INTEGER PRIMARY KEY` is aliased to the rowid and auto-increments (add `AUTOINCREMENT` only if you must prevent id reuse). Generated/computed columns and `IDENTITY` are covered in the dialects section." }
      ]
    },
    {
      id: "dml",
      title: "DML basics: INSERT, UPDATE, DELETE, UPSERT, RETURNING",
      level: "core",
      body: [
        { type: "p", text: "**DML** (Data Manipulation Language) changes the rows: `INSERT`, `UPDATE`, `DELETE` (plus `SELECT`, next section). The golden rule: **always run an `UPDATE`/`DELETE` as a `SELECT` first** to see which rows the `WHERE` matches — an omitted `WHERE` hits the *whole table*." },
        { type: "code", lang: "sql", code: "-- INSERT: single, multi-row, and from a query\nINSERT INTO customers (email, name) VALUES ('ada@x.io', 'Ada');\nINSERT INTO customers (email, name) VALUES\n  ('bob@x.io', 'Bob'),\n  ('cy@x.io',  'Cy');                       -- one statement, many rows (fast)\nINSERT INTO archive_customers SELECT * FROM customers WHERE created_at < '2020-01-01';\n\n-- UPDATE / DELETE — the WHERE is not optional in practice\nUPDATE orders SET status = 'shipped' WHERE id = 42;\nUPDATE orders SET amount = amount * 1.10 WHERE status = 'pending';  -- set-based\nDELETE FROM orders WHERE status = 'cancelled' AND placed_at < now() - INTERVAL '1 year';" },
        { type: "heading", text: "RETURNING — get the affected rows back" },
        { type: "p", text: "Postgres (and SQLite 3.35+, and MariaDB) let you append **`RETURNING`** to `INSERT`/`UPDATE`/`DELETE` to get the resulting rows in the same round-trip — invaluable for grabbing a generated id without a second `SELECT`." },
        { type: "code", lang: "sql", code: "INSERT INTO customers (email, name) VALUES ('dee@x.io', 'Dee') RETURNING id, created_at;\nUPDATE orders SET status = 'paid' WHERE id = 42 RETURNING id, status;\nDELETE FROM orders WHERE id = 7 RETURNING *;" },
        { type: "callout", variant: "gotcha", text: "**MySQL has no `RETURNING`** (as of 8.4). You get the auto-increment id via `LAST_INSERT_ID()` (or the driver's `insertId`) — but that only returns the *first* generated id of a multi-row insert. SQLite has supported `RETURNING` since 3.35 (2021)." },
        { type: "heading", text: "UPSERT — insert or update on conflict" },
        { type: "p", text: "\"Insert this row, but if it collides with an existing unique key, update it instead\" is one of the most-used real-world operations, and each dialect spells it differently." },
        { type: "code", lang: "sql", code: "-- PostgreSQL / SQLite: INSERT ... ON CONFLICT\nINSERT INTO customers (email, name) VALUES ('ada@x.io', 'Ada Lovelace')\nON CONFLICT (email)                         -- the conflicting unique column\nDO UPDATE SET name = EXCLUDED.name          -- EXCLUDED = the row we tried to insert\nRETURNING id;\n\n-- Insert, but silently skip if it already exists:\nINSERT INTO customers (email, name) VALUES ('ada@x.io', 'Ada')\nON CONFLICT (email) DO NOTHING;" },
        { type: "code", lang: "sql", code: "-- MySQL: ON DUPLICATE KEY UPDATE (fires on ANY unique/PK collision)\nINSERT INTO customers (email, name) VALUES ('ada@x.io', 'Ada Lovelace')\nON DUPLICATE KEY UPDATE name = VALUES(name);\n-- MySQL 8.0.19+: alias the new row instead of the deprecated VALUES():\nINSERT INTO customers (email, name) VALUES ('ada@x.io', 'Ada') AS new\nON DUPLICATE KEY UPDATE name = new.name;" },
        { type: "callout", variant: "tip", text: "Postgres `ON CONFLICT` targets a **specific** unique index/constraint (or a `WHERE` condition), giving you fine control. MySQL's `ON DUPLICATE KEY` fires on *any* unique or primary-key collision, which is simpler but can update on a key you didn't intend — make sure the table has only the one unique key you care about, or use `ON CONFLICT` semantics in Postgres." }
      ]
    },
    {
      id: "querying",
      title: "Querying: WHERE, ORDER BY, LIMIT, patterns, CASE",
      level: "core",
      body: [
        { type: "p", text: "The `SELECT` is the workhorse. Its clauses are written in one order but the engine **evaluates them in a different logical order** — knowing this explains many \"why can't I use my alias in WHERE?\" confusions." },
        { type: "table", headers: ["Write order", "Logical evaluation order", "Does"], rows: [
          ["`SELECT`", "5", "pick/compute output columns"],
          ["`FROM` / `JOIN`", "1", "assemble the source rows"],
          ["`WHERE`", "2", "filter rows (before grouping)"],
          ["`GROUP BY`", "3", "collapse into groups"],
          ["`HAVING`", "4", "filter groups"],
          ["`ORDER BY`", "6", "sort the result"],
          ["`LIMIT` / `OFFSET`", "7", "slice the result"]
        ] },
        { type: "callout", variant: "note", text: "Because `WHERE` (step 2) runs *before* `SELECT` (step 5), you **can't reference a `SELECT` alias in `WHERE`** — the alias doesn't exist yet. You *can* use it in `ORDER BY` (step 6). This ordering is the root of that whole class of errors." },
        { type: "code", lang: "sql", code: "SELECT id, name, amount\nFROM   orders\nWHERE  status = 'paid'\n   AND amount BETWEEN 10 AND 100      -- inclusive on both ends\n   AND country IN ('US', 'GB', 'DE')  -- set membership\n   AND placed_at >= now() - INTERVAL '30 days'\nORDER  BY amount DESC, id ASC          -- tie-break with a second key\nLIMIT  20 OFFSET 40;                    -- page 3 of 20 (see keyset caveat later)" },
        { type: "heading", text: "Pattern matching" },
        { type: "code", lang: "sql", code: "-- LIKE: % = any run of chars, _ = exactly one char\nSELECT * FROM customers WHERE email LIKE '%@gmail.com';\nSELECT * FROM customers WHERE name  LIKE 'A_a%';       -- A, any char, a, then anything\n\n-- ILIKE = case-INsensitive LIKE (Postgres). MySQL LIKE is already case-insensitive\n-- for typical collations; SQLite LIKE is case-insensitive for ASCII only.\nSELECT * FROM customers WHERE name ILIKE 'ada%';\n\n-- Regex (Postgres):  ~ match,  ~* case-insensitive,  !~ not-match\nSELECT * FROM customers WHERE email ~* '^[a-z]+@x\\.io$';" },
        { type: "heading", text: "DISTINCT and CASE" },
        { type: "code", lang: "sql", code: "SELECT DISTINCT country FROM customers;               -- unique values\nSELECT DISTINCT country, status FROM orders;          -- unique combinations\n\n-- CASE = SQL's if/else expression; works anywhere an expression is allowed\nSELECT id, amount,\n       CASE WHEN amount >= 100 THEN 'big'\n            WHEN amount >= 10  THEN 'medium'\n            ELSE 'small'\n       END AS bucket\nFROM orders;\n\n-- \"pivot\" a status column into counts with CASE inside an aggregate:\nSELECT COUNT(*) FILTER (WHERE status = 'paid')    AS paid,\n       COUNT(*) FILTER (WHERE status = 'pending') AS pending\nFROM orders;   -- FILTER is Postgres/SQLite; MySQL uses COUNT(CASE WHEN ...)" },
        { type: "callout", variant: "tip", text: "`OFFSET` pagination (`LIMIT 20 OFFSET 10000`) still *scans and discards* the skipped rows, so it gets slower the deeper you page. For large tables use **keyset (cursor) pagination** — `WHERE id > :last_seen_id ORDER BY id LIMIT 20` — which uses the index and stays fast at any depth. Covered in the final headaches section." }
      ]
    },
    {
      id: "joins",
      title: "Joins: combining tables",
      level: "core",
      body: [
        { type: "p", text: "A **join** matches rows from two tables on a condition, producing a wider combined row. The mental model: for each row on the left, find matching rows on the right (per the `ON` condition) and emit the combined pairs. The *type* of join decides what happens to rows with **no match**." },
        { type: "table", headers: ["Join", "Keeps", "Typical use"], rows: [
          ["`INNER JOIN`", "only rows that match on both sides", "the default: orders *with* a customer"],
          ["`LEFT JOIN`", "all left rows; NULLs where right has no match", "customers *and their orders if any*"],
          ["`RIGHT JOIN`", "all right rows; NULLs where left has none", "rare — just flip and use LEFT"],
          ["`FULL JOIN`", "all rows from both, NULLs where unmatched", "reconciling two sets, finding gaps"],
          ["`CROSS JOIN`", "every left × every right (Cartesian product)", "generating combinations, calendars"]
        ] },
        { type: "code", lang: "sql", code: "-- INNER: only customers who have at least one order\nSELECT c.name, o.amount\nFROM   customers c\nJOIN   orders o ON o.customer_id = c.id;      -- JOIN == INNER JOIN\n\n-- LEFT: EVERY customer, with order columns NULL if they've never ordered\nSELECT c.name, o.amount\nFROM   customers c\nLEFT JOIN orders o ON o.customer_id = c.id;\n\n-- USING(col) is shorthand when the join columns share a name (and de-dupes the col):\nSELECT * FROM orders JOIN customers USING (id);  -- only if both have `id` meaning the same" },
        { type: "heading", text: "Self-joins and multi-table joins" },
        { type: "code", lang: "sql", code: "-- SELF JOIN: a table joined to itself (employees -> their manager, same table)\nSELECT e.name AS employee, m.name AS manager\nFROM   employees e\nLEFT JOIN employees m ON m.id = e.manager_id;\n\n-- Chain as many as you need — the planner reorders them for efficiency\nSELECT c.name, o.id, oi.product_id, p.title\nFROM   customers c\nJOIN   orders o        ON o.customer_id = c.id\nJOIN   order_items oi  ON oi.order_id   = o.id\nJOIN   products p      ON p.id          = oi.product_id;" },
        { type: "heading", text: "Anti-joins: finding what's missing" },
        { type: "p", text: "A common need is \"rows in A with **no** match in B\" — customers with zero orders, products never sold. Two idiomatic ways; **`NOT EXISTS`** is usually the clearest and handles NULLs correctly." },
        { type: "code", lang: "sql", code: "-- NOT EXISTS (recommended): customers who have never ordered\nSELECT c.*\nFROM   customers c\nWHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);\n\n-- LEFT JOIN ... IS NULL (equivalent): keep left rows whose right side didn't match\nSELECT c.*\nFROM   customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE  o.id IS NULL;\n\n-- Avoid NOT IN (subquery) here: if the subquery yields ANY NULL, NOT IN returns\n-- zero rows (three-valued logic). NOT EXISTS is NULL-safe.", },
        { type: "callout", variant: "warn", text: "The **accidental Cartesian product** is the classic join bug: forget the `ON` clause (or write `JOIN t2` with no condition) and you get *every* left row paired with *every* right row — a 10k × 10k table explodes to 100 million rows and your query \"hangs.\" If a result has way more rows than expected, suspect a missing or wrong join condition first." }
      ]
    },
    {
      id: "aggregation",
      title: "Aggregation & grouping",
      level: "core",
      body: [
        { type: "p", text: "Aggregation collapses many rows into summary values. Without `GROUP BY`, an aggregate reduces the *whole table* to one row. With `GROUP BY`, it produces one row **per group**." },
        { type: "code", lang: "sql", code: "-- Whole-table aggregate: one row out\nSELECT COUNT(*), SUM(amount), AVG(amount), MIN(amount), MAX(amount) FROM orders;\n\n-- Per-group: one row per customer\nSELECT customer_id,\n       COUNT(*)      AS order_count,\n       SUM(amount)   AS total,\n       AVG(amount)   AS avg_order\nFROM   orders\nWHERE  status = 'paid'          -- WHERE filters ROWS, before grouping\nGROUP  BY customer_id\nHAVING SUM(amount) > 500        -- HAVING filters GROUPS, after aggregation\nORDER  BY total DESC;" },
        { type: "callout", variant: "gotcha", text: "**Every non-aggregated column in the `SELECT` must appear in `GROUP BY`** (standard SQL, enforced by Postgres). MySQL historically allowed selecting un-grouped columns and returned an *arbitrary* value for them — a footgun disabled by the `ONLY_FULL_GROUP_BY` mode (on by default since MySQL 5.7). **`WHERE` vs `HAVING`:** `WHERE` filters individual rows before grouping; `HAVING` filters the resulting groups (and can reference aggregates). Put a condition in `WHERE` when you can — it filters earlier and cheaper." },
        { type: "heading", text: "String / array aggregation and FILTER" },
        { type: "code", lang: "sql", code: "-- collapse a group's values into one string or array\nSELECT customer_id,\n       STRING_AGG(status, ', ' ORDER BY placed_at) AS status_history,  -- MySQL: GROUP_CONCAT\n       ARRAY_AGG(id ORDER BY placed_at)            AS order_ids\nFROM   orders\nGROUP  BY customer_id;\n\n-- FILTER: conditional aggregation without a CASE (Postgres/SQLite)\nSELECT customer_id,\n       SUM(amount)                              AS total,\n       SUM(amount) FILTER (WHERE status='paid') AS paid_total,\n       COUNT(*)    FILTER (WHERE amount > 100)  AS big_orders\nFROM   orders\nGROUP  BY customer_id;" },
        { type: "heading", text: "GROUPING SETS, ROLLUP, CUBE — multiple grouping levels at once" },
        { type: "p", text: "Sometimes you want subtotals *and* a grand total in one pass — e.g. sales by (country, status), plus by country, plus overall. These extensions generate multiple grouping levels in a single query." },
        { type: "code", lang: "sql", code: "-- ROLLUP: hierarchical subtotals + grand total\nSELECT country, status, SUM(amount) AS total\nFROM   orders JOIN customers ON customers.id = orders.customer_id\nGROUP  BY ROLLUP (country, status);\n-- rows: each (country,status), each country subtotal (status = NULL),\n--       and one grand total (both NULL).\n\n-- CUBE: every combination of the dimensions (all subtotals in every direction)\nGROUP BY CUBE (country, status);\n\n-- GROUPING SETS: name exactly the groupings you want\nGROUP BY GROUPING SETS ((country, status), (country), ());" },
        { type: "callout", variant: "note", text: "Use the `GROUPING(col)` function to tell a real `NULL` in the data apart from a \"this is a subtotal row\" `NULL` that `ROLLUP`/`CUBE` produce. `ROLLUP`/`CUBE`/`GROUPING SETS` are in Postgres and MySQL 8; SQLite lacks them (emulate with `UNION ALL`)." }
      ]
    },
    {
      id: "subqueries-ctes",
      title: "Subqueries, CTEs & recursive queries",
      level: "core",
      body: [
        { type: "p", text: "A **subquery** is a `SELECT` nested inside another statement. It comes in a few flavors depending on what it returns and whether it references the outer query." },
        { type: "list", items: [
          "**Scalar subquery** — returns a single value; usable anywhere an expression is: `SELECT name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS n FROM customers c`.",
          "**Row/table subquery in `FROM`** (a *derived table*) — treated like a temporary table you then query.",
          "**`IN` / `ANY` / `ALL` subquery** — set membership / comparison against a returned column.",
          "**Correlated subquery** — references the outer row (like the scalar example above); it re-evaluates per outer row, so it can be slow — often rewritable as a join."
        ] },
        { type: "code", lang: "sql", code: "-- EXISTS (correlated): efficient membership test, stops at the first match\nSELECT * FROM customers c\nWHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.amount > 500);\n\n-- Derived table in FROM: aggregate first, then join to it\nSELECT c.name, t.total\nFROM   customers c\nJOIN   (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id) t\n       ON t.customer_id = c.id;" },
        { type: "heading", text: "CTEs — `WITH` for readable, composable queries" },
        { type: "p", text: "A **Common Table Expression** names a subquery up front with `WITH`, so you can reference it (even multiple times) below. CTEs turn a nested, unreadable query into a top-to-bottom pipeline of named steps — the single biggest readability win in SQL." },
        { type: "code", lang: "sql", code: "WITH paid_orders AS (\n  SELECT customer_id, amount FROM orders WHERE status = 'paid'\n),\nper_customer AS (\n  SELECT customer_id, SUM(amount) AS total, COUNT(*) AS n\n  FROM paid_orders\n  GROUP BY customer_id\n)\nSELECT c.name, pc.total, pc.n\nFROM   per_customer pc\nJOIN   customers c ON c.id = pc.customer_id\nWHERE  pc.total > 1000\nORDER  BY pc.total DESC;" },
        { type: "callout", variant: "note", text: "Historically Postgres treated a CTE as an **optimization fence** (always materialized). Since **Postgres 12** simple non-recursive CTEs are inlined like subqueries; add `WITH x AS MATERIALIZED (...)` to force the old behavior, or `NOT MATERIALIZED` to force inlining. Good to know when a CTE-heavy query is unexpectedly slow." },
        { type: "heading", text: "Recursive CTEs — walking trees and graphs" },
        { type: "p", text: "This is how you traverse hierarchies (org charts, category trees, threaded comments, bill-of-materials) — data that has no fixed depth. A **recursive CTE** has two parts joined by `UNION [ALL]`: the **anchor** (the starting rows) and the **recursive term** (which references the CTE itself to walk one level deeper), repeated until it produces no new rows." },
        { type: "code", lang: "sql", code: "-- categories(id, name, parent_id) forms a tree. Walk the whole subtree under id = 1.\nWITH RECURSIVE subtree AS (\n    -- ANCHOR: the starting node(s), at depth 0\n    SELECT id, name, parent_id, 1 AS depth,\n           name::text AS path\n    FROM   categories\n    WHERE  id = 1\n\n  UNION ALL\n\n    -- RECURSIVE TERM: join the CTE to the table to fetch each node's children.\n    -- `subtree` here refers to rows produced in the PREVIOUS iteration.\n    SELECT c.id, c.name, c.parent_id, s.depth + 1,\n           s.path || ' > ' || c.name        -- build a breadcrumb string\n    FROM   categories c\n    JOIN   subtree s ON c.parent_id = s.id\n)\nSELECT repeat('  ', depth - 1) || name AS tree, depth, path\nFROM   subtree\nORDER  BY path;" },
        { type: "list", items: [
          "The **anchor** runs once to seed the working set.",
          "The **recursive term** runs repeatedly, each time joining against *only the rows added last round*, until it returns zero rows.",
          "`UNION` (not `UNION ALL`) would de-duplicate each step — useful to prevent infinite loops on **cyclic** graphs; `UNION ALL` is faster when the data is a true tree.",
          "Guard against runaway recursion on cyclic data with a **depth cap** (`WHERE depth < 100`) or Postgres's `CYCLE ... SET ... USING ...` clause."
        ] },
        { type: "callout", variant: "tip", text: "Recursive CTEs are supported in Postgres, MySQL 8+, SQLite, and SQL Server. They also generate sequences (`WITH RECURSIVE t(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM t WHERE n < 10)`) — handy for calendars and gap-filling." }
      ]
    },
    {
      id: "window-functions",
      title: "Window functions (deep dive)",
      level: "core",
      body: [
        { type: "p", text: "Window functions are the feature that separates intermediate from advanced SQL. Like an aggregate, a window function computes over *multiple rows* — but unlike `GROUP BY`, it **does not collapse them**. Each row keeps its identity and gets an extra computed column that looks across a \"window\" of related rows. Running totals, rankings, per-group top-N, moving averages, and row-to-row deltas all become one clean query." },
        { type: "code", lang: "sql", code: "-- The anatomy of a window: func() OVER (PARTITION BY ... ORDER BY ... frame)\nSELECT\n  customer_id,\n  placed_at,\n  amount,\n  -- running total of amount, per customer, ordered by time\n  SUM(amount) OVER (PARTITION BY customer_id ORDER BY placed_at) AS running_total,\n  -- each order's share of that customer's grand total (whole-partition window)\n  amount / SUM(amount) OVER (PARTITION BY customer_id)          AS pct_of_customer\nFROM orders;" },
        { type: "list", items: [
          "**`PARTITION BY`** splits rows into independent groups (like `GROUP BY` but without collapsing). Omit it and the window is the whole result set.",
          "**`ORDER BY`** (inside `OVER`) defines the order *within* each partition — essential for running totals, ranking, and `LAG`/`LEAD`.",
          "**The frame** (`ROWS`/`RANGE BETWEEN ...`) restricts *which* rows around the current one the function sees — the subtle, powerful part."
        ] },
        { type: "heading", text: "Ranking functions" },
        { type: "code", lang: "sql", code: "SELECT\n  category, product, sales,\n  ROW_NUMBER() OVER w AS rn,   -- 1,2,3,4 — always unique, arbitrary tie-break\n  RANK()       OVER w AS rnk,  -- 1,2,2,4 — ties share a rank, then a GAP\n  DENSE_RANK() OVER w AS drnk, -- 1,2,2,3 — ties share, NO gap\n  NTILE(4)     OVER w AS quartile   -- split each category into 4 buckets\nFROM products\nWINDOW w AS (PARTITION BY category ORDER BY sales DESC);\n-- The WINDOW clause names a window so several functions can share it." },
        { type: "p", text: "The classic **top-N-per-group** (e.g. the 3 best-selling products in each category) is `ROW_NUMBER()` partitioned by the group, filtered in an outer query:" },
        { type: "code", lang: "sql", code: "SELECT * FROM (\n  SELECT category, product, sales,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) AS rn\n  FROM products\n) ranked\nWHERE rn <= 3;   -- can't filter on a window function directly in WHERE; wrap it" },
        { type: "callout", variant: "gotcha", text: "You **cannot** put a window function in `WHERE` or `GROUP BY` — they're evaluated *after* those clauses (right before `ORDER BY`). To filter on a window result (`WHERE rn <= 3`), wrap the query in a subquery/CTE and filter in the outer level, as above. Postgres 15+ also offers `QUALIFY`-like behavior only via the wrap; some engines (DuckDB, Snowflake) have `QUALIFY`." },
        { type: "heading", text: "LAG / LEAD — reach to other rows" },
        { type: "code", lang: "sql", code: "-- Compare each day's revenue to the previous day (row-to-row delta)\nSELECT\n  day, revenue,\n  LAG(revenue)  OVER (ORDER BY day) AS prev_day,\n  revenue - LAG(revenue) OVER (ORDER BY day)             AS day_over_day,\n  LEAD(revenue) OVER (ORDER BY day) AS next_day,\n  FIRST_VALUE(revenue) OVER (ORDER BY day) AS first_day,\n  -- LAG's 2nd arg = offset, 3rd = default when there's no prior row\n  LAG(revenue, 7, 0) OVER (ORDER BY day) AS same_day_last_week\nFROM daily_revenue;" },
        { type: "heading", text: "Frames: ROWS vs RANGE" },
        { type: "p", text: "The **frame clause** defines the sliding window of rows the function aggregates for each row. This is how you build **moving averages**. `ROWS` counts *physical rows*; `RANGE` counts *by value* of the `ORDER BY` column (rows with equal ordering values are treated as peers)." },
        { type: "code", lang: "sql", code: "SELECT\n  day, revenue,\n  -- 7-day trailing moving average: current row + the 6 rows before it\n  AVG(revenue) OVER (\n    ORDER BY day\n    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n  ) AS moving_avg_7,\n  -- running total from the start of the partition to here\n  SUM(revenue) OVER (\n    ORDER BY day\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS cumulative,\n  -- centered 3-day window\n  AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS smooth3\nFROM daily_revenue;" },
        { type: "callout", variant: "warn", text: "**The default frame is a trap.** When you add `ORDER BY` inside `OVER` *without* an explicit frame, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. With `RANGE`, all rows sharing the current row's `ORDER BY` value are included together — so if two orders share a timestamp, a \"running total\" jumps by both at once. For predictable row-by-row running totals, specify **`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`** explicitly." },
        { type: "callout", variant: "tip", text: "Window functions are in Postgres, MySQL 8.0+, SQLite 3.25+, and all commercial engines. If you're on MySQL 5.7 they don't exist — that alone is a reason to upgrade. `PERCENT_RANK`, `CUME_DIST`, and `NTH_VALUE` round out the family." }
      ]
    },
    {
      id: "indexes",
      title: "Indexes & the query planner",
      level: "core",
      body: [
        { type: "p", text: "An **index** is a separate, sorted data structure that lets the engine find rows without scanning the whole table — the difference between an `O(log n)` lookup and an `O(n)` **sequential scan**. Every primary key and (in Postgres) unique constraint is automatically indexed; you add indexes for the columns you filter, join, and sort on." },
        { type: "code", lang: "sql", code: "CREATE INDEX idx_orders_customer ON orders (customer_id);          -- speeds joins/filters\nCREATE UNIQUE INDEX idx_customers_email ON customers (email);\nCREATE INDEX idx_orders_cust_status ON orders (customer_id, status);  -- composite\nCREATE INDEX idx_orders_recent ON orders (placed_at) WHERE status='paid';  -- partial\nCREATE INDEX idx_lower_email ON customers (lower(email));           -- expression index\nCREATE INDEX idx_orders_cover ON orders (customer_id) INCLUDE (amount);   -- covering" },
        { type: "table", headers: ["Index type", "Good for", "Notes"], rows: [
          ["**B-tree** (default)", "`=`, `<`, `>`, `BETWEEN`, `ORDER BY`, prefix `LIKE 'a%'`", "the workhorse; 99% of indexes"],
          ["**Hash**", "equality only (`=`)", "rarely worth it over B-tree in Postgres"],
          ["**GIN**", "JSONB, arrays, full-text search", "many keys per row (containment `@>`, `@@`)"],
          ["**GiST / SP-GiST**", "geometric, ranges, nearest-neighbor", "PostGIS, range types"],
          ["**BRIN**", "huge, naturally-ordered tables (time-series)", "tiny index, block-range summaries"]
        ] },
        { type: "heading", text: "Composite index column order matters" },
        { type: "callout", variant: "gotcha", text: "A composite index `(a, b)` can serve queries filtering on `a` alone, or on `a AND b` — but **not on `b` alone** (it's like a phone book sorted by last-then-first name: useless for finding a first name). Order columns by: equality filters first, then the range/sort column last. `(customer_id, status)` helps `WHERE customer_id=? AND status=?` and `WHERE customer_id=?`, but not `WHERE status=?`." },
        { type: "heading", text: "Reading the plan: EXPLAIN / EXPLAIN ANALYZE" },
        { type: "p", text: "`EXPLAIN` shows the plan the optimizer *chose* (estimates only). `EXPLAIN ANALYZE` actually **runs** the query and shows real times and row counts — the tool you use to diagnose a slow query. Read it inside-out / bottom-up." },
        { type: "code", lang: "sql", code: "EXPLAIN ANALYZE\nSELECT * FROM orders WHERE customer_id = 42 AND status = 'paid';\n\n-- What to look for in the output:\n--  Seq Scan   -> reading the whole table (bad on big tables if a filter is selective)\n--  Index Scan / Index Only Scan -> using an index (good)\n--  rows=      -> ESTIMATED rows; compare to \"actual rows\" — big gaps => stale stats\n--  Nested Loop / Hash Join / Merge Join -> the join algorithm chosen\n--  cost=..    -> planner's arbitrary cost units;  actual time=.. -> real milliseconds" },
        { type: "callout", variant: "warn", text: "Indexes are **not free**: every `INSERT`/`UPDATE`/`DELETE` must also update every index on the table, so over-indexing slows writes and wastes disk. Index the columns you actually query; drop unused indexes (`pg_stat_user_indexes` shows `idx_scan = 0` for dead ones). Also, an index on a **low-cardinality** column (e.g. a boolean, or `status` with 3 values) often won't be used — the planner correctly decides a seq scan is cheaper. And a leading-wildcard `LIKE '%foo'` can't use a B-tree index at all (use trigram/GIN or full-text)." },
        { type: "callout", variant: "tip", text: "Keep statistics fresh so the planner estimates well: Postgres autovacuum runs `ANALYZE`, but after a big bulk load run it manually (`ANALYZE orders;`). A `VACUUM` reclaims space from dead MVCC row versions. `pg_stat_statements` aggregates your slowest/most-frequent queries in production." }
      ]
    },
    {
      id: "transactions",
      title: "Transactions, isolation & concurrency",
      level: "core",
      body: [
        { type: "p", text: "A **transaction** groups statements into one atomic unit — they all commit together or all roll back. This is what makes \"move money from A to B\" safe: debit and credit either both happen or neither does." },
        { type: "code", lang: "sql", code: "BEGIN;\n  UPDATE accounts SET balance = balance - 100 WHERE id = 1;\n  UPDATE accounts SET balance = balance + 100 WHERE id = 2;\n  -- if anything failed above, we could ROLLBACK; instead:\nCOMMIT;   -- both updates become durable together; a crash before COMMIT undoes both\n\n-- SAVEPOINT: a partial rollback point inside a transaction\nBEGIN;\n  INSERT INTO orders (customer_id, amount) VALUES (1, 50);\n  SAVEPOINT s1;\n  INSERT INTO orders (customer_id, amount) VALUES (999, 50);  -- oops, FK violation\n  ROLLBACK TO s1;    -- undo just the bad insert, keep the first one\nCOMMIT;" },
        { type: "heading", text: "The four isolation levels" },
        { type: "p", text: "Isolation levels trade **correctness for concurrency**. Higher levels prevent more anomalies but allow less parallelism / cause more retries. The SQL standard defines four, by which anomalies they forbid:" },
        { type: "table", headers: ["Level", "Dirty read", "Non-repeatable read", "Phantom read", "Serialization anomaly"], rows: [
          ["`READ UNCOMMITTED`", "possible*", "possible", "possible", "possible"],
          ["`READ COMMITTED`", "no", "possible", "possible", "possible"],
          ["`REPEATABLE READ`", "no", "no", "possible**", "possible"],
          ["`SERIALIZABLE`", "no", "no", "no", "no"]
        ] },
        { type: "list", items: [
          "**Dirty read** — seeing another transaction's *uncommitted* changes.",
          "**Non-repeatable read** — re-reading a row and getting a different value (someone updated + committed in between).",
          "**Phantom read** — re-running a range query and getting new rows that appeared.",
          "**Serialization anomaly** — the end state couldn't result from running the transactions one-at-a-time in any order."
        ] },
        { type: "callout", variant: "note", text: "*Postgres has no true `READ UNCOMMITTED` — it maps to `READ COMMITTED`. **Postgres's default is `READ COMMITTED`; its `REPEATABLE READ` also prevents phantoms (it's snapshot isolation). **MySQL/InnoDB's default is `REPEATABLE READ`**. `SERIALIZABLE` is the safest (Postgres implements it as *Serializable Snapshot Isolation*), but transactions may fail with a serialization error and **must be retried** by your app — design for that." },
        { type: "heading", text: "MVCC, locking, and SELECT ... FOR UPDATE" },
        { type: "p", text: "Postgres uses **MVCC** (Multi-Version Concurrency Control): writers create new row versions instead of overwriting, so **readers never block writers and writers never block readers**. Each transaction sees a consistent snapshot. The cost is dead tuples that `VACUUM` later cleans up." },
        { type: "code", lang: "sql", code: "-- Pessimistic locking: reserve rows so a concurrent txn can't touch them until you commit\nBEGIN;\n  SELECT * FROM accounts WHERE id = 1 FOR UPDATE;   -- lock this row\n  -- ... compute new balance based on the locked value ...\n  UPDATE accounts SET balance = balance - 100 WHERE id = 1;\nCOMMIT;\n\n-- FOR UPDATE SKIP LOCKED: the queue-worker pattern — grab the next free job,\n-- skipping rows other workers already locked (no contention)\nSELECT * FROM jobs WHERE status='queued' ORDER BY id\nFOR UPDATE SKIP LOCKED LIMIT 1;" },
        { type: "callout", variant: "warn", text: "**Deadlock:** txn A locks row 1 then waits for row 2, while txn B locked row 2 and waits for row 1 — neither can proceed. The DB detects the cycle and kills one with a deadlock error. **Prevent it** by having all code acquire locks in the *same consistent order* (e.g. always lock the lower id first). Also: keep transactions **short** — a long-running transaction holds locks and blocks `VACUUM`, causing table bloat and lock pile-ups." }
      ]
    },
    {
      id: "views",
      title: "Views & materialized views",
      level: "core",
      body: [
        { type: "p", text: "A **view** is a saved query you can select from like a table. It stores no data — it's a named abstraction that runs its underlying `SELECT` every time. Views simplify complex queries, present a stable interface over changing tables, and restrict column/row access (grant on the view, not the base table)." },
        { type: "code", lang: "sql", code: "CREATE VIEW customer_totals AS\nSELECT c.id, c.name, COALESCE(SUM(o.amount), 0) AS lifetime_value\nFROM   customers c\nLEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'\nGROUP  BY c.id, c.name;\n\nSELECT * FROM customer_totals WHERE lifetime_value > 1000;  -- query it like a table\nCREATE OR REPLACE VIEW customer_totals AS ...;              -- redefine it" },
        { type: "heading", text: "Materialized views — cache the result on disk" },
        { type: "p", text: "A **materialized view** actually stores the query's result physically, so reads are instant — at the cost of being a *snapshot* that goes stale until you `REFRESH` it. Perfect for expensive dashboards/aggregations that don't need to be real-time." },
        { type: "code", lang: "sql", code: "CREATE MATERIALIZED VIEW sales_by_day AS\nSELECT date_trunc('day', placed_at) AS day, SUM(amount) AS total\nFROM orders WHERE status = 'paid'\nGROUP BY 1;\n\nCREATE UNIQUE INDEX ON sales_by_day (day);   -- required for CONCURRENTLY refresh\n\nREFRESH MATERIALIZED VIEW sales_by_day;                 -- rebuild (locks reads)\nREFRESH MATERIALIZED VIEW CONCURRENTLY sales_by_day;    -- rebuild WITHOUT blocking reads" },
        { type: "callout", variant: "gotcha", text: "Materialized views do **not** auto-update — you must schedule a `REFRESH` (a cron job, a trigger, or `pg_cron`). Plain `REFRESH` takes an exclusive lock (reads block until done); `REFRESH ... CONCURRENTLY` avoids that but requires a `UNIQUE` index and is slower. MySQL has **no** materialized views (emulate with a summary table + triggers/events); SQLite has neither materialized views nor `REFRESH`." }
      ]
    },
    {
      id: "functions-procedures-triggers",
      title: "Stored functions, procedures & triggers",
      level: "core",
      body: [
        { type: "p", text: "This is where you write **real procedural code inside the database**. Two reasons to: encapsulate logic that must hold regardless of which app calls it (triggers, integrity), and eliminate round-trips for set-heavy operations (do it next to the data). Postgres's procedural language is **PL/pgSQL**; you can also write functions in plain SQL, and even Python/JS via extensions." },
        { type: "heading", text: "Plain SQL functions (simplest, often inlinable)" },
        { type: "code", lang: "sql", code: "CREATE OR REPLACE FUNCTION order_total(cust BIGINT)\nRETURNS NUMERIC\nLANGUAGE sql STABLE          -- STABLE: no writes, same inputs -> same output in a txn\nAS $$\n  SELECT COALESCE(SUM(amount), 0) FROM orders\n  WHERE customer_id = cust AND status = 'paid';\n$$;\n\nSELECT name, order_total(id) FROM customers;   -- call it like any function" },
        { type: "heading", text: "PL/pgSQL functions — variables, control flow, RETURNS TABLE" },
        { type: "code", lang: "sql", code: "CREATE OR REPLACE FUNCTION apply_discount(cust BIGINT)\nRETURNS NUMERIC\nLANGUAGE plpgsql\nAS $$\nDECLARE\n  total     NUMERIC;\n  discount  NUMERIC := 0;      -- variable with default\nBEGIN\n  SELECT COALESCE(SUM(amount),0) INTO total       -- SELECT ... INTO a variable\n  FROM orders WHERE customer_id = cust AND status = 'paid';\n\n  IF total > 1000 THEN                             -- control flow\n    discount := 0.15;\n  ELSIF total > 500 THEN\n    discount := 0.10;\n  ELSE\n    discount := 0;\n  END IF;\n\n  RETURN round(total * (1 - discount), 2);\nEND;\n$$;" },
        { type: "code", lang: "sql", code: "-- RETURNS TABLE: a set-returning function you can SELECT FROM\nCREATE OR REPLACE FUNCTION top_customers(min_total NUMERIC)\nRETURNS TABLE (customer_id BIGINT, name TEXT, total NUMERIC)\nLANGUAGE plpgsql AS $$\nBEGIN\n  RETURN QUERY\n    SELECT c.id, c.name, SUM(o.amount)\n    FROM customers c JOIN orders o ON o.customer_id = c.id\n    WHERE o.status = 'paid'\n    GROUP BY c.id, c.name\n    HAVING SUM(o.amount) >= min_total\n    ORDER BY 3 DESC;\nEND;\n$$;\n\nSELECT * FROM top_customers(1000);   -- use it in the FROM clause" },
        { type: "callout", variant: "note", text: "The `$$ ... $$` is **dollar-quoting** — it delimits the function body so you don't have to escape every inner quote. You can tag it (`$body$ ... $body$`) if the body itself contains `$$`. Mark functions `IMMUTABLE` (pure, e.g. math), `STABLE` (reads only), or `VOLATILE` (default, may write/have side effects) — this tells the planner when it can cache/inline the call." },
        { type: "heading", text: "Stored procedures — CALL and transaction control" },
        { type: "p", text: "A **procedure** (Postgres 11+) differs from a function: it returns nothing by default, is invoked with `CALL`, and — crucially — can **manage transactions** (`COMMIT`/`ROLLBACK` mid-body), which functions cannot. Use procedures for multi-step batch jobs." },
        { type: "code", lang: "sql", code: "CREATE OR REPLACE PROCEDURE settle_pending()\nLANGUAGE plpgsql AS $$\nDECLARE r RECORD;\nBEGIN\n  FOR r IN SELECT id FROM orders WHERE status = 'pending' LOOP\n    UPDATE orders SET status = 'paid' WHERE id = r.id;\n    IF r.id % 1000 = 0 THEN\n      COMMIT;    -- commit in batches (only a PROCEDURE can do this)\n    END IF;\n  END LOOP;\n  COMMIT;\nEND;\n$$;\n\nCALL settle_pending();" },
        { type: "heading", text: "Triggers — run code automatically on data changes" },
        { type: "p", text: "A **trigger** fires a function automatically `BEFORE` or `AFTER` an `INSERT`/`UPDATE`/`DELETE`. Uses: maintaining an `updated_at` column, writing an audit log, denormalized counters, enforcing complex invariants. In Postgres a trigger calls a special **trigger function** (returns `TRIGGER`, sees `NEW`/`OLD` row variables and `TG_OP`)." },
        { type: "code", lang: "sql", code: "-- 1) the trigger FUNCTION\nCREATE OR REPLACE FUNCTION set_updated_at()\nRETURNS TRIGGER LANGUAGE plpgsql AS $$\nBEGIN\n  NEW.updated_at := now();   -- NEW = the row about to be written (editable in BEFORE)\n  RETURN NEW;                -- BEFORE triggers return the (possibly modified) row\nEND;\n$$;\n\n-- 2) bind it to the table\nCREATE TRIGGER trg_touch_updated\nBEFORE UPDATE ON customers\nFOR EACH ROW EXECUTE FUNCTION set_updated_at();\n\n-- AFTER trigger for audit logging (NEW/OLD available; return value ignored)\nCREATE OR REPLACE FUNCTION log_order_change()\nRETURNS TRIGGER LANGUAGE plpgsql AS $$\nBEGIN\n  INSERT INTO order_audit(order_id, op, old_status, new_status, changed_at)\n  VALUES (COALESCE(NEW.id, OLD.id), TG_OP, OLD.status, NEW.status, now());\n  RETURN NULL;\nEND;\n$$;\nCREATE TRIGGER trg_order_audit\nAFTER INSERT OR UPDATE OR DELETE ON orders\nFOR EACH ROW EXECUTE FUNCTION log_order_change();" },
        { type: "callout", variant: "warn", text: "**Triggers are invisible action-at-a-distance.** A misbehaving trigger can silently double-write, recurse, or tank write performance, and they're easy to forget when debugging. Keep them small and deterministic, avoid triggers that write to the *same* table they fire on (recursion), and document them loudly. `BEFORE` triggers can modify `NEW` or cancel the write (`RETURN NULL`); `AFTER` triggers can't change the row but see the final state." },
        { type: "callout", variant: "gotcha", text: "**Dialect differences.** MySQL writes functions/procedures/triggers too, but you must change the statement delimiter first (`DELIMITER $$ ... END$$ DELIMITER ;`) because the body contains semicolons; it uses `BEGIN ... END`, `DECLARE`, and `NEW`/`OLD` but no `TG_OP`/`RETURN NEW` — a MySQL trigger is `BEFORE UPDATE ... FOR EACH ROW BEGIN SET NEW.updated_at = NOW(); END`. **SQLite has stored *triggers* but NO stored functions or procedures** — you register custom functions from the host language (Python/Node) instead." }
      ]
    },
    {
      id: "advanced-querying",
      title: "Advanced querying: JSON, arrays, full-text, set ops, LATERAL",
      level: "deep",
      body: [
        { type: "p", text: "Postgres is far more than tables of scalars. These features let you handle semi-structured data, search, and correlated per-row subqueries without leaving SQL." },
        { type: "heading", text: "JSON / JSONB" },
        { type: "p", text: "Store JSON in a **`JSONB`** column (binary, indexed, deduped keys) — prefer it over `JSON` (raw text) unless you need to preserve exact formatting/key order. Query it with a rich operator set." },
        { type: "code", lang: "sql", code: "CREATE TABLE events (id BIGINT, payload JSONB);\nINSERT INTO events VALUES (1, '{\"user\": {\"id\": 7, \"tags\": [\"pro\",\"eu\"]}, \"amount\": 42}');\n\nSELECT payload -> 'user' ->> 'id'      AS user_id,   -- ->  returns jsonb, ->> returns text\n       payload #>> '{user,tags,0}'     AS first_tag,  -- #>> path to text\n       (payload ->> 'amount')::numeric AS amount\nFROM events;\n\n-- Containment / existence (GIN-indexable):\nSELECT * FROM events WHERE payload @> '{\"user\":{\"id\":7}}';  -- contains this subtree\nSELECT * FROM events WHERE payload ? 'amount';               -- has top-level key\nSELECT * FROM events WHERE payload -> 'user' -> 'tags' ? 'pro';\n\nCREATE INDEX idx_events_payload ON events USING GIN (payload);  -- speeds @> and ?\n\n-- jsonb_path_query (SQL/JSON path) and expand arrays to rows:\nSELECT e.id, tag FROM events e,\n  jsonb_array_elements_text(e.payload -> 'user' -> 'tags') AS tag;" },
        { type: "heading", text: "Arrays (Postgres)" },
        { type: "code", lang: "sql", code: "CREATE TABLE posts (id BIGINT, tags TEXT[]);\nINSERT INTO posts VALUES (1, ARRAY['sql','db']), (2, '{sql,web}');\nSELECT * FROM posts WHERE 'sql' = ANY(tags);        -- membership\nSELECT * FROM posts WHERE tags @> ARRAY['sql'];      -- contains (GIN-indexable)\nSELECT id, unnest(tags) AS tag FROM posts;           -- explode array -> rows\nSELECT array_length(tags, 1), tags[1] FROM posts;    -- arrays are 1-indexed!" },
        { type: "heading", text: "Full-text search" },
        { type: "code", lang: "sql", code: "-- to_tsvector normalizes text into lexemes; to_tsquery/@@ matches\nSELECT * FROM articles\nWHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('english', 'postgres & index');\n\n-- Persist + index it for speed (generated column + GIN):\nALTER TABLE articles ADD COLUMN tsv tsvector\n  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || coalesce(body,''))) STORED;\nCREATE INDEX idx_articles_tsv ON articles USING GIN (tsv);\nSELECT title, ts_rank(tsv, q) AS rank\nFROM articles, to_tsquery('english', 'postgres') q\nWHERE tsv @@ q ORDER BY rank DESC;" },
        { type: "heading", text: "Set operations" },
        { type: "code", lang: "sql", code: "SELECT email FROM customers      -- rows in EITHER set (UNION removes dups; ALL keeps them)\nUNION\nSELECT email FROM leads;\n\nSELECT email FROM customers INTERSECT SELECT email FROM leads;  -- in BOTH\nSELECT email FROM customers EXCEPT    SELECT email FROM leads;  -- in first, not second\n-- Each side must have the same number of columns and compatible types." },
        { type: "callout", variant: "gotcha", text: "`UNION` (without `ALL`) sorts and de-duplicates the whole result — expensive on big sets. If you know the inputs are already disjoint, use **`UNION ALL`** to skip the dedup. MySQL supports `UNION`; `INTERSECT`/`EXCEPT` arrived in MySQL 8.0.31. SQLite has all three (it spells `EXCEPT` the same)." },
        { type: "heading", text: "LATERAL joins & DISTINCT ON" },
        { type: "p", text: "A **`LATERAL`** subquery can reference columns from tables earlier in the `FROM` — letting you run a correlated subquery *as a join*, e.g. \"the 3 most recent orders **for each** customer.\"" },
        { type: "code", lang: "sql", code: "SELECT c.name, o.id, o.placed_at\nFROM customers c\nCROSS JOIN LATERAL (\n  SELECT id, placed_at FROM orders\n  WHERE customer_id = c.id           -- references c from the outer query!\n  ORDER BY placed_at DESC LIMIT 3\n) o;\n\n-- DISTINCT ON (Postgres): the FIRST row per group by some key — a slick top-1-per-group\nSELECT DISTINCT ON (customer_id) customer_id, id, placed_at\nFROM orders\nORDER BY customer_id, placed_at DESC;   -- ORDER BY must lead with the DISTINCT ON key" },
        { type: "callout", variant: "note", text: "`DISTINCT ON` is a Postgres-ism — concise for \"latest row per group.\" The portable equivalent is `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at DESC) = 1`. `LATERAL` is standard SQL (Postgres, MySQL 8.0.14+; SQLite has no `LATERAL` but allows correlated subqueries in other spots)." }
      ]
    },
    {
      id: "big-query",
      title: "A large annotated report query",
      level: "deep",
      body: [
        { type: "p", text: "Here's how the pieces combine in a real report. This single query builds a **monthly customer cohort revenue report** with running totals and rank — using multiple CTEs, a window function, joins, aggregation, and a call to the `apply_discount(...)` function we defined in the stored-functions section. Read it top-to-bottom; the walkthrough follows." },
        { type: "code", lang: "sql", code: "WITH paid AS (                                             -- (1) narrow to paid orders\n    SELECT o.id, o.customer_id, o.amount,\n           date_trunc('month', o.placed_at) AS month\n    FROM   orders o\n    WHERE  o.status = 'paid'\n      AND  o.placed_at >= now() - INTERVAL '12 months'\n),\nby_customer_month AS (                                    -- (2) aggregate per customer/month\n    SELECT customer_id, month,\n           SUM(amount)  AS revenue,\n           COUNT(*)     AS orders\n    FROM   paid\n    GROUP  BY customer_id, month\n),\nenriched AS (                                             -- (3) join names + call our function\n    SELECT b.customer_id,\n           c.name,\n           b.month,\n           b.revenue,\n           b.orders,\n           apply_discount(b.customer_id) AS discounted_ltv   -- user-defined function!\n    FROM   by_customer_month b\n    JOIN   customers c ON c.id = b.customer_id\n)\nSELECT\n    name,\n    month,\n    revenue,\n    orders,\n    discounted_ltv,\n    SUM(revenue) OVER (PARTITION BY customer_id ORDER BY month)      -- (4) running total\n        AS cumulative_revenue,\n    RANK() OVER (PARTITION BY month ORDER BY revenue DESC)           -- (5) rank within month\n        AS rank_in_month\nFROM   enriched\nWHERE  revenue > 0\nORDER  BY month, rank_in_month;" },
        { type: "list", ordered: true, items: [
          "**CTE `paid`** filters to paid orders in the last 12 months and derives a `month` bucket with `date_trunc`. Filtering early keeps every later step small — this is the cheap filter the planner will push down.",
          "**CTE `by_customer_month`** aggregates that set into one row per (customer, month) with `SUM`/`COUNT` — a standard `GROUP BY` rollup.",
          "**CTE `enriched`** joins in the customer name and **calls the `apply_discount(customer_id)` PL/pgSQL function** per row, embedding business logic defined once and reused everywhere.",
          "**Window `SUM(...) OVER (PARTITION BY customer_id ORDER BY month)`** gives each month's row a **running cumulative revenue** for that customer — without collapsing the monthly rows (that's the window-vs-GROUP-BY distinction).",
          "**Window `RANK() OVER (PARTITION BY month ORDER BY revenue DESC)`** ranks customers *within each month* by revenue, so `rank_in_month = 1` is that month's top spender.",
          "The final `WHERE revenue > 0` and `ORDER BY` shape the output. Note the window functions run *after* `WHERE`, so filtering on `rank_in_month` here would require wrapping this in an outer query."
        ] },
        { type: "callout", variant: "tip", text: "This is the shape of most analytics SQL: **a pipeline of CTEs (filter → aggregate → enrich) feeding a final SELECT that adds window functions.** Build it incrementally — write and run each CTE alone before stacking the next — and reach for `EXPLAIN ANALYZE` if it's slow (usually a missing index on `orders(status, placed_at)` or `orders(customer_id)`)." },
        { type: "heading", text: "A second example: sessionizing an event stream" },
        { type: "p", text: "A different classic: group a user's raw events into **sessions** (a new session starts after a 30-minute gap). This leans on `LAG`, a boolean-to-int trick, and a running sum to assign session ids — a pattern you'll reuse for any \"gaps and islands\" problem." },
        { type: "code", lang: "sql", code: "WITH gapped AS (\n    SELECT user_id, event_at,\n           -- flag rows that start a new session: first event, or >30min since prev\n           CASE WHEN event_at - LAG(event_at) OVER (PARTITION BY user_id ORDER BY event_at)\n                       > INTERVAL '30 minutes'\n                  OR LAG(event_at) OVER (PARTITION BY user_id ORDER BY event_at) IS NULL\n                THEN 1 ELSE 0 END AS is_new_session\n    FROM events\n),\nsessioned AS (\n    SELECT user_id, event_at,\n           -- running sum of the new-session flags = a monotonically increasing session #\n           SUM(is_new_session) OVER (PARTITION BY user_id ORDER BY event_at) AS session_no\n    FROM gapped\n)\nSELECT user_id, session_no,\n       MIN(event_at) AS started, MAX(event_at) AS ended, COUNT(*) AS events\nFROM sessioned\nGROUP BY user_id, session_no\nORDER BY user_id, session_no;" },
        { type: "callout", variant: "note", text: "The trick in step 2 — a **running `SUM` over a 0/1 flag** to turn \"session boundaries\" into \"session numbers\" — is the core technique for the entire *gaps-and-islands* family (streaks, consecutive-day logins, contiguous ranges). Once you see it, you'll use it constantly." }
      ]
    },
    {
      id: "dialects",
      title: "Postgres vs MySQL vs SQLite",
      level: "core",
      body: [
        { type: "p", text: "Most SQL is portable, but the differences bite exactly when you migrate or write cross-dialect code. Here's the reference table, then migration watch-outs, then when to pick each." },
        { type: "table", headers: ["Feature", "PostgreSQL", "MySQL (InnoDB)", "SQLite"], rows: [
          ["Auto-increment", "`GENERATED ... AS IDENTITY` / `SERIAL`", "`AUTO_INCREMENT`", "`INTEGER PRIMARY KEY` (+`AUTOINCREMENT`)"],
          ["`RETURNING`", "yes", "no (`LAST_INSERT_ID()`)", "yes (3.35+)"],
          ["Upsert", "`INSERT ... ON CONFLICT`", "`ON DUPLICATE KEY UPDATE`", "`INSERT ... ON CONFLICT`"],
          ["Boolean", "real `BOOLEAN`", "`TINYINT(1)` alias (0/1)", "no bool type; 0/1 ints"],
          ["Identifier quoting", "double quotes `\"col\"`", "backticks `` `col` ``", "both `\"col\"` and `` `col` ``"],
          ["String compare", "case-sensitive; `ILIKE` for CI", "case-INsensitive by default collation", "case-sensitive (ASCII `LIKE` CI)"],
          ["JSON", "`JSONB` (indexable, rich ops)", "`JSON` (functions, no GIN)", "`JSON` via JSON1 functions"],
          ["Arrays", "native `type[]`", "no (use JSON)", "no (use JSON)"],
          ["Window functions", "yes", "8.0+", "3.25+"],
          ["CTEs / recursive", "yes", "8.0+", "yes"],
          ["Materialized views", "yes (`REFRESH`)", "no", "no"],
          ["Stored procedures", "functions + procedures (PL/pgSQL)", "functions + procedures (`DELIMITER`)", "triggers only, no procs"],
          ["Concurrency", "MVCC (readers never block writers)", "MVCC (InnoDB), gap locks", "file lock; one writer at a time (WAL helps)"],
          ["Full-text", "`tsvector`/GIN built in", "`FULLTEXT` indexes", "FTS5 extension"],
          ["Types", "strict, huge type system", "strict-ish, `ENUM`, `SET`", "**dynamic** type affinity (loose!)"]
        ] },
        { type: "heading", text: "What to watch when migrating" },
        { type: "list", items: [
          "**SQLite is loosely typed:** column types are mere *affinities* — a `TEXT` column will happily store an integer. Moving to Postgres/MySQL (strict) surfaces data that was quietly the wrong type.",
          "**Auto-increment + `RETURNING`:** code that relied on `RETURNING id` breaks on MySQL; swap to `LAST_INSERT_ID()`/driver `insertId`.",
          "**Upsert syntax** is not portable — `ON CONFLICT` (PG/SQLite) vs `ON DUPLICATE KEY` (MySQL) must be rewritten.",
          "**Identifier quoting & case:** MySQL folds/handles identifier case per-OS and quotes with backticks; Postgres lower-cases unquoted names and preserves quoted ones. `\"User\"` and `User` differ in Postgres.",
          "**Booleans:** MySQL stores them as `0/1`; a query expecting a real boolean or `IS TRUE` may behave differently.",
          "**Functions differ:** string concat is `||` (PG/SQLite) vs `CONCAT()` (MySQL, where `||` is *OR* unless `PIPES_AS_CONCAT` is set); `now()` vs `NOW()`/`CURRENT_TIMESTAMP`; `LIMIT ... OFFSET` is broadly shared but `TOP` is SQL-Server-only.",
          "**Default isolation differs** (PG `READ COMMITTED` vs MySQL `REPEATABLE READ`) — concurrency behavior can change subtly."
        ] },
        { type: "callout", variant: "tip", text: "**When to pick each.** **SQLite** — embedded/edge/mobile/desktop, tests, small read-mostly sites; zero-ops, the DB is a file, but a single writer. **PostgreSQL** — the default choice for a new backend: correctness, JSONB, CTEs, window functions, extensions (PostGIS, pgvector), strong concurrency. **MySQL/MariaDB** — huge ecosystem, ubiquitous managed hosting, familiar to many teams, great for straightforward read-heavy web apps. When unsure, start with **Postgres**." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite SQL developers in production — most are semantics or operations, not syntax." },
        { type: "heading", text: "1. SQL injection — the one that gets you fired" },
        { type: "callout", variant: "warn", text: "**Never build SQL by string-concatenating user input** (`\"... WHERE name = '\" + input + \"'\"`) — an input of `'; DROP TABLE users; --` executes. **Fix:** always use **parameterized queries / prepared statements** — pass values separately from the SQL text so the driver escapes them and they can never become code. This is non-negotiable." },
        { type: "code", lang: "sql", code: "-- Server-side prepared statement (values bound, never interpolated)\nPREPARE find_user (text) AS SELECT * FROM users WHERE email = $1;\nEXECUTE find_user('ada@x.io');" },
        { type: "code", lang: "py", code: "# In app code, let the DRIVER parameterize — do NOT f-string the value in\ncur.execute(\"SELECT * FROM users WHERE email = %s\", (email,))   # psycopg\n# WRONG: cur.execute(f\"SELECT * FROM users WHERE email = '{email}'\")  # injectable" },
        { type: "heading", text: "2. NULL and three-valued logic surprises" },
        { type: "callout", variant: "gotcha", text: "`col = NULL` is always UNKNOWN (0 rows); `WHERE status <> 'x'` silently **excludes** NULL rows; `NOT IN (subquery with a NULL)` returns nothing. **Fix:** use `IS NULL`/`IS NOT NULL`, add `OR col IS NULL` when you mean to include them, prefer `NOT EXISTS` over `NOT IN`, and mark columns `NOT NULL` when absence is meaningless." },
        { type: "heading", text: "3. Floating-point money" },
        { type: "callout", variant: "warn", text: "`FLOAT`/`DOUBLE` can't represent `0.10` exactly, so sums drift to `$19.999...`. **Fix:** store money as **`NUMERIC(p,s)`** (exact base-10) and never as a float. Same for any value you sum or compare for equality." },
        { type: "heading", text: "4. Implicit type coercion" },
        { type: "callout", variant: "gotcha", text: "Comparing a number to a string, or an indexed `varchar` column to an integer literal, can trigger a silent cast that **disables the index** (or, in MySQL, returns surprising matches like `'1abc' = 1`). **Fix:** compare like types; cast explicitly (`col::text`, `CAST(x AS int)`); make sure a query's literal type matches the indexed column's type." },
        { type: "heading", text: "5. `SELECT *` in production code" },
        { type: "callout", variant: "gotcha", text: "`SELECT *` breaks when columns are added/reordered, ships columns you don't need (more I/O, no covering-index-only scans), and couples app code to physical layout. **Fix:** list the columns you actually use. `SELECT *` is fine for ad-hoc exploration, not for app queries or views." },
        { type: "heading", text: "6. Missing (or unused) indexes" },
        { type: "callout", variant: "warn", text: "A slow query is usually a **sequential scan** on a filter/join column with no index — or an index that can't be used (function on the column, leading `%` in `LIKE`, type mismatch). **Fix:** `EXPLAIN ANALYZE` it, add the right index (composite in the right column order), and use an **expression index** if you filter on `lower(col)`. Conversely, drop indexes nothing uses — they slow every write." },
        { type: "heading", text: "7. Accidental cartesian joins" },
        { type: "callout", variant: "gotcha", text: "A forgotten/incorrect `ON` clause pairs every left row with every right row — the result count explodes and the query \"hangs.\" **Fix:** every join needs a correct condition; if a result is far bigger than expected, check the join keys first. Aggregating over a bad join also silently inflates `SUM`/`COUNT`." },
        { type: "heading", text: "8. Long transactions & lock contention" },
        { type: "callout", variant: "warn", text: "A transaction left open (or a slow one) holds locks, blocks other writers, blocks `VACUUM` (causing table bloat), and invites deadlocks. **Fix:** keep transactions **short**, don't do network calls or user think-time inside a transaction, acquire locks in a consistent order to avoid deadlocks, and set a `statement_timeout`/`idle_in_transaction_session_timeout`." },
        { type: "heading", text: "9. Timezone / timestamp vs timestamptz" },
        { type: "callout", variant: "gotcha", text: "Storing instants in plain `TIMESTAMP` (no zone) means the same value is a different moment in each region — off-by-hours bugs, especially around DST. **Fix:** use **`TIMESTAMPTZ`**, store/compute in **UTC**, and convert to local zones only for display (`AT TIME ZONE`)." },
        { type: "heading", text: "10. OFFSET pagination slowness" },
        { type: "callout", variant: "tip", text: "`LIMIT 20 OFFSET 100000` still reads and throws away 100,000 rows every page — it degrades linearly. **Fix:** **keyset (cursor) pagination** — `WHERE (created_at, id) < (:last_ts, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20`. It uses the index and is O(page size) at any depth (trade-off: no random jump-to-page)." },
        { type: "heading", text: "11. N+1 from the application layer" },
        { type: "callout", variant: "gotcha", text: "An ORM lazily loading a relation inside a loop fires **one query per row** (1 list query + N detail queries). **Fix:** fetch in a set with a `JOIN` or an `IN (...)` batch (`WHERE id = ANY(:ids)`), or use the ORM's eager-loading (`selectinload`/`JOIN FETCH`/`includes`). Watch the query log during development to catch it." },
        { type: "heading", text: "12. GROUP BY / aggregate misconceptions" },
        { type: "callout", variant: "note", text: "Selecting a non-grouped, non-aggregated column errors in standard SQL (and MySQL with `ONLY_FULL_GROUP_BY`); mixing `WHERE` and `HAVING` incorrectly filters at the wrong stage; `COUNT(col)` skips NULLs while `COUNT(*)` doesn't. **Fix:** group by every bare column, filter rows in `WHERE` and groups in `HAVING`, and know which `COUNT` you mean." }
      ]
    }
  ],

  packages: [
    { name: "postgresql", why: "the reference open-source RDBMS (v17) — MVCC, JSONB, CTEs, window functions, extensions; the default powerhouse this deck teaches" },
    { name: "mysql / mariadb", why: "the ubiquitous web-app RDBMS (v8.4); huge ecosystem and managed hosting everywhere; MariaDB is the community fork" },
    { name: "sqlite", why: "serverless embedded engine — the database is a single file; ships in phones, browsers, and countless apps; ideal for edge and tests" },
    { name: "psql", why: "PostgreSQL's canonical CLI — meta-commands (\\dt, \\d, \\timing), scripting, COPY; the fastest way to work a Postgres DB" },
    { name: "DBeaver", why: "free universal GUI client (connects to every engine) — schema browser, ERD, visual EXPLAIN, data editor" },
    { name: "pgAdmin", why: "the official Postgres GUI — admin, query tool, server/role management" },
    { name: "psycopg (3) / SQLAlchemy", why: "the Python Postgres driver and the standard Python ORM/Core toolkit — parameterized queries done right" },
    { name: "pg / node-postgres, mysql2, Prisma", why: "Node.js drivers (pg, mysql2) and the popular TypeScript ORM (Prisma) with typed schema + migrations" },
    { name: "pgvector", why: "Postgres extension adding a vector type + ANN indexes — the backbone of RAG / embeddings similarity search" },
    { name: "PostGIS", why: "the gold-standard geospatial extension for Postgres — geometry/geography types, spatial indexes, GIS functions" },
    { name: "pg_stat_statements", why: "Postgres extension that aggregates query execution stats — find your slowest/most-frequent queries in production" },
    { name: "Flyway / Liquibase", why: "versioned schema migration tools (Java ecosystem, but DB-agnostic) — repeatable, ordered DDL across environments" },
    { name: "sqlc", why: "generates type-safe Go/Kotlin/Python code from raw SQL queries — you write SQL, it writes the typed data-access layer" },
    { name: "pgbouncer", why: "lightweight Postgres connection pooler — essential in front of Postgres for many short-lived app connections" }
  ],

  gotchas: [
    "**SQL injection:** never string-concatenate user input into a query — use parameterized/prepared statements so values can never become code.",
    "**`col = NULL` is never true** — use `IS NULL`/`IS NOT NULL`. `WHERE x <> 'a'` silently drops NULL rows; `NOT IN` with a NULL returns zero rows (prefer `NOT EXISTS`).",
    "**Money as FLOAT drifts** (`0.1+0.2 != 0.3`) — store amounts as `NUMERIC(p,s)`, exact base-10.",
    "**Missing `WHERE` on UPDATE/DELETE hits the whole table** — always preview with a `SELECT` first (and wrap in a transaction you can `ROLLBACK`).",
    "**Accidental cartesian join:** a forgotten `ON` clause pairs every row with every row — result count explodes and aggregates silently inflate.",
    "**Composite index column order matters:** an index on `(a,b)` helps `WHERE a` and `WHERE a AND b`, but NOT `WHERE b` alone.",
    "**Functions/casts on an indexed column disable the index** (`WHERE lower(email)=...`, type mismatch, leading `%` in LIKE) — use an expression index or rewrite.",
    "**`plain TIMESTAMP` has no zone** — use `TIMESTAMPTZ`, store UTC, convert only on display; otherwise DST/regional off-by-hours bugs.",
    "**`OFFSET` pagination degrades linearly** (skips rows every page) — use keyset/cursor pagination for large tables.",
    "**Window functions can't go in `WHERE`/`GROUP BY`** — they run last; wrap the query to filter on `ROW_NUMBER()`/`RANK()`.",
    "**Default window frame is `RANGE ... CURRENT ROW`** — for row-by-row running totals specify `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.",
    "**Non-recursive CTEs may be inlined** (Postgres 12+) — use `AS MATERIALIZED` to force the fence, or `NOT MATERIALIZED` to inline.",
    "**Materialized views don't auto-refresh** — schedule `REFRESH` (use `CONCURRENTLY` + a unique index to avoid blocking reads).",
    "**Long/idle transactions hold locks and block VACUUM** — keep them short, no user think-time inside; set `idle_in_transaction_session_timeout`.",
    "**Deadlocks** come from acquiring locks in inconsistent order — always lock rows in the same order (e.g. lowest id first).",
    "**Dialect upsert/RETURNING/auto-increment differ** — `ON CONFLICT` vs `ON DUPLICATE KEY`, `RETURNING` vs `LAST_INSERT_ID()`, `IDENTITY`/`SERIAL` vs `AUTO_INCREMENT` vs rowid.",
    "**`SELECT *` in app code** breaks on schema change, moves extra bytes, and prevents index-only scans — list the columns you need.",
    "**SQLite is dynamically typed** (type affinity) — a `TEXT` column can hold an int; migrating to strict Postgres/MySQL surfaces bad data."
  ],

  flashcards: [
    { q: "What does it mean that SQL is declarative and set-based?", a: "You describe the *set* of rows you want (filter/join/group/project), not a loop over rows. The query planner chooses the algorithm and access path (index vs scan, join order)." },
    { q: "What do the four letters of ACID stand for?", a: "Atomicity (all-or-nothing), Consistency (constraints always hold), Isolation (concurrent txns don't interfere), Durability (committed data survives a crash)." },
    { q: "Why is `WHERE deleted_at = NULL` wrong?", a: "Any comparison with NULL yields UNKNOWN (three-valued logic), so it matches zero rows. Use `IS NULL` / `IS NOT NULL`." },
    { q: "Why store money as NUMERIC, not FLOAT?", a: "Floats are binary approximations (`0.1+0.2 != 0.3`), so sums drift. `NUMERIC(p,s)` is exact base-10 — use it for anything you add or compare for equality." },
    { q: "`TIMESTAMP` vs `TIMESTAMPTZ`?", a: "`TIMESTAMPTZ` stores a UTC instant and converts to/from the session zone — use it for real instants. Plain `TIMESTAMP` is a naive wall-clock with no zone (regional/DST bugs)." },
    { q: "INNER vs LEFT JOIN?", a: "INNER keeps only rows matching on both sides. LEFT keeps every left row, filling right-side columns with NULL where there's no match (e.g. customers even with no orders)." },
    { q: "How do you find rows in A with no match in B?", a: "An anti-join: `NOT EXISTS (SELECT 1 FROM B WHERE B.a_id = A.id)` (NULL-safe, preferred) or `LEFT JOIN B ... WHERE B.id IS NULL`. Avoid `NOT IN` with possible NULLs." },
    { q: "WHERE vs HAVING?", a: "WHERE filters individual rows before grouping; HAVING filters groups after aggregation (and can reference aggregates). Filter in WHERE when possible — it's earlier and cheaper." },
    { q: "How does a recursive CTE work?", a: "An anchor SELECT seeds rows, then a recursive term joins the CTE to itself to walk one level deeper, repeating until it returns no new rows — for trees/graphs. `UNION` de-dups to stop cycles." },
    { q: "How do window functions differ from GROUP BY?", a: "Both compute over multiple rows, but a window function does NOT collapse rows — each row keeps its identity and gets an extra value computed over its OVER(PARTITION BY ... ORDER BY ...) window." },
    { q: "How do you get the top-N rows per group?", a: "`ROW_NUMBER() OVER (PARTITION BY grp ORDER BY metric DESC)` in a subquery/CTE, then `WHERE rn <= N` in the outer query (window functions can't be filtered in WHERE directly)." },
    { q: "What's the default window frame gotcha?", a: "With ORDER BY and no explicit frame the default is `RANGE ... CURRENT ROW`, which lumps equal-valued rows together. For row-by-row running totals use `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`." },
    { q: "Why can't a composite index on (a,b) serve `WHERE b = ?`?", a: "It's sorted by a first, then b — like a phone book by last-then-first name. It helps `WHERE a` and `WHERE a AND b`, but not b alone. Order columns equality-first, range/sort last." },
    { q: "What does EXPLAIN ANALYZE tell you?", a: "It runs the query and shows the real plan with actual times and row counts. Look for Seq Scan on big filtered tables, estimated-vs-actual row gaps (stale stats), and the join algorithm chosen." },
    { q: "Name the four isolation levels from weakest to strongest.", a: "READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE — each forbids more anomalies (dirty / non-repeatable / phantom reads / serialization anomalies). Postgres default is READ COMMITTED; MySQL is REPEATABLE READ." },
    { q: "What is MVCC and what does `SELECT ... FOR UPDATE` do?", a: "MVCC keeps multiple row versions so readers never block writers. `FOR UPDATE` takes a row lock so a concurrent txn can't modify it until you commit — pessimistic locking (add `SKIP LOCKED` for queue workers)." },
    { q: "Function vs procedure vs trigger in Postgres?", a: "A function returns a value and is called in a query (can't manage txns). A procedure returns nothing, is `CALL`ed, and can COMMIT/ROLLBACK mid-body. A trigger auto-runs a trigger function BEFORE/AFTER a row change." },
    { q: "Why prefer keyset over OFFSET pagination?", a: "OFFSET still scans and discards the skipped rows, so it slows down the deeper you page. Keyset (`WHERE (ts,id) < (:last_ts,:last_id) ORDER BY ... LIMIT n`) uses the index and stays O(page) — but no jump-to-page." },
    { q: "How do the three dialects spell upsert?", a: "Postgres/SQLite: `INSERT ... ON CONFLICT (col) DO UPDATE SET ... EXCLUDED.x`. MySQL: `INSERT ... ON DUPLICATE KEY UPDATE`. Postgres targets a specific unique index; MySQL fires on any unique/PK collision." }
  ],

  cheatsheet: [
    { label: "Create table + constraints", code: "CREATE TABLE t (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, x NUMERIC NOT NULL CHECK (x>=0));" },
    { label: "Insert returning id", code: "INSERT INTO t (x) VALUES (1) RETURNING id;" },
    { label: "Upsert (Postgres/SQLite)", code: "INSERT INTO t (id,x) VALUES (1,9) ON CONFLICT (id) DO UPDATE SET x=EXCLUDED.x;" },
    { label: "Upsert (MySQL)", code: "INSERT INTO t (id,x) VALUES (1,9) ON DUPLICATE KEY UPDATE x=VALUES(x);" },
    { label: "NULL-safe defaults", code: "COALESCE(a, b, 0);  NULLIF(x, 0);  WHERE col IS NULL" },
    { label: "Anti-join", code: "SELECT * FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.a_id=a.id);" },
    { label: "Group + having", code: "SELECT k, SUM(v) FROM t GROUP BY k HAVING SUM(v) > 100;" },
    { label: "CTE pipeline", code: "WITH a AS (...), b AS (SELECT ... FROM a) SELECT * FROM b;" },
    { label: "Recursive CTE", code: "WITH RECURSIVE t AS (SELECT ... UNION ALL SELECT ... FROM t JOIN ...) SELECT * FROM t;" },
    { label: "Running total", code: "SUM(x) OVER (PARTITION BY k ORDER BY t ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)" },
    { label: "Top-N per group", code: "ROW_NUMBER() OVER (PARTITION BY k ORDER BY v DESC)  -- then WHERE rn<=N in a wrapper" },
    { label: "Create index", code: "CREATE INDEX idx ON t (a, b);  -- composite: equality cols first" },
    { label: "See the plan", code: "EXPLAIN ANALYZE SELECT ...;" },
    { label: "Transaction", code: "BEGIN; ...; SAVEPOINT s1; ...; ROLLBACK TO s1; COMMIT;" },
    { label: "Lock a row", code: "SELECT * FROM t WHERE id=1 FOR UPDATE;  -- add SKIP LOCKED for queues" },
    { label: "PL/pgSQL function", code: "CREATE FUNCTION f(a int) RETURNS int LANGUAGE plpgsql AS $$ BEGIN RETURN a*2; END; $$;" },
    { label: "updated_at trigger", code: "CREATE TRIGGER g BEFORE UPDATE ON t FOR EACH ROW EXECUTE FUNCTION set_updated_at();" },
    { label: "JSONB query", code: "SELECT payload->>'k' FROM t WHERE payload @> '{\"k\":1}';  -- GIN index it" },
    { label: "Materialized view", code: "REFRESH MATERIALIZED VIEW CONCURRENTLY mv;" },
    { label: "Parameterized query", code: "SELECT * FROM users WHERE email = $1;   -- never string-concat input" }
  ]
});
