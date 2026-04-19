# Typlica

An interactive Typst exercise platform — bringing a [Rustlings](https://github.com/rust-lang/rustlings)-style learning experience to the [Typst](https://typst.app/) world.

[中文文档](README-zh_cn.md)

## Features

- **Pure frontend**: deployable on any static hosting service (e.g. GitHub Pages)
- **In-browser compilation**: compiles Typst code directly in the browser via [typst.ts](https://github.com/Myriad-Dreamin/typst.ts)
- **Live preview**: instant output as you type
- **Diff checking**: built-in pixel-level diff that highlights differences from the reference answer
- **Syntax highlighting & completion**: Typst syntax highlighting and keyword completion powered by CodeMirror 6
- **Progress saving**: code and completion state are automatically saved to localStorage
- **Mobile-friendly**: editor always visible; preview panels switch between Current / Expected / Diff tabs
- **Bilingual UI**: switch between English and Chinese at any time

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output is placed in the `dist/` directory.

## Adding Exercises

Exercises are auto-discovered at build time — no TypeScript changes needed.

1. Create a new directory under `exercises/{locale}/`, e.g. `exercises/en/07-tables/`
2. Add a `meta.json` file with `title`, `description`, `instructions`, and `hint` fields
3. Add an `answer.typ` file (the reference solution)
4. Add a `template.typ` file (the starting template shown to users)

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool
- [typst.ts](https://github.com/Myriad-Dreamin/typst.ts) — in-browser Typst compiler
- [CodeMirror 6](https://codemirror.net/) — code editor (mobile-friendly)

## License

MIT
