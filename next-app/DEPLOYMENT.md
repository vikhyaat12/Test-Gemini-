# Queens Care Laboratories deployment guide

## 1. Local setup

Install Node.js 20 LTS or later, then install the locked dependencies:

```bash
npm ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open `http://localhost:3000`.

`.env.example` sets a local `DATABASE_URL`, so the app runs against PostgreSQL (see sections 2–3). To preview the storefront **without** a database, comment out `DATABASE_URL` in `.env.local`: the app falls back to a built-in in-memory catalog, so browsing and the cart work, but sign-in and orders require a database.

Authentication requires a seeded database. After running the migration and seed (section 3), sign in with the seeded admin `admin@queenscare.in` / `QueensCare#Admin2026`, or the demo customer `customer@queenscare.in` / `QueensCare#2026`. Change these credentials before deploying anything real.

## 2. PostgreSQL setup

Create a dedicated PostgreSQL 15+ database and non-superuser application role. Require TLS for managed providers and restrict inbound access to the hosting runtime. Example connection string:

```text
DATABASE_URL=postgresql://queenscare_app:strong-password@db-host:5432/queenscare?sslmode=require
```

Do not use the local in-memory development adapter in a deployed environment. Connect the repository layer to Prisma before accepting live customer data; it is intentionally non-persistent for local previewing.

## 3. Prisma migration and seed

The canonical schema is [prisma/schema.prisma](./prisma/schema.prisma). With `DATABASE_URL` set, generate the client, create the tables, and load starter data:

```bash
npm ci                     # installs deps; the postinstall hook runs `prisma generate`
npm run db:migrate:dev     # create and apply the initial migration (development only)
npm run db:seed            # load products, blog posts, admin + demo customer
```

For CI/production, apply the committed migrations instead of creating new ones:

```bash
npm run db:migrate         # prisma migrate deploy
npm run db:seed            # optional; only for a fresh environment
```

`npm run db:push` is a quick alternative to `db:migrate:dev` when you do not need migration history. `npm run db:generate` and `npm run db:validate` regenerate and validate the client on demand. Use a separate database per environment, and never run `migrate dev` against production.

The seed is idempotent (safe to re-run) and reads optional overrides: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_CUSTOMER_EMAIL`, `SEED_CUSTOMER_PASSWORD`. Always override the default credentials before deploying.

> Note: the seed command is wired via `package.json#prisma.seed` (used by `prisma db seed` / `prisma migrate reset`). Prisma 7 will move this to `prisma.config.ts`; the current 6.x setup is unaffected.

## 4. Environment variables

Configure these values in the hosting provider’s encrypted environment store, not in Git:

```text
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.your-domain.example
AUTH_SECRET=<at-least-32-random-bytes>
DATABASE_URL=<postgresql-url>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<razorpay-public-key>
RAZORPAY_KEY_SECRET=<razorpay-secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay-webhook-secret>
CMS_API_URL=<optional-headless-cms-url>
CMS_API_TOKEN=<optional-headless-cms-token>
```

Generate `AUTH_SECRET` with `openssl rand -base64 48`. The application refuses production authentication if it is absent.

## 5. Razorpay

1. Create Razorpay test keys first and set them in the preview environment.
2. Configure a webhook to `https://www.your-domain.example/api/webhooks/razorpay`.
3. Subscribe to `payment.captured` and set the same webhook secret as `RAZORPAY_WEBHOOK_SECRET`.
4. Verify order creation, signature validation, invoice download, and failed-payment behavior with test cards.
5. Replace only the test keys with live keys after a successful acceptance test.

Payment secrets are server-only. Never use `RAZORPAY_KEY_SECRET` in browser code.

## 6. Vercel or Netlify deployment

### Vercel

Import the `next-app` directory as the project root. Use build command `npm run build`, install command `npm ci`, and set all environment variables for Preview and Production. Deploy from a protected main branch.

### Netlify

Use the Next.js runtime, base directory `next-app`, build command `npm run build`, and publish directory `.next`. Set the same environment variables in Site configuration. Confirm the runtime supports Next.js route handlers before enabling payment webhooks.

For both providers, run `npm.cmd run build` and `npm.cmd run lint` in CI on every pull request.

## 7. Domain configuration

Add the production domain and `www` subdomain in the host dashboard. Set the prescribed A/ALIAS or CNAME records at the DNS provider. Choose a single canonical hostname and set `NEXT_PUBLIC_SITE_URL` to it; redirect the alternate hostname permanently.

## 8. SSL

Enable the provider-managed certificate, force HTTPS, and verify the redirect from HTTP. Confirm the certificate covers both apex and `www` if both are configured. Secure session cookies are enabled in production and therefore require HTTPS.

## 9. Production checklist

- [ ] PostgreSQL persistence adapter is active; no in-memory data is used for live traffic.
- [ ] Prisma migration has completed successfully.
- [ ] `AUTH_SECRET` is unique and stored securely.
- [ ] Razorpay test payment and signed webhook tests pass.
- [ ] Public site URL, canonical domain, sitemap, robots rules, and analytics consent are reviewed.
- [ ] CMS editor roles are least-privilege and audit logging is enabled.
- [ ] Database backups, restore test, uptime monitoring, error reporting, and alerting are configured.
- [ ] Security headers, HTTPS redirect, dependency audit, and vulnerability scans pass.
- [ ] Accessibility keyboard, screen-reader, and mobile-device checks pass.
- [ ] Final `npm run build` and `npm run lint` pass in CI.
