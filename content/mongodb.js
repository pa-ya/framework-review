(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "mongodb",
  name: "MongoDB",
  language: "MongoDB",
  group: "Databases",
  navLabel: "MongoDB",
  color: "#13aa52",
  readMinutes: 34,
  tagline: "A **document database**: JSON-like **BSON** documents in collections, flexible schema, a powerful **aggregation pipeline**, and horizontal scale via replica sets + sharding. Model for your access patterns, not for normal form.",

  sections: [
    {
      id: "overview",
      title: "Overview & mental model",
      level: "core",
      body: [
        { type: "p", text: "MongoDB is a **general-purpose document database**. Instead of rows in tables with a fixed schema, you store **documents** — JSON-like objects — inside **collections**. A document can nest sub-documents and arrays, so data that a relational design would spread across five joined tables often lives in **one** document you read in a single lookup. The tagline mental model: *a collection is a table, a document is a row, a field is a column — but a field can itself be an object or an array.*" },
        { type: "code", lang: "json", code: "// one document = one order, with the customer + line items embedded\n{\n  \"_id\": ObjectId(\"665f1a...\"),\n  \"status\": \"paid\",\n  \"total\": NumberDecimal(\"149.90\"),\n  \"customer\": { \"name\": \"Ada\", \"email\": \"ada@x.io\" },\n  \"items\": [\n    { \"sku\": \"A1\", \"qty\": 2, \"price\": NumberDecimal(\"49.95\") },\n    { \"sku\": \"B7\", \"qty\": 1, \"price\": NumberDecimal(\"50.00\") }\n  ],\n  \"createdAt\": ISODate(\"2026-07-01T10:00:00Z\")\n}" },
        { type: "list", items: [
          "**Document** — a BSON object (binary JSON) with a unique `_id`. Max **16 MB** each.",
          "**Collection** — a group of documents (like a table). Schemaless by default: two documents in the same collection need not share fields.",
          "**Flexible schema** — you add a field by just writing it; there's no `ALTER TABLE`. Great for iteration, dangerous without discipline (see schema validation).",
          "**Query + aggregation** — a rich query language plus a staged **aggregation pipeline** that does the work `GROUP BY`, joins, and window functions do in SQL.",
          "**Scales horizontally** — built-in replication (HA) and sharding (partition data across nodes)."
        ] },
        { type: "heading", text: "When MongoDB fits — and when it doesn't" },
        { type: "table", headers: ["Reach for MongoDB when", "Prefer a relational DB when"], rows: [
          ["Data is **document-shaped** — one entity read/written as a unit (a product, an order, a user profile)", "Data is highly **relational** with many-to-many joins across equally-important entities"],
          ["Schema **evolves fast** or varies per record (catalogs, CMS, events, IoT)", "You need **multi-table transactions** as the norm and strict normalized integrity"],
          ["You want to **scale writes horizontally** by sharding", "Heavy **ad-hoc analytical joins / reporting** across normalized tables"],
          ["Access patterns are known and you can **model to them** (embed what you read together)", "You truly don't know the query patterns and want the flexibility of arbitrary SQL joins"]
        ] },
        { type: "callout", variant: "note", text: "MongoDB *has* multi-document ACID transactions (since 4.0) and `$lookup` joins — the old \"no transactions, no joins\" critique is outdated. But it's still not a relational engine: joins are second-class and you should design so you rarely need them. The winning move is **modeling to your access patterns**, not translating a relational schema field-for-field." },
        { type: "callout", variant: "tip", text: "This deck assumes **MongoDB 8.x** (current in 2026) and modern tooling: the `mongosh` shell, the current Node driver (`mongodb` v6), and Atlas for managed hosting. Where behavior changed from older versions (e.g. the legacy `mongo` shell, the removed `update()` multi-doc signature) it's flagged as an \"old way\" contrast." }
      ]
    },
    {
      id: "setup",
      title: "Setup: install, Atlas, mongosh, drivers",
      level: "core",
      body: [
        { type: "p", text: "Three common ways to get a running MongoDB: **Atlas** (managed cloud, free tier — the recommended default), **Docker** (throwaway local), or a **local install** (Community Edition). Then connect with `mongosh` (the shell) or an official driver." },
        { type: "heading", text: "MongoDB Atlas (managed, free M0 tier)" },
        { type: "list", items: [
          "Create a free **M0** cluster at cloud.mongodb.com — enough for dev and small apps, no card required.",
          "Add a database user + allowlist your IP (or `0.0.0.0/0` for dev only).",
          "Copy the **SRV connection string** and drop it into `mongosh` or a driver.",
          "Atlas bundles backups, monitoring, **Atlas Search**, and **Vector Search** — features you'd otherwise self-host."
        ] },
        { type: "heading", text: "Docker (local throwaway)" },
        { type: "code", lang: "bash", code: "# single-node local instance\ndocker run -d --name mongo -p 27017:27017 mongo:8\n\n# NOTE: a plain single node has NO replica set, so transactions & change\n# streams won't work. To enable them locally, start a single-node replica set:\ndocker run -d --name mongo -p 27017:27017 mongo:8 --replSet rs0\ndocker exec -it mongo mongosh --eval \"rs.initiate()\"" },
        { type: "heading", text: "Connect with mongosh + connection strings" },
        { type: "code", lang: "bash", code: "# mongosh is the modern shell (a full Node.js REPL). The legacy `mongo` shell is gone.\nbrew install mongosh   # or download from mongodb.com\n\n# local\nmongosh \"mongodb://localhost:27017\"\n\n# Atlas — SRV form: mongodb+srv resolves hosts + options via DNS, no port list\nmongosh \"mongodb+srv://ada:PASSWORD@cluster0.abcd.mongodb.net/mydb?retryWrites=true&w=majority\"" },
        { type: "table", headers: ["Connection string part", "Meaning"], rows: [
          ["`mongodb+srv://`", "SRV scheme — DNS supplies the replica-set hosts + default options (Atlas default)"],
          ["`mongodb://host1,host2,host3`", "standard scheme — you list every replica-set member explicitly"],
          ["`/mydb`", "the default database for this connection (optional)"],
          ["`retryWrites=true`", "automatically retry a write once if the primary blips (on by default)"],
          ["`w=majority`", "write concern — ack only after a majority of nodes have the write"]
        ] },
        { type: "heading", text: "GUI: Compass" },
        { type: "p", text: "**MongoDB Compass** is the official GUI: browse collections, build queries and aggregation pipelines visually (with a pipeline preview at each stage), inspect indexes, and read `explain` plans. Great for learning aggregation and for eyeballing real documents." },
        { type: "heading", text: "Official drivers (Node, Python)" },
        { type: "code", lang: "js", code: "// Node.js — npm i mongodb  (the official driver, v6)\nimport { MongoClient } from \"mongodb\";\n\nconst client = new MongoClient(process.env.MONGO_URI);\nawait client.connect();\nconst db = client.db(\"shop\");\nconst orders = db.collection(\"orders\");\n\nconst doc = await orders.findOne({ status: \"paid\" });\nconsole.log(doc);\nawait client.close();" },
        { type: "code", lang: "py", code: "# Python — pip install pymongo\nfrom pymongo import MongoClient\n\nclient = MongoClient(\"mongodb+srv://ada:PASSWORD@cluster0.abcd.mongodb.net\")\ndb = client[\"shop\"]\norders = db[\"orders\"]\n\ndoc = orders.find_one({\"status\": \"paid\"})\nprint(doc)" },
        { type: "callout", variant: "tip", text: "One `MongoClient` per application (it manages an internal connection **pool**) — create it once at startup and reuse it, never per request. Constructing a client per request exhausts connections and tanks latency." }
      ]
    },
    {
      id: "documents",
      title: "Documents, _id & BSON types",
      level: "core",
      body: [
        { type: "p", text: "Documents are stored as **BSON** (Binary JSON) — a binary superset of JSON that adds real types JSON lacks: dates, 64-bit ints, decimals, binary, and the `ObjectId`. Knowing the type system prevents a whole class of bugs (numbers-as-floats, dates-as-strings, `_id` mismatches)." },
        { type: "heading", text: "_id and ObjectId" },
        { type: "p", text: "Every document has a unique **`_id`** (the primary key, always indexed). If you don't supply one, the driver generates an **`ObjectId`** — a 12-byte value: a 4-byte timestamp + 5 random bytes + a 3-byte counter. So ObjectIds are roughly time-ordered and you can even extract the creation time from one." },
        { type: "code", lang: "js", code: "const id = new ObjectId();\nid.getTimestamp();            // -> Date the ObjectId was created\n\n// _id can be ANY type, not just ObjectId — a string, int, or compound doc:\ndb.users.insertOne({ _id: \"ada@x.io\", name: \"Ada\" });         // natural key\ndb.rates.insertOne({ _id: { from: \"USD\", to: \"EUR\" }, v: 0.9 }); // compound key" },
        { type: "heading", text: "The BSON types you must know" },
        { type: "table", headers: ["BSON type", "mongosh literal", "Use for"], rows: [
          ["ObjectId", "`ObjectId(\"...\")`", "default `_id`; compact, time-sortable id"],
          ["Date", "`ISODate(\"2026-07-01\")` / `new Date()`", "timestamps — **always** store a real Date, never a string"],
          ["Decimal128", "`NumberDecimal(\"9.99\")`", "money / exact decimals (no float rounding)"],
          ["Double", "`3.14` (default number)", "floating-point measurements"],
          ["Int32 / Int64", "`NumberInt(5)` / `NumberLong(5)`", "counters, ids; exact integers"],
          ["String", "`\"text\"`", "UTF-8 text"],
          ["Boolean", "`true` / `false`", "flags"],
          ["Array", "`[1, 2, 3]`", "lists, tags, embedded item lists"],
          ["Object (embedded doc)", "`{ a: 1 }`", "nested structure (address, metadata)"],
          ["Null / (missing)", "`null` / field absent", "distinct: present-but-null vs not-present"],
          ["Binary / UUID", "`UUID(\"...\")`, `BinData`", "raw bytes, UUID keys"]
        ] },
        { type: "callout", variant: "gotcha", text: "In `mongosh` a bare number literal like `9.99` is a **Double**, and JS integers become Double too. That's fine for measurements but wrong for money — floats can't represent `0.10` exactly. Use `NumberDecimal(\"9.99\")` (Decimal128) for currency and `NumberInt`/`NumberLong` when you specifically need integer types (e.g. from another driver expecting int)." },
        { type: "callout", variant: "warn", text: "The **16 MB document limit** is a hard cap. It's rarely a problem for a single entity, but it *is* a design signal: an unbounded array (a document that grows forever — a chat's every message, a user's every event) will eventually hit it. Model growing lists as their own collection or with the **bucket pattern** (see Data modeling)." }
      ]
    },
    {
      id: "crud-reads",
      title: "CRUD: inserts & reads (find, operators, projection)",
      level: "core",
      body: [
        { type: "p", text: "Reads use `find` / `findOne` with a **query document**: a filter where each field is either a literal (equality) or an object of **query operators** (`{ age: { $gte: 18 } }`). The shape of the filter mirrors the shape of the documents." },
        { type: "heading", text: "Insert" },
        { type: "code", lang: "js", code: "db.users.insertOne({ name: \"Ada\", age: 36, roles: [\"admin\"] });\ndb.users.insertMany([\n  { name: \"Bob\", age: 41, roles: [\"editor\"] },\n  { name: \"Cy\",  age: 29, roles: [] }\n]);\n// insertOne returns { acknowledged: true, insertedId: ObjectId(...) }" },
        { type: "heading", text: "Find with query operators" },
        { type: "code", lang: "js", code: "// equality (implicit $eq)\ndb.users.find({ name: \"Ada\" });\n\n// comparison + logical operators\ndb.users.find({ age: { $gte: 18, $lt: 65 } });        // range\ndb.users.find({ role: { $in: [\"admin\", \"editor\"] } }); // membership\ndb.users.find({ status: { $ne: \"banned\" } });\ndb.users.find({ $or: [{ age: { $lt: 18 } }, { vip: true }] });\ndb.users.find({ $and: [{ age: { $gte: 18 } }, { verified: true }] });\ndb.users.find({ age: { $not: { $gt: 65 } } });\n\n// existence / type / regex\ndb.users.find({ deletedAt: { $exists: false } });     // field absent\ndb.users.find({ age: { $type: \"int\" } });\ndb.users.find({ name: { $regex: /^A/, $options: \"i\" } }); // starts with A, case-insensitive" },
        { type: "table", headers: ["Operator", "Meaning"], rows: [
          ["`$eq` / `$ne`", "equals / not equals"],
          ["`$gt` `$gte` `$lt` `$lte`", "greater/less than (and or-equal)"],
          ["`$in` / `$nin`", "value in / not in an array of options"],
          ["`$and` `$or` `$not` `$nor`", "logical combinators (top-level fields are already AND-ed)"],
          ["`$exists`", "field is present (`true`) or absent (`false`)"],
          ["`$type`", "field is a given BSON type"],
          ["`$regex`", "pattern match (prefix `/^x/` can use an index; unanchored cannot)"]
        ] },
        { type: "heading", text: "Projection, sort, limit, skip, count" },
        { type: "code", lang: "js", code: "// projection: 1 = include, 0 = exclude (can't mix except to drop _id)\ndb.users.find({ age: { $gte: 18 } }, { name: 1, age: 1, _id: 0 });\n\n// cursor modifiers chain; the query runs when you iterate\ndb.users.find({ verified: true })\n  .sort({ age: -1 })   // -1 desc, 1 asc\n  .skip(20)\n  .limit(10);\n\ndb.users.countDocuments({ verified: true });  // accurate count (runs the query)\ndb.users.estimatedDocumentCount();            // fast metadata count (whole collection)" },
        { type: "callout", variant: "gotcha", text: "`find()` returns a **lazy cursor**, not an array — in `mongosh` it auto-prints the first 20; in a driver you must iterate or call `.toArray()`. And `skip`+`limit` pagination gets slow on deep pages: `skip(100000)` still walks and discards 100k docs. Use **range/keyset pagination** (`_id > lastId`) for large offsets (see Performance)." },
        { type: "callout", variant: "note", text: "`countDocuments()` replaced the deprecated `count()`. Use `estimatedDocumentCount()` (metadata-based, O(1)) only for a whole-collection total where slight staleness is fine — it ignores the filter." }
      ]
    },
    {
      id: "crud-writes",
      title: "CRUD: updates, deletes & atomic operators",
      level: "core",
      body: [
        { type: "p", text: "Updates take a **filter** plus an **update document** built from **update operators** (`$set`, `$inc`, ...). A modern update *must* use operators or an aggregation pipeline — you can't pass a bare replacement object to `updateOne` (that's what `replaceOne` is for). Every single-document update is **atomic**." },
        { type: "code", lang: "js", code: "// field updates\ndb.users.updateOne({ _id: id }, { $set: { verified: true, \"addr.city\": \"Berlin\" } });\ndb.users.updateOne({ _id: id }, { $unset: { tempFlag: \"\" } });        // remove a field\ndb.users.updateMany({ plan: \"free\" }, { $inc: { credits: 10 } });     // atomic +10\ndb.products.updateOne({ _id: id }, { $mul: { price: 1.1 } });         // *1.1\ndb.users.updateOne({ _id: id }, { $rename: { fullname: \"name\" } });\ndb.stats.updateOne({ _id: id }, { $min: { lowest: 5 }, $max: { highest: 99 } });\ndb.users.updateOne({ _id: id }, { $currentDate: { updatedAt: true } });\n\n// replace the WHOLE document (except _id)\ndb.users.replaceOne({ _id: id }, { name: \"Ada\", age: 37 });" },
        { type: "heading", text: "Array update operators" },
        { type: "code", lang: "js", code: "db.users.updateOne({ _id: id }, { $push: { logins: new Date() } });   // append\ndb.users.updateOne({ _id: id }, { $addToSet: { tags: \"vip\" } });      // append if absent\ndb.users.updateOne({ _id: id }, { $pull: { tags: \"beta\" } });         // remove matching\ndb.users.updateOne({ _id: id }, { $pop: { logins: -1 } });            // -1 first, 1 last\n\n// $each + $slice + $sort: keep only the newest 10 scores\ndb.users.updateOne(\n  { _id: id },\n  { $push: { scores: { $each: [88, 92], $sort: -1, $slice: 10 } } }\n);" },
        { type: "table", headers: ["Operator", "Effect"], rows: [
          ["`$set` / `$unset`", "set a field / remove a field"],
          ["`$inc` / `$mul`", "increment / multiply a number (atomic)"],
          ["`$min` / `$max`", "set only if new value is lower / higher"],
          ["`$rename`", "rename a field"],
          ["`$currentDate`", "set field to server's current date/timestamp"],
          ["`$push` / `$pull` / `$pop`", "add / remove-by-match / remove-end from an array"],
          ["`$addToSet`", "push only if not already present (set semantics)"],
          ["`$each` `$slice` `$sort`", "modifiers to `$push`: multiple items, cap length, keep sorted"]
        ] },
        { type: "heading", text: "Upsert, delete, atomic find-and-modify, bulk" },
        { type: "code", lang: "js", code: "// upsert: update if found, else insert (great for idempotent counters)\ndb.counters.updateOne(\n  { _id: \"visits\" },\n  { $inc: { n: 1 } },\n  { upsert: true }\n);\n\ndb.users.deleteOne({ _id: id });\ndb.users.deleteMany({ status: \"banned\" });\n\n// findOneAndUpdate: atomically update AND return the doc (before or after)\nconst updated = db.jobs.findOneAndUpdate(\n  { status: \"queued\" },\n  { $set: { status: \"running\", worker: \"w1\" } },\n  { sort: { priority: -1 }, returnDocument: \"after\" }  // grab-a-job pattern\n);\n\n// bulkWrite: many ops in one round-trip (ordered:false lets them run in parallel)\ndb.users.bulkWrite([\n  { insertOne: { document: { name: \"Dee\" } } },\n  { updateOne: { filter: { _id: id }, update: { $set: { vip: true } } } },\n  { deleteOne: { filter: { name: \"Cy\" } } }\n], { ordered: false });" },
        { type: "callout", variant: "tip", text: "`findOneAndUpdate` with `returnDocument: \"after\"` is the atomic **compare-and-swap / claim-a-row** primitive — a whole work-queue can be built on it without a transaction, because the match + update happen as one atomic step on a single document. (The old `returnNewDocument: true` flag is superseded by `returnDocument`.)" },
        { type: "callout", variant: "warn", text: "`updateMany` is **not** atomic across documents — each document is updated atomically, but another client can read the collection mid-operation and see a partial result. If you need all-or-nothing across multiple documents, use a **transaction**." }
      ]
    },
    {
      id: "nested",
      title: "Querying nested documents & arrays",
      level: "core",
      body: [
        { type: "p", text: "The document model's power is nesting, and the query language has precise tools for reaching into embedded objects and arrays. Get these right and you rarely need joins." },
        { type: "heading", text: "Dot notation into embedded documents" },
        { type: "code", lang: "js", code: "// given { addr: { city: \"Berlin\", geo: { lat: 52.5 } } }\ndb.users.find({ \"addr.city\": \"Berlin\" });          // reach a nested field\ndb.users.find({ \"addr.geo.lat\": { $gt: 50 } });\n\n// matching a WHOLE embedded doc is EXACT + ORDER-sensitive (rarely what you want):\ndb.users.find({ addr: { city: \"Berlin\", geo: { lat: 52.5 } } }); // must match every field, exactly\n// -> almost always prefer dot notation on the specific fields you care about" },
        { type: "heading", text: "Arrays: matching, $elemMatch" },
        { type: "code", lang: "js", code: "// { tags: [\"a\",\"b\"] } — a scalar filter matches if ANY element matches\ndb.posts.find({ tags: \"a\" });                  // any element == \"a\"\ndb.posts.find({ tags: { $all: [\"a\", \"b\"] } }); // contains all of these\ndb.posts.find({ \"tags.0\": \"a\" });              // element at index 0\ndb.posts.find({ tags: { $size: 3 } });         // exactly 3 elements\n\n// array of OBJECTS: items:[{sku,qty},...].\n// WITHOUT $elemMatch, conditions can match across DIFFERENT elements:\ndb.orders.find({ \"items.qty\": { $gt: 5 }, \"items.price\": { $lt: 10 } });\n// ^ matches if SOME item.qty>5 AND SOME item.price<10 (not necessarily the same item!)\n\n// $elemMatch: require ONE element to satisfy ALL conditions together\ndb.orders.find({ items: { $elemMatch: { qty: { $gt: 5 }, price: { $lt: 10 } } } });" },
        { type: "callout", variant: "gotcha", text: "This is *the* classic array bug: `{ \"items.qty\": {$gt:5}, \"items.price\": {$lt:10} }` can match a document where one item has qty 6 and a *different* item has price 9. When conditions must hold for the **same** array element, you need `$elemMatch`." },
        { type: "heading", text: "Positional array updates: $, $[], arrayFilters" },
        { type: "code", lang: "js", code: "// $ = the FIRST element matched by the query filter\ndb.orders.updateOne(\n  { _id: id, \"items.sku\": \"A1\" },\n  { $set: { \"items.$.qty\": 10 } }        // update the matched item\n);\n\n// $[] = ALL elements\ndb.orders.updateOne({ _id: id }, { $inc: { \"items.$[].qty\": 1 } });\n\n// $[<id>] + arrayFilters = all elements matching a named condition\ndb.orders.updateOne(\n  { _id: id },\n  { $set: { \"items.$[low].onSale\": true } },\n  { arrayFilters: [{ \"low.price\": { $lt: 20 } }] }\n);" },
        { type: "table", headers: ["Operator", "Which array elements it updates"], rows: [
          ["`$`", "the **first** element matched by the query filter (filter must reference the array)"],
          ["`$[]`", "**every** element (the all-positional operator)"],
          ["`$[name]`", "every element matching the named condition in `arrayFilters`"]
        ] },
        { type: "callout", variant: "note", text: "The bare `$` positional operator updates only the **first** match and needs the array field in the query filter. To update several elements by a condition, use `$[identifier]` with `arrayFilters` — it's the modern, precise tool and avoids the \"only-first\" surprise." }
      ]
    },
    {
      id: "aggregation",
      title: "Aggregation pipeline (the workhorse)",
      level: "core",
      body: [
        { type: "p", text: "The **aggregation pipeline** is MongoDB's analytical engine and the single most important thing to master. Documents flow through an **ordered array of stages**; each stage transforms the stream and passes it on — like Unix pipes. It replaces SQL's `GROUP BY`, `HAVING`, joins, subqueries, and window functions." },
        { type: "heading", text: "The core stages" },
        { type: "table", headers: ["Stage", "SQL analogue", "Does"], rows: [
          ["`$match`", "WHERE", "filter documents (put it **first** so indexes apply)"],
          ["`$project`", "SELECT cols", "reshape: include/exclude/compute fields"],
          ["`$group`", "GROUP BY", "bucket by `_id` key and aggregate (sum/avg/…)"],
          ["`$sort`", "ORDER BY", "sort the stream"],
          ["`$limit` / `$skip`", "LIMIT / OFFSET", "take / skip N"],
          ["`$unwind`", "unnest array", "one output doc per array element"],
          ["`$lookup`", "LEFT JOIN", "pull in matching docs from another collection"],
          ["`$addFields` / `$set`", "computed column", "add fields, keep the rest (`$set` is an alias)"],
          ["`$replaceRoot`", "promote a subdoc", "make an embedded doc the new top level"],
          ["`$facet`", "multiple aggregations", "run several sub-pipelines over the same input"],
          ["`$bucket` / `$count`", "histogram / COUNT(*)", "group into ranges / count the stream"]
        ] },
        { type: "heading", text: "A fully annotated multi-stage pipeline" },
        { type: "p", text: "Goal: *top 3 customers by paid revenue in 2026, with their name and order count.* Read it stage by stage." },
        { type: "code", lang: "js", code: "db.orders.aggregate([\n  // 1. FILTER first (uses an index on status+createdAt) — shrinks the stream early\n  { $match: {\n      status: \"paid\",\n      createdAt: { $gte: ISODate(\"2026-01-01\"), $lt: ISODate(\"2027-01-01\") }\n  } },\n\n  // 2. GROUP by customerId; accumulate revenue + count per group\n  { $group: {\n      _id: \"$customerId\",             // the group key\n      revenue: { $sum: \"$total\" },    // sum totals in each group\n      orders:  { $sum: 1 },           // count docs per group\n      avgOrder:{ $avg: \"$total\" },\n      lastAt:  { $max: \"$createdAt\" }\n  } },\n\n  // 3. SORT groups by revenue desc, keep the top 3\n  { $sort: { revenue: -1 } },\n  { $limit: 3 },\n\n  // 4. JOIN to customers to get the name (one lookup for the 3 survivors)\n  { $lookup: {\n      from: \"customers\",\n      localField: \"_id\",              // orders group key = customerId\n      foreignField: \"_id\",\n      as: \"customer\"                  // -> array field\n  } },\n\n  // 5. $lookup returns an ARRAY; unwind the single match to an object\n  { $unwind: \"$customer\" },\n\n  // 6. SHAPE the final output\n  { $project: {\n      _id: 0,\n      customerId: \"$_id\",\n      name: \"$customer.name\",\n      revenue: 1,\n      orders: 1,\n      avgOrder: { $round: [\"$avgOrder\", 2] }\n  } }\n], { allowDiskUse: true });" },
        { type: "heading", text: "Accumulators (inside $group)" },
        { type: "list", items: [
          "`$sum` — total (`$sum: 1` counts docs; `$sum: \"$field\"` sums a field).",
          "`$avg` — mean of a field across the group.",
          "`$min` / `$max` — extremes in the group.",
          "`$push` — collect values into an array (one entry per doc).",
          "`$addToSet` — like `$push` but de-duplicated.",
          "`$first` / `$last` — first/last value (meaningful after a `$sort`)."
        ] },
        { type: "callout", variant: "warn", text: "`$lookup` is **not a cheap SQL join**. For each input document it runs a query against the foreign collection; without an index on the `foreignField` it's effectively N collection scans. Always index the join field, do `$lookup` **after** `$match`/`$limit` (join fewer docs), and if you find yourself joining constantly, that's a signal you should have **embedded** the data instead (see Data modeling)." },
        { type: "callout", variant: "tip", text: "Pipeline discipline: **`$match` and `$sort` as early as possible** so they can use indexes and shrink the stream before expensive stages. Only the first `$match`/`$sort` (before any transforming stage) can use a collection index — once you `$group`/`$project` new fields, later stages run in memory. Aggregations that exceed 100 MB per stage need `allowDiskUse: true`." },
        { type: "callout", variant: "note", text: "`$facet` runs multiple sub-pipelines over the same input in one pass — perfect for a **search results + facet counts + total** page. `$bucket`/`$bucketAuto` build histograms. `$replaceRoot`/`$replaceWith` promote an embedded document to the top level. These are the stages that make aggregation a full query engine." }
      ]
    },
    {
      id: "indexes",
      title: "Indexes & the ESR rule",
      level: "core",
      body: [
        { type: "p", text: "Without an index, a query is a **collection scan** — MongoDB reads every document. Indexes (B-trees, same idea as SQL) make lookups, ranges, and sorts fast. The `_id` field is always indexed; you add the rest based on your query patterns. This is the #1 lever on MongoDB performance." },
        { type: "code", lang: "js", code: "db.users.createIndex({ email: 1 }, { unique: true });   // 1 asc, -1 desc\ndb.orders.createIndex({ customerId: 1, createdAt: -1 }); // compound\ndb.posts.createIndex({ tags: 1 });                      // multikey (array field)\ndb.articles.createIndex({ title: \"text\", body: \"text\" });// text search\ndb.events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // TTL\ndb.getCollectionNames(); db.users.getIndexes();" },
        { type: "table", headers: ["Index type", "For"], rows: [
          ["**Single field**", "one field equality / range / sort"],
          ["**Compound**", "queries filtering/sorting on several fields (order matters — see ESR)"],
          ["**Multikey**", "arrays — auto-created when you index an array field; one entry per element"],
          ["**Text**", "language-aware keyword search (`$text`); one per collection (mostly superseded by Atlas Search)"],
          ["**Wildcard** `{ \"$**\": 1 }`", "unknown/variable field names (flexible attribute bags)"],
          ["**Partial**", "index only docs matching a filter (smaller, e.g. only `status:'active'`)"],
          ["**TTL**", "auto-delete docs N seconds after a date field (sessions, logs)"],
          ["**Unique**", "enforce uniqueness (a constraint, not just speed)"],
          ["**Hashed**", "even distribution — used for hashed shard keys"],
          ["**Geospatial** `2dsphere`", "location queries (`$near`, `$geoWithin`)"]
        ] },
        { type: "heading", text: "Compound index order: the ESR rule" },
        { type: "p", text: "For a compound index, field **order** is everything. The rule of thumb is **ESR — Equality, Sort, Range**: put fields used for **equality** matches first, then the field you **sort** on, then **range** fields last." },
        { type: "code", lang: "js", code: "// query: status == \"paid\", sort by createdAt desc, amount > 100\ndb.orders.find({ status: \"paid\", amount: { $gt: 100 } }).sort({ createdAt: -1 });\n\n// ESR-optimal index: Equality (status), Sort (createdAt), Range (amount)\ndb.orders.createIndex({ status: 1, createdAt: -1, amount: 1 });\n// wrong order (range before sort) forces an in-memory sort of the range results" },
        { type: "heading", text: "explain() — read the plan" },
        { type: "code", lang: "js", code: "db.orders.find({ status: \"paid\" }).explain(\"executionStats\");\n// look for:\n//   winningPlan.stage: \"IXSCAN\" (good, used an index) vs \"COLLSCAN\" (scanned everything)\n//   totalDocsExamined vs nReturned  -> want these CLOSE (examining 1000 to return 10 = bad)\n//   totalKeysExamined, executionTimeMillis" },
        { type: "callout", variant: "good", text: "A **covered query** returns results using only index keys — MongoDB never touches the documents. Requirement: every field in the filter *and* the projection is in the index, and you exclude `_id` (or include it in the index). `explain` shows `totalDocsExamined: 0`. This is the fastest possible read." },
        { type: "callout", variant: "warn", text: "Indexes aren't free: each one slows writes (every insert/update maintains it) and uses RAM + disk. The goal is that your **indexes + working set fit in RAM**. Don't index every field — index for your actual query patterns, drop unused indexes (`$indexStats` shows usage), and remember a compound index on `{a,b}` already serves queries on `a` alone (prefix rule), so you don't also need a separate `{a}` index." }
      ]
    },
    {
      id: "data-modeling",
      title: "Data modeling & schema design patterns",
      level: "core",
      body: [
        { type: "p", text: "This is where MongoDB is won or lost. Relational modeling normalizes to eliminate duplication; MongoDB modeling optimizes for **how you read and write**. The central decision for every relationship is **embed vs reference**, and the guiding question is: *is this data accessed together, and how does it grow?*" },
        { type: "heading", text: "Embed vs reference" },
        { type: "table", headers: ["", "Embed (nest the data)", "Reference (store an id, join/lookup)"], rows: [
          ["Read", "one lookup gets everything (fast)", "extra query / `$lookup` per relation"],
          ["Best for", "data read together, owned by the parent, bounded in size", "large/unbounded, shared, or independently-queried data"],
          ["Consistency", "atomic single-doc update", "must keep copies in sync (or re-fetch)"],
          ["Example", "order line items, address, comments-on-a-post (few)", "author of many posts, products in many orders"]
        ] },
        { type: "heading", text: "One-to-few / one-to-many / one-to-squillions" },
        { type: "list", items: [
          "**One-to-few** (a person's few addresses) → **embed** an array. Read together, bounded, simple.",
          "**One-to-many** (a product's hundreds of reviews) → **reference** from the many side (each review stores `productId`), or use the **subset pattern**: embed the latest few, reference the rest.",
          "**One-to-squillions** (a server's millions of log lines) → **reference** from the child, and never embed — you'd blow the 16 MB cap. Consider the **bucket pattern**."
        ] },
        { type: "heading", text: "The schema design patterns" },
        { type: "table", headers: ["Pattern", "Problem it solves"], rows: [
          ["**Bucket**", "high-volume time-series/events: group many readings into one doc per hour/device (fewer, bigger docs; bounded arrays)"],
          ["**Computed**", "expensive aggregates (totals, averages) computed on write and stored, so reads don't recompute"],
          ["**Subset**", "huge related lists: embed the hot subset (last 10 reviews) in the parent, keep the full set in another collection"],
          ["**Extended reference**", "embed the *few* fields of a referenced doc you always show (order stores customer name+city, not just id) to avoid a join"],
          ["**Outlier**", "a few documents that would break your model (a user with 10M followers): handle them with an overflow flag/collection so the common case stays simple"]
        ] },
        { type: "callout", variant: "tip", text: "**Extended reference** is the everyday denormalization win: an order embeds `{ customerId, customerName }` so the orders list renders with no join. The tradeoff — if the customer renames, historical copies are stale. Often that's *correct* (the order should show the name at purchase time); when it isn't, update copies with a background job or accept a `$lookup` for the live value." },
        { type: "callout", variant: "warn", text: "The #1 modeling mistake is translating a relational schema table-for-table into collections and then `$lookup`-ing everywhere to reassemble it. If every read needs three joins, you modeled relationally, not for documents. Start from your **queries**: what does each screen need, and can one document serve it? Duplication is acceptable — disk is cheap, joins are not." },
        { type: "callout", variant: "note", text: "Denormalization means the same fact can live in several places. That's fine **if** you're clear on the source of truth and have a sync strategy (or the copy is intentionally a point-in-time snapshot). Change streams (later) are a common way to propagate updates to denormalized copies." }
      ]
    },
    {
      id: "transactions",
      title: "Multi-document transactions",
      level: "core",
      body: [
        { type: "p", text: "Since 4.0 MongoDB supports **multi-document ACID transactions** across collections (and since 4.2, across shards). But a single-document write is *already* atomic, and good document modeling means you need transactions far less often than in SQL. Reach for one only when a single operation must consistently touch **multiple documents**." },
        { type: "code", lang: "js", code: "// classic: move money between two accounts — both updates or neither\nconst session = client.startSession();\ntry {\n  await session.withTransaction(async () => {\n    const accounts = db.collection(\"accounts\");\n    await accounts.updateOne(\n      { _id: \"A\" }, { $inc: { balance: -100 } }, { session });\n    await accounts.updateOne(\n      { _id: \"B\" }, { $inc: { balance:  100 } }, { session });\n    // throwing in here aborts + rolls back everything\n  });\n} finally {\n  await session.endSession();\n}" },
        { type: "code", lang: "js", code: "// lower-level API (mongosh / manual control)\nsession.startTransaction();\ntry {\n  // ...ops with { session }...\n  session.commitTransaction();\n} catch (e) {\n  session.abortTransaction();\n}" },
        { type: "list", items: [
          "**Sessions** carry the transaction; every operation must pass `{ session }` or it runs *outside* the transaction.",
          "**`withTransaction`** (the recommended helper) runs your callback and **auto-retries** on transient errors (`TransientTransactionError`, commit races) — prefer it over manual start/commit.",
          "**Retryable writes** (`retryWrites=true`, on by default) transparently retry a single write once on a network blip — separate from transactions but related resilience.",
          "**Requires a replica set** (or sharded cluster) — transactions don't work on a standalone `mongod` (hence the single-node replica-set trick in Setup)."
        ] },
        { type: "callout", variant: "warn", text: "Transactions have real cost: they hold locks, must complete within a time limit (**60 s** default), and don't scale like single-doc writes. They are a **safety net for the occasional cross-document invariant**, not a substitute for modeling. If your app leans on transactions for everything, your documents are probably too normalized — embed the data that must change together into one document and get atomicity for free." }
      ]
    },
    {
      id: "validation",
      title: "Schema validation",
      level: "core",
      body: [
        { type: "p", text: "\"Flexible schema\" doesn't have to mean \"no schema.\" MongoDB can enforce a **`$jsonSchema`** validator on a collection so writes that don't match are rejected — you get MongoDB's flexibility during development and guardrails in production. This is the antidote to silent **schema drift**." },
        { type: "code", lang: "js", code: "db.createCollection(\"users\", {\n  validator: {\n    $jsonSchema: {\n      bsonType: \"object\",\n      required: [\"email\", \"createdAt\"],\n      properties: {\n        email:     { bsonType: \"string\", pattern: \"^.+@.+$\" },\n        age:       { bsonType: \"int\", minimum: 0, maximum: 150 },\n        createdAt: { bsonType: \"date\" },\n        roles:     { bsonType: \"array\", items: { bsonType: \"string\" } }\n      },\n      additionalProperties: true   // set false to reject unknown fields\n    }\n  },\n  validationLevel: \"strict\",     // strict | moderate\n  validationAction: \"error\"      // error | warn\n});\n\n// add/adjust on an existing collection:\ndb.runCommand({ collMod: \"users\", validator: { /* ... */ } });" },
        { type: "table", headers: ["Setting", "Options", "Meaning"], rows: [
          ["`validationLevel`", "`strict` / `moderate`", "`moderate` only validates **inserts + updates to already-valid docs**, leaving legacy invalid docs alone"],
          ["`validationAction`", "`error` / `warn`", "`error` rejects the write; `warn` logs it but allows it (good for a migration period)"]
        ] },
        { type: "callout", variant: "tip", text: "Roll out validation gradually: start with `validationAction: \"warn\"` to log offenders without breaking writes, fix or migrate the bad documents, then switch to `\"error\"`. Application-level schemas (Mongoose, Zod, Pydantic) are great DX but only protect writes that go through the app — a database validator protects against *every* client and ad-hoc scripts." }
      ]
    },
    {
      id: "app-drivers",
      title: "App level: Node driver & Mongoose ODM",
      level: "core",
      body: [
        { type: "p", text: "In an app you choose between the **raw driver** (thin, fast, gives you exactly MongoDB's API) and an **ODM** like **Mongoose** (schemas, validation, hooks, populate — structure and safety at the cost of a layer). Both are valid; know the tradeoff." },
        { type: "heading", text: "Raw Node driver + pooling" },
        { type: "code", lang: "js", code: "import { MongoClient } from \"mongodb\";\n\n// ONE client for the whole app — it owns a connection pool. Reuse it.\nconst client = new MongoClient(process.env.MONGO_URI, {\n  maxPoolSize: 20,      // tune to your concurrency\n  minPoolSize: 2,\n});\nawait client.connect();\nexport const db = client.db(\"shop\");\n\n// then anywhere:\nawait db.collection(\"orders\").findOne({ status: \"paid\" });" },
        { type: "heading", text: "Mongoose: schemas, models, populate" },
        { type: "code", lang: "js", code: "import mongoose from \"mongoose\";\nawait mongoose.connect(process.env.MONGO_URI);\n\nconst userSchema = new mongoose.Schema({\n  name:  { type: String, required: true },\n  email: { type: String, required: true, unique: true, lowercase: true },\n  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: \"Post\" }],\n}, { timestamps: true });  // adds createdAt / updatedAt\n\n// virtuals: computed, not stored\nuserSchema.virtual(\"displayName\").get(function () { return `@${this.name}`; });\n\n// middleware / hooks: run logic around save/query\nuserSchema.pre(\"save\", function (next) { this.email = this.email.trim(); next(); });\n\nconst User = mongoose.model(\"User\", userSchema);\n\nawait User.create({ name: \"Ada\", email: \"ADA@x.io\" });   // validated + lowercased\n// populate: resolve referenced ids into full docs (a client-side join)\nconst u = await User.findOne({ name: \"Ada\" }).populate(\"posts\");" },
        { type: "list", items: [
          "**Schemas/models** — Mongoose enforces types, required fields, defaults, and validators in your app before writing.",
          "**`populate`** — follows `ref` ids and loads the referenced documents (convenient, but it's N+1-prone: each populate is another query).",
          "**Virtuals** — derived properties not stored in the DB (e.g. `fullName`).",
          "**Middleware/hooks** — `pre`/`post` on `save`, `validate`, `find`, etc., for cross-cutting logic (hashing passwords, audit fields).",
          "**Lean queries** — `.lean()` returns plain objects (no Mongoose document overhead) for read-heavy paths."
        ] },
        { type: "callout", variant: "gotcha", text: "Mongoose is a leaky convenience. `populate` hides N queries behind one call; hooks can silently mutate data; and its schema can drift from what's actually in the collection (Mongoose enforces the schema going forward, not retroactively). It also adds meaningful overhead per document — use `.lean()` on hot read paths. For complex analytics, drop to the aggregation pipeline via `Model.aggregate(...)` rather than fighting the ODM. On a performance-critical or simple service, the **raw driver** is often the better call." }
      ]
    },
    {
      id: "replication-sharding",
      title: "Replication & sharding",
      level: "deep",
      body: [
        { type: "p", text: "MongoDB scales in two independent dimensions: **replication** for high availability + read scaling (copies of the same data), and **sharding** for horizontal write/storage scaling (data split across servers)." },
        { type: "heading", text: "Replica sets" },
        { type: "list", items: [
          "A **replica set** is a group of `mongod` nodes holding the same data: one **primary** (takes all writes) and several **secondaries** that replicate it via the **oplog** (a capped log of operations).",
          "If the primary fails, the secondaries hold an **election** and one is promoted — automatic failover, usually within seconds. An odd number of voting members avoids ties (add an **arbiter** if needed).",
          "Secondaries let you offload reads, but they can be **slightly behind** the primary (replication lag)."
        ] },
        { type: "heading", text: "Read preference / write concern / read concern" },
        { type: "table", headers: ["Knob", "Controls", "Common values"], rows: [
          ["**writeConcern** `w`", "how many nodes must ack a write before it returns", "`majority` (safe, default), `1`, `0` (fire-and-forget)"],
          ["**readPreference**", "which node reads go to", "`primary` (default), `secondaryPreferred`, `nearest`"],
          ["**readConcern**", "what consistency a read guarantees", "`local`, `majority` (no rollback), `snapshot` (in txns), `linearizable`"]
        ] },
        { type: "callout", variant: "warn", text: "Reading from secondaries scales read throughput but trades away consistency: a `secondaryPreferred` read can return **stale** data that lags the primary, and can even go backwards between two reads. Use it for tolerant workloads (analytics, dashboards), not for read-after-write flows. For \"I just wrote it, now read it,\" read from the **primary** or use `w:\"majority\"` + `readConcern:\"majority\"`." },
        { type: "heading", text: "Sharding" },
        { type: "list", items: [
          "**Sharding** partitions a collection across multiple replica sets (**shards**) by a **shard key**. A `mongos` router directs each query to the right shard(s); **config servers** hold the metadata.",
          "Data is split into **chunks** by shard-key range (or hash) and balanced across shards automatically.",
          "Only shard when a single replica set can't hold the data or handle the write throughput — sharding adds real operational complexity."
        ] },
        { type: "callout", variant: "gotcha", text: "**Choosing the shard key is the highest-stakes decision** and is very hard to change later. A good key has **high cardinality**, **even write distribution**, and matches your query filter (so queries are *targeted* to one shard, not *scattered* to all). A **monotonically increasing** key (like a raw timestamp or ObjectId) creates a hot shard — every new write hits the same chunk. Use a **hashed** key or a **compound** key to spread writes. Since 5.0 you can *reshard*, but it's expensive — get it right up front." }
      ]
    },
    {
      id: "realtime",
      title: "Real-time & specialized: change streams, search, time-series",
      level: "deep",
      body: [
        { type: "p", text: "Beyond CRUD, MongoDB ships specialized capabilities that replace whole external systems (a message bus, a search cluster, a vector DB, a time-series store)." },
        { type: "heading", text: "Change streams" },
        { type: "p", text: "**Change streams** let you subscribe to a live feed of inserts/updates/deletes on a collection, database, or the whole deployment — built on the oplog. Use them to invalidate caches, sync denormalized copies, push notifications, or feed a search index, without polling." },
        { type: "code", lang: "js", code: "const stream = db.collection(\"orders\").watch(\n  [{ $match: { operationType: { $in: [\"insert\", \"update\"] } } }],\n  { fullDocument: \"updateLookup\" }   // include the full doc, not just the delta\n);\nfor await (const change of stream) {\n  console.log(change.operationType, change.fullDocument);\n  // resume after a crash with change._id as resumeToken\n}" },
        { type: "heading", text: "Atlas Search & Vector Search" },
        { type: "list", items: [
          "**Atlas Search** embeds Apache Lucene into the database: full-text relevance, fuzzy matching, autocomplete, faceting via the `$search` aggregation stage — no separate Elasticsearch cluster to run or sync.",
          "**Atlas Vector Search** (`$vectorSearch`) stores embeddings and does approximate-nearest-neighbor similarity search — the backbone of RAG / semantic search, keeping your operational data and vectors in one place.",
          "Both are Atlas features (managed); self-hosted uses the older `$text` index for basic keyword search."
        ] },
        { type: "heading", text: "Time-series collections" },
        { type: "code", lang: "js", code: "// purpose-built for metrics/IoT/events — columnar storage, auto-bucketed, compressed\ndb.createCollection(\"readings\", {\n  timeseries: {\n    timeField: \"ts\",          // required: the timestamp field\n    metaField: \"sensorId\",    // the series identifier (indexed)\n    granularity: \"seconds\"    // or minutes / hours\n  },\n  expireAfterSeconds: 2592000  // auto-expire after 30 days\n});" },
        { type: "callout", variant: "tip", text: "**Time-series collections** (since 5.0) store timestamped data far more efficiently than a normal collection (heavy compression, automatic internal bucketing) and speed up time-range aggregations. If you're storing metrics, IoT readings, or logs, use them instead of hand-rolling the bucket pattern — you get its benefits automatically." }
      ]
    },
    {
      id: "performance",
      title: "Performance & operations",
      level: "deep",
      body: [
        { type: "p", text: "MongoDB performance is mostly about **RAM, indexes, and query shape**. The engine (WiredTiger) caches your **working set** — the data + indexes you actively touch — in memory; when that fits in RAM, reads are fast, and when it doesn't, you page from disk and everything slows down." },
        { type: "list", items: [
          "**Keep the working set in RAM** — indexes especially. If index size exceeds RAM, lookups hit disk. Size instances accordingly.",
          "**Connection pooling** — one `MongoClient` per app, tune `maxPoolSize`. Never open a client per request.",
          "**`explain(\"executionStats\")`** — verify `IXSCAN` not `COLLSCAN`, and that `docsExamined ≈ nReturned`.",
          "**Database profiler** — `db.setProfilingLevel(1, { slowms: 100 })` logs slow ops to `system.profile`; inspect them to find what needs an index.",
          "**Projection** — fetch only the fields you need (less network + memory); enables covered queries.",
          "**Range/keyset pagination** over `skip` for deep pages."
        ] },
        { type: "code", lang: "js", code: "// find slow queries with the profiler\ndb.setProfilingLevel(1, { slowms: 100 });      // log ops slower than 100ms\ndb.system.profile.find().sort({ ts: -1 }).limit(5);\n\n// keyset pagination — no giant skip, uses the _id index\ndb.orders.find({ _id: { $gt: lastId } }).sort({ _id: 1 }).limit(20);" },
        { type: "heading", text: "Anti-patterns to avoid" },
        { type: "table", headers: ["Anti-pattern", "Why it hurts", "Do instead"], rows: [
          ["**Unbounded arrays**", "doc grows forever → 16 MB cap, slow updates, rewrites whole doc", "bucket pattern / separate collection / time-series"],
          ["**Massive documents**", "network + memory cost on every read even for one field", "split, use projection, reference large blobs"],
          ["**`$lookup`-heavy pipelines**", "N queries per join; no index = scans", "embed/denormalize; index join fields"],
          ["**Deep `skip` pagination**", "`skip(100000)` walks + discards 100k docs", "keyset pagination (`_id > lastId`)"],
          ["**Unindexed `$regex` / sort**", "collection scan / in-memory sort", "anchored regex + index; index the sort field"],
          ["**Too many indexes**", "every write maintains all of them; RAM pressure", "index for real query patterns; drop unused (`$indexStats`)"]
        ] },
        { type: "callout", variant: "note", text: "Golden workflow for a slow endpoint: reproduce the query, run `explain(\"executionStats\")`, check the plan stage and the examined/returned ratio, add or fix the index (mind ESR), re-run, confirm it's now `IXSCAN` with a tight ratio. The profiler tells you *which* queries to do this for." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The recurring foot-guns that bite MongoDB teams — most are modeling or type issues, not syntax." },
        { type: "heading", text: "1. Schema drift with no validation" },
        { type: "callout", variant: "warn", text: "Flexible schema means a typo (`emial`) or a changed shape silently creates a new field variant, and six months later your collection has five document shapes. **Fix:** add a `$jsonSchema` validator (start with `validationAction:\"warn\"`, then `\"error\"`), and keep an app-level schema (Mongoose/Zod/Pydantic). Flexibility is for iteration speed, not an excuse to skip a contract." },
        { type: "heading", text: "2. Unbounded arrays & the 16 MB limit" },
        { type: "callout", variant: "warn", text: "Embedding an ever-growing list (every message in a chat, every event for a user) eventually hits the 16 MB document cap and makes every update rewrite a huge doc. **Fix:** cap arrays (`$push` with `$slice`), or move the growing side to its own collection, or use the **bucket pattern** / **time-series** collections. Embed *bounded* relationships only." },
        { type: "heading", text: "3. `$lookup` performance" },
        { type: "callout", variant: "gotcha", text: "`$lookup` runs a query per input document; unindexed, it's N scans, and pipelines that join several collections crawl. **Fix:** index the `foreignField`, `$match`/`$limit` **before** the `$lookup`, and prefer **embedding / extended-reference** so common reads need no join at all. Constant joining means you modeled relationally." },
        { type: "heading", text: "4. Stale reads from secondaries" },
        { type: "callout", variant: "gotcha", text: "`readPreference: secondaryPreferred` boosts read throughput but returns data that lags the primary — deadly for read-after-write (\"I saved it but the next screen doesn't show it\"). **Fix:** read from the **primary** for read-your-writes flows, or use `w:\"majority\"` + `readConcern:\"majority\"`; reserve secondary reads for lag-tolerant analytics." },
        { type: "heading", text: "5. ObjectId vs string `_id` mismatch" },
        { type: "callout", variant: "gotcha", text: "`{ _id: \"665f1a...\" }` (string) does **not** match `{ _id: ObjectId(\"665f1a...\") }` — a query that returns nothing for no obvious reason is often this. **Fix:** wrap ids from HTTP/JSON with `new ObjectId(id)` before querying (and handle the `BSONError` when the string isn't a valid 24-hex ObjectId). Pick one `_id` type per collection and be consistent." },
        { type: "heading", text: "6. Non-indexed `$regex` scans" },
        { type: "callout", variant: "warn", text: "An unanchored or case-insensitive regex (`/foo/i`) can't use a normal index and scans the collection. **Fix:** anchor with `^` and match case-sensitively to use an index (`/^foo/`), or use a **text index** / **Atlas Search** for real search. Don't build search on `$regex`." },
        { type: "heading", text: "7. Treating Mongo like SQL" },
        { type: "callout", variant: "note", text: "Porting a normalized relational schema table-for-table and reassembling it with joins fights the engine. **Fix:** model from your **access patterns** — embed what's read together, denormalize deliberately, accept duplication. The document is the unit of work; design so one read serves a screen." },
        { type: "heading", text: "8. Query-object / operator injection" },
        { type: "callout", variant: "warn", text: "Passing untrusted JSON straight into a filter lets an attacker inject operators: `{ password: { \"$ne\": null } }` bypasses an auth check, and `$where`/`$function` can run JS. **Fix:** cast/validate inputs to expected scalar types before building the filter (never let a user supply an object where you expect a string), use a schema validator, and avoid `$where`. Mongoose `sanitizeFilter` / `express-mongo-sanitize` help." },
        { type: "heading", text: "9. Money as floats & date/timezone slips" },
        { type: "callout", variant: "gotcha", text: "A bare `9.99` is a **Double** and can't represent money exactly — sums drift by cents. **Fix:** store currency as **`Decimal128`** (`NumberDecimal(\"9.99\")`) or integer minor units. And **always** store timestamps as real **`Date`** (BSON dates are UTC) — never strings; convert to the user's timezone in the app, and be aware `$dateToString`/aggregation date operators default to UTC unless you pass a `timezone`." }
      ]
    }
  ],

  packages: [
    { name: "mongodb (Node driver)", why: "the official Node.js driver (v6) — thin, fast, exposes MongoDB's API directly; owns the connection pool" },
    { name: "mongosh", why: "the modern MongoDB Shell — a full Node REPL for querying, admin, and scripting (replaces the legacy `mongo` shell)" },
    { name: "pymongo", why: "the official synchronous Python driver — collections behave like dicts of documents" },
    { name: "motor", why: "the official async Python driver (asyncio) — PyMongo's API for FastAPI/async apps" },
    { name: "mongoose", why: "the dominant Node ODM — schemas, validation, hooks/middleware, virtuals, and `populate`" },
    { name: "MongoDB Compass", why: "official GUI — browse data, build/preview aggregation pipelines visually, read explain plans, manage indexes" },
    { name: "mongodump / mongorestore", why: "binary (BSON) backup and restore of databases/collections" },
    { name: "mongoexport / mongoimport", why: "export/import collections as JSON or CSV (data movement, seeding)" },
    { name: "Atlas CLI (atlas)", why: "manage Atlas clusters, users, search indexes, and deploy local Atlas from the terminal" },
    { name: "Prisma (MongoDB connector)", why: "type-safe schema + query builder for MongoDB in TS/Node (an alternative to Mongoose with generated types)" },
    { name: "mongo-express", why: "lightweight web admin UI for a MongoDB instance (handy in Docker/dev)" },
    { name: "mongosh --eval / scripts", why: "run JS files against a cluster for migrations, seeding, and one-off maintenance" },
    { name: "express-mongo-sanitize", why: "strips `$`/`.` operators from user input to prevent query-object injection in Express apps" },
    { name: "bson", why: "encode/decode BSON and construct types (ObjectId, Decimal128, Long) outside the driver" }
  ],

  gotchas: [
    "**16 MB document limit is hard** — unbounded embedded arrays eventually hit it; cap arrays (`$push`+`$slice`), split to another collection, or use the bucket / time-series pattern.",
    "**String `_id` ≠ ObjectId `_id`** — `{_id:\"abc...\"}` won't match an ObjectId; wrap ids from JSON with `new ObjectId(id)` and handle invalid-hex errors.",
    "**`updateOne` needs update operators** — a bare object (`{name:\"x\"}`) is only valid via `replaceOne`; without a `$`-operator you get an error (or replace the whole doc).",
    "**Array conditions match across different elements** — `{\"a.x\":1,\"a.y\":2}` may hit two different elements; use `$elemMatch` when both must hold for the same element.",
    "**`$lookup` is not a cheap join** — it's a per-document query; index the foreign field, join after `$match`, and prefer embedding/denormalization.",
    "**Secondary reads can be stale** — `secondaryPreferred` lags the primary; use primary reads or `w:\"majority\"`+`readConcern:\"majority\"` for read-after-write.",
    "**Money as Double drifts** — use `Decimal128` (`NumberDecimal`) or integer minor units; never a plain float for currency.",
    "**Store dates as BSON `Date` (UTC), not strings** — string dates don't sort/range correctly and aggregation date operators default to UTC unless you pass `timezone`.",
    "**Deep `skip` is O(n)** — `skip(100000)` walks and discards; use keyset pagination (`_id > lastId`).",
    "**Unanchored/case-insensitive `$regex` scans** — only a `^`-anchored, case-sensitive regex uses an index; use text/Atlas Search for real search.",
    "**Query-object injection** — untrusted JSON can inject operators (`{$ne:null}` bypasses auth, `$where` runs JS); validate inputs to scalar types and sanitize.",
    "**Transactions need a replica set** — they don't run on a standalone `mongod`; start a single-node replica set locally for txns/change streams.",
    "**Schema drift is silent** — a mistyped field just creates a new one; enforce a `$jsonSchema` validator (warn → error) plus an app-level schema.",
    "**Shard key is (almost) permanent and monotonic keys create a hot shard** — pick high-cardinality, evenly-distributed keys (hashed/compound); resharding is expensive.",
    "**One `MongoClient` per app** — it pools connections; creating one per request exhausts connections and kills latency.",
    "**Mongoose `populate` is N+1-prone and adds overhead** — use `.lean()` on hot reads and the aggregation pipeline for complex joins/analytics."
  ],

  flashcards: [
    { q: "Collection, document, field — the relational analogy?", a: "Collection ≈ table, document ≈ row, field ≈ column — but a field can itself be an embedded object or an array. Documents are BSON (binary JSON) with a unique `_id`." },
    { q: "What is an ObjectId?", a: "The default `_id`: a 12-byte value (4-byte timestamp + 5 random + 3-byte counter) that's unique, compact, and roughly time-sortable. `_id` can be any type, though — string, int, or a compound doc." },
    { q: "Why Decimal128 for money?", a: "A bare number is a BSON Double (float) and can't represent decimals like 0.10 exactly, so sums drift. `NumberDecimal(\"9.99\")` (Decimal128) is exact. Or store integer minor units." },
    { q: "What's the 16 MB limit and its design implication?", a: "Every document caps at 16 MB. It's a signal against unbounded embedded arrays — model growing lists as a separate collection, the bucket pattern, or time-series collections." },
    { q: "`$elemMatch` — what problem does it solve?", a: "For an array of objects, plain dotted conditions can match across different elements. `$elemMatch` requires a **single** element to satisfy all the conditions together." },
    { q: "`$`, `$[]`, `$[<id>]` array update operators?", a: "`$` updates the first element matched by the filter; `$[]` updates every element; `$[name]` updates elements matching a named `arrayFilters` condition. Prefer `$[name]` for precise multi-element updates." },
    { q: "What is the aggregation pipeline?", a: "An ordered array of stages (`$match`,`$group`,`$lookup`,`$project`,`$unwind`,…) where documents flow through and each stage transforms the stream — MongoDB's replacement for GROUP BY, joins, and window functions." },
    { q: "Why put `$match` first in a pipeline?", a: "Only the first `$match`/`$sort` (before any transforming stage) can use a collection index, and filtering early shrinks the stream before expensive stages like `$group`/`$lookup`." },
    { q: "What is the ESR rule for compound indexes?", a: "Order compound index fields Equality, Sort, Range: equality-matched fields first, then the sort field, then range fields. Wrong order forces an in-memory sort." },
    { q: "What is a covered query?", a: "A query answered entirely from the index — every filtered/projected field is in the index and `_id` is handled — so MongoDB never reads the documents (`docsExamined: 0`). The fastest read." },
    { q: "Embed vs reference — how to decide?", a: "Embed data read together, owned by the parent, and bounded in size (atomic single-doc reads/writes). Reference large, unbounded, shared, or independently-queried data. Model to access patterns." },
    { q: "When do you actually need a transaction?", a: "When one logical operation must consistently modify **multiple documents** (e.g. a transfer). A single-document write is already atomic, so good embedding removes most needs. Requires a replica set." },
    { q: "How do write concern and read preference trade off?", a: "`writeConcern w:majority` = durable write acked by a majority. `readPreference secondary` = higher read throughput but possibly stale data. For read-after-write, read from primary / majority." },
    { q: "What makes a good shard key?", a: "High cardinality, even write distribution, and alignment with query filters (targeted, not scattered). Avoid monotonic keys (hot shard) — use hashed or compound. It's very hard to change later." },
    { q: "What are change streams for?", a: "Subscribing to a live feed of inserts/updates/deletes (built on the oplog) to invalidate caches, sync denormalized copies, or push events — without polling. Resumable via a resume token." },
    { q: "Raw driver vs Mongoose — the tradeoff?", a: "Raw driver: thin, fast, MongoDB's exact API. Mongoose: schemas, validation, hooks, `populate`, virtuals — structure and DX, but overhead, N+1-prone populate, and schema can drift. Use `.lean()` and aggregation for hot/complex paths." },
    { q: "Why does a valid-looking query return nothing?", a: "Common cause: `_id` type mismatch — a string `_id` doesn't equal an ObjectId. Wrap incoming ids with `new ObjectId(id)`. Also check field-name typos (flexible schema won't warn)." },
    { q: "How do you diagnose a slow query?", a: "`explain(\"executionStats\")`: want `IXSCAN` not `COLLSCAN`, and `docsExamined ≈ nReturned`. Use the profiler (`setProfilingLevel`) to find which queries need indexes." }
  ],

  cheatsheet: [
    { label: "Connect (mongosh, Atlas)", code: "mongosh \"mongodb+srv://u:p@cluster0.x.mongodb.net/db\"" },
    { label: "Insert", code: "db.c.insertOne({a:1}); db.c.insertMany([{a:1},{a:2}])" },
    { label: "Find + operators", code: "db.c.find({age:{$gte:18,$lt:65}, role:{$in:[\"a\"]}})" },
    { label: "Projection + sort + page", code: "db.c.find({}, {name:1,_id:0}).sort({age:-1}).limit(10)" },
    { label: "Update fields", code: "db.c.updateOne({_id:id},{$set:{x:1},$inc:{n:1}})" },
    { label: "Upsert", code: "db.c.updateOne({_id:k},{$inc:{n:1}},{upsert:true})" },
    { label: "Array push (capped)", code: "$push:{a:{$each:[v],$slice:-10,$sort:-1}}" },
    { label: "Atomic claim", code: "db.c.findOneAndUpdate(f,u,{returnDocument:\"after\"})" },
    { label: "$elemMatch (array of objs)", code: "db.c.find({items:{$elemMatch:{qty:{$gt:5},price:{$lt:10}}}})" },
    { label: "arrayFilters update", code: "updateOne(f,{$set:{\"a.$[e].on\":1}},{arrayFilters:[{\"e.p\":{$lt:20}}]})" },
    { label: "Aggregate group", code: "db.c.aggregate([{$match:{s:\"paid\"}},{$group:{_id:\"$cid\",t:{$sum:\"$total\"}}}])" },
    { label: "$lookup (join)", code: "{$lookup:{from:\"c2\",localField:\"_id\",foreignField:\"cid\",as:\"x\"}}" },
    { label: "Create index (ESR)", code: "db.c.createIndex({status:1,createdAt:-1,amount:1})" },
    { label: "Unique / TTL index", code: "createIndex({email:1},{unique:true}); createIndex({at:1},{expireAfterSeconds:3600})" },
    { label: "Explain", code: "db.c.find(q).explain(\"executionStats\")" },
    { label: "Transaction", code: "await session.withTransaction(async()=>{ ...ops({session}) })" },
    { label: "Schema validation", code: "db.runCommand({collMod:\"c\",validator:{$jsonSchema:{...}}})" },
    { label: "Change stream", code: "for await (const c of db.c.watch()) { ... }" },
    { label: "Profiler (slow ops)", code: "db.setProfilingLevel(1,{slowms:100})" },
    { label: "Keyset pagination", code: "db.c.find({_id:{$gt:lastId}}).sort({_id:1}).limit(20)" }
  ]
});
