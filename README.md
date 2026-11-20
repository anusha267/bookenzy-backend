# bookenzy-backend

REST API for Bookenzy, a reading tracker. Built with Node.js, Express and TypeScript, backed by PostgreSQL (node-postgres).

**Status: early / work in progress.** Registration and login work. Book and reading-log endpoints are partial (see below). The companion front end is [bookenzy-ui](https://github.com/anusha267/bookenzy-ui).

## What works today

Live API (free Render tier, sleeps when idle so the first request can take up to a minute): https://bookenzy-backend.onrender.com

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `GET /v1/health` | no | `{status: "ok"}`, no database call. |
| `GET /v1/version` | no | PostgreSQL version, checks the database connection. |
| `POST /v1/auth/register` | no | Body: `username`, `email`, `password`. Rejects duplicate email or username. bcrypt-hashed. |
| `POST /v1/auth/login` | no | Body: `username` or `email`, plus `password`. Returns `{ token, userId }` (HS256 JWT, 1 hour). |
| `GET /v1/shelf` | Bearer JWT | The signed-in user's shelf: `{ items: [...] }`. |
| `POST /v1/shelf` | Bearer JWT | Add an item: `title`, `author`, optional `status` (`want`/`reading`/`finished`), `rating` (0-5), `coverId`, `pages`, `year`. |
| `PATCH /v1/shelf/:id` | Bearer JWT | Update `status`, `rating` and/or `currentPage`. `finishedAt` is set when an item becomes `finished`. Only your own items. |
| `DELETE /v1/shelf/:id` | Bearer JWT | Remove an item. |
| `POST /v1/books`, `POST /v1/logs` | Bearer JWT | Original catalogue and reading-log inserts (partial). `GET /v1/books` is still a stub. |

CORS allows `https://anusha267.github.io` and `http://localhost:3000` (override with `CORS_ORIGINS`).

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
- `BOOKENZY_JWT_SECRET`: long random string used to sign tokens. Required; login fails without it.
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
- Implement `GET /v1/books`, update and finish reading logs
- Tests

## Security note

Never commit `.env` files. Use `.env.example` as the template.

## License

MIT
