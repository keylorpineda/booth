# Deployment Guide

This guide covers deploying Booth on the free tiers of **Neon** (PostgreSQL), **Render** (NestJS API), **Vercel** (React SPA) and **Cloudinary** (media storage).

---

## 1. Free-Tier Limits & Architecture

### Service Limits

| Service        | Plan             | Resources / Limits                                                             | Inactivity Behavior                                                                        |
| -------------- | ---------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Neon**       | Free             | 0.5 GiB storage, 0.25–2 vCPU compute, PgBouncer pooled connections (port 6543) | Computes suspend after 5 minutes of inactivity; wakes automatically on query (< 1 s).      |
| **Render**     | Free Web Service | 512 MB RAM, 0.1 vCPU, 750 instance hours/month                                 | Spins down after 15 minutes without inbound HTTP requests. Cold start takes 45–60 seconds. |
| **Vercel**     | Hobby            | Fast Edge CDN, 100 GB bandwidth, unlimited static assets                       | Always active globally with zero cold starts for static files.                             |
| **Cloudinary** | Free             | 25 monthly credits (~25 GB storage / net bandwidth)                            | Persistent media storage; signed URLs for private receipts.                                |

### Architecture

```
[ Customer / Owner Browser ]
             │
             │ HTTPS (first-party cookies)
             ▼
      [ Vercel Edge CDN ]
      (apps/web: React SPA)
             │
      /api/* │ (Vercel rewrite)
             ▼
    [ Render Web Service ]
    (apps/api: NestJS REST)
       │              │
       │ SQL (pooled) │ Signed upload / viewing
       ▼              ▼
[ Neon PostgreSQL ]  [ Cloudinary ]
```

- **First-party auth cookie**: The browser only communicates directly with the Vercel domain. Vercel rewrites `/api/*` to Render, ensuring the HTTP-only refresh cookie (`booth.refresh`) remains first-party without cross-site cookie restrictions.
- **Cold start handling**: When Render sleeps, opening the storefront displays a subtle non-blocking notice (`WakingNotice`) while the inline prefetch script in `index.html` initiates the backend wake-up.
- **Automated upkeep**: A scheduled GitHub Actions workflow pings `POST /api/internal/jobs/expire-orders` every 10 minutes, running background stock expirations and keeping the instance warm during peak hours.

---

## 2. Environment Variables

### Render (`apps/api`)

| Variable                  | Description                          | Example / Recommended Value                                                                   |
| ------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `NODE_ENV`                | Environment mode                     | `production`                                                                                  |
| `PORT`                    | HTTP port                            | `10000` (or Render default)                                                                   |
| `LOG_LEVEL`               | Pino log level                       | `info`                                                                                        |
| `TRUST_PROXY`             | Proxy hop count for rate limiting    | `2` (Vercel edge + Render reverse proxy)                                                      |
| `CORS_ORIGINS`            | Permitted browser origins            | `https://your-booth.vercel.app`                                                               |
| `WEB_PUBLIC_URL`          | Public web domain for WhatsApp links | `https://your-booth.vercel.app`                                                               |
| `DATABASE_URL`            | Neon direct connection string        | `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`                |
| `JWT_ACCESS_SECRET`       | 32+ character random secret          | Generate via `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_ACCESS_TTL_MINUTES`  | Access token lifespan                | `15`                                                                                          |
| `REFRESH_TOKEN_TTL_DAYS`  | Refresh token lifespan               | `30`                                                                                          |
| `JOB_SECRET`              | Secret for order expiration job      | Generate random 32+ char secret                                                               |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary account name              | Copied from Cloudinary console                                                                |
| `CLOUDINARY_API_KEY`      | Cloudinary API Key                   | Copied from Cloudinary console                                                                |
| `CLOUDINARY_API_SECRET`   | Cloudinary API Secret                | Copied from Cloudinary console                                                                |
| `RECEIPT_URL_TTL_SECONDS` | Signed receipt URL lifetime          | `300`                                                                                         |
| `GEMINI_API_KEY`          | Optional: AI receipt verification    | From Google AI Studio; without it receipts are reviewed manually                              |

### Vercel (`apps/web`)

| Variable            | Description                         | Value                           |
| ------------------- | ----------------------------------- | ------------------------------- |
| `VITE_API_BASE_URL` | Base path for API calls             | `/api`                          |
| `VITE_PUBLIC_URL`   | Canonical public URL of the web app | `https://your-booth.vercel.app` |

### GitHub Actions Secrets

Configured in repository **Settings → Secrets and variables → Actions**:

| Secret                   | Description                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `RENDER_DEPLOY_HOOK_URL` | Deploy Hook URL from Render Web Service settings                                                                 |
| `JOB_SECRET`             | Matches the `JOB_SECRET` set on Render                                                                           |
| `API_URL`                | _(Optional)_ Direct Render URL (e.g. `https://booth-api.onrender.com`), defaults to the configured Render domain |

---

## 3. Step-by-Step Deployment

### Step 1: Provision Neon Database

1. Sign up at [neon.tech](https://neon.tech) and create a project in a region close to Render (e.g., `US East (Ohio)` or `US East (N. Virginia)`).
2. On the Neon dashboard, click **Connect**.
3. Turn **Connection pooling off** and copy the direct connection string (`prisma migrate deploy` takes an advisory lock, which the pooler does not support):
   ```
   postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this connection string for the Render setup.

### Step 2: Configure Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. In the Cloudinary Console, note your **Cloud Name**, **API Key**, and **API Secret**.
3. In **Settings → Security**, verify that **Allow delivery of PDF and ZIP files** is enabled (required for viewing PDF payment receipts).

### Step 3: Deploy API on Render

1. Sign up at [render.com](https://render.com) and link your GitHub account.
2. Click **New + → Web Service** and select the `booth` repository.
3. Configure the service settings:
   - **Name**: `booth-api`
   - **Region**: Same region as your Neon database (e.g., `Ohio (US East)`).
   - **Branch**: `main`
   - **Root Directory**: `.` (leave empty for repo root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm build:shared && pnpm --filter @booth/api build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @booth/api prisma:deploy && pnpm --filter @booth/api start
     ```
   - **Instance Type**: `Free`
4. In **Advanced**:
   - **Health Check Path**: `/health`
5. Under **Environment Variables**, add the variables listed in the Render table above.
6. Click **Create Web Service**. Render will build the monorepo, apply migrations via `prisma migrate deploy`, and start NestJS.
7. Under **Settings → Deploy Hook**, click **Add Deploy Hook** and copy the generated URL.

### Step 4: Seed Demo Stores (Optional but Recommended)

Free Render instances have no Shell, so run the seed once from your machine against Neon (the value stays in your terminal, never in a file):

```bash
DATABASE_URL="<neon connection string>" pnpm --filter @booth/api db:seed
```

This seeds the idempotent sample stores (`panaderia-demo` and `cafe-demo`) with categories, products, delivery zones, business hours, and sample orders.

### Step 5: Deploy Frontend on Vercel

1. Sign up at [vercel.com](https://vercel.com) and import the `booth` GitHub repository.
2. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm --filter @booth/web... build` (builds `@booth/shared` first; also set in `vercel.json`)
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install --frozen-lockfile`
   - **Node.js Version** (Settings → Build and Deployment): `24.x`
3. In `apps/web/vercel.json`, ensure the `/api/*` rewrite destination matches your Render URL:
   ```json
   {
     "source": "/api/:path*",
     "destination": "https://booth-api.onrender.com/api/:path*"
   }
   ```
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `/api`
   - `VITE_PUBLIC_URL`: `https://your-booth.vercel.app`
5. Click **Deploy**. Vercel will create the production deployment and preview environments for incoming pull requests.

### Step 6: Configure CI/CD Secrets in GitHub

In your GitHub repository, navigate to **Settings → Secrets and variables → Actions** and create:

- `RENDER_DEPLOY_HOOK_URL`: The Deploy Hook URL copied from Render.
- `JOB_SECRET`: The shared secret matching `JOB_SECRET` on Render.

---

## 4. Operational Runbook

### Continuous Deployment (CD)

- **Frontend**: Vercel automatically deploys preview builds for all pull requests and deploys to production whenever `main` is updated.
- **Backend**: When a commit or release is pushed to `main`, the GitHub Actions `CI` workflow runs all linters, type checks, and tests. Upon passing, it triggers the Render Deploy Hook. Render pulls `main`, runs `prisma migrate deploy`, and hot-reloads the API.

### Database Migrations

New Prisma migrations committed to `apps/api/prisma/migrations/` run automatically on Render during the start command (`pnpm --filter @booth/api prisma:deploy`).

To run migrations manually from a local machine pointing to Neon:

```bash
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" pnpm --filter @booth/api prisma:deploy
```

The row-level security migration creates the `booth_app` role (no login, no password) and lets the
migrating role switch to it. Nothing to configure: `DATABASE_URL` keeps the owner role, and the API
switches to `booth_app` only inside owner requests. To check it on Neon:

```sql
SELECT rolname, rolcanlogin, rolbypassrls FROM pg_roles WHERE rolname = 'booth_app';
SELECT tablename, policyname FROM pg_policies ORDER BY tablename;
```

### Rollback Procedure

1. **Frontend**: In the Vercel dashboard, navigate to **Deployments**, locate the last healthy deployment, click **... → Promote to Production**.
2. **Backend**:
   - Revert the bad commit on `main` or trigger a previous deploy in the Render dashboard under **Events / Deploys → Redeploy**.
   - If a database migration needs reversal, apply a down migration using `prisma migrate resolve` or a corrective migration script.
