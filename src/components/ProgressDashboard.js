import { useState } from "react";
import { C, TEST_METRICS } from "../constants";
import { Avatar, Btn } from "./common";

// ─── COACH PROGRESS DASHBOARD ─────────────────────────────────────────────────
function ProgressDashboard({ athletes, testScores, onEnterScores }) {
  const [groupFilter, setGroupFilter] = useState("All");
  const [metricFilter, setMetricFilter] = useState("pushups");
  const [search, setSearch] = useState("");
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const filteredAthletes = athletes.filter((a) => { if (groupFilter !== "All" && a.event !== groupFilter) return false; if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const athleteData = filteredAthletes.map((a) => {
    const scores = testScores.filter((s) => s.athleteId === a.id && s[metricFilter] != null).sort((x, y) => x.date.localeCompare(y.date));
    const first = scores[0]; const latest = scores[scores.length - 1];
    const diff = first && latest && scores.length >= 2 ? latest[metricFilter] - first[metricFilter] : null;
    const pct = diff !== null && first[metricFilter] ? ((diff / first[metricFilter]) * 100).toFixed(0) : null;
    return { athlete: a, first, latest, diff, pct, count: scores.length };
  }).filter((d) => d.latest);
  const sorted = [...athleteData].sort((a, b) => (b.diff || 0) - (a.diff || 0));
  const metric = TEST_METRICS.find((m) => m.key === metricFilter);
  const groupAvg = (group) => { const gIds = (group === "All" ? athletes : athletes.filter((a) => a.event === group)).map((a) => a.id); const vals = athleteData.filter((d) => gIds.includes(d.athlete.id) && d.diff !== null); if (!vals.length) return null; return (vals.reduce((s, d) => s + d.diff, 0) / vals.length).toFixed(1); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Progress</h1><p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{testScores.length} test entries · {athletes.filter((a) => testScores.some((s) => s.athleteId === a.id)).length} athletes tested</p></div>
        <Btn onClick={onEnterScores}>+ Enter scores</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TEST_METRICS.map((m) => <button key={m.key} onClick={() => setMetricFilter(m.key)} style={{ border: `1px solid ${metricFilter === m.key ? m.color : C.border}`, borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: metricFilter === m.key ? `${m.color}22` : "transparent", color: metricFilter === m.key ? m.color : C.mutedUp }}>{m.label}</button>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {["All", ...poolGroups].map((g) => { const avg = groupAvg(g); return <button key={g} onClick={() => setGroupFilter(g)} style={{ border: `1px solid ${groupFilter === g ? C.teal : C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: groupFilter === g ? C.tealGlow : "transparent", color: groupFilter === g ? C.teal : C.mutedUp }}>{g}{avg !== null && <span style={{ opacity: .7 }}> avg +{avg}</span>}</button>; })}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search athlete…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", width: 180 }} />
      </div>
      {sorted.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}><p style={{ fontSize: 32, margin: "0 0 8px" }}>📊</p><p style={{ margin: 0 }}>No test scores yet — enter the first ones above.</p></div>}
      {sorted.map((d, i) => (
        <div key={d.athlete.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: i < 3 ? C.gold : C.muted, width: 24, textAlign: "center" }}>{i + 1}</span>
          <Avatar name={d.athlete.name} size={40} />
          <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{d.athlete.name}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{d.athlete.event} · {d.count} test{d.count !== 1 ? "s" : ""}</p></div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>{d.latest[metricFilter]}{metric?.key === "rdl" && <span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>lbs</span>}</p>
            {d.diff !== null && <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: d.diff >= 0 ? C.teal : C.red }}>{d.diff >= 0 ? "+" : ""}{d.diff} {d.pct !== null && <span style={{ opacity: .7 }}>({d.diff >= 0 ? "+" : ""}{d.pct}%)</span>}</p>}
            {d.diff === null && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>baseline only</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export { ProgressDashboard };
