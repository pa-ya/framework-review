(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "rust-anchor",
  name: "Anchor",
  language: "Rust · Solana",
  tagline: "The **Rust framework for Solana on-chain programs** — macros that turn account validation, (de)serialization and IDL/client generation into boilerplate you don't write.",
  color: "#9945FF",
  readMinutes: 23,
  group: "Rust",

  sections: [
    {
      id: "overview",
      title: "Overview & when to use",
      level: "core",
      body: [
        { type: "p", text: "Anchor is a framework for writing **Solana programs** (Solana's name for smart contracts) in Rust. It is **not** a web/backend framework — it compiles to an on-chain BPF/SBF binary that runs inside the Solana runtime. Anchor's value is a set of macros that replace the huge amount of manual, error-prone boilerplate you'd write in a native Solana program: account deserialization, ownership/signer checks, discriminators, and a typed client." },
        { type: "list", items: [
          "**Reach for it when:** you're building any non-trivial Solana program (DeFi, NFTs, escrows, governance) and want security checks + a TypeScript client for free.",
          "**Mental model:** Solana separates **code** (stateless programs) from **state** (accounts). Every instruction must be handed *every* account it will touch, up front. Anchor's `#[derive(Accounts)]` structs are where you declare and validate those accounts.",
          "**The big idea:** you describe *what must be true* about the accounts (constraints), and Anchor generates the runtime checks + an **IDL** (interface description) that drives the JS client."
        ] },
        { type: "callout", variant: "note", text: "This covers **Anchor 1.0.x** with the **Anza** Solana CLI (Anchor 1.0 recommends `solana-cli 3.1.x`) and the TS client. The org moved from `coral-xyz` to `solana-foundation`; the `anchor-lang` Rust crate name is unchanged, but Anchor 1.0 renamed the TypeScript client from `@coral-xyz/anchor` to the new `@anchor-lang/core` package." }
      ]
    },
    {
      id: "setup",
      title: "Toolchain & project setup",
      level: "core",
      body: [
        { type: "p", text: "Four tools: **Rust**, the **Solana CLI** (Anza), **Anchor** (via `avm`, the Anchor Version Manager), and **Node/Yarn** for tests. There's a one-liner that installs everything, or install each piece." },
        { type: "code", lang: "bash", code: "# One-line installer (Rust + Solana CLI + Anchor + Node) on Mac/Linux:\ncurl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash\n\n# ...or piece by piece:\ncurl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y   # Rust\nsh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\"             # Solana CLI (Anza)\n\n# Anchor via avm (Anchor Version Manager):\ncargo install --git https://github.com/solana-foundation/anchor avm --force\navm install latest\navm use latest\n\n# verify\nrustc --version        # 1.85.0\nsolana --version       # solana-cli 3.1.10 (Agave/Anza — the version Anchor 1.0 recommends)\nanchor --version       # anchor-cli 1.0.2" },
        { type: "callout", variant: "tip", text: "`avm` lets you pin per-project versions: `avm install 0.31.1 && avm use 0.31.1`. Anchor's on-chain layout can change between minor versions, so match the version the project was built with." },
        { type: "heading", text: "Create, build, test, deploy" },
        { type: "code", lang: "bash", code: "anchor init my_program        # scaffold workspace\ncd my_program\n\nanchor build                  # compile program -> target/deploy/*.so + IDL\nanchor test                   # spins up a local validator, deploys, runs TS tests\nanchor deploy                 # deploy to the cluster in Anchor.toml\n\n# a standalone local validator (persistent) for manual poking:\nsolana-test-validator\nsolana config set --url localhost" },
        { type: "heading", text: "Workspace layout & Anchor.toml" },
        { type: "code", lang: "bash", code: "my_program/\n  Anchor.toml           # workspace + cluster + program IDs config\n  Cargo.toml            # Rust workspace\n  programs/\n    my_program/\n      Cargo.toml\n      src/lib.rs        # <- your program\n  tests/\n    my_program.ts       # Mocha/TS integration tests\n  target/\n    idl/my_program.json # generated IDL\n    types/my_program.ts # generated TS types\n  migrations/deploy.ts\n  Anchor.toml" },
        { type: "code", lang: "toml", code: "[toolchain]\nanchor_version = \"1.0.2\"\n\n[features]\nresolution = true\nskip-lint = false\n\n[programs.localnet]\nmy_program = \"Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS\"\n\n[registry]\nurl = \"https://api.apr.dev\"\n\n[provider]\ncluster = \"Localnet\"           # Localnet | Devnet | Mainnet\nwallet = \"~/.config/solana/id.json\"\n\n[scripts]\ntest = \"yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts\"" }
      ]
    },
    {
      id: "structure",
      title: "Program anatomy: the four macros",
      level: "core",
      body: [
        { type: "p", text: "Almost every Anchor program is built from four macros. Learn these and the rest is detail." },
        { type: "table", headers: ["Macro", "Role"], rows: [
          ["`declare_id!`", "The program's on-chain address (public key). Anchor checks the deployed ID matches."],
          ["`#[program]`", "The module whose `pub fn`s become the program's **instructions**."],
          ["`#[derive(Accounts)]`", "A struct listing + **validating** every account an instruction touches."],
          ["`#[account]`", "Marks a struct as a program-owned **data account** (adds the 8-byte discriminator + (de)serialization)."]
        ] },
        { type: "code", lang: "rust", code: "use anchor_lang::prelude::*;\n\ndeclare_id!(\"Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS\");\n\n#[program]\npub mod hello_anchor {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {\n        ctx.accounts.new_account.data = data;\n        msg!(\"Changed data to: {}!\", data);   // prints to program logs\n        Ok(())\n    }\n}\n\n// Which accounts must `initialize` receive, and what must be true of them?\n#[derive(Accounts)]\npub struct Initialize<'info> {\n    #[account(init, payer = signer, space = 8 + 8)]\n    pub new_account: Account<'info, NewAccount>,\n    #[account(mut)]\n    pub signer: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}\n\n// The on-chain data layout for this account type.\n#[account]\npub struct NewAccount {\n    pub data: u64,\n}" },
        { type: "callout", variant: "note", text: "`declare_id!` must match the keypair in `target/deploy/<name>-keypair.json`. `anchor build` writes the correct ID; if you ever see a `DeclaredProgramIdMismatch`, run `anchor keys sync`." }
      ]
    },
    {
      id: "accounts",
      title: "The Accounts model & account types",
      level: "core",
      body: [
        { type: "p", text: "Solana programs are stateless. **All state lives in accounts**, and a program can only read/write accounts explicitly passed into the instruction. The `Accounts` struct is where you name each account and pick a **wrapper type** that encodes what kind of account it is — the wrapper drives the checks Anchor performs." },
        { type: "table", headers: ["Type", "What it asserts / gives you"], rows: [
          ["`Account<'info, T>`", "Account owned by this program, deserialized into your `#[account]` struct `T`. Checks owner + discriminator."],
          ["`Signer<'info>`", "The account signed the transaction. No data access — just the signature check."],
          ["`SystemAccount<'info>`", "Account owned by the **System Program** (a plain wallet / not-yet-initialized account)."],
          ["`Program<'info, T>`", "The account is a specific program (e.g. `System`, `Token`). Checks the address + executable flag."],
          ["`AccountInfo<'info>` / `UncheckedAccount<'info>`", "Raw account, **no checks**. You must validate it yourself. `UncheckedAccount` requires a `/// CHECK:` doc comment."],
          ["`Account<'info, Mint>` / `TokenAccount`", "From `anchor_spl` — SPL token mint / token account wrappers."]
        ] },
        { type: "callout", variant: "warn", text: "`AccountInfo` / `UncheckedAccount` are escape hatches with **zero validation** — the #1 source of Solana exploits. Every one needs a `/// CHECK:` comment explaining why it's safe, and you must manually verify owner/key/signer as appropriate." },
        { type: "code", lang: "rust", code: "#[derive(Accounts)]\npub struct Example<'info> {\n    pub authority: Signer<'info>,                     // must sign\n    #[account(mut)]\n    pub state: Account<'info, MyState>,              // program-owned, mutable\n    pub wallet: SystemAccount<'info>,               // a normal wallet\n    pub token_program: Program<'info, Token>,       // the SPL Token program\n    /// CHECK: only used as the recipient address; not read or written\n    pub recipient: UncheckedAccount<'info>,\n}" }
      ]
    },
    {
      id: "constraints",
      title: "Account constraints",
      level: "core",
      body: [
        { type: "p", text: "Constraints are `#[account(...)]` attributes that Anchor turns into runtime checks *before* your handler runs. This is the heart of Anchor security — express your invariants declaratively." },
        { type: "table", headers: ["Constraint", "Effect"], rows: [
          ["`init, payer = x, space = n`", "Create + fund the account (via System Program), set owner to this program, write the discriminator."],
          ["`mut`", "Account is mutable / may have lamports or data changed. Required to persist writes."],
          ["`seeds = [...], bump`", "Verify this account is the PDA derived from these seeds (see PDAs)."],
          ["`has_one = owner`", "`account.owner == owner.key()` — the field `owner` on the data must equal the passed `owner` account."],
          ["`constraint = <expr>`", "Arbitrary boolean check, e.g. `constraint = pool.amount >= amount`."],
          ["`close = dest`", "Close the account: send its lamports to `dest`, zero the data, set the closed discriminator."],
          ["`realloc = n, realloc::payer = x`", "Resize an existing account's data."],
          ["`address = PUBKEY`", "Assert the account's key equals a known address."]
        ] },
        { type: "code", lang: "rust", code: "#[derive(Accounts)]\npub struct Update<'info> {\n    #[account(\n        mut,\n        seeds = [b\"vault\", authority.key().as_ref()],\n        bump = vault.bump,\n        has_one = authority,                         // vault.authority == authority.key()\n        constraint = vault.amount > 0 @ MyError::EmptyVault,\n    )]\n    pub vault: Account<'info, Vault>,\n    pub authority: Signer<'info>,\n}\n\n#[derive(Accounts)]\npub struct CloseVault<'info> {\n    #[account(mut, close = authority, has_one = authority)]\n    pub vault: Account<'info, Vault>,\n    #[account(mut)]\n    pub authority: Signer<'info>,\n}" },
        { type: "callout", variant: "tip", text: "Attach a custom error to any constraint with `@`: `constraint = x == y @ MyError::Mismatch`. Without it you get Anchor's generic constraint-violation error." }
      ]
    },
    {
      id: "instructions",
      title: "Instructions & the Context",
      level: "core",
      body: [
        { type: "p", text: "Each `pub fn` in the `#[program]` module is an instruction. Its first parameter is always `Context<T>` where `T` is your `Accounts` struct; remaining parameters are **instruction arguments** (Borsh-deserialized from the transaction data)." },
        { type: "code", lang: "rust", code: "pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n    let vault = &mut ctx.accounts.vault;\n\n    // ctx.accounts  -> your validated accounts\n    // ctx.bumps     -> bump seeds Anchor found for PDAs\n    // ctx.program_id-> this program's id\n    // ctx.remaining_accounts -> accounts not named in the struct\n\n    vault.amount = vault.amount\n        .checked_add(amount)\n        .ok_or(MyError::Overflow)?;      // never use raw + on money\n    Ok(())\n}" },
        { type: "p", text: "If a handler needs an instruction argument to derive a PDA or size an account, use `#[instruction(...)]` on the `Accounts` struct to bring those args into scope:" },
        { type: "code", lang: "rust", code: "#[derive(Accounts)]\n#[instruction(id: u64)]                 // mirror the handler's args, in order\npub struct Create<'info> {\n    #[account(\n        init, payer = user, space = 8 + Item::INIT_SPACE,\n        seeds = [b\"item\", user.key().as_ref(), &id.to_le_bytes()],\n        bump,\n    )]\n    pub item: Account<'info, Item>,\n    #[account(mut)]\n    pub user: Signer<'info>,\n    pub system_program: Program<'info, System>,\n}" }
      ]
    },
    {
      id: "state",
      title: "State: space, rent & the discriminator",
      level: "core",
      body: [
        { type: "p", text: "Creating an account means paying **rent** (lamports) proportional to its byte size, and that size is fixed at `init`. Two things trip everyone up: the **8-byte discriminator** and computing `space` correctly." },
        { type: "list", items: [
          "Every `#[account]` type has a leading **8-byte discriminator** (a hash of the type name) so the program can tell account types apart. **You must add 8** to your space.",
          "Accounts must be **rent-exempt**: fund them with ~2 years of rent up front (Anchor/`init` computes this). Under-funding fails the transaction.",
          "`space` is fixed at creation. Growing later needs `realloc`."
        ] },
        { type: "p", text: "Use `#[derive(InitSpace)]` so you never hand-count bytes — it generates an `INIT_SPACE` constant. Annotate variable-length fields with `#[max_len(..)]`." },
        { type: "code", lang: "rust", code: "#[account]\n#[derive(InitSpace)]\npub struct Item {\n    pub owner: Pubkey,          // 32\n    pub amount: u64,            // 8\n    pub bump: u8,              // 1\n    #[max_len(50)]\n    pub name: String,          // 4 + 50\n    #[max_len(10)]\n    pub tags: Vec<u16>,        // 4 + 10*2\n}\n\n// then, in the Accounts struct:\n#[account(init, payer = user, space = 8 + Item::INIT_SPACE)]\npub item: Account<'info, Item>,   // 8 (discriminator) + INIT_SPACE"},
        { type: "table", headers: ["Type", "Bytes"], rows: [
          ["`bool` / `u8` / `i8`", "1"],
          ["`u16/i16` … `u64/i64`", "2 … 8"],
          ["`u128` / `i128`", "16"],
          ["`Pubkey`", "32"],
          ["`String` / `Vec<T>`", "4 (length prefix) + max_len × element size"],
          ["`Option<T>`", "1 + size of T"]
        ] },
        { type: "callout", variant: "gotcha", text: "Forgetting the **+8 discriminator** is the classic Anchor bug: your account is 8 bytes too small, and the first real write or a later deserialize corrupts/fails. `8 + T::INIT_SPACE` is the safe idiom." }
      ]
    },
    {
      id: "pdas",
      title: "PDAs — Program Derived Addresses",
      level: "core",
      body: [
        { type: "p", text: "A **PDA** is a deterministic address derived from `seeds + program_id` that deliberately has **no private key** (it lies *off* the Ed25519 curve). Two superpowers: (1) predictable addresses your client can recompute, and (2) the program can **sign** for its PDAs — the basis of program-controlled vaults/authorities." },
        { type: "p", text: "Derivation searches for a **bump** (a byte 255→0) that pushes the address off-curve. The first one that works is the **canonical bump**; always use it (never re-derive with an attacker-supplied bump)." },
        { type: "code", lang: "rust", code: "// Declaring a PDA account: Anchor derives + verifies it for you.\n#[derive(Accounts)]\npub struct UsePda<'info> {\n    pub signer: Signer<'info>,\n    #[account(\n        seeds = [b\"vault\", signer.key().as_ref()],\n        bump,                                 // Anchor finds the canonical bump\n    )]\n    pub vault: Account<'info, Vault>,\n}\n\n// In a handler, the canonical bump is available at ctx.bumps.<field>.\n// Persist it in the account at init to avoid recomputing later:\n// vault.bump = ctx.bumps.vault;\n// then verify with: bump = vault.bump" },
        { type: "p", text: "Off-chain / manual derivation uses `find_program_address` (Rust) or `PublicKey.findProgramAddressSync` (TS), which return the address *and* the canonical bump." },
        { type: "code", lang: "rust", code: "let (pda, bump) = Pubkey::find_program_address(\n    &[b\"vault\", signer.key().as_ref()],\n    ctx.program_id,\n);" },
        { type: "callout", variant: "gotcha", text: "**Always store or re-check the canonical bump.** If you accept a `bump: u8` argument and use it blindly, an attacker can pass a *different* valid bump for a different account and bypass your seed check. Use `bump = stored_bump` or Anchor's bump-less `bump` (canonical)." }
      ]
    },
    {
      id: "cpi",
      title: "CPI — calling other programs",
      level: "core",
      body: [
        { type: "p", text: "A **Cross-Program Invocation** is one program calling another's instruction — how programs compose (e.g. calling the System Program to move SOL, or the Token Program to move tokens). Anchor wraps this in `CpiContext`." },
        { type: "code", lang: "rust", code: "use anchor_lang::system_program::{transfer, Transfer};\n\npub fn send_sol(ctx: Context<SendSol>, amount: u64) -> Result<()> {\n    let cpi = CpiContext::new(\n        ctx.accounts.system_program.to_account_info(),\n        Transfer {\n            from: ctx.accounts.sender.to_account_info(),\n            to: ctx.accounts.recipient.to_account_info(),\n        },\n    );\n    transfer(cpi, amount)?;\n    Ok(())\n}" },
        { type: "heading", text: "Signing a CPI with a PDA" },
        { type: "p", text: "When the `from`/authority is a **PDA**, the program signs on its behalf with `new_with_signer`, passing the PDA's seeds + bump. This is how a program-owned vault sends funds without a private key." },
        { type: "code", lang: "rust", code: "pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    let signer_key = ctx.accounts.authority.key();\n    let bump = ctx.bumps.vault;\n    // seeds must exactly match how the PDA was derived, + the bump\n    let seeds: &[&[&[u8]]] = &[&[b\"vault\", signer_key.as_ref(), &[bump]]];\n\n    let cpi = CpiContext::new_with_signer(\n        ctx.accounts.system_program.to_account_info(),\n        Transfer {\n            from: ctx.accounts.vault.to_account_info(),\n            to: ctx.accounts.authority.to_account_info(),\n        },\n        seeds,\n    );\n    transfer(cpi, amount)?;\n    Ok(())\n}" },
        { type: "callout", variant: "note", text: "Under the hood this becomes Solana's `invoke_signed`. Anchor also generates typed CPI wrappers for *your own* programs if you enable the `cpi` feature, so other programs can call you type-safely." }
      ]
    },
    {
      id: "spl",
      title: "SPL tokens with anchor_spl",
      level: "deep",
      body: [
        { type: "p", text: "The `anchor_spl` crate gives typed wrappers for the SPL **Token** and **Associated Token Account** programs. Prefer `token_interface` + `transfer_checked` (works with both the classic Token program and **Token-2022**, and verifies decimals)." },
        { type: "code", lang: "rust", code: "use anchor_spl::token_interface::{\n    Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked,\n};\n\n#[derive(Accounts)]\npub struct MoveTokens<'info> {\n    pub authority: Signer<'info>,\n    pub mint: InterfaceAccount<'info, Mint>,\n    #[account(mut, token::mint = mint, token::authority = authority)]\n    pub from: InterfaceAccount<'info, TokenAccount>,\n    #[account(mut, token::mint = mint)]\n    pub to: InterfaceAccount<'info, TokenAccount>,\n    pub token_program: Interface<'info, TokenInterface>,\n}\n\npub fn move_tokens(ctx: Context<MoveTokens>, amount: u64) -> Result<()> {\n    let cpi = CpiContext::new(\n        ctx.accounts.token_program.to_account_info(),\n        TransferChecked {\n            from: ctx.accounts.from.to_account_info(),\n            mint: ctx.accounts.mint.to_account_info(),\n            to: ctx.accounts.to.to_account_info(),\n            authority: ctx.accounts.authority.to_account_info(),\n        },\n    );\n    transfer_checked(cpi, amount, ctx.accounts.mint.decimals)?;\n    Ok(())\n}" },
        { type: "callout", variant: "tip", text: "For PDA-owned token accounts, swap `CpiContext::new` for `new_with_signer` with the PDA seeds — exactly like the SOL example. To auto-create a user's token account, use the `associated_token::mint`/`associated_token::authority` constraints with `init` or `init_if_needed`." },
        { type: "link", url: "https://www.anchor-lang.com/docs/tokens/basics", text: "Anchor docs — Token program integration (mints, ATAs, transfers)" }
      ]
    },
    {
      id: "errors",
      title: "Errors: error_code, require!, err!",
      level: "core",
      body: [
        { type: "p", text: "Define custom errors with `#[error_code]`. Anchor auto-numbers them starting at **6000** (codes below that are Anchor/runtime built-ins) and surfaces the `#[msg(...)]` text to clients." },
        { type: "code", lang: "rust", code: "#[error_code]\npub enum MyError {\n    #[msg(\"Amount must be greater than zero\")]\n    ZeroAmount,\n    #[msg(\"Arithmetic overflow\")]\n    Overflow,\n    #[msg(\"Not authorized\")]\n    Unauthorized,\n}" },
        { type: "p", text: "Return them with `err!` / `Err(error!(...))`, or assert conditions with `require!` (and its variants). `require!` reads cleaner than an `if` + `return`." },
        { type: "code", lang: "rust", code: "pub fn set(ctx: Context<Set>, amount: u64) -> Result<()> {\n    require!(amount > 0, MyError::ZeroAmount);\n    require_keys_eq!(ctx.accounts.owner.key(), ctx.accounts.vault.owner, MyError::Unauthorized);\n    require_gte!(ctx.accounts.vault.balance, amount, MyError::Overflow);\n\n    if amount > 1_000_000 {\n        return err!(MyError::Overflow);\n    }\n    Ok(())\n}" },
        { type: "table", headers: ["Macro", "Use"], rows: [
          ["`require!(cond, Err)`", "generic boolean assertion"],
          ["`require_eq! / require_neq!`", "compare two values"],
          ["`require_keys_eq! / _neq!`", "compare two `Pubkey`s"],
          ["`require_gt! / require_gte!`", "numeric comparisons"],
          ["`err!(E)` / `error!(E)`", "return / build an error"]
        ] }
      ]
    },
    {
      id: "events",
      title: "Events",
      level: "deep",
      body: [
        { type: "p", text: "Events let off-chain clients react to on-chain activity. Declare a struct with `#[event]` and emit it with `emit!`; Anchor Base64-encodes it into the program logs, and the TS client can subscribe." },
        { type: "code", lang: "rust", code: "#[event]\npub struct Deposited {\n    pub user: Pubkey,\n    pub amount: u64,\n    pub ts: i64,\n}\n\npub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n    // ...\n    emit!(Deposited {\n        user: ctx.accounts.user.key(),\n        amount,\n        ts: Clock::get()?.unix_timestamp,\n    });\n    Ok(())\n}" },
        { type: "callout", variant: "note", text: "`emit!` writes to logs, which some RPCs truncate. For reliable indexing use `emit_cpi!` (emits via a self-CPI so the data lands in instruction data) — enable the `event-cpi` feature and add `#[event_cpi]` to the Accounts struct." },
        { type: "link", url: "https://www.anchor-lang.com/docs/features/events", text: "Anchor docs — Emit Events (emit! vs emit_cpi!)" }
      ]
    },
    {
      id: "idl-client",
      title: "The IDL & the TypeScript client",
      level: "core",
      body: [
        { type: "p", text: "`anchor build` generates an **IDL** (a JSON description of every instruction, account, type and error) plus TS types. The `@anchor-lang/core` client reads the IDL so you call instructions by name with full types — no hand-written serialization." },
        { type: "code", lang: "typescript", code: "import * as anchor from \"@anchor-lang/core\";\nimport { Program } from \"@anchor-lang/core\";\nimport { MyProgram } from \"../target/types/my_program\";\n\nanchor.setProvider(anchor.AnchorProvider.env());\nconst program = anchor.workspace.MyProgram as Program<MyProgram>;\n\n// Derive the same PDA the program uses\nconst [vault] = anchor.web3.PublicKey.findProgramAddressSync(\n  [Buffer.from(\"vault\"), provider.wallet.publicKey.toBuffer()],\n  program.programId\n);\n\n// Call an instruction: .methods.<name>(args).accounts({...}).rpc()\nawait program.methods\n  .deposit(new anchor.BN(1000))\n  .accounts({\n    vault,\n    user: provider.wallet.publicKey,\n    systemProgram: anchor.web3.SystemProgram.programId,\n  })\n  .rpc();\n\n// Read account state (auto-deserialized via the IDL)\nconst state = await program.account.vault.fetch(vault);\nconsole.log(state.amount.toString());" },
        { type: "callout", variant: "tip", text: "Rust snake_case becomes TS camelCase (`system_program` → `systemProgram`, `new_account` → `newAccount`). With `resolution = true` in Anchor.toml, Anchor auto-resolves PDAs and known program accounts, so you can often omit them from `.accounts({...})`." }
      ]
    },
    {
      id: "testing",
      title: "Testing",
      level: "core",
      body: [
        { type: "p", text: "`anchor test` boots a local validator, deploys your program, and runs the TS tests (Mocha + Chai by default). Since Anchor 1.0 the default backend is **Surfpool** (a fast in-process validator); pass `--validator legacy` to use the classic `solana-test-validator`. Tests exercise the program end-to-end through the real runtime." },
        { type: "code", lang: "typescript", code: "import * as anchor from \"@anchor-lang/core\";\nimport { assert } from \"chai\";\n\ndescribe(\"my_program\", () => {\n  anchor.setProvider(anchor.AnchorProvider.env());\n  const program = anchor.workspace.MyProgram;\n\n  it(\"initializes and deposits\", async () => {\n    const [vault] = anchor.web3.PublicKey.findProgramAddressSync(\n      [Buffer.from(\"vault\"), program.provider.publicKey.toBuffer()],\n      program.programId\n    );\n\n    await program.methods.initialize().accounts({ vault }).rpc();\n    await program.methods.deposit(new anchor.BN(500)).accounts({ vault }).rpc();\n\n    const state = await program.account.vault.fetch(vault);\n    assert.equal(state.amount.toNumber(), 500);\n  });\n\n  it(\"rejects a zero deposit\", async () => {\n    try {\n      await program.methods.deposit(new anchor.BN(0)).accounts({ /* ... */ }).rpc();\n      assert.fail(\"should have thrown\");\n    } catch (e) {\n      assert.include(e.error.errorMessage, \"greater than zero\");\n    }\n  });\n});" },
        { type: "callout", variant: "tip", text: "`anchor test --skip-local-validator` runs against an already-running validator (faster iteration). For pure-Rust unit tests of program logic, the `litesvm` / `solana-program-test` crates run instructions without a full validator." }
      ]
    },
    {
      id: "deploy",
      title: "Deploy, upgrade & program IDs",
      level: "deep",
      body: [
        { type: "p", text: "Deploying uploads the `.so` to an on-chain **program account**, controlled by an **upgrade authority**. Programs are upgradeable by default — a power and a risk." },
        { type: "code", lang: "bash", code: "# fund a wallet on devnet\nsolana config set --url devnet\nsolana airdrop 2\n\nanchor build\nanchor deploy                       # uses [provider].cluster in Anchor.toml\n\n# upgrade later (same program ID, new bytecode)\nanchor upgrade target/deploy/my_program.so --program-id <ID>\n\n# publish the IDL on-chain so explorers/clients can fetch it\nanchor idl init <ID> -f target/idl/my_program.json\nanchor idl upgrade <ID> -f target/idl/my_program.json\n\n# make a program immutable (irreversible!)\nsolana program set-upgrade-authority <ID> --final" },
        { type: "list", items: [
          "Deploy cost scales with binary size; you pay rent for the program + a buffer account during upload.",
          "Keep the **program keypair** and **upgrade authority** safe — losing the authority means you can never upgrade; leaking it means anyone can replace your code.",
          "For production, hand the upgrade authority to a **multisig** (e.g. Squads) rather than a single key."
        ] }
      ]
    },
    {
      id: "security",
      title: "Security checklist",
      level: "core",
      body: [
        { type: "p", text: "Anchor removes whole classes of bugs, but the runtime is adversarial: anyone can pass any account into any instruction. Your constraints are the defense." },
        { type: "list", items: [
          "**Signer checks:** use `Signer<'info>` (or `has_one`) for any authority. A missing signer check lets anyone act as the owner.",
          "**Owner/type checks:** prefer `Account<'info, T>` over `AccountInfo` so Anchor verifies the program owns it and the discriminator matches. Justify every `/// CHECK:`.",
          "**Arithmetic:** never use raw `+ - *` on lamports/amounts — use `checked_add`/`checked_sub`/`checked_mul` and return an error on `None`. Overflow in release builds wraps silently.",
          "**PDA bump:** use the canonical bump (`bump` or a stored `bump = x`); never trust an attacker-supplied bump.",
          "**Duplicate accounts:** if two same-type mutable accounts must differ, assert `a.key() != b.key()`.",
          "**Reinitialization (see below):** `init` protects you; `init_if_needed` does not by itself."
        ] },
        { type: "heading", text: "init_if_needed & reinitialization attacks" },
        { type: "p", text: "`init_if_needed` (behind a feature flag) creates the account only if it doesn't exist — convenient for ATAs. The danger: if the account *already* exists, your handler still runs, so a naive handler can **reset live state** back to initial values. Worse, an attacker can `close` an account (reclaiming rent) and re-create it in the same transaction with different data." },
        { type: "code", lang: "rust", code: "// Cargo.toml:  anchor-lang = { version = \"1.0.2\", features = [\"init-if-needed\"] }\n\n#[account(\n    init_if_needed,\n    payer = user,\n    space = 8 + Vault::INIT_SPACE,\n    seeds = [b\"vault\", user.key().as_ref()],\n    bump,\n)]\npub vault: Account<'info, Vault>,\n\n// In the handler, GUARD against overwriting existing state:\n// require!(!ctx.accounts.vault.initialized, MyError::AlreadyInit);\n// ctx.accounts.vault.initialized = true;" },
        { type: "callout", variant: "warn", text: "Prefer plain `init` whenever the account should be created exactly once — it fails if the account already exists, giving you free reinitialization protection. Reach for `init_if_needed` only when idempotent creation is truly needed, and always add an explicit `initialized`/state guard." },
        { type: "link", url: "https://github.com/coral-xyz/sealevel-attacks", text: "sealevel-attacks — worked examples of Solana/Anchor vulnerabilities (insecure vs secure)" },
        { type: "link", url: "https://solana.com/developers/courses/program-security", text: "Solana Foundation — Program Security course (signer, owner, reinit, PDA sharing)" }
      ]
    },
    {
      id: "common-headaches",
      title: "Common headaches & how to handle them",
      level: "core",
      body: [
        { type: "p", text: "Beyond security, these are the operational and Rust-specific frictions that eat an Anchor beginner's time. The runtime is unusually constrained (tiny compute budget, small stack, no dynamic sizing), and the borrow checker collides with the `ctx.accounts` pattern in ways that don't happen in normal Rust." },
        { type: "heading", text: "1. Borrow-checker fights with ctx.accounts" },
        { type: "p", text: "You can't take two mutable borrows of `ctx.accounts` at once, and you can't hold an immutable borrow (a read) while mutating. The fix is to pull values out into locals first, then mutate — or scope the borrows." },
        { type: "code", lang: "rust", code: "pub fn transfer_internal(ctx: Context<Move>, amount: u64) -> Result<()> {\n    // WRONG: cannot borrow `ctx.accounts.from` and `.to` both mutably in one expression\n    // ctx.accounts.from.balance -= amount;  ctx.accounts.to.balance += amount;  // borrow clash risk\n\n    // RIGHT: read into locals, compute, then write back\n    let from = &mut ctx.accounts.from;\n    from.balance = from.balance.checked_sub(amount).ok_or(MyError::Overflow)?;\n    let to = &mut ctx.accounts.to;\n    to.balance = to.balance.checked_add(amount).ok_or(MyError::Overflow)?;\n    Ok(())\n}" },
        { type: "callout", variant: "gotcha", text: "After a **CPI** mutates one of your accounts (e.g. a token transfer changes a balance), your in-scope deserialized copy is **stale**. Call `ctx.accounts.token_acct.reload()?` before reading the post-CPI value, or you'll act on the old data." },
        { type: "heading", text: "2. Compute budget & stack/heap limits" },
        { type: "list", items: [
          "An instruction gets ~**200k compute units** by default (max 1.4M, requestable via a `ComputeBudget` instruction from the client). Tight loops, big (de)serialization, and expensive CPIs blow it — you get `exceeded CUs`. Profile with the CU counts in the program logs.",
          "The BPF **stack frame is ~4KB**. Large structs/arrays on the stack overflow it (`Access violation`); `Box<Account<..>>` moves the account to the heap, and large local buffers should be heap-allocated.",
          "The heap is a fixed **32KB** per instruction — no unbounded `Vec` growth.",
          "**Transaction size is ~1232 bytes** total: too many accounts or too much instruction data won't fit. Use lookup tables (ALTs) for many accounts, or split across instructions."
        ] },
        { type: "code", lang: "rust", code: "// large accounts on the stack overflow the 4KB frame -> Box them onto the heap\n#[derive(Accounts)]\npub struct Heavy<'info> {\n    #[account(mut)]\n    pub big: Box<Account<'info, BigState>>,   // Box = lives on heap, not the stack\n}" },
        { type: "heading", text: "3. Build / version / IDL friction" },
        { type: "callout", variant: "warn", text: "Most \"it won't build/deploy\" pain is version skew: the `anchor-cli`, the `anchor-lang` crate, the Solana toolchain, and `@anchor-lang/core` must be compatible. Pin them (`avm use <ver>`, `[toolchain] anchor_version` in Anchor.toml), and after changing account layouts rebuild **and** regenerate the IDL/TS types — a stale IDL makes the client deserialize garbage." },
        { type: "callout", variant: "tip", text: "Fast feedback loop: `anchor test --skip-local-validator` against a running `solana-test-validator`, and pure-Rust logic tests via `litesvm` — a full `anchor test` redeploys every run and is slow to iterate on." }
      ]
    }
  ],

  packages: [
    { name: "anchor-lang", why: "core framework: macros, Context, Account types, prelude" },
    { name: "anchor-spl", why: "typed SPL Token / ATA / Token-2022 CPI wrappers" },
    { name: "solana-program", why: "low-level Solana types (Pubkey, invoke_signed, sysvars)" },
    { name: "@anchor-lang/core", why: "TypeScript client (Anchor 1.0, formerly @coral-xyz/anchor): reads the IDL, calls instructions, fetches accounts" },
    { name: "@solana/web3.js", why: "Connection, PublicKey, keypairs, transactions (JS)" },
    { name: "avm", why: "Anchor Version Manager — install/pin Anchor CLI versions" },
    { name: "solana-cli (Anza)", why: "keygen, airdrop, config, solana-test-validator, program deploy" },
    { name: "litesvm / solana-program-test", why: "fast Rust-side testing without a full validator" }
  ],

  gotchas: [
    "Forgetting the **+8 discriminator** in `space` — always `space = 8 + T::INIT_SPACE`. The account ends up 8 bytes too small and (de)serialization breaks.",
    "Using raw `+ - *` on token/lamport amounts — release builds **wrap on overflow silently**. Use `checked_add`/`checked_sub` and error on `None`.",
    "Trusting an attacker-supplied PDA `bump` — always use the **canonical** bump (Anchor's `bump`, or a stored `bump = x`).",
    "`init_if_needed` **reinitialization**: the handler still runs if the account exists, so it can reset state or be revived after `close`. Guard with an `initialized` flag, or use plain `init`.",
    "`AccountInfo` / `UncheckedAccount` skip **all** checks — you must verify owner/key/signer yourself; each needs a `/// CHECK:` justifying it.",
    "Missing `mut` — writes to an account without `#[account(mut)]` are silently dropped / rejected at runtime.",
    "`declare_id!` not matching the deployed keypair → `DeclaredProgramIdMismatch`. Run `anchor keys sync`.",
    "Not marking the authority as `Signer` (or via `has_one`) — a missing signer check lets anyone invoke privileged instructions.",
    "A deserialized account is **stale after a CPI** mutates it — call `.reload()?` before reading the post-CPI value.",
    "Large accounts/buffers on the ~4KB BPF stack cause an access violation — `Box<Account<..>>` moves them to the heap.",
    "Exceeding the ~200k compute-unit budget (tight loops/big serialization) fails the instruction — request more CUs client-side or optimize."
  ],

  flashcards: [
    { q: "What are the four core Anchor macros and what does each do?", a: "`declare_id!` (program address), `#[program]` (module of instructions), `#[derive(Accounts)]` (validate the accounts an instruction touches), `#[account]` (mark a program-owned data struct + add the 8-byte discriminator)." },
    { q: "Why must you add 8 to an account's `space`?", a: "The leading **8-byte discriminator** — a hash of the type name Anchor writes so it can distinguish account types. Idiom: `space = 8 + T::INIT_SPACE`." },
    { q: "What is a PDA and why does it have no private key?", a: "A **Program Derived Address** deterministically derived from seeds + program_id, forced **off** the Ed25519 curve via a bump. No key means only the owning program can sign for it (via `invoke_signed`)." },
    { q: "What is the canonical bump and why use it?", a: "The first bump (255→0) that yields a valid off-curve PDA. Using a non-canonical, attacker-supplied bump lets them substitute a different account — always use `bump` (canonical) or a stored bump." },
    { q: "How does a program sign a CPI with a PDA?", a: "`CpiContext::new_with_signer(program, accounts, &[&[seed, ..., &[bump]]])` — the PDA's seeds + bump prove the program owns it. Compiles to Solana's `invoke_signed`." },
    { q: "What's the difference between `Account<T>` and `UncheckedAccount`?", a: "`Account<T>` checks the program owns it and the discriminator matches, then deserializes. `UncheckedAccount`/`AccountInfo` do **no** checks — you validate manually and add a `/// CHECK:` comment." },
    { q: "Why is `init_if_needed` risky?", a: "If the account already exists the handler still runs, so it can reset live state; combined with `close` it enables reinitialization/revival attacks. Use plain `init` or add an explicit `initialized` guard." },
    { q: "What does the `close = dest` constraint do?", a: "Sends the account's lamports to `dest`, zeroes its data, and sets the closed discriminator — safely retiring the account and reclaiming rent." },
    { q: "Where do Anchor custom error codes start, and how do you raise them?", a: "At **6000** (below that is reserved). Define with `#[error_code]`, raise with `require!(cond, MyError::X)` or `err!(MyError::X)`." },
    { q: "What is the IDL and what does it enable?", a: "A JSON interface description generated by `anchor build`; the `@anchor-lang/core` TS client reads it to call instructions by name with types and auto-deserialize accounts." },
    { q: "Why is an account 'stale' after a CPI, and how do you fix it?", a: "Your deserialized copy in `ctx.accounts` isn't automatically refreshed when a CPI mutates the on-chain account. Call `ctx.accounts.x.reload()?` before reading the post-CPI value." },
    { q: "Why `Box` an Anchor account, and what limits force it?", a: "The BPF stack frame is only ~4KB; a large `Account<T>` on the stack overflows it. `Box<Account<T>>` moves it to the heap. Also mind ~200k compute units and the ~1232-byte transaction size." }
  ],

  cheatsheet: [
    { label: "Install / pin Anchor", code: "avm install latest && avm use latest" },
    { label: "New project", code: "anchor init my_program" },
    { label: "Build (compile + IDL)", code: "anchor build" },
    { label: "Test (local validator)", code: "anchor test" },
    { label: "Deploy", code: "anchor deploy" },
    { label: "Account space", code: "space = 8 + T::INIT_SPACE" },
    { label: "PDA constraint", code: "#[account(seeds = [b\"v\", u.key().as_ref()], bump)]" },
    { label: "Assert / error", code: "require!(amount > 0, MyError::ZeroAmount)" },
    { label: "Call from TS", code: "program.methods.deposit(amt).accounts({...}).rpc()" }
  ]
});
