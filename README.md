# Gather — Event Planner

A small full stack event planner built with Next.js and PostgreSQL. Create events with a title, date and time, location, and optional details. The home page lists upcoming events and can search them by title, location, or details.

## Get started

1. Install the project dependencies with `npm install`.
2. Create a PostgreSQL database named `event_planner` (or choose another database and use its connection URL).
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
4. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

The API creates the `events` table on first use. The matching SQL is in `database/schema.sql` if you prefer to create it yourself. Hosted databases that require TLS can use `DATABASE_SSL=true`.

## API

- `GET /api/events` — list the next 100 events, including events that started within the last day.
- `POST /api/events` — create an event. Required fields: `title`, `location`, and ISO `startsAt`; `description` is optional.
