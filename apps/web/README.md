# web

The Next.js front end for reise-hq. Part of the pnpm workspace at the repo root.

## Development

Run from the repo root:

```bash
pnpm install
pnpm dev
```

Or from this directory:

```bash
pnpm --filter web dev
```

Then open [http://localhost:3000](http://localhost:3000). Editing `src/app/page.tsx`
hot-reloads the page.

## Notes

- Domain types come from `@reise-hq/domain` (`packages/domain`), linked via the
  workspace — import from it rather than redefining shared concepts here.
- Node and pnpm versions are pinned in `mise.toml` and `.nvmrc` at the repo root.
