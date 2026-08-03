import { useState } from "react";
import { C, STROKES, DISTANCES } from "../constants";
import { fmtDate, computeSessions, attendanceByAthlete } from "../helpers";
import { Avatar } from "./common";

// Attendance derived from logs: present = logged a workout assigned that day.
// No separate roll call, so it works retroactively across all history.
function AttendanceTab({ athletes, workouts, logs }) {
  const [seasonFilter, setSeasonFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [view, setView] = useState("athlete");
  const [openDate, setOpenDate] = useState(null);
  // Inclusive date range; blank means open-ended on that side.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const seasons = [...new Set([...workouts].sort((a, b) => b.date.localeCompare(a.date)).map((w) => w.season).filter(Boolean))];
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const tags = [...new Set(athletes.flatMap((a) => a.tags ?? []))].sort();

  const inGroup = (a) => {
    if (groupFilter === "All") return true;
    if (tags.includes(groupFilter)) return (a.tags ?? []).includes(groupFilter);
    if (STROKES.includes(groupFilter)) return a.stroke === groupFilter;
    if (DISTANCES.includes(groupFilter)) return a.distance === groupFilter;
    return a.event === groupFilter;
  };
  const roster = athletes.filter(inGroup);
  const rosterIds = new Set(roster.map((a) => a.id));

  const sessions = computeSessions(workouts, logs, { season: seasonFilter, from, to });
  // Narrow each session to the filtered roster so counts match the group shown.
  const scoped = sessions.map((s) => ({
    ...s,
    assigned: new Set([...s.assigned].filter((id) => rosterIds.has(id))),
    present: new Set([...s.present].filter((id) => rosterIds.has(id))),
  })).filter((s) => s.assigned.size > 0);
  const byAthlete = attendanceByAthlete(scoped, roster).sort((a, b) => (a.rate ?? 1) - (b.rate ?? 1) || a.athlete.name.localeCompare(b.athlete.name));

  const totalAssigned = scoped.reduce((n, s) => n + s.assigned.size, 0);
  const totalPresent = scoped.reduce((n, s) => n + s.present.size, 0);
  const overall = totalAssigned ? totalPresent / totalAssigned : null;
  const rateColor = (r) => r === null ? C.muted : r >= 0.8 ? C.teal : r >= 0.5 ? C.gold : C.red;
  const pct = (r) => r === null ? "—" : `${Math.round(r * 100)}%`;

  const pill = (label, active, onClick, key) => (
    <button key={key} onClick={onClick} style={{ border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: active ? C.tealGlow : "transparent", color: active ? C.teal : C.mutedUp }}>{label}</button>
  );

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Attendance</h1>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>
          Based on logged sessions — an athlete counts as present if they logged a workout assigned that day.
          {(from || to) && <span style={{ color: C.teal }}> Showing {from ? `from ${fmtDate(from)}` : "everything up to"}{to ? ` to ${fmtDate(to)}` : from ? " onward" : ` ${fmtDate(to)}`}.</span>}
        </p>
      </div>

      {scoped.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
          <div style={{ background: C.surfaceUp, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>Sessions</p>
            <p style={{ margin: "5px 0 0", fontSize: 26, fontWeight: 800, color: C.white }}>{scoped.length}</p>
          </div>
          <div style={{ background: C.surfaceUp, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>Attendance</p>
            <p style={{ margin: "5px 0 0", fontSize: 26, fontWeight: 800, color: rateColor(overall) }}>{pct(overall)}</p>
          </div>
          <div style={{ background: C.surfaceUp, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>Logged / assigned</p>
            <p style={{ margin: "5px 0 0", fontSize: 26, fontWeight: 800, color: C.white }}>{totalPresent}<span style={{ fontSize: 14, color: C.muted }}>/{totalAssigned}</span></p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ background: C.surfaceUp, border: `1px solid ${from ? C.teal : C.border}`, borderRadius: 8, color: C.white, padding: "7px 10px", fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ background: C.surfaceUp, border: `1px solid ${to ? C.teal : C.border}`, borderRadius: 8, color: C.white, padding: "7px 10px", fontSize: 13, fontFamily: "inherit" }} />
        </div>
        {(from || to) && <button onClick={() => { setFrom(""); setTo(""); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 12, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}>Clear dates</button>}
      </div>

      {seasons.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          {pill("All seasons", seasonFilter === "All", () => setSeasonFilter("All"), "s-all")}
          {seasons.map((s) => pill(s, seasonFilter === s, () => setSeasonFilter(s), "s-" + s))}
        </div>
      )}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {pill("Everyone", groupFilter === "All", () => setGroupFilter("All"), "g-all")}
        {poolGroups.map((g) => pill(g, groupFilter === g, () => setGroupFilter(g), "g-" + g))}
        {tags.map((t) => pill(`🏷 ${t}`, groupFilter === t, () => setGroupFilter(t), "t-" + t))}
      </div>

      <div style={{ display: "flex", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden", width: "fit-content", marginBottom: 14 }}>
        {[["athlete", "By athlete"], ["session", "By session"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ border: "none", padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: view === v ? C.teal : "transparent", color: view === v ? C.bg : C.muted }}>{label}</button>
        ))}
      </div>

      {scoped.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>📋</p>
          <p style={{ margin: 0 }}>No assigned sessions match these filters.</p>
        </div>
      )}

      {view === "athlete" && byAthlete.map(({ athlete: a, assigned, attended, rate, missedDates }) => (
        <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 16px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={a.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{a.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>
              {[a.event, ...(a.tags ?? []).map((t) => `🏷 ${t}`)].filter(Boolean).join(" · ")}
              {missedDates.length > 0 && <span style={{ color: C.mutedUp }}> · missed {missedDates.slice(0, 3).map(fmtDate).join(", ")}{missedDates.length > 3 ? ` +${missedDates.length - 3}` : ""}</span>}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: rateColor(rate) }}>{pct(rate)}</p>
            <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{attended}/{assigned} sessions</p>
          </div>
        </div>
      ))}

      {view === "session" && scoped.map((s) => {
        const rate = s.assigned.size ? s.present.size / s.assigned.size : null;
        const missing = roster.filter((a) => s.assigned.has(a.id) && !s.present.has(a.id));
        const open = openDate === s.date;
        return (
          <div key={s.date} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 16px", marginBottom: 6 }}>
            <div onClick={() => setOpenDate(open ? null : s.date)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{open ? "▾" : "▸"} {fmtDate(s.date)}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[...new Set(s.titles)].join(" · ")}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: rateColor(rate) }}>{pct(rate)}</p>
                <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{s.present.size}/{s.assigned.size} logged</p>
              </div>
            </div>
            {open && (
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10 }}>
                {missing.length === 0
                  ? <p style={{ margin: 0, fontSize: 12, color: C.teal }}>Everyone assigned logged this session.</p>
                  : <>
                      <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Did not log ({missing.length})</p>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {missing.map((a) => <span key={a.id} style={{ fontSize: 11, color: C.mutedUp, background: C.surfaceUp, borderRadius: 10, padding: "3px 9px" }}>{a.name}</span>)}
                      </div>
                    </>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { AttendanceTab };
