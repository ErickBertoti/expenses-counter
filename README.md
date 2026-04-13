## Environment

Create `.env` with:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Deploy

When deploying to Vercel, set `NEXT_PUBLIC_APP_URL` to your public domain, for example:

```bash
NEXT_PUBLIC_APP_URL=https://expenses-counter.vercel.app
```

In Supabase Auth, use the same public domain:

- `Site URL`: `https://expenses-counter.vercel.app`
- `Redirect URLs`: include `https://expenses-counter.vercel.app/auth/callback`

If you use a custom domain, use it in both places instead of the Vercel subdomain.
