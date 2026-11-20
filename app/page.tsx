"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string;
  startsAt: string;
};

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load events.");
      setEvents(await response.json());
    } catch {
      setError("Could not connect to the event list. Check your database setup.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return events;
    return events.filter((event) =>
      `${event.title} ${event.location} ${event.description ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [events, query]);

  async function createEvent(formData: FormData) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(formData.entries()),
          startsAt: new Date(String(formData.get("startsAt"))).toISOString(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not create event.");
      setEvents((current) => [result, ...current]);
      (document.getElementById("event-form") as HTMLFormElement | null)?.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create event.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void createEvent(new FormData(event.currentTarget));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Gather home">
          <span className="brand-mark">g</span><span>gather</span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <a className="side-link active" href="#events"><span>▦</span> My events <span className="side-count">{events.length}</span></a>
        <a className="side-link" href="#create"><span>＋</span> Create event</a>
        <div className="sidebar-bottom"><span className="avatar">Y</span><div><strong>Your workspace</strong><small>Personal planner</small></div><span className="dots">···</span></div>
      </aside>

      <section className="main-area" id="home">
        <header className="topbar"><span className="breadcrumb">Workspace <span>/</span> My events</span><button className="help-button" aria-label="Help">?</button></header>
        <div className="content-wrap">
          <div className="page-heading">
            <div><div className="eyebrow">YOUR SPACE, YOUR PLANS</div><h1>My events<span className="heading-period">.</span></h1><p>Bring your people together. It all starts here.</p></div>
            <a className="primary-button heading-action" href="#create"><span>＋</span> New event</a>
          </div>

          <section className="event-panel" id="events">
            <div className="panel-heading"><div><h2>Upcoming events</h2><p>{events.length} {events.length === 1 ? "event" : "events"} on your calendar</p></div><label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events" aria-label="Search events" /></label></div>
            {error && <div className="notice" role="alert">{error}</div>}
            {loading ? <div className="empty-state"><span className="loader"/><p>Gathering your events…</p></div> : filteredEvents.length ? (
              <div className="event-list">{filteredEvents.map((event) => {
                const date = new Date(event.startsAt);
                return <article className="event-row" key={event.id}>
                  <div className="date-tile"><span>{new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase()}</span><strong>{date.getDate()}</strong></div>
                  <div className="event-details"><h3>{event.title}</h3><p><span>◷</span> {dateLabel(event.startsAt)} <i>·</i> <span>⌖</span> {event.location}</p>{event.description && <p className="event-description">{event.description}</p>}</div>
                  <span className="event-tag">UPCOMING</span>
                </article>;
              })}</div>
            ) : <div className="empty-state"><span className="empty-icon">✳</span><h3>{query ? "No events match your search" : "Your calendar is a blank canvas"}</h3><p>{query ? "Try another title or location." : "Make a little room for something memorable."}</p>{!query && <a href="#create" className="text-link">Plan your first event <span>→</span></a>}</div>}
          </section>

          <section className="create-panel" id="create">
            <div className="create-intro"><div className="create-icon">✳</div><div><div className="eyebrow">MAKE IT HAPPEN</div><h2>Plan something good.</h2><p>Just the details for now. You can figure out the rest later.</p></div></div>
            <form id="event-form" onSubmit={handleSubmit} className="event-form">
              <label className="field full"><span>Event name</span><input name="title" placeholder="e.g. Friday night dinner" required maxLength={120} /></label>
              <label className="field"><span>Date & time</span><input type="datetime-local" name="startsAt" required /></label>
              <label className="field"><span>Location</span><input name="location" placeholder="Add a place" required maxLength={160} /></label>
              <label className="field full"><span>A few details <em>Optional</em></span><textarea name="description" placeholder="What should everyone know?" rows={2} maxLength={500} /></label>
              <div className="form-footer"><span>✦ &nbsp;Good plans start small.</span><button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Create event"}<span>→</span></button></div>
            </form>
          </section>
          <footer className="footer-note"><span>Made for getting together.</span><span>GATHER · EVENT PLANNER</span></footer>
        </div>
      </section>
    </main>
  );
}
