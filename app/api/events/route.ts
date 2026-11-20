import { db, ensureEventsTable } from "@/lib/db";


type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  starts_at: Date;
};

function serializeEvent(row: EventRow) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: new Date(row.starts_at).toISOString(),
  };
}

export async function GET() {
  try {
    await ensureEventsTable();
    const result = await db.query<EventRow>(
      `SELECT id, title, description, location, starts_at
       FROM events WHERE starts_at >= NOW() - INTERVAL '1 day'
       ORDER BY starts_at ASC LIMIT 100`,
    );
    return Response.json(result.rows.map(serializeEvent), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load events", error);
    return Response.json({ error: "Could not load events." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Please submit valid event details." }, { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const startsAt = typeof body.startsAt === "string" ? new Date(body.startsAt) : null;

  if (!title || title.length > 120) {
    return Response.json({ error: "Event name is required (up to 120 characters)." }, { status: 400 });
  }
  if (!location || location.length > 160) {
    return Response.json({ error: "Location is required (up to 160 characters)." }, { status: 400 });
  }
  if (description.length > 500) {
    return Response.json({ error: "Details must be 500 characters or fewer." }, { status: 400 });
  }
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return Response.json({ error: "Please choose a valid date and time." }, { status: 400 });
  }

  try {
    await ensureEventsTable();
    const result = await db.query<EventRow>(
      `INSERT INTO events (title, description, location, starts_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, location, starts_at`,
      [title, description || null, location, startsAt.toISOString()],
    );
    return Response.json(serializeEvent(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error("Failed to create event", error);
    return Response.json({ error: "Could not save the event. Check your database setup." }, { status: 500 });
  }
}
