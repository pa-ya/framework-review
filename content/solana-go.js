(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "solana-go",
  name: "Solana with Go",
  language: "Go · Solana",
  tagline: "Go is a **first-class Solana client language** — you can't write on-chain programs in Go, but `solana-go` gives you RPC, transactions, keypairs and WebSocket subscriptions for bots, indexers and backends.",
  color: "#00ADD8",
  readMinutes: 16,
  group: "Solana",
  navLabel: "Go",

  sections: [
    {
      id: "overview",
      title: "Overview & reality check",
      level: "core",
      body: [
        { type: "p", text: "First, the honest part: **you cannot write on-chain Solana programs in Go.** Solana programs compile to **SBF** (Solana Bytecode Format, an eBPF variant), and there is **no SBF Go backend** — no `go build` target, no runtime support. On-chain code is written in **Rust** (usually with **Anchor** — see the sibling section) or **C**. If someone asks you to \"write a Solana smart contract in Go,\" the answer is: you don't." },
        { type: "p", text: "What Go *is* excellent at is the other half of every Solana system: the **client / backend integration** layer. Go talks to on-chain programs over **JSON-RPC** and **WebSocket**, exactly like the TypeScript or Rust clients do. This section is \"the Go client story done well.\"" },
        { type: "list", items: [
          "**Reach for Go when:** you're building a **trading bot**, an **indexer**, a **backend API** that reads/writes chain state, a **keeper/cron** that submits transactions, or any service where Go's concurrency, single-binary deploys and ops story win.",
          "**Mental model:** the program (Rust/Anchor/C) is deployed on-chain; your Go service is a *client* that builds instructions, signs transactions, sends them via RPC, and reads accounts back.",
          "**The account model is language-agnostic.** Programs are stateless; all state lives in **accounts**. Reading state = fetching an account and deserializing its bytes. Writing state = sending a transaction whose instructions the program executes. Go does exactly this over the wire."
        ] },
        { type: "callout", variant: "note", text: "The de-facto Go SDK is **`github.com/gagliardetto/solana-go`** (also mirrored under `solana-foundation/solana-go`). It bundles the RPC client, WebSocket client, transaction/instruction builders, Borsh-style binary (de)serialization, and helpers for the System, SPL Token and Associated-Token programs." },
        { type: "callout", variant: "warn", text: "The SDK is powerful but its API is **not fully stable** (pre-1.0 in spirit) — expect occasional breaking changes across versions, and pin your dependency. Treat the on-chain program's IDL, not the Go types, as the source of truth for byte layouts." }
      ]
    },
    {
      id: "setup",
      title: "Setup & modules",
      level: "core",
      body: [
        { type: "p", text: "Go modules only — no special Solana toolchain is needed on the client side (you're not compiling on-chain code). You do still want the **Solana CLI** around for `solana-test-validator`, airdrops and keypair generation during development." },
        { type: "code", lang: "bash", code: "# new module\nmkdir sol-bot && cd sol-bot\ngo mod init example.com/sol-bot\n\n# the de-facto Go SDK (RPC + ws + tx builders + Borsh)\ngo get github.com/gagliardetto/solana-go\n\n# commonly paired sub-packages come with it, e.g.:\n#   github.com/gagliardetto/solana-go/rpc\n#   github.com/gagliardetto/solana-go/rpc/ws\n#   github.com/gagliardetto/solana-go/programs/system\n#   github.com/gagliardetto/solana-go/programs/token\n\n# binary (de)serialization helper used by the SDK:\ngo get github.com/gagliardetto/binary" },
        { type: "callout", variant: "tip", text: "The module is mirrored at `github.com/solana-foundation/solana-go`; `gagliardetto/solana-go` remains the canonical import path most code and examples use. Pin it in `go.mod` (e.g. `require github.com/gagliardetto/solana-go v1.x.y`) so an upstream break doesn't surprise a `go get -u`." },
        { type: "heading", text: "A local validator to develop against" },
        { type: "code", lang: "bash", code: "# install the Solana CLI (Anza) if you don't have it\nsh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\"\n\n# run a throwaway local chain (resets each start)\nsolana-test-validator\n\n# point the CLI at it, make a keypair, fund it\nsolana config set --url localhost\nsolana-keygen new -o dev.json\nsolana airdrop 2 $(solana address -k dev.json)" }
      ]
    },
    {
      id: "rpc",
      title: "RPC client & connection",
      level: "core",
      body: [
        { type: "p", text: "Everything starts with an `*rpc.Client`. The `rpc` package ships constants for the public clusters; for production you almost always want a **dedicated RPC provider** (Helius, Triton, QuickNode, …) because the public endpoints are heavily rate-limited." },
        { type: "code", lang: "go", code: "package main\n\nimport (\n    \"context\"\n    \"fmt\"\n\n    \"github.com/gagliardetto/solana-go\"\n    \"github.com/gagliardetto/solana-go/rpc\"\n)\n\nfunc main() {\n    // rpc.DevNet_RPC / rpc.MainNetBeta_RPC / rpc.TestNet_RPC / rpc.LocalNet_RPC\n    client := rpc.New(rpc.DevNet_RPC)\n    ctx := context.Background()\n\n    pk := solana.MustPublicKeyFromBase58(\"So11111111111111111111111111111111111111112\")\n\n    // GetBalance returns lamports, wrapped with the slot context\n    bal, err := client.GetBalance(ctx, pk, rpc.CommitmentFinalized)\n    if err != nil {\n        panic(err)\n    }\n    fmt.Printf(\"%d lamports (%.9f SOL)\\n\",\n        bal.Value, float64(bal.Value)/float64(solana.LAMPORTS_PER_SOL))\n}" },
        { type: "heading", text: "Commitment levels" },
        { type: "p", text: "Every read/confirm takes a **commitment** that trades freshness for finality. Pick deliberately: use `processed` for lowest-latency reads you can tolerate being rolled back, `confirmed` for most app logic, and `finalized` when money must not un-happen." },
        { type: "table", headers: ["Commitment", "Meaning"], rows: [
          ["`rpc.CommitmentProcessed`", "The node's most recent block — fastest, but may be skipped/rolled back."],
          ["`rpc.CommitmentConfirmed`", "Voted on by a supermajority; the practical default for app reads."],
          ["`rpc.CommitmentFinalized`", "Rooted / irreversible — safest, highest latency."]
        ] },
        { type: "callout", variant: "tip", text: "`GetAccountInfo(ctx, pubkey)` fetches raw account bytes + owner + lamports; use `GetAccountInfoWithOpts` to pass a commitment, a `DataSlice`, or an encoding. A `nil` `resp.Value` means the account **does not exist** — check it before dereferencing." }
      ]
    },
    {
      id: "keys",
      title: "Keys & wallets",
      level: "core",
      body: [
        { type: "p", text: "A wallet is an Ed25519 keypair. `solana.NewWallet()` makes a fresh one; in a real service you load an existing keypair from a file (the Solana CLI's JSON byte-array format) or from a Base58 secret. The **public key** is the on-chain address; the **private key** signs transactions — never log or commit it." },
        { type: "code", lang: "go", code: "import (\n    \"github.com/gagliardetto/solana-go\"\n)\n\n// 1. brand-new random wallet\nw := solana.NewWallet()\nfmt.Println(\"pubkey:\", w.PublicKey())\n\n// 2. load the CLI keypair file (~/.config/solana/id.json or dev.json)\npriv, err := solana.PrivateKeyFromSolanaKeygenFile(\"dev.json\")\nif err != nil {\n    panic(err)\n}\nfmt.Println(\"loaded:\", priv.PublicKey())\n\n// 3. from a Base58-encoded secret key (e.g. exported from a wallet)\npriv2, err := solana.PrivateKeyFromBase58(\"4wBqpZM9k7c...restOfBase58Secret\")\nif err != nil {\n    panic(err)\n}\n_ = priv2" },
        { type: "callout", variant: "warn", text: "The CLI JSON file is a raw 64-byte array — the full **secret** key, not encrypted. Load it from a mounted secret / KMS in production, never bake it into the image or a config repo. Anyone with those bytes controls the funds." },
        { type: "callout", variant: "note", text: "`solana.PublicKey` is a fixed 32-byte value type (comparable, usable as a map key). Parse untrusted input with `solana.PublicKeyFromBase58` (returns an error) rather than `MustPublicKeyFromBase58` (panics) — reserve the `Must...` variants for hard-coded constants." }
      ]
    },
    {
      id: "reading",
      title: "Reading accounts & deserialization",
      level: "core",
      body: [
        { type: "p", text: "To read program state you fetch the account's raw bytes and **decode them into a Go struct** with the same layout the program wrote. The SDK's binary package (`github.com/gagliardetto/binary`, imported as `bin`) does **Borsh** decoding, which is what Anchor and most Rust programs use." },
        { type: "p", text: "Remember the **8-byte Anchor discriminator**: Anchor accounts start with an 8-byte type tag before the real fields. Either model it as a leading `[8]byte` field or skip it before decoding your struct." },
        { type: "code", lang: "go", code: "import (\n    \"context\"\n\n    \"github.com/gagliardetto/solana-go\"\n    \"github.com/gagliardetto/solana-go/rpc\"\n    bin \"github.com/gagliardetto/binary\"\n)\n\n// Mirror the on-chain account layout. Field ORDER and TYPES must match exactly.\ntype Vault struct {\n    Discriminator [8]byte    // Anchor's 8-byte tag (or strip it before decoding)\n    Authority     solana.PublicKey\n    Amount        uint64\n    Bump          uint8\n}\n\nfunc readVault(ctx context.Context, c *rpc.Client, addr solana.PublicKey) (*Vault, error) {\n    resp, err := c.GetAccountInfo(ctx, addr)\n    if err != nil {\n        return nil, err\n    }\n    if resp.Value == nil {\n        return nil, fmt.Errorf(\"account %s does not exist\", addr)\n    }\n\n    var v Vault\n    // Borsh decode straight from the account's data bytes\n    err = bin.NewBorshDecoder(resp.Value.Data.GetBinary()).Decode(&v)\n    return &v, err\n}" },
        { type: "callout", variant: "gotcha", text: "The struct layout must match the program **byte-for-byte** — same field order, same integer widths, same handling of the discriminator and any `Option`/enum tags. A single wrong type silently shifts every field after it and you decode garbage. If the program has an IDL, prefer generating the types (see the anchor-go section) over hand-writing them." }
      ]
    },
    {
      id: "transactions",
      title: "Building & sending transactions",
      level: "core",
      body: [
        { type: "p", text: "Writing state means: build one or more **instructions**, wrap them in a `solana.Transaction` with a **recent blockhash**, **sign** it with the required keypairs, then send and confirm. The SDK provides typed instruction builders for the common programs — here, a SOL transfer via the System program." },
        { type: "code", lang: "go", code: "import (\n    \"context\"\n\n    \"github.com/gagliardetto/solana-go\"\n    \"github.com/gagliardetto/solana-go/programs/system\"\n    \"github.com/gagliardetto/solana-go/rpc\"\n    confirm \"github.com/gagliardetto/solana-go/rpc/sendandconfirmtransaction\"\n    \"github.com/gagliardetto/solana-go/rpc/ws\"\n)\n\nfunc transferSOL(ctx context.Context, c *rpc.Client, wsc *ws.Client,\n    from solana.PrivateKey, to solana.PublicKey, lamports uint64) (solana.Signature, error) {\n\n    // 1. a fresh blockhash (transactions expire ~150 slots / ~60-90s after it)\n    recent, err := c.GetLatestBlockhash(ctx, rpc.CommitmentFinalized)\n    if err != nil {\n        return solana.Signature{}, err\n    }\n\n    // 2. build the instruction(s) with a typed builder\n    ix := system.NewTransferInstruction(lamports, from.PublicKey(), to).Build()\n\n    // 3. assemble the transaction\n    tx, err := solana.NewTransaction(\n        []solana.Instruction{ix},\n        recent.Value.Blockhash,\n        solana.TransactionPayer(from.PublicKey()),\n    )\n    if err != nil {\n        return solana.Signature{}, err\n    }\n\n    // 4. sign with every required key\n    _, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {\n        if key.Equals(from.PublicKey()) {\n            return &from\n        }\n        return nil\n    })\n    if err != nil {\n        return solana.Signature{}, err\n    }\n\n    // 5. send + wait for confirmation (needs a ws client to watch the signature)\n    return confirm.SendAndConfirmTransaction(ctx, c, wsc, tx)\n}" },
        { type: "callout", variant: "note", text: "`sendandconfirmtransaction.SendAndConfirmTransaction` submits the transaction **and** subscribes over WebSocket for its confirmation, so it needs both an `*rpc.Client` and a `*ws.Client`. If you only want fire-and-forget, `client.SendTransaction(ctx, tx)` returns the signature immediately without waiting." },
        { type: "callout", variant: "tip", text: "To call an **arbitrary program** (no prebuilt helper), construct a `solana.NewInstruction(programID, accounts, data)` where `data` is the Borsh-encoded arg bytes (Anchor: 8-byte instruction discriminator + args) and `accounts` is the ordered `AccountMetaSlice` with the right signer/writable flags. The anchor-go generator builds these for you." }
      ]
    },
    {
      id: "pdas",
      title: "PDAs in Go",
      level: "core",
      body: [
        { type: "p", text: "A **Program Derived Address** is a deterministic address off the Ed25519 curve, derived from seeds + a program id. Your Go client must derive the *same* PDA the program uses so it can pass the right account. Use `solana.FindProgramAddress`, which returns the address and the **canonical bump**." },
        { type: "code", lang: "go", code: "import \"github.com/gagliardetto/solana-go\"\n\n// program: seeds = [b\"vault\", authority]\nfunc vaultPDA(programID, authority solana.PublicKey) (solana.PublicKey, uint8, error) {\n    return solana.FindProgramAddress(\n        [][]byte{\n            []byte(\"vault\"),\n            authority.Bytes(),\n        },\n        programID,\n    )\n}\n\n// If you already know the bump and want an exact (non-searching) derive:\n//   addr, err := solana.CreateProgramAddress(seedsIncludingBump, programID)" },
        { type: "callout", variant: "gotcha", text: "Seeds must match the program's derivation **exactly**: same byte strings, same order, same encoding of numeric seeds (a Rust `u64` seed is 8 little-endian bytes, e.g. `binary.LittleEndian.PutUint64`). One mismatched seed yields a different address and the transaction fails a `seeds`/constraint check on-chain." }
      ]
    },
    {
      id: "spl-token",
      title: "SPL tokens",
      level: "core",
      body: [
        { type: "p", text: "SPL tokens (fungible tokens and NFTs) live in the **Token program**; each holder's balance is an **Associated Token Account (ATA)** derived from `(owner, mint)`. The SDK ships `programs/token` builders and an ATA helper." },
        { type: "code", lang: "go", code: "import (\n    \"github.com/gagliardetto/solana-go\"\n    \"github.com/gagliardetto/solana-go/programs/token\"\n    ata \"github.com/gagliardetto/solana-go/programs/associated-token-account\"\n)\n\n// derive the ATA address for (owner, mint)\nataAddr, _, err := solana.FindAssociatedTokenAddress(owner, mint)\n\n// instruction to create it if missing (payer funds the rent)\ncreateIx := ata.NewCreateInstruction(payer, owner, mint).Build()\n\n// transfer_checked verifies decimals — prefer it over the bare transfer\nxferIx := token.NewTransferCheckedInstruction(\n    amount,       // raw base units (not UI amount)\n    decimals,     // the mint's decimals\n    sourceATA,\n    mint,\n    destATA,\n    ownerAuthority,\n    nil,          // multisig signers, usually nil\n).Build()" },
        { type: "callout", variant: "tip", text: "Token amounts are always in **base units** (an integer scaled by the mint's `decimals`), never a float — 1.5 of a 6-decimal token is `1_500_000`. Read balances with `client.GetTokenAccountBalance`, which returns both the raw `Amount` and a `UiAmount`. Prefer `TransferChecked` (it verifies decimals) over the legacy unchecked `Transfer`." },
        { type: "callout", variant: "note", text: "For **Token-2022** mints, the program id and some account layouts differ from the classic Token program — pass the correct program id and use the Token-2022 helpers rather than assuming the original Token program." }
      ]
    },
    {
      id: "subscriptions",
      title: "Subscriptions (WebSocket)",
      level: "core",
      body: [
        { type: "p", text: "For real-time reactions — a bot watching an account, an indexer tailing a program's activity — use the **WebSocket** client (`rpc/ws`). You `ws.Connect`, then subscribe to account changes, program-account changes, or transaction logs, and pull events off the subscription in a loop." },
        { type: "code", lang: "go", code: "import (\n    \"context\"\n\n    \"github.com/gagliardetto/solana-go\"\n    \"github.com/gagliardetto/solana-go/rpc\"\n    \"github.com/gagliardetto/solana-go/rpc/ws\"\n)\n\nfunc watchAccount(ctx context.Context, addr solana.PublicKey) error {\n    wsc, err := ws.Connect(ctx, rpc.DevNet_WS) // wss:// endpoint\n    if err != nil {\n        return err\n    }\n    defer wsc.Close()\n\n    sub, err := wsc.AccountSubscribe(addr, rpc.CommitmentConfirmed)\n    if err != nil {\n        return err\n    }\n    defer sub.Unsubscribe()\n\n    for {\n        got, err := sub.Recv(ctx) // blocks until the next update\n        if err != nil {\n            return err // connection dropped -> caller should reconnect\n        }\n        data := got.Value.Data.GetBinary()\n        // ... Borsh-decode `data` into your struct and react\n        _ = data\n    }\n}" },
        { type: "callout", variant: "tip", text: "Other subscriptions: `LogsSubscribe` (filter by mentioned account — great for tailing a program's events), `ProgramSubscribe` (every account owned by a program), and `SignatureSubscribe` (fires once when a specific tx confirms — this is what `SendAndConfirmTransaction` uses internally)." },
        { type: "callout", variant: "warn", text: "WebSocket connections **drop** — providers reset idle or long-lived sockets. Wrap subscriptions in a reconnect loop (re-`Connect`, re-subscribe, and re-fetch current state via RPC to cover the gap), and respect `ctx` cancellation for clean shutdown. Missing this is the #1 reason a Go indexer silently stops receiving events." }
      ]
    },
    {
      id: "anchor-go",
      title: "anchor-go — generate a Go client from an IDL",
      level: "deep",
      body: [
        { type: "p", text: "Hand-writing instruction builders and account structs is exactly the error-prone work the discriminator/layout gotchas punish. If the on-chain program is built with **Anchor**, it ships an **IDL** (a JSON description of every instruction, account, type and error). **`anchor-go`** consumes that IDL and generates a **typed Go client**: instruction builder functions, account structs with correct Borsh layouts and discriminators, and decoders. This is the Go equivalent of Anchor's TypeScript client — the \"framework that helps you write clients.\"" },
        { type: "code", lang: "bash", code: "# install the generator\ngo install github.com/gagliardetto/anchor-go@latest\n\n# get the program's IDL (from the repo, or fetch on-chain):\n#   anchor idl fetch <PROGRAM_ID> -o my_program.json\n#   (or copy target/idl/my_program.json from the Anchor project)\n\n# generate a Go package from the IDL\nanchor-go --src=my_program.json --pkg=myprogram --dst=./generated/myprogram" },
        { type: "p", text: "The generated package gives you typed builders — no manual byte packing, no discriminator bugs. A generated call looks like the Rust/TS clients: name the instruction, set the args, wire the accounts, `.Build()`." },
        { type: "code", lang: "go", code: "import (\n    \"github.com/gagliardetto/solana-go\"\n    myprogram \"example.com/sol-bot/generated/myprogram\"\n)\n\n// typed instruction builder generated from the IDL\nix, err := myprogram.NewDepositInstruction(\n    // args (correctly typed & Borsh-encoded for you):\n    uint64(1000),\n    // accounts (names/roles come straight from the IDL):\n    vaultPDA,\n    userPubkey,\n    solana.SystemProgramID,\n).ValidateAndBuild()\nif err != nil {\n    panic(err)\n}\n// ...then drop `ix` into solana.NewTransaction(...) as usual\n\n// generated account decoders too:\n// v, err := myprogram.ParseAccount_Vault(dataBytes)  // handles the discriminator\n" },
        { type: "callout", variant: "good", text: "This is the recommended workflow for any non-trivial Anchor program: regenerate the Go client whenever the program's IDL changes, and you get compile-time safety that your Go service and the on-chain program agree on layouts. It eliminates the entire class of \"hand-written struct drifted from the program\" bugs." },
        { type: "callout", variant: "note", text: "`anchor-go` only helps for programs that expose an Anchor IDL. For a native-Rust or C program with no IDL, you're back to hand-writing instruction data and account structs from the program's source — model each field against the on-chain layout carefully and cover it with round-trip tests." },
        { type: "link", url: "https://github.com/gagliardetto/anchor-go", text: "anchor-go — generate a Go client from an Anchor IDL" },
        { type: "link", url: "https://github.com/gagliardetto/solana-go", text: "gagliardetto/solana-go — the Go SDK (RPC, ws, tx builders, Borsh)" }
      ]
    },
    {
      id: "testing",
      title: "Testing Go clients",
      level: "core",
      body: [
        { type: "p", text: "Client tests use Go's standard `testing` package. The key constraint: **there is no in-process SVM for Go** (nothing like Rust's LiteSVM or Mollusk). You test against a **real validator** — either a local `solana-test-validator` or a devnet endpoint — so client tests are integration tests, not unit tests." },
        { type: "list", items: [
          "**Pure logic** (PDA derivation, amount math, Borsh encode/decode round-trips) needs no network — test it with plain `go test`, fast and deterministic.",
          "**Anything that sends a transaction or reads live state** needs a validator. Spin up `solana-test-validator` (locally or in CI), airdrop a funded keypair, and point the RPC client at `http://127.0.0.1:8899`.",
          "Use **table-driven tests** + `t.Run(name, ...)` subtests for the many-similar-cases style Go favors."
        ] },
        { type: "code", lang: "go", code: "package client\n\nimport (\n    \"context\"\n    \"testing\"\n\n    \"github.com/gagliardetto/solana-go\"\n    \"github.com/gagliardetto/solana-go/rpc\"\n)\n\n// Pure, offline: PDA derivation is deterministic -> no validator needed.\nfunc TestVaultPDA(t *testing.T) {\n    programID := solana.MustPublicKeyFromBase58(\"Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS\")\n\n    cases := []struct {\n        name string\n        auth solana.PublicKey\n    }{\n        {\"alice\", solana.NewWallet().PublicKey()},\n        {\"bob\", solana.NewWallet().PublicKey()},\n    }\n    for _, tc := range cases {\n        t.Run(tc.name, func(t *testing.T) {\n            addr, bump, err := vaultPDA(programID, tc.auth)\n            if err != nil {\n                t.Fatalf(\"derive: %v\", err)\n            }\n            if addr.IsZero() || bump == 0 {\n                t.Fatalf(\"bad PDA: %s bump=%d\", addr, bump)\n            }\n        })\n    }\n}\n\n// Integration: needs a running solana-test-validator on :8899.\nfunc TestGetBalance_Local(t *testing.T) {\n    if testing.Short() {\n        t.Skip(\"skipping validator integration test in -short mode\")\n    }\n    c := rpc.New(\"http://127.0.0.1:8899\")\n    _, err := c.GetLatestBlockhash(context.Background(), rpc.CommitmentConfirmed)\n    if err != nil {\n        t.Fatalf(\"no local validator? %v\", err)\n    }\n}" },
        { type: "callout", variant: "tip", text: "Gate slow validator tests behind `testing.Short()` (`t.Skip` when `-short`) or a build tag, so `go test -short ./...` stays fast for the offline logic tests and CI can run the full suite against a validator separately." },
        { type: "callout", variant: "gotcha", text: "Because you test against a live validator, tests are subject to real timing: airdrops and confirmations are async. After an airdrop, poll `GetBalance` (or confirm the airdrop signature) before spending — don't assume funds are available on the next line, or you'll get flaky `insufficient funds` failures." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The frictions that eat a Go-on-Solana developer's time cluster around three themes: the SDK's youth, byte-layout exactness, and the async/uncertain nature of the chain itself." },
        { type: "heading", text: "1. SDK stability & data handling" },
        { type: "list", items: [
          "**Alpha-ish API:** `solana-go` predates a stable 1.0 in spirit — signatures and package paths shift between versions. **Pin the exact version** in `go.mod` and read the changelog before bumping.",
          "**Borsh layout must match the program exactly.** Wrong integer width, forgotten discriminator, or mis-modeled `Option`/enum tag → every subsequent field decodes as garbage, usually with no error. Generate types via **anchor-go** when an IDL exists; otherwise round-trip-test your structs.",
          "**u64 / big numbers:** Solana amounts are `u64` (and some values `u128`). Go's `uint64` holds them, but be careful crossing into JSON (JavaScript loses precision above 2^53) and use `math/big` / `bin.Uint128` for `u128`. Never store lamports in a `float64`."
        ] },
        { type: "heading", text: "2. Confirmation, blockhash & racing the chain" },
        { type: "list", items: [
          "**Blockhash expiry:** a transaction's blockhash is valid for only ~150 slots (~60-90s). Fetch it **immediately before** signing+sending; a blockhash fetched at startup and reused later fails with a blockhash-not-found / expired error.",
          "**Commitment races:** reading at `processed` right after sending can return stale or rolled-back state. Confirm at `confirmed`/`finalized` before treating a write as done, and read at a commitment consistent with your write.",
          "**Confirmation is async:** `SendTransaction` only means \"accepted into the mempool,\" not \"succeeded.\" Use `SendAndConfirmTransaction` (or poll `GetSignatureStatuses`) and inspect the result — a confirmed transaction can still have **failed on-chain** (check the transaction `Err`).",
          "**Duplicate sends:** retrying a send re-broadcasts the *same* signed transaction (same blockhash) — that's idempotent and safe. Re-signing with a *new* blockhash creates a *different* transaction that could double-execute; retry the original, don't rebuild."
        ] },
        { type: "heading", text: "3. Infrastructure & scaling" },
        { type: "list", items: [
          "**Public RPC rate limits:** `api.devnet.solana.com` / `api.mainnet-beta.solana.com` throttle aggressively (429s). For anything real, use a **dedicated provider** and back off on 429.",
          "**WebSocket drops:** long-lived subscriptions get reset — wrap them in a reconnect+resubscribe loop and re-sync state on reconnect (see Subscriptions).",
          "**Versioned transactions & Address Lookup Tables (ALTs):** modern transactions can be **v0** and reference accounts via lookup tables to fit more accounts under the ~1232-byte limit. If you interact with programs that require many accounts, build **v0** transactions with the relevant ALTs rather than legacy transactions — the SDK supports message v0 / lookup tables."
        ] },
        { type: "callout", variant: "warn", text: "A transaction that confirms is not a transaction that succeeded. Always inspect the on-chain result (`meta.Err`) after confirmation — an instruction can revert (custom program error, failed constraint, insufficient funds) while the transaction itself is happily included in a block." }
      ]
    }
  ],

  packages: [
    { name: "github.com/gagliardetto/solana-go", why: "the de-facto Go SDK: PublicKey/PrivateKey, Transaction/Instruction, PDA derivation, program helpers" },
    { name: ".../solana-go/rpc", why: "JSON-RPC client: GetBalance, GetAccountInfo, GetLatestBlockhash, SendTransaction, cluster URL constants" },
    { name: ".../solana-go/rpc/ws", why: "WebSocket client: AccountSubscribe / LogsSubscribe / ProgramSubscribe / SignatureSubscribe" },
    { name: ".../rpc/sendandconfirmtransaction", why: "send a tx and block until it confirms (subscribes for the signature over ws)" },
    { name: ".../solana-go/programs/system", why: "System program builders — NewTransferInstruction, create account, allocate/assign" },
    { name: ".../solana-go/programs/token", why: "SPL Token program builders — TransferChecked, MintTo, InitializeAccount, etc." },
    { name: ".../programs/associated-token-account", why: "derive & create Associated Token Accounts (ATAs) for (owner, mint)" },
    { name: "github.com/gagliardetto/binary", why: "Borsh / bin (de)serialization used to encode instruction data and decode account structs" },
    { name: "github.com/gagliardetto/anchor-go", why: "code generator: turns an Anchor IDL into a typed Go client (instruction builders + account decoders)" },
    { name: "github.com/solana-foundation/solana-go", why: "the mirrored home of the SDK under the Solana Foundation org (same code as gagliardetto)" },
    { name: "solana-cli (Anza)", why: "dev tooling: solana-test-validator, solana airdrop, solana-keygen, config — not a Go dep but needed locally" },
    { name: "testing (stdlib)", why: "Go's built-in test framework — table-driven t.Run subtests, -short gating for validator integration tests" }
  ],

  gotchas: [
    "**You cannot write on-chain programs in Go** — there is no SBF Go backend. Programs are Rust/Anchor or C; Go is a client only.",
    "The Go SDK API is **pre-1.0 in spirit** — pin the exact `solana-go` version in `go.mod`; `go get -u` can break you across versions.",
    "Account structs must match the program **byte-for-byte** — wrong integer width or a forgotten **8-byte Anchor discriminator** silently shifts every field. Prefer generating types with **anchor-go**.",
    "**Blockhash expiry:** fetch `GetLatestBlockhash` immediately before signing; a reused/stale blockhash fails (`BlockhashNotFound`). Don't cache it across seconds.",
    "**Confirmed ≠ succeeded** — a transaction can be included in a block yet have failed on-chain. Inspect `meta.Err` / the transaction result after confirming.",
    "`SendTransaction` returns after mempool acceptance, not execution — use `SendAndConfirmTransaction` (needs both `rpc.Client` and `ws.Client`) or poll `GetSignatureStatuses`.",
    "PDA seeds must match the program exactly, including **numeric seed encoding** (a Rust `u64` seed = 8 little-endian bytes). One wrong seed = wrong address = on-chain failure.",
    "Token amounts are **base units** (integer scaled by `decimals`), never floats — 1.5 of a 6-dp token is `1_500_000`. Store lamports/amounts as `uint64`, never `float64`.",
    "Public RPC endpoints are **rate-limited** (429). Use a dedicated provider (Helius/Triton/QuickNode) and back off; don't hammer `api.mainnet-beta.solana.com` from a bot.",
    "**WebSocket subscriptions drop** — wrap them in a reconnect + resubscribe loop and re-sync state on reconnect, or your indexer silently stalls.",
    "`GetAccountInfo` returns a `nil` `Value` for a **non-existent account** — check it before decoding, or you'll panic on nil data.",
    "`u128` and JSON precision: Go `uint64` is fine, but values above 2^53 lose precision if round-tripped through JavaScript/`encoding/json` as numbers; use strings or `bin.Uint128`.",
    "There is **no in-process SVM for Go** (no LiteSVM/Mollusk equivalent) — transaction tests must run against a real `solana-test-validator` or devnet.",
    "Retry the **original signed transaction** (idempotent, same signature); re-signing with a new blockhash makes a *different* tx that can double-execute.",
    "Modern programs may need **versioned (v0) transactions + Address Lookup Tables** to fit under the ~1232-byte limit — legacy-only transaction building will fail for account-heavy instructions."
  ],

  flashcards: [
    { q: "Can you write Solana on-chain programs in Go?", a: "No. There is no SBF (Solana Bytecode Format) Go backend. Programs are written in Rust (usually Anchor) or C; Go is a **first-class client language** for bots, indexers and backends that talk to programs over RPC/WebSocket." },
    { q: "What is the de-facto Go SDK for Solana?", a: "**`github.com/gagliardetto/solana-go`** (also mirrored at `solana-foundation/solana-go`) — RPC + WebSocket clients, transaction/instruction builders, PDA derivation, and Borsh (de)serialization via `github.com/gagliardetto/binary`." },
    { q: "How do you connect to a cluster and read a balance in Go?", a: "`client := rpc.New(rpc.DevNet_RPC)` then `client.GetBalance(ctx, pubkey, rpc.CommitmentFinalized)` — the result wraps lamports in `.Value` with a slot context." },
    { q: "What are the three commitment levels and when do you use each?", a: "`processed` (fastest, may roll back), `confirmed` (supermajority-voted, the app default), `finalized` (rooted/irreversible, safest). Trade freshness for finality." },
    { q: "How do you load a wallet keypair in Go?", a: "`solana.NewWallet()` for a fresh one; `solana.PrivateKeyFromSolanaKeygenFile(\"id.json\")` for the CLI file; `solana.PrivateKeyFromBase58(secret)` for a Base58 secret. The file is the raw 64-byte secret — protect it." },
    { q: "How do you decode an on-chain account into a Go struct?", a: "Fetch with `GetAccountInfo`, then `bin.NewBorshDecoder(resp.Value.Data.GetBinary()).Decode(&myStruct)`. The struct must match the program layout, including the 8-byte Anchor discriminator." },
    { q: "What are the five steps to send a transaction?", a: "(1) `GetLatestBlockhash`, (2) build instruction(s) e.g. `system.NewTransferInstruction(...).Build()`, (3) `solana.NewTransaction(ixs, blockhash, payer)`, (4) `tx.Sign(...)` with the required keys, (5) `SendAndConfirmTransaction`." },
    { q: "How do you derive a PDA in Go?", a: "`solana.FindProgramAddress([][]byte{[]byte(\"vault\"), authority.Bytes()}, programID)` — returns the address and the canonical bump. Seeds must exactly match the program (including little-endian numeric seeds)." },
    { q: "Why does SendAndConfirmTransaction need a ws client?", a: "It submits the tx over RPC **and** subscribes over WebSocket (`SignatureSubscribe`) to wait for confirmation, so it takes both an `*rpc.Client` and a `*ws.Client`." },
    { q: "What does anchor-go do?", a: "It generates a **typed Go client from an Anchor IDL** — instruction builder functions, account structs with correct Borsh layouts + discriminators, and decoders. It's the Go analog of Anchor's TypeScript client and eliminates hand-layout bugs." },
    { q: "How do you subscribe to account changes in Go?", a: "`wsc, _ := ws.Connect(ctx, rpc.DevNet_WS)`, then `sub, _ := wsc.AccountSubscribe(addr, commitment)`, and loop on `sub.Recv(ctx)`. Wrap it in a reconnect loop since sockets drop." },
    { q: "How do you test Go Solana clients, and what's the key limitation?", a: "Go's `testing` package with table-driven `t.Run` subtests. There's **no in-process SVM for Go**, so anything sending a transaction runs against a real `solana-test-validator` or devnet; gate those behind `testing.Short()`." },
    { q: "Why must SPL token amounts be integers?", a: "They're **base units** — an integer scaled by the mint's `decimals`. 1.5 of a 6-decimal token is `1_500_000`. Floats lose precision; keep amounts in `uint64`." },
    { q: "Why is 'confirmed' not the same as 'succeeded'?", a: "A transaction can be included in a block (confirmed) yet have **failed on-chain** (reverted instruction, failed constraint). Always inspect the transaction result / `meta.Err` after confirming." },
    { q: "What causes a BlockhashNotFound error and how do you avoid it?", a: "Blockhashes expire after ~150 slots (~60-90s). Fetch `GetLatestBlockhash` immediately before signing and sending; never reuse a stale one cached at startup." }
  ],

  cheatsheet: [
    { label: "Install SDK", code: "go get github.com/gagliardetto/solana-go" },
    { label: "RPC client", code: "client := rpc.New(rpc.DevNet_RPC)" },
    { label: "Balance", code: "client.GetBalance(ctx, pk, rpc.CommitmentConfirmed)" },
    { label: "Account data", code: "client.GetAccountInfo(ctx, pk)  // resp.Value.Data.GetBinary()" },
    { label: "New wallet", code: "w := solana.NewWallet()" },
    { label: "Load keypair file", code: "solana.PrivateKeyFromSolanaKeygenFile(\"id.json\")" },
    { label: "From Base58 secret", code: "solana.PrivateKeyFromBase58(secret)" },
    { label: "Borsh decode", code: "bin.NewBorshDecoder(data).Decode(&v)" },
    { label: "Recent blockhash", code: "client.GetLatestBlockhash(ctx, rpc.CommitmentFinalized)" },
    { label: "Transfer ix", code: "system.NewTransferInstruction(lamports, from, to).Build()" },
    { label: "Build tx", code: "solana.NewTransaction(ixs, blockhash, solana.TransactionPayer(from))" },
    { label: "Send + confirm", code: "sendandconfirmtransaction.SendAndConfirmTransaction(ctx, c, wsc, tx)" },
    { label: "Derive PDA", code: "solana.FindProgramAddress([][]byte{[]byte(\"vault\"), a.Bytes()}, pid)" },
    { label: "Derive ATA", code: "solana.FindAssociatedTokenAddress(owner, mint)" },
    { label: "Subscribe", code: "wsc,_ := ws.Connect(ctx, rpc.DevNet_WS); wsc.AccountSubscribe(addr, cm)" },
    { label: "Generate client", code: "anchor-go --src=idl.json --pkg=myprogram --dst=./generated" }
  ]
});
