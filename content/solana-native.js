(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "solana-native",
  name: "Native Solana (Rust)",
  language: "Rust · Solana",
  tagline: "Writing Solana programs **by hand in Rust — no Anchor**. Everything Anchor generates (account parsing, checks, discriminators, CPIs, the client) you write yourself. More boilerplate, total control, smaller binaries, fewer CUs.",
  color: "#14F195",
  readMinutes: 28,
  group: "Solana",
  navLabel: "Rust (native)",

  sections: [
    {
      id: "overview",
      title: "Overview & native vs Anchor",
      level: "core",
      body: [
        { type: "p", text: "A **native** Solana program is a plain Rust `cdylib` that talks to the runtime directly through the `solana-program` crate — no framework macros. You define an `entrypoint!`, parse raw `&[u8]` instruction data yourself, walk the `&[AccountInfo]` slice by hand, run every signer/owner/PDA check manually, and (de)serialize state with **Borsh**. It's exactly what Anchor's macros expand to — Anchor is a code generator sitting on top of this layer." },
        { type: "p", text: "The mental model is identical to Anchor's because it's the same runtime: Solana separates **code** (stateless programs, compiled to **SBF** and run in the Sealevel runtime) from **state** (accounts). Every instruction must be handed *every* account it will touch, up front. The only difference is who writes the validation — you, or a macro." },
        { type: "table", headers: ["Dimension", "Native", "Anchor"], rows: [
          ["Boilerplate", "You write account parsing, checks, discriminators, (de)serialization, client", "`#[derive(Accounts)]` / `#[account]` generate it"],
          ["Control", "Total — nothing hidden, every byte is yours", "Framework decides layout (8-byte discriminator, etc.)"],
          ["Binary size / CUs", "Smaller `.so`, fewer compute units (no macro overhead)", "Larger, more CUs from generated checks"],
          ["Safety", "Only as safe as the checks you remember to write", "Whole bug classes removed by constraints"],
          ["Client", "Hand-build `Instruction`s + Borsh, or generate via IDL tools", "Typed TS/Rust client from the IDL for free"],
          ["Learning value", "You actually understand the account model", "You can ship without understanding it"]
        ] },
        { type: "callout", variant: "note", text: "**When to go native:** you want the smallest/fastest program (oracles, high-frequency DeFi, anything CU-bound), you need layout control Anchor won't give you, you're auditing/optimizing, or you're learning what Solana actually does. **When to use Anchor** (see the sibling `Anchor` section): almost everything else — it removes error-prone boilerplate and hands you a client." },
        { type: "callout", variant: "warn", text: "Native gives you no free checks. Every signer, owner, and PDA-bump verification Anchor does automatically is a line *you* must remember — the most common source of native exploits is a forgotten `is_signer` or owner check." }
      ]
    },
    {
      id: "setup",
      title: "Toolchain & project setup",
      level: "core",
      body: [
        { type: "p", text: "Two tools: **Rust** (rustup) and the **Solana CLI** (from Anza — the org maintaining the Agave validator). The CLI ships `cargo build-sbf` (compiles your crate to the SBF target) and `solana` (keygen, airdrop, deploy). No `avm`, no Node required for a pure-native workflow." },
        { type: "code", lang: "bash", code: "# Rust\ncurl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y\n\n# Solana CLI (Anza)\nsh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\"\n\n# verify\nrustc --version     # 1.85.0\nsolana --version    # solana-cli 3.1.x (Agave/Anza)\ncargo build-sbf --version" },
        { type: "heading", text: "Create the crate" },
        { type: "p", text: "A program is a **library** crate compiled as a `cdylib` (the SBF shared object the loader runs) *and* a `lib` (so tests and clients can `use` your types)." },
        { type: "code", lang: "bash", code: "cargo new --lib my_program\ncd my_program" },
        { type: "code", lang: "toml", code: "# Cargo.toml\n[package]\nname = \"my_program\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[lib]\ncrate-type = [\"cdylib\", \"lib\"]\n\n[dependencies]\nsolana-program = \"2.2\"\nborsh = \"1.5\"\nthiserror = \"1.0\"\n\n[dev-dependencies]\nlitesvm = \"0.6\"\nsolana-sdk = \"2.2\"\n\n[profile.release]\noverflow-checks = true   # trap on arithmetic overflow even in release\n" },
        { type: "callout", variant: "note", text: "`solana-program` is being **split into modular `solana-*` crates** — `solana-account-info`, `solana-pubkey`, `solana-program-entrypoint`, `solana-cpi`, `solana-instruction`, `solana-msg`, `solana-program-error`, etc. `solana-program` currently **re-exports** them, so `use solana_program::...` keeps working; new code can depend on the smaller crates directly to shrink build times and binary size." },
        { type: "heading", text: "Build & deploy" },
        { type: "code", lang: "bash", code: "cargo build-sbf                         # -> target/deploy/my_program.so + my_program-keypair.json\n\nsolana-keygen new                       # a payer wallet (if you don't have one)\nsolana config set --url devnet\nsolana airdrop 2\n\nsolana program deploy target/deploy/my_program.so   # prints the Program Id\nsolana program show <PROGRAM_ID>" }
      ]
    },
    {
      id: "structure",
      title: "Program structure & the entrypoint",
      level: "core",
      body: [
        { type: "p", text: "One macro is mandatory: `entrypoint!`. It wires the SBF loader to your handler. The handler signature is fixed — this is *the* function the runtime calls for every instruction routed to your program." },
        { type: "code", lang: "rust", code: "use solana_program::{\n    account_info::AccountInfo,\n    entrypoint,\n    entrypoint::ProgramResult,\n    msg,\n    pubkey::Pubkey,\n};\n\nentrypoint!(process_instruction);\n\npub fn process_instruction(\n    program_id: &Pubkey,        // this program's own address\n    accounts: &[AccountInfo],   // every account the tx handed this instruction\n    instruction_data: &[u8],    // raw bytes: your discriminator + Borsh args\n) -> ProgramResult {\n    msg!(\"my_program invoked with {} accounts\", accounts.len());\n    Ok(())                       // Ok(()) = success; Err(e) = revert the whole tx\n}" },
        { type: "list", items: [
          "**`program_id`** — your program's public key. Use it to derive/verify PDAs and to guard `invoke_signed`.",
          "**`accounts`** — a slice in the exact order the client listed them in the instruction. There are no named fields; order is your ABI.",
          "**`instruction_data`** — opaque bytes. *You* decide the encoding (convention: a leading discriminator byte/enum, then Borsh-encoded args).",
          "**`ProgramResult`** — `Result<(), ProgramError>`. Returning `Err` aborts and rolls back the entire transaction; nothing is persisted."
        ] },
        { type: "callout", variant: "tip", text: "`msg!` writes to the program log (visible in `solana logs`, explorers, and test output) — your only `println!`. It costs compute units and can be truncated by RPCs, so log sparingly in hot paths. `sol_log_compute_units()` prints remaining CUs for profiling." },
        { type: "callout", variant: "note", text: "Real programs split this up: `entrypoint.rs` (the macro), `processor.rs` (dispatch + handlers), `instruction.rs` (the instruction enum + builders), `state.rs` (Borsh structs), `error.rs` (custom errors). Anchor imposes this structure; natively you choose it." }
      ]
    },
    {
      id: "accounts",
      title: "The account model & AccountInfo",
      level: "core",
      body: [
        { type: "p", text: "Programs are stateless — **all** persistent data lives in accounts, and you can only touch accounts explicitly passed in. Each is an `AccountInfo`, a struct of references into runtime memory. There are no wrapper types doing checks for you: you read the fields and assert what you need." },
        { type: "table", headers: ["Field / method", "What it tells you"], rows: [
          ["`key: &Pubkey`", "The account's address."],
          ["`is_signer: bool`", "Did this account sign the transaction? (authority checks)"],
          ["`is_writable: bool`", "May you mutate its lamports/data? Writes to a read-only account fail."],
          ["`owner: &Pubkey`", "Which program owns it. Only the owner may change its data. **Check this.**"],
          ["`lamports: Rc<RefCell<&mut u64>>`", "Its SOL balance, via `account.lamports()` / `**account.try_borrow_mut_lamports()?`."],
          ["`data: Rc<RefCell<&mut [u8]>>`", "The raw byte buffer, via `account.data.borrow()` / `try_borrow_mut_data()`."],
          ["`executable: bool`", "Is it a program? `rent_epoch` is legacy."]
        ] },
        { type: "p", text: "Walk the slice with the `next_account_info` iterator — it returns `NotEnoughAccountKeys` if the client passed too few, so you don't index out of bounds." },
        { type: "code", lang: "rust", code: "use solana_program::account_info::{next_account_info, AccountInfo};\nuse solana_program::program_error::ProgramError;\n\nlet account_iter = &mut accounts.iter();\nlet payer = next_account_info(account_iter)?;      // accounts[0]\nlet state = next_account_info(account_iter)?;      // accounts[1]\nlet system_program = next_account_info(account_iter)?;\n\n// MANUAL checks — nothing does these for you:\nif !payer.is_signer {\n    return Err(ProgramError::MissingRequiredSignature);\n}\nif state.owner != program_id {\n    return Err(ProgramError::IllegalOwner);   // someone else's account\n}\nif !state.is_writable {\n    return Err(ProgramError::InvalidAccountData);\n}" },
        { type: "callout", variant: "gotcha", text: "The account **order** is your untyped ABI — the client must list accounts in exactly the order your `next_account_info` calls read them. Get it wrong and you validate/parse the wrong account. Document the order next to the instruction enum; Anchor's named `Accounts` struct is the thing you're giving up here." }
      ]
    },
    {
      id: "dispatch",
      title: "Instruction dispatch & data",
      level: "core",
      body: [
        { type: "p", text: "`instruction_data` is raw bytes; the universal convention is a leading **discriminator** (native programs typically use a single byte or a Borsh enum variant index) that selects the handler, followed by the Borsh-encoded arguments. Model your whole API as one enum and let Borsh do the parsing." },
        { type: "code", lang: "rust", code: "use borsh::{BorshDeserialize, BorshSerialize};\n\n// instruction.rs — the program's ABI as a single enum.\n#[derive(BorshSerialize, BorshDeserialize, Debug)]\npub enum CounterInstruction {\n    /// accounts: [payer(signer,writable), counter(writable), system_program]\n    Initialize { start: u64 },\n    /// accounts: [counter(writable), authority(signer)]\n    Increment { by: u64 },\n}" },
        { type: "code", lang: "rust", code: "// processor.rs — dispatch on the deserialized enum.\npub fn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    instruction_data: &[u8],\n) -> ProgramResult {\n    // Borsh reads the enum variant index (u32 LE) then the fields.\n    let ix = CounterInstruction::try_from_slice(instruction_data)\n        .map_err(|_| ProgramError::InvalidInstructionData)?;\n\n    match ix {\n        CounterInstruction::Initialize { start } => initialize(program_id, accounts, start),\n        CounterInstruction::Increment { by }     => increment(program_id, accounts, by),\n    }\n}" },
        { type: "callout", variant: "note", text: "Borsh serializes an enum discriminant as a **`u32` little-endian** index (0, 1, 2 …). Some programs instead hand-roll a `u8` tag and `split_first()` the byte before Borsh-decoding the rest — either works, but client and program must agree byte-for-byte. This tag is *your* discriminator; unlike Anchor there is no automatic 8-byte one." },
        { type: "callout", variant: "gotcha", text: "`try_from_slice` **fails if trailing bytes remain** in strict Borsh. If your client appends padding, or you're decoding a fixed-size prefix, use `BorshDeserialize::deserialize(&mut &data[..])` on the exact slice, or split the tag off first." }
      ]
    },
    {
      id: "state",
      title: "State, serialization, rent & discriminator",
      level: "core",
      body: [
        { type: "p", text: "Account data is a fixed-size `&mut [u8]` you own. You define a struct, `#[derive]` Borsh, and serialize it into `account.data`. Two things you must handle by hand that Anchor does for you: **sizing/rent** and (if you want type safety) a **discriminator**." },
        { type: "code", lang: "rust", code: "use borsh::{BorshDeserialize, BorshSerialize};\nuse solana_program::pubkey::Pubkey;\n\n#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]\npub struct Counter {\n    pub is_initialized: bool,  // 1  — your reinit/discriminator guard\n    pub authority: Pubkey,     // 32\n    pub count: u64,            // 8\n    pub bump: u8,              // 1  — store the canonical PDA bump\n}\nimpl Counter {\n    pub const LEN: usize = 1 + 32 + 8 + 1;  // fixed layout = 42 bytes\n}" },
        { type: "heading", text: "Creating the account (System Program CPI)" },
        { type: "p", text: "A brand-new account is created by a CPI to the **System Program**'s `create_account`: it allocates `space` bytes, funds the account to be **rent-exempt**, and assigns your program as owner. Compute the rent-exempt minimum from the `Rent` sysvar — under-funding fails the tx." },
        { type: "code", lang: "rust", code: "use solana_program::{\n    program::invoke,\n    rent::Rent,\n    system_instruction,\n    sysvar::Sysvar,\n};\n\nfn initialize(program_id: &Pubkey, accounts: &[AccountInfo], start: u64) -> ProgramResult {\n    let it = &mut accounts.iter();\n    let payer = next_account_info(it)?;\n    let counter = next_account_info(it)?;\n    let system_program = next_account_info(it)?;\n\n    let space = Counter::LEN;\n    let lamports = Rent::get()?.minimum_balance(space);   // rent-exempt reserve\n\n    invoke(\n        &system_instruction::create_account(\n            payer.key,          // funder\n            counter.key,        // new account\n            lamports,           // rent-exempt\n            space as u64,       // byte size (fixed forever unless realloc)\n            program_id,         // owner = this program\n        ),\n        &[payer.clone(), counter.clone(), system_program.clone()],\n    )?;\n\n    // Now write initial state into the freshly-allocated buffer.\n    let state = Counter { is_initialized: true, authority: *payer.key, count: start, bump: 0 };\n    state.serialize(&mut &mut counter.data.borrow_mut()[..])?;\n    Ok(())\n}" },
        { type: "heading", text: "Read / modify / write back" },
        { type: "code", lang: "rust", code: "fn increment(_program_id: &Pubkey, accounts: &[AccountInfo], by: u64) -> ProgramResult {\n    let it = &mut accounts.iter();\n    let counter = next_account_info(it)?;\n\n    // READ: deserialize the current bytes\n    let mut state = Counter::try_from_slice(&counter.data.borrow())?;\n    if !state.is_initialized { return Err(ProgramError::UninitializedAccount); }\n\n    // MODIFY\n    state.count = state.count.checked_add(by).ok_or(ProgramError::ArithmeticOverflow)?;\n\n    // WRITE BACK: serialize into the account buffer (forgetting this = no-op!)\n    state.serialize(&mut &mut counter.data.borrow_mut()[..])?;\n    Ok(())\n}" },
        { type: "list", items: [
          "**Fixed-size layout** (all scalars/`Pubkey`) → `LEN` is a constant. **Variable** fields (`String`/`Vec`) add a 4-byte length prefix and you must budget a `max_len`; the account size is still fixed at creation.",
          "**`Rent::get()?.minimum_balance(space)`** is the rent-exempt threshold. Below it, accounts used to be reaped; today creation simply requires it.",
          "**Discriminator:** natively there's no automatic 8 bytes. Either rely on the `owner == program_id` check (Solana guarantees only your program writes your accounts) plus an `is_initialized`/enum-tag first field to distinguish *your own* account types, or prepend an explicit tag byte."
        ] },
        { type: "callout", variant: "gotcha", text: "The classic native bug: mutating your local `state` struct and **forgetting to `serialize` it back**. The on-chain bytes never change and the write silently vanishes. Every state mutation must end with `state.serialize(&mut &mut acct.data.borrow_mut()[..])?`." }
      ]
    },
    {
      id: "pdas",
      title: "PDAs — Program Derived Addresses",
      level: "core",
      body: [
        { type: "p", text: "A **PDA** is a deterministic address derived from `seeds + program_id` that deliberately lies **off** the Ed25519 curve, so it has no private key. Two superpowers: clients can recompute the address, and the **program itself can sign** for it (via `invoke_signed`) — the basis of program-owned vaults and authorities." },
        { type: "code", lang: "rust", code: "use solana_program::pubkey::Pubkey;\n\n// Derivation searches bumps 255 -> 0; the FIRST valid (off-curve) one is canonical.\nlet (pda, bump) = Pubkey::find_program_address(\n    &[b\"counter\", authority.key.as_ref()],\n    program_id,\n);\n\n// Verify a passed-in PDA account matches what you expect:\nif counter.key != &pda {\n    return Err(ProgramError::InvalidSeeds);\n}" },
        { type: "p", text: "`find_program_address` iterates internally and can cost meaningful compute. Once derived, **store the canonical `bump`** in the account so later instructions can rebuild the address cheaply with `create_program_address` (no search) instead of paying for another scan." },
        { type: "code", lang: "rust", code: "// Cheap re-derivation when you already know the bump (e.g. state.bump):\nlet expected = Pubkey::create_program_address(\n    &[b\"counter\", authority.key.as_ref(), &[state.bump]],\n    program_id,\n)?;\nif counter.key != &expected { return Err(ProgramError::InvalidSeeds); }" },
        { type: "callout", variant: "gotcha", text: "**Always use and verify the canonical bump.** If you accept a `bump: u8` argument and feed it to `create_program_address` without checking it's the canonical one, an attacker can supply a *different* valid bump that derives a *different* account and slip past your seed check. Derive once, store the bump, and only ever use the stored value." },
        { type: "callout", variant: "note", text: "Seeds are byte slices, and multi-byte integer seeds must use an explicit endianness — the ecosystem convention is **little-endian** (`id.to_le_bytes()`). Client and program must encode seeds identically or the addresses won't match." }
      ]
    },
    {
      id: "cpi",
      title: "CPIs — invoke & invoke_signed",
      level: "core",
      body: [
        { type: "p", text: "A **Cross-Program Invocation** is one program calling another's instruction — how programs compose (System Program to move SOL/create accounts, Token Program to move tokens). You build an `Instruction` (program id + `AccountMeta`s + data) and call `invoke`; when a **PDA must sign**, use `invoke_signed` with its seeds + bump." },
        { type: "heading", text: "invoke — plain CPI" },
        { type: "code", lang: "rust", code: "use solana_program::{program::invoke, system_instruction};\n\n// Move SOL from a normal (signing) wallet via the System Program.\ninvoke(\n    &system_instruction::transfer(from.key, to.key, amount),\n    &[from.clone(), to.clone(), system_program.clone()],\n)?;" },
        { type: "heading", text: "invoke_signed — a PDA signs" },
        { type: "p", text: "When the funds/authority is a PDA (no private key), the runtime lets *your program* sign for it if you pass the exact seeds + bump used to derive it. The seeds prove the PDA belongs to this program." },
        { type: "code", lang: "rust", code: "use solana_program::program::invoke_signed;\n\nfn withdraw(program_id: &Pubkey, accounts: &[AccountInfo], amount: u64) -> ProgramResult {\n    let it = &mut accounts.iter();\n    let vault = next_account_info(it)?;        // the PDA holding SOL\n    let recipient = next_account_info(it)?;\n    let system_program = next_account_info(it)?;\n\n    let bump = /* stored */ 254u8;\n    let seeds: &[&[u8]] = &[b\"vault\", recipient.key.as_ref(), &[bump]];\n\n    invoke_signed(\n        &system_instruction::transfer(vault.key, recipient.key, amount),\n        &[vault.clone(), recipient.clone(), system_program.clone()],\n        &[seeds],                              // &[&[&[u8]]] — one signer's seed set\n    )?;\n    Ok(())\n}" },
        { type: "heading", text: "Building an arbitrary instruction" },
        { type: "code", lang: "rust", code: "use solana_program::instruction::{AccountMeta, Instruction};\n\nlet ix = Instruction {\n    program_id: target_program,\n    accounts: vec![\n        AccountMeta::new(writable_key, false),          // writable, not signer\n        AccountMeta::new_readonly(readonly_key, true),  // readonly, signer\n    ],\n    data: MyIx::Do { n: 5 }.try_to_vec()?,              // Borsh-encoded payload\n};\ninvoke(&ix, account_infos)?;" },
        { type: "callout", variant: "gotcha", text: "The `AccountInfo`s you pass to `invoke`/`invoke_signed` must include **every** account the callee touches (plus the callee program account itself in some SDK versions). A missing or wrong-order account, or a signer/writable flag that doesn't match the callee's `AccountMeta`, yields a cryptic `Cross-program invocation with unauthorized signer or writable account`." }
      ]
    },
    {
      id: "errors",
      title: "Custom errors & ProgramError",
      level: "core",
      body: [
        { type: "p", text: "Handlers return `Result<(), ProgramError>`. `ProgramError` has built-in variants (`MissingRequiredSignature`, `InvalidAccountData`, `ArithmeticOverflow`, `IllegalOwner`, …) plus `Custom(u32)` for your own. The idiom: a `#[derive(FromPrimitive)]` enum plus a `From<MyError> for ProgramError` conversion so `?` and `.into()` just work." },
        { type: "code", lang: "rust", code: "use solana_program::program_error::ProgramError;\nuse thiserror::Error;\n\n#[derive(Error, Debug, Copy, Clone)]\npub enum CounterError {\n    #[error(\"Account not initialized\")]\n    NotInitialized,\n    #[error(\"Not the authority\")]\n    Unauthorized,\n    #[error(\"Arithmetic overflow\")]\n    Overflow,\n}\n\n// Your enum variants become ProgramError::Custom(0), Custom(1), ...\nimpl From<CounterError> for ProgramError {\n    fn from(e: CounterError) -> Self {\n        ProgramError::Custom(e as u32)\n    }\n}" },
        { type: "code", lang: "rust", code: "// Now raise them ergonomically:\nif *authority.key != state.authority {\n    return Err(CounterError::Unauthorized.into());\n}\nstate.count = state.count.checked_add(by).ok_or(CounterError::Overflow)?;" },
        { type: "callout", variant: "note", text: "To let clients turn a `Custom(n)` code back into a readable name, implement `solana_program::decode_error::DecodeError` and `PrintProgramError` for the enum (often via a `num_derive::FromPrimitive` derive + `num_traits`). Anchor auto-numbers its errors at 6000 and generates this for you; natively the numbering (0, 1, 2 …) and decoding are yours to define and document." },
        { type: "callout", variant: "gotcha", text: "A returned `Custom(u32)` reaches the client as a bare number in the transaction error — there's no message unless you ship a decoder or the client has your enum. Keep a stable, documented mapping of code → meaning; renumbering variants silently changes your ABI." }
      ]
    },
    {
      id: "security",
      title: "Security checklist (by hand)",
      level: "core",
      body: [
        { type: "p", text: "The runtime is adversarial: anyone can pass any account, any data, and call any instruction in any order. Natively, every safety check is a line you must write — this is the same list Anchor enforces via constraints, done manually. Miss one and it's an exploit, not a compile error." },
        { type: "list", items: [
          "**Signer checks** — for any authority, assert `account.is_signer`, else `Err(ProgramError::MissingRequiredSignature)`. The #1 forgotten check.",
          "**Owner checks** — before trusting an account's data, assert `account.owner == program_id` (for your accounts) or the expected program's id (for token accounts, etc.). Otherwise an attacker crafts a look-alike account they own.",
          "**Signer/writable of program-owned data** — a data account you mutate must be `is_writable`; the authority must sign.",
          "**PDA & bump** — re-derive with `create_program_address` using the **stored canonical bump** and compare to `account.key`; never trust a caller-supplied bump.",
          "**Arithmetic** — use `checked_add`/`checked_sub`/`checked_mul` (and set `overflow-checks = true`); raw `+ - *` wraps silently in release.",
          "**Account validation** — verify keys of well-known programs (System, Token) rather than trusting whatever the client passed; assert `account.data_len()` matches your expected size before deserializing.",
          "**Reinitialization** — creating over an existing account, or `close`-then-recreate, can reset live state. Guard with an `is_initialized` flag: refuse to initialize a `true` account.",
          "**Duplicate mutable accounts** — if two same-type writable accounts must differ, assert `a.key != b.key`.",
          "**Type confusion** — with no 8-byte discriminator, guard against feeding account type A where B is expected: check the leading tag/`is_initialized` field or use distinct PDA seed prefixes per type."
        ] },
        { type: "code", lang: "rust", code: "// A minimal but complete guard block for a privileged instruction:\nif !authority.is_signer { return Err(ProgramError::MissingRequiredSignature); }\nif state_acct.owner != program_id { return Err(ProgramError::IllegalOwner); }\nif !state_acct.is_writable { return Err(ProgramError::InvalidAccountData); }\nlet state = Counter::try_from_slice(&state_acct.data.borrow())?;\nif !state.is_initialized { return Err(CounterError::NotInitialized.into()); }\nif state.authority != *authority.key { return Err(CounterError::Unauthorized.into()); }" },
        { type: "callout", variant: "warn", text: "The runtime only guarantees that **the owning program is the sole writer of an account's data** and that declared signers actually signed. Everything else — which account, whose authority, what shape — is on you. Treat every `AccountInfo` as attacker-controlled until you've checked owner, key, and signer." },
        { type: "link", url: "https://github.com/coral-xyz/sealevel-attacks", text: "sealevel-attacks — insecure vs secure native/Anchor examples for each vuln class" }
      ]
    },
    {
      id: "client",
      title: "Writing a client (Rust)",
      level: "core",
      body: [
        { type: "p", text: "With no IDL, the client hand-builds instructions: encode the same discriminator + Borsh args, list accounts in the exact order the program reads them, sign, and send. Use `solana-client`'s `RpcClient` for RPC and `solana-sdk` for keypairs/instructions/transactions. Share the `instruction.rs` enum and `state.rs` structs between program and client (same `lib` crate) so encoding can never drift." },
        { type: "code", lang: "rust", code: "use solana_client::rpc_client::RpcClient;\nuse solana_sdk::{\n    commitment_config::CommitmentConfig,\n    instruction::{AccountMeta, Instruction},\n    pubkey::Pubkey,\n    signature::{Keypair, Signer},\n    system_program,\n    transaction::Transaction,\n};\nuse borsh::{BorshDeserialize, BorshSerialize};\nuse my_program::{instruction::CounterInstruction, state::Counter};\n\nfn main() -> anyhow::Result<()> {\n    let rpc = RpcClient::new_with_commitment(\n        \"https://api.devnet.solana.com\".into(),\n        CommitmentConfig::confirmed(),\n    );\n    let program_id: Pubkey = \"YourProgramId1111111111111111111111111111111\".parse()?;\n    let payer = Keypair::new();   // in practice: read_keypair_file(\"~/.config/solana/id.json\")\n\n    rpc.request_airdrop(&payer.pubkey(), 1_000_000_000)?;   // devnet only\n\n    // Derive the same PDA the program uses.\n    let (counter, _bump) = Pubkey::find_program_address(\n        &[b\"counter\", payer.pubkey().as_ref()],\n        &program_id,\n    );\n\n    // Build the instruction: data = Borsh(enum), accounts in program order.\n    let data = CounterInstruction::Initialize { start: 0 }.try_to_vec()?;\n    let ix = Instruction {\n        program_id,\n        accounts: vec![\n            AccountMeta::new(payer.pubkey(), true),          // signer, writable\n            AccountMeta::new(counter, false),                // writable\n            AccountMeta::new_readonly(system_program::ID, false),\n        ],\n        data,\n    };\n\n    // Sign, send, confirm.\n    let bh = rpc.get_latest_blockhash()?;\n    let tx = Transaction::new_signed_with_payer(\n        &[ix], Some(&payer.pubkey()), &[&payer], bh,\n    );\n    let sig = rpc.send_and_confirm_transaction(&tx)?;\n    println!(\"confirmed: {sig}\");\n\n    // Read the account back and Borsh-deserialize it.\n    let acct = rpc.get_account(&counter)?;\n    let state = Counter::try_from_slice(&acct.data)?;\n    println!(\"count = {}\", state.count);\n    Ok(())\n}" },
        { type: "callout", variant: "tip", text: "Bump the compute budget when needed by prepending `ComputeBudgetInstruction::set_compute_unit_limit(n)` (and `set_compute_unit_price` for priority fees) from `solana-sdk` before your instruction in the same transaction." },
        { type: "callout", variant: "note", text: "Other language clients work identically against a native program — you just re-encode the discriminator + Borsh args by hand (JS via `@solana/kit`/`@solana/web3.js`, Go via `solana-go`). Tools like **Codama** can generate typed clients if you publish an IDL, but native programs don't emit one automatically the way Anchor does." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "core",
      body: [
        { type: "p", text: "Same layering as Anchor, minus the framework: push logic into pure functions for instant `cargo test`, then exercise the compiled `.so` in a fast in-process VM. No IDL/TS layer is required." },
        { type: "table", headers: ["Layer", "Speed", "Use for", "Run with"], rows: [
          ["`#[cfg(test)]` unit", "instant", "math, validation, Borsh round-trips (host target)", "`cargo test`"],
          ["mollusk-svm", "very fast", "one instruction, account transforms, CU budgets, fuzzing", "`cargo test-sbf`"],
          ["LiteSVM", "fast", "multi-instruction flows, PDAs, CPIs, full tx", "`cargo test-sbf`"],
          ["solana-program-test (BanksClient)", "moderate", "older harness, closer to validator semantics", "`cargo test-sbf`"]
        ] },
        { type: "heading", text: "Pure unit tests — no runtime" },
        { type: "code", lang: "rust", code: "#[cfg(test)]\nmod tests {\n    use super::*;\n    use borsh::BorshSerialize;\n\n    #[test]\n    fn borsh_roundtrip() {\n        let c = Counter { is_initialized: true, authority: Pubkey::new_unique(), count: 7, bump: 254 };\n        let bytes = c.try_to_vec().unwrap();\n        assert_eq!(bytes.len(), Counter::LEN);\n        let back = Counter::try_from_slice(&bytes).unwrap();\n        assert_eq!(back.count, 7);\n    }\n}" },
        { type: "heading", text: "LiteSVM — in-process VM" },
        { type: "p", text: "`litesvm` loads your compiled `.so` and runs real transactions with no validator (10–100× faster than `solana-test-validator`). Build first (`cargo build-sbf`), then drive it exactly like a client." },
        { type: "code", lang: "rust", code: "use litesvm::LiteSVM;\nuse solana_sdk::{signature::Keypair, signer::Signer, transaction::Transaction};\n\n#[test]\nfn initializes() {\n    let mut svm = LiteSVM::new();\n    let program_id = my_program::ID;\n    svm.add_program_from_file(program_id, \"target/deploy/my_program.so\").unwrap();\n\n    let payer = Keypair::new();\n    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();\n\n    let ix = /* build Instruction as in the client */;\n    let tx = Transaction::new_signed_with_payer(\n        &[ix], Some(&payer.pubkey()), &[&payer], svm.latest_blockhash());\n    assert!(svm.send_transaction(tx).is_ok());\n\n    let acct = svm.get_account(&counter_pda).unwrap();\n    let state = Counter::try_from_slice(&acct.data).unwrap();\n    assert_eq!(state.count, 0);\n}" },
        { type: "heading", text: "mollusk-svm — one instruction" },
        { type: "code", lang: "rust", code: "use mollusk_svm::{Mollusk, result::Check};\n\n#[test]\nfn increment_adds_one() {\n    let mollusk = Mollusk::new(&my_program::ID, \"target/deploy/my_program\");\n    mollusk.process_and_validate_instruction(\n        &increment_ix,\n        &[(counter_pubkey, counter_account), (authority_pubkey, authority_account)],\n        &[Check::success(), Check::compute_units(3_000)],\n    );\n}" },
        { type: "callout", variant: "gotcha", text: "LiteSVM/Mollusk/BanksClient load the compiled `target/deploy/*.so`, **not** your source — a stale build tests old bytecode and passes/fails misleadingly. Always `cargo build-sbf` (or `cargo test-sbf`, which builds first) after changing the program; a plain `cargo test` won't rebuild the SBF binary." }
      ]
    },
    {
      id: "pinocchio",
      title: "Pinocchio — zero-dependency, zero-copy",
      level: "deep",
      body: [
        { type: "p", text: "**Pinocchio** (from anza-xyz) is a modern, **zero-dependency** replacement for `solana-program`. It re-implements the entrypoint, `AccountInfo`, `Pubkey`, CPI, etc. with a **zero-copy** design that reads accounts directly from the runtime input buffer instead of allocating. Result: dramatically **smaller binaries** and **fewer compute units** — it's what performance-critical programs (and many SPL programs) are migrating to." },
        { type: "list", items: [
          "**Why it's cheaper:** no `solana-program` dependency tree, no eager deserialization of the input region — it parses accounts lazily/in place, cutting both `.so` size and CU cost of the entrypoint.",
          "**Its own entrypoint macro:** `pinocchio::entrypoint!` (or `program_entrypoint!`/`lazy_program_entrypoint!`) with the same `(&Pubkey, &[AccountInfo], &[u8]) -> ProgramResult` shape, but Pinocchio's own types.",
          "**Companion crates:** `pinocchio-system` and `pinocchio-token` give lightweight CPI helpers for the System and Token programs (equivalents of the `solana_program` instruction builders).",
          "**Trade-off:** a leaner, lower-level API — fewer conveniences, more manual byte handling, and it's newer, so some helpers you'd reach for in `solana-program` you write yourself."
        ] },
        { type: "code", lang: "rust", code: "use pinocchio::{\n    account_info::AccountInfo, entrypoint, program_error::ProgramError,\n    pubkey::Pubkey, ProgramResult,\n};\n\nentrypoint!(process_instruction);\n\npub fn process_instruction(\n    _program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    data: &[u8],\n) -> ProgramResult {\n    let (tag, _rest) = data.split_first().ok_or(ProgramError::InvalidInstructionData)?;\n    match tag {\n        0 => { /* handler */ Ok(()) }\n        _ => Err(ProgramError::InvalidInstructionData),\n    }\n}" },
        { type: "callout", variant: "tip", text: "**When to reach for Pinocchio:** you're CU- or size-bound (oracles, AMMs, anything invoked at high frequency), or shipping a program where every byte of the `.so` and every compute unit matters. For typical apps, `solana-program` (or Anchor) is more ergonomic; Pinocchio is the optimization tier." },
        { type: "link", url: "https://github.com/anza-xyz/pinocchio", text: "anza-xyz/pinocchio — the crate, entrypoints, and system/token companions" }
      ]
    },
    {
      id: "deploy",
      title: "Deploy & upgrade",
      level: "deep",
      body: [
        { type: "p", text: "`cargo build-sbf` emits `target/deploy/my_program.so` and a **program keypair** (`my_program-keypair.json`) whose public key is the Program Id. `solana program deploy` uploads the `.so` into an on-chain program account controlled by an **upgrade authority** (your wallet by default). Programs are upgradeable by default — power and risk." },
        { type: "code", lang: "bash", code: "solana config set --url devnet\nsolana airdrop 2\ncargo build-sbf\n\n# first deploy — Program Id comes from target/deploy/my_program-keypair.json\nsolana program deploy target/deploy/my_program.so\n\n# upgrade in place (same Program Id, new bytecode)\nsolana program deploy target/deploy/my_program.so --program-id target/deploy/my_program-keypair.json\n\n# inspect\nsolana program show <PROGRAM_ID>\n\n# make immutable — IRREVERSIBLE\nsolana program set-upgrade-authority <PROGRAM_ID> --final" },
        { type: "list", items: [
          "**Buffers:** a deploy writes the bytecode to a temporary **buffer account** first, then swaps it into the program account. A failed/interrupted deploy can leave an orphaned buffer holding rent — recover it with `solana program close <BUFFER> --recipient <WALLET>` or list with `solana program show --buffers`.",
          "**Cost** scales with binary size (you pay rent for the program data account); this is a concrete reason native/Pinocchio's smaller `.so` saves money.",
          "**Keys:** guard the program keypair (defines the Id) and the upgrade authority. Lose the authority → you can never upgrade; leak it → anyone can replace your code. For production, move the upgrade authority to a **multisig** (e.g. Squads).",
          "**`--final`** removes upgradeability forever — do it only when you truly want immutability."
        ] },
        { type: "callout", variant: "note", text: "The `entrypoint!`-declared program has no built-in `declare_id!` equivalent, but exposing a `solana_program::declare_id!(\"...\")` in your crate gives you a `crate::ID` constant for clients/tests. Keep it in sync with the deployed keypair — unlike Anchor there's no `keys sync` command, so it's a manual constant." }
      ]
    },
    {
      id: "native-vs-anchor",
      title: "Native vs Anchor, line by line",
      level: "deep",
      body: [
        { type: "p", text: "Concretely, here's what Anchor's macros generate that you write by hand natively. Reading this maps every Anchor convenience back to the primitive it hides." },
        { type: "table", headers: ["Concern", "Anchor gives you", "Native: you do"], rows: [
          ["Entrypoint/dispatch", "`#[program]` routes by 8-byte method discriminator", "`entrypoint!` + `match` on your own tag/enum"],
          ["Account parsing", "`#[derive(Accounts)]` typed struct", "`next_account_info` + manual field reads"],
          ["Signer check", "`Signer<'info>`", "`if !acct.is_signer { return Err(..) }`"],
          ["Owner/type check", "`Account<'info, T>` checks owner + discriminator", "`if acct.owner != program_id` + tag guard"],
          ["Discriminator", "8-byte type hash auto-added", "none (or your own leading tag byte)"],
          ["Space/rent", "`init, payer, space = 8 + T::INIT_SPACE`", "`Rent::get()?.minimum_balance(LEN)` + `create_account` CPI"],
          ["(De)serialization", "automatic on `ctx.accounts`", "explicit `try_from_slice` / `serialize`"],
          ["PDA verify", "`seeds = [..], bump` constraint", "`create_program_address` + compare"],
          ["CPI signing", "`CpiContext::new_with_signer(..)`", "`invoke_signed(&ix, infos, &[seeds])`"],
          ["Errors", "`#[error_code]` auto-numbered at 6000", "enum + `From<E> for ProgramError` (`Custom(n)`)"],
          ["Client", "IDL + typed TS/Rust client", "hand-built `Instruction` + shared Borsh types"]
        ] },
        { type: "callout", variant: "tip", text: "You can mix approaches: some teams write the hot path natively (or in Pinocchio) for CU savings while keeping Anchor for the rest, or generate an IDL for a native program with tooling so clients still get types. Native isn't all-or-nothing." }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "The frictions specific to hand-written programs — mostly the checks and serialization steps that Anchor would have done for you, plus the runtime's hard limits." },
        { type: "heading", text: "1. Borsh size / layout mismatch" },
        { type: "callout", variant: "gotcha", text: "If your struct's serialized size doesn't match the account's allocated space, writes truncate or `try_from_slice` fails with `InvalidAccountData`/`Unexpected length of input`. Keep a `LEN` constant, allocate exactly `LEN` at `create_account`, and add a `#[test]` asserting `try_to_vec().len() == LEN`. Reordering or changing field types silently changes the on-chain layout — it's an ABI break." },
        { type: "heading", text: "2. Forgetting to serialize back" },
        { type: "p", text: "Mutating your local deserialized struct does nothing on-chain until you write it back. Every state change must end with `state.serialize(&mut &mut acct.data.borrow_mut()[..])?`. This is the single most common reason a native instruction \"does nothing.\"" },
        { type: "heading", text: "3. Rent / space" },
        { type: "callout", variant: "warn", text: "Under-funding `create_account` below `Rent::get()?.minimum_balance(space)` fails the tx. Growing an account later needs a `realloc` (`AccountInfo::realloc`) *and* topping up lamports to stay rent-exempt — the size you pick at creation is otherwise permanent." },
        { type: "heading", text: "4. Missing signer / owner checks" },
        { type: "callout", variant: "warn", text: "There is no compile error for a forgotten `is_signer` or `owner == program_id` check — just an exploit. Treat the security checklist section as a per-instruction checklist; the runtime only guarantees the owning program is the sole writer and that declared signers signed." },
        { type: "heading", text: "5. Compute-unit, stack & transaction limits" },
        { type: "list", items: [
          "~**200k CUs** default per instruction (max 1.4M, raise with a `ComputeBudget` instruction). `find_program_address` loops and big (de)serialization are common budget sinks — store the bump, keep structs lean, log `sol_log_compute_units()`.",
          "The BPF **stack frame is ~4KB**; large local buffers/arrays overflow it (`Access violation`). Box big buffers onto the ~32KB heap.",
          "**Transaction size ~1232 bytes** total — too many accounts or too much instruction data won't fit. Use Address Lookup Tables for many accounts, or split into multiple instructions."
        ] },
        { type: "heading", text: "6. Stale data after a CPI" },
        { type: "callout", variant: "gotcha", text: "After a CPI mutates an account (e.g. a token transfer), a copy you deserialized *before* the CPI is stale. Re-read from `acct.data.borrow()` after the CPI, or deserialize only after all CPIs complete. Also mind that lamport/data `RefCell` borrows must be dropped before a CPI that touches the same account, or you'll hit a borrow panic." },
        { type: "heading", text: "7. Endianness of seeds & discriminators" },
        { type: "callout", variant: "gotcha", text: "PDA seeds and any integer tags are raw bytes — client and program must agree on endianness. The convention is **little-endian** (`x.to_le_bytes()`); a mismatch means the client derives a different PDA than the program checks, and every instruction fails `InvalidSeeds`. Borsh itself is little-endian, so keep seeds consistent with it." }
      ]
    }
  ],

  packages: [
    { name: "solana-program", why: "core on-chain SDK: entrypoint!, AccountInfo, Pubkey, invoke/invoke_signed, Rent, sysvars, ProgramError (being split into modular solana-* crates it re-exports)" },
    { name: "solana-account-info", why: "modular crate: AccountInfo + next_account_info (re-exported by solana-program)" },
    { name: "solana-pubkey", why: "modular crate: Pubkey, find_program_address, create_program_address" },
    { name: "solana-program-entrypoint", why: "modular crate: the entrypoint! macro + ProgramResult" },
    { name: "solana-cpi", why: "modular crate: invoke / invoke_signed for cross-program invocations" },
    { name: "borsh", why: "the serialization format for instruction data and account state (#[derive(BorshSerialize, BorshDeserialize)], try_from_slice, try_to_vec)" },
    { name: "thiserror", why: "ergonomic custom error enums that convert into ProgramError::Custom" },
    { name: "num-derive / num-traits", why: "FromPrimitive derive to decode ProgramError::Custom(n) back into named errors on the client" },
    { name: "pinocchio", why: "zero-dependency, zero-copy replacement for solana-program — smaller binary, fewer CUs" },
    { name: "pinocchio-system / pinocchio-token", why: "lightweight System/Token CPI helpers for Pinocchio programs" },
    { name: "solana-client", why: "RpcClient for the Rust client — send_and_confirm_transaction, get_account, request_airdrop" },
    { name: "solana-sdk", why: "off-chain types for the client & tests: Keypair, Signer, Instruction, Transaction, AccountMeta, ComputeBudget" },
    { name: "litesvm", why: "fast in-process SVM for Rust integration tests against the compiled .so" },
    { name: "mollusk-svm", why: "single-instruction test harness with compute-unit checks / benchmarking / fuzzing" },
    { name: "solana-program-test", why: "older BanksClient-based program test framework (closer to validator semantics)" },
    { name: "solana-cli (Anza)", why: "cargo build-sbf, keygen, airdrop, config, program deploy/show/close" }
  ],

  gotchas: [
    "**Forgetting to `serialize` state back** into `acct.data` after mutating your local struct — the write silently vanishes and the instruction appears to do nothing.",
    "**Missing signer check** — no `if !acct.is_signer` means anyone can act as the authority. There's no compile error, only an exploit.",
    "**Missing owner check** — trusting `acct.data` without `acct.owner == program_id` lets an attacker pass a look-alike account they control. Anchor's `Account<T>` does this for you; natively you don't get it.",
    "**Borsh layout/size mismatch** — allocated space must equal the serialized size; reordering or retyping fields is a silent ABI break. Keep a `LEN` const and a round-trip `#[test]`.",
    "**Under-funding rent** — `create_account` must supply `Rent::get()?.minimum_balance(space)` or the tx fails; account size is fixed at creation unless you `realloc` + top up.",
    "**Non-canonical PDA bump** — accepting a caller-supplied `bump` and feeding it to `create_program_address` without checking lets an attacker derive a different account. Store and reuse the canonical bump.",
    "**Seed endianness mismatch** — integer seeds/tags are raw bytes; client and program must both use `to_le_bytes()` or the PDA won't match (`InvalidSeeds`).",
    "**Raw arithmetic overflow** — `+ - *` on lamports/amounts wraps silently in release. Use `checked_*` and set `overflow-checks = true`.",
    "**`try_from_slice` trailing-bytes error** — strict Borsh rejects extra bytes; split the discriminator off first or deserialize the exact slice.",
    "**Wrong account order** — the account slice is an untyped ABI; the client must list accounts in the exact order `next_account_info` reads them, or you validate the wrong account.",
    "**Reinitialization** — creating over an existing (or closed-then-recreated) account resets live state. Guard with an `is_initialized` flag.",
    "**Stale copy after a CPI** — an account you deserialized before a CPI is out of date after it; re-read afterward. Also drop `RefCell` borrows before a CPI on the same account.",
    "**~4KB stack overflow** — large local buffers/arrays blow the BPF stack (`Access violation`); heap-allocate big data.",
    "**Exceeding ~200k CUs** — `find_program_address` scans and heavy (de)serialization burn budget; store bumps, trim structs, or raise the limit client-side.",
    "**Stale `.so` in tests** — LiteSVM/Mollusk/BanksClient load `target/deploy/*.so`; forgetting `cargo build-sbf` tests old bytecode. Use `cargo test-sbf`.",
    "**`declare_id!` / keypair drift** — no `keys sync` natively; the `crate::ID` constant must be kept in sync with the deployed program keypair by hand."
  ],

  flashcards: [
    { q: "What is the fixed native entrypoint signature?", a: "`process_instruction(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult`, wired up by `entrypoint!(process_instruction)`. `ProgramResult` is `Result<(), ProgramError>`." },
    { q: "How do you read accounts safely in a native program?", a: "Iterate with `next_account_info(&mut accounts.iter())` (errors on too few accounts) and manually check `is_signer`, `is_writable`, and `owner` on each `AccountInfo`. Order is your untyped ABI." },
    { q: "How is instruction data decoded natively, and what is the discriminator?", a: "You pick the encoding — convention is a leading tag (a Borsh enum variant index, serialized as u32 LE, or a hand-rolled u8) then Borsh args. Deserialize the whole thing with `Instruction::try_from_slice` and `match`. There is no automatic 8-byte discriminator like Anchor's." },
    { q: "How do you create a program-owned account by hand?", a: "CPI to the System Program: `invoke(&system_instruction::create_account(payer, new, lamports, space, program_id), infos)` where `lamports = Rent::get()?.minimum_balance(space)`. Then serialize initial state into `new.data`." },
    { q: "Why must every state mutation end with a serialize call?", a: "Mutating the deserialized local struct doesn't touch the on-chain bytes. You must write it back: `state.serialize(&mut &mut acct.data.borrow_mut()[..])?`. Forgetting this is the classic 'instruction does nothing' native bug." },
    { q: "What is a PDA and how do you derive/verify one natively?", a: "A Program Derived Address — deterministic from seeds + program_id, forced off the Ed25519 curve (no private key). Derive with `Pubkey::find_program_address(seeds, program_id)` (returns address + canonical bump); cheaply re-verify with `create_program_address(seeds + [bump], program_id)` using the stored bump." },
    { q: "Difference between `invoke` and `invoke_signed`?", a: "`invoke` makes a CPI signed by the transaction's real signers. `invoke_signed` additionally lets the program sign for its PDAs by passing the PDA's seeds + bump (`&[&[&[u8]]]`) — how a program-owned vault authorizes transfers." },
    { q: "How are custom errors done without Anchor's `#[error_code]`?", a: "Define an enum, `impl From<MyError> for ProgramError { fn from(e) -> Self { ProgramError::Custom(e as u32) } }`, then raise with `.into()` or `.ok_or(MyError::X)?`. Optionally implement `DecodeError`/`FromPrimitive` so clients can name the code." },
    { q: "What runtime guarantees does Solana give, and what must you check yourself?", a: "The runtime only guarantees the owning program is the sole writer of an account's data and that declared signers actually signed. You must manually check owner, key, signer, PDA/bump, arithmetic, account shape, and reinitialization." },
    { q: "How do you write a Rust client for a native program?", a: "Use `solana-client` `RpcClient` + `solana-sdk`: build an `Instruction` (program id, `AccountMeta`s in program order, Borsh-encoded data), sign a `Transaction`, `send_and_confirm_transaction`, then `get_account` + `try_from_slice` to read state. Share the instruction/state types from the program crate." },
    { q: "What are the native testing layers?", a: "(1) `#[cfg(test)]` unit tests of pure logic/Borsh via `cargo test`; (2) mollusk-svm — one instruction + CU checks; (3) LiteSVM — in-process VM for multi-instruction flows; (4) older solana-program-test/BanksClient. SVM tests load the compiled `.so`, so run `cargo test-sbf`." },
    { q: "What is Pinocchio and when do you use it?", a: "A zero-dependency, zero-copy replacement for `solana-program` from anza-xyz that reads accounts in place from the input buffer — smaller binaries and fewer CUs. Use it when you're size- or compute-bound (oracles, high-frequency DeFi); it's the optimization tier below `solana-program`/Anchor." },
    { q: "How do you deploy and upgrade a native program?", a: "`cargo build-sbf` -> `solana program deploy target/deploy/x.so` (Program Id = the program keypair). Upgrade in place with `--program-id <keypair>` (same Id, new bytecode); the upgrade authority controls it. `set-upgrade-authority --final` makes it immutable." },
    { q: "Why does a stale `.so` make LiteSVM/Mollusk tests misleading?", a: "They load `target/deploy/*.so`, not your source. Without `cargo build-sbf`, the test runs old bytecode. Use `cargo test-sbf`, which builds the SBF binary first." },
    { q: "What are the native program's hard runtime limits?", a: "~200k CUs default per instruction (max 1.4M), ~4KB BPF stack frame, ~32KB heap, and ~1232-byte total transaction size. Store PDA bumps, trim structs, heap-allocate big buffers, and use lookup tables for many accounts." },
    { q: "What does Anchor auto-generate that you write by hand natively?", a: "Instruction dispatch/discriminator, typed account parsing + owner/signer/type checks, the 8-byte discriminator, space/rent + create_account, (de)serialization, PDA verification, CPI signing wrappers, error numbering, and the IDL/typed client." }
  ],

  cheatsheet: [
    { label: "New program crate", code: "cargo new --lib my_program  # crate-type = [\"cdylib\", \"lib\"]" },
    { label: "Entrypoint", code: "entrypoint!(process_instruction);" },
    { label: "Read an account", code: "let a = next_account_info(&mut accounts.iter())?;" },
    { label: "Signer check", code: "if !a.is_signer { return Err(ProgramError::MissingRequiredSignature); }" },
    { label: "Owner check", code: "if a.owner != program_id { return Err(ProgramError::IllegalOwner); }" },
    { label: "Decode instruction", code: "let ix = MyIx::try_from_slice(instruction_data)?;" },
    { label: "Rent-exempt lamports", code: "let l = Rent::get()?.minimum_balance(space);" },
    { label: "Create account (CPI)", code: "invoke(&system_instruction::create_account(payer,new,l,space,program_id), infos)?;" },
    { label: "Write state back", code: "state.serialize(&mut &mut acct.data.borrow_mut()[..])?;" },
    { label: "Derive PDA", code: "let (pda, bump) = Pubkey::find_program_address(&[b\"v\", k.as_ref()], program_id);" },
    { label: "PDA-signed CPI", code: "invoke_signed(&ix, infos, &[&[b\"v\", k.as_ref(), &[bump]]])?;" },
    { label: "Custom error", code: "ProgramError::Custom(MyError::X as u32)" },
    { label: "Checked math", code: "x.checked_add(y).ok_or(MyError::Overflow)?" },
    { label: "Build + deploy", code: "cargo build-sbf && solana program deploy target/deploy/my_program.so" },
    { label: "Run SVM tests", code: "cargo test-sbf" },
    { label: "Client: send tx", code: "rpc.send_and_confirm_transaction(&tx)?;" }
  ]
});
