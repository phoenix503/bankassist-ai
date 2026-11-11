# BankAssist AI

BankAssist AI is a demo banking support application with an Angular web client, a Next.js API, PostgreSQL with pgvector, Prisma, and Google Gemini. It includes customer and transaction views, dispute workflows, policy search, and AI assisted investigation.

> **Security status:** This is for local development and demonstration only. The API does not currently enforce server-side authentication or authorization. Customer, support, and admin endpoints can be called directly, and the frontend session guard is only a UI guard. Do not expose this API publicly or use real customer/financial data until proper authentication, role checks, and customer ownership checks are implemented.

## Requirements

- Node.js and npm
- Docker Desktop (or Docker Engine) with Docker Compose
- A Google AI Studio API key for Gemini features

## Environment setup

Copy `apps/api/.env.example` to `apps/api/.env.local`. Set `POSTGRES_PASSWORD`, `DATABASE_URL`, and `GOOGLE_API_KEY` to your local values. The password in `DATABASE_URL` must match `POSTGRES_PASSWORD`. Keep `.env.local` private; it is ignored by Git.

Example `DATABASE_URL` format:

```text
postgresql://bankassist:YOUR_LOCAL_PASSWORD@localhost:5432/bankassist?schema=public
```

## Command list

Run commands from the repository root unless a command first changes directory.

### Install dependencies

```sh
npm ci --prefix apps/api
npm ci --prefix apps/web
```

### PostgreSQL and Docker

Start the PostgreSQL/pgvector container. Compose reads the password from the API environment file:

```sh
docker compose --env-file apps/api/.env.local up -d postgres
```

Other useful Docker commands:

```sh
docker compose --env-file apps/api/.env.local ps
docker compose --env-file apps/api/.env.local logs -f postgres
docker compose --env-file apps/api/.env.local stop postgres
docker compose --env-file apps/api/.env.local start postgres
docker compose --env-file apps/api/.env.local down
```

The database port is bound to `127.0.0.1:5432`. `down` stops and removes the container/network but preserves the named `postgres_data` volume. Do not remove that volume unless you intend to delete the local database.

### Backend (BE/API)

Run Prisma and Next.js commands from `apps/api`. Next.js loads `.env.local` automatically. Prisma CLI and the seed script need the environment variables exported in the shell, so load them before running the database commands:

```sh
cd apps/api
set -a && source .env.local && set +a
npm run db:generate
npm run db:migrate
npm run dev
```

`db:migrate` applies checked-in migrations to the configured database. To create a new migration during development after editing the Prisma schema, use:

```sh
set -a && source .env.local && set +a
npx prisma migrate dev --name describe_your_change
```

To load the synthetic demo customers, accounts, and transactions:

```sh
set -a && source .env.local && set +a
npm run db:seed
```

Run a production build or lint from `apps/api`:

```sh
npm run build
npm run lint
npm run start
```

The API runs at `http://localhost:3000` in development. Database health endpoint:

```sh
curl http://localhost:3000/api/health/db
```

### Web client

In a separate terminal, from the repository root:

```sh
cd apps/web
npm start
```

The Angular app runs at `http://localhost:4200` and calls the API at `http://localhost:3000`. Other web commands, from `apps/web`:

```sh
npm run build
npm run watch
npm test
```

Set the API `WEB_ORIGIN` variable to the exact trusted web origin when running the API from a different origin. CORS only affects browser requests; it does not authenticate callers.

### Ingest or refresh policy documents

Start PostgreSQL and the backend first, and make sure `GOOGLE_API_KEY` is configured. From the repository root, send a POST request to the ingestion endpoint:

```sh
curl -X POST http://localhost:3000/api/rag/ingest
```

The endpoint reads files under `apps/api/documents/`, generates embeddings with Gemini, and inserts or updates policy chunks in PostgreSQL. It may make billable API calls. It is currently unauthenticated, so use it only on a local development server; secure it before deployment.

## Project data and Git hygiene

- `apps/api/prisma/seed.ts` contains synthetic demo data. Do not replace it with real customer records.
- Policy source documents are in `apps/api/documents/banking-policies/`.
- Environment files, database dumps, and backups are excluded by the root `.gitignore`. Keep secrets and database exports out of Git history.
- Before pushing, inspect `git status` and the files staged for commit. If a secret was committed or shared, rotate it; deleting it from the working tree does not revoke it.

## Before deployment

Implement server-side authentication and authorization for every route, including role checks for support/admin actions and ownership checks for customer data. Also restrict AI and ingestion endpoints, add rate limits and request size limits, minimize personal and financial data returned, redact identifiers from logs, and configure production secrets, TLS, database access, backups, and monitoring. Review applicable privacy and compliance requirements before using real banking data.
