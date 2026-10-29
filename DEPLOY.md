# Deploying Aira Flora to Cloudflare Workers

This branch runs entirely on Cloudflare:

| Piece | Cloudflare product | Binding / name |
| --- | --- | --- |
| App (SSR + server functions) | Workers | `aira-flora` |
| Database | D1 | `DB` → `aira-flora-db` |
| Product image uploads | R2 | `IMAGES` → `aira-flora-images` |
| Admin password | Worker secret | `ADMIN_PASSWORD` |

Supabase is no longer used. The old Postgres schema in `drizzle/` is kept for reference only; the D1 schema lives in `migrations/`.

## One-time setup (already done for the account this was prepared in)

```sh
npx wrangler d1 migrations apply aira-flora-db --remote   # schema + starter catalogue
npx wrangler r2 bucket create aira-flora-images
npx wrangler secret put ADMIN_PASSWORD
```

## Deploy

```sh
bun install        # or: npm install
bun run build      # vite build -> .output/
npx wrangler deploy --config wrangler.jsonc
```

### Automatic deploys from GitHub (Workers Builds)

In the Cloudflare dashboard open **Workers & Pages → aira-flora → Settings → Builds**, connect this repository and use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy --config wrangler.jsonc`
- Branch: `cloudflare-d1` (or `main` after merging)
