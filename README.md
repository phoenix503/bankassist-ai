# BankAssist AI

BankAssist AI is a demo banking support application built with an Angular web client, a Next.js API, PostgreSQL, Prisma, and Google Gemini. It includes customer and transaction views, dispute workflows, policy search, and AI assisted investigation.

> **Security status:** This repository is for local development and demonstration. It is not safe to deploy with real customer or financial data. The API currently has no server-side authentication or authorization, so customer, support, and admin endpoints can be called directly. The frontend session guard is only a user interface guard. Add a real identity system, role checks, and customer-level access checks before exposing the API or using real data.

## Requirements

- Node.js and npm
- Docker Compose
- A Google AI Studio API key for Gemini features

## Local setup

1. Copy `apps/api/.env.example` to `apps/api/.env.local` and set unique local values for `POSTGRES_PASSWORD`, `DATABASE_URL`, and `GOOGLE_API_KEY`. Keep `.env.local` private.
2. Start PostgreSQL using the API environment file for Compose interpolation:

   ```sh
   docker compose --env-file apps/api/.env.local up -d
   ```

   PostgreSQL is bound to `127.0.0.1` so it is not exposed on other network interfaces.
3. Install dependencies in each app:

   ```sh
   npm ci --prefix apps/api
   npm ci --prefix apps/web
   ```

4. From `apps/api`, apply the Prisma migrations and start the API:

   ```sh
   cd apps/api
   npx prisma migrate deploy
   npm run dev
   ```

5. In another terminal, start the Angular client:

   ```sh
   cd apps/web
   npm start
   ```

The API defaults to `http://localhost:3000`; the web client currently targets that address and runs on `http://localhost:4200`. Set `WEB_ORIGIN` to the exact trusted web origin when configuring the API for another environment. CORS is a browser restriction, not authentication.

## Environment variables

See [`apps/api/.env.example`](apps/api/.env.example). `DATABASE_URL` is used by Prisma and `POSTGRES_PASSWORD` configures the local Compose database. `GOOGLE_API_KEY` is a server-side secret and must never be added to Angular code or exposed to browsers. Do not commit `.env`, `.env.local`, credentials, or database exports.

## Data and repository hygiene

- `apps/api/prisma/seed.ts` contains synthetic demo data. Do not replace it with real customer records.
- Database dumps and backups are excluded by the root `.gitignore`. Keep sensitive dumps out of the repository and out of Git history.
- Before the first push, inspect `git status` and the staged file list. If a secret was ever committed or shared, rotate it; deleting it from the working tree does not revoke it.

## Before any deployment

- Implement server-side authentication and authorization for every API route, with role checks for support/admin actions and ownership checks for customer data.
- Protect costly AI and ingestion endpoints with authorization, rate limits, input size limits, and abuse monitoring.
- Minimize personal and financial data returned by APIs; mask account numbers and remove sensitive identifiers from logs.
- Use managed secrets, TLS, production database credentials, backups, monitoring, and appropriate privacy/compliance review for the deployment jurisdiction.
- Review CORS, security headers, dependency advisories, and database access rules for the actual deployment environment.
