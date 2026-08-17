# Image Gallery

Full stack image gallery technical test: authenticated CRUD over an image
collection with uploads to MinIO, server/client rendering split, running
through Docker Compose.

## 1. Stack

Option B from the brief:

- **Backend:** Node.js / NestJS + TypeORM
- **Frontend:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **Object storage:** MinIO, via `@aws-sdk/client-s3`
- **Auth:** JWT bearer token (stored client-side in a cookie)
- **Container:** Docker Compose

## 2. How to run

```bash
cp .env.example .env
docker compose up --build
```

Then open **http://localhost:3000**. No other manual steps: the backend
creates the MinIO bucket (with a public-read policy) and loads
`seed-images.json` automatically on startup, and TypeORM syncs the DB
schema on boot — no separate migration command needed.

| Service | Port |
|---|---|
| Frontend | 3000 |
| Backend API | 8000 |
| Database (Postgres) | 5432 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## 3. Environment variables

All variables live in `.env.example`; copy it to `.env` before running.

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | MinIO admin credentials |
| `MINIO_BUCKET_NAME` | Bucket the backend creates and uploads into |
| `MINIO_ENDPOINT` | MinIO address reached from inside the Docker network (backend → MinIO) |
| `MINIO_PUBLIC_ENDPOINT` | MinIO address reached from the browser (rendering `<img src>`) |
| `JWT_SECRET` | Signs auth tokens — change this for anything beyond local testing |
| `NODE_ENV` | Backend runtime mode |
| `NEXT_PUBLIC_API_URL` | Backend URL used by the browser (client components) |
| `INTERNAL_API_URL` | Backend URL used server-side, over the Docker network (Server Components) |
| `FRONTEND_URL` | Used by the backend to configure CORS |

## 4. Demo account

None seeded — register a new account at `/register`. (Seed images belong
to no user and are read-only, so there's nothing a demo account would
unlock that a fresh one can't.)

## 5. How uploaded images are served

The MinIO bucket is set to a public-read policy on startup, so the
frontend renders `<img src>` directly against MinIO's public endpoint;
seed images keep pointing at their original remote URLs instead.

Click counts (D1/D2) are persisted to the backend/database rather than
stored client-side, so they survive refreshes and are shared across users.

## 6. Unfinished / broken

- **Replacing the file on edit is not implemented.** The brief marks this
  optional (B3); editing is limited to title and category.

Everything else in section 3 of the brief (A1-A7, B1-B6, C1-C7, D1-D3) is
implemented and manually tested against the running stack.
