# Expenses Counter

A personal dashboard for credit card installments and recurring monthly expenses. It replaces a spreadsheet and answers four questions: how much is due this month, which purchases are still being paid, when each one ends and how much is left to pay.

The interface is in Brazilian Portuguese. The [live app](https://expenses-counter-pi.vercel.app) requires sign-in.

## Features

- **Installment tracking:** calculates paid and remaining installments, remaining balance, final month and status for each purchase.
- **Recurring expenses:** monthly costs are added to every month they apply to.
- **Monthly view:** totals, charts and the items that make up each month, with filters by description, status, month and card.
- **Export:** copy a month's summary as text or as an image, download it as a PNG or share it.
- **Reversible changes:** purchases and recurring expenses can be disabled and re-enabled without being deleted.
- **Desktop and mobile layouts:** each screen size has its own interface, with drawers and cards on mobile.

## Technical highlights

- **Per-user data isolation:** every table uses PostgreSQL row level security, and the app uses only Supabase's publishable key, with no `service_role` key.
- **Money as integers:** amounts are stored in cents, which avoids floating point rounding errors.
- **Validated forms:** Server Actions validate form input with Zod before saving it.
- **Hardened auth redirects:** in production, redirect origins come from configuration and not from request headers. Password recovery uses Supabase's token hash flow.
- **Tested business logic:** Vitest covers installment calculations, analytics, sorting, export, URL handling and Server Actions.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Recharts · Supabase (Auth and PostgreSQL) · Zod · Vitest · Vercel

## Running locally

You need Node.js and your own Supabase project.

1. Apply the SQL files in `supabase/migrations` to your project, in filename order.
2. Create your environment file and fill in the values:

   ```bash
   cp .env.example .env
   ```

   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```

3. Install the dependencies and start the app at [http://localhost:3000](http://localhost:3000):

   ```bash
   npm install
   npm run dev
   ```

The app has no public sign-up screen, so create your first user in the Supabase dashboard.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm test` | Run the tests |
| `npm run lint` | Run ESLint |
| `npm run build` | Build for production |

## Supabase Auth setup

The app signs users in with email and password only. Do not add a magic link fallback.

In the Supabase dashboard:

- Enable the Email auth provider.
- Set `Site URL` to the public app URL.
- Add `/auth/confirm` to the redirect URLs and, during the transition, `/auth/callback`.

Users originally created with a magic link do not need a database migration. They can select "Criar ou redefinir senha" on the login screen, receive the recovery email and set a password at `/auth/update-password`.

Configure the **Reset password** email template to use the PKCE token hash:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password">Criar ou redefinir senha</a>
```

## Deploying to Vercel

Set `NEXT_PUBLIC_APP_URL` (or `APP_URL`) to your public domain, which password recovery links require in production:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

Use the same domain in Supabase Auth for `Site URL` and the redirect URLs, including `https://your-domain.vercel.app/auth/confirm`. With a custom domain, use it in both places instead of the Vercel subdomain.
