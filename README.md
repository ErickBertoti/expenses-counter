## Environment

Create `.env` with:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

For production password recovery links, configure `NEXT_PUBLIC_APP_URL` or
`APP_URL`. The app does not trust request headers for auth redirect origins in
production.

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
- `Redirect URLs`: include `https://expenses-counter.vercel.app/auth/confirm`
- During the transition, also keep
  `https://expenses-counter.vercel.app/auth/callback`

If you use a custom domain, use it in both places instead of the Vercel subdomain.

## Supabase Auth

This app uses email + password only for login. Do not add a magic link fallback
in the app.

Required Supabase Dashboard settings:

- Auth Provider Email enabled.
- `Site URL` set to the public app URL.
- Redirect URLs include `/auth/confirm` and, during the transition,
  `/auth/callback`.

Existing users that were created with magic link do not need a database
migration. They should use "Criar ou redefinir senha" on the login screen,
receive the recovery email, and define a password from `/auth/update-password`.

Configure the **Reset password** email template to use the PKCE token hash:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password">Criar ou redefinir senha</a>
```
