# Nep Tourna — Cloudflare + Supabase

A fresh production-oriented tournament-management frontend built for Cloudflare Workers Static Assets and Supabase.

## 1. Configure Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Only the Supabase browser/anon key belongs in Vite environment variables. Never put a service-role key, database password, or other privileged credential in `.env` variables prefixed with `VITE_`.

## 2. Run locally

```bash
npm install
npm run dev
```

## 3. Build

```bash
npm run build
```

## 4. Deploy to Cloudflare Workers

Authenticate Wrangler, then:

```bash
npx wrangler login
npm run deploy
```

The `wrangler.jsonc` file serves `dist/` as Cloudflare Static Assets and enables SPA fallback routing.

## Notes

This clean build intentionally contains no wallet, deposit, withdrawal, payment, or prize-money implementation. It is designed around free tournament management and Supabase authentication/data.
