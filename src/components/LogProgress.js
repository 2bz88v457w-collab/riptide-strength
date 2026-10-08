import { useState, useMemo } from "react";
import { C } from "../constants";
import { computeMovementProgress } from "../helpers";
import { MovePicker } from "./MovePicker";
import { useIsNarrow } from "../hooks";

const cellDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
const DATE_WINDOW = 8;   // columns shown before "show all"

const SORTS = [
  { key: "gain", label: "Biggest gain" },
  { key: "best", label: "Heaviest / most" },
  { key: "name", label: "Name A–Z" },
  { key: "recent", label: "Most recent" },
];

// ─── PROGRESS FROM LOGS ───────────────────────────────────────────────────────
// Baselines without a test day: the first number an athlete logged for a
// movement is where they started, their best since is where they are now.
// Laid out as a grid — athletes down the side, sessions across — so a whole
// group's progression on one movement reads at a glance.
function LogProgress({ athletes, workouts, logs, seasons, defaultSeason }) {
  const narrow = useIsNarrow();
  const [season, setSeason] = useState(defaultSeason || "All");
  const [moveKey, setMoveKey] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("gain");
  const [picking, setPicking] = useState(false);
  const [allDates, setAllDates] = useState(false);

  const movements = useMemo(
    () => computeMovementProgress(athletes, workouts, logs, { season }),
    [athletes, workouts, logs, season]
  );
  // A movement chosen in one season may have no data in another — fall back to
  // the most-logged one rather than showing an empty grid.
  const selected = movements.find((m) => m.key === moveKey) || movements[0];
  const unit = selected?.metric === "load" ? "lbs" : "reps";

  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const q = search.trim().toLowerCase();
  const rows = (selected?.rows || [])
    .filter((r) => (groupFilter === "All" || r.athlete.event === groupFilter) && (!q || r.athlete.name.toLowerCase().includes(q)))
    .sort((a, b) => {
      if (sort === "name") return a.athlete.name.localeCompare(b.athlete.name);
      if (sort === "best") return b.best.value - a.best.value || a.athlete.name.localeCompare(b.athlete.name);
      if (sort === "recent") return b.latest.date.localeCompare(a.latest.date) || a.athlete.name.localeCompare(b.athlete.name);
      return b.delta - a.delta || a.athlete.name.localeCompare(b.athlete.name);
    });

  const allCols = selected?.dates || [];
  const cols = allDates ? allCols : allCols.slice(-DATE_WINDOW);
  const improved = rows.filter((r) => r.sessions >= 2 && r.delta > 0);
  const avgPct = improved.length ? improved.reduce((s, r) => s + r.pct, 0) / improved.length : null;

  const pill = (active, color = C.teal) => ({
    border: `1px solid ${active ? color : C.border}`, borderRadius: 20, padding: "4px 11px",
    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    background: active ? C.tealGlow : "transparent", color: active ? color : C.mutedUp,
  });
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "7px 10px", fontSize: 13, fontFamily: "inherit" };
  const th = { position: "sticky", top: 0, background: C.surface, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" };
  const nameCell = { position: "sticky", left: 0, background: C.surface, padding: "6px 10px 6px 2px", textAlign: "left", whiteSpace: "nowrap", borderRight: `1px solid ${C.border}` };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <button
          onClick={() => setPicking(true)}
          disabled={movements.length === 0}
          style={{ ...inp, fontWeight: 800, fontSize: 14, cursor: movements.length ? "pointer" : "default", display: "flex", alignItems: "center", gap: 8, flex: narrow ? "1 1 100%" : "0 1 auto" }}
        >
          {selected ? selected.movement : "No movements yet"}
          <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>
            {selected && `· ${selected.rows.length} athlete${selected.rows.length === 1 ? "" : "s"} · ${unit}`} ▾
          </span>
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by" style={{ ...inp, fontWeight: 700 }}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search athlete…" aria-label="Search athlete" style={{ ...inp, flex: narrow ? "1 1 100%" : "0 1 170px" }} />
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: poolGroups.length > 1 ? 6 : 10 }}>
        {seasons.length > 0 && ["All", ...seasons].map((s) => (
          <button key={s} onClick={() => setSeason(s)} style={pill(season === s)}>{s}</button>
        ))}
      </div>
      {poolGroups.length > 1 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {["All", ...poolGroups].map((g) => (
            <button key={g} onClick={() => setGroupFilter(g)} style={pill(groupFilter === g)}>{g}</button>
          ))}
        </div>
      )}

      {movements.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>📈</p>
          <p style={{ margin: 0 }}>Nothing logged with a weight or rep count yet{season !== "All" ? " this season" : ""}.</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>Baselines appear on their own as athletes log — no test day needed.</p>
        </div>
      )}

      {selected && (
        <>
          <p style={{ margin: "0 0 10px", fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>
            Each cell is that session's top set. <strong style={{ color: C.mutedUp }}>First</strong> is their baseline — the first {unit === "lbs" ? "weight" : "rep count"} they logged
            {season !== "All" ? " this season" : ""}, so a light or technique first day overstates the change
            {avgPct !== null && <> · {improved.length} improved, averaging <strong style={{ color: C.teal }}>+{avgPct.toFixed(0)}%</strong></>}.
          </p>

          {rows.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>No athletes match those filters.</div>
          )}

          {/* Wide: the grid. Narrow: one compact line each — a 44-row grid doesn't fit a phone. */}
          {rows.length > 0 && !narrow && (
            <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, ...nameCell, textAlign: "left", top: 0 }}>Athlete</th>
                    {cols.map((d) => <th key={d} style={th}>{cellDate(d)}</th>)}
                    <th style={{ ...th, borderLeft: `1px solid ${C.border}` }}>First</th>
                    <th style={th}>Best</th>
                    <th style={th}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.athlete.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ ...nameCell, color: C.white, fontWeight: 600, fontSize: 13 }}>{r.athlete.name}</td>
                      {cols.map((d) => {
                        const v = r.byDate[d];
                        const isBest = v !== undefined && v === r.best.value && d === r.best.date && r.sessions > 1;
                        return (
                          <td key={d} style={{ padding: "5px 8px", textAlign: "right", color: v === undefined ? C.border : isBest ? C.teal : C.mutedUp, fontWeight: isBest ? 800 : 400, whiteSpace: "nowrap" }}>
                            {v === undefined ? "–" : v}
                          </td>
                        );
                      })}
                      <td style={{ padding: "5px 8px", textAlign: "right", color: C.muted, borderLeft: `1px solid ${C.border}` }}>{r.first.value}</td>
                      <td style={{ padding: "5px 8px", textAlign: "right", color: C.white, fontWeight: 800 }}>{r.best.value}</td>
                      <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: r.delta > 0 ? C.teal : C.muted, whiteSpace: "nowrap" }}>
                        {r.sessions === 1 ? <span style={{ fontWeight: 400, fontSize: 11 }}>baseline</span>
                          : <>{r.delta > 0 ? "+" : ""}{r.delta}{r.pct !== null && r.delta > 0 && <span style={{ opacity: .65, fontWeight: 400 }}> ({r.pct.toFixed(0)}%)</span>}</>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && narrow && rows.map((r) => (
            <div key={r.athlete.id} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "7px 2px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.white, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.athlete.name}</span>
              <span style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>
                {r.sessions === 1 ? `${r.first.value} ${unit}` : `${r.first.value} → ${r.best.value} ${unit}`}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: r.delta > 0 ? C.teal : C.muted, minWidth: 42, textAlign: "right" }}>
                {r.sessions === 1 ? "base" : `${r.delta > 0 ? "+" : ""}${r.delta}`}
              </span>
            </div>
          ))}

          {allCols.length > DATE_WINDOW && !narrow && (
            <button onClick={() => setAllDates((v) => !v)} style={{ display: "block", margin: "10px auto 0", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              {allDates ? `Show last ${DATE_WINDOW} sessions` : `Show all ${allCols.length} sessions`}
            </button>
          )}
        </>
      )}

      {picking && (
        <MovePicker
          title="Which movement?"
          subtitle={`${movements.length} movement${movements.length === 1 ? "" : "s"} logged${season !== "All" ? " this season" : ""}`}
          names={movements.map((m) => m.movement)}
          allowCustom={false}
          onPick={(name) => {
            const hit = movements.find((m) => m.movement === name);
            if (hit) { setMoveKey(hit.key); setAllDates(false); }
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

export { LogProgress };
