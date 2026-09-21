import { useState } from "react";
import { C, STROKES, DISTANCES } from "../constants";
import { fmtDate } from "../helpers";
import { highlightParts } from "../notes";
import { Avatar } from "./common";

const shortDate = (ms) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// One logged session's notes. Used in the feed and in Needs attention.
function NoteCard({ card, reviewsReady, onMarkAddressed }) {
  const [busy, setBusy] = useState(false);
  const { athlete, workout, date, entries, level, active, addressed, review } = card;
  const chip = active
    ? level === "pain"
      ? { text: "⚠ Pain / injury", color: C.red }
      : { text: "Sore", color: C.gold }
    : addressed
      ? { text: `✓ Addressed ${shortDate(new Date(review.reviewed_at).getTime())}`, color: C.muted }
      : level
        ? { text: level === "pain" ? "Mentions pain" : "Mentions soreness", color: C.muted }
        : null;

  const mark = async () => {
    setBusy(true);
    await onMarkAddressed(card.log);
    setBusy(false);
  };

  return (
    <div data-testid="note-card" style={{ background: C.surface, border: `1px solid ${active ? `${chip.color}66` : C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Avatar name={athlete.name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
            <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{athlete.name}</p>
            {chip && <span style={{ fontSize: 11, fontWeight: 800, color: chip.color, whiteSpace: "nowrap" }}>{chip.text}</span>}
          </div>
          <p style={{ margin: "2px 0 8px", fontSize: 11, color: C.muted }}>
            {[date && fmtDate(date), workout?.title, athlete.event].filter(Boolean).join(" · ")}
          </p>
          {entries.map((e, i) => (
            <div key={i} style={{ marginTop: i ? 6 : 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{e.label}</span>
              <p style={{ margin: "1px 0 0", fontSize: 13, color: C.mutedUp, lineHeight: 1.45, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {highlightParts(e.text).map((p, k) => p.hit
                  ? <mark key={k} style={{ background: `${e.scan.level === "pain" ? C.red : C.gold}33`, color: C.white, fontWeight: 700, borderRadius: 3, padding: "0 2px" }}>{p.text}</mark>
                  : <span key={k}>{p.text}</span>)}
              </p>
            </div>
          ))}
          {active && (
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={mark}
                disabled={busy || !reviewsReady || card.log.id == null}
                title={reviewsReady ? "Clear this alert. It comes back if the athlete edits these notes." : "Run supabase/07-note-reviews.sql in Supabase to turn this on"}
                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 12, fontWeight: 700, padding: "5px 12px", cursor: busy || !reviewsReady ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: reviewsReady ? 1 : 0.5 }}
              >
                {busy ? "Saving…" : "Mark addressed"}
              </button>
              {level === "sore" && <span style={{ fontSize: 11, color: C.muted }}>Clears on its own after 7 days</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NOTES FEED ───────────────────────────────────────────────────────────────
// Everything athletes write — session notes and block notes — newest first.
function NotesTab({ feed, athletes, reviewsReady, onMarkAddressed }) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [limit, setLimit] = useState(50);

  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const tags = [...new Set(athletes.flatMap((a) => a.tags ?? []))].sort();
  const inGroup = (a) => {
    if (group === "All") return true;
    if (tags.includes(group)) return (a.tags ?? []).includes(group);
    if (STROKES.includes(group)) return a.stroke === group;
    if (DISTANCES.includes(group)) return a.distance === group;
    return a.event === group;
  };
  const q = search.trim().toLowerCase();
  const visible = feed.filter((c) => {
    if (!inGroup(c.athlete)) return false;
    if (flaggedOnly && !c.level) return false;
    if (q && !(c.athlete.name.toLowerCase().includes(q)
      || (c.workout?.title || "").toLowerCase().includes(q)
      || c.entries.some((e) => e.text.toLowerCase().includes(q)))) return false;
    return true;
  });
  const flaggedCount = feed.filter((c) => c.level && inGroup(c.athlete)).length;

  const pill = (label, active, onClick, key, color = C.teal) => (
    <button key={key} onClick={onClick} style={{ border: `1px solid ${active ? color : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: active ? `${color}22` : "transparent", color: active ? color : C.mutedUp }}>{label}</button>
  );

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Notes</h1>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>
          Everything athletes write — session and block notes — newest first. Pain, injury, and soreness words are highlighted.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search athlete, workout, or note…" aria-label="Search notes" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", flex: "1 1 220px", minWidth: 0 }} />
        {pill(`⚠ Pain or soreness (${flaggedCount})`, flaggedOnly, () => setFlaggedOnly((f) => !f), "flagged", C.red)}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
        {pill("Everyone", group === "All", () => setGroup("All"), "g-all")}
        {poolGroups.map((g) => pill(g, group === g, () => setGroup(g), "g-" + g))}
        {tags.map((t) => pill(`🏷 ${t}`, group === t, () => setGroup(t), "t-" + t))}
      </div>

      {feed.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🗒</p>
          <p style={{ margin: 0 }}>No athlete notes yet. They appear here as soon as someone writes one while logging.</p>
        </div>
      )}
      {feed.length > 0 && visible.length === 0 && (
        <p style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>No notes match those filters.</p>
      )}

      {visible.slice(0, limit).map((c) => (
        <NoteCard key={c.log.id ?? `${c.log.athleteId}-${c.log.workoutId}`} card={c} reviewsReady={reviewsReady} onMarkAddressed={onMarkAddressed} />
      ))}
      {visible.length > limit && (
        <button onClick={() => setLimit((l) => l + 50)} style={{ display: "block", margin: "8px auto 0", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 13, padding: "7px 16px", cursor: "pointer", fontFamily: "inherit" }}>
          Show more ({visible.length - limit} older)
        </button>
      )}
    </div>
  );
}

export { NoteCard, NotesTab };
