(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "solana-ts",
  name: "Solana Clients (TypeScript)",
  language: "TypeScript · Solana",
  tagline: "Building **apps/clients** that talk to Solana and its on-chain programs — plus **integration tests** — with the two SDKs: legacy `@solana/web3.js` v1 and the new `@solana/kit`.",
  color: "#3178c6",
  readMinutes: 24,
  group: "Solana",
  navLabel: "TypeScript",

  sections: [
    {
      id: "overview",
      title: "Overview & the two SDKs",
      level: "core",
      body: [
        { type: "p", text: "TypeScript is **the** client language for Solana: wallets, dApps, indexers, bots and the canonical program **integration tests** are all written in TS. This file is about the *client* side — talking to the chain and to on-chain programs (the sibling **Anchor** file covers writing the programs themselves). Programs are stateless; all state lives in **accounts**, and every instruction must be handed each account it touches up front — the client's job is to assemble those accounts, sign, send and read the results back." },
        { type: "p", text: "There are **two** JavaScript SDKs and you must know which one a codebase uses:" },
        { type: "table", headers: ["SDK", "Style", "Status"], rows: [
          ["`@solana/web3.js` **v1**", "class-based, batteries-included (`Connection`, `PublicKey`, `Keypair`, `Transaction`)", "legacy but **ubiquitous** — most tutorials, wallets and Anchor's own examples still use it"],
          ["`@solana/kit` (**web3.js 2.0**)", "functional, tree-shakable, composable `pipe(...)`; typed opaque `Address`/`Blockhash`", "**GA Dec 16 2024**, repo `anza-xyz/kit` — the future-facing choice"]
        ] },
        { type: "list", items: [
          "**`@solana/kit`** (formerly *web3.js 2.0*) is a ground-up rewrite: no classes, immutable data, native `bigint` (no more `BN`), zero-dependency, tree-shakable so bundles shrink to what you use. The old v2 package name `@solana/web3.js@2` is deprecated in favour of `@solana/kit`.",
          "**`@solana/web3-compat`** bridges the two — convert a v1 `Keypair`/`PublicKey`/`Transaction` to/from kit types so you can migrate incrementally.",
          "**Anchor's TS client** (`@anchor-lang/core`) and **Codama** sit on top: they generate typed, per-program clients so you call instructions by name instead of hand-building them."
        ] },
        { type: "callout", variant: "note", text: "**Which to pick?** New app, care about bundle size, want `bigint` and modern ergonomics → **`@solana/kit`**. Working in an existing codebase, following older docs, or using a library that expects v1 objects → **`@solana/web3.js` v1**. Both are actively maintained; the compat layer lets them coexist." }
      ]
    },
    {
      id: "setup",
      title: "Install & setup",
      level: "core",
      body: [
        { type: "p", text: "Pick one SDK as your base. `@solana/spl-token` and `@anchor-lang/core` currently build on the **v1** types (v1 is the common denominator today), so most real projects still install web3.js v1 even alongside kit." },
        { type: "code", lang: "bash", code: "# --- Legacy v1 base (most common today) ---\nnpm i @solana/web3.js @solana/spl-token\n\n# --- New Kit base ---\nnpm i @solana/kit\nnpm i @solana/web3-compat        # bridge kit <-> v1 objects when a lib needs v1\n\n# --- Anchor client (reads a program's IDL) ---\nnpm i @anchor-lang/core          # Anchor 1.0 (was @coral-xyz/anchor)\n\n# --- Codama: generate a typed kit client from an IDL ---\nnpm i -D codama @codama/nodes-from-anchor @codama/renderers-js\n\n# --- Test stack ---\nnpm i -D mocha chai ts-mocha typescript\nnpm i -D litesvm                 # fast in-process VM (replaces solana-bankrun)" },
        { type: "callout", variant: "warn", text: "Pin the SDK version and **be explicit about which SDK** every file uses. The single biggest source of confusion is mixing v1 and kit APIs in one file — a v1 `PublicKey` is not a kit `Address` (a branded `string`), and a v1 `number`/`BN` amount is not a kit `bigint`." }
      ]
    },
    {
      id: "connection",
      title: "Connection / RPC & commitment",
      level: "core",
      body: [
        { type: "p", text: "Everything starts with an RPC endpoint. v1 wraps it in a stateful `Connection` object; kit gives you a plain function-call client from `createSolanaRpc`." },
        { type: "code", lang: "typescript", code: "// --- v1 ---\nimport { Connection, clusterApiUrl } from \"@solana/web3.js\";\nconst conn = new Connection(clusterApiUrl(\"devnet\"), \"confirmed\");\n// or an explicit URL: new Connection(\"https://api.devnet.solana.com\", \"confirmed\")\nconst slot = await conn.getSlot();\n\n// --- kit ---\nimport { createSolanaRpc } from \"@solana/kit\";\nconst rpc = createSolanaRpc(\"https://api.devnet.solana.com\");\nconst { value: slot2 } = await rpc.getSlot().send();  // every call ends in .send()" },
        { type: "p", text: "**Commitment** picks how finalized the data you read (or wait for) must be — a latency vs. certainty trade-off:" },
        { type: "table", headers: ["Commitment", "Meaning"], rows: [
          ["`processed`", "the node has processed the block; may still be dropped — fastest, least safe"],
          ["`confirmed`", "voted on by a supermajority; the sensible **default** for most apps"],
          ["`finalized`", "rooted, effectively irreversible — use before treating money as settled"]
        ] },
        { type: "callout", variant: "tip", text: "The **public** `api.mainnet-beta.solana.com` endpoint is rate-limited and not for production. Use a paid RPC provider (Helius, Triton, QuickNode, Alchemy) and keep the key server-side. In kit each request is a discrete `rpc.method(...).send()` — easy to batch and mock in tests." }
      ]
    },
    {
      id: "keypairs",
      title: "Keypairs & wallets",
      level: "core",
      body: [
        { type: "p", text: "A keypair is an Ed25519 pair; its public key **is** the account address. Backend scripts/tests hold a `Keypair` directly; browser dApps never see the secret and instead delegate signing to a **wallet adapter**." },
        { type: "code", lang: "typescript", code: "// --- v1: generate, or load the CLI wallet (~/.config/solana/id.json) ---\nimport { Keypair } from \"@solana/web3.js\";\nimport fs from \"fs\";\n\nconst kp = Keypair.generate();\nconsole.log(kp.publicKey.toBase58());\n\nconst secret = JSON.parse(fs.readFileSync(process.env.HOME + \"/.config/solana/id.json\", \"utf8\"));\nconst payer = Keypair.fromSecretKey(Uint8Array.from(secret));  // 64-byte array\n\n// --- kit: a CryptoKeyPair-based signer ---\nimport { generateKeyPairSigner, createKeyPairSignerFromBytes } from \"@solana/kit\";\nconst signer = await generateKeyPairSigner();\nconst loaded = await createKeyPairSignerFromBytes(Uint8Array.from(secret));" },
        { type: "heading", text: "Browser wallets (@solana/wallet-adapter)" },
        { type: "p", text: "In the browser you don't handle secret keys. `@solana/wallet-adapter` provides React context/hooks and a modal that connect to Phantom, Solflare, Backpack, etc.; the wallet signs and returns the signature. The `useWallet()` hook exposes `publicKey`, `signTransaction` and `sendTransaction`." },
        { type: "code", lang: "typescript", code: "// React (v1 wallet-adapter)\nimport { useWallet, useConnection } from \"@solana/wallet-adapter-react\";\n\nfunction PayButton() {\n  const { connection } = useConnection();\n  const { publicKey, sendTransaction } = useWallet();\n\n  async function pay(tx) {\n    if (!publicKey) return;                 // not connected\n    const sig = await sendTransaction(tx, connection);  // wallet signs + sends\n    await connection.confirmTransaction(sig, \"confirmed\");\n  }\n}" },
        { type: "callout", variant: "gotcha", text: "A v1 secret key is the **64-byte** array (secret + public) that `solana-keygen` writes as a JSON array. Don't confuse it with the 32-byte seed, and never commit or log it. Base58 phantom-style secrets need `bs58.decode(...)` first." }
      ]
    },
    {
      id: "reading",
      title: "Reading accounts",
      level: "core",
      body: [
        { type: "p", text: "Reading is how a client gets state: fetch an account's raw bytes and deserialize, or query many accounts of a program by filter. Account data is an opaque `Buffer`/`Uint8Array` — you decode it with the program's layout (Borsh, or via Anchor/Codama types)." },
        { type: "code", lang: "typescript", code: "// --- v1 ---\nimport { PublicKey, LAMPORTS_PER_SOL } from \"@solana/web3.js\";\n\nconst bal = await conn.getBalance(payer.publicKey);      // lamports (number)\nconsole.log(bal / LAMPORTS_PER_SOL, \"SOL\");\n\nconst info = await conn.getAccountInfo(new PublicKey(addr));\nif (info) console.log(info.owner.toBase58(), info.data.length);\n\n// all accounts owned by a program, filtered by size + a memcmp on bytes\nconst accts = await conn.getProgramAccounts(programId, {\n  filters: [\n    { dataSize: 165 },                                   // e.g. SPL token account size\n    { memcmp: { offset: 32, bytes: owner.toBase58() } }, // field at byte offset 32 == owner\n  ],\n});", },
        { type: "code", lang: "typescript", code: "// --- kit (note: address() brands a string, values arrive as bigint) ---\nimport { address, lamports } from \"@solana/kit\";\n\nconst { value: balance } = await rpc.getBalance(address(addr)).send();  // bigint lamports\nconst { value: acct } = await rpc.getAccountInfo(address(addr), { encoding: \"base64\" }).send();\nconst progAccts = await rpc.getProgramAccounts(programId, {\n  filters: [{ dataSize: 165n }, { memcmp: { offset: 32n, bytes: ownerBase58, encoding: \"base58\" } }],\n}).send();" },
        { type: "callout", variant: "warn", text: "`getProgramAccounts` scans **all** of a program's accounts — it is heavy and many public RPCs restrict or slow it. Always narrow with `dataSize` + `memcmp` filters, and for large/hot datasets prefer an indexer (Helius DAS, a Geyser plugin) over repeated `getProgramAccounts`." }
      ]
    },
    {
      id: "transactions",
      title: "Building & sending transactions",
      level: "core",
      body: [
        { type: "p", text: "A transaction is a set of **instructions** + a fee payer + a recent **blockhash**, signed by the required signers. v1 mutates a `Transaction` object; kit builds an immutable message through a `pipe(...)` of transforms." },
        { type: "code", lang: "typescript", code: "// --- v1: transfer SOL, sign, send, confirm ---\nimport {\n  Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL,\n} from \"@solana/web3.js\";\n\nconst tx = new Transaction().add(\n  SystemProgram.transfer({\n    fromPubkey: payer.publicKey,\n    toPubkey: recipient,\n    lamports: 0.1 * LAMPORTS_PER_SOL,\n  })\n);\nconst sig = await sendAndConfirmTransaction(conn, tx, [payer]);  // sets blockhash, signs, confirms" },
        { type: "code", lang: "typescript", code: "// --- kit: functional pipeline ---\nimport {\n  pipe, createTransactionMessage, setTransactionMessageFeePayerSigner,\n  setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstruction,\n  signTransactionMessageWithSigners, getSignatureFromTransaction,\n  sendAndConfirmTransactionFactory,\n} from \"@solana/kit\";\n\nconst { value: latestBlockhash } = await rpc.getLatestBlockhash().send();\nconst message = pipe(\n  createTransactionMessage({ version: 0 }),\n  m => setTransactionMessageFeePayerSigner(signer, m),\n  m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),\n  m => appendTransactionMessageInstruction(transferIx, m),\n);\nconst signedTx = await signTransactionMessageWithSigners(message);\n\nconst sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });\nawait sendAndConfirm(signedTx, { commitment: \"confirmed\" });\nconsole.log(getSignatureFromTransaction(signedTx));" },
        { type: "heading", text: "Versioned transactions & Address Lookup Tables" },
        { type: "p", text: "A transaction is capped at ~**1232 bytes** and each account address costs 32 bytes, so complex DeFi transactions run out of room. **Versioned (v0) transactions** can reference an **Address Lookup Table (ALT)** — an on-chain account of addresses — so accounts cost ~1 byte (an index) instead of 32. Kit builds v0 by default (`version: 0`); v1 uses `VersionedTransaction` + `TransactionMessage.compileToV0Message([...lookupTables])`." },
        { type: "callout", variant: "tip", text: "For reliable landing on mainnet, add a **priority fee** (`ComputeBudgetProgram.setComputeUnitPrice`) and set a realistic compute-unit limit (`setComputeUnitLimit`) from a simulation. During congestion, transactions without priority fees are frequently dropped." }
      ]
    },
    {
      id: "pdas",
      title: "PDAs from the client",
      level: "core",
      body: [
        { type: "p", text: "A **Program Derived Address** is derived deterministically from `seeds + programId` and lies *off* the Ed25519 curve (no private key). Clients recompute PDAs to know where a program stored state, and to pass the right account into an instruction. Seeds must be encoded **exactly** as the program expects (byte order matters)." },
        { type: "code", lang: "typescript", code: "// --- v1 (synchronous) ---\nimport { PublicKey } from \"@solana/web3.js\";\nconst [vault, bump] = PublicKey.findProgramAddressSync(\n  [Buffer.from(\"vault\"), owner.toBuffer()],   // seeds: literal string + a pubkey\n  programId,\n);\n\n// --- kit (async) ---\nimport { getProgramDerivedAddress, getAddressEncoder } from \"@solana/kit\";\nconst [vault2, bump2] = await getProgramDerivedAddress({\n  programAddress: programId,\n  seeds: [new TextEncoder().encode(\"vault\"), getAddressEncoder().encode(owner)],\n});" },
        { type: "callout", variant: "gotcha", text: "Numeric seeds must match the program's byte encoding. A Rust `u64` seed is usually `&id.to_le_bytes()` — **little-endian, 8 bytes**. In TS build the exact same bytes (e.g. an 8-byte LE buffer), not `Buffer.from(String(id))`, or you'll derive a different address and get an `AccountNotInitialized`/seed-mismatch error." }
      ]
    },
    {
      id: "spl-tokens",
      title: "SPL tokens (@solana/spl-token)",
      level: "core",
      body: [
        { type: "p", text: "Tokens on Solana are managed by the **SPL Token** program. A **Mint** account defines a token (supply, decimals, authorities); each holder has a token account, canonically an **Associated Token Account (ATA)** derived from `(owner, mint)`. `@solana/spl-token` gives high-level helpers." },
        { type: "code", lang: "typescript", code: "import {\n  createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer,\n} from \"@solana/spl-token\";\n\n// 1. create a mint with 6 decimals, payer as mint authority\nconst mint = await createMint(conn, payer, payer.publicKey, null, 6);\n\n// 2. get (or create) the payer's ATA for this mint\nconst fromAta = await getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey);\n\n// 3. mint 1000.000000 tokens into it (amount is in base units!)\nawait mintTo(conn, payer, mint, fromAta.address, payer, 1_000_000_000n);\n\n// 4. transfer to another owner's ATA\nconst toAta = await getOrCreateAssociatedTokenAccount(conn, payer, mint, recipient);\nawait transfer(conn, payer, fromAta.address, toAta.address, payer, 500_000_000n);" },
        { type: "callout", variant: "gotcha", text: "Token amounts are **integers in the smallest unit**, scaled by the mint's `decimals`. With 6 decimals, `1_000_000` = 1.0 token. Never do UI math in floats — compute in base units (`bigint`) and format only for display. Also mind **Token-2022** (`TOKEN_2022_PROGRAM_ID`): its accounts live under a different program, so pass the right `programId` to the helpers." }
      ]
    },
    {
      id: "anchor-client",
      title: "The Anchor client (@anchor-lang/core)",
      level: "core",
      body: [
        { type: "p", text: "This is the primary \"framework that helps you write clients\". Anchor's `anchor build` emits an **IDL** (JSON describing every instruction, account, type and error) plus TS types. The `@anchor-lang/core` client loads that IDL so you call instructions **by name** with full type-safety — no hand-built instructions or manual (de)serialization." },
        { type: "code", lang: "typescript", code: "import * as anchor from \"@anchor-lang/core\";\nimport { Program, AnchorProvider, BN } from \"@anchor-lang/core\";\nimport idl from \"../target/idl/my_program.json\";\nimport type { MyProgram } from \"../target/types/my_program\";\n\n// provider = connection + wallet (env() reads ANCHOR_PROVIDER_URL + ANCHOR_WALLET)\nconst provider = AnchorProvider.env();\nanchor.setProvider(provider);\nconst program = new Program<MyProgram>(idl as MyProgram, provider);\n\n// derive the same PDA the program uses\nconst [vault] = anchor.web3.PublicKey.findProgramAddressSync(\n  [Buffer.from(\"vault\"), provider.wallet.publicKey.toBuffer()],\n  program.programId,\n);\n\n// call an instruction: .methods.<name>(args).accounts({...}).rpc()\nawait program.methods\n  .deposit(new BN(1000))\n  .accounts({ vault, user: provider.wallet.publicKey })\n  .rpc();\n\n// read + auto-deserialize account state via the IDL\nconst state = await program.account.vault.fetch(vault);\nconsole.log(state.amount.toString());   // amount is a BN" },
        { type: "callout", variant: "tip", text: "Rust snake_case fields become **camelCase** in TS (`system_program` → `systemProgram`, `new_account` → `newAccount`). Anchor `u64`/`i64`/`u128` map to **`BN`**, not JS `number` — build args with `new BN(x)` and read with `.toString()`/`.toNumber()`. With IDL resolution on, Anchor auto-fills PDAs and known programs so you can omit many `.accounts({...})` entries." }
      ]
    },
    {
      id: "codama",
      title: "Codama — typed kit clients from an IDL",
      level: "deep",
      body: [
        { type: "p", text: "**Codama** (the successor to Kinobi) turns a program's IDL into a **typed, tree-shakable `@solana/kit` client**: one generated function per instruction, plus account decoders and PDA helpers. Where `@anchor-lang/core` is a runtime IDL reader tied to v1 types, Codama **generates source code** you commit, producing kit-native (`bigint`, `Address`) clients with no runtime IDL dependency. It's the idiomatic way to consume a program from a kit codebase." },
        { type: "code", lang: "typescript", code: "// codama.ts — generate a JS/TS client from an Anchor IDL\nimport { createFromRoot } from \"codama\";\nimport { rootNodeFromAnchor } from \"@codama/nodes-from-anchor\";\nimport { renderJavaScriptVisitor } from \"@codama/renderers-js\";\nimport anchorIdl from \"./target/idl/my_program.json\";\n\nconst codama = createFromRoot(rootNodeFromAnchor(anchorIdl));\ncodama.accept(renderJavaScriptVisitor(\"./clients/js/src/generated\"));" },
        { type: "code", lang: "typescript", code: "// using the generated kit client\nimport { getDepositInstruction, fetchVault } from \"./clients/js/src/generated\";\n\nconst depositIx = getDepositInstruction({\n  vault,\n  user: signer,          // a kit TransactionSigner\n  amount: 1000n,         // native bigint, no BN\n});\n// append depositIx to a kit transaction message (see \"Building & sending\")\n\nconst account = await fetchVault(rpc, vault);   // typed, decoded account\nconsole.log(account.data.amount);               // bigint" },
        { type: "callout", variant: "note", text: "Codama can ingest an Anchor IDL (`@codama/nodes-from-anchor`) or a standalone Codama IDL, and render **JS**, **Rust** or **umi** clients. Regenerate whenever the program's IDL changes — the generated folder is derived output, so treat it like build artifacts (regenerate, don't hand-edit)." },
        { type: "link", url: "https://github.com/codama-idl/codama", text: "Codama — IDL-driven client generators for Solana" }
      ]
    },
    {
      id: "subscriptions",
      title: "Subscriptions / websockets",
      level: "core",
      body: [
        { type: "p", text: "Instead of polling, subscribe over a websocket to get pushed updates when an account, program or log changes. v1 exposes `onAccountChange`/`onLogs`/`onProgramAccountChange` on `Connection`; kit has a separate **RPC-subscriptions** client returning an async iterable." },
        { type: "code", lang: "typescript", code: "// --- v1 ---\nconst subId = conn.onAccountChange(vault, (acctInfo, ctx) => {\n  console.log(\"vault changed at slot\", ctx.slot, acctInfo.data.length);\n}, \"confirmed\");\n// later: await conn.removeAccountChangeListener(subId);\n\nconn.onLogs(programId, (logs) => console.log(logs.signature, logs.logs), \"confirmed\");\nconn.onProgramAccountChange(programId, (info) => console.log(info.accountId.toBase58()));", },
        { type: "code", lang: "typescript", code: "// --- kit: separate subscriptions client ---\nimport { createSolanaRpcSubscriptions } from \"@solana/kit\";\nconst rpcSubscriptions = createSolanaRpcSubscriptions(\"wss://api.devnet.solana.com\");\n\nconst abortController = new AbortController();\nconst notifications = await rpcSubscriptions\n  .accountNotifications(vault, { commitment: \"confirmed\" })\n  .subscribe({ abortSignal: abortController.signal });\n\nfor await (const notification of notifications) {\n  console.log(\"vault updated\", notification.value);\n}\n// later: abortController.abort();" },
        { type: "callout", variant: "warn", text: "Websocket subscriptions drop silently on reconnect and count against provider limits. Always keep the subscription id / `AbortController` and clean up; add reconnect logic for long-lived services, and don't rely on a subscription for guaranteed delivery — reconcile with a periodic `getAccountInfo`." }
      ]
    },
    {
      id: "testing",
      title: "Integration testing (Mocha + Chai, LiteSVM)",
      level: "core",
      body: [
        { type: "p", text: "The **canonical** Solana integration test is a **Mocha + Chai** suite run by `anchor test`: it builds the program, boots a local validator (or the Anchor 1.0 default in-process backend), deploys, then runs your TS `describe`/`it` blocks against the real runtime through the Anchor client. The pattern: get a provider from the environment, call instructions, then **assert on fetched on-chain state** and on **expected errors**." },
        { type: "code", lang: "typescript", code: "import * as anchor from \"@anchor-lang/core\";\nimport { Program, BN } from \"@anchor-lang/core\";\nimport { assert } from \"chai\";\nimport type { MyProgram } from \"../target/types/my_program\";\n\ndescribe(\"my_program\", () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.MyProgram as Program<MyProgram>;\n\n  const [vault] = anchor.web3.PublicKey.findProgramAddressSync(\n    [Buffer.from(\"vault\"), provider.wallet.publicKey.toBuffer()],\n    program.programId,\n  );\n\n  it(\"initializes and deposits\", async () => {\n    await program.methods.initialize().accounts({ vault }).rpc();\n    await program.methods.deposit(new BN(500)).accounts({ vault }).rpc();\n\n    const state = await program.account.vault.fetch(vault);   // read chain state\n    assert.equal(state.amount.toNumber(), 500);               // assert on it\n  });\n\n  it(\"rejects a zero deposit\", async () => {\n    try {\n      await program.methods.deposit(new BN(0)).accounts({ vault }).rpc();\n      assert.fail(\"expected the deposit to throw\");\n    } catch (e) {\n      assert.equal(e.error.errorCode.number, 6000);           // custom Anchor error\n      assert.include(e.error.errorMessage, \"greater than zero\");\n    }\n  });\n});" },
        { type: "heading", text: "LiteSVM — fast, in-process, no validator" },
        { type: "p", text: "`anchor test` is thorough but slow (it deploys over RPC every run). **LiteSVM** runs a real Solana VM **in-process** inside your JS test — load the compiled `.so`, airdrop, send transactions, read accounts — with no validator to boot, so suites run in milliseconds. It's ideal for tight unit-style feedback on program behaviour." },
        { type: "code", lang: "typescript", code: "import { LiteSVM } from \"litesvm\";\nimport { Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from \"@solana/web3.js\";\n\nconst svm = new LiteSVM();\nsvm.addProgramFromFile(programId, \"target/deploy/my_program.so\");\n\nconst payer = new Keypair();\nsvm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));\n\nconst tx = new Transaction().add(/* your instruction */);\ntx.recentBlockhash = svm.latestBlockhash();\ntx.feePayer = payer.publicKey;\ntx.sign(payer);\nsvm.sendTransaction(tx);\n\nconst acct = svm.getAccount(vault);          // read raw account back\n// decode acct.data with the program's layout / Anchor coder, then assert" },
        { type: "callout", variant: "gotcha", text: "**`solana-bankrun` is deprecated** — use **LiteSVM** (its `litesvm` TS bindings) for in-process testing. If you find `solana-bankrun`/`anchor-bankrun` in a project, it's the older approach built on the now-superseded BanksClient; migrate to LiteSVM." }
      ]
    },
    {
      id: "errors",
      title: "Error handling",
      level: "core",
      body: [
        { type: "p", text: "When an instruction fails, the RPC returns an error carrying the program's **logs**. Anchor custom errors start at code **6000** (below that are Anchor/runtime built-ins) and the Anchor client parses them into `e.error` with a code, name and message." },
        { type: "code", lang: "typescript", code: "try {\n  await program.methods.deposit(new BN(0)).accounts({ vault }).rpc();\n} catch (e) {\n  // AnchorError shape\n  if (e.error) {\n    console.log(e.error.errorCode.code);    // \"ZeroAmount\"\n    console.log(e.error.errorCode.number);  // 6000\n    console.log(e.error.errorMessage);      // \"Amount must be greater than zero\"\n  }\n}\n\n// raw v1: SendTransactionError exposes the logs\nimport { SendTransactionError } from \"@solana/web3.js\";\ntry {\n  await sendAndConfirmTransaction(conn, tx, [payer]);\n} catch (e) {\n  if (e instanceof SendTransactionError) {\n    console.log(await e.getLogs(conn));     // full program log lines\n  }\n}" },
        { type: "callout", variant: "tip", text: "Before sending, `simulateTransaction` (v1) / `rpc.simulateTransaction(...).send()` (kit) runs the tx on the RPC node and returns the **logs** and compute units used **without paying fees** — the fastest way to see *why* something will fail and to size a compute-unit limit. Anchor error code = `6000 + variant index` in your `#[error_code]` enum." }
      ]
    },
    {
      id: "compat",
      title: "Bridging v1 and kit (@solana/web3-compat)",
      level: "deep",
      body: [
        { type: "p", text: "Migration is rarely all-at-once: `@solana/spl-token` and `@anchor-lang/core` still speak v1 types while your new code uses kit. `@solana/web3-compat` converts between the two so both coexist." },
        { type: "code", lang: "typescript", code: "import { fromLegacyKeypair, fromLegacyPublicKey } from \"@solana/web3-compat\";\nimport { Keypair, PublicKey } from \"@solana/web3.js\";\n\nconst legacyKp = Keypair.generate();\nconst kitSigner = await fromLegacyKeypair(legacyKp);   // v1 Keypair -> kit signer\n\nconst legacyPk = new PublicKey(\"So11111111111111111111111111111111111111112\");\nconst kitAddress = fromLegacyPublicKey(legacyPk);      // v1 PublicKey -> kit Address (string)" },
        { type: "callout", variant: "note", text: "Kit's `Address` is a **branded string** (base58), not an object — `kitAddress.toBase58()` doesn't exist; it *is* the base58 string. Amounts are `bigint`, not `number`/`BN`. The compat layer is the seam where these representation differences get reconciled, so keep conversions at module boundaries, not scattered through logic." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "Most client bugs aren't in the program — they're representation and timing mismatches between your TS and the chain. The recurring offenders:" },
        { type: "heading", text: "1. v1 vs kit confusion & version pinning" },
        { type: "callout", variant: "warn", text: "Mixing `@solana/web3.js` v1 and `@solana/kit` APIs in one file is the top time-sink: a kit `Address` is a string, a v1 `PublicKey` is an object; kit amounts are `bigint`, v1/Anchor are `number`/`BN`. Decide the base SDK per module, convert only at boundaries via `@solana/web3-compat`, and **pin exact versions** in package.json." },
        { type: "heading", text: "2. BN / bigint & u64" },
        { type: "p", text: "A Rust `u64`/`u128` can exceed JS's safe integer range (2^53). The Anchor client uses **`BN`** for those; kit/Codama use native **`bigint`**. Never round-trip a `u64` through a JS `number`." },
        { type: "code", lang: "typescript", code: "// Anchor: build with BN, read with .toString() (NOT .toNumber() for large values)\nawait program.methods.deposit(new BN(\"18446744073709551615\")).accounts({ vault }).rpc();\nconst s = (await program.account.vault.fetch(vault)).amount.toString();\n\n// kit/Codama: native bigint literal\nconst ix = getDepositInstruction({ vault, user: signer, amount: 1000n });" },
        { type: "heading", text: "3. Blockhash expiry & confirmation" },
        { type: "list", items: [
          "A recent blockhash is valid for only ~**150 blocks (~60–90s)**. Build → sign → send **promptly**; a slow user or a paused debugger yields `TransactionExpiredBlockheightExceededError`. Fetch the blockhash just before sending, and use `sendAndConfirmTransaction`/`sendAndConfirmTransactionFactory` which handle confirmation for you.",
          "Confirm with the commitment your next read needs. Reading with `processed` right after a `confirmed` send can return **stale** data.",
        ] },
        { type: "heading", text: "4. Stale reads, airdrops & rate limits" },
        { type: "callout", variant: "gotcha", text: "After a tx confirms, an immediate `getAccountInfo` at a **lower** commitment may still return the pre-tx state. Read at the **same or higher** commitment you confirmed at (or re-`fetch` after `confirmed`). Anchor `account.fetch` throws if the account doesn't exist yet — guard with `fetchNullable`." },
        { type: "list", items: [
          "**Airdrops** (`requestAirdrop`) are tightly rate-limited on devnet and don't exist on mainnet. In tests use LiteSVM's `svm.airdrop(...)` (no limits) or a pre-funded keypair; on devnet, retry with backoff or use the web faucet.",
          "**RPC rate limits:** the public endpoints throttle aggressively (429s). Use a paid provider, batch requests, cache, and add retry/backoff — especially for `getProgramAccounts` and log/history queries.",
          "**camelCase vs snake_case:** the IDL is snake_case (Rust) but the TS client exposes **camelCase** — `newAccount` in TS, `new_account` on chain. Account/arg names must match the IDL casing or the client throws.",
          "**PDA seed encoding:** derive seeds byte-for-byte as the program does (e.g. `u64` → 8-byte little-endian), or you get a different address and an `AccountNotInitialized`/seeds-constraint error.",
        ] }
      ]
    }
  ],

  packages: [
    { name: "@solana/web3.js", why: "legacy v1 SDK: Connection, PublicKey, Keypair, Transaction — still the most widely used" },
    { name: "@solana/kit", why: "web3.js 2.0 rewrite (repo anza-xyz/kit): functional, tree-shakable, bigint-native RPC client" },
    { name: "@solana/web3-compat", why: "bridge kit <-> v1 objects (Keypair/PublicKey/Transaction) for incremental migration" },
    { name: "@solana/spl-token", why: "mints, ATAs (getOrCreateAssociatedTokenAccount), mintTo, transfer; Token + Token-2022" },
    { name: "@anchor-lang/core", why: "Anchor 1.0 TS client (was @coral-xyz/anchor): reads the IDL, calls instructions, fetches accounts" },
    { name: "@solana/wallet-adapter-react", why: "browser wallet connect/sign (Phantom, Solflare, Backpack) via React hooks + modal" },
    { name: "codama", why: "generate typed kit/Rust clients from an IDL (successor to Kinobi)" },
    { name: "@codama/nodes-from-anchor", why: "feed an Anchor IDL into Codama's code generators" },
    { name: "@codama/renderers-js", why: "render a JavaScript/TypeScript kit client from a Codama tree" },
    { name: "litesvm", why: "fast in-process Solana VM for TS integration tests (replaces the deprecated solana-bankrun)" },
    { name: "mocha", why: "the test runner behind the canonical `anchor test` TS suite" },
    { name: "chai", why: "assertion library (assert/expect) paired with Mocha" },
    { name: "ts-mocha", why: "run Mocha specs written in TypeScript without a separate build step" },
    { name: "bn.js", why: "big-integer type Anchor uses for u64/i64/u128 args and fields (BN)" },
    { name: "bs58", why: "base58 encode/decode secret keys and addresses (e.g. Phantom-exported keys)" }
  ],

  gotchas: [
    "Mixing **`@solana/web3.js` v1** and **`@solana/kit`** APIs in one file — a kit `Address` is a branded string, a v1 `PublicKey` is an object; kit amounts are `bigint`, v1/Anchor use `number`/`BN`. Pick a base SDK per module and convert at boundaries with `@solana/web3-compat`.",
    "Treating a `u64` as a JS `number` — values above 2^53 lose precision. Use Anchor's **`BN`** or kit's native **`bigint`**, and read large values with `.toString()`, never `.toNumber()`.",
    "Stale blockhash: a recent blockhash is valid ~**150 blocks (~60–90s)**. Fetch it just before sending; a slow path yields `TransactionExpiredBlockheightExceededError`.",
    "Reading state **too soon / at too low a commitment** after a tx — read at the same or higher commitment you confirmed at, or you get pre-tx data.",
    "**PDA seed encoding** mismatch — a Rust `u64` seed is `to_le_bytes()` (8 bytes, little-endian), not `Buffer.from(String(id))`. Wrong bytes → wrong address → `AccountNotInitialized`.",
    "SPL token amounts are **integers in base units** scaled by the mint's `decimals` (6 decimals: 1_000_000 = 1.0). Never do token math in floats.",
    "Forgetting Token-2022: its accounts live under `TOKEN_2022_PROGRAM_ID`, so pass the right `programId` to `@solana/spl-token` helpers or they target the classic Token program.",
    "**camelCase vs snake_case:** the IDL is snake_case but the TS client is camelCase (`newAccount` vs `new_account`). Account/arg names must match the client's casing.",
    "`getProgramAccounts` without filters scans the whole program and is throttled by public RPCs — always add `dataSize` + `memcmp`, or use an indexer.",
    "**Airdrop rate limits:** `requestAirdrop` is throttled on devnet and absent on mainnet. Use LiteSVM's `svm.airdrop` in tests or a pre-funded keypair.",
    "Using the public `api.mainnet-beta.solana.com` in production — it's rate-limited (429s). Use a paid RPC (Helius/Triton/QuickNode) with retry/backoff.",
    "`program.account.x.fetch` **throws** if the account doesn't exist — use `fetchNullable` when it may be absent, e.g. before first init.",
    "Websocket subscriptions drop silently on reconnect and count against limits — keep the sub id / `AbortController`, clean up, and reconcile with a periodic read.",
    "Anchor custom error codes start at **6000** (`6000 + variant index`); codes below are Anchor/runtime built-ins. Assert on `e.error.errorCode.number` / `errorMessage`.",
    "Using the deprecated **`solana-bankrun`** for in-process tests — migrate to **LiteSVM** (`litesvm`).",
    "Not adding a **priority fee** on mainnet during congestion — transactions without `setComputeUnitPrice` frequently get dropped."
  ],

  flashcards: [
    { q: "What are the two Solana JS SDKs and how do they differ?", a: "**`@solana/web3.js` v1** — class-based, batteries-included, ubiquitous but legacy. **`@solana/kit`** (formerly web3.js 2.0, GA Dec 16 2024, repo anza-xyz/kit) — functional, tree-shakable, `bigint`-native. `@solana/web3-compat` bridges them." },
    { q: "How do you create an RPC client in each SDK?", a: "v1: `new Connection(url, \"confirmed\")` (stateful object). kit: `createSolanaRpc(url)`, then each call is `rpc.method(...).send()`." },
    { q: "What do the commitment levels mean?", a: "`processed` (seen, may be dropped — fastest), `confirmed` (supermajority voted — the usual default), `finalized` (rooted, irreversible — before treating money as settled)." },
    { q: "How do you derive a PDA from the client in v1 vs kit?", a: "v1: `PublicKey.findProgramAddressSync(seeds, programId)` (sync). kit: `await getProgramDerivedAddress({ programAddress, seeds })` (async). Both return `[address, bump]`." },
    { q: "Why must PDA seeds be byte-exact, and what's the classic mistake?", a: "The address is a hash of the seed bytes + program id. A Rust `u64` seed is 8-byte little-endian (`to_le_bytes()`); encoding it as a decimal string in TS derives a different address and fails the seeds check." },
    { q: "How does the Anchor TS client call an instruction and read an account?", a: "`program.methods.x(args).accounts({...}).rpc()` to send; `program.account.x.fetch(addr)` to read + auto-deserialize via the IDL. `u64` fields come back as `BN`." },
    { q: "What is an IDL and who consumes it?", a: "A JSON description of a program's instructions, accounts, types and errors, emitted by `anchor build`. `@anchor-lang/core` reads it at runtime; **Codama** generates source-code clients from it." },
    { q: "What does Codama do?", a: "Generates a typed, tree-shakable `@solana/kit` (or Rust) client from an IDL — one function per instruction plus account decoders/PDA helpers — using native `bigint` and `Address`. Successor to Kinobi." },
    { q: "How is a transaction built and sent in kit?", a: "`pipe(createTransactionMessage({version:0}), setFeePayerSigner, setLifetimeUsingBlockhash, appendInstruction)`, then `signTransactionMessageWithSigners`, then a `sendAndConfirmTransactionFactory({rpc, rpcSubscriptions})`." },
    { q: "Why use versioned transactions + Address Lookup Tables?", a: "Transactions are capped ~1232 bytes and each address costs 32 bytes. A v0 transaction can reference an on-chain ALT so addresses cost ~1 byte (an index), fitting many more accounts." },
    { q: "How do you create a mint and move SPL tokens?", a: "`createMint(conn, payer, authority, null, decimals)`, `getOrCreateAssociatedTokenAccount(conn, payer, mint, owner)` for each side's ATA, then `mintTo`/`transfer` — amounts in base units (bigint)." },
    { q: "What is the canonical Solana integration test, and what does it assert?", a: "A **Mocha + Chai** suite run by `anchor test`: get a provider from env, call instructions via the Anchor client, then assert on **fetched on-chain state** and on **expected errors** (e.g. `e.error.errorCode.number === 6000`)." },
    { q: "What is LiteSVM and what does it replace?", a: "A real Solana VM running **in-process** in your JS test (`new LiteSVM()`, `addProgramFromFile`, `airdrop`, `sendTransaction`, `getAccount`) — no validator to boot, millisecond runs. It replaces the deprecated `solana-bankrun`." },
    { q: "How do you parse an Anchor error on the client?", a: "Catch it and read `e.error.errorCode.code` (name), `e.error.errorCode.number` (6000+), `e.error.errorMessage`. For raw failures use `SendTransactionError.getLogs(conn)`; `simulateTransaction` shows logs before paying." },
    { q: "How does BN differ from bigint across the SDKs?", a: "`@anchor-lang/core` uses **`BN`** (bn.js) for `u64`/`i64`/`u128`; `@solana/kit` and Codama use native **`bigint`** (`1000n`). Both avoid the 2^53 `number` precision cliff — never round-trip a `u64` through `number`." },
    { q: "What browser wallet library is standard, and how does signing work?", a: "`@solana/wallet-adapter` (React hooks + modal for Phantom/Solflare/Backpack). The dApp never sees the secret key; `useWallet()` gives `publicKey`, `signTransaction`, `sendTransaction` and the wallet signs." }
  ],

  cheatsheet: [
    { label: "RPC (v1)", code: "const conn = new Connection(url, \"confirmed\")" },
    { label: "RPC (kit)", code: "const rpc = createSolanaRpc(url); await rpc.getSlot().send()" },
    { label: "Keypair (v1)", code: "Keypair.fromSecretKey(Uint8Array.from(secret))" },
    { label: "Balance (v1)", code: "await conn.getBalance(pubkey)  // lamports" },
    { label: "PDA (v1)", code: "PublicKey.findProgramAddressSync([Buffer.from(\"vault\"), o.toBuffer()], pid)" },
    { label: "PDA (kit)", code: "await getProgramDerivedAddress({ programAddress: pid, seeds })" },
    { label: "Send (v1)", code: "await sendAndConfirmTransaction(conn, tx, [payer])" },
    { label: "ATA", code: "await getOrCreateAssociatedTokenAccount(conn, payer, mint, owner)" },
    { label: "Token transfer", code: "await transfer(conn, payer, fromAta, toAta, owner, 500_000_000n)" },
    { label: "Anchor call", code: "program.methods.deposit(new BN(x)).accounts({vault}).rpc()" },
    { label: "Anchor read", code: "await program.account.vault.fetch(vault)" },
    { label: "u64 arg (kit)", code: "getDepositInstruction({ vault, user: signer, amount: 1000n })" },
    { label: "Subscribe (v1)", code: "conn.onAccountChange(pubkey, cb, \"confirmed\")" },
    { label: "LiteSVM test", code: "const svm = new LiteSVM(); svm.addProgramFromFile(pid, \"...so\")" },
    { label: "Simulate", code: "await conn.simulateTransaction(tx)  // logs + CUs, no fee" },
    { label: "Codama gen", code: "createFromRoot(rootNodeFromAnchor(idl)).accept(renderJavaScriptVisitor(dir))" }
  ]
});
