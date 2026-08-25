import { useState, useMemo } from "react";
import { C } from "../constants";
import { computeMovementProgress, fmtDate } from "../helpers";
import { Avatar } from "./common";
import { useIsNarrow } from "../hooks";

// ─── PROGRESS FROM LOGS ───────────────────────────────────────────────────────
// Baselines without a test day: the first number an athlete logged for a
// movement is where they started, their best since is where they are now.
function LogProgress({ athletes, workouts, logs, seasons, defaultSeason }) {
  const narrow = useIsNarrow();
  const [season, setSeason] = useState(defaultSeason || "All");
  const [moveKey, setMoveKey] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");
  const [search, setSearch] = useState("");

  const movements = useMemo(
    () => computeMovementProgress(athletes, workouts, logs, { season }),
    [athletes, workouts, logs, season]
  );
  // The dropdown selection may not exist in a different season — fall back to
  // the most-logged movement rather than showing an empty table.
  const selected = movements.find((m) => m.key === moveKey) || movements[0];
  const unit = selected?.metric === "load" ? "lbs" : "reps";

  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const rows = (selected?.rows || []).filter((r) => {
    if (groupFilter !== "All" && r.athlete.event !== groupFilter) return false;
    if (search && !r.athlete.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const improved = rows.filter((r) => r.sessions >= 2 && r.delta > 0);
  const avgPct = improved.length ? improved.reduce((s, r) => s + r.pct, 0) / improved.length : null;

  const pill = (active, color = C.teal) => ({
    border: `1px solid ${active ? color : C.border}`, borderRadius: 20, padding: "5px 14px",
    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    background: active ? C.tealGlow : "transparent", color: active ? color : C.mutedUp,
  });

  return (
    <div>
      {seasons.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {["All", ...seasons].map((s) => (
            <button key={s} onClick={() => setSeason(s)} style={pill(season === s)}>{s}</button>
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
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={selected.key}
              onChange={(e) => setMoveKey(e.target.value)}
              aria-label="Movement"
              style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "8px 12px", fontSize: 13, fontWeight: 700, fontFamily: "inherit", flex: narrow ? "1 1 100%" : "0 1 280px" }}
            >
              {movements.map((m) => (
                <option key={m.key} value={m.key}>{m.movement} ({m.rows.length})</option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athlete…"
              style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", flex: narrow ? "1 1 100%" : "0 1 180px" }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {["All", ...poolGroups].map((g) => (
              <button key={g} onClick={() => setGroupFilter(g)} style={pill(groupFilter === g)}>{g}</button>
            ))}
          </div>

          <p style={{ margin: "0 0 14px", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            Baseline is the <strong style={{ color: C.mutedUp }}>first {unit === "lbs" ? "weight" : "rep count"}</strong> each athlete logged for this movement{season !== "All" ? " this season" : ""}
            {avgPct !== null && <> · {improved.length} improved, averaging <strong style={{ color: C.teal }}>+{avgPct.toFixed(0)}%</strong></>}.
            {" "}A light or technique first day will overstate the gain.
          </p>

          {rows.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>No athletes match those filters.</div>
          )}

          {rows.map((r, i) => (
            <div key={r.athlete.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: narrow ? "12px 14px" : "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: narrow ? 10 : 14 }}>
              {!narrow && <span style={{ fontSize: 16, fontWeight: 900, color: i < 3 && r.delta > 0 ? C.gold : C.muted, width: 24, textAlign: "center" }}>{i + 1}</span>}
              <Avatar name={r.athlete.name} size={narrow ? 34 : 40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.athlete.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>
                  {r.sessions === 1
                    ? <>baseline {r.first.value} {unit} · {fmtDate(r.first.date)}</>
                    : <>{r.first.value} → {r.best.value} {unit} · {r.sessions} sessions</>}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: narrow ? 18 : 22, fontWeight: 900, color: C.white }}>
                  {r.best.value}<span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>{unit}</span>
                </p>
                {r.sessions >= 2 && (
                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: r.delta > 0 ? C.teal : C.muted }}>
                    {r.delta > 0 ? "+" : ""}{r.delta}
                    {r.pct !== null && r.delta > 0 && <span style={{ opacity: .7 }}> (+{r.pct.toFixed(0)}%)</span>}
                  </p>
                )}
                {r.sessions === 1 && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>baseline only</p>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export { LogProgress };
