# Queens Care Laboratories

Premium, responsive Next.js storefront foundation for Queens Care Laboratories.

## Run locally

```bash
npm.cmd run dev
npm.cmd run build
```

## Architecture

- `app/components/QueensCareExperience.tsx` is the editable storefront content and interaction layer.
- `app/components/CareScene.tsx` is the motion-safe Three.js hero enhancement.
- `app/[...slug]/page.tsx` supplies graceful pages for commercial, support, and portal URLs while their secured services are connected.
- `app/sitemap.ts` and `app/robots.ts` provide search engine discovery endpoints.

## Production integrations required

The schema and Prisma CLI are included for the production persistence migration. Run `npm run db:generate`, `npm run db:validate`, and `npm run db:migrate` against the configured PostgreSQL instance before accepting live orders. The local adapter remains intentionally deterministic for offline development. Never expose payment secrets in browser code.

Suggested environment variables:

```text
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
DATABASE_URL=
CMS_API_URL=
CMS_API_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

Run dependency security review in the deployment environment before release: `npm audit`.
