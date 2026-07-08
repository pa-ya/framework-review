(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "neo4j",
  name: "Neo4j",
  language: "Cypher",
  group: "Databases",
  navLabel: "Neo4j",
  color: "#008cc1",
  readMinutes: 34,
  tagline: "The leading **native graph database**: data is stored as a **property graph** (nodes + typed relationships), queried with **Cypher** — an ASCII-art pattern language now aligning with the ISO **GQL** standard. Relationships are first-class, so deep traversals that would be brutal multi-join SQL are cheap.",

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "Neo4j is a **native graph database**. Instead of tables and foreign keys, you store a **property graph**: **nodes** (entities) connected by **relationships** (edges), and both carry **properties** (key/value pairs). Nodes are tagged with **labels** (`:Person`, `:Movie`) and relationships have a single **type** (`:ACTED_IN`, `:FOLLOWS`) and a **direction**. That's the whole data model — there is no schema to declare up front." },
        { type: "code", lang: "cypher", code: "// The classic ASCII-art pattern: two nodes and a directed, typed relationship\n(alice:Person {name: 'Alice'})-[:FOLLOWS]->(bob:Person {name: 'Bob'})" },
        { type: "heading", text: "Why a graph DB: relationships are first-class" },
        { type: "p", text: "In a relational DB, a relationship is *implicit* — it exists only as a matching foreign-key value you must `JOIN` on at query time. In Neo4j a relationship is a **physical pointer stored on disk**. Traversing from a node to its neighbours is a direct pointer-chase, not an index lookup — this is called **index-free adjacency**. The cost of a hop is proportional to the number of relationships you actually traverse, *not* the total size of the database." },
        { type: "list", items: [
          "**Index-free adjacency:** each node knows its relationships directly, so 'friends of friends of friends' is a few pointer hops, independent of table size.",
          "**Relationships are first-class:** they have a type, a direction, and their own properties (`since`, `weight`, `role`) — no junction table needed.",
          "**Traversals beat multi-joins:** a query that is a 5-table self-join in SQL (and gets exponentially slower with depth) is a bounded graph traversal in Cypher.",
          "**Schema-optional:** you can start writing nodes immediately; add indexes and constraints as the model firms up."
        ] },
        { type: "heading", text: "The SQL pain it removes" },
        { type: "p", text: "Consider 'find people within 3 degrees of Alice.' In SQL that's three self-joins on a `friendships` table, and each extra degree multiplies the join cost. In Cypher it's one bounded variable-length pattern:" },
        { type: "code", lang: "cypher", code: "MATCH (alice:Person {name: 'Alice'})-[:FRIEND*1..3]-(reachable)\nRETURN DISTINCT reachable.name" },
        { type: "table", headers: ["Choose", "When", "Because"], rows: [
          ["**Neo4j (graph)**", "the *relationships* are the value: social graphs, recommendations, fraud rings, network/IT topology, knowledge graphs, access control, supply chains", "variable-depth traversal, path-finding, and pattern matching are native and stay fast as data grows"],
          ["**Relational (Postgres/MySQL)**", "tabular data, heavy aggregate reporting, strong transactional integrity across flat rows, well-known fixed-join shapes", "mature SQL, cost-based optimizers, and analytics on rows are its home turf"],
          ["**Document (Mongo)**", "self-contained aggregates read/written whole, few cross-document links", "denormalized documents avoid joins entirely — but model relationships poorly"]
        ] },
        { type: "callout", variant: "note", text: "Rule of thumb: if your interesting questions contain the words *path*, *connected*, *recommend*, *reachable*, *shortest*, *network*, or *degrees of separation* — and especially if join depth is variable or unknown — a graph database is the natural fit. If your data is flat and your queries are `GROUP BY`/aggregate reports, stay relational." }
      ]
    },
    {
      id: "setup",
      title: "Setup: Aura, Desktop, Docker, drivers",
      level: "core",
      body: [
        { type: "p", text: "You interact with Neo4j over the **Bolt** protocol (a binary, connection-oriented protocol on port **7687**, URI scheme `bolt://` or, for routing/TLS, `neo4j://` / `neo4j+s://`). On top of Bolt you use the **Neo4j Browser** (web UI at `http://localhost:7474`), the **`cypher-shell`** CLI, or an official language **driver**." },
        { type: "heading", text: "Three ways to run it" },
        { type: "list", items: [
          "**Neo4j Aura** — the fully managed cloud service (AuraDB for transactional, AuraDS for data science). Zero ops, auto-upgrades, always the current calendar version. Free tier for learning; the default choice for production if you don't want to run a database.",
          "**Neo4j Desktop** — a local dev app that manages database instances, plugins (APOC, GDS), and the Browser. Great for local development and demos.",
          "**Docker** — `neo4j:latest` (Community or Enterprise). Best for CI, containers, and reproducible local stacks."
        ] },
        { type: "code", lang: "bash", code: "# Run Neo4j 2025.x in Docker (calendar-versioned image tags, e.g. neo4j:2025.06)\ndocker run --name neo4j -p 7474:7474 -p 7687:7687 \\\n  -e NEO4J_AUTH=neo4j/your-strong-password \\\n  -e NEO4J_PLUGINS='[\"apoc\",\"graph-data-science\"]' \\\n  -v $HOME/neo4j/data:/data \\\n  neo4j:2025.06-enterprise\n\n# Browser -> http://localhost:7474   (Bolt endpoint on :7687)" },
        { type: "heading", text: "cypher-shell (the CLI)" },
        { type: "code", lang: "bash", code: "# Connect and run a query non-interactively\ncypher-shell -a neo4j://localhost:7687 -u neo4j -p your-password \\\n  \"MATCH (n) RETURN count(n) AS nodes;\"\n\n# Inside the shell, commands end with ; and :help lists meta-commands\nneo4j@neo4j> :use movies;        // switch database\nneo4j@neo4j> :param name => 'Alice';   // set a query parameter" },
        { type: "heading", text: "Official drivers" },
        { type: "p", text: "Neo4j ships first-party, uniformly-designed drivers for **Python**, **JavaScript/TypeScript**, **Java**, **Go**, and **.NET** — all speak Bolt and share the same session/transaction API shape (covered in the Drivers section). Community drivers exist for Rust, PHP, Ruby, etc." },
        { type: "code", lang: "bash", code: "pip install neo4j          # Python driver\nnpm install neo4j-driver   # JavaScript / TypeScript driver\n# Java: org.neo4j.driver:neo4j-java-driver   (Maven/Gradle)\n# Go:   go get github.com/neo4j/neo4j-go-driver/v5\n# .NET: dotnet add package Neo4j.Driver" },
        { type: "callout", variant: "tip", text: "Learning? Spin up a free **Aura** instance or run the Docker image with the built-in **`:play movies`** guide in Browser — it seeds the classic movie graph so every example below has data to run against. Use `neo4j+s://` (encrypted, routing-aware) when connecting to Aura." }
      ]
    },
    {
      id: "property-graph",
      title: "The property graph in depth",
      level: "core",
      body: [
        { type: "p", text: "Four building blocks. Master these and Cypher patterns read like sentences." },
        { type: "table", headers: ["Element", "What it is", "Example"], rows: [
          ["**Node**", "an entity — a record. Drawn as `()`", "`(:Person {name:'Alice', age:30})`"],
          ["**Label**", "a tag grouping nodes (a node can have several)", "`:Person`, `:Customer`, `:Admin`"],
          ["**Relationship**", "a directed, typed connection between two nodes. Drawn as `-[]->`", "`-[:BOUGHT {qty:2}]->`"],
          ["**Property**", "a typed key/value on a node OR a relationship", "`name:'Alice'`, `since: date('2020-01-01')`"]
        ] },
        { type: "heading", text: "Nodes can have multiple labels" },
        { type: "p", text: "Labels are sets, not a single class. A node can be both `:Person` and `:Employee`; each label can be independently indexed and used to anchor a query. Use labels for **roles/categories** you'll filter or index on." },
        { type: "code", lang: "cypher", code: "// A node with two labels and several properties\nCREATE (n:Person:Employee {\n  name: 'Alice',\n  email: 'alice@corp.com',\n  hiredAt: date('2021-03-01'),\n  active: true\n})" },
        { type: "heading", text: "Relationships are directed, typed, and hold properties" },
        { type: "p", text: "Every relationship has exactly **one type** and is **stored with a direction** (from → to). You can still *query* it ignoring direction. Properties on the relationship are where you put facts *about the connection itself* — a rating, a timestamp, a weight, a role." },
        { type: "code", lang: "cypher", code: "// Properties live on BOTH ends and on the relationship in the middle\n(:Person {name:'Keanu'})-[:ACTED_IN {roles:['Neo'], billing:1}]->(:Movie {title:'The Matrix', released:1999})" },
        { type: "heading", text: "Reading the ASCII-art pattern syntax" },
        { type: "list", items: [
          "`()` — a node. `(p)` binds it to variable `p`. `(p:Person)` also constrains its label.",
          "`(p:Person {name:'Alice'})` — node with an inline property predicate (an equality filter).",
          "`-[:KNOWS]->` — a relationship of type `KNOWS`, directed left-to-right. `<-[:KNOWS]-` points the other way.",
          "`-[r:KNOWS]-` — bind the relationship to `r`, and match **either direction** (no arrowhead).",
          "`(a:Person)-[:KNOWS]->(b:Person)` — the full sentence: *Person a knows Person b*."
        ] },
        { type: "callout", variant: "tip", text: "The pattern **is** the query. `(a)-[:KNOWS]->(b)` in a `MATCH` finds existing structure; the same pattern in a `CREATE` writes it. Once you can *read* a pattern left-to-right as a sentence, Cypher is mostly learned." }
      ]
    },
    {
      id: "cypher-basics",
      title: "Cypher basics: MATCH, WHERE, RETURN",
      level: "core",
      body: [
        { type: "p", text: "Cypher is a **declarative** query language: you describe the *pattern* you want, not how to traverse it. A read query is built from clauses that pipe results downward. The three you'll use constantly:" },
        { type: "list", items: [
          "**`MATCH`** — describe a graph pattern to find (like SQL `FROM` + `JOIN` fused into one shape).",
          "**`WHERE`** — filter the matched rows with predicates (attaches to the preceding `MATCH`/`WITH`).",
          "**`RETURN`** — project what comes back: nodes, relationships, properties, expressions."
        ] },
        { type: "code", lang: "cypher", code: "MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nWHERE m.released >= 2000 AND p.name STARTS WITH 'K'\nRETURN p.name AS actor, m.title AS movie, m.released\nORDER BY m.released DESC, actor\nSKIP 0 LIMIT 10" },
        { type: "table", headers: ["Clause", "Purpose"], rows: [
          ["`ORDER BY x DESC`", "sort rows (ascending by default)"],
          ["`SKIP n` / `LIMIT n`", "pagination — skip the first n, cap the result count"],
          ["`DISTINCT`", "de-duplicate result rows: `RETURN DISTINCT p.name`"],
          ["`AS`", "alias a projection so downstream clauses (and the client) can name it"]
        ] },
        { type: "heading", text: "WHERE predicates you'll reach for" },
        { type: "code", lang: "cypher", code: "MATCH (p:Person)\nWHERE p.age > 21                       // comparison\n  AND p.name IN ['Alice','Bob']        // membership\n  AND p.email IS NOT NULL              // null check\n  AND p.name =~ '(?i)a.*'              // regex (case-insensitive)\n  AND p.title CONTAINS 'Engineer'      // string predicate\nRETURN p" },
        { type: "callout", variant: "note", text: "Cypher keywords are conventionally UPPERCASE, node labels `PascalCase`, relationship types `SCREAMING_SNAKE_CASE`, and properties/variables `camelCase`. Only the query *values* are case-sensitive; keywords are not, but the convention keeps queries readable." },
        { type: "callout", variant: "gotcha", text: "A `MATCH` with no `WHERE` and no anchoring label/index scans **every node of that label** (or every node, for `MATCH (n)`). Fine for a 10-node demo; on a real graph, always anchor the pattern on an indexed property so the planner starts from a small seed set (see Indexes & constraints)." }
      ]
    },
    {
      id: "writing",
      title: "Writing data: CREATE, MERGE, SET, DELETE",
      level: "core",
      body: [
        { type: "p", text: "Writes use the same patterns as reads. `CREATE` always makes new structure; `MERGE` is get-or-create; `SET`/`REMOVE` change properties and labels; `DELETE` removes." },
        { type: "heading", text: "CREATE — always inserts" },
        { type: "code", lang: "cypher", code: "// Create two nodes and a relationship in one statement\nCREATE (a:Person {name:'Alice'})-[:FOLLOWS {since: date()}]->(b:Person {name:'Bob'})\nRETURN a, b" },
        { type: "callout", variant: "warn", text: "`CREATE` does **not** check for duplicates. Run the statement above twice and you get two Alices and two Bobs. Use `CREATE` only for data you know is new; otherwise use `MERGE`." },
        { type: "heading", text: "MERGE — match-or-create (the workhorse for idempotent writes)" },
        { type: "p", text: "`MERGE` matches the given pattern if it exists, otherwise creates it. Combine with `ON CREATE SET` (run only when it was newly created) and `ON MATCH SET` (run only when it already existed) to build idempotent upserts." },
        { type: "code", lang: "cypher", code: "MERGE (p:Person {email:'alice@corp.com'})   // the unique key you dedupe on\nON CREATE SET p.name = 'Alice', p.createdAt = datetime(), p.logins = 1\nON MATCH  SET p.logins = coalesce(p.logins, 0) + 1, p.lastSeen = datetime()\nRETURN p" },
        { type: "callout", variant: "gotcha", text: "**The #1 MERGE mistake — whole-pattern MERGE creates duplicates.** `MERGE (a:Person {name:'Alice'})-[:KNOWS]->(b:Person {name:'Bob'})` merges the *entire path as one unit*: if that exact path doesn't already exist it creates **all three** elements — even if Alice and Bob already exist separately — giving you duplicate people. **Fix:** MERGE each node on its unique key first, *then* MERGE the relationship between the bound variables." },
        { type: "code", lang: "cypher", code: "// CORRECT idempotent way to connect two existing/known nodes\nMERGE (a:Person {email:'alice@corp.com'})\nMERGE (b:Person {email:'bob@corp.com'})\nMERGE (a)-[r:KNOWS]->(b)          // now merges only the relationship\nON CREATE SET r.since = date()\nRETURN a, r, b" },
        { type: "heading", text: "SET / REMOVE — properties and labels" },
        { type: "code", lang: "cypher", code: "MATCH (p:Person {email:'alice@corp.com'})\nSET p.age = 31                    // set/overwrite one property\nSET p += {city:'Berlin', tier:'gold'}   // merge a map (updates listed keys)\nSET p:Vip                          // ADD a label\nREMOVE p.tier                      // drop a property\nREMOVE p:Vip                       // drop a label\nRETURN p" },
        { type: "callout", variant: "note", text: "`SET p = {..}` (bare `=`) **replaces the entire property map**, wiping any keys not listed. `SET p += {..}` merges. Almost always you want `+=`." },
        { type: "heading", text: "DELETE and DETACH DELETE" },
        { type: "code", lang: "cypher", code: "// You cannot delete a node that still has relationships:\nMATCH (p:Person {email:'bob@corp.com'}) DELETE p;      // ERROR if bob has any edges\n\n// DETACH DELETE removes the node AND all its relationships:\nMATCH (p:Person {email:'bob@corp.com'}) DETACH DELETE p;\n\n// Delete just a relationship:\nMATCH (:Person {name:'Alice'})-[r:FOLLOWS]->(:Person {name:'Bob'}) DELETE r;" },
        { type: "callout", variant: "warn", text: "`MATCH (n) DETACH DELETE n` wipes the **entire database** — every node and relationship. There is no undo. Guard it with a label/filter, and on big graphs delete in batches (`CALL {...} IN TRANSACTIONS`) so you don't build one gigantic transaction that exhausts memory." }
      ]
    },
    {
      id: "pattern-matching",
      title: "Pattern matching (deep): paths, OPTIONAL, variable-length",
      level: "core",
      body: [
        { type: "p", text: "This is where Cypher earns its keep. You compose multiple patterns, make some optional, and traverse a *variable* number of hops — all declaratively." },
        { type: "heading", text: "Multiple patterns & OPTIONAL MATCH (the outer join)" },
        { type: "p", text: "Several comma-separated patterns in one `MATCH`, or several `MATCH` clauses, must all be satisfied (an inner-join-like AND). **`OPTIONAL MATCH`** is the **LEFT OUTER JOIN** analog: if the pattern doesn't match, the row is kept and the unmatched variables are bound to `null`." },
        { type: "code", lang: "cypher", code: "MATCH (p:Person {name:'Alice'})\nOPTIONAL MATCH (p)-[:OWNS]->(pet:Dog)   // Alice may own no dog\nRETURN p.name, pet.name AS dogName      // dogName is null if she has none" },
        { type: "callout", variant: "gotcha", text: "**`OPTIONAL MATCH` + `WHERE` ordering is a classic trap.** A `WHERE` that filters on an optionally-matched variable can turn the outer join back into an inner join (it drops the null rows you wanted to keep). Put the predicate *inside* the OPTIONAL MATCH's own pattern/WHERE, or filter later — don't filter a would-be-null variable in a downstream WHERE unless you mean to drop those rows." },
        { type: "heading", text: "Variable-length paths" },
        { type: "p", text: "`-[:REL*min..max]->` traverses the relationship **between min and max hops**. This is the graph superpower — arbitrary-depth reachability in one clause." },
        { type: "code", lang: "cypher", code: "// People 1 to 3 FRIEND hops from Alice (any direction), de-duplicated\nMATCH (alice:Person {name:'Alice'})-[:FRIEND*1..3]-(other:Person)\nRETURN DISTINCT other.name" },
        { type: "table", headers: ["Syntax", "Meaning"], rows: [
          ["`-[:R*1..3]->`", "1, 2, or 3 hops of type R"],
          ["`-[:R*]->`", "1 or more hops — **unbounded (dangerous)**"],
          ["`-[:R*2]->`", "exactly 2 hops"],
          ["`-[:R*..5]->`", "up to 5 hops (min defaults to 1)"]
        ] },
        { type: "callout", variant: "warn", text: "**Unbounded `*` on a densely connected graph explodes combinatorially** — it can walk the whole graph and OOM. Always cap the upper bound (`*1..4`), anchor the start on an index, and prefer `shortestPath` when you only need the connection, not every path." },
        { type: "heading", text: "Shortest paths" },
        { type: "code", lang: "cypher", code: "// The Bacon number: shortest ACTED_IN/colleague chain between two actors\nMATCH (a:Person {name:'Kevin Bacon'}), (b:Person {name:'Meg Ryan'})\nMATCH p = shortestPath( (a)-[:ACTED_IN*..10]-(b) )\nRETURN [n IN nodes(p) WHERE n:Person | n.name] AS chain, length(p) AS hops" },
        { type: "list", items: [
          "**`shortestPath((a)-[:R*]-(b))`** returns one shortest path; **`allShortestPaths(...)`** returns every path tied for shortest.",
          "**Path variable** `p = (a)-[:R*]-(b)` binds the whole path; then `nodes(p)`, `relationships(p)`, and `length(p)` deconstruct it.",
          "For **weighted** shortest paths (edge costs) use the **GDS** library's Dijkstra/A* — `shortestPath` counts hops, not weights."
        ] },
        { type: "heading", text: "Quantified path patterns (GQL / Cypher 25)" },
        { type: "p", text: "Modern Cypher (aligned with GQL) adds **quantified path patterns** — a more expressive successor to `*` that lets you repeat a *multi-element sub-pattern* and apply predicates along the way." },
        { type: "code", lang: "cypher", code: "// Repeat a (station)-[:LINK]->(station) segment 1..5 times, each hop under 10km\nMATCH p = (a:Station {name:'A'})\n         ( (s1)-[l:LINK]->(s2) WHERE l.km < 10 ){1,5}\n         (b:Station {name:'B'})\nRETURN [n IN nodes(p) | n.name] AS route" },
        { type: "callout", variant: "tip", text: "`shortestPath`/`allShortestPaths` are the tools for 'is there a connection and how short'. Variable-length `*` is for 'give me everything within N hops'. Quantified path patterns are for 'repeat this richer sub-pattern with conditions'. Reach for the narrowest one that answers the question." }
      ]
    },
    {
      id: "pipelining",
      title: "Pipelining & aggregation: WITH, UNWIND, collect",
      level: "core",
      body: [
        { type: "p", text: "**`WITH`** is the most important Cypher skill after `MATCH`. It **pipes** the output of one part of a query into the next — like a Unix pipe or a SQL subquery boundary. It lets you aggregate, filter on aggregates, re-scope variables, and chain multi-stage queries. If you're fighting Cypher, you probably need a `WITH`." },
        { type: "code", lang: "cypher", code: "// Count each person's movies, keep only the prolific ones, then look them up\nMATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nWITH p, count(m) AS movieCount        // aggregate + carry p forward\nWHERE movieCount > 20                  // filter ON the aggregate (like HAVING)\nMATCH (p)-[:DIRECTED]->(d:Movie)       // continue the query with the survivors\nRETURN p.name, movieCount, count(d) AS directed\nORDER BY movieCount DESC" },
        { type: "heading", text: "Implicit grouping (there is no GROUP BY)" },
        { type: "p", text: "Cypher has **no `GROUP BY`**. Instead, when a `RETURN`/`WITH` mixes aggregating and non-aggregating expressions, the **non-aggregating ones become the grouping key automatically**. Below, `p.name` is the grouping key and `count(m)` aggregates per group." },
        { type: "code", lang: "cypher", code: "MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name AS actor, count(m) AS films   // grouped by p.name implicitly\nORDER BY films DESC" },
        { type: "table", headers: ["Aggregate", "Does"], rows: [
          ["`count(x)`", "number of rows (use `count(*)` or `count(DISTINCT x)`)"],
          ["`collect(x)`", "gather values into a **list** — the graph-native aggregation"],
          ["`sum` / `avg` / `min` / `max`", "numeric reductions"],
          ["`percentileCont`, `stdev`", "statistical aggregates"]
        ] },
        { type: "heading", text: "collect() — turning rows into nested lists" },
        { type: "code", lang: "cypher", code: "// One row per director, with the list of their movie titles nested inside\nMATCH (d:Person)-[:DIRECTED]->(m:Movie)\nRETURN d.name AS director, collect(m.title) AS movies, count(*) AS n\nORDER BY n DESC LIMIT 5" },
        { type: "heading", text: "UNWIND — the inverse: a list back into rows" },
        { type: "p", text: "`UNWIND` expands a list into one row per element — essential for feeding a parameter array into a bulk write, or exploding a collected list back out." },
        { type: "code", lang: "cypher", code: "// Bulk-create from a parameter list ($people is a list of maps)\nUNWIND $people AS row\nMERGE (p:Person {email: row.email})\nSET p.name = row.name\nRETURN count(p) AS upserted" },
        { type: "callout", variant: "tip", text: "Pattern to internalize: **`UNWIND` a list into rows → do per-row work → `collect` back into a list**. That round-trip is how you transform, filter, and reshape collections inside a single Cypher query, and how you drive efficient batch writes from application code." }
      ]
    },
    {
      id: "values",
      title: "Working with values: lists, maps, CASE, functions, params",
      level: "core",
      body: [
        { type: "p", text: "Cypher has a rich expression language. Properties are typed: strings, numbers (integer/float), booleans, temporal types (`date`, `datetime`, `duration`, `time`), spatial `point`, and **lists** of those. Nodes/relationships also expose properties as a **map**." },
        { type: "heading", text: "Lists, maps, and indexing/slicing" },
        { type: "code", lang: "cypher", code: "RETURN\n  [1,2,3,4][1..3]           AS slice,     // -> [2,3] (0-based, end-exclusive)\n  size([1,2,3])             AS len,       // -> 3\n  range(1,5)                AS r,         // -> [1,2,3,4,5]\n  {a:1, b:2}.a              AS mapAccess, // -> 1\n  keys({a:1,b:2})           AS theKeys    // -> ['a','b']" },
        { type: "heading", text: "List & pattern comprehensions" },
        { type: "p", text: "**List comprehension** transforms/filters a list inline. **Pattern comprehension** `[ (n)-[:R]->(m) | m.prop ]` collects values *from a graph pattern* without a separate MATCH — extremely handy for nesting related data into one row." },
        { type: "code", lang: "cypher", code: "MATCH (p:Person {name:'Tom Hanks'})\nRETURN\n  // list comprehension: squares of evens\n  [x IN range(1,6) WHERE x % 2 = 0 | x*x]                 AS evenSquares,\n  // pattern comprehension: titles of movies he acted in, inline\n  [ (p)-[:ACTED_IN]->(m:Movie) | m.title ]               AS movies,\n  // with a filter inside the pattern\n  [ (p)-[:ACTED_IN]->(m) WHERE m.released > 2010 | m.title ] AS recent" },
        { type: "heading", text: "CASE, coalesce, and common functions" },
        { type: "code", lang: "cypher", code: "MATCH (p:Person)\nRETURN p.name,\n  coalesce(p.nickname, p.name, 'anon')        AS displayName, // first non-null\n  CASE\n    WHEN p.age < 18 THEN 'minor'\n    WHEN p.age < 65 THEN 'adult'\n    ELSE 'senior'\n  END                                         AS bracket,\n  toUpper(p.name)                             AS shout,\n  duration.between(p.hiredAt, date()).years   AS tenureYears" },
        { type: "list", items: [
          "**String:** `toUpper`, `toLower`, `trim`, `split`, `substring`, `replace`, `left`, `right`.",
          "**Math:** `abs`, `round`, `ceil`, `floor`, `rand`, `sqrt`, `sign`, `toInteger`, `toFloat`.",
          "**Temporal:** `date()`, `datetime()`, `time()`, `duration.between(a,b)`, `date.truncate('month', d)` — real typed instants, not strings.",
          "**Predicate:** `all`, `any`, `none`, `single` over a list (`WHERE any(x IN p.tags WHERE x = 'vip')`)."
        ] },
        { type: "heading", text: "Parameters — always use them" },
        { type: "p", text: "Never string-concatenate values into query text. Use **`$param`** placeholders: they prevent Cypher injection, and — crucially — let the database **cache the query plan** (same query text with different params reuses the compiled plan)." },
        { type: "code", lang: "cypher", code: "// $name and $minAge are supplied out-of-band by the driver / :param\nMATCH (p:Person)\nWHERE p.name = $name OR p.age >= $minAge\nRETURN p" },
        { type: "callout", variant: "gotcha", text: "Concatenating literals into the query string (e.g. building `\"... p.age = \" + userInput`) is both an **injection risk** and a **performance bug**: every distinct string is a new plan-cache entry, so the planner re-compiles constantly. Parameterize everything that varies." }
      ]
    },
    {
      id: "indexes-constraints",
      title: "Indexes, constraints & query tuning",
      level: "core",
      body: [
        { type: "p", text: "Index-free adjacency makes *traversals* fast, but the planner still needs an **index to find the starting node(s)** quickly. Without one, anchoring a `MATCH` on a property scans every node of that label. Indexes and constraints are how you make real queries fast and correct." },
        { type: "heading", text: "Index types" },
        { type: "table", headers: ["Index", "Create for", "Speeds up"], rows: [
          ["**Range**", "a property used in `=`, `<`, `>`, range, `ORDER BY`", "equality and range lookups (the default general index)"],
          ["**Text**", "a string property used with `CONTAINS`/`ENDS WITH`", "substring/suffix string predicates"],
          ["**Point**", "a spatial `point` property", "distance & bounding-box queries"],
          ["**Token lookup**", "labels & relationship types (exists by default)", "`MATCH (n:Label)` scans"],
          ["**Full-text**", "tokenized text search across properties (Lucene)", "fuzzy / scored search — queried via a procedure"]
        ] },
        { type: "code", lang: "cypher", code: "// Range index on a property (naming it is optional but recommended)\nCREATE INDEX person_email IF NOT EXISTS FOR (p:Person) ON (p.email);\n\n// Composite range index (order of properties matters)\nCREATE INDEX person_name_age FOR (p:Person) ON (p.name, p.age);\n\n// Full-text index over several properties, queried by procedure\nCREATE FULLTEXT INDEX movieSearch FOR (m:Movie) ON EACH [m.title, m.tagline];\nCALL db.index.fulltext.queryNodes('movieSearch', 'matrix~') YIELD node, score\nRETURN node.title, score ORDER BY score DESC;" },
        { type: "heading", text: "Constraints" },
        { type: "p", text: "Constraints enforce data integrity — and **uniqueness/node-key constraints automatically create a backing index**, so a unique constraint both dedupes *and* speeds up lookups on that key." },
        { type: "code", lang: "cypher", code: "// Uniqueness: no two Persons share an email (also creates an index)\nCREATE CONSTRAINT person_email_unique IF NOT EXISTS\nFOR (p:Person) REQUIRE p.email IS UNIQUE;\n\n// Node key: the combination must be unique AND present (Enterprise)\nCREATE CONSTRAINT person_key IF NOT EXISTS\nFOR (p:Person) REQUIRE (p.tenantId, p.email) IS NODE KEY;\n\n// Existence: the property must be present (Enterprise)\nCREATE CONSTRAINT movie_title_exists IF NOT EXISTS\nFOR (m:Movie) REQUIRE m.title IS NOT NULL;" },
        { type: "heading", text: "EXPLAIN & PROFILE — reading the plan" },
        { type: "p", text: "Prefix any query with **`EXPLAIN`** to see the planned operators *without running it*, or **`PROFILE`** to run it and see actual rows and **db hits** (units of storage work) per operator. The signal you want: an **`NodeIndexSeek`** (good) instead of an **`AllNodesScan`** or **`NodeByLabelScan`** (a full scan — usually a missing index)." },
        { type: "code", lang: "cypher", code: "PROFILE\nMATCH (p:Person {email:$email})-[:ACTED_IN]->(m:Movie)\nRETURN m.title;\n// Look at the top operator: NodeIndexSeek on person_email = fast.\n// If you see NodeByLabelScan feeding a Filter, you're missing an index." },
        { type: "callout", variant: "tip", text: "Index the properties you **anchor** MATCH patterns on (the ones in `WHERE prop = ...` at the *start* of a traversal), plus every uniqueness key. You do **not** need to index every property, and you don't index the relationships you traverse — index-free adjacency already makes hops cheap. Use `PROFILE` to confirm the seek before and after adding an index." }
      ]
    },
    {
      id: "procedures-apoc",
      title: "Procedures, subqueries & APOC",
      level: "deep",
      body: [
        { type: "p", text: "Beyond clauses, Cypher can **`CALL`** stored procedures and functions — built-ins (prefixed `db.`, `dbms.`) plus the vast **APOC** library ('Awesome Procedures On Cypher'), the de-facto standard extension for utilities Cypher doesn't ship." },
        { type: "code", lang: "cypher", code: "// Introspect the database with built-in procedures\nCALL db.labels() YIELD label RETURN label;\nCALL db.schema.visualization();          // see the graph's meta-model\nCALL db.indexes();                        // list indexes\n\n// APOC examples\nCALL apoc.help('apoc.coll');              // browse APOC\nRETURN apoc.date.format(timestamp(), 'ms', 'yyyy-MM-dd') AS today;" },
        { type: "heading", text: "CALL subqueries — run a sub-Cypher per row" },
        { type: "p", text: "A **`CALL { ... }`** subquery runs an inner query, optionally **importing variables** from the outer scope. It's how you do per-row post-processing, `UNION`s inside a query, and (with `IN TRANSACTIONS`) batched writes." },
        { type: "code", lang: "cypher", code: "MATCH (p:Person)\nCALL (p) {                       // Cypher 25 scoped subquery: import p\n  MATCH (p)-[:ACTED_IN]->(m:Movie)\n  RETURN m ORDER BY m.released DESC LIMIT 3\n}\nRETURN p.name, collect(m.title) AS top3Recent" },
        { type: "callout", variant: "note", text: "Older Cypher wrote the import as `CALL { WITH p ... }`; current Cypher (GQL-aligned) uses the `CALL (p) { ... }` variable-scope syntax. Both run the inner block **once per incoming row**, which is exactly what you want for per-entity aggregation or conditional writes." },
        { type: "callout", variant: "tip", text: "APOC is enormous: dynamic labels/relationships (`apoc.create.*`), graph refactoring (`apoc.refactor.*`), JSON/CSV/JDBC import (`apoc.load.*`), periodic/iterate batching (`apoc.periodic.iterate`), path expansion with filters (`apoc.path.expandConfig`), and text/date/collection helpers. When Cypher can't express something directly, check APOC before writing driver-side code." }
      ]
    },
    {
      id: "big-examples",
      title: "Annotated Cypher: recommendation & path queries",
      level: "core",
      body: [
        { type: "p", text: "Two real queries, walked clause by clause — the shape of most production Cypher." },
        { type: "heading", text: "Example 1 — friend-of-friend recommendation with scoring" },
        { type: "p", text: "'Suggest people Alice isn't yet friends with, ranked by how many mutual friends they share.' This is the query graph databases were born for." },
        { type: "code", lang: "cypher", code: "MATCH (me:Person {email:$email})-[:FRIEND]->(friend)-[:FRIEND]->(fof)\nWHERE fof <> me                                   // don't suggest yourself\n  AND NOT (me)-[:FRIEND]->(fof)                   // exclude existing friends\nWITH fof, count(DISTINCT friend) AS mutualFriends // score = shared connections\nORDER BY mutualFriends DESC\nLIMIT 10\nRETURN fof.name AS suggestion, mutualFriends" },
        { type: "list", ordered: true, items: [
          "**`MATCH (me)-[:FRIEND]->(friend)-[:FRIEND]->(fof)`** — two hops out: my friends, then *their* friends (friends-of-friends). Anchored on `$email` (index this!).",
          "**`WHERE fof <> me AND NOT (me)-[:FRIEND]->(fof)`** — a **negative pattern**: keep only people who aren't me and aren't already my friend.",
          "**`WITH fof, count(DISTINCT friend) AS mutualFriends`** — group by the candidate `fof`; the count of distinct intermediate friends is the recommendation strength.",
          "**`ORDER BY mutualFriends DESC LIMIT 10`** — best suggestions first.",
          "**`RETURN`** — the candidate and their score. Notice: no joins, no junction tables — just a pattern and an aggregate."
        ] },
        { type: "heading", text: "Example 2 — 'customers who bought X also bought…'" },
        { type: "code", lang: "cypher", code: "MATCH (target:Product {sku:$sku})<-[:BOUGHT]-(buyer:Customer)-[:BOUGHT]->(other:Product)\nWHERE other <> target\nWITH other, count(DISTINCT buyer) AS coBuyers\nWHERE coBuyers >= 3                                // ignore weak co-occurrence\nRETURN other.name AS alsoBought, coBuyers\nORDER BY coBuyers DESC LIMIT 5" },
        { type: "p", text: "Read the pattern as a sentence: *the target product was bought by buyers who also bought other products.* `count(DISTINCT buyer)` measures how many people made both purchases; the `WHERE coBuyers >= 3` prunes noise. One pattern captures a collaborative-filtering recommendation." },
        { type: "heading", text: "Example 3 — weighted shortest route (traversal)" },
        { type: "code", lang: "cypher", code: "// Fewest-hop flight route between two airports, returning the path\nMATCH (from:Airport {code:'SFO'}), (to:Airport {code:'BER'})\nMATCH route = shortestPath( (from)-[:FLIES_TO*..6]->(to) )\nRETURN [a IN nodes(route) | a.code] AS hops, length(route) AS legs" },
        { type: "list", ordered: true, items: [
          "**`MATCH (from), (to)`** — bind both endpoints (each an indexed `code` lookup).",
          "**`shortestPath((from)-[:FLIES_TO*..6]->(to))`** — the shortest directed chain of up to 6 legs; capping the depth keeps it bounded.",
          "**`route = ...`** — bind the whole path so we can deconstruct it.",
          "**`[a IN nodes(route) | a.code]`** — list comprehension pulling the airport codes along the route; `length(route)` is the number of legs."
        ] },
        { type: "callout", variant: "tip", text: "For **weighted** shortest paths (cheapest fare, fastest time — where each edge has a cost), `shortestPath` isn't enough (it minimizes hop count). Use the GDS library's `gds.shortestPath.dijkstra` with a `relationshipWeightProperty`, covered next." }
      ]
    },
    {
      id: "importing",
      title: "Importing data: LOAD CSV & bulk import",
      level: "core",
      body: [
        { type: "p", text: "Three tiers, by data size. **`LOAD CSV`** for up to ~10M rows into a live database, **`apoc.load.*`** for JSON/JDBC/XML, and **`neo4j-admin database import`** for the initial bulk load of hundreds of millions of rows into an *empty* database." },
        { type: "heading", text: "LOAD CSV with batched transactions" },
        { type: "p", text: "`LOAD CSV` streams a CSV row-by-row. Wrap the per-row write in **`CALL { ... } IN TRANSACTIONS OF n ROWS`** so it commits in batches instead of building one massive transaction (the modern replacement for the old `USING PERIODIC COMMIT`)." },
        { type: "code", lang: "cypher", code: "LOAD CSV WITH HEADERS FROM 'file:///people.csv' AS row\nCALL (row) {\n  MERGE (p:Person {id: row.id})\n  SET p.name = row.name,\n      p.age  = toInteger(row.age)        // CSV values are strings — cast!\n} IN TRANSACTIONS OF 10000 ROWS;" },
        { type: "callout", variant: "gotcha", text: "**Every CSV value is a string.** `row.age` is `\"30\"`, not `30`, and an empty cell is `\"\"` (not null). Cast explicitly (`toInteger`, `toFloat`, `date`) and guard empties (`WHERE row.age <> ''` or `coalesce`), or your numeric filters and math will silently misbehave." },
        { type: "callout", variant: "warn", text: "**Create the indexes/constraints BEFORE loading**, especially the uniqueness constraint on the MERGE key. Without a backing index, each `MERGE` on a growing dataset does a full label scan, so a large `LOAD CSV` degrades to O(n²) and appears to hang." },
        { type: "code", lang: "cypher", code: "// Two-pass CSV import: nodes first, then relationships by their keys\n// Pass 1 - nodes\nLOAD CSV WITH HEADERS FROM 'file:///movies.csv' AS row\nCALL (row) { MERGE (:Movie {id: row.movieId}) } IN TRANSACTIONS OF 10000 ROWS;\n// Pass 2 - relationships (MERGE endpoints by key, then MERGE the edge)\nLOAD CSV WITH HEADERS FROM 'file:///roles.csv' AS row\nCALL (row) {\n  MATCH (p:Person {id: row.personId})\n  MATCH (m:Movie  {id: row.movieId})\n  MERGE (p)-[r:ACTED_IN]->(m) SET r.role = row.role\n} IN TRANSACTIONS OF 10000 ROWS;" },
        { type: "heading", text: "APOC loaders & big bulk import" },
        { type: "list", items: [
          "**`apoc.load.json` / `apoc.load.jdbc` / `apoc.load.xml`** — pull from JSON/APIs, relational DBs, and XML directly inside Cypher.",
          "**`apoc.periodic.iterate('outerQuery','innerWrite',{batchSize:10000, parallel:true})`** — batch and parallelize huge write jobs with progress and error handling.",
          "**`neo4j-admin database import full`** — the *offline* bulk importer: it writes store files directly and is **orders of magnitude faster** than `LOAD CSV`, but only into an **empty, stopped** database (initial seeding, migrations)."
        ] },
        { type: "code", lang: "bash", code: "# Offline bulk import (fastest path for the FIRST big load)\nneo4j-admin database import full \\\n  --nodes=Person=import/persons.csv \\\n  --nodes=Movie=import/movies.csv \\\n  --relationships=ACTED_IN=import/roles.csv \\\n  --id-type=string movies" },
        { type: "callout", variant: "tip", text: "Decision tree: **initial load of a big dataset into a fresh DB → `neo4j-admin import`**. **Ongoing/incremental loads into a live DB → `LOAD CSV ... IN TRANSACTIONS`** (with constraints in place first). **From an API/relational source → APOC loaders + `apoc.periodic.iterate`**." }
      ]
    },
    {
      id: "gds",
      title: "Graph algorithms with GDS",
      level: "deep",
      body: [
        { type: "p", text: "The **Graph Data Science (GDS)** library adds 65+ production graph algorithms — PageRank, community detection, centrality, similarity, path finding, and node embeddings. GDS doesn't run on your stored graph directly; you first **project** a lightweight in-memory graph (an efficient subset of nodes/relationships), then run algorithms over it." },
        { type: "heading", text: "1. Project a graph into the catalog" },
        { type: "code", lang: "cypher", code: "// Native projection: which labels/relationships to load into memory\nCALL gds.graph.project(\n  'social',                       // named graph in the catalog\n  'Person',                       // node projection\n  { FRIEND: { orientation: 'UNDIRECTED' } }  // relationship projection\n);" },
        { type: "heading", text: "2. Run an algorithm — stream / mutate / write modes" },
        { type: "p", text: "Every algorithm runs in one of three **execution modes**, which is the key GDS concept:" },
        { type: "table", headers: ["Mode", "Does", "Use when"], rows: [
          ["**`stream`**", "returns results as rows, writes nothing", "exploration, feeding results into more Cypher"],
          ["**`write`**", "writes results back to the real database as properties", "you want the score persisted (e.g. `p.pagerank`)"],
          ["**`mutate`**", "writes results into the *in-memory* projection", "chaining algorithms in a pipeline without touching disk"]
        ] },
        { type: "code", lang: "cypher", code: "// PageRank: influence/importance of each node\nCALL gds.pageRank.stream('social')\nYIELD nodeId, score\nRETURN gds.util.asNode(nodeId).name AS person, score\nORDER BY score DESC LIMIT 10;\n\n// Louvain: detect communities and WRITE the community id back to each node\nCALL gds.louvain.write('social', { writeProperty: 'community' })\nYIELD communityCount, modularity;" },
        { type: "list", items: [
          "**Centrality** — PageRank, Betweenness, Degree, Eigenvector: who is important/influential/a bottleneck.",
          "**Community detection** — Louvain, Label Propagation, WCC: find clusters, fraud rings, market segments.",
          "**Similarity** — Node Similarity, K-Nearest Neighbors: 'nodes like this one' for recommendations.",
          "**Path finding** — weighted Dijkstra / A* / Yen's K-shortest, respecting a `relationshipWeightProperty`.",
          "**Node embeddings** — FastRP, GraphSAGE, Node2Vec: turn graph structure into vectors for ML / vector search."
        ] },
        { type: "code", lang: "cypher", code: "// Weighted shortest path (what plain shortestPath can't do)\nCALL gds.shortestPath.dijkstra.stream('routes', {\n  sourceNode: sfo, targetNode: ber,\n  relationshipWeightProperty: 'distanceKm'\n}) YIELD totalCost, nodeIds\nRETURN totalCost, [id IN nodeIds | gds.util.asNode(id).code] AS route;" },
        { type: "callout", variant: "note", text: "The projection is a **snapshot** — it doesn't see writes to the live graph until you re-project. Drop it with `CALL gds.graph.drop('social')` when done to free memory. Neo4j **AuraDS** is the managed offering that bundles GDS; on self-hosted you install the GDS plugin (as in the Docker setup above)." }
      ]
    },
    {
      id: "modeling",
      title: "Modeling best practices",
      level: "core",
      body: [
        { type: "p", text: "Graph modeling is a distinct skill. The core question at every edge: is this a **property**, a **relationship**, or does it deserve its own **node**?" },
        { type: "heading", text: "Property vs relationship vs intermediate node" },
        { type: "list", items: [
          "**Property** — an intrinsic attribute of one entity with no independent identity: `person.name`, `movie.released`.",
          "**Relationship** — a direct connection between two entities: `(person)-[:ACTED_IN]->(movie)`. Put facts *about the connection* (a role, a rating, a timestamp) as **properties on the relationship**.",
          "**Intermediate (reified) node** — when the relationship itself has structure, participants, or must be found/queried on its own, promote it to a node. A `PURCHASE` with a date, price, and multiple line items shouldn't be an edge — make it a `(:Order)` node connected to customer and products."
        ] },
        { type: "code", lang: "cypher", code: "// DON'T cram a rich event onto one edge...\n(:Customer)-[:BOUGHT {date:.., total:.., items:[..]}]->(:Product)\n\n// DO reify it as a node when it has its own identity/structure:\n(:Customer)-[:PLACED]->(o:Order {date:.., total:..})-[:CONTAINS {qty:2}]->(:Product)" },
        { type: "callout", variant: "tip", text: "**Reify a relationship into a node when** it needs to be queried independently, has more than trivial properties, connects more than two things, has its own lifecycle (state, timestamps), or you need multiple instances between the same pair over time (e.g. many purchases of the same product)." },
        { type: "heading", text: "Use specific relationship types, not generic ones" },
        { type: "p", text: "Prefer `(:User)-[:PURCHASED]->(:Item)` and `(:User)-[:VIEWED]->(:Item)` over one generic `[:REL {type:'purchased'}]`. Specific types let the planner traverse *only* the relevant edges — filtering on a relationship *property* still walks every edge of that type." },
        { type: "heading", text: "Avoid supernodes (dense nodes)" },
        { type: "callout", variant: "warn", text: "A **supernode** is a node with a huge number of relationships (millions) — e.g. a `:Country` every user connects to, or a viral `:HashTag`. Traversing *through* it forces the engine to scan all its edges, killing performance. **Mitigations:** don't model ubiquitous categories as a single hub node; add intermediate/bucketed nodes; put a selective property on the relationship and index-assist; or filter the direction/type early. Watch for supernodes in write-heavy paths too — they become lock hotspots." },
        { type: "heading", text: "Granularity & refactoring" },
        { type: "list", items: [
          "**Model for your queries** — a graph model is 'correct' when it makes your important traversals short and cheap. Design from the questions, not the ER diagram.",
          "**Split overloaded properties into labels/relationships** if you frequently filter on them (a `status` you always match on may be better as a relationship to a `:Status` node, or a label).",
          "**Refactor with `apoc.refactor.*`** — rename types, merge duplicate nodes, invert relationship direction, collapse/normalize — the graph model can evolve safely.",
          "**Don't over-normalize** — unlike SQL, a graph welcomes redundant relationships if they shorten hot traversals."
        ] }
      ]
    },
    {
      id: "drivers",
      title: "Drivers & transactions in app code",
      level: "core",
      body: [
        { type: "p", text: "In production you talk to Neo4j through an official driver. The hierarchy is **Driver → Session → Transaction**. Create **one Driver per application** (it's a thread-safe connection pool, expensive to build); open a short-lived **Session** per unit of work; and run queries inside **transaction functions** that get **automatic retries**." },
        { type: "heading", text: "Python — managed transaction functions" },
        { type: "code", lang: "py", code: "from neo4j import GraphDatabase\n\n# One driver for the whole app lifetime (thread-safe connection pool)\ndriver = GraphDatabase.driver(\n    \"neo4j+s://xxxx.databases.neo4j.io\",\n    auth=(\"neo4j\", \"your-password\"),\n)\n\ndef add_friend(driver, a_email, b_email):\n    # execute_write runs the unit of work in a transaction WITH RETRY on\n    # transient errors (leader switch, deadlock). The function may run >1x,\n    # so it must be idempotent (MERGE, not CREATE).\n    def _work(tx):\n        result = tx.run(\n            \"\"\"\n            MERGE (a:Person {email:$a})\n            MERGE (b:Person {email:$b})\n            MERGE (a)-[:FRIEND]->(b)\n            RETURN a.email AS a, b.email AS b\n            \"\"\",\n            a=a_email, b=b_email,   # ALWAYS parameterize\n        )\n        return result.single()      # consume inside the tx function\n    with driver.session(database=\"neo4j\") as session:\n        return session.execute_write(_work)\n\ndef friends_of(driver, email):\n    def _work(tx):\n        res = tx.run(\"MATCH (:Person {email:$e})-[:FRIEND]->(f) RETURN f.name AS name\", e=email)\n        return [r[\"name\"] for r in res]   # materialize before the tx closes\n    with driver.session(database=\"neo4j\") as session:\n        return session.execute_read(_work)\n\n# On shutdown\ndriver.close()" },
        { type: "heading", text: "JavaScript / TypeScript" },
        { type: "code", lang: "js", code: "import neo4j from \"neo4j-driver\";\n\n// one driver per process\nconst driver = neo4j.driver(\n  \"neo4j+s://xxxx.databases.neo4j.io\",\n  neo4j.auth.basic(\"neo4j\", process.env.NEO4J_PASSWORD)\n);\n\nexport async function topActors(limit) {\n  const session = driver.session({ database: \"neo4j\" });\n  try {\n    // executeRead/Write = managed tx with automatic retries\n    return await session.executeRead(async (tx) => {\n      const res = await tx.run(\n        `MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\n         RETURN p.name AS name, count(m) AS films\n         ORDER BY films DESC LIMIT $limit`,\n        { limit: neo4j.int(limit) }        // wrap JS numbers as Neo4j integers\n      );\n      return res.records.map((r) => ({ name: r.get(\"name\"), films: r.get(\"films\").toNumber() }));\n    });\n  } finally {\n    await session.close();                 // always close the session\n  }\n}\n// await driver.close() on shutdown" },
        { type: "list", items: [
          "**`execute_read` / `execute_write`** (a.k.a. `executeRead`/`executeWrite`) are **managed transactions**: they auto-retry on transient failures and route reads to followers / writes to the leader in a cluster. Prefer them over manual `begin_transaction`.",
          "**Idempotency:** because a managed tx function can run more than once, it must be safe to re-run — use `MERGE`, avoid side effects outside the tx.",
          "**Consume records inside the transaction** — pull values into your own list/objects before the session closes; a `Result` is a live cursor, not a materialized array.",
          "**Integers:** JavaScript numbers are 64-bit floats but Neo4j integers are 64-bit ints — the JS driver returns an `Integer` object; call `.toNumber()` (small) and pass `neo4j.int(...)` for params.",
          "**Connection lifecycle:** build the driver once, reuse it, `close()` on shutdown. Never open a driver per request."
        ] },
        { type: "callout", variant: "tip", text: "For read-heavy apps against a cluster, use `execute_read` so queries load-balance across read replicas, and pass `database=` explicitly (Neo4j is multi-database). Spring Boot users get all of this wrapped by **Spring Data Neo4j** (repositories + OGM mapping)." }
      ]
    },
    {
      id: "gql-versioning",
      title: "Cypher, GQL & calendar versioning",
      level: "deep",
      body: [
        { type: "p", text: "Two moving pieces to understand in 2026: the language is standardizing, and the product versioning changed." },
        { type: "heading", text: "Cypher is aligning with ISO GQL" },
        { type: "p", text: "**GQL (Graph Query Language)** is the ISO/IEC 39075 international standard for property-graph databases — the graph counterpart to SQL, published in 2024. Cypher, which pioneered this style, is being progressively aligned with GQL. Practically: the Cypher you write today is largely GQL-conformant, and newer syntax (**quantified path patterns**, the `CALL (var) { }` scoped subquery, `EXISTS {}`/`COUNT {}` subqueries) comes straight from the standard. Learning modern Cypher is learning GQL." },
        { type: "list", items: [
          "**GQL-standard features now in Cypher:** quantified path patterns, `NEXT` for linear query composition, graph pattern matching semantics, standardized type system and error model.",
          "**Cypher version selection:** you can pin the language version (e.g. prefix a query with `CYPHER 25`) so upgrades don't silently change semantics.",
          "**Portability:** as other vendors adopt GQL, graph queries become more portable — the SQL-for-graphs moment."
        ] },
        { type: "heading", text: "Calendar versioning" },
        { type: "p", text: "Neo4j moved from semantic versioning (the long-lived **5.x** series) to **calendar versioning**: releases are named **`YYYY.MM`** (e.g. **2025.06**). AuraDB/AuraDS always run the current calendar version; self-hosted picks a version and gets monthly updates. Language versions (Cypher 5 vs Cypher 25) are decoupled from the product calendar version." },
        { type: "callout", variant: "note", text: "What this means for you: (1) don't be surprised that there's no 'Neo4j 6' — after 5.x it's `2025.x`, `2026.x`; (2) prefer modern GQL-aligned idioms (`CALL (x) {}`, quantified paths, `IN TRANSACTIONS`) over the pre-5 syntax you may see in old tutorials (`USING PERIODIC COMMIT`, `CALL { WITH x }`); (3) on Aura you're always current, so write to the latest idioms." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite Neo4j teams — most are query-shape or modeling issues, not bugs." },
        { type: "heading", text: "1. Accidental cartesian products" },
        { type: "callout", variant: "warn", text: "Two **disconnected** patterns in one `MATCH` produce a **cartesian product** — every combination of the two sets. `MATCH (a:Person), (b:Movie) RETURN a, b` returns persons × movies. The planner even warns about it. **Fix:** connect the patterns with a relationship, or if you truly need both independently, isolate one behind a `WITH` first so it's computed once." },
        { type: "heading", text: "2. Whole-pattern MERGE creating duplicates" },
        { type: "callout", variant: "gotcha", text: "`MERGE (a:X{..})-[:R]->(b:Y{..})` merges the *entire path* as one unit and will create duplicate `a`/`b` nodes if that exact path is missing. **Fix:** `MERGE` each node on its unique key, then `MERGE` the relationship between the bound variables — and back the merge keys with **uniqueness constraints**." },
        { type: "heading", text: "3. Missing indexes → full label scans" },
        { type: "callout", variant: "warn", text: "Anchoring a `MATCH` on an un-indexed property scans every node of that label (`NodeByLabelScan` in `PROFILE`). **Fix:** create range/uniqueness indexes on the properties you start traversals from, and confirm you get a `NodeIndexSeek` with `PROFILE`. Create indexes/constraints *before* bulk `MERGE` loads." },
        { type: "heading", text: "4. Unbounded variable-length paths exploding" },
        { type: "callout", variant: "warn", text: "`-[:R*]->` (no upper bound) on a connected graph can traverse most of the database and OOM. **Fix:** always cap the depth (`*1..4`), anchor the start on an index, prefer `shortestPath` when you only need the connection, or use GDS/`apoc.path.expandConfig` with limits for controlled expansion." },
        { type: "heading", text: "5. Supernodes killing traversals" },
        { type: "callout", variant: "warn", text: "A node with millions of relationships forces scans of all its edges on every traversal through it (and becomes a write lock hotspot). **Fix:** don't model ubiquitous categories as single hubs; introduce intermediate/bucket nodes; use specific relationship types; and filter direction/type as early as possible." },
        { type: "heading", text: "6. OPTIONAL MATCH + WHERE ordering" },
        { type: "callout", variant: "gotcha", text: "A downstream `WHERE` on an optionally-matched variable silently converts the outer join to an inner join, dropping the null rows you wanted to keep. **Fix:** put the predicate inside the `OPTIONAL MATCH` pattern itself, or guard with `WHERE x IS NULL OR <cond>`." },
        { type: "heading", text: "7. Eager operator surprises on writes" },
        { type: "callout", variant: "gotcha", text: "When a query reads and writes the same data (e.g. `MATCH ... CREATE ... MATCH ...`), the planner may insert an **Eager** operator that buffers *all* rows before proceeding to guarantee correctness — which can blow up memory on large `LOAD CSV` jobs. **Fix:** split reads and writes into separate statements, batch with `IN TRANSACTIONS`, and check `PROFILE` for an unexpected `Eager`." },
        { type: "heading", text: "8. Forgetting relationship direction" },
        { type: "callout", variant: "gotcha", text: "`(a)-[:FOLLOWS]->(b)` and `(a)<-[:FOLLOWS]-(b)` mean opposite things; querying the wrong direction returns nothing (or wrong rows). **Fix:** be deliberate — use the arrowless `-[:FOLLOWS]-` only when you genuinely want either direction, and remember that undirected matching costs more." },
        { type: "heading", text: "9. String vs typed properties" },
        { type: "callout", variant: "gotcha", text: "CSV imports and loosely-typed writes leave numbers/dates as **strings** — then `WHERE p.age > 30` compares strings lexicographically (`\"9\" > \"30\"`), range queries misbehave, and temporal functions fail. **Fix:** cast on write (`toInteger`, `toFloat`, `date`, `datetime`) and keep property types consistent across all writers." },
        { type: "heading", text: "10. Not parameterizing queries" },
        { type: "callout", variant: "warn", text: "Concatenating values into query text is a Cypher-injection risk *and* thrashes the plan cache (every distinct string recompiles). **Fix:** always use `$params`; the query text stays constant so the compiled plan is reused." }
      ]
    }
  ],

  packages: [
    { name: "Neo4j Aura (AuraDB / AuraDS)", why: "the fully managed cloud service — zero-ops transactional (AuraDB) and data-science (AuraDS, GDS bundled) offerings, always on the current calendar version" },
    { name: "neo4j-driver (JavaScript/TS)", why: "official Bolt driver for Node/browser — driver→session→managed transaction functions with automatic retries" },
    { name: "neo4j (Python driver)", why: "official Python Bolt driver — `execute_read`/`execute_write`, parameterized queries, sync and async APIs" },
    { name: "cypher-shell", why: "the official CLI for running Cypher, scripts, and admin meta-commands over Bolt (interactive or piped)" },
    { name: "APOC", why: "'Awesome Procedures On Cypher' — the standard utility library: dynamic graph ops, refactoring, JSON/JDBC/XML loaders, `apoc.periodic.iterate` batching, path expansion" },
    { name: "Graph Data Science (GDS)", why: "65+ production graph algorithms (PageRank, Louvain, Node Similarity, weighted Dijkstra, FastRP/GraphSAGE embeddings) over projected in-memory graphs" },
    { name: "Neo4j Browser", why: "the built-in web workbench (`:7474`) — run Cypher, visualize results, `:play` guides, inspect the schema" },
    { name: "Neo4j Bloom", why: "codeless, business-friendly graph visualization & exploration tool with a natural-language-ish search bar and perspectives" },
    { name: "neo4j-admin", why: "the operational CLI — `database import` (offline bulk load), backup/restore, dump/load, database & DBMS administration" },
    { name: "Neo4j Desktop", why: "local dev app that manages database instances, plugins (APOC/GDS), and connections for development" },
    { name: "Spring Data Neo4j (SDN)", why: "Java/Spring integration — repositories, OGM entity mapping, and declarative transactions over the Java driver" },
    { name: "neomodel", why: "a Python OGM (object-graph mapper) — Django-style model classes over the driver for teams that prefer an ORM feel" },
    { name: "GraphQL Library for Neo4j (@neo4j/graphql)", why: "auto-generates a GraphQL API (queries, mutations, filtering, pagination) from type definitions backed by Cypher" },
    { name: "py2neo (legacy)", why: "a once-popular community Python client/OGM — now largely unmaintained; prefer the official `neo4j` driver or `neomodel` for new code" }
  ],

  gotchas: [
    "**Whole-pattern MERGE duplicates nodes:** `MERGE (a)-[:R]->(b)` merges the entire path; MERGE each node on its unique key first, then MERGE the relationship — and back keys with uniqueness constraints.",
    "**Disconnected MATCH patterns = cartesian product** (persons × movies). Connect them with a relationship or separate with a `WITH`; heed the planner's warning.",
    "**Unbounded `-[:R*]->` can traverse the whole graph and OOM.** Always cap the depth (`*1..4`), anchor on an index, or use `shortestPath`.",
    "**Missing index → full label scan.** Anchoring `MATCH` on an un-indexed property is a `NodeByLabelScan`; add indexes and verify a `NodeIndexSeek` with `PROFILE`. Create constraints before bulk MERGE loads.",
    "**Supernodes (millions of edges) kill traversals and become write hotspots.** Don't model ubiquitous categories as single hubs; add intermediate/bucket nodes and specific relationship types.",
    "**`OPTIONAL MATCH` + downstream `WHERE`** on the optional variable turns the outer join into an inner join — filter inside the pattern instead.",
    "**Eager operator on read-then-write queries** buffers all rows and can OOM big `LOAD CSV`. Split reads/writes, batch with `IN TRANSACTIONS`, check `PROFILE`.",
    "**Relationship direction matters:** `-[:R]->` and `<-[:R]-` are opposite; use arrowless `-[:R]-` only when you truly want either direction (it's costlier).",
    "**CSV values are all strings** (empty cell = `\"\"`, not null): cast with `toInteger`/`toFloat`/`date` or numeric filters and temporal functions break.",
    "**Not parameterizing** is an injection risk and thrashes the plan cache — use `$params` so the query text (and compiled plan) stays constant.",
    "**`SET n = {..}` replaces the whole property map** (wiping unlisted keys); use `SET n += {..}` to merge.",
    "**`DELETE` fails on nodes with relationships;** use `DETACH DELETE` — but `MATCH (n) DETACH DELETE n` wipes the entire database with no undo. Batch large deletes with `IN TRANSACTIONS`.",
    "**`shortestPath` counts hops, not weights.** For cheapest/fastest paths use GDS `gds.shortestPath.dijkstra` with a `relationshipWeightProperty`.",
    "**GDS runs on a projected snapshot,** not the live graph — re-project after writes, and drop projections to free memory.",
    "**JS driver returns 64-bit `Integer` objects,** not JS numbers — call `.toNumber()` (for small values) and pass params via `neo4j.int(...)`.",
    "**Old-tutorial syntax:** `USING PERIODIC COMMIT` and `CALL { WITH x ... }` are superseded by `CALL {...} IN TRANSACTIONS` and `CALL (x) {...}` in current GQL-aligned Cypher.",
    "**Filtering on a relationship *property* still scans every edge of that type** — prefer a specific relationship type over a generic `[:REL {kind:..}]` when you filter on the kind."
  ],

  flashcards: [
    { q: "What are the four elements of the property graph model?", a: "**Nodes** (entities), **relationships** (directed, typed edges), **properties** (key/value on either), and **labels** (tags grouping nodes; a node can have several)." },
    { q: "What is index-free adjacency and why does it matter?", a: "Each node stores direct pointers to its relationships, so traversing to neighbours is a pointer-chase whose cost depends on edges traversed, not total DB size. It's why deep traversals stay fast where SQL multi-joins explode." },
    { q: "When should you pick Neo4j over a relational DB?", a: "When relationships are the value and join depth is variable/unknown: social graphs, recommendations, fraud rings, network topology, knowledge graphs, path-finding. Stay relational for flat tabular data and aggregate reporting." },
    { q: "Read this pattern: `(a:Person)-[:KNOWS]->(b:Person)`.", a: "Person `a` KNOWS Person `b`, directed left-to-right. `()` is a node, `:Label` constrains it, `-[:TYPE]->` is a directed typed relationship. Arrowless `-[:KNOWS]-` matches either direction." },
    { q: "CREATE vs MERGE?", a: "`CREATE` always inserts new structure (no dedupe). `MERGE` is match-or-create on a pattern; combine with `ON CREATE SET`/`ON MATCH SET` for idempotent upserts. Use MERGE for anything that might already exist." },
    { q: "Why can whole-pattern MERGE create duplicates?", a: "`MERGE (a)-[:R]->(b)` treats the entire path as one unit — if that exact path is absent it creates all three elements, duplicating a/b even if they exist. Fix: MERGE each node on its key first, then MERGE the relationship." },
    { q: "What does `WITH` do in Cypher?", a: "It pipes/chains query parts — like a subquery boundary or Unix pipe. It lets you aggregate, filter on aggregates (the `HAVING` analog), and re-scope variables between MATCH stages. The key intermediate-Cypher skill." },
    { q: "How does grouping work without GROUP BY?", a: "It's implicit: in a RETURN/WITH mixing aggregating and non-aggregating expressions, the non-aggregating expressions automatically become the grouping key. `RETURN p.name, count(m)` groups by `p.name`." },
    { q: "What does `collect()` do, and its inverse?", a: "`collect(x)` aggregates values (or nodes) into a **list**, one row per group — the graph-native aggregation. `UNWIND list AS x` is the inverse: expand a list into one row per element (used for bulk writes)." },
    { q: "What's the difference between shortestPath and variable-length `*`?", a: "`shortestPath((a)-[:R*]-(b))` returns one shortest path (by hop count). `-[:R*1..3]-` returns *all* paths within 1–3 hops. `allShortestPaths` returns every tied-shortest path. Use the narrowest for the question." },
    { q: "How do you find a weighted shortest path?", a: "`shortestPath` counts hops, not cost. Use the GDS library: `gds.shortestPath.dijkstra` (or A*/Yen's) with a `relationshipWeightProperty`." },
    { q: "What is a cartesian product in Cypher and how do you avoid it?", a: "Two disconnected patterns in one MATCH (`MATCH (a:Person),(b:Movie)`) produce every combination. Connect them with a relationship, or isolate one behind a `WITH`. The planner warns about it." },
    { q: "When do indexes help in Neo4j?", a: "They speed up *finding the starting node(s)* of a traversal (`WHERE prop = ...` anchor) and enforce uniqueness. Traversals themselves need no index (index-free adjacency). Verify with `PROFILE` (NodeIndexSeek good, NodeByLabelScan = missing index)." },
    { q: "How do you bulk-import CSV in modern Cypher?", a: "`LOAD CSV WITH HEADERS FROM ... CALL (row) { MERGE ... } IN TRANSACTIONS OF 10000 ROWS`. Create constraints first, and cast string values (`toInteger`, etc.). For a fresh huge load use offline `neo4j-admin database import`." },
    { q: "What are the three GDS execution modes?", a: "`stream` (return rows, write nothing), `write` (persist results as properties on the real graph), `mutate` (write into the in-memory projection for algorithm pipelines). GDS runs on a *projected* snapshot, not the live graph." },
    { q: "Property, relationship, or intermediate node — how to decide?", a: "Property = intrinsic attribute of one entity. Relationship = a connection (put facts about the connection as edge properties). Reify into a node when the relationship has its own identity, structure, multiple participants, or lifecycle (e.g. an Order)." },
    { q: "What is a supernode and why is it bad?", a: "A node with a huge number of relationships (millions). Traversing through it scans all its edges, killing performance, and it becomes a write lock hotspot. Avoid modeling ubiquitous categories as single hubs; add intermediate/bucket nodes." },
    { q: "What's the driver's recommended way to run a write?", a: "A **managed transaction function** via `execute_write`/`executeWrite` — it auto-retries transient errors and routes to the leader. Because it can run more than once, make it idempotent (MERGE). One Driver per app, short-lived sessions." },
    { q: "How do Cypher and GQL relate in 2026?", a: "GQL (ISO 39075, 2024) is the SQL-for-graphs standard; Cypher is aligning with it. Modern syntax — quantified path patterns, `CALL (x) {}`, `EXISTS {}`/`COUNT {}` subqueries — comes from GQL. Learning modern Cypher is learning GQL." },
    { q: "What changed with Neo4j versioning?", a: "It moved from semantic versioning (the 5.x series) to **calendar versioning** — releases named `YYYY.MM` (e.g. 2025.06). There's no 'Neo4j 6'; Aura is always current. Language versions (Cypher 5 / 25) are decoupled from the product version." }
  ],

  cheatsheet: [
    { label: "Find pattern", code: "MATCH (p:Person)-[:ACTED_IN]->(m:Movie) RETURN p, m" },
    { label: "Filter + sort + page", code: "MATCH (p:Person) WHERE p.age > 30 RETURN p ORDER BY p.name SKIP 0 LIMIT 10" },
    { label: "Create node + relationship", code: "CREATE (a:Person {name:'A'})-[:FOLLOWS]->(b:Person {name:'B'})" },
    { label: "Idempotent upsert", code: "MERGE (p:Person {email:$e}) ON CREATE SET p.name=$n ON MATCH SET p.seen=datetime()" },
    { label: "Connect two nodes safely", code: "MERGE (a:P{id:$a}) MERGE (b:P{id:$b}) MERGE (a)-[:R]->(b)" },
    { label: "Set / merge props / label", code: "SET p.age=31  SET p += {city:'B'}  SET p:Vip  REMOVE p:Vip" },
    { label: "Delete node + its edges", code: "MATCH (p:Person {id:$id}) DETACH DELETE p" },
    { label: "Optional (outer join)", code: "OPTIONAL MATCH (p)-[:OWNS]->(d:Dog) RETURN p.name, d.name" },
    { label: "Variable-length path", code: "MATCH (a)-[:FRIEND*1..3]-(b) RETURN DISTINCT b" },
    { label: "Shortest path", code: "MATCH p=shortestPath((a)-[:R*..10]-(b)) RETURN length(p)" },
    { label: "Aggregate + HAVING", code: "MATCH (p)-[:ACTED_IN]->(m) WITH p,count(m) c WHERE c>20 RETURN p.name,c" },
    { label: "Collect into list", code: "MATCH (d)-[:DIRECTED]->(m) RETURN d.name, collect(m.title)" },
    { label: "Unwind list to rows", code: "UNWIND $rows AS r MERGE (:Person {id:r.id})" },
    { label: "Pattern comprehension", code: "RETURN [ (p)-[:ACTED_IN]->(m) | m.title ] AS movies" },
    { label: "CASE / coalesce", code: "RETURN coalesce(p.nick,p.name) , CASE WHEN p.age<18 THEN 'minor' ELSE 'adult' END" },
    { label: "Create index", code: "CREATE INDEX FOR (p:Person) ON (p.email)" },
    { label: "Unique constraint", code: "CREATE CONSTRAINT FOR (p:Person) REQUIRE p.email IS UNIQUE" },
    { label: "Profile a query", code: "PROFILE MATCH (p:Person {email:$e}) RETURN p  // want NodeIndexSeek" },
    { label: "LOAD CSV batched", code: "LOAD CSV WITH HEADERS FROM 'file:///x.csv' AS r CALL (r){ MERGE (:P{id:r.id}) } IN TRANSACTIONS OF 10000 ROWS" },
    { label: "GDS PageRank (stream)", code: "CALL gds.pageRank.stream('g') YIELD nodeId,score RETURN gds.util.asNode(nodeId).name,score" }
  ]
});
