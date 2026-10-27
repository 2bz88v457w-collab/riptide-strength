import { useState, useMemo } from "react";
import { C } from "../constants";
import { computeMovementProgress, estimatedBenchmarks, fmtDate, parseLoadNum, roundLoad } from "../helpers";
import { MovePicker } from "./MovePicker";
import { useIsNarrow } from "../hooks";

const SHARES = [70, 80, 90];

// ─── 3RM BENCHMARKS ───────────────────────────────────────────────────────────
// Estimated from logged sets, corrected by the coach where the estimate is off.
// These are what "75% 3RM" in a workout resolves to for each athlete.
function BenchmarkTab({ athletes, workouts, logs, seasons, defaultSeason, benchmarks = [], ready = false, onSave }) {
  const narrow = useIsNarrow();
  const [season, setSeason] = useState(defaultSeason || "All");
  const [moveKey, setMoveKey] = useState("");
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState({});        // athleteId → what's typed in the box
  const [busy, setBusy] = useState(null);

  const movements = useMemo(
    () => computeMovementProgress(athletes, workouts, logs, { season }).filter((m) => m.metric === "load"),
    [athletes, workouts, logs, season]
  );
  const selected = movements.find((m) => m.key === moveKey) || movements[0];
  const estimates = useMemo(
    () => selected ? estimatedBenchmarks(selected.movement, workouts, logs, { season }) : new Map(),
    [selected, workouts, logs, season]
  );

  const overrideFor = (athleteId) => benchmarks.find((b) =>
    b.athlete_id === athleteId && (b.movement || "").toLowerCase() === (selected?.key || ""));

  const rows = (selected?.rows || []).map((r) => {
    const est = estimates.get(r.athlete.id) || null;
    const ov = overrideFor(r.athlete.id);
    const ovValue = ov ? parseLoadNum(ov.value) : null;
    return { athlete: r.athlete, est, ovValue, value: ovValue ?? est?.value ?? null, source: ovValue !== null ? "coach" : est ? "estimated" : null };
  }).filter((r) => r.value !== null)
    .sort((a, b) => b.value - a.value || a.athlete.name.localeCompare(b.athlete.name));

  const commit = async (athleteId) => {
    const typed = (draft[athleteId] ?? "").trim();
    const current = overrideFor(athleteId);
    const num = parseLoadNum(typed);
    setDraft((d) => { const next = { ...d }; delete next[athleteId]; return next; });
    if (typed === "" && !current) return;                       // nothing to do
    if (typed !== "" && num !== null && num === parseLoadNum(current?.value)) return;
    if (typed !== "" && (num === null || num <= 0)) return;
    setBusy(athleteId);
    await onSave(athleteId, selected.key, typed === "" ? null : num);
    setBusy(null);
  };

  const pill = (active) => ({
    border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 20, padding: "4px 11px",
    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    background: active ? C.tealGlow : "transparent", color: active ? C.teal : C.mutedUp,
  });
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "7px 10px", fontSize: 13, fontFamily: "inherit" };
  const th = { fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", padding: "6px 10px", textAlign: "right", whiteSpace: "nowrap" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => setPicking(true)} disabled={movements.length === 0}
          style={{ ...inp, fontWeight: 800, fontSize: 14, cursor: movements.length ? "pointer" : "default" }}>
          {selected ? selected.movement : "No weighted movements yet"} <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>▾</span>
        </button>
        {seasons.length > 0 && ["All", ...seasons].map((s) => (
          <button key={s} onClick={() => setSeason(s)} style={pill(season === s)}>{s}</button>
        ))}
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>
        Estimated from each athlete's best logged set — a set of 5 at 95 lbs implies a 3RM near 100.
        Type over it to correct one. Write <strong style={{ color: C.mutedUp }}>75% 3RM</strong> in a workout's load box and each
        athlete sees their own weight.
        {!ready && <span style={{ color: C.gold }}> Corrections save once <code>supabase/09-benchmarks.sql</code> has been run.</span>}
      </p>

      {movements.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🏋️</p>
          <p style={{ margin: 0 }}>No weighted movements logged{season !== "All" ? " this season" : ""} yet.</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>Benchmarks appear as athletes log reps and weight together.</p>
        </div>
      )}

      {selected && rows.length === 0 && (
        <p style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>
          Nobody has logged reps and weight for {selected.movement} yet — a benchmark needs both.
        </p>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left", paddingLeft: 12 }}>Athlete</th>
                {!narrow && <th style={{ ...th, textAlign: "left" }}>Estimated from</th>}
                <th style={th}>3RM</th>
                {SHARES.map((p) => <th key={p} style={th}>{p}%</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.athlete.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "6px 10px 6px 12px", color: C.white, fontWeight: 600, whiteSpace: "nowrap" }}>{r.athlete.name}</td>
                  {!narrow && (
                    <td style={{ padding: "6px 10px", color: C.muted, fontSize: 11.5, whiteSpace: "nowrap" }}>
                      {r.est ? `${r.est.reps}×${r.est.load} on ${fmtDate(r.est.date)} → ${r.est.value}` : "no logged set"}
                    </td>
                  )}
                  <td style={{ padding: "4px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <input
                      value={draft[r.athlete.id] ?? (r.ovValue !== null ? String(r.ovValue) : "")}
                      onChange={(e) => setDraft((d) => ({ ...d, [r.athlete.id]: e.target.value }))}
                      onBlur={() => commit(r.athlete.id)}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      disabled={!ready || busy === r.athlete.id}
                      placeholder={r.est ? String(r.est.value) : "—"}
                      aria-label={`3RM for ${r.athlete.name}`}
                      title={r.source === "coach" ? "Your number — clear the box to go back to the estimate" : "Estimated from their logs — type to correct it"}
                      inputMode="decimal"
                      style={{ ...inp, width: 74, textAlign: "right", padding: "5px 8px", fontWeight: 800, color: r.source === "coach" ? C.teal : C.white, borderColor: r.source === "coach" ? `${C.teal}66` : C.border }}
                    />
                  </td>
                  {SHARES.map((p) => (
                    <td key={p} style={{ padding: "6px 10px", textAlign: "right", color: C.mutedUp, whiteSpace: "nowrap" }}>{roundLoad((r.value * p) / 100)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {picking && (
        <MovePicker
          title="Which movement?"
          subtitle="Weighted movements with logged sets"
          names={movements.map((m) => m.movement)}
          allowCustom={false}
          onPick={(name) => {
            const hit = movements.find((m) => m.movement === name);
            if (hit) { setMoveKey(hit.key); setDraft({}); }
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

export { BenchmarkTab };
