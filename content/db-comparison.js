(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "db-comparison",
  name: "Databases — Comparison",
  language: "Overview",
  group: "Databases",
  navLabel: "Comparison",
  color: "#8b5cf6",
  readMinutes: 34,
  tagline: "The **capstone map** of the Databases group: what each paradigm is *for*, how relational, document, graph, key-value, wide-column, search, time-series and vector stores actually differ, and **how to choose**. Analysis and tables, not a product tutorial.",

  sections: [
    {
      id: "overview",
      title: "Overview: why there are so many databases",
      level: "core",
      body: [
        { type: "p", text: "For thirty years \"the database\" meant one thing: a relational SQL server. Today a serious backend often runs **three or four different data stores** side by side. That isn't fashion — it's because a database makes **structural bets** (how data is shaped, how it's queried, how it scales, what it guarantees on failure) and no single set of bets is optimal for every workload. This section is the map of those bets so the rest of the Databases group (SQL, MongoDB, Neo4j, GraphQL) clicks into place." },
        { type: "p", text: "The thesis is the old engineering proverb: **use the right tool for the job** — but *job* here has a precise meaning. Four questions decide the fit:" },
        { type: "list", items: [
          "**Data-model fit** — is your data naturally *tabular* (rows/columns, uniform), *hierarchical/nested* (a document per entity), *connected* (relationships are the point), or *just a value behind a key*? Fighting your model is the #1 source of pain.",
          "**Workload shape** — read-heavy vs write-heavy, point lookups vs range scans vs deep multi-hop traversals vs full-text search vs aggregations over billions of rows. Different engines optimize different access patterns.",
          "**Scale** — will this live on one box forever, or must it span many nodes? Horizontal scale forces trade-offs (sharding, weaker joins, eventual consistency) that a single-node store never pays.",
          "**Consistency & durability needs** — does a wrong-by-a-second read cost you money (a ledger) or nothing (a 'likes' counter)? This decides how much of ACID you actually need."
        ] },
        { type: "p", text: "A quick map of the families you'll meet — each is a paragraph in the next section:" },
        { type: "table", headers: ["Family", "Data is…", "Canonical example", "You reach for it when…"], rows: [
          ["**Relational / SQL**", "rows in typed tables, related by keys", "Postgres, MySQL, SQLite", "data is structured, integrity + ad-hoc queries matter (the default)"],
          ["**Document**", "self-contained JSON-ish documents", "MongoDB", "each entity is a nested blob read/written as a whole"],
          ["**Graph**", "nodes + typed relationships", "Neo4j", "the *connections* are the query (multi-hop traversal)"],
          ["**Key-value**", "an opaque value behind a key", "Redis", "you need the fastest possible get/set — cache, session, counter"],
          ["**Wide-column**", "sparse rows keyed for partitioning", "Cassandra, ScyllaDB", "massive write throughput across many nodes, known access pattern"],
          ["**Search**", "an inverted index over documents", "Elasticsearch, OpenSearch", "full-text relevance, faceting, log analytics"],
          ["**Time-series**", "timestamped points, append-mostly", "TimescaleDB, InfluxDB", "metrics, IoT, observability — write once, aggregate over time"],
          ["**Vector**", "high-dim embeddings + ANN index", "pgvector, Pinecone", "semantic / similarity search, RAG over embeddings"]
        ] },
        { type: "callout", variant: "note", text: "The families are not rivals so much as **specialists**. Most also blur at the edges: Postgres does JSON documents, full-text search, and vectors; MongoDB does transactions; Redis does search. The categories describe *what an engine is optimized for*, not a hard wall — and that overlap is exactly why 'just use Postgres' is such good default advice (last two sections)." }
      ]
    },
    {
      id: "families",
      title: "The database families, one paragraph each",
      level: "core",
      body: [
        { type: "p", text: "Eight families cover almost everything you'll deploy. Each optimizes a different *shape* of data and access. Learn the one-line identity of each and you can slot any new product you meet." },
        { type: "heading", text: "Relational / SQL — Postgres, MySQL, SQLite" },
        { type: "p", text: "Data lives in **tables** of typed **rows**, related to each other by **keys**, and queried with **SQL**. The relational model's superpower is the **join**: combine any tables at query time, and let the engine enforce **integrity** (foreign keys, uniqueness, constraints) and **ACID transactions**. **Postgres** is the do-everything default (rich types, extensions, correctness). **MySQL/MariaDB** is the ubiquitous web workhorse. **SQLite** is a serverless in-process file — the most deployed database on earth (every phone, browser, app). If you don't have a strong reason otherwise, start here." },
        { type: "heading", text: "Document — MongoDB" },
        { type: "p", text: "Data is stored as self-contained **documents** (BSON/JSON) with a flexible, per-document schema. An entity and its sub-parts (an order + its line items) live together in one document, so a read is one lookup with **no joins**. Great when data is naturally nested, the schema evolves fast, and you read/write whole aggregates. **MongoDB** leads; DynamoDB and Couchbase are cousins. The cost: relationships across documents are your problem to manage, and denormalized data can drift out of sync." },
        { type: "heading", text: "Graph — Neo4j" },
        { type: "p", text: "First-class **nodes** and **typed, directed relationships**, queried with a traversal language (**Cypher**). Relationships are stored as physical pointers, so walking 'friends-of-friends-of-friends' is O(hops), not O(exploding joins). Unbeatable when the *connections themselves* are the question: social graphs, fraud rings, recommendations, dependency/impact analysis, knowledge graphs. **Neo4j** is the reference; Memgraph and Amazon Neptune are alternatives. Bad at bulk tabular scans and aggregations." },
        { type: "heading", text: "Key-value — Redis" },
        { type: "p", text: "The simplest model: an opaque **value** behind a **key**, with O(1) get/set and no query language to speak of. **Redis** keeps data in memory, so it's blisteringly fast and the default for **caches, sessions, rate limiters, leaderboards, queues, pub/sub**. Modern Redis (and Valkey, the open fork) adds data structures (lists, sorted sets, streams), search, and vectors. Trade-off: you can only fetch by key — no ad-hoc queries — and memory is the limit." },
        { type: "heading", text: "Wide-column — Cassandra / ScyllaDB" },
        { type: "p", text: "A partitioned, sparse table model built for **linear horizontal scale and enormous write throughput**. You design the table *around the query* (the partition key decides which node data lives on), giving predictable performance at petabyte scale with no single point of failure. **Cassandra** and its C++ rewrite **ScyllaDB** power time-series, event logs, messaging, and IoT at companies with huge write volume. Cost: no joins, limited ad-hoc querying, and eventual consistency by default — you must know your access patterns up front." },
        { type: "heading", text: "Search — Elasticsearch / OpenSearch" },
        { type: "p", text: "Built on an **inverted index** (Lucene) for **full-text search, relevance ranking, fuzzy matching, faceting, and aggregations**. It's not usually your source of truth — you *index into it* from your primary DB and query it for search boxes, filters, and log/observability analytics. **Elasticsearch** and its open fork **OpenSearch** dominate; Meilisearch and Typesense are lighter alternatives. Cost: near-real-time (not instant) indexing, and keeping the index in sync with the source of truth." },
        { type: "heading", text: "Time-series — TimescaleDB / InfluxDB" },
        { type: "p", text: "Optimized for **timestamped, append-mostly** data: metrics, sensors, financial ticks, observability. They exploit time-ordering for massive compression, automatic time-partitioning, retention/downsampling policies, and fast time-bucketed aggregations. **TimescaleDB** is a Postgres extension (you keep SQL and joins); **InfluxDB** and **ClickHouse** (a columnar analytics DB often used here) are purpose-built. Cost: bad at random updates/deletes — the model assumes you mostly append." },
        { type: "heading", text: "Vector — pgvector / Pinecone" },
        { type: "p", text: "Stores high-dimensional **embedding vectors** and finds the *nearest* ones via **approximate nearest-neighbor (ANN)** indexes (HNSW, IVF). This is the storage layer behind **semantic search and RAG**: embed text/images, store the vectors, query by similarity. **pgvector** adds this to Postgres (keep your metadata + vectors together); **Pinecone**, **Qdrant**, **Weaviate**, and **Milvus** are dedicated vector DBs. Cost: ANN is *approximate* (recall vs speed trade-off), and indexes are memory-hungry." },
        { type: "callout", variant: "tip", text: "Notice how many of these are now *features of Postgres*: JSONB (document), full-text search (search-lite), TimescaleDB (time-series), pgvector (vector), Apache AGE (graph). For small-to-medium scale, one Postgres often replaces three specialized stores — you only split them out when a single engine can't meet the load or access pattern. This is the crux of the decision guide later." }
      ]
    },
    {
      id: "dimensions",
      title: "The big side-by-side: eight dimensions across the systems",
      level: "core",
      body: [
        { type: "p", text: "This is the reference table to come back to. Columns are the **structural bets** each engine makes; rows are the systems this group teaches plus the key others. Read a row to understand a product; read a column to understand a trade-off." },
        { type: "table", headers: ["System", "Data model", "Schema", "Query language", "Joins / relationships", "Transactions / ACID"], rows: [
          ["**PostgreSQL**", "relational (+ JSONB, vector, GIS)", "rigid (typed columns)", "SQL", "true joins + FK integrity", "full ACID, all isolation levels"],
          ["**MySQL**", "relational", "rigid", "SQL", "joins + FK (InnoDB)", "full ACID (InnoDB)"],
          ["**SQLite**", "relational (in-process file)", "rigid (flexible typing)", "SQL", "joins + FK", "ACID (single writer)"],
          ["**MongoDB**", "document (BSON)", "flexible per-doc", "MQL + aggregation pipeline", "embed, or `$lookup` (limited)", "ACID per-doc; multi-doc txns since 4.0"],
          ["**Neo4j**", "property graph", "flexible (optional constraints)", "Cypher", "native pointer traversal", "full ACID"],
          ["**Redis**", "key-value (+ structures)", "none", "commands (GET/SET…)", "none (manual references)", "atomic ops; MULTI/Lua, not general ACID"],
          ["**Cassandra / Scylla**", "wide-column", "flexible per-row", "CQL (SQL-like)", "none (denormalize)", "tunable; lightweight txns only"],
          ["**Elasticsearch**", "document + inverted index", "dynamic mapping", "Query DSL / ES|QL", "none (denormalize/nested)", "no multi-doc ACID"],
          ["**ClickHouse**", "columnar (analytics)", "rigid", "SQL", "joins (analytic, not OLTP)", "no OLTP transactions"],
          ["**DynamoDB**", "key-value / document", "flexible", "PartiQL / API", "none (single-table design)", "ACID transactions (limited)"]
        ] },
        { type: "p", text: "The other half of the same matrix — how each **scales, defaults its consistency, and what it's best at**:" },
        { type: "table", headers: ["System", "Scaling model", "Consistency default", "Sweet-spot workloads"], rows: [
          ["**PostgreSQL**", "vertical + read replicas; sharding is add-on (Citus)", "strong (serializable available)", "OLTP, integrity-critical apps, the sane default"],
          ["**MySQL**", "vertical + read replicas; Vitess for sharding", "strong", "web apps, read-heavy CRUD"],
          ["**SQLite**", "single node (it's a file)", "strong (serialized writes)", "embedded, edge, tests, small apps"],
          ["**MongoDB**", "horizontal (native sharding + replica sets)", "tunable (majority default now)", "content, catalogs, evolving schemas, aggregates"],
          ["**Neo4j**", "vertical; causal clustering for HA/reads", "strong", "graphs: fraud, recs, networks, lineage"],
          ["**Redis**", "horizontal (cluster); replicas", "strong per-key (async repl)", "cache, sessions, queues, rate-limit, leaderboards"],
          ["**Cassandra / Scylla**", "horizontal, leaderless, linear", "tunable (eventual default)", "huge writes, time-series, always-on multi-region"],
          ["**Elasticsearch**", "horizontal (shards + replicas)", "eventual (near-real-time)", "full-text search, log/observability analytics"],
          ["**ClickHouse**", "horizontal (columnar, sharded)", "eventual", "OLAP: analytics over billions of rows"],
          ["**DynamoDB**", "horizontal, fully managed, auto", "eventual default (strong opt-in)", "serverless, predictable key-access at scale"]
        ] },
        { type: "callout", variant: "note", text: "Read the columns as spectrums, not labels. **Schema** runs rigid → flexible → none. **Consistency** runs strong → tunable → eventual. **Scaling** runs vertical → replicas → sharded → leaderless. Every step toward the right buys scale/flexibility and spends guarantees/queryability. Choosing a database is choosing where on each spectrum this workload should sit." }
      ]
    },
    {
      id: "relational-deep",
      title: "Relational (SQL) deep-compare",
      level: "core",
      body: [
        { type: "p", text: "The relational model (Codd, 1970) is the most battle-tested, best-understood, and most *general-purpose* database design ever shipped. Data as typed tables, related by keys, queried declaratively with SQL, with the engine guaranteeing integrity and ACID. If you can't articulate why you're not using it, use it." },
        { type: "table", headers: ["Strengths", "Weaknesses"], rows: [
          ["Ad-hoc queries: join/filter/aggregate any way at query time", "Rigid schema — migrations needed to change shape"],
          ["Integrity: FKs, unique/check constraints, types enforced by the DB", "Object–relational impedance mismatch (nested objects → many tables)"],
          ["ACID: strong transactions across multiple rows/tables", "Horizontal write-scaling is hard (sharding is bolt-on, not native)"],
          ["Mature: 40+ yrs of tooling, ORMs, DBAs, docs, optimizers", "Very deep relationship traversal is join-explosive (graphs win there)"],
          ["SQL is portable, declarative, and universally known", "Rapidly-changing / heterogeneous data feels forced into tables"]
        ] },
        { type: "list", items: [
          "**Choose it when:** data is structured and relational; you need integrity and transactions (anything money-, inventory-, or booking-related); you'll run ad-hoc/reporting queries; you don't know all future query patterns (SQL keeps options open).",
          "**Avoid / supplement it when:** you truly need >single-node *write* throughput a shard can't give (add Vitess/Citus or a wide-column store); your access is 100% by-key at massive scale (key-value); the query is deep graph traversal (graph DB) or full-text relevance (search)."
        ] },
        { type: "heading", text: "Postgres vs MySQL vs SQLite — quick positioning" },
        { type: "table", headers: ["", "PostgreSQL", "MySQL", "SQLite"], rows: [
          ["Identity", "correctness + features 'kitchen sink'", "simple, fast, ubiquitous web DB", "in-process, zero-config file"],
          ["Standout", "JSONB, GIS, vector, extensions, rich types, MVCC", "huge hosting/ops ecosystem, replication", "no server, embeds anywhere, tiny"],
          ["Pick when", "default for new apps; complex/analytical/typed data", "existing LAMP/PHP stack, read-heavy CRUD", "mobile/desktop/edge, tests, small tools"]
        ] },
        { type: "callout", variant: "tip", text: "In 2026 the safe default for a new backend is **PostgreSQL**. It absorbs document (JSONB), search (full-text), time-series (TimescaleDB), and vector (pgvector) workloads well enough that many teams never add a second database. Reach past it only when a measured limit forces you." }
      ]
    },
    {
      id: "document-deep",
      title: "Document (MongoDB) deep-compare",
      level: "core",
      body: [
        { type: "p", text: "The document model stores each entity as a self-contained, nested JSON/BSON document with a flexible per-document schema. Its core idea is **the aggregate**: keep the things you read together *stored* together, so a page load is one document fetch instead of a five-table join." },
        { type: "table", headers: ["Strengths", "Weaknesses"], rows: [
          ["Data maps 1:1 to app objects — no ORM impedance mismatch", "Cross-document relationships are your job (no enforced FKs)"],
          ["Flexible schema: add fields without a migration", "Denormalized data can drift/duplicate (update in many places)"],
          ["Read an aggregate in one hit — no joins for nested data", "Ad-hoc queries across documents are weaker than SQL joins"],
          ["Native horizontal sharding + replica sets built-in", "'Flexible schema' becomes 'no schema discipline' without rigor"],
          ["Fast iteration for evolving / heterogeneous data", "Unbounded arrays inside a doc hit the 16MB doc-size limit"]
        ] },
        { type: "list", items: [
          "**Choose it when:** each entity is a self-contained aggregate read/written as a whole (a product with variants, a CMS article, a user profile with settings, an event blob); the schema varies per record or evolves fast; you want built-in horizontal scale; relationships are shallow/contained.",
          "**Avoid it when:** data is highly relational with many-to-many links and you need cross-entity integrity/transactions everywhere (relational fits better); you need rich ad-hoc reporting across entities; the 'right' model is genuinely a graph (deep traversal) or a ledger (strict ACID across accounts)."
        ] },
        { type: "callout", variant: "gotcha", text: "The classic mistake is modeling relational data in MongoDB — many collections joined via `$lookup` on every query. If you find yourself emulating joins constantly, you picked the wrong tool: either **embed** (denormalize the aggregate) or use a relational DB. Model documents around **how the app reads them**, not around normalized entities. And yes — MongoDB has had **multi-document ACID transactions since 4.0 (2018)**; the 'Mongo can't do transactions' line is years out of date (see misconceptions)." }
      ]
    },
    {
      id: "graph-deep",
      title: "Graph (Neo4j) deep-compare",
      level: "core",
      body: [
        { type: "p", text: "A property graph stores **nodes** and **typed, directed relationships** as first-class citizens, each with properties. Crucially, a relationship is a **physical pointer** between two nodes, so traversing it is a constant-time pointer hop — 'index-free adjacency'. Deep, variable-length traversals that would be catastrophic self-joins in SQL become natural, fast Cypher patterns." },
        { type: "table", headers: ["Strengths", "Weaknesses"], rows: [
          ["Multi-hop traversal is O(hops), not O(join explosion)", "Bad at bulk tabular scans and big aggregations"],
          ["Relationships are data (typed, with properties)", "Sharding a graph is hard — relationships cross partitions"],
          ["Expressive pattern-matching (Cypher `(a)-[:KNOWS]->(b)`)", "Smaller ecosystem/talent pool than SQL"],
          ["Path/shortest-path/centrality algorithms built in", "Overkill when relationships are shallow (1–2 joins)"],
          ["Schema-flexible; whiteboard model = stored model", "Not a general-purpose primary store for flat data"]
        ] },
        { type: "list", items: [
          "**Choose it when:** the *relationships are the query* — friends-of-friends, recommendation ('people who bought X also…'), fraud-ring detection, dependency/impact analysis, knowledge graphs, network/IT topology, identity resolution. Any question with 'how are these connected' or variable-depth paths.",
          "**Avoid it when:** your queries are mostly single-entity CRUD, aggregations, or reporting (relational wins); relationships never go beyond one or two joins (SQL joins are fine and simpler); you need one store for everything (a graph DB is a specialist, usually a *secondary* store fed from your primary)."
        ] },
        { type: "callout", variant: "tip", text: "A useful test: write the query in SQL first. If it needs **3+ self-joins or a recursive CTE that keeps getting deeper/slower**, a graph database will express it in one short pattern and run it fast. If SQL handles it in one or two joins, you don't need a graph DB — see the misconception 'graph DBs are only for social networks'." }
      ]
    },
    {
      id: "three-databases",
      title: "The same domain in three databases",
      level: "core",
      body: [
        { type: "p", text: "Nothing clarifies the paradigms like modeling **one domain** three ways. Take a tiny e-commerce world: **Users** place **Orders** that contain **Products**, and users can also *recommend* products to friends. Watch what each model makes easy and what it makes awkward." },
        { type: "heading", text: "1. Relational (PostgreSQL) — normalize into tables, join at query time" },
        { type: "code", lang: "sql", code: "-- data is split across normalized tables, tied by keys\nCREATE TABLE users    (id BIGINT PRIMARY KEY, name TEXT);\nCREATE TABLE products (id BIGINT PRIMARY KEY, name TEXT, price NUMERIC);\nCREATE TABLE orders   (id BIGINT PRIMARY KEY, user_id BIGINT REFERENCES users);\nCREATE TABLE order_items (order_id BIGINT REFERENCES orders,\n                          product_id BIGINT REFERENCES products, qty INT);\n\n-- Q: total spend per user. Joins + GROUP BY: the relational home turf.\nSELECT u.name, SUM(p.price * oi.qty) AS total\nFROM users u\nJOIN orders o       ON o.user_id = u.id\nJOIN order_items oi ON oi.order_id = o.id\nJOIN products p     ON p.id = oi.product_id\nGROUP BY u.name\nORDER BY total DESC;" },
        { type: "p", text: "**Easy:** integrity (an order can't reference a missing user), ad-hoc aggregation, no duplication. **Hard:** reading a whole order is a multi-table join; the 'who recommends what to whom' graph would need recursive self-joins." },
        { type: "heading", text: "2. Document (MongoDB) — embed the aggregate, avoid the join" },
        { type: "code", lang: "json", code: "// one order document contains everything needed to render it\n{\n  \"_id\": \"ord_1\",\n  \"user\": { \"id\": \"u1\", \"name\": \"Ada\" },\n  \"items\": [\n    { \"productId\": \"p1\", \"name\": \"Keyboard\", \"price\": 80, \"qty\": 1 },\n    { \"productId\": \"p2\", \"name\": \"Mouse\",    \"price\": 30, \"qty\": 2 }\n  ],\n  \"total\": 140\n}" },
        { type: "code", lang: "js", code: "// Q: total spend per user — the aggregation pipeline\ndb.orders.aggregate([\n  { $group: { _id: \"$user.id\",\n              name:  { $first: \"$user.name\" },\n              total: { $sum: \"$total\" } } },\n  { $sort: { total: -1 } }\n]);" },
        { type: "p", text: "**Easy:** fetch/render one order in a single read — no joins, shape matches the UI. **Hard:** the product name and price are *copied* into every order; a price change or product rename doesn't propagate. Cross-entity questions lean on `$lookup` (a join you were trying to avoid) or a denormalized read model." },
        { type: "heading", text: "3. Graph (Neo4j) — model the connections, traverse them" },
        { type: "code", lang: "cypher", code: "// nodes + typed relationships ARE the model\nCREATE (ada:User {name:'Ada'})-[:PLACED]->(o:Order)\nCREATE (o)-[:CONTAINS {qty:1}]->(:Product {name:'Keyboard', price:80})\nCREATE (ada)-[:FRIEND]->(:User {name:'Bob'})\n\n// Q: recommend products bought by friends-of-friends that Ada hasn't bought.\n// Trivial in Cypher; a nightmare of self-joins in SQL.\nMATCH (me:User {name:'Ada'})-[:FRIEND*1..2]-(f:User)\n      -[:PLACED]->(:Order)-[:CONTAINS]->(p:Product)\nWHERE NOT (me)-[:PLACED]->(:Order)-[:CONTAINS]->(p)\nRETURN p.name, count(*) AS score\nORDER BY score DESC LIMIT 5;" },
        { type: "p", text: "**Easy:** variable-depth relationship queries (`[:FRIEND*1..2]`), recommendations, path-finding — expressed once, run fast. **Hard:** 'total revenue this quarter' is a bulk aggregation the graph engine isn't built for; you'd keep that in the relational store." },
        { type: "table", headers: ["Question", "Relational", "Document", "Graph"], rows: [
          ["Render one order", "join 3–4 tables", "**one read** (embedded)", "traverse a few edges"],
          ["Total spend per user", "**join + GROUP BY**", "aggregation pipeline", "not its strength"],
          ["Friends-of-friends recs", "recursive self-joins (painful)", "very awkward", "**one Cypher pattern**"],
          ["Change a product's price everywhere", "**one UPDATE**", "update every embedded copy", "one node update"],
          ["Enforce 'order → real user'", "**FK constraint**", "app-enforced", "relationship = intrinsic"]
        ] },
        { type: "callout", variant: "note", text: "The punchline: the *same* data is easy or hard depending on the model, and each model has a question it's proud of and a question it's ashamed of. Real systems often use **all three** — Postgres as the source of truth and ledger, a document/read-model for fast order rendering, and a graph for recommendations — kept in sync (see Polyglot persistence)." }
      ]
    },
    {
      id: "graphql-fit",
      title: "Where GraphQL fits (it isn't a database)",
      level: "core",
      body: [
        { type: "p", text: "GraphQL lives in this group and has 'query language' in its name, so it's worth stating plainly: **GraphQL is not a database and does not store anything.** It is an **API query layer** — a typed contract and runtime that sits *in front of* one or more data sources. SQL and Cypher are languages a database engine executes against its own storage; GraphQL is a language a *client* uses to ask your *API* for data, which your resolvers then fetch from whatever database(s) you actually run." },
        { type: "table", headers: ["", "SQL / Cypher", "GraphQL"], rows: [
          ["What it is", "a **database** query language", "an **API** query language + runtime"],
          ["Runs against", "the engine's own on-disk storage", "your resolvers (which call databases/services)"],
          ["Stores data?", "**yes** — it *is* the storage engine's language", "**no** — zero storage of its own"],
          ["Who writes the query", "backend / DBA", "the API **client** (frontend)"],
          ["Executes the query", "the DB engine", "your GraphQL server → your DB → the engine"],
          ["Layer", "persistence", "API / transport"]
        ] },
        { type: "code", lang: "text", code: "Browser / mobile\n     │  GraphQL query  (API layer — no storage)\n     ▼\nGraphQL server  ──resolvers──►  Postgres (SQL)     ← source of truth\n                             ├─►  Neo4j    (Cypher)  ← recommendations\n                             ├─►  Redis    (GET/SET)  ← cache\n                             └─►  Elasticsearch (DSL) ← search\n     ▲\n     └── one typed response stitched from many databases" },
        { type: "list", items: [
          "**GraphQL federates, databases persist.** A single GraphQL query can be resolved from Postgres *and* Redis *and* a REST microservice in one response. None of those are 'GraphQL databases' — GraphQL just orchestrates them.",
          "**A resolver ultimately runs SQL/Cypher/etc.** GraphQL doesn't replace your database or its query language; it wraps them behind a client-friendly, typed graph.",
          "**Comparing GraphQL to Postgres is a category error** — it's like comparing a waiter to a kitchen. Compare GraphQL to **REST/gRPC/tRPC** (other API styles), and compare Postgres to **MongoDB/Neo4j** (other databases).",
          "**'Hasura/PostGraphile expose Postgres as GraphQL'** — even here, GraphQL is the API skin; Postgres is still the database doing the storing and the real query execution."
        ] },
        { type: "callout", variant: "warn", text: "Don't let the shared word 'query' fool a junior into thinking GraphQL is a NoSQL database or a Postgres replacement. It's an API contract. It solves over-/under-fetching between client and server; it does **not** solve persistence, indexing, transactions, or durability — those remain the job of the actual database sitting behind it." }
      ]
    },
    {
      id: "acid-base",
      title: "ACID vs BASE, CAP & PACELC, and consistency models",
      level: "core",
      body: [
        { type: "p", text: "The deepest axis separating databases is **what they promise when things go wrong** (a crash, a network partition, concurrent writers). Two philosophies anchor the ends." },
        { type: "table", headers: ["", "ACID (relational, Neo4j, Mongo txns)", "BASE (many NoSQL at scale)"], rows: [
          ["Stands for", "Atomic, Consistent, Isolated, Durable", "Basically Available, Soft-state, Eventually consistent"],
          ["Promise", "a txn wholly succeeds or wholly fails; reads are correct", "always answers; replicas converge *eventually*"],
          ["Optimizes for", "**correctness**", "**availability + scale**"],
          ["Cost", "coordination limits horizontal write-scale", "app must tolerate temporarily stale/conflicting reads"],
          ["Use for", "money, inventory, bookings, anything you can't get wrong", "feeds, counters, catalogs, telemetry, caches"]
        ] },
        { type: "heading", text: "CAP — and why PACELC is the better lens" },
        { type: "p", text: "**CAP** says: during a network **P**artition, a distributed system must choose **C**onsistency (reject/stall to stay correct) or **A**vailability (answer with possibly-stale data). You cannot have both *while partitioned*. But partitions are rare, so CAP under-describes normal life. **PACELC** completes it: **if Partitioned, choose A or C; Else (normal operation), choose Latency or Consistency.** That 'else' clause is the daily trade-off — strong consistency costs round-trips (latency) even when the network is healthy." },
        { type: "table", headers: ["System", "PACELC classification", "In plain terms"], rows: [
          ["**PostgreSQL / MySQL**", "PC/EC", "consistent when partitioned *and* normally — you pay latency for correctness"],
          ["**Cassandra / Dynamo**", "PA/EL", "stays available under partition; favors low latency over strict consistency (tunable)"],
          ["**MongoDB**", "PC/EC (with majority)", "leans consistent; tunable read/write concerns move the dial"],
          ["**Neo4j (cluster)**", "PC/EC", "prioritizes consistency of the graph"]
        ] },
        { type: "heading", text: "Tunable consistency, isolation levels, read/write concerns" },
        { type: "list", items: [
          "**Strong (linearizable):** a read always sees the latest committed write. Simple to reason about; costs coordination. Default in single-primary relational DBs.",
          "**Eventual:** replicas converge over time; a read *might* be stale for a moment. Cheap and highly available; the app must be OK with it (a like-count is; a bank balance isn't).",
          "**Tunable / quorum:** you dial it *per query*. In Cassandra/Mongo you set how many replicas must acknowledge — e.g. `W + R > N` (write-quorum + read-quorum exceed replica count) yields strong reads; smaller quorums trade consistency for speed.",
          "**SQL isolation levels** (per-transaction): `READ COMMITTED` (default in Postgres) → `REPEATABLE READ` → `SERIALIZABLE` — each rules out more anomalies (dirty/non-repeatable/phantom reads, write skew) at more locking/abort cost.",
          "**Mongo read/write concerns** are the NoSQL analog: `writeConcern: majority` = ack by a majority (durable), `readConcern: majority`/`linearizable` = don't read un-replicated data. Setting both gives you effectively strong consistency on demand."
        ] },
        { type: "callout", variant: "gotcha", text: "'NoSQL is eventually consistent' and 'SQL is always strong' are both half-truths. Modern NoSQL is **tunable** (Mongo/Cassandra can give strong reads with the right concern/quorum), and SQL read-replicas serve **stale** reads unless you read the primary. The real question isn't SQL vs NoSQL — it's *what consistency does THIS operation need*, set per operation." }
      ]
    },
    {
      id: "scaling",
      title: "Scaling & availability",
      level: "core",
      body: [
        { type: "p", text: "The other great divider is *how a system grows past one machine*. The vocabulary here is worth precision because vendors blur it." },
        { type: "table", headers: ["Technique", "What it does", "Buys you", "Costs / limits"], rows: [
          ["**Vertical scale (up)**", "bigger box: more CPU/RAM/disk", "simplicity — no distribution", "a ceiling + a single point of failure"],
          ["**Read replicas**", "copy primary; serve reads from copies", "read throughput + HA", "**replica lag** = stale reads; writes still single-node"],
          ["**Sharding / partitioning**", "split data across nodes by a key", "horizontal **write** scale", "cross-shard joins/txns hard; hot shards; hard to reshard"],
          ["**Leader–follower**", "one primary takes writes, followers replicate", "consistency + read scale", "failover gap; write bottleneck at the leader"],
          ["**Leaderless (Dynamo-style)**", "any node accepts writes; quorum reconciles", "always-on, multi-region writes", "conflict resolution; eventual consistency"]
        ] },
        { type: "heading", text: "How each paradigm typically scales" },
        { type: "list", items: [
          "**Relational:** scale **up** first, then add **read replicas** for read-heavy load. Write-sharding is a *bolt-on* (Citus for Postgres, Vitess for MySQL) — powerful but operationally heavy. This 'joins + strong consistency don't shard for free' reality is why relational earns a reputation for being hard to scale writes (it's not that it 'can't scale' — see misconceptions).",
          "**Document (Mongo):** **native** sharding + replica sets; horizontal scale is a first-class, built-in feature. Pick a good shard key or you get hot spots.",
          "**Wide-column (Cassandra/Scylla):** **leaderless, linear** horizontal scale is the entire point — add nodes, throughput rises proportionally, no single point of failure, multi-region by design.",
          "**Key-value (Redis):** replicas for HA; **cluster** mode hash-slots keys across nodes. Memory-bound, so scale is also about fitting the working set in RAM.",
          "**Search / analytics (Elasticsearch, ClickHouse):** shard + replica across nodes natively; built to fan a query across many shards and merge."
        ] },
        { type: "callout", variant: "tip", text: "Order of moves for a growing relational app: (1) add indexes / fix queries, (2) add a **cache** (Redis) in front, (3) add **read replicas**, (4) move heavy search/analytics to a **specialized store**, and only then (5) **shard**. Sharding is the last resort, not the first — premature sharding is a top self-inflicted wound (see misconceptions)." }
      ]
    },
    {
      id: "polyglot",
      title: "Polyglot persistence: using several databases together",
      level: "core",
      body: [
        { type: "p", text: "**Polyglot persistence** means deliberately using different databases for the parts of a system where each fits best, instead of forcing one store to do everything. A mature product commonly runs: **Postgres** (source of truth, transactions), **Redis** (cache + sessions + queues), **Elasticsearch** (search), and maybe **Neo4j** (recommendations) and a **vector** store (RAG). Each handles what it's best at." },
        { type: "code", lang: "text", code: "                 ┌──────────► Redis          (cache, sessions, rate-limit)\n  App / API ─────┼──────────► Elasticsearch  (full-text search, logs)\n  (writes go to  ├──────────► Neo4j          (recommendation graph)\n   Postgres)     └──────────► pgvector/Pinecone (semantic search / RAG)\n        │\n        ▼\n     Postgres  ── source of truth (ACID) ──► CDC / events ──► sync the others" },
        { type: "list", items: [
          "**One source of truth.** Writes land in the authoritative store (usually Postgres, with ACID). The others are **derived read-models / indexes**, rebuildable from the source. Never have two systems both claim authority over the same fact.",
          "**CQRS / read-models.** Split the write model (normalized, correct) from read models (denormalized, fast, shaped per query). The search index and the graph are read-models fed from the write side.",
          "**Syncing via CDC.** **Change Data Capture** (Debezium reading the Postgres WAL → Kafka) streams every committed change to downstream stores so the cache/index/graph stay current without dual-writes. Dual-writing from app code is the classic way to create drift and lost updates — prefer CDC/outbox.",
          "**The outbox pattern.** Write the business row *and* an 'event' row in the same transaction; a relay publishes events after commit — atomic, no lost or phantom events across systems.",
          "**The operational tax is real.** Every extra store is another thing to deploy, monitor, back up, secure, upgrade, and reason about during an incident (and another consistency seam). N databases ≈ N× the ops surface."
        ] },
        { type: "callout", variant: "good", text: "**Start with Postgres. Add a store only when a measured limit forces it.** Postgres already does JSONB (documents), full-text search, LISTEN/NOTIFY (light pub/sub), TimescaleDB (time-series) and pgvector (embeddings) — often well enough to defer a second database for years. Polyglot persistence is a *scaling* answer, not a *starting* architecture. Reach for the specialist when the generalist provably can't keep up, not before." }
      ]
    },
    {
      id: "decision-guide",
      title: "Decision guide: choose X when…",
      level: "core",
      body: [
        { type: "p", text: "A practical cheat for picking a store. First the by-need table, then concrete scenario → recommendation." },
        { type: "table", headers: ["Choose…", "When your primary need is…", "Because"], rows: [
          ["**PostgreSQL**", "structured data, integrity, transactions, ad-hoc queries", "the safe, general-purpose default — do everything until proven insufficient"],
          ["**MongoDB**", "self-contained aggregates, evolving schema, easy horizontal scale", "document model + native sharding fit nested, changing data"],
          ["**Neo4j**", "deep relationship traversal / path queries", "index-free adjacency makes multi-hop O(hops)"],
          ["**Redis**", "sub-ms access, caching, sessions, queues, counters", "in-memory key-value with rich structures"],
          ["**Cassandra / Scylla**", "massive write throughput, always-on, multi-region", "leaderless linear scale, no single point of failure"],
          ["**Elasticsearch**", "full-text search, relevance, faceting, log analytics", "inverted index + scoring, purpose-built for search"],
          ["**TimescaleDB / ClickHouse**", "time-series metrics / analytics over huge tables", "time-partitioning + columnar compression + fast aggregates"],
          ["**pgvector / Pinecone**", "semantic similarity search, RAG over embeddings", "ANN indexes over high-dimensional vectors"]
        ] },
        { type: "heading", text: "Scenario → recommendation" },
        { type: "table", headers: ["Scenario", "Recommendation", "Why"], rows: [
          ["Financial ledger / payments", "**Postgres** (or any strict RDBMS)", "needs ACID, multi-row transactions, absolute correctness"],
          ["Product catalog **with search**", "**Postgres** source of truth + **Elasticsearch** index", "relational integrity + real full-text relevance/facets"],
          ["Recommendations / fraud rings", "**Neo4j** (secondary, fed from Postgres)", "the query is multi-hop relationship traversal"],
          ["Session cache / rate limiting", "**Redis**", "sub-ms key access, TTLs, atomic counters"],
          ["Metrics / IoT / observability", "**TimescaleDB / InfluxDB / ClickHouse**", "append-mostly timestamped data, time-bucketed rollups"],
          ["RAG / semantic search", "**pgvector** (small) or **Pinecone/Qdrant** (large)", "embeddings + approximate nearest-neighbor search"],
          ["Rapidly-evolving content/CMS", "**MongoDB** (or Postgres JSONB)", "flexible nested documents, schema churn"],
          ["Global write-heavy event log", "**Cassandra / ScyllaDB**", "linear write scale, multi-region, no SPOF"]
        ] },
        { type: "callout", variant: "note", text: "Notice most rows above still have **Postgres as the base**, with a specialist *added* for one job. That's the shape of most healthy systems: a strong relational core plus a targeted secondary store, not a zoo of equals. Choose by the workload's dominant access pattern and its correctness needs — never by what's trending." }
      ]
    },
    {
      id: "misconceptions",
      title: "Common misconceptions & headaches",
      level: "core",
      body: [
        { type: "p", text: "The myths and self-inflicted wounds that drive bad database choices. Most are cargo-culted one-liners that were never fully true, or were true a decade ago and aren't now." },
        { type: "heading", text: "1. 'NoSQL means no schema'" },
        { type: "callout", variant: "gotcha", text: "There's no such thing as schemaless data — only **schema-on-write** (the DB enforces it) vs **schema-on-read** (your *application code* enforces it). A flexible-schema store just moves the schema into your app, where it's *less* visible and *less* enforced. Un-disciplined 'schemaless' collections become a swamp of inconsistent shapes. Use schema validation (Mongo's `$jsonSchema`) and treat the shape as real even when the DB doesn't force it." },
        { type: "heading", text: "2. 'SQL doesn't scale'" },
        { type: "callout", variant: "warn", text: "Relational databases scale reads and vertical load enormously (huge companies run on Postgres/MySQL). What's genuinely hard is *distributed write* scaling with cross-node joins + strong consistency — but you hit that limit far later than you think, and Citus/Vitess/CockroachDB exist for when you do. 'SQL doesn't scale' usually means 'I didn't index, cache, or add a read replica.' Fix the query before you flee the paradigm." },
        { type: "heading", text: "3. 'MongoDB can't do transactions'" },
        { type: "callout", variant: "note", text: "Out of date since 2018. MongoDB has **multi-document ACID transactions since 4.0** (and across shards since 4.2). Single-document writes were always atomic. The real guidance is that if you find yourself needing multi-document transactions *constantly*, your documents may be modeled wrong (or the data is relational) — not that Mongo can't do them." },
        { type: "heading", text: "4. 'Graph databases are only for social networks'" },
        { type: "callout", variant: "gotcha", text: "Social graphs are the poster child, but the value is *any* deeply-connected data: fraud-ring detection, recommendation engines, supply-chain and dependency/impact analysis, network/IT topology, identity resolution, knowledge graphs, access-control/permission graphs. The test isn't 'is it social' — it's 'do my important queries traverse many hops of relationships?'" },
        { type: "heading", text: "5. 'Just use one database for everything'" },
        { type: "callout", variant: "note", text: "Half-right. A single well-run Postgres *is* the correct start for most systems and beats a premature zoo of stores. But dogmatically forcing full-text relevance, sub-ms caching, and petabyte time-series into one relational box eventually fails too. The truth is a curve: **one store early, add specialists only when a measured limit forces it** — over-fragmenting early and refusing to ever split are both mistakes." },
        { type: "heading", text: "6. Over-fragmenting: a database per feature" },
        { type: "callout", variant: "warn", text: "The opposite failure of #5. Adopting five databases for a system serving 1000 users buys you five ops burdens, five backup/restore stories, five consistency seams, and no benefit. Every store must **earn its place** against a real limit of the incumbent. Fewer stores you operate *well* beats many you operate badly." },
        { type: "heading", text: "7. Premature sharding" },
        { type: "callout", variant: "warn", text: "Sharding is the most expensive scaling move — it breaks joins and cross-shard transactions, complicates every query, and is painful to re-key later. Exhaust **indexing → caching → read replicas → offloading search/analytics** first. Most teams that shard early did not need to, and pay for it forever. Shard when a single primary's *write* volume is provably the wall, not before." },
        { type: "heading", text: "8. Choosing by hype, not workload" },
        { type: "callout", variant: "gotcha", text: "The graveyard is full of apps that picked a database because it was trending (the 2010s 'MongoDB for everything', the 2020s 'vector DB for everything') and then bent relational data around it. Start from *your* data shape, access patterns, scale, and consistency needs — the four questions from the Overview — and let those pick the store. The boring choice that fits your workload beats the exciting one that doesn't." },
        { type: "heading", text: "9. Eventual consistency assumed to be strong" },
        { type: "callout", variant: "gotcha", text: "A subtle production headache: reading from a **replica** (SQL or NoSQL) right after a write and getting stale data, then 'fixing' a phantom bug that's really replica lag. Know your store's default consistency, read your own writes from the primary (or with the right read concern/quorum) when correctness needs it, and design UIs to tolerate a moment of staleness where it's safe." }
      ]
    }
  ],

  packages: [
    { name: "PostgreSQL", why: "the general-purpose relational default — ACID, rich types, JSONB, full-text, extensions (PostGIS, TimescaleDB, pgvector, Citus, AGE). Start here." },
    { name: "MySQL / MariaDB", why: "the ubiquitous web relational DB; huge hosting ecosystem, mature replication (Vitess for sharding)" },
    { name: "SQLite", why: "in-process, zero-config, single-file relational DB — the most-deployed database on earth (mobile, edge, tests, small apps)" },
    { name: "MongoDB", why: "the leading document database — flexible BSON documents, aggregation pipeline, native sharding + replica sets, multi-doc ACID since 4.0" },
    { name: "Neo4j", why: "the reference property-graph database — Cypher, index-free adjacency, graph algorithms; for traversal-heavy connected data" },
    { name: "Redis / Valkey", why: "in-memory key-value store + data structures — cache, sessions, queues, rate-limiting, pub/sub, leaderboards (Valkey is the open fork)" },
    { name: "Apache Cassandra / ScyllaDB", why: "leaderless wide-column stores for linear horizontal write scale, multi-region, no single point of failure (Scylla is the C++ rewrite)" },
    { name: "Elasticsearch / OpenSearch", why: "Lucene-based search + analytics engines — full-text relevance, faceting, log/observability; index into it from your source of truth" },
    { name: "ClickHouse", why: "columnar OLAP database for fast analytics/aggregations over billions of rows; often paired with time-series workloads" },
    { name: "TimescaleDB / InfluxDB", why: "time-series stores for metrics/IoT/observability — time-partitioning, compression, retention/downsampling (TimescaleDB keeps SQL + joins)" },
    { name: "pgvector / Pinecone / Qdrant", why: "vector search for embeddings/RAG — ANN indexes (HNSW/IVF); pgvector keeps vectors in Postgres, the others are dedicated vector DBs" },
    { name: "Kafka + Debezium (CDC)", why: "Change Data Capture pipeline — stream committed DB changes to downstream read-models/indexes/graphs so polyglot stores stay in sync" },
    { name: "DBeaver / TablePlus", why: "universal database GUI clients — browse, query, and manage most SQL and many NoSQL engines from one tool" },
    { name: "Prisma / SQLAlchemy / Drizzle (ORMs)", why: "map app objects to relational rows with typed queries + migrations; abstract SQL while (ideally) keeping it visible when you need it" },
    { name: "CockroachDB / YugabyteDB", why: "distributed SQL ('NewSQL') — relational semantics + ACID with horizontal scale and geo-distribution, when a single primary truly isn't enough" }
  ],

  gotchas: [
    "**'The right tool' is decided by four things:** data-model fit, workload shape, scale, and consistency needs — not by what's trending. Choose by workload, always.",
    "**Start with Postgres.** It does documents (JSONB), search (full-text), time-series (TimescaleDB) and vectors (pgvector) well enough to defer a second store for years. Add a specialist only when a *measured* limit forces it.",
    "**'NoSQL = no schema' is false:** it's schema-on-read — the schema moved into your app code, where it's less enforced. Undisciplined flexible schemas rot into inconsistent shapes.",
    "**'SQL doesn't scale' usually means 'I didn't index/cache/replicate.'** Fix the query, add a cache and read replicas before abandoning relational.",
    "**MongoDB has had multi-document ACID transactions since 4.0 (2018).** If you need them constantly, though, your documents may be modeled wrong (or the data is relational).",
    "**Graph DBs aren't just social networks:** fraud rings, recommendations, dependency/impact, identity resolution, permissions, knowledge graphs. The test is multi-hop traversal, not the domain.",
    "**Premature sharding is a self-inflicted wound** — it breaks joins/transactions and is painful to re-key. Exhaust indexing → caching → read replicas → offloading search first.",
    "**Over-fragmenting is the opposite trap:** every extra store is more ops, backup, security, and a new consistency seam. Each must earn its place against a real limit of the incumbent.",
    "**Replica lag causes stale reads.** Read-your-own-writes from the primary (or with the right read concern/quorum) when correctness needs it; don't assume replicas are current.",
    "**Denormalization drifts.** Copying data (Mongo embeds, read-models) trades join cost for update cost — a rename/price change must update every copy. Prefer one source of truth + CDC over dual-writes.",
    "**Consistency is per-operation, not per-database.** Modern NoSQL is tunable (Mongo/Cassandra can give strong reads); SQL replicas serve stale reads. Set the level the operation actually needs.",
    "**CAP is only about partitions; PACELC is the daily lens** — even with a healthy network you trade latency vs consistency on every read.",
    "**GraphQL is not a database.** It's an API query layer with zero storage; a resolver still runs SQL/Cypher/etc. Compare it to REST/gRPC, not to Postgres.",
    "**Wide-column/DynamoDB force query-first modeling:** you design the table around the access pattern and can't easily run ad-hoc queries later. Know your queries up front or don't pick them.",
    "**Search/analytics engines are secondary indexes, not sources of truth.** Index into Elasticsearch/ClickHouse from your primary DB; they're near-real-time and can be rebuilt.",
    "**ANN vector search is approximate:** you trade recall for speed, and HNSW indexes are memory-hungry. Tune recall vs latency deliberately."
  ],

  flashcards: [
    { q: "What four questions decide which database fits?", a: "Data-model fit (tabular/nested/connected/by-key), workload shape (reads/writes/traversal/search/aggregation), scale (one node vs many), and consistency/durability needs (can a stale read cost money?)." },
    { q: "Name the eight database families and one example each.", a: "Relational (Postgres), Document (MongoDB), Graph (Neo4j), Key-value (Redis), Wide-column (Cassandra/Scylla), Search (Elasticsearch), Time-series (TimescaleDB/InfluxDB), Vector (pgvector/Pinecone)." },
    { q: "Why is the relational model the default choice?", a: "Most general-purpose: ad-hoc joins/queries, DB-enforced integrity (FKs, constraints, types), strong ACID transactions, 40+ years of tooling. Use it unless you can state why not." },
    { q: "When does the document model (Mongo) shine, and its main risk?", a: "When each entity is a self-contained aggregate read/written whole, with an evolving/varied schema. Risk: denormalized data drifts, and cross-document relationships/queries are your job (no enforced FKs)." },
    { q: "What makes graph DBs fast at traversal?", a: "Index-free adjacency — relationships are stored as physical pointers, so a multi-hop walk is O(hops), not the O(join-explosion) of SQL self-joins. Great when the connections ARE the query." },
    { q: "How would 'friends-of-friends who bought X' look in SQL vs Cypher?", a: "SQL: recursive self-joins / CTEs that get slower with depth. Cypher: one short pattern `(:User)-[:FRIEND*1..2]-(:User)-[:PLACED]->(:Order)-[:CONTAINS]->(:Product)`." },
    { q: "Is GraphQL a database?", a: "No. It's an API query layer with zero storage — it sits in front of databases and its resolvers run SQL/Cypher/etc. Compare it to REST/gRPC/tRPC, not to Postgres or MongoDB." },
    { q: "ACID vs BASE?", a: "ACID (relational, Neo4j, Mongo txns): a transaction wholly succeeds or fails, reads are correct — optimizes correctness. BASE (NoSQL at scale): basically available, eventually consistent — optimizes availability + scale." },
    { q: "What does CAP say, and why is PACELC better?", a: "CAP: during a partition you must pick Consistency or Availability. PACELC adds the common case: if Partitioned choose A/C, Else (normal) choose Latency/Consistency — strong consistency costs latency even with a healthy network." },
    { q: "What is tunable / quorum consistency?", a: "Setting consistency per query by choosing how many replicas must ack. If write-quorum + read-quorum > replica count (W+R>N), reads are strong; smaller quorums trade consistency for lower latency (Cassandra/Mongo)." },
    { q: "List SQL isolation levels from weak to strong.", a: "READ UNCOMMITTED → READ COMMITTED (Postgres default) → REPEATABLE READ → SERIALIZABLE. Each rules out more anomalies (dirty/non-repeatable/phantom reads, write skew) at more locking/abort cost." },
    { q: "Vertical vs horizontal scaling, and the ladder for a relational app?", a: "Vertical = bigger box (simple, has a ceiling). Horizontal = more boxes (replicas/shards). Ladder: index/tune → cache (Redis) → read replicas → offload search/analytics → shard (last resort)." },
    { q: "What is polyglot persistence and its default advice?", a: "Deliberately using different DBs where each fits best (e.g. Postgres + Redis + Elasticsearch + graph). Advice: start with Postgres, keep one source of truth, add a specialist only when a measured limit forces it." },
    { q: "What is CDC and why use it over dual-writes?", a: "Change Data Capture streams committed DB changes (e.g. Debezium reading the Postgres WAL → Kafka) to downstream read-models/indexes. Beats dual-writing from app code, which drifts and loses updates; pair with the outbox pattern." },
    { q: "Is 'schemaless' real?", a: "No — it's schema-on-read vs schema-on-write. Flexible-schema stores just move enforcement into your app code, where it's less visible. Use validation (Mongo $jsonSchema) and treat the shape as real anyway." },
    { q: "When should you pick a database by hype?", a: "Never. Start from your data shape, access patterns, scale, and consistency needs. The boring store that fits beats the trendy one you have to bend your data around." },
    { q: "Which store for: ledger, catalog+search, recommendations, session cache, metrics, RAG?", a: "Ledger → Postgres (ACID). Catalog+search → Postgres + Elasticsearch. Recommendations → Neo4j. Session cache → Redis. Metrics → TimescaleDB/ClickHouse. RAG → pgvector/Pinecone." },
    { q: "Why is premature sharding dangerous?", a: "It breaks joins and cross-shard transactions, complicates every query, and is painful to re-key later. Most teams that shard early didn't need to — exhaust cheaper scaling first." }
  ],

  cheatsheet: [
    { label: "Default choice", code: "Structured data + integrity + txns → PostgreSQL" },
    { label: "Nested aggregate", code: "Self-contained doc read/written whole → MongoDB" },
    { label: "Connections = the query", code: "Multi-hop traversal / paths → Neo4j (graph)" },
    { label: "Fastest by-key", code: "Cache / session / counter / queue → Redis" },
    { label: "Massive writes", code: "Linear write scale, no SPOF → Cassandra / ScyllaDB" },
    { label: "Full-text search", code: "Relevance / facets / logs → Elasticsearch (index, don't own)" },
    { label: "Time-series", code: "Metrics / IoT / observability → TimescaleDB / ClickHouse" },
    { label: "Semantic / RAG", code: "Embeddings + ANN → pgvector (small) / Pinecone (large)" },
    { label: "GraphQL is…", code: "an API layer, NOT a database — resolvers still run SQL/Cypher" },
    { label: "ACID vs BASE", code: "correctness (money/inventory) vs availability+scale (feeds/telemetry)" },
    { label: "PACELC", code: "if Partition: A or C; Else (normal): Latency or Consistency" },
    { label: "Strong read from quorum", code: "W + R > N   (write-quorum + read-quorum > replicas)" },
    { label: "Postgres default isolation", code: "READ COMMITTED  (→ REPEATABLE READ → SERIALIZABLE)" },
    { label: "Scaling ladder", code: "index → cache → read replicas → offload search → shard (last)" },
    { label: "Keep stores in sync", code: "CDC (Debezium→Kafka) + outbox, NOT dual-writes" },
    { label: "'Schemaless'", code: "= schema-on-read: enforcement just moved into your app" },
    { label: "Mongo transactions", code: "multi-document ACID since 4.0 (2018) — the myth is dead" },
    { label: "Add a database when", code: "a MEASURED limit of Postgres forces it — not by hype" }
  ]
});
