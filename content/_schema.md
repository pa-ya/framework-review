# Content authoring schema

Each file registers ONE framework:

```js
(window.FRAMEWORKS = window.FRAMEWORKS || []).push({
  id: "fastapi",            // unique, url-safe (used in #hash and anchors)
  name: "FastAPI",
  language: "Python",
  tagline: "one line, supports **bold** / `code`",
  color: "#009688",          // accent used in nav dot + hero glow
  readMinutes: 15,
  sections: [ /* see below */ ],
  packages: [ { name: "uvicorn", why: "ASGI server" } ],
  gotchas: [ "text with **bold**/`code`/[links](url)" ],
  flashcards: [ { q: "…", a: "… `code` ok" } ],
  cheatsheet: [ { label: "Run dev", code: "uvicorn main:app --reload" } ],
});
```

## Section

```js
{
  id: "routing",                 // unique within framework
  title: "Routing basics",
  level: "core",                 // "core" (visible) | "deep" (collapsed accordion)
  body: [ /* blocks, in order */ ]
}
```

## Blocks

| type | fields |
|------|--------|
| `p` | `text` — supports `` `code` ``, `**bold**`, `[text](url)` |
| `code` | `lang` (js/ts/py/go/rust/php/bash/json/sql/env), `code` |
| `list` | `items: []`, optional `ordered: true` |
| `callout` | `variant`: tip \| gotcha \| warn \| good \| note, `text` |
| `table` | `headers: []`, `rows: [[]]` |
| `link` | `url`, `text` |
| `heading` | `text` (sub-heading inside a section) |

## Escaping (IMPORTANT)

Code is stored inside JS **template literals**. Inside any `code` string you MUST escape:
- a backtick `` ` `` → `` \` ``
- a `${` sequence → `\${`

Otherwise the file throws at load. Validate with:
`node -e "global.window={FRAMEWORKS:[]};require('./content/<file>.js');console.log('ok')"`
