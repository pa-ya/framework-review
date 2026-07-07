# Framework Review Deck ⚡

A static, offline web app for **reviewing** backend (and adjacent) frameworks — a fast
refresher for things you already learned but forget: init, core syntax, signature features,
ORMs, auth, and gotchas. Most sections are a 10–20 minute read (Qt is longer by design).

**Sections:**

- **FastAPI** (Python) · **NestJS** (TypeScript)
- **Go** — Standard Library (net/http) · chi · Echo
- **Rust** — Axum · Anchor (Solana on-chain programs)
- **ElysiaJS** (Bun) · **Next.js** · **Django** · **Laravel**
- **C++** — Qt · Drogon
- **Practice & Projects** — cross-framework comparison + project ideas

Related sections are grouped in the sidebar under a collapsible parent (**Go**, **Rust**, **C++**).

## Run it

No build, no server, no dependencies. Just open the file:

```bash
# double-click index.html, or:
xdg-open index.html      # Linux
open index.html          # macOS
```

> Content is loaded via plain `<script>` tags, so it works directly from `file://`.
> If your browser ever blocks local files, serve the folder instead:
> `python3 -m http.server` then visit http://localhost:8000

## Features

- 🌗 **Dark / light theme** — toggle with `t`, remembered across visits (respects your OS setting first time).
- 🔎 **Global search** (`/`) — jump to any concept across all frameworks.
- ✅ **Progress tracking** — mark sections *Reviewed*; the sidebar ring shows overall coverage (saved locally).
- 🃏 **Flashcards + quiz** (`f`) — active-recall practice per framework.
- 🧭 **Sticky nav + on-this-page TOC** with scroll-spy.
- ▸ **Deep-dive accordions** — advanced details are collapsed by default; open only what you need.
- 📋 Syntax-highlighted code with **copy** buttons.
- 🖨 **Print-friendly** (Ctrl/Cmd+P expands everything for PDF export).

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `j` / `k` | Next / previous framework |
| `f` | Open flashcards |
| `t` | Toggle theme |
| `Esc` | Close modal / menu |

## Project structure

```
index.html            # shell (loads everything)
css/                  # theme (dark/light tokens), layout, components, animations
js/                   # highlight, render, nav, search, progress, flashcards, theme, app
content/              # one file per framework (window.FRAMEWORKS.push({...}))
  _schema.md          # authoring guide for the content object
TASK.md               # full plan / spec
```

## Editing or adding content

All content lives in `content/*.js`. Each file registers one framework object — see
[`content/_schema.md`](content/_schema.md) for the shape (sections, block types, escaping rules).

Validate a content file after editing:

```bash
node -e "global.window={FRAMEWORKS:[]};require('./content/fastapi.js');console.log('ok', window.FRAMEWORKS.length)"
```

To add a framework: create `content/<id>.js`, then add a matching
`<script src="content/<id>.js"></script>` line in `index.html`. The sidebar, search,
progress, and flashcards pick it up automatically.
