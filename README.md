# bookenzy-backend

REST API for Bookenzy, a reading tracker. Built with Node.js, Express and TypeScript, backed by PostgreSQL (Neon serverless driver).

**Status: early / work in progress.** Registration and login work. Book and reading-log endpoints are partial (see below). The companion front end is [bookenzy-ui](https://github.com/anusha267/bookenzy-ui).

## What works today

| Endpoint | Status | Notes |
| --- | --- | --- |
| `POST /v1/auth/register` | Working | Body: `username`, `email`, `password`. Rejects duplicate email or username. Password stored as a bcrypt hash. |
| `POST /v1/auth/login` | Working | Body: `username` or `email`, plus `password`. Returns `{ token, userId }`. The JWT is HS256 and expires in 1 hour. |
| `GET /v1/health` | Working | Returns `{status: "ok"}`. No database call. |
| `GET /v1/version` | Working | Returns the PostgreSQL version. Handy for checking the database connection. |
| `POST /v1/books` | Partial | Inserts a book. Not behind authentication yet. |
| `GET /v1/books` | Not implemented | Handler is a stub. |
| `POST /v1/logs` | Partial | Creates a reading log entry (user, book, start time). Not behind authentication yet. |

`authenticateJWT` middleware exists in `src/middleware/authMiddleware.ts` but is not applied to any route yet.

## Run it locally

Prerequisites: Node.js 18+ and a PostgreSQL database (a free Neon project works).

```bash
git clone https://github.com/anusha267/bookenzy-backend.git
cd bookenzy-backend
npm install
cp .env.example .env   # then fill in the values
npm start              # runs src/index.ts with ts-node on PORT (default 8080)
```

Environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `BOOKENZY_JWT_SECRET`: long random string used to sign tokens. Always set it. If it is missing the code falls back to a placeholder secret, which is not safe.
- `PORT`: optional, defaults to 8080

Create the tables with `psql "$DATABASE_URL" -f schema.sql` (`schema.sql` is inferred from the models).

Try it:

```bash
curl -X POST localhost:8080/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"username":"ada","email":"ada@example.com","password":"correct horse"}'
curl -X POST localhost:8080/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"ada","password":"correct horse"}'
```

## Deploy (free, no card)

`render.yaml` is a [Render](https://render.com) Blueprint for a free web service. Create a Blueprint from this repo, then set `DATABASE_URL` in the dashboard (the JWT secret is generated). Free instances sleep after ~15 minutes idle, so the first request can be slow.

## Scripts

- `npm start`: run with ts-node
- `npm run build`: compile to `dist/` with `tsc`
- `npm test`: no tests yet

## Roadmap

- Migrations
- Protect book and log routes with the JWT middleware
- Implement `GET /v1/books`, update and finish reading logs
- Tests

## Security note

Never commit `.env` files. Use `.env.example` as the template.

## License

MIT
