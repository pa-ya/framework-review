(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "solana-cpp",
  name: "Solana in C / C++",
  language: "C / C++ · Solana",
  tagline: "Solana on-chain programs in **C** (officially supported) and **C++** (compiles via the same Clang/LLVM SBF backend) — real, but minimal tooling and no Anchor. Rust dominates in practice.",
  color: "#00599C",
  readMinutes: 18,
  group: "Solana",
  navLabel: "C / C++",

  sections: [
    {
      id: "overview",
      title: "Overview & reality check",
      level: "core",
      body: [
        { type: "p", text: "Solana programs (its name for smart contracts) compile to **SBF** — Solana Bytecode Format, an eBPF variant — and run in the Sealevel runtime. The compiler is **Clang/LLVM**, and LLVM has an SBF backend, so *any* language LLVM can target can produce a program. Rust is one. **C is another, and it's officially supported**: the monorepo ships a C SDK (`sdk/sbf/c/`, historically `sdk/bpf/c/`) with an `entrypoint`, syscall headers, and a `Makefile`. **C++** rides the exact same backend — Clang compiles `.cc` to SBF fine — so C++ programs are possible too." },
        { type: "p", text: "That's the honest good news. The honest bad news: outside of the raw C SDK, tooling is *minimal*. There is **no Anchor-equivalent official C++ framework** — no account-validation macros, no IDL generation, no typed client. The closest thing is a community, header-only project (`solana-cpp-sdk`), covered below and explicitly not production-grade. In practice **the entire professional ecosystem is Rust** (Anchor / native `solana-program` / Pinocchio), with a long tail of tooling, audits, and hiring built around it." },
        { type: "table", headers: ["Language", "On-chain status", "Framework", "Tooling"], rows: [
          ["Rust", "Dominant, first-class", "Anchor, Pinocchio, native", "Rich: IDL, clients, test harnesses, audits"],
          ["C", "**Officially supported** (C SDK)", "None (raw syscalls + Makefile)", "Minimal: headers + `make`, deploy CLI"],
          ["C++", "Compiles via LLVM/Clang SBF", "None official; community header-only", "Barely any; you're on your own"]
        ] },
        { type: "callout", variant: "note", text: "This deck's sibling **Anchor** file is the mainline path. Read that first. This file exists because the question *\"can I write a Solana program in C/C++?\"* has a real, correct answer — yes — and it's worth knowing exactly what that looks like and where it stops." },
        { type: "heading", text: "When would you actually reach for C/C++?" },
        { type: "list", items: [
          "**Porting existing C.** You already have battle-tested C (a crypto primitive, a fixed-point math kernel, a parser) and want it on-chain without a Rust rewrite.",
          "**Squeezing compute units.** Hand-written C over the raw ABI can produce a very small, tight binary. (But note: modern Rust **Pinocchio** achieves the same zero-copy, low-CU result *with* Rust's safety — so this reason is weaker than it used to be.)",
          "**Learning / curiosity.** Writing against the bare syscall ABI teaches you exactly what Anchor and `solana-program` do under the hood — deserialize params, walk accounts, invoke_signed.",
          "**You truly cannot use Rust.** A rare constraint, but it exists."
        ] },
        { type: "callout", variant: "warn", text: "Do not choose C/C++ for a *new* production program by default. You give up the borrow checker (Solana's single biggest safety win), Borsh derive, IDL/client generation, and a decade of Rust security tooling. The account model and the exploit classes are identical — you just get zero help avoiding them." }
      ]
    },
    {
      id: "toolchain",
      title: "Toolchain & build",
      level: "core",
      body: [
        { type: "p", text: "You need the **Solana CLI** (Anza/Agave) — it bundles the SBF Clang/LLVM toolchain and the C SDK. Install it the same way as for any Solana work; there's no separate C toolchain to fetch." },
        { type: "code", lang: "bash", code: "# Solana CLI (Anza) — ships the SBF LLVM toolchain + the C SDK\nsh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\"\nsolana --version              # solana-cli 3.x (Agave/Anza)\n\n# the C SDK lives inside the release, e.g.:\n#   ~/.local/share/solana/install/active_release/bin/sdk/sbf/c/\n# (older layouts: sdk/bpf/c/) — it contains inc/ headers + bpf.mk / sbf.mk" },
        { type: "heading", text: "The C SDK Makefile flow" },
        { type: "p", text: "A C program is built with a tiny `Makefile` that includes the SDK's `sbf.mk` (older: `bpf.mk`). That include pulls in the Clang invocation, the SBF target flags, the linker script, and the syscall headers. You declare your source and the SDK does the rest, emitting a `.so` in `out/` (or `dist/`)." },
        { type: "code", lang: "text", code: "myprogram/\n  Makefile\n  src/\n    myprogram.c\n  out/\n    myprogram.so          # <- the deployable SBF ELF" },
        { type: "code", lang: "text", code: "# Makefile\nOUT_DIR := ./out\n\nSRC_DIR := ./src\n\n# point at the SDK shipped with the Solana CLI:\nBPF_SDK := $(shell dirname $(shell which solana))/sdk/sbf/c\n\ninclude $(BPF_SDK)/sbf.mk\n\n# 'make' builds every src/*.c into out/<name>.so" },
        { type: "callout", variant: "gotcha", text: "SDK **paths and filenames drift between releases** — `sdk/bpf/c/bpf.mk` was renamed to `sdk/sbf/c/sbf.mk` in the BPF→SBF rename, and the exact location moves. If `make` can't find the include, `find ~/.local/share/solana -name '*bf.mk'` to locate the current one. This bit-rot is a real tax of the C path." },
        { type: "heading", text: "Rust's build tools vs the C make flow" },
        { type: "table", headers: ["Path", "Command", "Output"], rows: [
          ["Rust (modern)", "`cargo build-sbf`", "`target/deploy/<name>.so`"],
          ["Rust (legacy alias)", "`cargo build-bpf`", "`target/deploy/<name>.so`"],
          ["C SDK", "`make` (includes `sbf.mk`)", "`out/<name>.so`"]
        ] },
        { type: "p", text: "Whatever produced it, a `.so` is a `.so`: SBF bytecode in an ELF. Deploy is language-agnostic." },
        { type: "code", lang: "bash", code: "make                                  # -> out/myprogram.so\n\nsolana config set --url devnet\nsolana program deploy out/myprogram.so\n# prints the Program Id (the on-chain address of your program)" },
        { type: "callout", variant: "tip", text: "For C++ you compile `.cc` with the same Clang. There's no ready-made C++ Makefile in the SDK, so most people either extend the C `Makefile` (add `-std=c++17`, `-fno-exceptions`, `-fno-rtti`) or drive Clang directly with the SBF target — see the C++ SDK section." }
      ]
    },
    {
      id: "structure",
      title: "Program structure in C",
      level: "core",
      body: [
        { type: "p", text: "Every SBF program has one exported symbol: **`entrypoint`**. The runtime hands it a single opaque byte buffer (`input`) containing the serialized program_id, all the accounts, and the instruction data packed together. Your first job is to **deserialize** that buffer into a `SolParameters` struct with `sol_deserialize`, then do your work and return a `uint64_t` status (`SUCCESS` == 0)." },
        { type: "code", lang: "c", code: "#include <solana_sdk.h>\n\n// The runtime calls this one exported symbol.\nextern uint64_t entrypoint(const uint8_t *input) {\n  // We expect exactly N accounts; give the deserializer a fixed array.\n  SolAccountInfo accounts[2];\n  SolParameters params = { .ka = accounts };\n\n  // Unpack the input buffer into params: accounts, data, program_id.\n  if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts))) {\n    return ERROR_INVALID_ARGUMENT;\n  }\n\n  sol_log(\"hello from a C Solana program\");\n\n  // params.ka            -> SolAccountInfo array (the accounts)\n  // params.ka_num        -> how many accounts were actually passed\n  // params.data          -> instruction data (const uint8_t *)\n  // params.data_len      -> its length\n  // params.program_id    -> const SolPubkey * (this program's address)\n\n  return SUCCESS;   // 0 == ok\n}" },
        { type: "table", headers: ["`SolParameters` field", "Meaning"], rows: [
          ["`ka`", "Pointer to the `SolAccountInfo` array you supplied"],
          ["`ka_num`", "Number of accounts actually passed by the client"],
          ["`data` / `data_len`", "Instruction data byte buffer + its length"],
          ["`program_id`", "`const SolPubkey *` — this program's own address"]
        ] },
        { type: "callout", variant: "gotcha", text: "`sol_deserialize` writes into the **fixed-size** `SolAccountInfo` array you pass. If the client sends more accounts than the array holds, deserialization is bounded by the size you give (`SOL_ARRAY_SIZE`). Always check `params.ka_num` against what your instruction actually requires before indexing — reading `accounts[3]` when only 2 were passed is undefined behavior, not a caught error." }
      ]
    },
    {
      id: "accounts",
      title: "Accessing accounts in C",
      level: "core",
      body: [
        { type: "p", text: "Solana programs are **stateless**; all state lives in accounts, and a program may only touch accounts explicitly handed to the instruction. After `sol_deserialize`, each account is a `SolAccountInfo`. Unlike Anchor — where `#[derive(Accounts)]` validates owner/signer/type *before* your code runs — in C you get raw fields and **must check everything by hand**." },
        { type: "code", lang: "c", code: "typedef struct {\n  SolPubkey *key;          // account address\n  uint64_t  *lamports;     // mutable balance (points into the input buffer)\n  uint64_t   data_len;     // size of `data`\n  uint8_t   *data;         // the account's raw bytes (your state)\n  SolPubkey *owner;        // program that owns this account\n  uint64_t   rent_epoch;\n  bool       is_signer;    // did this account sign the tx?\n  bool       is_writable;  // may we mutate lamports/data?\n  bool       executable;   // is this account a program?\n} SolAccountInfo;" },
        { type: "code", lang: "c", code: "extern uint64_t entrypoint(const uint8_t *input) {\n  SolAccountInfo accounts[2];\n  SolParameters params = { .ka = accounts };\n  if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts)))\n    return ERROR_INVALID_ARGUMENT;\n\n  if (params.ka_num < 2) return ERROR_NOT_ENOUGH_ACCOUNT_KEYS;\n\n  SolAccountInfo *authority = &params.ka[0];\n  SolAccountInfo *state     = &params.ka[1];\n\n  // ---- manual checks Anchor would do for you ----\n  // 1. authority must have signed\n  if (!authority->is_signer) return ERROR_MISSING_REQUIRED_SIGNATURES;\n\n  // 2. we must own the state account before trusting its bytes\n  if (!SolPubkey_same(state->owner, params.program_id))\n    return ERROR_INCORRECT_PROGRAM_ID;\n\n  // 3. must be writable if we intend to mutate it\n  if (!state->is_writable) return ERROR_INVALID_ARGUMENT;\n\n  return SUCCESS;\n}" },
        { type: "callout", variant: "warn", text: "There is **no discriminator, no owner check, no type check** unless you write it. Forgetting the `is_signer` check lets anyone act as the authority; forgetting the `owner` check lets an attacker pass a fake account with attacker-controlled bytes. These are the classic Sealevel exploit classes, and in C every single one is your responsibility." }
      ]
    },
    {
      id: "instruction-data",
      title: "Instruction data & dispatch",
      level: "core",
      body: [
        { type: "p", text: "Instruction data arrives as a raw `const uint8_t *` (`params.data`, length `params.data_len`). There's no automatic (de)serialization — no Borsh derive, no argument parsing. The common convention (the same one Anchor/native Rust use) is a **leading discriminator byte(s)** that selects which instruction to run, followed by that instruction's arguments in a byte layout you define." },
        { type: "code", lang: "c", code: "// Our instruction tags (a manual, 1-byte discriminator).\nenum Instruction {\n  IX_INITIALIZE = 0,\n  IX_INCREMENT  = 1,\n  IX_SET        = 2,\n};\n\nstatic uint64_t handle(SolParameters *params) {\n  if (params->data_len < 1) return ERROR_INVALID_INSTRUCTION_DATA;\n\n  uint8_t tag = params->data[0];             // first byte = which instruction\n  const uint8_t *args = params->data + 1;    // the rest = its arguments\n  uint64_t args_len = params->data_len - 1;\n\n  switch (tag) {\n    case IX_INITIALIZE:\n      return do_initialize(params);\n    case IX_SET: {\n      if (args_len < 8) return ERROR_INVALID_INSTRUCTION_DATA;\n      uint64_t value = *(const uint64_t *)args;   // 8 LE bytes -> u64\n      return do_set(params, value);\n    }\n    case IX_INCREMENT:\n      return do_increment(params);\n    default:\n      return ERROR_INVALID_INSTRUCTION_DATA;\n  }\n}" },
        { type: "callout", variant: "gotcha", text: "That `*(const uint64_t *)args` cast assumes the client wrote **8 little-endian bytes** *and* that `args` is 8-byte aligned. Solana is little-endian, so LE matches — but a mis-sized or short buffer reads past the end. Always bounds-check (`args_len < 8`) first, and for portability copy into a local with `sol_memcpy(&value, args, 8)` rather than casting a possibly-unaligned pointer." }
      ]
    },
    {
      id: "logging",
      title: "Logging & debugging",
      level: "core",
      body: [
        { type: "p", text: "There's no debugger and no `printf` on-chain. You emit to the **program logs**, which show up in the transaction result and in `solana logs`. The C SDK gives a small family of log syscalls (the C analog of Rust's `msg!`)." },
        { type: "table", headers: ["Syscall", "Prints"], rows: [
          ["`sol_log(const char *msg)`", "A plain string message"],
          ["`sol_log_64(a, b, c, d, e)`", "Five `uint64_t` values (cheap numeric tracing)"],
          ["`sol_log_pubkey(const SolPubkey *)`", "A pubkey (base58) — great for checking which account you got"],
          ["`sol_log_array(const uint8_t *, len)`", "A byte buffer as hex"],
          ["`sol_log_compute_units()`", "Remaining compute units — profile hotspots"]
        ] },
        { type: "code", lang: "c", code: "sol_log(\"instruction: set\");\nsol_log_pubkey(state->key);                 // which account?\nsol_log_64(0, 0, 0, old_value, new_value);  // trace numbers\nsol_log_compute_units();                    // how many CUs left?" },
        { type: "code", lang: "bash", code: "# watch logs from another terminal while you send a transaction\nsolana logs | grep -A5 <YOUR_PROGRAM_ID>" },
        { type: "callout", variant: "tip", text: "Logging isn't free — each `sol_log*` costs compute units and log bytes are capped per transaction. Trace with `sol_log_64` (numbers are far cheaper than formatted strings) while developing, then strip logs from hot paths before deploying to mainnet." }
      ]
    },
    {
      id: "state",
      title: "State & serialization",
      level: "core",
      body: [
        { type: "p", text: "Your program's state is the raw `data` byte buffer of an account it owns. In Rust you'd `#[derive(BorshSerialize)]` a struct and let the macro handle layout. **In C there is no Borsh derive** — you define a `struct` and read/write it into `account->data` by hand, owning the exact byte layout (and matching it in the client)." },
        { type: "code", lang: "c", code: "// Our on-chain state layout. Keep it POD, fixed-size, and\n// pick a packing that both the program and the client agree on.\ntypedef struct __attribute__((packed)) {\n  uint8_t  initialized;   // 1 byte  (a manual 'is this set up?' guard)\n  SolPubkey authority;    // 32 bytes\n  uint64_t count;         // 8 bytes little-endian\n} Counter;\n\nstatic uint64_t do_increment(SolParameters *params) {\n  SolAccountInfo *state = &params->ka[0];\n\n  // the account must be big enough to hold our struct\n  if (state->data_len < sizeof(Counter))\n    return ERROR_ACCOUNT_DATA_TOO_SMALL;\n\n  // reinterpret the account bytes as our struct and mutate in place\n  Counter *c = (Counter *)state->data;\n  if (!c->initialized) return ERROR_UNINITIALIZED_ACCOUNT;\n\n  c->count += 1;                 // written straight back to the account\n  sol_log_64(0, 0, 0, 0, c->count);\n  return SUCCESS;\n}" },
        { type: "callout", variant: "note", text: "Writing through `(Counter *)state->data` mutates the account **in place** — the runtime persists whatever bytes are there when `entrypoint` returns SUCCESS (provided the account is `is_writable` and owned by you). No explicit \"save\" call." },
        { type: "callout", variant: "gotcha", text: "`__attribute__((packed))` + endianness is the whole game. If the client (JS/Rust) serializes fields in a different order, size, or byte-order, you read garbage. Solana is **little-endian**, so a C `uint64_t` on the SBF target and a Rust `u64`/Borsh both agree — but the moment you change the struct you must change every client in lockstep. There's no IDL to keep them honest." },
        { type: "callout", variant: "warn", text: "Accounts must be **rent-exempt**: funded with ~2 years of rent for their byte size or the transaction fails. Creating and sizing the account (a `SystemProgram.createAccount` CPI or a client-side create) is where you commit to `sizeof(Counter)`. The size is fixed at creation; growing it later needs a realloc." }
      ]
    },
    {
      id: "pdas-cpis",
      title: "PDAs & CPIs in C",
      level: "deep",
      body: [
        { type: "p", text: "A **PDA** (Program Derived Address) is a deterministic address derived from seeds + program_id that lies *off* the Ed25519 curve, so it has no private key and only the owning program can \"sign\" for it. A **CPI** (Cross-Program Invocation) is your program calling another program's instruction. The C SDK exposes both over the raw ABI." },
        { type: "heading", text: "Finding a PDA" },
        { type: "code", lang: "c", code: "SolPubkey pda;\nuint8_t bump;\n\nconst SolSignerSeed seeds[] = {\n  { (const uint8_t *)\"vault\", 5 },\n  { authority->key->x, SIZE_PUBKEY },\n};\n\n// searches bump 255->0 for an off-curve address (the canonical bump)\nif (sol_try_find_program_address(\n        seeds, SOL_ARRAY_SIZE(seeds),\n        params->program_id, &pda, &bump) != SUCCESS) {\n  return ERROR_INVALID_SEEDS;\n}\nsol_log_pubkey(&pda);" },
        { type: "heading", text: "Signing a CPI with a PDA" },
        { type: "p", text: "To invoke another program *as* your PDA, you build a `SolInstruction`, then call `sol_invoke_signed_c` passing the PDA's seeds **plus the bump** as `SolSignerSeeds`. This is the C form of Rust's `invoke_signed` — the runtime re-derives the PDA from the seeds and, if it matches, treats it as a signer." },
        { type: "code", lang: "c", code: "// The seeds that prove ownership of the PDA — note the trailing bump byte.\nuint8_t bump_seed[] = { bump };\nconst SolSignerSeed signer_seeds[] = {\n  { (const uint8_t *)\"vault\", 5 },\n  { authority->key->x, SIZE_PUBKEY },\n  { bump_seed, 1 },                       // <- the bump completes the PDA\n};\nconst SolSignerSeeds signers[] = {\n  { signer_seeds, SOL_ARRAY_SIZE(signer_seeds) },\n};\n\n// `instruction` is a SolInstruction you built (program_id, accounts, data);\n// `accounts`/`accounts_len` are the SolAccountInfos it touches.\nuint64_t r = sol_invoke_signed_c(\n    &instruction,\n    accounts, accounts_len,\n    signers, SOL_ARRAY_SIZE(signers));\nif (r != SUCCESS) return r;" },
        { type: "callout", variant: "gotcha", text: "The seeds passed to `sol_invoke_signed_c` must **exactly** match how the PDA was derived, **including the bump** as the final seed. Use the canonical bump from `sol_try_find_program_address` (or a bump you stored in the account) — never trust an attacker-supplied bump, or they can substitute a different valid PDA. Same rule as Anchor, but here nothing enforces it for you." },
        { type: "callout", variant: "note", text: "Building the `SolInstruction` (its `SolAccountMeta` array and data buffer) by hand is verbose — this is exactly the boilerplate Anchor's `CpiContext` generates. For a plain SOL transfer you construct a System Program instruction; there are no typed helpers in the C SDK." }
      ]
    },
    {
      id: "errors",
      title: "Errors",
      level: "core",
      body: [
        { type: "p", text: "A C program signals failure by **returning a non-zero `uint64_t`** from `entrypoint` (or any handler). `SUCCESS` is 0. The SDK defines a set of built-in `ERROR_*` constants for common runtime conditions, and reserves a range for your own **custom** codes via the `TO_BUILTIN` macro." },
        { type: "table", headers: ["Constant", "Meaning"], rows: [
          ["`SUCCESS`", "0 — instruction succeeded"],
          ["`ERROR_INVALID_ARGUMENT`", "Bad/malformed input"],
          ["`ERROR_INVALID_INSTRUCTION_DATA`", "Instruction data didn't parse"],
          ["`ERROR_MISSING_REQUIRED_SIGNATURES`", "An expected signer didn't sign"],
          ["`ERROR_NOT_ENOUGH_ACCOUNT_KEYS`", "Fewer accounts passed than required"],
          ["`ERROR_ACCOUNT_DATA_TOO_SMALL`", "Account can't hold your struct"],
          ["`ERROR_INCORRECT_PROGRAM_ID`", "Owner / program mismatch"]
        ] },
        { type: "code", lang: "c", code: "// Custom error codes: TO_BUILTIN packs your number into the reserved range,\n// so clients see it as a distinct, decodable custom program error.\n#define ERR_ALREADY_INITIALIZED  TO_BUILTIN(1)\n#define ERR_ZERO_AMOUNT          TO_BUILTIN(2)\n#define ERR_UNAUTHORIZED         TO_BUILTIN(3)\n\nstatic uint64_t do_set(SolParameters *params, uint64_t amount) {\n  if (amount == 0) return ERR_ZERO_AMOUNT;\n  if (!params->ka[0].is_signer) return ERR_UNAUTHORIZED;\n  // ...\n  return SUCCESS;\n}" },
        { type: "callout", variant: "note", text: "There's no `#[msg(\"...\")]` and no error-name metadata like Anchor emits into an IDL — clients see a raw custom error *number*. Keep a shared table of `code -> meaning` between the program and every client by hand, since nothing generates it for you." }
      ]
    },
    {
      id: "cpp-sdk",
      title: "The solana-cpp-sdk (C++, community) — deep dive",
      level: "deep",
      body: [
        { type: "p", text: "Everything above is **C**. For **C++**, the raw C SDK still works — Clang compiles `.cc` to SBF — but you're writing the same manual, unsafe ABI code with C++ syntax. The community answer to \"can I get typed, RAII-flavored wrappers?\" is **`solana-cpp-sdk`** by *machacekch*: a **header-only** library that wraps the C ABI in C++ types — typed account views, pubkey helpers, safer instruction-data readers, thin RAII over the syscalls." },
        { type: "code", lang: "cpp", code: "// Illustrative shape of the community C++ wrapper style (header-only).\n// The library provides typed helpers over SolAccountInfo / SolParameters;\n// exact names vary by version — treat this as the *flavor*, not a spec.\n#include <solana.hpp>\n\nextern \"C\" uint64_t entrypoint(const uint8_t *input) {\n  auto params = sol::deserialize<2>(input);   // typed, fixed-arity accounts\n  if (!params) return ERROR_INVALID_ARGUMENT;\n\n  auto authority = params->account(0);\n  auto state     = params->account(1);\n\n  if (!authority.is_signer())  return ERROR_MISSING_REQUIRED_SIGNATURES;\n  if (!state.owned_by(params->program_id()))\n    return ERROR_INCORRECT_PROGRAM_ID;\n\n  sol::log(\"hello from C++\");\n  return SUCCESS;\n}" },
        { type: "callout", variant: "warn", text: "**Unofficial, and not for production.** `solana-cpp-sdk` is a single-maintainer, community project — not published, audited, or supported by the Solana Foundation or Anza. There is no ecosystem, no IDL, no client generation, and no guarantee it tracks SDK/runtime changes. It's a genuinely interesting way to write C++ Solana programs and to learn the ABI — but if you're shipping value on mainnet, the responsible choice is Rust." },
        { type: "list", items: [
          "**No exceptions / no RTTI on-chain.** Compile C++ with `-fno-exceptions -fno-rtti`; the SBF runtime has no unwinder and a tiny stack/heap. `std::` containers that allocate are largely off-limits.",
          "**Header-only is a feature here** — it sidesteps the SDK's lack of a C++ build/link story; you just include and compile against the SBF target.",
          "**You still own byte layout and every safety check** — C++ RAII wraps the ergonomics, not the account model."
        ] },
        { type: "link", url: "https://github.com/machacekch/solana-cpp-sdk", text: "machacekch/solana-cpp-sdk — community, header-only C++ wrappers over the Solana C ABI (unofficial)" }
      ]
    },
    {
      id: "client",
      title: "Writing a client (C / C++)",
      level: "core",
      body: [
        { type: "p", text: "A Solana program does nothing until a **client** builds a transaction (pick the accounts, encode the instruction data with your byte layout, sign, and send over JSON-RPC). Here's the honest state of C/C++ clients: **there is no official one, and almost nobody uses C/C++ for the client even when the program is in C/C++.**" },
        { type: "list", items: [
          "The mainstream clients are **TypeScript** (`@solana/kit` / `@solana/web3.js`), **Rust** (`solana-client`), and **Go** (`solana-go`). All talk the same JSON-RPC and can drive a program written in *any* language, because a compiled `.so` is language-agnostic.",
          "For C/C++ specifically, the option is a **community** library such as **`SolanaCPP`** — an unofficial C++ RPC/transaction client. It exists, but it's small, unaudited, and not something most teams standardize on.",
          "In practice: write your program in C/C++ if you must, but write the **client in JS/Rust/Go**. You'll get keypair handling, transaction building, PDA derivation, and confirmation logic that's actually maintained."
        ] },
        { type: "callout", variant: "note", text: "Because there's no IDL, a C/C++ program's client — in *any* language — must hand-encode the instruction data (the discriminator byte + argument bytes) and hand-decode account data to exactly match your C `struct` layout and endianness. This is the manual mirror of the byte layout you defined on-chain." },
        { type: "code", lang: "typescript", code: "// The pragmatic client for a C program: TypeScript, hand-encoding the bytes\n// to match the on-chain layout (no IDL to generate this for you).\nimport {\n  Connection, PublicKey, Transaction, TransactionInstruction, Keypair,\n  sendAndConfirmTransaction,\n} from \"@solana/web3.js\";\n\nconst PROGRAM_ID = new PublicKey(\"<your deployed program id>\");\n\n// IX_SET = 2, then a u64 little-endian argument — matching our C dispatch.\nfunction encodeSet(value: bigint): Buffer {\n  const buf = Buffer.alloc(1 + 8);\n  buf.writeUInt8(2, 0);                 // discriminator byte\n  buf.writeBigUInt64LE(value, 1);       // 8 LE bytes -> C uint64_t\n  return buf;\n}\n\nconst ix = new TransactionInstruction({\n  programId: PROGRAM_ID,\n  keys: [\n    { pubkey: authority.publicKey, isSigner: true,  isWritable: false },\n    { pubkey: statePubkey,         isSigner: false, isWritable: true  },\n  ],\n  data: encodeSet(42n),\n});\n\nawait sendAndConfirmTransaction(connection, new Transaction().add(ix), [authority]);" },
        { type: "link", url: "https://github.com/many-exchange/solana-cpp-sdk", text: "Community C++ Solana clients exist (e.g. \"SolanaCPP\"-style RPC libraries) — treat as unofficial; most teams use JS/Rust/Go clients" }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "core",
      body: [
        { type: "p", text: "Good news: a compiled `.so` is **language-agnostic**, so all the Rust/JS Solana test harnesses work on a C/C++ program unchanged. Bad news: there is **no native C test harness** — you don't write your tests in C. You build the `.so`, then drive it from an SVM harness in Rust or JS." },
        { type: "table", headers: ["Harness", "Language", "Good for"], rows: [
          ["**LiteSVM** (Rust)", "Rust", "Fast in-process VM; load the `.so`, send real transactions"],
          ["**LiteSVM** (TS bindings)", "TypeScript", "Same VM from JS — encode bytes, assert on account data"],
          ["**mollusk-svm**", "Rust", "Single-instruction harness + compute-unit budgeting/benchmarking"],
          ["`solana-test-validator`", "any client", "Full local validator; deploy the `.so`, hit it over RPC"]
        ] },
        { type: "code", lang: "rust", code: "// Test a C-built program from Rust with LiteSVM — it doesn't care\n// what language produced out/myprogram.so.\nuse litesvm::LiteSVM;\nuse solana_sdk::{pubkey::Pubkey, signature::Keypair, signer::Signer,\n                 instruction::{Instruction, AccountMeta}, transaction::Transaction};\n\n#[test]\nfn increment_bumps_the_counter() {\n    let mut svm = LiteSVM::new();\n    let program_id = Pubkey::new_unique();\n    svm.add_program_from_file(program_id, \"out/myprogram.so\").unwrap();\n\n    let payer = Keypair::new();\n    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();\n\n    // hand-build the instruction data to match the C byte layout: [tag=1]\n    let ix = Instruction {\n        program_id,\n        accounts: vec![AccountMeta::new(state_pubkey, false)],\n        data: vec![1u8],                 // IX_INCREMENT\n    };\n    let tx = Transaction::new_signed_with_payer(\n        &[ix], Some(&payer.pubkey()), &[&payer], svm.latest_blockhash());\n    assert!(svm.send_transaction(tx).is_ok());\n\n    // read the account bytes back and check the little-endian u64 count\n    let acct = svm.get_account(&state_pubkey).unwrap();\n    let count = u64::from_le_bytes(acct.data[33..41].try_into().unwrap());\n    assert_eq!(count, 1);\n}" },
        { type: "callout", variant: "gotcha", text: "The harness loads the compiled `out/myprogram.so`, **not** your source — a stale build tests old logic. Re-run `make` after every change. And because there's no IDL, your test asserts on **raw byte offsets** (`data[33..41]`) that you must keep in sync with the C struct by hand." },
        { type: "callout", variant: "tip", text: "Factor pure logic (math, validation) into plain C functions and test *those* with an ordinary host C test (compiled for your machine, not SBF) via any C unit-test framework. Keep `entrypoint` thin so most of your logic is testable without any SVM at all." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The account model, compute budget, stack/heap limits, and exploit classes are **identical to Rust Solana** — but you face them with none of Rust's guardrails. These are the frictions specific to the C/C++ path." },
        { type: "list", items: [
          "**No ownership safety — the big one.** Rust's borrow checker prevents whole classes of aliasing/use-after-free/data-race bugs at compile time. In C you get none of that: a dangling pointer into the input buffer, a double-mutation, or reading a freed account is a silent memory-safety bug on a system holding real money. This is *the* reason Rust dominates.",
          "**Manual byte layout everywhere.** No Borsh derive, no IDL. You define account and instruction layouts by hand and must mirror them in every client. One field reorder or size change silently corrupts state.",
          "**Endianness / alignment.** Solana is little-endian; casting `(uint64_t *)ptr` on an unaligned or short buffer is UB. Bounds-check first and prefer `sol_memcpy` into an aligned local over pointer casts.",
          "**Matching account layout with clients.** With no generated client, the JS/Rust/Go side hand-encodes/decodes to match your struct. Keep a single source-of-truth comment and change both sides in lockstep.",
          "**Toolchain & SDK bit-rot.** The C SDK's paths and filenames drift (`bpf`→`sbf`, `bpf.mk`→`sbf.mk`), examples go stale, and there's far less community traffic to fix your build error. Expect to `find` the current `sbf.mk` and read the SDK headers directly.",
          "**Tiny ecosystem.** No Anchor, no typed clients, few examples, almost no Stack Overflow answers, no auditors who specialize in on-chain C. You're near the frontier alone.",
          "**Same runtime limits as Rust.** ~200k compute units (max 1.4M, requestable client-side), ~4KB stack frame, fixed heap, ~1232-byte transaction size. C's smaller runtime can help CU/size, but the ceilings are the same and you hit `exceeded CUs` / access violations the same way."
        ] },
        { type: "callout", variant: "warn", text: "If this list reads as \"choose Rust,\" that's the honest takeaway for most projects. Reach for C/C++ only with a concrete reason (porting proven C, a hard constraint) and budget extra time for security review — you are hand-implementing every check Anchor gives you for free, on an adversarial runtime." },
        { type: "callout", variant: "note", text: "Even Anza's own newer low-level work (e.g. the zero-copy **Pinocchio** crate) is in Rust and reaches C-like binary sizes with memory safety intact — so the historical \"use C for tiny/fast programs\" argument is largely subsumed by modern Rust." }
      ]
    },
    {
      id: "references",
      title: "References",
      level: "deep",
      body: [
        { type: "link", url: "https://github.com/anza-xyz/agave/tree/master/sdk/sbf/c", text: "Agave monorepo — the official Solana C SDK (headers, sbf.mk, entrypoint)" },
        { type: "link", url: "https://solana.com/docs/programs/lang-c", text: "Solana docs — developing on-chain programs in C" },
        { type: "link", url: "https://github.com/machacekch/solana-cpp-sdk", text: "machacekch/solana-cpp-sdk — community, header-only C++ wrappers (unofficial)" },
        { type: "link", url: "https://github.com/LiteSVM/litesvm", text: "LiteSVM — fast in-process SVM for testing any compiled program (Rust + TS bindings)" },
        { type: "link", url: "https://github.com/anza-xyz/mollusk", text: "mollusk-svm — single-instruction test harness + compute-unit benchmarking" }
      ]
    }
  ],

  packages: [
    { name: "solana-cli (Anza/Agave)", why: "ships the SBF Clang/LLVM toolchain, the C SDK, and `solana program deploy` / `solana logs`" },
    { name: "Solana C SDK (sdk/sbf/c)", why: "official on-chain C: `solana_sdk.h` headers, `entrypoint`, `SolParameters`, `sol_deserialize`, syscalls, `sbf.mk`" },
    { name: "sbf.mk / bpf.mk", why: "the SDK Makefile include that drives Clang → SBF and links the `.so`" },
    { name: "clang / LLVM (SBF backend)", why: "the actual compiler for both C and C++ on-chain; the SBF target lives in LLVM" },
    { name: "solana-cpp-sdk (machacekch)", why: "community, header-only C++ RAII/typed wrappers over the C ABI — unofficial, not for production" },
    { name: "SolanaCPP (community)", why: "unofficial C++ RPC/transaction client; rarely used — most teams pick a JS/Rust/Go client" },
    { name: "litesvm", why: "fast in-process SVM to test the compiled `.so` from Rust; language-agnostic" },
    { name: "litesvm (TS bindings)", why: "same VM from JavaScript/TypeScript for byte-level assertions" },
    { name: "mollusk-svm", why: "single-instruction Rust harness + compute-unit budgeting/benchmarking for the `.so`" },
    { name: "solana-test-validator", why: "full local validator; deploy the C `.so` and drive it over RPC with any client" },
    { name: "@solana/web3.js", why: "the pragmatic client for a C program: hand-encode instruction bytes, build/sign/send transactions" },
    { name: "@solana/kit", why: "modern tree-shakable TS client (formerly web3.js 2.0) — also drives language-agnostic programs" },
    { name: "solana-client (Rust)", why: "Rust RPC client — common for driving C programs and integration tests" },
    { name: "cargo build-sbf", why: "the Rust build path to SBF (for comparison / for a Rust client or test crate)" }
  ],

  gotchas: [
    "**No safety net vs Rust.** You lose the borrow checker, Borsh derive, IDL, and typed clients. Every owner/signer/type check Anchor does for free is now your hand-written code — the account model and exploit classes are unchanged.",
    "**SDK bit-rot.** Paths/filenames drift between releases (`sdk/bpf/c/bpf.mk` → `sdk/sbf/c/sbf.mk`). If `make` can't find the include, `find ~/.local/share/solana -name '*bf.mk'`.",
    "**Missing manual checks.** No automatic `is_signer` / `owner` / discriminator validation — forgetting one lets an attacker act as the authority or pass a fake account. Check them explicitly on every account.",
    "**Bounds before indexing.** `sol_deserialize` fills a fixed array; verify `params.ka_num` before reading `accounts[i]`. Indexing past the passed accounts is UB, not a caught error.",
    "**Instruction data casts.** `*(const uint64_t *)args` assumes 8 LE, aligned bytes. Bounds-check `data_len` first and prefer `sol_memcpy` into an aligned local over an unaligned pointer cast.",
    "**Byte layout must match the client.** No IDL keeps you honest — a struct reorder/resize silently corrupts state. Change on-chain layout and every client in lockstep. Solana is little-endian.",
    "**`__attribute__((packed))` matters.** Rely on an explicit, packed, fixed-size layout so program and clients agree; don't let the compiler pad differently than your client expects.",
    "**Rent-exemption.** Accounts must be funded for ~2 years of rent for their size or the tx fails; size is fixed at creation, growing needs realloc.",
    "**PDA bump discipline.** Pass the canonical bump (from `sol_try_find_program_address`) as the final seed to `sol_invoke_signed_c`; never trust an attacker-supplied bump — nothing enforces it in C.",
    "**Stale `.so` in tests.** LiteSVM/mollusk load `out/myprogram.so`, not your source. Re-run `make` after every change or you test old logic.",
    "**C++ needs `-fno-exceptions -fno-rtti`.** The SBF runtime has no unwinder and a tiny stack/heap; allocating `std::` containers are largely off-limits.",
    "**`solana-cpp-sdk` is unofficial.** Single-maintainer, unaudited, no ecosystem — fine for learning, not for mainnet value. Use Rust for production.",
    "**Custom errors are just numbers.** `TO_BUILTIN(n)` gives a code with no `#[msg]`/IDL metadata — maintain a `code → meaning` table by hand across program and clients.",
    "**Runtime limits are identical to Rust.** ~200k CUs (max 1.4M), ~4KB stack frame, fixed heap, ~1232-byte tx. C can be smaller/cheaper but the ceilings and failure modes are the same."
  ],

  flashcards: [
    { q: "Which of C and C++ is *officially* supported for Solana on-chain programs?", a: "**C** is officially supported (the C SDK in the monorepo: `solana_sdk.h`, `entrypoint`, `SolParameters`, `sbf.mk`). **C++** merely *compiles* via the same Clang/LLVM SBF backend — no official framework or SDK build story." },
    { q: "Why can C (and C++) target Solana at all?", a: "Solana programs are **SBF** (an eBPF variant), and the compiler is **Clang/LLVM** which has an SBF backend. Any language LLVM can lower to SBF can produce a program — Rust and C among them." },
    { q: "Is there an Anchor-equivalent framework for C/C++?", a: "No official one. The closest is the **community, header-only `solana-cpp-sdk` (machacekch)** — unofficial, unaudited, not for production. No macros, no IDL, no client generation." },
    { q: "What is the single exported symbol of a C Solana program, and what does it receive?", a: "**`entrypoint(const uint8_t *input)`** — the runtime hands it one packed buffer (program_id + accounts + instruction data). You call `sol_deserialize` to unpack it into a `SolParameters`, and return a `uint64_t` (`SUCCESS` == 0)." },
    { q: "How do you build and deploy a C Solana program?", a: "A `Makefile` that `include`s the SDK's `sbf.mk` (older `bpf.mk`); run `make` → `out/<name>.so`; then `solana program deploy out/<name>.so`. Same deploy step as a Rust `.so`." },
    { q: "What are the key `SolAccountInfo` fields and which checks must you do manually?", a: "`key`, `lamports`, `data`/`data_len`, `owner`, `is_signer`, `is_writable`, `executable`. In C you must manually check `is_signer`, that `owner == program_id`, `is_writable`, and data size — Anchor would do these for you." },
    { q: "How is instruction dispatch done in C?", a: "Manually: read a leading **discriminator byte** from `params.data`, `switch` on it to pick the handler, and parse the remaining bytes as that instruction's arguments (bounds-checking first). No auto-deserialization." },
    { q: "How do you store program state in C, and what's the risk?", a: "Cast/write your fixed-size (packed) `struct` into `account->data` in place; the runtime persists it on SUCCESS. Risk: you own the exact byte layout + endianness with no Borsh/IDL, so any client mismatch corrupts state." },
    { q: "What are the C log syscalls?", a: "`sol_log` (string), `sol_log_64` (five u64s, cheap), `sol_log_pubkey` (a pubkey), plus `sol_log_compute_units` / `sol_log_array`. They're the C analog of Rust's `msg!` and write to program logs." },
    { q: "How do you derive a PDA and sign a CPI with it in C?", a: "`sol_try_find_program_address(seeds, ..., program_id, &pda, &bump)` for the canonical bump; then `sol_invoke_signed_c(&ix, accounts, len, signers, n)` where `signers` are `SolSignerSeeds` including the **bump as the final seed**." },
    { q: "How do you return errors from a C program, including custom ones?", a: "Return a non-zero `uint64_t` (0 == `SUCCESS`). Use built-in `ERROR_*` constants, or `TO_BUILTIN(n)` for custom codes — but clients see only a number (no `#[msg]`/IDL metadata)." },
    { q: "In what language do you write a client for a C/C++ program, and why?", a: "Almost always **JS/Rust/Go** — a compiled `.so` is language-agnostic and those clients are maintained. C/C++ clients are community-only (e.g. `SolanaCPP`), unaudited, and rarely used. With no IDL, the client hand-encodes bytes to match your layout." },
    { q: "How do you test a C/C++ Solana program? Is there a native C harness?", a: "There is **no native C test harness**. You `make` the `.so`, then drive it from **LiteSVM** or **mollusk** (Rust), the LiteSVM **TS** bindings, or `solana-test-validator` — all work because the compiled program is language-agnostic." },
    { q: "What's the strongest reason Rust dominates over C for Solana programs?", a: "**Memory/ownership safety** — the borrow checker eliminates whole classes of aliasing/use-after-free bugs at compile time on a runtime holding real money. Plus Borsh derive, IDL, typed clients, and a large audited ecosystem. Modern **Pinocchio** even gives C-like size in Rust." },
    { q: "When is choosing C/C++ actually justified?", a: "Porting proven existing C, an extreme size/CU need (weaker now that Pinocchio exists), a hard constraint against Rust, or learning the raw ABI. For a new production program, Rust is the responsible default." },
    { q: "Why must a C program treat instruction-data pointer casts carefully?", a: "`*(uint64_t *)args` assumes 8 little-endian, aligned bytes; a short or unaligned buffer is undefined behavior. Bounds-check `data_len` first and `sol_memcpy` into an aligned local. (Solana is little-endian, so LE matches C.)" }
  ],

  cheatsheet: [
    { label: "Entrypoint", code: "extern uint64_t entrypoint(const uint8_t *input)" },
    { label: "Deserialize input", code: "sol_deserialize(input, &params, SOL_ARRAY_SIZE(accounts))" },
    { label: "Success / error", code: "return SUCCESS;  // 0   |   return ERROR_INVALID_ARGUMENT;" },
    { label: "Custom error", code: "#define ERR_X TO_BUILTIN(1)" },
    { label: "Signer check", code: "if (!acct->is_signer) return ERROR_MISSING_REQUIRED_SIGNATURES;" },
    { label: "Owner check", code: "if (!SolPubkey_same(acct->owner, params.program_id)) return ERROR_INCORRECT_PROGRAM_ID;" },
    { label: "Read state", code: "Counter *c = (Counter *)state->data;  // packed struct" },
    { label: "Log", code: "sol_log(\"msg\"); sol_log_64(0,0,0,a,b); sol_log_pubkey(key);" },
    { label: "Find PDA", code: "sol_try_find_program_address(seeds, n, program_id, &pda, &bump)" },
    { label: "Signed CPI", code: "sol_invoke_signed_c(&ix, accounts, len, signers, n)" },
    { label: "Build (C SDK)", code: "make   # includes sbf.mk -> out/<name>.so" },
    { label: "Deploy", code: "solana program deploy out/myprogram.so" },
    { label: "Watch logs", code: "solana logs | grep <PROGRAM_ID>" },
    { label: "Test the .so (Rust)", code: "svm.add_program_from_file(id, \"out/myprogram.so\")" }
  ]
});
